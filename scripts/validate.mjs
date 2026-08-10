import { execFileSync } from "node:child_process";
import { lstat, readFile, readdir, stat } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { parse as parseYaml } from "yaml";
import { rejectDuplicateJsonObjectMembers } from "./json.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const skillRoot = path.join(root, "skills");
const gitAuthorityEnvironment = Object.fromEntries(
  Object.entries(process.env).filter(([name]) => !/^GIT_/i.test(name)),
);
const allowedFrontmatter = new Set(["name", "description"]);
const allowedUnavailableObservations = new Set([
  "conversation_compaction_state",
  "external_evaluator_state",
  "external_provider_state",
  "github_state",
  "host_native_skill_route",
  "native_goal_state",
  "native_task_state",
]);
const replayableRawItemTypes = new Set([
  "command_execution",
  "file_change",
  "mcp_tool_call",
  "agent_message",
  "reasoning",
  "web_search",
  "todo_list",
  "error",
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

async function readUniqueJson(relative, label) {
  const source = await readFile(path.join(root, relative), "utf8");
  rejectDuplicateJsonObjectMembers(source, label);
  try {
    return JSON.parse(source);
  } catch {
    fail(`${label}: expected valid JSON`);
  }
}

function splitFrontmatter(source, file) {
  const match = source.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n([\s\S]*)$/);
  if (!match) fail(`${file}: expected YAML frontmatter bounded by ---`);
  return { metadata: parseYaml(match[1]), body: match[2] };
}

async function validateLinks(body, skillDir, file) {
  const links = [...body.matchAll(/\]\(([^)]+)\)/g)].map((match) => match[1]);
  for (const link of links) {
    if (/^(?:https?:|mailto:|#)/.test(link)) continue;
    const target = path.resolve(skillDir, decodeURIComponent(link.split("#", 1)[0]));
    if (!target.startsWith(`${skillDir}${path.sep}`)) fail(`${file}: link escapes skill root: ${link}`);
    try {
      await stat(target);
    } catch {
      fail(`${file}: missing linked resource: ${link}`);
    }
  }
}

async function validateSkills() {
  const names = await readdir(skillRoot);
  const warnings = [];
  if (names.length !== 1 || names[0] !== "run-bounded-mission") {
    fail("skills/: expected exactly the run-bounded-mission Skill");
  }
  for (const folder of names.sort()) {
    const skillDir = path.join(skillRoot, folder);
    if (!(await stat(skillDir)).isDirectory()) fail(`skills/${folder}: expected a directory`);
    const file = path.join(skillDir, "SKILL.md");
    const source = await readFile(file, "utf8");
    const { metadata, body } = splitFrontmatter(source, file);
    if (!metadata || typeof metadata !== "object" || Array.isArray(metadata)) fail(`${file}: invalid metadata`);
    for (const key of Object.keys(metadata)) {
      if (!allowedFrontmatter.has(key)) fail(`${file}: unsupported frontmatter key ${key}`);
    }
    if (metadata.name !== folder) fail(`${file}: name must match parent folder ${folder}`);
    if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(metadata.name) || metadata.name.length > 64) {
      fail(`${file}: invalid Skill name`);
    }
    if (typeof metadata.description !== "string" || metadata.description.trim().length === 0) {
      fail(`${file}: description must be a non-empty string`);
    }
    if (metadata.description.length > 1024) fail(`${file}: description exceeds 1024 characters`);
    if (body.split(/\r?\n/).length > 500) {
      warnings.push(`${path.relative(root, file)} exceeds the recommended 500-line authoring target`);
    }
    await validateLinks(body, skillDir, file);
  }
  return { count: names.length, warnings };
}

