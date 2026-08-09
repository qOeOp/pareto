import assert from "node:assert/strict";
import { chmod, cp, lstat, mkdir, mkdtemp, readFile, rm, symlink, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { spawnSync } from "node:child_process";
import { pathToFileURL } from "node:url";

const root = await mkdtemp(join(tmpdir(), "qoeop-skills-install-"));
const agentsRoot = join(root, "agents-home");
const codexRoot = join(root, "codex-home");
const argv = ["scripts/install-codex.mjs", "--agents-root", agentsRoot, "--codex-root", codexRoot];
const hookedArgv = [...argv, "--install-trade-session-hook"];
const gitEnvironment = Object.fromEntries(
  Object.entries(process.env).filter(([name]) => !/^GIT_/i.test(name)),
);

function git(cwd, ...args) {
  return spawnSync("git", ["-C", cwd, ...args], { encoding: "utf8", env: gitEnvironment });
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
  await mkdir(codexRoot, { recursive: true });
  await writeFile(join(codexRoot, "hooks.json"), `${JSON.stringify({
    hooks: {
      SessionStart: [{
        matcher: "startup",
        hooks: [
          { type: "command", command: "node temporary-owned-placeholder.mjs" },
          { type: "command", command: "node preserved-shared-hook.mjs" },
        ],
      }],
      UserPromptSubmit: [{ hooks: [{ type: "command", command: "node preserved-hook.mjs" }] }],
    },
  })}\n`);
  let result = spawnSync(process.execPath, hookedArgv, { encoding: "utf8" });
  assert.equal(result.status, 0, result.stderr);
  result = spawnSync(process.execPath, [...hookedArgv, "--check"], { encoding: "utf8" });
  assert.equal(result.status, 0, result.stderr);
  const installedHooks = JSON.parse(await readFile(join(codexRoot, "hooks.json"), "utf8"));
  assert.equal(installedHooks.hooks.UserPromptSubmit[0].hooks[0].command, "node preserved-hook.mjs");
  assert.equal(installedHooks.hooks.SessionStart.length, 2);
  assert.equal(installedHooks.hooks.SessionStart[0].hooks[1].command, "node preserved-shared-hook.mjs");
  installedHooks.hooks.SessionStart.at(-1).hooks.push({ type: "command", command: "node preserved-owned-group-hook.mjs" });
  await writeFile(join(codexRoot, "hooks.json"), `${JSON.stringify(installedHooks)}\n`);
  result = spawnSync(process.execPath, hookedArgv, { encoding: "utf8" });
  assert.equal(result.status, 0, result.stderr);
  const reinstalledCommands = JSON.stringify(JSON.parse(await readFile(join(codexRoot, "hooks.json"), "utf8")));
  assert.match(reinstalledCommands, /preserved-owned-group-hook\.mjs/);

  const duplicateRoot = join(root, "duplicate-codex-home");
  const duplicateHooks = '{"hooks":{"UserPromptSubmit":[]},"hooks":{"SessionStart":[]}}\n';
  await mkdir(duplicateRoot, { recursive: true });
  await writeFile(join(duplicateRoot, "hooks.json"), duplicateHooks);
  result = spawnSync(process.execPath, [
    "scripts/install-codex.mjs",
    "--agents-root", join(root, "duplicate-agents-home"),
    "--codex-root", duplicateRoot,
    "--install-trade-session-hook",
  ], { encoding: "utf8" });
  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /duplicate JSON member: hooks/);
  assert.equal(await readFile(join(duplicateRoot, "hooks.json"), "utf8"), duplicateHooks);

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
  await cp("codex/hooks", join(repositoryRoot, "codex", "hooks"), { recursive: true });
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
  assert.equal(git(repositoryRoot, "remote", "set-url", "origin", "https://github.com/qOeOp/skills.git").status, 0);
  const exactLock = {
    schema_version: 2,
    repository: "https://github.com/qOeOp/skills.git",
    commit: field("HEAD"),
    tree: field("HEAD^{tree}"),
    skill_tree: field("HEAD:skills/run-bounded-mission"),
    codex_agents_tree: field("HEAD:codex/agents"),
    codex_session_hook_blob: field("HEAD:codex/hooks/qoeop-trade-session-start.mjs"),
    installer_blob: field("HEAD:scripts/install-codex.mjs"),
  };
  await writeFile(lock, `${JSON.stringify(exactLock)}\n`);
  const redirectedRepository = join(root, "redirected-source");
  assert.equal(git(root, "clone", repositoryRoot, redirectedRepository).status, 0);
  assert.equal(git(redirectedRepository, "config", "user.name", "Installer Test").status, 0);
  assert.equal(git(redirectedRepository, "config", "user.email", "installer@example.invalid").status, 0);
  await writeFile(join(redirectedRepository, "skills", "run-bounded-mission", "SKILL.md"), "redirected\n");
  assert.equal(git(redirectedRepository, "add", "skills/run-bounded-mission/SKILL.md").status, 0);
  assert.equal(git(redirectedRepository, "commit", "-m", "redirected authority").status, 0);
  const poisonedGitEnvironment = {
    ...process.env,
    [process.platform === "win32" ? "git_dir" : "GIT_DIR"]: join(redirectedRepository, ".git"),
    [process.platform === "win32" ? "Git_Work_Tree" : "GIT_WORK_TREE"]: redirectedRepository,
    [process.platform === "win32" ? "git_index_file" : "GIT_INDEX_FILE"]:
      join(redirectedRepository, ".git", "index"),
  };
  const lockedArgv = [
    join(repositoryRoot, "scripts", "install-codex.mjs"),
    "--agents-root",
    agentsRoot,
    "--codex-root",
    codexRoot,
    "--lock",
    lock,
    "--install-trade-session-hook",
  ];
  result = spawnSync(process.execPath, lockedArgv, { encoding: "utf8", env: poisonedGitEnvironment });
  assert.equal(result.status, 0, result.stderr);
  result = spawnSync(process.execPath, [...lockedArgv, "--check"], { encoding: "utf8" });
  assert.equal(result.status, 0, result.stderr);

  if (process.platform !== "win32") {
  const consumerOrigin = join(root, "consumer.git");
  const consumer = join(root, "consumer");
  assert.equal(git(root, "init", "--bare", consumerOrigin).status, 0);
  await mkdir(consumer, { recursive: true });
  assert.equal(git(consumer, "init", "-b", "main").status, 0);
  assert.equal(git(consumer, "config", "user.name", "Consumer Test").status, 0);
  assert.equal(git(consumer, "config", "user.email", "consumer@example.invalid").status, 0);
  await writeFile(join(consumer, "codex-skills.lock.json"), `${JSON.stringify(exactLock)}\n`);
  assert.equal(git(consumer, "add", "codex-skills.lock.json").status, 0);
  assert.equal(git(consumer, "commit", "-m", "current pin").status, 0);
  assert.equal(git(consumer, "remote", "add", "origin", consumerOrigin).status, 0);
  assert.equal(git(consumer, "push", "-u", "origin", "main").status, 0);
  assert.equal(git(consumer, "remote", "set-url", "origin", "git@github.com:qOeOp/trade.git").status, 0);
  assert.equal(git(consumer, "config", `url.${pathToFileURL(consumerOrigin).href}.insteadOf`, "git@github.com:qOeOp/trade.git").status, 0);
  assert.equal(git(consumer, "switch", "-c", "historical").status, 0);
  await mkdir(join(consumer, ".agents", "skills", "run-bounded-mission"), { recursive: true });
  await writeFile(join(consumer, ".agents", "skills", "run-bounded-mission", "SKILL.md"), "historical\n");
  assert.equal(git(consumer, "add", ".agents/skills/run-bounded-mission/SKILL.md").status, 0);
  assert.equal(git(consumer, "commit", "-m", "historical local skill").status, 0);
  assert.equal(git(consumer, "config", "--get", "remote.origin.url").stdout.trim(), "git@github.com:qOeOp/trade.git");
  assert.equal((await lstat(join(consumer, ".agents", "skills", "run-bounded-mission", "SKILL.md"))).isFile(), true);
  const installedHook = join(codexRoot, "hooks", "qoeop-trade-session-start.mjs");
  result = spawnSync(process.execPath, [installedHook], {
    encoding: "utf8",
    env: poisonedGitEnvironment,
    input: JSON.stringify({ cwd: consumer, hook_event_name: "SessionStart", source: "startup" }),
  });
  assert.equal(result.status, 0, result.stderr);
  const hookOutput = JSON.parse(result.stdout);
  assert.match(hookOutput.hookSpecificOutput.additionalContext, /ignore the repository-local/);
  assert.match(hookOutput.hookSpecificOutput.additionalContext, new RegExp(exactLock.commit));

  assert.equal(git(consumer, "rm", "--cached", ".agents/skills/run-bounded-mission/SKILL.md").status, 0);
  assert.equal(git(consumer, "commit", "-m", "leave ignored local skill").status, 0);
  result = spawnSync(process.execPath, [installedHook], {
    encoding: "utf8",
    input: JSON.stringify({ cwd: consumer, hook_event_name: "SessionStart", source: "resume" }),
  });
  assert.equal(result.status, 0, result.stderr);
  assert.match(JSON.parse(result.stdout).hookSpecificOutput.additionalContext, /ignore the repository-local/);

  await rm(join(consumer, ".agents", "skills", "run-bounded-mission", "SKILL.md"));
  await mkdir(join(consumer, ".codex", "agents"), { recursive: true });
  await writeFile(join(consumer, ".codex", "agents", "mission-evaluator.toml"), "historical\n");
  result = spawnSync(process.execPath, [installedHook], {
    encoding: "utf8",
    input: JSON.stringify({ cwd: consumer, hook_event_name: "SessionStart", source: "resume" }),
  });
  assert.equal(result.status, 0, result.stderr);
  assert.equal(JSON.parse(result.stdout).continue, false);
  assert.match(JSON.parse(result.stdout).stopReason, /mission-evaluator\.toml/);
  await mkdir(join(consumer, "..scope"));
  result = spawnSync(process.execPath, [installedHook], {
    encoding: "utf8",
    input: JSON.stringify({ cwd: join(consumer, "..scope"), hook_event_name: "SessionStart", source: "resume" }),
  });
  assert.equal(result.status, 0, result.stderr);
  assert.equal(JSON.parse(result.stdout).continue, false);
  await rm(join(consumer, ".codex"), { recursive: true });
  assert.equal(git(consumer, "switch", "main").status, 0);
  result = spawnSync(process.execPath, [installedHook], {
    encoding: "utf8",
    input: JSON.stringify({ cwd: consumer, hook_event_name: "SessionStart", source: "startup" }),
  });
  assert.equal(result.status, 0, result.stderr);
  assert.equal(result.stdout, "");
  assert.equal(git(consumer, "switch", "historical").status, 0);
  await writeFile(join(consumer, ".agents", "skills", "run-bounded-mission", "SKILL.md"), "historical\n");

  const installedSkillFile = join(agentsRoot, "skills", "run-bounded-mission", "SKILL.md");
  const installedSkillBytes = await readFile(installedSkillFile);
  await writeFile(installedSkillFile, "drift\n");
  result = spawnSync(process.execPath, [installedHook], {
    encoding: "utf8",
    input: JSON.stringify({ cwd: consumer, hook_event_name: "SessionStart", source: "resume" }),
  });
  assert.equal(result.status, 0, result.stderr);
  assert.equal(JSON.parse(result.stdout).continue, false);
  await writeFile(installedSkillFile, installedSkillBytes);

  const installedAgentFile = join(codexRoot, "agents", "mission-evaluator.toml");
  const installedAgentBytes = await readFile(installedAgentFile);
  const assertPinBlocked = () => {
    const probe = spawnSync(process.execPath, [installedHook], {
      encoding: "utf8",
      input: JSON.stringify({ cwd: consumer, hook_event_name: "SessionStart", source: "resume" }),
    });
    assert.equal(probe.status, 0, probe.stderr);
    assert.equal(JSON.parse(probe.stdout).continue, false);
  };
  await writeFile(installedAgentFile, "drift\n");
  assertPinBlocked();
  await rm(installedAgentFile);
  assertPinBlocked();
  await symlink(join(repositoryRoot, "codex", "agents", "mission-evaluator.toml"), installedAgentFile);
  assertPinBlocked();
  await rm(installedAgentFile);
  await mkdir(installedAgentFile);
  assertPinBlocked();
  await rm(installedAgentFile, { recursive: true });
  await writeFile(installedAgentFile, installedAgentBytes);
  }

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
    env: poisonedGitEnvironment,
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

  result = spawnSync(process.execPath, hookedArgv, { encoding: "utf8" });
  assert.equal(result.status, 0, result.stderr);
  result = spawnSync(process.execPath, [...hookedArgv, "--check"], { encoding: "utf8" });
  assert.equal(result.status, 0, result.stderr);
} finally {
  await rm(root, { recursive: true, force: true });
}
