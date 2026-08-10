import { spawn } from "node:child_process";
import { createHash } from "node:crypto";
import { once } from "node:events";
import { createReadStream } from "node:fs";
import { lstat, realpath } from "node:fs/promises";
import path from "node:path";
import readline from "node:readline";
import { setTimeout as delay } from "node:timers/promises";
import { pathToFileURL } from "node:url";
import { rejectDuplicateJsonObjectMembers } from "./json.mjs";
import { verifyCommittedNativeTurn } from "./capability-score.mjs";

const statuses = new Set(["active", "paused", "blocked", "usageLimited", "budgetLimited", "complete", "absent"]);
const shaPattern = /^sha256:[a-f0-9]{64}$/;
const threadPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;

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

const rawItemTypeByNativeType = new Map([
  ["commandExecution", "command_execution"],
  ["fileChange", "file_change"],
  ["mcpToolCall", "mcp_tool_call"],
  ["dynamicToolCall", "mcp_tool_call"],
  ["agentMessage", "agent_message"],
  ["reasoning", "reasoning"],
  ["webSearch", "web_search"],
  ["plan", "todo_list"],
  ["error", "error"],
]);
const passiveNativeItemTypes = new Set([
  "userMessage", "hookPrompt", "agentMessage", "plan", "reasoning", "webSearch", "imageView", "sleep",
]);

function strictSkillReadCommand(item) {
  if (!Array.isArray(item.commandActions) || item.commandActions.length !== 1) return false;
  const action = item.commandActions[0];
  if (!action || Object.keys(action).sort().join(",") !== "command,name,path,type" || action.type !== "read" ||
      action.command !== item.command || typeof action.name !== "string" || action.name.length === 0 ||
      typeof action.path !== "string") return false;
  if (!/^(?:\/[A-Za-z0-9_./:@+-]+|[A-Za-z]:[\\/][A-Za-z0-9_./:\\@+-]+)$/.test(action.path)) return false;
  const normalizedPath = action.path.replace(/\\/g, "/");
  if (!/(?:^|\/)\.agents\/skills\/run-bounded-mission\/SKILL\.md$/.test(normalizedPath)) return false;
  const escaped = action.path.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  if (action.name === "cat") return new RegExp(`^(?:cat|/bin/cat|/usr/bin/cat) -- ${escaped}$`).test(item.command);
  if (action.name === "sed") return new RegExp(`^sed -n '?1,[1-9][0-9]{0,2}p'? ${escaped}$`).test(item.command);
  return false;
}

function nativeItemObservation(item) {
  if (item.type === "fileChange" || item.type === "collabAgentToolCall" || item.type === "subAgentActivity" ||
      item.type === "imageGeneration" || item.type === "enteredReviewMode" || item.type === "exitedReviewMode" ||
      item.type === "contextCompaction" || item.type === "error") {
    fail(`native capability task contains a disallowed ${item.type} item`);
  }
  if (!passiveNativeItemTypes.has(item.type) && item.type !== "commandExecution") {
    fail(`native capability task contains an unknown ${item.type} item`);
  }
  let terminalState = null;
  let skillRead = false;
  if (item.type === "commandExecution") {
    if (item.status !== "completed" || item.exitCode !== 0 || typeof item.command !== "string" ||
        !strictSkillReadCommand(item)) {
      fail("native capability task contains a non-admitted commandExecution item");
    }
    terminalState = item.status;
    skillRead = true;
  }
  return { rawType: rawItemTypeByNativeType.get(item.type) ?? null, skillRead, terminalState };
}

function observedNativeTurn(items) {
  if (items.filter((item) => item.type === "commandExecution").length > 1) {
    fail("native capability task contains more than one commandExecution item");
  }
  const itemObservations = items.map(nativeItemObservation);
  const rawItemTypes = [...new Set(itemObservations.map((entry) => entry.rawType).filter(Boolean))];
  return {
    itemObservations,
    rawItemTypes,
    skillActivation: itemObservations.some((entry) => entry.skillRead) ? "used" : "not_used",
  };
}

function responseResult(messages, id, label) {
  const matches = messages.filter((entry) => entry.id === id);
  if (matches.length !== 1) fail(`app-server returned ${matches.length} ${label} responses`);
  if (matches[0].error) {
    const code = Number.isSafeInteger(matches[0].error.code) ? `: code=${matches[0].error.code}` : "";
    fail(`${label} failed${code}`);
  }
  if (!matches[0].result || typeof matches[0].result !== "object") fail(`${label} response is malformed`);
  return matches[0].result;
}

