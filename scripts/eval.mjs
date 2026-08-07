import { createHash } from "node:crypto";
import { execFile, spawn } from "node:child_process";
import { chmod, lstat, mkdir, mkdtemp, readFile, realpath, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { isDeepStrictEqual, promisify } from "node:util";
import { fileURLToPath, pathToFileURL } from "node:url";
import { assertions } from "promptfoo";
import { parse as parseYaml, stringify as stringifyYaml } from "yaml";
import { rejectDuplicateJsonObjectMembers } from "./json.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const patterns = {
  smoke: "^\\[smoke\\]",
  full: "^\\[(?:smoke|full)\\]",
  holdout: "^\\[holdout\\]",
};
const repeats = { smoke: 1, full: 2, holdout: 3 };
const caseFiles = {
  smoke: "golden.yaml",
  full: "golden.yaml",
  holdout: "holdout.yaml",
};
const repositoryInstructions = `# Evaluation repository rules

Use the installed run-bounded-mission Skill for every non-trivial implementation or delivery task.
Do not invoke it for answer-only, explanation, audit-only, diagnosis-only, mechanical, routine status,
or task-management requests unless the user explicitly invokes it.
`;
const execFileAsync = promisify(execFile);
export const CANONICAL_PROVIDER_ID = "openai:codex-sdk";
const providerFields = ["config", "id", "label"];
const providerConfigFields = [
  "approval_policy",
  "enable_streaming",
  "inherit_process_env",
  "model",
  "model_reasoning_effort",
  "network_access_enabled",
  "sandbox_mode",
  "web_search_enabled",
  "working_dir",
];
const providerSafetyConfig = {
  sandbox_mode: "read-only",
  approval_policy: "never",
  network_access_enabled: false,
  web_search_enabled: false,
  enable_streaming: true,
  inherit_process_env: false,
};
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

function sha256(bytes) {
  return createHash("sha256").update(bytes).digest("hex");
}

async function gitText(repositoryRoot, args) {
  const { stdout } = await execFileAsync("git", ["-C", repositoryRoot, ...args], {
    encoding: "utf8",
    maxBuffer: 1024 * 1024,
  });
  return stdout.trim();
}

async function gitBytes(repositoryRoot, args) {
  const { stdout } = await execFileAsync("git", ["-C", repositoryRoot, ...args], {
    encoding: null,
    maxBuffer: 16 * 1024 * 1024,
  });
  return stdout;
}

function hasExactFields(value, fields) {
  return value && typeof value === "object" && !Array.isArray(value) &&
    isDeepStrictEqual(Object.keys(value).sort(), [...fields].sort());
}

function exactInvocationValue(value, label) {
  if (typeof value !== "string" || value.length === 0 || value.trim() !== value || /[\0\r\n]/.test(value)) {
    throw new Error(`Promptfoo ${label} must be one exact non-empty value`);
  }
  return value;
}

export function preparePromptfooConfig(config, { model, effort, workingDirectory }) {
  if (!Array.isArray(config?.providers) || config.providers.length !== 1) {
    throw new Error("Promptfoo config must contain exactly one provider before evaluation");
  }
  const sourceProvider = config.providers[0];
  if (!hasExactFields(sourceProvider, providerFields) || sourceProvider.id !== CANONICAL_PROVIDER_ID) {
    throw new Error(`Promptfoo config must contain only the canonical provider ${CANONICAL_PROVIDER_ID}`);
  }
  if (!hasExactFields(sourceProvider.config, providerConfigFields)) {
    throw new Error("Promptfoo provider config must contain the exact supported fields");
  }
  for (const [field, expected] of Object.entries(providerSafetyConfig)) {
    if (sourceProvider.config[field] !== expected) {
      throw new Error(`Promptfoo provider config ${field} must remain ${JSON.stringify(expected)}`);
    }
  }

  const exactModel = exactInvocationValue(model, "model");
  const exactEffort = exactInvocationValue(effort, "reasoning effort");
  if (typeof workingDirectory !== "string" || !path.isAbsolute(workingDirectory) ||
      path.resolve(workingDirectory) !== workingDirectory) {
    throw new Error("Promptfoo working directory must be one canonical absolute path");
  }

  const prepared = structuredClone(config);
  const provider = prepared.providers[0];
  provider.label = `${exactModel}/${exactEffort}`;
  provider.config = {
    model: exactModel,
    model_reasoning_effort: exactEffort,
    working_dir: workingDirectory,
    ...providerSafetyConfig,
  };
  if (!hasExactFields(provider, providerFields) || !hasExactFields(provider.config, providerConfigFields) ||
      provider.id !== CANONICAL_PROVIDER_ID) {
    throw new Error("Prepared Promptfoo provider configuration is not exact");
  }
  return { config: prepared, providerId: CANONICAL_PROVIDER_ID };
}

