import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import { lstat, mkdir, mkdtemp, readFile, realpath, rename, rmdir, symlink, unlink, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const script = join(dirname(fileURLToPath(import.meta.url)), "continuity-receipt.mjs");
const root = await mkdtemp(join(await realpath(tmpdir()), "continuity-receipt-"));
const receiptRoot = join(root, "receipt-root");
const receiptDir = join(receiptRoot, "mission");
const input = join(root, "legacy.json");
await mkdir(receiptRoot, { mode: 0o700 });

function run(...args) {
  return runIn(receiptDir, ...args);
}

function runIn(directory, ...args) {
  return execFileSync(process.execPath, [script, ...args, "--receipt-root", receiptRoot, "--receipt-dir", directory], {
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
  }).trim();
}

function rejects(pattern, ...args) {
  assert.throws(() => run(...args), pattern);
}

function sha256(source) {
  return `sha256:${createHash("sha256").update(source).digest("hex")}`;
}

function canonical(value) {
  if (Array.isArray(value)) return `[${value.map(canonical).join(",")}]`;
  if (value && typeof value === "object") {
    return `{${Object.keys(value).sort().map((key) => `${JSON.stringify(key)}:${canonical(value[key])}`).join(",")}}`;
  }
  return JSON.stringify(value);
}

const retainedRoots = [];
for (let index = 0; index < 3; index += 1) {
  const path = join(root, `retained-${index}`);
  await mkdir(path);
  retainedRoots.push(path);
}

const nodes = Array.from({ length: 290 }, (_, index) => index < 2 ? {
  id: `node-${index}`,
  state: "running",
  owner: `owner-${index}`,
  dependsOn: index === 1 ? ["node-2"] : [],
  dispatchReceipt: { kind: "native_task", locator: `dispatch:${index}` },
  nativeTaskReceipt: { kind: "native_task", locator: `task:${index}`, threadId: `thread-${index}`, hostId: "host" },
  runTelemetry: { elapsedMs: index + 1 },
} : {
  id: `node-${index}`,
  state: "terminal",
  owner: `owner-${index}`,
  dependsOn: [],
  terminalReceipt: `terminal:${index}`,
  businessProgress: `completed stage ${index}`,
});
const artifacts = Array.from({ length: 1811 }, (_, index) => index < 3 ? {
  id: `artifact-${index}`,
  kind: "worktree",
  owner: `owner-${index}`,
  locator: retainedRoots[index],
  identity: `head=${String(index).padStart(40, "a")}`,
  disposition: "retained",
} : {
  id: `artifact-${index}`,
  kind: "candidate",
  owner: `owner-${index % 290}`,
  locator: `git:terminal:${index}`,
  identity: `tree=${String(index).padStart(40, "b")}`,
  disposition: "terminal",
  terminalReceipt: `merged:${index}`,
});
const legacy = {
  schema: "hub-state-receipt/v2",
  mission: "large-legacy-mission",
  origin: { repository: "https://example.invalid/repo", commit: "a".repeat(40), tree: "b".repeat(40) },
  nodes,
  artifacts,
  activeTargets: nodes.slice(0, 2).map((node, index) => ({
    node: node.id,
    threadId: node.nativeTaskReceipt.threadId,
    hostId: node.nativeTaskReceipt.hostId,
    cursor: `cursor-${index}`,
  })),
  observation: { window: "window-1811", transportFailure: { key: "wait:timeout", count: 2 } },
  next: { kind: "observe", owner: "hub", predicate: "consume remaining targets" },
  businessProgress: Array.from({ length: 96 }, (_, index) => ({ index, result: "complete", detail: "p".repeat(256) })),
  runTelemetry: "t".repeat(1_010_000),
  unknownAssets: [{ kind: "future", bytes: "u".repeat(32_000) }],
};
const legacySource = `${JSON.stringify(legacy)}\n`;
assert.ok(Buffer.byteLength(legacySource) > 1_400_000 && Buffer.byteLength(legacySource) < 1_500_000);
await writeFile(input, legacySource, "utf8");
await mkdir(receiptDir);
const legacyDigest = sha256(legacySource);
const legacyName = `${legacyDigest.slice(7)}.json`;
await writeFile(join(receiptDir, legacyName), legacySource, "utf8");
await writeFile(join(receiptDir, "current.json"), `${JSON.stringify({
  schema: "hub-state-pointer/v1",
  digest: legacyDigest,
  receipt: legacyName,
})}\n`, "utf8");

const first = run("advance", "--input", input, "--expect-prior", legacyDigest);
assert.match(first, /^sha256:[0-9a-f]{64}$/);
assert.equal(run("verify", "--expect-prior", first), first);
const pointer = JSON.parse(await readFile(join(receiptDir, "current.json"), "utf8"));
const hotSource = await readFile(join(receiptDir, pointer.receipt), "utf8");
const hot = JSON.parse(hotSource);
assert.equal(hot.schema, "continuity-receipt/v2");
assert.equal(hot.custody.nodes.length, 2);
assert.equal(hot.custody.artifacts.length, 3);
assert.equal(hot.activeTargets.length, 2);
assert.deepEqual(hot.transportFailure, { key: "wait:timeout", count: 2 });
assert.equal(hot.signal, null);
assert.equal("runTelemetry" in hot.custody.nodes[0], false);
assert.ok(Buffer.byteLength(hotSource) < 10_000);
assert.ok(Buffer.byteLength(hotSource) < Buffer.byteLength(legacySource) / 100);
const restored = execFileSync(process.execPath, [
  script,
  "restore",
  "--receipt-root", receiptRoot,
  "--receipt-dir", receiptDir,
  "--manifest", hot.closureManifest,
], { encoding: "utf8", maxBuffer: 2_000_000 });
assert.equal(restored, legacySource);
assert.equal(sha256(restored), sha256(legacySource));

const projection = structuredClone(hot);
projection.custody.nodes[0] = {
  ...projection.custody.nodes[0],
  state: "terminal",
  terminalReceipt: "terminal:node-0",
};
projection.activeTargets = projection.activeTargets.slice(1);
projection.transportFailure = null;
projection.businessProgress = [{ node: "node-0", result: "complete" }];
projection.runTelemetry = { elapsedMs: 42, tokens: "unavailable" };
const projectionSource = `${JSON.stringify(projection)}\n`;
await writeFile(input, projectionSource, "utf8");
const second = run("advance", "--input", input, "--expect-prior", first);
assert.notEqual(second, first);
assert.equal(run("verify", "--expect-prior", second), second);
const secondPointer = JSON.parse(await readFile(join(receiptDir, "current.json"), "utf8"));
const secondHot = JSON.parse(await readFile(join(receiptDir, secondPointer.receipt), "utf8"));
assert.equal(secondHot.custody.nodes.length, 1);
assert.equal(secondHot.activeTargets.length, 1);
assert.equal(secondHot.closureManifest === hot.closureManifest, false);
assert.equal(
  execFileSync(process.execPath, [script, "restore", "--receipt-root", receiptRoot, "--receipt-dir", receiptDir, "--manifest", secondHot.closureManifest], { encoding: "utf8" }),
  projectionSource,
);

for (const directoryName of ["archives", "manifests"]) {
  const custodyDirectory = join(receiptDir, directoryName);
  const substitutedDirectory = join(root, `substituted-${directoryName}`);
  await rename(custodyDirectory, substitutedDirectory);
  await symlink(substitutedDirectory, custodyDirectory, "dir");
  await writeFile(input, `${JSON.stringify(secondHot)}\n`, "utf8");
  rejects(/receipt path contains a symlink/, "advance", "--input", input, "--expect-prior", second);
  assert.equal(JSON.parse(await readFile(join(receiptDir, "current.json"), "utf8")).digest, second);
  await unlink(custodyDirectory);
  await rename(substitutedDirectory, custodyDirectory);
}

const runnableInput = join(root, "runnable-transition.json");
const runnableDir = join(receiptRoot, "runnable-transition");
await writeFile(runnableInput, `${JSON.stringify({
  schema: "hub-state-receipt/v2",
  mission: "runnable-transition",
  origin: legacy.origin,
  nodes: [{ id: "ready", state: "runnable", owner: "hub", dependsOn: [] }],
  artifacts: [],
  activeTargets: [],
  observation: { transportFailure: null },
  next: { kind: "dispatch", mode: "create", node: "ready", owner: "hub", predicate: "dispatch ready node" },
})}\n`, "utf8");
const runnableFirst = runIn(runnableDir, "advance", "--input", runnableInput, "--expect-prior", "none");
const runnablePointer = JSON.parse(await readFile(join(runnableDir, "current.json"), "utf8"));
const runnableHot = JSON.parse(await readFile(join(runnableDir, runnablePointer.receipt), "utf8"));
runnableHot.custody.nodes[0].state = "waiting";
runnableHot.custody.nodes[0].stateReceipt = "owner:deferred-without-dispatch";
runnableHot.next = { kind: "observe", owner: "hub", predicate: "must not erase runnable frontier" };
await writeFile(runnableInput, `${JSON.stringify(runnableHot)}\n`, "utf8");
assert.throws(
  () => runIn(runnableDir, "advance", "--input", runnableInput, "--expect-prior", runnableFirst),
  /runnable node returned to waiting before dispatch/,
);
assert.equal(JSON.parse(await readFile(join(runnableDir, "current.json"), "utf8")).digest, runnableFirst);

const contradictoryPendingInput = join(root, "contradictory-dispatch-pending.json");
const contradictoryPendingDir = join(receiptRoot, "contradictory-dispatch-pending");
await writeFile(contradictoryPendingInput, `${JSON.stringify({
  schema: "hub-state-receipt/v2",
  mission: "contradictory-dispatch-pending",
  origin: legacy.origin,
  nodes: [{
    id: "pending",
    state: "dispatch_pending",
    owner: "hub",
    dependsOn: [],
    dispatchReceipt: { kind: "client_thread", locator: "client:pending" },
    nativeTaskReceipt: { kind: "native_task", locator: "task:pending", threadId: "thread-pending", hostId: "host-pending" },
  }],
  artifacts: [],
  activeTargets: [{ node: "pending", threadId: "thread-pending", hostId: "host-pending", cursor: null }],
  observation: { transportFailure: null },
  next: { kind: "observe", owner: "hub", predicate: "must reject contradictory custody" },
})}\n`, "utf8");
assert.throws(
  () => runIn(contradictoryPendingDir, "advance", "--input", contradictoryPendingInput, "--expect-prior", "none"),
  /dispatch-pending cannot claim native Task receipt/,
);
await assert.rejects(readFile(join(contradictoryPendingDir, "current.json"), "utf8"), /ENOENT/);

const reopenedNode = structuredClone(secondHot);
reopenedNode.custody.nodes.push({
  id: "node-0",
  state: "runnable",
  owner: "different-owner",
  dependsOn: [],
});
reopenedNode.next = { kind: "dispatch", mode: "create", node: "node-0", owner: "hub", predicate: "dispatch reopened custody" };
await writeFile(input, `${JSON.stringify(reopenedNode)}\n`, "utf8");
rejects(/archived terminal identity cannot be reused/, "advance", "--input", input, "--expect-prior", second);

const reopenedArtifact = structuredClone(secondHot);
reopenedArtifact.custody.artifacts.push({
  id: "alias-artifact-3",
  kind: "candidate",
  owner: "different-owner",
  locator: artifacts[3].locator,
  identity: artifacts[3].identity,
  disposition: "retained",
});
await writeFile(input, `${JSON.stringify(reopenedArtifact)}\n`, "utf8");
rejects(/archived artifact custody cannot be reused/, "advance", "--input", input, "--expect-prior", second);

const duplicateTerminalReceipt = structuredClone(secondHot);
duplicateTerminalReceipt.custody.nodes[0].state = "terminal";
duplicateTerminalReceipt.custody.nodes[0].terminalReceipt = "same-terminal-receipt";
duplicateTerminalReceipt.custody.nodes.push({
  id: "other-terminal-node",
  state: "terminal",
  owner: "other-owner",
  dependsOn: [],
  terminalReceipt: "same-terminal-receipt",
});
duplicateTerminalReceipt.activeTargets = [];
duplicateTerminalReceipt.next = { kind: "finalize", owner: "hub", predicate: "must not share terminal receipt" };
await writeFile(input, `${JSON.stringify(duplicateTerminalReceipt)}\n`, "utf8");
rejects(/terminal receipt reused/, "advance", "--input", input, "--expect-prior", second);

const historicalTerminalReceipt = structuredClone(secondHot);
historicalTerminalReceipt.custody.nodes[0].state = "terminal";
historicalTerminalReceipt.custody.nodes[0].terminalReceipt = "terminal:2";
historicalTerminalReceipt.activeTargets = [];
historicalTerminalReceipt.next = { kind: "finalize", owner: "hub", predicate: "must not reuse archived terminal receipt" };
await writeFile(input, `${JSON.stringify(historicalTerminalReceipt)}\n`, "utf8");
rejects(/archived terminal receipt cannot be reused/, "advance", "--input", input, "--expect-prior", second);

const reopenedNativeIdentity = structuredClone(secondHot);
const aliasedNativeReceipt = {
  ...structuredClone(hot.custody.nodes[0].nativeTaskReceipt),
  locator: "task:aliased-locator",
};
reopenedNativeIdentity.custody.nodes.push({
  id: "different-node-id",
  state: "runnable",
  owner: "different-owner",
  dependsOn: [],
  dispatchReceipt: { kind: "native_task", locator: "dispatch:different-node-id" },
  nativeTaskReceipt: aliasedNativeReceipt,
});
reopenedNativeIdentity.activeTargets.push({
  node: "different-node-id",
  threadId: hot.custody.nodes[0].nativeTaskReceipt.threadId,
  hostId: hot.custody.nodes[0].nativeTaskReceipt.hostId,
  cursor: null,
});
reopenedNativeIdentity.next = {
  kind: "dispatch",
  mode: "continue",
  node: "different-node-id",
  owner: "hub",
  predicate: "must not reopen archived native identity",
};
await writeFile(input, `${JSON.stringify(reopenedNativeIdentity)}\n`, "utf8");
rejects(/archived native Task target identity cannot be reused/, "advance", "--input", input, "--expect-prior", second);

const closesAndReusesEffect = structuredClone(secondHot);
const closingNode = closesAndReusesEffect.custody.nodes[0];
closingNode.state = "terminal";
closingNode.terminalReceipt = "terminal:node-1";
closesAndReusesEffect.activeTargets = [];
closesAndReusesEffect.custody.nodes.push({
  id: "replacement-node",
  state: "running",
  owner: "replacement-owner",
  dependsOn: [],
  dispatchReceipt: structuredClone(closingNode.dispatchReceipt),
  nativeTaskReceipt: structuredClone(closingNode.nativeTaskReceipt),
});
closesAndReusesEffect.activeTargets.push({
  node: "replacement-node",
  threadId: closingNode.nativeTaskReceipt.threadId,
  hostId: closingNode.nativeTaskReceipt.hostId,
  cursor: null,
});
await writeFile(input, `${JSON.stringify(closesAndReusesEffect)}\n`, "utf8");
rejects(/dispatch identity reused|native Task receipt reused|native Task target reused/, "advance", "--input", input, "--expect-prior", second);

const malformedOptionalReceipt = structuredClone(secondHot);
malformedOptionalReceipt.custody.nodes[0].dispatchReceipt = false;
await writeFile(input, `${JSON.stringify(malformedOptionalReceipt)}\n`, "utf8");
rejects(/dispatchReceipt: expected object/, "advance", "--input", input, "--expect-prior", second);

const duplicateNativeRepresentations = structuredClone(secondHot);
duplicateNativeRepresentations.custody.nodes[0].state = "frozen";
duplicateNativeRepresentations.custody.nodes[0].stateReceipt = "state:frozen";
duplicateNativeRepresentations.custody.nodes[0].legacyV1TaskReceipt = {
  kind: "native_task",
  locator: "task:legacy-duplicate",
};
await writeFile(input, `${JSON.stringify(duplicateNativeRepresentations)}\n`, "utf8");
rejects(/native and legacy Task receipts are mutually exclusive/, "advance", "--input", input, "--expect-prior", second);

const terminalSelfDependency = structuredClone(secondHot);
terminalSelfDependency.custody.nodes[0].state = "terminal";
terminalSelfDependency.custody.nodes[0].terminalReceipt = "terminal:self-dependent";
terminalSelfDependency.custody.nodes[0].dependsOn = [terminalSelfDependency.custody.nodes[0].id];
terminalSelfDependency.activeTargets = [];
terminalSelfDependency.next = { kind: "finalize", owner: "hub", predicate: "must reject terminal self dependency" };
await writeFile(input, `${JSON.stringify(terminalSelfDependency)}\n`, "utf8");
rejects(/duplicate or self dependency/, "advance", "--input", input, "--expect-prior", second);

const malformedTransportFailure = structuredClone(secondHot);
malformedTransportFailure.transportFailure = { key: "wait:timeout", count: "2" };
await writeFile(input, `${JSON.stringify(malformedTransportFailure)}\n`, "utf8");
rejects(/transportFailure.count: expected an integer/, "advance", "--input", input, "--expect-prior", second);

const invalidUtf8 = structuredClone(secondHot);
invalidUtf8.unknownText = "INVALID_UTF8_MARKER";
const invalidUtf8Bytes = Buffer.from(`${JSON.stringify(invalidUtf8)}\n`);
invalidUtf8Bytes[invalidUtf8Bytes.indexOf("INVALID_UTF8_MARKER")] = 0xff;
await writeFile(input, invalidUtf8Bytes);
rejects(/input: expected valid UTF-8/, "advance", "--input", input, "--expect-prior", second);
assert.equal(JSON.parse(await readFile(join(receiptDir, "current.json"), "utf8")).digest, second);

const dropped = structuredClone(secondHot);
dropped.custody.nodes = [];
dropped.activeTargets = [];
await writeFile(input, `${JSON.stringify(dropped)}\n`, "utf8");
rejects(/unfinished node disappeared without archived closure/, "advance", "--input", input, "--expect-prior", second);

const unclosed = structuredClone(secondHot);
unclosed.custody.nodes[0].state = "terminal";
unclosed.activeTargets = [];
await writeFile(input, `${JSON.stringify(unclosed)}\n`, "utf8");
rejects(/terminalReceipt: expected non-empty string/, "advance", "--input", input, "--expect-prior", second);

const cyclic = structuredClone(secondHot);
cyclic.custody.nodes[0].dependsOn = [cyclic.custody.nodes[0].id];
await writeFile(input, `${JSON.stringify(cyclic)}\n`, "utf8");
rejects(/duplicate or self dependency/, "advance", "--input", input, "--expect-prior", second);

const unknownDependency = structuredClone(secondHot);
unknownDependency.custody.nodes[0].dependsOn = ["never-recorded"];
await writeFile(input, `${JSON.stringify(unknownDependency)}\n`, "utf8");
rejects(/dependency lacks archived terminal evidence/, "advance", "--input", input, "--expect-prior", second);

const telemetryStateReceipt = structuredClone(secondHot);
telemetryStateReceipt.custody.nodes[0].state = "frozen";
telemetryStateReceipt.custody.nodes[0].stateReceipt = { history: ["not-hot-state"] };
await writeFile(input, `${JSON.stringify(telemetryStateReceipt)}\n`, "utf8");
rejects(/state requires owner receipt locator/, "advance", "--input", input, "--expect-prior", second);

const lostEffectReceipt = structuredClone(secondHot);
delete lostEffectReceipt.custody.nodes[0].dispatchReceipt;
await writeFile(input, `${JSON.stringify(lostEffectReceipt)}\n`, "utf8");
rejects(/native Task receipt requires dispatch custody|unfinished effect receipt changed/, "advance", "--input", input, "--expect-prior", second);

const changedArtifactIdentity = structuredClone(secondHot);
changedArtifactIdentity.custody.artifacts[0].identity = "head=changed";
await writeFile(input, `${JSON.stringify(changedArtifactIdentity)}\n`, "utf8");
rejects(/artifact custody changed/, "advance", "--input", input, "--expect-prior", second);

const oversized = structuredClone(secondHot);
oversized.custody.artifacts[0].identity = "x".repeat(300_000);
await writeFile(input, `${JSON.stringify(oversized)}\n`, "utf8");
rejects(/exceeds 262144 bytes/, "advance", "--input", input, "--expect-prior", second);

const priorManifestPath = join(receiptDir, "manifests", `${secondHot.closureManifest.slice(7)}.json`);
const priorManifest = JSON.parse(await readFile(priorManifestPath, "utf8"));
const priorArchivePath = join(receiptDir, "archives", `${priorManifest.archive.digest.slice(7)}.json`);
const hiddenArchivePath = `${priorArchivePath}.hidden`;
await rename(priorArchivePath, hiddenArchivePath);
await writeFile(input, `${JSON.stringify(secondHot)}\n`, "utf8");
rejects(/ENOENT/, "advance", "--input", input, "--expect-prior", second);
assert.equal(JSON.parse(await readFile(join(receiptDir, "current.json"), "utf8")).digest, second);
await rename(hiddenArchivePath, priorArchivePath);

const forgedInitial = structuredClone(secondHot);
forgedInitial.closureManifest = `sha256:${"f".repeat(64)}`;
const forgedInitialPath = join(root, "forged-initial.json");
const forgedInitialDir = join(receiptRoot, "forged-initial");
await writeFile(forgedInitialPath, `${JSON.stringify(forgedInitial)}\n`, "utf8");
assert.throws(
  () => runIn(forgedInitialDir, "advance", "--input", forgedInitialPath, "--expect-prior", "none"),
  /ENOENT/,
);
await assert.rejects(readFile(join(forgedInitialDir, "current.json"), "utf8"), /ENOENT/);

const depthDir = join(receiptRoot, "depth-limit");
const depthArchives = join(depthDir, "archives");
const depthManifests = join(depthDir, "manifests");
await mkdir(depthArchives, { recursive: true });
await mkdir(depthManifests, { recursive: true });
let depthPrior = null;
let pendingWrites = [];
for (let index = 0; index < 4096; index += 1) {
  const depthProjection = {
    schema: "continuity-receipt/v2",
    mission: "depth-limit",
    origin: legacy.origin,
    activeTargets: [],
    transportFailure: null,
    signal: null,
    custody: { nodes: [], artifacts: [] },
    closureManifest: depthPrior,
    next: { kind: "finalize", owner: "hub", predicate: "preserve bounded chain" },
  };
  const archiveSource = `${JSON.stringify(depthProjection)}\n`;
  const archiveDigest = sha256(archiveSource);
  const manifest = {
    schema: "continuity-closure-manifest/v1",
    archive: { digest: archiveDigest, bytes: Buffer.byteLength(archiveSource), mediaType: "application/json" },
    priorManifest: depthPrior,
    source: { schema: depthProjection.schema, mission: depthProjection.mission, origin: depthProjection.origin, nodes: 0, artifacts: 0, unknownMembers: [] },
    retained: { nodes: [], artifacts: [] },
    closed: {
      nodes: [],
      artifacts: [],
      artifactCustody: [],
      nodeTerminalReceipts: [],
      artifactTerminalReceipts: [],
      signals: [],
    },
    closedEffects: { dispatch: [], nativeTasks: [], legacyTasks: [], nativeTargets: [] },
  };
  const manifestSource = `${JSON.stringify(manifest)}\n`;
  depthPrior = sha256(manifestSource);
  pendingWrites.push(
    writeFile(join(depthArchives, `${archiveDigest.slice(7)}.json`), archiveSource, "utf8"),
    writeFile(join(depthManifests, `${depthPrior.slice(7)}.json`), manifestSource, "utf8"),
  );
  if (pendingWrites.length >= 256) {
    await Promise.all(pendingWrites);
    pendingWrites = [];
  }
}
await Promise.all(pendingWrites);
const depthCurrent = {
  schema: "continuity-receipt/v2",
  mission: "depth-limit",
  origin: legacy.origin,
  activeTargets: [],
  transportFailure: null,
  signal: null,
  custody: { nodes: [], artifacts: [] },
  closureManifest: depthPrior,
  next: { kind: "finalize", owner: "hub", predicate: "preserve bounded chain" },
};
const depthCurrentSource = `${canonical(depthCurrent)}\n`;
const depthCurrentDigest = sha256(depthCurrentSource);
await writeFile(join(depthDir, `${depthCurrentDigest.slice(7)}.json`), depthCurrentSource, "utf8");
await writeFile(join(depthDir, "current.json"), `${canonical({
  schema: "continuity-pointer/v2",
  digest: depthCurrentDigest,
  receipt: `${depthCurrentDigest.slice(7)}.json`,
})}\n`, "utf8");
const depthInput = join(root, "depth-limit.json");
await writeFile(depthInput, `${JSON.stringify({
  schema: "continuity-receipt/v2",
  mission: "depth-limit",
  origin: legacy.origin,
  activeTargets: [],
  transportFailure: null,
  signal: null,
  custody: { nodes: [], artifacts: [] },
  closureManifest: depthPrior,
  next: { kind: "finalize", owner: "hub", predicate: "must not overflow chain" },
})}\n`, "utf8");
assert.throws(
  () => runIn(depthDir, "advance", "--input", depthInput, "--expect-prior", depthCurrentDigest),
  /closure manifest chain cannot be extended beyond the depth limit/,
);
assert.equal(JSON.parse(await readFile(join(depthDir, "current.json"), "utf8")).digest, depthCurrentDigest);

const signalInput = join(root, "signal.json");
const signalDir = join(receiptRoot, "signal");
const signalLegacy = {
  schema: "hub-state-receipt/v2",
  mission: "signal-retention",
  origin: legacy.origin,
  nodes: [],
  artifacts: [],
  activeTargets: [],
  signal: { locator: "qa:signal", ownerReceipt: "owner:signal", effectReceipt: null },
  next: { kind: "finalize", owner: "hub", predicate: "close admitted signal" },
};
await writeFile(signalInput, `${JSON.stringify(signalLegacy)}\n`, "utf8");
const signalFirst = runIn(signalDir, "advance", "--input", signalInput, "--expect-prior", "none");
const signalPointer = JSON.parse(await readFile(join(signalDir, "current.json"), "utf8"));
const signalHot = JSON.parse(await readFile(join(signalDir, signalPointer.receipt), "utf8"));
assert.deepEqual(signalHot.signal, signalLegacy.signal);
const lostSignal = { ...signalHot, signal: null };
await writeFile(signalInput, `${JSON.stringify(lostSignal)}\n`, "utf8");
assert.throws(
  () => runIn(signalDir, "advance", "--input", signalInput, "--expect-prior", signalFirst),
  /unclosed signal or owner receipt changed/,
);
const closedSignal = { ...signalHot, signal: { ...signalHot.signal, effectReceipt: "effect:signal" } };
await writeFile(signalInput, `${JSON.stringify(closedSignal)}\n`, "utf8");
const signalSecond = runIn(signalDir, "advance", "--input", signalInput, "--expect-prior", signalFirst);
assert.match(signalSecond, /^sha256:[0-9a-f]{64}$/);
const closedSignalPointer = JSON.parse(await readFile(join(signalDir, "current.json"), "utf8"));
const closedSignalHot = JSON.parse(await readFile(join(signalDir, closedSignalPointer.receipt), "utf8"));
assert.equal(closedSignalHot.signal, null);

const reopenedSignal = {
  ...closedSignalHot,
  signal: { locator: "qa:signal", ownerReceipt: "owner:signal", effectReceipt: null },
};
await writeFile(signalInput, `${JSON.stringify(reopenedSignal)}\n`, "utf8");
assert.throws(
  () => runIn(signalDir, "advance", "--input", signalInput, "--expect-prior", signalSecond),
  /archived closed signal identity cannot reopen/,
);
assert.equal(JSON.parse(await readFile(join(signalDir, "current.json"), "utf8")).digest, signalSecond);

const distinctSignal = {
  ...closedSignalHot,
  signal: { locator: "qa:distinct-signal", ownerReceipt: "owner:distinct-signal", effectReceipt: null },
};
await writeFile(signalInput, `${JSON.stringify(distinctSignal)}\n`, "utf8");
const distinctSignalDigest = runIn(
  signalDir,
  "advance",
  "--input",
  signalInput,
  "--expect-prior",
  signalSecond,
);
assert.equal(runIn(signalDir, "verify", "--expect-prior", distinctSignalDigest), distinctSignalDigest);

const singleFailureInput = join(root, "single-failure.json");
const singleFailureDir = join(receiptRoot, "single-failure");
await writeFile(singleFailureInput, `${JSON.stringify({
  schema: "hub-state-receipt/v2",
  mission: "single-failure",
  origin: legacy.origin,
  nodes: [],
  artifacts: [],
  activeTargets: [],
  observation: { window: "single-window", transportFailure: { key: "one-off", count: 1 } },
  next: { kind: "finalize", owner: "hub", predicate: "archive one-off transport failure" },
})}\n`, "utf8");
runIn(singleFailureDir, "advance", "--input", singleFailureInput, "--expect-prior", "none");
const singleFailurePointer = JSON.parse(await readFile(join(singleFailureDir, "current.json"), "utf8"));
const singleFailureHot = JSON.parse(await readFile(join(singleFailureDir, singleFailurePointer.receipt), "utf8"));
assert.equal(singleFailureHot.transportFailure, null);
await unlink(join(singleFailureDir, "current.json"));
assert.throws(
  () => runIn(singleFailureDir, "advance", "--input", singleFailureInput, "--expect-prior", "none"),
  /receipt directory is not empty but current pointer is missing/,
);

const terminalNativeV1 = {
  schema: "hub-state-receipt/v1",
  mission: "terminal-native-v1",
  origin: legacy.origin,
  nodes: [{
    id: "legacy-native-terminal",
    state: "terminal",
    owner: "legacy",
    dependsOn: [],
    dispatchReceipt: { kind: "native_task", locator: "dispatch:legacy-native" },
    nativeTaskReceipt: { kind: "native_task", locator: "task:legacy-native" },
    terminalReceipt: "done:legacy-native",
  }],
  artifacts: [],
  next: { kind: "finalize", owner: "hub", predicate: "archive terminal v1 native custody" },
};
const terminalNativeV1Path = join(root, "terminal-native-v1.json");
const terminalNativeV1Source = `${JSON.stringify(terminalNativeV1)}\n`;
const terminalNativeV1Digest = sha256(terminalNativeV1Source);
const terminalNativeV1Dir = join(receiptRoot, "terminal-native-v1");
await mkdir(terminalNativeV1Dir);
await writeFile(terminalNativeV1Path, terminalNativeV1Source, "utf8");
await writeFile(join(terminalNativeV1Dir, `${terminalNativeV1Digest.slice(7)}.json`), terminalNativeV1Source, "utf8");
await writeFile(join(terminalNativeV1Dir, "current.json"), `${JSON.stringify({
  schema: "hub-state-pointer/v1",
  digest: terminalNativeV1Digest,
  receipt: `${terminalNativeV1Digest.slice(7)}.json`,
})}\n`, "utf8");
const migratedTerminalNativeV1 = runIn(
  terminalNativeV1Dir,
  "advance",
  "--input",
  terminalNativeV1Path,
  "--expect-prior",
  terminalNativeV1Digest,
);
assert.equal(runIn(terminalNativeV1Dir, "verify", "--expect-prior", migratedTerminalNativeV1), migratedTerminalNativeV1);

const terminalLegacyTask = {
  schema: "hub-state-receipt/v2",
  mission: "terminal-legacy-task",
  origin: legacy.origin,
  nodes: [{
    id: "legacy-task-terminal",
    state: "terminal",
    owner: "legacy",
    dependsOn: [],
    dispatchReceipt: { kind: "native_task", locator: "dispatch:legacy-task" },
    legacyV1TaskReceipt: { kind: "native_task", locator: "task:legacy-task" },
    terminalReceipt: "done:legacy-task",
  }],
  artifacts: [],
  activeTargets: [],
  observation: { window: null, transportFailure: null },
  next: { kind: "finalize", owner: "hub", predicate: "archive terminal legacy Task custody" },
};
const terminalLegacyTaskPath = join(root, "terminal-legacy-task.json");
const terminalLegacyTaskDir = join(receiptRoot, "terminal-legacy-task");
const terminalLegacyTaskSource = `${JSON.stringify(terminalLegacyTask)}\n`;
const terminalLegacyTaskDigest = sha256(terminalLegacyTaskSource);
await writeFile(terminalLegacyTaskPath, terminalLegacyTaskSource, "utf8");
await mkdir(terminalLegacyTaskDir);
await writeFile(
  join(terminalLegacyTaskDir, `${terminalLegacyTaskDigest.slice(7)}.json`),
  terminalLegacyTaskSource,
  "utf8",
);
await writeFile(join(terminalLegacyTaskDir, "current.json"), `${JSON.stringify({
  schema: "hub-state-pointer/v1",
  digest: terminalLegacyTaskDigest,
  receipt: `${terminalLegacyTaskDigest.slice(7)}.json`,
})}\n`, "utf8");
const terminalLegacyFirst = runIn(
  terminalLegacyTaskDir,
  "advance",
  "--input",
  terminalLegacyTaskPath,
  "--expect-prior",
  terminalLegacyTaskDigest,
);
const terminalLegacyPointer = JSON.parse(await readFile(join(terminalLegacyTaskDir, "current.json"), "utf8"));
const terminalLegacyHot = JSON.parse(await readFile(join(terminalLegacyTaskDir, terminalLegacyPointer.receipt), "utf8"));
terminalLegacyHot.custody.nodes.push({
  id: "reopened-legacy-task",
  state: "runnable",
  owner: "new-owner",
  dependsOn: [],
  dispatchReceipt: { kind: "native_task", locator: "dispatch:new-owner" },
  nativeTaskReceipt: { kind: "native_task", locator: "task:legacy-task", threadId: "new-thread", hostId: "new-host" },
});
terminalLegacyHot.activeTargets.push({ node: "reopened-legacy-task", threadId: "new-thread", hostId: "new-host", cursor: null });
terminalLegacyHot.next = { kind: "dispatch", mode: "continue", node: "reopened-legacy-task", owner: "hub", predicate: "must not reopen legacy Task" };
await writeFile(terminalLegacyTaskPath, `${JSON.stringify(terminalLegacyHot)}\n`, "utf8");
assert.throws(
  () => runIn(terminalLegacyTaskDir, "advance", "--input", terminalLegacyTaskPath, "--expect-prior", terminalLegacyFirst),
  /archived native or legacy Task identity cannot be reused/,
);

const inventedLegacyInput = join(root, "invented-legacy-task.json");
const inventedLegacyDir = join(receiptRoot, "invented-legacy-task");
const emptyLegacySource = `${JSON.stringify({
  schema: "hub-state-receipt/v2",
  mission: "invented-legacy-task",
  origin: legacy.origin,
  nodes: [],
  artifacts: [],
  activeTargets: [],
  observation: { transportFailure: null },
  next: { kind: "finalize", owner: "hub", predicate: "preserve empty custody" },
})}\n`;
await writeFile(inventedLegacyInput, emptyLegacySource, "utf8");
const inventedLegacyFirst = runIn(
  inventedLegacyDir,
  "advance",
  "--input",
  inventedLegacyInput,
  "--expect-prior",
  "none",
);
const inventedLegacyPointer = JSON.parse(await readFile(join(inventedLegacyDir, "current.json"), "utf8"));
const inventedLegacyHot = JSON.parse(await readFile(join(inventedLegacyDir, inventedLegacyPointer.receipt), "utf8"));
inventedLegacyHot.custody.nodes.push({
  id: "invented-legacy",
  state: "frozen",
  owner: "hub",
  dependsOn: [],
  dispatchReceipt: { kind: "native_task", locator: "dispatch:invented-legacy" },
  legacyV1TaskReceipt: { kind: "native_task", locator: "task:invented-legacy" },
  stateReceipt: "owner:frozen",
});
await writeFile(inventedLegacyInput, `${JSON.stringify(inventedLegacyHot)}\n`, "utf8");
assert.throws(
  () => runIn(inventedLegacyDir, "advance", "--input", inventedLegacyInput, "--expect-prior", inventedLegacyFirst),
  /legacy v1 Task receipt lacks exact predecessor custody/,
);
assert.equal(
  JSON.parse(await readFile(join(inventedLegacyDir, "current.json"), "utf8")).digest,
  inventedLegacyFirst,
);

const transportInput = join(root, "transport-transition.json");
const transportDir = join(receiptRoot, "transport-transition");
const transportInitial = {
  schema: "hub-state-receipt/v2",
  mission: "transport-transition",
  origin: legacy.origin,
  nodes: [{
    id: "observed-task",
    state: "running",
    owner: "hub",
    dependsOn: [],
    dispatchReceipt: { kind: "client_thread", locator: "client:observed-task" },
    nativeTaskReceipt: {
      kind: "native_task",
      locator: "task:observed-task",
      threadId: "thread-observed",
      hostId: "host-observed",
    },
  }],
  artifacts: [],
  activeTargets: [{
    node: "observed-task",
    threadId: "thread-observed",
    hostId: "host-observed",
    cursor: "cursor-1",
  }],
  observation: { window: "window-1", transportFailure: { key: "wait:timeout", count: 1 } },
  next: { kind: "observe", owner: "hub", predicate: "retry observation" },
};
const unbackedRepeatedInput = join(root, "unbacked-repeated-transport.json");
const unbackedRepeatedDir = join(receiptRoot, "unbacked-repeated-transport");
const unbackedRepeated = {
  schema: "continuity-receipt/v2",
  mission: "unbacked-repeated-transport",
  origin: transportInitial.origin,
  activeTargets: transportInitial.activeTargets,
  transportFailure: { key: "wait:timeout", count: 2 },
  signal: null,
  custody: { nodes: transportInitial.nodes, artifacts: [] },
  closureManifest: null,
  next: transportInitial.next,
};
await writeFile(unbackedRepeatedInput, `${JSON.stringify(unbackedRepeated)}\n`, "utf8");
assert.throws(
  () => runIn(
    unbackedRepeatedDir,
    "advance",
    "--input",
    unbackedRepeatedInput,
    "--expect-prior",
    "none",
  ),
  /omitted observation window requires exact verified predecessor custody/,
);
await assert.rejects(() => lstat(join(unbackedRepeatedDir, "current.json")), { code: "ENOENT" });

const unbackedWindowedRepeatedInput = join(root, "unbacked-windowed-repeated-transport.json");
const unbackedWindowedRepeatedDir = join(receiptRoot, "unbacked-windowed-repeated-transport");
const unbackedWindowedRepeated = structuredClone(unbackedRepeated);
unbackedWindowedRepeated.mission = "unbacked-windowed-repeated-transport";
unbackedWindowedRepeated.observation = {
  window: "unbacked-window",
  transportFailure: { key: "wait:timeout", count: 3 },
};
await writeFile(
  unbackedWindowedRepeatedInput,
  `${JSON.stringify(unbackedWindowedRepeated)}\n`,
  "utf8",
);
assert.throws(
  () => runIn(
    unbackedWindowedRepeatedDir,
    "advance",
    "--input",
    unbackedWindowedRepeatedInput,
    "--expect-prior",
    "none",
  ),
  /initial failure count must start at one/,
);
await assert.rejects(
  () => lstat(join(unbackedWindowedRepeatedDir, "current.json")),
  { code: "ENOENT" },
);

const unwindowedTransportInput = join(root, "unwindowed-transport.json");
const unwindowedTransportDir = join(receiptRoot, "unwindowed-transport");
const unwindowedTransport = structuredClone(transportInitial);
unwindowedTransport.mission = "unwindowed-transport";
unwindowedTransport.observation.window = null;
await writeFile(unwindowedTransportInput, `${JSON.stringify(unwindowedTransport)}\n`, "utf8");
assert.throws(
  () => runIn(
    unwindowedTransportDir,
    "advance",
    "--input",
    unwindowedTransportInput,
    "--expect-prior",
    "none",
  ),
  /active failure requires an observation window/,
);
await assert.rejects(() => lstat(join(unwindowedTransportDir, "current.json")), { code: "ENOENT" });

await writeFile(transportInput, `${JSON.stringify(transportInitial)}\n`, "utf8");
const transportFirst = runIn(transportDir, "advance", "--input", transportInput, "--expect-prior", "none");
const transportPointer = JSON.parse(await readFile(join(transportDir, "current.json"), "utf8"));
const transportHot = JSON.parse(await readFile(join(transportDir, transportPointer.receipt), "utf8"));
assert.equal(transportHot.transportFailure, null);

const cursorAdvanceWithoutSuccess = structuredClone(transportHot);
cursorAdvanceWithoutSuccess.activeTargets[0].cursor = "cursor-2";
await writeFile(transportInput, `${JSON.stringify(cursorAdvanceWithoutSuccess)}\n`, "utf8");
assert.throws(
  () => runIn(transportDir, "advance", "--input", transportInput, "--expect-prior", transportFirst),
  /cursor advance after transport failure requires a fresh successful observation window/,
);
assert.equal(JSON.parse(await readFile(join(transportDir, "current.json"), "utf8")).digest, transportFirst);
assert.equal(runIn(transportDir, "verify", "--expect-prior", transportFirst), transportFirst);

const additionalTransportNode = {
  id: "additional-task",
  state: "running",
  owner: "hub",
  dependsOn: [],
  dispatchReceipt: { kind: "client_thread", locator: "client:additional-task" },
  nativeTaskReceipt: {
    kind: "native_task",
    locator: "task:additional-task",
    threadId: "thread-additional",
    hostId: "host-additional",
  },
};
const cursorAdvanceWithAddedTarget = structuredClone(cursorAdvanceWithoutSuccess);
cursorAdvanceWithAddedTarget.custody.nodes.push(additionalTransportNode);
cursorAdvanceWithAddedTarget.activeTargets.push({
  node: "additional-task",
  threadId: "thread-additional",
  hostId: "host-additional",
  cursor: null,
});
await writeFile(transportInput, `${JSON.stringify(cursorAdvanceWithAddedTarget)}\n`, "utf8");
assert.throws(
  () => runIn(transportDir, "advance", "--input", transportInput, "--expect-prior", transportFirst),
  /cursor advance after transport failure requires a fresh successful observation window/,
);
assert.equal(JSON.parse(await readFile(join(transportDir, "current.json"), "utf8")).digest, transportFirst);

const expandedTransportDir = join(receiptRoot, "expanded-transport");
const expandedTransportInput = join(root, "expanded-transport.json");
const expandedTransportInitial = structuredClone(transportInitial);
expandedTransportInitial.mission = "expanded-transport";
await writeFile(expandedTransportInput, `${JSON.stringify(expandedTransportInitial)}\n`, "utf8");
const expandedFirst = runIn(
  expandedTransportDir,
  "advance",
  "--input",
  expandedTransportInput,
  "--expect-prior",
  "none",
);
const expandedPointer = JSON.parse(await readFile(join(expandedTransportDir, "current.json"), "utf8"));
const expandedHot = JSON.parse(await readFile(join(expandedTransportDir, expandedPointer.receipt), "utf8"));
expandedHot.custody.nodes.push(additionalTransportNode);
expandedHot.activeTargets.push({
  node: "additional-task",
  threadId: "thread-additional",
  hostId: "host-additional",
  cursor: null,
});
await writeFile(expandedTransportInput, `${JSON.stringify(expandedHot)}\n`, "utf8");
const expandedSecond = runIn(
  expandedTransportDir,
  "advance",
  "--input",
  expandedTransportInput,
  "--expect-prior",
  expandedFirst,
);
assert.equal(runIn(expandedTransportDir, "verify", "--expect-prior", expandedSecond), expandedSecond);
const expandedSecondPointer = JSON.parse(await readFile(join(expandedTransportDir, "current.json"), "utf8"));
const expandedSecondHot = JSON.parse(
  await readFile(join(expandedTransportDir, expandedSecondPointer.receipt), "utf8"),
);
const expandedUnevidencedAdvance = structuredClone(expandedSecondHot);
expandedUnevidencedAdvance.activeTargets.find((target) => target.node === "observed-task").cursor = "cursor-2";
await writeFile(expandedTransportInput, `${JSON.stringify(expandedUnevidencedAdvance)}\n`, "utf8");
assert.throws(
  () => runIn(
    expandedTransportDir,
    "advance",
    "--input",
    expandedTransportInput,
    "--expect-prior",
    expandedSecond,
  ),
  /cursor advance after transport failure requires a fresh successful observation window/,
);
assert.equal(
  JSON.parse(await readFile(join(expandedTransportDir, "current.json"), "utf8")).digest,
  expandedSecond,
);
assert.equal(runIn(expandedTransportDir, "verify", "--expect-prior", expandedSecond), expandedSecond);
const expandedSuccessfulAdvance = structuredClone(expandedUnevidencedAdvance);
expandedSuccessfulAdvance.observation = { window: "expanded-window-2", transportFailure: null };
await writeFile(expandedTransportInput, `${JSON.stringify(expandedSuccessfulAdvance)}\n`, "utf8");
const expandedThird = runIn(
  expandedTransportDir,
  "advance",
  "--input",
  expandedTransportInput,
  "--expect-prior",
  expandedSecond,
);
assert.equal(runIn(expandedTransportDir, "verify", "--expect-prior", expandedThird), expandedThird);

const ambiguousSuccess = structuredClone(cursorAdvanceWithoutSuccess);
ambiguousSuccess.observation = { window: "window-2" };
await writeFile(transportInput, `${JSON.stringify(ambiguousSuccess)}\n`, "utf8");
assert.throws(
  () => runIn(transportDir, "advance", "--input", transportInput, "--expect-prior", transportFirst),
  /a window must explicitly include transportFailure/,
);
assert.equal(JSON.parse(await readFile(join(transportDir, "current.json"), "utf8")).digest, transportFirst);

const reusedFirstWindow = structuredClone(transportHot);
reusedFirstWindow.observation = { window: "window-1", transportFailure: null };
await writeFile(transportInput, `${JSON.stringify(reusedFirstWindow)}\n`, "utf8");
assert.throws(
  () => runIn(transportDir, "advance", "--input", transportInput, "--expect-prior", transportFirst),
  /clearing observation window was already used/,
);
assert.equal(JSON.parse(await readFile(join(transportDir, "current.json"), "utf8")).digest, transportFirst);

await writeFile(transportInput, `${JSON.stringify(transportHot)}\n`, "utf8");
const transportPersisted = runIn(
  transportDir,
  "advance",
  "--input",
  transportInput,
  "--expect-prior",
  transportFirst,
);
const persistedPointer = JSON.parse(await readFile(join(transportDir, "current.json"), "utf8"));
const persistedHot = JSON.parse(await readFile(join(transportDir, persistedPointer.receipt), "utf8"));
persistedHot.observation = {
  window: "window-2",
  transportFailure: { key: "wait:timeout", count: 2 },
};
await writeFile(transportInput, `${JSON.stringify(persistedHot)}\n`, "utf8");
const transportSecond = runIn(
  transportDir,
  "advance",
  "--input",
  transportInput,
  "--expect-prior",
  transportPersisted,
);
const transportSecondPointer = JSON.parse(await readFile(join(transportDir, "current.json"), "utf8"));
const repeatedFailureHot = JSON.parse(await readFile(join(transportDir, transportSecondPointer.receipt), "utf8"));
assert.deepEqual(repeatedFailureHot.transportFailure, { key: "wait:timeout", count: 2 });

const duplicateWindowFailure = structuredClone(repeatedFailureHot);
duplicateWindowFailure.observation = {
  window: "window-2",
  transportFailure: { key: "wait:timeout", count: 3 },
};
await writeFile(transportInput, `${JSON.stringify(duplicateWindowFailure)}\n`, "utf8");
assert.throws(
  () => runIn(transportDir, "advance", "--input", transportInput, "--expect-prior", transportSecond),
  /transport failure observation window was already used/,
);
assert.equal(JSON.parse(await readFile(join(transportDir, "current.json"), "utf8")).digest, transportSecond);

repeatedFailureHot.observation = {
  window: "window-3",
  transportFailure: { key: "wait:timeout", count: 3 },
};
await writeFile(transportInput, `${JSON.stringify(repeatedFailureHot)}\n`, "utf8");
const transportThird = runIn(
  transportDir,
  "advance",
  "--input",
  transportInput,
  "--expect-prior",
  transportSecond,
);
const transportThirdPointer = JSON.parse(await readFile(join(transportDir, "current.json"), "utf8"));
const escalatedFailureHot = JSON.parse(await readFile(join(transportDir, transportThirdPointer.receipt), "utf8"));
assert.deepEqual(escalatedFailureHot.transportFailure, { key: "wait:timeout", count: 3 });

const unevidencedClear = structuredClone(escalatedFailureHot);
unevidencedClear.transportFailure = null;
await writeFile(transportInput, `${JSON.stringify(unevidencedClear)}\n`, "utf8");
assert.throws(
  () => runIn(transportDir, "advance", "--input", transportInput, "--expect-prior", transportThird),
  /clearing requires a fresh observation window/,
);
assert.equal(JSON.parse(await readFile(join(transportDir, "current.json"), "utf8")).digest, transportThird);

const sameWindowClear = structuredClone(unevidencedClear);
sameWindowClear.observation = { window: "window-3", transportFailure: null };
await writeFile(transportInput, `${JSON.stringify(sameWindowClear)}\n`, "utf8");
assert.throws(
  () => runIn(transportDir, "advance", "--input", transportInput, "--expect-prior", transportThird),
  /clearing observation window was already used/,
);
assert.equal(JSON.parse(await readFile(join(transportDir, "current.json"), "utf8")).digest, transportThird);

const historicalWindowClear = structuredClone(unevidencedClear);
historicalWindowClear.observation = { window: "window-1", transportFailure: null };
await writeFile(transportInput, `${JSON.stringify(historicalWindowClear)}\n`, "utf8");
assert.throws(
  () => runIn(transportDir, "advance", "--input", transportInput, "--expect-prior", transportThird),
  /clearing observation window was already used/,
);
assert.equal(JSON.parse(await readFile(join(transportDir, "current.json"), "utf8")).digest, transportThird);

const downgradedFailure = structuredClone(escalatedFailureHot);
downgradedFailure.observation = {
  window: "window-4",
  transportFailure: { key: "wait:timeout", count: 1 },
};
await writeFile(transportInput, `${JSON.stringify(downgradedFailure)}\n`, "utf8");
assert.throws(
  () => runIn(transportDir, "advance", "--input", transportInput, "--expect-prior", transportThird),
  /repeated transport failure count must be retained or incremented once/,
);
assert.equal(JSON.parse(await readFile(join(transportDir, "current.json"), "utf8")).digest, transportThird);

const advancedFailedCursor = structuredClone(escalatedFailureHot);
advancedFailedCursor.activeTargets[0].cursor = "cursor-2";
await writeFile(transportInput, `${JSON.stringify(advancedFailedCursor)}\n`, "utf8");
assert.throws(
  () => runIn(transportDir, "advance", "--input", transportInput, "--expect-prior", transportThird),
  /transport failure cannot advance a cursor/,
);
assert.equal(JSON.parse(await readFile(join(transportDir, "current.json"), "utf8")).digest, transportThird);

await writeFile(transportInput, `${JSON.stringify(escalatedFailureHot)}\n`, "utf8");
const transportUnchanged = runIn(
  transportDir,
  "advance",
  "--input",
  transportInput,
  "--expect-prior",
  transportThird,
);
const unchangedPointer = JSON.parse(await readFile(join(transportDir, "current.json"), "utf8"));
const successfulObservation = JSON.parse(await readFile(join(transportDir, unchangedPointer.receipt), "utf8"));
successfulObservation.transportFailure = null;
successfulObservation.activeTargets[0].cursor = "cursor-2";
successfulObservation.observation = { window: "window-4", transportFailure: null };
await writeFile(transportInput, `${JSON.stringify(successfulObservation)}\n`, "utf8");
const transportCleared = runIn(
  transportDir,
  "advance",
  "--input",
  transportInput,
  "--expect-prior",
  transportUnchanged,
);
assert.equal(runIn(transportDir, "verify", "--expect-prior", transportCleared), transportCleared);

const terminalFilesystemInput = join(root, "terminal-filesystem.json");
const terminalFilesystemDir = join(receiptRoot, "terminal-filesystem");
const terminalFilesystem = {
  schema: "hub-state-receipt/v2",
  mission: "terminal-filesystem",
  origin: legacy.origin,
  nodes: [],
  artifacts: [{
    id: "closed-checkout",
    kind: "checkout",
    owner: "hub",
    locator: `${retainedRoots[0]}/.`,
    identity: "checkout:closed",
    disposition: "terminal",
    terminalReceipt: "removed:closed-checkout",
  }],
  activeTargets: [],
  next: { kind: "finalize", owner: "hub", predicate: "archive terminal checkout" },
};
await writeFile(terminalFilesystemInput, `${JSON.stringify(terminalFilesystem)}\n`, "utf8");
assert.throws(
  () => runIn(terminalFilesystemDir, "advance", "--input", terminalFilesystemInput, "--expect-prior", "none"),
  /filesystem locator must be a canonical absolute path/,
);
const aliasPhysical = join(root, "alias-physical");
const aliasPath = join(root, "alias");
await mkdir(aliasPhysical);
await symlink(aliasPhysical, aliasPath, "dir");
terminalFilesystem.artifacts[0].locator = join(aliasPath, "removed");
await writeFile(terminalFilesystemInput, `${JSON.stringify(terminalFilesystem)}\n`, "utf8");
assert.throws(
  () => runIn(terminalFilesystemDir, "advance", "--input", terminalFilesystemInput, "--expect-prior", "none"),
  /filesystem locator must (?:be a physical canonical path|not contain a symlink)/,
);
await assert.rejects(() => lstat(join(terminalFilesystemDir, "current.json")), { code: "ENOENT" });
await unlink(aliasPath);
terminalFilesystem.artifacts[0].locator = join(root, "already-removed-checkout");
await writeFile(terminalFilesystemInput, `${JSON.stringify(terminalFilesystem)}\n`, "utf8");
const terminalFilesystemDigest = runIn(
  terminalFilesystemDir,
  "advance",
  "--input",
  terminalFilesystemInput,
  "--expect-prior",
  "none",
);
assert.equal(runIn(terminalFilesystemDir, "verify", "--expect-prior", terminalFilesystemDigest), terminalFilesystemDigest);

const cleanupPath = join(root, "cleanup-checkout");
await mkdir(cleanupPath);
const cleanupInput = join(root, "cleanup-transition.json");
const cleanupDir = join(receiptRoot, "cleanup-transition");
await writeFile(cleanupInput, `${JSON.stringify({
  schema: "hub-state-receipt/v2",
  mission: "cleanup-transition",
  origin: legacy.origin,
  nodes: [],
  artifacts: [{
    id: "cleanup-checkout",
    kind: "checkout",
    owner: "hub",
    locator: cleanupPath,
    identity: "checkout:cleanup",
    disposition: "retained",
  }],
  activeTargets: [],
  next: { kind: "finalize", owner: "hub", predicate: "perform authorized cleanup" },
})}\n`, "utf8");
const cleanupFirst = runIn(cleanupDir, "advance", "--input", cleanupInput, "--expect-prior", "none");
const cleanupPointer = JSON.parse(await readFile(join(cleanupDir, "current.json"), "utf8"));
const cleanupHot = JSON.parse(await readFile(join(cleanupDir, cleanupPointer.receipt), "utf8"));
await rmdir(cleanupPath);
await writeFile(cleanupInput, `${JSON.stringify(cleanupHot)}\n`, "utf8");
assert.throws(
  () => runIn(cleanupDir, "advance", "--input", cleanupInput, "--expect-prior", cleanupFirst),
  /ENOENT/,
);
assert.equal(JSON.parse(await readFile(join(cleanupDir, "current.json"), "utf8")).digest, cleanupFirst);
cleanupHot.custody.artifacts[0].disposition = "terminal";
cleanupHot.custody.artifacts[0].terminalReceipt = "cleanup:authorized";
await writeFile(cleanupInput, `${JSON.stringify(cleanupHot)}\n`, "utf8");
const cleanupSecond = runIn(cleanupDir, "advance", "--input", cleanupInput, "--expect-prior", cleanupFirst);
assert.equal(runIn(cleanupDir, "verify", "--expect-prior", cleanupSecond), cleanupSecond);

const terminalV1 = {
  schema: "hub-state-receipt/v1",
  mission: "terminal-v1",
  origin: legacy.origin,
  nodes: [{ id: "legacy-terminal", state: "terminal", owner: "legacy", dependsOn: [], terminalReceipt: "done" }],
  artifacts: [],
  next: { kind: "finalize", owner: "hub", predicate: "legacy history archived" },
};
const terminalV1Path = join(root, "terminal-v1.json");
await writeFile(terminalV1Path, `${JSON.stringify(terminalV1)}\n`, "utf8");
const terminalV1Dir = join(receiptRoot, "terminal-v1");
const terminalV1Digest = runIn(terminalV1Dir, "advance", "--input", terminalV1Path, "--expect-prior", "none");
assert.equal(runIn(terminalV1Dir, "verify", "--expect-prior", terminalV1Digest), terminalV1Digest);

process.stdout.write("continuity receipt tests passed\n");
