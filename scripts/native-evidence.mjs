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
  if (matches[0].error) fail(`${label} failed`);
  if (!matches[0].result || typeof matches[0].result !== "object") fail(`${label} response is malformed`);
  return matches[0].result;
}

async function executableIdentity(executable) {
  if (!path.isAbsolute(executable)) fail("codex executable must be one absolute path");
  const resolved = await realpath(executable).catch(() => "");
  const info = resolved ? await lstat(resolved).catch(() => null) : null;
  if (!info?.isFile() || info.isSymbolicLink() || (info.mode & 0o111) === 0) fail("codex executable is missing or unsafe");
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
  expectedGoalStatus,
  expectedObjectiveSha256 = null,
  capabilityId,
  scenario,
  caseId,
  candidateCommit,
  candidateTree,
  codexExecutable,
  expectedServerVersion,
  timeoutMs = 10_000,
}) {
  if (!threadPattern.test(threadId)) fail("thread id must be one exact UUID");
  if (!statuses.has(expectedGoalStatus)) fail("expected goal status is unsupported");
  if (expectedGoalStatus === "absent" && expectedObjectiveSha256 !== null) fail("an absent goal cannot have an objective digest");
  if (expectedGoalStatus !== "absent" && !shaPattern.test(expectedObjectiveSha256 ?? "")) fail("a present goal requires an objective sha256");
  if (!Number.isSafeInteger(timeoutMs) || timeoutMs < 1 || timeoutMs > 60_000) fail("timeout must be between 1 and 60000 ms");
  if (!/^[A-Z]{3,4}-\d{2}$/.test(capabilityId ?? "") || !["positive", "negative", "recovery"].includes(scenario) || typeof caseId !== "string" || caseId.length === 0 || caseId.length > 256) fail("capability binding is invalid");
  if (!/^[a-f0-9]{40}$/.test(candidateCommit ?? "") || !/^[a-f0-9]{40}$/.test(candidateTree ?? "")) fail("candidate binding is invalid");
  if (!/^\d+\.\d+\.\d+(?:[-+][0-9A-Za-z.-]+)?$/.test(expectedServerVersion ?? "")) fail("expected server version is invalid");

  const executable = await executableIdentity(codexExecutable ?? "");
  const child = spawn(executable.path, ["app-server"], { stdio: ["pipe", "pipe", "pipe"] });
  if (!child?.stdin || !child?.stdout || !child?.stderr) fail("app-server process transport is unavailable");
  const lines = readline.createInterface({ input: child.stdout, crlfDelay: Infinity });
  const messages = [];
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
    await stopChild(child);
  }

  const initialized = responseResult(messages, 0, "initialize");
  const read = responseResult(messages, 1, "thread/read");
  const goalRead = responseResult(messages, 2, "thread/goal/get");
  const thread = read.thread;
  if (!thread || thread.id !== threadId || thread.sessionId !== threadId) fail("thread/read did not return the exact thread identity");
  for (const [name, value] of [["userAgent", initialized.userAgent], ["platformFamily", initialized.platformFamily], ["platformOs", initialized.platformOs], ["cliVersion", thread.cliVersion], ["cwd", thread.cwd], ["status", thread.status?.type]]) {
    if (typeof value !== "string" || value.length === 0) fail(`app-server omitted ${name}`);
  }
  const expectedAgentPrefix = `Codex Desktop/${expectedServerVersion} `;
  if (!initialized.userAgent.startsWith(expectedAgentPrefix)) fail("app-server version does not match the frozen executable expectation");
  const source = sourceIdentity(thread.source);

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
    schema: "rbm-native-evidence/v2",
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
      source,
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
    binding: { capability_id: capabilityId, scenario, case_id: caseId, candidate: { commit: candidateCommit, tree: candidateTree }, result: "pass" },
    result: "matched",
  });
  return canonical({
    content_sha256: digest(JSON.stringify(payload)),
    payload,
    schema: "rbm-native-evidence-envelope/v2",
  });
}

function parseArgs(argv) {
  const options = {};
  for (let index = 0; index < argv.length; index += 2) {
    const flag = argv[index];
    const value = argv[index + 1];
    if (!value || !["--thread-id", "--goal-status", "--objective-sha256", "--capability-id", "--scenario", "--case-id", "--candidate-commit", "--candidate-tree", "--codex-executable", "--expected-server-version"].includes(flag)) fail(`unsupported or incomplete argument: ${flag ?? "<missing>"}`);
    if (flag in options) fail(`duplicate argument: ${flag}`);
    options[flag] = value;
  }
  for (const required of ["--thread-id", "--goal-status", "--capability-id", "--scenario", "--case-id", "--candidate-commit", "--candidate-tree", "--codex-executable", "--expected-server-version"]) {
    if (!options[required]) fail(`${required} is required`);
  }
  return {
    threadId: options["--thread-id"],
    expectedGoalStatus: options["--goal-status"],
    expectedObjectiveSha256: options["--objective-sha256"] ?? null,
    capabilityId: options["--capability-id"],
    scenario: options["--scenario"],
    caseId: options["--case-id"],
    candidateCommit: options["--candidate-commit"],
    candidateTree: options["--candidate-tree"],
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
