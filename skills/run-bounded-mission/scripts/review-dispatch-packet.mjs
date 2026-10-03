#!/usr/bin/env node

import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import { isUtf8 } from "node:buffer";
import { lstat, readFile, realpath } from "node:fs/promises";
import { basename, join, isAbsolute, resolve } from "node:path";

const digestPattern = /^sha256:[0-9a-f]{64}$/;
const objectIdPattern = /^[0-9a-f]{40}$/;

function fail(message) {
  throw new Error(message);
}

function exactKeys(value, allowed, label) {
  if (!value || typeof value !== "object" || Array.isArray(value)) fail(`${label}: expected object`);
  const unknown = Object.keys(value).filter((key) => !allowed.has(key));
  if (unknown.length > 0) fail(`${label}: unknown members: ${unknown.join(", ")}`);
  const missing = [...allowed].filter((key) => !(key in value));
  if (missing.length > 0) fail(`${label}: missing members: ${missing.join(", ")}`);
}

function nonempty(value, label) {
  if (typeof value !== "string" || value.length === 0) fail(`${label}: expected non-empty string`);
}

function sha256(source) {
  return `sha256:${createHash("sha256").update(source).digest("hex")}`;
}

async function readPhysicalFile(path, label) {
  if (!isAbsolute(path) || resolve(path) !== path) fail(`${label}.locator: expected canonical absolute path`);
  const info = await lstat(path);
  if (!info.isFile() || info.isSymbolicLink()) fail(`${label}.locator: expected regular non-symlink file`);
  if (await realpath(path) !== path) fail(`${label}.locator: expected physical canonical path`);
  const bytes = await readFile(path);
  if (!isUtf8(bytes)) fail(`${label}: expected valid UTF-8`);
  return bytes.toString("utf8");
}

async function validatePhysicalDirectory(path, label) {
  if (!isAbsolute(path) || resolve(path) !== path) fail(`${label}: expected canonical absolute path`);
  const info = await lstat(path);
  if (!info.isDirectory() || info.isSymbolicLink() || await realpath(path) !== path) {
    fail(`${label}: expected physical non-symlink directory`);
  }
}

async function readBoundFile(path, expectedDigest, label) {
  const source = await readPhysicalFile(path, label);
  if (!digestPattern.test(expectedDigest) || sha256(source) !== expectedDigest) fail(`${label}: digest mismatch`);
  return source;
}

function git(repository, args) {
  const environment = Object.fromEntries(Object.entries(process.env).filter(([key]) => !/^GIT_/i.test(key)));
  try {
    return execFileSync("git", ["-C", repository, ...args], {
      encoding: "utf8",
      stdio: ["ignore", "pipe", "pipe"],
      env: {
        ...environment,
        GIT_NO_REPLACE_OBJECTS: "1",
        GIT_OPTIONAL_LOCKS: "0",
        GIT_TERMINAL_PROMPT: "0",
      },
    }).trim();
  } catch (error) {
    fail(`git ${args[0]}: ${error.stderr?.trim() || "unavailable"}`);
  }
}

function parseGitLocator(locator, label) {
  const match = /^git:([0-9a-f]{40}):(.+)$/.exec(locator);
  if (!match || match[2].startsWith("/") || match[2].includes("..")) fail(`${label}.locator: invalid immutable Git locator`);
  return { commit: match[1], path: match[2] };
}

async function readCurrentIdentity(root, expectedDigest) {
  await validatePhysicalDirectory(root, "identity root");
  const pointerSource = await readPhysicalFile(join(root, "current.json"), "identity pointer");
  let pointer;
  try {
    pointer = JSON.parse(pointerSource);
  } catch {
    fail("identity pointer: expected valid JSON");
  }
  exactKeys(pointer, new Set(["schema", "digest", "receipt"]), "identity pointer");
  if (pointer.schema !== "review-identity-pointer/v1" || pointer.digest !== expectedDigest ||
      !digestPattern.test(pointer.digest) || basename(pointer.receipt) !== pointer.receipt ||
      pointer.receipt !== `${pointer.digest.slice(7)}.json`) {
    fail("identityReceipt: stale or invalid current pointer");
  }
  const source = await readBoundFile(join(root, pointer.receipt), pointer.digest, "identityReceipt");
  try {
    return JSON.parse(source);
  } catch {
    fail("identityReceipt: expected valid JSON");
  }
}

