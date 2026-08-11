#!/usr/bin/env node

import { spawn, spawnSync } from "node:child_process";
import { createHash, randomUUID } from "node:crypto";
import { createReadStream, realpathSync } from "node:fs";
import { cp, lstat, mkdir, mkdtemp, readFile, readdir, realpath, rename, rm, writeFile } from "node:fs/promises";
import { arch, homedir, platform, tmpdir } from "node:os";
import path from "node:path";
import readline from "node:readline";
import { setTimeout as delay } from "node:timers/promises";
import { fileURLToPath } from "node:url";
import { rejectDuplicateJsonObjectMembers } from "./json.mjs";

const observerRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const expectedRepository = "https://github.com/qOeOp/pareto";
const ownedProfiles = ["fast-builder.toml", "mission-evaluator.toml", "mission-planner.toml", "mission-researcher.toml"];
export const observerRuntimeBounds = Object.freeze({
  cleanup: Object.freeze({ force: true, maxRetries: 8, recursive: true, retryDelay: 250 }),
  appServerProbeMs: 30_000,
  terminationMs: 5_000,
});

export function createObserverLifecycle() {
  let cleanupAllowed = true;
  return Object.freeze({
    async cleanup(operation) {
      if (!cleanupAllowed) return false;
      await operation();
      return true;
    },
    holdCleanup() {
      cleanupAllowed = false;
    },
  });
}
const scenarioDesignBytes = await readFile(path.join(observerRoot, "evals", "scenarios.json"));
rejectDuplicateJsonObjectMembers(scenarioDesignBytes.toString("utf8"), "scenario authority");
const scenarioDesign = JSON.parse(scenarioDesignBytes);
const capabilities = Object.freeze(Object.fromEntries(Object.entries(scenarioDesign.fixed_observers ?? {})
  .filter(([, binding]) => binding?.protocol === "install-v1")
  .map(([capabilityId, binding]) => {
    const rows = (scenarioDesign.scenarios ?? []).filter((row) => row.capability_id === capabilityId);
    const cases = Object.fromEntries(rows.map((row) => [row.scenario, row.case_id]));
    const slug = capabilityId.toLowerCase();
    return [capabilityId, Object.freeze({
      cases: Object.freeze(cases),
      kind: binding.parameters.kind,
      observation: binding.parameters.kind === "skill" ? "observation" : `observation-${slug}`,
      ...(binding.parameters.profile === undefined ? {} : { profile: binding.parameters.profile }),
      slug,
    })];
  })));
const sha256Pattern = /^sha256:[a-f0-9]{64}$/;
const oidPattern = /^[a-f0-9]{40}$/;

function fail(message) {
  throw new Error(message);
}

function canonical(value) {
  if (Array.isArray(value)) return value.map(canonical);
  if (value && typeof value === "object") {
    return Object.fromEntries(Object.keys(value).sort().map((key) => [key, canonical(value[key])]));
  }
  return value;
}

function digest(value) {
  return `sha256:${createHash("sha256").update(value).digest("hex")}`;
}

function canonicalEqual(left, right) {
  return JSON.stringify(canonical(left)) === JSON.stringify(canonical(right));
}

export async function terminateTimedOutChild(
  child,
  completion,
  label,
  lifecycle,
  terminationMs = observerRuntimeBounds.terminationMs,
) {
  child.kill("SIGTERM");
  let outcome = await Promise.race([
    completion,
    delay(terminationMs).then(() => null),
  ]);
  if (!outcome) {
    child.kill("SIGKILL");
    outcome = await Promise.race([
      completion,
      delay(terminationMs).then(() => null),
    ]);
  }
  if (!outcome) {
    lifecycle.holdCleanup();
    fail(`${label} could not terminate after timeout`);
  }
}

function exactKeys(value, expected, label) {
  if (!value || typeof value !== "object" || Array.isArray(value)) fail(`${label} must be an object`);
  const actual = Object.keys(value).sort();
  const wanted = [...expected].sort();
  if (actual.length !== wanted.length || actual.some((key, index) => key !== wanted[index])) {
    fail(`${label} has unknown or missing fields`);
  }
}

function exactOptionalKeys(value, required, optional, label) {
  if (!value || typeof value !== "object" || Array.isArray(value)) fail(`${label} must be an object`);
  const actual = Object.keys(value);
  const allowed = new Set([...required, ...optional]);
  if (required.some((key) => !actual.includes(key)) || actual.some((key) => !allowed.has(key))) {
    fail(`${label} has unknown or missing fields`);
  }
}

export function classifyProfileConfigWarning(params, profilePath, configResponseSeen) {
  exactKeys(params, ["details", "summary"], "profile warning params");
  if (configResponseSeen || params.details !== null || typeof params.summary !== "string") {
    fail("app-server profile warning is malformed or late");
  }
  const normalized = params.summary.replaceAll("\\", "/");
  const sandboxFallback = "Codex could not find bubblewrap on PATH. Install bubblewrap with your OS package manager. " +
    "See the sandbox prerequisites: https://developers.openai.com/codex/concepts/sandboxing#prerequisites. " +
    "Codex will use the bundled bubblewrap in the meantime.";
  if (normalized === sandboxFallback) return "sandbox_prerequisite_fallback";
  const malformedProfile = `Ignoring malformed agent role definition: failed to parse agent role file at ${profilePath}: TOML parse error at line 1, column 34\n  |\n1 | name = [pareto_observer_malformed\n  |                                  ^\nunclosed array, expected \`]\`\n`;
  if (normalized === malformedProfile) return "malformed_target_profile";
  fail("app-server returned an unrelated profile warning");
}

