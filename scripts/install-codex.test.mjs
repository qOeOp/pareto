import assert from "node:assert/strict";
import { chmod, cp, lstat, mkdir, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { spawnSync } from "node:child_process";

const root = await mkdtemp(join(tmpdir(), "qoeop-skills-install-"));
const agentsRoot = join(root, "agents-home");
const codexRoot = join(root, "codex-home");
const argv = ["scripts/install-codex.mjs", "--agents-root", agentsRoot, "--codex-root", codexRoot];

function git(cwd, ...args) {
  return spawnSync("git", ["-C", cwd, ...args], { encoding: "utf8" });
}

function canonicalLine(value) {
  const normalize = (entry) => {
    if (Array.isArray(entry)) return entry.map(normalize);
    if (entry && typeof entry === "object") {
      return Object.fromEntries(Object.keys(entry).sort().map((key) => [key, normalize(entry[key])]));
    }
    return entry;
  };
  return `${JSON.stringify(normalize(value))}\n`;
}

try {
  let result = spawnSync(process.execPath, argv, { encoding: "utf8" });
  assert.equal(result.status, 0, result.stderr);
  result = spawnSync(process.execPath, [...argv, "--check"], { encoding: "utf8" });
  assert.equal(result.status, 0, result.stderr);

  const lock = join(root, "codex-skills.lock.json");
  const repositoryRoot = join(root, "source");
const origin = join(root, "qOeOp", "skills.git");
  await mkdir(join(repositoryRoot, "scripts"), { recursive: true });
  await mkdir(join(repositoryRoot, "skills"), { recursive: true });
  await mkdir(join(repositoryRoot, "codex"), { recursive: true });
  await mkdir(join(root, "qOeOp"), { recursive: true });
  await cp("scripts/install-codex.mjs", join(repositoryRoot, "scripts", "install-codex.mjs"));
  await cp("skills/run-bounded-mission", join(repositoryRoot, "skills", "run-bounded-mission"), { recursive: true });
  await cp("codex/agents", join(repositoryRoot, "codex", "agents"), { recursive: true });
  assert.equal(git(root, "init", "--bare", origin).status, 0);
  assert.equal(git(repositoryRoot, "init", "-b", "main").status, 0);
  assert.equal(git(repositoryRoot, "config", "user.name", "Installer Test").status, 0);
  assert.equal(git(repositoryRoot, "config", "user.email", "installer@example.invalid").status, 0);
  assert.equal(git(repositoryRoot, "add", ".").status, 0);
  assert.equal(git(repositoryRoot, "commit", "-m", "fixture").status, 0);
  await writeFile(join(repositoryRoot, "candidate.txt"), "candidate\n");
  assert.equal(git(repositoryRoot, "add", "candidate.txt").status, 0);
  assert.equal(git(repositoryRoot, "commit", "-m", "candidate").status, 0);
  assert.equal(git(repositoryRoot, "remote", "add", "origin", origin).status, 0);
  assert.equal(git(repositoryRoot, "push", "-u", "origin", "main").status, 0);
  const field = (spec) => {
    const value = git(repositoryRoot, "rev-parse", spec);
    assert.equal(value.status, 0, value.stderr);
    return value.stdout.trim();
  };
  const remote = git(repositoryRoot, "remote", "get-url", "origin");
  assert.equal(remote.status, 0, remote.stderr);
  const exactLock = {
    schema_version: 1,
    repository: remote.stdout.trim(),
    commit: field("HEAD"),
    tree: field("HEAD^{tree}"),
    skill_tree: field("HEAD:skills/run-bounded-mission"),
    codex_agents_tree: field("HEAD:codex/agents"),
    installer_blob: field("HEAD:scripts/install-codex.mjs"),
  };
  await writeFile(lock, `${JSON.stringify(exactLock)}\n`);
  const lockedArgv = [
    join(repositoryRoot, "scripts", "install-codex.mjs"),
    "--agents-root",
    agentsRoot,
    "--codex-root",
    codexRoot,
    "--lock",
    lock,
  ];
  result = spawnSync(process.execPath, lockedArgv, { encoding: "utf8" });
  assert.equal(result.status, 0, result.stderr);
  result = spawnSync(process.execPath, [...lockedArgv, "--check"], { encoding: "utf8" });
  assert.equal(result.status, 0, result.stderr);

  const installedReceiptSource = join(
    agentsRoot,
    "skills",
    "run-bounded-mission",
    "scripts",
    "delivery-receipt.go",
  );
  const receiptBinary = join(root, process.platform === "win32" ? "delivery-receipt.exe" : "delivery-receipt");
  result = spawnSync("go", ["build", "-o", receiptBinary, installedReceiptSource], { encoding: "utf8" });
  assert.equal(result.status, 0, result.stderr);
  const head = field("HEAD");
  const base = field("HEAD^");
  const headTree = field("HEAD^{tree}");
  const baseTree = field(`${base}^{tree}`);
  const mergeTree = git(repositoryRoot, "merge-tree", "--write-tree", base, head);
  assert.equal(mergeTree.status, 0, mergeTree.stderr);
  const evidence = ["real_consumer", "root", "audit", "ci", "conversation", "drift"].map((kind) => ({
    content_sha256: null,
    head_oid: head,
    kind,
    locator: `fixture:${kind}`,
    result: "pass",
  }));
  const deliveryInput = {
    base_oid: base,
    base_ref: "main",
    evidence,
    head_oid: head,
    head_tree_oid: headTree,
    potential_merge_commit: { oid: head, tree: { oid: mergeTree.stdout.trim() } },
    pull_request: 1,
    queue_state: "none",
    repository: "qOeOp/skills",
    schema: "delivery-barrier-input/v3",
  };
  const runReceipt = (arguments_, input) => spawnSync(receiptBinary, arguments_, {
    cwd: repositoryRoot,
    encoding: "utf8",
    input,
  });
  const created = runReceipt(["create"], canonicalLine(deliveryInput));
  assert.equal(created.status, 0, created.stderr);
  const receiptDigest = JSON.parse(created.stdout).sha256;
  const verified = runReceipt(["verify", "--sha256", receiptDigest], created.stdout);
  assert.equal(verified.status, 0, verified.stderr);
  assert.equal(verified.stdout, created.stdout);

  const staleHead = structuredClone(deliveryInput);
  staleHead.head_oid = base;
  result = runReceipt(["create"], canonicalLine(staleHead));
  assert.equal(result.status, 2, result.stderr);
  assert.match(result.stderr, /candidate tree does not match the local head commit/);

  const wrongMergeTree = structuredClone(deliveryInput);
  wrongMergeTree.potential_merge_commit.tree.oid = baseTree;
  result = runReceipt(["create"], canonicalLine(wrongMergeTree));
  assert.equal(result.status, 2, result.stderr);
  assert.match(result.stderr, /merge tree does not match local base and head/);

  const wrongRepository = structuredClone(deliveryInput);
  wrongRepository.repository = "qOeOp/trade";
  result = runReceipt(["create"], canonicalLine(wrongRepository));
  assert.equal(result.status, 2, result.stderr);
  assert.match(result.stderr, /repository does not match local origin/);

  result = runReceipt(["verify", "--sha256", receiptDigest], ` ${created.stdout}`);
  assert.equal(result.status, 2, result.stderr);
  assert.match(result.stderr, /delivery receipt is not canonical JSON-LF/);
  result = runReceipt(["verify", "--sha256", receiptDigest], created.stdout);
  assert.equal(result.status, 0, result.stderr);
  assert.equal(result.stdout, created.stdout);

  const sourceSkill = join(repositoryRoot, "skills", "run-bounded-mission", "SKILL.md");
  const sourceAgent = join(repositoryRoot, "codex", "agents", "mission-evaluator.toml");
  const originalSkill = await readFile(sourceSkill);
  const originalAgent = await readFile(sourceAgent);
  await writeFile(sourceSkill, Buffer.concat([originalSkill, Buffer.from("dirty\n")]));
  result = spawnSync(process.execPath, [...lockedArgv, "--check"], { encoding: "utf8" });
  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /install source differs from the locked Git tree/);
  await writeFile(sourceSkill, originalSkill);

  await writeFile(sourceAgent, Buffer.concat([originalAgent, Buffer.from("dirty\n")]));
  result = spawnSync(process.execPath, [...lockedArgv, "--check"], { encoding: "utf8" });
  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /install source differs from the locked Git tree/);
  await writeFile(sourceAgent, originalAgent);

  const originalMode = (await lstat(sourceSkill)).mode & 0o777;
  const fileMode = git(repositoryRoot, "config", "--bool", "core.filemode");
  if (fileMode.status === 0 && fileMode.stdout.trim() === "true") {
    await chmod(sourceSkill, originalMode ^ 0o111);
    result = spawnSync(process.execPath, [...lockedArgv, "--check"], { encoding: "utf8" });
    assert.notEqual(result.status, 0);
    assert.match(result.stderr, /install source differs from the locked Git tree/);
    await chmod(sourceSkill, originalMode);
  }

  await writeFile(join(repositoryRoot, ".git", "info", "exclude"), "skills/run-bounded-mission/ignored-probe\n");
  await writeFile(join(repositoryRoot, "skills", "run-bounded-mission", "ignored-probe"), "dirty\n");
  result = spawnSync(process.execPath, [...lockedArgv, "--check"], { encoding: "utf8" });
  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /install source differs from the locked Git tree/);
  await rm(join(repositoryRoot, "skills", "run-bounded-mission", "ignored-probe"));

  await writeFile(lock, `${JSON.stringify({ ...exactLock, skill_tree: "0".repeat(40) })}\n`);
  result = spawnSync(process.execPath, [...lockedArgv, "--check"], { encoding: "utf8" });
  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /Codex skills lock mismatch: skill_tree/);

  const skill = join(agentsRoot, "skills", "run-bounded-mission", "SKILL.md");
  assert.match(await readFile(skill, "utf8"), /Run Bounded Mission/);
  assert.match(await readFile(join(codexRoot, "agents", "mission-evaluator.toml"), "utf8"), /reviewer-handoff\.md/);

  await writeFile(skill, "drift\n");
  result = spawnSync(process.execPath, [...argv, "--check"], { encoding: "utf8" });
  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /Codex install mismatch: skill/);

  result = spawnSync(process.execPath, argv, { encoding: "utf8" });
  assert.equal(result.status, 0, result.stderr);
  result = spawnSync(process.execPath, [...argv, "--check"], { encoding: "utf8" });
  assert.equal(result.status, 0, result.stderr);
} finally {
  await rm(root, { recursive: true, force: true });
}
