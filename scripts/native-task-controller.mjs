import { spawn, execFile } from "node:child_process";
import { createHash } from "node:crypto";
import { once } from "node:events";
import { createReadStream } from "node:fs";
import { chmod, copyFile, lstat, mkdtemp, readFile, realpath, rm } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import readline from "node:readline";
import { promisify } from "node:util";
import { pathToFileURL } from "node:url";
import { rejectDuplicateJsonObjectMembers } from "./json.mjs";

const execFileAsync = promisify(execFile);
const shaPattern = /^sha256:[a-f0-9]{64}$/;
const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;
const approvalPolicies = new Set(["untrusted", "on-request", "never"]);
const sandboxModes = new Set(["read-only", "workspace-write", "danger-full-access"]);
const approvalDecisions = new Set(["accept", "decline", "cancel"]);
const sandboxPolicyTypes = new Map([
  ["read-only", "readOnly"],
  ["workspace-write", "workspaceWrite"],
  ["danger-full-access", "dangerFullAccess"],
]);

function fail(message) {
  throw new Error(message);
}

function digest(value) {
  return `sha256:${createHash("sha256").update(value).digest("hex")}`;
}

function canonical(value) {
  if (Array.isArray(value)) return value.map(canonical);
  if (value && typeof value === "object") {
    return Object.fromEntries(Object.keys(value).sort().map((key) => [key, canonical(value[key])]));
  }
  return value;
}

function sameCanonical(left, right) {
  return JSON.stringify(canonical(left)) === JSON.stringify(canonical(right));
}

function authoritySubject(item) {
  if (item.type === "commandExecution") {
    if (typeof item.command !== "string" || !Array.isArray(item.commandActions) || typeof item.cwd !== "string") return null;
    return canonical({
      command: item.command,
      commandActions: item.commandActions,
      cwd: item.cwd,
      pluginId: item.pluginId ?? null,
      scriptPath: item.scriptPath ?? null,
      source: item.source ?? "agent",
    });
  }
  if (item.type === "fileChange") return Array.isArray(item.changes) ? canonical({ changes: item.changes }) : null;
  return null;
}

async function materializeExecutable(executable, expectedSha256, expectedVersion) {
  if (!path.isAbsolute(executable)) fail("codex executable must be one absolute path");
  if (!shaPattern.test(expectedSha256)) fail("expected executable sha256 is invalid");
  if (!/^\d+\.\d+\.\d+(?:[-+][0-9A-Za-z.-]+)?$/.test(expectedVersion)) fail("expected server version is invalid");
  const resolved = await realpath(executable).catch(() => "");
  const info = resolved ? await lstat(resolved).catch(() => null) : null;
  if (!info?.isFile() || info.isSymbolicLink() || (process.platform !== "win32" && (info.mode & 0o111) === 0)) {
    fail("codex executable is missing or unsafe");
  }
  const temporaryRoot = await mkdtemp(path.join(os.tmpdir(), "native-task-controller-exec-"));
  const runtimePath = path.join(temporaryRoot, process.platform === "win32" ? "codex.exe" : "codex");
  try {
    await copyFile(resolved, runtimePath);
    if (process.platform !== "win32") await chmod(runtimePath, 0o500);
    const runtimeInfo = await lstat(runtimePath);
    if (!runtimeInfo.isFile() || runtimeInfo.isSymbolicLink()) fail("materialized codex executable is unsafe");
    const hash = createHash("sha256");
    for await (const chunk of createReadStream(runtimePath)) hash.update(chunk);
    const sha256 = `sha256:${hash.digest("hex")}`;
    if (sha256 !== expectedSha256) fail("codex executable sha256 mismatch");
    const { stdout } = await execFileAsync(runtimePath, ["--version"], { encoding: "utf8", timeout: 10_000 });
    if (stdout.trim() !== `codex-cli ${expectedVersion}`) fail("codex executable version mismatch");
    return {
      identity: { path: resolved, sha256, version: expectedVersion },
      runtimePath,
      cleanup: () => rm(temporaryRoot, { force: true, recursive: true }),
    };
  } catch (error) {
    await rm(temporaryRoot, { force: true, recursive: true });
    throw error;
  }
}

async function directoryIdentity(cwd) {
  if (!path.isAbsolute(cwd)) fail("cwd must be one absolute path");
  const resolved = await realpath(cwd).catch(() => "");
  const info = resolved ? await lstat(resolved).catch(() => null) : null;
  if (!info?.isDirectory() || info.isSymbolicLink()) fail("cwd is missing or unsafe");
  return resolved;
}

