#!/usr/bin/env node

import { createHash } from "node:crypto";
import { isUtf8 } from "node:buffer";
import { lstat, mkdir, readFile, readdir, realpath, rename, rmdir, writeFile } from "node:fs/promises";
import { basename, dirname, isAbsolute, join, relative, resolve, sep } from "node:path";

const digestPattern = /^sha256:[0-9a-f]{64}$/;
const objectIdPattern = /^[0-9a-f]{40}$/;
const activeStates = new Set(["waiting", "runnable", "dispatch_pending", "running", "frozen", "needs_attention"]);
const artifactKinds = new Set(["candidate", "worktree", "branch", "pr", "cache", "checkout"]);
const filesystemArtifactKinds = new Set(["worktree", "cache", "checkout"]);
const nextKinds = new Set(["dispatch", "observe", "fan_in", "mutate", "review", "gate", "finalize"]);
const dispatchKinds = new Set(["client_thread", "native_task"]);
const dispatchModes = new Set(["create", "continue"]);
const inactiveLegacyStates = new Set(["frozen", "needs_attention"]);
const maximumReceiptBytes = 256 * 1024;
const maximumManifestDepth = 4096;

function fail(message) {
  throw new Error(message);
}

function canonical(value) {
  if (Array.isArray(value)) return `[${value.map(canonical).join(",")}]`;
  if (value && typeof value === "object") {
    return `{${Object.keys(value).sort().map((key) => `${JSON.stringify(key)}:${canonical(value[key])}`).join(",")}}`;
  }
  return JSON.stringify(value);
}

function canonicalLine(value) {
  return `${canonical(value)}\n`;
}

