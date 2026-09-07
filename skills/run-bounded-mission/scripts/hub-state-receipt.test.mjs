import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import { mkdir, mkdtemp, readFile, realpath, rename, rmdir, symlink, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { basename, dirname, join, sep } from "node:path";
import { fileURLToPath } from "node:url";

const script = join(dirname(fileURLToPath(import.meta.url)), "hub-state-receipt.mjs");
const root = await mkdtemp(join(await realpath(tmpdir()), "hub-state-receipt-"));
const receiptRoot = join(root, "hub-state-root");
await mkdir(receiptRoot, { mode: 0o700 });
const receiptDir = join(receiptRoot, "receipts");
const input = join(root, "input.json");
const artifactLocator = join(root, "workspace", "a");
await mkdir(artifactLocator, { recursive: true });
const origin = { repository: "https://example.invalid/repo", commit: "a".repeat(40), tree: "b".repeat(40) };
const artifact = {
  id: "candidate-a",
  kind: "worktree",
  owner: "task-a",
  locator: artifactLocator,
  identity: "branch=codex/a;head=abc;tree=def;dirty=none",
  disposition: "retained",
};
const base = {
  schema: "hub-state-receipt/v1",
  mission: "goal-1",
  origin,
  nodes: [
    {
      id: "a",
      state: "running",
      owner: "task-a",
      dependsOn: [],
      dispatchReceipt: { kind: "native_task", locator: "create:thread:a" },
      nativeTaskReceipt: { kind: "native_task", locator: "thread:a;host:h" },
    },
    { id: "b", state: "waiting", owner: "task-b", dependsOn: ["a"] },
  ],
  artifacts: [artifact],
  next: { kind: "observe", owner: "hub", predicate: "consume task-a terminal" },
};

async function setInput(value) {
  await writeFile(input, `${JSON.stringify(value)}\n`, "utf8");
}

function canonical(value) {
  if (Array.isArray(value)) return `[${value.map(canonical).join(",")}]`;
  if (value && typeof value === "object") {
    return `{${Object.keys(value).sort().map((key) => `${JSON.stringify(key)}:${canonical(value[key])}`).join(",")}}`;
  }
  return JSON.stringify(value);
}

function run(...args) {
  return runAtRoot(receiptRoot, ...args);
}

function runAtRoot(customRoot, ...args) {
  return execFileSync(process.execPath, [script, ...args, "--receipt-root", customRoot], {
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
  }).trim();
}

function rejects(pattern, ...args) {
  assert.throws(() => run(...args), pattern);
}

await setInput(base);
const first = run("advance", "--receipt-dir", receiptDir, "--input", input, "--expect-prior", "none");
assert.match(first, /^sha256:[0-9a-f]{64}$/);
assert.equal(run("verify", "--receipt-dir", receiptDir), first);
rejects(/absolute paths are required/, "verify", "--receipt-dir", "relative");

const recoveryReceiptDir = join(receiptRoot, "recovery-receipts");
await setInput(base);
const recoveryFirst = run("advance", "--receipt-dir", recoveryReceiptDir, "--input", input, "--expect-prior", "none");
await setInput({
  ...base,
  nodes: [{ ...base.nodes[0], state: "runnable" }, base.nodes[1]],
  next: { kind: "dispatch", mode: "continue", node: "a", owner: "hub", predicate: "recover missing Finalize" },
});
assert.match(
  run("advance", "--receipt-dir", recoveryReceiptDir, "--input", input, "--expect-prior", recoveryFirst),
  /^sha256:[0-9a-f]{64}$/,
);

const missingPointerDir = join(receiptRoot, "missing-pointer");
await setInput(base);
run("advance", "--receipt-dir", missingPointerDir, "--input", input, "--expect-prior", "none");
await rename(join(missingPointerDir, "current.json"), join(root, "removed-current.json"));
await setInput({ ...base, nodes: [], artifacts: [], next: { kind: "finalize", owner: "hub", predicate: "empty" } });
rejects(/receipt directory was already initialized/, "advance", "--receipt-dir", missingPointerDir, "--input", input, "--expect-prior", "none");

await setInput({
  ...base,
  nodes: [
    { id: "a", state: "runnable", owner: "task-a", dependsOn: [] },
    base.nodes[1],
  ],
  next: { kind: "dispatch", mode: "create", node: "a", owner: "hub", predicate: "recover missing Finalize" },
});
rejects(/consumed dispatch custody changed/, "advance", "--receipt-dir", receiptDir, "--input", input, "--expect-prior", first);

await setInput({ ...base, artifacts: [] });
rejects(/artifact disappeared/, "advance", "--receipt-dir", receiptDir, "--input", input, "--expect-prior", first);

await setInput({ ...base, nodes: [...base.nodes, { id: "c", state: "runnable", owner: "task-c", dependsOn: [] }] });
rejects(/runnable frontier must dispatch before observe/, "advance", "--receipt-dir", receiptDir, "--input", input, "--expect-prior", first);

await setInput({
  ...base,
  nodes: [
    { id: "a", state: "waiting", owner: "task-a", dependsOn: ["b"] },
    { id: "b", state: "waiting", owner: "task-b", dependsOn: ["a"] },
  ],
});
rejects(/dependency cycle/, "advance", "--receipt-dir", receiptDir, "--input", input, "--expect-prior", first);

await setInput({ ...base, nodes: [{ ...base.nodes[0], owner: "other" }, base.nodes[1]] });
rejects(/ownership or dependencies changed/, "advance", "--receipt-dir", receiptDir, "--input", input, "--expect-prior", first);

const dispatched = {
  ...base,
  nodes: [...base.nodes, { id: "c", state: "dispatch_pending", owner: "task-c", dependsOn: [], dispatchReceipt: { kind: "client_thread", locator: "clientThreadId:c" } }],
  next: { kind: "observe", owner: "hub", predicate: "map clientThreadId to threadId" },
};
await setInput(dispatched);
const second = run("advance", "--receipt-dir", receiptDir, "--input", input, "--expect-prior", first);
assert.notEqual(second, first);

await setInput({
  ...dispatched,
  nodes: dispatched.nodes.map((node) => node.id === "c" ? { ...node, state: "running" } : node),
});
rejects(/running node requires native Task receipt/, "advance", "--receipt-dir", receiptDir, "--input", input, "--expect-prior", second);

const mapped = {
  ...dispatched,
  nodes: dispatched.nodes.map((node) => node.id === "c"
    ? { ...node, state: "running", nativeTaskReceipt: { kind: "native_task", locator: "thread:c;host:h" } }
    : node),
};
await setInput(mapped);
const mappedDigest = run("advance", "--receipt-dir", receiptDir, "--input", input, "--expect-prior", second);

await setInput({
  ...mapped,
  nodes: [...mapped.nodes, {
    ...mapped.nodes.find((node) => node.id === "c"),
    id: "duplicate-c",
    dispatchReceipt: { kind: "client_thread", locator: "clientThreadId:duplicate-c" },
  }],
});
rejects(/native Task receipt reused by nodes/, "advance", "--receipt-dir", receiptDir, "--input", input, "--expect-prior", mappedDigest);

await setInput({
  ...mapped,
  nodes: [...mapped.nodes, {
    ...mapped.nodes.find((node) => node.id === "c"),
    id: "duplicate-dispatch-c",
    nativeTaskReceipt: { kind: "native_task", locator: "thread:duplicate-dispatch-c;host:h" },
  }],
});
rejects(/dispatch receipt reused by nodes/, "advance", "--receipt-dir", receiptDir, "--input", input, "--expect-prior", mappedDigest);

const terminal = {
  ...mapped,
  nodes: [
    {
      id: "a",
      state: "terminal",
      owner: "task-a",
      dependsOn: [],
      dispatchReceipt: { kind: "native_task", locator: "create:thread:a" },
      nativeTaskReceipt: { kind: "native_task", locator: "thread:a;host:h" },
      terminalReceipt: "merged:abc",
    },
    { id: "b", state: "runnable", owner: "task-b", dependsOn: ["a"] },
    {
      id: "c",
      state: "running",
      owner: "task-c",
      dependsOn: [],
      dispatchReceipt: { kind: "client_thread", locator: "clientThreadId:c" },
      nativeTaskReceipt: { kind: "native_task", locator: "thread:c;host:h" },
    },
  ],
  artifacts: [{ ...artifact, disposition: "terminal", terminalReceipt: "merge:abc" }],
  next: { kind: "dispatch", mode: "create", node: "b", owner: "hub", predicate: "release dependency successor" },
};
await setInput(terminal);
const third = run("advance", "--receipt-dir", receiptDir, "--input", input, "--expect-prior", mappedDigest);

await setInput({
  ...terminal,
  artifacts: [...terminal.artifacts, {
    ...terminal.artifacts[0],
    id: "candidate-a-alias",
    disposition: "retained",
    terminalReceipt: undefined,
  }],
});
rejects(/artifact custody locator reused by rows/, "advance", "--receipt-dir", receiptDir, "--input", input, "--expect-prior", third);

await setInput({
  ...terminal,
  artifacts: [...terminal.artifacts, {
    ...terminal.artifacts[0],
    id: "candidate-a-path-alias",
    locator: `${artifact.locator}${sep}..${sep}${basename(artifact.locator)}`,
    disposition: "retained",
    terminalReceipt: undefined,
  }],
});
rejects(/filesystem locator must be a canonical absolute path/, "advance", "--receipt-dir", receiptDir, "--input", input, "--expect-prior", third);

const artifactLocatorLink = join(root, "artifact-locator-link");
await symlink(artifact.locator, artifactLocatorLink, process.platform === "win32" ? "junction" : "dir");
await setInput({ ...base, artifacts: [{ ...artifact, locator: artifactLocatorLink }] });
rejects(/filesystem locator must not contain a symlink/, "advance", "--receipt-dir", join(receiptRoot, "artifact-link"), "--input", input, "--expect-prior", "none");

await setInput({ ...base, artifacts: [{ ...artifact, locator: join(root, "missing-worktree") }] });
rejects(/ENOENT/, "advance", "--receipt-dir", join(receiptRoot, "artifact-missing"), "--input", input, "--expect-prior", "none");

const disappearingArtifactLocator = join(root, "disappearing-worktree");
const disappearedArtifactLocator = join(root, "disappeared-worktree");
await mkdir(disappearingArtifactLocator);
const disappearingReceiptDir = join(receiptRoot, "artifact-disappearing");
const disappearing = { ...base, artifacts: [{ ...artifact, locator: disappearingArtifactLocator }] };
await setInput(disappearing);
const disappearingDigest = run("advance", "--receipt-dir", disappearingReceiptDir, "--input", input, "--expect-prior", "none");
await rename(disappearingArtifactLocator, disappearedArtifactLocator);
rejects(/ENOENT/, "verify", "--receipt-dir", disappearingReceiptDir, "--expect-prior", disappearingDigest);
await setInput({
  ...disappearing,
  artifacts: [{
    ...disappearing.artifacts[0],
    disposition: "terminal",
    terminalReceipt: "worktree-absent:verified",
  }],
  next: { kind: "finalize", owner: "hub", predicate: "absence reconciled" },
});
const disappearedDigest = run("advance", "--receipt-dir", disappearingReceiptDir, "--input", input, "--expect-prior", disappearingDigest);
assert.equal(run("verify", "--receipt-dir", disappearingReceiptDir, "--expect-prior", disappearedDigest), disappearedDigest);

await setInput({
  ...terminal,
  nodes: terminal.nodes.map((node) => node.id === "b" ? { ...node, state: "waiting" } : node),
  next: { kind: "observe", owner: "hub", predicate: "wait for unrelated gate" },
});
rejects(/waiting node without pending dependencies requires state receipt/, "advance", "--receipt-dir", receiptDir, "--input", input, "--expect-prior", third);

await setInput({
  ...terminal,
  nodes: [...terminal.nodes, {
    id: "duplicate-terminal",
    state: "terminal",
    owner: "task-duplicate-terminal",
    dependsOn: [],
    terminalReceipt: terminal.nodes[0].terminalReceipt,
  }],
});
rejects(/terminal receipt reused by nodes/, "advance", "--receipt-dir", receiptDir, "--input", input, "--expect-prior", third);

await setInput(dispatched);
rejects(/terminal node changed/, "advance", "--receipt-dir", receiptDir, "--input", input, "--expect-prior", third);
rejects(/stale prior/, "advance", "--receipt-dir", receiptDir, "--input", input, "--expect-prior", second);
assert.equal(run("verify", "--receipt-dir", receiptDir, "--expect-prior", third), third);
await mkdir(join(receiptDir, ".advance.lock"));
rejects(/receipt transition is locked/, "verify", "--receipt-dir", receiptDir, "--expect-prior", third);
await rmdir(join(receiptDir, ".advance.lock"));
const receiptLink = join(receiptRoot, "receipt-link");
await symlink(receiptDir, receiptLink);
rejects(/receipt path contains a symlink/, "verify", "--receipt-dir", receiptLink, "--expect-prior", third);

const receiptFileLinkDir = join(receiptRoot, "receipt-file-link");
await setInput(base);
const linkFirst = run("advance", "--receipt-dir", receiptFileLinkDir, "--input", input, "--expect-prior", "none");
const linkedNext = { ...base, artifacts: [{ ...artifact, identity: `${artifact.identity};updated=true` }] };
const linkedSource = `${canonical(linkedNext)}\n`;
const linkedDigest = createHash("sha256").update(linkedSource).digest("hex");
const linkedTarget = join(root, "linked-receipt-target.json");
await writeFile(linkedTarget, linkedSource, "utf8");
await symlink(linkedTarget, join(receiptFileLinkDir, `${linkedDigest}.json`));
await setInput(linkedNext);
rejects(/receipt file must be a regular non-symlink file/, "advance", "--receipt-dir", receiptFileLinkDir, "--input", input, "--expect-prior", linkFirst);

const realReceiptParent = join(receiptRoot, "real-receipt-parent");
const aliasedReceiptParent = join(receiptRoot, "aliased-receipt-parent");
await mkdir(realReceiptParent);
await symlink(realReceiptParent, aliasedReceiptParent);
await setInput(base);
rejects(/receipt path contains a symlink/, "advance", "--receipt-dir", join(aliasedReceiptParent, "mission"), "--input", input, "--expect-prior", "none");

const physicalRootParent = join(root, "physical-root-parent");
const aliasRootParent = join(root, "alias-root-parent");
await mkdir(physicalRootParent);
await mkdir(join(physicalRootParent, "hub-state-receipts"));
await symlink(physicalRootParent, aliasRootParent);
assert.throws(
  () => runAtRoot(
    join(aliasRootParent, "hub-state-receipts"),
    "advance",
    "--receipt-dir",
    join(aliasRootParent, "hub-state-receipts", "mission"),
    "--input",
    input,
    "--expect-prior",
    "none",
  ),
  /receipt root ancestry contains a symlink/,
);

const symlinkInput = join(root, "symlink.json");
await symlink(input, symlinkInput);
rejects(/non-symlink/, "advance", "--receipt-dir", join(receiptRoot, "other"), "--input", symlinkInput, "--expect-prior", "none");

const pointer = JSON.parse(await readFile(join(receiptDir, "current.json"), "utf8"));
assert.equal(pointer.digest, third);
process.stdout.write("hub state receipt tests passed\n");
