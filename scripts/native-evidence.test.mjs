import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { createHash } from "node:crypto";
import { collectNativeEvidence } from "./native-evidence.mjs";

const threadId = "019fb8b4-ebd0-7c20-8ba1-041ed6836204";
const objective = "prove the native evidence route";
const objectiveSha256 = `sha256:${createHash("sha256").update(objective).digest("hex")}`;

function fakeServer({ goal = { threadId, objective, status: "active" }, duplicate = false, readError = false, silent = false } = {}) {
  const fixture = { threadId, goal, duplicate, readError, silent };
  const program = `
    const readline = require("node:readline");
    const fixture = ${JSON.stringify(fixture)};
    const rl = readline.createInterface({ input: process.stdin });
    rl.on("line", (line) => {
      const message = JSON.parse(line);
      if (fixture.silent) return;
      if (message.id === 0) {
        if (fixture.duplicate) process.stdout.write("{\\\"id\\\":0,\\\"id\\\":0,\\\"result\\\":{}}\\n");
        else process.stdout.write(JSON.stringify({ id: 0, result: { userAgent: "Codex CLI/0.146.0 (fixture)", codexHome: "/private/home", platformFamily: "unix", platformOs: "fixture" } }) + "\\n");
      }
      if (message.id === 1) {
        const response = fixture.readError
          ? { id: 1, error: { message: "read failed" } }
          : { id: 1, result: { thread: { id: fixture.threadId, sessionId: fixture.threadId, parentThreadId: null, cliVersion: "0.146.0", source: "fixture", cwd: "/private/workspace", status: { type: "notLoaded" } } } };
        process.stdout.write(JSON.stringify(response) + "\\n");
      }
      if (message.id === 2) process.stdout.write(JSON.stringify({ id: 2, result: { goal: fixture.goal } }) + "\\n");
    });
  `;
  return () => spawn(process.execPath, ["-e", program], { stdio: ["pipe", "pipe", "pipe"] });
}

const receipt = await collectNativeEvidence({
  threadId,
  expectedGoalStatus: "active",
  expectedObjectiveSha256: objectiveSha256,
  spawnAppServer: fakeServer(),
});
assert.equal(receipt.payload.result, "pass");
assert.equal(receipt.payload.goal.objective_sha256, objectiveSha256);
assert.equal(receipt.payload.thread.cwd_sha256.startsWith("sha256:"), true);
assert.equal(receipt.content_sha256, `sha256:${createHash("sha256").update(JSON.stringify(receipt.payload)).digest("hex")}`);
assert.equal(JSON.stringify(receipt).includes(objective), false);
assert.equal(JSON.stringify(receipt).includes("/private/workspace"), false);
assert.equal(JSON.stringify(receipt).includes("/private/home"), false);

const absent = await collectNativeEvidence({
  threadId,
  expectedGoalStatus: "absent",
  spawnAppServer: fakeServer({ goal: null }),
});
assert.equal(absent.payload.goal, null);

await assert.rejects(() => collectNativeEvidence({
  threadId,
  expectedGoalStatus: "complete",
  expectedObjectiveSha256: objectiveSha256,
  spawnAppServer: fakeServer(),
}), /status mismatch/);

await assert.rejects(() => collectNativeEvidence({
  threadId,
  expectedGoalStatus: "active",
  expectedObjectiveSha256: `sha256:${"0".repeat(64)}`,
  spawnAppServer: fakeServer(),
}), /objective digest mismatch/);

await assert.rejects(() => collectNativeEvidence({
  threadId,
  expectedGoalStatus: "active",
  expectedObjectiveSha256: objectiveSha256,
  spawnAppServer: fakeServer({ duplicate: true }),
}), /duplicate JSON object member id/);

await assert.rejects(() => collectNativeEvidence({
  threadId,
  expectedGoalStatus: "active",
  expectedObjectiveSha256: objectiveSha256,
  spawnAppServer: fakeServer({ readError: true }),
}), /thread\/read failed/);

await assert.rejects(() => collectNativeEvidence({
  threadId,
  expectedGoalStatus: "active",
  expectedObjectiveSha256: objectiveSha256,
  timeoutMs: 20,
  spawnAppServer: fakeServer({ silent: true }),
}), /timed out/);

console.log("native evidence tests passed");
