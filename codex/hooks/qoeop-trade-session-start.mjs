#!/usr/bin/env node

import { createHash } from "node:crypto";
import { execFileSync } from "node:child_process";
import { lstat, readFile, readdir, realpath } from "node:fs/promises";
import { dirname, join, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const codexRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const cleanEnvironment = Object.fromEntries(Object.entries(process.env).filter(([name]) => !/^GIT_/i.test(name)));

function git(cwd, ...args) {
  return execFileSync("git", ["-C", cwd, ...args], {
    encoding: "utf8",
    env: cleanEnvironment,
    timeout: 12_000,
  }).trim();
}

function normalizedRepository(value) {
  return value.replace(/^git@github\.com:/, "https://github.com/")
    .replace(/^ssh:\/\/git@github\.com\//, "https://github.com/").replace(/\.git$/, "");
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
      } else throw new Error("unsupported installed Skill entry");
    }
  }
  await visit(root);
  return createHash("sha256").update(`${entries.join("\n")}\n`).digest("hex");
}

function output(value) {
  process.stdout.write(`${JSON.stringify(value)}\n`);
}

async function hasLocalSkill(root, cwd) {
  let directory = await realpath(resolve(cwd));
  if (relative(root, directory).startsWith("..")) return false;
  while (true) {
    try {
      await lstat(join(directory, ".agents", "skills", "run-bounded-mission", "SKILL.md"));
      return true;
    } catch (error) {
      if (error.code !== "ENOENT") return true;
    }
    if (directory === root) return false;
    directory = dirname(directory);
  }
}

let input;
let root;
let lock;
try {
  input = JSON.parse(await new Promise((resolve) => {
    let value = "";
    process.stdin.setEncoding("utf8");
    process.stdin.on("data", (chunk) => { value += chunk; });
    process.stdin.on("end", () => resolve(value));
  }));
  if (input.hook_event_name !== "SessionStart") process.exit(0);
  root = git(input.cwd, "rev-parse", "--show-toplevel");
  if (normalizedRepository(git(root, "config", "--get", "remote.origin.url")) !== "https://github.com/qOeOp/trade") process.exit(0);
  if (!await hasLocalSkill(root, input.cwd)) process.exit(0);
} catch {
  process.exit(0);
}

try {
  git(root, "fetch", "--quiet", "origin", "+refs/heads/main:refs/remotes/origin/main");
  lock = JSON.parse(git(root, "show", "refs/remotes/origin/main:codex-skills.lock.json"));
} catch {
  output({
    continue: false,
    stopReason: "The current qOeOp/trade origin/main Skill pin could not be fetched and verified.",
    systemMessage: "qOeOp/trade Skill pin unavailable",
  });
  process.exit(0);
}

if (lock.schema_version !== 2 || normalizedRepository(lock.repository) !== "https://github.com/qOeOp/skills") {
  output({ continue: false, stopReason: "The qOeOp/trade origin/main Skill pin is invalid." });
  process.exit(0);
}

try {
  const receipt = JSON.parse(await readFile(join(codexRoot, "run-bounded-mission-install.json"), "utf8"));
  const fields = ["repository", "commit", "tree", "skill_tree", "codex_agents_tree", "codex_session_hook_blob", "installer_blob"];
  const exact = fields.every((field) => normalizedRepository(receipt[field]) === normalizedRepository(lock[field]));
  const installedSkill = join(receipt.agents_root, "skills", "run-bounded-mission");
  if (!exact || await manifest(installedSkill) !== receipt.skill_manifest_sha256) throw new Error("pin mismatch");
  output({
    hookSpecificOutput: {
      hookEventName: "SessionStart",
      additionalContext: `qOeOp/trade: ignore the repository-local run-bounded-mission copy. Use only ${installedSkill} pinned by origin/main at ${lock.commit}.`,
    },
  });
} catch {
  output({
    continue: false,
    stopReason: `Pinned run-bounded-mission ${lock.commit} is not installed exactly. Run the origin/main bootstrap before continuing.`,
    systemMessage: "qOeOp/trade Skill pin mismatch",
  });
}