function validatePromptfooCases(cases, { file, suites }) {
  if (!Array.isArray(cases)) fail(`${file}: cases must be an array`);
  const descriptions = [];
  const capabilityCaseIds = new Set();
  for (const testCase of cases) {
    const suite = /^\[(smoke|full|holdout)\] /.exec(testCase.description ?? "")?.[1];
    if (!suite || !suites.has(suite)) {
      fail(`eval case has invalid suite prefix: ${testCase.description ?? "<missing>"}`);
    }
    if (descriptions.includes(testCase.description)) fail(`duplicate eval description: ${testCase.description}`);
    descriptions.push(testCase.description);
    if (typeof testCase.vars?.prompt !== "string" || !Array.isArray(testCase.assert) || testCase.assert.length === 0) {
      fail(`${testCase.description}: prompt and assertions are required`);
    }
    const native = testCase.assert.filter((assertion) =>
      assertion.type === "skill-used" || assertion.type === "not-skill-used");
    if (native.length !== 1 || native[0].value !== "run-bounded-mission") {
      fail(`${testCase.description}: expected one exact heuristic run-bounded-mission activation oracle`);
    }
    const deterministic = testCase.assert.filter((assertion) => !native.includes(assertion));
    if (deterministic.length === 0 || deterministic.some((assertion) =>
      !["contains", "contains-all", "not-contains", "equals"].includes(assertion.type))) {
      fail(`${testCase.description}: expected admitted deterministic output assertions`);
    }
    validateExactKeys(testCase.metadata, new Set(["observations"]), `${testCase.description} metadata`);
    const observations = testCase.metadata.observations;
    validateExactKeys(observations,
      new Set(["capability", "behavioral_oracle", "skill_activation", "required_raw_item_types", "unavailable"]),
      `${testCase.description} observations`);
    validateExactKeys(observations.capability, new Set(["id", "scenario", "case_id"]),
      `${testCase.description} capability binding`);
    if (!/^[A-Z]{3,4}-\d{2}$/.test(observations.capability.id) ||
        !["positive", "negative", "recovery"].includes(observations.capability.scenario) ||
        !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(observations.capability.case_id) ||
        capabilityCaseIds.has(observations.capability.case_id)) {
      fail(`${testCase.description}: invalid or duplicate capability case binding`);
    }
    capabilityCaseIds.add(observations.capability.case_id);
    if (observations.behavioral_oracle !== "deterministic_text") {
      fail(`${testCase.description}: behavioral oracle must be deterministic_text`);
    }
    validateExactKeys(observations.skill_activation, new Set(["status", "expected"]),
      `${testCase.description} skill activation`);
    const expectedActivation = native[0].type === "skill-used" ? "used" : "not_used";
    if (observations.skill_activation.status !== "dynamic_heuristic" ||
        observations.skill_activation.expected !== expectedActivation) {
      fail(`${testCase.description}: Skill activation must bind the dynamic_heuristic expectation`);
    }
    if (!Array.isArray(observations.required_raw_item_types) ||
        observations.required_raw_item_types.some((type) => !replayableRawItemTypes.has(type)) ||
        new Set(observations.required_raw_item_types).size !== observations.required_raw_item_types.length) {
      fail(`${testCase.description}: invalid required raw item types`);
    }
    if (expectedActivation === "used" &&
        !observations.required_raw_item_types.includes("command_execution")) {
      fail(`${testCase.description}: dynamic Skill-use evidence requires command_execution replay`);
    }
    if (!Array.isArray(observations.unavailable) ||
        !observations.unavailable.includes("host_native_skill_route") ||
        observations.unavailable.some((axis) => !allowedUnavailableObservations.has(axis)) ||
        new Set(observations.unavailable).size !== observations.unavailable.length) {
      fail(`${testCase.description}: invalid unavailable observation axes`);
    }
  }
  return descriptions;
}