async function executableIdentity(executable) {
  if (!path.isAbsolute(executable)) fail("codex executable must be one absolute path");
  const resolved = await realpath(executable).catch(() => "");
  const info = resolved ? await lstat(resolved).catch(() => null) : null;
  if (!info?.isFile() || info.isSymbolicLink() || (process.platform !== "win32" && (info.mode & 0o111) === 0)) fail("codex executable is missing or unsafe");
  const hash = createHash("sha256");
  for await (const chunk of createReadStream(resolved)) hash.update(chunk);
  return { path: resolved, sha256: `sha256:${hash.digest("hex")}` };
}

function sourceIdentity(source) {
  const allowedStrings = new Set(["cli", "vscode", "exec", "appServer", "unknown"]);
  if (typeof source === "string") {
    if (!allowedStrings.has(source)) fail("app-server returned an unsupported source");
    return { kind: source, sha256: digest(JSON.stringify(source)) };
  }
  if (!source || Array.isArray(source) || typeof source !== "object" || Object.keys(source).length !== 1) fail("app-server returned a malformed source");
  if (typeof source.custom === "string" && source.custom.length > 0) return { kind: "custom", sha256: digest(JSON.stringify(canonical(source))) };
  if (source.subAgent !== undefined && (typeof source.subAgent === "string" || (source.subAgent && typeof source.subAgent === "object"))) {
    return { kind: "subAgent", sha256: digest(JSON.stringify(canonical(source))) };
  }
  fail("app-server returned an unsupported source");
}

async function stopChild(child) {
  if (child.exitCode !== null || child.signalCode !== null) return;
  child.kill("SIGTERM");
  await Promise.race([once(child, "exit"), delay(250)]);
  if (child.exitCode !== null || child.signalCode !== null) return;
  child.kill("SIGKILL");
  const stopped = await Promise.race([once(child, "exit").then(() => true), delay(2_000).then(() => false)]);
  if (!stopped) fail("app-server process could not be stopped");
}

