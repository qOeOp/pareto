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

function scoreReport(candidate, catalog, catalogSha256, mode) {
  const capabilities = catalog.capabilities.map((definition) => {
    const install = definition.id === "INS-01";
    const expected = install && mode === "positive"
      ? { score: 8, maturity: "representative", reason: "repeated_attested_fixed_observer_campaign", gap_count: 0 }
      : install && mode === "negative"
        ? { score: 0, maturity: "contradicted", reason: "critical_gap", gap_count: 1 }
        : { score: 0, maturity: "absent", reason: "no_passing_evidence", gap_count: 0 };
    return {
      ...definition,
      ...expected,
      observation_count: 0,
      attested_campaign_count: install ? 1 : 0,
      unavailable_count: 0,
    };
  });
  const totalWeight = catalog.capabilities.reduce((sum, row) => sum + row.weight, 0);
  const installWeight = catalog.capabilities.find((row) => row.id === "INS-01").weight;
  return {
    schema_version: 2,
    catalog_sha256: catalogSha256,
    candidate,
    target_score: catalog.target_score,
    evidence_ceiling: 8,
    evidence_limit: "repeated_attested_fixed_observer_campaign; independent_observer_process_isolation_and_provider_attempt_inventory_unavailable",
    weighted_score: mode === "positive" ? Number((8 * installWeight / totalWeight).toFixed(3)) : 0,
    minimum_score: 0,
    eligible: false,
    below_target: catalog.capabilities.map((row) => row.id),
    critical_breaches: catalog.capabilities.filter((row) => row.critical).map((row) => row.id),
    capabilities,
  };
}

async function git(args) {
  const { stdout } = await execFileAsync("git", ["-C", repository, ...args], {
    encoding: "utf8",
    env: gitEnvironment,
  });
  return stdout.trim();
}

function payload({ environment, input, observer, reports, subject, trial }) {
  return canonical({
    schema: "pareto-score-capability-observation/v1",
    admission: "strict_descendant_only",
    authority: "fixed_observer_real_consumer",
    capability_id: "EVAL-02",
    environment: { arch: "x64", node: process.version, platform: environment },
    input,
    observer,
    reports,
    result: "pass",
    subject,
    trial_id: trial,
  });
}

