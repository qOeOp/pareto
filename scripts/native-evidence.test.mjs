import assert from "node:assert/strict";
import { execFile } from "node:child_process";
import { createHash } from "node:crypto";
import { chmod, copyFile, mkdir, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { promisify } from "node:util";
import { parse as parseYaml } from "yaml";
import { collectNativeEvidence } from "./native-evidence.mjs";

const execFileAsync = promisify(execFile);
const threadId = "019fb8b4-ebd0-7c20-8ba1-041ed6836204";
const turnId = "019fb8b4-ebd0-7c20-8ba1-041ed6836207";
const objective = "prove the native evidence route";
const digest = (value) => `sha256:${createHash("sha256").update(value).digest("hex")}`;
const canonical = (value) => Array.isArray(value) ? value.map(canonical) : value && typeof value === "object" ? Object.fromEntries(Object.keys(value).sort().map((key) => [key, canonical(value[key])])) : value;
const objectiveSha256 = digest(objective);
const temporaryRoot = await mkdtemp(path.join(os.tmpdir(), "native-evidence-test-"));
const repository = path.join(temporaryRoot, "repository");
const gitEnvironment = Object.fromEntries(Object.entries(process.env).filter(([name]) => !/^GIT_/i.test(name)));

async function git(args) {
  const { stdout } = await execFileAsync("git", ["-C", repository, ...args], { encoding: "utf8", env: gitEnvironment });
  return stdout.trim();
}

await mkdir(path.join(repository, "evals", "cases"), { recursive: true });
await copyFile(path.resolve("evals/capabilities.json"), path.join(repository, "evals", "capabilities.json"));
await copyFile(path.resolve("evals/cases/golden.yaml"), path.join(repository, "evals", "cases", "golden.yaml"));
await copyFile(path.resolve("evals/cases/holdout.yaml"), path.join(repository, "evals", "cases", "holdout.yaml"));
await git(["init", "--quiet"]);
await git(["config", "user.name", "Native Evidence Test"]);
await git(["config", "user.email", "native-evidence@example.invalid"]);
await git(["remote", "add", "origin", "https://example.invalid/qoeop/pareto.git"]);
await git(["add", "evals"]);
await git(["commit", "--quiet", "-m", "candidate"]);

const candidate = { commit: await git(["rev-parse", "HEAD"]), tree: await git(["rev-parse", "HEAD^{tree}"]) };
const sourceCase = parseYaml(await readFile(path.resolve("evals/cases/golden.yaml"), "utf8"))[0];
const caseBinding = sourceCase.metadata.observations.capability;
const casePrompt = sourceCase.vars.prompt;
const controlSha256 = digest(JSON.stringify(canonical(sourceCase)));
const capabilityResult = {
  schema: "rbm-capability-result/v1",
  capability_id: caseBinding.id,
  scenario: caseBinding.scenario,
  case_id: caseBinding.case_id,
  candidate,
  result: "pass",
  oracle: sourceCase.metadata.observations.behavioral_oracle,
  control_sha256: controlSha256,
  unavailable_evidence: [],
  material_gaps: [],
  mutation_observation: "none",
};
const binding = { expectedServerVersion: "0.147.0", appServerCwd: temporaryRoot, repositoryRoot: repository, turnId };

function turnFixture({ prompt = casePrompt, finalText = JSON.stringify(capabilityResult), status = "completed", phase = "final_answer", itemsView = "full" } = {}) {
  return {
    id: turnId,
    items: [
      { type: "userMessage", id: "user-1", clientId: null, content: [{ type: "text", text: prompt, text_elements: [] }] },
      { type: "agentMessage", id: "agent-1", text: finalText, phase, memoryCitation: null },
    ],
    itemsView,
    status,
    error: status === "failed" ? { message: "failed", codexErrorInfo: null, additionalDetails: null } : null,
    startedAt: 1,
    completedAt: status === "completed" ? 2 : null,
    durationMs: status === "completed" ? 1000 : null,
  };
}

async function fakeServer({ goal = { threadId, objective, status: "active" }, duplicate = false, initializeError = false, readError = false, silent = false, source = "cli", sessionId = threadId, parentThreadId = null, ignoreTerm = false, pidFile = null, turns = [turnFixture()] } = {}) {
  const executable = path.join(temporaryRoot, "app-server");
  const fixture = { threadId, goal, duplicate, initializeError, readError, silent, source, sessionId, parentThreadId, ignoreTerm, pidFile, turns };
  const program = `#!/usr/bin/env node
const readline = require("node:readline");
const fs = require("node:fs");
const fixture = ${JSON.stringify(fixture)};
if (fixture.pidFile) fs.writeFileSync(fixture.pidFile, String(process.pid));
if (fixture.ignoreTerm) process.on("SIGTERM", () => {});
const rl = readline.createInterface({ input: process.stdin });
rl.on("line", (line) => {
  const message = JSON.parse(line);
  if (fixture.silent) return;
  if (message.id === 0) {
    if (fixture.duplicate) process.stdout.write("{\\"id\\":0,\\"id\\":0,\\"result\\":{}}\\n");
    else if (fixture.initializeError) process.stdout.write(JSON.stringify({ id: 0, error: { message: "/private/secret" } }) + "\\n");
    else process.stdout.write(JSON.stringify({ id: 0, result: { userAgent: "Codex Desktop/0.147.0 (fixture)", platformFamily: "unix", platformOs: "fixture" } }) + "\\n");
  }
  if (message.id === 1) {
    const response = fixture.readError ? { id: 1, error: { message: "/private/secret" } } : { id: 1, result: { thread: { id: fixture.threadId, sessionId: fixture.sessionId, parentThreadId: fixture.parentThreadId, cliVersion: "0.147.0", source: fixture.source, cwd: "/private/workspace", status: { type: "notLoaded" } } } };
    process.stdout.write(JSON.stringify(response) + "\\n");
  }
  if (message.id === 2) process.stdout.write(JSON.stringify({ id: 2, result: { goal: fixture.goal } }) + "\\n");
  if (message.id >= 3) process.stdout.write(JSON.stringify({ id: message.id, result: { data: fixture.turns, nextCursor: null, backwardsCursor: null } }) + "\\n");
});
`;
  await writeFile(executable, program);
  await chmod(executable, 0o755);
  return process.execPath;
}

try {
  const receipt = await collectNativeEvidence({ ...binding, threadId, expectedGoalStatus: "active", expectedObjectiveSha256: objectiveSha256, codexExecutable: await fakeServer() });
  assert.equal(receipt.schema, "rbm-native-evidence-envelope/v3");
  assert.equal(receipt.payload.result, "matched");
  assert.equal(receipt.payload.binding.capability_id, caseBinding.id);
  assert.equal(receipt.payload.binding.control_sha256, controlSha256);
  assert.equal(receipt.payload.turn.id, turnId);
  assert.equal(receipt.payload.turn.prompt_sha256, digest(casePrompt));
  assert.equal(receipt.payload.turn.capability_result_sha256, digest(JSON.stringify(canonical(capabilityResult))));
  assert.equal(receipt.payload.goal.objective_sha256, objectiveSha256);
  assert.match(receipt.payload.executable.sha256, /^sha256:[a-f0-9]{64}$/);
  assert.equal(receipt.content_sha256, digest(JSON.stringify(receipt.payload)));
  assert.equal(JSON.stringify(receipt).includes(objective), false);
  assert.equal(JSON.stringify(receipt).includes(casePrompt), false);
  assert.equal(JSON.stringify(receipt).includes("/private"), false);

  const absent = await collectNativeEvidence({ ...binding, threadId, expectedGoalStatus: "absent", codexExecutable: await fakeServer({ goal: null }) });
  assert.equal(absent.payload.goal, null);

  const rootSessionId = "019fb8b4-ebd0-7c20-8ba1-041ed6836205";
  const parentThreadId = "019fb8b4-ebd0-7c20-8ba1-041ed6836206";
  const subagent = await collectNativeEvidence({ ...binding, threadId, expectedGoalStatus: "absent", codexExecutable: await fakeServer({ goal: null, sessionId: rootSessionId, parentThreadId, source: { subAgent: { thread_spawn: { depth: 1, parent_thread_id: parentThreadId } } } }) });
  assert.equal(subagent.payload.thread.source.kind, "subAgent");
  assert.equal(JSON.stringify(subagent).includes(rootSessionId), false);

  const pidFile = path.join(temporaryRoot, "stubborn.pid");
  await collectNativeEvidence({ ...binding, threadId, expectedGoalStatus: "absent", codexExecutable: await fakeServer({ goal: null, ignoreTerm: true, pidFile }) });
  const stubbornPid = Number(await readFile(pidFile, "utf8"));
  assert.throws(() => process.kill(stubbornPid, 0), /ESRCH/);

  await assert.rejects(async () => collectNativeEvidence({ ...binding, threadId, expectedGoalStatus: "active", expectedObjectiveSha256: objectiveSha256, codexExecutable: await fakeServer({ turns: [turnFixture({ prompt: "not the committed prompt" })] }) }), /prompt does not match/);
  await assert.rejects(async () => collectNativeEvidence({ ...binding, threadId, expectedGoalStatus: "active", expectedObjectiveSha256: objectiveSha256, codexExecutable: await fakeServer({ turns: [turnFixture({ status: "inProgress" })] }) }), /not one complete full turn/);
  const priorTurn = { ...turnFixture(), id: "019fb8b4-ebd0-7c20-8ba1-041ed6836208" };
  await assert.rejects(async () => collectNativeEvidence({ ...binding, threadId, expectedGoalStatus: "active", expectedObjectiveSha256: objectiveSha256, codexExecutable: await fakeServer({ turns: [priorTurn, turnFixture()] }) }), /exactly one turn/);
  const wrongResult = { ...capabilityResult, case_id: "missing-case" };
  await assert.rejects(async () => collectNativeEvidence({ ...binding, threadId, expectedGoalStatus: "active", expectedObjectiveSha256: objectiveSha256, codexExecutable: await fakeServer({ turns: [turnFixture({ finalText: JSON.stringify(wrongResult) })] }) }), /does not name one committed/);
  await assert.rejects(async () => collectNativeEvidence({ ...binding, threadId, expectedGoalStatus: "complete", expectedObjectiveSha256: objectiveSha256, codexExecutable: await fakeServer() }), /status mismatch/);
  await assert.rejects(async () => collectNativeEvidence({ ...binding, threadId, expectedGoalStatus: "active", expectedObjectiveSha256: objectiveSha256, codexExecutable: await fakeServer({ duplicate: true }) }), /duplicate JSON object member id/);

  const readError = await collectNativeEvidence({ ...binding, threadId, expectedGoalStatus: "active", expectedObjectiveSha256: objectiveSha256, codexExecutable: await fakeServer({ readError: true }) }).catch((error) => error);
  assert.equal(readError.message, "thread/read failed");
  const initializeError = await collectNativeEvidence({ ...binding, threadId, expectedGoalStatus: "active", expectedObjectiveSha256: objectiveSha256, codexExecutable: await fakeServer({ initializeError: true }) }).catch((error) => error);
  assert.equal(initializeError.message, "initialize failed");
  await assert.rejects(async () => collectNativeEvidence({ ...binding, threadId, expectedGoalStatus: "active", expectedObjectiveSha256: objectiveSha256, timeoutMs: 20, codexExecutable: await fakeServer({ silent: true }) }), /timed out/);
  console.log("native evidence tests passed");
} finally {
  await rm(temporaryRoot, { recursive: true, force: true });
}
