#!/usr/bin/env node

import { createHash } from "node:crypto";
import { lstat, mkdir, readFile, readdir, realpath, rename, rmdir, writeFile } from "node:fs/promises";
import { basename, dirname, isAbsolute, join, relative, resolve, sep } from "node:path";

const states = new Set([
  "waiting",
  "runnable",
  "dispatch_pending",
  "running",
  "frozen",
  "needs_attention",
  "terminal",
]);
const nextKinds = new Set(["dispatch", "observe", "fan_in", "mutate", "review", "gate", "finalize"]);
const artifactKinds = new Set(["candidate", "worktree", "branch", "pr", "cache", "checkout"]);
const filesystemArtifactKinds = new Set(["worktree", "cache", "checkout"]);
const dispatchKinds = new Set(["client_thread", "native_task"]);
const dispatchModes = new Set(["create", "continue"]);

function fail(message) {
  throw new Error(message);
}

function parseArguments(argv) {
  const [command, ...rest] = argv;
  const options = { command };
  for (let index = 0; index < rest.length; index += 1) {
    const value = rest[index];
    if (value === "--receipt-root") options.receiptRoot = rest[++index] ?? "";
    else if (value === "--receipt-dir") options.receiptDir = rest[++index] ?? "";
    else if (value === "--input") options.input = rest[++index] ?? "";
    else if (value === "--expect-prior") options.expectPrior = rest[++index] ?? "";
    else fail(`unknown argument: ${value}`);
  }
  if (!new Set(["advance", "verify"]).has(command) || !options.receiptRoot || !options.receiptDir) {
    fail("usage: hub-state-receipt.mjs <advance|verify> --receipt-root <absolute> --receipt-dir <absolute-child> [--input <absolute>] [--expect-prior <sha256:...|none>]");
  }
  if (!isAbsolute(options.receiptRoot) || !isAbsolute(options.receiptDir) ||
      (command === "advance" && !isAbsolute(options.input))) {
    fail("absolute paths are required");
  }
  if (options.expectPrior !== undefined && options.expectPrior !== "none" &&
      !/^sha256:[0-9a-f]{64}$/.test(options.expectPrior)) {
    fail("expect-prior: expected sha256 digest or none");
  }
  options.receiptRoot = resolve(options.receiptRoot);
  options.receiptDir = resolve(options.receiptDir);
  if (options.input) options.input = resolve(options.input);
  return options;
}

function exactKeys(value, allowed, required, label) {
  if (!value || typeof value !== "object" || Array.isArray(value)) fail(`${label}: expected object`);
  const unknown = Object.keys(value).filter((key) => !allowed.has(key));
  if (unknown.length > 0) fail(`${label}: unknown members: ${unknown.join(", ")}`);
  const missing = [...required].filter((key) => !(key in value));
  if (missing.length > 0) fail(`${label}: missing members: ${missing.join(", ")}`);
}

function nonempty(value, label) {
  if (typeof value !== "string" || value.length === 0) fail(`${label}: expected non-empty string`);
}

function uniqueRows(rows, label) {
  if (!Array.isArray(rows)) fail(`${label}: expected array`);
  const ids = new Set();
  for (const row of rows) {
    if (!row || typeof row !== "object" || Array.isArray(row)) fail(`${label}: expected object rows`);
    nonempty(row.id, `${label}.id`);
    if (ids.has(row.id)) fail(`${label}: duplicate id ${row.id}`);
    ids.add(row.id);
  }
  return ids;
}

function validateDispatchReceipt(value, label, requiredKind, requireTargetIdentity = false) {
  const keys = requireTargetIdentity
    ? new Set(["kind", "locator", "threadId", "hostId"])
    : new Set(["kind", "locator"]);
  exactKeys(value, keys, keys, label);
  if (!dispatchKinds.has(value.kind)) fail(`${label}.kind: invalid dispatch identity`);
  if (requiredKind && value.kind !== requiredKind) fail(`${label}.kind: expected ${requiredKind}`);
  nonempty(value.locator, `${label}.locator`);
  if (requireTargetIdentity) {
    nonempty(value.threadId, `${label}.threadId`);
    nonempty(value.hostId, `${label}.hostId`);
  }
}

