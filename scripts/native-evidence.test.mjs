import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { chmod, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { collectNativeEvidence } from "./native-evidence.mjs";

const threadId = "019fb8b4-ebd0-7c20-8ba1-041ed6836204";
const objective = "prove the native evidence route";
const objectiveSha256 = `sha256:${createHash("sha256").update(objective).digest("hex")}`;
const temporaryRoot = await mkdtemp(path.join(os.tmpdir(), "native-evidence-test-"));
const binding = { capabilityId: "ORC-01", scenario: "positive", caseId: "goal-active", candidateCommit: "a".repeat(40), candidateTree: "b".repeat(40), expectedServerVersion: "0.147.0" };
let fixtureIndex = 0;

async function fakeServer({ goal = { threadId, objective, status: "active" }, duplicate = false, initializeError = false, readError = false, silent = false, source = "cli", sessionId = threadId, parentThreadId = null, ignoreTerm = false, pidFile = null } = {}) {
  const executable = path.join(temporaryRoot, `codex-${fixtureIndex += 1}`);
  const fixture = { threadId, goal, duplicate, initializeError, readError, silent, source, sessionId, parentThreadId, ignoreTerm, pidFile };
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
    if (fixture.duplicate) process.stdout.write("{\\\"id\\\":0,\\\"id\\\":0,\\\"result\\\":{}}\\n");
    else if (fixture.initializeError) process.stdout.write(JSON.stringify({ id: 0, error: { message: "/private/secret" } }) + "\\n");
    else process.stdout.write(JSON.stringify({ id: 0, result: { userAgent: "Codex Desktop/0.147.0 (fixture)", platformFamily: "unix", platformOs: "fixture" } }) + "\\n");
  }
  if (message.id === 1) {
    const response = fixture.readError ? { id: 1, error: { message: "/private/secret" } } : { id: 1, result: { thread: { id: fixture.threadId, sessionId: fixture.sessionId, parentThreadId: fixture.parentThreadId, cliVersion: "0.146.0", source: fixture.source, cwd: "/private/workspace", status: { type: "notLoaded" } } } };
    process.stdout.write(JSON.stringify(response) + "\\n");
  }
  if (message.id === 2) process.stdout.write(JSON.stringify({ id: 2, result: { goal: fixture.goal } }) + "\\n");
});
`;
  await writeFile(executable, program);
  await chmod(executable, 0o755);
  return executable;
}

try {
  const receipt = await collectNativeEvidence({ ...binding, threadId, expectedGoalStatus: "active", expectedObjectiveSha256: objectiveSha256, codexExecutable: await fakeServer() });
  assert.equal(receipt.payload.result, "matched");
  assert.equal(receipt.payload.binding.capability_id, "ORC-01");
  assert.equal(receipt.payload.goal.objective_sha256, objectiveSha256);
  assert.match(receipt.payload.executable.sha256, /^sha256:[a-f0-9]{64}$/);
  assert.equal(receipt.content_sha256, `sha256:${createHash("sha256").update(JSON.stringify(receipt.payload)).digest("hex")}`);
  assert.equal(JSON.stringify(receipt).includes(objective), false);
  assert.equal(JSON.stringify(receipt).includes("/private"), false);

  const absent = await collectNativeEvidence({ ...binding, threadId, expectedGoalStatus: "absent", codexExecutable: await fakeServer({ goal: null }) });
  assert.equal(absent.payload.goal, null);

  const rootSessionId = "019fb8b4-ebd0-7c20-8ba1-041ed6836205";
  const parentThreadId = "019fb8b4-ebd0-7c20-8ba1-041ed6836206";
  const subagent = await collectNativeEvidence({ ...binding, threadId, expectedGoalStatus: "absent", codexExecutable: await fakeServer({ goal: null, sessionId: rootSessionId, parentThreadId, source: { subAgent: { thread_spawn: { depth: 1, parent_thread_id: parentThreadId } } } }) });
  assert.equal(subagent.payload.thread.source.kind, "subAgent");
  assert.equal(JSON.stringify(subagent).includes(rootSessionId), false, "session identity must remain digested");

  const pidFile = path.join(temporaryRoot, "stubborn.pid");
  await collectNativeEvidence({ ...binding, threadId, expectedGoalStatus: "absent", codexExecutable: await fakeServer({ goal: null, ignoreTerm: true, pidFile }) });
  const stubbornPid = Number(await readFile(pidFile, "utf8"));
  assert.throws(() => process.kill(stubbornPid, 0), /ESRCH/, "successful probes must reap the app-server process");

  await assert.rejects(async () => collectNativeEvidence({ ...binding, threadId, expectedGoalStatus: "complete", expectedObjectiveSha256: objectiveSha256, codexExecutable: await fakeServer() }), /status mismatch/);
  await assert.rejects(async () => collectNativeEvidence({ ...binding, threadId, expectedGoalStatus: "active", expectedObjectiveSha256: `sha256:${"0".repeat(64)}`, codexExecutable: await fakeServer() }), /objective digest mismatch/);
  await assert.rejects(async () => collectNativeEvidence({ ...binding, threadId, expectedGoalStatus: "active", expectedObjectiveSha256: objectiveSha256, codexExecutable: await fakeServer({ duplicate: true }) }), /duplicate JSON object member id/);

  const readError = await collectNativeEvidence({ ...binding, threadId, expectedGoalStatus: "active", expectedObjectiveSha256: objectiveSha256, codexExecutable: await fakeServer({ readError: true }) }).catch((error) => error);
  assert.equal(readError.message, "thread/read failed");
  assert.equal(readError.message.includes("/private"), false);
  const initializeError = await collectNativeEvidence({ ...binding, threadId, expectedGoalStatus: "active", expectedObjectiveSha256: objectiveSha256, codexExecutable: await fakeServer({ initializeError: true }) }).catch((error) => error);
  assert.equal(initializeError.message, "initialize failed");

  await assert.rejects(async () => collectNativeEvidence({ ...binding, threadId, expectedGoalStatus: "active", expectedObjectiveSha256: objectiveSha256, timeoutMs: 20, codexExecutable: await fakeServer({ silent: true }) }), /timed out/);
  console.log("native evidence tests passed");
} finally {
  await rm(temporaryRoot, { recursive: true, force: true });
}
