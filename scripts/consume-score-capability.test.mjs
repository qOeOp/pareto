import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  buildConsumptionReceipt,
  buildEvidenceManifest,
  validateConsumedReport,
  validateSourceRunMetadata,
} from "./consume-score-capability.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const catalog = JSON.parse(await readFile(path.join(root, "evals", "capabilities.json"), "utf8"));
const candidate = {
  repository: "https://github.com/qOeOp/pareto",
  commit: "1".repeat(40),
  tree: "2".repeat(40),
};
const digest = (value) => `sha256:${value.repeat(64)}`;
const sourceRunMetadata = {
  id: 31453806150,
  name: "observe-score-capability",
  path: ".github/workflows/observe-score-capability.yml",
  event: "workflow_dispatch",
  head_branch: "main",
  head_sha: "6".repeat(40),
  status: "completed",
  conclusion: "success",
  run_attempt: 1,
  html_url: "https://github.com/qOeOp/pareto/actions/runs/31453806150",
  repository: { full_name: "qOeOp/pareto" },
};
const sourceRun = validateSourceRunMetadata(sourceRunMetadata, {
  sourceRunId: "31453806150",
  campaignCommit: "6".repeat(40),
  repository: candidate.repository,
});
assert.equal(sourceRun.head_sha, "6".repeat(40));
assert.throws(() => validateSourceRunMetadata({ ...sourceRunMetadata, conclusion: "failure" }, {
  sourceRunId: "31453806150",
  campaignCommit: "6".repeat(40),
  repository: candidate.repository,
}), /source run metadata is invalid/);

const evidence = buildEvidenceManifest({
  bundleSha256: digest("3"),
  campaignSha256: digest("4"),
  candidate,
  catalogSha256: digest("5"),
});
assert.deepEqual(evidence.attested_campaigns, [{
  campaign_path: "eval-02-campaign.json",
  campaign_sha256: digest("4"),
  bundle_path: "eval-02-campaign-attestation.json",
  bundle_sha256: digest("3"),
}]);
assert.deepEqual(evidence.observations, []);
assert.deepEqual(evidence.open_gaps, []);
assert.throws(() => buildEvidenceManifest({
  bundleSha256: digest("3"),
  campaignSha256: "sha256:invalid",
  candidate,
  catalogSha256: digest("5"),
}), /campaign consumer identity is invalid/);

const rows = catalog.capabilities.map((definition) => ({
  ...definition,
  score: definition.id === "EVAL-02" ? 6 : 0,
  maturity: definition.id === "EVAL-02" ? "dynamic" : "absent",
  reason: definition.id === "EVAL-02" ? "single_attested_score_observer_campaign" : "no_passing_evidence",
  observation_count: 0,
  attested_campaign_count: definition.id === "EVAL-02" ? 1 : 0,
  unavailable_count: 0,
  gap_count: 0,
}));
const report = {
  schema_version: 2,
  catalog_sha256: digest("5"),
  candidate,
  target_score: catalog.target_score,
  evidence_ceiling: 6,
  evidence_limit: "single_attested_fixed_observer_campaign; varied_repetition_and_provider_attempt_inventory_unavailable",
  weighted_score: Number((6 / catalog.capabilities.length).toFixed(3)),
  minimum_score: 0,
  eligible: false,
  below_target: catalog.capabilities.map((row) => row.id),
  critical_breaches: catalog.capabilities.filter((row) => row.critical).map((row) => row.id),
  capabilities: rows,
};
assert.equal(validateConsumedReport(structuredClone(report), {
  candidate,
  catalog,
  catalogSha256: digest("5"),
}).capabilities.find((row) => row.id === "EVAL-02").score, 6);

const falseHigh = structuredClone(report);
falseHigh.capabilities[0].score = 9.5;
assert.throws(() => validateConsumedReport(falseHigh, {
  candidate,
  catalog,
  catalogSha256: digest("5"),
}), /KRN-01 is invalid/);

const hiddenCritical = structuredClone(report);
hiddenCritical.critical_breaches = hiddenCritical.critical_breaches.filter((id) => id !== "EVAL-02");
assert.throws(() => validateConsumedReport(hiddenCritical, {
  candidate,
  catalog,
  catalogSha256: digest("5"),
}), /coverage is incomplete/);

const falseEligible = structuredClone(report);
falseEligible.eligible = true;
assert.throws(() => validateConsumedReport(falseEligible, {
  candidate,
  catalog,
  catalogSha256: digest("5"),
}), /global gate is invalid/);

const receipt = buildConsumptionReceipt({
  sourceRun,
  sourceRunMetadataSha256: digest("7"),
  campaignSha256: digest("8"),
  bundleSha256: digest("9"),
  campaignObserver: { commit: "6".repeat(40), tree: "a".repeat(40) },
  consumer: {
    ...candidate,
    workflow_blob: "b".repeat(40),
    script_blob: "c".repeat(40),
    scorer_blob: "d".repeat(40),
    catalog_blob: "e".repeat(40),
  },
  report,
  reportSha256: digest("f"),
});
assert.equal(receipt.schema, "pareto-score-capability-consumption-envelope/v1");
assert.match(receipt.content_sha256, /^sha256:[a-f0-9]{64}$/);
assert.equal(receipt.payload.source_run.id, "31453806150");
assert.equal(receipt.payload.input.observer_commit, "6".repeat(40));
assert.equal(receipt.payload.consumer.scorer_blob, "d".repeat(40));
assert.equal(receipt.payload.report.value.eligible, false);
assert.throws(() => buildConsumptionReceipt({
  sourceRun,
  sourceRunMetadataSha256: digest("7"),
  campaignSha256: "sha256:invalid",
  bundleSha256: digest("9"),
  campaignObserver: { commit: "6".repeat(40), tree: "a".repeat(40) },
  consumer: { ...candidate, workflow_blob: "b".repeat(40), script_blob: "c".repeat(40), scorer_blob: "d".repeat(40), catalog_blob: "e".repeat(40) },
  report,
  reportSha256: digest("f"),
}), /consumption receipt identity is invalid/);

console.log("EVAL-02 campaign consumer tests passed");
