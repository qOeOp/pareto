import { createHash } from "node:crypto";
import { execFile, spawn } from "node:child_process";
import { chmod, lstat, mkdir, mkdtemp, readFile, realpath, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { isDeepStrictEqual, promisify } from "node:util";
import { fileURLToPath, pathToFileURL } from "node:url";
import { parse as parseYaml, stringify as stringifyYaml } from "yaml";
import { rejectDuplicateJsonObjectMembers } from "./json.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const patterns = {
  smoke: "^\\[smoke\\]",
  full: "^\\[(?:smoke|full)\\]",
  holdout: "^\\[holdout\\]",
};
const repeats = { smoke: 1, full: 2, holdout: 3 };
const execFileAsync = promisify(execFile);

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

export async function materializeSkillsFromGit(repositoryRoot, commit, destination) {
  const exactCommit = await gitText(repositoryRoot, ["rev-parse", `${commit}^{commit}`]);
  if (!/^(?:[0-9a-f]{40}|[0-9a-f]{64})$/.test(exactCommit)) {
    throw new Error("Skill snapshot commit is not an exact Git object");
  }
  const listing = await gitBytes(repositoryRoot, ["ls-tree", "-rz", `${exactCommit}:skills`]);
  const entries = listing.toString("utf8").split("\0").filter(Boolean);
  if (entries.length === 0) throw new Error("Skill snapshot tree is empty");
  try {
    await lstat(destination);
    throw new Error("Skill snapshot destination must not already exist");
  } catch (error) {
    if (error?.code !== "ENOENT") throw error;
  }
  await mkdir(destination, { recursive: true });
  const destinationRoot = path.resolve(destination);
  const seen = new Set();

  for (const entry of entries) {
    const match = /^(100644|100755) blob ([0-9a-f]{40}|[0-9a-f]{64})\t(.+)$/.exec(entry);
    if (!match) throw new Error(`Skill snapshot contains an unsupported Git entry: ${entry}`);
    const [, mode, oid, gitPath] = match;
    const segments = gitPath.split("/");
    if (segments.some((segment) => segment === "" || segment === "." || segment === "..") || seen.has(gitPath)) {
      throw new Error(`Skill snapshot contains an unsafe or duplicate path: ${gitPath}`);
    }
    seen.add(gitPath);
    const target = path.resolve(destinationRoot, ...segments);
    if (!target.startsWith(`${destinationRoot}${path.sep}`)) {
      throw new Error(`Skill snapshot path escapes its destination: ${gitPath}`);
    }
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

export async function validateResultArtifact({
  resultPath,
  suite,
  repeat,
  cases,
  providerId,
  model,
  effort,
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

  const rows = artifact?.results?.results?.results;
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
    if (row.success !== true || row.error || row.response?.error || row.provider?.id !== providerId) {
      throw new Error("Promptfoo output contains a failed, errored, or wrong-provider trial despite exit zero");
    }
    if (!isDeepStrictEqual(row.testCase?.assert ?? [], expectedAssertions)) {
      throw new Error(`Promptfoo result row ${index} does not contain the exact selected assertion inventory`);
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
  if (provider?.id !== providerId || provider?.config?.model !== model ||
      provider?.config?.model_reasoning_effort !== effort) {
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
    const gitCode = await run("git", ["init", "--quiet"], { cwd: workspace });
    if (gitCode !== 0) throw new Error(`git init failed with exit ${gitCode}`);
    await mkdir(resultsDir, { recursive: true });
    const cases = parseYaml(await readFile(path.join(root, "evals", "cases", "cases.yaml"), "utf8"));
    const config = parseYaml(await readFile(path.join(root, "evals", "promptfooconfig.yaml"), "utf8"));
    const provider = config.providers[0];
    provider.label = `${model}/${effort}`;
    provider.config.model = model;
    provider.config.model_reasoning_effort = effort;
    provider.config.working_dir = workspace;
    config.tests = pathToFileURL(path.join(root, "evals", "cases", "cases.yaml")).href;
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
      providerId: provider.id,
      model,
      effort,
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
