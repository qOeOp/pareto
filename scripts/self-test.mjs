import assert from "node:assert/strict";
import { execFile } from "node:child_process";
import { mkdir, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { promisify } from "node:util";
import { fileURLToPath } from "node:url";
import { assertions } from "promptfoo";
import { parse as parseYaml } from "yaml";
import { readHoldoutIdentity, validateResultArtifact } from "./eval.mjs";

const execFileAsync = promisify(execFile);
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const temporaryRoot = await mkdtemp(path.join(os.tmpdir(), "skill-eval-self-test-"));

async function expectReject(action, pattern) {
  await assert.rejects(action, pattern);
}

try {
  const cases = parseYaml(await readFile(path.join(root, "evals", "cases", "cases.yaml"), "utf8"));
  const negativeControl = cases.find((testCase) => testCase.description === "[smoke] near-miss negative control");
  const noSkillAssertion = negativeControl?.assert?.find((assertion) => assertion.type === "skill-used");
  assert.ok(noSkillAssertion, "smoke negative control must use the native skill-used assertion");
  const noSkill = await assertions.runAssertions({
    providerResponse: { output: "ok", metadata: { skillCalls: [] } },
    test: { vars: {}, assert: [noSkillAssertion] },
  });
  const usedSkill = await assertions.runAssertions({
    providerResponse: { output: "ok", metadata: { skillCalls: [{ name: "x" }] } },
    test: { vars: {}, assert: [noSkillAssertion] },
  });
  assert.equal(noSkill.pass, true, "no-skill oracle must accept an empty skill call set");
  assert.equal(usedSkill.pass, false, "no-skill oracle must reject any actual Skill call");

  const resultPath = path.join(temporaryRoot, "result.json");
  const smokeDescriptions = cases
    .filter((testCase) => /^\[smoke\]/.test(testCase.description))
    .map((testCase) => testCase.description);
  const rows = smokeDescriptions.map((description) => ({
    success: true,
    testCase: { description },
  }));
  await writeFile(resultPath, JSON.stringify({
    results: {
      results: { results: rows },
      stats: { successes: rows.length, failures: 0, errors: 0 },
    },
    config: {
      providers: [{ config: { model: "synthetic-model", model_reasoning_effort: "low" } }],
      metadata: {},
    },
    runtimeOptions: { repeat: 1 },
  }), "utf8");
  await validateResultArtifact({
    resultPath,
    suite: "smoke",
    repeat: 1,
    cases,
    model: "synthetic-model",
    effort: "low",
  });
  await expectReject(() => validateResultArtifact({
    resultPath: path.join(temporaryRoot, "missing.json"),
    suite: "smoke",
    repeat: 1,
    cases,
    model: "synthetic-model",
    effort: "low",
  }), /ENOENT/);

  const repository = path.join(temporaryRoot, "repository");
  await mkdir(path.join(repository, "skills", "example"), { recursive: true });
  await mkdir(path.join(repository, "evals"), { recursive: true });
  await writeFile(path.join(repository, "skills", "example", "SKILL.md"), "example\n", "utf8");
  await writeFile(path.join(repository, "evals", "matrix.json"), "{}\n", "utf8");
  await execFileAsync("git", ["-C", repository, "init", "--quiet"]);
  await execFileAsync("git", ["-C", repository, "config", "user.name", "Skill Eval Self Test"]);
  await execFileAsync("git", ["-C", repository, "config", "user.email", "skill-eval@example.invalid"]);
  await execFileAsync("git", ["-C", repository, "add", "."]);
  await execFileAsync("git", ["-C", repository, "commit", "--quiet", "-m", "fixture"]);
  const identity = await readHoldoutIdentity(repository);
  assert.match(identity.commit, /^[0-9a-f]{40}$/);
  assert.match(identity.tree, /^[0-9a-f]{40}$/);
  assert.match(identity.skills_tree_oid, /^[0-9a-f]{40}$/);
  assert.match(identity.matrix_sha256, /^[0-9a-f]{64}$/);
  await writeFile(path.join(repository, "dirty.txt"), "dirty\n", "utf8");
  await expectReject(() => readHoldoutIdentity(repository), /clean tracked and untracked worktree/);

  console.log("Evaluation contract self-test passed.");
} finally {
  await rm(temporaryRoot, { recursive: true, force: true });
}
