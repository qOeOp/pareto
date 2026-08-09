#!/usr/bin/env node

import { createHash } from "node:crypto";
import { execFileSync } from "node:child_process";
import { cp, lstat, mkdir, readFile, readdir, rename, rm, writeFile } from "node:fs/promises";
import { homedir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const repositoryRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const ownedAgents = ["fast-builder.toml", "mission-evaluator.toml", "mission-planner.toml", "mission-researcher.toml"];
const ownedHook = "qoeop-trade-session-start.mjs";
const gitAuthorityEnvironment = Object.fromEntries(
  Object.entries(process.env).filter(([name]) => !/^GIT_/i.test(name)),
);

function parseArguments(argv) {
  const options = {
    check: false,
    installTradeSessionHook: false,
    lock: undefined,
    agentsRoot: join(homedir(), ".agents"),
    codexRoot: process.env.CODEX_HOME ? resolve(process.env.CODEX_HOME) : join(homedir(), ".codex"),
  };
  for (let index = 0; index < argv.length; index += 1) {
    const value = argv[index];
    if (value === "--check") options.check = true;
    else if (value === "--install-trade-session-hook") options.installTradeSessionHook = true;
    else if (value === "--lock") options.lock = resolve(argv[++index] ?? "");
    else if (value === "--agents-root") options.agentsRoot = resolve(argv[++index] ?? "");
    else if (value === "--codex-root") options.codexRoot = resolve(argv[++index] ?? "");
    else throw new Error(`unknown argument: ${value}`);
  }
  return options;
}

function git(...args) {
  return execFileSync("git", ["-C", repositoryRoot, ...args], {
    encoding: "utf8",
    env: gitAuthorityEnvironment,
  }).trim();
}

function normalizedRepository(value) {
  return value
    .replace(/^git@github\.com:/, "https://github.com/")
    .replace(/^ssh:\/\/git@github\.com\//, "https://github.com/")
    .replace(/\.git$/, "");
}

async function verifyLock(path) {
  const required = [
    "repository",
    "commit",
    "tree",
    "skill_tree",
    "codex_agents_tree",
    "codex_session_hook_blob",
    "installer_blob",
  ];
  const actual = {
    repository: git("remote", "get-url", "origin"),
    commit: git("rev-parse", "HEAD"),
    tree: git("rev-parse", "HEAD^{tree}"),
    skill_tree: git("rev-parse", "HEAD:skills/run-bounded-mission"),
    codex_agents_tree: git("rev-parse", "HEAD:codex/agents"),
    codex_session_hook_blob: git("rev-parse", `HEAD:codex/hooks/${ownedHook}`),
    installer_blob: git("rev-parse", "HEAD:scripts/install-codex.mjs"),
  };
  if (!path) return actual;
  const lock = JSON.parse(await readFile(path, "utf8"));
  if (lock.schema_version !== 2 || required.some((key) => typeof lock[key] !== "string" || !lock[key])) {
    throw new Error("invalid Codex skills lock");
  }
  const mismatches = required.filter((key) =>
    key === "repository"
      ? normalizedRepository(lock[key]) !== normalizedRepository(actual[key])
      : lock[key] !== actual[key],
  );
  if (mismatches.length > 0) throw new Error(`Codex skills lock mismatch: ${mismatches.join(", ")}`);
  try {
    git("merge-base", "--is-ancestor", lock.commit, "refs/remotes/origin/main");
  } catch {
    throw new Error("Codex skills lock commit is not present on origin/main");
  }
  const sourceDrift = git(
    "status",
    "--porcelain=v1",
    "-z",
    "--untracked-files=all",
    "--ignored=matching",
    "--",
    "skills/run-bounded-mission",
    "codex/agents",
    `codex/hooks/${ownedHook}`,
    "scripts/install-codex.mjs",
  );
  if (sourceDrift) throw new Error("Codex install source differs from the locked Git tree");
  return actual;
}

async function manifest(root) {
  const entries = [];
  async function visit(directory, relative = "") {
    for (const name of (await readdir(directory)).sort()) {
      const path = join(directory, name);
      const child = relative ? `${relative}/${name}` : name;
      const stat = await lstat(path);
      if (stat.isDirectory()) await visit(path, child);
      else if (stat.isFile()) {
        const bytes = await readFile(path);
        entries.push(`${child}\t${stat.mode & 0o777}\t${bytes.length}\t${createHash("sha256").update(bytes).digest("hex")}`);
      } else throw new Error(`unsupported source entry: ${path}`);
    }
  }
  await visit(root);
  return `${entries.join("\n")}\n`;
}

async function replaceDirectory(source, destination) {
  await mkdir(dirname(destination), { recursive: true });
  const suffix = `${process.pid}-${Date.now()}`;
  const temporary = `${destination}.install-${suffix}`;
  const backup = `${destination}.backup-${suffix}`;
  await cp(source, temporary, { recursive: true, force: false, errorOnExist: true });
  let hadDestination = false;
  try {
    await rename(destination, backup);
    hadDestination = true;
  } catch (error) {
    if (error.code !== "ENOENT") throw error;
  }
  try {
    await rename(temporary, destination);
    if (hadDestination) await rm(backup, { recursive: true, force: true });
  } catch (error) {
    if (hadDestination) await rename(backup, destination);
    await rm(temporary, { recursive: true, force: true });
    throw error;
  }
}

async function replaceFile(source, destination) {
  await mkdir(dirname(destination), { recursive: true });
  const suffix = `${process.pid}-${Date.now()}`;
  const temporary = `${destination}.install-${suffix}`;
  const backup = `${destination}.backup-${suffix}`;
  await writeFile(temporary, await readFile(source), { mode: (await lstat(source)).mode & 0o777, flag: "wx" });
  let hadDestination = false;
  try {
    await rename(destination, backup);
    hadDestination = true;
  } catch (error) {
    if (error.code !== "ENOENT") throw error;
  }
  try {
    await rename(temporary, destination);
    if (hadDestination) await rm(backup, { force: true });
  } catch (error) {
    if (hadDestination) await rename(backup, destination);
    await rm(temporary, { force: true });
    throw error;
  }
}

async function replaceBytes(bytes, destination, mode = 0o600) {
  await mkdir(dirname(destination), { recursive: true });
  const suffix = `${process.pid}-${Date.now()}`;
  const temporary = `${destination}.install-${suffix}`;
  const backup = `${destination}.backup-${suffix}`;
  await writeFile(temporary, bytes, { mode, flag: "wx" });
  let hadDestination = false;
  try {
    await rename(destination, backup);
    hadDestination = true;
  } catch (error) {
    if (error.code !== "ENOENT") throw error;
  }
  try {
    await rename(temporary, destination);
    if (hadDestination) await rm(backup, { force: true });
  } catch (error) {
    if (hadDestination) await rename(backup, destination);
    await rm(temporary, { force: true });
    throw error;
  }
}

function hookCommand(destinationHook) {
  return `node ${JSON.stringify(destinationHook)}`;
}

function parseUniqueJson(text) {
  let index = 0;
  const whitespace = () => { while (/\s/.test(text[index] ?? "")) index += 1; };
  const string = () => {
    const start = index;
    index += 1;
    while (index < text.length) {
      if (text[index] === "\\") index += 2;
      else if (text[index++] === "\"") return JSON.parse(text.slice(start, index));
    }
    throw new Error("unterminated JSON string");
  };
  const value = () => {
    whitespace();
    if (text[index] === "{") object();
    else if (text[index] === "[") array();
    else if (text[index] === "\"") string();
    else {
      while (index < text.length && !/[\s,}\]]/.test(text[index])) index += 1;
    }
    whitespace();
  };
  const object = () => {
    const keys = new Set();
    index += 1;
    whitespace();
    if (text[index] === "}") { index += 1; return; }
    while (index < text.length) {
      if (text[index] !== "\"") throw new Error("invalid JSON object key");
      const key = string();
      if (keys.has(key)) throw new Error(`duplicate JSON member: ${key}`);
      keys.add(key);
      whitespace();
      if (text[index++] !== ":") throw new Error("invalid JSON object member");
      value();
      if (text[index] === "}") { index += 1; return; }
      if (text[index++] !== ",") throw new Error("invalid JSON object delimiter");
      whitespace();
    }
    throw new Error("unterminated JSON object");
  };
  const array = () => {
    index += 1;
    whitespace();
    if (text[index] === "]") { index += 1; return; }
    while (index < text.length) {
      value();
      if (text[index] === "]") { index += 1; return; }
      if (text[index++] !== ",") throw new Error("invalid JSON array delimiter");
      whitespace();
    }
    throw new Error("unterminated JSON array");
  };
  value();
  if (index !== text.length) throw new Error("trailing JSON content");
  return JSON.parse(text);
}