export async function materializeSkillsFromGit(repositoryRoot, commit, destination) {
  const exactCommit = await gitText(repositoryRoot, ["rev-parse", `${commit}^{commit}`]);
  if (!/^(?:[0-9a-f]{40}|[0-9a-f]{64})$/.test(exactCommit)) {
    throw new Error("Skill snapshot commit is not an exact Git object");
  }
  const listing = await gitBytes(repositoryRoot, ["ls-tree", "-rz", `${exactCommit}:skills`]);
  let decodedListing;
  try {
    decodedListing = new TextDecoder("utf-8", { fatal: true }).decode(listing);
  } catch {
    throw new Error("Skill snapshot tree paths must be valid UTF-8");
  }
  const entries = decodedListing.split("\0").filter(Boolean);
  if (entries.length === 0) throw new Error("Skill snapshot tree is empty");
  try {
    await lstat(destination);
    throw new Error("Skill snapshot destination must not already exist");
  } catch (error) {
    if (error?.code !== "ENOENT") throw error;
  }
  const destinationRoot = path.resolve(destination);
  const windowsDestinationRoot = path.win32.resolve("C:\\agent-skill-eval");
  const seen = new Set();
  const seenNormalized = new Set();
  const seenWindowsTargets = new Set();

  const materializedEntries = entries.map((entry) => {
    const match = /^(100644|100755) blob ([0-9a-f]{40}|[0-9a-f]{64})\t(.+)$/.exec(entry);
    if (!match) throw new Error(`Skill snapshot contains an unsupported Git entry: ${entry}`);
    const [, mode, oid, gitPath] = match;
    const segments = gitPath.split("/");
    const normalizedPath = gitPath.normalize("NFC");
    if (segments.some((segment) => segment === "" || segment === "." || segment === "..") ||
        seen.has(gitPath) || seenNormalized.has(normalizedPath)) {
      throw new Error(`Skill snapshot contains an unsafe or duplicate path: ${gitPath}`);
    }
    seen.add(gitPath);
    seenNormalized.add(normalizedPath);
    const target = path.resolve(destinationRoot, ...segments);
    if (!target.startsWith(`${destinationRoot}${path.sep}`)) {
      throw new Error(`Skill snapshot path escapes its destination: ${gitPath}`);
    }
    const windowsTarget = path.win32.resolve(windowsDestinationRoot, ...segments);
    const windowsRelative = path.win32.relative(windowsDestinationRoot, windowsTarget);
    const windowsTargetKey = windowsTarget.normalize("NFC").toLowerCase();
    if (windowsRelative === "" || windowsRelative === ".." || windowsRelative.startsWith(`..${path.win32.sep}`) ||
        path.win32.isAbsolute(windowsRelative) || seenWindowsTargets.has(windowsTargetKey)) {
      throw new Error(`Skill snapshot contains a Windows platform path collision: ${gitPath}`);
    }
    seenWindowsTargets.add(windowsTargetKey);
    return { mode, oid, gitPath, target };
  });

  await mkdir(destination, { recursive: true });
  for (const { mode, oid, target } of materializedEntries) {
    await mkdir(path.dirname(target), { recursive: true });
    await writeFile(target, await gitBytes(repositoryRoot, ["cat-file", "blob", oid]));
    await chmod(target, mode === "100755" ? 0o755 : 0o644);
  }

  return {
    commit: exactCommit,
    files: entries.length,
    skills_tree_oid: await gitText(repositoryRoot, ["rev-parse", `${exactCommit}:skills`]),
  };
}

