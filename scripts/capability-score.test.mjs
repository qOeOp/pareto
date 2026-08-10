import assert from "node:assert/strict";
import { execFile } from "node:child_process";
import { createHash } from "node:crypto";
import { copyFile, mkdir, mkdtemp, readFile, rm, symlink, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { promisify } from "node:util";
import { pathToFileURL } from "node:url";
import { parse as parseYaml } from "yaml";
import { validateCatalogFile } from "./capability-score.mjs";
import { capabilityEvidenceForValidatedResult, runtimeCasesForInstalledSkill } from "./eval.mjs";

const execFileAsync = promisify(execFile);
const temporaryRoot = await mkdtemp(path.join(os.tmpdir(), "capability-score-test-"));
const catalogPath = path.resolve("evals/capabilities.json");
const catalogBytes = await readFile(catalogPath);
const catalog = JSON.parse(catalogBytes);
const sha = (bytes) => `sha256:${createHash("sha256").update(bytes).digest("hex")}`;
const canonical = (value) => Array.isArray(value) ? value.map(canonical) : value && typeof value === "object" ? Object.fromEntries(Object.keys(value).sort().map((key) => [key, canonical(value[key])])) : value;
const uuid = (value) => {
  const hex = createHash("sha256").update(value).digest("hex");
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20, 32)}`;
};
const gitEnvironment = Object.fromEntries(Object.entries(process.env).filter(([name]) => !/^GIT_/i.test(name)));
const repository = path.join(temporaryRoot, "repository");
const repositoryUrl = "https://example.invalid/qoeop/skills";

async function git(args) {
  const { stdout } = await execFileAsync("git", ["-C", repository, ...args], {
    encoding: "utf8",
    env: gitEnvironment,
  });
  return stdout.trim();
}

await mkdir(repository, { recursive: true });
await git(["init", "--quiet"]);
await git(["config", "user.name", "Capability Score Test"]);
await git(["config", "user.email", "capability-score@example.invalid"]);
await git(["remote", "add", "origin", `${repositoryUrl}.git`]);
await mkdir(path.join(repository, "evals"), { recursive: true });
await mkdir(path.join(repository, "evals", "cases"), { recursive: true });
await mkdir(path.join(repository, "scripts"), { recursive: true });
await writeFile(path.join(repository, "evals", "capabilities.json"), catalogBytes);
await copyFile(path.resolve("scripts/capability-score.mjs"), path.join(repository, "scripts", "capability-score.mjs"));
await copyFile(path.resolve("scripts/eval.mjs"), path.join(repository, "scripts", "eval.mjs"));
await copyFile(path.resolve("scripts/json.mjs"), path.join(repository, "scripts", "json.mjs"));
await copyFile(path.resolve("evals/cases/golden.yaml"), path.join(repository, "evals", "cases", "golden.yaml"));
await copyFile(path.resolve("evals/cases/holdout.yaml"), path.join(repository, "evals", "cases", "holdout.yaml"));
await writeFile(path.join(repository, "fixture.txt"), "candidate\n");
await git(["add", "evals", "scripts", "fixture.txt"]);
await git(["commit", "--quiet", "-m", "candidate"]);
const candidate = { repository: repositoryUrl, commit: await git(["rev-parse", "HEAD"]), tree: await git(["rev-parse", "HEAD^{tree}"]) };
const { stdout: committedCatalogBytes } = await execFileAsync("git", ["-C", repository, "show", `${candidate.commit}:evals/capabilities.json`], {
  encoding: null,
  env: gitEnvironment,
});
await symlink(path.resolve("node_modules"), path.join(temporaryRoot, "node_modules"),
  process.platform === "win32" ? "junction" : "dir");
const { scoreEvidence } = await import(pathToFileURL(path.join(repository, "scripts", "capability-score.mjs")).href);

function rollout({ capabilityId, scenario, trial, sourceKind, result = "pass", unverified = false }) {
  const sessionId = sourceKind === "native_trace" ? uuid(`session-${capabilityId}-${scenario}-${trial}-${result}`) : `session-${capabilityId}-${scenario}-${trial}-${sourceKind}-${result}`;
  const parentId = sourceKind === "native_trace" ? uuid(`parent-${capabilityId}-${scenario}-${trial}-${result}`) : `parent-${capabilityId}-${scenario}-${trial}-${sourceKind}-${result}`;
  const cliVersion = trial === 1 ? "1.0.0" : "2.0.0";
  const environmentId = `codex:Codex CLI:${cliVersion}:openai`;
  const capabilityResult = {
    schema: "rbm-capability-result/v1",
    capability_id: capabilityId,
    scenario,
    case_id: `${capabilityId}-${scenario}`,
    candidate: { commit: candidate.commit, tree: candidate.tree },
    result,
    oracle: "fixture oracle",
    control_sha256: `sha256:${"c".repeat(64)}`,
    unavailable_evidence: result === "unavailable" ? ["provider inventory"] : [],
    material_gaps: unverified ? ["embedded evidence gap"] : [],
    mutation_observation: "none",
  };
  const finalMessage = JSON.stringify(capabilityResult);
  const subagent = sourceKind === "independent_review";
  const source = subagent
    ? { subagent: { thread_spawn: { parent_thread_id: parentId, depth: 1, agent_path: "/fixture/reviewer", agent_role: "mission_evaluator" } } }
    : "cli";
  const trace = [
    { type: "session_meta", payload: { id: sessionId, session_id: sessionId, originator: "Codex CLI", cli_version: cliVersion, model_provider: "openai", source, thread_source: subagent ? "subagent" : "root" } },
    { type: "event_msg", payload: { type: "task_started", turn_id: `turn-${trial}` } },
    ...(sourceKind === "deterministic_replay" ? [
      { type: "response_item", payload: { type: "custom_tool_call", name: "exec", call_id: `call-${sessionId}` } },
      { type: "response_item", payload: { type: "custom_tool_call_output", call_id: `call-${sessionId}`, output: "verified" } },
    ] : []),
    { type: "event_msg", payload: { type: "token_count", info: { total_token_usage: { input_tokens: trial, output_tokens: trial } } } },
    { type: "response_item", payload: { type: "message", role: "assistant", content: [{ type: "output_text", text: finalMessage }] } },
    { type: "event_msg", payload: { type: "task_complete", turn_id: `turn-${trial}`, last_agent_message: finalMessage } },
  ];
  let artifact = Buffer.from(`${trace.map((entry) => JSON.stringify(entry)).join("\n")}\n`);
  let nativeEnvironment = environmentId;
  if (sourceKind === "native_trace" && result === "pass") {
    const userAgent = "Codex Desktop/0.147.0 (fixture)";
    const executableSha256 = `sha256:${"d".repeat(64)}`;
    nativeEnvironment = `codex-app-server:${userAgent}:unix:fixture:${executableSha256}`;
    const payload = canonical({
      schema: "rbm-native-evidence/v2",
      authority: "local_interface_observation",
      executable: { sha256: executableSha256, server_version: "0.147.0" },
      host: { platform_family: "unix", platform_os: "fixture", user_agent: userAgent },
      thread: { cli_version: "0.146.0", cwd_sha256: `sha256:${"e".repeat(64)}`, id: sessionId, parent_thread_id: null, session_id_sha256: `sha256:${"a".repeat(64)}`, source: { kind: "cli", sha256: `sha256:${"f".repeat(64)}` }, status: "notLoaded" },
      goal: null,
      expectation: { goal_status: "absent", objective_sha256: null },
      binding: { capability_id: capabilityId, scenario, case_id: `${capabilityId}-${scenario}`, candidate: { commit: candidate.commit, tree: candidate.tree }, result },
      result: "matched",
    });
    artifact = Buffer.from(`${JSON.stringify(canonical({ schema: "rbm-native-evidence-envelope/v2", content_sha256: sha(Buffer.from(JSON.stringify(payload))), payload }))}\n`);
  }
  return {
    sessionId,
    parentId,
    environmentId,
    artifact,
    observation: {
      capability_id: capabilityId,
      scenario,
      case_id: `${capabilityId}-${scenario}`,
      trial_id: String(trial),
      environment_id: nativeEnvironment,
      subject_id: candidate.commit,
      producer_id: subagent ? parentId : sessionId,
      observer_id: sessionId,
      source_kind: sourceKind,
      result,
      artifact_path: "",
      content_sha256: sha(artifact),
    },
  };
}

const goldenCases = parseYaml(await readFile(path.resolve("evals/cases/golden.yaml"), "utf8"));

function deterministicOutput(testCase) {
  return (testCase.assert ?? []).flatMap((assertion) => {
    if (assertion.type === "contains") return [assertion.value];
    if (assertion.type === "contains-all") return assertion.value;
    return [];
  }).join("\n");
}

async function deterministicEvidence(directory, weakCapability) {
  const selectedCases = goldenCases.filter((testCase) => /^\[(?:smoke|full)\]/.test(testCase.description));
  const runtimeCases = runtimeCasesForInstalledSkill(selectedCases);
  const home = path.join(temporaryRoot, "eval-home");
  const rows = runtimeCases.flatMap((testCase, caseIndex) => [1, 2].map((trial) => {
    const output = deterministicOutput(testCase);
    const expectsSkill = testCase.metadata.observations.skill_activation.expected === "used";
    const command = expectsSkill
      ? `sed -n 1,20p ${path.join(home, ".agents", "skills", "run-bounded-mission", "SKILL.md")}`
      : "pwd";
    const items = [
      { id: `command-${caseIndex}-${trial}`, type: "command_execution", command, aggregated_output: "verified\n", exit_code: 0, status: "completed" },
      { id: `message-${caseIndex}-${trial}`, type: "agent_message", text: output },
    ];
    return {
      success: true,
      provider: { id: "openai:codex-sdk" },
      response: {
        output,
        raw: JSON.stringify({
          finalResponse: output,
          items,
          usage: { input_tokens: 1, cached_input_tokens: 0, output_tokens: 1, reasoning_output_tokens: 0 },
          reasoningTexts: [],
          conversationMessages: [
            { role: "user", content: testCase.vars.prompt },
            { role: "assistant", content: output },
          ],
        }),
      },
      testCase: structuredClone(testCase),
      gradingResult: {
        pass: true,
        componentResults: testCase.assert.map((assertion) => ({ pass: true, assertion: structuredClone(assertion) })),
      },
    };
  }));
  const artifact = {
    author: null,
    results: { results: rows, stats: { successes: rows.length, failures: 0, errors: 0 } },
    config: {
      providers: [{
        id: "openai:codex-sdk",
        label: "synthetic-model/low",
        config: {
          model: "synthetic-model",
          model_reasoning_effort: "low",
          working_dir: "[REDACTED]",
          cli_env: { HOME: "[REDACTED]", CODEX_HOME: "[REDACTED]" },
          sandbox_mode: "read-only",
          approval_policy: "never",
          network_access_enabled: false,
          web_search_enabled: false,
          enable_streaming: true,
          inherit_process_env: false,
        },
      }],
      metadata: { candidate: { commit: candidate.commit, tree: candidate.tree } },
    },
    runtimeOptions: { repeat: 2 },
  };
  const artifactBytes = Buffer.from(`${JSON.stringify(artifact, null, 2)}\n`);
  const artifactName = "validated-full-result.json";
  await writeFile(path.join(directory, artifactName), artifactBytes);
  const runnerEvidence = capabilityEvidenceForValidatedResult({
    artifact,
    cases: runtimeCases,
    repeat: 2,
    candidate: { commit: candidate.commit, tree: candidate.tree },
    repository: candidate.repository,
    catalogBytes: committedCatalogBytes,
    resultArtifactName: artifactName,
  });
  runnerEvidence.observations = runnerEvidence.observations.filter((entry) => entry.capability_id !== weakCapability);
  const runnerEvidencePath = path.join(directory, "runner-evidence.json");
  await writeFile(runnerEvidencePath, `${JSON.stringify(runnerEvidence, null, 2)}\n`);
  return { observations: runnerEvidence.observations, runnerEvidencePath };
}

async function fixture(name, { weakCapability, gap, selfReview = false, duplicateObservation = false, unavailable = false } = {}) {
  const directory = path.join(temporaryRoot, name);
  await mkdir(directory, { recursive: true });
  const observations = [];
  const generated = await deterministicEvidence(directory, weakCapability);
  observations.push(...generated.observations);
  for (const capability of catalog.capabilities) {
    if (capability.id === weakCapability) continue;
    for (const scenario of catalog.default_requirements.scenarios) {
      for (const [index, sourceKind] of catalog.default_requirements.sources.entries()) {
        if (sourceKind === "deterministic_replay") continue;
        const trial = index + 1;
        const built = rollout({
          capabilityId: capability.id,
          scenario,
          trial,
          sourceKind,
        });
        const artifactName = `${capability.id}-${scenario}-${trial}-${sourceKind}.jsonl`;
        await writeFile(path.join(directory, artifactName), built.artifact);
        built.observation.artifact_path = artifactName;
        if (selfReview && sourceKind === "independent_review" && capability.id === catalog.capabilities[0].id) {
          built.observation.observer_id = candidate.commit;
        }
        observations.push(built.observation);
      }
    }
  }
  if (unavailable) {
    const capabilityId = catalog.capabilities[0].id;
    const built = rollout({ capabilityId, scenario: "positive", trial: 4, sourceKind: "native_trace", result: "unavailable" });
    const artifactName = `${capabilityId}-positive-4-native_trace-unavailable.jsonl`;
    await writeFile(path.join(directory, artifactName), built.artifact);
    built.observation.artifact_path = artifactName;
    observations.push(built.observation);
  }
  if (duplicateObservation) observations.push(structuredClone(observations[0]));
  const evidence = {
    schema_version: 1,
    catalog_sha256: sha(committedCatalogBytes),
    candidate,
    attempt_inventory: { status: "unavailable", locator: "provider attestation unavailable" },
    observations,
    open_gaps: gap ? [{ capability_id: catalog.capabilities[0].id, severity: gap, description: "open defect", locator: "fixture:gap" }] : [],
  };
  const evidencePath = path.join(directory, "evidence.json");
  await writeFile(evidencePath, `${JSON.stringify(evidence, null, 2)}\n`);
  return { directory, evidencePath, runnerEvidencePath: generated.runnerEvidencePath };
}

try {
  assert.match(await validateCatalogFile(catalogPath), /^sha256:[a-f0-9]{64}$/);
  const complete = await fixture("complete");
  const runnerOnlyScore = await scoreEvidence({ evidencePath: complete.runnerEvidencePath });
  assert.equal(runnerOnlyScore.eligible, false);
  assert.equal(runnerOnlyScore.minimum_score, 0, "runner evidence must leave uncovered capability leaves at zero");
  assert.ok(runnerOnlyScore.capabilities.some((row) => row.reason === "local_writable_trace_has_no_provider_attestation"));
  const completeScore = await scoreEvidence(complete);
  assert.equal(completeScore.eligible, false, "locally writable traces must never self-certify 9.5");
  assert.equal(completeScore.weighted_score, 2);
  assert.equal(completeScore.minimum_score, 2);
  assert.equal(completeScore.evidence_limit, "provider_attested_attempt_inventory_unavailable");
  assert.ok(completeScore.capabilities.every((row) => row.score === 2 && row.maturity === "declared" && !("observed_score" in row)));

  const weakId = catalog.capabilities.at(-1).id;
  const weak = await fixture("weak", { weakCapability: weakId });
  const weakScore = await scoreEvidence(weak);
  assert.equal(weakScore.minimum_score, 0, "minimum leaf must expose an omitted weak capability");
  assert.ok(weakScore.below_target.includes(weakId));

  const materialGap = await fixture("material-gap", { gap: "material" });
  const materialRow = (await scoreEvidence(materialGap)).capabilities.find((row) => row.id === catalog.capabilities[0].id);
  assert.equal(materialRow.score, 0);
  assert.equal(materialRow.reason, "material_gap");

  const criticalGap = await fixture("critical-gap", { gap: "critical" });
  const criticalScore = await scoreEvidence(criticalGap);
  assert.equal(criticalScore.capabilities.find((row) => row.id === catalog.capabilities[0].id).score, 0);
  assert.ok(criticalScore.critical_breaches.includes(catalog.capabilities[0].id));

  const unavailable = await fixture("unavailable", { unavailable: true });
  const unavailableRow = (await scoreEvidence(unavailable)).capabilities.find((row) => row.id === catalog.capabilities[0].id);
  assert.equal(unavailableRow.score, 0);
  assert.equal(unavailableRow.reason, "unavailable_observation");
  assert.equal(unavailableRow.unavailable_count, 1);

  const selfReview = await fixture("self-review", { selfReview: true });
  await assert.rejects(() => scoreEvidence(selfReview), /observer must differ/, "self-review must not count as independent evidence");

  const duplicate = await fixture("duplicate", { duplicateObservation: true });
  await assert.rejects(() => scoreEvidence(duplicate), /repeats one observation identity/);

  const corrupt = await fixture("corrupt");
  const corruptEvidence = JSON.parse(await readFile(corrupt.evidencePath, "utf8"));
  await writeFile(path.join(corrupt.directory, corruptEvidence.observations[0].artifact_path), "tampered\n");
  await assert.rejects(() => scoreEvidence(corrupt), /digest mismatch/);

  const wrongCase = await fixture("wrong-case");
  const wrongCaseEvidence = JSON.parse(await readFile(wrongCase.evidencePath, "utf8"));
  const deterministicObservation = wrongCaseEvidence.observations.find((entry) => entry.source_kind === "deterministic_replay");
  deterministicObservation.case_id = "answer-only-nonactivation";
  await writeFile(wrongCase.evidencePath, `${JSON.stringify(wrongCaseEvidence, null, 2)}\n`);
  await assert.rejects(() => scoreEvidence(wrongCase), /does not match the committed case binding/);

  const wrongPrincipal = await fixture("wrong-principal");
  const wrongPrincipalEvidence = JSON.parse(await readFile(wrongPrincipal.evidencePath, "utf8"));
  wrongPrincipalEvidence.observations.find((entry) => entry.source_kind === "deterministic_replay").producer_id = `sha256:${"0".repeat(64)}`;
  await writeFile(wrongPrincipal.evidencePath, `${JSON.stringify(wrongPrincipalEvidence, null, 2)}\n`);
  await assert.rejects(() => scoreEvidence(wrongPrincipal), /principals or result do not match/);

  const staleResult = await fixture("stale-result");
  const staleEvidence = JSON.parse(await readFile(staleResult.evidencePath, "utf8"));
  const staleObservation = staleEvidence.observations.find((entry) => entry.source_kind === "deterministic_replay");
  const staleArtifactPath = path.join(staleResult.directory, staleObservation.artifact_path);
  const staleArtifact = JSON.parse(await readFile(staleArtifactPath, "utf8"));
  staleArtifact.config.metadata.candidate.commit = "f".repeat(40);
  const staleBytes = Buffer.from(`${JSON.stringify(staleArtifact, null, 2)}\n`);
  await writeFile(staleArtifactPath, staleBytes);
  for (const observation of staleEvidence.observations.filter((entry) => entry.source_kind === "deterministic_replay")) {
    observation.content_sha256 = sha(staleBytes);
    observation.observer_id = sha(staleBytes);
  }
  await writeFile(staleResult.evidencePath, `${JSON.stringify(staleEvidence, null, 2)}\n`);
  await assert.rejects(() => scoreEvidence(staleResult), /not bound to the exact candidate/);

  const nativeMismatch = await fixture("native-mismatch");
  const nativeEvidence = JSON.parse(await readFile(nativeMismatch.evidencePath, "utf8"));
  const nativeObservation = nativeEvidence.observations.find((entry) => entry.source_kind === "native_trace" && entry.result === "pass");
  const nativePath = path.join(nativeMismatch.directory, nativeObservation.artifact_path);
  const nativeReceipt = JSON.parse(await readFile(nativePath, "utf8"));
  nativeReceipt.payload.expectation = { goal_status: "active", objective_sha256: `sha256:${"1".repeat(64)}` };
  nativeReceipt.content_sha256 = sha(Buffer.from(JSON.stringify(canonical(nativeReceipt.payload))));
  const mismatchedBytes = Buffer.from(`${JSON.stringify(nativeReceipt)}\n`);
  await writeFile(nativePath, mismatchedBytes);
  nativeObservation.content_sha256 = sha(mismatchedBytes);
  await writeFile(nativeMismatch.evidencePath, `${JSON.stringify(nativeEvidence, null, 2)}\n`);
  await assert.rejects(() => scoreEvidence(nativeMismatch), /goal does not match expectation/);

  const wrongCandidate = await fixture("wrong-candidate");
  const wrongEvidence = JSON.parse(await readFile(wrongCandidate.evidencePath, "utf8"));
  wrongEvidence.candidate.tree = "b".repeat(40);
  await writeFile(wrongCandidate.evidencePath, `${JSON.stringify(wrongEvidence, null, 2)}\n`);
  await assert.rejects(() => scoreEvidence(wrongCandidate), /not a real Git identity/);

  const duplicateJson = await fixture("duplicate-json");
  const source = await readFile(duplicateJson.evidencePath, "utf8");
  await writeFile(duplicateJson.evidencePath, source.replace('{\n  "schema_version": 1,', '{\n  "schema_version": 1,\n  "schema_version": 1,'));
  await assert.rejects(() => scoreEvidence(duplicateJson), /duplicate JSON object member schema_version/);

  const reorderedCatalog = structuredClone(catalog);
  reorderedCatalog.score_anchors = { declared: 2, varied_no_material_gap: 9.5, dynamic: 6, absent_or_contradicted: 0, representative: 8, reachable: 4 };
  const reorderedCatalogPath = path.join(temporaryRoot, "reordered-catalog.json");
  await writeFile(reorderedCatalogPath, `${JSON.stringify(reorderedCatalog, null, 2)}\n`);
  assert.match(await validateCatalogFile(reorderedCatalogPath), /^sha256:[a-f0-9]{64}$/);

  const emptyEvidencePath = path.join(temporaryRoot, "empty-evidence.json");
  await writeFile(emptyEvidencePath, `${JSON.stringify({
    schema_version: 1,
    catalog_sha256: sha(committedCatalogBytes),
    candidate,
    attempt_inventory: { status: "unavailable", locator: "provider attestation unavailable" },
    observations: [],
    open_gaps: [],
  }, null, 2)}\n`);
  const cli = await execFileAsync(process.execPath, [path.join(repository, "scripts", "capability-score.mjs"), emptyEvidencePath], {
    cwd: repository,
    encoding: "utf8",
    env: gitEnvironment,
  }).catch((error) => error);
  assert.equal(cli.code, 1, "an ineligible capability report must fail the CLI gate");
  assert.match(cli.stdout, /"eligible": false/);

  console.log("capability score tests passed");
} finally {
  await rm(temporaryRoot, { recursive: true, force: true });
}
