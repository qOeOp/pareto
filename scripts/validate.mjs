import { readFile, readdir, stat } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { parse as parseYaml } from "yaml";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const skillRoot = path.join(root, "skills");
const allowedFrontmatter = new Set(["name", "description"]);
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
  const match = source.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);
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
  if (names.length === 0) fail("skills/: expected at least one Skill");
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
    if (body.split("\n").length > 500) {
      warnings.push(`${path.relative(root, file)} exceeds the recommended 500-line authoring target`);
    }
    await validateLinks(body, skillDir, file);
  }
  return { count: names.length, warnings };
}

function validatePromptfooCases(cases) {
  if (!Array.isArray(cases) || cases.length === 0) fail("evals/cases/cases.yaml: expected cases");
  const descriptions = new Set();
  for (const testCase of cases) {
    if (!/^\[(?:smoke|full|holdout)\] /.test(testCase.description ?? "")) {
      fail(`eval case has invalid suite prefix: ${testCase.description ?? "<missing>"}`);
    }
    if (descriptions.has(testCase.description)) fail(`duplicate eval description: ${testCase.description}`);
    descriptions.add(testCase.description);
    if (typeof testCase.vars?.prompt !== "string" || !Array.isArray(testCase.assert) || testCase.assert.length === 0) {
      fail(`${testCase.description}: prompt and assertions are required`);
    }
  }
  return cases.length;
}

function validateWorkflowFamilies(families) {
  const expected = new Set([
    "task-recovery",
    "hub-child-authority",
    "dependency-dag-supersession",
    "evaluator-admission",
    "provider-unavailability-fallback",
    "stale-worktree-bootstrap",
    "exact-head-delivery",
    "coordination-churn",
    "conditional-bdd-tdd-playbook-routing",
  ]);
  const ids = new Set();
  for (const item of families) {
    for (const key of ["case_id", "family", "suite", "prompt", "required", "forbidden"]) {
      if (!(key in item)) fail(`workflow family missing ${key}`);
    }
    if (ids.has(item.case_id)) fail(`duplicate workflow case_id: ${item.case_id}`);
    ids.add(item.case_id);
    expected.delete(item.family);
    if (!["smoke", "full", "holdout"].includes(item.suite)) fail(`${item.case_id}: invalid suite`);
    if (!Array.isArray(item.required) || !Array.isArray(item.forbidden)) fail(`${item.case_id}: invalid oracle lists`);
  }
  if (expected.size > 0) fail(`missing workflow families: ${[...expected].join(", ")}`);
  return families.length;
}

function validateBaseline(baseline) {
  if (baseline.schema_version !== 1 || baseline.suite !== "smoke") fail("invalid smoke baseline identity");
  if (!/^[0-9a-f]{40}$/.test(baseline.candidate?.commit ?? "") ||
      !/^[0-9a-f]{40}$/.test(baseline.candidate?.tree ?? "")) {
    fail("smoke baseline must bind an exact commit and tree");
  }
  if (!Array.isArray(baseline.cells) || baseline.cells.length === 0) fail("smoke baseline must contain matrix cells");
  const statuses = new Set(["completed", "unavailable", "not_run"]);
  for (const cell of baseline.cells) {
    if (typeof cell.model !== "string" || typeof cell.reasoning_effort !== "string" || !statuses.has(cell.status)) {
      fail("smoke baseline contains an invalid cell");
    }
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

async function scanPublicEvidence(files) {
  for (const relative of files) {
    const source = await readFile(path.join(root, relative), "utf8");
    for (const pattern of forbiddenPublicEvidence) {
      if (pattern.test(source)) fail(`${relative}: forbidden private evidence matched ${pattern}`);
    }
  }
}

const packageJson = JSON.parse(await readFile(path.join(root, "package.json"), "utf8"));
if (packageJson.devDependencies?.promptfoo !== "0.122.0") fail("promptfoo must be pinned to 0.122.0");
if (packageJson.engines?.node !== ">=22.22.0") fail("Node engine must be >=22.22.0");

const skills = await validateSkills();
const cases = parseYaml(await readFile(path.join(root, "evals/cases/cases.yaml"), "utf8"));
const caseCount = validatePromptfooCases(cases);
const families = JSON.parse(await readFile(path.join(root, "evals/cases/workflow-families.json"), "utf8"));
const familyCount = validateWorkflowFamilies(families);
const baseline = JSON.parse(await readFile(path.join(root, "evals/baselines/2026-08-06-smoke.json"), "utf8"));
validateBaseline(baseline);
const matrix = JSON.parse(await readFile(path.join(root, "evals/matrix.json"), "utf8"));
validateMatrix(matrix);
await scanPublicEvidence([
  "README.md",
  "evals/CONTRACT.md",
  "evals/baselines/2026-08-06-smoke.json",
  "evals/cases/cases.yaml",
  "evals/cases/workflow-families.json",
  "evals/matrix.json",
  "evals/promptfooconfig.yaml",
]);

for (const warning of skills.warnings) console.warn(`Warning: ${warning}.`);
console.log(`Validated ${skills.count} skills, ${caseCount} executable cases, and ${familyCount} workflow families.`);
