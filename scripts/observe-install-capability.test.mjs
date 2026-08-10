import assert from "node:assert/strict";
import { execFile } from "node:child_process";
import { createHash } from "node:crypto";
import { copyFile, mkdir, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { promisify } from "node:util";

const execFileAsync = promisify(execFile);
const root = await mkdtemp(path.join(os.tmpdir(), "pareto-ins01-aggregate-test-"));
const repository = path.join(root, "observer");
const observations = path.join(root, "observations");
const script = path.join(repository, "scripts", "observe-install-capability.mjs");
const gitEnvironment = Object.fromEntries(Object.entries(process.env).filter(([name]) => !/^GIT_/i.test(name)));
const sha = (value) => `sha256:${createHash("sha256").update(value).digest("hex")}`;
const canonical = (value) => Array.isArray(value)
  ? value.map(canonical)
  : value && typeof value === "object"
    ? Object.fromEntries(Object.keys(value).sort().map((key) => [key, canonical(value[key])]))
    : value;

async function git(args) {
  const { stdout } = await execFileAsync("git", ["-C", repository, ...args], {
    encoding: "utf8",
    env: gitEnvironment,
  });
  return stdout.trim();
}

function scenarioDigest(slot, field) {
  return sha(Buffer.from(`${slot}:${field}`));
}

function payload({ environment, observer, subject, trial }) {
  const slot = `${environment}:${trial}`;
  return canonical({
    schema: "pareto-capability-observation/v2",
    authority: "fixed_observer_real_consumer",
    capability_id: "INS-01",
    environment: {
      arch: environment === "win32" ? "x64" : "x64",
      codex_entry_sha256: scenarioDigest(slot, "codex-entry"),
      codex_user_agent: `Codex test ${environment}`,
      node: process.version,
      platform: environment,
    },
    observer,
    result: "pass",
    scenarios: {
      negative: {
        case_id: "stale-lock-rejected-without-install-drift",
        diagnostic_sha256: scenarioDigest(slot, "negative-diagnostic"),
        installation_after_sha256: scenarioDigest(slot, "installation"),
        installation_before_sha256: scenarioDigest(slot, "installation"),
        result: "pass",
      },
      positive: {
        case_id: "portable-skill-install-and-loader-discovery",
        installed_manifest_sha256: scenarioDigest(slot, "positive-install"),
        loader_sha256: scenarioDigest(slot, "positive-loader"),
        protocol_notifications_sha256: scenarioDigest(slot, "positive-protocol"),
        result: "pass",
      },
      recovery: {
        case_id: "installed-skill-drift-repaired-and-discovered",
        drift_diagnostic_sha256: scenarioDigest(slot, "recovery-diagnostic"),
        installed_manifest_sha256: scenarioDigest(slot, "recovery-install"),
        loader_sha256: scenarioDigest(slot, "recovery-loader"),
        protocol_notifications_sha256: scenarioDigest(slot, "recovery-protocol"),
        result: "pass",
      },
    },
    subject,
    trial_id: trial,
  });
}

async function writeObservation(file, value) {
  const envelope = canonical({
    schema: "pareto-capability-observation-envelope/v1",
    content_sha256: sha(Buffer.from(JSON.stringify(canonical(value)))),
    payload: value,
  });
  await writeFile(file, `${JSON.stringify(envelope)}\n`);
}

async function writeAttestedObservation({ environment, observer, subject, trial }) {
  const runner = environment === "linux" ? "Linux" : "Windows";
  const directory = path.join(observations, `ins-01-${runner}-${trial}`);
  await mkdir(directory, { recursive: true });
  await writeObservation(
    path.join(directory, `observation-${runner}-${trial}.json`),
    payload({ environment, observer, subject, trial }),
  );
  await writeFile(path.join(directory, "attestation.json"), `${JSON.stringify({
    dsseEnvelope: { payload: "e30=", payloadType: "application/vnd.in-toto+json", signatures: [] },
    mediaType: "application/vnd.dev.sigstore.bundle.v0.3+json",
    verificationMaterial: {},
  })}\n`);
  return directory;
}

async function aggregate(output) {
  return execFileAsync(process.execPath, [script, "--input-dir", observations, "--output", output], {
    cwd: repository,
    encoding: "utf8",
    env: gitEnvironment,
  });
}

try {
  const workflow = await readFile(".github/workflows/observe-install-capability.yml", "utf8");
  const observeJob = workflow.slice(workflow.indexOf("  observe:"), workflow.indexOf("  attest-observation:"));
  const observationAttestJob = workflow.slice(workflow.indexOf("  attest-observation:"), workflow.indexOf("  attest:"));
  assert.match(workflow, /trial:\s*\n\s+- 1\s*\n\s+- 2\s*\n\s+- 3/);
  assert.equal((workflow.match(/--trial \$\{\{ matrix\.trial \}\}/g) ?? []).length, 1);
  assert.doesNotMatch(observeJob, /id-token: write|actions\/attest@/);
  assert.match(observationAttestJob, /needs: observe/);
  assert.match(observationAttestJob, /id-token: write/);
  assert.equal((workflow.match(/uses: actions\/attest@1e69f48acb82d1966a394da916b4c1698aa569d6/g) ?? []).length, 2);
  assert.match(workflow, /subject-path: observation-\$\{\{ matrix\.runner \}\}-\$\{\{ matrix\.trial \}\}\.json/);
  assert.match(workflow, /Stage the observation attestation at a deterministic path/);
  assert.match(workflow, /"\$\{\{ steps\.attest\.outputs\.bundle-path \}\}"\s+attestation\.json/);
  assert.match(workflow, /Stage the campaign attestation at a deterministic path/);
  assert.match(workflow, /ins-01-campaign-attestation\.json/);
  assert.match(workflow, /observations\/\*\*\/observation-\*\.json/);
  assert.match(workflow, /observations\/\*\*\/attestation\.json/);
  await mkdir(path.dirname(script), { recursive: true });
  await mkdir(observations);
  await copyFile(path.resolve("scripts/observe-install-capability.mjs"), script);
  await copyFile(path.resolve("scripts/json.mjs"), path.join(repository, "scripts", "json.mjs"));
  await git(["init", "--quiet"]);
  await git(["config", "user.name", "INS-01 Aggregate Test"]);
  await git(["config", "user.email", "ins01-aggregate@example.invalid"]);
  await git(["add", "scripts/json.mjs", "scripts/observe-install-capability.mjs"]);
  await git(["commit", "--quiet", "-m", "observer"]);
  const observer = {
    commit: await git(["rev-parse", "HEAD"]),
    script_blob: await git(["rev-parse", "HEAD:scripts/observe-install-capability.mjs"]),
    tree: await git(["rev-parse", "HEAD^{tree}"]),
  };
  const subject = {
    repository: "https://github.com/qOeOp/pareto",
    commit: observer.commit,
    tree: observer.tree,
    skill_tree: observer.tree,
    codex_agents_tree: observer.tree,
    codex_session_hook_blob: observer.script_blob,
    installer_blob: observer.script_blob,
  };
  for (const environment of ["linux", "win32"]) {
    for (const trial of [1, 2, 3]) {
      await writeAttestedObservation({ environment, observer, subject, trial });
    }
  }

  const campaignPath = path.join(root, "campaign.json");
  await aggregate(campaignPath);
  const campaign = JSON.parse(await readFile(campaignPath, "utf8"));
  assert.equal(campaign.schema, "pareto-capability-campaign-envelope/v1");
  assert.equal(campaign.payload.schema, "pareto-capability-campaign/v2");
  assert.deepEqual(campaign.payload.coverage, { environments: ["linux", "win32"], trials_per_environment: 3 });
  assert.equal(campaign.payload.observations.length, 6);
  assert.deepEqual(
    campaign.payload.observations.map(({ environment, trial_id }) => `${environment}:${trial_id}`),
    ["linux:1", "linux:2", "linux:3", "win32:1", "win32:2", "win32:3"],
  );

  const windowsTrial3 = path.join(observations, "ins-01-Windows-3");
  await rm(windowsTrial3, { force: true, recursive: true });
  await assert.rejects(
    () => aggregate(path.join(root, "missing.json")),
    (error) => error.code === 1 && /requires exactly six attested environment-trial observations/.test(error.stderr),
  );
  await writeAttestedObservation({ environment: "win32", observer, subject, trial: 3 });
  await writeObservation(
    path.join(windowsTrial3, "observation-Windows-3.json"),
    payload({ environment: "win32", observer, subject, trial: 2 }),
  );
  await assert.rejects(
    () => aggregate(path.join(root, "duplicate.json")),
    (error) => error.code === 1 && /lacks exact Linux and Windows coverage/.test(error.stderr),
  );
  console.log("INS-01 aggregate tests passed");
} finally {
  await rm(root, { force: true, recursive: true });
}