async function validateFilesystemLocator(locator, label, allowMissing) {
  if (!isAbsolute(locator) || resolve(locator) !== locator) {
    fail(`${label}: filesystem locator must be a canonical absolute path`);
  }
  for (let current = locator; ; current = dirname(current)) {
    let info;
    try {
      info = await lstat(current);
    } catch (error) {
      if (!allowMissing || error.code !== "ENOENT") throw error;
      if (dirname(current) === current) throw error;
      continue;
    }
    if (info.isSymbolicLink()) fail(`${label}: filesystem locator must not contain a symlink`);
    const physical = await realpath(current);
    if (physical !== current) fail(`${label}: filesystem locator must be a physical canonical path`);
    return;
  }
}

async function validateReceipt(receipt, { requireRetainedFilesystem = false, allowLegacy = false } = {}) {
  const legacy = receipt?.schema === "hub-state-receipt/v1";
  const receiptKeys = new Set([
    "schema",
    "mission",
    "origin",
    "nodes",
    "artifacts",
    "activeTargets",
    "observation",
    "next",
  ]);
  const legacyReceiptKeys = new Set(["schema", "mission", "origin", "nodes", "artifacts", "next"]);
  const selectedReceiptKeys = legacy ? legacyReceiptKeys : receiptKeys;
  exactKeys(receipt, selectedReceiptKeys, selectedReceiptKeys, "receipt");
  if (legacy && !allowLegacy) fail("receipt: legacy v1 requires advance to v2 before effects");
  if (!legacy && receipt.schema !== "hub-state-receipt/v2") fail("receipt: wrong schema");
  nonempty(receipt.mission, "receipt.mission");
  const originKeys = new Set(["repository", "commit", "tree"]);
  exactKeys(receipt.origin, originKeys, originKeys, "origin");
  nonempty(receipt.origin.repository, "origin.repository");
  for (const key of ["commit", "tree"]) {
    if (typeof receipt.origin[key] !== "string" || !/^[0-9a-f]{40}$/.test(receipt.origin[key])) {
      fail(`origin.${key}: expected 40 lowercase hex characters`);
    }
  }
  const nodeIds = uniqueRows(receipt.nodes, "nodes");
  const nodeById = new Map(receipt.nodes.map((node) => [node.id, node]));
  for (const node of receipt.nodes) {
    exactKeys(
      node,
      new Set(["id", "state", "owner", "dependsOn", "dispatchReceipt", "nativeTaskReceipt", "stateReceipt", "terminalReceipt"]),
      new Set(["id", "state", "owner", "dependsOn"]),
      `node ${node.id}`,
    );
    if (!states.has(node.state)) fail(`node ${node.id}: invalid state`);
    nonempty(node.owner, `node ${node.id}.owner`);
    if (!Array.isArray(node.dependsOn) || node.dependsOn.some((value) => typeof value !== "string" || !value)) {
      fail(`node ${node.id}.dependsOn: expected string array`);
    }
    if (new Set(node.dependsOn).size !== node.dependsOn.length) fail(`node ${node.id}: duplicate dependency`);
    for (const dependency of node.dependsOn) {
      if (dependency === node.id || !nodeById.has(dependency)) fail(`node ${node.id}: invalid dependency ${dependency}`);
    }
    if (node.dispatchReceipt !== undefined) validateDispatchReceipt(node.dispatchReceipt, `node ${node.id}.dispatchReceipt`);
    if (node.nativeTaskReceipt !== undefined) {
      validateDispatchReceipt(node.nativeTaskReceipt, `node ${node.id}.nativeTaskReceipt`, "native_task", !legacy);
      if (node.dispatchReceipt === undefined) fail(`node ${node.id}: native Task receipt requires dispatch custody`);
    }
    if (node.state === "dispatch_pending" && node.dispatchReceipt?.kind !== "client_thread") {
      fail(`node ${node.id}: dispatch-pending node requires client thread receipt`);
    }
    if (node.state === "dispatch_pending" && node.nativeTaskReceipt !== undefined) {
      fail(`node ${node.id}: dispatch-pending node cannot claim native Task receipt`);
    }
    if (node.state === "running" && node.nativeTaskReceipt?.kind !== "native_task") {
      fail(`node ${node.id}: running node requires native Task receipt`);
    }
    if (node.state === "runnable" && node.dispatchReceipt !== undefined && node.nativeTaskReceipt?.kind !== "native_task") {
      fail(`node ${node.id}: runnable recovery requires native Task receipt`);
    }
    const pendingDependencies = node.dependsOn.filter((id) => nodeById.get(id).state !== "terminal");
    if (node.state === "waiting" && pendingDependencies.length === 0) {
      nonempty(node.stateReceipt, `node ${node.id}: waiting node without pending dependencies requires state receipt`);
    }
    if (["frozen", "needs_attention"].includes(node.state)) {
      nonempty(node.stateReceipt, `node ${node.id}.stateReceipt`);
    }
    if (!["waiting", "frozen", "needs_attention"].includes(node.state) && node.stateReceipt !== undefined) {
      fail(`node ${node.id}: state receipt does not match state`);
    }
    if (node.state === "terminal") nonempty(node.terminalReceipt, `node ${node.id}.terminalReceipt`);
    if (node.state !== "terminal" && node.terminalReceipt !== undefined) {
      fail(`node ${node.id}: nonterminal node cannot claim a terminal receipt`);
    }
    if (["runnable", "dispatch_pending", "running"].includes(node.state)) {
      if (pendingDependencies.length > 0) {
        fail(`node ${node.id}: active before dependencies terminal: ${pendingDependencies.join(", ")}`);
      }
    }
  }
  const visiting = new Set();
  const visited = new Set();
  function visit(id) {
    if (visiting.has(id)) fail(`nodes: dependency cycle at ${id}`);
    if (visited.has(id)) return;
    visiting.add(id);
    for (const dependency of nodeById.get(id).dependsOn) visit(dependency);
    visiting.delete(id);
    visited.add(id);
  }
  for (const id of nodeIds) visit(id);

  const dispatchCustody = new Map();
  const nativeCustody = new Map();
  const nativeIdentityCustody = new Map();
  const terminalCustody = new Map();
  for (const node of receipt.nodes) {
    if (node.dispatchReceipt) {
      const identity = canonical(node.dispatchReceipt);
      const prior = dispatchCustody.get(identity);
      if (prior) fail(`dispatch receipt reused by nodes: ${prior}, ${node.id}`);
      dispatchCustody.set(identity, node.id);
    }
    if (node.terminalReceipt) {
      const terminalPrior = terminalCustody.get(node.terminalReceipt);
      if (terminalPrior) fail(`terminal receipt reused by nodes: ${terminalPrior}, ${node.id}`);
      terminalCustody.set(node.terminalReceipt, node.id);
    }
    if (!node.nativeTaskReceipt) continue;
    const identity = canonical({ kind: node.nativeTaskReceipt.kind, locator: node.nativeTaskReceipt.locator });
    const prior = nativeCustody.get(identity);
    if (prior) fail(`native Task receipt reused by nodes: ${prior}, ${node.id}`);
    nativeCustody.set(identity, node.id);
    if (!legacy) {
      const nativeIdentity = canonical({ threadId: node.nativeTaskReceipt.threadId, hostId: node.nativeTaskReceipt.hostId });
      const identityPrior = nativeIdentityCustody.get(nativeIdentity);
      if (identityPrior) fail(`native Task identity reused by nodes: ${identityPrior}, ${node.id}`);
      nativeIdentityCustody.set(nativeIdentity, node.id);
    }
  }

  if (!legacy) {
    if (!Array.isArray(receipt.activeTargets)) fail("activeTargets: expected array");
    const targetNodes = new Set();
    const targetIdentities = new Set();
    for (const target of receipt.activeTargets) {
      const keys = new Set(["node", "threadId", "hostId", "cursor"]);
      exactKeys(target, keys, keys, "active target");
      for (const key of ["node", "threadId", "hostId"]) nonempty(target[key], `active target.${key}`);
      if (target.cursor !== null) nonempty(target.cursor, "active target.cursor");
      const node = nodeById.get(target.node);
      if (!node || node.state === "terminal" || node.nativeTaskReceipt?.kind !== "native_task") {
        fail(`active target ${target.node}: expected nonterminal node with native Task custody`);
      }
      if (target.threadId !== node.nativeTaskReceipt.threadId || target.hostId !== node.nativeTaskReceipt.hostId) {
        fail(`active target ${target.node}: native Task identity does not match node custody`);
      }
      if (targetNodes.has(target.node)) fail(`activeTargets: duplicate node ${target.node}`);
      targetNodes.add(target.node);
      const identity = canonical({ threadId: target.threadId, hostId: target.hostId });
      if (targetIdentities.has(identity)) fail(`activeTargets: duplicate native identity ${target.threadId}`);
      targetIdentities.add(identity);
    }
    for (const node of receipt.nodes) {
      if (node.state !== "terminal" && node.nativeTaskReceipt?.kind === "native_task" && !targetNodes.has(node.id)) {
        fail(`activeTargets: missing native Task node ${node.id}`);
      }
    }
    const observationKeys = new Set(["window", "transportFailure"]);
    exactKeys(receipt.observation, observationKeys, observationKeys, "observation");
    if (receipt.observation.window !== null) nonempty(receipt.observation.window, "observation.window");
    const failure = receipt.observation.transportFailure;
    if (failure !== null) {
      const failureKeys = new Set(["key", "count"]);
      exactKeys(failure, failureKeys, failureKeys, "observation.transportFailure");
      nonempty(failure.key, "observation.transportFailure.key");
      if (!Number.isInteger(failure.count) || failure.count < 1 || failure.count > 3) {
        fail("observation.transportFailure.count: expected integer from 1 through 3");
      }
      if (receipt.activeTargets.length === 0) fail("observation.transportFailure: active target required");
      if (receipt.observation.window === null) fail("observation.transportFailure: window required");
    }
  }

  const artifactIds = uniqueRows(receipt.artifacts, "artifacts");
  const artifactCustody = new Map();
  for (const artifact of receipt.artifacts) {
    exactKeys(
      artifact,
      new Set(["id", "kind", "owner", "locator", "identity", "disposition", "terminalReceipt"]),
      new Set(["id", "kind", "owner", "locator", "identity", "disposition"]),
      `artifact ${artifact.id}`,
    );
    if (!artifactKinds.has(artifact.kind)) fail(`artifact ${artifact.id}: invalid kind`);
    for (const key of ["owner", "locator", "identity"]) nonempty(artifact[key], `artifact ${artifact.id}.${key}`);
    if (!new Set(["retained", "terminal"]).has(artifact.disposition)) fail(`artifact ${artifact.id}: invalid disposition`);
    if (artifact.disposition === "terminal") nonempty(artifact.terminalReceipt, `artifact ${artifact.id}.terminalReceipt`);
    if (artifact.disposition === "retained" && artifact.terminalReceipt !== undefined) {
      fail(`artifact ${artifact.id}: retained artifact cannot claim terminal receipt`);
    }
    if (filesystemArtifactKinds.has(artifact.kind)) {
      const allowMissing = artifact.disposition === "terminal" || !requireRetainedFilesystem;
      await validateFilesystemLocator(artifact.locator, `artifact ${artifact.id}`, allowMissing);
    }
    const custody = canonical({ kind: artifact.kind, locator: artifact.locator });
    const prior = artifactCustody.get(custody);
    if (prior) fail(`artifact custody locator reused by rows: ${prior}, ${artifact.id}`);
    artifactCustody.set(custody, artifact.id);
  }
  exactKeys(
    receipt.next,
    new Set(["kind", "mode", "node", "owner", "predicate"]),
    new Set(["kind", "owner", "predicate"]),
    "next",
  );
  if (!nextKinds.has(receipt.next.kind)) fail("next.kind: invalid action");
  nonempty(receipt.next.owner, "next.owner");
  nonempty(receipt.next.predicate, "next.predicate");
  const runnable = receipt.nodes.filter((node) => node.state === "runnable");
  if (runnable.length > 0 && receipt.next.kind !== "dispatch") {
    fail(`runnable frontier must dispatch before ${receipt.next.kind}: ${runnable.map((node) => node.id).join(", ")}`);
  }
  if (receipt.next.kind === "dispatch") {
    nonempty(receipt.next.node, "next.node");
    const target = nodeById.get(receipt.next.node);
    if (target?.state !== "runnable") fail("next.node: expected runnable node");
    if (!dispatchModes.has(receipt.next.mode)) fail("next.mode: expected create or continue");
    const expectedMode = target.nativeTaskReceipt ? "continue" : "create";
    if (receipt.next.mode !== expectedMode) fail(`next.mode: expected ${expectedMode} for target custody`);
  } else if (receipt.next.node !== undefined || receipt.next.mode !== undefined) {
    fail("next.node and next.mode: allowed only for dispatch");
  }
  return { nodeIds, artifactIds };
}