export async function readHoldoutIdentity(repositoryRoot = root) {
  let discoveredRoot;
  try {
    discoveredRoot = await gitText(repositoryRoot, ["rev-parse", "--show-toplevel"]);
  } catch {
    throw new Error("holdout requires a Git repository at a frozen commit");
  }
  if (await realpath(discoveredRoot) !== await realpath(repositoryRoot)) {
    throw new Error("holdout repository root does not match the evaluation repository");
  }
  const status = await gitText(repositoryRoot, ["status", "--porcelain=v1", "--untracked-files=all"]);
  if (status !== "") throw new Error("holdout requires a clean tracked and untracked worktree");

  const [commit, tree, skillsTree, matrixBytes] = await Promise.all([
    gitText(repositoryRoot, ["rev-parse", "HEAD"]),
    gitText(repositoryRoot, ["rev-parse", "HEAD^{tree}"]),
    gitText(repositoryRoot, ["rev-parse", "HEAD:skills"]),
    readFile(path.join(repositoryRoot, "evals", "matrix.json")),
  ]);
  for (const [label, value] of Object.entries({ commit, tree, skillsTree })) {
    if (!/^[0-9a-f]{40}$/.test(value)) throw new Error(`holdout ${label} is not an exact Git object`);
  }
  return {
    commit,
    tree,
    skills_tree_oid: skillsTree,
    matrix_sha256: sha256(matrixBytes),
  };
}

function expectedCaseTrials(cases, suite, repeat) {
  const pattern = new RegExp(patterns[suite]);
  return cases
    .filter((testCase) => pattern.test(testCase.description ?? ""))
    .flatMap((testCase) => Array.from({ length: repeat }, () => testCase))
    .sort((left, right) => left.description.localeCompare(right.description));
}

function validateCodexRawItem(item, rowIndex) {
  if (!item || typeof item !== "object" || Array.isArray(item) ||
      typeof item.id !== "string" || item.id.length === 0 || !replayableRawItemTypes.has(item.type)) {
    throw new Error(`Promptfoo result row ${rowIndex} response.raw contains an unknown or malformed item`);
  }
  if (item.type === "command_execution") {
    if (!hasExactFields(item, ["id", "type", "command", "aggregated_output", "exit_code", "status"]) ||
        typeof item.command !== "string" || typeof item.aggregated_output !== "string" ||
        !Number.isInteger(item.exit_code) ||
        !((item.status === "completed" && item.exit_code === 0) ||
          (item.status === "failed" && item.exit_code !== 0))) {
      throw new Error(`Promptfoo result row ${rowIndex} response.raw contains a partial command_execution`);
    }
    return;
  }
  if (item.type === "file_change") {
    if (!hasExactFields(item, ["id", "type", "changes", "status"]) ||
        !["completed", "failed"].includes(item.status) || !Array.isArray(item.changes) ||
        item.changes.some((change) => !hasExactFields(change, ["path", "kind"]) ||
          typeof change.path !== "string" || !["add", "delete", "update"].includes(change.kind))) {
      throw new Error(`Promptfoo result row ${rowIndex} response.raw contains a partial file_change`);
    }
    return;
  }
  if (item.type === "mcp_tool_call") {
    const fields = Object.keys(item);
    const allowed = new Set(["id", "type", "server", "tool", "arguments", "result", "error", "status"]);
    if (fields.some((field) => !allowed.has(field)) ||
        !["id", "type", "server", "tool", "arguments", "status"].every((field) => fields.includes(field)) ||
        typeof item.server !== "string" || typeof item.tool !== "string" ||
        !["completed", "failed"].includes(item.status) ||
        (item.status === "completed" && item.error !== undefined) ||
        (item.status === "failed" && (!hasExactFields(item.error, ["message"]) ||
          typeof item.error.message !== "string" || item.result !== undefined))) {
      throw new Error(`Promptfoo result row ${rowIndex} response.raw contains a partial mcp_tool_call`);
    }
    return;
  }
  const scalarSchemas = {
    agent_message: ["text"],
    reasoning: ["text"],
    web_search: ["query"],
    error: ["message"],
  };
  if (item.type in scalarSchemas) {
    const field = scalarSchemas[item.type][0];
    if (!hasExactFields(item, ["id", "type", field]) || typeof item[field] !== "string") {
      throw new Error(`Promptfoo result row ${rowIndex} response.raw contains a partial ${item.type}`);
    }
    return;
  }
  if (!hasExactFields(item, ["id", "type", "items"]) || !Array.isArray(item.items) ||
      item.items.some((todo) => !hasExactFields(todo, ["text", "completed"]) ||
        typeof todo.text !== "string" || typeof todo.completed !== "boolean")) {
    throw new Error(`Promptfoo result row ${rowIndex} response.raw contains a partial todo_list`);
  }
}