async function mergedHooks(path, destinationHook) {
  let document = {};
  try {
    const stat = await lstat(path);
    if (!stat.isFile() || stat.isSymbolicLink()) throw new Error("not a regular file");
    document = parseUniqueJson(await readFile(path, "utf8"));
  } catch (error) {
    if (error.code !== "ENOENT") throw new Error(`invalid Codex hooks config: ${error.message}`);
  }
  if (!document || Array.isArray(document) || typeof document !== "object") {
    throw new Error("invalid Codex hooks config");
  }
  if (document.hooks === undefined) document.hooks = {};
  if (!document.hooks || Array.isArray(document.hooks) || typeof document.hooks !== "object") {
    throw new Error("invalid Codex hooks config");
  }
  const groups = document.hooks.SessionStart ?? [];
  if (!Array.isArray(groups)) throw new Error("invalid Codex SessionStart hooks config");
  const command = hookCommand(destinationHook);
  const ownedCount = groups.flatMap((group) => group?.hooks ?? []).filter((hook) => hook?.command === command).length;
  if (ownedCount > 1) throw new Error("duplicate Codex Skill pin hooks");
  const group = {
    matcher: "^(startup|resume|clear)$",
    hooks: [{
      type: "command",
      command,
      timeout: 15,
      additionalContextLimit: 128,
      statusMessage: "Checking qOeOp/trade Skill source",
    }],
  };
  const preserved = groups.flatMap((entry) => {
    if (!Array.isArray(entry?.hooks)) return [entry];
    const hooks = entry.hooks.filter((hook) => hook?.command !== command);
    return hooks.length === 0 ? [] : [{ ...entry, hooks }];
  });
  document.hooks.SessionStart = [...preserved, group];
  return `${JSON.stringify(document, null, 2)}\n`;
}