function validateScenarioDesigns(catalog, design, cases) {
  validateExactKeys(design, new Set(["schema_version", "scenarios"]), "scenario design");
  if (design.schema_version !== 1 || !Array.isArray(design.scenarios)) {
    fail("scenario design identity is invalid");
  }
  if (!Array.isArray(catalog.capabilities) || catalog.capabilities.length !== 39) {
    fail("capability catalog must retain exactly 39 leaves");
  }
  const capabilityIds = new Set();
  for (const capability of catalog.capabilities) {
    if (!/^[A-Z]{3,4}-\d{2}$/.test(capability.id) || capabilityIds.has(capability.id)) {
      fail("capability catalog contains an invalid or duplicate leaf");
    }
    capabilityIds.add(capability.id);
  }

  const scenarios = new Set(["positive", "negative", "recovery"]);
  const observerKinds = new Set([
    "native_thread",
    "fixed_real_consumer",
    "external_authority",
  ]);
  const missingAuthorities = new Set([
    "host_native_provenance",
    "executed_model_effort_provenance",
    "native_role_provenance",
    "fixed_consumer_observer",
    "external_effect_authority",
    "cross_mission_recurrence_authority",
    "provider_complete_attempt_inventory",
    "scenario_consumer_binding",
  ]);
  const observerByMissingAuthority = new Map([
    ["host_native_provenance", "native_thread"],
    ["executed_model_effort_provenance", "native_thread"],
    ["native_role_provenance", "native_thread"],
    ["provider_complete_attempt_inventory", "native_thread"],
    ["fixed_consumer_observer", "fixed_real_consumer"],
    ["scenario_consumer_binding", "fixed_real_consumer"],
    ["external_effect_authority", "external_authority"],
    ["cross_mission_recurrence_authority", "external_authority"],
  ]);
  const slots = new Map();
  const caseIds = new Map();
  const implemented = 0;
  for (const row of design.scenarios) {
    validateExactOptionalKeys(row,
      new Set(["capability_id", "scenario", "case_id", "observer_kind", "authority_status", "missing_authority"]),
      new Set(["executable_suite"]), "scenario design row");
    if (!capabilityIds.has(row.capability_id) || !scenarios.has(row.scenario) ||
        !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(row.case_id) || !observerKinds.has(row.observer_kind)) {
      fail("scenario design row contains an unknown identity");
    }
    const slot = `${row.capability_id}/${row.scenario}`;
    if (slots.has(slot) || caseIds.has(row.case_id)) {
      fail("scenario design contains a duplicate slot or case ID");
    }
    if (row.authority_status !== "authority_unavailable") {
      fail("scenario design authority cannot be self-declared");
    }
    if (!missingAuthorities.has(row.missing_authority)) {
      fail("unavailable scenario design requires one known missing authority");
    }
    if (observerByMissingAuthority.get(row.missing_authority) !== row.observer_kind) {
      fail("scenario observer does not match its missing authority");
    }
    if (row.executable_suite !== undefined && !["golden", "holdout"].includes(row.executable_suite)) {
      fail("scenario design executable suite is invalid");
    }
    slots.set(slot, row);
    caseIds.set(row.case_id, row);
  }

  const expectedCount = capabilityIds.size * scenarios.size;
  if (slots.size !== expectedCount || design.scenarios.length !== expectedCount) {
    fail(`scenario design must contain exactly ${expectedCount} unique leaf/scenario slots`);
  }
  for (const capabilityId of capabilityIds) {
    for (const scenario of scenarios) {
      if (!slots.has(`${capabilityId}/${scenario}`)) {
        fail(`scenario design is missing ${capabilityId}/${scenario}`);
      }
    }
  }
  const boundExecutableCases = new Set();
  for (const { testCase, suite } of cases) {
    const binding = testCase.metadata.observations.capability;
    const row = caseIds.get(binding.case_id);
    if (!row || row.capability_id !== binding.id || row.scenario !== binding.scenario) {
      fail(`${testCase.description}: case binding does not match the canonical scenario design`);
    }
    if (boundExecutableCases.has(binding.case_id)) {
      fail(`${testCase.description}: scenario design has more than one executable case`);
    }
    boundExecutableCases.add(binding.case_id);
    if (row.executable_suite !== suite) {
      fail(`${testCase.description}: executable case suite does not match the scenario design`);
    }
  }
  for (const row of design.scenarios) {
    if (row.executable_suite !== undefined && !boundExecutableCases.has(row.case_id)) {
      fail(`${row.case_id}: scenario design requires one exact executable case`);
    }
  }
  return { designed: expectedCount, implemented, unavailable: expectedCount - implemented };
}

function validateExactKeys(value, expected, label) {
  if (!value || typeof value !== "object" || Array.isArray(value)) fail(`${label}: expected an object`);
  const actual = Object.keys(value).sort();
  const wanted = [...expected].sort();
  if (actual.length !== wanted.length || actual.some((key, index) => key !== wanted[index])) {
    fail(`${label}: expected exact fields ${wanted.join(", ")}`);
  }
}

function validateExactOptionalKeys(value, required, optional, label) {
  if (!value || typeof value !== "object" || Array.isArray(value)) fail(`${label}: expected an object`);
  const actual = new Set(Object.keys(value));
  for (const key of required) if (!actual.has(key)) fail(`${label}: missing field ${key}`);
  for (const key of actual) if (!required.has(key) && !optional.has(key)) fail(`${label}: unknown field ${key}`);
}

function validateMatrix(matrix) {
  if (matrix.schema_version !== 1 || matrix.suite !== "smoke" ||
      !Number.isInteger(matrix.trials_per_cell) || matrix.trials_per_cell < 1) {
    fail("invalid model/effort matrix identity");
  }
  if (!Array.isArray(matrix.cells) || matrix.cells.length === 0) fail("model/effort matrix must contain cells");
  const allowedEfforts = new Set(["minimal", "low", "medium", "high", "xhigh", "max", "ultra"]);
  const identities = new Set();
  for (const cell of matrix.cells) {
    if (typeof cell.model !== "string" || !allowedEfforts.has(cell.effort)) fail("model/effort matrix contains an invalid cell");
    const identity = `${cell.model}/${cell.effort}`;
    if (identities.has(identity)) fail(`duplicate model/effort matrix cell: ${identity}`);
    identities.add(identity);
  }
}

