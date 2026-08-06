import assert from "node:assert/strict";
import { execFile, execFileSync } from "node:child_process";
import { cp, lstat, mkdir, mkdtemp, readFile, rm, symlink, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { promisify } from "node:util";
import { fileURLToPath } from "node:url";
import { assertions } from "promptfoo";
import { parse as parseYaml } from "yaml";
import {
  CANONICAL_PROVIDER_ID,
  materializeSkillsFromGit,
  preparePromptfooConfig,
  readHoldoutIdentity,
  validateResultArtifact,
} from "./eval.mjs";

const execFileAsync = promisify(execFile);
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const temporaryRoot = await mkdtemp(path.join(os.tmpdir(), "skill-eval-self-test-"));

async function expectReject(action, pattern, message) {
  await assert.rejects(action, pattern, message);
}

try {
  const cases = parseYaml(await readFile(path.join(root, "evals", "cases", "cases.yaml"), "utf8"));
  const sourceConfig = parseYaml(await readFile(path.join(root, "evals", "promptfooconfig.yaml"), "utf8"));
  const preparedConfig = preparePromptfooConfig(sourceConfig, {
    model: "synthetic-model",
    effort: "low",
    workingDirectory: temporaryRoot,
  }).config;
  assert.equal(preparedConfig.providers[0].id, CANONICAL_PROVIDER_ID);
  assert.deepEqual(preparedConfig.providers[0].config, {
    model: "synthetic-model",
    model_reasoning_effort: "low",
    working_dir: temporaryRoot,
    sandbox_mode: "read-only",
    approval_policy: "never",
    network_access_enabled: false,
    web_search_enabled: false,
    enable_streaming: true,
    inherit_process_env: false,
  });
  const providerConfigFixtures = [
    ["missing provider", (() => {
      const fixture = structuredClone(sourceConfig);
      fixture.providers = [];
      return fixture;
    })(), /exactly one provider/],
    ["unknown provider", (() => {
      const fixture = structuredClone(sourceConfig);
      fixture.providers[0].id = "other-provider";
      return fixture;
    })(), /canonical provider/],
    ["additional provider", (() => {
      const fixture = structuredClone(sourceConfig);
      fixture.providers.push(structuredClone(fixture.providers[0]));
      return fixture;
    })(), /exactly one provider/],
    ["unsafe provider config", (() => {
      const fixture = structuredClone(sourceConfig);
      fixture.providers[0].config.network_access_enabled = true;
      return fixture;
    })(), /network_access_enabled must remain false/],
    ["unknown provider config field", (() => {
      const fixture = structuredClone(sourceConfig);
      fixture.providers[0].config.unknown = true;
      return fixture;
    })(), /exact supported fields/],
  ];
  for (const [name, fixture, pattern] of providerConfigFixtures) {
    assert.throws(() => preparePromptfooConfig(fixture, {
      model: "synthetic-model",
      effort: "low",
      workingDirectory: temporaryRoot,
    }), pattern, name);
  }
  assert.throws(() => preparePromptfooConfig(sourceConfig, {
    model: "",
    effort: "low",
    workingDirectory: temporaryRoot,
  }), /model must be one exact non-empty value/, "empty invoked model");
  assert.throws(() => preparePromptfooConfig(sourceConfig, {
    model: "synthetic-model",
    effort: "low\n",
    workingDirectory: temporaryRoot,
  }), /reasoning effort must be one exact non-empty value/, "malformed invoked effort");
  const positiveControl = cases.find((testCase) => testCase.description === "[smoke] explicit lightweight-charts v5 route");
  const skillAssertion = positiveControl?.assert?.find((assertion) => assertion.type === "skill-used");
  assert.ok(skillAssertion, "smoke positive control must use the native skill-used assertion");
  const expectedSkill = await assertions.runAssertions({
    providerResponse: { output: "ok", metadata: { skillCalls: [{ name: "lightweight-charts" }] } },
    test: { vars: {}, assert: [skillAssertion] },
  });
  const missingSkill = await assertions.runAssertions({
    providerResponse: { output: "ok", metadata: { skillCalls: [] } },
    test: { vars: {}, assert: [skillAssertion] },
  });
  assert.equal(expectedSkill.pass, true, "positive Skill oracle must accept the expected Skill call");
  assert.equal(missingSkill.pass, false, "positive Skill oracle must reject a missing Skill call");
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
  const smokeCases = cases.filter((testCase) => /^\[smoke\]/.test(testCase.description));
  const expectedProviderId = CANONICAL_PROVIDER_ID;
  const rows = smokeCases.map((testCase) => ({
    success: true,
    provider: { id: expectedProviderId },
    response: {
      output: "ok",
      metadata: {
        skillCalls: testCase.description === "[smoke] near-miss negative control"
          ? []
          : [{ name: "lightweight-charts" }],
      },
    },
    testCase: {
      description: testCase.description,
      vars: structuredClone(testCase.vars ?? {}),
      assert: structuredClone(testCase.assert),
    },
    gradingResult: {
      pass: true,
      componentResults: testCase.assert.map((assertion) => ({
        pass: true,
        assertion: structuredClone(assertion),
      })),
    },
  }));
  const validResultArtifact = {
    results: {
      results: { results: rows },
      stats: { successes: rows.length, failures: 0, errors: 0 },
    },
    config: {
      providers: [{
        id: expectedProviderId,
        config: { model: "synthetic-model", model_reasoning_effort: "low" },
      }],
      metadata: {},
    },
    runtimeOptions: { repeat: 1 },
  };
  await writeFile(resultPath, JSON.stringify(validResultArtifact), "utf8");
  await validateResultArtifact({
    resultPath,
    suite: "smoke",
    repeat: 1,
    cases,
    providerId: expectedProviderId,
    model: "synthetic-model",
    effort: "low",
  });
  await expectReject(() => validateResultArtifact({
    resultPath: path.join(temporaryRoot, "missing.json"),
    suite: "smoke",
    repeat: 1,
    cases,
    providerId: expectedProviderId,
    model: "synthetic-model",
    effort: "low",
  }), /ENOENT/);
  await writeFile(resultPath, JSON.stringify(validResultArtifact).replace(
    '"success":true',
    '"success":false,"success":true',
  ), "utf8");
  await expectReject(() => validateResultArtifact({
    resultPath,
    suite: "smoke",
    repeat: 1,
    cases,
    providerId: expectedProviderId,
    model: "synthetic-model",
    effort: "low",
  }), /duplicate JSON object member success/, "duplicate Promptfoo result member");
  const resultFixtures = [
    ["missing provider identity", (() => {
      const fixture = structuredClone(validResultArtifact);
      delete fixture.config.providers[0].id;
      return fixture;
    })(), /exact invoked provider\/model\/effort/],
    ["unknown provider identity", (() => {
      const fixture = structuredClone(validResultArtifact);
      fixture.config.providers[0].id = "unknown-provider";
      fixture.results.results.results.forEach((row) => { row.provider.id = "unknown-provider"; });
      return fixture;
    })(), /exact invoked provider\/model\/effort|wrong-provider/],
    ["additional provider", (() => {
      const fixture = structuredClone(validResultArtifact);
      fixture.config.providers.push(structuredClone(fixture.config.providers[0]));
      return fixture;
    })(), /exactly one provider/],
    ["missing assertion evidence", (() => {
      const fixture = structuredClone(validResultArtifact);
      delete fixture.results.results.results[0].gradingResult;
      return fixture;
    })(), /missing explicit assertion outcomes/],
    ["mismatched assertion inventory", (() => {
      const fixture = structuredClone(validResultArtifact);
      fixture.results.results.results[0].testCase.assert.pop();
      return fixture;
    })(), /exact selected assertion inventory/],
    ["missing selected case vars", (() => {
      const fixture = structuredClone(validResultArtifact);
      delete fixture.results.results.results[0].testCase.vars;
      return fixture;
    })(), /exact selected case vars/],
    ["altered selected case prompt", (() => {
      const fixture = structuredClone(validResultArtifact);
      fixture.results.results.results[0].testCase.vars.prompt = "different prompt";
      return fixture;
    })(), /exact selected case vars/],
    ["failed assertion outcome", (() => {
      const fixture = structuredClone(validResultArtifact);
      fixture.results.results.results[0].gradingResult.componentResults[0].pass = false;
      return fixture;
    })(), /did not pass exactly/],
    ["contradictory positive Skill-use evidence", (() => {
      const fixture = structuredClone(validResultArtifact);
      fixture.results.results.results[0].response.metadata.skillCalls = [];
      return fixture;
    })(), /contradictory native Skill-use evidence/],
    ["contradictory negative Skill-use evidence", (() => {
      const fixture = structuredClone(validResultArtifact);
      fixture.results.results.results[1].response.metadata.skillCalls = [{ name: "forbidden-skill" }];
      return fixture;
    })(), /contradictory native Skill-use evidence/],
  ];
  for (const [name, fixture, pattern] of resultFixtures) {
    await writeFile(resultPath, JSON.stringify(fixture), "utf8");
    await expectReject(() => validateResultArtifact({
      resultPath,
      suite: "smoke",
      repeat: 1,
      cases,
      providerId: expectedProviderId,
      model: "synthetic-model",
      effort: "low",
    }), pattern, name);
  }

  const repository = path.join(temporaryRoot, "repository");
  await mkdir(path.join(repository, "skills", "example"), { recursive: true });
  await mkdir(path.join(repository, "evals"), { recursive: true });
  await writeFile(path.join(repository, "skills", "example", "SKILL.md"), "example\n", "utf8");
  await writeFile(path.join(repository, "evals", "matrix.json"), "{}\n", "utf8");
  await writeFile(path.join(repository, ".gitignore"), "node_modules/\n", "utf8");
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
  await mkdir(path.join(repository, "skills", "node_modules"), { recursive: true });
  await writeFile(path.join(repository, "skills", "node_modules", "SKILL.md"), "ignored\n", "utf8");
  const snapshot = path.join(temporaryRoot, "skill-snapshot");
  const materialized = await materializeSkillsFromGit(repository, identity.commit, snapshot);
  assert.equal(materialized.skills_tree_oid, identity.skills_tree_oid);
  assert.equal(await readFile(path.join(snapshot, "example", "SKILL.md"), "utf8"), "example\n");
  await expectReject(
    () => readFile(path.join(snapshot, "node_modules", "SKILL.md"), "utf8"),
    /ENOENT/,
    "ignored Skill material must not enter a Git-tree snapshot",
  );
  const pathRepository = path.join(temporaryRoot, "path-repository");
  await mkdir(pathRepository, { recursive: true });
  execFileSync("git", ["-C", pathRepository, "init", "--quiet"]);
  const gitObject = (args, input) => execFileSync("git", ["-C", pathRepository, ...args], { input })
    .toString("utf8").trim();
  const blob = gitObject(["hash-object", "-w", "--stdin"], Buffer.from("path fixture\n"));
  const commitTree = (skillEntries, message) => {
    const exampleTree = gitObject(["mktree", "-z"], Buffer.concat(skillEntries.sort(Buffer.compare)));
    const skillsTree = gitObject(["mktree", "-z"], Buffer.from(`040000 tree ${exampleTree}\texample\0`));
    const rootTree = gitObject(["mktree", "-z"], Buffer.from(`040000 tree ${skillsTree}\tskills\0`));
    return gitObject([
      "-c", "user.name=Skill Eval Self Test",
      "-c", "user.email=skill-eval@example.invalid",
      "commit-tree", rootTree, "-m", message,
    ]);
  };
  const invalidUtf8Commit = commitTree([
    Buffer.concat([Buffer.from(`100644 blob ${blob}\t`), Buffer.from([0xff]), Buffer.from(".md\0")]),
  ], "invalid UTF-8 path");
  await expectReject(
    () => materializeSkillsFromGit(pathRepository, invalidUtf8Commit, path.join(temporaryRoot, "invalid-utf8-snapshot")),
    /paths must be valid UTF-8/,
    "invalid UTF-8 Git paths must fail closed",
  );
  const normalizationCommit = commitTree([
    Buffer.from(`100644 blob ${blob}\te\u0301.md\0`),
    Buffer.from(`100644 blob ${blob}\t\u00e9.md\0`),
  ], "normalization collision");
  await expectReject(
    () => materializeSkillsFromGit(pathRepository, normalizationCommit, path.join(temporaryRoot, "normalization-snapshot")),
    /unsafe or duplicate path/,
    "Unicode-normalization-colliding Git paths must fail closed",
  );
  const nestedTree = gitObject(["mktree", "-z"], Buffer.from(`100644 blob ${blob}\tSKILL.md\0`));
  const windowsSeparatorCommit = commitTree([
    Buffer.from(`100644 blob ${blob}\tnested\\SKILL.md\0`),
    Buffer.from(`040000 tree ${nestedTree}\tnested\0`),
  ], "Windows separator collision");
  const windowsSeparatorDestination = path.join(temporaryRoot, "windows-separator-snapshot");
  await expectReject(
    () => materializeSkillsFromGit(pathRepository, windowsSeparatorCommit, windowsSeparatorDestination),
    /Windows platform path collision/,
    "Windows separator-equivalent Git paths must fail closed",
  );
  await expectReject(
    () => lstat(windowsSeparatorDestination),
    /ENOENT/,
    "Windows separator collision must fail before materialization",
  );
  const windowsCaseCommit = commitTree([
    Buffer.from(`100644 blob ${blob}\tCase.md\0`),
    Buffer.from(`100644 blob ${blob}\tcase.md\0`),
  ], "Windows case collision");
  await expectReject(
    () => materializeSkillsFromGit(pathRepository, windowsCaseCommit, path.join(temporaryRoot, "windows-case-snapshot")),
    /Windows platform path collision/,
    "Windows case-equivalent Git paths must fail closed",
  );
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
  const matrix = JSON.parse(await readFile(path.join(crlfFixture, "evals", "matrix.json"), "utf8"));
  const expectedAssertions = smokeCases.reduce((total, testCase) => total + testCase.assert.length, 0) *
    matrix.trials_per_cell;
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
      total_assertions: expectedAssertions,
      passed_assertions: expectedAssertions,
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
  const validCompletedBaseline = {
    ...baseline,
    cells: matrix.cells.map(completedCell),
    result: "completed",
  };
  const completedBaseline = structuredClone(validCompletedBaseline);
  delete completedBaseline.cells[0].cost;
  await writeFile(baselinePath, `${JSON.stringify(validCompletedBaseline, null, 2)}\n`, "utf8");
  const completedValidation = await execFileAsync(
    process.execPath,
    [path.join(crlfFixture, "scripts", "validate.mjs")],
    { encoding: "utf8" },
  );
  assert.match(completedValidation.stdout, /Validated 2 skills/);

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
    ["undeclared claims", {
      ...baseline,
      claims: ["Provider ran successfully."],
    }, /expected exact fields/],
    ["historical provider provenance", {
      ...baseline,
      cells: baseline.cells.map((cell, index) => index === 0 ? { ...cell, provider: "other-provider" } : cell),
    }, /must match the historical Promptfoo provider/],
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
    ["historical Promptfoo config blob provenance", {
      ...baseline,
      candidate: {
        ...baseline.candidate,
        promptfoo_config: { ...baseline.candidate.promptfoo_config, blob_oid: "0".repeat(40) },
      },
    }, /Promptfoo config blob does not match the historical candidate/],
    ["historical Promptfoo config digest provenance", {
      ...baseline,
      candidate: {
        ...baseline.candidate,
        promptfoo_config: { ...baseline.candidate.promptfoo_config, sha256: "0".repeat(64) },
      },
    }, /Promptfoo config digest does not match the historical blob/],
    ["historical Promptfoo config provider provenance", {
      ...baseline,
      candidate: {
        ...baseline.candidate,
        promptfoo_config: { ...baseline.candidate.promptfoo_config, provider: "other-provider" },
      },
    }, /Promptfoo provider does not match the historical config blob/],
    ["later candidate causal provenance", {
      ...baseline,
      candidate: {
        ...baseline.candidate,
        commit: "15a77265dd6db7f749fa3bbb77db6a28fba5437e",
        tree: "c0e6ca162e295e92a3c6a38fb3f81e5b1771b4b8",
      },
    }, /candidate commit time must not be later than attempted_at/],
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
    ["completed assertion inventory", (() => {
      const fixture = structuredClone(validCompletedBaseline);
      fixture.cells[0].quality.total_assertions = 2;
      fixture.cells[0].quality.passed_assertions = 2;
      return fixture;
    })(), /total_assertions must match the smoke assertion inventory/],
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

  const currentConfigPath = path.join(crlfFixture, "evals", "promptfooconfig.yaml");
  const currentConfig = await readFile(currentConfigPath, "utf8");
  const currentRewriteBaseline = {
    ...baseline,
    cells: baseline.cells.map((cell) => ({ ...cell, provider: "other-provider" })),
  };
  await writeFile(currentConfigPath, currentConfig.replace("openai:codex-sdk", "other-provider"), "utf8");
  await writeFile(baselinePath, `${JSON.stringify(currentRewriteBaseline, null, 2)}\n`, "utf8");
  await expectReject(
    () => execFileAsync(process.execPath, [path.join(crlfFixture, "scripts", "validate.mjs")], { encoding: "utf8" }),
    /must match the historical Promptfoo provider/,
    "current config and provider rewrite",
  );
  await writeFile(currentConfigPath, currentConfig, "utf8");

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

  const malformedCount = malformedBaselines.length + duplicateMembers.length + 1;
  console.log(`Evaluation contract self-test passed; ${malformedCount} malformed baseline fixtures were rejected.`);
} finally {
  await rm(temporaryRoot, { recursive: true, force: true });
}