export async function collectNativeEvidence({
  threadId,
  turnId,
  expectedGoalStatus,
  expectedObjectiveSha256 = null,
  codexExecutable,
  expectedServerVersion,
  appServerCwd,
  repositoryRoot = process.cwd(),
  timeoutMs = 10_000,
}) {
  if (!threadPattern.test(threadId)) fail("thread id must be one exact UUID");
  if (!threadPattern.test(turnId)) fail("turn id must be one exact UUID");
  if (!statuses.has(expectedGoalStatus)) fail("expected goal status is unsupported");
  if (expectedGoalStatus === "absent" && expectedObjectiveSha256 !== null) fail("an absent goal cannot have an objective digest");
  if (expectedGoalStatus !== "absent" && !shaPattern.test(expectedObjectiveSha256 ?? "")) fail("a present goal requires an objective sha256");
  if (!Number.isSafeInteger(timeoutMs) || timeoutMs < 1 || timeoutMs > 60_000) fail("timeout must be between 1 and 60000 ms");
  if (!/^\d+\.\d+\.\d+(?:[-+][0-9A-Za-z.-]+)?$/.test(expectedServerVersion ?? "")) fail("expected server version is invalid");

  const executable = await executableIdentity(codexExecutable ?? "");
  const child = spawn(executable.path, ["app-server"], { cwd: appServerCwd, stdio: ["pipe", "pipe", "pipe"] });
  if (!child?.stdin || !child?.stdout || !child?.stderr) fail("app-server process transport is unavailable");
  const lines = readline.createInterface({ input: child.stdout, crlfDelay: Infinity });
  const messages = [];
  const turns = [];
  const cursors = new Set();
  let nextTurnRequestId = 3;
  let turnsDone = false;
  let stdoutBytes = 0;
  child.stderr.resume();

  const send = (message) => child.stdin.write(`${JSON.stringify(message)}\n`);
  const completed = new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error("app-server probe timed out")), timeoutMs);
    const finish = (callback, value) => {
      clearTimeout(timer);
      callback(value);
    };
    child.once("error", () => finish(reject, new Error("app-server process failed")));
    child.once("exit", (code, signal) => {
      if (!messages.some((entry) => entry.id === 2)) finish(reject, new Error(`app-server exited before a complete probe: code=${code} signal=${signal}`));
    });
    lines.on("line", (line) => {
      try {
        stdoutBytes += Buffer.byteLength(line) + 1;
        if (stdoutBytes > 4 * 1024 * 1024) fail("app-server response exceeded 4 MiB");
        rejectDuplicateJsonObjectMembers(line, "app-server response");
        const message = JSON.parse(line);
        messages.push(message);
        if (message.id === 0) {
          if (message.error) fail("initialize failed");
          send({ method: "initialized", params: {} });
          send({ method: "thread/read", id: 1, params: { threadId, includeTurns: false } });
          send({ method: "thread/goal/get", id: 2, params: { threadId } });
          send({ method: "thread/turns/list", id: nextTurnRequestId, params: { threadId, limit: 100, sortDirection: "asc", itemsView: "full" } });
        }
        if (Number.isSafeInteger(message.id) && message.id >= 3) {
          if (message.id !== nextTurnRequestId) fail("app-server returned an unrequested turn page");
          const page = responseResult(messages, message.id, "thread/turns/list");
          if (!Array.isArray(page.data) || !(page.nextCursor === null || typeof page.nextCursor === "string")) fail("thread/turns/list response is malformed");
          turns.push(...page.data);
          if (page.nextCursor === null) turnsDone = true;
          else {
            if (page.nextCursor.length === 0 || cursors.has(page.nextCursor) || nextTurnRequestId >= 102) fail("thread/turns/list pagination is invalid");
            cursors.add(page.nextCursor);
            nextTurnRequestId += 1;
            send({ method: "thread/turns/list", id: nextTurnRequestId, params: { threadId, cursor: page.nextCursor, limit: 100, sortDirection: "asc", itemsView: "full" } });
          }
        }
        if (messages.some((entry) => entry.id === 1) && messages.some((entry) => entry.id === 2) && turnsDone) finish(resolve);
      } catch (error) {
        finish(reject, error);
      }
    });
  });

  send({
    method: "initialize",
    id: 0,
    params: {
      capabilities: { experimentalApi: true },
      clientInfo: { name: "rbm_native_evidence", title: "RBM Native Evidence", version: "1.0.0" },
    },
  });

  try {
    await completed;
  } finally {
    lines.close();
    child.stdin.end();
    await stopChild(child);
  }

  const initialized = responseResult(messages, 0, "initialize");
  const read = responseResult(messages, 1, "thread/read");
  const goalRead = responseResult(messages, 2, "thread/goal/get");
  const thread = read.thread;
  if (!thread || thread.id !== threadId || !threadPattern.test(thread.sessionId)) fail("thread/read did not return the exact thread identity");
  for (const [name, value] of [["userAgent", initialized.userAgent], ["platformFamily", initialized.platformFamily], ["platformOs", initialized.platformOs], ["cliVersion", thread.cliVersion], ["cwd", thread.cwd], ["status", thread.status?.type]]) {
    if (typeof value !== "string" || value.length === 0) fail(`app-server omitted ${name}`);
  }
  const expectedAgentPrefix = `Codex Desktop/${expectedServerVersion} `;
  if (!initialized.userAgent.startsWith(expectedAgentPrefix)) fail("app-server version does not match the frozen executable expectation");
  const source = sourceIdentity(thread.source);
  if (turns.length !== 1) fail("native capability task must contain exactly one turn");
  const selectedTurns = turns.filter((turn) => turn?.id === turnId);
  if (selectedTurns.length !== 1) fail("thread/turns/list did not return exactly one requested turn");
  const turn = selectedTurns[0];
  if (turn.itemsView !== "full" || turn.status !== "completed" || turn.error !== null || !Array.isArray(turn.items) || turn.items.length < 2) fail("requested turn is not one complete full turn");
  const itemIds = new Set();
  for (const item of turn.items) {
    if (!item || typeof item.id !== "string" || item.id.length === 0 || itemIds.has(item.id) || typeof item.type !== "string") fail("requested turn has malformed or duplicate items");
    itemIds.add(item.id);
  }
  const userMessages = turn.items.filter((item) => item.type === "userMessage");
  const finalMessages = turn.items.filter((item) => item.type === "agentMessage" && item.phase === "final_answer");
  if (userMessages.length !== 1) fail("requested turn lacks one exact prompt");
  if (finalMessages.length !== 1 || turn.items.at(-1) !== finalMessages[0]) fail("requested turn lacks one terminal final answer");
  const userContent = userMessages[0].content;
  if (!Array.isArray(userContent) || userContent.length !== 1 || userContent[0]?.type !== "text" || typeof userContent[0].text !== "string") fail("requested turn prompt is not one exact text input");
  const observation = observedNativeTurn(turn.items);
  const { candidate, committedCase, result: capabilityResult } = await verifyCommittedNativeTurn({
    repositoryRoot,
    prompt: userContent[0].text,
    output: finalMessages[0].text,
    observedRawItemTypes: observation.rawItemTypes,
    observedSkillActivation: observation.skillActivation,
  });

  const goal = goalRead.goal ?? null;
  if (goal !== null && (goal.threadId !== threadId || typeof goal.objective !== "string" || !statuses.has(goal.status) || goal.status === "absent")) {
    fail("thread/goal/get returned a malformed goal");
  }
  if (expectedGoalStatus === "absent") {
    if (goal !== null) fail("native goal is present but absence was expected");
  } else {
    if (!goal) fail("native goal is absent");
    if (goal.status !== expectedGoalStatus) fail(`native goal status mismatch: expected ${expectedGoalStatus}, received ${goal.status}`);
    if (digest(goal.objective) !== expectedObjectiveSha256) fail("native goal objective digest mismatch");
  }

  const payload = canonical({
    schema: "rbm-native-evidence/v4",
    authority: "local_interface_observation",
    executable: { sha256: executable.sha256, server_version: expectedServerVersion },
    host: {
      platform_family: initialized.platformFamily,
      platform_os: initialized.platformOs,
      user_agent: initialized.userAgent,
    },
    thread: {
      cli_version: thread.cliVersion,
      cwd_sha256: digest(thread.cwd),
      id: thread.id,
      parent_thread_id: thread.parentThreadId ?? null,
      session_id_sha256: digest(thread.sessionId),
      source,
      status: thread.status.type,
    },
    turn: {
      id: turn.id,
      status: turn.status,
      items: turn.items.map((item, index) => ({
        id_sha256: digest(item.id),
        raw_type: observation.itemObservations[index].rawType,
        skill_read: observation.itemObservations[index].skillRead,
        terminal_state: observation.itemObservations[index].terminalState,
        type: item.type,
      })),
      prompt_sha256: digest(userContent[0].text),
      output_sha256: digest(finalMessages[0].text),
      oracle_result_sha256: digest(JSON.stringify(canonical(capabilityResult))),
    },
    goal: goal ? {
      objective_sha256: digest(goal.objective),
      status: goal.status,
      thread_id: goal.threadId,
    } : null,
    expectation: {
      goal_status: expectedGoalStatus,
      objective_sha256: expectedObjectiveSha256,
    },
    binding: {
      capability_id: capabilityResult.capability_id,
      scenario: capabilityResult.scenario,
      case_id: capabilityResult.case_id,
      candidate: { commit: candidate.commit, tree: candidate.tree },
      result: capabilityResult.result,
      oracle: committedCase.oracle,
      control_sha256: committedCase.control_sha256,
    },
    oracle: {
      assertions_sha256: digest(JSON.stringify(canonical(committedCase.assertions))),
      expected_skill_activation: committedCase.skill_activation.expected,
      observed_skill_activation: observation.skillActivation,
      required_raw_item_types: committedCase.required_raw_item_types,
      observed_raw_item_types: observation.rawItemTypes,
    },
    result: "matched",
  });
  return canonical({
    content_sha256: digest(JSON.stringify(payload)),
    payload,
    schema: "rbm-native-evidence-envelope/v4",
  });
}