function parseCodexRawItems(raw, output, rowIndex) {
  if (typeof raw !== "string") {
    throw new Error(`Promptfoo result row ${rowIndex} is missing the Codex raw turn receipt`);
  }
  rejectDuplicateJsonObjectMembers(raw, `Promptfoo result row ${rowIndex} response.raw`);
  let turn;
  try {
    turn = JSON.parse(raw);
  } catch {
    throw new Error(`Promptfoo result row ${rowIndex} response.raw must be parseable JSON`);
  }
  if (!hasExactFields(turn,
    ["finalResponse", "items", "usage", "reasoningTexts", "conversationMessages"]) ||
      typeof turn.finalResponse !== "string" || turn.finalResponse !== output || !Array.isArray(turn.items) ||
      !hasExactFields(turn.usage,
        ["input_tokens", "cached_input_tokens", "output_tokens", "reasoning_output_tokens"]) ||
      Object.values(turn.usage).some((value) => !Number.isInteger(value) || value < 0) ||
      !Array.isArray(turn.reasoningTexts) || turn.reasoningTexts.some((text) => typeof text !== "string") ||
      !Array.isArray(turn.conversationMessages) || turn.conversationMessages.length < 2 ||
      turn.conversationMessages.some((message) => !hasExactFields(message, ["role", "content"]) ||
        !["user", "assistant"].includes(message.role) || typeof message.content !== "string") ||
      turn.conversationMessages[0].role !== "user" ||
      turn.conversationMessages.at(-1).role !== "assistant" ||
      turn.conversationMessages.at(-1).content !== output) {
    throw new Error(`Promptfoo result row ${rowIndex} response.raw is not an exact completed Codex turn`);
  }
  const ids = new Set();
  for (const item of turn.items) {
    validateCodexRawItem(item, rowIndex);
    if (ids.has(item.id)) throw new Error(`Promptfoo result row ${rowIndex} response.raw repeats an item id`);
    ids.add(item.id);
  }
  const finalItem = turn.items.at(-1);
  if (finalItem?.type !== "agent_message" || finalItem.text !== output) {
    throw new Error(`Promptfoo result row ${rowIndex} response.raw lacks the terminal agent message`);
  }
  return turn.items;
}

