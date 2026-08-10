import { createHash } from "node:crypto";
import { execFile } from "node:child_process";
import { lstat, readFile, realpath } from "node:fs/promises";
import path from "node:path";
import { promisify } from "node:util";
import { fileURLToPath } from "node:url";
import { rejectDuplicateJsonObjectMembers } from "./json.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const defaultCatalogPath = path.join(root, "evals", "capabilities.json");
const execFileAsync = promisify(execFile);
const gitEnvironment = Object.fromEntries(Object.entries(process.env).filter(([name]) => !/^GIT_/i.test(name)));
const sourceKinds = new Set(["deterministic_replay", "native_trace", "independent_review"]);
const results = new Set(["pass", "fail", "unavailable"]);
const goalStatuses = new Set(["active", "paused", "blocked", "usageLimited", "budgetLimited", "complete"]);
const shaPattern = /^sha256:[a-f0-9]{64}$/;
const threadPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;
const expectedCapabilityIds = new Set([
  "KRN-01", "KRN-02", "PLN-01", "PLN-02", "PLN-03", "PLN-04", "PLN-05", "ORC-01", "ORC-02",
  "ORC-03", "ORC-04", "ORC-05", "ORC-06", "EXE-01", "EXE-02", "VER-01", "VER-02", "VER-03",
  "VER-04", "DLV-01", "DLV-02", "DLV-03", "DLV-04", "QUA-01", "QUA-02", "OPT-01", "OPT-02",
  "INS-01", "INS-02", "INS-03", "INS-04", "INS-05", "INS-06", "INS-07", "INS-08", "INS-09",
  "INS-10", "EVAL-01", "EVAL-02",
]);

function fail(message) {
  throw new Error(message);
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
  if (typeof value !== "string" || value.length === 0 || value.length > 256 || /[\u0000-\u001f]/.test(value)) {
    fail(`${label} must be one bounded string`);
  }
  return value;
}

function digest(bytes) {
  return `sha256:${createHash("sha256").update(bytes).digest("hex")}`;
}

function canonical(value) {
  if (Array.isArray(value)) return value.map(canonical);
  if (value && typeof value === "object") return Object.fromEntries(Object.keys(value).sort().map((key) => [key, canonical(value[key])]));
  return value;
}

