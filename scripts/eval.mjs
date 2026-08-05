import { cp, mkdir, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { spawn } from "node:child_process";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { parse as parseYaml, stringify as stringifyYaml } from "yaml";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const suite = process.argv[2] ?? "smoke";
const patterns = {
  smoke: "^\\[smoke\\]",
  full: "^\\[(?:smoke|full)\\]",
  holdout: "^\\[holdout\\]",
};
const repeats = { smoke: "1", full: "2", holdout: "3" };
if (!(suite in patterns)) {
  console.error(`Unknown suite ${suite}; expected smoke, full, or holdout.`);
  process.exit(2);
}

const workspace = await mkdtemp(path.join(os.tmpdir(), "agent-skill-eval-"));
const skillTarget = path.join(workspace, ".agents", "skills");
const resultsDir = path.join(root, "evals", "results");
const effort = process.env.SKILL_EVAL_EFFORT ?? "medium";
const model = process.env.SKILL_EVAL_MODEL ?? "gpt-5.6-terra";
const safeLabel = `${suite}-${model}-${effort}`.replace(/[^a-zA-Z0-9._-]+/g, "-");
const resultPath = path.join(resultsDir, `${safeLabel}-${Date.now()}.json`);
const configPath = path.join(workspace, "promptfooconfig.yaml");
const promptfoo = path.join(root, "node_modules", ".bin", process.platform === "win32" ? "promptfoo.cmd" : "promptfoo");

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

try {
  await mkdir(skillTarget, { recursive: true });
  await cp(path.join(root, "skills"), skillTarget, { recursive: true });
  await writeFile(path.join(workspace, "README.md"), "Disposable read-only Skill evaluation workspace.\n", "utf8");
  const gitCode = await run("git", ["init", "--quiet"], { cwd: workspace });
  if (gitCode !== 0) process.exit(gitCode);
  await mkdir(resultsDir, { recursive: true });
  const config = parseYaml(await readFile(path.join(root, "evals", "promptfooconfig.yaml"), "utf8"));
  const provider = config.providers[0];
  provider.label = `${model}/${effort}`;
  provider.config.model = model;
  provider.config.model_reasoning_effort = effort;
  provider.config.working_dir = workspace;
  config.tests = `file://${path.join(root, "evals", "cases", "cases.yaml")}`;
  await writeFile(configPath, stringifyYaml(config), "utf8");

  const code = await run(promptfoo, [
    "eval",
    "-c",
    configPath,
    "--no-cache",
    "--max-concurrency",
    "1",
    "--repeat",
    repeats[suite],
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
  if (code === 0) console.log(`Result: ${resultPath}`);
  process.exitCode = code;
} finally {
  await rm(workspace, { recursive: true, force: true });
}
