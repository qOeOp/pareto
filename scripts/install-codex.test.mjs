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

try {
  let result = spawnSync(process.execPath, argv, { encoding: "utf8" });
  assert.equal(result.status, 0, result.stderr);
  result = spawnSync(process.execPath, [...argv, "--check"], { encoding: "utf8" });
  assert.equal(result.status, 0, result.stderr);

  const lock = join(root, "codex-skills.lock.json");
  const repositoryRoot = join(root, "source");
  const origin = join(root, "origin.git");
  await mkdir(join(repositoryRoot, "scripts"), { recursive: true });
  await mkdir(join(repositoryRoot, "skills"), { recursive: true });
  await mkdir(join(repositoryRoot, "codex"), { recursive: true });
  await cp("scripts/install-codex.mjs", join(repositoryRoot, "scripts", "install-codex.mjs"));
  await cp("skills/run-bounded-mission", join(repositoryRoot, "skills", "run-bounded-mission"), { recursive: true });
  await cp("codex/agents", join(repositoryRoot, "codex", "agents"), { recursive: true });
  assert.equal(git(root, "init", "--bare", origin).status, 0);
  assert.equal(git(repositoryRoot, "init", "-b", "main").status, 0);
  assert.equal(git(repositoryRoot, "config", "user.name", "Installer Test").status, 0);
  assert.equal(git(repositoryRoot, "config", "user.email", "installer@example.invalid").status, 0);
  assert.equal(git(repositoryRoot, "add", ".").status, 0);
  assert.equal(git(repositoryRoot, "commit", "-m", "fixture").status, 0);
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