function normalizedRepository(value) {
  return value
    .replace(/^git@github\.com:/, "https://github.com/")
    .replace(/^ssh:\/\/git@github\.com\//, "https://github.com/")
    .replace(/\.git$/, "");
}

const gitEnvironment = Object.fromEntries(
  Object.entries(process.env).filter(([name]) => !/^GIT_/i.test(name)),
);

function command(commandName, args, { cwd, env = gitEnvironment, timeout = 30_000 } = {}) {
  const result = spawnSync(commandName, args, {
    cwd,
    env,
    encoding: "utf8",
    maxBuffer: 4 * 1024 * 1024,
    timeout,
  });
  return {
    error: result.error?.code ?? null,
    signal: result.signal ?? null,
    status: result.status,
    stderr: result.stderr ?? "",
    stdout: result.stdout ?? "",
  };
}

function git(root, ...args) {
  const result = command("git", ["-C", root, ...args]);
  if (result.status !== 0 || result.error || result.signal) fail("Git authority observation failed");
  return result.stdout.trim();
}

function observerIdentity() {
  const commit = git(observerRoot, "rev-parse", "HEAD");
  const tree = git(observerRoot, "rev-parse", "HEAD^{tree}");
  const scriptBlob = git(observerRoot, "rev-parse", "HEAD:scripts/observe-install-capability.mjs");
  if (![commit, tree, scriptBlob].every((value) => oidPattern.test(value))) fail("observer Git identity is invalid");
  if (git(observerRoot, "status", "--porcelain=v1", "--untracked-files=all")) {
    fail("observer checkout must be clean");
  }
  return { commit, tree, script_blob: scriptBlob };
}

function subjectIdentity(root) {
  const actualRoot = git(root, "rev-parse", "--show-toplevel");
  const commit = git(root, "rev-parse", "HEAD");
  const identity = {
    repository: normalizedRepository(git(root, "remote", "get-url", "origin")),
    commit,
    tree: git(root, "rev-parse", "HEAD^{tree}"),
    skill_tree: git(root, "rev-parse", "HEAD:skills/run-bounded-mission"),
    codex_agents_tree: git(root, "rev-parse", "HEAD:codex/agents"),
    codex_session_hook_blob: git(root, "rev-parse", "HEAD:codex/hooks/qoeop-trade-session-start.mjs"),
    installer_blob: git(root, "rev-parse", "HEAD:scripts/install-codex.mjs"),
  };
  if (realpathSync(actualRoot) !== realpathSync(root) || identity.repository !== expectedRepository ||
      !Object.values(identity).slice(1).every((value) => oidPattern.test(value))) {
    fail("subject repository identity is invalid");
  }
  const ancestry = command("git", ["-C", root, "merge-base", "--is-ancestor", commit, "refs/remotes/origin/main"]);
  if (ancestry.status !== 0 || ancestry.error || ancestry.signal) fail("subject commit is not canonical main history");
  if (git(root, "status", "--porcelain=v1", "--untracked-files=all")) fail("subject checkout must be clean");
  return identity;
}

async function fileIdentity(file) {
  const resolved = await realpath(file).catch(() => "");
  const info = resolved ? await lstat(resolved).catch(() => null) : null;
  if (!info?.isFile() || info.isSymbolicLink()) fail("Codex app-server entry is missing or unsafe");
  const hash = createHash("sha256");
  for await (const chunk of createReadStream(resolved)) hash.update(chunk);
  return { path: resolved, sha256: `sha256:${hash.digest("hex")}` };
}

async function treeManifest(root) {
  const entries = [];
  async function visit(directory, relative = "") {
    const names = await readdir(directory).catch((error) => {
      if (error.code === "ENOENT" && relative === "") return null;
      throw error;
    });
    if (names === null) return;
    const directoryInfo = await lstat(directory);
    entries.push({ kind: "directory", mode: directoryInfo.mode & 0o777, path: relative });
    for (const name of names.sort()) {
      const file = path.join(directory, name);
      const child = relative ? `${relative}/${name}` : name;
      const info = await lstat(file);
      if (info.isDirectory()) await visit(file, child);
      else if (info.isFile() && !info.isSymbolicLink()) {
        const bytes = await readFile(file);
        entries.push({ bytes: bytes.length, kind: "file", mode: info.mode & 0o777, path: child, sha256: digest(bytes) });
      } else fail("observed install tree contains an unsupported entry");
    }
  }
  await visit(root);
  return entries;
}

async function treeDigest(root) {
  return digest(JSON.stringify(canonical(await treeManifest(root))));
}

async function installationDigest(agentsRoot, codexRoot) {
  return digest(JSON.stringify(canonical({
    agents: await treeManifest(agentsRoot),
    codex: await treeManifest(codexRoot),
  })));
}

async function seedForeignState(roots) {
  const files = {
    agents_root: path.join(roots.agents, "foreign.txt"),
    foreign_profile: path.join(roots.codex, "agents", "foreign.toml"),
    foreign_skill: path.join(roots.agents, "skills", "foreign-skill", "SKILL.md"),
    codex_root: path.join(roots.codex, "foreign.txt"),
  };
  for (const [name, file] of Object.entries(files)) {
    await mkdir(path.dirname(file), { recursive: true });
    const content = name === "foreign_skill"
      ? "---\nname: foreign-skill\ndescription: \"Unrelated observer sentinel.\"\n---\n\n# Foreign Skill\n"
      : name === "foreign_profile"
        ? "name = \"foreign\"\ndescription = \"Unrelated observer sentinel.\"\nsandbox_mode = \"read-only\"\ndeveloper_instructions = \"Foreign sentinel.\"\n"
        : `${name}\n`;
    await writeFile(file, content);
  }
  return files;
}

async function foreignStateDigest(files) {
  const state = {};
  for (const [name, file] of Object.entries(files)) {
    const info = await lstat(file).catch(() => null);
    if (!info?.isFile() || info.isSymbolicLink()) fail("installer changed unrelated user state");
    state[name] = { mode: info.mode & 0o777, sha256: digest(await readFile(file)) };
  }
  return digest(JSON.stringify(canonical(state)));
}

async function ownedProfileDigest(codexRoot) {
  const profiles = [];
  for (const name of ownedProfiles) {
    const file = path.join(codexRoot, "agents", name);
    const info = await lstat(file).catch(() => null);
    if (!info?.isFile() || info.isSymbolicLink()) fail("installed Codex agent profile is missing or unsafe");
    const bytes = await readFile(file);
    profiles.push({ bytes: bytes.length, name, sha256: digest(bytes) });
  }
  return digest(Buffer.from(JSON.stringify(canonical(profiles))));
}

async function profileInstallationDigest(skillRoot, codexRoot, foreignFiles) {
  return digest(Buffer.from(JSON.stringify(canonical({
    foreign: await foreignStateDigest(foreignFiles),
    owned_profiles: await ownedProfileDigest(codexRoot),
    skill: await treeDigest(skillRoot),
  }))));
}

async function claimWindowsAgentsRoot(root) {
  try {
    await mkdir(root);
  } catch (error) {
    if (error.code === "EEXIST") fail("Windows runner user Skill root is not isolated");
    throw error;
  }
  const info = await lstat(root);
  if (!info.isDirectory() || info.isSymbolicLink()) fail("Windows runner user Skill root is unsafe");
  return { dev: info.dev, ino: info.ino };
}

async function removeWindowsAgentsRoot(root, identity) {
  const custody = path.join(path.dirname(root), `.pareto-ins01-agents-${randomUUID()}`);
  await rename(root, custody).catch(() => fail("Windows runner user Skill root could not be isolated for cleanup"));
  const current = await lstat(custody).catch(() => null);
  if (!current?.isDirectory() || current.isSymbolicLink() ||
      current.dev !== identity.dev || current.ino !== identity.ino) {
    const replacement = await lstat(root).catch((error) => {
      if (error.code === "ENOENT") return null;
      throw error;
    });
    if (!replacement) await rename(custody, root).catch(() => {});
    fail("Windows runner user Skill root identity changed before cleanup");
  }
  await rm(custody, observerRuntimeBounds.cleanup);
}

async function expectedInstallation(subjectRoot, root) {
  const expected = {
    agents: path.join(root, "home", ".agents"),
    codex: path.join(root, "codex-home"),
  };
  await seedForeignState(expected);
  await cp(
    path.join(subjectRoot, "skills", "run-bounded-mission"),
    path.join(expected.agents, "skills", "run-bounded-mission"),
    { errorOnExist: true, force: false, recursive: true },
  );
  for (const name of ownedProfiles) {
    const destination = path.join(expected.codex, "agents", name);
    await mkdir(path.dirname(destination), { recursive: true });
    await cp(path.join(subjectRoot, "codex", "agents", name), destination, { errorOnExist: true, force: false });
  }
  return installationDigest(expected.agents, expected.codex);
}

function isolatedEnvironment(root) {
  const env = Object.fromEntries(Object.entries(process.env).filter(([name]) =>
    !/^(?:ACTIONS_|CI$|CODEX_|GH_|GITHUB_|GIT_|OPENAI_)/i.test(name)));
  const home = path.join(root, "home");
  return {
    ...env,
    HOME: home,
    USERPROFILE: home,
    CODEX_HOME: path.join(root, "codex-home"),
    GIT_CONFIG_NOSYSTEM: "1",
  };
}

function installer(subjectRoot, roots, lock, check = false) {
  const args = [
    path.join(subjectRoot, "scripts", "install-codex.mjs"),
    "--agents-root", roots.agents,
    "--codex-root", roots.codex,
    "--lock", lock,
  ];
  if (check) args.push("--check");
  return command(process.execPath, args, { cwd: subjectRoot, env: roots.env, timeout: 60_000 });
}

function requireCompleted(result, label) {
  if (result.status !== 0 || result.error || result.signal) fail(`${label} did not complete successfully`);
}

function requireExpectedFailure(result, message, label) {
  const errorLines = result.stderr.split(/\r?\n/).filter((line) => line.startsWith("Error: "));
  if (result.status !== 1 || result.error || result.signal || result.stdout !== "" ||
      JSON.stringify(errorLines) !== JSON.stringify([`Error: ${message}`])) {
    fail(`${label} did not fail for the exact expected cause`);
  }
}

function diagnosticDigest(result) {
  return digest(Buffer.from(`${result.status}\n${result.signal ?? ""}\n${result.error ?? ""}\n${result.stderr}`));
}

async function listInstalledSkill({ codexEntry, cwd, roots, expectedDescription, lifecycle }) {
  const executable = await fileIdentity(codexEntry);
  const child = spawn(process.execPath, [executable.path, "app-server"], {
    cwd,
    env: roots.env,
    stdio: ["pipe", "pipe", "pipe"],
  });
  if (!child.stdin || !child.stdout || !child.stderr) fail("app-server transport is unavailable");
  const lines = readline.createInterface({ input: child.stdout, crlfDelay: Infinity });
  const responses = new Map();
  const notificationShapes = [];
  let fault = null;
  let outputBytes = 0;
  let errorBytes = 0;
  let closed;
  const completion = new Promise((resolve) => {
    closed = resolve;
  });
  const abort = (error) => {
    fault ??= error;
  };
  child.stdout.on("data", (chunk) => {
    outputBytes += chunk.length;
    if (outputBytes > 4 * 1024 * 1024) abort(new Error("app-server stdout exceeded 4 MiB"));
  });
  child.stderr.on("data", (chunk) => {
    errorBytes += chunk.length;
    if (errorBytes > 1024 * 1024) abort(new Error("app-server stderr exceeded 1 MiB"));
  });
  child.once("error", () => abort(new Error("app-server Skill probe failed")));
  child.once("close", (code, signal) => closed({ code, signal }));
  lines.on("line", (line) => {
    try {
      rejectDuplicateJsonObjectMembers(line, "app-server Skill response");
      const message = JSON.parse(line);
      if (Number.isInteger(message?.id)) {
        exactKeys(message, message.error === undefined ? ["id", "result"] : ["error", "id"], "app-server response");
        if (![0, 1].includes(message.id) || responses.has(message.id) || message.error !== undefined) {
          fail("app-server returned an unexpected response");
        }
        responses.set(message.id, message.result);
        if (message.id === 0) {
          child.stdin.write(`${JSON.stringify({ method: "initialized", params: {} })}\n`);
          child.stdin.write(`${JSON.stringify({
            id: 1,
            method: "skills/list",
            params: { cwds: [cwd] },
          })}\n`);
        } else {
          child.stdin.end();
        }
      } else {
        exactKeys(message, ["method", "params"], "app-server notification");
        if (notificationShapes.length >= 8) fail("app-server returned too many notifications");
        if (message.method === "remoteControl/status/changed") {
          exactOptionalKeys(
            message.params,
            ["installationId", "serverName", "status"],
            ["environmentId"],
            "remote-control notification params",
          );
          const environmentId = message.params.environmentId;
          if (!new Set(["disabled", "connecting", "connected", "errored"]).has(message.params.status) ||
              typeof message.params.serverName !== "string" || message.params.serverName.length === 0 ||
              typeof message.params.installationId !== "string" || message.params.installationId.length === 0 ||
              (environmentId !== undefined && environmentId !== null && typeof environmentId !== "string") ||
              (message.params.status === "disabled" && environmentId !== undefined && environmentId !== null)) {
            fail("app-server remote-control notification is unexpected");
          }
          notificationShapes.push({
            environment_id_type: environmentId === null ? "null" : typeof environmentId,
            method: message.method,
            params: Object.keys(message.params).sort(),
            status: message.params.status,
          });
        } else if (message.method === "configWarning") {
          exactOptionalKeys(message.params, ["summary"], ["details", "path", "range"], "config warning params");
          if (typeof message.params.summary !== "string" ||
              (message.params.details !== undefined && message.params.details !== null &&
                typeof message.params.details !== "string") ||
              (message.params.path !== undefined && message.params.path !== null &&
                typeof message.params.path !== "string")) {
            fail("app-server config warning is malformed");
          }
          if (message.params.range !== undefined && message.params.range !== null) {
            exactKeys(message.params.range, ["end", "start"], "config warning range");
            for (const position of [message.params.range.start, message.params.range.end]) {
              exactKeys(position, ["column", "line"], "config warning position");
              if (!Number.isInteger(position.column) || position.column < 0 ||
                  !Number.isInteger(position.line) || position.line < 0) {
                fail("app-server config warning position is malformed");
              }
            }
          }
          notificationShapes.push({
            method: message.method,
            params: Object.keys(message.params).sort(),
            value_types: {
              details: message.params.details === null ? "null" : typeof message.params.details,
              path: message.params.path === null ? "null" : typeof message.params.path,
              range: message.params.range === null ? "null" : typeof message.params.range,
              summary: typeof message.params.summary,
            },
          });
        } else {
          fail("app-server returned an unknown notification");
        }
      }
    } catch (error) {
      abort(error);
    }
  });
  child.stdin.write(`${JSON.stringify({
    id: 0,
    method: "initialize",
    params: { clientInfo: { name: "pareto_ins01_observer", title: "Pareto INS-01 Observer", version: "1.0.0" } },
  })}\n`);
  const outcome = await Promise.race([
    completion,
    delay(observerRuntimeBounds.appServerProbeMs).then(() => null),
  ]);
  if (!outcome) {
    await terminateTimedOutChild(child, completion, "app-server Skill probe", lifecycle);
    fail("app-server Skill probe timed out");
  }
  lines.close();
  if (fault) throw fault;
  if (outcome.code !== 0 || outcome.signal || responses.size !== 2) fail("app-server did not close cleanly");
  const initialized = responses.get(0);
  const listed = responses.get(1);
  if (typeof initialized?.userAgent !== "string" || typeof initialized.platformFamily !== "string" ||
      typeof initialized.platformOs !== "string") fail("app-server omitted host identity");
  if (!Array.isArray(listed?.data) || listed.data.length !== 1 || listed.data[0]?.cwd !== cwd ||
      !Array.isArray(listed.data[0].skills) || !Array.isArray(listed.data[0].errors) ||
      listed.data[0].errors.length !== 0) fail("app-server Skill discovery result is malformed");
  const matches = listed.data[0].skills.filter((entry) => entry?.name === "run-bounded-mission");
  if (matches.length !== 1) fail("app-server did not discover exactly one run-bounded-mission Skill");
  const skill = matches[0];
  const expectedPath = path.join(roots.agents, "skills", "run-bounded-mission", "SKILL.md");
  if (skill.scope !== "user" || skill.enabled !== true || skill.description !== expectedDescription ||
      await realpath(skill.path).catch(() => "") !== await realpath(expectedPath).catch(() => "")) {
    fail("app-server discovered the wrong installed Skill identity");
  }
  return {
    codex_entry_sha256: executable.sha256,
    host: {
      platform_family: initialized.platformFamily,
      platform_os: initialized.platformOs,
      user_agent: initialized.userAgent,
    },
    protocol_notifications_sha256: digest(Buffer.from(JSON.stringify(canonical(
      notificationShapes.map((shape) => JSON.stringify(canonical(shape))).sort(),
    )))),
    skill: {
      description_sha256: digest(Buffer.from(skill.description)),
      enabled: true,
      name: skill.name,
      path_suffix: ".agents/skills/run-bounded-mission/SKILL.md",
      scope: skill.scope,
    },
  };
}

async function probeAgentProfileLoader({ codexEntry, cwd, roots, profile, expectMalformed, lifecycle }) {
  const executable = await fileIdentity(codexEntry);
  const profilePath = (await realpath(path.join(roots.codex, "agents", profile))).replaceAll("\\", "/");
  const child = spawn(process.execPath, [executable.path, "app-server"], {
    cwd,
    env: roots.env,
    stdio: ["pipe", "pipe", "pipe"],
  });
  if (!child.stdin || !child.stdout || !child.stderr) fail("app-server profile transport is unavailable");
  const lines = readline.createInterface({ input: child.stdout, crlfDelay: Infinity });
  const responses = new Map();
  const warnings = [];
  const notifications = [];
  let fault = null;
  let outputBytes = 0;
  let errorBytes = 0;
  let configResponseSeen = false;
  let closed;
  const completion = new Promise((resolve) => {
    closed = resolve;
  });
  const abort = (error) => {
    fault ??= error;
  };
  child.stdout.on("data", (chunk) => {
    outputBytes += chunk.length;
    if (outputBytes > 4 * 1024 * 1024) abort(new Error("app-server profile stdout exceeded 4 MiB"));
  });
  child.stderr.on("data", (chunk) => {
    errorBytes += chunk.length;
    if (errorBytes > 1024 * 1024) abort(new Error("app-server profile stderr exceeded 1 MiB"));
  });
  child.once("error", () => abort(new Error("app-server profile probe failed")));
  child.once("close", (code, signal) => closed({ code, signal }));
  lines.on("line", (line) => {
    try {
      rejectDuplicateJsonObjectMembers(line, "app-server profile response");
      const message = JSON.parse(line);
      if (Number.isInteger(message?.id)) {
        exactKeys(message, message.error === undefined ? ["id", "result"] : ["error", "id"], "app-server profile response");
        if (![0, 1].includes(message.id) || responses.has(message.id) || message.error !== undefined) {
          fail("app-server returned an unexpected profile response");
        }
        responses.set(message.id, message.result);
        if (message.id === 0) {
          child.stdin.write(`${JSON.stringify({ method: "initialized", params: {} })}\n`);
          child.stdin.write(`${JSON.stringify({
            id: 1,
            method: "config/read",
            params: { cwd, includeLayers: true },
          })}\n`);
        } else {
          configResponseSeen = true;
          child.stdin.end();
        }
      } else {
        exactKeys(message, ["method", "params"], "app-server profile notification");
        if (message.method === "configWarning") {
          const disposition = classifyProfileConfigWarning(message.params, profilePath, configResponseSeen);
          if (disposition === "malformed_target_profile") warnings.push(disposition);
          else notifications.push({ method: message.method, warning: disposition });
        } else if (message.method === "remoteControl/status/changed") {
          exactOptionalKeys(
            message.params,
            ["installationId", "serverName", "status"],
            ["environmentId"],
            "profile remote-control notification params",
          );
          notifications.push({ method: message.method, params: Object.keys(message.params).sort() });
        } else {
          fail("app-server returned an unknown profile notification");
        }
      }
    } catch (error) {
      abort(error);
      child.stdin.end();
    }
  });
  child.stdin.write(`${JSON.stringify({
    id: 0,
    method: "initialize",
    params: { clientInfo: { name: "pareto_profile_observer", title: "Pareto Profile Observer", version: "1.0.0" } },
  })}\n`);
  const outcome = await Promise.race([
    completion,
    delay(observerRuntimeBounds.appServerProbeMs).then(() => null),
  ]);
  if (!outcome) {
    await terminateTimedOutChild(child, completion, "app-server profile probe", lifecycle);
    fail("app-server profile probe timed out");
  }
  lines.close();
  if (fault) throw fault;
  if (outcome.code !== 0 || outcome.signal || responses.size !== 2) fail("app-server profile probe did not close cleanly");
  const initialized = responses.get(0);
  const config = responses.get(1);
  if (typeof initialized?.userAgent !== "string" || typeof initialized.platformFamily !== "string" ||
      typeof initialized.platformOs !== "string" || !config?.config || !config?.origins) {
    fail("app-server profile probe omitted host or config identity");
  }
  if ((expectMalformed && JSON.stringify(warnings) !== JSON.stringify(["malformed_target_profile"])) ||
      (!expectMalformed && warnings.length !== 0)) {
    fail("app-server profile loader produced the wrong warning disposition");
  }
  return {
    codex_entry_sha256: executable.sha256,
    host: {
      platform_family: initialized.platformFamily,
      platform_os: initialized.platformOs,
      user_agent: initialized.userAgent,
    },
    loader_sha256: digest(Buffer.from(JSON.stringify(canonical({
      notifications,
      profile,
      result: expectMalformed ? "malformed_rejected" : "loaded_without_warning",
      warnings,
    })))),
  };
}

function skillDescription(source) {
  const match = /^---\r?\n[\s\S]*?^description:\s*"([^"]+)"\s*$[\s\S]*?^---\r?\n/m.exec(source);
  if (!match) fail("subject Skill description is unavailable");
  return match[1];
}

