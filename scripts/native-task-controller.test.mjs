import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { createHash } from "node:crypto";
import { once } from "node:events";
import { chmod, mkdtemp, readFile, realpath, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { runNativeTask } from "./native-task-controller.mjs";

const temporaryRoot = await mkdtemp(path.join(os.tmpdir(), "native-task-controller-test-"));
const resolvedTemporaryRoot = await realpath(temporaryRoot);
const threadId = "019fb8b4-ebd0-7c20-8ba1-041ed6836204";
const turnId = "019fb8b4-ebd0-7c20-8ba1-041ed6836207";
const prompt = "Return exactly: controller fixture passed";
const finalText = "controller fixture passed";
const digest = (value) => `sha256:${createHash("sha256").update(value).digest("hex")}`;

async function fixtureExecutable({
  approval = false,
  approvalCommandMismatch = false,
  approvalWithoutStarted = false,
  availableDecisions = null,
  completedWithError = false,
  completedWithoutStarted = false,
  duplicateInitialize = false,
  exitEarly = false,
  fileApproval = false,
  omitResolved = false,
  postFinalAuthority = false,
  postTerminalItem = false,
  readbackExtraTurn = false,
  readbackFinalMismatch = false,
  readbackOmitAuthority = false,
  readbackPromptMismatch = false,
  serverConfigMismatch = false,
  terminalStatus = "completed",
  unapprovedCommand = null,
  version = "0.148.0",
} = {}) {
  const executable = path.join(temporaryRoot, `codex-${Math.random().toString(16).slice(2)}`);
  const fixture = { approval, approvalCommandMismatch, approvalWithoutStarted, availableDecisions, completedWithError, completedWithoutStarted, duplicateInitialize, executable, exitEarly, fileApproval, finalText, omitResolved, postFinalAuthority, postTerminalItem, readbackExtraTurn, readbackFinalMismatch, readbackOmitAuthority, readbackPromptMismatch, serverConfigMismatch, terminalStatus, threadId, turnId, unapprovedCommand, version };
  const program = `#!/usr/bin/env node
const readline = require("node:readline");
const fixture = ${JSON.stringify(fixture)};
if (process.argv[1] === fixture.executable) process.exit(5);
if (process.argv[2] === "--version") { process.stdout.write("codex-cli " + fixture.version + "\\n"); process.exit(0); }
if (process.argv[2] !== "app-server" || process.argv[3] !== "--stdio") process.exit(9);
const send = (value) => process.stdout.write(JSON.stringify(value) + "\\n");
let turnInput = [];
const rl = readline.createInterface({ input: process.stdin });
rl.on("line", (line) => {
  const message = JSON.parse(line);
  if (message.id === 0) {
    if (message.params.capabilities !== undefined) process.exit(8);
    send({ id: 0, result: { userAgent: "fixture/" + fixture.version, platformFamily: "unix", platformOs: "fixture" } });
    if (fixture.duplicateInitialize) send({ id: 0, result: { userAgent: "fixture/" + fixture.version } });
  }
  if (message.method === "initialized" && fixture.exitEarly) process.exit(7);
  if (message.method === "thread/start") {
    const sandboxTypes = { "read-only": "readOnly", "workspace-write": "workspaceWrite", "danger-full-access": "dangerFullAccess" };
    send({ id: 1, result: {
      approvalPolicy: fixture.serverConfigMismatch ? "untrusted" : message.params.approvalPolicy,
      cwd: message.params.cwd,
      model: message.params.model || "fixture-model",
      sandbox: { type: sandboxTypes[message.params.sandbox] },
      thread: { cwd: message.params.cwd, id: fixture.threadId },
    } });
  }
  if (message.method === "turn/start") {
    turnInput = message.params.input;
    send({ id: 2, result: { turn: { id: fixture.turnId, status: "inProgress", items: [] } } });
    if (fixture.approval) {
      const item = fixture.fileApproval
        ? { changes: [{ path: "/tmp/example", type: "update" }], id: "change-1", status: "inProgress", type: "fileChange" }
        : { command: "pwd", commandActions: [], cwd: process.cwd(), id: "command-1", status: "inProgress", type: "commandExecution" };
      if (!fixture.approvalWithoutStarted) send({ method: "item/started", params: { item, threadId: fixture.threadId, turnId: fixture.turnId } });
      const params = fixture.fileApproval
        ? { grantRoot: "/tmp/grant", itemId: "change-1", reason: "fixture", startedAtMs: 1, threadId: fixture.threadId, turnId: fixture.turnId }
        : { command: fixture.approvalCommandMismatch ? "whoami" : "pwd", commandActions: [], cwd: process.cwd(), itemId: "command-1", startedAtMs: 1, threadId: fixture.threadId, turnId: fixture.turnId };
      if (fixture.availableDecisions !== null) params.availableDecisions = fixture.availableDecisions;
      send({ id: "approval-1", method: fixture.fileApproval ? "item/fileChange/requestApproval" : "item/commandExecution/requestApproval", params });
    }
    else if (fixture.completedWithoutStarted) {
      send({ method: "item/completed", params: { item: { id: "command-1", type: "commandExecution", status: "completed" }, threadId: fixture.threadId, turnId: fixture.turnId } });
    }
    else if (fixture.unapprovedCommand !== null) {
      send({ method: "item/started", params: { item: { command: fixture.unapprovedCommand, commandActions: [], cwd: process.cwd(), id: "command-1", status: "inProgress", type: "commandExecution" }, threadId: fixture.threadId, turnId: fixture.turnId } });
      send({ method: "item/completed", params: { item: { command: fixture.unapprovedCommand, commandActions: [], cwd: process.cwd(), id: "command-1", status: "completed", type: "commandExecution" }, threadId: fixture.threadId, turnId: fixture.turnId } });
      finish();
    }
    else finish();
  }
  if (message.id === "approval-1") {
    if (message.result.decision !== "accept") process.exit(6);
    if (!fixture.omitResolved) send({ method: "serverRequest/resolved", params: { requestId: "approval-1", threadId: fixture.threadId } });
    const item = fixture.fileApproval
      ? { changes: [{ path: "/tmp/example", type: "update" }], id: "change-1", status: "completed", type: "fileChange" }
      : { command: "pwd", commandActions: [], cwd: process.cwd(), id: "command-1", status: "completed", type: "commandExecution" };
    send({ method: "item/completed", params: { item, threadId: fixture.threadId, turnId: fixture.turnId } });
    finish();
  }
  if (message.method === "thread/read" && message.id === 3) {
    const readbackText = fixture.readbackFinalMismatch ? "different final" : fixture.finalText;
    const items = [{ content: fixture.readbackPromptMismatch ? [{ type: "text", text: "different prompt" }] : turnInput, id: "user-1", type: "userMessage" }];
    if ((fixture.approval || fixture.unapprovedCommand !== null) && !fixture.readbackOmitAuthority) items.push(fixture.fileApproval
      ? { changes: [{ path: "/tmp/example", type: "update" }], id: "change-1", status: "completed", type: "fileChange" }
      : { command: fixture.unapprovedCommand || "pwd", commandActions: [], cwd: process.cwd(), id: "command-1", status: "completed", type: "commandExecution" });
    if (fixture.terminalStatus === "completed") items.push({ id: "agent-1", phase: "final_answer", text: readbackText, type: "agentMessage" });
    const error = fixture.completedWithError || fixture.terminalStatus === "failed" ? { message: "fixture failed" } : null;
    const turns = [{ error, id: fixture.turnId, items, status: fixture.terminalStatus }];
    if (fixture.readbackExtraTurn) turns.push({ error: null, id: "019fb8b4-ebd0-7c20-8ba1-041ed6836210", items: [], status: "completed" });
    send({ id: 3, result: { thread: { cwd: process.cwd(), id: fixture.threadId, turns } } });
  }
});
function finish() {
  if (fixture.terminalStatus === "completed") {
    send({ method: "item/started", params: { item: { id: "agent-1", type: "agentMessage", phase: "final_answer", text: fixture.finalText }, threadId: fixture.threadId, turnId: fixture.turnId } });
    send({ method: "item/completed", params: { item: { id: "agent-1", type: "agentMessage", phase: "final_answer", text: fixture.finalText }, threadId: fixture.threadId, turnId: fixture.turnId } });
  }
  if (fixture.postFinalAuthority) {
    send({ method: "item/started", params: { item: { command: "pwd", commandActions: [], cwd: process.cwd(), id: "late-command", status: "inProgress", type: "commandExecution" }, threadId: fixture.threadId, turnId: fixture.turnId } });
    send({ method: "item/completed", params: { item: { command: "pwd", commandActions: [], cwd: process.cwd(), id: "late-command", status: "completed", type: "commandExecution" }, threadId: fixture.threadId, turnId: fixture.turnId } });
  }
  const error = fixture.completedWithError || fixture.terminalStatus === "failed" ? { message: "fixture failed" } : null;
  send({ method: "turn/completed", params: { threadId: fixture.threadId, turn: { id: fixture.turnId, status: fixture.terminalStatus, error } } });
  if (fixture.postTerminalItem) send({ method: "item/started", params: { item: { id: "late-1", type: "reasoning" }, threadId: fixture.threadId, turnId: fixture.turnId } });
}
`;
  await writeFile(executable, program);
  await chmod(executable, 0o755);
  return { executable, sha256: digest(await readFile(executable)) };
}

async function run(fixture = {}, overrides = {}) {
  const identity = await fixtureExecutable(fixture);
  return runNativeTask({
    approvalPolicy: "never",
    codexExecutable: identity.executable,
    cwd: resolvedTemporaryRoot,
    expectedExecutableSha256: identity.sha256,
    expectedServerVersion: fixture.version ?? "0.148.0",
    prompt,
    sandbox: "read-only",
    timeoutMs: 2_000,
    ...overrides,
  });
}

try {
  const receipt = await run();
  assert.equal(receipt.schema, "rbm-native-task-terminal-envelope/v1");
  assert.equal(receipt.payload.schema, "rbm-native-task-terminal/v1");
  assert.equal(receipt.payload.thread.id, threadId);
  assert.equal(receipt.payload.turn.id, turnId);
  assert.equal(receipt.payload.turn.status, "completed");
  assert.equal(receipt.payload.final.text, finalText);
  assert.equal(receipt.payload.final.sha256, digest(finalText));
  assert.equal(receipt.payload.prompt_sha256, digest(prompt));
  assert.deepEqual(receipt.payload.requested_configuration, {
    approval_policy: "never",
    cwd: resolvedTemporaryRoot,
    model: null,
    sandbox: "read-only",
  });
  assert.deepEqual(receipt.payload.server_configuration, {
    approval_policy: "never",
    cwd: resolvedTemporaryRoot,
    model: "fixture-model",
    sandbox: { type: "readOnly" },
  });
  assert.equal(receipt.content_sha256, digest(JSON.stringify(receipt.payload)));

  const approved = await run({ approval: true }, { approvalHandler: async () => "accept", approvalPolicy: "on-request" });
  assert.equal(approved.payload.approvals[0].decision, "accept");
  assert.equal(approved.payload.approvals[0].decision_source, "client_handler");
  assert.match(approved.payload.approvals[0].request_sha256, /^sha256:[a-f0-9]{64}$/);
  assert.match(approved.payload.approvals[0].subject_sha256, /^sha256:[a-f0-9]{64}$/);
  assert.deepEqual(approved.payload.authority_items, [{
    id: "command-1",
    subject_sha256: approved.payload.approvals[0].subject_sha256,
    type: "commandExecution",
  }]);
  assert.equal(approved.payload.items.completed, 2);
  const sourceCannotBeSpoofed = await run({ approval: true }, {
    approvalDecisionSource: "interactive_stdin_after_request",
    approvalHandler: async () => "accept",
    approvalPolicy: "on-request",
  });
  assert.equal(sourceCannotBeSpoofed.payload.approvals[0].decision_source, "client_handler");
  let fileAuthority = null;
  const fileApproved = await run({ approval: true, fileApproval: true }, {
    approvalHandler: async (authority) => { fileAuthority = authority; return "accept"; },
    approvalPolicy: "on-request",
  });
  assert.equal(fileAuthority.params.grantRoot, "/tmp/grant");
  assert.deepEqual(fileAuthority.started_item.changes, [{ path: "/tmp/example", type: "update" }]);
  assert.match(fileApproved.payload.approvals[0].request_sha256, /^sha256:[a-f0-9]{64}$/);
  const unapproved = await run({ unapprovedCommand: "pwd" });
  assert.equal(unapproved.payload.approvals.length, 0);
  assert.equal(unapproved.payload.authority_items.length, 1);
  assert.equal(unapproved.payload.authority_items[0].type, "commandExecution");
  assert.match(unapproved.payload.authority_items[0].subject_sha256, /^sha256:[a-f0-9]{64}$/);

  const cliFixture = await fixtureExecutable({ approval: true });
  const promptFile = path.join(temporaryRoot, "prompt.txt");
  await writeFile(promptFile, prompt);
  const cli = spawn(process.execPath, [
    path.resolve("scripts/native-task-controller.mjs"), "run",
    "--codex-executable", cliFixture.executable,
    "--expected-sha256", cliFixture.sha256,
    "--expected-version", "0.148.0",
    "--cwd", temporaryRoot,
    "--prompt-file", promptFile,
    "--approval-policy", "on-request",
    "--sandbox", "read-only",
    "--timeout-ms", "2000",
  ], { stdio: ["pipe", "pipe", "pipe"] });
  let cliStdout = "";
  let cliStderr = "";
  cli.stdout.setEncoding("utf8").on("data", (chunk) => { cliStdout += chunk; });
  cli.stderr.setEncoding("utf8").on("data", (chunk) => { cliStderr += chunk; });
  const approvalDisplayed = new Promise((resolve) => {
    cli.stderr.on("data", () => { if (cliStderr.includes("approval decision")) resolve(); });
  });
  await approvalDisplayed;
  cli.stdin.end("accept\n");
  const [cliCode] = await once(cli, "exit");
  assert.equal(cliCode, 0);
  assert.match(cliStderr, /approval_request/);
  assert.match(cliStderr, /started_item/);
  assert.match(cliStderr, /commandActions/);
  assert.match(cliStderr, /approval decision/);
  assert.equal(JSON.parse(cliStdout).payload.approvals[0].decision, "accept");
  assert.equal(JSON.parse(cliStdout).payload.approvals[0].decision_source, "interactive_stdin_after_request");

  const earlyFixture = await fixtureExecutable({ approval: true });
  const earlyCli = spawn(process.execPath, [
    path.resolve("scripts/native-task-controller.mjs"), "run",
    "--codex-executable", earlyFixture.executable,
    "--expected-sha256", earlyFixture.sha256,
    "--expected-version", "0.148.0",
    "--cwd", temporaryRoot,
    "--prompt-file", promptFile,
    "--approval-policy", "on-request",
    "--sandbox", "read-only",
    "--timeout-ms", "2000",
  ], { stdio: ["pipe", "pipe", "pipe"] });
  let earlyStderr = "";
  earlyCli.stderr.setEncoding("utf8").on("data", (chunk) => { earlyStderr += chunk; });
  earlyCli.stdin.end("accept\n");
  const [earlyCode] = await once(earlyCli, "exit");
  assert.notEqual(earlyCode, 0);
  assert.match(earlyStderr, /approval decision arrived before a displayed request/);

  const failed = await run({ terminalStatus: "failed" });
  assert.equal(failed.payload.turn.status, "failed");
  assert.equal(failed.payload.final, null);
  assert.match(failed.payload.turn.error_sha256, /^sha256:[a-f0-9]{64}$/);

  await assert.rejects(() => run({ approval: true }), /conflicts with the confirmed never policy/);
  await assert.rejects(() => run({ approval: true }, { approvalPolicy: "on-request" }), /approval requested without an explicit handler/);
  await assert.rejects(() => run({ approval: true }, { approvalHandler: async () => "invalid", approvalPolicy: "on-request" }), /unsupported decision/);
  await assert.rejects(() => run({ approval: true, availableDecisions: ["decline"] }, { approvalHandler: async () => "accept", approvalPolicy: "on-request" }), /decision is not allowed by the request/);
  await assert.rejects(() => run({ approval: true, omitResolved: true }, { approvalHandler: async () => "accept", approvalPolicy: "on-request" }), /before its approval was resolved/);
  await assert.rejects(() => run({ approval: true, approvalWithoutStarted: true }, { approvalHandler: async () => "accept", approvalPolicy: "on-request" }), /approval request lacks its matching started item/);
  await assert.rejects(() => run({ approval: true, approvalCommandMismatch: true }, { approvalHandler: async () => "accept", approvalPolicy: "on-request" }), /approval command differs from its started item/);
  await assert.rejects(() => run({ completedWithoutStarted: true }), /item\/completed lacks its matching started item/);
  await assert.rejects(() => run({ postTerminalItem: true }), /event after the terminal turn/);
  await assert.rejects(() => run({ postFinalAuthority: true }), /item event after the terminal answer/);
  await assert.rejects(() => run({ completedWithError: true }), /completed turn contains an error/);
  await assert.rejects(() => run({ readbackFinalMismatch: true }), /did not confirm the exact terminal answer/);
  await assert.rejects(() => run({ approval: true, readbackOmitAuthority: true }, { approvalHandler: async () => "accept", approvalPolicy: "on-request" }), /did not confirm the exact authority items/);
  await assert.rejects(() => run({ readbackPromptMismatch: true }), /did not confirm the exact prompt/);
  await assert.rejects(() => run({ readbackExtraTurn: true }), /did not confirm the exact terminal turn/);
  await assert.rejects(() => run({ serverConfigMismatch: true }), /did not confirm requested authority configuration/);
  await assert.rejects(() => run({ duplicateInitialize: true }), /duplicate response id/);
  await assert.rejects(() => run({ exitEarly: true }), /exited before terminal receipt/);

  const wrongHash = await fixtureExecutable();
  await assert.rejects(() => runNativeTask({
    approvalPolicy: "never",
    codexExecutable: wrongHash.executable,
    cwd: temporaryRoot,
    expectedExecutableSha256: `sha256:${"0".repeat(64)}`,
    expectedServerVersion: "0.148.0",
    prompt,
    sandbox: "read-only",
  }), /sha256 mismatch/);
  await assert.rejects(() => run({}, { expectedServerVersion: "0.149.0" }), /version mismatch/);
  await assert.rejects(() => run({}, { approvalPolicy: "invalid" }), /approval policy is unsupported/);
  await assert.rejects(() => run({}, { sandbox: "invalid" }), /sandbox mode is unsupported/);

  console.log("native task controller tests passed");
} finally {
  await rm(temporaryRoot, { recursive: true, force: true });
}