function canonical(value) {
  if (Array.isArray(value)) return `[${value.map(canonical).join(",")}]`;
  if (value && typeof value === "object") {
    return `{${Object.keys(value).sort().map((key) => `${JSON.stringify(key)}:${canonical(value[key])}`).join(",")}}`;
  }
  return JSON.stringify(value);
}

async function readJson(path, label) {
  const info = await lstat(path);
  if (!info.isFile() || info.isSymbolicLink()) fail(`${label}: expected regular non-symlink file`);
  try {
    return JSON.parse(await readFile(path, "utf8"));
  } catch {
    fail(`${label}: expected valid JSON`);
  }
}

async function readCurrent(receiptDir) {
  const pointerPath = join(receiptDir, "current.json");
  let pointer;
  try {
    pointer = await readJson(pointerPath, "current pointer");
  } catch (error) {
    if (error.code === "ENOENT") return undefined;
    throw error;
  }
  const pointerKeys = new Set(["schema", "digest", "receipt"]);
  exactKeys(pointer, pointerKeys, pointerKeys, "current pointer");
  if (pointer.schema !== "hub-state-pointer/v1" || !/^sha256:[0-9a-f]{64}$/.test(pointer.digest)) {
    fail("current pointer: invalid identity");
  }
  if (basename(pointer.receipt) !== pointer.receipt || pointer.receipt !== `${pointer.digest.slice(7)}.json`) {
    fail("current pointer: invalid receipt locator");
  }
  const receipt = await readJson(join(receiptDir, pointer.receipt), "current receipt");
  const source = `${canonical(receipt)}\n`;
  const digest = `sha256:${createHash("sha256").update(source).digest("hex")}`;
  if (digest !== pointer.digest) fail("current pointer: digest mismatch");
  await validateReceipt(receipt, { allowLegacy: true });
  return { pointer, receipt, source };
}