function parseArgs(argv) {
  const options = {};
  for (let index = 0; index < argv.length; index += 2) {
    const flag = argv[index];
    const value = argv[index + 1];
    if (!value || !["--thread-id", "--turn-id", "--goal-status", "--objective-sha256", "--codex-executable", "--expected-server-version"].includes(flag)) fail(`unsupported or incomplete argument: ${flag ?? "<missing>"}`);
    if (flag in options) fail(`duplicate argument: ${flag}`);
    options[flag] = value;
  }
  for (const required of ["--thread-id", "--turn-id", "--goal-status", "--codex-executable", "--expected-server-version"]) {
    if (!options[required]) fail(`${required} is required`);
  }
  return {
    threadId: options["--thread-id"],
    turnId: options["--turn-id"],
    expectedGoalStatus: options["--goal-status"],
    expectedObjectiveSha256: options["--objective-sha256"] ?? null,
    codexExecutable: options["--codex-executable"],
    expectedServerVersion: options["--expected-server-version"],
  };
}

if (process.argv[1] && pathToFileURL(process.argv[1]).href === import.meta.url) {
  try {
    const receipt = await collectNativeEvidence(parseArgs(process.argv.slice(2)));
    process.stdout.write(`${JSON.stringify(receipt)}\n`);
  } catch (error) {
    process.stderr.write(`${error.message}\n`);
    process.exitCode = 1;
  }
}