function responseResult(message, id, label) {
  if (message.id !== id || message.method !== undefined || !message.result || typeof message.result !== "object" || message.error !== undefined) {
    fail(`${label} response is malformed`);
  }
  return message.result;
}

async function stopChild(child) {
  if (child.exitCode !== null || child.signalCode !== null) return;
  child.kill("SIGTERM");
  await Promise.race([once(child, "exit"), new Promise((resolve) => setTimeout(resolve, 250))]);
  if (child.exitCode !== null || child.signalCode !== null) return;
  child.kill("SIGKILL");
  const stopped = await Promise.race([once(child, "exit").then(() => true), new Promise((resolve) => setTimeout(() => resolve(false), 2_000))]);
  if (!stopped) fail("app-server process could not be stopped");
}

async function executeNativeTask({
  codexExecutable,
  expectedExecutableSha256,
  expectedServerVersion,
  cwd,
  prompt,
  approvalPolicy,
  sandbox,
  approvalHandler = null,
  model = null,
  timeoutMs = 7_200_000,
}, approvalDecisionSource) {
  if (typeof prompt !== "string" || prompt.length === 0 || Buffer.byteLength(prompt) > 1024 * 1024) fail("prompt must contain between 1 byte and 1 MiB");
  if (!approvalPolicies.has(approvalPolicy)) fail("approval policy is unsupported");
  if (!sandboxModes.has(sandbox)) fail("sandbox mode is unsupported");
  if (!(approvalHandler === null || typeof approvalHandler === "function")) fail("approval handler is invalid");
  if (!new Set(["client_handler", "interactive_stdin_after_request"]).has(approvalDecisionSource)) fail("internal approval decision source is invalid");
  if (!(model === null || (typeof model === "string" && model.length > 0 && model.length <= 200))) fail("model is invalid");
  if (!Number.isSafeInteger(timeoutMs) || timeoutMs < 1_000 || timeoutMs > 86_400_000) fail("timeout must be between 1000 and 86400000 ms");

  const taskCwd = await directoryIdentity(cwd);
  const materialized = await materializeExecutable(codexExecutable, expectedExecutableSha256, expectedServerVersion);
  const executable = materialized.identity;
  let child;
  try {
    child = spawn(materialized.runtimePath, ["app-server", "--stdio"], { cwd: taskCwd, stdio: ["pipe", "pipe", "pipe"] });
  } catch (error) {
    await materialized.cleanup();
    throw error;
  }
  if (!child.stdin || !child.stdout || !child.stderr) {
    await materialized.cleanup();
    fail("app-server process transport is unavailable");
  }
  child.stderr.resume();
  const lines = readline.createInterface({ input: child.stdout, crlfDelay: Infinity });
  const responseIds = new Set();
  const items = new Map();
  const approvals = new Map();
  const resolvedApprovals = new Set();
  const finalMessages = [];
  let threadId = null;
  let turnId = null;
  let stdoutBytes = 0;
  let terminalTurn = null;
  let terminalReadback = false;
  let serverConfiguration = null;
  let settled = false;

  const send = (message) => {
    if (!child.stdin.write(`${JSON.stringify(message)}\n`)) child.stdin.once("drain", () => {});
  };

  const terminal = new Promise((resolve, reject) => {
    const timer = setTimeout(() => finish(reject, new Error("app-server task timed out")), timeoutMs);
    const finish = (callback, value) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      callback(value);
    };

    const handle = async (line) => {
      stdoutBytes += Buffer.byteLength(line) + 1;
      if (stdoutBytes > 16 * 1024 * 1024) fail("app-server response exceeded 16 MiB");
      rejectDuplicateJsonObjectMembers(line, "app-server response");
      const message = JSON.parse(line);
      if (!message || Array.isArray(message) || typeof message !== "object") fail("app-server message is malformed");
      if (terminalTurn && !(message.method === undefined && message.id === 3)) fail("app-server emitted an event after the terminal turn");

      if (message.method === undefined && message.id !== undefined) {
        const key = JSON.stringify(message.id);
        if (responseIds.has(key)) fail("app-server returned a duplicate response id");
        responseIds.add(key);
        if (message.error !== undefined) fail(`app-server request ${message.id} failed`);
        if (message.id === 0) {
          const initialized = responseResult(message, 0, "initialize");
          if (typeof initialized.userAgent !== "string" || initialized.userAgent.length === 0) fail("initialize omitted userAgent");
          send({ method: "initialized", params: {} });
          send({
            method: "thread/start",
            id: 1,
            params: {
              approvalPolicy,
              cwd: taskCwd,
              ephemeral: false,
              model,
              sandbox,
              serviceName: "qoeop_pareto_native_task_controller",
            },
          });
          return;
        }
        if (message.id === 1) {
          const started = responseResult(message, 1, "thread/start");
          if (!uuidPattern.test(started.thread?.id ?? "")) fail("thread/start omitted an exact thread id");
          if (started.approvalPolicy !== approvalPolicy || started.cwd !== taskCwd || typeof started.model !== "string" || started.model.length === 0) {
            fail("thread/start did not confirm requested authority configuration");
          }
          if (model !== null && started.model !== model) fail("thread/start selected an unexpected model");
          if (started.sandbox?.type !== sandboxPolicyTypes.get(sandbox)) fail("thread/start selected an unexpected sandbox policy");
          serverConfiguration = canonical({
            approval_policy: started.approvalPolicy,
            cwd: started.cwd,
            model: started.model,
            sandbox: started.sandbox,
          });
          threadId = started.thread.id;
          send({ method: "turn/start", id: 2, params: { input: [{ type: "text", text: prompt }], threadId } });
          return;
        }
        if (message.id === 2) {
          const started = responseResult(message, 2, "turn/start");
          if (!threadId || !uuidPattern.test(started.turn?.id ?? "")) fail("turn/start omitted an exact turn id");
          turnId = started.turn.id;
          return;
        }
        if (message.id === 3) {
          const readback = responseResult(message, 3, "thread/read");
          const matchingTurns = Array.isArray(readback.thread?.turns) ? readback.thread.turns.filter((turn) => turn?.id === turnId) : [];
          if (readback.thread?.id !== threadId || readback.thread?.cwd !== serverConfiguration?.cwd || matchingTurns.length !== 1 || matchingTurns[0].status !== terminalTurn?.status) {
            fail("thread/read did not confirm the exact terminal turn");
          }
          const readbackFinals = Array.isArray(matchingTurns[0].items)
            ? matchingTurns[0].items.filter((item) => item?.type === "agentMessage" && item?.phase === "final_answer")
            : [];
          if (terminalTurn.status === "completed" && (readbackFinals.length !== 1 || readbackFinals[0].text !== finalMessages[0])) {
            fail("thread/read did not confirm the exact terminal answer");
          }
          terminalReadback = true;
          finish(resolve);
          return;
        }
        fail("app-server returned an unknown client response id");
      }

      if (message.id !== undefined && typeof message.method === "string") {
        if (!["item/commandExecution/requestApproval", "item/fileChange/requestApproval"].includes(message.method)) {
          fail(`unsupported app-server request: ${message.method}`);
        }
        const params = message.params;
        if (!threadId || !turnId || params?.threadId !== threadId || params?.turnId !== turnId || typeof params?.itemId !== "string") {
          fail("approval request identity is malformed");
        }
        if (approvalHandler === null) fail("approval requested without an explicit handler");
        const key = JSON.stringify(message.id);
        if (approvals.has(key)) fail("app-server returned a duplicate approval request id");
        const expectedItemType = message.method === "item/commandExecution/requestApproval" ? "commandExecution" : "fileChange";
        const startedItem = items.get(params.itemId);
        if (startedItem?.state !== "started" || startedItem?.type !== expectedItemType) {
          fail("approval request lacks its matching started item");
        }
        if (expectedItemType === "commandExecution") {
          if (params.command !== null && params.command !== undefined && params.command !== startedItem.item.command) fail("approval command differs from its started item");
          if (params.cwd !== null && params.cwd !== undefined && params.cwd !== startedItem.item.cwd) fail("approval cwd differs from its started item");
          if (params.commandActions !== null && params.commandActions !== undefined && !sameCanonical(params.commandActions, startedItem.item.commandActions)) {
            fail("approval command actions differ from its started item");
          }
        }
        const authority = canonical({ method: message.method, params, started_item: startedItem.item });
        const decision = await approvalHandler(authority);
        if (!approvalDecisions.has(decision)) fail("approval handler returned an unsupported decision");
        if ([...approvals.values()].some((approval) => approval.itemId === params.itemId)) fail("item has more than one approval request");
        approvals.set(key, {
          decision,
          decision_source: approvalDecisionSource,
          itemId: params.itemId,
          method: message.method,
          request_sha256: digest(JSON.stringify(authority)),
          subject_sha256: digest(JSON.stringify(startedItem.subject)),
        });
        send({ id: message.id, result: { decision } });
        return;
      }

      if (typeof message.method !== "string" || message.id !== undefined) fail("app-server notification is malformed");
      const params = message.params ?? {};
      if (message.method === "item/started" || message.method === "item/completed") {
        if (params.threadId !== threadId || params.turnId !== turnId || typeof params.item?.id !== "string" || typeof params.item?.type !== "string") {
          fail(`${message.method} identity is malformed`);
        }
        const current = items.get(params.item.id);
        if (message.method === "item/started") {
          if (current) fail("item/started duplicated or reversed an item lifecycle");
          const item = canonical(params.item);
          const subject = authoritySubject(item);
          if (["commandExecution", "fileChange"].includes(item.type) && !subject) fail("authority item is malformed");
          items.set(params.item.id, { item, state: "started", subject, type: params.item.type });
        } else {
          if (current?.state !== "started" || current.type !== params.item.type) fail("item/completed lacks its matching started item");
          const completedSubject = authoritySubject(params.item);
          if (current.subject !== null && !sameCanonical(completedSubject, current.subject)) fail("item/completed changed its authority subject");
          const approvalKey = [...approvals].find(([, approval]) => approval.itemId === params.item.id)?.[0];
          if (approvalKey !== undefined && !resolvedApprovals.has(approvalKey)) fail("item completed before its approval was resolved");
          items.set(params.item.id, { ...current, item: canonical(params.item), state: "completed" });
        }
        if (message.method === "item/completed" && params.item.type === "agentMessage" && params.item.phase === "final_answer") {
          if (typeof params.item.text !== "string" || Buffer.byteLength(params.item.text) > 1024 * 1024) fail("terminal agent message is malformed or exceeds 1 MiB");
          finalMessages.push(params.item.text);
        }
        return;
      }
      if (message.method === "serverRequest/resolved") {
        if (params.threadId !== threadId || params.requestId === undefined) fail("resolved approval identity is malformed");
        const key = JSON.stringify(params.requestId);
        if (!approvals.has(key) || resolvedApprovals.has(key)) fail("resolved approval is unknown or duplicate");
        resolvedApprovals.add(key);
        return;
      }
      if (message.method === "turn/completed") {
        if (!threadId || !turnId || params.threadId !== threadId || params.turn?.id !== turnId || !["completed", "interrupted", "failed"].includes(params.turn?.status)) {
          fail("turn/completed identity or status is malformed");
        }
        if (terminalTurn) fail("app-server emitted more than one terminal turn");
        if (approvals.size !== resolvedApprovals.size) fail("turn completed with unresolved approval requests");
        if ([...items.values()].some((item) => item.state !== "completed")) fail("turn completed with an incomplete item lifecycle");
        if (params.turn.status === "completed" && finalMessages.length !== 1) fail("completed turn lacks one terminal agent message");
        terminalTurn = params.turn;
        send({ method: "thread/read", id: 3, params: { includeTurns: true, threadId } });
        return;
      }
      if (message.method === "error" && (!params.threadId || params.threadId === threadId)) fail("app-server emitted an error notification");
    };

    let chain = Promise.resolve();
    lines.on("line", (line) => {
      chain = chain.then(() => handle(line)).catch((error) => finish(reject, error));
    });
    child.once("error", () => finish(reject, new Error("app-server process failed")));
    child.once("exit", (code, signal) => {
      if (!terminalReadback) finish(reject, new Error(`app-server exited before terminal receipt: code=${code} signal=${signal}`));
    });
  });

  send({
    method: "initialize",
    id: 0,
    params: { clientInfo: { name: "qoeop_pareto_native_task_controller", title: "Pareto Native Task Controller", version: "1.0.0" } },
  });

  try {
    await terminal;
  } finally {
    lines.close();
    child.stdin.end();
    try {
      await stopChild(child);
    } finally {
      await materialized.cleanup();
    }
  }

  const finalText = finalMessages[0] ?? null;
  const payload = canonical({
    approvals: [...approvals.values()].map(canonical),
    requested_configuration: { approval_policy: approvalPolicy, cwd: taskCwd, model, sandbox },
    server_configuration: serverConfiguration,
    executable,
    final: finalText === null ? null : { bytes: Buffer.byteLength(finalText), sha256: digest(finalText), text: finalText },
    items: { completed: [...items.values()].filter((item) => item.state === "completed").length },
    prompt_sha256: digest(prompt),
    schema: "rbm-native-task-terminal/v1",
    thread: { id: threadId },
    turn: {
      error_sha256: terminalTurn.error == null ? null : digest(JSON.stringify(canonical(terminalTurn.error))),
      id: turnId,
      status: terminalTurn.status,
    },
  });
  return { content_sha256: digest(JSON.stringify(payload)), payload, schema: "rbm-native-task-terminal-envelope/v1" };
}