function validateTransition(prior, next) {
  if (!prior) return;
  if (prior.mission !== next.mission) fail("transition: mission changed");
  if (canonical(prior.origin) !== canonical(next.origin)) fail("transition: origin changed");
  const nextNodes = new Map(next.nodes.map((node) => [node.id, node]));
  for (const node of prior.nodes) {
    const successor = nextNodes.get(node.id);
    if (!successor) fail(`transition: node disappeared without terminal custody: ${node.id}`);
    if (successor.owner !== node.owner || canonical(successor.dependsOn) !== canonical(node.dependsOn)) {
      fail(`transition: node ownership or dependencies changed: ${node.id}`);
    }
    if (node.dispatchReceipt !== undefined && canonical(successor.dispatchReceipt) !== canonical(node.dispatchReceipt)) {
      fail(`transition: consumed dispatch custody changed: ${node.id}.dispatchReceipt`);
    }
    if (node.nativeTaskReceipt !== undefined) {
      const migratedNativeReceipt = prior.schema === "hub-state-receipt/v1"
        ? { kind: successor.nativeTaskReceipt?.kind, locator: successor.nativeTaskReceipt?.locator }
        : successor.nativeTaskReceipt;
      if (canonical(migratedNativeReceipt) !== canonical(node.nativeTaskReceipt)) {
        fail(`transition: consumed dispatch custody changed: ${node.id}.nativeTaskReceipt`);
      }
    }
    if (node.state === "terminal") {
      const migratedTerminal = prior.schema === "hub-state-receipt/v1" && successor.nativeTaskReceipt
        ? {
            ...successor,
            nativeTaskReceipt: {
              kind: successor.nativeTaskReceipt.kind,
              locator: successor.nativeTaskReceipt.locator,
            },
          }
        : successor;
      if (canonical(migratedTerminal) !== canonical(node)) fail(`transition: terminal node changed: ${node.id}`);
    }
    if (node.state === "runnable" && successor.state === "waiting") {
      fail(`transition: runnable node returned to waiting before dispatch: ${node.id}`);
    }
  }
  const nextArtifacts = new Map(next.artifacts.map((artifact) => [artifact.id, artifact]));
  for (const artifact of prior.artifacts) {
    const successor = nextArtifacts.get(artifact.id);
    if (!successor) fail(`transition: artifact disappeared without terminal custody: ${artifact.id}`);
    if (successor.kind !== artifact.kind || successor.owner !== artifact.owner || successor.locator !== artifact.locator) {
      fail(`transition: artifact custody changed: ${artifact.id}`);
    }
    if (artifact.disposition === "terminal" && canonical(successor) !== canonical(artifact)) {
      fail(`transition: terminal artifact changed: ${artifact.id}`);
    }
  }
  if (prior.schema === "hub-state-receipt/v2") {
    const nextTargets = new Map(next.activeTargets.map((target) => [target.node, target]));
    for (const target of prior.activeTargets) {
      const successorNode = nextNodes.get(target.node);
      if (successorNode?.state === "terminal") continue;
      const successor = nextTargets.get(target.node);
      if (!successor || successor.threadId !== target.threadId || successor.hostId !== target.hostId) {
        fail(`transition: active native Task identity changed: ${target.node}`);
      }
      if (target.cursor !== null && successor.cursor === null) {
        fail(`transition: active native Task cursor regressed to null: ${target.node}`);
      }
    }
    const continuity = (targets, includeCursor) => canonical(
      targets
        .map((target) => ({
          node: target.node,
          threadId: target.threadId,
          hostId: target.hostId,
          ...(includeCursor ? { cursor: target.cursor } : {}),
        }))
        .sort((left, right) => left.node.localeCompare(right.node)),
    );
    const sameTargetSet = continuity(prior.activeTargets, false) === continuity(next.activeTargets, false);
    const nextFailure = next.observation.transportFailure;
    if (!sameTargetSet && nextFailure !== null) {
      fail("transition: transport failure must clear after active target change");
    }
    if (sameTargetSet && nextFailure !== null) {
      if (continuity(prior.activeTargets, true) !== continuity(next.activeTargets, true)) {
        fail("transition: transport failure cannot advance a cursor");
      }
      const priorFailure = prior.observation.transportFailure;
      if (priorFailure === null || priorFailure.key !== nextFailure.key) {
        if (nextFailure.count !== 1) fail("transition: new transport failure count must start at one");
      } else {
        const maximum = Math.min(priorFailure.count + 1, 3);
        if (nextFailure.count < priorFailure.count || nextFailure.count > maximum) {
          fail("transition: transport failure count must be retained or incremented once");
        }
        if (nextFailure.count > priorFailure.count && next.observation.window === prior.observation.window) {
          fail("transition: transport failure count cannot increment in the same window");
        }
      }
    }
  }
}