function extractWorkspaceSkillCalls(items, workingDirectory) {
  const workspacePrefix = `${workingDirectory.replace(/\\/g, "/").replace(/\/+$/g, "")}/.agents/skills/`;
  const calls = new Map();
  for (const item of items) {
    if (item.type !== "command_execution" ||
        (typeof item.status === "string" && item.status !== "completed") ||
        (typeof item.exit_code === "number" && item.exit_code !== 0) ||
        typeof item.command !== "string") continue;
    for (const rawToken of item.command.split(/\s+/)) {
      const token = rawToken.replace(/^[`"'([{<]+|[`"',;:)\]}>]+$/g, "").trim().replace(/\\/g, "/");
      let name;
      if (token.startsWith(".agents/skills/")) {
        name = /^\.agents\/skills\/([^/\s]+)\/SKILL\.md$/.exec(token)?.[1];
      } else if (token.startsWith(workspacePrefix)) {
        name = /^([^/\s]+)\/SKILL\.md$/.exec(token.slice(workspacePrefix.length))?.[1];
      }
      if (name && /^[A-Za-z0-9._:-]+$/.test(name)) {
        calls.set(token, { name, path: token, source: "heuristic" });
      }
    }
  }
  return [...calls.values()];
}

export async function validateResultArtifact({
  resultPath,
  suite,
  repeat,
  cases,
  providerId,
  model,
  effort,
  workingDirectory,
  holdoutIdentity = null,
}) {
  const info = await lstat(resultPath);
  if (!info.isFile()) throw new Error("Promptfoo output must be a regular JSON file");
  const source = await readFile(resultPath, "utf8");
  rejectDuplicateJsonObjectMembers(source, "Promptfoo output");
  let artifact;
  try {
    artifact = JSON.parse(source);
  } catch {
    throw new Error("Promptfoo output must be parseable JSON");
  }

  const rows = artifact?.results?.results;
  if (!Array.isArray(rows)) throw new Error("Promptfoo output is missing result rows");
  const expected = expectedCaseTrials(cases, suite, repeat);
  const actual = [...rows].sort((left, right) =>
    String(left?.testCase?.description).localeCompare(String(right?.testCase?.description)));
  if (JSON.stringify(actual.map((row) => row?.testCase?.description)) !==
      JSON.stringify(expected.map((testCase) => testCase.description))) {
    throw new Error(`Promptfoo output does not match ${suite} case/trial expectations`);
  }
  for (const [index, row] of actual.entries()) {
    const expectedAssertions = expected[index].assert ?? [];
    const expectedVars = expected[index].vars ?? {};
    const expectedMetadata = expected[index].metadata ?? {};
    if (row.success !== true || row.error || row.response?.error || row.provider?.id !== providerId) {
      throw new Error("Promptfoo output contains a failed, errored, or wrong-provider trial despite exit zero");
    }
    if (!isDeepStrictEqual(row.testCase?.vars, expectedVars)) {
      throw new Error(`Promptfoo result row ${index} does not contain the exact selected case vars`);
    }
    if (!isDeepStrictEqual(row.testCase?.assert ?? [], expectedAssertions)) {
      throw new Error(`Promptfoo result row ${index} does not contain the exact selected assertion inventory`);
    }
    if (!isDeepStrictEqual(row.testCase?.metadata ?? {}, expectedMetadata)) {
      throw new Error(`Promptfoo result row ${index} does not contain the exact selected observation contract`);
    }
    const grading = row.gradingResult;
    if (grading?.pass !== true || !Array.isArray(grading.componentResults) ||
        grading.componentResults.length !== expectedAssertions.length) {
      throw new Error(`Promptfoo result row ${index} is missing explicit assertion outcomes`);
    }
    for (const [assertionIndex, assertion] of expectedAssertions.entries()) {
      const component = grading.componentResults[assertionIndex];
      if (component?.pass !== true || !isDeepStrictEqual(component.assertion, assertion)) {
        throw new Error(`Promptfoo result row ${index} assertion ${assertionIndex} did not pass exactly`);
      }
    }
    const heuristicSkillAssertions = expectedAssertions.filter((assertion) =>
      assertion.type === "skill-used" || assertion.type === "not-skill-used");
    if (heuristicSkillAssertions.length > 0) {
      if (typeof row.response?.output !== "string") {
        throw new Error(`Promptfoo result row ${index} is missing the exact response output`);
      }
      const rawItems = parseCodexRawItems(row.response.raw, row.response.output, index);
      const observedTypes = new Set(rawItems.map((item) => item.type));
      const requiredTypes = expectedMetadata?.observations?.required_raw_item_types;
      if (!Array.isArray(requiredTypes) || requiredTypes.some((type) =>
        !replayableRawItemTypes.has(type) || !observedTypes.has(type))) {
        throw new Error(`Promptfoo result row ${index} is missing a required raw item observation`);
      }
      const replayedSkillCalls = extractWorkspaceSkillCalls(rawItems, workingDirectory);
      const declaredSkillCalls = row.response?.metadata?.skillCalls ?? [];
      if (!Array.isArray(declaredSkillCalls) || !isDeepStrictEqual(declaredSkillCalls, replayedSkillCalls)) {
        throw new Error(`Promptfoo result row ${index} has skillCalls inconsistent with raw command evidence`);
      }
      const activation = expectedMetadata?.observations?.skill_activation;
      const expectedUsed = heuristicSkillAssertions[0].type === "skill-used";
      if (activation?.status !== "dynamic_heuristic" ||
          activation?.expected !== (expectedUsed ? "used" : "not_used")) {
        throw new Error(`Promptfoo result row ${index} has an invalid Skill activation evidence contract`);
      }
      const heuristicResult = await assertions.runAssertions({
        providerResponse: row.response,
        test: { vars: expectedVars, assert: heuristicSkillAssertions },
      });
      if (heuristicResult.pass !== true || !Array.isArray(heuristicResult.componentResults) ||
          heuristicResult.componentResults.length !== heuristicSkillAssertions.length ||
          heuristicResult.componentResults.some((component, heuristicIndex) =>
            component?.pass !== true ||
            !isDeepStrictEqual(component.assertion, heuristicSkillAssertions[heuristicIndex]))) {
        throw new Error(`Promptfoo result row ${index} has contradictory heuristic Skill-use evidence`);
      }
    }
    const replayedAssertions = await assertions.runAssertions({
      providerResponse: row.response,
      test: { vars: expectedVars, assert: expectedAssertions },
    });
    if (replayedAssertions.pass !== true || !Array.isArray(replayedAssertions.componentResults) ||
        replayedAssertions.componentResults.length !== expectedAssertions.length ||
        replayedAssertions.componentResults.some((component, assertionIndex) =>
          component?.pass !== true || !isDeepStrictEqual(component.assertion, expectedAssertions[assertionIndex]))) {
      throw new Error(`Promptfoo result row ${index} deterministic assertions fail production replay`);
    }
  }
  const stats = artifact?.results?.stats;
  if (stats?.successes !== rows.length || stats?.failures !== 0 || stats?.errors !== 0) {
    throw new Error("Promptfoo aggregate stats do not match successful result rows");
  }
  if (artifact?.runtimeOptions?.repeat !== repeat) throw new Error("Promptfoo output has the wrong repeat count");

  const providers = artifact?.config?.providers;
  if (!Array.isArray(providers) || providers.length !== 1) {
    throw new Error("Promptfoo output must contain exactly one provider");
  }
  const provider = providers[0];
  if (!hasExactFields(provider, providerFields) || !hasExactFields(provider.config, providerConfigFields) ||
      provider.id !== providerId || provider.config.model !== model ||
      provider.config.model_reasoning_effort !== effort || provider.config.working_dir !== "[REDACTED]" ||
      Object.entries(providerSafetyConfig).some(([field, value]) => provider.config[field] !== value)) {
    throw new Error("Promptfoo output is not bound to the exact invoked provider/model/effort cell");
  }
  if (holdoutIdentity &&
      JSON.stringify(artifact?.config?.metadata?.holdout_candidate) !== JSON.stringify(holdoutIdentity)) {
    throw new Error("Promptfoo holdout output is not bound to the frozen candidate identity");
  }
}

function run(command, args, options = {}) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, { stdio: "inherit", ...options });
    child.on("error", reject);
    child.on("exit", (code, signal) => {
      if (signal) reject(new Error(`${command} terminated by ${signal}`));
      else resolve(code ?? 1);
    });
  });
}