async function verify(sourceSkill, destinationSkill, sourceAgents, destinationAgents, sourceHook, destinationHook) {
  const mismatches = [];
  try {
    if ((await manifest(sourceSkill)) !== (await manifest(destinationSkill))) mismatches.push("skill");
  } catch {
    mismatches.push("skill");
  }
  for (const name of ownedAgents) {
    try {
      if (!((await readFile(join(sourceAgents, name))).equals(await readFile(join(destinationAgents, name))))) mismatches.push(`agent:${name}`);
    } catch {
      mismatches.push(`agent:${name}`);
    }
  }
  if (sourceHook) {
    try {
      if (!((await readFile(sourceHook)).equals(await readFile(destinationHook)))) mismatches.push("hook");
    } catch {
      mismatches.push("hook");
    }
  }
  if (mismatches.length > 0) throw new Error(`Codex install mismatch: ${mismatches.join(", ")}`);
}

const options = parseArguments(process.argv.slice(2));
const identity = await verifyLock(options.lock);
const sourceSkill = join(repositoryRoot, "skills", "run-bounded-mission");
const sourceAgents = join(repositoryRoot, "codex", "agents");
const sourceHook = join(repositoryRoot, "codex", "hooks", ownedHook);
const destinationSkill = join(options.agentsRoot, "skills", "run-bounded-mission");
const destinationAgents = join(options.codexRoot, "agents");
const destinationHook = join(options.codexRoot, "hooks", ownedHook);
const hooksConfig = join(options.codexRoot, "hooks.json");
const installReceipt = join(options.codexRoot, "run-bounded-mission-install.json");
const receipt = {
  schema_version: 1,
  ...identity,
  skill_manifest_sha256: createHash("sha256").update(await manifest(sourceSkill)).digest("hex"),
  agents_root: options.agentsRoot,
  codex_root: options.codexRoot,
};

if (!options.check) {
  await replaceDirectory(sourceSkill, destinationSkill);
  for (const name of ownedAgents) await replaceFile(join(sourceAgents, name), join(destinationAgents, name));
  if (options.installTradeSessionHook) {
    await replaceFile(sourceHook, destinationHook);
    await replaceBytes(await mergedHooks(hooksConfig, destinationHook), hooksConfig);
    await replaceBytes(`${JSON.stringify(receipt, null, 2)}\n`, installReceipt);
  }
}
await verify(
  sourceSkill,
  destinationSkill,
  sourceAgents,
  destinationAgents,
  options.installTradeSessionHook ? sourceHook : undefined,
  options.installTradeSessionHook ? destinationHook : undefined,
);
if (options.installTradeSessionHook) {
  const installedReceipt = JSON.parse(await readFile(installReceipt, "utf8"));
  if (JSON.stringify(installedReceipt) !== JSON.stringify(receipt)) throw new Error("Codex install receipt mismatch");
  const hooks = JSON.parse(await readFile(hooksConfig, "utf8"));
  const installedCommand = hookCommand(destinationHook);
  const groups = (hooks.hooks?.SessionStart ?? []).filter(
    (group) => Array.isArray(group?.hooks) && group.hooks.some((hook) => hook?.command === installedCommand),
  );
  const expected = JSON.parse(await mergedHooks(join(options.codexRoot, "missing-hooks.json"), destinationHook))
    .hooks.SessionStart[0];
  if (groups.length !== 1 || JSON.stringify(groups[0]) !== JSON.stringify(expected)) {
    throw new Error("Codex Skill pin hook mismatch");
  }
}
process.stdout.write(
  `${options.check ? "Verified" : "Installed"} run-bounded-mission and ${ownedAgents.length} Codex agent profiles${options.installTradeSessionHook ? ", plus the trade pin hook" : ""}.\n`,
);