function digest(source) {
  return `sha256:${createHash("sha256").update(source).digest("hex")}`;
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

function parseArguments(argv) {
  const [command, ...rest] = argv;
  const options = { command };
  for (let index = 0; index < rest.length; index += 1) {
    const value = rest[index];
    if (value === "--receipt-root") options.receiptRoot = rest[++index] ?? "";
    else if (value === "--receipt-dir") options.receiptDir = rest[++index] ?? "";
    else if (value === "--input") options.input = rest[++index] ?? "";
    else if (value === "--expect-prior") options.expectPrior = rest[++index] ?? "";
    else if (value === "--manifest") options.manifest = rest[++index] ?? "";
    else fail(`unknown argument: ${value}`);
  }
  if (!new Set(["advance", "verify", "restore"]).has(command) || !options.receiptRoot || !options.receiptDir) {
    fail("usage: continuity-receipt.mjs <advance|verify|restore> --receipt-root <absolute> --receipt-dir <absolute-child> [--input <absolute> --expect-prior <sha256:...|none>] [--manifest <sha256:...>]");
  }
  if (!isAbsolute(options.receiptRoot) || !isAbsolute(options.receiptDir) ||
      (command === "advance" && !isAbsolute(options.input))) {
    fail("absolute paths are required");
  }
  if (command === "advance" && (!options.expectPrior ||
      (options.expectPrior !== "none" && !digestPattern.test(options.expectPrior)))) {
    fail("advance requires --expect-prior <sha256:...|none>");
  }
  if (command === "restore" && !digestPattern.test(options.manifest ?? "")) {
    fail("restore requires --manifest <sha256:...>");
  }
  if (options.expectPrior !== undefined && options.expectPrior !== "none" &&
      !digestPattern.test(options.expectPrior)) fail("expect-prior: invalid digest");
  options.receiptRoot = resolve(options.receiptRoot);
  options.receiptDir = resolve(options.receiptDir);
  if (options.input) options.input = resolve(options.input);
  return options;
}

async function validatePath(root, target, allowMissing) {
  const ancestry = [];
  for (let current = root; ; current = dirname(current)) {
    ancestry.push(current);
    if (dirname(current) === current) break;
  }
  for (const component of ancestry.reverse()) {
    const info = await lstat(component);
    if (info.isSymbolicLink()) fail("receipt root ancestry contains a symlink");
    if (!info.isDirectory()) fail("receipt root ancestry contains a non-directory");
  }
  const child = relative(root, target);
  if (!child || child === ".." || child.startsWith(`..${sep}`) || isAbsolute(child)) {
    fail("receipt directory must be a child of receipt root");
  }
  let current = root;
  for (const part of child.split(sep)) {
    current = join(current, part);
    try {
      const info = await lstat(current);
      if (info.isSymbolicLink()) fail("receipt path contains a symlink");
      if (!info.isDirectory()) fail("receipt path contains a non-directory");
    } catch (error) {
      if (allowMissing && error.code === "ENOENT") return;
      throw error;
    }
  }
}

async function readRegular(path, label) {
  const info = await lstat(path);
  if (!info.isFile() || info.isSymbolicLink()) fail(`${label}: expected regular non-symlink file`);
  const bytes = await readFile(path);
  if (!isUtf8(bytes)) fail(`${label}: expected valid UTF-8`);
  return bytes.toString("utf8");
}

async function physicalChildDirectory(receiptDir, name, { create = false } = {}) {
  const directory = join(receiptDir, name);
  await validatePath(receiptDir, directory, true);
  if (create) {
    try {
      await mkdir(directory, { mode: 0o700 });
    } catch (error) {
      if (error.code !== "EEXIST") throw error;
    }
  }
  await validatePath(receiptDir, directory, false);
  return directory;
}

async function readClosureMember(receiptDir, directoryName, memberName, label) {
  const directory = await physicalChildDirectory(receiptDir, directoryName);
  return readRegular(join(directory, memberName), label);
}

function parseJson(source, label) {
  try {
    return JSON.parse(source);
  } catch {
    fail(`${label}: expected valid JSON`);
  }
}

async function validateFilesystemLocator(locator, label, { allowMissing = false } = {}) {
  if (!isAbsolute(locator) || resolve(locator) !== locator) {
    fail(`${label}: filesystem locator must be a canonical absolute path`);
  }
  let existing = locator;
  while (true) {
    try {
      const info = await lstat(existing);
      if (info.isSymbolicLink()) fail(`${label}: filesystem locator must not contain a symlink`);
      if (await realpath(existing) !== existing) {
        fail(`${label}: filesystem locator must be a physical canonical path`);
      }
      return;
    } catch (error) {
      if (!allowMissing || error.code !== "ENOENT") throw error;
      const parent = resolve(existing, "..");
      if (parent === existing) throw error;
      existing = parent;
    }
  }
}

async function validateIncomingTerminalArtifacts(classification) {
  for (const artifact of classification.parts.artifacts) {
    if (artifact.disposition !== "terminal" || !filesystemArtifactKinds.has(artifact.kind)) continue;
    await validateFilesystemLocator(
      artifact.locator,
      `terminal artifact ${artifact.id}`,
      { allowMissing: true },
    );
  }
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

function selected(value, keys) {
  return Object.fromEntries(keys.filter((key) => value[key] !== undefined).map((key) => [key, value[key]]));
}

function projectNode(node) {
  return selected(node, [
    "id", "state", "owner", "dependsOn", "dispatchReceipt", "nativeTaskReceipt",
    "legacyV1TaskReceipt", "stateReceipt",
  ]);
}

function projectArtifact(artifact) {
  return selected(artifact, ["id", "kind", "owner", "locator", "identity", "disposition"]);
}

function validateDispatchReceipt(value, label, { requireTargetIdentity = false } = {}) {
  const keys = requireTargetIdentity
    ? new Set(["kind", "locator", "threadId", "hostId"])
    : new Set(["kind", "locator"]);
  exactKeys(value, keys, keys, label);
  if (!dispatchKinds.has(value.kind)) fail(`${label}.kind: invalid dispatch identity`);
  nonempty(value.locator, `${label}.locator`);
  if (requireTargetIdentity) {
    if (value.kind !== "native_task") fail(`${label}.kind: expected native_task`);
    nonempty(value.threadId, `${label}.threadId`);
    nonempty(value.hostId, `${label}.hostId`);
  }
}

function effectIdentity(value) {
  return digest(canonical({ kind: value.kind, locator: value.locator }));
}

function nativeTargetIdentity(value) {
  return digest(canonical({ hostId: value.hostId, threadId: value.threadId }));
}

function artifactCustodyIdentity(value) {
  return digest(canonical({ kind: value.kind, locator: value.locator }));
}

function terminalReceiptIdentity(value) {
  return digest(canonical(value));
}

function signalIdentity(value) {
  return digest(canonical({ locator: value.locator, ownerReceipt: value.ownerReceipt }));
}

function projectionParts(projection, { strict = false } = {}) {
  if (!projection || typeof projection !== "object" || Array.isArray(projection)) {
    fail("input: expected object");
  }
  nonempty(projection.schema, "input.schema");
  nonempty(projection.mission, "input.mission");
  const origin = projection.origin;
  exactKeys(origin, new Set(["repository", "commit", "tree"]), new Set(["repository", "commit", "tree"]), "origin");
  nonempty(origin.repository, "origin.repository");
  if (!objectIdPattern.test(origin.commit) || !objectIdPattern.test(origin.tree)) fail("origin: invalid commit or tree");
  const observation = projection.observation;
  if (observation !== undefined && (!observation || typeof observation !== "object" || Array.isArray(observation))) {
    fail("observation: expected object");
  }
  if (observation?.window !== undefined && observation.window !== null) {
    nonempty(observation.window, "observation.window");
    if (!("transportFailure" in observation)) {
      fail("observation: a window must explicitly include transportFailure");
    }
  }

  if (projection.schema === "continuity-receipt/v2") {
    const receiptKeys = new Set(["schema", "mission", "origin", "activeTargets", "transportFailure", "signal", "custody", "closureManifest", "next"]);
    if (strict) exactKeys(projection, receiptKeys, receiptKeys, "receipt");
    else {
      const missing = [...receiptKeys].filter((key) => !(key in projection));
      if (missing.length > 0) fail(`receipt: missing members: ${missing.join(", ")}`);
    }
    exactKeys(projection.custody, new Set(["nodes", "artifacts"]), new Set(["nodes", "artifacts"]), "custody");
    return {
      nodes: projection.custody.nodes,
      artifacts: projection.custody.artifacts,
      activeTargets: projection.activeTargets,
      transportFailure: observation && "transportFailure" in observation
        ? observation.transportFailure
        : projection.transportFailure,
      observationWindow: observation?.window ?? null,
      signal: projection.signal,
      next: projection.next,
      priorManifest: projection.closureManifest,
    };
  }

  if (!new Set(["hub-state-receipt/v1", "hub-state-receipt/v2"]).has(projection.schema)) {
    fail(`input: unsupported schema ${projection.schema}`);
  }
  return {
    nodes: projection.nodes,
    artifacts: projection.artifacts,
    activeTargets: projection.activeTargets ?? [],
    transportFailure: projection.observation?.transportFailure ?? null,
    observationWindow: projection.observation?.window ?? null,
    signal: projection.signal ?? null,
    next: projection.next,
    priorManifest: null,
  };
}

function classifyProjection(projection) {
  const parts = projectionParts(projection);
  const sourceNodeIds = uniqueRows(parts.nodes, "nodes");
  uniqueRows(parts.artifacts, "artifacts");
  const dispatchOwners = new Map();
  const nativeOwners = new Map();
  const nativeTargetOwners = new Map();
  const artifactCustodyOwners = new Map();
  const nodeTerminalReceiptOwners = new Map();
  const artifactTerminalReceiptOwners = new Map();
  if (parts.signal !== null) {
    exactKeys(parts.signal, new Set(["locator", "ownerReceipt", "effectReceipt"]), new Set(["locator", "ownerReceipt", "effectReceipt"]), "signal");
    nonempty(parts.signal.locator, "signal.locator");
    nonempty(parts.signal.ownerReceipt, "signal.ownerReceipt");
    if (parts.signal.effectReceipt !== null) nonempty(parts.signal.effectReceipt, "signal.effectReceipt");
  }
  if (parts.transportFailure !== null) {
    exactKeys(parts.transportFailure, new Set(["key", "count"]), new Set(["key", "count"]), "transportFailure");
    nonempty(parts.transportFailure.key, "transportFailure.key");
    if (!Number.isInteger(parts.transportFailure.count) ||
        parts.transportFailure.count < 1 || parts.transportFailure.count > 3) {
      fail("transportFailure.count: expected an integer from 1 through 3");
    }
    const isPersistedRepeatedFailure = projection.schema === "continuity-receipt/v2" &&
      parts.transportFailure.count >= 2;
    if (parts.observationWindow === null && !isPersistedRepeatedFailure) {
      fail("transportFailure: active failure requires an observation window");
    }
  }
  for (const node of parts.nodes) {
    if (node.state !== "terminal" && !activeStates.has(node.state)) fail(`node ${node.id}: invalid state`);
    nonempty(node.owner, `node ${node.id}.owner`);
    if (!Array.isArray(node.dependsOn) || node.dependsOn.some((id) => typeof id !== "string" || !id)) {
      fail(`node ${node.id}.dependsOn: expected string array`);
    }
    if (new Set(node.dependsOn).size !== node.dependsOn.length || node.dependsOn.includes(node.id)) {
      fail(`node ${node.id}: duplicate or self dependency`);
    }
    if (node.state === "terminal") {
      nonempty(node.terminalReceipt, `node ${node.id}.terminalReceipt`);
      const identity = terminalReceiptIdentity(node.terminalReceipt);
      if (nodeTerminalReceiptOwners.has(identity)) {
        fail(`nodes: terminal receipt reused by ${nodeTerminalReceiptOwners.get(identity)}, ${node.id}`);
      }
      nodeTerminalReceiptOwners.set(identity, node.id);
    }
    if (node.state !== "terminal" && node.terminalReceipt !== undefined) {
      fail(`node ${node.id}: nonterminal node cannot claim a terminal receipt`);
    }
    if (node.dispatchReceipt !== undefined) {
      validateDispatchReceipt(node.dispatchReceipt, `node ${node.id}.dispatchReceipt`);
      const identity = effectIdentity(node.dispatchReceipt);
      if (dispatchOwners.has(identity)) fail(`nodes: dispatch identity reused by ${dispatchOwners.get(identity)}, ${node.id}`);
      dispatchOwners.set(identity, node.id);
    }
    if (node.nativeTaskReceipt !== undefined) {
      const terminalV1 = projection.schema === "hub-state-receipt/v1" && node.state === "terminal";
      if (projection.schema === "hub-state-receipt/v1" && !terminalV1) {
        fail(`node ${node.id}: active legacy v1 native identity requires the existing v1-to-v2 migration first`);
      }
      validateDispatchReceipt(node.nativeTaskReceipt, `node ${node.id}.nativeTaskReceipt`, {
        requireTargetIdentity: !terminalV1,
      });
      if (node.dispatchReceipt === undefined) fail(`node ${node.id}: native Task receipt requires dispatch custody`);
      const identity = effectIdentity(node.nativeTaskReceipt);
      if (nativeOwners.has(identity)) fail(`nodes: native Task receipt reused by ${nativeOwners.get(identity)}, ${node.id}`);
      nativeOwners.set(identity, node.id);
      if (!terminalV1) {
        const targetIdentity = nativeTargetIdentity(node.nativeTaskReceipt);
        if (nativeTargetOwners.has(targetIdentity)) {
          fail(`nodes: native Task target reused by ${nativeTargetOwners.get(targetIdentity)}, ${node.id}`);
        }
        nativeTargetOwners.set(targetIdentity, node.id);
      }
    }
    if (node.legacyV1TaskReceipt !== undefined) {
      if (node.nativeTaskReceipt !== undefined) fail(`node ${node.id}: native and legacy Task receipts are mutually exclusive`);
      validateDispatchReceipt(node.legacyV1TaskReceipt, `node ${node.id}.legacyV1TaskReceipt`);
      const identity = effectIdentity(node.legacyV1TaskReceipt);
      if (nativeOwners.has(identity)) fail(`nodes: native Task receipt reused by ${nativeOwners.get(identity)}, ${node.id}`);
      nativeOwners.set(identity, node.id);
    }
  }
  const sourceNodes = new Map(parts.nodes.map((node) => [node.id, node]));
  const visiting = new Set();
  const visited = new Set();
  function visit(id) {
    if (visiting.has(id)) fail(`nodes: dependency cycle at ${id}`);
    if (visited.has(id)) return;
    visiting.add(id);
    for (const dependency of sourceNodes.get(id).dependsOn) if (sourceNodeIds.has(dependency)) visit(dependency);
    visiting.delete(id);
    visited.add(id);
  }
  for (const id of sourceNodeIds) visit(id);
  for (const artifact of parts.artifacts) {
    if (!new Set(["retained", "terminal"]).has(artifact.disposition)) fail(`artifact ${artifact.id}: invalid disposition`);
    for (const key of ["kind", "owner", "locator", "identity"]) nonempty(artifact[key], `artifact ${artifact.id}.${key}`);
    if (!artifactKinds.has(artifact.kind)) fail(`artifact ${artifact.id}: invalid kind`);
    if (filesystemArtifactKinds.has(artifact.kind) &&
        (!isAbsolute(artifact.locator) || resolve(artifact.locator) !== artifact.locator)) {
      fail(`artifact ${artifact.id}: filesystem locator must be a canonical absolute path`);
    }
    const custodyIdentity = artifactCustodyIdentity(artifact);
    if (artifactCustodyOwners.has(custodyIdentity)) {
      fail(`artifacts: custody identity reused by ${artifactCustodyOwners.get(custodyIdentity)}, ${artifact.id}`);
    }
    artifactCustodyOwners.set(custodyIdentity, artifact.id);
    if (artifact.disposition === "terminal") {
      nonempty(artifact.terminalReceipt, `artifact ${artifact.id}.terminalReceipt`);
      const receiptIdentity = terminalReceiptIdentity(artifact.terminalReceipt);
      if (artifactTerminalReceiptOwners.has(receiptIdentity)) {
        fail(`artifacts: terminal receipt reused by ${artifactTerminalReceiptOwners.get(receiptIdentity)}, ${artifact.id}`);
      }
      artifactTerminalReceiptOwners.set(receiptIdentity, artifact.id);
    }
    if (artifact.disposition !== "terminal" && artifact.terminalReceipt !== undefined) {
      fail(`artifact ${artifact.id}: retained artifact cannot claim a terminal receipt`);
    }
  }
  const nodes = parts.nodes.filter((node) => node.state !== "terminal").map(projectNode);
  const artifacts = parts.artifacts.filter((artifact) => artifact.disposition !== "terminal").map(projectArtifact);
  const terminalNodes = parts.nodes.filter((node) => node.state === "terminal");
  return {
    parts,
    nodes,
    artifacts,
    closedNodeIds: parts.nodes.filter((node) => node.state === "terminal").map((node) => node.id),
    closedArtifactIds: parts.artifacts.filter((artifact) => artifact.disposition === "terminal").map((artifact) => artifact.id),
    closedArtifactCustodyIds: parts.artifacts
      .filter((artifact) => artifact.disposition === "terminal")
      .map(artifactCustodyIdentity),
    closedNodeTerminalReceiptIds: terminalNodes.map((node) => terminalReceiptIdentity(node.terminalReceipt)),
    closedArtifactTerminalReceiptIds: parts.artifacts
      .filter((artifact) => artifact.disposition === "terminal")
      .map((artifact) => terminalReceiptIdentity(artifact.terminalReceipt)),
    closedSignalIds: parts.signal !== null && parts.signal.effectReceipt !== null
      ? [signalIdentity(parts.signal)]
      : [],
    closedDispatchReceiptIds: terminalNodes
      .filter((node) => node.dispatchReceipt !== undefined)
      .map((node) => effectIdentity(node.dispatchReceipt)),
    closedNativeTaskReceiptIds: terminalNodes
      .filter((node) => node.nativeTaskReceipt !== undefined)
      .map((node) => effectIdentity(node.nativeTaskReceipt)),
    closedLegacyTaskReceiptIds: terminalNodes
      .filter((node) => node.legacyV1TaskReceipt !== undefined)
      .map((node) => effectIdentity(node.legacyV1TaskReceipt)),
    closedNativeTargetIds: terminalNodes
      .filter((node) => node.nativeTaskReceipt?.threadId !== undefined && node.nativeTaskReceipt?.hostId !== undefined)
      .map((node) => nativeTargetIdentity(node.nativeTaskReceipt)),
  };
}

function makeManifest(projection, source, classification) {
  const known = projection.schema === "continuity-receipt/v2"
    ? new Set(["schema", "mission", "origin", "activeTargets", "transportFailure", "signal", "custody", "closureManifest", "next"])
    : new Set(["schema", "mission", "origin", "nodes", "artifacts", "activeTargets", "observation", "next"]);
  return {
    schema: "continuity-closure-manifest/v1",
    archive: { digest: digest(source), bytes: Buffer.byteLength(source), mediaType: "application/json" },
    priorManifest: classification.parts.priorManifest,
    source: {
      schema: projection.schema,
      mission: projection.mission,
      origin: projection.origin,
      nodes: classification.parts.nodes.length,
      artifacts: classification.parts.artifacts.length,
      unknownMembers: Object.keys(projection).filter((key) => !known.has(key)).sort(),
    },
    retained: {
      nodes: classification.nodes.map((node) => node.id),
      artifacts: classification.artifacts.map((artifact) => artifact.id),
    },
    closed: {
      nodes: classification.closedNodeIds,
      artifacts: classification.closedArtifactIds,
      artifactCustody: classification.closedArtifactCustodyIds,
      nodeTerminalReceipts: classification.closedNodeTerminalReceiptIds,
      artifactTerminalReceipts: classification.closedArtifactTerminalReceiptIds,
      signals: classification.closedSignalIds,
    },
    closedEffects: {
      dispatch: classification.closedDispatchReceiptIds,
      nativeTasks: classification.closedNativeTaskReceiptIds,
      legacyTasks: classification.closedLegacyTaskReceiptIds,
      nativeTargets: classification.closedNativeTargetIds,
    },
  };
}

function buildReceipt(projection, classification, manifestDigest) {
  const repeatedFailure = Number.isInteger(classification.parts.transportFailure?.count) &&
    classification.parts.transportFailure.count >= 2
    ? classification.parts.transportFailure
    : null;
  return {
    schema: "continuity-receipt/v2",
    mission: projection.mission,
    origin: projection.origin,
    activeTargets: classification.parts.activeTargets,
    transportFailure: repeatedFailure,
    signal: classification.parts.signal?.effectReceipt === null ? classification.parts.signal : null,
    custody: { nodes: classification.nodes, artifacts: classification.artifacts },
    closureManifest: manifestDigest,
    next: classification.parts.next,
  };
}

async function validateReceipt(receipt, source, {
  closedNodeIds = null,
  closedArtifactIds = null,
  closedArtifactCustody = null,
  closedDispatchReceipts = null,
  closedNativeTaskReceipts = null,
  closedLegacyTaskReceipts = null,
  closedNativeTargets = null,
  closedSignals = null,
  validateFilesystemArtifacts = true,
} = {}) {
  projectionParts(receipt, { strict: true });
  if (Buffer.byteLength(source) > maximumReceiptBytes) {
    fail(`continuity receipt exceeds ${maximumReceiptBytes} bytes`);
  }
  if (source !== canonicalLine(receipt)) fail("continuity receipt is not canonical JSON-LF");
  if (!digestPattern.test(receipt.closureManifest)) fail("closureManifest: invalid digest");
  if (!Array.isArray(receipt.activeTargets) || receipt.activeTargets.length > 512) {
    fail("activeTargets: expected at most 512 rows");
  }
  const nodeIds = uniqueRows(receipt.custody.nodes, "custody.nodes");
  const nodeById = new Map(receipt.custody.nodes.map((node) => [node.id, node]));
  if (nodeIds.size > 512) fail("custody.nodes: exceeds 512 unfinished rows");
  const dispatchCustody = new Map();
  const nativeCustody = new Map();
  const visiting = new Set();
  const visited = new Set();
  for (const node of receipt.custody.nodes) {
    exactKeys(
      node,
      new Set(["id", "state", "owner", "dependsOn", "dispatchReceipt", "nativeTaskReceipt", "legacyV1TaskReceipt", "stateReceipt"]),
      new Set(["id", "state", "owner", "dependsOn"]),
      `custody node ${node.id}`,
    );
    if (!activeStates.has(node.state)) fail(`custody node ${node.id}: terminal or invalid state in hot receipt`);
    if (closedNodeIds?.has(node.id)) fail(`custody node ${node.id}: archived terminal identity cannot reopen`);
    nonempty(node.owner, `custody node ${node.id}.owner`);
    if (!Array.isArray(node.dependsOn) || node.dependsOn.some((id) => typeof id !== "string" || !id)) {
      fail(`custody node ${node.id}.dependsOn: expected string array`);
    }
    if (new Set(node.dependsOn).size !== node.dependsOn.length || node.dependsOn.includes(node.id)) {
      fail(`custody node ${node.id}: duplicate or self dependency`);
    }
    if (closedNodeIds && node.dependsOn.some((id) => !nodeById.has(id) && !closedNodeIds.has(id))) {
      fail(`custody node ${node.id}: dependency lacks archived terminal evidence`);
    }
    if (node.dispatchReceipt !== undefined) {
      validateDispatchReceipt(node.dispatchReceipt, `custody node ${node.id}.dispatchReceipt`);
      if (closedDispatchReceipts?.has(effectIdentity(node.dispatchReceipt))) {
        fail(`custody node ${node.id}: archived dispatch identity cannot reopen`);
      }
    }
    if (node.nativeTaskReceipt !== undefined) {
      validateDispatchReceipt(node.nativeTaskReceipt, `custody node ${node.id}.nativeTaskReceipt`, { requireTargetIdentity: true });
      if (closedNativeTaskReceipts?.has(effectIdentity(node.nativeTaskReceipt)) ||
          closedLegacyTaskReceipts?.has(effectIdentity(node.nativeTaskReceipt))) {
        fail(`custody node ${node.id}: archived native or legacy Task identity cannot reopen`);
      }
      if (closedNativeTargets?.has(nativeTargetIdentity(node.nativeTaskReceipt))) {
        fail(`custody node ${node.id}: archived native Task target identity cannot reopen`);
      }
      if (node.dispatchReceipt === undefined) fail(`custody node ${node.id}: native Task receipt requires dispatch custody`);
    }
    if (node.legacyV1TaskReceipt !== undefined) {
      if (node.nativeTaskReceipt !== undefined) {
        fail(`custody node ${node.id}: native and legacy Task receipts are mutually exclusive`);
      }
      validateDispatchReceipt(node.legacyV1TaskReceipt, `custody node ${node.id}.legacyV1TaskReceipt`);
      const identity = effectIdentity(node.legacyV1TaskReceipt);
      if (closedNativeTaskReceipts?.has(identity) || closedLegacyTaskReceipts?.has(identity)) {
        fail(`custody node ${node.id}: archived legacy Task identity cannot reopen`);
      }
      if (node.legacyV1TaskReceipt.kind !== "native_task" || node.dispatchReceipt === undefined || !inactiveLegacyStates.has(node.state)) {
        fail(`custody node ${node.id}: legacy v1 custody must be inactive and dispatched`);
      }
    }
    if (node.state === "dispatch_pending" && node.dispatchReceipt?.kind !== "client_thread") {
      fail(`custody node ${node.id}: dispatch-pending requires client thread receipt`);
    }
    if (node.state === "dispatch_pending" && node.nativeTaskReceipt !== undefined) {
      fail(`custody node ${node.id}: dispatch-pending cannot claim native Task receipt`);
    }
    if (node.state === "running" && !node.nativeTaskReceipt) {
      fail(`custody node ${node.id}: running requires native Task receipt`);
    }
    if (node.state === "runnable" && node.dispatchReceipt !== undefined && node.nativeTaskReceipt === undefined) {
      fail(`custody node ${node.id}: runnable recovery requires native Task receipt`);
    }
    if (["waiting", "frozen", "needs_attention"].includes(node.state)) {
      const requiresReceipt = node.state !== "waiting" || node.dependsOn.every((id) => !nodeById.has(id));
      if (requiresReceipt || node.stateReceipt !== undefined) {
        nonempty(node.stateReceipt, `custody node ${node.id}: state requires owner receipt locator`);
      }
    } else if (node.stateReceipt !== undefined) {
      fail(`custody node ${node.id}: state receipt does not match state`);
    }
    if (["runnable", "dispatch_pending", "running"].includes(node.state) &&
        node.dependsOn.some((id) => nodeById.has(id))) {
      fail(`custody node ${node.id}: active before unfinished dependency`);
    }
    if (node.dispatchReceipt !== undefined) {
      const identity = canonical(node.dispatchReceipt);
      if (dispatchCustody.has(identity)) fail(`dispatch receipt reused by nodes: ${dispatchCustody.get(identity)}, ${node.id}`);
      dispatchCustody.set(identity, node.id);
    }
    const taskReceipt = node.nativeTaskReceipt ?? node.legacyV1TaskReceipt;
    if (taskReceipt !== undefined) {
      const identity = canonical({ kind: taskReceipt.kind, locator: taskReceipt.locator });
      if (nativeCustody.has(identity)) fail(`native Task receipt reused by nodes: ${nativeCustody.get(identity)}, ${node.id}`);
      nativeCustody.set(identity, node.id);
    }
  }
  function visit(id) {
    if (visiting.has(id)) fail(`custody.nodes: dependency cycle at ${id}`);
    if (visited.has(id)) return;
    visiting.add(id);
    for (const dependency of nodeById.get(id).dependsOn) if (nodeById.has(dependency)) visit(dependency);
    visiting.delete(id);
    visited.add(id);
  }
  for (const id of nodeIds) visit(id);
  const targetIds = new Set();
  const targetIdentities = new Set();
  for (const target of receipt.activeTargets) {
    exactKeys(target, new Set(["node", "threadId", "hostId", "cursor"]), new Set(["node", "threadId", "hostId", "cursor"]), "active target");
    for (const key of ["node", "threadId", "hostId"]) nonempty(target[key], `active target.${key}`);
    if (target.cursor !== null) nonempty(target.cursor, "active target.cursor");
    const node = nodeById.get(target.node);
    if (!node) fail(`active target ${target.node}: missing unfinished custody`);
    const task = node.nativeTaskReceipt;
    if (!task || task.threadId !== target.threadId || task.hostId !== target.hostId) {
      fail(`active target ${target.node}: native Task identity does not match custody`);
    }
    if (targetIds.has(target.node)) fail(`activeTargets: duplicate node ${target.node}`);
    targetIds.add(target.node);
    const identity = `${target.hostId}\0${target.threadId}`;
    if (targetIdentities.has(identity)) fail(`activeTargets: duplicate native identity ${target.threadId}`);
    targetIdentities.add(identity);
  }
  for (const node of receipt.custody.nodes) {
    if (node.nativeTaskReceipt && !targetIds.has(node.id)) fail(`activeTargets: missing native Task node ${node.id}`);
  }
  if (receipt.transportFailure !== null) {
    exactKeys(receipt.transportFailure, new Set(["key", "count"]), new Set(["key", "count"]), "transportFailure");
    nonempty(receipt.transportFailure.key, "transportFailure.key");
    if (!Number.isInteger(receipt.transportFailure.count) || receipt.transportFailure.count < 2 || receipt.transportFailure.count > 3) {
      fail("transportFailure.count: only repeated failures from 2 through 3 belong in continuity");
    }
    if (receipt.activeTargets.length === 0) fail("transportFailure: active target required");
  }
  if (receipt.signal !== null) {
    exactKeys(receipt.signal, new Set(["locator", "ownerReceipt", "effectReceipt"]), new Set(["locator", "ownerReceipt", "effectReceipt"]), "signal");
    nonempty(receipt.signal.locator, "signal.locator");
    nonempty(receipt.signal.ownerReceipt, "signal.ownerReceipt");
    if (receipt.signal.effectReceipt !== null) fail("signal.effectReceipt: closed signal belongs in closure archive");
    if (closedSignals?.has(signalIdentity(receipt.signal))) {
      fail("signal: archived closed signal identity cannot reopen");
    }
  }
  const artifactIds = uniqueRows(receipt.custody.artifacts, "custody.artifacts");
  if (artifactIds.size > 4096) fail("custody.artifacts: exceeds 4096 unfinished rows");
  const artifactLocators = new Set();
  for (const artifact of receipt.custody.artifacts) {
    exactKeys(
      artifact,
      new Set(["id", "kind", "owner", "locator", "identity", "disposition"]),
      new Set(["id", "kind", "owner", "locator", "identity", "disposition"]),
      `custody artifact ${artifact.id}`,
    );
    if (artifact.disposition !== "retained") fail(`custody artifact ${artifact.id}: terminal custody belongs in closure archive`);
    if (closedArtifactIds?.has(artifact.id)) fail(`custody artifact ${artifact.id}: archived terminal identity cannot reopen`);
    for (const key of ["kind", "owner", "locator", "identity"]) nonempty(artifact[key], `custody artifact ${artifact.id}.${key}`);
    if (!artifactKinds.has(artifact.kind)) fail(`custody artifact ${artifact.id}: invalid kind`);
    if (closedArtifactCustody?.has(artifactCustodyIdentity(artifact))) {
      fail(`custody artifact ${artifact.id}: archived artifact custody cannot reopen`);
    }
    const identity = `${artifact.kind}\0${artifact.locator}`;
    if (artifactLocators.has(identity)) fail(`custody artifact locator reused: ${artifact.id}`);
    artifactLocators.add(identity);
    if (validateFilesystemArtifacts && filesystemArtifactKinds.has(artifact.kind)) {
      await validateFilesystemLocator(artifact.locator, `custody artifact ${artifact.id}`);
    }
  }
  exactKeys(
    receipt.next,
    new Set(["kind", "mode", "node", "owner", "predicate"]),
    new Set(["kind", "owner", "predicate"]),
    "next",
  );
  nonempty(receipt.next.kind, "next.kind");
  nonempty(receipt.next.owner, "next.owner");
  nonempty(receipt.next.predicate, "next.predicate");
  if (!nextKinds.has(receipt.next.kind)) fail("next.kind: invalid action");
  const runnable = receipt.custody.nodes.filter((node) => node.state === "runnable");
  if (runnable.length > 0 && receipt.next.kind !== "dispatch") {
    fail(`runnable frontier must dispatch before ${receipt.next.kind}`);
  }
  if (receipt.next.kind === "dispatch") {
    nonempty(receipt.next.node, "next.node");
    const target = nodeById.get(receipt.next.node);
    if (target?.state !== "runnable") fail("next.node: expected runnable node");
    if (!dispatchModes.has(receipt.next.mode)) fail("next.mode: expected create or continue");
    const expectedMode = target.nativeTaskReceipt ? "continue" : "create";
    if (receipt.next.mode !== expectedMode) fail(`next.mode: expected ${expectedMode}`);
  } else if (receipt.next.node !== undefined || receipt.next.mode !== undefined) {
    fail("next.node and next.mode: allowed only for dispatch");
  }
}

function validateTransition(
  prior,
  projection,
  next,
  predecessorProjection,
  priorObservation,
  historicalObservationWindows,
) {
  const predecessorParts = predecessorProjection ? projectionParts(predecessorProjection) : undefined;
  const predecessorNodes = new Map(
    (predecessorParts?.nodes ?? []).map((node) => [node.id, node]),
  );
  const projected = classifyProjection(projection);
  for (const node of projected.parts.nodes) {
    if (node.legacyV1TaskReceipt === undefined) continue;
    const predecessor = predecessorNodes.get(node.id);
    if (canonical(predecessor?.legacyV1TaskReceipt) !== canonical(node.legacyV1TaskReceipt)) {
      fail(`transition: legacy v1 Task receipt lacks exact predecessor custody: ${node.id}`);
    }
  }
  if (!prior) return;
  if (prior.mission !== next.mission || canonical(prior.origin) !== canonical(next.origin)) {
    fail("transition: mission or origin changed");
  }
  const projectedNodes = new Map(projected.parts.nodes.map((node) => [node.id, node]));
  for (const node of prior.custody.nodes) {
    const successor = projectedNodes.get(node.id);
    if (!successor) fail(`transition: unfinished node disappeared without archived closure: ${node.id}`);
    if (successor.owner !== node.owner || canonical(successor.dependsOn) !== canonical(node.dependsOn)) {
      fail(`transition: node owner or dependencies changed: ${node.id}`);
    }
    if (node.state === "runnable" && successor.state === "waiting") {
      fail(`transition: runnable node returned to waiting before dispatch: ${node.id}`);
    }
    for (const key of ["dispatchReceipt", "nativeTaskReceipt", "legacyV1TaskReceipt"]) {
      if (node[key] !== undefined && canonical(successor[key]) !== canonical(node[key])) {
        fail(`transition: unfinished effect receipt changed: ${node.id}.${key}`);
      }
    }
  }
  const projectedArtifacts = new Map(projected.parts.artifacts.map((artifact) => [artifact.id, artifact]));
  for (const artifact of prior.custody.artifacts) {
    const successor = projectedArtifacts.get(artifact.id);
    if (!successor) fail(`transition: unfinished artifact disappeared without archived closure: ${artifact.id}`);
    if (successor.kind !== artifact.kind || successor.owner !== artifact.owner ||
        successor.locator !== artifact.locator || successor.identity !== artifact.identity) {
      fail(`transition: artifact custody changed: ${artifact.id}`);
    }
  }
  if (prior.signal !== null) {
    const successor = projected.parts.signal;
    if (successor === null || successor.locator !== prior.signal.locator ||
        successor.ownerReceipt !== prior.signal.ownerReceipt) {
      fail("transition: unclosed signal or owner receipt changed");
    }
  }
  const nextTargets = new Map(next.activeTargets.map((target) => [target.node, target]));
  for (const target of prior.activeTargets) {
    const projected = projectedNodes.get(target.node);
    if (projected?.state === "terminal") continue;
    const successor = nextTargets.get(target.node);
    if (!successor || successor.threadId !== target.threadId || successor.hostId !== target.hostId) {
      fail(`transition: active native Task identity changed: ${target.node}`);
    }
    if (target.cursor !== null && successor.cursor === null) {
      fail(`transition: active native Task cursor regressed to null: ${target.node}`);
    }
  }
  const targetContinuity = (targets, includeCursor) => canonical(
    targets
      .map((target) => ({
        node: target.node,
        threadId: target.threadId,
        hostId: target.hostId,
        ...(includeCursor ? { cursor: target.cursor } : {}),
      }))
      .sort((left, right) => left.node.localeCompare(right.node)),
  );
  const sameTargetSet = targetContinuity(prior.activeTargets, false) ===
    targetContinuity(next.activeTargets, false);
  const sameTargetCursors = targetContinuity(prior.activeTargets, true) ===
    targetContinuity(next.activeTargets, true);
  const observedTargetCursors = new Set(
    (priorObservation?.activeTargets ?? []).map((target) => canonical(target)),
  );
  const failedObservedCursorAdvanced = priorObservation !== undefined &&
    priorObservation.transportFailure !== null && prior.activeTargets.some((target) => {
    const successor = nextTargets.get(target.node);
    return successor !== undefined && successor.cursor !== target.cursor &&
      observedTargetCursors.has(canonical(target));
  });
  const incomingFailure = projected.parts.transportFailure;
  const observationApplies = priorObservation !== undefined &&
    targetContinuity(priorObservation.activeTargets, true) === targetContinuity(prior.activeTargets, true);
  if (!sameTargetSet && incomingFailure !== null) {
    fail("transition: transport failure must clear after active target change");
  }
  if (incomingFailure === null && projected.parts.observationWindow !== null &&
      historicalObservationWindows.has(projected.parts.observationWindow)) {
    fail("transition: transport failure clearing observation window was already used");
  }
  if (sameTargetSet && incomingFailure === null && prior.transportFailure !== null) {
    if (projected.parts.observationWindow === null) {
      fail("transition: repeated transport failure clearing requires a fresh observation window");
    }
  }
  if (failedObservedCursorAdvanced && incomingFailure === null &&
      projected.parts.observationWindow === null) {
    fail("transition: cursor advance after transport failure requires a fresh successful observation window");
  }
  if (sameTargetSet && incomingFailure !== null) {
    if (!sameTargetCursors) {
      fail("transition: transport failure cannot advance a cursor");
    }
    const priorFailure = observationApplies
      ? priorObservation.transportFailure
      : predecessorParts ? predecessorParts.transportFailure : prior.transportFailure;
    const failureChanged = canonical(priorFailure) !== canonical(incomingFailure);
    if (failureChanged) {
      if (projected.parts.observationWindow === null) {
        fail("transition: transport failure change requires observation window");
      }
      if (historicalObservationWindows.has(projected.parts.observationWindow)) {
        fail("transition: transport failure observation window was already used");
      }
    }
    if (priorFailure === null || priorFailure.key !== incomingFailure.key) {
      if (incomingFailure.count !== 1) fail("transition: new transport failure count must start at one");
    } else if (incomingFailure.count < priorFailure.count ||
        incomingFailure.count > Math.min(3, priorFailure.count + 1)) {
      fail("transition: repeated transport failure count must be retained or incremented once");
    }
  }
}

function validatePersistedTransportFailure(predecessor, projection, parts) {
  const predecessorFailure = predecessor
    ? projectionParts(predecessor).transportFailure
    : null;
  const omitsObservationWindow = projection.schema === "continuity-receipt/v2" &&
    parts.transportFailure !== null && parts.observationWindow === null;
  if (omitsObservationWindow &&
      (!predecessor || canonical(predecessorFailure) !== canonical(parts.transportFailure))) {
    fail("transportFailure: omitted observation window requires exact verified predecessor custody");
  }
  if (!predecessor && parts.transportFailure !== null && parts.transportFailure.count !== 1) {
    fail("transportFailure: initial failure count must start at one");
  }
}

async function acquireLock(receiptDir) {
  const lock = join(receiptDir, ".advance.lock");
  try {
    await mkdir(lock, { mode: 0o700 });
  } catch (error) {
    if (error.code === "EEXIST") fail("receipt transition is locked");
    throw error;
  }
  return lock;
}

async function readCurrent(receiptDir, { validateFilesystemArtifacts = true } = {}) {
  const pointerPath = join(receiptDir, "current.json");
  let pointerSource;
  try {
    pointerSource = await readRegular(pointerPath, "current pointer");
  } catch (error) {
    if (error.code === "ENOENT") return undefined;
    throw error;
  }
  const pointer = parseJson(pointerSource, "current pointer");
  const pointerSchemas = new Set(["continuity-pointer/v2", "hub-state-pointer/v1"]);
  if (!pointerSchemas.has(pointer.schema) || !digestPattern.test(pointer.digest) ||
      basename(pointer.receipt) !== pointer.receipt || pointer.receipt !== `${pointer.digest.slice(7)}.json`) {
    fail("current pointer: invalid identity");
  }
  const source = await readRegular(join(receiptDir, pointer.receipt), "current receipt");
  if (digest(source) !== pointer.digest) fail("current pointer: digest mismatch");
  const receipt = parseJson(source, "current receipt");
  if (pointer.schema === "continuity-pointer/v2") {
    await validateReceipt(receipt, source, { validateFilesystemArtifacts });
  }
  return { pointer, receipt, source };
}

async function writeAddressed(directory, valueDigest, source, label) {
  const path = join(directory, `${valueDigest.slice(7)}.json`);
  try {
    const existing = await readRegular(path, label);
    if (existing !== source) fail(`${label}: content-addressed collision`);
  } catch (error) {
    if (error.code !== "ENOENT") throw error;
    await writeFile(path, source, { encoding: "utf8", flag: "wx", mode: 0o600 });
  }
}

async function writeClosureAddressed(receiptDir, directoryName, valueDigest, source, label) {
  const directory = await physicalChildDirectory(receiptDir, directoryName, { create: true });
  await writeAddressed(directory, valueDigest, source, label);
}

async function verifyManifest(
  receiptDir,
  manifestDigest,
  expectedSource,
  visited = new Set(),
  closedIds = {
    nodes: new Set(), artifacts: new Set(), artifactCustody: new Set(),
    nodeTerminalReceipts: new Set(), artifactTerminalReceipts: new Set(), signals: new Set(),
    dispatch: new Set(), nativeTasks: new Set(), legacyTasks: new Set(), nativeTargets: new Set(),
  },
  continuity = { transportObservation: undefined, observationWindows: new Set() },
) {
  if (visited.size >= maximumManifestDepth) fail("closure manifest chain exceeds depth limit");
  if (visited.has(manifestDigest)) fail("closure manifest chain contains a cycle");
  visited.add(manifestDigest);
  const manifestSource = await readClosureMember(
    receiptDir,
    "manifests",
    `${manifestDigest.slice(7)}.json`,
    "closure manifest",
  );
  if (digest(manifestSource) !== manifestDigest) fail("closure manifest: digest mismatch");
  const manifest = parseJson(manifestSource, "closure manifest");
  exactKeys(
    manifest,
    new Set(["schema", "archive", "priorManifest", "source", "retained", "closed", "closedEffects"]),
    new Set(["schema", "archive", "priorManifest", "source", "retained", "closed", "closedEffects"]),
    "closure manifest",
  );
  if (manifest.schema !== "continuity-closure-manifest/v1" || !digestPattern.test(manifest.archive?.digest)) {
    fail("closure manifest: invalid schema or archive digest");
  }
  exactKeys(manifest.archive, new Set(["digest", "bytes", "mediaType"]), new Set(["digest", "bytes", "mediaType"]), "closure manifest.archive");
  exactKeys(manifest.source, new Set(["schema", "mission", "origin", "nodes", "artifacts", "unknownMembers"]), new Set(["schema", "mission", "origin", "nodes", "artifacts", "unknownMembers"]), "closure manifest.source");
  exactKeys(manifest.retained, new Set(["nodes", "artifacts"]), new Set(["nodes", "artifacts"]), "closure manifest.retained");
  exactKeys(
    manifest.closed,
    new Set(["nodes", "artifacts", "artifactCustody", "nodeTerminalReceipts", "artifactTerminalReceipts", "signals"]),
    new Set(["nodes", "artifacts", "artifactCustody", "nodeTerminalReceipts", "artifactTerminalReceipts", "signals"]),
    "closure manifest.closed",
  );
  exactKeys(
    manifest.closedEffects,
    new Set(["dispatch", "nativeTasks", "legacyTasks", "nativeTargets"]),
    new Set(["dispatch", "nativeTasks", "legacyTasks", "nativeTargets"]),
    "closure manifest.closedEffects",
  );
  for (const [kind, receipts] of Object.entries(manifest.closedEffects)) {
    if (!Array.isArray(receipts) || receipts.some((receipt) => !digestPattern.test(receipt)) ||
        new Set(receipts).size !== receipts.length) {
      fail(`closure manifest.closedEffects.${kind}: invalid or duplicate identities`);
    }
  }
  if (manifest.archive.mediaType !== "application/json" || !Number.isInteger(manifest.archive.bytes) || manifest.archive.bytes < 2) {
    fail("closure manifest.archive: invalid media type or size");
  }
  const archiveSource = await readClosureMember(
    receiptDir,
    "archives",
    `${manifest.archive.digest.slice(7)}.json`,
    "closure archive",
  );
  if (digest(archiveSource) !== manifest.archive.digest || Buffer.byteLength(archiveSource) !== manifest.archive.bytes) {
    fail("closure archive: content or size mismatch");
  }
  if (expectedSource !== undefined && archiveSource !== expectedSource) fail("closure archive: latest source mismatch");
  const projection = parseJson(archiveSource, "closure archive");
  const classification = classifyProjection(projection);
  if (classification.parts.observationWindow !== null) {
    continuity.observationWindows.add(classification.parts.observationWindow);
  }
  if (continuity.transportObservation === undefined && classification.parts.observationWindow !== null) {
    continuity.transportObservation = {
      window: classification.parts.observationWindow,
      transportFailure: classification.parts.transportFailure,
      activeTargets: classification.parts.activeTargets,
    };
  }
  const expectedManifest = makeManifest(projection, archiveSource, classification);
  if (canonical(manifest.source.origin) !== canonical(projection.origin) ||
      manifest.source.schema !== projection.schema || manifest.source.mission !== projection.mission ||
      manifest.source.nodes !== classification.parts.nodes.length || manifest.source.artifacts !== classification.parts.artifacts.length ||
      canonical(manifest.source.unknownMembers) !== canonical(expectedManifest.source.unknownMembers) ||
      canonical(manifest.retained) !== canonical({ nodes: classification.nodes.map((node) => node.id), artifacts: classification.artifacts.map((artifact) => artifact.id) }) ||
      canonical(manifest.closed) !== canonical(expectedManifest.closed) ||
      canonical(manifest.closedEffects) !== canonical(expectedManifest.closedEffects)) {
    fail("closure manifest: classification mismatch");
  }
  for (const node of manifest.closed.nodes) closedIds.nodes.add(node);
  for (const artifact of manifest.closed.artifacts) closedIds.artifacts.add(artifact);
  for (const artifact of manifest.closed.artifactCustody) closedIds.artifactCustody.add(artifact);
  for (const receipt of manifest.closed.nodeTerminalReceipts) closedIds.nodeTerminalReceipts.add(receipt);
  for (const receipt of manifest.closed.artifactTerminalReceipts) closedIds.artifactTerminalReceipts.add(receipt);
  for (const signal of manifest.closed.signals) closedIds.signals.add(signal);
  for (const receipt of manifest.closedEffects.dispatch) closedIds.dispatch.add(receipt);
  for (const receipt of manifest.closedEffects.nativeTasks) closedIds.nativeTasks.add(receipt);
  for (const receipt of manifest.closedEffects.legacyTasks) closedIds.legacyTasks.add(receipt);
  for (const target of manifest.closedEffects.nativeTargets) closedIds.nativeTargets.add(target);
  if (manifest.priorManifest !== classification.parts.priorManifest) fail("closure manifest: prior chain mismatch");
  if (manifest.priorManifest !== null) {
    if (!digestPattern.test(manifest.priorManifest)) fail("closure manifest: invalid prior digest");
    await verifyManifest(receiptDir, manifest.priorManifest, undefined, visited, closedIds, continuity);
  }
  return archiveSource;
}

async function verifyCurrentClosure(receiptDir, receipt, { validateFilesystemArtifacts = true } = {}) {
  const closedIds = {
    nodes: new Set(), artifacts: new Set(), artifactCustody: new Set(),
    nodeTerminalReceipts: new Set(), artifactTerminalReceipts: new Set(), signals: new Set(),
    dispatch: new Set(), nativeTasks: new Set(), legacyTasks: new Set(), nativeTargets: new Set(),
  };
  const visited = new Set();
  const continuity = { transportObservation: undefined, observationWindows: new Set() };
  const latestSource = await verifyManifest(
    receiptDir,
    receipt.closureManifest,
    undefined,
    visited,
    closedIds,
    continuity,
  );
  const projection = parseJson(latestSource, "latest closure archive");
  const classification = classifyProjection(projection);
  const rebuilt = buildReceipt(projection, classification, receipt.closureManifest);
  if (canonical(rebuilt) !== canonical(receipt)) fail("continuity receipt: archive projection mismatch");
  await validateReceipt(receipt, canonicalLine(receipt), {
    closedNodeIds: closedIds.nodes,
    closedArtifactIds: closedIds.artifacts,
    closedArtifactCustody: closedIds.artifactCustody,
    closedDispatchReceipts: closedIds.dispatch,
    closedNativeTaskReceipts: closedIds.nativeTasks,
    closedLegacyTaskReceipts: closedIds.legacyTasks,
    closedNativeTargets: closedIds.nativeTargets,
    closedSignals: closedIds.signals,
    validateFilesystemArtifacts,
  });
  return {
    closedIds,
    manifestCount: visited.size,
    projection,
    transportObservation: continuity.transportObservation,
    observationWindows: continuity.observationWindows,
  };
}

async function advance(options) {
  await validatePath(options.receiptRoot, options.receiptDir, true);
  await mkdir(options.receiptDir, { recursive: true, mode: 0o700 });
  await validatePath(options.receiptRoot, options.receiptDir, false);
  const source = await readRegular(options.input, "input");
  const projection = parseJson(source, "input");
  const classification = classifyProjection(projection);
  await validateIncomingTerminalArtifacts(classification);
  let lock;
  try {
    lock = await acquireLock(options.receiptDir);
    const current = await readCurrent(options.receiptDir, { validateFilesystemArtifacts: false });
    if (!current) {
      const unexpected = (await readdir(options.receiptDir)).filter((entry) => entry !== ".advance.lock");
      if (unexpected.length > 0) fail("initialization: receipt directory is not empty but current pointer is missing");
    }
    const actual = current?.pointer.digest ?? "none";
    if (options.expectPrior !== actual) fail(`stale prior: expected ${options.expectPrior}, current ${actual}`);
    if (current?.pointer.schema === "hub-state-pointer/v1" && source !== current.source) {
      fail("migration: input must be the exact current legacy receipt bytes");
    }
    const prior = current?.pointer.schema === "continuity-pointer/v2" ? current.receipt : undefined;
    if (prior && classification.parts.priorManifest !== prior.closureManifest) {
      fail("transition: projection does not carry the current closure manifest");
    }
    let history = {
      closedIds: {
        nodes: new Set(), artifacts: new Set(), artifactCustody: new Set(),
        nodeTerminalReceipts: new Set(), artifactTerminalReceipts: new Set(), signals: new Set(),
        dispatch: new Set(), nativeTasks: new Set(), legacyTasks: new Set(), nativeTargets: new Set(),
      },
      manifestCount: 0,
      projection: current?.receipt,
      transportObservation: undefined,
      observationWindows: new Set(),
    };
    if (prior) {
      history = await verifyCurrentClosure(options.receiptDir, prior, { validateFilesystemArtifacts: false });
    } else if (classification.parts.priorManifest !== null) {
      const visited = new Set();
      const continuity = { transportObservation: undefined, observationWindows: new Set() };
      await verifyManifest(
        options.receiptDir,
        classification.parts.priorManifest,
        undefined,
        visited,
        history.closedIds,
        continuity,
      );
      history.manifestCount = visited.size;
      history.transportObservation = continuity.transportObservation;
      history.observationWindows = continuity.observationWindows;
    }
    validatePersistedTransportFailure(current?.receipt, projection, classification.parts);
    if (history.manifestCount >= maximumManifestDepth) {
      fail("closure manifest chain cannot be extended beyond the depth limit");
    }
    const incomingNodeIds = new Set(classification.parts.nodes.map((node) => node.id));
    for (const node of classification.parts.nodes) {
      if (history.closedIds.nodes.has(node.id)) fail(`node ${node.id}: archived terminal identity cannot be reused`);
      if (node.dependsOn.some((id) => !incomingNodeIds.has(id) && !history.closedIds.nodes.has(id))) {
        fail(`node ${node.id}: dependency lacks archived terminal evidence`);
      }
    }
    for (const artifact of classification.parts.artifacts) {
      if (history.closedIds.artifacts.has(artifact.id)) fail(`artifact ${artifact.id}: archived terminal identity cannot be reused`);
      if (history.closedIds.artifactCustody.has(artifactCustodyIdentity(artifact))) {
        fail(`artifact ${artifact.id}: archived artifact custody cannot be reused`);
      }
      if (artifact.disposition === "terminal" &&
          history.closedIds.artifactTerminalReceipts.has(terminalReceiptIdentity(artifact.terminalReceipt))) {
        fail(`artifact ${artifact.id}: archived terminal receipt cannot be reused`);
      }
    }
    for (const node of classification.parts.nodes) {
      if (node.state === "terminal" &&
          history.closedIds.nodeTerminalReceipts.has(terminalReceiptIdentity(node.terminalReceipt))) {
        fail(`node ${node.id}: archived terminal receipt cannot be reused`);
      }
      if (node.dispatchReceipt !== undefined && history.closedIds.dispatch.has(effectIdentity(node.dispatchReceipt))) {
        fail(`node ${node.id}: archived dispatch identity cannot be reused`);
      }
      if (node.nativeTaskReceipt !== undefined &&
          (history.closedIds.nativeTasks.has(effectIdentity(node.nativeTaskReceipt)) ||
           history.closedIds.legacyTasks.has(effectIdentity(node.nativeTaskReceipt)))) {
        fail(`node ${node.id}: archived native or legacy Task identity cannot be reused`);
      }
      if (node.legacyV1TaskReceipt !== undefined &&
          (history.closedIds.nativeTasks.has(effectIdentity(node.legacyV1TaskReceipt)) ||
           history.closedIds.legacyTasks.has(effectIdentity(node.legacyV1TaskReceipt)))) {
        fail(`node ${node.id}: archived native or legacy Task identity cannot be reused`);
      }
      if (node.nativeTaskReceipt !== undefined && history.closedIds.nativeTargets.has(nativeTargetIdentity(node.nativeTaskReceipt))) {
        fail(`node ${node.id}: archived native Task target identity cannot be reused`);
      }
    }
    const closedNodeIds = new Set([...history.closedIds.nodes, ...classification.closedNodeIds]);
    const closedArtifactIds = new Set([...history.closedIds.artifacts, ...classification.closedArtifactIds]);
    const closedArtifactCustody = new Set([
      ...history.closedIds.artifactCustody,
      ...classification.closedArtifactCustodyIds,
    ]);
    const closedDispatchReceipts = new Set([
      ...history.closedIds.dispatch,
      ...classification.closedDispatchReceiptIds,
    ]);
    const closedNativeTaskReceipts = new Set([
      ...history.closedIds.nativeTasks,
      ...classification.closedNativeTaskReceiptIds,
    ]);
    const closedLegacyTaskReceipts = new Set([
      ...history.closedIds.legacyTasks,
      ...classification.closedLegacyTaskReceiptIds,
    ]);
    const closedNativeTargets = new Set([
      ...history.closedIds.nativeTargets,
      ...classification.closedNativeTargetIds,
    ]);
    const closedSignals = new Set([
      ...history.closedIds.signals,
      ...classification.closedSignalIds,
    ]);
    const manifest = makeManifest(projection, source, classification);
    const manifestSource = canonicalLine(manifest);
    const manifestDigest = digest(manifestSource);
    const next = buildReceipt(projection, classification, manifestDigest);
    const nextSource = canonicalLine(next);
    await validateReceipt(next, nextSource, {
      closedNodeIds,
      closedArtifactIds,
      closedArtifactCustody,
      closedDispatchReceipts,
      closedNativeTaskReceipts,
      closedLegacyTaskReceipts,
      closedNativeTargets,
      closedSignals,
    });
    validateTransition(
      prior,
      projection,
      next,
      history.projection,
      history.transportObservation,
      history.observationWindows,
    );
    await writeClosureAddressed(options.receiptDir, "archives", manifest.archive.digest, source, "closure archive");
    await writeClosureAddressed(options.receiptDir, "manifests", manifestDigest, manifestSource, "closure manifest");
    const receiptDigest = digest(nextSource);
    await writeAddressed(options.receiptDir, receiptDigest, nextSource, "continuity receipt");
    const pointerSource = canonicalLine({
      schema: "continuity-pointer/v2",
      digest: receiptDigest,
      receipt: `${receiptDigest.slice(7)}.json`,
    });
    const temporary = join(options.receiptDir, `.current.${process.pid}.tmp`);
    await writeFile(temporary, pointerSource, { encoding: "utf8", flag: "wx", mode: 0o600 });
    await rename(temporary, join(options.receiptDir, "current.json"));
    process.stdout.write(`${receiptDigest}\n`);
  } finally {
    if (lock) await rmdir(lock);
  }
}

async function verify(options) {
  await validatePath(options.receiptRoot, options.receiptDir, false);
  let lock;
  try {
    lock = await acquireLock(options.receiptDir);
    const current = await readCurrent(options.receiptDir);
    if (!current || current.pointer.schema !== "continuity-pointer/v2") {
      fail("current continuity receipt is unavailable; migrate the legacy receipt first");
    }
    if (options.expectPrior && options.expectPrior !== current.pointer.digest) {
      fail(`stale prior: expected ${options.expectPrior}, current ${current.pointer.digest}`);
    }
    await verifyCurrentClosure(options.receiptDir, current.receipt);
    process.stdout.write(`${current.pointer.digest}\n`);
  } finally {
    if (lock) await rmdir(lock);
  }
}

async function restore(options) {
  await validatePath(options.receiptRoot, options.receiptDir, false);
  const source = await verifyManifest(options.receiptDir, options.manifest);
  process.stdout.write(source);
}

const options = parseArguments(process.argv.slice(2));
if (options.command === "advance") await advance(options);
else if (options.command === "verify") await verify(options);
else await restore(options);
