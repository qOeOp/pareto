import { spawn } from "node:child_process";
import { createHash, randomUUID } from "node:crypto";
import { once } from "node:events";
import { createReadStream } from "node:fs";
import { chmod, copyFile, link, lstat, mkdir, mkdtemp, readFile, realpath, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import readline from "node:readline";
import { TextDecoder } from "node:util";
import { pathToFileURL } from "node:url";
import { rejectDuplicateJsonObjectMembers } from "./json.mjs";

const shaPattern = /^sha256:[a-f0-9]{64}$/;
const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;
const approvalPolicies = new Set(["untrusted", "on-request", "never"]);
const sandboxModes = new Set(["read-only", "workspace-write", "danger-full-access"]);
const approvalDecisions = new Set(["accept", "decline", "cancel"]);
const approvalRequestMethods = new Set(["item/commandExecution/requestApproval", "item/fileChange/requestApproval"]);
const sandboxPolicyTypes = new Map([
  ["read-only", "readOnly"],
  ["workspace-write", "workspaceWrite"],
  ["danger-full-access", "dangerFullAccess"],
]);

function fail(message) {
  throw new Error(message);
}

function failIfAborted(signal) {
  if (signal?.aborted) fail("native task was aborted");
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

function containsPath(root, candidate) {
  const relative = path.relative(root, candidate);
  return relative === "" || (relative !== ".." && !relative.startsWith(`..${path.sep}`) && !path.isAbsolute(relative));
}

async function resolvedPath(value) {
  let current = path.resolve(value);
  const suffix = [];
  while (true) {
    const resolved = await realpath(current).catch(() => null);
    if (resolved !== null) return path.join(resolved, ...suffix.reverse());
    const parent = path.dirname(current);
    if (parent === current) return path.resolve(value);
    suffix.push(path.basename(current));
    current = parent;
  }
}

export async function assertDetachedReceiptIsolation(receiptRoot, taskCwd, sandbox, serverSandbox = null) {
  if (sandbox === "danger-full-access") fail("detached native tasks forbid danger-full-access because receipts must remain outside Task authority");
  if (sandbox === "read-only") return;
  if (sandbox !== "workspace-write") fail("detached native task sandbox is invalid");
  const writableRoots = [taskCwd];
  if (serverSandbox === null || serverSandbox.excludeSlashTmp !== true) writableRoots.push("/tmp");
  if (serverSandbox === null || serverSandbox.excludeTmpdirEnvVar !== true) writableRoots.push(os.tmpdir());
  if (serverSandbox !== null) {
    if (serverSandbox.type !== "workspaceWrite" || !Array.isArray(serverSandbox.writableRoots)
      || serverSandbox.writableRoots.some((root) => typeof root !== "string" || !path.isAbsolute(root))) {
      fail("workspace-write server sandbox omitted exact writable roots");
    }
    writableRoots.push(...serverSandbox.writableRoots);
  }
  const resolvedReceipt = await resolvedPath(receiptRoot);
  for (const writableRoot of new Set(await Promise.all(writableRoots.map(resolvedPath)))) {
    if (containsPath(writableRoot, resolvedReceipt)) {
      fail("detached native task receipt directory is writable by the Task sandbox");
    }
  }
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

function terminalAnswerSubject(item) {
  if (item.type !== "agentMessage" || item.phase !== "final_answer") return null;
  return canonical({ phase: item.phase, type: item.type });
}

async function readVersionProbe(executable, signal) {
  failIfAborted(signal);
  let child;
  try {
    child = spawn(executable, ["--version"], { stdio: ["ignore", "pipe", "pipe"] });
  } catch (error) {
    throw error;
  }
  if (!child.stdout || !child.stderr) {
    await stopChild(child);
    fail("codex version probe transport is unavailable");
  }
  child.stderr.resume();
  const chunks = [];
  let stdoutBytes = 0;
  let interrupt;
  const interrupted = new Promise((resolve) => { interrupt = resolve; });
  const onAbort = () => interrupt(new Error("native task was aborted"));
  if (signal?.aborted) onAbort();
  else signal?.addEventListener("abort", onAbort, { once: true });
  const timer = setTimeout(() => interrupt(new Error("codex version probe timed out")), 10_000);
  child.stdout.on("data", (chunk) => {
    stdoutBytes += chunk.length;
    if (stdoutBytes > 1024 * 1024) interrupt(new Error("codex version probe output exceeded 1 MiB"));
    else chunks.push(chunk);
  });
  const closed = new Promise((resolve) => {
    child.once("error", (error) => resolve({ error }));
    child.once("close", (code, childSignal) => resolve({ childSignal, code }));
  });
  const outcome = await Promise.race([
    closed.then((value) => ({ type: "close", value })),
    interrupted.then((error) => ({ error, type: "interrupt" })),
  ]);
  clearTimeout(timer);
  signal?.removeEventListener("abort", onAbort);
  if (outcome.type === "interrupt") {
    await stopChild(child);
    throw outcome.error;
  }
  if (outcome.value.error) throw outcome.value.error;
  if (outcome.value.code !== 0 || outcome.value.childSignal !== null) fail("codex version probe failed");
  return Buffer.concat(chunks).toString("utf8");
}

async function materializeExecutable(executable, expectedSha256, expectedVersion, signal) {
  failIfAborted(signal);
  if (!path.isAbsolute(executable)) fail("codex executable must be one absolute path");
  if (!shaPattern.test(expectedSha256)) fail("expected executable sha256 is invalid");
  if (!/^\d+\.\d+\.\d+(?:[-+][0-9A-Za-z.-]+)?$/.test(expectedVersion)) fail("expected server version is invalid");
  const resolved = await realpath(executable).catch(() => "");
  failIfAborted(signal);
  const info = resolved ? await lstat(resolved).catch(() => null) : null;
  failIfAborted(signal);
  if (!info?.isFile() || info.isSymbolicLink() || (process.platform !== "win32" && (info.mode & 0o111) === 0)) {
    fail("codex executable is missing or unsafe");
  }
  const copyExecutable = async (prefix) => {
    failIfAborted(signal);
    const root = await mkdtemp(path.join(os.tmpdir(), prefix));
    const copiedPath = path.join(root, process.platform === "win32" ? "codex.exe" : "codex");
    try {
      await copyFile(resolved, copiedPath);
      failIfAborted(signal);
      if (process.platform !== "win32") await chmod(copiedPath, 0o500);
      failIfAborted(signal);
      const copiedInfo = await lstat(copiedPath);
      failIfAborted(signal);
      if (!copiedInfo.isFile() || copiedInfo.isSymbolicLink()) fail("materialized codex executable is unsafe");
      const hash = createHash("sha256");
      for await (const chunk of createReadStream(copiedPath)) {
        failIfAborted(signal);
        hash.update(chunk);
      }
      failIfAborted(signal);
      const sha256 = `sha256:${hash.digest("hex")}`;
      if (sha256 !== expectedSha256) fail("codex executable sha256 mismatch");
      return { cleanup: () => rm(root, { force: true, recursive: true }), copiedPath, sha256 };
    } catch (error) {
      await rm(root, { force: true, recursive: true });
      throw error;
    }
  };
  const probe = await copyExecutable("native-task-controller-probe-");
  try {
    const stdout = await readVersionProbe(probe.copiedPath, signal);
    failIfAborted(signal);
    if (stdout.trim() !== `codex-cli ${expectedVersion}`) fail("codex executable version mismatch");
  } finally {
    await probe.cleanup();
  }
  failIfAborted(signal);
  const runtime = await copyExecutable("native-task-controller-runtime-");
  try {
    failIfAborted(signal);
    return {
      identity: { path: resolved, sha256: runtime.sha256, version: expectedVersion },
      runtimePath: runtime.copiedPath,
      cleanup: runtime.cleanup,
    };
  } catch (error) {
    await runtime.cleanup();
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

function validRequestId(id) {
  return (typeof id === "string" && id.length > 0 && id.length <= 200) || Number.isSafeInteger(id);
}

async function stopChild(child) {
  const signalsSent = [];
  if (child.exitCode !== null || child.signalCode !== null) return { signalsSent };
  if (child.kill("SIGTERM")) signalsSent.push("SIGTERM");
  await Promise.race([once(child, "exit"), new Promise((resolve) => setTimeout(resolve, 250))]);
  if (child.exitCode !== null || child.signalCode !== null) return { signalsSent };
  if (child.kill("SIGKILL")) signalsSent.push("SIGKILL");
  const stopped = await Promise.race([once(child, "exit").then(() => true), new Promise((resolve) => setTimeout(() => resolve(false), 2_000))]);
  if (!stopped) fail("app-server process could not be stopped");
  return { signalsSent };
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
  signal = null,
  timeoutMs = 7_200_000,
  onConfigured = null,
  onStarted = null,
}, approvalDecisionSource) {
  if (typeof prompt !== "string" || prompt.length === 0 || Buffer.byteLength(prompt) > 1024 * 1024) fail("prompt must contain between 1 byte and 1 MiB");
  if (!approvalPolicies.has(approvalPolicy)) fail("approval policy is unsupported");
  if (!sandboxModes.has(sandbox)) fail("sandbox mode is unsupported");
  if (!(approvalHandler === null || typeof approvalHandler === "function")) fail("approval handler is invalid");
  if (!new Set(["client_handler", "interactive_stdin_after_request"]).has(approvalDecisionSource)) fail("internal approval decision source is invalid");
  if (!(model === null || (typeof model === "string" && model.length > 0 && model.length <= 200))) fail("model is invalid");
  if (!(signal === null || (typeof signal === "object" && typeof signal.aborted === "boolean" && typeof signal.addEventListener === "function" && typeof signal.removeEventListener === "function"))) fail("abort signal is invalid");
  if (!(onConfigured === null || typeof onConfigured === "function")) fail("server configuration handler is invalid");
  if (!(onStarted === null || typeof onStarted === "function")) fail("start receipt handler is invalid");
  if (!Number.isSafeInteger(timeoutMs) || timeoutMs < 1_000 || timeoutMs > 86_400_000) fail("timeout must be between 1000 and 86400000 ms");

  failIfAborted(signal);
  const taskCwd = await directoryIdentity(cwd);
  failIfAborted(signal);
  const materialized = await materializeExecutable(codexExecutable, expectedExecutableSha256, expectedServerVersion, signal);
  const executable = materialized.identity;
  let child;
  try {
    failIfAborted(signal);
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
  const responseIds = new Set();
  const items = new Map();
  const approvals = new Map();
  const outstandingRequests = new Map();
  const resolvedApprovals = new Set();
  const completionOrder = [];
  const finalMessages = [];
  let threadId = null;
  let turnId = null;
  let stdoutBytes = 0;
  let terminalTurn = null;
  let terminalReadback = false;
  let terminalAnswerItemId = null;
  let readbackFinalItemId = null;
  let readbackAuthorityItemsReceipt = [];
  let serverConfiguration = null;
  let settled = false;
  let pendingLines = 0;
  let successSealScheduled = false;
  let successShutdownStarted = false;
  let wireSequence = 0;
  let framingRemainder = Buffer.alloc(0);
  const frameDecoder = new TextDecoder("utf-8", { fatal: true });

  const send = (message) => {
    if (typeof message.method === "string" && message.id !== undefined) {
      const key = JSON.stringify(message.id);
      if (outstandingRequests.has(key) || responseIds.has(key)) fail("client request id is duplicate or already consumed");
      outstandingRequests.set(key, { method: message.method, sentWireSequence: ++wireSequence });
    }
    if (!child.stdin.write(`${JSON.stringify(message)}\n`)) child.stdin.once("drain", () => {});
  };

  const terminal = new Promise((resolve, reject) => {
    const timer = setTimeout(() => finish(reject, new Error("app-server task timed out")), timeoutMs);
    const onAbort = () => finish(reject, new Error("native task was aborted"));
    const finish = (callback, value) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      signal?.removeEventListener("abort", onAbort);
      callback(value);
    };
    if (signal?.aborted) onAbort();
    else signal?.addEventListener("abort", onAbort, { once: true });
    const scheduleSuccessSeal = () => {
      if (successSealScheduled) return;
      successSealScheduled = true;
      const attempt = async () => {
        if (settled) return;
        if (pendingLines !== 0) {
          setImmediate(attempt);
          return;
        }
        setImmediate(() => {
          setTimeout(async () => {
            if (settled) return;
            if (pendingLines !== 0) {
              setImmediate(attempt);
              return;
            }
            if (framingRemainder.length !== 0) {
              finish(reject, new Error("app-server response ended with an unterminated frame"));
              return;
            }
            if (child.exitCode !== null || child.signalCode !== null) {
              finish(reject, new Error(`app-server exited before terminal receipt: code=${child.exitCode} signal=${child.signalCode}`));
              return;
            }
            successShutdownStarted = true;
            const closed = once(child, "close");
            child.stdin.end();
            try {
              const stop = await stopChild(child);
              const [closeCode, closeSignal] = await closed;
              const controlledClose = (closeCode === 0 && closeSignal === null)
                || (closeCode === null && stop.signalsSent.includes(closeSignal));
              if (!controlledClose) fail(`app-server exited unexpectedly during receipt shutdown: code=${closeCode} signal=${closeSignal}`);
              await chain;
            } catch (error) {
              finish(reject, error);
              return;
            }
            if (settled) return;
            if (pendingLines !== 0) {
              finish(reject, new Error("app-server response queue did not drain before shutdown"));
              return;
            }
            if (framingRemainder.length !== 0) {
              finish(reject, new Error("app-server response ended with an unterminated frame"));
              return;
            }
            finish(resolve);
          }, 50);
        });
      };
      setImmediate(attempt);
    };

    const handle = async (line, receiveWireSequence) => {
      if (settled) return;
      rejectDuplicateJsonObjectMembers(line, "app-server response");
      const message = JSON.parse(line);
      if (!message || Array.isArray(message) || typeof message !== "object") fail("app-server message is malformed");
      if (terminalTurn && !(message.method === undefined && message.id === 3)) fail("app-server emitted an event after the terminal turn");

      if (message.method === undefined && message.id !== undefined) {
        const key = JSON.stringify(message.id);
        if (responseIds.has(key)) fail("app-server returned a duplicate response id");
        const request = outstandingRequests.get(key);
        if (!request || request.sentWireSequence >= receiveWireSequence) fail("app-server response arrived before its matching request was sent");
        outstandingRequests.delete(key);
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
          if (onConfigured) await onConfigured(serverConfiguration);
          threadId = started.thread.id;
          send({ method: "turn/start", id: 2, params: { input: [{ type: "text", text: prompt }], threadId } });
          return;
        }
        if (message.id === 2) {
          const started = responseResult(message, 2, "turn/start");
          if (!threadId || !uuidPattern.test(started.turn?.id ?? "") || started.turn?.status !== "inProgress") fail("turn/start omitted an exact in-progress turn");
          turnId = started.turn.id;
          if (onStarted) await onStarted(canonical({
            executable,
            prompt_sha256: digest(prompt),
            requested_configuration: { approval_policy: approvalPolicy, cwd: taskCwd, model, sandbox },
            schema: "rbm-native-task-start/v1",
            server_configuration: serverConfiguration,
            thread: { id: threadId },
            turn: { id: turnId, status: started.turn.status },
          }));
          return;
        }
        if (message.id === 3) {
          const readback = responseResult(message, 3, "thread/read");
          const readbackTurns = Array.isArray(readback.thread?.turns) ? readback.thread.turns : [];
          const matchingTurns = readbackTurns.filter((turn) => turn?.id === turnId);
          if (readback.thread?.id !== threadId || readback.thread?.cwd !== serverConfiguration?.cwd || readbackTurns.length !== 1 || matchingTurns.length !== 1 || matchingTurns[0].status !== terminalTurn?.status) {
            fail("thread/read did not confirm the exact terminal turn");
          }
          if (!sameCanonical(matchingTurns[0].error ?? null, terminalTurn.error ?? null)) fail("thread/read returned a different terminal error");
          const readbackItems = Array.isArray(matchingTurns[0].items) ? matchingTurns[0].items : [];
          const readbackItemIds = readbackItems.map((item) => item?.id);
          if (readbackItemIds.some((id) => typeof id !== "string" || id.length === 0) || new Set(readbackItemIds).size !== readbackItemIds.length) {
            fail("thread/read returned malformed or duplicate item ids");
          }
          const userMessages = readbackItems.filter((item) => item?.type === "userMessage");
          if (userMessages.length !== 1 || !Array.isArray(userMessages[0].content) || userMessages[0].content.length !== 1
            || userMessages[0].content[0]?.type !== "text" || userMessages[0].content[0]?.text !== prompt) {
            fail("thread/read did not confirm the exact prompt");
          }
          const promptIndex = readbackItems.indexOf(userMessages[0]);
          const streamedAuthorityItems = completionOrder.map((id) => items.get(id)).filter((item) => item.subject !== null);
          const readbackAuthorityItems = readbackItems.filter((item) => ["commandExecution", "fileChange"].includes(item?.type));
          if (readbackAuthorityItems.length !== streamedAuthorityItems.length || streamedAuthorityItems.some((streamed, index) => {
            const readbackItem = readbackAuthorityItems[index];
            return readbackItem?.type !== streamed.type || readbackItem.status !== streamed.item.status
              || !sameCanonical(authoritySubject(readbackItem), streamed.subject);
          })) fail("thread/read did not confirm the exact authority items");
          if (readbackAuthorityItems.some((item) => readbackItems.indexOf(item) < promptIndex)) {
            fail("thread/read returned an authority item before the exact prompt");
          }
          readbackAuthorityItemsReceipt = readbackAuthorityItems.map((item) => canonical({
            readback_item_id: item.id,
            status: item.status,
            subject_sha256: digest(JSON.stringify(authoritySubject(item))),
            type: item.type,
          }));
          const readbackFinals = readbackItems.filter((item) => item?.type === "agentMessage" && item?.phase === "final_answer");
          if (terminalTurn.status === "completed" && (readbackFinals.length !== 1 || readbackFinals[0].text !== finalMessages[0])) {
            fail("thread/read did not confirm the exact terminal answer");
          }
          if (terminalTurn.status === "completed" && readbackItems.indexOf(readbackFinals[0]) < promptIndex) {
            fail("thread/read returned the terminal answer before the exact prompt");
          }
          if (terminalTurn.status !== "completed" && readbackFinals.length !== 0) fail("non-completed readback contains a terminal answer");
          if (terminalTurn.status === "completed" && readbackItems.at(-1) !== readbackFinals[0]) fail("thread/read terminal answer is not the last item");
          readbackFinalItemId = readbackFinals[0]?.id ?? null;
          terminalReadback = true;
          scheduleSuccessSeal();
          return;
        }
        fail("app-server returned an unknown client response id");
      }

      if (approvalRequestMethods.has(message.method)) {
        if (terminalAnswerItemId !== null) fail("app-server requested approval after the terminal answer started");
        const params = message.params;
        if (!validRequestId(message.id)) fail("approval request id is malformed");
        if (!threadId || !turnId || params?.threadId !== threadId || params?.turnId !== turnId || typeof params?.itemId !== "string") {
          fail("approval request identity is malformed");
        }
        if (approvalPolicy === "never") fail("approval request conflicts with the confirmed never policy");
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
        if (params.availableDecisions !== undefined
          && (!Array.isArray(params.availableDecisions) || !params.availableDecisions.every((value) => approvalDecisions.has(value)) || !params.availableDecisions.includes(decision))) {
          fail("approval decision is not allowed by the request");
        }
        if (wireSequence !== receiveWireSequence) fail("app-server emitted a message before the approval decision was sent");
        if ([...approvals.values()].some((approval) => approval.itemId === params.itemId)) fail("item has more than one approval request");
        const decisionWireSequence = ++wireSequence;
        approvals.set(key, {
          decision,
          decision_wire_sequence: decisionWireSequence,
          decision_source: approvalDecisionSource,
          itemId: params.itemId,
          method: message.method,
          request_wire_sequence: receiveWireSequence,
          request_sha256: digest(JSON.stringify(authority)),
          resolved_wire_sequence: null,
          subject_sha256: digest(JSON.stringify(startedItem.subject)),
        });
        send({ id: message.id, result: { decision } });
        return;
      }
      if (message.id !== undefined && typeof message.method === "string") fail(`unsupported app-server request: ${message.method}`);

      if (typeof message.method !== "string" || message.id !== undefined) fail("app-server notification is malformed");
      const params = message.params ?? {};
      if (message.method === "item/started" || message.method === "item/completed") {
        if (terminalAnswerItemId !== null && !(message.method === "item/completed" && params.item?.id === terminalAnswerItemId && finalMessages.length === 0)) {
          fail("app-server emitted an item event after the terminal answer started");
        }
        if (!threadId || !turnId || params.threadId !== threadId || params.turnId !== turnId || typeof params.item?.id !== "string" || typeof params.item?.type !== "string") {
          fail(`${message.method} identity is malformed`);
        }
        const current = items.get(params.item.id);
        if (message.method === "item/started") {
          if (current) fail("item/started duplicated or reversed an item lifecycle");
          const item = canonical(params.item);
          const subject = authoritySubject(item);
          const terminalSubject = terminalAnswerSubject(item);
          if (["commandExecution", "fileChange"].includes(item.type) && !subject) fail("authority item is malformed");
          if (["commandExecution", "fileChange"].includes(item.type) && item.status !== "inProgress") fail("authority item started outside inProgress status");
          if (item.type === "agentMessage" && item.phase === "final_answer"
            && ([...items.values()].some((entry) => entry.state !== "completed") || approvals.size !== resolvedApprovals.size)) {
            fail("terminal answer started before prior items and approvals closed");
          }
          if (item.type === "agentMessage" && item.phase === "final_answer" && terminalSubject === null) fail("terminal answer started with malformed content");
          if (terminalSubject !== null) terminalAnswerItemId = item.id;
          items.set(params.item.id, { item, startedWireSequence: receiveWireSequence, state: "started", subject, terminalSubject, threadId, turnId, type: params.item.type });
        } else {
          if (current?.state !== "started" || current.type !== params.item.type) fail("item/completed lacks its matching started item");
          if (current.threadId !== params.threadId || current.turnId !== params.turnId) fail("item/completed changed its started identity");
          const completedSubject = authoritySubject(params.item);
          if (current.subject !== null && !sameCanonical(completedSubject, current.subject)) fail("item/completed changed its authority subject");
          if (current.terminalSubject !== null && !sameCanonical(terminalAnswerSubject(params.item), current.terminalSubject)) fail("item/completed changed its terminal answer");
          if (current.subject !== null && !["completed", "failed", "declined"].includes(params.item.status)) fail("authority item completed with a non-terminal status");
          const approvalKey = [...approvals].find(([, approval]) => approval.itemId === params.item.id)?.[0];
          if (approvalKey !== undefined && !resolvedApprovals.has(approvalKey)) fail("item completed before its approval was resolved");
          if (approvalKey !== undefined) {
            const decision = approvals.get(approvalKey).decision;
            const permittedStatuses = decision === "accept" ? new Set(["completed", "failed"]) : new Set(["declined"]);
            if (!permittedStatuses.has(params.item.status)) fail("authority item status is incompatible with its approval decision");
          }
          items.set(params.item.id, { ...current, completedWireSequence: receiveWireSequence, item: canonical(params.item), state: "completed" });
          completionOrder.push(params.item.id);
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
        approvals.get(key).resolved_wire_sequence = receiveWireSequence;
        resolvedApprovals.add(key);
        return;
      }
      if (message.method === "turn/completed") {
        if (!threadId || !turnId || params.threadId !== threadId || params.turn?.id !== turnId || !["completed", "interrupted", "failed"].includes(params.turn?.status)) {
          fail("turn/completed identity or status is malformed");
        }
        if (terminalTurn) fail("app-server emitted more than one terminal turn");
        if (params.turn.status === "completed" && params.turn.error != null) fail("completed turn contains an error");
        if (params.turn.status === "failed" && params.turn.error == null) fail("failed turn omitted its error");
        if (approvals.size !== resolvedApprovals.size) fail("turn completed with unresolved approval requests");
        if ([...items.values()].some((item) => item.state !== "completed")) fail("turn completed with an incomplete item lifecycle");
        if (params.turn.status === "completed" && finalMessages.length !== 1) fail("completed turn lacks one terminal agent message");
        if (params.turn.status !== "completed" && finalMessages.length !== 0) fail("non-completed turn emitted a terminal answer");
        if (params.turn.status === "completed" && items.get(completionOrder.at(-1))?.item?.phase !== "final_answer") fail("terminal answer is not the last completed item");
        terminalTurn = params.turn;
        send({ method: "thread/read", id: 3, params: { includeTurns: true, threadId } });
        return;
      }
      if (message.method === "error" && (!params.threadId || params.threadId === threadId)) fail("app-server emitted an error notification");
    };

    let chain = Promise.resolve();
    const enqueueLine = (line) => {
      const receiveWireSequence = ++wireSequence;
      pendingLines += 1;
      chain = chain.then(() => handle(line, receiveWireSequence)).then(
        () => { pendingLines -= 1; },
        (error) => { pendingLines -= 1; finish(reject, error); },
      );
    };
    child.stdout.on("data", (chunk) => {
      if (settled) return;
      stdoutBytes += chunk.length;
      if (stdoutBytes > 16 * 1024 * 1024) {
        finish(reject, new Error("app-server response exceeded 16 MiB"));
        return;
      }
      framingRemainder = Buffer.concat([framingRemainder, chunk]);
      let newlineIndex = framingRemainder.indexOf(0x0a);
      while (newlineIndex !== -1) {
        let framed = framingRemainder.subarray(0, newlineIndex);
        framingRemainder = framingRemainder.subarray(newlineIndex + 1);
        if (framed.at(-1) === 0x0d) framed = framed.subarray(0, -1);
        try {
          enqueueLine(frameDecoder.decode(framed));
        } catch {
          finish(reject, new Error("app-server response is not valid UTF-8"));
          return;
        }
        newlineIndex = framingRemainder.indexOf(0x0a);
      }
    });
    child.once("error", () => finish(reject, new Error("app-server process failed")));
    child.once("exit", (code, signal) => {
      if (!settled && !successShutdownStarted) finish(reject, new Error(`app-server exited before terminal receipt: code=${code} signal=${signal}`));
    });
  });

  if (!settled) {
    send({
      method: "initialize",
      id: 0,
      params: { clientInfo: { name: "qoeop_pareto_native_task_controller", title: "Pareto Native Task Controller", version: "1.0.0" } },
    });
  }

  try {
    await terminal;
  } finally {
    child.stdin.end();
    try {
      await stopChild(child);
    } finally {
      await materialized.cleanup();
    }
  }

  const finalText = finalMessages[0] ?? null;
  const authorityItems = completionOrder.map((id) => items.get(id)).filter((item) => item.subject !== null).map((item) => canonical({
    completed_wire_sequence: item.completedWireSequence,
    event_item_id: item.item.id,
    started_wire_sequence: item.startedWireSequence,
    status: item.item.status,
    subject_sha256: digest(JSON.stringify(item.subject)),
    type: item.type,
  }));
  const payload = canonical({
    approvals: [...approvals.values()].map(canonical),
    authority_items: authorityItems,
    readback_authority_items: readbackAuthorityItemsReceipt,
    requested_configuration: { approval_policy: approvalPolicy, cwd: taskCwd, model, sandbox },
    server_configuration: serverConfiguration,
    executable,
    final: finalText === null ? null : {
      bytes: Buffer.byteLength(finalText),
      completed_wire_sequence: items.get(terminalAnswerItemId)?.completedWireSequence,
      event_item_id: terminalAnswerItemId,
      readback_item_id: readbackFinalItemId,
      sha256: digest(finalText),
      started_wire_sequence: items.get(terminalAnswerItemId)?.startedWireSequence,
      text: finalText,
    },
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

export async function launchDetachedWorker(workerArguments, spawnProcess = spawn) {
  let worker;
  try {
    worker = spawnProcess(process.execPath, workerArguments, { detached: true, stdio: "ignore" });
  } catch (error) {
    return { error };
  }
  const outcome = await new Promise((resolve) => {
    let settled = false;
    const finish = (value) => {
      if (settled) return;
      settled = true;
      resolve(value);
    };
    worker.once("error", (error) => finish({ error }));
    worker.once("spawn", () => finish({ worker }));
  });
  if (outcome.worker) outcome.worker.unref();
  return outcome;
}

function parsePairs(argv, required, allowed) {
  const options = {};
  for (let index = 0; index < argv.length; index += 2) {
    const name = argv[index];
    const value = argv[index + 1];
    if (!name?.startsWith("--") || value === undefined) fail("command arguments must be exact name/value pairs");
    const key = name.slice(2);
    if (options[key] !== undefined) fail(`duplicate argument: ${name}`);
    options[key] = value;
  }
  for (const name of required) if (options[name] === undefined) fail(`missing argument: --${name}`);
  for (const name of Object.keys(options)) if (!allowed.has(name)) fail(`unknown argument: --${name}`);
  return options;
}

function parseArguments(argv) {
  const command = argv[0];
  const common = ["codex-executable", "expected-sha256", "expected-version", "cwd", "prompt-file", "sandbox"];
  if (command === "run") return { command, options: parsePairs(argv.slice(1), [...common, "approval-policy"], new Set([...common, "approval-policy", "model", "timeout-ms"])) };
  if (command === "dispatch") return { command, options: parsePairs(argv.slice(1), [...common, "receipt-dir"], new Set([...common, "receipt-dir", "model", "timeout-ms", "start-timeout-ms"])) };
  if (command === "inspect") return { command, options: parsePairs(argv.slice(1), ["receipt-dir"], new Set(["receipt-dir"])) };
  if (command === "worker") return { command, options: parsePairs(argv.slice(1), [...common, "receipt-dir", "attempt-id"], new Set([...common, "receipt-dir", "attempt-id", "model", "timeout-ms"])) };
  fail("usage: native-task-controller.mjs <run|dispatch|inspect|worker> ...");
}

async function atomicJson(pathname, value) {
  const temporary = `${pathname}.tmp-${process.pid}-${randomUUID()}`;
  await writeFile(temporary, `${JSON.stringify(value)}\n`, { flag: "wx", mode: 0o600 });
  try {
    await link(temporary, pathname);
    await rm(temporary);
  } catch (error) {
    await rm(temporary, { force: true });
    throw error;
  }
}

async function readJson(pathname) {
  const stat = await lstat(pathname).catch(() => null);
  if (!stat) return null;
  if (!stat.isFile() || stat.isSymbolicLink() || stat.size < 2 || stat.size > 4 * 1024 * 1024) fail(`receipt is unsafe: ${pathname}`);
  const source = await readFile(pathname, "utf8");
  rejectDuplicateJsonObjectMembers(source, "native task receipt");
  return JSON.parse(source);
}

async function receiptDirectory(pathname) {
  if (!path.isAbsolute(pathname)) fail("receipt directory must be one absolute path");
  const resolvedParent = await realpath(path.dirname(pathname)).catch(() => "");
  if (!resolvedParent) fail("receipt directory parent is missing");
  return path.join(resolvedParent, path.basename(pathname));
}

function sealed(payload, schema) {
  return { content_sha256: digest(JSON.stringify(canonical(payload))), payload: canonical(payload), schema };
}

function verifyEnvelope(value, schema, label) {
  if (!value || value.schema !== schema || !value.payload || value.content_sha256 !== digest(JSON.stringify(canonical(value.payload)))) {
    fail(`${label} receipt is malformed or has invalid content identity`);
  }
  return value;
}

export async function readLifecycleReceiptValues(root, readReceipt = readJson) {
  const failureValue = await readReceipt(path.join(root, "failure.json"));
  const terminalValue = await readReceipt(path.join(root, "terminal.json"));
  const startValue = await readReceipt(path.join(root, "start.json"));
  return { failureValue, startValue, terminalValue };
}

async function inspectReceipt(receiptDir) {
  const root = await receiptDirectory(receiptDir);
  const rootStat = await lstat(root).catch(() => null);
  if (!rootStat?.isDirectory() || rootStat.isSymbolicLink()) fail("native task receipt directory is missing or unsafe");
  const attempt = await readJson(path.join(root, "attempt.json"));
  if (!attempt || attempt.schema !== "rbm-native-task-attempt/v1" || !uuidPattern.test(attempt.attempt_id ?? "")
    || attempt.content_sha256 !== digest(JSON.stringify(canonical({ attempt_id: attempt.attempt_id, request: attempt.request, schema: attempt.schema })))) {
    fail("native task attempt receipt is missing, malformed, or has invalid content identity");
  }
  await assertDetachedReceiptIsolation(root, attempt.request.cwd, attempt.request.sandbox);
  const { failureValue, startValue, terminalValue } = await readLifecycleReceiptValues(root);
  const start = startValue ? verifyEnvelope(startValue, "rbm-native-task-start-envelope/v1", "start") : null;
  const failure = failureValue ? verifyEnvelope(failureValue, "rbm-native-task-failure-envelope/v1", "failure") : null;
  const terminal = terminalValue ? verifyEnvelope(terminalValue, "rbm-native-task-detached-terminal-envelope/v1", "terminal") : null;
  const expectedRequestedConfiguration = canonical({
    approval_policy: "never", cwd: attempt.request.cwd, model: attempt.request.model, sandbox: attempt.request.sandbox,
  });
  if (start) {
    const startPayload = start.payload.start;
    if (start.payload.attempt_id !== attempt.attempt_id || startPayload?.schema !== "rbm-native-task-start/v1"
      || startPayload.prompt_sha256 !== attempt.request.prompt_sha256
      || !sameCanonical(startPayload.requested_configuration, expectedRequestedConfiguration)
      || startPayload.executable?.sha256 !== attempt.request.expected_sha256
      || startPayload.executable?.version !== attempt.request.expected_version
      || !uuidPattern.test(startPayload.thread?.id ?? "")
      || !uuidPattern.test(startPayload.turn?.id ?? "")
      || startPayload.turn.status !== "inProgress"
      || startPayload.server_configuration?.approval_policy !== "never"
      || startPayload.server_configuration?.cwd !== attempt.request.cwd
      || (attempt.request.model !== null && startPayload.server_configuration?.model !== attempt.request.model)
      || startPayload.server_configuration?.sandbox?.type !== sandboxPolicyTypes.get(attempt.request.sandbox)) {
      fail("start receipt differs from its exact attempt");
    }
    await assertDetachedReceiptIsolation(root, attempt.request.cwd, attempt.request.sandbox, startPayload.server_configuration.sandbox);
  }
  if (failure && (failure.payload.attempt_id !== attempt.attempt_id
    || failure.payload.start_content_sha256 !== (start?.content_sha256 ?? null))) {
    fail("failure receipt differs from its exact attempt or start receipt");
  }
  if (terminal) {
    if (failure) fail("terminal and failure receipts conflict");
    if (!start || terminal.payload.attempt_id !== attempt.attempt_id) fail("terminal receipt lacks its exact start attempt");
    const inner = verifyEnvelope(terminal.payload.terminal, "rbm-native-task-terminal-envelope/v1", "nested terminal");
    const startPayload = start.payload.start;
    const terminalPayload = inner.payload;
    if (startPayload.prompt_sha256 !== attempt.request.prompt_sha256
      || !sameCanonical(startPayload.requested_configuration, expectedRequestedConfiguration)
      || startPayload.executable?.sha256 !== attempt.request.expected_sha256
      || startPayload.executable?.version !== attempt.request.expected_version
      || terminalPayload.prompt_sha256 !== attempt.request.prompt_sha256
      || !sameCanonical(terminalPayload.requested_configuration, expectedRequestedConfiguration)
      || !sameCanonical(terminalPayload.executable, startPayload.executable)
      || !sameCanonical(terminalPayload.server_configuration, startPayload.server_configuration)
      || terminalPayload.thread?.id !== startPayload.thread?.id
      || terminalPayload.turn?.id !== startPayload.turn?.id
      || !["completed", "failed", "interrupted"].includes(terminalPayload.turn?.status)) {
      fail("terminal receipt differs from its exact attempt or start receipt");
    }
    return sealed({ attempt, start, state: "terminal", terminal }, "rbm-native-task-inspection-envelope/v1");
  }
  if (failure) return sealed({ attempt, failure, start, state: "needs_attention" }, "rbm-native-task-inspection-envelope/v1");
  return sealed({ attempt, start, state: start ? "running" : "starting" }, "rbm-native-task-inspection-envelope/v1");
}

async function readPrompt(promptFile) {
  if (!path.isAbsolute(promptFile)) fail("prompt file must be one absolute path");
  const info = await lstat(promptFile).catch(() => null);
  if (!info?.isFile() || info.isSymbolicLink() || info.size < 1 || info.size > 1024 * 1024) fail("prompt file is missing, unsafe, empty, or exceeds 1 MiB");
  return readFile(promptFile, "utf8");
}

async function main() {
  const { command, options } = parseArguments(process.argv.slice(2));
  if (command === "inspect") {
    process.stdout.write(`${JSON.stringify(await inspectReceipt(options["receipt-dir"]))}\n`);
    return;
  }
  if (command === "dispatch") {
    const root = await receiptDirectory(options["receipt-dir"]);
    const prompt = await readPrompt(options["prompt-file"]);
    const taskCwd = await directoryIdentity(options.cwd);
    await assertDetachedReceiptIsolation(root, taskCwd, options.sandbox);
    const taskTimeoutMs = options["timeout-ms"] === undefined ? 7_200_000 : Number(options["timeout-ms"]);
    if (!Number.isSafeInteger(taskTimeoutMs) || taskTimeoutMs < 1_000 || taskTimeoutMs > 86_400_000) fail("timeout must be between 1000 and 86400000 ms");
    const startTimeoutMs = options["start-timeout-ms"] === undefined ? 15_000 : Number(options["start-timeout-ms"]);
    if (!Number.isSafeInteger(startTimeoutMs) || startTimeoutMs < 0 || startTimeoutMs > 60_000) fail("start timeout must be between 0 and 60000 ms");
    const request = canonical({
      codex_executable: options["codex-executable"],
      cwd: taskCwd,
      expected_sha256: options["expected-sha256"],
      expected_version: options["expected-version"],
      model: options.model ?? null,
      prompt_sha256: digest(prompt),
      sandbox: options.sandbox,
      timeout_ms: taskTimeoutMs,
    });
    let created = false;
    try {
      await mkdir(root, { mode: 0o700 });
      created = true;
    } catch (error) {
      if (error.code !== "EEXIST") throw error;
    }
    if (!created) {
      const existing = await readJson(path.join(root, "attempt.json"));
      if (!existing || !sameCanonical(existing.request, request)) fail("receipt directory belongs to a different or incomplete attempt");
      process.stdout.write(`${JSON.stringify(await inspectReceipt(root))}\n`);
      return;
    }
    const attemptId = randomUUID();
    const attemptPayload = canonical({ attempt_id: attemptId, request, schema: "rbm-native-task-attempt/v1" });
    await atomicJson(path.join(root, "attempt.json"), { ...attemptPayload, content_sha256: digest(JSON.stringify(attemptPayload)) });
    const materializedPrompt = path.join(root, "prompt.txt");
    await writeFile(materializedPrompt, prompt, { flag: "wx", mode: 0o600 });
    const workerArguments = [path.resolve(process.argv[1]), "worker"];
    for (const [name, value] of [
      ["codex-executable", options["codex-executable"]], ["expected-sha256", options["expected-sha256"]],
      ["expected-version", options["expected-version"]], ["cwd", taskCwd], ["prompt-file", materializedPrompt],
      ["sandbox", options.sandbox], ["receipt-dir", root], ["attempt-id", attemptId], ["model", options.model],
      ["timeout-ms", options["timeout-ms"]],
    ]) if (value !== undefined) workerArguments.push(`--${name}`, value);
    const launch = await launchDetachedWorker(workerArguments);
    if (launch.error) {
      await atomicJson(path.join(root, "failure.json"), sealed({
        attempt_id: attemptId, error: launch.error.message, start_content_sha256: null,
      }, "rbm-native-task-failure-envelope/v1"));
      process.stdout.write(`${JSON.stringify(await inspectReceipt(root))}\n`);
      return;
    }
    await atomicJson(path.join(root, "launch.json"), canonical({ attempt_id: attemptId, pid: launch.worker.pid, schema: "rbm-native-task-launch/v1" }));
    const deadline = Date.now() + startTimeoutMs;
    let inspection;
    do {
      inspection = await inspectReceipt(root);
      if (inspection.payload.state !== "starting") break;
      await new Promise((resolve) => setTimeout(resolve, 25));
    } while (Date.now() < deadline);
    process.stdout.write(`${JSON.stringify(inspection)}\n`);
    return;
  }

  const abortController = new AbortController();
  const handledSignals = process.platform === "win32" ? ["SIGINT", "SIGTERM"] : ["SIGHUP", "SIGINT", "SIGTERM"];
  const abortForSignal = () => abortController.abort();
  for (const name of handledSignals) process.on(name, abortForSignal);
  const approvalInput = command === "run"
    ? readline.createInterface({ input: process.stdin, crlfDelay: Infinity, terminal: process.stdin.isTTY })
    : null;
  let decisionWaiter = null;
  let unexpectedApprovalInput = null;
  let approvalInputClosed = false;
  approvalInput?.on("line", (line) => {
    const decision = line.trim();
    if (decisionWaiter) {
      const waiter = decisionWaiter;
      decisionWaiter = null;
      waiter.resolve(decision);
    } else {
      unexpectedApprovalInput = new Error("approval decision arrived before a displayed request");
    }
  });
  approvalInput?.on("close", () => {
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
    const root = command === "worker" ? await receiptDirectory(options["receipt-dir"]) : null;
    const prompt = await readPrompt(options["prompt-file"]);
    const initialInspection = root ? await inspectReceipt(root) : null;
    const attempt = initialInspection?.payload.attempt ?? null;
    if (root && (initialInspection.payload.state !== "starting" || attempt?.attempt_id !== options["attempt-id"])) fail("worker attempt identity or lifecycle mismatch");
    if (root) {
      const workerRequest = canonical({
        codex_executable: options["codex-executable"], cwd: options.cwd,
        expected_sha256: options["expected-sha256"], expected_version: options["expected-version"],
        model: options.model ?? null, prompt_sha256: digest(prompt), sandbox: options.sandbox,
        timeout_ms: options["timeout-ms"] === undefined ? 7_200_000 : Number(options["timeout-ms"]),
      });
      if (!sameCanonical(workerRequest, attempt.request)) fail("worker request differs from its exact attempt");
    }
    const receipt = await executeNativeTask({
      approvalHandler: command === "run" ? approvalHandler : null,
      approvalPolicy: command === "run" ? options["approval-policy"] : "never",
      codexExecutable: options["codex-executable"],
      cwd: options.cwd,
      expectedExecutableSha256: options["expected-sha256"],
      expectedServerVersion: options["expected-version"],
      model: options.model ?? null,
      prompt,
      sandbox: options.sandbox,
      signal: abortController.signal,
      timeoutMs: options["timeout-ms"] === undefined ? undefined : Number(options["timeout-ms"]),
      onConfigured: root ? async (configuration) => assertDetachedReceiptIsolation(root, options.cwd, options.sandbox, configuration.sandbox) : null,
      onStarted: root ? async (payload) => atomicJson(path.join(root, "start.json"), sealed({ attempt_id: options["attempt-id"], start: payload }, "rbm-native-task-start-envelope/v1")) : null,
    }, command === "run" ? "interactive_stdin_after_request" : "client_handler");
    if (unexpectedApprovalInput) throw unexpectedApprovalInput;
    if (root) await atomicJson(path.join(root, "terminal.json"), sealed({ attempt_id: options["attempt-id"], terminal: receipt }, "rbm-native-task-detached-terminal-envelope/v1"));
    else {
      process.stdout.write(`${JSON.stringify(receipt)}\n`);
      if (receipt.payload.turn.status !== "completed") process.exitCode = 1;
    }
  } catch (error) {
    if (command === "worker") {
      const root = await receiptDirectory(options["receipt-dir"]);
      const start = await readJson(path.join(root, "start.json")).catch(() => null);
      await atomicJson(path.join(root, "failure.json"), sealed({
        attempt_id: options["attempt-id"], error: error.message, start_content_sha256: start?.content_sha256 ?? null,
      }, "rbm-native-task-failure-envelope/v1")).catch(() => {});
      return;
    }
    throw error;
  } finally {
    for (const name of handledSignals) process.removeListener(name, abortForSignal);
    approvalInput?.close();
  }
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? "").href) {
  main().catch((error) => {
    process.stderr.write(`native-task-controller: failed: ${error.message}\n`);
    process.exitCode = 1;
  });
}
