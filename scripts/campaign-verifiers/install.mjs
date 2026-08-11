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

function digest(value) {
  return `sha256:${createHash("sha256").update(value).digest("hex")}`;
}

function exactKeys(value, expected, label) {
  if (!value || typeof value !== "object" || Array.isArray(value)) fail(`${label} must be an object`);
  const actual = Object.keys(value).sort();
  const wanted = [...expected].sort();
  if (actual.length !== wanted.length || actual.some((key, index) => key !== wanted[index])) {
    fail(`${label} has unknown or missing fields`);
  }
}

export function verifyObservationFacts({ payload, capability_id: capabilityId, cases, parameters }) {
  exactKeys(cases, ["negative", "positive", "recovery"], "install adapter cases");
  if (!parameters || !["skill", "profile"].includes(parameters.kind)) {
    fail("install adapter parameters are invalid");
  }
  exactKeys(parameters, parameters.kind === "profile" ? ["kind", "profile"] : ["kind"],
    "install adapter parameters");
  exactKeys(payload.scenarios, ["negative", "positive", "recovery"], `${capabilityId} scenarios`);
  const scenarioKeys = parameters.kind === "skill" ? {
    positive: ["case_id", "installed_manifest_sha256", "loader_sha256", "protocol_notifications_sha256", "result"],
    negative: ["case_id", "diagnostic_sha256", "installation_after_sha256", "installation_before_sha256", "result"],
    recovery: ["case_id", "drift_diagnostic_sha256", "installed_manifest_sha256", "loader_sha256", "protocol_notifications_sha256", "result"],
  } : {
    positive: ["case_id", "installed_profile_sha256", "loader_sha256", "owned_profiles_sha256", "profile", "result", "source_profile_sha256"],
    negative: ["case_id", "diagnostic_sha256", "installation_after_sha256", "installation_before_sha256", "loader_sha256", "profile", "result"],
    recovery: ["case_id", "drift_diagnostic_sha256", "installed_profile_sha256", "loader_sha256", "owned_profiles_sha256", "profile", "result"],
  };
  for (const [scenario, caseId] of Object.entries(cases)) {
    const value = payload.scenarios[scenario];
    exactKeys(value, scenarioKeys[scenario], `${capabilityId} ${scenario} observation`);
    if (value.case_id !== caseId || value.result !== "pass" ||
        (parameters.kind === "profile" && value.profile !== parameters.profile)) {
      fail(`${capabilityId} ${scenario} observation is invalid`);
    }
    for (const [key, field] of Object.entries(value)) {
      if (key.endsWith("_sha256") && !sha256Pattern.test(field)) {
        fail(`${capabilityId} ${scenario} ${key} is invalid`);
      }
    }
  }
  const { negative, positive, recovery } = payload.scenarios;
  if (negative.installation_before_sha256 !== negative.installation_after_sha256) {
    fail(`${capabilityId} negative scenario changed the installation`);
  }
  if (parameters.kind === "skill") {
    for (const key of ["installed_manifest_sha256", "loader_sha256", "protocol_notifications_sha256"]) {
      if (recovery[key] !== positive[key]) fail(`${capabilityId} recovery did not restore the positive consumer state`);
    }
  } else if (positive.installed_profile_sha256 !== positive.source_profile_sha256 ||
      recovery.installed_profile_sha256 !== positive.source_profile_sha256 ||
      recovery.owned_profiles_sha256 !== positive.owned_profiles_sha256 ||
      recovery.loader_sha256 !== positive.loader_sha256) {
    fail(`${capabilityId} recovery did not restore the positive profile consumer state`);
  }
  return {
    facts_sha256: digest(Buffer.from(JSON.stringify(canonical(payload.scenarios)))),
    schema: "pareto-campaign-adapter-result/v1",
  };
}