export async function runNativeTask(options) {
  return executeNativeTask(options, "client_handler");
}

function parseArguments(argv) {
  if (argv[0] !== "run") fail("usage: native-task-controller.mjs run --codex-executable <absolute> --expected-sha256 <sha256:digest> --expected-version <version> --cwd <absolute> --prompt-file <absolute> --approval-policy <policy> --sandbox <mode> [--model <model>] [--timeout-ms <ms>]");
  const options = {};
  for (let index = 1; index < argv.length; index += 2) {
    const name = argv[index];
    const value = argv[index + 1];
    if (!name?.startsWith("--") || value === undefined) fail("command arguments must be exact name/value pairs");
    const key = name.slice(2);
    if (options[key] !== undefined) fail(`duplicate argument: ${name}`);
    options[key] = value;
  }
  const required = ["codex-executable", "expected-sha256", "expected-version", "cwd", "prompt-file", "approval-policy", "sandbox"];
  for (const name of required) if (options[name] === undefined) fail(`missing argument: --${name}`);
  const allowed = new Set([...required, "model", "timeout-ms"]);
  for (const name of Object.keys(options)) if (!allowed.has(name)) fail(`unknown argument: --${name}`);
  return options;
}

async function readPrompt(promptFile) {
  if (!path.isAbsolute(promptFile)) fail("prompt file must be one absolute path");
  const info = await lstat(promptFile).catch(() => null);
  if (!info?.isFile() || info.isSymbolicLink() || info.size < 1 || info.size > 1024 * 1024) fail("prompt file is missing, unsafe, empty, or exceeds 1 MiB");
  return readFile(promptFile, "utf8");
}

