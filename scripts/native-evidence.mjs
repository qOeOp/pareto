import { spawn } from "node:child_process";
import { createHash } from "node:crypto";
import readline from "node:readline";
import { pathToFileURL } from "node:url";
import { rejectDuplicateJsonObjectMembers } from "./json.mjs";

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

function responseResult(messages, id, label) {
  const matches = messages.filter((entry) => entry.id === id);
  if (matches.length !== 1) fail(`app-server returned ${matches.length} ${label} responses`);
  if (matches[0].error) fail(`${label} failed: ${matches[0].error.message ?? "unknown app-server error"}`);
  if (!matches[0].result || typeof matches[0].result !== "object") fail(`${label} response is malformed`);
  return matches[0].result;
}

export async function collectNativeEvidence({
  threadId,
  expectedGoalStatus,
  expectedObjectiveSha256 = null,
  timeoutMs = 10_000,
  spawnAppServer = () => spawn("codex", ["app-server"], { stdio: ["pipe", "pipe", "pipe"] }),
}) {
  if (!threadPattern.test(threadId)) fail("thread id must be one exact UUID");
  if (!statuses.has(expectedGoalStatus)) fail("expected goal status is unsupported");
  if (expectedGoalStatus === "absent" && expectedObjectiveSha256 !== null) fail("an absent goal cannot have an objective digest");
  if (expectedGoalStatus !== "absent" && !shaPattern.test(expectedObjectiveSha256 ?? "")) fail("a present goal requires an objective sha256");
  if (!Number.isSafeInteger(timeoutMs) || timeoutMs < 1 || timeoutMs > 60_000) fail("timeout must be between 1 and 60000 ms");

  const child = spawnAppServer();
  if (!child?.stdin || !child?.stdout || !child?.stderr) fail("app-server process transport is unavailable");
  const lines = readline.createInterface({ input: child.stdout, crlfDelay: Infinity });
  const messages = [];
  let stderr = "";
  let stdoutBytes = 0;
  child.stderr.setEncoding("utf8");
  child.stderr.on("data", (chunk) => {
    stderr += chunk;
    if (stderr.length > 16_384) stderr = stderr.slice(-16_384);
  });

  const send = (message) => child.stdin.write(`${JSON.stringify(message)}\n`);
  const completed = new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error("app-server probe timed out")), timeoutMs);
    const finish = (callback, value) => {
      clearTimeout(timer);
      callback(value);
    };
    child.once("error", (error) => finish(reject, new Error(`app-server process failed: ${error.message}`)));
    child.once("exit", (code, signal) => {
      if (!messages.some((entry) => entry.id === 2)) finish(reject, new Error(`app-server exited before a complete probe: code=${code} signal=${signal} stderr=${stderr.trim()}`));
    });
    lines.on("line", (line) => {
      try {
        stdoutBytes += Buffer.byteLength(line) + 1;
        if (stdoutBytes > 4 * 1024 * 1024) fail("app-server response exceeded 4 MiB");
        rejectDuplicateJsonObjectMembers(line, "app-server response");
        const message = JSON.parse(line);
        messages.push(message);
        if (message.id === 0) {
          if (message.error) fail(`initialize failed: ${message.error.message ?? "unknown app-server error"}`);
          send({ method: "initialized", params: {} });
          send({ method: "thread/read", id: 1, params: { threadId, includeTurns: false } });
          send({ method: "thread/goal/get", id: 2, params: { threadId } });
        }
        if (messages.some((entry) => entry.id === 1) && messages.some((entry) => entry.id === 2)) finish(resolve);
      } catch (error) {
        finish(reject, error);
      }
    });
  });

  send({
    method: "initialize",
    id: 0,
    params: { clientInfo: { name: "rbm_native_evidence", title: "RBM Native Evidence", version: "1.0.0" } },
  });

  try {
    await completed;
  } finally {
    lines.close();
    child.stdin.end();
    child.kill();
  }

  const initialized = responseResult(messages, 0, "initialize");
  const read = responseResult(messages, 1, "thread/read");
  const goalRead = responseResult(messages, 2, "thread/goal/get");
  const thread = read.thread;
  if (!thread || thread.id !== threadId || thread.sessionId !== threadId) fail("thread/read did not return the exact thread identity");
  for (const [name, value] of [["userAgent", initialized.userAgent], ["platformFamily", initialized.platformFamily], ["platformOs", initialized.platformOs], ["cliVersion", thread.cliVersion], ["source", thread.source], ["cwd", thread.cwd], ["status", thread.status?.type]]) {
    if (typeof value !== "string" || value.length === 0) fail(`app-server omitted ${name}`);
  }

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
    schema: "rbm-native-evidence/v1",
    transport: "codex-app-server-stdio/v2",
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
      source: thread.source,
      status: thread.status.type,
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
    result: "pass",
  });
  return canonical({
    content_sha256: digest(JSON.stringify(payload)),
    payload,
    schema: "rbm-native-evidence-envelope/v1",
  });
}

function parseArgs(argv) {
  const options = {};
  for (let index = 0; index < argv.length; index += 2) {
    const flag = argv[index];
    const value = argv[index + 1];
    if (!value || !["--thread-id", "--goal-status", "--objective-sha256"].includes(flag)) fail(`unsupported or incomplete argument: ${flag ?? "<missing>"}`);
    if (flag in options) fail(`duplicate argument: ${flag}`);
    options[flag] = value;
  }
  if (!options["--thread-id"] || !options["--goal-status"]) fail("--thread-id and --goal-status are required");
  return {
    threadId: options["--thread-id"],
    expectedGoalStatus: options["--goal-status"],
    expectedObjectiveSha256: options["--objective-sha256"] ?? null,
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