// The reviewed repository's immutable Origin selects authority, never its candidate lock.
async function resolveAuthority(packet) {
  if (packet.schema === "review-dispatch-packet/v1") {
    return { path: packet.repository.path, commit: packet.origin.commit,
      controlPath: "codex/agents/mission-evaluator.toml", identity: {} };
  }
  const authority = packet.authority;
  exactKeys(authority, new Set(["repository", "lock", "host"]), "authority");
  exactKeys(authority.repository, new Set(["path", "remote"]), "authority.repository");
  exactKeys(authority.lock, new Set(["locator", "blob"]), "authority.lock");
  if (!["codex", "claude"].includes(authority.host)) fail("authority.host: unsupported host");
  const pin = parseGitLocator(authority.lock.locator, "authority.lock");
  if (pin.commit !== packet.origin.commit || pin.path !== "codex-skills.lock.json") {
    fail("authority.lock: must come from reviewed Origin");
  }
  const repository = packet.repository.path;
  const lockObject = git(repository, ["rev-parse", `${pin.commit}:${pin.path}`]);
  if (!objectIdPattern.test(authority.lock.blob) || lockObject !== authority.lock.blob ||
      git(repository, ["cat-file", "-t", lockObject]) !== "blob") {
    fail("authority.lock: blob mismatch");
  }
  const lock = JSON.parse(git(repository, ["show", `${pin.commit}:${pin.path}`]));
  const fields = ["commit", "tree", "skill_tree", "codex_agents_tree",
    "codex_session_hook_blob", "installer_blob"];
  if (authority.host === "claude" || "claude_agents_tree" in lock) fields.push("claude_agents_tree");
  if (lock.schema_version !== 2 || typeof lock.repository !== "string" || !lock.repository ||
      fields.some((field) => !objectIdPattern.test(lock[field]))) fail("authority.lock: invalid pin");
  const source = authority.repository.path;
  await validatePhysicalDirectory(source, "authority.repository.path");
  if (await realpath(git(source, ["rev-parse", "--show-toplevel"])) !== source) {
    fail("authority.repository.path: not the Git worktree root");
  }
  const normalize = (url) => url.replace(/^git@github\.com:/, "https://github.com/")
    .replace(/^ssh:\/\/git@github\.com\//, "https://github.com/").replace(/\.git$/, "");
  nonempty(authority.repository.remote, "authority.repository.remote");
  if (normalize(authority.repository.remote) !== normalize(lock.repository) ||
      normalize(git(source, ["remote", "get-url", "origin"])) !== normalize(lock.repository)) {
    fail("authority.repository: remote does not match Origin pin");
  }
  if (git(source, ["for-each-ref", "--format=%(refname)", "refs/replace"]) !== "") {
    fail("authority.repository: Git replacement objects are forbidden");
  }
  if (git(source, ["ls-files", "-v"]).split("\n").some((entry) => /^[a-zS]/.test(entry)) ||
      git(source, ["status", "--porcelain=v2", "--untracked-files=all"]) !== "") {
    fail("authority.repository: checkout must be clean without suppressed index entries");
  }
  if (git(source, ["rev-parse", "HEAD"]) !== lock.commit ||
      git(source, ["rev-parse", `${lock.commit}^{commit}`]) !== lock.commit) {
    fail("authority.repository: checkout does not match pinned commit");
  }
  git(source, ["merge-base", "--is-ancestor", lock.commit, "refs/remotes/origin/main"]);
  const objects = {
    tree: ["", "tree"],
    skill_tree: [":skills/run-bounded-mission", "tree"],
    codex_agents_tree: [":codex/agents", "tree"],
    claude_agents_tree: [":claude/agents", "tree"],
    codex_session_hook_blob: [":codex/hooks/qoeop-trade-session-start.mjs", "blob"],
    installer_blob: [":scripts/install-codex.mjs", "blob"],
  };
  for (const field of fields.filter((field) => field !== "commit")) {
    const [suffix, type] = objects[field];
    const object = git(source, ["rev-parse", suffix ? `${lock.commit}${suffix}` : `${lock.commit}^{tree}`]);
    if (object !== lock[field] || git(source, ["cat-file", "-t", object]) !== type) {
      fail(`authority.lock: ${field} mismatch`);
    }
  }
  return { path: source, commit: lock.commit, skillTree: lock.skill_tree,
    controlPath: authority.host === "codex" ? "codex/agents/mission-evaluator.toml" : "claude/agents/mission-evaluator.md",
    identity: { authorityLockBlob: lockObject, authorityHost: authority.host } };
}

async function validate(packet, packetSource, identityRoot) {
  if (!["review-dispatch-packet/v1", "review-dispatch-packet/v2"].includes(packet.schema)) {
    fail("packet.schema: wrong schema");
  }
  exactKeys(packet, new Set([
    ...(packet.schema === "review-dispatch-packet/v2" ? ["authority"] : []),
    "schema",
    "reviewerIdentity",
    "repository",
    "origin",
    "candidate",
    "skill",
    "neutralControl",
    "lens",
    "gateEvidence",
    "identityReceipt",
    "returnContract",
    "decisionProjection",
  ]), "packet");
  nonempty(packet.reviewerIdentity, "reviewerIdentity");
  exactKeys(packet.repository, new Set(["path", "remote"]), "repository");
  if (!isAbsolute(packet.repository.path) || resolve(packet.repository.path) !== packet.repository.path ||
      await realpath(packet.repository.path) !== packet.repository.path) {
    fail("repository.path: expected physical canonical absolute path");
  }
  nonempty(packet.repository.remote, "repository.remote");
  const gitWorktreeRoot = git(packet.repository.path, ["rev-parse", "--show-toplevel"]);
  if (await realpath(gitWorktreeRoot) !== packet.repository.path) {
    fail("repository.path: not the Git worktree root");
  }
  if (git(packet.repository.path, ["remote", "get-url", "origin"]) !== packet.repository.remote) {
    fail("repository.remote: does not match Git origin");
  }
  if (git(packet.repository.path, ["for-each-ref", "--format=%(refname)", "refs/replace"]) !== "") {
    fail("candidate: Git replacement objects are forbidden");
  }
  const suppressedIndexEntries = git(packet.repository.path, ["ls-files", "-v"])
    .split("\n")
    .filter((entry) => /^[a-zS]/.test(entry));
  if (suppressedIndexEntries.length > 0) {
    fail("candidate: assume-unchanged or skip-worktree index flags are forbidden");
  }
  if (git(packet.repository.path, ["status", "--porcelain=v2", "--untracked-files=all"]) !== "") {
    fail("candidate: worktree and index must be clean before dispatch");
  }

  exactKeys(packet.origin, new Set(["ref", "commit", "tree"]), "origin");
  if (packet.origin.ref !== "refs/remotes/origin/main") fail("origin.ref: expected refs/remotes/origin/main");
  if (!objectIdPattern.test(packet.origin.commit) || !objectIdPattern.test(packet.origin.tree)) fail("origin: invalid object identity");
  if (git(packet.repository.path, ["rev-parse", packet.origin.ref]) !== packet.origin.commit ||
      git(packet.repository.path, ["rev-parse", `${packet.origin.commit}^{tree}`]) !== packet.origin.tree) {
    fail("origin: exact ref commit/tree mismatch");
  }

  exactKeys(packet.candidate, new Set(["commit", "tree"]), "candidate");
  if (!objectIdPattern.test(packet.candidate.commit) || !objectIdPattern.test(packet.candidate.tree)) fail("candidate: invalid object identity");
  if (git(packet.repository.path, ["rev-parse", "HEAD"]) !== packet.candidate.commit ||
      git(packet.repository.path, ["rev-parse", `${packet.candidate.commit}^{commit}`]) !== packet.candidate.commit ||
      git(packet.repository.path, ["rev-parse", `${packet.candidate.commit}^{tree}`]) !== packet.candidate.tree) {
    fail("candidate: HEAD commit/tree mismatch");
  }
  if (git(packet.repository.path, ["merge-base", packet.origin.commit, packet.candidate.commit]) !== packet.origin.commit) {
    fail("candidate: does not descend from exact Origin");
  }

  const authority = await resolveAuthority(packet);
  exactKeys(packet.skill, new Set(["locator", "tree"]), "skill");
  const skill = parseGitLocator(packet.skill.locator, "skill");
  const skillObject = git(authority.path, ["rev-parse", `${skill.commit}:${skill.path}`]);
  if (skill.commit !== authority.commit || skill.path !== "skills/run-bounded-mission" ||
      !objectIdPattern.test(packet.skill.tree) || skillObject !== packet.skill.tree || (authority.skillTree && skillObject !== authority.skillTree) ||
      git(authority.path, ["cat-file", "-t", skillObject]) !== "tree") {
    fail("skill: immutable Origin locator/tree mismatch");
  }
  const skillEntrypoint = git(authority.path, ["rev-parse", `${skill.commit}:${skill.path}/SKILL.md`]);
  if (git(authority.path, ["cat-file", "-t", skillEntrypoint]) !== "blob" ||
      !/^---\n[\s\S]*?^name:\s*run-bounded-mission\s*$/m.test(
        git(authority.path, ["show", `${skill.commit}:${skill.path}/SKILL.md`]),
      )) {
    fail("skill: required immutable entrypoint is unavailable");
  }

  exactKeys(packet.neutralControl, new Set(["locator", "blob"]), "neutralControl");
  const control = parseGitLocator(packet.neutralControl.locator, "neutralControl");
  const controlObject = git(authority.path, ["rev-parse", `${control.commit}:${control.path}`]);
  if (control.commit !== authority.commit || control.path !== authority.controlPath ||
      !objectIdPattern.test(packet.neutralControl.blob) || controlObject !== packet.neutralControl.blob ||
      git(authority.path, ["cat-file", "-t", controlObject]) !== "blob") {
    fail("neutralControl: immutable Origin locator/blob mismatch");
  }

  exactKeys(packet.lens, new Set(["id", "question", "oracle", "preservationControl"]), "lens");
  for (const key of ["id", "question", "oracle", "preservationControl"]) nonempty(packet.lens[key], `lens.${key}`);
  if (/review everything|find any issue|use your judgment/i.test(packet.lens.question)) {
    fail("lens.question: must be bounded and falsifiable");
  }

  if (!Array.isArray(packet.gateEvidence) || packet.gateEvidence.length === 0 || packet.gateEvidence.length > 32) {
    fail("gateEvidence: expected one through 32 locators");
  }
  const gateLocators = new Set();
  for (const [index, evidence] of packet.gateEvidence.entries()) {
    exactKeys(evidence, new Set(["locator", "sha256"]), `gateEvidence[${index}]`);
    if (gateLocators.has(evidence.locator)) fail(`gateEvidence: duplicate locator ${evidence.locator}`);
    gateLocators.add(evidence.locator);
    const evidenceSource = await readBoundFile(evidence.locator, evidence.sha256, `gateEvidence[${index}]`);
    let gate;
    try {
      gate = JSON.parse(evidenceSource);
    } catch {
      fail(`gateEvidence[${index}]: expected valid JSON`);
    }
    exactKeys(gate, new Set(["schema", "candidate", "checks"]), `gateEvidence[${index}].content`);
    exactKeys(gate.candidate, new Set(["commit", "tree"]), `gateEvidence[${index}].candidate`);
    if (gate.schema !== "review-gate-evidence/v1" || gate.candidate.commit !== packet.candidate.commit ||
        gate.candidate.tree !== packet.candidate.tree) {
      fail(`gateEvidence[${index}]: candidate identity mismatch`);
    }
    if (!Array.isArray(gate.checks)) fail(`gateEvidence[${index}].checks: expected array`);
    const checks = new Map();
    for (const check of gate.checks) {
      exactKeys(check, new Set(["id", "result", "locator", "sha256"]), `gateEvidence[${index}].check`);
      nonempty(check.id, `gateEvidence[${index}].check.id`);
      if (check.result !== "pass" || checks.has(check.id)) fail(`gateEvidence[${index}].checks: non-pass or duplicate check`);
      const checkSource = await readBoundFile(check.locator, check.sha256, `gateEvidence[${index}].check.${check.id}`);
      let execution;
      try {
        execution = JSON.parse(checkSource);
      } catch {
        fail(`gateEvidence[${index}].check.${check.id}: expected valid JSON`);
      }
      exactKeys(execution, new Set(["schema", "candidate", "check"]), `gateEvidence[${index}].check.${check.id}.content`);
      exactKeys(execution.candidate, new Set(["commit", "tree"]), `gateEvidence[${index}].check.${check.id}.candidate`);
      exactKeys(execution.check, new Set(["id", "command", "exitCode"]), `gateEvidence[${index}].check.${check.id}.execution`);
      if (execution.schema !== "review-check-evidence/v1" ||
          execution.candidate.commit !== packet.candidate.commit || execution.candidate.tree !== packet.candidate.tree ||
          execution.check.id !== check.id || execution.check.exitCode !== 0) {
        fail(`gateEvidence[${index}].check.${check.id}: execution identity or result mismatch`);
      }
      nonempty(execution.check.command, `gateEvidence[${index}].check.${check.id}.command`);
      checks.set(check.id, check);
    }
    for (const id of ["focused", "root", "diff_check"]) {
      if (!checks.has(id)) fail(`gateEvidence[${index}].checks: missing required ${id}`);
    }
  }

  exactKeys(packet.identityReceipt, new Set(["digest"]), "identityReceipt");
  const identity = await readCurrentIdentity(identityRoot, packet.identityReceipt.digest);
  exactKeys(identity, new Set(["schema", "identity", "state", "dispatchReceipt", "terminalDeliveryReceipt"]), "identityReceipt.content");
  exactKeys(identity.identity, new Set([
    "id", "repository", "originCommit", "originTree", "candidateCommit", "candidateTree", "neutralControlBlob", "lens",
    ...Object.keys(authority.identity),
  ]), "identityReceipt.content.identity");
  const expectedIdentity = {
    id: packet.reviewerIdentity,
    repository: packet.repository.remote,
    originCommit: packet.origin.commit,
    originTree: packet.origin.tree,
    candidateCommit: packet.candidate.commit,
    candidateTree: packet.candidate.tree,
    neutralControlBlob: packet.neutralControl.blob,
    lens: packet.lens.id,
    ...authority.identity,
  };
  if (identity.schema !== "review-identity-receipt/v1" ||
      Object.keys(expectedIdentity).some((key) => identity.identity[key] !== expectedIdentity[key])) {
    fail("identityReceipt: reviewer identity mismatch");
  }
  if (identity.state === "consumed") {
    fail(`reviewer identity ${packet.reviewerIdentity} is already consumed; redispatch is forbidden`);
  }
  if (identity.state !== "unconsumed" || identity.dispatchReceipt !== null || identity.terminalDeliveryReceipt !== null) {
    fail("identityReceipt: unconsumed identity must have no dispatch or terminal-delivery receipt");
  }
  nonempty(packet.returnContract, "returnContract");
  exactKeys(packet.decisionProjection, new Set(["owner", "consumers", "scope", "effects", "acceptance", "stop"]), "decisionProjection");
  for (const key of ["owner", "consumers", "scope", "effects", "acceptance", "stop"]) {
    nonempty(packet.decisionProjection[key], `decisionProjection.${key}`);
  }
  process.stdout.write(`${sha256(packetSource)}\n`);
}

const [command, ...arguments_] = process.argv.slice(2);
const options = {};
for (let index = 0; index < arguments_.length; index += 1) {
  const value = arguments_[index];
  if (value === "--packet") options.packet = arguments_[++index] ?? "";
  else if (value === "--identity-root") options.identityRoot = arguments_[++index] ?? "";
  else fail(`unknown argument: ${value}`);
}
if (command !== "validate" || !isAbsolute(options.packet ?? "") || !isAbsolute(options.identityRoot ?? "")) {
  fail("usage: review-dispatch-packet.mjs validate --packet <absolute> --identity-root <absolute>");
}
const packetPath = resolve(options.packet);
const packetSource = await readPhysicalFile(packetPath, "packet");
let packet;
try {
  packet = JSON.parse(packetSource);
} catch {
  fail("packet: expected valid JSON");
}
await validate(packet, packetSource, resolve(options.identityRoot));