async function readEnvelope(file, capabilityId) {
  const bytes = await readFile(file);
  rejectDuplicateJsonObjectMembers(bytes.toString("utf8"), `${capabilityId} observation`);
  const envelope = JSON.parse(bytes);
  exactKeys(envelope, ["schema", "content_sha256", "payload"], `${capabilityId} observation envelope`);
  if (envelope.schema !== "pareto-capability-observation-envelope/v1" || !sha256Pattern.test(envelope.content_sha256) ||
      envelope.content_sha256 !== digest(Buffer.from(JSON.stringify(canonical(envelope.payload))))) {
    fail(`${capabilityId} observation envelope digest is invalid`);
  }
  return { bytes, envelope };
}

function requireSha(value, label) {
  if (!sha256Pattern.test(value)) fail(`${label} must be one SHA-256 digest`);
}

function requireAtom(value, label) {
  if (typeof value !== "string" || value.length === 0 || value.length > 256 || /[\u0000-\u001f]/.test(value)) {
    fail(`${label} must be one bounded string`);
  }
}

function validateAggregatedObservation(payload, observer, capabilityId, capability) {
  exactKeys(payload, [
    "schema", "authority", "capability_id", "environment", "observer", "result", "scenarios", "subject", "trial_id",
  ], `${capabilityId} observation payload`);
  if (payload.schema !== "pareto-capability-observation/v2" ||
      payload.authority !== "fixed_observer_real_consumer" || payload.capability_id !== capabilityId ||
      payload.result !== "pass" || !canonicalEqual(payload.observer, observer) ||
      !Number.isInteger(payload.trial_id) || payload.trial_id < 1 || payload.trial_id > 3) {
    fail(`${capabilityId} campaign contains an invalid observation`);
  }
  exactKeys(payload.environment, ["arch", "codex_entry_sha256", "codex_user_agent", "node", "platform"],
    `${capabilityId} observation environment`);
  if (!new Set(["linux", "win32"]).has(payload.environment.platform)) {
    fail(`${capabilityId} observation environment is unsupported`);
  }
  requireSha(payload.environment.codex_entry_sha256, `${capabilityId} Codex entry`);
  for (const key of ["arch", "codex_user_agent", "node"]) requireAtom(payload.environment[key], `${capabilityId} environment ${key}`);
  exactKeys(payload.observer, ["commit", "script_blob", "tree"], `${capabilityId} observer identity`);
  exactKeys(payload.subject, [
    "repository", "commit", "tree", "skill_tree", "codex_agents_tree", "codex_session_hook_blob", "installer_blob",
  ], `${capabilityId} subject identity`);
  if (payload.subject.repository !== expectedRepository ||
      [payload.subject.commit, payload.subject.tree, payload.subject.skill_tree, payload.subject.codex_agents_tree,
        payload.subject.codex_session_hook_blob, payload.subject.installer_blob].some((value) => !oidPattern.test(value))) {
    fail(`${capabilityId} subject identity is invalid`);
  }
  exactKeys(payload.scenarios, ["negative", "positive", "recovery"], `${capabilityId} scenarios`);
  const scenarioKeys = capability.kind === "skill" ? {
    positive: ["case_id", "installed_manifest_sha256", "loader_sha256", "protocol_notifications_sha256", "result"],
    negative: ["case_id", "diagnostic_sha256", "installation_after_sha256", "installation_before_sha256", "result"],
    recovery: ["case_id", "drift_diagnostic_sha256", "installed_manifest_sha256", "loader_sha256", "protocol_notifications_sha256", "result"],
  } : {
    positive: ["case_id", "installed_profile_sha256", "loader_sha256", "owned_profiles_sha256", "profile", "result", "source_profile_sha256"],
    negative: ["case_id", "diagnostic_sha256", "installation_after_sha256", "installation_before_sha256", "loader_sha256", "profile", "result"],
    recovery: ["case_id", "drift_diagnostic_sha256", "installed_profile_sha256", "loader_sha256", "owned_profiles_sha256", "profile", "result"],
  };
  for (const [scenario, caseId] of Object.entries(capability.cases)) {
    const value = payload.scenarios[scenario];
    exactKeys(value, scenarioKeys[scenario], `${capabilityId} ${scenario} observation`);
    if (value.case_id !== caseId || value.result !== "pass" ||
        (capability.kind === "profile" && value.profile !== capability.profile)) {
      fail(`${capabilityId} ${scenario} observation is invalid`);
    }
    for (const [key, digestValue] of Object.entries(value)) {
      if (key.endsWith("_sha256")) requireSha(digestValue, `${capabilityId} ${scenario} ${key}`);
    }
  }
  if (capability.kind === "profile") {
    if (payload.scenarios.negative.installation_before_sha256 !== payload.scenarios.negative.installation_after_sha256 ||
        payload.scenarios.positive.installed_profile_sha256 !== payload.scenarios.positive.source_profile_sha256 ||
        payload.scenarios.recovery.installed_profile_sha256 !== payload.scenarios.positive.source_profile_sha256 ||
        payload.scenarios.recovery.owned_profiles_sha256 !== payload.scenarios.positive.owned_profiles_sha256 ||
        payload.scenarios.recovery.loader_sha256 !== payload.scenarios.positive.loader_sha256) {
      fail(`${capabilityId} recovery does not restore the positive profile consumer state`);
    }
  }
}

