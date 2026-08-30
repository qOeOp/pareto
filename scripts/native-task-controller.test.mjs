import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { createHash } from "node:crypto";
import { EventEmitter, once } from "node:events";
import { chmod, copyFile, mkdtemp, readFile, readdir, realpath, rm, symlink, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { assertDetachedReceiptIsolation, launchDetachedWorker, readLifecycleReceiptValues, runNativeTask } from "./native-task-controller.mjs";

const temporaryRoot = await mkdtemp(path.join(os.tmpdir(), "native-task-controller-test-"));
const resolvedTemporaryRoot = await realpath(temporaryRoot);
const detachedAuthorityRoot = await mkdtemp(path.join(os.homedir(), ".native-task-controller-test-"));
const threadId = "019fb8b4-ebd0-7c20-8ba1-041ed6836204";
const turnId = "019fb8b4-ebd0-7c20-8ba1-041ed6836207";
const prompt = "Return exactly: controller fixture passed";
const finalText = "controller fixture passed";
const digest = (value) => `sha256:${createHash("sha256").update(value).digest("hex")}`;
const canonical = (value) => Array.isArray(value)
  ? value.map(canonical)
  : value && typeof value === "object"
    ? Object.fromEntries(Object.keys(value).sort().map((key) => [key, canonical(value[key])]))
    : value;

let windowsFixtureLauncherPromise = null;

async function windowsFixtureLauncher() {
  if (process.platform !== "win32") throw new Error("Windows fixture launcher requested on another platform");
  if (windowsFixtureLauncherPromise === null) {
    windowsFixtureLauncherPromise = (async () => {
      const launcher = path.join(temporaryRoot, "native-task-fixture-launcher.exe");
      const nodeExecutable = process.execPath.replaceAll("\\", "\\\\").replaceAll('"', '\\"');
      const source = `using System;
using System.Diagnostics;
using System.Text;

public static class NativeTaskFixtureLauncher {
  private static string Quote(string value) {
    if (value.Length > 0 && value.IndexOfAny(new[] { ' ', '\\t', '\\n', '\\v', '"' }) < 0) return value;
    var result = new StringBuilder("\\\"");
    var slashes = 0;
    foreach (var character in value) {
      if (character == '\\\\') { slashes += 1; continue; }
      if (character == '"') result.Append('\\\\', slashes * 2 + 1).Append(character);
      else result.Append('\\\\', slashes).Append(character);
      slashes = 0;
    }
    return result.Append('\\\\', slashes * 2).Append('"').ToString();
  }

  public static int Main(string[] arguments) {
    var program = Environment.GetEnvironmentVariable("NATIVE_TASK_CONTROLLER_FIXTURE_PROGRAM");
    if (String.IsNullOrEmpty(program)) return 97;
    var command = new StringBuilder(Quote(program));
    foreach (var argument in arguments) command.Append(' ').Append(Quote(argument));
    var start = new ProcessStartInfo("${nodeExecutable}", command.ToString());
    start.UseShellExecute = false;
    start.EnvironmentVariables["NATIVE_TASK_CONTROLLER_FIXTURE_EXECUTABLE"] = Process.GetCurrentProcess().MainModule.FileName;
    using (var child = Process.Start(start)) { child.WaitForExit(); return child.ExitCode; }
  }
}`;
      const encodedSource = Buffer.from(source).toString("base64");
      const command = "$source=[Text.Encoding]::UTF8.GetString([Convert]::FromBase64String($env:NTC_LAUNCHER_SOURCE)); Add-Type -TypeDefinition $source -OutputAssembly $env:NTC_LAUNCHER_PATH -OutputType ConsoleApplication";
      const compiler = spawn("powershell.exe", ["-NoLogo", "-NoProfile", "-NonInteractive", "-Command", command], {
        env: { ...process.env, NTC_LAUNCHER_PATH: launcher, NTC_LAUNCHER_SOURCE: encodedSource },
        stdio: ["ignore", "pipe", "pipe"],
      });
      let stdout = "";
      let stderr = "";
      compiler.stdout.setEncoding("utf8").on("data", (chunk) => { stdout += chunk; });
      compiler.stderr.setEncoding("utf8").on("data", (chunk) => { stderr += chunk; });
      const [code] = await once(compiler, "exit");
      if (code !== 0) throw new Error(`Windows fixture launcher compilation failed: ${stdout}${stderr}`);
      return launcher;
    })();
  }
  return windowsFixtureLauncherPromise;
}

for (const successorName of ["failure.json", "terminal.json"]) {
  const reads = [];
  let predecessorPublished = false;
  const receiptValues = await readLifecycleReceiptValues("/receipt", async (pathname) => {
    const basename = path.basename(pathname);
    reads.push(basename);
    if (basename === successorName) {
      predecessorPublished = true;
      return { marker: basename };
    }
    if (basename === "start.json") {
      assert.equal(predecessorPublished, true);
      return { marker: basename };
    }
    return null;
  });
  assert.deepEqual(reads, ["failure.json", "terminal.json", "start.json"]);
  assert.deepEqual(receiptValues.startValue, { marker: "start.json" });
  assert.deepEqual(receiptValues[successorName === "failure.json" ? "failureValue" : "terminalValue"], { marker: successorName });
}

const authorityReceipt = path.join(os.homedir(), ".codex", "native-task-receipts", "attempt");
await assert.rejects(
  () => assertDetachedReceiptIsolation(authorityReceipt, "/workspace", "danger-full-access"),
  /forbid danger-full-access/,
);
await assert.rejects(
  () => assertDetachedReceiptIsolation("/workspace/receipts/attempt", "/workspace", "workspace-write"),
  /writable by the Task sandbox/,
);
await assert.rejects(
  () => assertDetachedReceiptIsolation(path.join(os.tmpdir(), "attempt"), "/workspace", "workspace-write"),
  /writable by the Task sandbox/,
);
await assert.rejects(
  () => assertDetachedReceiptIsolation(authorityReceipt, "/workspace", "workspace-write", {
    excludeSlashTmp: true, excludeTmpdirEnvVar: true, type: "workspaceWrite", writableRoots: [path.join(os.homedir(), ".codex")],
  }),
  /writable by the Task sandbox/,
);
await assertDetachedReceiptIsolation(authorityReceipt, "/workspace", "workspace-write", {
  excludeSlashTmp: false, excludeTmpdirEnvVar: false, type: "workspaceWrite", writableRoots: [],
});

async function fixtureExecutable({
  approval = false,
  approvalAfterFinal = false,
  approvalCommandMismatch = false,
  approvalMissingId = false,
  approvalWithoutStarted = false,
  completeBeforeApprovalResponse = false,
  expectedApprovalDecision = "accept",
  availableDecisions = null,
  authorityCompletedStatus = "completed",
  authorityStartedStatus = "inProgress",
  completedWithError = false,
  completedWithoutStarted = false,
  delayedDuplicateReadback = false,
  delayedFailureAfterReadback = false,
  delayedInheritedVersionStdout = false,
  duplicateInitialize = false,
  duplicateReadback = false,
  exitAfterReadback = false,
  exitEarly = false,
  fileApproval = false,
  finalCompletedMismatch = false,
  finalForNonCompleted = false,
  fixtureFinalText = finalText,
  hangAfterTurnStart = false,
  mutateProbe = false,
  omitResolved = false,
  pidFile = null,
  itemStartedBeforeThreadResponse = false,
  itemStartedBeforeTurnResponse = false,
  incompleteUtf8AfterReadback = false,
  ignoreSigterm = false,
  ignoreVersionSigterm = false,
  invocationFile = null,
  postFinalAuthority = false,
  postTerminalItem = false,
  readbackExtraTurn = false,
  readbackDuplicateItemId = false,
  readbackFinalMismatch = false,
  readbackFinalForNonCompleted = false,
  readbackOmitAuthority = false,
  readbackAuthorityBeforePrompt = false,
  readbackPromptMismatch = false,
  serverConfigMismatch = false,
  serverWritableRoots = [],
  splitUtf8Readback = false,
  sameChunkEarlyThreadResponse = false,
  taskReadFile = null,
  taskWriteFile = null,
  taskWriteText = null,
  terminalStatus = "completed",
  turnStartFile = null,
  turnStartStatus = "inProgress",
  unterminatedAfterReadback = false,
  unsolicitedThreadResponse = false,
  unapprovedCommand = null,
  version = "0.148.0",
  versionDelayMs = 0,
  versionPidFile = null,
} = {}) {
  const fixtureRoot = await mkdtemp(path.join(temporaryRoot, "codex-fixture-"));
  const executable = path.join(fixtureRoot, process.platform === "win32" ? "codex.exe" : "codex");
  const sidecar = path.join(fixtureRoot, process.platform === "win32" ? "codex-code-mode-host.exe" : "codex-code-mode-host");
  const fixture = { approval, approvalAfterFinal, approvalCommandMismatch, approvalMissingId, approvalWithoutStarted, authorityCompletedStatus, authorityStartedStatus, availableDecisions, completeBeforeApprovalResponse, completedWithError, completedWithoutStarted, delayedDuplicateReadback, delayedFailureAfterReadback, delayedInheritedVersionStdout, duplicateInitialize, duplicateReadback, executable, exitAfterReadback, exitEarly, expectedApprovalDecision, fileApproval, finalCompletedMismatch, finalForNonCompleted, finalText: fixtureFinalText, hangAfterTurnStart, ignoreSigterm, ignoreVersionSigterm, incompleteUtf8AfterReadback, invocationFile, itemStartedBeforeThreadResponse, itemStartedBeforeTurnResponse, mutateProbe, omitResolved, pidFile, postFinalAuthority, postTerminalItem, readbackAuthorityBeforePrompt, readbackDuplicateItemId, readbackExtraTurn, readbackFinalForNonCompleted, readbackFinalMismatch, readbackOmitAuthority, readbackPromptMismatch, sameChunkEarlyThreadResponse, serverConfigMismatch, serverWritableRoots, splitUtf8Readback, taskReadFile, taskWriteFile, taskWriteText, terminalStatus, threadId, turnId, turnStartFile, turnStartStatus, unterminatedAfterReadback, unsolicitedThreadResponse, unapprovedCommand, version, versionDelayMs, versionPidFile };
const program = `#!/usr/bin/env node
const readline = require("node:readline");
const fixture = ${JSON.stringify(fixture)};
const invokedExecutable = process.env.NATIVE_TASK_CONTROLLER_FIXTURE_EXECUTABLE || process.argv[1];
if (fixture.invocationFile) require("node:fs").appendFileSync(fixture.invocationFile, String(process.argv[2]) + "\\n");
if (invokedExecutable === fixture.executable) process.exit(5);
if (process.argv[2] === "--version") {
  if (fixture.versionPidFile) require("node:fs").writeFileSync(fixture.versionPidFile, String(process.pid));
  if (fixture.ignoreVersionSigterm) { process.on("SIGTERM", () => {}); setInterval(() => {}, 1_000); }
  if (fixture.mutateProbe) {
    const mutatePath = process.platform === "win32"
      ? require("node:path").join(require("node:path").dirname(invokedExecutable), "codex-code-mode-host.exe")
      : invokedExecutable;
    require("node:fs").chmodSync(mutatePath, 0o700);
    require("node:fs").writeFileSync(mutatePath, "#!/usr/bin/env node\\nprocess.exit(19);\\n");
  }
  if (!fixture.ignoreVersionSigterm) {
    if (fixture.delayedInheritedVersionStdout) {
      require("node:child_process").spawn(process.execPath, ["-e", "setTimeout(() => process.stdout.write(' delayed-extra'), 75)"], { stdio: ["ignore", "inherit", "ignore"] }).unref();
    }
    const finishVersion = () => { process.stdout.write("codex-cli " + fixture.version + "\\n"); process.exit(0); };
    if (fixture.versionDelayMs > 0) Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, fixture.versionDelayMs);
    finishVersion();
  }
}
if ((process.argv[2] !== "app-server" || process.argv[3] !== "--stdio") && !(process.argv[2] === "--version" && fixture.ignoreVersionSigterm)) process.exit(9);
if (fixture.ignoreSigterm) { process.on("SIGTERM", () => {}); setInterval(() => {}, 1_000); }
if (fixture.pidFile) require("node:fs").writeFileSync(fixture.pidFile, String(process.pid));
const send = (value) => process.stdout.write(JSON.stringify(value) + "\\n");
let turnInput = [];
const rl = readline.createInterface({ input: process.stdin });
rl.on("line", (line) => {
  const message = JSON.parse(line);
  if (message.id === 0) {
    if (message.params.capabilities !== undefined) process.exit(8);
    const earlyThreadResponse = { id: 1, result: { approvalPolicy: "never", cwd: process.cwd(), model: "fixture-model", sandbox: { type: "readOnly" }, thread: { cwd: process.cwd(), id: fixture.threadId } } };
    if (fixture.unsolicitedThreadResponse) { send(earlyThreadResponse); return; }
    if (fixture.sameChunkEarlyThreadResponse) {
      process.stdout.write(JSON.stringify({ id: 0, result: { userAgent: "fixture/" + fixture.version, platformFamily: "unix", platformOs: "fixture" } }) + "\\n" + JSON.stringify(earlyThreadResponse) + "\\n");
      return;
    }
    send({ id: 0, result: { userAgent: "fixture/" + fixture.version, platformFamily: "unix", platformOs: "fixture" } });
    if (fixture.duplicateInitialize) send({ id: 0, result: { userAgent: "fixture/" + fixture.version } });
  }
  if (message.method === "initialized" && fixture.exitEarly) process.exit(7);
  if (message.method === "thread/start") {
    if (fixture.itemStartedBeforeThreadResponse) send({ method: "item/started", params: { item: { command: "pwd", commandActions: [], cwd: process.cwd(), id: "early-command", status: "inProgress", type: "commandExecution" }, threadId: null, turnId: null } });
    const sandboxTypes = { "read-only": "readOnly", "workspace-write": "workspaceWrite", "danger-full-access": "dangerFullAccess" };
    send({ id: 1, result: {
      approvalPolicy: fixture.serverConfigMismatch ? "untrusted" : message.params.approvalPolicy,
      cwd: message.params.cwd,
      model: message.params.model || "fixture-model",
      sandbox: message.params.sandbox === "workspace-write"
        ? { excludeSlashTmp: false, excludeTmpdirEnvVar: false, type: "workspaceWrite", writableRoots: fixture.serverWritableRoots }
        : { type: sandboxTypes[message.params.sandbox] },
      thread: { cwd: message.params.cwd, id: fixture.threadId },
    } });
  }
  if (message.method === "turn/start") {
    if (fixture.turnStartFile) require("node:fs").writeFileSync(fixture.turnStartFile, "turn started\\n");
    if (fixture.taskReadFile) require("node:fs").readFileSync(fixture.taskReadFile, "utf8");
    if (fixture.taskWriteFile) require("node:fs").writeFileSync(fixture.taskWriteFile, fixture.taskWriteText);
    turnInput = message.params.input;
    if (fixture.itemStartedBeforeTurnResponse) send({ method: "item/started", params: { item: { command: "pwd", commandActions: [], cwd: process.cwd(), id: "early-command", status: "inProgress", type: "commandExecution" }, threadId: fixture.threadId, turnId: null } });
    send({ id: 2, result: { turn: { id: fixture.turnId, status: fixture.turnStartStatus, items: [] } } });
    if (fixture.hangAfterTurnStart) return;
    if (fixture.approval) {
      const item = fixture.fileApproval
        ? { changes: [{ path: "/tmp/example", type: "update" }], id: "change-1", status: fixture.authorityStartedStatus, type: "fileChange" }
        : { command: "pwd", commandActions: [], cwd: process.cwd(), id: "command-1", status: fixture.authorityStartedStatus, type: "commandExecution" };
      if (!fixture.approvalWithoutStarted) send({ method: "item/started", params: { item, threadId: fixture.threadId, turnId: fixture.turnId } });
      if (fixture.approvalAfterFinal) {
        send({ method: "item/started", params: { item: { id: "agent-1", phase: "final_answer", text: fixture.finalText, type: "agentMessage" }, threadId: fixture.threadId, turnId: fixture.turnId } });
        send({ method: "item/completed", params: { item: { id: "agent-1", phase: "final_answer", text: fixture.finalText, type: "agentMessage" }, threadId: fixture.threadId, turnId: fixture.turnId } });
      }
      const params = fixture.fileApproval
        ? { grantRoot: "/tmp/grant", itemId: "change-1", reason: "fixture", startedAtMs: 1, threadId: fixture.threadId, turnId: fixture.turnId }
        : { command: fixture.approvalCommandMismatch ? "whoami" : "pwd", commandActions: [], cwd: process.cwd(), itemId: "command-1", startedAtMs: 1, threadId: fixture.threadId, turnId: fixture.turnId };
      if (fixture.availableDecisions !== null) params.availableDecisions = fixture.availableDecisions;
      const request = { id: "approval-1", method: fixture.fileApproval ? "item/fileChange/requestApproval" : "item/commandExecution/requestApproval", params };
      if (fixture.approvalMissingId) delete request.id;
      if (fixture.completeBeforeApprovalResponse) {
        const completedItem = fixture.fileApproval
          ? { changes: [{ path: "/tmp/example", type: "update" }], id: "change-1", status: fixture.authorityCompletedStatus, type: "fileChange" }
          : { command: "pwd", commandActions: [], cwd: process.cwd(), id: "command-1", status: fixture.authorityCompletedStatus, type: "commandExecution" };
        const messages = [request];
        if (!fixture.omitResolved) messages.push({ method: "serverRequest/resolved", params: { requestId: "approval-1", threadId: fixture.threadId } });
        messages.push({ method: "item/completed", params: { item: completedItem, threadId: fixture.threadId, turnId: fixture.turnId } });
        if (fixture.terminalStatus === "completed") {
          messages.push({ method: "item/started", params: { item: { id: "agent-1", type: "agentMessage", phase: "final_answer", text: fixture.finalText }, threadId: fixture.threadId, turnId: fixture.turnId } });
          messages.push({ method: "item/completed", params: { item: { id: "agent-1", type: "agentMessage", phase: "final_answer", text: fixture.finalText }, threadId: fixture.threadId, turnId: fixture.turnId } });
        }
        messages.push({ method: "turn/completed", params: { threadId: fixture.threadId, turn: { id: fixture.turnId, status: fixture.terminalStatus, error: null } } });
        process.stdout.write(messages.map((value) => JSON.stringify(value)).join("\\n") + "\\n");
      } else {
        send(request);
      }
    }
    else if (fixture.completedWithoutStarted) {
      send({ method: "item/completed", params: { item: { id: "command-1", type: "commandExecution", status: "completed" }, threadId: fixture.threadId, turnId: fixture.turnId } });
    }
    else if (fixture.unapprovedCommand !== null) {
      send({ method: "item/started", params: { item: { command: fixture.unapprovedCommand, commandActions: [], cwd: process.cwd(), id: "command-1", status: fixture.authorityStartedStatus, type: "commandExecution" }, threadId: fixture.threadId, turnId: fixture.turnId } });
      send({ method: "item/completed", params: { item: { command: fixture.unapprovedCommand, commandActions: [], cwd: process.cwd(), id: "command-1", status: fixture.authorityCompletedStatus, type: "commandExecution" }, threadId: fixture.threadId, turnId: fixture.turnId } });
      finish();
    }
    else finish();
  }
  if (message.id === "approval-1") {
    if (message.result.decision !== fixture.expectedApprovalDecision) process.exit(6);
    if (fixture.completeBeforeApprovalResponse) return;
    if (!fixture.omitResolved) send({ method: "serverRequest/resolved", params: { requestId: "approval-1", threadId: fixture.threadId } });
    const item = fixture.fileApproval
      ? { changes: [{ path: "/tmp/example", type: "update" }], id: "change-1", status: fixture.authorityCompletedStatus, type: "fileChange" }
      : { command: "pwd", commandActions: [], cwd: process.cwd(), id: "command-1", status: fixture.authorityCompletedStatus, type: "commandExecution" };
    send({ method: "item/completed", params: { item, threadId: fixture.threadId, turnId: fixture.turnId } });
    finish();
  }
  if (message.method === "thread/read" && message.id === 3) {
    const readbackText = fixture.readbackFinalMismatch ? "different final" : fixture.finalText;
    const promptItem = { content: fixture.readbackPromptMismatch ? [{ type: "text", text: "different prompt" }] : turnInput, id: "user-1", type: "userMessage" };
    const authorityItem = (fixture.approval || fixture.unapprovedCommand !== null) && !fixture.readbackOmitAuthority ? (fixture.fileApproval
      ? { changes: [{ path: "/tmp/example", type: "update" }], id: "change-1", status: fixture.authorityCompletedStatus, type: "fileChange" }
      : { command: fixture.unapprovedCommand || "pwd", commandActions: [], cwd: process.cwd(), id: "command-1", status: fixture.authorityCompletedStatus, type: "commandExecution" }) : null;
    const items = fixture.readbackAuthorityBeforePrompt && authorityItem ? [authorityItem, promptItem] : [promptItem];
    if (authorityItem && !fixture.readbackAuthorityBeforePrompt) items.push(authorityItem);
    if (fixture.terminalStatus === "completed" || fixture.readbackFinalForNonCompleted) items.push({ id: "agent-1", phase: "final_answer", text: readbackText, type: "agentMessage" });
    if (fixture.readbackDuplicateItemId) items.push({ id: "agent-1", type: "reasoning" });
    const error = fixture.completedWithError || fixture.terminalStatus === "failed" ? { message: "fixture failed" } : null;
    const turns = [{ error, id: fixture.turnId, items, status: fixture.terminalStatus }];
    if (fixture.readbackExtraTurn) turns.push({ error: null, id: "019fb8b4-ebd0-7c20-8ba1-041ed6836210", items: [], status: "completed" });
    const response = { id: 3, result: { thread: { cwd: process.cwd(), id: fixture.threadId, turns } } };
    if (fixture.duplicateReadback) process.stdout.write(JSON.stringify(response) + "\\n" + JSON.stringify(response) + "\\n");
    else if (fixture.delayedDuplicateReadback) { send(response); setTimeout(() => send(response), 100); }
    else if (fixture.delayedFailureAfterReadback) { send(response); setTimeout(() => process.exit(7), 100); }
    else if (fixture.splitUtf8Readback) {
      const encoded = Buffer.from(JSON.stringify(response) + "\\n");
      const marker = encoded.indexOf(Buffer.from([0xc3, 0xa9]));
      process.stdout.write(encoded.subarray(0, marker + 1), () => setImmediate(() => process.stdout.write(encoded.subarray(marker + 1))));
    }
    else if (fixture.incompleteUtf8AfterReadback) process.stdout.write(Buffer.concat([Buffer.from(JSON.stringify(response) + "\\n"), Buffer.from([0xc3])]));
    else if (fixture.unterminatedAfterReadback) process.stdout.write(JSON.stringify(response) + "\\n{\\\"id\\\":3");
    else if (fixture.exitAfterReadback) process.stdout.write(JSON.stringify(response) + "\\n", () => process.exit(7));
    else send(response);
  }
});
function finish() {
  if (fixture.terminalStatus === "completed" || fixture.finalForNonCompleted) {
    send({ method: "item/started", params: { item: { id: "agent-1", type: "agentMessage", phase: "final_answer", text: fixture.finalText }, threadId: fixture.threadId, turnId: fixture.turnId } });
    send({ method: "item/completed", params: { item: { id: "agent-1", type: "agentMessage", phase: "final_answer", text: fixture.finalCompletedMismatch ? "different completed final" : fixture.finalText }, threadId: fixture.threadId, turnId: fixture.turnId } });
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
  if (process.platform === "win32") {
    const programPath = path.join(fixtureRoot, "codex-fixture.cjs");
    await writeFile(programPath, program);
    process.env.NATIVE_TASK_CONTROLLER_FIXTURE_PROGRAM = programPath;
    const launcher = await windowsFixtureLauncher();
    await Promise.all([copyFile(launcher, executable), copyFile(launcher, sidecar)]);
  } else {
    await writeFile(executable, program);
    await chmod(executable, 0o755);
    await writeFile(sidecar, "#!/usr/bin/env node\nprocess.exit(0);\n");
    await chmod(sidecar, 0o755);
  }
  return { executable, sha256: digest(await readFile(executable)), sidecar, sidecarSha256: digest(await readFile(sidecar)) };
}

async function run(fixture = {}, overrides = {}) {
  const identity = await fixtureExecutable(fixture);
  return runNativeTask({
    approvalPolicy: "never",
    codexExecutable: identity.executable,
    cwd: resolvedTemporaryRoot,
    expectedExecutableSha256: identity.sha256,
    expectedSidecarSha256: identity.sidecarSha256,
    expectedServerVersion: fixture.version ?? "0.148.0",
    prompt,
    sandbox: "read-only",
    timeoutMs: 2_000,
    ...overrides,
  });
}

async function waitForFile(file) {
  for (let attempt = 0; attempt < 100; attempt += 1) {
    const value = await readFile(file, "utf8").catch(() => null);
    if (value !== null) return value;
    await new Promise((resolve) => setTimeout(resolve, 10));
  }
  throw new Error(`timed out waiting for fixture file: ${file}`);
}

async function cliJson(arguments_) {
  const child = spawn(process.execPath, [path.resolve("scripts/native-task-controller.mjs"), ...arguments_], { stdio: ["ignore", "pipe", "pipe"] });
  let stdout = "";
  let stderr = "";
  child.stdout.setEncoding("utf8").on("data", (chunk) => { stdout += chunk; });
  child.stderr.setEncoding("utf8").on("data", (chunk) => { stderr += chunk; });
  const [code] = await once(child, "exit");
  assert.equal(code, 0, stderr);
  return JSON.parse(stdout);
}

try {
  const forbiddenTurnStart = path.join(temporaryRoot, "forbidden-turn-start.txt");
  await assert.rejects(
    () => run({
      serverWritableRoots: [path.join(os.homedir(), ".codex")],
      turnStartFile: forbiddenTurnStart,
    }, {
      sandbox: "workspace-write",
      onConfigured: async (configuration) => assertDetachedReceiptIsolation(
        authorityReceipt, resolvedTemporaryRoot, "workspace-write", configuration.sandbox,
      ),
    }),
    /writable by the Task sandbox/,
  );
  assert.equal(await readFile(forbiddenTurnStart, "utf8").catch(() => null), null);

  let asynchronousFailureUnref = false;
  const asynchronousFailure = await launchDetachedWorker(["worker"], () => {
    const child = new EventEmitter();
    child.pid = 42;
    child.unref = () => { asynchronousFailureUnref = true; };
    queueMicrotask(() => child.emit("error", new Error("fixture asynchronous spawn failure")));
    return child;
  });
  assert.match(asynchronousFailure.error.message, /asynchronous spawn failure/);
  assert.equal(asynchronousFailureUnref, false);

  let successfulSpawnUnref = false;
  const successfulSpawn = await launchDetachedWorker(["worker"], () => {
    const child = new EventEmitter();
    child.pid = 43;
    child.unref = () => { successfulSpawnUnref = true; };
    queueMicrotask(() => child.emit("spawn"));
    return child;
  });
  assert.equal(successfulSpawn.worker.pid, 43);
  assert.equal(successfulSpawnUnref, true);

  const receipt = await run();
  assert.equal(receipt.schema, "rbm-native-task-terminal-envelope/v1");
  assert.equal(receipt.payload.schema, "rbm-native-task-terminal/v1");
  assert.equal(receipt.payload.thread.id, threadId);
  assert.equal(receipt.payload.turn.id, turnId);
  assert.equal(receipt.payload.turn.status, "completed");
  assert.equal(receipt.payload.final.text, finalText);
  assert.equal(receipt.payload.final.event_item_id, "agent-1");
  assert.equal(receipt.payload.final.readback_item_id, "agent-1");
  assert.equal(receipt.payload.final.sha256, digest(finalText));
  assert.equal(receipt.payload.prompt_sha256, digest(prompt));
  assert.match(receipt.payload.sidecar.path, /codex-code-mode-host(?:\.exe)?$/);
  assert.match(receipt.payload.sidecar.sha256, /^sha256:[a-f0-9]{64}$/);
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
  assert.equal((await run({ mutateProbe: true })).payload.turn.status, "completed");
  assert.equal((await run({ fixtureFinalText: "controller fixture réussi", splitUtf8Readback: true })).payload.final.text, "controller fixture réussi");

  const approved = await run({ approval: true }, { approvalHandler: async () => "accept", approvalPolicy: "on-request" });
  assert.equal(approved.payload.approvals[0].decision, "accept");
  assert.equal(approved.payload.approvals[0].decision_source, "client_handler");
  assert.match(approved.payload.approvals[0].request_sha256, /^sha256:[a-f0-9]{64}$/);
  assert.match(approved.payload.approvals[0].subject_sha256, /^sha256:[a-f0-9]{64}$/);
  assert.ok(approved.payload.approvals[0].request_wire_sequence < approved.payload.approvals[0].decision_wire_sequence);
  assert.ok(approved.payload.approvals[0].decision_wire_sequence < approved.payload.approvals[0].resolved_wire_sequence);
  const { completed_wire_sequence: completedWireSequence, started_wire_sequence: startedWireSequence, ...authorityItem } = approved.payload.authority_items[0];
  assert.deepEqual(authorityItem, {
    event_item_id: "command-1",
    status: "completed",
    subject_sha256: approved.payload.approvals[0].subject_sha256,
    type: "commandExecution",
  });
  assert.ok(startedWireSequence < approved.payload.approvals[0].request_wire_sequence);
  assert.ok(approved.payload.approvals[0].resolved_wire_sequence < completedWireSequence);
  assert.deepEqual(approved.payload.readback_authority_items, [{
    readback_item_id: "command-1",
    status: "completed",
    subject_sha256: approved.payload.approvals[0].subject_sha256,
    type: "commandExecution",
  }]);
  assert.equal(approved.payload.items.completed, 2);
  const declined = await run({ approval: true, authorityCompletedStatus: "declined", expectedApprovalDecision: "decline" }, {
    approvalHandler: async () => "decline",
    approvalPolicy: "on-request",
  });
  assert.equal(declined.payload.approvals[0].decision, "decline");
  assert.equal(declined.payload.authority_items[0].status, "declined");
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
  const missingSidecarIdentityCli = spawn(process.execPath, [
    path.resolve("scripts/native-task-controller.mjs"), "run",
    "--codex-executable", cliFixture.executable,
    "--expected-sha256", cliFixture.sha256,
    "--expected-version", "0.148.0",
    "--cwd", temporaryRoot,
    "--prompt-file", promptFile,
    "--approval-policy", "never",
    "--sandbox", "read-only",
  ], { stdio: ["ignore", "ignore", "pipe"] });
  let missingSidecarIdentityStderr = "";
  missingSidecarIdentityCli.stderr.setEncoding("utf8").on("data", (chunk) => { missingSidecarIdentityStderr += chunk; });
  const [missingSidecarIdentityCode] = await once(missingSidecarIdentityCli, "exit");
  assert.notEqual(missingSidecarIdentityCode, 0);
  assert.match(missingSidecarIdentityStderr, /missing argument: --expected-sidecar-sha256/);
  const cli = spawn(process.execPath, [
    path.resolve("scripts/native-task-controller.mjs"), "run",
    "--codex-executable", cliFixture.executable,
    "--expected-sha256", cliFixture.sha256,
    "--expected-sidecar-sha256", cliFixture.sidecarSha256,
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

  const detachedInvocations = path.join(temporaryRoot, "detached-invocations.txt");
  const detachedFixture = await fixtureExecutable({ invocationFile: detachedInvocations });
  const detachedReceiptDir = path.join(temporaryRoot, "detached-receipt");
  const dispatchArguments = [
    "dispatch",
    "--codex-executable", detachedFixture.executable,
    "--expected-sha256", detachedFixture.sha256,
    "--expected-sidecar-sha256", detachedFixture.sidecarSha256,
    "--expected-version", "0.148.0",
    "--cwd", temporaryRoot,
    "--prompt-file", promptFile,
    "--sandbox", "read-only",
    "--receipt-dir", detachedReceiptDir,
    "--timeout-ms", "2000",
    "--start-timeout-ms", "2000",
  ];
  const dispatched = await cliJson(dispatchArguments);
  assert.ok(["running", "terminal"].includes(dispatched.payload.state));
  assert.equal(dispatched.payload.attempt.request.prompt_sha256, digest(prompt));
  assert.equal(dispatched.payload.attempt.request.sandbox, "read-only");
  assert.equal(dispatched.payload.attempt.request.expected_sidecar_sha256, detachedFixture.sidecarSha256);
  await waitForFile(path.join(detachedReceiptDir, "terminal.json"));
  const inspected = await cliJson(["inspect", "--receipt-dir", detachedReceiptDir]);
  assert.equal(inspected.payload.state, "terminal");
  assert.equal(inspected.payload.terminal.payload.terminal.payload.turn.id, turnId);
  assert.equal(inspected.payload.terminal.payload.terminal.payload.final.text, finalText);
  assert.deepEqual(
    inspected.payload.terminal.payload.terminal.payload.sidecar,
    inspected.payload.start.payload.start.sidecar,
  );

  const workspaceInput = path.join(temporaryRoot, "workspace-input.txt");
  const workspaceOutput = path.join(temporaryRoot, "workspace-output.txt");
  await writeFile(workspaceInput, "one task read\n");
  const receiptSentinel = path.join(detachedAuthorityRoot, "receipt-sentinel.txt");
  await writeFile(receiptSentinel, "hub receipt authority\n");
  const sentinelSha256 = digest(await readFile(receiptSentinel));
  const workspaceFixture = await fixtureExecutable({
    serverWritableRoots: [resolvedTemporaryRoot],
    taskReadFile: workspaceInput,
    taskWriteFile: workspaceOutput,
    taskWriteText: "one task-cwd-only write\n",
  });
  const workspaceReceiptDir = path.join(detachedAuthorityRoot, "workspace-receipt");
  const workspaceDispatch = await cliJson([
    "dispatch", "--codex-executable", workspaceFixture.executable,
    "--expected-sha256", workspaceFixture.sha256,
    "--expected-sidecar-sha256", workspaceFixture.sidecarSha256,
    "--expected-version", "0.148.0", "--cwd", temporaryRoot,
    "--prompt-file", promptFile, "--sandbox", "workspace-write",
    "--receipt-dir", workspaceReceiptDir, "--timeout-ms", "2000", "--start-timeout-ms", "2000",
  ]);
  assert.ok(["running", "terminal"].includes(workspaceDispatch.payload.state));
  const workspaceAttemptSource = await readFile(path.join(workspaceReceiptDir, "attempt.json"), "utf8");
  await waitForFile(path.join(workspaceReceiptDir, "terminal.json"));
  const workspaceInspection = await cliJson(["inspect", "--receipt-dir", workspaceReceiptDir]);
  assert.equal(workspaceInspection.payload.state, "terminal");
  assert.equal(await readFile(workspaceOutput, "utf8"), "one task-cwd-only write\n");
  assert.equal(digest(await readFile(receiptSentinel)), sentinelSha256);
  assert.equal(await readFile(path.join(workspaceReceiptDir, "attempt.json"), "utf8"), workspaceAttemptSource);
  assert.equal(
    workspaceInspection.payload.attempt.content_sha256,
    digest(JSON.stringify(canonical({
      attempt_id: workspaceInspection.payload.attempt.attempt_id,
      request: workspaceInspection.payload.attempt.request,
      schema: workspaceInspection.payload.attempt.schema,
    }))),
  );
  assert.equal(
    workspaceInspection.payload.terminal.content_sha256,
    digest(JSON.stringify(canonical(workspaceInspection.payload.terminal.payload))),
  );
  assert.equal(
    workspaceInspection.payload.start.payload.start.server_configuration.sandbox.writableRoots[0],
    resolvedTemporaryRoot,
  );
  assert.equal(path.relative(resolvedTemporaryRoot, workspaceReceiptDir).startsWith(".."), true);
  const invocationsBeforeRetry = await readFile(detachedInvocations, "utf8");
  const retried = await cliJson(dispatchArguments);
  assert.equal(retried.payload.state, "terminal");
  assert.equal(await readFile(detachedInvocations, "utf8"), invocationsBeforeRetry);

  const receiptLink = path.join(temporaryRoot, "detached-receipt-link");
  await symlink(detachedReceiptDir, receiptLink, process.platform === "win32" ? "junction" : "dir");
  const linkedInspect = spawn(process.execPath, [path.resolve("scripts/native-task-controller.mjs"), "inspect", "--receipt-dir", receiptLink], { stdio: ["ignore", "pipe", "pipe"] });
  let linkedStderr = "";
  linkedInspect.stdout.resume();
  linkedInspect.stderr.setEncoding("utf8").on("data", (chunk) => { linkedStderr += chunk; });
  const [linkedCode] = await once(linkedInspect, "exit");
  assert.notEqual(linkedCode, 0);
  assert.match(linkedStderr, /directory is missing or unsafe/);

  const terminalReceiptPath = path.join(detachedReceiptDir, "terminal.json");
  const terminalReceiptSource = await readFile(terminalReceiptPath, "utf8");
  await writeFile(terminalReceiptPath, terminalReceiptSource.replace(finalText, "tampered final"));
  const tamperedInspect = spawn(process.execPath, [path.resolve("scripts/native-task-controller.mjs"), "inspect", "--receipt-dir", detachedReceiptDir], { stdio: ["ignore", "pipe", "pipe"] });
  let tamperedStderr = "";
  tamperedInspect.stdout.resume();
  tamperedInspect.stderr.setEncoding("utf8").on("data", (chunk) => { tamperedStderr += chunk; });
  const [tamperedCode] = await once(tamperedInspect, "exit");
  assert.notEqual(tamperedCode, 0);
  assert.match(tamperedStderr, /invalid content identity/);
  await writeFile(terminalReceiptPath, terminalReceiptSource);

  const secondReceiptDir = path.join(temporaryRoot, "second-detached-receipt");
  await cliJson(dispatchArguments.map((value, index, values) => values[index - 1] === "--receipt-dir" ? secondReceiptDir : value));
  const secondTerminalPath = path.join(secondReceiptDir, "terminal.json");
  await waitForFile(secondTerminalPath);
  const secondTerminalSource = await readFile(secondTerminalPath, "utf8");
  await writeFile(secondTerminalPath, terminalReceiptSource);
  const transplantedInspect = spawn(process.execPath, [path.resolve("scripts/native-task-controller.mjs"), "inspect", "--receipt-dir", secondReceiptDir], { stdio: ["ignore", "pipe", "pipe"] });
  let transplantedStderr = "";
  transplantedInspect.stdout.resume();
  transplantedInspect.stderr.setEncoding("utf8").on("data", (chunk) => { transplantedStderr += chunk; });
  const [transplantedCode] = await once(transplantedInspect, "exit");
  assert.notEqual(transplantedCode, 0);
  assert.match(transplantedStderr, /lacks its exact start attempt/);
  await writeFile(secondTerminalPath, secondTerminalSource);

  const failedDetachedFixture = await fixtureExecutable({ serverConfigMismatch: true });
  const failedReceiptDir = path.join(temporaryRoot, "failed-detached-receipt");
  const failedDispatch = await cliJson([
    "dispatch", "--codex-executable", failedDetachedFixture.executable,
    "--expected-sha256", failedDetachedFixture.sha256,
    "--expected-sidecar-sha256", failedDetachedFixture.sidecarSha256, "--expected-version", "0.148.0",
    "--cwd", temporaryRoot, "--prompt-file", promptFile, "--sandbox", "read-only",
    "--receipt-dir", failedReceiptDir, "--timeout-ms", "2000", "--start-timeout-ms", "2000",
  ]);
  assert.equal(failedDispatch.payload.state, "needs_attention");
  assert.match(failedDispatch.payload.failure.payload.error, /did not confirm requested authority configuration/);
  await writeFile(path.join(failedReceiptDir, "terminal.json"), terminalReceiptSource);
  const conflictingInspect = spawn(process.execPath, [path.resolve("scripts/native-task-controller.mjs"), "inspect", "--receipt-dir", failedReceiptDir], { stdio: ["ignore", "pipe", "pipe"] });
  let conflictingStderr = "";
  conflictingInspect.stdout.resume();
  conflictingInspect.stderr.setEncoding("utf8").on("data", (chunk) => { conflictingStderr += chunk; });
  const [conflictingCode] = await once(conflictingInspect, "exit");
  assert.notEqual(conflictingCode, 0);
  assert.match(conflictingStderr, /terminal and failure receipts conflict/);

  const postStartFailureInvocations = path.join(temporaryRoot, "post-start-failure-invocations.txt");
  const postStartFailureFixture = await fixtureExecutable({ invocationFile: postStartFailureInvocations, readbackFinalMismatch: true });
  const postStartFailureDir = path.join(temporaryRoot, "post-start-failure-receipt");
  const postStartFailureArguments = [
    "dispatch", "--codex-executable", postStartFailureFixture.executable,
    "--expected-sha256", postStartFailureFixture.sha256,
    "--expected-sidecar-sha256", postStartFailureFixture.sidecarSha256, "--expected-version", "0.148.0",
    "--cwd", temporaryRoot, "--prompt-file", promptFile, "--sandbox", "read-only",
    "--receipt-dir", postStartFailureDir, "--timeout-ms", "2000", "--start-timeout-ms", "2000",
  ];
  const postStartDispatch = await cliJson(postStartFailureArguments);
  assert.ok(["running", "needs_attention"].includes(postStartDispatch.payload.state));
  await waitForFile(path.join(postStartFailureDir, "failure.json"));
  const postStartFailure = await cliJson(["inspect", "--receipt-dir", postStartFailureDir]);
  assert.equal(postStartFailure.payload.state, "needs_attention");
  assert.equal(postStartFailure.payload.start.payload.start.thread.id, threadId);
  assert.equal(postStartFailure.payload.start.payload.start.turn.id, turnId);
  const postStartInvocationsBeforeRetry = await readFile(postStartFailureInvocations, "utf8");
  const postStartRetry = await cliJson(postStartFailureArguments);
  assert.equal(postStartRetry.payload.state, "needs_attention");
  assert.equal(postStartRetry.payload.start.payload.start.thread.id, threadId);
  assert.equal(await readFile(postStartFailureInvocations, "utf8"), postStartInvocationsBeforeRetry);

  const postStartPath = path.join(postStartFailureDir, "start.json");
  const postStartSource = await readFile(postStartPath, "utf8");
  const forgedStart = JSON.parse(postStartSource);
  forgedStart.payload.start.thread.id = "019fb8b4-ebd0-7c20-8ba1-041ed6836211";
  forgedStart.content_sha256 = digest(JSON.stringify(canonical(forgedStart.payload)));
  await writeFile(postStartPath, JSON.stringify(forgedStart));
  const forgedStartInspect = spawn(process.execPath, [
    path.resolve("scripts/native-task-controller.mjs"), "inspect", "--receipt-dir", postStartFailureDir,
  ], { stdio: ["ignore", "pipe", "pipe"] });
  let forgedStartStderr = "";
  forgedStartInspect.stdout.resume();
  forgedStartInspect.stderr.setEncoding("utf8").on("data", (chunk) => { forgedStartStderr += chunk; });
  const [forgedStartCode] = await once(forgedStartInspect, "exit");
  assert.notEqual(forgedStartCode, 0);
  assert.match(forgedStartStderr, /failure receipt differs from its exact attempt or start receipt/);
  await writeFile(postStartPath, postStartSource);

  const mismatchedPrompt = path.join(temporaryRoot, "different-prompt.txt");
  await writeFile(mismatchedPrompt, "different prompt");
  const mismatch = spawn(process.execPath, [
    path.resolve("scripts/native-task-controller.mjs"), "dispatch", ...dispatchArguments.slice(1).map((value, index, values) =>
      values[index - 1] === "--prompt-file" ? mismatchedPrompt : value),
  ], { stdio: ["ignore", "pipe", "pipe"] });
  let mismatchStderr = "";
  mismatch.stdout.resume();
  mismatch.stderr.setEncoding("utf8").on("data", (chunk) => { mismatchStderr += chunk; });
  const [mismatchCode] = await once(mismatch, "exit");
  assert.notEqual(mismatchCode, 0);
  assert.match(mismatchStderr, /different or incomplete attempt/);

  const earlyFixture = await fixtureExecutable({ approval: true });
  const earlyCli = spawn(process.execPath, [
    path.resolve("scripts/native-task-controller.mjs"), "run",
    "--codex-executable", earlyFixture.executable,
    "--expected-sha256", earlyFixture.sha256,
    "--expected-sidecar-sha256", earlyFixture.sidecarSha256,
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

  if (process.platform !== "win32") {
    const runtimeRootsBeforeSignal = new Set((await readdir(os.tmpdir())).filter((name) => name.startsWith("native-task-controller-runtime-")));
    const signalPidFile = path.join(temporaryRoot, "signal-child.pid");
    const signalFixture = await fixtureExecutable({ hangAfterTurnStart: true, ignoreSigterm: true, pidFile: signalPidFile });
    const signalCli = spawn(process.execPath, [
      path.resolve("scripts/native-task-controller.mjs"), "run",
      "--codex-executable", signalFixture.executable,
      "--expected-sha256", signalFixture.sha256,
      "--expected-sidecar-sha256", signalFixture.sidecarSha256,
      "--expected-version", "0.148.0",
      "--cwd", temporaryRoot,
      "--prompt-file", promptFile,
      "--approval-policy", "never",
      "--sandbox", "read-only",
      "--timeout-ms", "30000",
    ], { stdio: ["pipe", "pipe", "pipe"] });
    let signalStderr = "";
    signalCli.stdout.resume();
    signalCli.stderr.setEncoding("utf8").on("data", (chunk) => { signalStderr += chunk; });
    const signalChildPid = Number(await waitForFile(signalPidFile));
    signalCli.kill("SIGTERM");
    setTimeout(() => signalCli.kill("SIGTERM"), 20);
    const [signalCode, signalName] = await once(signalCli, "exit");
    assert.notEqual(signalCode, 0);
    assert.equal(signalName, null);
    assert.match(signalStderr, /native task was aborted/);
    assert.throws(() => process.kill(signalChildPid, 0), (error) => error?.code === "ESRCH");
    const runtimeRootsAfterSignal = new Set((await readdir(os.tmpdir())).filter((name) => name.startsWith("native-task-controller-runtime-")));
    assert.deepEqual([...runtimeRootsAfterSignal].filter((name) => !runtimeRootsBeforeSignal.has(name)), []);
  }

  const failed = await run({ terminalStatus: "failed" });
  assert.equal(failed.payload.turn.status, "failed");
  assert.equal(failed.payload.final, null);
  assert.match(failed.payload.turn.error_sha256, /^sha256:[a-f0-9]{64}$/);
  await assert.rejects(() => run({ finalForNonCompleted: true, terminalStatus: "failed" }), /non-completed turn emitted a terminal answer/);
  await assert.rejects(() => run({ finalForNonCompleted: true, terminalStatus: "interrupted" }), /non-completed turn emitted a terminal answer/);
  await assert.rejects(() => run({ readbackFinalForNonCompleted: true, terminalStatus: "failed" }), /non-completed readback contains a terminal answer/);
  await assert.rejects(() => run({ readbackFinalForNonCompleted: true, terminalStatus: "interrupted" }), /non-completed readback contains a terminal answer/);

  const preAbortedController = new AbortController();
  preAbortedController.abort();
  const preAbortedInvocations = path.join(temporaryRoot, "pre-aborted-invocations.txt");
  await assert.rejects(() => run({ invocationFile: preAbortedInvocations }, { signal: preAbortedController.signal }), /native task was aborted/);
  assert.equal(await readFile(preAbortedInvocations, "utf8").catch(() => null), null);

  if (process.platform !== "win32") {
    const probeAbortController = new AbortController();
    const probeAbortInvocations = path.join(temporaryRoot, "probe-abort-invocations.txt");
    const probePidFile = path.join(temporaryRoot, "probe-abort.pid");
    const probeRootsBeforeAbort = new Set((await readdir(os.tmpdir())).filter((name) => name.startsWith("native-task-controller-probe-")));
    const probeAbortRun = run({ ignoreVersionSigterm: true, invocationFile: probeAbortInvocations, versionPidFile: probePidFile }, { signal: probeAbortController.signal });
    const probePid = Number(await waitForFile(probePidFile));
    probeAbortController.abort();
    await assert.rejects(probeAbortRun, /native task was aborted/);
    assert.throws(() => process.kill(probePid, 0), (error) => error?.code === "ESRCH");
    assert.deepEqual((await readFile(probeAbortInvocations, "utf8")).trim().split("\n"), ["--version"]);
    const probeRootsAfterAbort = new Set((await readdir(os.tmpdir())).filter((name) => name.startsWith("native-task-controller-probe-")));
    assert.deepEqual([...probeRootsAfterAbort].filter((name) => !probeRootsBeforeAbort.has(name)), []);
  }

  await assert.rejects(() => run({ approval: true }), /conflicts with the confirmed never policy/);
  await assert.rejects(() => run({ approval: true, approvalMissingId: true }, { approvalPolicy: "on-request" }), /approval request id is malformed/);
  await assert.rejects(() => run({ approval: true, approvalMissingId: true, fileApproval: true }, { approvalPolicy: "on-request" }), /approval request id is malformed/);
  await assert.rejects(() => run({ approval: true }, { approvalPolicy: "on-request" }), /approval requested without an explicit handler/);
  await assert.rejects(() => run({ approval: true }, { approvalHandler: async () => "invalid", approvalPolicy: "on-request" }), /unsupported decision/);
  await assert.rejects(() => run({ approval: true, availableDecisions: ["decline"] }, { approvalHandler: async () => "accept", approvalPolicy: "on-request" }), /decision is not allowed by the request/);
  await assert.rejects(() => run({ approval: true, omitResolved: true }, { approvalHandler: async () => "accept", approvalPolicy: "on-request" }), /before its approval was resolved/);
  await assert.rejects(() => run({ approval: true, approvalWithoutStarted: true }, { approvalHandler: async () => "accept", approvalPolicy: "on-request" }), /approval request lacks its matching started item/);
  await assert.rejects(() => run({ approval: true, approvalCommandMismatch: true }, { approvalHandler: async () => "accept", approvalPolicy: "on-request" }), /approval command differs from its started item/);
  await assert.rejects(() => run({ approval: true, expectedApprovalDecision: "decline" }, { approvalHandler: async () => "decline", approvalPolicy: "on-request" }), /status is incompatible with its approval decision/);
  await assert.rejects(() => run({ approval: true, expectedApprovalDecision: "cancel" }, { approvalHandler: async () => "cancel", approvalPolicy: "on-request" }), /status is incompatible with its approval decision/);
  await assert.rejects(() => run({ approval: true, authorityCompletedStatus: "declined" }, { approvalHandler: async () => "accept", approvalPolicy: "on-request" }), /status is incompatible with its approval decision/);
  await assert.rejects(() => run({ approval: true, completeBeforeApprovalResponse: true }, {
    approvalHandler: async () => { await new Promise((resolve) => setImmediate(resolve)); return "accept"; },
    approvalPolicy: "on-request",
  }), /message before the approval decision was sent/);
  await assert.rejects(() => run({ completedWithoutStarted: true }), /item\/completed lacks its matching started item/);
  await assert.rejects(() => run({ itemStartedBeforeThreadResponse: true }), /item\/started identity is malformed/);
  await assert.rejects(() => run({ itemStartedBeforeTurnResponse: true }), /item\/started identity is malformed/);
  await assert.rejects(() => run({ postTerminalItem: true }), /event after the terminal turn/);
  await assert.rejects(() => run({ postFinalAuthority: true }), /item event after the terminal answer/);
  await assert.rejects(() => run({ finalCompletedMismatch: true }), /did not confirm the exact terminal answer/);
  let postFinalApprovalHandled = false;
  await assert.rejects(() => run({ approval: true, approvalAfterFinal: true }, {
    approvalHandler: async () => { postFinalApprovalHandled = true; return "accept"; },
    approvalPolicy: "on-request",
  }), /terminal answer started before prior items and approvals closed/);
  assert.equal(postFinalApprovalHandled, false);
  await assert.rejects(() => run({ completedWithError: true }), /completed turn contains an error/);
  await assert.rejects(() => run({ readbackFinalMismatch: true }), /did not confirm the exact terminal answer/);
  await assert.rejects(() => run({ approval: true, readbackOmitAuthority: true }, { approvalHandler: async () => "accept", approvalPolicy: "on-request" }), /did not confirm the exact authority items/);
  await assert.rejects(() => run({ readbackPromptMismatch: true }), /did not confirm the exact prompt/);
  await assert.rejects(() => run({ readbackAuthorityBeforePrompt: true, unapprovedCommand: "pwd" }), /authority item before the exact prompt/);
  await assert.rejects(() => run({ readbackExtraTurn: true }), /did not confirm the exact terminal turn/);
  await assert.rejects(() => run({ readbackDuplicateItemId: true }), /duplicate item ids/);
  await assert.rejects(() => run({ turnStartStatus: "completed" }), /exact in-progress turn/);
  await assert.rejects(() => run({ approval: true, authorityStartedStatus: "completed" }, { approvalHandler: async () => "accept", approvalPolicy: "on-request" }), /started outside inProgress/);
  await assert.rejects(() => run({ authorityCompletedStatus: "inProgress", unapprovedCommand: "pwd" }), /completed with a non-terminal status/);
  await assert.rejects(() => run({ serverConfigMismatch: true }), /did not confirm requested authority configuration/);
  await assert.rejects(() => run({ unsolicitedThreadResponse: true }), /response arrived before its matching request was sent/);
  await assert.rejects(() => run({ sameChunkEarlyThreadResponse: true }), /response arrived before its matching request was sent/);
  await assert.rejects(() => run({ duplicateInitialize: true }), /duplicate response id/);
  await assert.rejects(() => run({ duplicateReadback: true }), /duplicate response id/);
  await assert.rejects(() => run({ delayedDuplicateReadback: true, ignoreSigterm: true }), /duplicate response id/);
  await assert.rejects(() => run({ delayedFailureAfterReadback: true, ignoreSigterm: true }), /exited unexpectedly during receipt shutdown: code=7 signal=null/);
  await assert.rejects(() => run({ incompleteUtf8AfterReadback: true }), /unterminated frame/);
  await assert.rejects(() => run({ unterminatedAfterReadback: true }), /unterminated frame/);
  await assert.rejects(() => run({ exitEarly: true }), /exited before terminal receipt/);
  await assert.rejects(() => run({ exitAfterReadback: true }), /exited before terminal receipt/);

  const wrongHash = await fixtureExecutable();
  await assert.rejects(() => runNativeTask({
    approvalPolicy: "never",
    codexExecutable: wrongHash.executable,
    cwd: temporaryRoot,
    expectedExecutableSha256: `sha256:${"0".repeat(64)}`,
    expectedSidecarSha256: wrongHash.sidecarSha256,
    expectedServerVersion: "0.148.0",
    prompt,
    sandbox: "read-only",
  }), /sha256 mismatch/);
  const missingSidecarTurnStart = path.join(temporaryRoot, "missing-sidecar-turn-start.txt");
  const missingSidecar = await fixtureExecutable({ turnStartFile: missingSidecarTurnStart });
  await rm(missingSidecar.sidecar);
  await assert.rejects(() => runNativeTask({
    approvalPolicy: "never",
    codexExecutable: missingSidecar.executable,
    cwd: temporaryRoot,
    expectedExecutableSha256: missingSidecar.sha256,
    expectedSidecarSha256: missingSidecar.sidecarSha256,
    expectedServerVersion: "0.148.0",
    prompt,
    sandbox: "read-only",
  }), /sidecar is missing or unsafe/);
  assert.equal(await readFile(missingSidecarTurnStart, "utf8").catch(() => null), null);
  const wrongSidecarTurnStart = path.join(temporaryRoot, "wrong-sidecar-turn-start.txt");
  const wrongSidecar = await fixtureExecutable({ turnStartFile: wrongSidecarTurnStart });
  await assert.rejects(() => runNativeTask({
    approvalPolicy: "never",
    codexExecutable: wrongSidecar.executable,
    cwd: temporaryRoot,
    expectedExecutableSha256: wrongSidecar.sha256,
    expectedSidecarSha256: `sha256:${"0".repeat(64)}`,
    expectedServerVersion: "0.148.0",
    prompt,
    sandbox: "read-only",
  }), /sidecar sha256 mismatch/);
  assert.equal(await readFile(wrongSidecarTurnStart, "utf8").catch(() => null), null);
  await assert.rejects(() => run({}, { expectedServerVersion: "0.149.0" }), /version mismatch/);
  await assert.rejects(() => run({ delayedInheritedVersionStdout: true }), /version mismatch/);
  await assert.rejects(() => run({}, { approvalPolicy: "invalid" }), /approval policy is unsupported/);
  await assert.rejects(() => run({}, { sandbox: "invalid" }), /sandbox mode is unsupported/);

  console.log("native task controller tests passed");
} finally {
  await rm(temporaryRoot, { recursive: true, force: true });
  await rm(detachedAuthorityRoot, { recursive: true, force: true });
}