async function rejectCommittedBaselines() {
  let indexed;
  try {
    indexed = execFileSync("git", ["ls-files", "-z", "--cached", "--", "evals/baselines"], {
      cwd: root,
      env: gitAuthorityEnvironment,
      encoding: "buffer",
    });
  } catch {
    fail("evals/baselines index inventory is unavailable");
  }
  if (indexed.length !== 0) fail("evals/baselines must be absent from the index");

  const baselineRoot = path.join(root, "evals", "baselines");
  let metadata;
  try {
    metadata = await lstat(baselineRoot);
  } catch (error) {
    if (error?.code === "ENOENT") return;
    throw error;
  }
  if (!metadata.isDirectory() || metadata.isSymbolicLink()) {
    fail("evals/baselines must be absent or an empty real directory");
  }
  if ((await readdir(baselineRoot)).length !== 0) {
    fail("evals/baselines must not contain material");
  }
}

function scanPublicEvidenceSource(relative, source) {
  for (const pattern of forbiddenPublicEvidence) {
    if (pattern.test(source)) fail(`${relative}: forbidden private evidence matched ${pattern}`);
  }
}

async function scanPublicEvidence(files) {
  for (const relative of files) {
    const source = await readFile(path.join(root, relative), "utf8");
    scanPublicEvidenceSource(relative, source);
  }
}

const packageJson = JSON.parse(await readFile(path.join(root, "package.json"), "utf8"));
const packageLock = JSON.parse(await readFile(path.join(root, "package-lock.json"), "utf8"));
if (packageJson.devDependencies?.promptfoo !== "0.122.0") fail("promptfoo must be pinned to 0.122.0");
const sigstorePins = { "@sigstore/bundle": "5.0.0", "@sigstore/tuf": "5.0.0", "@sigstore/verify": "4.1.2" };
const exactPins = (value) => value && Object.keys(value).length === Object.keys(sigstorePins).length &&
  Object.entries(sigstorePins).every(([name, version]) => value[name] === version);
if (!exactPins(packageJson.dependencies) || !exactPins(packageLock.packages?.[""]?.dependencies)) {
  fail("Sigstore verifier dependencies must remain exact and lock-bound");
}
if (packageJson.engines?.node !== "^22.22.2 || ^24.15.0 || >=26.0.0") {
  fail("Node engine must match the pinned Sigstore runtime support range");
}

const skills = await validateSkills();
const capabilityCatalog = await readUniqueJson("evals/capabilities.json", "capability catalog");
const scenarioDesign = await readUniqueJson("evals/scenarios.json", "scenario design");
const goldenCases = parseYaml(await readFile(path.join(root, "evals/cases/golden.yaml"), "utf8"));
const holdoutCases = parseYaml(await readFile(path.join(root, "evals/cases/holdout.yaml"), "utf8"));
const goldenDescriptions = validatePromptfooCases(goldenCases, {
  file: "evals/cases/golden.yaml",
  suites: new Set(["smoke", "full"]),
});
const holdoutDescriptions = validatePromptfooCases(holdoutCases, {
  file: "evals/cases/holdout.yaml",
  suites: new Set(["holdout"]),
});
if (goldenCases.filter((testCase) => /^\[smoke\]/.test(testCase.description)).length !== 2) {
  fail("evals/cases/golden.yaml: expected exactly two smoke cases");
}
const descriptions = [...goldenDescriptions, ...holdoutDescriptions];
if (new Set(descriptions).size !== descriptions.length) fail("duplicate eval description across corpus files");
const cases = [...goldenCases, ...holdoutCases];
const caseCount = cases.length;
const scenarioCoverage = validateScenarioDesigns(capabilityCatalog, scenarioDesign, [
  ...goldenCases.map((testCase) => ({ testCase, suite: "golden" })),
  ...holdoutCases.map((testCase) => ({ testCase, suite: "holdout" })),
]);
const matrix = JSON.parse(await readFile(path.join(root, "evals/matrix.json"), "utf8"));
validateMatrix(matrix);
await rejectCommittedBaselines();
await scanPublicEvidence([
  "README.md",
  "evals/CONTRACT.md",
  "evals/cases/golden.yaml",
  "evals/cases/holdout.yaml",
  "evals/scenarios.json",
  "evals/matrix.json",
  "evals/promptfooconfig.yaml",
]);

for (const warning of skills.warnings) console.warn(`Warning: ${warning}.`);
console.log(`Validated ${skills.count} Skill, ${caseCount} executable cases, and ${scenarioCoverage.designed} scenario designs ` +
  `(${scenarioCoverage.implemented} implemented authorities, ${scenarioCoverage.unavailable} unavailable); committed baselines are disabled.`);