async function observe({ capabilityId, subjectRoot, codexEntry, output, trial }) {
  const capability = capabilities[capabilityId];
  if (!capability) fail("unsupported installation capability");
  const subject = subjectIdentity(subjectRoot);
  const observer = observerIdentity();
  const temporary = await mkdtemp(path.join(tmpdir(), `pareto-${capability.slug}-observer-`));
  const windowsAgentsRoot = platform() === "win32" ? path.join(homedir(), ".agents") : null;
  const lifecycle = createObserverLifecycle();
  let windowsAgentsIdentity = null;
  try {
  if (windowsAgentsRoot) {
    windowsAgentsIdentity = await claimWindowsAgentsRoot(windowsAgentsRoot);
  }
  const roots = {
    agents: windowsAgentsRoot ?? path.join(temporary, "home", ".agents"),
    codex: path.join(temporary, "codex-home"),
    env: isolatedEnvironment(temporary),
  };
  const loaderRoots = {
    ...roots,
    env: { ...roots.env, CODEX_HOME: path.join(temporary, "loader-codex-home") },
  };
  const workspace = path.join(temporary, "workspace");
  await Promise.all([
    mkdir(workspace, { recursive: true }),
    mkdir(loaderRoots.env.CODEX_HOME, { recursive: true }),
  ]);
  const lock = path.join(temporary, "codex-skills.lock.json");
  const badLock = path.join(temporary, "bad-codex-skills.lock.json");
  const sourceSkill = path.join(subjectRoot, "skills", "run-bounded-mission");
  const destinationSkill = path.join(roots.agents, "skills", "run-bounded-mission");
  const sourceSkillText = await readFile(path.join(sourceSkill, "SKILL.md"), "utf8");
  const description = skillDescription(sourceSkillText);
  const foreignState = await seedForeignState(roots);
  const expectedForeignState = await foreignStateDigest(foreignState);
  const expectedInstalledState = await expectedInstallation(subjectRoot, path.join(temporary, "expected"));
  await writeFile(lock, `${JSON.stringify({ schema_version: 2, ...subject })}\n`);

  const positiveInstall = installer(subjectRoot, roots, lock);
  requireCompleted(positiveInstall, "positive installer consumer");
  requireCompleted(installer(subjectRoot, roots, lock, true), "positive installer verification");
  const sourceManifest = await treeDigest(sourceSkill);
  const installedManifest = await treeDigest(destinationSkill);
  if (sourceManifest !== installedManifest) fail("positive install does not match the source Skill tree");
  if (await foreignStateDigest(foreignState) !== expectedForeignState) fail("positive install changed unrelated user state");
  const installedState = await installationDigest(roots.agents, roots.codex);
  if (installedState !== expectedInstalledState) fail("positive install created an unexpected installation tree");

  if (capability.kind === "profile") {
    const sourceProfile = path.join(subjectRoot, "codex", "agents", capability.profile);
    const destinationProfile = path.join(roots.codex, "agents", capability.profile);
    const sourceProfileBytes = await readFile(sourceProfile);
    const installedProfileBytes = await readFile(destinationProfile);
    if (!installedProfileBytes.equals(sourceProfileBytes)) fail("positive profile install does not match the committed source");
    const positiveOwnedProfiles = await ownedProfileDigest(roots.codex);
    const positiveProfileState = await profileInstallationDigest(destinationSkill, roots.codex, foreignState);
    const positiveLoader = await probeAgentProfileLoader({
      codexEntry, cwd: workspace, roots, profile: capability.profile, expectMalformed: false, lifecycle,
    });

    await writeFile(destinationProfile, "name = [pareto_observer_malformed");
    const driftedState = await profileInstallationDigest(destinationSkill, roots.codex, foreignState);
    const driftCheck = installer(subjectRoot, roots, lock, true);
    requireExpectedFailure(
      driftCheck,
      `Codex install mismatch: agent:${capability.profile}`,
      "profile recovery precondition",
    );
    const negativeLoader = await probeAgentProfileLoader({
      codexEntry, cwd: workspace, roots, profile: capability.profile, expectMalformed: true, lifecycle,
    });
    if (await profileInstallationDigest(destinationSkill, roots.codex, foreignState) !== driftedState ||
        await foreignStateDigest(foreignState) !== expectedForeignState) {
      fail("profile mismatch check or loader changed the installation");
    }

    requireCompleted(installer(subjectRoot, roots, lock), "profile recovery installer consumer");
    requireCompleted(installer(subjectRoot, roots, lock, true), "profile recovery installer verification");
    const recoveryLoader = await probeAgentProfileLoader({
      codexEntry, cwd: workspace, roots, profile: capability.profile, expectMalformed: false, lifecycle,
    });
    const recoveredProfileBytes = await readFile(destinationProfile);
    const recoveredOwnedProfiles = await ownedProfileDigest(roots.codex);
    if (!recoveredProfileBytes.equals(sourceProfileBytes) || recoveredOwnedProfiles !== positiveOwnedProfiles ||
        recoveryLoader.loader_sha256 !== positiveLoader.loader_sha256 ||
        await profileInstallationDigest(destinationSkill, roots.codex, foreignState) !== positiveProfileState ||
        await foreignStateDigest(foreignState) !== expectedForeignState) {
      fail("profile recovery did not restore the exact positive consumer state");
    }

    if (observerIdentity().commit !== observer.commit || subjectIdentity(subjectRoot).commit !== subject.commit) {
      fail("observer or subject identity drifted during the profile capability observation");
    }
    const payload = canonical({
      schema: "pareto-capability-observation/v2",
      authority: "fixed_observer_real_consumer",
      capability_id: capabilityId,
      environment: {
        arch: arch(),
        codex_entry_sha256: positiveLoader.codex_entry_sha256,
        codex_user_agent: positiveLoader.host.user_agent,
        node: process.version,
        platform: platform(),
      },
      observer,
      result: "pass",
      scenarios: {
        positive: {
          case_id: capability.cases.positive,
          installed_profile_sha256: digest(installedProfileBytes),
          loader_sha256: positiveLoader.loader_sha256,
          owned_profiles_sha256: positiveOwnedProfiles,
          profile: capability.profile,
          result: "pass",
          source_profile_sha256: digest(sourceProfileBytes),
        },
        negative: {
          case_id: capability.cases.negative,
          diagnostic_sha256: diagnosticDigest(driftCheck),
          installation_after_sha256: driftedState,
          installation_before_sha256: driftedState,
          loader_sha256: negativeLoader.loader_sha256,
          profile: capability.profile,
          result: "pass",
        },
        recovery: {
          case_id: capability.cases.recovery,
          drift_diagnostic_sha256: diagnosticDigest(driftCheck),
          installed_profile_sha256: digest(recoveredProfileBytes),
          loader_sha256: recoveryLoader.loader_sha256,
          owned_profiles_sha256: recoveredOwnedProfiles,
          profile: capability.profile,
          result: "pass",
        },
      },
      subject,
      trial_id: trial,
    });
    const envelope = canonical({
      schema: "pareto-capability-observation-envelope/v1",
      content_sha256: digest(Buffer.from(JSON.stringify(payload))),
      payload,
    });
    await writeFile(output, `${JSON.stringify(envelope)}\n`, { flag: "wx" });
    return;
  }

  const positiveLoader = await listInstalledSkill({
    codexEntry, cwd: workspace, roots: loaderRoots, expectedDescription: description, lifecycle,
  });
  await writeFile(badLock, `${JSON.stringify({ schema_version: 2, ...subject, skill_tree: "0".repeat(40) })}\n`);
  const negative = installer(subjectRoot, roots, badLock);
  requireExpectedFailure(negative, "Codex skills lock mismatch: skill_tree", "negative stale-lock guard");
  if (await installationDigest(roots.agents, roots.codex) !== installedState ||
      await foreignStateDigest(foreignState) !== expectedForeignState) {
    fail("negative stale-lock guard changed the installation");
  }

  await writeFile(path.join(destinationSkill, "SKILL.md"), `${sourceSkillText}\n<!-- observer drift -->\n`);
  const driftCheck = installer(subjectRoot, roots, lock, true);
  requireExpectedFailure(driftCheck, "Codex install mismatch: skill", "recovery precondition");
  requireCompleted(installer(subjectRoot, roots, lock), "recovery installer consumer");
  requireCompleted(installer(subjectRoot, roots, lock, true), "recovery installer verification");
  const recoveryLoader = await listInstalledSkill({
    codexEntry, cwd: workspace, roots: loaderRoots, expectedDescription: description, lifecycle,
  });
  if (await treeDigest(destinationSkill) !== sourceManifest ||
      await installationDigest(roots.agents, roots.codex) !== installedState ||
      await foreignStateDigest(foreignState) !== expectedForeignState) {
    fail("recovery install did not restore the exact installation");
  }

  if (observerIdentity().commit !== observer.commit || subjectIdentity(subjectRoot).commit !== subject.commit) {
    fail("observer or subject identity drifted during the capability observation");
  }
  const payload = canonical({
    schema: "pareto-capability-observation/v2",
    authority: "fixed_observer_real_consumer",
    capability_id: capabilityId,
    environment: {
      arch: arch(),
      codex_entry_sha256: positiveLoader.codex_entry_sha256,
      codex_user_agent: positiveLoader.host.user_agent,
      node: process.version,
      platform: platform(),
    },
    observer,
    result: "pass",
    scenarios: {
      positive: {
        case_id: capability.cases.positive,
        installed_manifest_sha256: installedManifest,
        loader_sha256: digest(Buffer.from(JSON.stringify(canonical(positiveLoader.skill)))),
        protocol_notifications_sha256: positiveLoader.protocol_notifications_sha256,
        result: "pass",
      },
      negative: {
        case_id: capability.cases.negative,
        diagnostic_sha256: diagnosticDigest(negative),
        installation_before_sha256: installedState,
        installation_after_sha256: installedState,
        result: "pass",
      },
      recovery: {
        case_id: capability.cases.recovery,
        drift_diagnostic_sha256: diagnosticDigest(driftCheck),
        installed_manifest_sha256: await treeDigest(destinationSkill),
        loader_sha256: digest(Buffer.from(JSON.stringify(canonical(recoveryLoader.skill)))),
        protocol_notifications_sha256: recoveryLoader.protocol_notifications_sha256,
        result: "pass",
      },
    },
    subject,
    trial_id: trial,
  });
  const envelope = canonical({
    schema: "pareto-capability-observation-envelope/v1",
    content_sha256: digest(Buffer.from(JSON.stringify(payload))),
    payload,
  });
  await writeFile(output, `${JSON.stringify(envelope)}\n`, { flag: "wx" });
  } finally {
    await lifecycle.cleanup(() => Promise.all([
      rm(temporary, observerRuntimeBounds.cleanup),
      windowsAgentsIdentity
        ? removeWindowsAgentsRoot(windowsAgentsRoot, windowsAgentsIdentity)
        : Promise.resolve(),
    ]));
  }
}

