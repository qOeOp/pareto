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

try {
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



// A business repository has no Skill/profile files. Only its Origin pin selects them.
const authorityRepo = join(root, "authority");
await mkdir(authorityRepo);
function at(path, ...args) {
  return execFileSync("git", ["-C", path, ...args], { encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] }).trim();
}
function initialize(path, remote) {
  at(path, "init", "-b", "main");
  at(path, "config", "user.name", "Review Test");
  at(path, "config", "user.email", "review@example.invalid");
  at(path, "remote", "add", "origin", remote);
}
const authorityRemote = "https://github.com/example/authority.git";
initialize(authorityRepo, authorityRemote);
for (const [path, content] of [
  ["skills/run-bounded-mission/SKILL.md", "---\nname: run-bounded-mission\n---\nExternal skill.\n"],
  ["codex/agents/mission-evaluator.toml", "Codex neutral control\n"],
  ["claude/agents/mission-evaluator.md", "Claude neutral control\n"],
  ["codex/hooks/qoeop-trade-session-start.mjs", "// hook\n"],
  ["scripts/install-codex.mjs", "// installer\n"],
]) {
  await mkdir(dirname(join(authorityRepo, path)), { recursive: true });
  await writeFile(join(authorityRepo, path), content);
}
at(authorityRepo, "add", ".");
at(authorityRepo, "commit", "-m", "trusted authority");
const authorityCommit = at(authorityRepo, "rev-parse", "HEAD");
at(authorityRepo, "update-ref", "refs/remotes/origin/main", authorityCommit);
const pin = {
  schema_version: 2, repository: authorityRemote, commit: authorityCommit,
  tree: at(authorityRepo, "rev-parse", "HEAD^{tree}"),
  skill_tree: at(authorityRepo, "rev-parse", "HEAD:skills/run-bounded-mission"),
  codex_agents_tree: at(authorityRepo, "rev-parse", "HEAD:codex/agents"),
  claude_agents_tree: at(authorityRepo, "rev-parse", "HEAD:claude/agents"),
  codex_session_hook_blob: at(authorityRepo, "rev-parse", "HEAD:codex/hooks/qoeop-trade-session-start.mjs"),
  installer_blob: at(authorityRepo, "rev-parse", "HEAD:scripts/install-codex.mjs"),
};
let businessIndex = 0;
async function externalPacket(lock = pin, host = "codex") {
  const business = join(root, `business-${businessIndex++}`);
  await mkdir(business);
  initialize(business, "https://example.invalid/business.git");
  await writeJson(join(business, "codex-skills.lock.json"), lock);
  at(business, "add", "."); at(business, "commit", "-m", "origin pin");
  const origin = at(business, "rev-parse", "HEAD");
  at(business, "update-ref", "refs/remotes/origin/main", origin);
  // The candidate deliberately proposes an unrelated pin; it cannot authorize its reviewer.
  await writeJson(join(business, "codex-skills.lock.json"), { ...lock, commit: "f".repeat(40) });
  at(business, "add", "."); at(business, "commit", "-m", "candidate pin change");
  const candidate = { commit: at(business, "rev-parse", "HEAD"), tree: at(business, "rev-parse", "HEAD^{tree}") };
  const controlPath = host === "codex" ? "codex/agents/mission-evaluator.toml" : "claude/agents/mission-evaluator.md";
  const external = {
    ...structuredClone(packet), schema: "review-dispatch-packet/v2", reviewerIdentity: `external-${businessIndex}`,
    repository: { path: business, remote: "https://example.invalid/business.git" },
    origin: { ref: "refs/remotes/origin/main", commit: origin, tree: at(business, "rev-parse", `${origin}^{tree}`) },
    candidate,
    authority: {
      repository: { path: authorityRepo, remote: authorityRemote }, host,
      lock: { locator: `git:${origin}:codex-skills.lock.json`, blob: at(business, "rev-parse", `${origin}:codex-skills.lock.json`) },
    },
    skill: { locator: `git:${authorityCommit}:skills/run-bounded-mission`, tree: pin.skill_tree },
    neutralControl: { locator: `git:${authorityCommit}:${controlPath}`, blob: at(authorityRepo, "rev-parse", `${authorityCommit}:${controlPath}`) },
  };
  const checks = [];
  for (const id of ["focused", "root", "diff_check"]) {
    const locator = join(root, `external-${businessIndex}-${id}.json`);
    const digest = await writeJson(locator, { schema: "review-check-evidence/v1", candidate, check: { id, command: `test ${id}`, exitCode: 0 } });
    checks.push({ id, result: "pass", locator, sha256: digest });
  }
  external.gateEvidence = [{ locator: gatePath, sha256: await writeJson(gatePath, { schema: "review-gate-evidence/v1", candidate, checks }) }];
  external.identityReceipt = { digest: await writeIdentityState({
    schema: "review-identity-receipt/v1", state: "unconsumed", dispatchReceipt: null, terminalDeliveryReceipt: null,
    identity: {
      id: external.reviewerIdentity, repository: external.repository.remote,
      originCommit: origin, originTree: external.origin.tree, candidateCommit: candidate.commit, candidateTree: candidate.tree,
      neutralControlBlob: external.neutralControl.blob, lens: external.lens.id,
      authorityLockBlob: external.authority.lock.blob, authorityHost: host,
    },
  }) };
  return external;
}
for (const host of ["codex", "claude"]) {
  const external = await externalPacket(pin, host);
  await writeJson(packetPath, external);
  assert.match(run(), /^sha256:[0-9a-f]{64}$/);
  for (const [mutate, pattern] of [
    [p => { p.authority.lock.locator = `git:${p.candidate.commit}:codex-skills.lock.json`; }, /must come from reviewed Origin/],
    [p => { p.authority.lock.blob = "0".repeat(40); }, /blob mismatch/],
    [p => { p.authority.repository.remote = "https://example.invalid/evil.git"; }, /remote does not match Origin pin/],
    [p => { p.authority.host = "unknown"; }, /unsupported host/],
    [p => { p.skill.tree = "0".repeat(40); }, /skill: immutable Origin/],
    [p => { p.neutralControl.blob = "0".repeat(40); }, /neutralControl: immutable Origin/],
    [p => { p.authority.lock.locator = `git:${p.origin.commit}:missing.json`; }, /must come from reviewed Origin/],
    [p => { p.authority.repository.path = join(root, "missing-authority"); }, /ENOENT/],
  ]) {
    const invalid = structuredClone(external); mutate(invalid);
    await writeJson(packetPath, invalid); rejects(pattern);
  }
  await writeJson(packetPath, external);
  await writeFile(join(authorityRepo, "dirty.txt"), "untrusted");
  rejects(/checkout must be clean/); await rm(join(authorityRepo, "dirty.txt"));
  at(authorityRepo, "update-index", "--assume-unchanged", "skills/run-bounded-mission/SKILL.md");
  rejects(/checkout must be clean/);
  at(authorityRepo, "update-index", "--no-assume-unchanged", "skills/run-bounded-mission/SKILL.md");
  at(authorityRepo, "remote", "set-url", "origin", "https://example.invalid/substitution.git");
  rejects(/remote does not match Origin pin/);
  at(authorityRepo, "remote", "set-url", "origin", authorityRemote);
  at(authorityRepo, "update-ref", "refs/replace/" + pin.skill_tree, pin.skill_tree);
  rejects(/replacement objects/); at(authorityRepo, "update-ref", "-d", "refs/replace/" + pin.skill_tree);
  const identity = JSON.parse(await readFile(join(identityRoot, `${external.identityReceipt.digest.slice(7)}.json`), "utf8"));
  identity.identity.authorityHost = host === "codex" ? "claude" : "codex";
  external.identityReceipt.digest = await writeIdentityState(identity);
  await writeJson(packetPath, external); rejects(/reviewer identity mismatch/);
}
for (const field of ["commit", "tree", "skill_tree", "codex_agents_tree", "claude_agents_tree", "codex_session_hook_blob", "installer_blob"]) {
  const external = await externalPacket({ ...pin, [field]: "0".repeat(40) });
  await writeJson(packetPath, external);
  rejects(field === "commit" ? /checkout does not match pinned commit/ : new RegExp(`${field} mismatch`));
}
const oldCodexPin = { ...pin }; delete oldCodexPin.claude_agents_tree;
await writeJson(packetPath, await externalPacket(oldCodexPin, "codex"));
assert.match(run(), /^sha256:[0-9a-f]{64}$/);
await writeJson(packetPath, await externalPacket(oldCodexPin, "claude")); rejects(/invalid pin/);
const finalPacket = await externalPacket(); await writeJson(packetPath, finalPacket);
at(authorityRepo, "update-ref", "-d", "refs/remotes/origin/main"); rejects(/git merge-base/);
at(authorityRepo, "update-ref", "refs/remotes/origin/main", authorityCommit);
assert.match(run(), /^sha256:[0-9a-f]{64}$/);
process.stdout.write("review dispatch packet tests passed (in-repository, external Codex/Claude, refusal cases)\n");
} finally {
  await rm(root, { recursive: true, force: true });
}
