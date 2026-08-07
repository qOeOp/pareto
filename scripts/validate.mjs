import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import { readFile, readdir, stat } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { parse as parseYaml } from "yaml";
import { rejectDuplicateJsonObjectMembers } from "./json.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const skillRoot = path.join(root, "skills");
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
  if (!Array.isArray(cases) || cases.length !== count) fail(`${file}: expected exactly ${count} cases`);
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

function gitBytes(args, label) {
  try {
    return execFileSync("git", args, { cwd: root, encoding: "buffer", maxBuffer: 16 * 1024 * 1024 });
  } catch {
    fail(`${label}: Git object is unavailable`);
  }
}

function gitText(args, label) {
  return gitBytes(args, label).toString("utf8").trim();
}

function gitIsAncestor(ancestor, descendant) {
  try {
    execFileSync("git", ["merge-base", "--is-ancestor", ancestor, descendant], {
      cwd: root,
      stdio: "ignore",
    });
    return true;
  } catch {
    return false;
  }
}

function validateBaselineProvenance(candidate, attemptedAt) {
  if (gitText(["cat-file", "-t", candidate.commit], "smoke baseline candidate commit") !== "commit") {
    fail("smoke baseline candidate must resolve to a commit");
  }
  if (!gitIsAncestor(candidate.commit, "HEAD")) {
    fail("smoke baseline candidate commit must be an ancestor of the current HEAD");
  }
  const candidateTime = Number(gitText(["show", "-s", "--format=%ct", candidate.commit],
    "smoke baseline candidate time"));
  if (!Number.isInteger(candidateTime) || candidateTime * 1000 > Date.parse(attemptedAt)) {
    fail("smoke baseline candidate commit time must not be later than attempted_at");
  }
  const historicalTree = gitText(["show", "-s", "--format=%T", candidate.commit],
    "smoke baseline candidate tree");
  if (historicalTree !== candidate.tree) fail("smoke baseline candidate tree does not match its commit");
  const historicalSkillsTree = gitText(["rev-parse", `${candidate.commit}:skills`],
    "smoke baseline historical Skills tree");
  if (historicalSkillsTree !== candidate.skills_tree_oid) {
    fail("smoke baseline Skills tree does not match the historical candidate");
  }

  const config = candidate.promptfoo_config;
  const historicalConfigOid = gitText(["rev-parse", `${candidate.commit}:${config.path}`],
    "smoke baseline historical Promptfoo config");
  if (historicalConfigOid !== config.blob_oid) {
    fail("smoke baseline Promptfoo config blob does not match the historical candidate");
  }
  const historicalConfigBytes = gitBytes(["cat-file", "blob", historicalConfigOid],
    "smoke baseline historical Promptfoo config blob");
  const historicalConfigDigest = createHash("sha256").update(historicalConfigBytes).digest("hex");
  if (historicalConfigDigest !== config.sha256) {
    fail("smoke baseline Promptfoo config digest does not match the historical blob");
  }
  let historicalPromptfooConfig;
  try {
    historicalPromptfooConfig = parseYaml(historicalConfigBytes.toString("utf8"));
  } catch {
    fail("smoke baseline historical Promptfoo config must be valid YAML");
  }
  if (!Array.isArray(historicalPromptfooConfig?.providers) || historicalPromptfooConfig.providers.length !== 1 ||
      typeof historicalPromptfooConfig.providers[0]?.id !== "string" ||
      historicalPromptfooConfig.providers[0].id.length === 0) {
    fail("smoke baseline historical Promptfoo config must declare exactly one provider");
  }
  const historicalProvider = historicalPromptfooConfig.providers[0].id;
  if (historicalProvider !== config.provider) {
    fail("smoke baseline Promptfoo provider does not match the historical config blob");
  }

  const historicalSkillNames = gitText(["ls-tree", "-r", "--name-only", `${candidate.commit}:skills`],
    "smoke baseline historical Skills")
    .split("\n")
    .filter((name) => /^[^/]+\/SKILL\.md$/.test(name))
    .map((name) => name.slice(0, -"/SKILL.md".length))
    .sort();
  const declaredSkillNames = Object.keys(candidate.skill_sha256).sort();
  if (historicalSkillNames.length !== declaredSkillNames.length ||
      historicalSkillNames.some((name, position) => name !== declaredSkillNames[position])) {
    fail("smoke baseline Skill digest names do not match the historical candidate");
  }
  for (const name of declaredSkillNames) {
    const bytes = gitBytes(["cat-file", "blob", `${candidate.commit}:skills/${name}/SKILL.md`],
      `smoke baseline historical Skill ${name}`);
    const digest = createHash("sha256").update(bytes).digest("hex");
    if (digest !== candidate.skill_sha256[name]) {
      fail(`smoke baseline Skill digest does not match historical ${name}/SKILL.md`);
    }
  }
  return historicalProvider;
}

