#!/usr/bin/env node

import { createHash } from "node:crypto";
import { execFileSync } from "node:child_process";
import { lstat, readFile, readdir, realpath } from "node:fs/promises";
import { dirname, isAbsolute, join, relative, resolve, sep } from "node:path";
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

async function ownedAgentManifest(root) {
  const entries = [];
  for (const name of projectAgentProfiles) {
    const path = join(root, name);
    const stat = await lstat(path);
    if (!stat.isFile()) throw new Error("unsupported installed agent profile");
    const bytes = await readFile(path);
    entries.push(`${name}\t${stat.mode & 0o777}\t${bytes.length}\t${createHash("sha256").update(bytes).digest("hex")}`);
  }
  return createHash("sha256").update(`${entries.join("\n")}\n`).digest("hex");
}

function output(value) {
  process.stdout.write(`${JSON.stringify(value)}\n`);
}

const projectAgentProfiles = [
  "fast-builder.toml",
  "mission-evaluator.toml",
  "mission-planner.toml",
  "mission-researcher.toml",
];
const specializedAgentTypes = new Set([
  "fast_builder",
  "mission_evaluator",
  "mission_planner",
  "mission_researcher",
]);

async function localMissionSources(root, cwd) {
  let directory = await realpath(resolve(cwd));
  const fromRoot = relative(root, directory);
  if (fromRoot === ".." || fromRoot.startsWith(`..${sep}`) || isAbsolute(fromRoot)) {
    return { skill: false, profiles: [] };
  }
  let skill = false;
  const profiles = new Set();
  while (true) {
    const skillPath = join(directory, ".agents", "skills", "run-bounded-mission", "SKILL.md");
    try {
      await lstat(skillPath);
      skill = true;
    } catch (error) {
      if (error.code !== "ENOENT") skill = true;
    }
    for (const name of projectAgentProfiles) {
      const path = join(directory, ".codex", "agents", name);
      try {
        await lstat(path);
        profiles.add(name);
      } catch (error) {
        if (error.code !== "ENOENT") profiles.add(name);
      }
    }
    if (directory === root) return { skill, profiles: [...profiles].sort() };
    directory = dirname(directory);
  }
}

let input;
let root;
let lock;
let localSources;
try {
  input = JSON.parse(await new Promise((resolve) => {
    let value = "";
    process.stdin.setEncoding("utf8");
    process.stdin.on("data", (chunk) => { value += chunk; });
    process.stdin.on("end", () => resolve(value));
  }));
  if (input.hook_event_name !== "SessionStart" && input.hook_event_name !== "PreToolUse") process.exit(0);
  if (input.hook_event_name === "PreToolUse") {
    const toolInput = input.tool_input;
    if ((input.tool_name === "spawn_agent" || input.tool_name === "Agent")
        && toolInput && !Array.isArray(toolInput) && typeof toolInput === "object"
        && specializedAgentTypes.has(toolInput.agent_type)
        && toolInput.fork_turns !== "none") {
      output({
        hookSpecificOutput: {
          hookEventName: "PreToolUse",
          permissionDecision: "allow",
          updatedInput: { ...toolInput, fork_turns: "none" },
        },
      });
    }
    process.exit(0);
  }
  root = git(input.cwd, "rev-parse", "--show-toplevel");
  if (normalizedRepository(git(root, "config", "--get", "remote.origin.url")) !== "https://github.com/qOeOp/trade") process.exit(0);
} catch {
  process.exit(0);
}

try {
  localSources = await localMissionSources(root, input.cwd);
} catch {
  process.exit(0);
}

if (localSources.profiles.length > 0) {
  output({
    continue: false,
    stopReason: `This checkout contains project-scoped RBM agent profiles that override the pinned user profiles: ${localSources.profiles.join(", ")}. Remove or migrate these repository files, then start a new Codex session.`,
    systemMessage: "qOeOp/trade project agent profiles override the user installation",
  });
  process.exit(0);
}

if (localSources.skill) {
  output({
    continue: false,
    stopReason: "This checkout contains a project-scoped run-bounded-mission Skill that overrides the pinned user installation. Remove or migrate the repository-local Skill, then start a new Codex session.",
    systemMessage: "qOeOp/trade project Skill overrides the user installation",
  });
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

if (lock.schema_version !== 2 || normalizedRepository(lock.repository) !== "https://github.com/qOeOp/pareto") {
  output({ continue: false, stopReason: "The qOeOp/trade origin/main Skill pin is invalid." });
  process.exit(0);
}

try {
  const receipt = JSON.parse(await readFile(join(codexRoot, "run-bounded-mission-install.json"), "utf8"));
  const fields = ["repository", "commit", "tree", "skill_tree", "codex_agents_tree", "codex_session_hook_blob", "installer_blob"];
  const exact = fields.every((field) => normalizedRepository(receipt[field]) === normalizedRepository(lock[field]));
  const installedSkill = join(receipt.agents_root, "skills", "run-bounded-mission");
  const installedAgents = join(receipt.codex_root, "agents");
  if (receipt.schema_version !== 2 || !exact
    || await manifest(installedSkill) !== receipt.skill_manifest_sha256
    || await ownedAgentManifest(installedAgents) !== receipt.agent_manifest_sha256) throw new Error("pin mismatch");
} catch {
  output({
    continue: false,
    stopReason: `Pinned run-bounded-mission ${lock.commit} is not installed exactly. Run the origin/main bootstrap, then start a new Codex session.`,
    systemMessage: "qOeOp/trade Skill pin mismatch",
  });
  process.exit(0);
}

if (input.source === "compact") {
  output({
    hookSpecificOutput: {
      hookEventName: "SessionStart",
      additionalContext: "Context compacted. Load orchestration-context-recovery.md; emit its compact current checkpoint before mutation or effects.",
    },
  });
}