function normalizedRepository(value) {
  return value
    .replace(/^git@github\.com:/, "https://github.com/")
    .replace(/^ssh:\/\/git@github\.com\//, "https://github.com/")
    .replace(/\.git$/, "");
}

async function git(repositoryRoot, args) {
  const { stdout } = await execFileAsync("git", ["-C", repositoryRoot, ...args], {
    encoding: "utf8",
    env: gitEnvironment,
    maxBuffer: 1024 * 1024,
  });
  return stdout.trim();
}

async function gitBytes(repositoryRoot, args) {
  const { stdout } = await execFileAsync("git", ["-C", repositoryRoot, ...args], {
    encoding: null,
    env: gitEnvironment,
    maxBuffer: 16 * 1024 * 1024,
  });
  return stdout;
}

async function verifyCandidate(repositoryRoot, candidate) {
  const resolvedRoot = path.resolve(repositoryRoot);
  const actualRoot = await git(resolvedRoot, ["rev-parse", "--show-toplevel"]);
  if (await realpath(actualRoot) !== await realpath(resolvedRoot)) fail("candidate repository root is not exact");
  const actualRepository = await git(resolvedRoot, ["remote", "get-url", "origin"]);
  if (normalizedRepository(actualRepository) !== normalizedRepository(candidate.repository)) {
    fail("candidate repository does not match origin");
  }
  const commit = await git(resolvedRoot, ["rev-parse", `${candidate.commit}^{commit}`]).catch(() => "");
  const tree = await git(resolvedRoot, ["rev-parse", `${candidate.commit}^{tree}`]).catch(() => "");
  if (commit !== candidate.commit || tree !== candidate.tree) fail("candidate commit/tree is not a real Git identity");
  if (await git(resolvedRoot, ["rev-parse", "HEAD"]) !== candidate.commit) fail("candidate must be the exact checkout HEAD");
  if (await git(resolvedRoot, ["status", "--porcelain=v1", "--untracked-files=all"])) fail("candidate checkout must be clean");
  const committedCatalog = await gitBytes(resolvedRoot, ["show", `${candidate.commit}:evals/capabilities.json`]).catch(() => null);
  if (!committedCatalog) fail("capability catalog is not available from the exact candidate blob");
  return committedCatalog;
}

function parseUniqueJson(bytes, label) {
  const source = bytes.toString("utf8");
  rejectDuplicateJsonObjectMembers(source, label);
  let value;
  try {
    value = JSON.parse(source);
  } catch (error) {
    fail(`${label} is invalid JSON: ${error.message}`);
  }
  return { bytes, value };
}

async function readUniqueJson(file, label) {
  return parseUniqueJson(await readFile(file), label);
}

function validateCatalog(catalog) {
  exactKeys(catalog, ["schema_version", "target_score", "local_trace_ceiling", "score_anchors", "default_requirements", "capabilities"], "catalog");
  if (catalog.schema_version !== 1 || catalog.target_score !== 9.5 || catalog.local_trace_ceiling !== 2) fail("catalog version, target, or local trace ceiling is unsupported");
  exactKeys(catalog.score_anchors, ["absent_or_contradicted", "declared", "reachable", "dynamic", "representative", "varied_no_material_gap"], "score anchors");
  const expectedAnchors = { absent_or_contradicted: 0, declared: 2, reachable: 4, dynamic: 6, representative: 8, varied_no_material_gap: 9.5 };
  if (Object.entries(expectedAnchors).some(([key, value]) => catalog.score_anchors[key] !== value)) {
    fail("score anchors must remain 0/2/4/6/8/9.5");
  }
  exactKeys(catalog.default_requirements, ["scenarios", "sources", "trials_per_scenario", "environments", "independent_observers"], "default requirements");
  const requirements = catalog.default_requirements;
  if (!Array.isArray(requirements.scenarios) || requirements.scenarios.length < 3 || new Set(requirements.scenarios).size !== requirements.scenarios.length) fail("catalog scenarios are invalid");
  if (!Array.isArray(requirements.sources) || requirements.sources.length !== sourceKinds.size || requirements.sources.some((kind) => !sourceKinds.has(kind))) fail("catalog sources are invalid");
  if (!Number.isInteger(requirements.trials_per_scenario) || requirements.trials_per_scenario < 3 || !Number.isInteger(requirements.environments) || requirements.environments < 2 || !Number.isInteger(requirements.independent_observers) || requirements.independent_observers < 2) fail("catalog varied-evidence requirements are too weak");
  if (!Array.isArray(catalog.capabilities) || catalog.capabilities.length === 0) fail("catalog capabilities are empty");
  const ids = new Set();
  for (const capability of catalog.capabilities) {
    exactKeys(capability, ["id", "domain", "name", "owner", "consumer", "weight", "critical"], "capability");
    const id = atom(capability.id, "capability id");
    if (!/^[A-Z]{3,4}-\d{2}$/.test(id) || ids.has(id)) fail(`capability id is invalid or duplicated: ${id}`);
    ids.add(id);
    for (const key of ["domain", "name", "owner", "consumer"]) atom(capability[key], `capability ${id} ${key}`);
    if (capability.weight !== 1) fail(`capability ${id} weight must remain one so weights cannot hide a weak leaf`);
    if (typeof capability.critical !== "boolean") fail(`capability ${id} critical must be boolean`);
  }
  if (ids.size !== expectedCapabilityIds.size || [...expectedCapabilityIds].some((id) => !ids.has(id))) {
    fail("catalog must contain the exact frozen capability inventory");
  }
  return new Map(catalog.capabilities.map((capability) => [capability.id, capability]));
}

function parseCapabilityResult(message, label) {
  rejectDuplicateJsonObjectMembers(message, label);
  let result;
  try {
    result = JSON.parse(message);
  } catch (error) {
    fail(`${label} is not exact JSON: ${error.message}`);
  }
  exactKeys(result, ["schema", "capability_id", "scenario", "case_id", "candidate", "result", "oracle", "control_sha256", "unavailable_evidence", "material_gaps", "mutation_observation"], label);
  if (result.schema !== "rbm-capability-result/v1" || !results.has(result.result)) fail(`${label} schema or result is invalid`);
  exactKeys(result.candidate, ["commit", "tree"], `${label} candidate`);
  if (!shaPattern.test(result.control_sha256) || !Array.isArray(result.unavailable_evidence) || !Array.isArray(result.material_gaps)) fail(`${label} control or gap fields are invalid`);
  atom(result.oracle, `${label} oracle`);
  if (!['none', 'detected'].includes(result.mutation_observation)) fail(`${label} mutation observation is invalid`);
  return result;
}

function parseRolloutTrace(bytes, observation, candidate) {
  const source = bytes.toString("utf8");
  const lines = source.endsWith("\n") ? source.slice(0, -1).split("\n") : source.split("\n");
  if (lines.length < 4) fail(`rollout trace is incomplete: ${observation.artifact_path}`);
  const entries = lines.map((line, index) => {
    rejectDuplicateJsonObjectMembers(line, `rollout line ${index + 1}`);
    try {
      return JSON.parse(line);
    } catch (error) {
      fail(`rollout line ${index + 1} is invalid JSON: ${error.message}`);
    }
  });
  const session = entries.find((entry) => entry.type === "session_meta")?.payload;
  if (!session || typeof session.id !== "string" || typeof session.session_id !== "string" ||
      typeof session.originator !== "string" || typeof session.cli_version !== "string" ||
      typeof session.model_provider !== "string") fail("rollout lacks session or environment identity");
  const started = entries.some((entry) => entry.type === "event_msg" && entry.payload?.type === "task_started");
  const completed = [...entries].reverse().find((entry) => entry.type === "event_msg" && entry.payload?.type === "task_complete")?.payload;
  const tokenReceipt = entries.some((entry) => entry.type === "event_msg" && entry.payload?.type === "token_count" && entry.payload?.info?.total_token_usage);
  const finalMessage = [...entries].reverse().find((entry) => entry.type === "response_item" && entry.payload?.type === "message" && entry.payload?.role === "assistant")?.payload?.content?.find((item) => item.type === "output_text")?.text;
  if (!started || !completed || !tokenReceipt || typeof finalMessage !== "string" || completed.last_agent_message !== finalMessage) fail("rollout lacks one consistent terminal task and token receipt");
  const result = parseCapabilityResult(finalMessage, "rollout capability result");
  if (result.capability_id !== observation.capability_id || result.scenario !== observation.scenario || result.case_id !== observation.case_id || result.result !== observation.result) fail("rollout result does not match observation binding");
  if (result.candidate.commit !== candidate.commit || result.candidate.tree !== candidate.tree) fail("rollout result does not match candidate identity");
  if (result.unavailable_evidence.length > 0 || result.material_gaps.length > 0 || result.mutation_observation !== "none") return false;

  const spawn = session.source?.subagent?.thread_spawn;
  const derivedProducer = spawn?.parent_thread_id ?? session.parent_thread_id ?? session.id;
  const derivedEnvironment = `codex:${session.originator}:${session.cli_version}:${session.model_provider}`;
  if (observation.observer_id !== session.id || observation.producer_id !== derivedProducer || observation.subject_id !== candidate.commit) fail("rollout principals do not match observation binding");
  if (observation.environment_id !== derivedEnvironment) fail("rollout environment does not match observation binding");
  if (observation.source_kind === "independent_review" && (!spawn || session.thread_source !== "subagent")) fail("independent review must be a native subagent rollout");
  if (observation.source_kind === "deterministic_replay") {
    const calls = new Set(entries.filter((entry) => entry.type === "response_item" && entry.payload?.type === "custom_tool_call" && typeof entry.payload?.call_id === "string").map((entry) => entry.payload.call_id));
    const outputs = new Set(entries.filter((entry) => entry.type === "response_item" && entry.payload?.type === "custom_tool_call_output" && typeof entry.payload?.call_id === "string").map((entry) => entry.payload.call_id));
    if (![...calls].some((callId) => outputs.has(callId))) fail("deterministic replay trace lacks a paired tool call and output");
  }
  return true;
}

function parseNativeTrace(bytes, observation, candidate) {
  const { value: envelope } = parseUniqueJson(bytes, "native evidence");
  exactKeys(envelope, ["schema", "content_sha256", "payload"], "native evidence envelope");
  if (envelope.schema !== "rbm-native-evidence-envelope/v2" || !shaPattern.test(envelope.content_sha256)) fail("native evidence envelope is invalid");
  const payload = envelope.payload;
  exactKeys(payload, ["schema", "authority", "executable", "host", "thread", "goal", "expectation", "binding", "result"], "native evidence payload");
  if (payload.schema !== "rbm-native-evidence/v2" || payload.authority !== "local_interface_observation" || payload.result !== "matched") fail("native evidence authority or result is invalid");
  if (envelope.content_sha256 !== digest(Buffer.from(JSON.stringify(canonical(payload))))) fail("native evidence content digest is invalid");
  exactKeys(payload.executable, ["sha256", "server_version"], "native executable");
  if (!shaPattern.test(payload.executable.sha256) || !/^\d+\.\d+\.\d+(?:[-+][0-9A-Za-z.-]+)?$/.test(payload.executable.server_version)) fail("native executable identity is invalid");
  exactKeys(payload.host, ["platform_family", "platform_os", "user_agent"], "native host");
  for (const key of ["platform_family", "platform_os", "user_agent"]) atom(payload.host[key], `native host ${key}`);
  exactKeys(payload.thread, ["cli_version", "cwd_sha256", "id", "parent_thread_id", "source", "status"], "native thread");
  exactKeys(payload.thread.source, ["kind", "sha256"], "native thread source");
  if (!threadPattern.test(payload.thread.id) || (payload.thread.parent_thread_id !== null && !threadPattern.test(payload.thread.parent_thread_id)) || !shaPattern.test(payload.thread.cwd_sha256) || !shaPattern.test(payload.thread.source.sha256)) fail("native thread identity is invalid");
  for (const key of ["cli_version", "status"]) atom(payload.thread[key], `native thread ${key}`);
  exactKeys(payload.expectation, ["goal_status", "objective_sha256"], "native expectation");
  if (![...goalStatuses, "absent"].includes(payload.expectation.goal_status) || (payload.expectation.objective_sha256 !== null && !shaPattern.test(payload.expectation.objective_sha256))) fail("native expectation is invalid");
  if (payload.goal !== null) {
    exactKeys(payload.goal, ["objective_sha256", "status", "thread_id"], "native goal");
    if (!shaPattern.test(payload.goal.objective_sha256) || !goalStatuses.has(payload.goal.status) || payload.goal.thread_id !== payload.thread.id) fail("native goal is invalid");
  }
  exactKeys(payload.binding, ["capability_id", "scenario", "case_id", "candidate", "result"], "native binding");
  exactKeys(payload.binding.candidate, ["commit", "tree"], "native binding candidate");
  if (payload.binding.capability_id !== observation.capability_id || payload.binding.scenario !== observation.scenario || payload.binding.case_id !== observation.case_id || payload.binding.result !== observation.result) fail("native binding does not match observation");
  if (payload.binding.candidate.commit !== candidate.commit || payload.binding.candidate.tree !== candidate.tree) fail("native binding does not match candidate");
  const environment = `codex-app-server:${payload.host.user_agent}:${payload.host.platform_family}:${payload.host.platform_os}:${payload.executable.sha256}`;
  const producer = payload.thread.parent_thread_id ?? payload.thread.id;
  if (observation.environment_id !== environment || observation.observer_id !== payload.thread.id || observation.producer_id !== producer || observation.subject_id !== candidate.commit) fail("native principals do not match observation");
  return true;
}

async function validateArtifact(observation, evidenceDirectory, candidate) {
  const artifactPath = path.resolve(evidenceDirectory, observation.artifact_path);
  const info = await lstat(artifactPath).catch(() => null);
  if (!info?.isFile() || info.isSymbolicLink()) fail(`evidence artifact is missing or unsafe: ${observation.artifact_path}`);
  const bytes = await readFile(artifactPath);
  if (digest(bytes) !== observation.content_sha256) fail(`evidence artifact digest mismatch: ${observation.artifact_path}`);
  if (observation.source_kind === "native_trace" && observation.result === "pass") return parseNativeTrace(bytes, observation, candidate);
  return parseRolloutTrace(bytes, observation, candidate);
}

function validateObservation(observation, capabilities, requirements) {
  exactKeys(observation, ["capability_id", "scenario", "case_id", "trial_id", "environment_id", "subject_id", "producer_id", "observer_id", "source_kind", "result", "artifact_path", "content_sha256"], "observation");
  if (!capabilities.has(observation.capability_id)) fail(`observation capability is unknown: ${observation.capability_id}`);
  if (!requirements.scenarios.includes(observation.scenario)) fail(`observation scenario is unknown: ${observation.scenario}`);
  for (const key of ["case_id", "trial_id", "environment_id", "subject_id", "producer_id", "observer_id", "artifact_path"]) atom(observation[key], `observation ${key}`);
  if (!sourceKinds.has(observation.source_kind) || !results.has(observation.result)) fail("observation source or result is invalid");
  if (!shaPattern.test(observation.content_sha256)) fail("observation digest is invalid");
  if (observation.source_kind === "independent_review" && (observation.observer_id === observation.subject_id || observation.observer_id === observation.producer_id)) {
    fail("independent review observer must differ from subject and producer");
  }
}

function scoreCapability(capability, observations, gaps, requirements, localTraceCeiling) {
  const passed = observations.filter((entry) => entry.result === "pass" && entry.source_verified === true);
  const unverifiedPass = observations.filter((entry) => entry.result === "pass" && entry.source_verified !== true);
  const failed = observations.filter((entry) => entry.result === "fail");
  const unavailable = observations.filter((entry) => entry.result === "unavailable");
  const criticalGap = gaps.some((gap) => gap.severity === "critical");
  const materialGap = gaps.length > 0;
  if (materialGap || failed.length > 0 || unverifiedPass.length > 0) {
    const reason = criticalGap ? "critical_gap" : materialGap ? "material_gap" : failed.length > 0 ? "failed_observation" : "unverified_pass";
    return { score: 0, maturity: "contradicted", reason };
  }
  if (passed.length === 0) return { score: 0, maturity: "absent", reason: "no_passing_evidence" };

  const sources = new Set(passed.map((entry) => entry.source_kind));
  const scenarios = new Set(passed.map((entry) => entry.scenario));
  const environments = new Set(passed.map((entry) => entry.environment_id));
  const independentObservers = new Set(passed.filter((entry) => entry.source_kind === "independent_review").map((entry) => entry.observer_id));
  const hasDynamic = sources.has("native_trace");
  const coversRequiredSources = requirements.sources.every((kind) => sources.has(kind));
  const coversRequiredScenarios = requirements.scenarios.every((scenario) => scenarios.has(scenario));
  const coversScenarioSources = requirements.scenarios.every((scenario) => requirements.sources.every((sourceKind) =>
    passed.some((entry) => entry.scenario === scenario && entry.source_kind === sourceKind)));

  let score = sources.has("deterministic_replay") ? 4 : 2;
  let maturity = score === 4 ? "reachable" : "declared";
  let reason = score === 4 ? "deterministic_replay_only" : "declaration_only";
  if (hasDynamic) {
    score = 6;
    maturity = "dynamic";
    reason = "one_or_more_native_traces";
  }
  if (hasDynamic && coversRequiredSources && coversRequiredScenarios && coversScenarioSources) {
    score = 8;
    maturity = "representative";
    reason = "positive_negative_recovery_with_independent_review";
  }

  if (unavailable.length > 0 && score > 6) {
    score = 6;
    maturity = "dynamic";
    reason = "unavailable_attempt_caps_observation";
  }
  if (score > localTraceCeiling) {
    score = localTraceCeiling;
    maturity = "declared";
    reason = "local_writable_trace_has_no_provider_attestation";
  }
  return { score, maturity, reason };
}

export async function scoreEvidence({ evidencePath }) {
  if (!evidencePath) fail("evidence path is required");
  const { value: evidence } = await readUniqueJson(evidencePath, "capability evidence");
  exactKeys(evidence, ["schema_version", "catalog_sha256", "candidate", "attempt_inventory", "observations", "open_gaps"], "evidence");
  exactKeys(evidence.candidate, ["repository", "commit", "tree"], "candidate");
  atom(evidence.candidate.repository, "candidate repository");
  if (!/^[a-f0-9]{40}$/.test(evidence.candidate.commit) || !/^[a-f0-9]{40}$/.test(evidence.candidate.tree)) fail("candidate Git identity is invalid");
  const catalogBytes = await verifyCandidate(root, evidence.candidate);
  const { value: catalog } = parseUniqueJson(catalogBytes, "capability catalog");
  const capabilities = validateCatalog(catalog);
  if (evidence.schema_version !== 1 || evidence.catalog_sha256 !== digest(catalogBytes)) fail("evidence catalog binding is stale or invalid");
  exactKeys(evidence.attempt_inventory, ["status", "locator"], "attempt inventory");
  if (evidence.attempt_inventory.status !== "unavailable") fail("provider-attested attempt inventory is not supported by this scorer");
  atom(evidence.attempt_inventory.locator, "attempt inventory locator");
  if (!Array.isArray(evidence.observations) || !Array.isArray(evidence.open_gaps)) fail("evidence observations and gaps must be arrays");

  const keys = new Set();
  const trialArtifacts = new Set();
  const evidenceDirectory = path.dirname(path.resolve(evidencePath));
  for (const observation of evidence.observations) {
    validateObservation(observation, capabilities, catalog.default_requirements);
    const key = [observation.capability_id, observation.scenario, observation.case_id, observation.trial_id, observation.environment_id, observation.source_kind, observation.observer_id].join("\u0000");
    if (keys.has(key)) fail("evidence repeats one observation identity");
    keys.add(key);
    const trialArtifact = [observation.capability_id, observation.scenario, observation.source_kind, observation.content_sha256].join("\u0000");
    if (trialArtifacts.has(trialArtifact)) fail("evidence reuses one artifact as multiple trials");
    trialArtifacts.add(trialArtifact);
    observation.source_verified = await validateArtifact(observation, evidenceDirectory, evidence.candidate);
  }

  const gapsByCapability = new Map();
  for (const gap of evidence.open_gaps) {
    exactKeys(gap, ["capability_id", "severity", "description", "locator"], "gap");
    if (!capabilities.has(gap.capability_id) || !["material", "critical"].includes(gap.severity)) fail("gap capability or severity is invalid");
    atom(gap.description, "gap description");
    atom(gap.locator, "gap locator");
    gapsByCapability.set(gap.capability_id, [...(gapsByCapability.get(gap.capability_id) ?? []), gap]);
  }

  const rows = [...capabilities.values()].map((capability) => {
    const observations = evidence.observations.filter((entry) => entry.capability_id === capability.id);
    const gaps = gapsByCapability.get(capability.id) ?? [];
    return { ...capability, ...scoreCapability(capability, observations, gaps, catalog.default_requirements, catalog.local_trace_ceiling), observation_count: observations.length, gap_count: gaps.length };
  });
  const weightedScore = rows.reduce((sum, row) => sum + row.score * row.weight, 0) / rows.reduce((sum, row) => sum + row.weight, 0);
  const minimumScore = Math.min(...rows.map((row) => row.score));
  const criticalBreaches = rows.filter((row) => row.critical && row.score < catalog.target_score).map((row) => row.id);
  const belowTarget = rows.filter((row) => row.score < catalog.target_score).map((row) => row.id);
  return {
    schema_version: 1,
    catalog_sha256: digest(catalogBytes),
    candidate: evidence.candidate,
    target_score: catalog.target_score,
    evidence_ceiling: catalog.local_trace_ceiling,
    evidence_limit: "provider_attested_attempt_inventory_unavailable",
    weighted_score: Number(weightedScore.toFixed(3)),
    minimum_score: minimumScore,
    eligible: weightedScore >= catalog.target_score && minimumScore >= catalog.target_score && criticalBreaches.length === 0,
    below_target: belowTarget,
    critical_breaches: criticalBreaches,
    capabilities: rows,
  };
}

export async function validateCatalogFile(catalogPath = defaultCatalogPath) {
  const { bytes, value } = await readUniqueJson(catalogPath, "capability catalog");
  validateCatalog(value);
  return digest(bytes);
}

const invokedAsMain = process.argv[1] &&
  await realpath(path.resolve(process.argv[1])).catch(() => "") === await realpath(fileURLToPath(import.meta.url));
if (invokedAsMain) {
  const evidencePath = process.argv[2];
  try {
    if (process.argv.length > 3) fail("capability scorer accepts only one evidence path");
    const report = await scoreEvidence({ evidencePath });
    console.log(JSON.stringify(report, null, 2));
    if (!report.eligible) process.exitCode = 1;
  } catch (error) {
    console.error(error.message);
    process.exitCode = 1;
  }
}
