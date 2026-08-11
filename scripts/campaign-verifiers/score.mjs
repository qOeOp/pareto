import { createHash } from "node:crypto";

const sha256Pattern = /^sha256:[a-f0-9]{64}$/;

function fail(message) {
  throw new Error(message);
}

function canonical(value) {
  if (Array.isArray(value)) return value.map(canonical);
  if (value && typeof value === "object") {
    return Object.fromEntries(Object.keys(value).sort().map((key) => [key, canonical(value[key])]));
  }
  return value;
}

function digest(bytes) {
  return `sha256:${createHash("sha256").update(bytes).digest("hex")}`;
}

function exactKeys(value, expected, label) {
  if (!value || typeof value !== "object" || Array.isArray(value)) fail(`${label} must be an object`);
  const actual = Object.keys(value).sort();
  const wanted = [...expected].sort();
  if (actual.length !== wanted.length || actual.some((key, index) => key !== wanted[index])) {
    fail(`${label} has unknown or missing fields`);
  }
}

function atom(value, label) {
  if (typeof value !== "string" || value.length < 1 || value.length > 256 || /[\u0000-\u001f]/.test(value)) {
    fail(`${label} is invalid`);
  }
}

export function verifyObservationFacts({
  envelope, campaign, environment, capability_id: capabilityId, parameters,
}) {
  exactKeys(parameters, ["source_capability"], "score adapter parameters");
  exactKeys(envelope, ["content_sha256", "payload", "schema"], `${capabilityId} observation envelope`);
  const payload = envelope.payload;
  exactKeys(payload, [
    "admission", "authority", "capability_id", "environment", "input", "observer", "reports", "result", "schema", "subject", "trial_id",
  ], `${capabilityId} observation`);
  exactKeys(payload.environment, ["arch", "node", "platform"], `${capabilityId} observation environment`);
  exactKeys(payload.input, ["bundle_sha256", "campaign_sha256"], `${capabilityId} observation input`);
  exactKeys(payload.observer, ["commit", "script_blob", "tree"], `${capabilityId} observation observer`);
  exactKeys(payload.reports, ["negative", "positive", "recovery", "unknown_score"], `${capabilityId} observation reports`);
  exactKeys(payload.subject, ["catalog_blob", "commit", "contract_blob", "repository", "scorer_blob", "tree"],
    `${capabilityId} observation subject`);
  const expectedPaths = {
    negative: "reports/negative.json",
    positive: "reports/positive.json",
    recovery: "reports/recovery.json",
    unknown_score: "reports/unknown-score.stderr",
  };
  for (const [name, report] of Object.entries(payload.reports)) {
    exactKeys(report, ["path", "sha256"], `${capabilityId} observation report ${name}`);
    if (report.path !== expectedPaths[name] || !sha256Pattern.test(report.sha256)) {
      fail(`${capabilityId} observation report binding is invalid`);
    }
  }
  if (envelope.schema !== "pareto-capability-observation-envelope/v1" ||
      envelope.content_sha256 !== digest(Buffer.from(JSON.stringify(canonical(payload)))) ||
      payload.schema !== "pareto-score-capability-observation/v1" ||
      payload.admission !== "strict_descendant_only" ||
      payload.authority !== "fixed_observer_real_consumer" || payload.capability_id !== capabilityId ||
      payload.result !== "pass" || payload.trial_id !== 1 || payload.environment.platform !== environment ||
      !["linux", "win32"].includes(payload.environment.platform) ||
      !sha256Pattern.test(payload.input.campaign_sha256) || !sha256Pattern.test(payload.input.bundle_sha256) ||
      JSON.stringify(canonical(payload.observer)) !== JSON.stringify(canonical(campaign.observer)) ||
      JSON.stringify(canonical(payload.subject)) !== JSON.stringify(canonical(campaign.subject))) {
    fail(`${capabilityId} observation semantics are invalid`);
  }
  for (const key of ["arch", "node"]) atom(payload.environment[key], `${capabilityId} observation environment ${key}`);
  return {
    facts_sha256: digest(Buffer.from(JSON.stringify(canonical({ input: payload.input, reports: payload.reports })))),
    payload,
    schema: "pareto-campaign-adapter-result/v1",
  };
}
