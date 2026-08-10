import assert from "node:assert/strict";
import { execFile } from "node:child_process";
import { createHash } from "node:crypto";
import { chmod, copyFile, cp, lstat, mkdir, mkdtemp, readFile, rm, symlink, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { promisify } from "node:util";
import { pathToFileURL } from "node:url";
import { parse as parseYaml } from "yaml";
import { nodeSupportsSigstore, validateCatalogFile } from "./capability-score.mjs";
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
const repositoryUrl = "https://github.com/qoeop/pareto-fixture";

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
await mkdir(path.join(repository, ".github", "workflows"), { recursive: true });
await mkdir(path.join(repository, "codex", "hooks"), { recursive: true });
for (const packageName of ["bundle", "core", "protobuf-specs", "tuf", "verify"]) {
  await cp(path.resolve("node_modules", "@sigstore", packageName),
    path.join(repository, "node_modules", "@sigstore", packageName), { recursive: true });
}
await writeFile(path.join(repository, "evals", "capabilities.json"), catalogBytes);
await copyFile(path.resolve("scripts/capability-score.mjs"), path.join(repository, "scripts", "capability-score.mjs"));
await copyFile(path.resolve("scripts/eval.mjs"), path.join(repository, "scripts", "eval.mjs"));
await copyFile(path.resolve("scripts/json.mjs"), path.join(repository, "scripts", "json.mjs"));
await copyFile(path.resolve("scripts/observe-install-capability.mjs"), path.join(repository, "scripts", "observe-install-capability.mjs"));
await copyFile(path.resolve("scripts/install-codex.mjs"), path.join(repository, "scripts", "install-codex.mjs"));
await copyFile(path.resolve("package.json"), path.join(repository, "package.json"));
await copyFile(path.resolve("package-lock.json"), path.join(repository, "package-lock.json"));
await copyFile(path.resolve(".github/workflows/observe-install-capability.yml"), path.join(repository, ".github", "workflows", "observe-install-capability.yml"));
await copyFile(path.resolve("codex/hooks/qoeop-trade-session-start.mjs"), path.join(repository, "codex", "hooks", "qoeop-trade-session-start.mjs"));
await cp(path.resolve("codex/agents"), path.join(repository, "codex", "agents"), { recursive: true });
await cp(path.resolve("skills/run-bounded-mission"), path.join(repository, "skills", "run-bounded-mission"), { recursive: true });
await copyFile(path.resolve("evals/cases/golden.yaml"), path.join(repository, "evals", "cases", "golden.yaml"));
await copyFile(path.resolve("evals/cases/holdout.yaml"), path.join(repository, "evals", "cases", "holdout.yaml"));
await writeFile(path.join(repository, ".gitignore"), "node_modules/\n");
await writeFile(path.join(repository, "fixture.txt"), "candidate\n");
await git(["add", ".github", ".gitignore", "codex", "evals", "scripts", "skills", "fixture.txt", "package.json", "package-lock.json"]);
await git(["commit", "--quiet", "-m", "candidate"]);
const candidate = { repository: repositoryUrl, commit: await git(["rev-parse", "HEAD"]), tree: await git(["rev-parse", "HEAD^{tree}"]) };
const { stdout: committedCatalogBytes } = await execFileAsync("git", ["-C", repository, "show", `${candidate.commit}:evals/capabilities.json`], {
  encoding: null,
  env: gitEnvironment,
});
await symlink(path.resolve("node_modules"), path.join(temporaryRoot, "node_modules"),
  process.platform === "win32" ? "junction" : "dir");
const { scoreEvidence } = await import(pathToFileURL(path.join(repository, "scripts", "capability-score.mjs")).href);

function rollout({ sourceCase, trial, sourceKind, result = "pass", unverified = false }) {
  const caseBinding = sourceCase.metadata.observations.capability;
  const capabilityId = caseBinding.id;
  const scenario = caseBinding.scenario;
  const caseId = caseBinding.case_id;
  const caseControl = sha(Buffer.from(JSON.stringify(canonical(sourceCase))));
  const sessionId = sourceKind === "native_trace" ? uuid(`session-${capabilityId}-${scenario}-${trial}-${result}`) : `session-${capabilityId}-${scenario}-${trial}-${sourceKind}-${result}`;
  const parentId = sourceKind === "native_trace" ? uuid(`parent-${capabilityId}-${scenario}-${trial}-${result}`) : `parent-${capabilityId}-${scenario}-${trial}-${sourceKind}-${result}`;
  const cliVersion = trial === 1 ? "1.0.0" : "2.0.0";
  const environmentId = `codex:Codex CLI:${cliVersion}:openai`;
  const capabilityResult = {
    schema: "rbm-capability-result/v1",
    capability_id: capabilityId,
    scenario,
    case_id: caseId,
    candidate: { commit: candidate.commit, tree: candidate.tree },
    result,
    oracle: sourceCase.metadata.observations.behavioral_oracle,
    control_sha256: caseControl,
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
    const output = deterministicOutput(sourceCase);
    const expectsSkill = sourceCase.metadata.observations.skill_activation.expected === "used";
    const nativeItems = [
      { id_sha256: sha(Buffer.from(`user-${caseId}-${trial}`)), raw_type: null, skill_read: false, terminal_state: null, type: "userMessage" },
      ...(expectsSkill ? [{ id_sha256: sha(Buffer.from(`command-${caseId}-${trial}`)), raw_type: "command_execution", skill_read: true, terminal_state: "completed", type: "commandExecution" }] : []),
      { id_sha256: sha(Buffer.from(`agent-${caseId}-${trial}`)), raw_type: "agent_message", skill_read: false, terminal_state: null, type: "agentMessage" },
    ];
    const observedRawItemTypes = [...new Set([
      ...(expectsSkill ? ["command_execution"] : []),
      "agent_message",
    ])];
    const deterministicAssertions = sourceCase.assert.filter((assertion) =>
      assertion.type !== "skill-used" && assertion.type !== "not-skill-used");
    const payload = canonical({
      schema: "rbm-native-evidence/v4",
      authority: "local_interface_observation",
      executable: { sha256: executableSha256, server_version: "0.147.0" },
      host: { platform_family: "unix", platform_os: "fixture", user_agent: userAgent },
      thread: { cli_version: "0.146.0", cwd_sha256: `sha256:${"e".repeat(64)}`, id: sessionId, parent_thread_id: null, session_id_sha256: `sha256:${"a".repeat(64)}`, source: { kind: "cli", sha256: `sha256:${"f".repeat(64)}` }, status: "notLoaded" },
      turn: {
        id: uuid(`turn-${capabilityId}-${scenario}-${trial}`),
        status: "completed",
        items: nativeItems,
        prompt_sha256: sha(Buffer.from(sourceCase.vars.prompt)),
        output_sha256: sha(Buffer.from(output)),
        oracle_result_sha256: sha(Buffer.from(JSON.stringify(canonical(capabilityResult)))),
      },
      goal: null,
      expectation: { goal_status: "absent", objective_sha256: null },
      binding: { capability_id: capabilityId, scenario, case_id: caseId, candidate: { commit: candidate.commit, tree: candidate.tree }, result, oracle: sourceCase.metadata.observations.behavioral_oracle, control_sha256: caseControl },
      oracle: {
        assertions_sha256: sha(Buffer.from(JSON.stringify(canonical(deterministicAssertions)))),
        expected_skill_activation: sourceCase.metadata.observations.skill_activation.expected,
        observed_skill_activation: sourceCase.metadata.observations.skill_activation.expected,
        required_raw_item_types: sourceCase.metadata.observations.required_raw_item_types,
        observed_raw_item_types: observedRawItemTypes,
      },
      result: "matched",
    });
    artifact = Buffer.from(`${JSON.stringify(canonical({ schema: "rbm-native-evidence-envelope/v4", content_sha256: sha(Buffer.from(JSON.stringify(payload))), payload }))}\n`);
  }
  return {
    sessionId,
    parentId,
    environmentId,
    artifact,
    observation: {
      capability_id: capabilityId,
      scenario,
      case_id: caseId,
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
const holdoutCases = parseYaml(await readFile(path.resolve("evals/cases/holdout.yaml"), "utf8"));
const committedCases = [...goldenCases, ...holdoutCases];
assert.deepEqual(
  committedCases
    .filter((testCase) => testCase.metadata.observations.capability.id === "EVAL-01")
    .map((testCase) => testCase.metadata.observations.capability)
    .sort((left, right) => left.scenario.localeCompare(right.scenario)),
  [
    { id: "EVAL-01", scenario: "negative", case_id: "self-authored-native-pass-rejected" },
    { id: "EVAL-01", scenario: "positive", case_id: "native-trajectory-local-boundary" },
    { id: "EVAL-01", scenario: "recovery", case_id: "native-trace-recovery-without-rewrite" },
  ],
  "native trajectory evidence must keep committed positive, negative, and recovery controls",
);

function deterministicOutput(testCase) {
  return (testCase.assert ?? []).flatMap((assertion) => {
    if (assertion.type === "contains") return [assertion.value];
    if (assertion.type === "contains-all") return assertion.value;
    if (assertion.type === "equals") return [assertion.value];
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
  for (const sourceCase of committedCases) {
    const binding = sourceCase.metadata.observations.capability;
    if (binding.id === weakCapability) continue;
    for (const [index, sourceKind] of ["native_trace", "independent_review"].entries()) {
      const trial = index + 1;
      const built = rollout({ sourceCase, trial, sourceKind });
      const artifactName = `${binding.case_id}-${trial}-${sourceKind}.jsonl`;
      await writeFile(path.join(directory, artifactName), built.artifact);
      built.observation.artifact_path = artifactName;
      if (selfReview && sourceKind === "independent_review" && binding.id === catalog.capabilities[0].id) {
        built.observation.observer_id = candidate.commit;
      }
      observations.push(built.observation);
    }
  }
  if (unavailable) {
    const sourceCase = committedCases[0];
    const binding = sourceCase.metadata.observations.capability;
    const built = rollout({ sourceCase, trial: 4, sourceKind: "native_trace", result: "unavailable" });
    const artifactName = `${binding.case_id}-4-native_trace-unavailable.jsonl`;
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

async function attestedFixture(name) {
  const directory = path.join(temporaryRoot, name);
  await mkdir(directory, { recursive: true });
  const object = async (objectPath) => git(["rev-parse", `${candidate.commit}:${objectPath}`]);
  const observer = {
    commit: candidate.commit,
    script_blob: await object("scripts/observe-install-capability.mjs"),
    tree: candidate.tree,
  };
  const subject = {
    codex_agents_tree: await object("codex/agents"),
    codex_session_hook_blob: await object("codex/hooks/qoeop-trade-session-start.mjs"),
    commit: candidate.commit,
    installer_blob: await object("scripts/install-codex.mjs"),
    repository: repositoryUrl,
    skill_tree: await object("skills/run-bounded-mission"),
    tree: candidate.tree,
  };
  const payload = canonical({
    schema: "pareto-capability-campaign/v1",
    authority: "github_attestation_subject",
    capability_id: "INS-01",
    environments: ["linux", "win32"],
    observations: [
      { content_sha256: `sha256:${"1".repeat(64)}`, environment: "linux" },
      { content_sha256: `sha256:${"2".repeat(64)}`, environment: "win32" },
    ],
    observer,
    result: "pass",
    scenarios: {
      negative: "stale-lock-rejected-without-install-drift",
      positive: "portable-skill-install-and-loader-discovery",
      recovery: "installed-skill-drift-repaired-and-discovered",
    },
    subject,
  });
  const campaign = Buffer.from(`${JSON.stringify(canonical({
    schema: "pareto-capability-campaign-envelope/v1",
    content_sha256: sha(Buffer.from(JSON.stringify(payload))),
    payload,
  }))}\n`);
  const bundle = Buffer.from(`${JSON.stringify({
    mediaType: "application/vnd.dev.sigstore.bundle.v0.3+json",
    dsseEnvelope: {
      payload: Buffer.from("{}").toString("base64"),
      payloadType: "application/vnd.in-toto+json",
      signatures: [{ sig: "AA==" }],
    },
    verificationMaterial: { certificate: { rawBytes: "AA==" }, tlogEntries: [] },
  })}\n`);
  await writeFile(path.join(directory, "ins-01-campaign.json"), campaign);
  await writeFile(path.join(directory, "attestation.json"), bundle);
  const evidence = {
    schema_version: 2,
    catalog_sha256: sha(committedCatalogBytes),
    candidate,
    attempt_inventory: { status: "unavailable", locator: "provider attestation unavailable for non-observer capabilities" },
    observations: [],
    attested_campaigns: [{
      campaign_path: "ins-01-campaign.json",
      campaign_sha256: sha(campaign),
      bundle_path: "attestation.json",
      bundle_sha256: sha(bundle),
    }],
    open_gaps: [],
  };
  const evidencePath = path.join(directory, "evidence.json");
  await writeFile(evidencePath, `${JSON.stringify(evidence, null, 2)}\n`);
  return { campaign, directory, evidence, evidencePath };
}

async function repeatedAttestedFixture(name) {
  const fixture = await attestedFixture(name);
  const baseEnvelope = JSON.parse(fixture.campaign);
  const observations = [];
  for (const environment of ["linux", "win32"]) {
    const runner = environment === "linux" ? "Linux" : "Windows";
    for (const trialId of [1, 2, 3]) {
      const payload = canonical({
        schema: "pareto-capability-observation/v2",
        authority: "fixed_observer_real_consumer",
        capability_id: "INS-01",
        environment: {
          arch: "x64",
          codex_entry_sha256: `sha256:${"3".repeat(64)}`,
          codex_user_agent: `fixture/${trialId}`,
          node: "v24.18.0",
          platform: environment,
        },
        observer: baseEnvelope.payload.observer,
        result: "pass",
        scenarios: {
          negative: {
            case_id: "stale-lock-rejected-without-install-drift",
            diagnostic_sha256: `sha256:${"4".repeat(64)}`,
            installation_after_sha256: `sha256:${"5".repeat(64)}`,
            installation_before_sha256: `sha256:${"5".repeat(64)}`,
            result: "pass",
          },
          positive: {
            case_id: "portable-skill-install-and-loader-discovery",
            installed_manifest_sha256: `sha256:${"6".repeat(64)}`,
            loader_sha256: `sha256:${"7".repeat(64)}`,
            protocol_notifications_sha256: `sha256:${"8".repeat(64)}`,
            result: "pass",
          },
          recovery: {
            case_id: "installed-skill-drift-repaired-and-discovered",
            drift_diagnostic_sha256: `sha256:${"9".repeat(64)}`,
            installed_manifest_sha256: `sha256:${"6".repeat(64)}`,
            loader_sha256: `sha256:${"7".repeat(64)}`,
            protocol_notifications_sha256: `sha256:${"8".repeat(64)}`,
            result: "pass",
          },
        },
        subject: baseEnvelope.payload.subject,
        trial_id: trialId,
      });
      const envelope = canonical({
        schema: "pareto-capability-observation-envelope/v1",
        content_sha256: sha(Buffer.from(JSON.stringify(payload))),
        payload,
      });
      const bytes = Buffer.from(`${JSON.stringify(envelope)}\n`);
      const directory = path.join(fixture.directory, "observations", `ins-01-${runner}-${trialId}`);
      await mkdir(directory, { recursive: true });
      await writeFile(path.join(directory, `observation-${runner}-${trialId}.json`), bytes);
      await copyFile(path.join(fixture.directory, "attestation.json"), path.join(directory, "attestation.json"));
      observations.push({
        bundle_path: `observations/ins-01-${runner}-${trialId}/attestation.json`,
        bundle_sha256: fixture.evidence.attested_campaigns[0].bundle_sha256,
        content_sha256: envelope.content_sha256,
        environment,
        trial_id: trialId,
      });
    }
  }
  const payload = canonical({
    ...baseEnvelope.payload,
    schema: "pareto-capability-campaign/v2",
    coverage: { environments: ["linux", "win32"], trials_per_environment: 3 },
    observations,
  });
  const campaign = Buffer.from(`${JSON.stringify(canonical({
    schema: "pareto-capability-campaign-envelope/v1",
    content_sha256: sha(Buffer.from(JSON.stringify(payload))),
    payload,
  }))}\n`);
  await writeFile(path.join(fixture.directory, "ins-01-campaign.json"), campaign);
  fixture.campaign = campaign;
  fixture.evidence.attested_campaigns[0].campaign_sha256 = sha(campaign);
  await writeFile(fixture.evidencePath, `${JSON.stringify(fixture.evidence, null, 2)}\n`);
  return fixture;
}

try {
  assert.equal(nodeSupportsSigstore("22.22.1"), false);
  assert.equal(nodeSupportsSigstore("22.22.2"), true);
  assert.equal(nodeSupportsSigstore("23.9.9"), false);
  assert.equal(nodeSupportsSigstore("24.14.9"), false);
  assert.equal(nodeSupportsSigstore("24.15.0"), true);
  assert.equal(nodeSupportsSigstore("25.0.0"), false);
  assert.equal(nodeSupportsSigstore("26.0.0"), true);
  assert.match(await validateCatalogFile(catalogPath), /^sha256:[a-f0-9]{64}$/);
  const complete = await fixture("complete");
  const runnerOnlyScore = await scoreEvidence({ evidencePath: complete.runnerEvidencePath });
  assert.equal(runnerOnlyScore.eligible, false);
  assert.equal(runnerOnlyScore.minimum_score, 0, "runner evidence must leave uncovered capability leaves at zero");
  assert.ok(runnerOnlyScore.capabilities.some((row) => row.reason === "local_writable_trace_has_no_provider_attestation"));
  const completeScore = await scoreEvidence(complete);
  assert.equal(completeScore.eligible, false, "locally writable traces must never self-certify 9.5");
  assert.equal(completeScore.minimum_score, 0, "leaves without committed cases must remain absent");
  assert.equal(completeScore.evidence_limit, "provider_attested_attempt_inventory_unavailable");
  assert.ok(completeScore.capabilities.some((row) => row.score === 2 && row.maturity === "declared"));
  assert.ok(completeScore.capabilities.every((row) => row.score <= 2 && !("observed_score" in row)));
  const nativeTrajectoryRow = completeScore.capabilities.find((row) => row.id === "EVAL-01");
  assert.equal(nativeTrajectoryRow.score, 2);
  assert.equal(nativeTrajectoryRow.maturity, "declared");
  assert.ok(nativeTrajectoryRow.observation_count >= 3);
  assert.deepEqual(completeScore.capabilities.find((row) => row.id === "PLN-02"), {
    ...catalog.capabilities.find((row) => row.id === "PLN-02"),
    score: 0,
    maturity: "absent",
    reason: "no_passing_evidence",
    observation_count: 0,
    attested_campaign_count: 0,
    unavailable_count: 0,
    gap_count: 0,
  }, "a leaf without a committed case cannot be populated by invented trace labels");

  const attested = await attestedFixture("attested-install");
  await assert.rejects(
    () => scoreEvidence(attested),
    /Sigstore attestation verification failed/,
    "caller-authored verifier output and unsigned bundles must never produce a dynamic score",
  );

  const duplicateRepeated = await repeatedAttestedFixture("repeated-attested-duplicate-slot");
  const duplicateEnvelope = JSON.parse(duplicateRepeated.campaign);
  duplicateEnvelope.payload.observations[1] = structuredClone(duplicateEnvelope.payload.observations[0]);
  duplicateEnvelope.content_sha256 = sha(Buffer.from(JSON.stringify(canonical(duplicateEnvelope.payload))));
  const duplicateBytes = Buffer.from(`${JSON.stringify(canonical(duplicateEnvelope))}\n`);
  await writeFile(path.join(duplicateRepeated.directory, "ins-01-campaign.json"), duplicateBytes);
  duplicateRepeated.evidence.attested_campaigns[0].campaign_sha256 = sha(duplicateBytes);
  await writeFile(duplicateRepeated.evidencePath, `${JSON.stringify(duplicateRepeated.evidence, null, 2)}\n`);
  await assert.rejects(
    () => scoreEvidence(duplicateRepeated),
    /repeated observation slots are invalid/,
    "a repeated slot must not substitute for a missing trial",
  );

  const mutatedNegative = await repeatedAttestedFixture("repeated-attested-mutated-negative");
  const observationPath = path.join(mutatedNegative.directory, "observations", "ins-01-Linux-1", "observation-Linux-1.json");
  const observationEnvelope = JSON.parse(await readFile(observationPath, "utf8"));
  observationEnvelope.payload.scenarios.negative.installation_after_sha256 = `sha256:${"a".repeat(64)}`;
  observationEnvelope.content_sha256 = sha(Buffer.from(JSON.stringify(canonical(observationEnvelope.payload))));
  await writeFile(observationPath, `${JSON.stringify(canonical(observationEnvelope))}\n`);
  const mutatedCampaignEnvelope = JSON.parse(mutatedNegative.campaign);
  mutatedCampaignEnvelope.payload.observations[0].content_sha256 = observationEnvelope.content_sha256;
  mutatedCampaignEnvelope.content_sha256 = sha(Buffer.from(JSON.stringify(canonical(mutatedCampaignEnvelope.payload))));
  const mutatedCampaignBytes = Buffer.from(`${JSON.stringify(canonical(mutatedCampaignEnvelope))}\n`);
  await writeFile(path.join(mutatedNegative.directory, "ins-01-campaign.json"), mutatedCampaignBytes);
  mutatedNegative.evidence.attested_campaigns[0].campaign_sha256 = sha(mutatedCampaignBytes);
  await writeFile(mutatedNegative.evidencePath, `${JSON.stringify(mutatedNegative.evidence, null, 2)}\n`);
  await assert.rejects(
    () => scoreEvidence(mutatedNegative),
    /negative scenario changed the installation/,
    "a signed or unsigned negative path with install drift must fail before scoring",
  );

  const divergentRecovery = await repeatedAttestedFixture("repeated-attested-divergent-recovery");
  const recoveryPath = path.join(divergentRecovery.directory, "observations", "ins-01-Linux-1", "observation-Linux-1.json");
  const recoveryEnvelope = JSON.parse(await readFile(recoveryPath, "utf8"));
  recoveryEnvelope.payload.scenarios.recovery.loader_sha256 = `sha256:${"b".repeat(64)}`;
  recoveryEnvelope.content_sha256 = sha(Buffer.from(JSON.stringify(canonical(recoveryEnvelope.payload))));
  await writeFile(recoveryPath, `${JSON.stringify(canonical(recoveryEnvelope))}\n`);
  const recoveryCampaignEnvelope = JSON.parse(divergentRecovery.campaign);
  recoveryCampaignEnvelope.payload.observations[0].content_sha256 = recoveryEnvelope.content_sha256;
  recoveryCampaignEnvelope.content_sha256 = sha(Buffer.from(JSON.stringify(canonical(recoveryCampaignEnvelope.payload))));
  const recoveryCampaignBytes = Buffer.from(`${JSON.stringify(canonical(recoveryCampaignEnvelope))}\n`);
  await writeFile(path.join(divergentRecovery.directory, "ins-01-campaign.json"), recoveryCampaignBytes);
  divergentRecovery.evidence.attested_campaigns[0].campaign_sha256 = sha(recoveryCampaignBytes);
  await writeFile(divergentRecovery.evidencePath, `${JSON.stringify(divergentRecovery.evidence, null, 2)}\n`);
  await assert.rejects(
    () => scoreEvidence(divergentRecovery),
    /recovery did not restore the positive consumer state/,
    "a recovery result that diverges from the positive installed consumer must fail before scoring",
  );

  const loaderMarker = path.join(temporaryRoot, "loader-hook-observed");
  const loaderHook = path.join(temporaryRoot, "loader-hook.mjs");
  await writeFile(loaderHook, `
    import { appendFileSync } from "node:fs";
    import { registerHooks } from "node:module";
    registerHooks({ load(url, context, nextLoad) {
      if (url.includes("pareto-sigstore-runtime-")) appendFileSync(${JSON.stringify(loaderMarker)}, url);
      return nextLoad(url, context);
    } });
  `);
  await assert.rejects(
    () => execFileAsync(process.execPath, ["--import", pathToFileURL(loaderHook).href,
      path.join(repository, "scripts", "capability-score.mjs"), attested.evidencePath], {
      encoding: "utf8",
      env: process.env,
    }),
    (error) => error.code === 1 && /isolated Sigstore attestation verification failed/.test(error.stderr),
  );
  assert.equal(await lstat(loaderMarker).catch(() => null), null,
    "a parent loader hook must not enter the isolated verifier process");

  const fakeGitDirectory = path.join(temporaryRoot, "fake-git");
  await mkdir(fakeGitDirectory);
  const fakeGit = path.join(fakeGitDirectory, process.platform === "win32" ? "git.cmd" : "git");
  await writeFile(fakeGit, process.platform === "win32" ? "@exit /b 99\r\n" : "#!/bin/sh\nexit 99\n");
  if (process.platform !== "win32") await chmod(fakeGit, 0o755);
  await assert.rejects(
    () => execFileAsync(process.execPath,
      [path.join(repository, "scripts", "capability-score.mjs"), complete.runnerEvidencePath], {
        encoding: "utf8",
        env: { ...process.env, PATH: fakeGitDirectory },
      }),
    (error) => error.code === 1 && JSON.parse(error.stdout).schema_version === 1,
    "ambient PATH Git replacement must not affect candidate authority",
  );

  const replacementCommit = await git(["commit-tree", candidate.tree, "-m", "replacement"]);
  await git(["replace", candidate.commit, replacementCommit]);
  try {
    await assert.rejects(() => scoreEvidence({ evidencePath: complete.runnerEvidencePath }), /contains replace refs/);
  } finally {
    await git(["replace", "-d", candidate.commit]);
  }

  await git(["update-index", "--assume-unchanged", "fixture.txt"]);
  try {
    await assert.rejects(
      () => scoreEvidence({ evidencePath: complete.runnerEvidencePath }),
      /index contains assume-unchanged or skip-worktree entries/,
    );
  } finally {
    await git(["update-index", "--no-assume-unchanged", "fixture.txt"]);
  }

  const mixedAuthority = await attestedFixture("attested-install-mixed-authority");
  mixedAuthority.evidence.observations = [{}];
  await writeFile(mixedAuthority.evidencePath, `${JSON.stringify(mixedAuthority.evidence, null, 2)}\n`);
  await assert.rejects(
    () => scoreEvidence(mixedAuthority),
    /cannot share a process with locally loaded observation runtimes/,
  );

  const tamperedRuntime = await attestedFixture("attested-install-tampered-runtime");
  const runtimeFile = path.join(repository, "node_modules", "@sigstore", "verify", "dist", "index.js");
  const runtimeBytes = await readFile(runtimeFile);
  try {
    await writeFile(runtimeFile, Buffer.concat([runtimeBytes, Buffer.from("\n// tampered\n")]));
    const campaignEnvelope = JSON.parse(tamperedRuntime.campaign);
    const campaignEntry = tamperedRuntime.evidence.attested_campaigns[0];
    const runtimeExpectation = Buffer.from(JSON.stringify(canonical({
      subject_name: campaignEntry.campaign_path,
      subject_sha256: campaignEntry.campaign_sha256,
      repository_slug: "qoeop/pareto-fixture",
      source_commit: campaignEnvelope.payload.observer.commit,
      workflow: ".github/workflows/observe-install-capability.yml",
    }))).toString("base64");
    const directRuntimeRoot = await mkdtemp(path.join(os.tmpdir(), "pareto-sigstore-runtime-"));
    try {
      await assert.rejects(
        () => execFileAsync(process.execPath, [path.join(repository, "scripts", "capability-score.mjs"),
          "--verify-sigstore", path.join(tamperedRuntime.directory, campaignEntry.bundle_path),
          campaignEntry.bundle_sha256, runtimeExpectation, directRuntimeRoot], { encoding: "utf8", env: process.env }),
        (error) => error.code === 1 && /Sigstore runtime content does not match the frozen dependency closure/.test(error.stderr),
        "an ignored live verifier mutation must fail before import",
      );
    } finally {
      await rm(directRuntimeRoot, { force: true, recursive: true });
    }
  } finally {
    await writeFile(runtimeFile, runtimeBytes);
  }

  if (process.platform !== "win32") {
    const symlinkedCampaign = await attestedFixture("attested-install-symlink");
    const campaignPath = path.join(symlinkedCampaign.directory, "ins-01-campaign.json");
    const campaignBytes = await readFile(campaignPath);
    await rm(campaignPath);
    await writeFile(path.join(symlinkedCampaign.directory, "campaign-target.json"), campaignBytes);
    await symlink("campaign-target.json", campaignPath);
    await assert.rejects(() => scoreEvidence(symlinkedCampaign), /attested campaign is missing or unsafe/);
  }

  const changedCampaign = await attestedFixture("attested-install-changed");
  const changedEnvelope = JSON.parse(changedCampaign.campaign);
  changedEnvelope.payload.scenarios.negative = "caller-invented-negative";
  changedEnvelope.content_sha256 = sha(Buffer.from(JSON.stringify(canonical(changedEnvelope.payload))));
  const changedBytes = Buffer.from(`${JSON.stringify(canonical(changedEnvelope))}\n`);
  await writeFile(path.join(changedCampaign.directory, "ins-01-campaign.json"), changedBytes);
  changedCampaign.evidence.attested_campaigns[0].campaign_sha256 = sha(changedBytes);
  await writeFile(changedCampaign.evidencePath, `${JSON.stringify(changedCampaign.evidence, null, 2)}\n`);
  await assert.rejects(() => scoreEvidence(changedCampaign), /campaign semantics are invalid/);

  const changedBundle = await attestedFixture("attested-install-bundle");
  const changedBundleBytes = Buffer.from("{}\n");
  await writeFile(path.join(changedBundle.directory, "attestation.json"), changedBundleBytes);
  changedBundle.evidence.attested_campaigns[0].bundle_sha256 = sha(changedBundleBytes);
  await writeFile(changedBundle.evidencePath, `${JSON.stringify(changedBundle.evidence, null, 2)}\n`);
  await assert.rejects(() => scoreEvidence(changedBundle), /Sigstore attestation/);

  const weakId = committedCases[0].metadata.observations.capability.id;
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
  const unavailableId = committedCases[0].metadata.observations.capability.id;
  const unavailableRow = (await scoreEvidence(unavailable)).capabilities.find((row) => row.id === unavailableId);
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

  const escaped = await fixture("escaped-artifact");
  const escapedEvidence = JSON.parse(await readFile(escaped.evidencePath, "utf8"));
  const escapedObservation = escapedEvidence.observations[0];
  const outsideArtifact = path.join(temporaryRoot, "outside-artifact.json");
  await copyFile(path.join(escaped.directory, escapedObservation.artifact_path), outsideArtifact);
  escapedObservation.artifact_path = outsideArtifact;
  await writeFile(escaped.evidencePath, `${JSON.stringify(escapedEvidence, null, 2)}\n`);
  await assert.rejects(() => scoreEvidence(escaped), /path must be relative/);

  const wrongCase = await fixture("wrong-case");
  const wrongCaseEvidence = JSON.parse(await readFile(wrongCase.evidencePath, "utf8"));
  const deterministicObservation = wrongCaseEvidence.observations.find((entry) => entry.source_kind === "deterministic_replay");
  deterministicObservation.case_id = "answer-only-nonactivation";
  await writeFile(wrongCase.evidencePath, `${JSON.stringify(wrongCaseEvidence, null, 2)}\n`);
  await assert.rejects(() => scoreEvidence(wrongCase), /does not match one committed capability case/);

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

  const nativeContentMismatch = await fixture("native-content-mismatch");
  const nativeContentEvidence = JSON.parse(await readFile(nativeContentMismatch.evidencePath, "utf8"));
  const nativeContentObservation = nativeContentEvidence.observations.find((entry) => entry.source_kind === "native_trace" && entry.result === "pass");
  const nativeContentPath = path.join(nativeContentMismatch.directory, nativeContentObservation.artifact_path);
  const nativeContentReceipt = JSON.parse(await readFile(nativeContentPath, "utf8"));
  nativeContentReceipt.payload.turn.prompt_sha256 = `sha256:${"0".repeat(64)}`;
  nativeContentReceipt.content_sha256 = sha(Buffer.from(JSON.stringify(canonical(nativeContentReceipt.payload))));
  const nativeContentBytes = Buffer.from(`${JSON.stringify(nativeContentReceipt)}\n`);
  await writeFile(nativeContentPath, nativeContentBytes);
  nativeContentObservation.content_sha256 = sha(nativeContentBytes);
  await writeFile(nativeContentMismatch.evidencePath, `${JSON.stringify(nativeContentEvidence, null, 2)}\n`);
  await assert.rejects(() => scoreEvidence(nativeContentMismatch), /prompt digest does not match committed case/);

  const nativeItemMismatch = await fixture("native-item-mismatch");
  const nativeItemEvidence = JSON.parse(await readFile(nativeItemMismatch.evidencePath, "utf8"));
  const nativeItemObservation = nativeItemEvidence.observations.find((entry) => entry.source_kind === "native_trace" && entry.result === "pass");
  const nativeItemPath = path.join(nativeItemMismatch.directory, nativeItemObservation.artifact_path);
  const nativeItemReceipt = JSON.parse(await readFile(nativeItemPath, "utf8"));
  const commandItem = nativeItemReceipt.payload.turn.items.find((item) => item.type === "commandExecution");
  commandItem.terminal_state = "inProgress";
  nativeItemReceipt.content_sha256 = sha(Buffer.from(JSON.stringify(canonical(nativeItemReceipt.payload))));
  const nativeItemBytes = Buffer.from(`${JSON.stringify(nativeItemReceipt)}\n`);
  await writeFile(nativeItemPath, nativeItemBytes);
  nativeItemObservation.content_sha256 = sha(nativeItemBytes);
  await writeFile(nativeItemMismatch.evidencePath, `${JSON.stringify(nativeItemEvidence, null, 2)}\n`);
  await assert.rejects(() => scoreEvidence(nativeItemMismatch), /native turn item observation is invalid/);

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

  const staleObserverRuntime = await repeatedAttestedFixture("repeated-attested-stale-runtime");
  const oldLock = await readFile(path.join(repository, "package-lock.json"));
  await writeFile(path.join(repository, "package-lock.json"), Buffer.concat([oldLock, Buffer.from("\n")]));
  await git(["add", "package-lock.json"]);
  await git(["commit", "--quiet", "-m", "change observer runtime"]);
  candidate.commit = await git(["rev-parse", "HEAD"]);
  candidate.tree = await git(["rev-parse", "HEAD^{tree}"]);
  staleObserverRuntime.evidence.candidate = { ...candidate };
  await writeFile(staleObserverRuntime.evidencePath, `${JSON.stringify(staleObserverRuntime.evidence, null, 2)}\n`);
  await assert.rejects(
    () => scoreEvidence(staleObserverRuntime),
    /stale for the current install consumer/,
    "a changed Codex dependency lock must invalidate older install observations before signature replay",
  );

  console.log("capability score tests passed");
} finally {
  await rm(temporaryRoot, { recursive: true, force: true });
}
