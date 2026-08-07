import { readFile } from "node:fs/promises";
import { spawn } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const matrix = JSON.parse(await readFile(path.join(root, "evals", "matrix.json"), "utf8"));

for (const cell of matrix.cells) {
  for (let trial = 1; trial <= matrix.trials_per_cell; trial += 1) {
    console.log(`Matrix cell ${cell.model}/${cell.effort}, trial ${trial}/${matrix.trials_per_cell}`);
    const code = await new Promise((resolve, reject) => {
      const child = spawn(process.execPath, [path.join(root, "scripts", "eval.mjs"), matrix.suite], {
        cwd: root,
        stdio: "inherit",
        env: {
          ...process.env,
          SKILL_EVAL_MODEL: cell.model,
          SKILL_EVAL_EFFORT: cell.effort,
        },
      });
      child.on("error", reject);
      child.on("exit", (status, signal) => signal ? reject(new Error(`matrix child terminated by ${signal}`)) : resolve(status ?? 1));
    });
    if (code !== 0) process.exit(code);
  }
}