async function aggregate({ capabilityId, inputDir, output }) {
  const capability = capabilities[capabilityId];
  if (!capability) fail("unsupported installation capability");
  const observer = observerIdentity();
  const directories = (await readdir(inputDir, { withFileTypes: true }))
    .filter((entry) => entry.isDirectory() && !entry.isSymbolicLink())
    .sort((left, right) => left.name.localeCompare(right.name));
  if (directories.length !== 6) fail(`${capabilityId} campaign requires exactly six attested environment-trial observations`);
  const observationPattern = new RegExp(`^${capability.observation}-(?:Linux|Windows)-[123]\\.json$`);
  const rows = [];
  for (const directory of directories) {
    const directoryPath = path.join(inputDir, directory.name);
    const files = (await readdir(directoryPath)).sort();
    const observationFiles = files.filter((name) => observationPattern.test(name));
    if (files.length !== 2 || observationFiles.length !== 1 || !files.includes("attestation.json")) {
      fail(`${capabilityId} campaign input does not contain one observation and one attestation`);
    }
    const observationName = observationFiles[0];
    const row = await readEnvelope(path.join(directoryPath, observationName), capabilityId);
    const bundlePath = path.join(directoryPath, "attestation.json");
    const bundleInfo = await lstat(bundlePath).catch(() => null);
    if (!bundleInfo?.isFile() || bundleInfo.isSymbolicLink() || bundleInfo.size === 0 || bundleInfo.size > 4 * 1024 * 1024) {
      fail(`${capabilityId} observation attestation is missing or unsafe`);
    }
    const bundle = await readFile(bundlePath);
    rejectDuplicateJsonObjectMembers(bundle.toString("utf8"), `${capabilityId} observation attestation`);
    const parsedBundle = JSON.parse(bundle);
    exactKeys(parsedBundle, ["dsseEnvelope", "mediaType", "verificationMaterial"], `${capabilityId} observation attestation`);
    if (parsedBundle.mediaType !== "application/vnd.dev.sigstore.bundle.v0.3+json") {
      fail(`${capabilityId} observation attestation media type is invalid`);
    }
    const payload = row.envelope.payload;
    validateAggregatedObservation(payload, observer, capabilityId, capability);
    rows.push({
      bundle_path: path.posix.join(path.basename(inputDir), directory.name, "attestation.json"),
      bundle_sha256: digest(bundle),
      content_sha256: row.envelope.content_sha256,
      environment: payload.environment.platform,
      subject: payload.subject,
      trial_id: payload.trial_id,
    });
  }
  const expectedSlots = ["linux:1", "linux:2", "linux:3", "win32:1", "win32:2", "win32:3"];
  const actualSlots = rows.map((row) => `${row.environment}:${row.trial_id}`).sort();
  if (!canonicalEqual(actualSlots, expectedSlots) ||
      rows.some((row) => !canonicalEqual(row.subject, rows[0].subject)) ||
      rows[0].subject.commit !== observer.commit) {
    fail(`${capabilityId} campaign lacks exact Linux and Windows coverage for one subject`);
  }
  const payload = canonical({
    schema: "pareto-capability-campaign/v2",
    authority: "github_attestation_subject",
    capability_id: capabilityId,
    coverage: {
      environments: ["linux", "win32"],
      trials_per_environment: 3,
    },
    environments: ["linux", "win32"],
    observations: rows.map(({ bundle_path, bundle_sha256, content_sha256, environment, trial_id }) => ({
      bundle_path, bundle_sha256, content_sha256, environment, trial_id,
    }))
      .sort((left, right) => left.environment.localeCompare(right.environment) || left.trial_id - right.trial_id),
    observer,
    result: "pass",
    scenarios: capability.cases,
    subject: rows[0].subject,
  });
  const envelope = canonical({
    schema: "pareto-capability-campaign-envelope/v1",
    content_sha256: digest(Buffer.from(JSON.stringify(payload))),
    payload,
  });
  await writeFile(output, `${JSON.stringify(envelope)}\n`, { flag: "wx" });
}

