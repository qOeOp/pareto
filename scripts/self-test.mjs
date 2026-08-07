import assert from "node:assert/strict";
import { execFile, execFileSync } from "node:child_process";
import { lstat, mkdir, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
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

  const goldenCases = parseYaml(await readFile(path.join(root, "evals", "cases", "golden.yaml"), "utf8"));
  const holdoutCases = parseYaml(await readFile(path.join(root, "evals", "cases", "holdout.yaml"), "utf8"));
  const allCases = [...goldenCases, ...holdoutCases];
  for (const testCase of allCases) {
    const refutation = await assertions.runAssertions({
      providerResponse: {
        output: "unsafe behavior\nfalse pass\nautomatic retry",
        metadata: {
          skillCalls: testCase.assert.some((assertion) => assertion.type === "skill-used")
            ? []
            : [{ name: "run-bounded-mission", path: ".agents/skills/run-bounded-mission/SKILL.md", source: "heuristic" }],
        },
      },
      test: testCase,
    });
    assert.equal(refutation.pass, false, `${testCase.description}: representative wrong behavior must fail`);
  }

  const syntheticCases = [
    {
      description: "[smoke] harness positive control",
      metadata: {
        observations: {
          behavioral_oracle: "deterministic_text",
          skill_activation: { status: "dynamic_heuristic", expected: "used" },
          required_raw_item_types: ["command_execution"],
          unavailable: ["host_native_skill_route"],
        },
      },
      vars: { prompt: "synthetic positive" },
      assert: [
        { type: "skill-used", value: "run-bounded-mission" },
        { type: "contains", value: "receipt: bounded" },
      ],
      output: "receipt: bounded",
      items: [{
        type: "command_execution",
        status: "completed",
        exit_code: 0,
        command: "sed -n 1,20p .agents/skills/run-bounded-mission/SKILL.md",
      }],
      skillCalls: [{
        name: "run-bounded-mission",
        path: ".agents/skills/run-bounded-mission/SKILL.md",
        source: "heuristic",
      }],
    },
    {
      description: "[smoke] harness negative control",
      metadata: {
        observations: {
          behavioral_oracle: "deterministic_text",
          skill_activation: { status: "dynamic_heuristic", expected: "not_used" },
          required_raw_item_types: [],
          unavailable: ["host_native_skill_route"],
        },
      },
      vars: { prompt: "synthetic negative" },
      assert: [
        { type: "not-skill-used", value: "run-bounded-mission" },
        { type: "contains", value: "receipt: answer-only" },
      ],
      output: "receipt: answer-only",
      items: [{ type: "command_execution", status: "completed", exit_code: 0, command: "pwd" }],
      skillCalls: [],
    },
  ];
  const resultPath = path.join(temporaryRoot, "result.json");
  const resultRows = syntheticCases.map((testCase) => ({
    success: true,
    provider: { id: CANONICAL_PROVIDER_ID },
    response: {
      output: testCase.output,
      metadata: { skillCalls: structuredClone(testCase.skillCalls) },
      raw: JSON.stringify({ finalResponse: testCase.output, items: testCase.items }),
    },
    testCase: {
      description: testCase.description,
      vars: structuredClone(testCase.vars),
      assert: structuredClone(testCase.assert),
      metadata: structuredClone(testCase.metadata),
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
      results: { results: resultRows },
      stats: { successes: resultRows.length, failures: 0, errors: 0 },
    },
    config: {
      providers: [structuredClone(preparedConfig.providers[0])],
      metadata: {},
    },
    runtimeOptions: { repeat: 1 },
  };
  const validateSyntheticResult = () => validateResultArtifact({
    resultPath,
    suite: "smoke",
    repeat: 1,
    cases: syntheticCases,
    providerId: CANONICAL_PROVIDER_ID,
    model: "synthetic-model",
    effort: "low",
    workingDirectory: temporaryRoot,
  });
  await writeFile(resultPath, JSON.stringify(validResultArtifact), "utf8");
  await validateSyntheticResult();
  await writeFile(resultPath, JSON.stringify(validResultArtifact).replace(
    '"success":true',
    '"success":false,"success":true',
  ), "utf8");
  await expectReject(validateSyntheticResult, /duplicate JSON object member success/,
    "duplicate Promptfoo result member");
  const resultFixtures = [
    ["missing provider identity", (() => {
      const fixture = structuredClone(validResultArtifact);
      delete fixture.config.providers[0].id;
      return fixture;
    })(), /exact invoked provider\/model\/effort/],
    ["wrong provider", (() => {
      const fixture = structuredClone(validResultArtifact);
      fixture.config.providers[0].id = "other-provider";
      return fixture;
    })(), /exact invoked provider\/model\/effort/],
    ["additional provider", (() => {
      const fixture = structuredClone(validResultArtifact);
      fixture.config.providers.push(structuredClone(fixture.config.providers[0]));
      return fixture;
    })(), /exactly one provider/],
    ["altered selected prompt", (() => {
      const fixture = structuredClone(validResultArtifact);
      fixture.results.results.results[0].testCase.vars.prompt = "different prompt";
      return fixture;
    })(), /exact selected case vars/],
    ["missing assertion outcome", (() => {
      const fixture = structuredClone(validResultArtifact);
      fixture.results.results.results[0].gradingResult.componentResults.pop();
      return fixture;
    })(), /missing explicit assertion outcomes/],
    ["altered observation contract", (() => {
      const fixture = structuredClone(validResultArtifact);
      fixture.results.results.results[0].testCase.metadata.observations.unavailable = [];
      return fixture;
    })(), /exact selected observation contract/],
    ["failed assertion outcome", (() => {
      const fixture = structuredClone(validResultArtifact);
      fixture.results.results.results[0].gradingResult.componentResults[0].pass = false;
      return fixture;
    })(), /did not pass exactly/],
    ["contradictory heuristic activation", (() => {
      const fixture = structuredClone(validResultArtifact);
      fixture.results.results.results[0].response.metadata.skillCalls = [];
      return fixture;
    })(), /skillCalls inconsistent with raw command evidence/],
    ["missing raw turn", (() => {
      const fixture = structuredClone(validResultArtifact);
      delete fixture.results.results.results[0].response.raw;
      return fixture;
    })(), /missing the Codex raw turn receipt/],
    ["malformed raw turn", (() => {
      const fixture = structuredClone(validResultArtifact);
      fixture.results.results.results[0].response.raw = "{";
      return fixture;
    })(), /response.raw/],
    ["duplicate raw turn member", (() => {
      const fixture = structuredClone(validResultArtifact);
      fixture.results.results.results[0].response.raw = '{"items":[],"items":[]}';
      return fixture;
    })(), /duplicate JSON object member items/],
    ["missing raw items", (() => {
      const fixture = structuredClone(validResultArtifact);
      fixture.results.results.results[0].response.raw = JSON.stringify({ finalResponse: "receipt: bounded" });
      return fixture;
    })(), /response.raw must contain an items array/],
    ["missing required raw class", (() => {
      const fixture = structuredClone(validResultArtifact);
      fixture.results.results.results[0].response.raw = JSON.stringify({
        items: [{ type: "agent_message", text: "receipt: bounded" }],
      });
      fixture.results.results.results[0].response.metadata.skillCalls = [];
      return fixture;
    })(), /missing a required raw item observation/],
    ["negative raw Skill contradiction", (() => {
      const fixture = structuredClone(validResultArtifact);
      fixture.results.results.results[1].response.raw = fixture.results.results.results[0].response.raw;
      return fixture;
    })(), /skillCalls inconsistent with raw command evidence/],
  ];
  for (const [name, fixture, pattern] of resultFixtures) {
    await writeFile(resultPath, JSON.stringify(fixture), "utf8");
    await expectReject(validateSyntheticResult, pattern, name);
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
  console.log("Evaluation harness self-test passed.");
} finally {
  await rm(temporaryRoot, { recursive: true, force: true });
}
