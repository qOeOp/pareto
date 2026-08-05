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
    if (body.split(/\r?\n/).length > 500) {
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

function validateExactKeys(value, expected, label) {
  if (!value || typeof value !== "object" || Array.isArray(value)) fail(`${label}: expected an object`);
  const actual = Object.keys(value).sort();
  const wanted = [...expected].sort();
  if (actual.length !== wanted.length || actual.some((key, index) => key !== wanted[index])) {
    fail(`${label}: expected exact fields ${wanted.join(", ")}`);
  }
}

function validateNonEmptyString(value, label) {
  if (typeof value !== "string" || value.trim().length === 0) fail(`${label}: expected a non-empty string`);
}

function validateNonNegativeNumber(value, label) {
  if (typeof value !== "number" || !Number.isFinite(value) || value < 0) {
    fail(`${label}: expected a finite non-negative number`);
  }
}

function validateUnitNumber(value, label) {
  validateNonNegativeNumber(value, label);
  if (value > 1) fail(`${label}: expected a number no greater than 1`);
}

function validateBaseline(baseline, cases, matrix) {
  const topFields = new Set([
    "schema_version", "suite", "attempted_at", "candidate", "case_ids", "environment", "cells",
    "result", "claims", "raw_result_committed",
  ]);
  validateExactKeys(baseline, topFields, "smoke baseline");
  if (baseline.schema_version !== 1 || baseline.suite !== "smoke") fail("invalid smoke baseline identity");
  if (typeof baseline.attempted_at !== "string" ||
      !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?(?:Z|[+-]\d{2}:\d{2})$/.test(baseline.attempted_at) ||
      Number.isNaN(Date.parse(baseline.attempted_at))) {
    fail("smoke baseline attempted_at must be an ISO timestamp");
  }

  validateExactKeys(baseline.candidate, new Set(["commit", "tree", "skill_sha256"]), "smoke baseline candidate");
  if (!/^[0-9a-f]{40}$/.test(baseline.candidate.commit) || !/^[0-9a-f]{40}$/.test(baseline.candidate.tree)) {
    fail("smoke baseline must bind an exact commit and tree");
  }
  if (!baseline.candidate.skill_sha256 || typeof baseline.candidate.skill_sha256 !== "object" ||
      Array.isArray(baseline.candidate.skill_sha256)) {
    fail("smoke baseline Skill digests: expected an object");
  }
  const skillDigests = Object.entries(baseline.candidate.skill_sha256);
  if (skillDigests.length === 0 || skillDigests.some(([name, digest]) =>
    !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(name) || !/^[0-9a-f]{64}$/.test(digest))) {
    fail("smoke baseline must contain named SHA-256 Skill digests");
  }

  const expectedCaseIds = cases
    .filter((testCase) => /^\[smoke\]/.test(testCase.description))
    .map((testCase) => testCase.description);
  if (!Array.isArray(baseline.case_ids) || baseline.case_ids.length !== expectedCaseIds.length ||
      baseline.case_ids.some((caseId, index) => caseId !== expectedCaseIds[index])) {
    fail("smoke baseline case_ids must exactly match the smoke cases");
  }

  validateExactKeys(baseline.environment, new Set(["node", "npm", "promptfoo", "skills_cli"]),
    "smoke baseline environment");
  for (const [name, version] of Object.entries(baseline.environment)) {
    validateNonEmptyString(version, `smoke baseline environment.${name}`);
  }
  if (!Array.isArray(baseline.claims) || baseline.claims.length === 0 ||
      baseline.claims.some((claim) => typeof claim !== "string" || claim.trim().length === 0)) {
    fail("smoke baseline claims must be non-empty strings");
  }
  if (baseline.raw_result_committed !== false) fail("smoke baseline must not commit raw provider results");

  if (!Array.isArray(baseline.cells) || baseline.cells.length !== matrix.cells.length) {
    fail("smoke baseline cells must exactly match the model/effort matrix");
  }
  const commonFields = [
    "provider", "model", "reasoning_effort", "planned_trials", "completed_trials", "errored_trials", "status",
  ];
  const evidenceFields = [
    "quality", "elapsed_ms", "input_tokens", "output_tokens", "cached_input_tokens", "reasoning_tokens", "cost",
  ];
  const completedFields = new Set([...commonFields, ...evidenceFields]);
  const unavailableFields = new Set([...commonFields, "reason", ...evidenceFields]);
  const plannedTrials = expectedCaseIds.length * matrix.trials_per_cell;

  for (const [index, cell] of baseline.cells.entries()) {
    const expectedMatrixCell = matrix.cells[index];
    if (cell.model !== expectedMatrixCell.model || cell.reasoning_effort !== expectedMatrixCell.effort) {
      fail(`smoke baseline cell ${index}: model/effort must match the matrix`);
    }
    validateNonEmptyString(cell.provider, `smoke baseline cell ${index}.provider`);
    if (cell.planned_trials !== plannedTrials || !Number.isInteger(cell.completed_trials) ||
        !Number.isInteger(cell.errored_trials)) {
      fail(`smoke baseline cell ${index}: invalid trial counts`);
    }

    if (cell.status === "completed") {
      validateExactKeys(cell, completedFields, `smoke baseline completed cell ${index}`);
      if (cell.completed_trials !== plannedTrials || cell.errored_trials !== 0) {
        fail(`smoke baseline completed cell ${index}: every planned trial must complete without error`);
      }
      validateExactKeys(cell.quality,
        new Set(["passed", "assertion_score", "rubric_score", "pass_rate", "mean", "median", "p95", "variance"]),
        `smoke baseline completed cell ${index}.quality`);
      if (typeof cell.quality.passed !== "boolean") {
        fail(`smoke baseline completed cell ${index}.quality.passed: expected a boolean`);
      }
      for (const field of ["assertion_score", "pass_rate", "mean", "median", "p95"]) {
        validateUnitNumber(cell.quality[field], `smoke baseline completed cell ${index}.quality.${field}`);
      }
      if (cell.quality.rubric_score !== "unavailable") {
        validateUnitNumber(cell.quality.rubric_score,
          `smoke baseline completed cell ${index}.quality.rubric_score`);
      }
      validateNonNegativeNumber(cell.quality.variance,
        `smoke baseline completed cell ${index}.quality.variance`);
      if (cell.quality.passed !== (cell.quality.pass_rate === 1)) {
        fail(`smoke baseline completed cell ${index}: passed must agree with pass_rate`);
      }
      validateNonNegativeNumber(cell.elapsed_ms, `smoke baseline completed cell ${index}.elapsed_ms`);
      for (const field of ["input_tokens", "output_tokens", "cached_input_tokens", "reasoning_tokens"]) {
        if (!Number.isInteger(cell[field]) || cell[field] < 0) {
          fail(`smoke baseline completed cell ${index}.${field}: expected a non-negative integer`);
        }
      }
      if (cell.cost !== "unavailable") {
        validateNonNegativeNumber(cell.cost, `smoke baseline completed cell ${index}.cost`);
      }
      continue;
    }

    if (cell.status === "unavailable" || cell.status === "not_run") {
      validateExactKeys(cell, unavailableFields, `smoke baseline ${cell.status} cell ${index}`);
      validateNonEmptyString(cell.reason, `smoke baseline ${cell.status} cell ${index}.reason`);
      const expectedErrors = cell.status === "unavailable" ? plannedTrials : 0;
      if (cell.completed_trials !== 0 || cell.errored_trials !== expectedErrors) {
        fail(`smoke baseline ${cell.status} cell ${index}: trial counts contradict status`);
      }
      for (const field of evidenceFields) {
        if (cell[field] !== "unavailable") {
          fail(`smoke baseline ${cell.status} cell ${index}.${field}: expected unavailable`);
        }
      }
      continue;
    }
    fail(`smoke baseline cell ${index}: invalid status`);
  }

  const allCompleted = baseline.cells.every((cell) => cell.status === "completed");
  const hasUnavailable = baseline.cells.some((cell) => cell.status === "unavailable");
  if ((allCompleted && baseline.result !== "completed") ||
      (!allCompleted && (!hasUnavailable || baseline.result !== "unavailable"))) {
    fail("smoke baseline result contradicts cell statuses");
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
const matrix = JSON.parse(await readFile(path.join(root, "evals/matrix.json"), "utf8"));
validateMatrix(matrix);
const baseline = JSON.parse(await readFile(path.join(root, "evals/baselines/2026-08-06-smoke.json"), "utf8"));
validateBaseline(baseline, cases, matrix);
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