function parseArguments(argv) {
  const options = {};
  for (let index = 0; index < argv.length; index += 2) {
    const flag = argv[index];
    const value = argv[index + 1];
    if (!value || !["--capability", "--subject-root", "--codex-entry", "--input-dir", "--output", "--trial"].includes(flag) || flag in options) {
      fail(`unsupported, duplicate, or incomplete argument: ${flag ?? "<missing>"}`);
    }
    options[flag] = value;
  }
  if (!options["--output"] || !capabilities[options["--capability"]]) {
    fail("--output and one supported --capability are required");
  }
  const observing = options["--subject-root"] || options["--codex-entry"];
  const aggregating = options["--input-dir"];
  if (Boolean(observing) === Boolean(aggregating) ||
      (observing && (!options["--subject-root"] || !options["--codex-entry"] || !options["--trial"])) ||
      (aggregating && (options["--subject-root"] || options["--codex-entry"] || options["--trial"]))) {
    fail("choose one complete observation or aggregation mode");
  }
  const trial = options["--trial"] === undefined ? undefined : Number(options["--trial"]);
  if (trial !== undefined && (!Number.isInteger(trial) || trial < 1 || trial > 3 || String(trial) !== options["--trial"])) {
    fail("--trial must be one integer from 1 through 3");
  }
  return {
    capabilityId: options["--capability"],
    subjectRoot: options["--subject-root"] ? path.resolve(options["--subject-root"]) : undefined,
    codexEntry: options["--codex-entry"] ? path.resolve(options["--codex-entry"]) : undefined,
    inputDir: options["--input-dir"] ? path.resolve(options["--input-dir"]) : undefined,
    output: path.resolve(options["--output"]),
    trial,
  };
}

if (import.meta.main) {
  try {
    const options = parseArguments(process.argv.slice(2));
    if (options.inputDir) await aggregate(options);
    else await observe(options);
  } catch (error) {
    process.stderr.write(`${error.message}\n`);
    process.exitCode = 1;
  }
}
