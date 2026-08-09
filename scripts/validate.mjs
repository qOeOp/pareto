import { execFileSync } from "node:child_process";
import { lstat, readFile, readdir, stat } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { parse as parseYaml } from "yaml";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const skillRoot = path.join(root, "skills");
const gitAuthorityEnvironment = Object.fromEntries(
  Object.entries(process.env).filter(([name]) => !name.startsWith("GIT_")),
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

function validatePromptfooCases(cases, { file, suites, count }) {
  if (!Array.isArray(cases)) fail(`${file}: cases must be an array`);
  if (count !== undefined && cases.length !== count) fail(`${file}: expected exactly ${count} cases`);
  const descriptions = [];
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
      !["contains", "contains-all", "not-contains"].includes(assertion.type))) {
      fail(`${testCase.description}: expected admitted deterministic output assertions`);
    }
    validateExactKeys(testCase.metadata, new Set(["observations"]), `${testCase.description} metadata`);
    const observations = testCase.metadata.observations;
    validateExactKeys(observations,
      new Set(["behavioral_oracle", "skill_activation", "required_raw_item_types", "unavailable"]),
      `${testCase.description} observations`);
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

function validateExactKeys(value, expected, label) {
  if (!value || typeof value !== "object" || Array.isArray(value)) fail(`${label}: expected an object`);
  const actual = Object.keys(value).sort();
  const wanted = [...expected].sort();
  if (actual.length !== wanted.length || actual.some((key, index) => key !== wanted[index])) {
    fail(`${label}: expected exact fields ${wanted.join(", ")}`);
  }
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
if (packageJson.devDependencies?.promptfoo !== "0.122.0") fail("promptfoo must be pinned to 0.122.0");
if (packageJson.engines?.node !== ">=22.22.0") fail("Node engine must be >=22.22.0");

const skills = await validateSkills();
const goldenCases = parseYaml(await readFile(path.join(root, "evals/cases/golden.yaml"), "utf8"));
const holdoutCases = parseYaml(await readFile(path.join(root, "evals/cases/holdout.yaml"), "utf8"));
const goldenDescriptions = validatePromptfooCases(goldenCases, {
  file: "evals/cases/golden.yaml",
  suites: new Set(["smoke", "full"]),
  count: 16,
});
const holdoutDescriptions = validatePromptfooCases(holdoutCases, {
  file: "evals/cases/holdout.yaml",
  suites: new Set(["holdout"]),
  count: 4,
});
if (goldenCases.filter((testCase) => /^\[smoke\]/.test(testCase.description)).length !== 2) {
  fail("evals/cases/golden.yaml: expected exactly two smoke cases");
}
const descriptions = [...goldenDescriptions, ...holdoutDescriptions];
if (new Set(descriptions).size !== descriptions.length) fail("duplicate eval description across corpus files");
const cases = [...goldenCases, ...holdoutCases];
const caseCount = cases.length;
const matrix = JSON.parse(await readFile(path.join(root, "evals/matrix.json"), "utf8"));
validateMatrix(matrix);
await rejectCommittedBaselines();
await scanPublicEvidence([
  "README.md",
  "evals/CONTRACT.md",
  "evals/cases/golden.yaml",
  "evals/cases/holdout.yaml",
  "evals/matrix.json",
  "evals/promptfooconfig.yaml",
]);

for (const warning of skills.warnings) console.warn(`Warning: ${warning}.`);
console.log(`Validated ${skills.count} Skill and ${caseCount} executable cases; committed baselines are disabled.`);
