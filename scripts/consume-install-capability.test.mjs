import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { mkdir, mkdtemp, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import {
  buildConsumptionReceipt,
  expectedInstallJobNames,
  validateAttestationVerification,
  validateCampaignEnvelope,
  validateSourceRunSet,
  validateSourceRunJobs,
  validateSourceRunMetadata,
} from "./consume-install-capability.mjs";

const sourceRunId = "123456";
const observerCommit = "1".repeat(40);
const observerTree = "2".repeat(40);
const digest = (value) => `sha256:${createHash("sha256").update(value).digest("hex")}`;
const canonical = (value) => Array.isArray(value)
  ? value.map(canonical)
  : value && typeof value === "object"
    ? Object.fromEntries(Object.keys(value).sort().map((key) => [key, canonical(value[key])]))
    : value;
const repository = "https://github.com/qOeOp/pareto.git";
const cases = {
  negative: "stale-lock-rejected-without-install-drift",
  positive: "portable-skill-install-and-loader-discovery",
  recovery: "installed-skill-drift-repaired-and-discovered",
};
const stateDigest = digest("state");
const scenarios = {
  negative: {
    case_id: cases.negative,
    diagnostic_sha256: digest("diagnostic"),
    installation_after_sha256: stateDigest,
    installation_before_sha256: stateDigest,
    result: "pass",
  },
  positive: {
    case_id: cases.positive,
    installed_manifest_sha256: digest("manifest"),
    loader_sha256: digest("loader"),
    protocol_notifications_sha256: digest("protocol"),
    result: "pass",
  },
  recovery: {
    case_id: cases.recovery,
    drift_diagnostic_sha256: digest("drift"),
    installed_manifest_sha256: digest("manifest"),
    loader_sha256: digest("loader"),
    protocol_notifications_sha256: digest("protocol"),
    result: "pass",
  },
};
const observer = { commit: observerCommit, script_blob: "8".repeat(40), tree: observerTree };
const subject = {
  repository: "https://github.com/qOeOp/pareto",
  commit: observerCommit,
  tree: observerTree,
  skill_tree: "3".repeat(40),
  codex_agents_tree: "4".repeat(40),
  codex_session_hook_blob: "5".repeat(40),
  installer_blob: "6".repeat(40),
};
const campaignRoot = await mkdtemp(path.join(os.tmpdir(), "pareto-install-consumer-test-"));
const observations = [];
for (const environment of ["linux", "win32"]) {
  const runner = environment === "linux" ? "Linux" : "Windows";
  for (const trial of [1, 2, 3]) {
    const directory = `observations/ins-01-${runner}-${trial}`;
    const absoluteDirectory = path.join(campaignRoot, directory);
    await mkdir(absoluteDirectory, { recursive: true });
    const payload = {
      schema: "pareto-capability-observation/v2",
      authority: "fixed_observer_real_consumer",
      capability_id: "INS-01",
      environment: {
        arch: "x64",
        codex_entry_sha256: digest("codex"),
        codex_user_agent: "Codex Desktop/test",
        node: process.versions.node,
        platform: environment,
      },
      observer,
      result: "pass",
      scenarios,
      subject,
      trial_id: trial,
    };
    const envelope = {
      schema: "pareto-capability-observation-envelope/v1",
      content_sha256: digest(JSON.stringify(canonical(payload))),
      payload,
    };
    const bundle = Buffer.from(`bundle-${environment}-${trial}`);
    await writeFile(path.join(absoluteDirectory, `observation-${runner}-${trial}.json`),
      `${JSON.stringify(envelope)}\n`);
    await writeFile(path.join(absoluteDirectory, "attestation.json"), bundle);
    observations.push({
      bundle_path: `${directory}/attestation.json`,
      bundle_sha256: digest(bundle),
      content_sha256: envelope.content_sha256,
      environment,
      trial_id: trial,
    });
  }
}
const campaignPayload = {
  schema: "pareto-capability-campaign/v2",
  authority: "github_attestation_subject",
  capability_id: "INS-01",
  coverage: { environments: ["linux", "win32"], trials_per_environment: 3 },
  environments: ["linux", "win32"],
  observations,
  observer,
  result: "pass",
  scenarios: cases,
  subject,
};
const campaign = {
  schema: "pareto-capability-campaign-envelope/v1",
  content_sha256: digest(JSON.stringify(canonical(campaignPayload))),
  payload: campaignPayload,
};

assert.equal((await validateCampaignEnvelope(campaign, { campaignRoot, cases })).observer.commit, observerCommit);
await assert.rejects(
  () => validateCampaignEnvelope({ ...campaign, content_sha256: digest("wrong") }, { campaignRoot, cases }),
  /INS-01 campaign identity is invalid/,
);
await assert.rejects(
  () => validateCampaignEnvelope({
    ...campaign,
    payload: { ...campaign.payload, observations: campaign.payload.observations.slice(1) },
  }, { campaignRoot, cases }),
  /INS-01 campaign identity is invalid/,
);
await rm(campaignRoot, { force: true, recursive: true });

const verificationBytes = Buffer.from(`${Array.from({ length: 7 }, (_, index) =>
  JSON.stringify({ attestation: { index: index + 1 }, verificationResult: { verified: true } })).join("\n")}\n`);
assert.equal(validateAttestationVerification(verificationBytes).count, 7);
assert.throws(() => validateAttestationVerification(Buffer.from("{}\n")),
  /campaign attestation verification is incomplete/);

const metadata = {
  id: Number(sourceRunId),
  name: "observe-install-skill-capability",
  path: ".github/workflows/observe-install-skill-capability.yml",
  event: "workflow_dispatch",
  head_branch: "main",
  head_sha: observerCommit,
  status: "completed",
  conclusion: "success",
  run_attempt: 1,
  repository: { full_name: "qOeOp/pareto" },
  html_url: `https://github.com/qOeOp/pareto/actions/runs/${sourceRunId}`,
};

const jobs = expectedInstallJobNames().map((name, index) => ({
  id: index + 100,
  name,
  run_id: Number(sourceRunId),
  run_attempt: 1,
  status: "completed",
  conclusion: "success",
  started_at: `2026-08-12T00:${String(index).padStart(2, "0")}:00Z`,
  completed_at: `2026-08-12T00:${String(index).padStart(2, "0")}:30Z`,
  html_url: `https://github.com/qOeOp/pareto/actions/runs/${sourceRunId}/job/${index + 100}`,
}));

const sourceRun = validateSourceRunMetadata(metadata, {
  sourceRunId,
  campaignCommit: observerCommit,
  repository,
});
assert.equal(sourceRun.attempt, 1);
assert.equal(sourceRun.workflow, ".github/workflows/observe-install-skill-capability.yml");
assert.throws(
  () => validateSourceRunMetadata({ ...metadata, run_attempt: 2 }, {
    sourceRunId,
    campaignCommit: observerCommit,
    repository,
  }),
  /source run metadata is invalid/,
);

const runSetPage = { total_count: 1, workflow_runs: [metadata] };
assert.equal(validateSourceRunSet([runSetPage], {
  sourceRunId,
  campaignCommit: observerCommit,
  repository,
}).count, 1);
assert.throws(() => validateSourceRunSet([{ total_count: 2, workflow_runs: [
  metadata,
  { ...metadata, id: Number(sourceRunId) + 1, conclusion: "failure" },
] }], {
  sourceRunId,
  campaignCommit: observerCommit,
  repository,
}), /selective retry run/);
assert.throws(
  () => validateSourceRunMetadata({ ...metadata, conclusion: "failure" }, {
    sourceRunId,
    campaignCommit: observerCommit,
    repository,
  }),
  /source run metadata is invalid/,
);

const attempts = validateSourceRunJobs([{ total_count: jobs.length, jobs }], { sourceRunId });
assert.deepEqual(attempts.map((entry) => entry.name), expectedInstallJobNames());
assert.equal(attempts.length, 14);

const invalidInventories = [
  jobs.slice(1),
  jobs.map((job, index) => index === 0 ? { ...job, conclusion: "failure" } : job),
  jobs.map((job, index) => index === 0 ? { ...job, run_attempt: 2 } : job),
  jobs.map((job, index) => index === 1 ? { ...job, name: jobs[0].name } : job),
  [...jobs, { ...jobs[0], id: 999, name: "unexpected-job" }],
];
for (const invalid of invalidInventories) {
  assert.throws(
    () => validateSourceRunJobs([{ total_count: invalid.length, jobs: invalid }], { sourceRunId }),
    /source run job inventory/,
  );
}

const receipt = buildConsumptionReceipt({
  sourceRun,
  sourceRunMetadataSha256: digest("metadata"),
  sourceRunSetSha256: digest("run-set"),
  sourceRunJobsSha256: digest("jobs"),
  attempts,
  campaignSha256: digest("campaign"),
  bundleSha256: digest("bundle"),
  attestationVerificationSha256: digest("verification"),
  campaignObserver: { commit: observerCommit, tree: observerTree },
  consumer: {
    repository,
    commit: "3".repeat(40),
    tree: "4".repeat(40),
    workflow_blob: "5".repeat(40),
    script_blob: "6".repeat(40),
    scenario_blob: "7".repeat(40),
  },
});
assert.equal(receipt.schema, "pareto-install-capability-consumption-envelope/v1");
assert.match(receipt.content_sha256, /^sha256:[a-f0-9]{64}$/);
assert.equal(receipt.payload.input.artifact_name, `ins-01-v2-attested-${sourceRunId}`);
assert.equal(receipt.payload.attempts.length, 14);
assert.throws(
  () => buildConsumptionReceipt({
    sourceRun,
    sourceRunMetadataSha256: digest("metadata"),
    sourceRunSetSha256: digest("run-set"),
    sourceRunJobsSha256: digest("jobs"),
    attempts: attempts.slice(1),
    campaignSha256: digest("campaign"),
    bundleSha256: digest("bundle"),
    attestationVerificationSha256: digest("verification"),
    campaignObserver: { commit: observerCommit, tree: observerTree },
    consumer: {
      repository,
      commit: "3".repeat(40),
      tree: "4".repeat(40),
      workflow_blob: "5".repeat(40),
      script_blob: "6".repeat(40),
      scenario_blob: "7".repeat(40),
    },
  }),
  /install consumption receipt identity is invalid/,
);

console.log("install capability campaign consumer tests passed");