async function main() {
  const options = parseArguments(process.argv.slice(2));
  const approvalInput = readline.createInterface({ input: process.stdin, crlfDelay: Infinity, terminal: process.stdin.isTTY });
  let decisionWaiter = null;
  let unexpectedApprovalInput = null;
  let approvalInputClosed = false;
  approvalInput.on("line", (line) => {
    const decision = line.trim();
    if (decisionWaiter) {
      const waiter = decisionWaiter;
      decisionWaiter = null;
      waiter.resolve(decision);
    } else {
      unexpectedApprovalInput = new Error("approval decision arrived before a displayed request");
    }
  });
  approvalInput.on("close", () => {
    approvalInputClosed = true;
    if (decisionWaiter) {
      decisionWaiter.reject(new Error("approval input closed before a decision"));
      decisionWaiter = null;
    }
  });
  const approvalHandler = async ({ method, params, started_item }) => {
    if (unexpectedApprovalInput) throw unexpectedApprovalInput;
    if (decisionWaiter) fail("more than one approval request is awaiting a decision");
    process.stderr.write(`${JSON.stringify({ approval_request: { method, params, started_item } })}\n`);
    process.stderr.write("approval decision (accept|decline|cancel): ");
    if (approvalInputClosed) fail("approval input closed before a decision");
    return new Promise((resolve, reject) => { decisionWaiter = { reject, resolve }; });
  };
  try {
    const receipt = await executeNativeTask({
      approvalHandler,
      approvalPolicy: options["approval-policy"],
      codexExecutable: options["codex-executable"],
      cwd: options.cwd,
      expectedExecutableSha256: options["expected-sha256"],
      expectedServerVersion: options["expected-version"],
      model: options.model ?? null,
      prompt: await readPrompt(options["prompt-file"]),
      sandbox: options.sandbox,
      timeoutMs: options["timeout-ms"] === undefined ? undefined : Number(options["timeout-ms"]),
    }, "interactive_stdin_after_request");
    if (unexpectedApprovalInput) throw unexpectedApprovalInput;
    process.stdout.write(`${JSON.stringify(receipt)}\n`);
    if (receipt.payload.turn.status !== "completed") process.exitCode = 1;
  } finally {
    approvalInput.close();
  }
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? "").href) {
  main().catch((error) => {
    process.stderr.write(`native-task-controller: failed: ${error.message}\n`);
    process.exitCode = 1;
  });
}