async function acquireLock(receiptDir) {
  const lockPath = join(receiptDir, ".advance.lock");
  try {
    await mkdir(lockPath, { mode: 0o700 });
  } catch (error) {
    if (error.code === "EEXIST") fail("receipt transition is locked");
    throw error;
  }
  return lockPath;
}

async function validateReceiptPath(receiptRoot, receiptDir, allowMissing) {
  const ancestry = [];
  for (let current = receiptRoot; ; current = dirname(current)) {
    ancestry.push(current);
    if (dirname(current) === current) break;
  }
  for (const component of ancestry.reverse()) {
    const info = await lstat(component);
    if (info.isSymbolicLink()) fail("receipt root ancestry contains a symlink");
    if (!info.isDirectory()) fail("receipt root ancestry contains a non-directory");
  }
  const child = relative(receiptRoot, receiptDir);
  if (!child || child === ".." || child.startsWith(`..${sep}`) || isAbsolute(child)) {
    fail("receipt directory must be a child of receipt root");
  }
  let current = receiptRoot;
  for (const part of child.split(sep)) {
    current = join(current, part);
    let info;
    try {
      info = await lstat(current);
    } catch (error) {
      if (allowMissing && error.code === "ENOENT") return;
      throw error;
    }
    if (info.isSymbolicLink()) fail("receipt path contains a symlink");
    if (!info.isDirectory()) fail("receipt path contains a non-directory");
  }
}

