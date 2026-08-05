import assert from "node:assert/strict";
import { execFile } from "node:child_process";
import { cp, mkdir, mkdtemp, readFile, rm, symlink, writeFile } from "node:fs/promises";
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

async function expectReject(action, pattern, message) {
  await assert.rejects(action, pattern, message);
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

  const crlfFixture = path.join(temporaryRoot, "crlf-fixture");
  await execFileAsync("git", ["clone", "--quiet", "--shared", root, crlfFixture]);
  await cp(root, crlfFixture, {
    recursive: true,
    filter: (source) => {
      const relative = path.relative(root, source);
      return relative !== ".git" && !relative.startsWith(`.git${path.sep}`) &&
        relative !== "node_modules" && !relative.startsWith(`node_modules${path.sep}`) &&
        relative !== path.join("evals", "results") && !relative.startsWith(`${path.join("evals", "results")}${path.sep}`);
    },
  });
  await symlink(
    path.join(root, "node_modules"),
    path.join(crlfFixture, "node_modules"),
    process.platform === "win32" ? "junction" : "dir",
  );
  const crlfSkillPath = path.join(crlfFixture, "skills", "lightweight-charts", "SKILL.md");
  const crlfSkill = (await readFile(crlfSkillPath, "utf8")).replace(/\r?\n/g, "\r\n");
  await writeFile(crlfSkillPath, crlfSkill, "utf8");
  const crlfValidation = await execFileAsync(process.execPath, [path.join(crlfFixture, "scripts", "validate.mjs")], {
    encoding: "utf8",
  });
  assert.match(crlfValidation.stdout, /Validated 2 skills/);

  const baselinePath = path.join(crlfFixture, "evals", "baselines", "2026-08-06-smoke.json");
  const baseline = JSON.parse(await readFile(baselinePath, "utf8"));
  const completedCell = (matrixCell) => ({
    provider: "openai:codex-sdk",
    model: matrixCell.model,
    reasoning_effort: matrixCell.effort,
    planned_trials: 2,
    completed_trials: 2,
    errored_trials: 0,
    status: "completed",
    quality: {
      passed: true,
      passed_trials: 2,
      total_assertions: 2,
      passed_assertions: 2,
      assertion_score: 1,
      rubric_score: "unavailable",
      pass_rate: 1,
      mean: 1,
      median: 1,
      p95: 1,
      variance: 0,
    },
    elapsed_ms: 1,
    input_tokens: 1,
    output_tokens: 1,
    cached_input_tokens: 0,
    reasoning_tokens: 0,
    cost: 0,
  });
  const matrix = JSON.parse(await readFile(path.join(crlfFixture, "evals", "matrix.json"), "utf8"));
  const validCompletedBaseline = {
    ...baseline,
    cells: matrix.cells.map(completedCell),
    result: "completed",
  };
  const completedBaseline = structuredClone(validCompletedBaseline);
  delete completedBaseline.cells[0].cost;

  const malformedBaselines = [
    ["completed required field", completedBaseline, /completed cell 0: expected exact fields/],
    ["unavailable forbidden field", {
      ...baseline,
      cells: baseline.cells.map((cell, index) => index === 0 ? { ...cell, unexpected: true } : cell),
    }, /unavailable cell 0: expected exact fields/],
    ["not_run status consistency", {
      ...baseline,
      cells: baseline.cells.map((cell, index) => index === 1 ? { ...cell, errored_trials: 1 } : cell),
    }, /not_run cell 1: trial counts contradict status/],
    ["required environment", (() => {
      const fixture = { ...baseline };
      delete fixture.environment;
      return fixture;
    })(), /expected exact fields/],
    ["canonical provider provenance", {
      ...baseline,
      cells: baseline.cells.map((cell, index) => index === 0 ? { ...cell, provider: "other-provider" } : cell),
    }, /must match the canonical Promptfoo provider/],
    ["historical candidate commit provenance", {
      ...baseline,
      candidate: { ...baseline.candidate, commit: "0".repeat(40) },
    }, /candidate commit: Git object is unavailable/],
    ["historical candidate tree provenance", {
      ...baseline,
      candidate: { ...baseline.candidate, tree: "0".repeat(40) },
    }, /candidate tree does not match its commit/],
    ["historical Skill digest provenance", {
      ...baseline,
      candidate: {
        ...baseline.candidate,
        skill_sha256: { ...baseline.candidate.skill_sha256, "lightweight-charts": "0".repeat(64) },
      },
    }, /Skill digest does not match historical lightweight-charts/],
    ["completed trial denominator", (() => {
      const fixture = structuredClone(validCompletedBaseline);
      fixture.cells[0].quality.passed = false;
      fixture.cells[0].quality.passed_trials = 1;
      fixture.cells[0].quality.pass_rate = 0.3;
      fixture.cells[0].quality.assertion_score = 0.5;
      return fixture;
    })(), /pass_rate contradicts trial counts/],
    ["completed assertion pass coherence", (() => {
      const fixture = structuredClone(validCompletedBaseline);
      fixture.cells[0].quality.passed = false;
      fixture.cells[0].quality.passed_trials = 1;
      fixture.cells[0].quality.pass_rate = 0.5;
      fixture.cells[0].quality.assertion_score = 1;
      return fixture;
    })(), /assertion and pass evidence contradict trial counts/],
    ["completed assertion denominator", (() => {
      const fixture = structuredClone(validCompletedBaseline);
      fixture.cells[0].quality.passed = false;
      fixture.cells[0].quality.passed_trials = 1;
      fixture.cells[0].quality.pass_rate = 0.5;
      fixture.cells[0].quality.passed_assertions = 1;
      fixture.cells[0].quality.assertion_score = 0.3;
      return fixture;
    })(), /assertion_score contradicts assertion counts/],
    ["completed percentile ordering", (() => {
      const fixture = structuredClone(validCompletedBaseline);
      fixture.cells[0].quality.median = 1;
      fixture.cells[0].quality.p95 = 0;
      return fixture;
    })(), /median must not exceed p95/],
  ];
  for (const [name, malformedBaseline, pattern] of malformedBaselines) {
    await writeFile(baselinePath, `${JSON.stringify(malformedBaseline, null, 2)}\n`, "utf8");
    await expectReject(
      () => execFileAsync(process.execPath, [path.join(crlfFixture, "scripts", "validate.mjs")], { encoding: "utf8" }),
      pattern,
      name,
    );
  }

  const rawBaseline = `${JSON.stringify(baseline, null, 2)}\n`;
  const duplicateMembers = [
    ["duplicate top-level result", rawBaseline.replace(
      '  "result": "unavailable",',
      '  "result": "completed",\n  "result": "unavailable",',
    ), /duplicate JSON object member result/],
    ["duplicate nested evidence", rawBaseline.replace(
      '      "input_tokens": "unavailable",',
      '      "input_tokens": 1,\n      "input_tokens": "unavailable",',
    ), /duplicate JSON object member input_tokens/],
  ];
  for (const [name, rawFixture, pattern] of duplicateMembers) {
    await writeFile(baselinePath, rawFixture, "utf8");
    await expectReject(
      () => execFileAsync(process.execPath, [path.join(crlfFixture, "scripts", "validate.mjs")], { encoding: "utf8" }),
      pattern,
      name,
    );
  }

  const malformedCount = malformedBaselines.length + duplicateMembers.length;
  console.log(`Evaluation contract self-test passed; ${malformedCount} malformed baseline fixtures were rejected.`);
} finally {
  await rm(temporaryRoot, { recursive: true, force: true });
}
