import { execFileSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { parse as parseYaml } from "yaml";
import { rejectDuplicateJsonObjectMembers } from "./json.mjs";

const defaultRepo = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const gitExecutable = process.platform === "win32" ? "git.exe" : "/usr/bin/git";
const gitEnvironment = {
  ...Object.fromEntries(Object.entries(process.env).filter(([name]) => !/^GIT_/i.test(name))),
  GIT_CONFIG_NOSYSTEM: "1",
  GIT_CONFIG_GLOBAL: process.platform === "win32" ? "NUL" : "/dev/null",
  GIT_NO_REPLACE_OBJECTS: "1",
  GIT_OPTIONAL_LOCKS: "0",
  LC_ALL: "C",
};
const rawItemTypes = new Set([
  "command_execution", "file_change", "mcp_tool_call", "agent_message", "reasoning", "web_search",
  "todo_list", "error",
]);
const unavailableAxes = new Set([
  "conversation_compaction_state", "external_evaluator_state", "external_provider_state", "github_state",
  "host_native_skill_route", "native_goal_state", "native_task_state",
]);
const forbiddenPublicEvidence = [
  /qOeOp\/trade/i,
  /github\.com\/qOeOp\/trade/i,
  /\/Users\/[A-Za-z0-9._-]+\//,
  /\bitem-\d+\b/,
  /\bPR\s*#\d+\b/i,
  /\b019f[a-f0-9-]{20,}\b/i,
  /BINANCE_API_(?:KEY|SECRET)/,
];

function fail(message) {
  throw new Error(message);
}

function git(repo, args, encoding = "utf8") {
  try {
    return execFileSync(gitExecutable, [
      "--no-replace-objects",
      "-c", "core.fsmonitor=false",
      "-c", "core.untrackedCache=false",
      "-c", "core.hooksPath=/dev/null",
      "-C", repo,
      ...args,
    ], { env: gitEnvironment, encoding, maxBuffer: 8 * 1024 * 1024 });
  } catch {
    fail("canonical scenario authority Git read failed");
  }
}

function assertCommit(repo, oid, label) {
  if (!/^[0-9a-f]{40,64}$/.test(oid)) fail(`${label} must be a full Git object ID`);
  if (git(repo, ["cat-file", "-t", oid]).trim() !== "commit") fail(`${label} must identify a commit`);
}

function committedText(repo, oid, file) {
  return git(repo, ["show", `${oid}:${file}`]);
}

function canonical(value) {
  if (Array.isArray(value)) return value.map(canonical);
  if (value && typeof value === "object") {
    return Object.fromEntries(Object.keys(value).sort().map((key) => [key, canonical(value[key])]));
  }
  return value;
}

function exactKeys(value, expected, label) {
  if (!value || typeof value !== "object" || Array.isArray(value)) fail(`${label} must be an object`);
  const actual = Object.keys(value).sort();
  const wanted = [...expected].sort();
  if (actual.length !== wanted.length || actual.some((key, index) => key !== wanted[index])) {
    fail(`${label} has invalid fields`);
  }
}

function validateCase(row, suite, label) {
  if (forbiddenPublicEvidence.some((pattern) => pattern.test(JSON.stringify(row)))) {
    fail(`${label} contains forbidden public evidence`);
  }
  if (typeof row?.vars?.prompt !== "string" || !Array.isArray(row.assert) || row.assert.length === 0) {
    fail(`${label} requires prompt and assertions`);
  }
  const activation = row.assert.filter((entry) =>
    entry?.type === "skill-used" || entry?.type === "not-skill-used");
  if (activation.length !== 1 || activation[0].value !== "run-bounded-mission") {
    fail(`${label} requires one exact Skill activation oracle`);
  }
  const deterministic = row.assert.filter((entry) => !activation.includes(entry));
  if (deterministic.length === 0 || deterministic.some((entry) =>
    !["contains", "contains-all", "not-contains", "equals"].includes(entry?.type))) {
    fail(`${label} requires deterministic assertions`);
  }
  exactKeys(row.metadata, new Set(["observations"]), `${label} metadata`);
  const observations = row.metadata.observations;
  exactKeys(observations,
    new Set(["capability", "behavioral_oracle", "skill_activation", "required_raw_item_types", "unavailable"]),
    `${label} observations`);
  exactKeys(observations.capability, new Set(["id", "scenario", "case_id"]), `${label} capability`);
  exactKeys(observations.skill_activation, new Set(["status", "expected"]), `${label} activation`);
  const expected = activation[0].type === "skill-used" ? "used" : "not_used";
  if (observations.behavioral_oracle !== "deterministic_text" ||
      observations.skill_activation.status !== "dynamic_heuristic" ||
      observations.skill_activation.expected !== expected) {
    fail(`${label} observation contract is invalid`);
  }
  if (!Array.isArray(observations.required_raw_item_types) ||
      observations.required_raw_item_types.some((type) => !rawItemTypes.has(type)) ||
      new Set(observations.required_raw_item_types).size !== observations.required_raw_item_types.length ||
      (expected === "used" && !observations.required_raw_item_types.includes("command_execution"))) {
    fail(`${label} raw observation contract is invalid`);
  }
  if (!Array.isArray(observations.unavailable) ||
      !observations.unavailable.includes("host_native_skill_route") ||
      observations.unavailable.some((axis) => !unavailableAxes.has(axis)) ||
      new Set(observations.unavailable).size !== observations.unavailable.length) {
    fail(`${label} unavailable observation contract is invalid`);
  }
  return { binding: observations.capability, suite };
}

function parseJsonBlob(repo, oid, file, label) {
  const source = committedText(repo, oid, file);
  rejectDuplicateJsonObjectMembers(source, label);
  try {
    return JSON.parse(source);
  } catch {
    fail(`${label} must be valid JSON`);
  }
}

function parseDesign(repo, oid, label) {
  const design = parseJsonBlob(repo, oid, "evals/scenarios.json", `${label} scenario design`);
  if (design?.schema_version !== 2 || !Array.isArray(design.scenarios) ||
      Object.keys(design).sort().join(",") !== "scenarios,schema_version") {
    fail(`${label} scenario design identity is invalid`);
  }
  const slots = new Map();
  const caseIds = new Set();
  const required = new Set([
    "capability_id", "scenario", "case_id", "observer_kind", "authority_status", "missing_authority",
  ]);
  for (const row of design.scenarios) {
    const keys = new Set(Object.keys(row ?? {}));
    if ([...required].some((key) => !keys.has(key)) ||
        [...keys].some((key) => !required.has(key) && key !== "executable_suite")) {
      fail(`${label} scenario design row has invalid fields`);
    }
    const slot = `${row?.capability_id}/${row?.scenario}`;
    if (slots.has(slot) || caseIds.has(row?.case_id)) fail(`${label} scenario design has duplicate identity`);
    slots.set(slot, row);
    caseIds.add(row?.case_id);
  }
  return slots;
}

function parseCases(repo, oid, label) {
  const cases = new Map();
  const descriptions = new Set();
  let smokeCases = 0;
  for (const [file, allowedSuite] of [
    ["evals/cases/golden.yaml", new Set(["smoke", "full"])],
    ["evals/cases/holdout.yaml", new Set(["holdout"])],
  ]) {
    let rows;
    try {
      rows = parseYaml(committedText(repo, oid, file), { uniqueKeys: true });
    } catch {
      fail(`${label} ${file} must be valid unique-key YAML`);
    }
    if (!Array.isArray(rows)) fail(`${label} ${file} must contain cases`);
    for (const row of rows) {
      const suite = /^\[(smoke|full|holdout)\] /.exec(row?.description ?? "")?.[1];
      if (!allowedSuite.has(suite)) fail(`${label} executable corpus has invalid suite identity`);
      if (descriptions.has(row.description)) fail(`${label} executable corpus has duplicate description`);
      descriptions.add(row.description);
      if (suite === "smoke") smokeCases += 1;
      const { binding } = validateCase(row, suite, `${label} ${row.description}`);
      if (!binding?.case_id || cases.has(binding.case_id)) {
        fail(`${label} executable corpus has invalid or duplicate identity`);
      }
      cases.set(binding.case_id, {
        capability_id: binding.id,
        scenario: binding.scenario,
        suite: suite === "holdout" ? "holdout" : "golden",
        definition: JSON.stringify(canonical(row)),
      });
    }
  }
  if (smokeCases !== 2) fail(`${label} executable corpus must retain exactly two smoke cases`);
  return cases;
}

const protectedFields = [
  "capability_id",
  "scenario",
  "case_id",
  "observer_kind",
];
const fixedObserverCapabilities = new Set(["INS-01", "EVAL-02"]);
const controlPlaneFiles = [
  ".github/workflows/scenario-authority.yml",
  ".github/workflows/observe-install-capability.yml",
  ".github/workflows/observe-score-capability.yml",
  ".github/workflows/consume-score-capability.yml",
  "scripts/check-scenario-authority.mjs",
  "scripts/self-test.mjs",
  "scripts/validate.mjs",
  "scripts/capability-score.mjs",
  "scripts/observe-install-capability.mjs",
  "scripts/observe-score-capability.mjs",
  "scripts/consume-score-capability.mjs",
  "scripts/json.mjs",
  "package.json",
  "package-lock.json",
];

export function checkScenarioAuthority({ repo = defaultRepo, base, candidate }) {
  const resolvedRepo = path.resolve(repo);
  assertCommit(resolvedRepo, base, "base");
  assertCommit(resolvedRepo, candidate, "candidate");
  for (const file of controlPlaneFiles) {
    if (committedText(resolvedRepo, candidate, file) !== committedText(resolvedRepo, base, file)) {
      fail(`candidate changed protected scenario authority control ${file}`);
    }
  }
  const baseSlots = parseDesign(resolvedRepo, base, "base");
  const candidateSlots = parseDesign(resolvedRepo, candidate, "candidate");
  const baseCatalog = parseJsonBlob(resolvedRepo, base, "evals/capabilities.json", "base capability catalog");
  const candidateCatalog = parseJsonBlob(resolvedRepo, candidate, "evals/capabilities.json", "candidate capability catalog");
  if (JSON.stringify(canonical(candidateCatalog)) !== JSON.stringify(canonical(baseCatalog))) {
    fail("candidate changed the canonical capability catalog");
  }
  if (candidateSlots.size !== baseSlots.size) fail("candidate scenario slots must equal canonical base slots");

  for (const [slot, baseRow] of baseSlots) {
    const candidateRow = candidateSlots.get(slot);
    if (!candidateRow) fail(`candidate deleted canonical scenario slot ${slot}`);
    for (const field of protectedFields) {
      if (candidateRow[field] !== baseRow[field]) fail(`candidate changed canonical ${slot} field ${field}`);
    }
    const authorityUnchanged = candidateRow.authority_status === baseRow.authority_status &&
      candidateRow.missing_authority === baseRow.missing_authority;
    const admittedFixedObserver = baseRow.authority_status === "authority_unavailable" &&
      baseRow.missing_authority === "scenario_consumer_binding" &&
      candidateRow.authority_status === "implemented" && candidateRow.missing_authority === null &&
      candidateRow.observer_kind === "fixed_real_consumer" && fixedObserverCapabilities.has(candidateRow.capability_id);
    if (!authorityUnchanged && !admittedFixedObserver) {
      fail(`candidate changed canonical ${slot} authority without an admitted fixed observer`);
    }
    if (baseRow.executable_suite !== undefined && candidateRow.executable_suite !== baseRow.executable_suite) {
      fail(`candidate changed canonical ${slot} executable suite`);
    }
    if (baseRow.executable_suite === undefined && candidateRow.executable_suite !== undefined &&
        !["golden", "holdout"].includes(candidateRow.executable_suite)) {
      fail(`candidate added invalid ${slot} executable suite`);
    }
  }
  for (const capabilityId of fixedObserverCapabilities) {
    const rows = [...candidateSlots.values()].filter((row) => row.capability_id === capabilityId);
    const changed = rows.some((row) => {
      const baseRow = baseSlots.get(`${row.capability_id}/${row.scenario}`);
      return row.authority_status !== baseRow.authority_status || row.missing_authority !== baseRow.missing_authority;
    });
    if (changed && (rows.length !== 3 || rows.some((row) =>
      row.authority_status !== "implemented" || row.missing_authority !== null))) {
      fail(`candidate must admit all ${capabilityId} fixed-observer scenarios atomically`);
    }
  }

  const baseCases = parseCases(resolvedRepo, base, "base");
  const candidateCases = parseCases(resolvedRepo, candidate, "candidate");
  for (const [caseId, baseCase] of baseCases) {
    const candidateCase = candidateCases.get(caseId);
    if (!candidateCase || candidateCase.definition !== baseCase.definition) {
      fail(`candidate deleted or moved canonical executable case ${caseId}`);
    }
  }
  for (const [caseId, candidateCase] of candidateCases) {
    const row = [...candidateSlots.values()].find((entry) => entry.case_id === caseId);
    if (!row || row.capability_id !== candidateCase.capability_id || row.scenario !== candidateCase.scenario ||
        row.executable_suite !== candidateCase.suite) {
      fail(`candidate executable case ${caseId} lacks one exact scenario binding`);
    }
  }
  for (const row of candidateSlots.values()) {
    if (row.executable_suite !== undefined && !candidateCases.has(row.case_id)) {
      fail(`candidate scenario ${row.case_id} lacks its executable case`);
    }
  }
  return { slots: candidateSlots.size, canonicalCases: baseCases.size, candidateCases: candidateCases.size };
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const args = Object.fromEntries(process.argv.slice(2).map((value, index, all) =>
    value.startsWith("--") ? [value.slice(2), all[index + 1]] : null).filter(Boolean));
  if (!args.base || !args.candidate) fail("usage: check-scenario-authority.mjs --base <oid> --candidate <oid> [--repo <path>]");
  const result = checkScenarioAuthority({ repo: args.repo ?? defaultRepo, base: args.base, candidate: args.candidate });
  process.stdout.write(`Canonical scenario authority preserved: ${result.slots} slots, ${result.canonicalCases} canonical cases, ${result.candidateCases} candidate cases.\n`);
}