async function advance(options) {
  await validateReceiptPath(options.receiptRoot, options.receiptDir, true);
  await mkdir(options.receiptDir, { recursive: true, mode: 0o700 });
  await validateReceiptPath(options.receiptRoot, options.receiptDir, false);
  const next = await readJson(options.input, "input");
  await validateReceipt(next, { requireRetainedFilesystem: true });
  let lockPath;
  try {
    lockPath = await acquireLock(options.receiptDir);
    const current = await readCurrent(options.receiptDir);
    const expected = options.expectPrior ?? "";
    const actual = current?.pointer.digest ?? "none";
    if (!expected || expected !== actual) fail(`stale prior: expected ${expected || "<missing>"}, current ${actual}`);
    if (!current) {
      const existingReceipts = (await readdir(options.receiptDir)).filter((name) => /^[0-9a-f]{64}\.json$/.test(name));
      if (existingReceipts.length > 0) fail("receipt directory was already initialized");
    }
    validateTransition(current?.receipt, next);
    const source = `${canonical(next)}\n`;
    const digestHex = createHash("sha256").update(source).digest("hex");
    const digest = `sha256:${digestHex}`;
    const receiptName = `${digestHex}.json`;
    const receiptPath = join(options.receiptDir, receiptName);
    try {
      const receiptInfo = await lstat(receiptPath);
      if (!receiptInfo.isFile() || receiptInfo.isSymbolicLink()) {
        fail("receipt file must be a regular non-symlink file");
      }
      const existing = await readFile(receiptPath, "utf8");
      if (existing !== source) fail("content-addressed receipt collision");
    } catch (error) {
      if (error.code !== "ENOENT") throw error;
      await writeFile(receiptPath, source, { encoding: "utf8", flag: "wx", mode: 0o600 });
    }
    const pointer = `${canonical({ schema: "hub-state-pointer/v1", digest, receipt: receiptName })}\n`;
    const temporary = join(options.receiptDir, `.current.${process.pid}.tmp`);
    await writeFile(temporary, pointer, { encoding: "utf8", flag: "wx", mode: 0o600 });
    await rename(temporary, join(options.receiptDir, "current.json"));
    process.stdout.write(`${digest}\n`);
  } finally {
    if (lockPath) await rmdir(lockPath);
  }
}

async function verify(options) {
  let lockPath;
  try {
    await validateReceiptPath(options.receiptRoot, options.receiptDir, false);
    lockPath = await acquireLock(options.receiptDir);
    const current = await readCurrent(options.receiptDir);
    if (!current) fail("current receipt is unavailable");
    await validateReceipt(current.receipt, { requireRetainedFilesystem: true });
    if (options.expectPrior && options.expectPrior !== current.pointer.digest) {
      fail(`stale prior: expected ${options.expectPrior}, current ${current.pointer.digest}`);
    }
    process.stdout.write(`${current.pointer.digest}\n`);
  } finally {
    if (lockPath) await rmdir(lockPath);
  }
}

const options = parseArguments(process.argv.slice(2));
await (options.command === "advance" ? advance(options) : verify(options));