async function writeSlot({ environment, input, observer, reportBytes, subject, trial }) {
  const runner = environment === "linux" ? "Linux" : "Windows";
  const directory = path.join(observations, `eval-02-${runner}-${trial}`);
  await mkdir(path.join(directory, "reports"), { recursive: true });
  const reports = {
    negative: { path: "reports/negative.json", sha256: sha(reportBytes.negative) },
    positive: { path: "reports/positive.json", sha256: sha(reportBytes.positive) },
    recovery: { path: "reports/recovery.json", sha256: sha(reportBytes.recovery) },
    unknown_score: { path: "reports/unknown-score.stderr", sha256: sha(reportBytes.unknown_score) },
  };
  await Promise.all(Object.entries(reports).map(([name, report]) =>
    writeFile(path.join(directory, report.path), reportBytes[name])));
  const value = payload({ environment, input, observer, reports, subject, trial });
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
  const validReport = scoreReport(candidate, catalog, catalogSha256, "positive");
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
  assert.equal((workflow.match(/run-id: 31416162223/g) ?? []).length, 2);
  assert.equal((workflow.match(/name: ins-01-attested-31416162223/g) ?? []).length, 2);
  for (const job of [observeJob, aggregateJob]) {
    assert.match(job, /name: ins-01-attested-31416162223[\s\S]*run-id: 31416162223/);
    assert.doesNotMatch(job, /name: ins-01-attested-(?!31416162223)\d+|run-id: (?!31416162223)\d+/);
  }
  assert.equal((workflow.match(/^\s+path: observer$/gm) ?? []).length, 2);
  assert.match(observeJob, /npm ci --ignore-scripts --prefix observer/);
  assert.doesNotMatch(workflow, /matrix\.trial|\n\s+trial:/);
  assert.doesNotMatch(observeJob, /--trial/);
  assert.doesNotMatch(observeJob, /id-token: write|actions\/attest@/);
  assert.match(observeJob, /reports\/\*\*/);
  assert.match(observationSignerJob, /needs: observe/);
  assert.match(observationSignerJob, /id-token: write/);
  assert.match(observationSignerJob, /reports\/\*\*/);
  assert.doesNotMatch(aggregateJob, /id-token: write/);
  assert.match(aggregateJob, /observer\/scripts\/observe-score-capability\.mjs/);
  assert.match(campaignSignerJob, /needs: aggregate/);
  assert.match(campaignSignerJob, /id-token: write/);
  assert.doesNotMatch(campaignSignerJob, /actions\/checkout@|observer\/scripts\//);
  assert.match(campaignSignerJob, /observations\/\*\*\/reports\/\*\*/);
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
  const productionCatalogBytes = committedCatalog;
  const productionCatalog = JSON.parse(productionCatalogBytes.toString("utf8"));
  const reportCandidate = { repository: subject.repository, commit: subject.commit, tree: subject.tree };
  const positiveReportBytes = Buffer.from(`${JSON.stringify(scoreReport(
    reportCandidate, productionCatalog, sha(productionCatalogBytes), "positive",
  ))}\n`);
  const negativeReportBytes = Buffer.from(`${JSON.stringify(scoreReport(
    reportCandidate, productionCatalog, sha(productionCatalogBytes), "negative",
  ))}\n`);
  const reportBytes = {
    negative: negativeReportBytes,
    positive: positiveReportBytes,
    recovery: positiveReportBytes,
    unknown_score: Buffer.from("evidence has unknown or missing fields\n"),
  };
  for (const environment of ["linux", "win32"]) {
    await writeSlot({ environment, input, observer, reportBytes, subject, trial: 1 });
  }

  const campaignPath = path.join(temporary, "campaign.json");
  await aggregate(campaignPath);
  const campaign = JSON.parse(await readFile(campaignPath, "utf8"));
  assert.equal(campaign.schema, "pareto-capability-campaign-envelope/v1");
  assert.equal(campaign.payload.capability_id, "EVAL-02");
  assert.equal(campaign.payload.schema, "pareto-score-capability-campaign/v1");
  assert.equal(campaign.payload.admission, "strict_descendant_only");
  assert.deepEqual(Object.keys(campaign.payload).sort(), [
    "admission", "authority", "capability_id", "observations", "observer", "result", "schema", "subject",
  ]);
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
  const reformattedReportBytes = {
    negative: Buffer.from(`${JSON.stringify(JSON.parse(reportBytes.negative), null, 2)}\n`),
    positive: Buffer.from(`${JSON.stringify(JSON.parse(reportBytes.positive), null, 2)}\n`),
    recovery: Buffer.from(`${JSON.stringify(JSON.parse(reportBytes.recovery), null, 2)}\n`),
    unknown_score: reportBytes.unknown_score,
  };
  await writeSlot({ environment: "win32", input, observer, reportBytes: reformattedReportBytes, subject, trial: 1 });
  await assert.rejects(
    () => aggregate(path.join(temporary, "report-drift.json")),
    (error) => error.code === 1 && /one subject, input, and report set/.test(error.stderr),
  );
  await rm(windows1, { recursive: true });
  await writeSlot({
    environment: "win32", input: { ...input, bundle_sha256: sha(Buffer.from("other")) },
    observer, reportBytes, subject, trial: 1,
  });
  await assert.rejects(
    () => aggregate(path.join(temporary, "mismatch.json")),
    (error) => error.code === 1 && /one subject, input, and report set/.test(error.stderr),
  );
  console.log("EVAL-02 observer tests passed");
} finally {
  await rm(temporary, { force: true, recursive: true });
}
