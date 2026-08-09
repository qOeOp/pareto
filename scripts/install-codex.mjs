#!/usr/bin/env node

import { createHash } from "node:crypto";
import { cp, lstat, mkdir, readFile, readdir, rename, rm, writeFile } from "node:fs/promises";
import { homedir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const repositoryRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const ownedAgents = ["fast-builder.toml", "mission-evaluator.toml", "mission-planner.toml", "mission-researcher.toml"];

function parseArguments(argv) {
  const options = {
    check: false,
    agentsRoot: join(homedir(), ".agents"),
    codexRoot: process.env.CODEX_HOME ? resolve(process.env.CODEX_HOME) : join(homedir(), ".codex"),
  };
  for (let index = 0; index < argv.length; index += 1) {
    const value = argv[index];
    if (value === "--check") options.check = true;
    else if (value === "--agents-root") options.agentsRoot = resolve(argv[++index] ?? "");
    else if (value === "--codex-root") options.codexRoot = resolve(argv[++index] ?? "");
    else throw new Error(`unknown argument: ${value}`);
  }
  return options;
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

async function verify(sourceSkill, destinationSkill, sourceAgents, destinationAgents) {
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
  if (mismatches.length > 0) throw new Error(`Codex install mismatch: ${mismatches.join(", ")}`);
}

const options = parseArguments(process.argv.slice(2));
const sourceSkill = join(repositoryRoot, "skills", "run-bounded-mission");
const sourceAgents = join(repositoryRoot, "codex", "agents");
const destinationSkill = join(options.agentsRoot, "skills", "run-bounded-mission");
const destinationAgents = join(options.codexRoot, "agents");

if (!options.check) {
  await replaceDirectory(sourceSkill, destinationSkill);
  for (const name of ownedAgents) await replaceFile(join(sourceAgents, name), join(destinationAgents, name));
}
await verify(sourceSkill, destinationSkill, sourceAgents, destinationAgents);
process.stdout.write(`${options.check ? "Verified" : "Installed"} run-bounded-mission and ${ownedAgents.length} Codex agent profiles.\n`);