async function main() {
  const suite = process.argv[2] ?? "smoke";
  if (!(suite in patterns)) {
    console.error(`Unknown suite ${suite}; expected smoke, full, or holdout.`);
    process.exitCode = 2;
    return;
  }

  const holdoutBefore = suite === "holdout" ? await readHoldoutIdentity() : null;
  const workspace = await mkdtemp(path.join(os.tmpdir(), "agent-skill-eval-"));
  const skillTarget = path.join(workspace, ".agents", "skills");
  const resultsDir = path.join(root, "evals", "results");
  const effort = process.env.SKILL_EVAL_EFFORT ?? "medium";
  const model = process.env.SKILL_EVAL_MODEL ?? "gpt-5.6-terra";
  const safeLabel = `${suite}-${model}-${effort}`.replace(/[^a-zA-Z0-9._-]+/g, "-");
  const resultPath = path.join(resultsDir, `${safeLabel}-${Date.now()}.json`);
  const configPath = path.join(workspace, "promptfooconfig.yaml");
  const promptfoo = path.join(root, "node_modules", ".bin", process.platform === "win32" ? "promptfoo.cmd" : "promptfoo");

  try {
    const snapshotCommit = holdoutBefore?.commit ?? await gitText(root, ["rev-parse", "HEAD"]);
    await materializeSkillsFromGit(root, snapshotCommit, skillTarget);
    await writeFile(path.join(workspace, "README.md"), "Disposable read-only Skill evaluation workspace.\n", "utf8");
    await writeFile(path.join(workspace, "AGENTS.md"), repositoryInstructions, "utf8");
    const gitCode = await run("git", ["init", "--quiet"], { cwd: workspace });
    if (gitCode !== 0) throw new Error(`git init failed with exit ${gitCode}`);
    await mkdir(resultsDir, { recursive: true });
    const casePath = path.join(root, "evals", "cases", caseFiles[suite]);
    const cases = parseYaml(await readFile(casePath, "utf8"));
    const sourceConfig = parseYaml(await readFile(path.join(root, "evals", "promptfooconfig.yaml"), "utf8"));
    const { config, providerId } = preparePromptfooConfig(sourceConfig, {
      model,
      effort,
      workingDirectory: workspace,
    });
    config.tests = pathToFileURL(casePath).href;
    if (holdoutBefore) {
      config.metadata = { ...config.metadata, holdout_candidate: holdoutBefore };
    }
    await writeFile(configPath, stringifyYaml(config), "utf8");

    const code = await run(promptfoo, [
      "eval",
      "-c",
      configPath,
      "--no-cache",
      "--max-concurrency",
      "1",
      "--repeat",
      String(repeats[suite]),
      "--filter-pattern",
      patterns[suite],
      "--output",
      resultPath,
    ], {
      cwd: root,
      env: {
        ...process.env,
        PROMPTFOO_DISABLE_TELEMETRY: "1",
        PROMPTFOO_DISABLE_UPDATE: "1",
        PROMPTFOO_CONFIG_DIR: path.join(workspace, ".promptfoo"),
        SKILL_EVAL_EFFORT: effort,
        SKILL_EVAL_MODEL: model,
        SKILL_EVAL_WORKING_DIR: workspace,
      },
    });
    if (code !== 0) {
      process.exitCode = code;
      return;
    }

    if (holdoutBefore) {
      const holdoutAfter = await readHoldoutIdentity();
      if (JSON.stringify(holdoutAfter) !== JSON.stringify(holdoutBefore)) {
        throw new Error("holdout candidate identity drifted during evaluation");
      }
    }
    await validateResultArtifact({
      resultPath,
      suite,
      repeat: repeats[suite],
      cases,
      providerId,
      model,
      effort,
      workingDirectory: workspace,
      holdoutIdentity: holdoutBefore,
    });
    console.log(`Result: ${resultPath}`);
  } finally {
    await rm(workspace, { recursive: true, force: true });
  }
}

if (process.argv[1] && pathToFileURL(path.resolve(process.argv[1])).href === import.meta.url) {
  await main();
}
