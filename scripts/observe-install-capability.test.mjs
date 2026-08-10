import assert from "node:assert/strict";
import { execFile } from "node:child_process";
import { createHash } from "node:crypto";
import { copyFile, mkdir, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { promisify } from "node:util";
import { classifyProfileConfigWarning } from "./observe-install-capability.mjs";

const execFileAsync = promisify(execFile);
const root = await mkdtemp(path.join(os.tmpdir(), "pareto-ins01-aggregate-test-"));
const repository = path.join(root, "observer");
const script = path.join(repository, "scripts", "observe-install-capability.mjs");
const gitEnvironment = Object.fromEntries(Object.entries(process.env).filter(([name]) => !/^GIT_/i.test(name)));
const sha = (value) => `sha256:${createHash("sha256").update(value).digest("hex")}`;
const canonical = (value) => Array.isArray(value)
  ? value.map(canonical)
  : value && typeof value === "object"
    ? Object.fromEntries(Object.keys(value).sort().map((key) => [key, canonical(value[key])]))
    : value;
const capabilities = Object.freeze({
  "INS-01": { observation: "observation", slug: "ins-01", cases: {
    positive: "portable-skill-install-and-loader-discovery",
    negative: "stale-lock-rejected-without-install-drift",
    recovery: "installed-skill-drift-repaired-and-discovered",
  } },
  "INS-03": { observation: "observation-ins-03", slug: "ins-03", profile: "mission-planner.toml", cases: {
    positive: "ins-03-positive", negative: "ins-03-negative", recovery: "ins-03-recovery",
  } },
  "INS-05": { observation: "observation-ins-05", slug: "ins-05", profile: "mission-evaluator.toml", cases: {
    positive: "ins-05-positive", negative: "ins-05-negative", recovery: "ins-05-recovery",
  } },
  "INS-07": { observation: "observation-ins-07", slug: "ins-07", profile: "mission-researcher.toml", cases: {
    positive: "ins-07-positive", negative: "ins-07-negative", recovery: "ins-07-recovery",
  } },
  "INS-09": { observation: "observation-ins-09", slug: "ins-09", profile: "fast-builder.toml", cases: {
    positive: "ins-09-positive", negative: "ins-09-negative", recovery: "ins-09-recovery",
  } },
});

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

function payload({ capabilityId, environment, observer, subject, trial }) {
  const capability = capabilities[capabilityId];
  const slot = `${environment}:${trial}`;
  const scenarios = capability.profile ? {
    negative: {
      case_id: capability.cases.negative,
      diagnostic_sha256: scenarioDigest(slot, "negative-diagnostic"),
      installation_after_sha256: scenarioDigest(slot, "drifted-installation"),
      installation_before_sha256: scenarioDigest(slot, "drifted-installation"),
      loader_sha256: scenarioDigest(slot, "negative-loader"),
      profile: capability.profile,
      result: "pass",
    },
    positive: {
      case_id: capability.cases.positive,
      installed_profile_sha256: scenarioDigest(slot, "profile"),
      loader_sha256: scenarioDigest(slot, "loader"),
      owned_profiles_sha256: scenarioDigest(slot, "owned-profiles"),
      profile: capability.profile,
      result: "pass",
      source_profile_sha256: scenarioDigest(slot, "profile"),
    },
    recovery: {
      case_id: capability.cases.recovery,
      drift_diagnostic_sha256: scenarioDigest(slot, "negative-diagnostic"),
      installed_profile_sha256: scenarioDigest(slot, "profile"),
      loader_sha256: scenarioDigest(slot, "loader"),
      owned_profiles_sha256: scenarioDigest(slot, "owned-profiles"),
      profile: capability.profile,
      result: "pass",
    },
  } : {
    negative: {
      case_id: capability.cases.negative,
      diagnostic_sha256: scenarioDigest(slot, "negative-diagnostic"),
      installation_after_sha256: scenarioDigest(slot, "installation"),
      installation_before_sha256: scenarioDigest(slot, "installation"),
      result: "pass",
    },
    positive: {
      case_id: capability.cases.positive,
      installed_manifest_sha256: scenarioDigest(slot, "positive-install"),
      loader_sha256: scenarioDigest(slot, "positive-loader"),
      protocol_notifications_sha256: scenarioDigest(slot, "positive-protocol"),
      result: "pass",
    },
    recovery: {
      case_id: capability.cases.recovery,
      drift_diagnostic_sha256: scenarioDigest(slot, "recovery-diagnostic"),
      installed_manifest_sha256: scenarioDigest(slot, "recovery-install"),
      loader_sha256: scenarioDigest(slot, "recovery-loader"),
      protocol_notifications_sha256: scenarioDigest(slot, "recovery-protocol"),
      result: "pass",
    },
  };
  return canonical({
    schema: "pareto-capability-observation/v2",
    authority: "fixed_observer_real_consumer",
    capability_id: capabilityId,
    environment: {
      arch: environment === "win32" ? "x64" : "x64",
      codex_entry_sha256: scenarioDigest(slot, "codex-entry"),
      codex_user_agent: `Codex test ${environment}`,
      node: process.version,
      platform: environment,
    },
    observer,
    result: "pass",
    scenarios,
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

async function writeAttestedObservation({ capabilityId, environment, observer, observations, subject, trial }) {
  const capability = capabilities[capabilityId];
  const runner = environment === "linux" ? "Linux" : "Windows";
  const directory = path.join(observations, `${capability.slug}-${runner}-${trial}`);
  await mkdir(directory, { recursive: true });
  await writeObservation(
    path.join(directory, `${capability.observation}-${runner}-${trial}.json`),
    payload({ capabilityId, environment, observer, subject, trial }),
  );
  await writeFile(path.join(directory, "attestation.json"), `${JSON.stringify({
    dsseEnvelope: { payload: "e30=", payloadType: "application/vnd.in-toto+json", signatures: [] },
    mediaType: "application/vnd.dev.sigstore.bundle.v0.3+json",
    verificationMaterial: {},
  })}\n`);
  return directory;
}

async function aggregate(capabilityId, observations, output) {
  return execFileAsync(process.execPath, [
    script, "--capability", capabilityId, "--input-dir", observations, "--output", output,
  ], {
    cwd: repository,
    encoding: "utf8",
    env: gitEnvironment,
  });
}

try {
  const profilePath = "/tmp/codex-home/agents/mission-planner.toml";
  const malformedSummary = `Ignoring malformed agent role definition: failed to parse agent role file at ${profilePath}: TOML parse error at line 1, column 34\n  |\n1 | name = [pareto_observer_malformed\n  |                                  ^\nunclosed array, expected \`]\`\n`;
  const sandboxSummary = "Codex could not find bubblewrap on PATH. Install bubblewrap with your OS package manager. " +
    "See the sandbox prerequisites: https://developers.openai.com/codex/concepts/sandboxing#prerequisites. " +
    "Codex will use the bundled bubblewrap in the meantime.";
  assert.equal(
    classifyProfileConfigWarning({ details: null, summary: malformedSummary }, profilePath, false),
    "malformed_target_profile",
  );
  assert.equal(
    classifyProfileConfigWarning({ details: null, summary: sandboxSummary }, profilePath, false),
    "sandbox_prerequisite_fallback",
  );
  assert.throws(
    () => classifyProfileConfigWarning({ details: null, summary: "unrelated warning" }, profilePath, false),
    /unrelated profile warning/,
  );
  assert.throws(
    () => classifyProfileConfigWarning({ details: null, summary: sandboxSummary }, profilePath, true),
    /malformed or late/,
  );
  await execFileAsync(process.execPath, [
    "--input-type=module",
    "--eval",
    `process.argv[1] = "-"; await import(${JSON.stringify(pathToFileURL(path.resolve("scripts/observe-install-capability.mjs")).href)})`,
  ], { cwd: process.cwd(), encoding: "utf8", env: gitEnvironment });
  const workflow = (await readFile(".github/workflows/observe-install-capability.yml", "utf8")).replaceAll("\r\n", "\n");
  const scorer = await readFile("scripts/capability-score.mjs", "utf8");
  const observeJob = workflow.slice(workflow.indexOf("  observe:"), workflow.indexOf("  attest-observation:"));
  const observationAttestJob = workflow.slice(workflow.indexOf("  attest-observation:"), workflow.indexOf("  aggregate:"));
  const aggregateJob = workflow.slice(workflow.indexOf("  aggregate:"), workflow.indexOf("  attest-campaign:"));
  const campaignAttestJob = workflow.slice(workflow.indexOf("  attest-campaign:"));
  assert.match(workflow, /trial:\s*\n\s+- 1\s*\n\s+- 2\s*\n\s+- 3/);
  assert.equal((workflow.match(/--trial \$\{\{ matrix\.trial \}\}/g) ?? []).length, 1);
  for (const [capabilityId, capability] of Object.entries(capabilities)) {
    assert.match(
      observeJob,
      new RegExp(`- id: ${capabilityId}\\n\\s+observation: ${capability.observation}\\n\\s+slug: ${capability.slug}`),
    );
    assert.match(workflow, new RegExp(`--capability \\$\\{\\{ matrix\\.capability\\.id \\}\\}`));
  }
  assert.doesNotMatch(observeJob, /id-token: write|actions\/attest@/);
  assert.match(observationAttestJob, /needs: observe/);
  assert.match(observationAttestJob, /id-token: write/);
  assert.doesNotMatch(aggregateJob, /id-token: write|actions\/attest@/);
  assert.match(campaignAttestJob, /needs: aggregate/);
  assert.match(campaignAttestJob, /id-token: write/);
  assert.doesNotMatch(campaignAttestJob, /actions\/checkout@|observe-install-capability\.mjs/);
  assert.equal((workflow.match(/uses: actions\/attest@1e69f48acb82d1966a394da916b4c1698aa569d6/g) ?? []).length, 2);
  assert.match(workflow, /subject-path: \$\{\{ matrix\.capability\.observation \}\}-\$\{\{ matrix\.runner \}\}-\$\{\{ matrix\.trial \}\}\.json/);
  assert.match(workflow, /Stage the observation attestation at a deterministic path/);
  assert.match(workflow, /"\$\{\{ steps\.attest\.outputs\.bundle-path \}\}"\s+attestation\.json/);
  assert.match(workflow, /Stage the campaign attestation at a deterministic path/);
  assert.match(workflow, /\$\{\{ matrix\.capability\.slug \}\}-campaign-attestation\.json/);
  assert.match(workflow, /observations\/\*\*\/observation-\*\.json/);
  assert.match(workflow, /observations\/\*\*\/attestation\.json/);
  assert.match(
    scorer,
    /const directory = `observations\/ins-01-\$\{runner\}-\$\{row\.trial_id\}`;[\s\S]*const observationPath = `\$\{directory\}\/observation-\$\{runner\}-\$\{row\.trial_id\}\.json`;/,
    "INS-01 observer output must remain interoperable with the canonical scorer",
  );
  await mkdir(path.dirname(script), { recursive: true });
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
  for (const [capabilityId, capability] of Object.entries(capabilities)) {
    const observations = path.join(root, `observations-${capability.slug}`);
    await mkdir(observations);
    for (const environment of ["linux", "win32"]) {
      for (const trial of [1, 2, 3]) {
        await writeAttestedObservation({ capabilityId, environment, observer, observations, subject, trial });
      }
    }
    const campaignPath = path.join(root, `${capability.slug}-campaign.json`);
    await aggregate(capabilityId, observations, campaignPath);
    const campaign = JSON.parse(await readFile(campaignPath, "utf8"));
    assert.equal(campaign.schema, "pareto-capability-campaign-envelope/v1");
    assert.equal(campaign.payload.schema, "pareto-capability-campaign/v2");
    assert.equal(campaign.payload.capability_id, capabilityId);
    assert.deepEqual(campaign.payload.scenarios, capability.cases);
    assert.deepEqual(campaign.payload.coverage, { environments: ["linux", "win32"], trials_per_environment: 3 });
    assert.equal(campaign.payload.observations.length, 6);
    const linuxTrial1 = path.join(observations, `${capability.slug}-Linux-1`);
    assert.equal(
      await readFile(path.join(linuxTrial1, `${capability.observation}-Linux-1.json`), "utf8")
        .then(() => true, () => false),
      true,
      `${capabilityId} must publish the scorer-compatible observation basename`,
    );
    assert.deepEqual(
      campaign.payload.observations.map(({ environment, trial_id }) => `${environment}:${trial_id}`),
      ["linux:1", "linux:2", "linux:3", "win32:1", "win32:2", "win32:3"],
    );
  }

  const observations = path.join(root, "observations-ins-03");
  const windowsTrial3 = path.join(observations, "ins-03-Windows-3");
  await rm(windowsTrial3, { force: true, recursive: true });
  await assert.rejects(
    () => aggregate("INS-03", observations, path.join(root, "missing.json")),
    (error) => error.code === 1 && /requires exactly six attested environment-trial observations/.test(error.stderr),
  );
  await writeAttestedObservation({
    capabilityId: "INS-03", environment: "win32", observer, observations, subject, trial: 3,
  });
  await writeObservation(
    path.join(windowsTrial3, "observation-ins-03-Windows-3.json"),
    payload({ capabilityId: "INS-03", environment: "win32", observer, subject, trial: 2 }),
  );
  await assert.rejects(
    () => aggregate("INS-03", observations, path.join(root, "duplicate.json")),
    (error) => error.code === 1 && /lacks exact Linux and Windows coverage/.test(error.stderr),
  );
  console.log("installation capability aggregate tests passed");
} finally {
  await rm(root, { force: true, recursive: true });
}
