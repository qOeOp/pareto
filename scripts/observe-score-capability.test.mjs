import assert from "node:assert/strict";
import { execFile } from "node:child_process";
import { createHash } from "node:crypto";
import { copyFile, mkdir, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { promisify } from "node:util";
import { trustedGitOptions, validateObservedScoreReport } from "./observe-score-capability.mjs";

const execFileAsync = promisify(execFile);
const temporary = await mkdtemp(path.join(os.tmpdir(), "pareto-eval02-observer-test-"));
const sourceRepository = path.join(temporary, "source");
const repository = path.join(temporary, "observer");
const windowsRepository = path.join(temporary, "windows-observer");
const observations = path.join(temporary, "observations");
const script = path.join(repository, "scripts", "observe-score-capability.mjs");
const gitEnvironment = Object.fromEntries(Object.entries(process.env).filter(([name]) => !/^GIT_/i.test(name)));
const observerGitEnvironment = {
  ...Object.fromEntries(Object.entries(process.env).filter(([name]) => !/^(?:GIT_|NODE_|DYLD_|LD_)/i.test(name))),
  GIT_CONFIG_GLOBAL: process.platform === "win32" ? "NUL" : os.devNull,
  GIT_CONFIG_NOSYSTEM: "1",
  GIT_NO_REPLACE_OBJECTS: "1",
  GIT_OPTIONAL_LOCKS: "0",
};
const sha = (value) => `sha256:${createHash("sha256").update(value).digest("hex")}`;

function canonical(value) {
  if (Array.isArray(value)) return value.map(canonical);
  if (value && typeof value === "object") {
    return Object.fromEntries(Object.keys(value).sort().map((key) => [key, canonical(value[key])]));
  }
  return value;
}

async function git(args) {
  const { stdout } = await execFileAsync("git", ["-C", repository, ...args], {
    encoding: "utf8",
    env: gitEnvironment,
  });
  return stdout.trim();
}

function payload({ environment, input, observer, subject, trial }) {
  const report = sha(Buffer.from(`report:${environment}:${trial}`));
  return canonical({
    schema: "pareto-capability-observation/v3",
    admission: "bootstrap_only",
    authority: "fixed_observer_real_consumer",
    capability_id: "EVAL-02",
    environment: { arch: "x64", node: process.version, platform: environment },
    input,
    observer,
    result: "pass",
    scenarios: {
      negative: {
        case_id: "score-cannot-hide-failed-floor",
        critical_floor_report_sha256: sha(Buffer.from(`negative:${environment}:${trial}`)),
        result: "pass",
        unknown_score_diagnostic_sha256: sha(Buffer.from("evidence has unknown or missing fields\n")),
      },
      positive: {
        case_id: "signed-campaign-produces-bounded-report",
        eligible: false,
        evidence_ceiling: 8,
        ins_01_score: 8,
        minimum_score: 0,
        report_sha256: report,
        result: "pass",
      },
      recovery: {
        case_id: "score-recovers-after-gap-removal",
        report_sha256: report,
        result: "pass",
      },
    },
    subject,
    trial_id: trial,
  });
}

async function writeSlot({ environment, input, observer, subject, trial }) {
  const runner = environment === "linux" ? "Linux" : "Windows";
  const directory = path.join(observations, `eval-02-${runner}-${trial}`);
  await mkdir(directory, { recursive: true });
  const value = payload({ environment, input, observer, subject, trial });
  const envelope = canonical({
    schema: "pareto-capability-observation-envelope/v1",
    content_sha256: sha(Buffer.from(JSON.stringify(value))),
    payload: value,
  });
  await writeFile(path.join(directory, `observation-${runner}-${trial}.json`), `${JSON.stringify(envelope)}\n`);
  await writeFile(path.join(directory, "attestation.json"), `${JSON.stringify({
    dsseEnvelope: { payload: "e30=", payloadType: "application/vnd.in-toto+json", signatures: [] },
    mediaType: "application/vnd.dev.sigstore.bundle.v0.3+json",
    verificationMaterial: {},
  })}\n`);
}

async function aggregate(output) {
  return execFileAsync(process.execPath, [script, "--input-dir", observations, "--output", output], {
    cwd: repository,
    encoding: "utf8",
    env: gitEnvironment,
  });
}

try {
  const candidate = { repository: "https://github.com/qOeOp/pareto", commit: "a".repeat(40), tree: "b".repeat(40) };
  const catalog = {
    target_score: 9.5,
    capabilities: ["INS-01", "EVAL-02", ...Array.from({ length: 37 }, (_, index) => `FIX-${String(index + 1).padStart(2, "0")}`)]
      .map((id) => ({
        id, domain: "fixture", name: `Fixture ${id}`, owner: "fixture", consumer: "fixture",
        weight: 1, critical: ["INS-01", "EVAL-02"].includes(id),
      })),
  };
  const catalogSha256 = sha(Buffer.from("catalog"));
  const reportRow = (definition) => {
    const install = definition.id === "INS-01";
    return {
      ...definition,
      score: install ? 8 : 0,
      maturity: install ? "representative" : "absent",
      reason: install ? "repeated_attested_fixed_observer_campaign" : "no_passing_evidence",
      observation_count: 0,
      attested_campaign_count: install ? 1 : 0,
      unavailable_count: 0,
      gap_count: 0,
    };
  };
  const validReport = {
    schema_version: 2,
    catalog_sha256: catalogSha256,
    candidate,
    target_score: 9.5,
    evidence_ceiling: 8,
    evidence_limit: "repeated_attested_fixed_observer_campaign; independent_observer_process_isolation_and_provider_attempt_inventory_unavailable",
    weighted_score: Number((8 / 39).toFixed(3)),
    minimum_score: 0,
    eligible: false,
    below_target: catalog.capabilities.map((row) => row.id),
    critical_breaches: ["INS-01", "EVAL-02"],
    capabilities: catalog.capabilities.map(reportRow),
  };
  assert.equal(validateObservedScoreReport(validReport, candidate, "positive", catalog, catalogSha256), validReport);
  const spreadReport = structuredClone(validReport);
  spreadReport.capabilities.find((row) => row.id === "FIX-01").score = 8;
  await assert.rejects(
    async () => validateObservedScoreReport(spreadReport, candidate, "positive", catalog, catalogSha256),
    /scorer report capability FIX-01 is invalid/,
  );

  const workflow = await readFile(".github/workflows/observe-score-capability.yml", "utf8");
  const observeJob = workflow.slice(workflow.indexOf("  observe:"), workflow.indexOf("  attest-observation:"));
  const observationSignerJob = workflow.slice(workflow.indexOf("  attest-observation:"), workflow.indexOf("  aggregate:"));
  const aggregateJob = workflow.slice(workflow.indexOf("  aggregate:"), workflow.indexOf("  attest:"));
  const campaignSignerJob = workflow.slice(workflow.indexOf("  attest:"));
  assert.match(workflow, /run-id: 31386002048/);
  assert.match(workflow, /name: ins-01-attested-31386002048/);
  assert.equal((workflow.match(/^\s+path: observer$/gm) ?? []).length, 2);
  assert.match(observeJob, /npm ci --ignore-scripts --prefix observer/);
  assert.doesNotMatch(workflow, /matrix\.trial|\n\s+trial:/);
  assert.doesNotMatch(observeJob, /--trial/);
  assert.doesNotMatch(observeJob, /id-token: write|actions\/attest@/);
  assert.match(observationSignerJob, /needs: observe/);
  assert.match(observationSignerJob, /id-token: write/);
  assert.doesNotMatch(aggregateJob, /id-token: write/);
  assert.match(aggregateJob, /observer\/scripts\/observe-score-capability\.mjs/);
  assert.match(campaignSignerJob, /needs: aggregate/);
  assert.match(campaignSignerJob, /id-token: write/);
  assert.doesNotMatch(campaignSignerJob, /actions\/checkout@|observer\/scripts\//);
  assert.equal((workflow.match(/uses: actions\/attest@1e69f48acb82d1966a394da916b4c1698aa569d6/g) ?? []).length, 2);
  assert.match(workflow, /eval-02-campaign-attestation\.json/);

  await mkdir(path.join(sourceRepository, "scripts"), { recursive: true });
  await mkdir(path.join(sourceRepository, "evals"), { recursive: true });
  await mkdir(observations);
  await copyFile(path.resolve("scripts/observe-score-capability.mjs"), path.join(sourceRepository, "scripts", "observe-score-capability.mjs"));
  await copyFile(path.resolve("scripts/json.mjs"), path.join(sourceRepository, "scripts", "json.mjs"));
  await copyFile(path.resolve("evals/capabilities.json"), path.join(sourceRepository, "evals", "capabilities.json"));
  await execFileAsync("git", ["-C", sourceRepository, "init", "--quiet"], { env: gitEnvironment });
  await execFileAsync("git", ["-C", sourceRepository, "config", "user.name", "EVAL-02 Observer Test"], { env: gitEnvironment });
  await execFileAsync("git", ["-C", sourceRepository, "config", "user.email", "eval02@example.invalid"], { env: gitEnvironment });
  await execFileAsync("git", ["-C", sourceRepository, "add", "scripts", "evals/capabilities.json"], { env: gitEnvironment });
  await execFileAsync("git", ["-C", sourceRepository, "commit", "--quiet", "-m", "observer"], { env: gitEnvironment });
  await execFileAsync("git", ["clone", "--quiet", sourceRepository, repository], { env: gitEnvironment });
  await execFileAsync("git", ["-c", "core.autocrlf=true", "clone", "--quiet", sourceRepository, windowsRepository], { env: gitEnvironment });
  await git(["remote", "set-url", "origin", "https://github.com/qOeOp/pareto.git"]);
  const isolatedStatus = await execFileAsync("git", [
    ...trustedGitOptions("linux"), "-C", windowsRepository, "status", "--porcelain=v1", "--untracked-files=all",
  ], { encoding: "utf8", env: observerGitEnvironment });
  assert.notEqual(isolatedStatus.stdout, "");
  const autocrlfStatus = await execFileAsync("git", [
    ...trustedGitOptions("win32"), "-C", windowsRepository, "status", "--porcelain=v1", "--untracked-files=all",
  ], { encoding: "utf8", env: observerGitEnvironment });
  assert.equal(autocrlfStatus.stdout, "");
  const windowsCommit = (await execFileAsync("git", ["-C", windowsRepository, "rev-parse", "HEAD"], {
    encoding: "utf8", env: observerGitEnvironment,
  })).stdout.trim();
  const windowsModule = await import(pathToFileURL(path.join(
    windowsRepository, "scripts", "observe-score-capability.mjs",
  )).href);
  const committedCatalog = windowsModule.committedCatalogBytes(windowsCommit);
  const gitCatalog = (await execFileAsync("git", ["-C", windowsRepository, "show", `${windowsCommit}:evals/capabilities.json`], {
    encoding: null, env: observerGitEnvironment,
  })).stdout;
  const worktreeCatalog = await readFile(path.join(windowsRepository, "evals", "capabilities.json"));
  assert.equal(sha(committedCatalog), sha(gitCatalog));
  assert.notEqual(sha(committedCatalog), sha(worktreeCatalog));
  const observer = {
    commit: await git(["rev-parse", "HEAD"]),
    script_blob: await git(["rev-parse", "HEAD:scripts/observe-score-capability.mjs"]),
    tree: await git(["rev-parse", "HEAD^{tree}"]),
  };
  await git(["update-ref", "refs/remotes/origin/main", observer.commit]);
  const productionGit = async (...args) => (await execFileAsync("git", [
    ...trustedGitOptions(), "-C", repository, ...args,
  ], { encoding: "utf8", env: observerGitEnvironment })).stdout.trim();
  assert.equal(await productionGit("rev-parse", "HEAD"), observer.commit);
  assert.equal(await productionGit("remote", "get-url", "origin"), "https://github.com/qOeOp/pareto.git");
  assert.equal(await productionGit("status", "--porcelain=v1", "--untracked-files=all"), "");
  await productionGit("merge-base", "--is-ancestor", observer.commit, "refs/remotes/origin/main");
  const subject = {
    repository: "https://github.com/qOeOp/pareto",
    commit: observer.commit,
    tree: observer.tree,
    scorer_blob: observer.script_blob,
    catalog_blob: observer.script_blob,
    contract_blob: observer.script_blob,
  };
  const input = {
    campaign_sha256: sha(Buffer.from("campaign")),
    bundle_sha256: sha(Buffer.from("bundle")),
  };
  for (const environment of ["linux", "win32"]) {
    await writeSlot({ environment, input, observer, subject, trial: 1 });
  }

  const campaignPath = path.join(temporary, "campaign.json");
  await aggregate(campaignPath);
  const campaign = JSON.parse(await readFile(campaignPath, "utf8"));
  assert.equal(campaign.schema, "pareto-capability-campaign-envelope/v1");
  assert.equal(campaign.payload.capability_id, "EVAL-02");
  assert.equal(campaign.payload.admission, "bootstrap_only");
  assert.deepEqual(campaign.payload.coverage, { environments: ["linux", "win32"], trials_per_environment: 1 });
  assert.deepEqual(
    campaign.payload.observations.map(({ environment, trial_id }) => `${environment}:${trial_id}`),
    ["linux:1", "win32:1"],
  );

  await assert.rejects(
    () => execFileAsync(process.execPath, [
      script, "--source-campaign-dir", temporary, "--trial", "2", "--output", path.join(temporary, "trial-2.json"),
    ], { cwd: repository, encoding: "utf8", env: gitEnvironment }),
    (error) => error.code === 1 && /unsupported, duplicate, or incomplete argument: --trial/.test(error.stderr),
  );

  const windows1 = path.join(observations, "eval-02-Windows-1");
  await rm(windows1, { recursive: true });
  await assert.rejects(
    () => aggregate(path.join(temporary, "missing.json")),
    (error) => error.code === 1 && /requires exactly two attested observations/.test(error.stderr),
  );
  await writeSlot({ environment: "win32", input: { ...input, bundle_sha256: sha(Buffer.from("other")) }, observer, subject, trial: 1 });
  await assert.rejects(
    () => aggregate(path.join(temporary, "mismatch.json")),
    (error) => error.code === 1 && /one subject and input/.test(error.stderr),
  );
  console.log("EVAL-02 observer tests passed");
} finally {
  await rm(temporary, { force: true, recursive: true });
}