function readHistoricalBaselineInputs(candidateCommit) {
  const goldenSource = gitBytes(["cat-file", "blob", `${candidateCommit}:evals/cases/golden.yaml`],
    "smoke baseline historical golden cases");
  const matrixSource = gitBytes(["cat-file", "blob", `${candidateCommit}:evals/matrix.json`],
    "smoke baseline historical model/effort matrix");
  let goldenCases;
  let matrix;
  try {
    goldenCases = parseYaml(goldenSource.toString("utf8"));
  } catch {
    fail("smoke baseline historical golden cases must be valid YAML");
  }
  try {
    matrix = JSON.parse(matrixSource.toString("utf8"));
  } catch {
    fail("smoke baseline historical model/effort matrix must be valid JSON");
  }
  validatePromptfooCases(goldenCases, {
    file: "smoke baseline historical golden cases",
    suites: new Set(["smoke", "full"]),
    count: 15,
  });
  if (goldenCases.filter((testCase) => /^\[smoke\]/.test(testCase.description)).length !== 2) {
    fail("smoke baseline historical golden cases: expected exactly two smoke cases");
  }
  validateMatrix(matrix);
  return { goldenCases, matrix };
}

function validateBaseline(baseline, filename) {
  const topFields = new Set([
    "schema_version", "suite", "attempted_at", "candidate", "case_ids", "environment", "cells",
    "result", "raw_result_committed",
  ]);
  validateExactKeys(baseline, topFields, "smoke baseline");
  if (baseline.schema_version !== 1 || baseline.suite !== "smoke") fail("invalid smoke baseline identity");
  if (typeof baseline.attempted_at !== "string" ||
      !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?(?:Z|[+-]\d{2}:\d{2})$/.test(baseline.attempted_at) ||
      Number.isNaN(Date.parse(baseline.attempted_at))) {
    fail("smoke baseline attempted_at must be an ISO timestamp");
  }
  if (filename.slice(0, 10) !== new Date(Date.parse(baseline.attempted_at)).toISOString().slice(0, 10)) {
    fail("smoke baseline filename date must match attempted_at UTC date");
  }

  validateExactKeys(baseline.candidate,
    new Set(["commit", "tree", "skills_tree_oid", "skill_sha256", "promptfoo_config"]),
    "smoke baseline candidate");
  if (!/^[0-9a-f]{40}$/.test(baseline.candidate.commit) ||
      !/^[0-9a-f]{40}$/.test(baseline.candidate.tree) ||
      !/^[0-9a-f]{40}$/.test(baseline.candidate.skills_tree_oid)) {
    fail("smoke baseline must bind an exact commit, tree, and Skills tree");
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
  validateExactKeys(baseline.candidate.promptfoo_config,
    new Set(["path", "blob_oid", "sha256", "provider"]), "smoke baseline Promptfoo config");
  if (baseline.candidate.promptfoo_config.path !== "evals/promptfooconfig.yaml" ||
      !/^[0-9a-f]{40}$/.test(baseline.candidate.promptfoo_config.blob_oid) ||
      !/^[0-9a-f]{64}$/.test(baseline.candidate.promptfoo_config.sha256)) {
    fail("smoke baseline must bind the exact historical Promptfoo config path, blob, and SHA-256 digest");
  }
  validateNonEmptyString(baseline.candidate.promptfoo_config.provider,
    "smoke baseline Promptfoo config provider");
  const historicalProvider = validateBaselineProvenance(baseline.candidate, baseline.attempted_at);
  const { goldenCases, matrix } = readHistoricalBaselineInputs(baseline.candidate.commit);

  const smokeCases = goldenCases.filter((testCase) => /^\[smoke\]/.test(testCase.description));
  const expectedCaseIds = smokeCases.map((testCase) => testCase.description);
  if (!Array.isArray(baseline.case_ids) || baseline.case_ids.length !== expectedCaseIds.length ||
      baseline.case_ids.some((caseId, index) => caseId !== expectedCaseIds[index])) {
    fail("smoke baseline case_ids must exactly match the smoke cases");
  }

  validateExactKeys(baseline.environment, new Set(["node", "npm", "promptfoo", "skills_cli"]),
    "smoke baseline environment");
  for (const [name, version] of Object.entries(baseline.environment)) {
    validateNonEmptyString(version, `smoke baseline environment.${name}`);
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
  const expectedAssertions = smokeCases.reduce((total, testCase) => total + testCase.assert.length, 0) *
    matrix.trials_per_cell;

  for (const [index, cell] of baseline.cells.entries()) {
    const expectedMatrixCell = matrix.cells[index];
    if (cell.model !== expectedMatrixCell.model || cell.reasoning_effort !== expectedMatrixCell.effort) {
      fail(`smoke baseline cell ${index}: model/effort must match the matrix`);
    }
    if (cell.provider !== historicalProvider) {
      fail(`smoke baseline cell ${index}.provider must match the historical Promptfoo provider`);
    }
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
        new Set([
          "passed", "passed_trials", "total_assertions", "passed_assertions", "assertion_score", "rubric_score",
          "pass_rate", "mean", "median", "p95", "variance",
        ]),
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
      if (cell.quality.variance > 0.25) {
        fail(`smoke baseline completed cell ${index}.quality.variance: expected a number no greater than 0.25`);
      }
      if (!Number.isInteger(cell.quality.passed_trials) || cell.quality.passed_trials < 0 ||
          cell.quality.passed_trials > cell.completed_trials) {
        fail(`smoke baseline completed cell ${index}.quality.passed_trials: invalid pass count`);
      }
      if (cell.quality.pass_rate !== cell.quality.passed_trials / cell.completed_trials) {
        fail(`smoke baseline completed cell ${index}: pass_rate contradicts trial counts`);
      }
      if (!Number.isInteger(cell.quality.total_assertions) || cell.quality.total_assertions < 1 ||
          !Number.isInteger(cell.quality.passed_assertions) || cell.quality.passed_assertions < 0 ||
          cell.quality.passed_assertions > cell.quality.total_assertions) {
        fail(`smoke baseline completed cell ${index}: invalid assertion counts`);
      }
      if (cell.quality.total_assertions !== expectedAssertions) {
        fail(`smoke baseline completed cell ${index}: total_assertions must match the smoke assertion inventory`);
      }
      if (cell.quality.assertion_score !== cell.quality.passed_assertions / cell.quality.total_assertions) {
        fail(`smoke baseline completed cell ${index}: assertion_score contradicts assertion counts`);
      }
      const allTrialsPassed = cell.quality.passed_trials === cell.completed_trials;
      const allAssertionsPassed = cell.quality.passed_assertions === cell.quality.total_assertions;
      if (cell.quality.passed !== allTrialsPassed || allTrialsPassed !== allAssertionsPassed) {
        fail(`smoke baseline completed cell ${index}: assertion and pass evidence contradict trial counts`);
      }
      if (cell.quality.median > cell.quality.p95) {
        fail(`smoke baseline completed cell ${index}: median must not exceed p95`);
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

function validateBaselineWorkspaceDrift() {
  try {
    execFileSync("git", ["diff", "--quiet", "HEAD", "--", "evals/baselines"], {
      cwd: root,
      stdio: "ignore",
    });
  } catch {
    fail("evals/baselines must match the exact HEAD tree");
  }
  const untracked = gitText(["ls-files", "--others", "--exclude-standard", "--", "evals/baselines"],
    "evals/baselines untracked inventory");
  if (untracked !== "") {
    fail("evals/baselines must not contain untracked material");
  }
}

function readHeadBaselineEntries() {
  const listing = gitBytes(["ls-tree", "-rz", "HEAD", "--", "evals/baselines"],
    "committed smoke baseline inventory");
  const entries = [];
  for (const record of listing.toString("binary").split("\0").filter(Boolean)) {
    const tab = record.indexOf("\t");
    const header = record.slice(0, tab);
    const relative = Buffer.from(record.slice(tab + 1), "binary").toString("utf8");
    const match = /^(\d+) (blob) ([0-9a-f]{40})$/.exec(header);
    if (tab === -1 || !match || match[1] !== "100644" ||
        !/^evals\/baselines\/\d{4}-\d{2}-\d{2}-smoke\.json$/.test(relative)) {
      fail(`committed smoke baseline inventory contains an unsupported entry: ${relative}`);
    }
    entries.push({ relative, filename: path.basename(relative), oid: match[3] });
  }
  entries.sort((left, right) => left.relative.localeCompare(right.relative));
  for (const [index, entry] of entries.entries()) {
    if (entries[index - 1]?.relative === entry.relative) {
      fail(`committed smoke baseline inventory repeats ${entry.relative}`);
    }
  }
  return entries;
}

function validateCommittedBaselines() {
  validateBaselineWorkspaceDrift();
  const baselines = [];
  for (const entry of readHeadBaselineEntries()) {
    const source = gitBytes(["cat-file", "blob", entry.oid], `${entry.relative} committed baseline blob`).toString("utf8");
    rejectDuplicateJsonObjectMembers(source, "smoke baseline");
    validateBaseline(JSON.parse(source), entry.filename);
    baselines.push(entry.relative);
  }
  return baselines;
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

function scanCommittedBaselineEvidence(baselines) {
  for (const relative of baselines) {
    const source = gitBytes(["show", `HEAD:${relative}`], `${relative} committed baseline blob`).toString("utf8");
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
  count: 15,
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
const baselines = validateCommittedBaselines();
await scanPublicEvidence([
  "README.md",
  "evals/CONTRACT.md",
  "evals/cases/golden.yaml",
  "evals/cases/holdout.yaml",
  "evals/matrix.json",
  "evals/promptfooconfig.yaml",
]);
scanCommittedBaselineEvidence(baselines);

for (const warning of skills.warnings) console.warn(`Warning: ${warning}.`);
console.log(`Validated ${skills.count} Skill, ${caseCount} executable cases, and ${baselines.length} committed smoke baselines.`);
