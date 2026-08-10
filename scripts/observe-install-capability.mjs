#!/usr/bin/env node

import { spawn, spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import { createReadStream, realpathSync } from "node:fs";
import { cp, lstat, mkdir, mkdtemp, readFile, readdir, realpath, rm, writeFile } from "node:fs/promises";
import { arch, homedir, platform, tmpdir } from "node:os";
import path from "node:path";
import readline from "node:readline";
import { setTimeout as delay } from "node:timers/promises";
import { fileURLToPath } from "node:url";
import { rejectDuplicateJsonObjectMembers } from "./json.mjs";

const observerRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const expectedRepository = "https://github.com/qOeOp/pareto";
const capabilityId = "INS-01";
const ownedProfiles = ["fast-builder.toml", "mission-evaluator.toml", "mission-planner.toml", "mission-researcher.toml"];
const cases = Object.freeze({
  positive: "portable-skill-install-and-loader-discovery",
  negative: "stale-lock-rejected-without-install-drift",
  recovery: "installed-skill-drift-repaired-and-discovered",
});
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
        ? "name = \"foreign\"\ndescription = \"Unrelated observer sentinel.\"\nsandbox_mode = \"read-only\"\n"
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

async function listInstalledSkill({ codexEntry, cwd, roots, expectedDescription }) {
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
  const outcome = await Promise.race([completion, delay(10_000).then(() => null)]);
  if (!outcome) {
    child.kill("SIGTERM");
    await Promise.race([completion, delay(2_000)]);
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

function skillDescription(source) {
  const match = /^---\r?\n[\s\S]*?^description:\s*"([^"]+)"\s*$[\s\S]*?^---\r?\n/m.exec(source);
  if (!match) fail("subject Skill description is unavailable");
  return match[1];
}

async function readEnvelope(file) {
  const bytes = await readFile(file);
  rejectDuplicateJsonObjectMembers(bytes.toString("utf8"), "INS-01 observation");
  const envelope = JSON.parse(bytes);
  exactKeys(envelope, ["schema", "content_sha256", "payload"], "INS-01 observation envelope");
  if (envelope.schema !== "pareto-capability-observation-envelope/v1" || !sha256Pattern.test(envelope.content_sha256) ||
      envelope.content_sha256 !== digest(Buffer.from(JSON.stringify(canonical(envelope.payload))))) {
    fail("INS-01 observation envelope digest is invalid");
  }
  return { bytes, envelope };
}

async function observe({ subjectRoot, codexEntry, output }) {
  const subject = subjectIdentity(subjectRoot);
  const observer = observerIdentity();
  const temporary = await mkdtemp(path.join(tmpdir(), "pareto-ins01-observer-"));
  try {
  const roots = {
    agents: path.join(temporary, "home", ".agents"),
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

  const positiveLoader = await listInstalledSkill({
    codexEntry, cwd: workspace, roots: loaderRoots, expectedDescription: description,
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
    codexEntry, cwd: workspace, roots: loaderRoots, expectedDescription: description,
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
    schema: "pareto-capability-observation/v1",
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
        case_id: cases.positive,
        installed_manifest_sha256: installedManifest,
        loader_sha256: digest(Buffer.from(JSON.stringify(canonical(positiveLoader.skill)))),
        protocol_notifications_sha256: positiveLoader.protocol_notifications_sha256,
        result: "pass",
      },
      negative: {
        case_id: cases.negative,
        diagnostic_sha256: diagnosticDigest(negative),
        installation_before_sha256: installedState,
        installation_after_sha256: installedState,
        result: "pass",
      },
      recovery: {
        case_id: cases.recovery,
        drift_diagnostic_sha256: diagnosticDigest(driftCheck),
        installed_manifest_sha256: await treeDigest(destinationSkill),
        loader_sha256: digest(Buffer.from(JSON.stringify(canonical(recoveryLoader.skill)))),
        protocol_notifications_sha256: recoveryLoader.protocol_notifications_sha256,
        result: "pass",
      },
    },
    subject,
  });
  const envelope = canonical({
    schema: "pareto-capability-observation-envelope/v1",
    content_sha256: digest(Buffer.from(JSON.stringify(payload))),
    payload,
  });
  await writeFile(output, `${JSON.stringify(envelope)}\n`, { flag: "wx" });
  } finally {
    await rm(temporary, { force: true, recursive: true });
  }
}

async function aggregate({ inputDir, output }) {
  const observer = observerIdentity();
  const files = (await readdir(inputDir)).filter((name) => name.endsWith(".json")).sort();
  if (files.length !== 2) fail("INS-01 campaign requires exactly two environment observations");
  const rows = [];
  for (const name of files) {
    const row = await readEnvelope(path.join(inputDir, name));
    const payload = row.envelope.payload;
    if (payload?.schema !== "pareto-capability-observation/v1" || payload.capability_id !== capabilityId ||
        payload.result !== "pass" || JSON.stringify(payload.observer) !== JSON.stringify(observer) ||
        Object.entries(cases).some(([scenario, caseId]) =>
          payload.scenarios?.[scenario]?.case_id !== caseId || payload.scenarios[scenario].result !== "pass")) {
      fail("INS-01 campaign contains an invalid observation");
    }
    rows.push({
      content_sha256: row.envelope.content_sha256,
      environment: payload.environment.platform,
      subject: payload.subject,
    });
  }
  if (new Set(rows.map((row) => row.environment)).size !== 2 ||
      !rows.some((row) => row.environment === "linux") || !rows.some((row) => row.environment === "win32") ||
      JSON.stringify(rows[0].subject) !== JSON.stringify(rows[1].subject) ||
      rows[0].subject.commit !== observer.commit) {
    fail("INS-01 campaign lacks exact Linux and Windows coverage for one subject");
  }
  const payload = canonical({
    schema: "pareto-capability-campaign/v1",
    authority: "github_attestation_subject",
    capability_id: capabilityId,
    environments: rows.map((row) => row.environment).sort(),
    observations: rows.map(({ content_sha256, environment }) => ({ content_sha256, environment }))
      .sort((left, right) => left.environment.localeCompare(right.environment)),
    observer,
    result: "pass",
    scenarios: cases,
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
    if (!value || !["--subject-root", "--codex-entry", "--input-dir", "--output"].includes(flag) || flag in options) {
      fail(`unsupported, duplicate, or incomplete argument: ${flag ?? "<missing>"}`);
    }
    options[flag] = value;
  }
  if (!options["--output"]) fail("--output is required");
  const observing = options["--subject-root"] || options["--codex-entry"];
  const aggregating = options["--input-dir"];
  if (Boolean(observing) === Boolean(aggregating) ||
      (observing && (!options["--subject-root"] || !options["--codex-entry"])) ||
      (aggregating && (options["--subject-root"] || options["--codex-entry"]))) {
    fail("choose one complete observation or aggregation mode");
  }
  return {
    subjectRoot: options["--subject-root"] ? path.resolve(options["--subject-root"]) : undefined,
    codexEntry: options["--codex-entry"] ? path.resolve(options["--codex-entry"]) : undefined,
    inputDir: options["--input-dir"] ? path.resolve(options["--input-dir"]) : undefined,
    output: path.resolve(options["--output"]),
  };
}

try {
  const options = parseArguments(process.argv.slice(2));
  if (options.inputDir) await aggregate(options);
  else await observe(options);
} catch (error) {
  process.stderr.write(`${error.message}\n`);
  process.exitCode = 1;
}
