import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import { mkdir, mkdtemp, readFile, realpath, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const script = join(dirname(fileURLToPath(import.meta.url)), "review-dispatch-packet.mjs");
const root = await mkdtemp(join(await realpath(tmpdir()), "review-dispatch-packet-"));
const repository = join(root, "repository");
const packetPath = join(root, "packet.json");
const gatePath = join(root, "gates.json");
const identityRoot = join(root, "identity-root");
await mkdir(repository);
await mkdir(identityRoot);

function git(...args) {
  return execFileSync("git", ["-C", repository, ...args], { encoding: "utf8" }).trim();
}

function sha256(source) {
  return `sha256:${createHash("sha256").update(source).digest("hex")}`;
}

async function writeJson(path, value) {
  const source = `${JSON.stringify(value)}\n`;
  await writeFile(path, source, "utf8");
  return sha256(source);
}

function run() {
  return execFileSync(process.execPath, [script, "validate", "--packet", packetPath, "--identity-root", identityRoot], {
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
  }).trim();
}

async function writeIdentityState(identity) {
  const source = `${JSON.stringify(identity)}\n`;
  const valueDigest = sha256(source);
  const receipt = `${valueDigest.slice(7)}.json`;
  await writeFile(join(identityRoot, receipt), source, "utf8");
  await writeFile(join(identityRoot, "current.json"), `${JSON.stringify({
    schema: "review-identity-pointer/v1",
    digest: valueDigest,
    receipt,
  })}\n`, "utf8");
  return valueDigest;
}

function rejects(pattern) {
  assert.throws(run, pattern);
}

git("init", "-b", "main");
git("config", "user.name", "Review Packet Test");
git("config", "user.email", "review@example.invalid");
await mkdir(join(repository, "skills", "run-bounded-mission"), { recursive: true });
await mkdir(join(repository, "codex", "agents"), { recursive: true });
await writeFile(join(repository, "skills", "run-bounded-mission", "SKILL.md"), "---\nname: run-bounded-mission\n---\n\nOrigin skill.\n");
await writeFile(join(repository, "codex", "agents", "mission-evaluator.toml"), "neutral control\n");
git("add", ".");
git("commit", "-m", "origin");
const originCommit = git("rev-parse", "HEAD");
const originTree = git("rev-parse", "HEAD^{tree}");
git("update-ref", "refs/remotes/origin/main", originCommit);
git("remote", "add", "origin", "https://example.invalid/repo.git");
await writeFile(join(repository, "candidate.txt"), "candidate\n");
git("add", "candidate.txt");
git("commit", "-m", "candidate");
const candidateCommit = git("rev-parse", "HEAD");
const candidateTree = git("rev-parse", "HEAD^{tree}");
const skillTree = git("rev-parse", `${originCommit}:skills/run-bounded-mission`);
const controlBlob = git("rev-parse", `${originCommit}:codex/agents/mission-evaluator.toml`);
const checkRows = [];
for (const [id, command] of [
  ["focused", "node focused.test.mjs"],
  ["root", "npm run check"],
  ["diff_check", "git diff --check"],
]) {
  const locator = join(root, `${id}.json`);
  const digest = await writeJson(locator, {
    schema: "review-check-evidence/v1",
    candidate: { commit: candidateCommit, tree: candidateTree },
    check: { id, command, exitCode: 0 },
  });
  checkRows.push({ id, result: "pass", locator, sha256: digest });
}
const gate = {
  schema: "review-gate-evidence/v1",
  candidate: { commit: candidateCommit, tree: candidateTree },
  checks: checkRows,
};
const gateDigest = await writeJson(gatePath, gate);
const reviewIdentity = {
  id: "T166e30",
  repository: "https://example.invalid/repo.git",
  originCommit,
  originTree,
  candidateCommit,
  candidateTree,
  neutralControlBlob: controlBlob,
  lens: "consumer_fail_close_closure",
};
let identityDigest = await writeIdentityState({
  schema: "review-identity-receipt/v1",
  identity: reviewIdentity,
  state: "unconsumed",
  dispatchReceipt: null,
  terminalDeliveryReceipt: null,
});
const packet = {
  schema: "review-dispatch-packet/v1",
  reviewerIdentity: "T166e30",
  repository: { path: repository, remote: "https://example.invalid/repo.git" },
  origin: { ref: "refs/remotes/origin/main", commit: originCommit, tree: originTree },
  candidate: { commit: candidateCommit, tree: candidateTree },
  skill: { locator: `git:${originCommit}:skills/run-bounded-mission`, tree: skillTree },
  neutralControl: { locator: `git:${originCommit}:codex/agents/mission-evaluator.toml`, blob: controlBlob },
  lens: {
    id: "consumer_fail_close_closure",
    question: "Can a missing gate locator reach reviewer dispatch?",
    oracle: "validator exits nonzero before host dispatch",
    preservationControl: "a complete exact packet remains admissible",
  },
  gateEvidence: [{ locator: gatePath, sha256: gateDigest }],
  identityReceipt: { digest: identityDigest },
  returnContract: "review_status; review_identity; findings; unavailable_evidence; mutation_observation",
  decisionProjection: {
    owner: "Main",
    consumers: "reviewer dispatch",
    scope: "one packet validator",
    effects: "read-only",
    acceptance: "missing bindings fail before dispatch",
    stop: "identity drift",
  },
};
await writeJson(packetPath, packet);
assert.match(run(), /^sha256:[0-9a-f]{64}$/);

for (const member of ["origin", "candidate", "skill", "neutralControl", "lens", "gateEvidence"]) {
  const incomplete = structuredClone(packet);
  delete incomplete[member];
  await writeJson(packetPath, incomplete);
  rejects(new RegExp(`missing members: ${member}`));
}

await writeJson(packetPath, packet);
await writeFile(join(repository, "dirty.txt"), "dirty\n");
rejects(/worktree and index must be clean before dispatch/);
await rm(join(repository, "dirty.txt"));

git("update-index", "--assume-unchanged", "candidate.txt");
await writeFile(join(repository, "candidate.txt"), "hidden candidate change\n");
rejects(/assume-unchanged or skip-worktree index flags are forbidden/);
await writeFile(join(repository, "candidate.txt"), "candidate\n");
git("update-index", "--no-assume-unchanged", "candidate.txt");

const replacementControlPath = join(root, "replacement-control.toml");
await writeFile(replacementControlPath, "replacement control\n");
const replacementControlBlob = git("hash-object", "-w", replacementControlPath);
git("replace", controlBlob, replacementControlBlob);
rejects(/Git replacement objects are forbidden/);
git("replace", "-d", controlBlob);

const unconsumedDigest = identityDigest;
identityDigest = await writeIdentityState({
  schema: "review-identity-receipt/v1",
  identity: reviewIdentity,
  state: "consumed",
  dispatchReceipt: "dispatch:T166e30",
  terminalDeliveryReceipt: "terminal:T166e30",
});
await writeJson(packetPath, { ...packet, identityReceipt: { digest: unconsumedDigest } });
rejects(/identityReceipt: stale or invalid current pointer/);
await writeJson(packetPath, { ...packet, identityReceipt: { digest: identityDigest } });
rejects(/reviewer identity T166e30 is already consumed; redispatch is forbidden/);

await writeJson(packetPath, packet);
await writeJson(gatePath, { ...gate, candidate: { ...gate.candidate, commit: originCommit } });
const staleGateDigest = sha256(await readFile(gatePath, "utf8"));
await writeJson(packetPath, { ...packet, gateEvidence: [{ locator: gatePath, sha256: staleGateDigest }], identityReceipt: { digest: identityDigest } });
rejects(/gateEvidence\[0\]: candidate identity mismatch/);

const missingCheckGate = structuredClone(gate);
missingCheckGate.checks[0].locator = join(root, "missing-focused.json");
const missingCheckGateDigest = await writeJson(gatePath, missingCheckGate);
await writeJson(packetPath, {
  ...packet,
  gateEvidence: [{ locator: gatePath, sha256: missingCheckGateDigest }],
  identityReceipt: { digest: identityDigest },
});
rejects(/ENOENT/);

await writeJson(gatePath, gate);
await writeJson(packetPath, {
  ...packet,
  skill: {
    locator: `git:${originCommit}:codex/agents/mission-evaluator.toml`,
    tree: controlBlob,
  },
  identityReceipt: { digest: identityDigest },
});
rejects(/skill: immutable Origin locator\/tree mismatch/);

const invalidUtf8Packet = structuredClone(packet);
invalidUtf8Packet.lens.question = "INVALID_UTF8_MARKER";
const invalidUtf8PacketBytes = Buffer.from(`${JSON.stringify(invalidUtf8Packet)}\n`);
invalidUtf8PacketBytes[invalidUtf8PacketBytes.indexOf("INVALID_UTF8_MARKER")] = 0xff;
await writeFile(packetPath, invalidUtf8PacketBytes);
rejects(/packet: expected valid UTF-8/);

process.stdout.write("review dispatch packet tests passed\n");
