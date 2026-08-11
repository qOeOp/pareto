import { createHash } from "node:crypto";
import { execFile } from "node:child_process";
import { lstat, mkdir, mkdtemp, readFile, readdir, realpath, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import nodeProcess from "node:process";
import { promisify } from "node:util";
import { fileURLToPath, pathToFileURL } from "node:url";
import { rejectDuplicateJsonObjectMembers } from "./json.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const defaultCatalogPath = path.join(root, "evals", "capabilities.json");
const execFileAsync = promisify(execFile);
const cleanProcessEnvironment = Object.fromEntries(Object.entries(nodeProcess.env).filter(([name]) =>
  !/^(?:GIT_|NODE_|DYLD_|LD_)/i.test(name)));
const gitEnvironment = {
  ...cleanProcessEnvironment,
  // Git for Windows does not accept Node's `\\.\nul` spelling here; its
  // native null-device pathname is the reserved DOS name `NUL`.
  GIT_CONFIG_GLOBAL: nodeProcess.platform === "win32" ? "NUL" : os.devNull,
  GIT_CONFIG_NOSYSTEM: "1",
  GIT_NO_REPLACE_OBJECTS: "1",
  GIT_OPTIONAL_LOCKS: "0",
};
const trustedGitPath = nodeProcess.platform === "win32" ? "C:\\Program Files\\Git\\cmd\\git.exe" : "/usr/bin/git";
const trustedGitOptions = [
  "-c", "core.fsmonitor=false",
  "-c", "core.untrackedCache=false",
  ...(nodeProcess.platform === "win32" ? ["-c", "core.autocrlf=true"] : []),
];
const scorerRuntimePaths = Object.freeze([
  "evals/scenarios.json",
  "package-lock.json",
  "scripts/campaign-verifiers/install.mjs",
  "scripts/campaign-verifiers/score.mjs",
  "scripts/capability-score.mjs",
  "scripts/eval.mjs",
  "scripts/json.mjs",
]);
const mutableRuntimeAttributes = new Set(["filter", "ident", "working-tree-encoding"]);
const sourceKinds = new Set(["deterministic_replay", "native_trace", "independent_review"]);
const results = new Set(["pass", "fail", "unavailable"]);
const scenarios = new Set(["positive", "negative", "recovery"]);
const goalStatuses = new Set(["active", "paused", "blocked", "usageLimited", "budgetLimited", "complete"]);
const shaPattern = /^sha256:[a-f0-9]{64}$/;
const threadPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;
const rawItemTypeByNativeType = new Map([
  ["commandExecution", "command_execution"], ["fileChange", "file_change"],
  ["mcpToolCall", "mcp_tool_call"], ["dynamicToolCall", "mcp_tool_call"],
  ["agentMessage", "agent_message"], ["reasoning", "reasoning"],
  ["webSearch", "web_search"], ["plan", "todo_list"], ["error", "error"],
]);
const passiveNativeItemTypes = new Set([
  "userMessage", "hookPrompt", "agentMessage", "plan", "reasoning", "webSearch", "imageView", "sleep",
]);
const deterministicArtifactCache = new Map();
let evaluationRuntimePromise;
const evidenceRuntimeModeKey = "__qoeopParetoCapabilityScoreEvidenceRuntimeMode";
const singleAttestedCampaignScore = 6;
const repeatedAttestedCampaignScore = 8;
const sigstoreMirror = "https://tuf-repo-cdn.sigstore.dev";
const sigstoreRuntimePackages = Object.freeze([
  "@sigstore/bundle",
  "@sigstore/core",
  "@sigstore/protobuf-specs",
  "@sigstore/tuf",
  "@sigstore/verify",
]);
const sigstoreRuntimeSha256 = "sha256:838b9f970235f6b1c02ff198430cacf9ce30f5b0259dd0e7404d4e35b106a8d3";
function fail(message) {
  throw new Error(message);
}

function exactKeys(value, expected, label) {
  if (!value || typeof value !== "object" || Array.isArray(value)) fail(`${label} must be an object`);
  const actual = Object.keys(value).sort();
  const wanted = [...expected].sort();
  if (actual.length !== wanted.length || actual.some((key, index) => key !== wanted[index])) {
    fail(`${label} has unknown or missing fields`);
  }
}

function atom(value, label) {
  if (typeof value !== "string" || value.length === 0 || value.length > 256 || /[\u0000-\u001f]/.test(value)) {
    fail(`${label} must be one bounded string`);
  }
  return value;
}

function digest(bytes) {
  return `sha256:${createHash("sha256").update(bytes).digest("hex")}`;
}

function canonical(value) {
  if (Array.isArray(value)) return value.map(canonical);
  if (value && typeof value === "object") return Object.fromEntries(Object.keys(value).sort().map((key) => [key, canonical(value[key])]));
  return value;
}

async function evaluationRuntime() {
  evaluationRuntimePromise ??= Promise.all([import("yaml"), import("./eval.mjs")]).then(([yaml, evaluation]) => ({
    parseYaml: yaml.parse,
    ...evaluation,
  }));
  return evaluationRuntimePromise;
}

function normalizedRepository(value) {
  return value
    .replace(/^git@github\.com:/, "https://github.com/")
    .replace(/^ssh:\/\/git@github\.com\//, "https://github.com/")
    .replace(/\.git$/, "");
}

function githubRepositorySlug(repository) {
  const match = /^https:\/\/github\.com\/([^/]+)\/([^/]+)$/.exec(normalizedRepository(repository));
  if (!match) fail("attested campaign requires one GitHub repository origin");
  return `${match[1]}/${match[2]}`;
}

function signerOID(signer, oid) {
  return signer?.identity?.oids?.find((entry) => entry?.oid?.id?.join(".") === oid)?.value;
}

function derUtf8(value) {
  const bytes = Buffer.from(value);
  if (bytes.length > 127) fail("attestation identity value is too long");
  return Buffer.concat([Buffer.from([0x0c, bytes.length]), bytes]);
}

async function git(repositoryRoot, args) {
  const info = await lstat(trustedGitPath).catch(() => null);
  if (!info?.isFile() || info.isSymbolicLink()) fail("trusted system Git executable is unavailable");
  const { stdout } = await execFileAsync(trustedGitPath, [...trustedGitOptions, "-C", repositoryRoot, ...args], {
    encoding: "utf8",
    env: gitEnvironment,
    maxBuffer: 1024 * 1024,
  });
  return stdout.trim();
}

async function gitBytes(repositoryRoot, args) {
  const info = await lstat(trustedGitPath).catch(() => null);
  if (!info?.isFile() || info.isSymbolicLink()) fail("trusted system Git executable is unavailable");
  const { stdout } = await execFileAsync(trustedGitPath, [...trustedGitOptions, "-C", repositoryRoot, ...args], {
    encoding: null,
    env: gitEnvironment,
    maxBuffer: 16 * 1024 * 1024,
  });
  return stdout;
}

async function rejectMutableGitAuthority(repositoryRoot) {
  if (await git(repositoryRoot, ["for-each-ref", "--format=%(refname)", "refs/replace"])) {
    fail("candidate repository contains replace refs");
  }
  for (const gitPath of ["info/grafts", "objects/info/alternates", "objects/info/http-alternates"]) {
    const locator = await git(repositoryRoot, ["rev-parse", "--git-path", gitPath]);
    const file = path.isAbsolute(locator) ? locator : path.resolve(repositoryRoot, locator);
    const info = await lstat(file).catch(() => null);
    if (info && (info.isSymbolicLink() || !info.isFile() || info.size > 0)) {
      fail(`candidate repository contains mutable Git authority: ${gitPath}`);
    }
  }
  const configNames = (await gitBytes(repositoryRoot,
    ["config", "--includes", "--null", "--name-only", "--list"]))
    .toString("utf8").split("\0").filter(Boolean).map((name) => name.toLowerCase());
  if (configNames.some((name) => name.startsWith("filter.") || name === "core.attributesfile")) {
    fail("candidate repository config contains mutable Git filter or attributes authority");
  }
  const attributesLocator = await git(repositoryRoot, ["rev-parse", "--git-path", "info/attributes"]);
  const attributesFile = path.isAbsolute(attributesLocator)
    ? attributesLocator
    : path.resolve(repositoryRoot, attributesLocator);
  const attributesInfo = await lstat(attributesFile).catch(() => null);
  if (attributesInfo && (attributesInfo.isSymbolicLink() || !attributesInfo.isFile() || attributesInfo.size > 0)) {
    fail("candidate repository contains mutable Git authority: info/attributes");
  }
  const attributeFields = (await gitBytes(repositoryRoot,
    ["check-attr", "-z", "--all", "--", ...scorerRuntimePaths]))
    .toString("utf8").split("\0");
  if (attributeFields.pop() !== "" || attributeFields.length % 3 !== 0) {
    fail("candidate runtime Git attributes are malformed");
  }
  for (let index = 0; index < attributeFields.length; index += 3) {
    const [file, name] = attributeFields.slice(index, index + 2);
    if (scorerRuntimePaths.includes(file) && mutableRuntimeAttributes.has(name.toLowerCase())) {
      fail(`candidate runtime file uses mutable Git attribute: ${name}`);
    }
  }
  const indexFlags = await git(repositoryRoot, ["ls-files", "-v", "--"]);
  if (indexFlags && indexFlags.split("\n").some((line) => line[0] !== "H")) {
    fail("candidate index contains assume-unchanged or skip-worktree entries");
  }
}

async function verifyCandidate(repositoryRoot, candidate) {
  const resolvedRoot = path.resolve(repositoryRoot);
  const actualRoot = await git(resolvedRoot, ["rev-parse", "--show-toplevel"]);
  if (await realpath(actualRoot) !== await realpath(resolvedRoot)) fail("candidate repository root is not exact");
  await rejectMutableGitAuthority(resolvedRoot);
  const actualRepository = await git(resolvedRoot, ["remote", "get-url", "origin"]);
  if (normalizedRepository(actualRepository) !== normalizedRepository(candidate.repository)) {
    fail("candidate repository does not match origin");
  }
  const commit = await git(resolvedRoot, ["rev-parse", `${candidate.commit}^{commit}`]).catch(() => "");
  const tree = await git(resolvedRoot, ["rev-parse", `${candidate.commit}^{tree}`]).catch(() => "");
  if (commit !== candidate.commit || tree !== candidate.tree) fail("candidate commit/tree is not a real Git identity");
  if (await git(resolvedRoot, ["rev-parse", "HEAD"]) !== candidate.commit) fail("candidate must be the exact checkout HEAD");
  if (await git(resolvedRoot, ["status", "--porcelain=v1", "--untracked-files=all"])) fail("candidate checkout must be clean");
  const committedCatalog = await gitBytes(resolvedRoot, ["show", `${candidate.commit}:evals/capabilities.json`]).catch(() => null);
  if (!committedCatalog) fail("capability catalog is not available from the exact candidate blob");
  return committedCatalog;
}

function parseUniqueJson(bytes, label) {
  const source = bytes.toString("utf8");
  rejectDuplicateJsonObjectMembers(source, label);
  let value;
  try {
    value = JSON.parse(source);
  } catch (error) {
    fail(`${label} is invalid JSON: ${error.message}`);
  }
  return { bytes, value };
}

async function readUniqueJson(file, label) {
  return parseUniqueJson(await readFile(file), label);
}

async function boundedEvidenceFile(evidenceDirectory, relativePath, expectedDigest, label) {
  atom(relativePath, `${label} path`);
  if (path.isAbsolute(relativePath)) fail(`${label} path must be relative`);
  const directory = await realpath(evidenceDirectory);
  const file = path.resolve(directory, relativePath);
  const sourceInfo = await lstat(file).catch(() => null);
  if (!sourceInfo?.isFile() || sourceInfo.isSymbolicLink() || sourceInfo.size > 4 * 1024 * 1024) {
    fail(`${label} is missing or unsafe`);
  }
  const resolved = await realpath(file).catch(() => "");
  const relative = resolved ? path.relative(directory, resolved) : "";
  if (!resolved || relative === "" || relative.startsWith(`..${path.sep}`) || path.isAbsolute(relative)) {
    fail(`${label} path escapes the evidence directory`);
  }
  const bytes = await readFile(resolved);
  if (expectedDigest !== null && digest(bytes) !== expectedDigest) fail(`${label} digest mismatch`);
  return { bytes, path: resolved };
}

async function boundedEvidenceDirectory(evidenceDirectory, relativePath, label) {
  atom(relativePath, `${label} path`);
  if (path.isAbsolute(relativePath)) fail(`${label} path must be relative`);
  const rootDirectory = await realpath(evidenceDirectory);
  const source = path.resolve(rootDirectory, relativePath);
  const sourceInfo = await lstat(source).catch(() => null);
  const resolved = sourceInfo?.isDirectory() && !sourceInfo.isSymbolicLink()
    ? await realpath(source).catch(() => "") : "";
  const relative = resolved ? path.relative(rootDirectory, resolved) : "";
  if (!resolved || !relative || relative.startsWith(`..${path.sep}`) || path.isAbsolute(relative)) {
    fail(`${label} is missing or unsafe`);
  }
  return resolved;
}

export function nodeSupportsSigstore(version = nodeProcess.versions.node) {
  const match = /^(\d+)\.(\d+)\.(\d+)(?:-|$)/.exec(version);
  if (!match) return false;
  const [, majorText, minorText, patchText] = match;
  const [major, minor, patch] = [majorText, minorText, patchText].map(Number);
  return (major === 22 && (minor > 22 || (minor === 22 && patch >= 2))) ||
    (major === 24 && (minor > 15 || (minor === 15 && patch >= 0))) || major >= 26;
}

async function copyRuntimeTree(sourceRoot, destinationRoot) {
  const hash = createHash("sha256");
  const visit = async (relativeDirectory) => {
    const sourceDirectory = path.join(sourceRoot, relativeDirectory);
    const destinationDirectory = path.join(destinationRoot, relativeDirectory);
    await mkdir(destinationDirectory, { recursive: true });
    const entries = await readdir(sourceDirectory, { withFileTypes: true });
    entries.sort((left, right) => left.name < right.name ? -1 : left.name > right.name ? 1 : 0);
    for (const entry of entries) {
      const relative = path.posix.join(relativeDirectory.split(path.sep).join("/"), entry.name);
      const source = path.join(sourceRoot, relativeDirectory, entry.name);
      const destination = path.join(destinationRoot, relativeDirectory, entry.name);
      if (entry.isDirectory()) {
        await visit(path.join(relativeDirectory, entry.name));
        continue;
      }
      if (!entry.isFile() || entry.isSymbolicLink()) fail("Sigstore runtime contains an unsafe entry");
      const bytes = await readFile(source);
      hash.update(relative).update("\0").update(String(bytes.length)).update("\0").update(bytes);
      await writeFile(destination, bytes, { flag: "wx", mode: 0o600 });
    }
  };
  for (const packageName of sigstoreRuntimePackages) {
    await visit(path.join("node_modules", ...packageName.split("/")));
  }
  return `sha256:${hash.digest("hex")}`;
}

async function verifiedSigstoreRuntime(temporaryRoot) {
  if (!nodeSupportsSigstore()) fail("Node runtime is unsupported by the pinned Sigstore verifier");
  const resolvedRoot = await realpath(temporaryRoot).catch(() => "");
  const rootInfo = resolvedRoot ? await lstat(resolvedRoot).catch(() => null) : null;
  if (!rootInfo?.isDirectory() || rootInfo.isSymbolicLink() ||
      await realpath(path.dirname(resolvedRoot)).catch(() => "") !== await realpath(os.tmpdir()) ||
      !path.basename(resolvedRoot).startsWith("pareto-sigstore-runtime-")) {
    fail("Sigstore runtime custody root is invalid");
  }
  try {
    const actualDigest = await copyRuntimeTree(root, resolvedRoot);
    if (actualDigest !== sigstoreRuntimeSha256) fail("Sigstore runtime content does not match the frozen dependency closure");
    const moduleRoot = path.join(resolvedRoot, "node_modules");
    const bundleModule = await import(pathToFileURL(path.join(moduleRoot, "@sigstore/bundle/dist/index.js")).href);
    const protobufModule = await import(pathToFileURL(path.join(moduleRoot, "@sigstore/protobuf-specs/dist/index.js")).href);
    const verifyModule = await import(pathToFileURL(path.join(moduleRoot, "@sigstore/verify/dist/index.js")).href);
    const seeds = JSON.parse(await readFile(path.join(moduleRoot, "@sigstore/tuf/seeds.json"), "utf8"));
    const trustedRootText = Buffer.from(seeds?.[sigstoreMirror]?.targets?.["trusted_root.json"] ?? "", "base64").toString("utf8");
    if (!trustedRootText) fail("Sigstore offline trusted root is unavailable");
    const trustedRoot = protobufModule.TrustedRoot.fromJSON(JSON.parse(trustedRootText));
    return {
      bundleFromJSON: bundleModule.bundleFromJSON,
      trustedRoot,
      toSignedEntity: verifyModule.toSignedEntity,
      toTrustMaterial: verifyModule.toTrustMaterial,
      Verifier: verifyModule.Verifier,
      dispose: () => rm(resolvedRoot, { force: true, recursive: true }),
    };
  } catch (error) {
    await rm(resolvedRoot, { force: true, recursive: true });
    throw error;
  }
}

function validateCatalog(catalog) {
  exactKeys(catalog, ["schema_version", "target_score", "local_trace_ceiling", "score_anchors", "default_requirements", "capabilities"], "catalog");
  if (![1, 2].includes(catalog.schema_version) || catalog.target_score !== 9.5 || catalog.local_trace_ceiling !== 2) {
    fail("catalog version, target, or local trace ceiling is unsupported");
  }
  exactKeys(catalog.score_anchors, ["absent_or_contradicted", "declared", "reachable", "dynamic", "representative", "varied_no_material_gap"], "score anchors");
  const expectedAnchors = { absent_or_contradicted: 0, declared: 2, reachable: 4, dynamic: 6, representative: 8, varied_no_material_gap: 9.5 };
  if (Object.entries(expectedAnchors).some(([key, value]) => catalog.score_anchors[key] !== value)) {
    fail("score anchors must remain 0/2/4/6/8/9.5");
  }
  exactKeys(catalog.default_requirements, ["scenarios", "sources", "trials_per_scenario", "environments", "independent_observers"], "default requirements");
  const requirements = catalog.default_requirements;
  if (JSON.stringify(requirements.scenarios) !== JSON.stringify([...scenarios]) ||
      !Array.isArray(requirements.sources) || requirements.sources.length !== sourceKinds.size ||
      requirements.sources.some((kind) => !sourceKinds.has(kind)) ||
      !Number.isInteger(requirements.trials_per_scenario) || requirements.trials_per_scenario < 3 ||
      !Number.isInteger(requirements.environments) || requirements.environments < 2 ||
      !Number.isInteger(requirements.independent_observers) || requirements.independent_observers < 2) {
    fail("catalog varied-evidence requirements are invalid or too weak");
  }
  if (!Array.isArray(catalog.capabilities) || catalog.capabilities.length === 0) fail("catalog capabilities are empty");
  const capabilities = new Map();
  const rawRows = new Map();
  const parents = new Set();
  for (const capability of catalog.capabilities) {
    exactKeys(capability, catalog.schema_version === 1
      ? ["id", "domain", "name", "owner", "consumer", "weight", "critical"]
      : ["id", "domain", "name", "owner", "consumer", "weight", "critical", "atomicity", "split_from"],
    "capability");
    const id = atom(capability.id, "capability id");
    if (!/^[A-Z]{3,4}-\d{2}$/.test(id) || capabilities.has(id)) fail(`capability id is invalid or duplicated: ${id}`);
    for (const key of ["domain", "name", "owner", "consumer"]) atom(capability[key], `capability ${id} ${key}`);
    if (capability.weight !== 1) fail(`capability ${id} weight must remain one so weights cannot hide a weak leaf`);
    if (typeof capability.critical !== "boolean") fail(`capability ${id} critical must be boolean`);
    if (catalog.schema_version === 2) {
      if (capability.atomicity !== "unreviewed") {
        fail(`capability ${id} atomicity requires a future independent authority consumer`);
      }
      if (capability.split_from !== null &&
          (typeof capability.split_from !== "string" || !/^[A-Z]{3,4}-\d{2}$/.test(capability.split_from))) {
        fail(`capability ${id} split parent is invalid`);
      }
      if (capability.split_from !== null) parents.add(capability.split_from);
    }
    rawRows.set(id, capability);
    capabilities.set(id, Object.fromEntries(["id", "domain", "name", "owner", "consumer", "weight", "critical"]
      .map((key) => [key, capability[key]])));
  }
  if (catalog.schema_version === 2) {
    for (const capability of rawRows.values()) {
      if (capability.split_from !== null && (!rawRows.has(capability.split_from) || capability.split_from === capability.id)) {
        fail(`capability ${capability.id} split parent is invalid`);
      }
      const lineage = new Set([capability.id]);
      let parent = capability.split_from;
      while (parent !== null) {
        if (lineage.has(parent)) fail("capability lineage contains a cycle");
        lineage.add(parent);
        parent = rawRows.get(parent).split_from;
      }
    }
  }
  return {
    capabilities,
    unreviewedTerminalIds: new Set(catalog.schema_version === 2
      ? [...capabilities.keys()].filter((id) => !parents.has(id))
      : []),
  };
}

export function parseCapabilityResult(message, label) {
  rejectDuplicateJsonObjectMembers(message, label);
  let result;
  try {
    result = JSON.parse(message);
  } catch (error) {
    fail(`${label} is not exact JSON: ${error.message}`);
  }
  exactKeys(result, ["schema", "capability_id", "scenario", "case_id", "candidate", "result", "oracle", "control_sha256", "unavailable_evidence", "material_gaps", "mutation_observation"], label);
  if (result.schema !== "rbm-capability-result/v1" || !results.has(result.result)) fail(`${label} schema or result is invalid`);
  exactKeys(result.candidate, ["commit", "tree"], `${label} candidate`);
  if (!shaPattern.test(result.control_sha256) || !Array.isArray(result.unavailable_evidence) || !Array.isArray(result.material_gaps)) fail(`${label} control or gap fields are invalid`);
  atom(result.oracle, `${label} oracle`);
  if (!['none', 'detected'].includes(result.mutation_observation)) fail(`${label} mutation observation is invalid`);
  return result;
}

function capabilityCaseBinding(testCase, label) {
  const observations = testCase?.metadata?.observations;
  const binding = observations?.capability;
  if (!binding || typeof binding !== "object" || Array.isArray(binding) ||
      !/^[A-Z]{3,4}-\d{2}$/.test(binding.id ?? "") ||
      !scenarios.has(binding.scenario) ||
      typeof binding.case_id !== "string" || binding.case_id.length === 0 || binding.case_id.length > 256 ||
      typeof observations.behavioral_oracle !== "string" || observations.behavioral_oracle.length === 0) {
    fail(`${label} capability binding is invalid`);
  }
  return binding;
}

async function committedCapabilityCases(repositoryRoot, candidate, capabilities) {
  const { parseYaml } = await evaluationRuntime();
  const cases = new Map();
  for (const file of ["evals/cases/golden.yaml", "evals/cases/holdout.yaml"]) {
    const bytes = await gitBytes(repositoryRoot, ["show", `${candidate.commit}:${file}`]).catch(() => null);
    if (!bytes) fail(`committed capability cases are unavailable: ${file}`);
    const parsed = parseYaml(bytes.toString("utf8"));
    if (!Array.isArray(parsed)) fail(`committed capability cases are malformed: ${file}`);
    for (const testCase of parsed) {
      const binding = capabilityCaseBinding(testCase, `committed case ${file}`);
      if (!capabilities.has(binding.id) || cases.has(binding.case_id)) fail(`committed capability case is unknown or duplicated: ${binding.case_id}`);
      cases.set(binding.case_id, {
        assertions: (testCase.assert ?? []).filter((assertion) =>
          assertion.type !== "skill-used" && assertion.type !== "not-skill-used"),
        binding,
        control_sha256: digest(Buffer.from(JSON.stringify(canonical(testCase)))),
        oracle: testCase.metadata.observations.behavioral_oracle,
        prompt: testCase?.vars?.prompt,
        required_raw_item_types: testCase.metadata.observations.required_raw_item_types,
        skill_activation: testCase.metadata.observations.skill_activation,
      });
    }
  }
  return cases;
}

async function verifyCommittedFixedObserverBindings(repositoryRoot, candidate, capabilities) {
  const bytes = await gitBytes(repositoryRoot, ["show", `${candidate.commit}:evals/scenarios.json`]).catch(() => null);
  if (!bytes) fail("committed scenario authority is unavailable from the candidate");
  const { value: design } = parseUniqueJson(bytes, "scenario authority");
  exactKeys(design, ["schema_version", "attested_protocols", "fixed_observers", "scenarios"], "scenario authority");
  if (design.schema_version !== 3 || !design.attested_protocols || Array.isArray(design.attested_protocols) ||
      !design.fixed_observers || Array.isArray(design.fixed_observers) ||
      !Array.isArray(design.scenarios) || design.scenarios.length !== capabilities.size * scenarios.size) {
    fail("scenario authority identity is invalid");
  }
  const rows = new Map();
  for (const row of design.scenarios) {
    if (!row || typeof row !== "object" || Array.isArray(row) ||
        typeof row.capability_id !== "string" || !capabilities.has(row.capability_id) || !scenarios.has(row.scenario) ||
        typeof row.case_id !== "string") {
      fail("scenario authority row is invalid");
    }
    const slot = `${row.capability_id}/${row.scenario}`;
    if (rows.has(slot)) fail("scenario authority contains a duplicate slot");
    rows.set(slot, row);
  }
  const authority = new Map();
  for (const [capabilityId, binding] of Object.entries(design.fixed_observers)) {
    exactKeys(binding, ["parameters", "protocol"], `fixed observer ${capabilityId}`);
    const protocol = design.attested_protocols[binding.protocol];
    if (!protocol) fail(`${capabilityId} fixed observer protocol is unavailable`);
    exactKeys(protocol,
      ["adapter", "consumer_paths", "consumer_workflow_name", "coverage", "observer", "protocol", "runtime_paths", "subject_paths", "workflow", "workflow_name"],
      `fixed observer ${capabilityId} protocol`);
    if (protocol.protocol !== "pareto-fixed-observer-protocol/v1") {
      fail(`${capabilityId} fixed observer protocol version is unsupported`);
    }
    const capabilityRows = [];
    const bindings = {};
    for (const scenario of scenarios) {
      const row = rows.get(`${capabilityId}/${scenario}`);
      if (!row || row.observer_kind !== "fixed_real_consumer" || row.executable_suite !== "golden") {
        fail(`${capabilityId} fixed observer does not match the committed scenario authority`);
      }
      capabilityRows.push(row);
      bindings[scenario] = row.case_id;
    }
    const implemented = capabilityRows.every((row) =>
      row.authority_status === "implemented" && row.missing_authority === null);
    const unavailable = capabilityRows.every((row) =>
      row.authority_status === "authority_unavailable" &&
      ["fixed_consumer_observer", "scenario_consumer_binding"].includes(row.missing_authority));
    if (!implemented && !unavailable) fail(`${capabilityId} fixed observer scenario authority is partial or invalid`);
    authority.set(capabilityId, {
      binding, bindings, candidate_commit: candidate.commit, capability_id: capabilityId, implemented, protocol,
    });
  }
  for (const row of rows.values()) {
    if (row.authority_status === "implemented" && !authority.has(row.capability_id)) {
      fail(`${row.capability_id} implemented scenario authority lacks a fixed observer`);
    }
  }
  return authority;
}

async function loadCampaignAdapter(authority) {
  const adapterPath = authority?.protocol?.adapter;
  if (typeof adapterPath !== "string" || !adapterPath.startsWith("scripts/campaign-verifiers/") ||
      !/^[a-z0-9./-]+\.mjs$/.test(adapterPath) || adapterPath.includes("..")) {
    fail("campaign adapter path is invalid");
  }
  const module = await import(`${pathToFileURL(path.join(root, adapterPath)).href}?blob=${
    await gitIdentityAt(authority.candidate_commit, adapterPath)}`);
  if (typeof module.verifyObservationFacts !== "function") fail("campaign adapter contract is unavailable");
  return module;
}

function enterEvidenceRuntimeMode(mode) {
  if (mode === null) return;
  const descriptor = Object.getOwnPropertyDescriptor(nodeProcess, evidenceRuntimeModeKey);
  if (descriptor && (descriptor.configurable || descriptor.writable !== false ||
      descriptor.get !== undefined || descriptor.set !== undefined ||
      !["attested", "local"].includes(descriptor.value))) {
    fail("scorer process runtime mode lock is invalid");
  }
  const current = descriptor?.value;
  if (current !== undefined && current !== mode) {
    fail("attested and local observation runtimes require separate scorer processes");
  }
  if (current === undefined) {
    Object.defineProperty(nodeProcess, evidenceRuntimeModeKey, {
      configurable: false,
      enumerable: false,
      value: mode,
      writable: false,
    });
  }
}

function verifyDeterministicText(output, assertions, label) {
  if (typeof output !== "string" || output.length === 0) fail(`${label} has no terminal output`);
  if (!Array.isArray(assertions) || assertions.length === 0) fail(`${label} has no committed deterministic assertions`);
  for (const assertion of assertions) {
    if (assertion?.type === "contains" && typeof assertion.value === "string") {
      if (!output.includes(assertion.value)) fail(`${label} fails a committed contains assertion`);
      continue;
    }
    if (assertion?.type === "contains-all" && Array.isArray(assertion.value) &&
        assertion.value.length > 0 && assertion.value.every((value) => typeof value === "string")) {
      if (assertion.value.some((value) => !output.includes(value))) fail(`${label} fails a committed contains-all assertion`);
      continue;
    }
    if (assertion?.type === "not-contains" && typeof assertion.value === "string") {
      if (output.includes(assertion.value)) fail(`${label} fails a committed not-contains assertion`);
      continue;
    }
    if (assertion?.type === "equals" && typeof assertion.value === "string") {
      if (output !== assertion.value) fail(`${label} fails a committed equals assertion`);
      continue;
    }
    fail(`${label} uses an unsupported deterministic assertion`);
  }
}

export async function verifyCommittedNativeTurn({ repositoryRoot, prompt, output, observedRawItemTypes, observedSkillActivation }) {
  const origin = normalizedRepository(await git(repositoryRoot, ["remote", "get-url", "origin"]));
  const commit = await git(repositoryRoot, ["rev-parse", "HEAD"]);
  const tree = await git(repositoryRoot, ["rev-parse", "HEAD^{tree}"]);
  const candidate = { repository: origin, commit, tree };
  const catalogBytes = await verifyCandidate(repositoryRoot, candidate);
  const { value: catalog } = parseUniqueJson(catalogBytes, "capability catalog");
  const capabilities = validateCatalog(catalog).capabilities;
  const cases = await committedCapabilityCases(repositoryRoot, candidate, capabilities);
  const matching = [...cases.values()].filter((entry) => entry.prompt === prompt);
  if (matching.length !== 1) fail("native turn prompt does not match exactly one committed capability case");
  const committedCase = matching[0];
  verifyDeterministicText(output, committedCase.assertions, "native terminal output");
  if (!Array.isArray(observedRawItemTypes) || observedRawItemTypes.some((type) => typeof type !== "string") ||
      new Set(observedRawItemTypes).size !== observedRawItemTypes.length) fail("native raw item observations are malformed");
  if (committedCase.required_raw_item_types.some((type) => !observedRawItemTypes.includes(type))) {
    fail("native turn is missing a committed required raw item type");
  }
  const expectedSkillActivation = committedCase.skill_activation?.expected;
  if (committedCase.skill_activation?.status !== "dynamic_heuristic" ||
      !["used", "not_used"].includes(expectedSkillActivation) ||
      !["used", "not_used"].includes(observedSkillActivation) ||
      expectedSkillActivation !== observedSkillActivation) {
    fail("native turn contradicts the committed Skill activation oracle");
  }
  const result = canonical({
    schema: "rbm-capability-result/v1",
    capability_id: committedCase.binding.id,
    scenario: committedCase.binding.scenario,
    case_id: committedCase.binding.case_id,
    candidate: { commit: candidate.commit, tree: candidate.tree },
    result: "pass",
    oracle: committedCase.oracle,
    control_sha256: committedCase.control_sha256,
    unavailable_evidence: [],
    material_gaps: [],
    mutation_observation: "none",
  });
  return { candidate, committedCase, result };
}

function verifyResultAgainstCase(result, committedCase, label) {
  if (result.capability_id !== committedCase.binding.id || result.scenario !== committedCase.binding.scenario ||
      result.case_id !== committedCase.binding.case_id || result.control_sha256 !== committedCase.control_sha256 ||
      result.oracle !== committedCase.oracle) {
    fail(`${label} does not match the committed case control`);
  }
}

export async function verifyCommittedCapabilityResult({ repositoryRoot, result }) {
  const origin = normalizedRepository(await git(repositoryRoot, ["remote", "get-url", "origin"]));
  const candidate = { repository: origin, commit: result.candidate.commit, tree: result.candidate.tree };
  const catalogBytes = await verifyCandidate(repositoryRoot, candidate);
  const { value: catalog } = parseUniqueJson(catalogBytes, "capability catalog");
  const capabilities = validateCatalog(catalog).capabilities;
  const cases = await committedCapabilityCases(repositoryRoot, candidate, capabilities);
  const committedCase = cases.get(result.case_id);
  if (!committedCase) fail("native result does not name one committed capability case");
  verifyResultAgainstCase(result, committedCase, "native capability result");
  if (result.result !== "pass" || result.unavailable_evidence.length > 0 || result.material_gaps.length > 0 || result.mutation_observation !== "none") {
    fail("native capability result is not one clean passing observation");
  }
  if (typeof committedCase.prompt !== "string" || committedCase.prompt.length === 0) fail("committed capability case has no exact prompt");
  return { candidate, committedCase };
}

function parseRolloutTrace(bytes, observation, candidate, committedCase) {
  const source = bytes.toString("utf8");
  const lines = source.endsWith("\n") ? source.slice(0, -1).split("\n") : source.split("\n");
  if (lines.length < 4) fail(`rollout trace is incomplete: ${observation.artifact_path}`);
  const entries = lines.map((line, index) => {
    rejectDuplicateJsonObjectMembers(line, `rollout line ${index + 1}`);
    try {
      return JSON.parse(line);
    } catch (error) {
      fail(`rollout line ${index + 1} is invalid JSON: ${error.message}`);
    }
  });
  const session = entries.find((entry) => entry.type === "session_meta")?.payload;
  if (!session || typeof session.id !== "string" || typeof session.session_id !== "string" ||
      typeof session.originator !== "string" || typeof session.cli_version !== "string" ||
      typeof session.model_provider !== "string") fail("rollout lacks session or environment identity");
  const started = entries.some((entry) => entry.type === "event_msg" && entry.payload?.type === "task_started");
  const completed = [...entries].reverse().find((entry) => entry.type === "event_msg" && entry.payload?.type === "task_complete")?.payload;
  const tokenReceipt = entries.some((entry) => entry.type === "event_msg" && entry.payload?.type === "token_count" && entry.payload?.info?.total_token_usage);
  const finalMessage = [...entries].reverse().find((entry) => entry.type === "response_item" && entry.payload?.type === "message" && entry.payload?.role === "assistant")?.payload?.content?.find((item) => item.type === "output_text")?.text;
  if (!started || !completed || !tokenReceipt || typeof finalMessage !== "string" || completed.last_agent_message !== finalMessage) fail("rollout lacks one consistent terminal task and token receipt");
  const result = parseCapabilityResult(finalMessage, "rollout capability result");
  verifyResultAgainstCase(result, committedCase, "rollout capability result");
  if (result.capability_id !== observation.capability_id || result.scenario !== observation.scenario || result.case_id !== observation.case_id || result.result !== observation.result) fail("rollout result does not match observation binding");
  if (result.candidate.commit !== candidate.commit || result.candidate.tree !== candidate.tree) fail("rollout result does not match candidate identity");
  if (result.unavailable_evidence.length > 0 || result.material_gaps.length > 0 || result.mutation_observation !== "none") return false;

  const spawn = session.source?.subagent?.thread_spawn;
  const derivedProducer = spawn?.parent_thread_id ?? session.parent_thread_id ?? session.id;
  const derivedEnvironment = `codex:${session.originator}:${session.cli_version}:${session.model_provider}`;
  if (observation.observer_id !== session.id || observation.producer_id !== derivedProducer || observation.subject_id !== candidate.commit) fail("rollout principals do not match observation binding");
  if (observation.environment_id !== derivedEnvironment) fail("rollout environment does not match observation binding");
  if (observation.source_kind === "independent_review" && (!spawn || session.thread_source !== "subagent")) fail("independent review must be a native subagent rollout");
  if (observation.source_kind === "deterministic_replay") {
    const calls = new Set(entries.filter((entry) => entry.type === "response_item" && entry.payload?.type === "custom_tool_call" && typeof entry.payload?.call_id === "string").map((entry) => entry.payload.call_id));
    const outputs = new Set(entries.filter((entry) => entry.type === "response_item" && entry.payload?.type === "custom_tool_call_output" && typeof entry.payload?.call_id === "string").map((entry) => entry.payload.call_id));
    if (![...calls].some((callId) => outputs.has(callId))) fail("deterministic replay trace lacks a paired tool call and output");
  }
  return true;
}

function installedHomeFromArtifact(artifact) {
  const homes = new Set();
  for (const row of artifact?.results?.results ?? []) {
    if (typeof row?.response?.raw !== "string") continue;
    const { value: raw } = parseUniqueJson(Buffer.from(row.response.raw), "Promptfoo raw turn");
    for (const item of raw?.items ?? []) {
      if (item?.type !== "command_execution" || typeof item.command !== "string") continue;
      for (const token of item.command.split(/\s+/)) {
        const normalized = token.replace(/^[`"'([{<]+|[`"',;:)\]}>]+$/g, "").replace(/\\/g, "/");
        const match = /^(.*)\/\.agents\/skills\/run-bounded-mission\/SKILL\.md$/.exec(normalized);
        if (match) homes.add(match[1]);
      }
    }
  }
  if (homes.size !== 1) fail("Promptfoo evidence does not identify one installed user Skill root");
  return [...homes][0];
}

async function validatedDeterministicArtifact(bytes, artifactPath, candidate) {
  const cacheKey = `${artifactPath}\u0000${digest(bytes)}\u0000${candidate.commit}\u0000${candidate.tree}`;
  if (deterministicArtifactCache.has(cacheKey)) return deterministicArtifactCache.get(cacheKey);
  const validation = (async () => {
  const { CANONICAL_PROVIDER_ID, readHoldoutIdentity, runtimeCasesForInstalledSkill, validateResultArtifact, parseYaml } =
    await evaluationRuntime();
  const { value: artifact } = parseUniqueJson(bytes, "Promptfoo capability evidence");
  const repeat = artifact?.runtimeOptions?.repeat;
  const suite = repeat === 1 ? "smoke" : repeat === 2 ? "full" : repeat === 3 ? "holdout" : null;
  if (!suite) fail("Promptfoo capability evidence has an unsupported suite repeat");
  const caseFile = suite === "holdout" ? "evals/cases/holdout.yaml" : "evals/cases/golden.yaml";
  const caseBytes = await gitBytes(root, ["show", `${candidate.commit}:${caseFile}`]).catch(() => null);
  if (!caseBytes) fail("Promptfoo capability case authority is unavailable from the candidate");
  const sourceCases = parseYaml(caseBytes.toString("utf8"));
  const suitePattern = suite === "smoke" ? /^\[smoke\]/ : suite === "full" ? /^\[(?:smoke|full)\]/ : /^\[holdout\]/;
  const selectedCases = sourceCases.filter((testCase) => suitePattern.test(testCase.description));
  const runtimeCases = runtimeCasesForInstalledSkill(selectedCases);
  const provider = artifact?.config?.providers?.[0];
  const model = provider?.config?.model;
  const effort = provider?.config?.model_reasoning_effort;
  const candidateIdentity = { commit: candidate.commit, tree: candidate.tree };
  let holdoutIdentity = null;
  if (suite === "holdout") {
    holdoutIdentity = await readHoldoutIdentity(root);
    if (holdoutIdentity.commit !== candidate.commit || holdoutIdentity.tree !== candidate.tree) {
      fail("Promptfoo holdout authority does not match the candidate");
    }
  }
  const installedHome = installedHomeFromArtifact(artifact);
  await validateResultArtifact({
    resultPath: artifactPath,
    suite,
    repeat,
    cases: runtimeCases,
    providerId: CANONICAL_PROVIDER_ID,
    model,
    effort,
    workingDirectory: path.resolve("/redacted-eval-workspace"),
    homeDirectory: installedHome,
    codexHome: path.resolve("/redacted-codex-home"),
    candidateIdentity,
    holdoutIdentity,
  });
  if (artifact.config?.metadata?.candidate?.commit !== candidate.commit ||
      artifact.config?.metadata?.candidate?.tree !== candidate.tree) {
    fail("Promptfoo capability evidence is stale for the candidate");
  }
    return { artifact, repeat, selectedCases, provider, model, effort };
  })();
  deterministicArtifactCache.set(cacheKey, validation);
  try {
    return await validation;
  } catch (error) {
    deterministicArtifactCache.delete(cacheKey);
    throw error;
  }
}

async function parseDeterministicEvalTrace(bytes, artifactPath, observation, candidate) {
  const { artifact, repeat, selectedCases, provider, model, effort } =
    await validatedDeterministicArtifact(bytes, artifactPath, candidate);
  const sourceCase = selectedCases.find((testCase) =>
    testCase?.metadata?.observations?.capability?.case_id === observation.case_id);
  const binding = sourceCase?.metadata?.observations?.capability;
  if (!sourceCase || binding.id !== observation.capability_id || binding.scenario !== observation.scenario) {
    fail("Promptfoo capability evidence does not match the committed case binding");
  }
  const rows = artifact.results.results.filter((row) =>
    row?.testCase?.metadata?.observations?.capability?.case_id === observation.case_id);
  const trialIndex = Number(observation.trial_id) - 1;
  if (!Number.isInteger(trialIndex) || trialIndex < 0 || trialIndex >= rows.length || rows.length !== repeat) {
    fail("Promptfoo capability trial binding is invalid");
  }
  const row = rows[trialIndex];
  const rawBytes = Buffer.from(row.response.raw, "utf8");
  const environment = `promptfoo:${provider.id}:${model}:${effort}`;
  const producer = digest(rawBytes);
  const observer = digest(bytes);
  if (observation.environment_id !== environment || observation.subject_id !== candidate.commit ||
      observation.producer_id !== producer || observation.observer_id !== observer ||
      observation.result !== "pass") {
    fail("Promptfoo capability principals or result do not match the validated trial");
  }
  return true;
}

function parseNativeTrace(bytes, observation, candidate, committedCase) {
  const { value: envelope } = parseUniqueJson(bytes, "native evidence");
  exactKeys(envelope, ["schema", "content_sha256", "payload"], "native evidence envelope");
  if (envelope.schema !== "rbm-native-evidence-envelope/v4" || !shaPattern.test(envelope.content_sha256)) fail("native evidence envelope is invalid");
  const payload = envelope.payload;
  exactKeys(payload, ["schema", "authority", "executable", "host", "thread", "turn", "goal", "expectation", "binding", "oracle", "result"], "native evidence payload");
  if (payload.schema !== "rbm-native-evidence/v4" || payload.authority !== "local_interface_observation" || payload.result !== "matched") fail("native evidence authority or result is invalid");
  if (envelope.content_sha256 !== digest(Buffer.from(JSON.stringify(canonical(payload))))) fail("native evidence content digest is invalid");
  exactKeys(payload.executable, ["sha256", "server_version"], "native executable");
  if (!shaPattern.test(payload.executable.sha256) || !/^\d+\.\d+\.\d+(?:[-+][0-9A-Za-z.-]+)?$/.test(payload.executable.server_version)) fail("native executable identity is invalid");
  exactKeys(payload.host, ["platform_family", "platform_os", "user_agent"], "native host");
  for (const key of ["platform_family", "platform_os", "user_agent"]) atom(payload.host[key], `native host ${key}`);
  exactKeys(payload.thread, ["cli_version", "cwd_sha256", "id", "parent_thread_id", "session_id_sha256", "source", "status"], "native thread");
  exactKeys(payload.thread.source, ["kind", "sha256"], "native thread source");
  if (!threadPattern.test(payload.thread.id) || (payload.thread.parent_thread_id !== null && !threadPattern.test(payload.thread.parent_thread_id)) || !shaPattern.test(payload.thread.session_id_sha256) || !shaPattern.test(payload.thread.cwd_sha256) || !shaPattern.test(payload.thread.source.sha256)) fail("native thread identity is invalid");
  for (const key of ["cli_version", "status"]) atom(payload.thread[key], `native thread ${key}`);
  exactKeys(payload.turn, ["id", "status", "items", "prompt_sha256", "output_sha256", "oracle_result_sha256"], "native turn");
  if (!threadPattern.test(payload.turn.id) || payload.turn.status !== "completed" || !Array.isArray(payload.turn.items) || payload.turn.items.length < 2 ||
      !shaPattern.test(payload.turn.prompt_sha256) || !shaPattern.test(payload.turn.output_sha256) ||
      !shaPattern.test(payload.turn.oracle_result_sha256)) fail("native turn identity is invalid");
  for (const item of payload.turn.items) {
    exactKeys(item, ["id_sha256", "raw_type", "skill_read", "terminal_state", "type"], "native turn item");
    if (!shaPattern.test(item.id_sha256)) fail("native turn item identity is invalid");
    atom(item.type, "native turn item type");
    const actionable = item.type === "commandExecution";
    if ((!passiveNativeItemTypes.has(item.type) && !actionable) ||
        item.raw_type !== (rawItemTypeByNativeType.get(item.type) ?? null) || typeof item.skill_read !== "boolean" ||
        (item.skill_read && item.type !== "commandExecution") ||
        (actionable ? item.terminal_state !== "completed" : item.terminal_state !== null)) {
      fail("native turn item observation is invalid");
    }
  }
  if (payload.turn.items.filter((item) => item.type === "userMessage").length !== 1 || payload.turn.items.at(-1).type !== "agentMessage") fail("native turn item sequence is invalid");
  exactKeys(payload.expectation, ["goal_status", "objective_sha256"], "native expectation");
  if (![...goalStatuses, "absent"].includes(payload.expectation.goal_status) || (payload.expectation.objective_sha256 !== null && !shaPattern.test(payload.expectation.objective_sha256))) fail("native expectation is invalid");
  if (payload.goal !== null) {
    exactKeys(payload.goal, ["objective_sha256", "status", "thread_id"], "native goal");
    if (!shaPattern.test(payload.goal.objective_sha256) || !goalStatuses.has(payload.goal.status) || payload.goal.thread_id !== payload.thread.id) fail("native goal is invalid");
  }
  if (payload.expectation.goal_status === "absent") {
    if (payload.goal !== null || payload.expectation.objective_sha256 !== null) fail("native goal does not match absent expectation");
  } else if (!payload.goal || payload.goal.status !== payload.expectation.goal_status || payload.goal.objective_sha256 !== payload.expectation.objective_sha256) {
    fail("native goal does not match expectation");
  }
  exactKeys(payload.binding, ["capability_id", "scenario", "case_id", "candidate", "result", "oracle", "control_sha256"], "native binding");
  exactKeys(payload.binding.candidate, ["commit", "tree"], "native binding candidate");
  if (payload.binding.capability_id !== observation.capability_id || payload.binding.scenario !== observation.scenario || payload.binding.case_id !== observation.case_id || payload.binding.result !== observation.result) fail("native binding does not match observation");
  if (payload.binding.candidate.commit !== candidate.commit || payload.binding.candidate.tree !== candidate.tree) fail("native binding does not match candidate");
  if (payload.binding.control_sha256 !== committedCase.control_sha256 || payload.binding.oracle !== committedCase.oracle) fail("native binding does not match committed case control");
  if (payload.turn.prompt_sha256 !== digest(Buffer.from(committedCase.prompt))) fail("native turn prompt digest does not match committed case");
  exactKeys(payload.oracle, ["assertions_sha256", "expected_skill_activation", "observed_skill_activation", "required_raw_item_types", "observed_raw_item_types"], "native oracle");
  const projectedRawTypes = [...new Set(payload.turn.items.map((item) => item.raw_type).filter(Boolean))];
  const projectedActivation = payload.turn.items.some((item) => item.skill_read) ? "used" : "not_used";
  if (payload.oracle.assertions_sha256 !== digest(Buffer.from(JSON.stringify(canonical(committedCase.assertions)))) ||
      payload.oracle.expected_skill_activation !== committedCase.skill_activation.expected ||
      payload.oracle.observed_skill_activation !== committedCase.skill_activation.expected ||
      payload.oracle.observed_skill_activation !== projectedActivation ||
      JSON.stringify(payload.oracle.required_raw_item_types) !== JSON.stringify(committedCase.required_raw_item_types) ||
      !Array.isArray(payload.oracle.observed_raw_item_types) ||
      new Set(payload.oracle.observed_raw_item_types).size !== payload.oracle.observed_raw_item_types.length ||
      JSON.stringify(payload.oracle.observed_raw_item_types) !== JSON.stringify(projectedRawTypes) ||
      payload.oracle.required_raw_item_types.some((type) => !payload.oracle.observed_raw_item_types.includes(type))) {
    fail("native oracle does not match the committed case observations");
  }
  const expectedResult = canonical({
    schema: "rbm-capability-result/v1",
    capability_id: payload.binding.capability_id,
    scenario: payload.binding.scenario,
    case_id: payload.binding.case_id,
    candidate: payload.binding.candidate,
    result: payload.binding.result,
    oracle: payload.binding.oracle,
    control_sha256: payload.binding.control_sha256,
    unavailable_evidence: [],
    material_gaps: [],
    mutation_observation: "none",
  });
  if (payload.turn.oracle_result_sha256 !== digest(Buffer.from(JSON.stringify(expectedResult)))) fail("native derived result digest is invalid");
  const environment = `codex-app-server:${payload.host.user_agent}:${payload.host.platform_family}:${payload.host.platform_os}:${payload.executable.sha256}`;
  const producer = payload.thread.parent_thread_id ?? payload.thread.id;
  if (observation.environment_id !== environment || observation.observer_id !== payload.thread.id || observation.producer_id !== producer || observation.subject_id !== candidate.commit) fail("native principals do not match observation");
  return true;
}

async function validateArtifact(observation, evidenceDirectory, candidate, committedCase) {
  const artifact = await boundedEvidenceFile(
    evidenceDirectory, observation.artifact_path, observation.content_sha256, "evidence artifact",
  );
  if (observation.source_kind === "deterministic_replay" && observation.result === "pass") {
    return parseDeterministicEvalTrace(artifact.bytes, artifact.path, observation, candidate);
  }
  if (observation.source_kind === "native_trace" && observation.result === "pass") {
    return parseNativeTrace(artifact.bytes, observation, candidate, committedCase);
  }
  return parseRolloutTrace(artifact.bytes, observation, candidate, committedCase);
}

async function gitIdentityAt(commit, objectPath) {
  return git(root, ["rev-parse", `${commit}:${objectPath}`]).catch(() => "");
}

async function verifySigstoreBundleFile(bundlePath, bundleSha256, expected, runtimeRoot, sharedRuntime = null) {
  exactKeys(expected,
    ["subject_name", "subject_sha256", "repository_slug", "source_commit", "workflow", "workflow_name"],
    "Sigstore expectation");
  if (!shaPattern.test(bundleSha256) || !shaPattern.test(expected.subject_sha256) ||
      !/^[a-f0-9]{40}$/.test(expected.source_commit) || !/^[^/]+\/[^/]+$/.test(expected.repository_slug) ||
      !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(expected.workflow_name) ||
      path.basename(expected.subject_name) !== expected.subject_name) {
    fail("Sigstore expectation is invalid");
  }
  const bundleBytes = await readFile(bundlePath);
  if (digest(bundleBytes) !== bundleSha256) fail("Sigstore attestation bundle digest mismatch");
  const { value: bundle } = parseUniqueJson(bundleBytes, "Sigstore attestation bundle");
  exactKeys(bundle, ["mediaType", "dsseEnvelope", "verificationMaterial"], "Sigstore attestation bundle");
  if (bundle.mediaType !== "application/vnd.dev.sigstore.bundle.v0.3+json" ||
      bundle.dsseEnvelope?.payloadType !== "application/vnd.in-toto+json" ||
      typeof bundle.dsseEnvelope?.payload !== "string" || !Array.isArray(bundle.dsseEnvelope?.signatures) ||
      bundle.dsseEnvelope.signatures.length !== 1) {
    fail("Sigstore attestation bundle shape is invalid");
  }

  const runtime = sharedRuntime ?? await verifiedSigstoreRuntime(runtimeRoot);
  let signer;
  try {
    const verifier = new runtime.Verifier(runtime.toTrustMaterial(runtime.trustedRoot), {
      ctlogThreshold: 1,
      tlogThreshold: 1,
    });
    signer = verifier.verify(runtime.toSignedEntity(runtime.bundleFromJSON(bundle)));
  } catch {
    fail("Sigstore attestation verification failed");
  } finally {
    if (!sharedRuntime) await runtime.dispose();
  }

  const repositoryURL = `https://github.com/${expected.repository_slug}`;
  const signerURI = `${repositoryURL}/${expected.workflow}@refs/heads/main`;
  const rawOIDClaims = new Map([
    ["1.3.6.1.4.1.57264.1.2", "workflow_dispatch"],
    ["1.3.6.1.4.1.57264.1.3", expected.source_commit],
    ["1.3.6.1.4.1.57264.1.4", expected.workflow_name],
    ["1.3.6.1.4.1.57264.1.5", expected.repository_slug],
    ["1.3.6.1.4.1.57264.1.6", "refs/heads/main"],
  ]);
  const utf8OIDClaims = new Map([
    ["1.3.6.1.4.1.57264.1.9", signerURI],
    ["1.3.6.1.4.1.57264.1.10", expected.source_commit],
    ["1.3.6.1.4.1.57264.1.11", "github-hosted"],
    ["1.3.6.1.4.1.57264.1.12", repositoryURL],
    ["1.3.6.1.4.1.57264.1.13", expected.source_commit],
    ["1.3.6.1.4.1.57264.1.14", "refs/heads/main"],
    ["1.3.6.1.4.1.57264.1.18", signerURI],
    ["1.3.6.1.4.1.57264.1.19", expected.source_commit],
    ["1.3.6.1.4.1.57264.1.20", "workflow_dispatch"],
    ["1.3.6.1.4.1.57264.1.22", "public"],
  ]);
  if (signer?.identity?.subjectAlternativeName !== signerURI ||
      signer?.identity?.extensions?.issuer !== "https://token.actions.githubusercontent.com" ||
      [...rawOIDClaims].some(([oid, value]) => !signerOID(signer, oid)?.equals(Buffer.from(value))) ||
      [...utf8OIDClaims].some(([oid, value]) => !signerOID(signer, oid)?.equals(derUtf8(value)))) {
    fail("Sigstore signer claims do not match the GitHub-hosted main workflow");
  }

  const statementBytes = Buffer.from(bundle.dsseEnvelope.payload, "base64");
  if (statementBytes.toString("base64") !== bundle.dsseEnvelope.payload) fail("Sigstore statement encoding is invalid");
  const { value: statement } = parseUniqueJson(statementBytes, "Sigstore attestation statement");
  const statementSubject = statement?.subject;
  const build = statement?.predicate?.buildDefinition;
  const dependency = build?.resolvedDependencies;
  const subjectHex = expected.subject_sha256.slice("sha256:".length);
  if (statement?._type !== "https://in-toto.io/Statement/v1" || statement?.predicateType !== "https://slsa.dev/provenance/v1" ||
      !Array.isArray(statementSubject) || statementSubject.length !== 1 || statementSubject[0]?.name !== expected.subject_name ||
      statementSubject[0]?.digest?.sha256 !== subjectHex ||
      build?.externalParameters?.workflow?.path !== expected.workflow ||
      build?.externalParameters?.workflow?.ref !== "refs/heads/main" ||
      normalizedRepository(build?.externalParameters?.workflow?.repository ?? "") !== repositoryURL ||
      build?.internalParameters?.github?.runner_environment !== "github-hosted" ||
      !Array.isArray(dependency) || dependency.length !== 1 || dependency[0]?.digest?.gitCommit !== expected.source_commit ||
      dependency[0]?.uri !== `git+${repositoryURL}@refs/heads/main`) {
    fail("Sigstore attestation statement does not match the campaign authority");
  }
  return { schema: "pareto-sigstore-verification/v1", bundle_sha256: bundleSha256 };
}

async function verifySigstoreBundleBatch(plan, runtimeRoot) {
  if (!Array.isArray(plan) || plan.length < 1 || plan.length > 8) fail("Sigstore batch plan is invalid");
  const runtime = await verifiedSigstoreRuntime(runtimeRoot);
  const bundleSha256 = [];
  const bundlePaths = new Set();
  try {
    for (const [index, item] of plan.entries()) {
      exactKeys(item, ["bundle_path", "bundle_sha256", "expected"], `Sigstore batch item ${index + 1}`);
      if (typeof item.bundle_path !== "string" || item.bundle_path.length < 1 || item.bundle_path.length > 4096 ||
          /[\u0000-\u001f]/.test(item.bundle_path) || !path.isAbsolute(item.bundle_path) || bundlePaths.has(item.bundle_path)) {
        fail(`Sigstore batch item ${index + 1} path is invalid`);
      }
      bundlePaths.add(item.bundle_path);
      const receipt = await verifySigstoreBundleFile(
        item.bundle_path, item.bundle_sha256, item.expected, runtimeRoot, runtime,
      );
      bundleSha256.push(receipt.bundle_sha256);
    }
  } finally {
    await runtime.dispose();
  }
  return { schema: "pareto-sigstore-batch-verification/v1", bundle_sha256: bundleSha256 };
}

async function verifySigstoreInChild(bundleFile, entry, expected) {
  const encoded = Buffer.from(JSON.stringify(canonical(expected))).toString("base64");
  const script = fileURLToPath(import.meta.url);
  const runtimeRoot = await mkdtemp(path.join(os.tmpdir(), "pareto-sigstore-runtime-"));
  let stdout;
  try {
    ({ stdout } = await execFileAsync(nodeProcess.execPath,
      [script, "--verify-sigstore", bundleFile.path, entry.bundle_sha256, encoded, runtimeRoot], {
      cwd: root,
      encoding: "utf8",
      env: cleanProcessEnvironment,
      maxBuffer: 1024 * 1024,
      timeout: 30_000,
      }));
  } catch {
    fail("isolated Sigstore attestation verification failed");
  } finally {
    await rm(runtimeRoot, { force: true, recursive: true });
  }
  const { value: receipt } = parseUniqueJson(Buffer.from(stdout), "isolated Sigstore verification receipt");
  exactKeys(receipt, ["bundle_sha256", "schema"], "isolated Sigstore verification receipt");
  if (receipt.schema !== "pareto-sigstore-verification/v1" || receipt.bundle_sha256 !== entry.bundle_sha256) {
    fail("isolated Sigstore verification receipt is invalid");
  }
}

async function verifySigstoreBatchInChild(plan) {
  const encoded = Buffer.from(JSON.stringify(canonical(plan))).toString("base64");
  const script = fileURLToPath(import.meta.url);
  const runtimeRoot = await mkdtemp(path.join(os.tmpdir(), "pareto-sigstore-runtime-"));
  let stdout;
  try {
    ({ stdout } = await execFileAsync(nodeProcess.execPath,
      [script, "--verify-sigstore-batch", encoded, runtimeRoot], {
      cwd: root,
      encoding: "utf8",
      env: cleanProcessEnvironment,
      maxBuffer: 1024 * 1024,
      timeout: 120_000,
      }));
  } catch {
    fail("isolated Sigstore batch verification failed");
  } finally {
    await rm(runtimeRoot, { force: true, recursive: true });
  }
  const { value: receipt } = parseUniqueJson(Buffer.from(stdout), "isolated Sigstore batch receipt");
  exactKeys(receipt, ["bundle_sha256", "schema"], "isolated Sigstore batch receipt");
  if (receipt.schema !== "pareto-sigstore-batch-verification/v1" ||
      JSON.stringify(receipt.bundle_sha256) !== JSON.stringify(plan.map((item) => item.bundle_sha256))) {
    fail("isolated Sigstore batch receipt is invalid");
  }
}

function validateInstallObservation(envelope, campaignPayload, environment, trialId, capabilityId, authority, adapter) {
  exactKeys(envelope, ["schema", "content_sha256", "payload"], "attested observation envelope");
  if (envelope.schema !== "pareto-capability-observation-envelope/v1" ||
      !shaPattern.test(envelope.content_sha256)) {
    fail("attested observation envelope is invalid");
  }
  const payload = envelope.payload;
  exactKeys(payload, ["schema", "authority", "capability_id", "environment", "observer", "result", "scenarios", "subject", "trial_id"], "attested observation payload");
  if (envelope.content_sha256 !== digest(Buffer.from(JSON.stringify(canonical(payload)))) ||
      payload.schema !== "pareto-capability-observation/v2" ||
      payload.authority !== "fixed_observer_real_consumer" ||
      payload.capability_id !== capabilityId || payload.result !== "pass" ||
      payload.trial_id !== trialId ||
      JSON.stringify(canonical(payload.observer)) !== JSON.stringify(canonical(campaignPayload.observer)) ||
      JSON.stringify(canonical(payload.subject)) !== JSON.stringify(canonical(campaignPayload.subject))) {
    fail("attested observation semantics are invalid");
  }
  exactKeys(payload.environment, ["arch", "codex_entry_sha256", "codex_user_agent", "node", "platform"], "attested observation environment");
  if (payload.environment.platform !== environment || !shaPattern.test(payload.environment.codex_entry_sha256)) {
    fail("attested observation environment is invalid");
  }
  for (const key of ["arch", "codex_user_agent", "node"]) atom(payload.environment[key], `attested observation environment ${key}`);

  const adapterResult = adapter.verifyObservationFacts({
    payload,
    capability_id: capabilityId,
    cases: authority.bindings,
    parameters: authority.binding.parameters,
  });
  exactKeys(adapterResult, ["facts_sha256", "schema"], "campaign adapter result");
  if (adapterResult.schema !== "pareto-campaign-adapter-result/v1" ||
      !shaPattern.test(adapterResult.facts_sha256)) {
    fail("campaign adapter result is invalid");
  }
  return payload;
}

async function validateInstallCampaignIdentity(payload, candidate, authority) {
  exactKeys(payload.observer, ["commit", "script_blob", "tree"], "attested campaign observer");
  exactKeys(payload.subject, ["repository", "commit", "tree", ...Object.keys(authority.protocol.subject_paths)],
    "attested campaign subject");
  const sourceCommit = payload.observer.commit;
  if (!/^[a-f0-9]{40}$/.test(sourceCommit) || payload.subject.commit !== sourceCommit ||
      payload.subject.tree !== payload.observer.tree || sourceCommit === candidate.commit ||
      normalizedRepository(payload.subject.repository) !== normalizedRepository(candidate.repository)) {
    fail("attested campaign source identity is invalid");
  }
  const sourceTree = await git(root, ["rev-parse", `${sourceCommit}^{tree}`]).catch(() => "");
  const sourceLine = await git(root, ["rev-list", "--parents", "-n", "1", sourceCommit]).catch(() => "");
  const sourceParts = sourceLine.split(" ");
  const sourceParent = sourceParts.length === 2 && sourceParts[0] === sourceCommit ? sourceParts[1] : "";
  const ancestry = await execFileAsync(trustedGitPath,
    [...trustedGitOptions, "-C", root, "merge-base", "--is-ancestor", sourceCommit, candidate.commit], {
    encoding: "utf8", env: gitEnvironment,
  }).then(() => true, () => false);
  const sourceObjects = Object.fromEntries(await Promise.all([
    ["script_blob", authority.protocol.observer],
    ["adapter_blob", authority.protocol.adapter],
    ...Object.entries(authority.protocol.subject_paths),
  ].map(async ([key, objectPath]) => [key, await gitIdentityAt(sourceCommit, objectPath)])));
  const sourceRuntime = Object.fromEntries(await Promise.all(Object.entries(authority.protocol.runtime_paths)
    .map(async ([key, objectPath]) => [key, await gitIdentityAt(sourceCommit, objectPath)])));
  const authorityPaths = {
    ...Object.fromEntries([
      ["script_blob", authority.protocol.observer],
      ["adapter_blob", authority.protocol.adapter],
      ["workflow_blob", authority.protocol.workflow],
    ]),
    ...authority.protocol.subject_paths,
    ...authority.protocol.runtime_paths,
  };
  const parentObjects = Object.fromEntries(await Promise.all(Object.entries(authorityPaths)
    .map(async ([key, objectPath]) => [key, sourceParent ? await gitIdentityAt(sourceParent, objectPath) : ""])));
  const sourceAuthorityObjects = {
    ...sourceObjects,
    workflow_blob: await gitIdentityAt(sourceCommit, authority.protocol.workflow),
    ...sourceRuntime,
  };
  if (!ancestry || !sourceParent || sourceTree !== payload.observer.tree ||
      sourceObjects.script_blob !== payload.observer.script_blob ||
      Object.entries(sourceObjects).some(([key, value]) =>
        !["script_blob", "adapter_blob"].includes(key) && value !== payload.subject[key]) ||
      Object.values(sourceAuthorityObjects).some((value) => !value) ||
      Object.entries(sourceAuthorityObjects).some(([key, value]) => parentObjects[key] !== value)) {
    fail("attested campaign does not match its immutable Git source");
  }
  const currentObjects = {
    workflow: await gitIdentityAt(candidate.commit, authority.protocol.workflow),
    source_workflow: await gitIdentityAt(sourceCommit, authority.protocol.workflow),
    ...Object.fromEntries(await Promise.all([
      ["script_blob", authority.protocol.observer],
      ["adapter_blob", authority.protocol.adapter],
      ...Object.entries(authority.protocol.subject_paths),
    ].map(async ([key, objectPath]) => [key, await gitIdentityAt(candidate.commit, objectPath)]))),
  };
  const currentRuntime = Object.fromEntries(await Promise.all(Object.entries(authority.protocol.runtime_paths)
    .map(async ([key, objectPath]) => [key, await gitIdentityAt(candidate.commit, objectPath)])));
  if (!currentObjects.workflow || currentObjects.workflow !== currentObjects.source_workflow ||
      Object.entries(sourceObjects).some(([key, value]) => currentObjects[key] !== value) ||
      Object.entries(sourceRuntime).some(([key, value]) => currentRuntime[key] !== value)) {
    fail("attested campaign is stale for the current install consumer");
  }
  return sourceCommit;
}

async function loadAttestedCampaign(entry, evidenceDirectory) {
  const entryKeys = Object.keys(entry ?? {}).sort();
  const baseKeys = ["bundle_path", "bundle_sha256", "campaign_path", "campaign_sha256"];
  const consumedKeys = [...baseKeys, "consumption"].sort();
  if (JSON.stringify(entryKeys) !== JSON.stringify(baseKeys) &&
      JSON.stringify(entryKeys) !== JSON.stringify(consumedKeys)) {
    fail("attested campaign has unknown or missing fields");
  }
  if (!shaPattern.test(entry.campaign_sha256) || !shaPattern.test(entry.bundle_sha256)) {
    fail("attested campaign digests are invalid");
  }
  const campaignFile = await boundedEvidenceFile(
    evidenceDirectory, entry.campaign_path, entry.campaign_sha256, "attested campaign",
  );
  const bundleFile = await boundedEvidenceFile(
    evidenceDirectory, entry.bundle_path, entry.bundle_sha256, "attestation bundle",
  );
  const { value: envelope } = parseUniqueJson(campaignFile.bytes, "attested campaign");
  exactKeys(envelope, ["schema", "content_sha256", "payload"], "attested campaign envelope");
  if (envelope.schema !== "pareto-capability-campaign-envelope/v1" || !shaPattern.test(envelope.content_sha256)) {
    fail("attested campaign envelope is invalid");
  }
  return { bundleFile, campaignFile, envelope };
}

async function verifyInstallCampaign(entry, evidenceDirectory, candidate, authority, loaded = null) {
  if (entry.consumption !== undefined) fail("install campaign cannot carry a score-consumption receipt");
  const { bundleFile, campaignFile, envelope } = loaded ?? await loadAttestedCampaign(entry, evidenceDirectory);
  const campaignDirectory = path.dirname(campaignFile.path);
  const payload = envelope.payload;
  const capabilityId = payload?.capability_id;
  const adapter = await loadCampaignAdapter(authority);
  const repeated = payload?.schema === "pareto-capability-campaign/v2";
  exactKeys(payload, repeated
    ? ["schema", "authority", "capability_id", "coverage", "environments", "observations", "observer", "result", "scenarios", "subject"]
    : ["schema", "authority", "capability_id", "environments", "observations", "observer", "result", "scenarios", "subject"],
  "attested campaign payload");
  if (envelope.content_sha256 !== digest(Buffer.from(JSON.stringify(canonical(payload)))) ||
      !["pareto-capability-campaign/v1", "pareto-capability-campaign/v2"].includes(payload.schema) ||
      payload.authority !== "github_attestation_subject" || capabilityId !== authority.capability_id ||
      payload.result !== "pass" || JSON.stringify(payload.environments) !== JSON.stringify(["linux", "win32"]) ||
      JSON.stringify(canonical(payload.scenarios)) !== JSON.stringify(canonical(authority.bindings))) {
    fail("attested campaign semantics are invalid");
  }
  const sourceCommit = await validateInstallCampaignIdentity(payload, candidate, authority);
  let repeatedVerificationPlan = null;

  if (repeated) {
    exactKeys(payload.coverage, ["environments", "trials_per_environment"], "attested campaign coverage");
    const protocolCoverage = authority.protocol.coverage;
    const expectedSlots = protocolCoverage.environments.flatMap((environment) =>
      Array.from({ length: protocolCoverage.trials_per_environment }, (_, index) => `${environment}:${index + 1}`));
    if (JSON.stringify(payload.coverage) !== JSON.stringify(protocolCoverage) ||
        !Array.isArray(payload.observations) || payload.observations.length !== expectedSlots.length) {
      fail("attested campaign repeated coverage is invalid");
    }
    const actualSlots = [];
    const verifiedInputs = [];
    for (const [index, row] of payload.observations.entries()) {
      exactKeys(row, ["bundle_path", "bundle_sha256", "content_sha256", "environment", "trial_id"],
        `attested campaign observation ${index + 1}`);
      if (!protocolCoverage.environments.includes(row.environment) ||
          !Number.isInteger(row.trial_id) || row.trial_id < 1 ||
          row.trial_id > protocolCoverage.trials_per_environment ||
          !shaPattern.test(row.content_sha256) || !shaPattern.test(row.bundle_sha256)) {
        fail("attested campaign repeated observation is invalid");
      }
      const runner = row.environment === "linux" ? "Linux" : "Windows";
      const slug = capabilityId.toLowerCase();
      const directory = `observations/${slug}-${runner}-${row.trial_id}`;
      if (row.bundle_path !== `${directory}/attestation.json`) {
        fail("attested campaign repeated observation path is invalid");
      }
      actualSlots.push(`${row.environment}:${row.trial_id}`);
      const observationPrefix = authority.binding.parameters.kind === "skill" ? "observation" : `observation-${slug}`;
      const observationPath = `${directory}/${observationPrefix}-${runner}-${row.trial_id}.json`;
      const observationFile = await boundedEvidenceFile(campaignDirectory, observationPath, null, "attested observation");
      const observationEnvelope = parseUniqueJson(observationFile.bytes, "attested observation").value;
      validateInstallObservation(
        observationEnvelope, payload, row.environment, row.trial_id, capabilityId, authority, adapter,
      );
      if (observationEnvelope.content_sha256 !== row.content_sha256) {
        fail("attested campaign observation content digest mismatch");
      }
      const observationBundle = await boundedEvidenceFile(
        campaignDirectory, row.bundle_path, row.bundle_sha256, "attested observation bundle",
      );
      verifiedInputs.push({ observationBundle, observationFile, row });
    }
    if (JSON.stringify(actualSlots) !== JSON.stringify(expectedSlots)) {
      fail("attested campaign repeated observation slots are invalid");
    }
    repeatedVerificationPlan = verifiedInputs.map(({ observationBundle, observationFile, row }) => ({
      bundle_path: observationBundle.path,
      bundle_sha256: row.bundle_sha256,
      expected: {
        subject_name: path.basename(observationFile.path),
        subject_sha256: digest(observationFile.bytes),
        repository_slug: githubRepositorySlug(candidate.repository),
        source_commit: sourceCommit,
        workflow: authority.protocol.workflow,
        workflow_name: authority.protocol.workflow_name,
      },
    }));
  } else if (!Array.isArray(payload.observations) || payload.observations.length !== 2 ||
      payload.observations.some((row, index) => {
        exactKeys(row, ["content_sha256", "environment"], `attested campaign observation ${index + 1}`);
        return !shaPattern.test(row.content_sha256);
      }) || JSON.stringify(payload.observations.map((row) => row.environment)) !== JSON.stringify(["linux", "win32"])) {
    fail("attested campaign observations are invalid");
  }

  const campaignVerification = {
    bundle_path: bundleFile.path,
    bundle_sha256: entry.bundle_sha256,
    expected: {
      subject_name: path.basename(campaignFile.path),
      subject_sha256: entry.campaign_sha256,
      repository_slug: githubRepositorySlug(candidate.repository),
      source_commit: sourceCommit,
      workflow: authority.protocol.workflow,
      workflow_name: authority.protocol.workflow_name,
    },
  };
  if (repeatedVerificationPlan) {
    await verifySigstoreBatchInChild([...repeatedVerificationPlan, campaignVerification]);
  } else {
    await verifySigstoreInChild(bundleFile, entry, campaignVerification.expected);
  }
  return repeated
    ? { capability_id: capabilityId, score: repeatedAttestedCampaignScore, maturity: "representative", reason: "repeated_attested_fixed_observer_campaign" }
    : { capability_id: capabilityId, score: singleAttestedCampaignScore, maturity: "dynamic", reason: "single_attested_campaign" };
}

async function validateScoreCampaignIdentity(payload, candidate, authority) {
  exactKeys(payload.observer, ["commit", "script_blob", "tree"], "EVAL-02 campaign observer");
  exactKeys(payload.subject, ["commit", "repository", "tree", ...Object.keys(authority.protocol.subject_paths)],
    "EVAL-02 campaign subject");
  const sourceCommit = payload.observer.commit;
  if (!/^[a-f0-9]{40}$/.test(sourceCommit) || payload.subject.commit !== sourceCommit ||
      payload.subject.tree !== payload.observer.tree ||
      normalizedRepository(payload.subject.repository) !== normalizedRepository(candidate.repository) ||
      sourceCommit === candidate.commit) {
    fail("EVAL-02 campaign source identity is invalid");
  }
  const sourceTree = await git(root, ["rev-parse", `${sourceCommit}^{tree}`]).catch(() => "");
  const sourceLine = await git(root, ["rev-list", "--parents", "-n", "1", sourceCommit]).catch(() => "");
  const sourceParts = sourceLine.split(" ");
  const sourceParent = sourceParts.length === 2 && sourceParts[0] === sourceCommit ? sourceParts[1] : "";
  const ancestry = await execFileAsync(trustedGitPath,
    [...trustedGitOptions, "-C", root, "merge-base", "--is-ancestor", sourceCommit, candidate.commit], {
      encoding: "utf8", env: gitEnvironment,
    }).then(() => true, () => false);
  const paths = {
    observer_script_blob: authority.protocol.observer,
    adapter_blob: authority.protocol.adapter,
    workflow_blob: authority.protocol.workflow,
    ...authority.protocol.subject_paths,
    ...Object.fromEntries(Object.entries(authority.protocol.runtime_paths)),
    ...Object.fromEntries(Object.entries(authority.protocol.consumer_paths).map(([key, value]) =>
      [`consumer_${key}_blob`, value])),
  };
  const sourceObjects = Object.fromEntries(await Promise.all(Object.entries(paths).map(async ([key, value]) =>
    [key, await gitIdentityAt(sourceCommit, value)])));
  const candidateObjects = Object.fromEntries(await Promise.all(Object.entries(paths).map(async ([key, value]) =>
    [key, await gitIdentityAt(candidate.commit, value)])));
  const preexistingConsumerKeys = Object.keys(paths);
  const parentObjects = Object.fromEntries(await Promise.all(preexistingConsumerKeys.map(async (key) =>
    [key, sourceParent ? await gitIdentityAt(sourceParent, paths[key]) : ""])));
  if (!ancestry || !sourceParent || sourceTree !== payload.observer.tree ||
      sourceObjects.observer_script_blob !== payload.observer.script_blob ||
      Object.entries(authority.protocol.subject_paths).some(([key]) => sourceObjects[key] !== payload.subject[key]) ||
      Object.values(sourceObjects).some((value) => !value) ||
      preexistingConsumerKeys.some((key) => parentObjects[key] !== sourceObjects[key]) ||
      Object.entries(sourceObjects).some(([key, value]) => candidateObjects[key] !== value)) {
    fail("EVAL-02 campaign is stale for the current scoring consumer");
  }
  return { sourceCommit, sourceTree };
}

async function strictGitAncestor(ancestor, descendant) {
  if (!ancestor || !descendant || ancestor === descendant) return false;
  return execFileAsync(trustedGitPath,
    [...trustedGitOptions, "-C", root, "merge-base", "--is-ancestor", ancestor, descendant], {
      encoding: "utf8", env: gitEnvironment,
    }).then(() => true, () => false);
}

function validateObservedScoreReport(report, { candidate, mode, catalog, catalogSha256, sourceCapability }) {
  exactKeys(report, [
    "below_target", "candidate", "capabilities", "catalog_sha256", "critical_breaches", "eligible",
    "evidence_ceiling", "evidence_limit", "minimum_score", "schema_version", "target_score", "weighted_score",
  ], `observed score ${mode} report`);
  const definitions = catalog.capabilities;
  const ids = definitions.map((row) => row.id).sort();
  if (JSON.stringify(canonical(report.candidate)) !== JSON.stringify(canonical(candidate)) ||
      report.schema_version !== 2 || report.catalog_sha256 !== catalogSha256 ||
      report.target_score !== catalog.target_score || report.evidence_ceiling !== 8 ||
      report.minimum_score !== 0 || report.eligible !== false ||
      report.evidence_limit !== "repeated_attested_fixed_observer_campaign; independent_observer_process_isolation_and_provider_attempt_inventory_unavailable" ||
      !Array.isArray(report.capabilities) || report.capabilities.length !== definitions.length ||
      JSON.stringify(report.capabilities.map((row) => row?.id).sort()) !== JSON.stringify(ids) ||
      JSON.stringify([...report.below_target].sort()) !== JSON.stringify(ids) ||
      JSON.stringify([...report.critical_breaches].sort()) !==
        JSON.stringify(definitions.filter((row) => row.critical).map((row) => row.id).sort())) {
    fail(`observed score ${mode} report global gate is invalid`);
  }
  const definitionsById = new Map(definitions.map((row) => [row.id, row]));
  for (const row of report.capabilities) {
    exactKeys(row, [
      "attested_campaign_count", "consumer", "critical", "domain", "gap_count", "id", "maturity", "name",
      "observation_count", "owner", "reason", "score", "unavailable_count", "weight",
    ], `observed score ${mode} capability ${row.id}`);
    const definition = definitionsById.get(row.id);
    const source = row.id === sourceCapability;
    const expected = source && mode === "positive"
      ? { score: 8, maturity: "representative", reason: "repeated_attested_fixed_observer_campaign", gap_count: 0 }
      : source && mode === "negative"
        ? { score: 0, maturity: "contradicted", reason: "critical_gap", gap_count: 1 }
        : { score: 0, maturity: "absent", reason: "no_passing_evidence", gap_count: 0 };
    if (!definition || ["domain", "name", "owner", "consumer", "weight", "critical"]
      .some((key) => row[key] !== definition[key]) || row.score !== expected.score ||
      row.maturity !== expected.maturity || row.reason !== expected.reason || row.observation_count !== 0 ||
      row.attested_campaign_count !== (source ? 1 : 0) || row.unavailable_count !== 0 ||
      row.gap_count !== expected.gap_count) {
      fail(`observed score ${mode} capability ${row.id} is invalid`);
    }
  }
  const totalWeight = definitions.reduce((sum, row) => sum + row.weight, 0);
  const sourceWeight = definitionsById.get(sourceCapability)?.weight;
  if (sourceWeight === undefined) fail("observed score source capability is unavailable");
  const expectedWeightedScore = mode === "positive" ? Number((8 * sourceWeight / totalWeight).toFixed(3)) : 0;
  if (report.weighted_score !== expectedWeightedScore) fail(`observed score ${mode} weighted score is invalid`);
}

function validateConsumedScoreReport(report, { candidate, catalog, catalogSha256, targetCapability }) {
  exactKeys(report, [
    "below_target", "candidate", "capabilities", "catalog_sha256", "critical_breaches", "eligible",
    "evidence_ceiling", "evidence_limit", "minimum_score", "schema_version", "target_score", "weighted_score",
  ], "consumed score report");
  if (report.schema_version !== 2 || report.catalog_sha256 !== catalogSha256 ||
      JSON.stringify(canonical(report.candidate)) !== JSON.stringify(canonical(candidate)) ||
      report.target_score !== catalog.target_score || report.evidence_ceiling !== 6 ||
      report.evidence_limit !== "single_attested_fixed_observer_campaign; varied_repetition_and_provider_attempt_inventory_unavailable" ||
      report.minimum_score !== 0 || report.eligible !== false || !Array.isArray(report.capabilities) ||
      report.capabilities.length !== catalog.capabilities.length ||
      JSON.stringify(report.below_target) !== JSON.stringify(catalog.capabilities.map((row) => row.id)) ||
      JSON.stringify(report.critical_breaches) !==
        JSON.stringify(catalog.capabilities.filter((row) => row.critical).map((row) => row.id))) {
    fail("consumed score report global gate is invalid");
  }
  let weighted = 0;
  let totalWeight = 0;
  for (const [index, definition] of catalog.capabilities.entries()) {
    const row = report.capabilities[index];
    exactKeys(row, [
      "attested_campaign_count", "consumer", "critical", "domain", "gap_count", "id", "maturity", "name",
      "observation_count", "owner", "reason", "score", "unavailable_count", "weight",
    ], `consumed score capability ${definition.id}`);
    const target = definition.id === targetCapability;
    const expected = {
      ...definition,
      score: target ? 6 : 0,
      maturity: target ? "dynamic" : "absent",
      reason: target ? "single_attested_score_observer_campaign" : "no_passing_evidence",
      observation_count: 0,
      attested_campaign_count: target ? 1 : 0,
      unavailable_count: 0,
      gap_count: 0,
    };
    if (JSON.stringify(canonical(row)) !== JSON.stringify(canonical(expected))) {
      fail(`consumed score capability ${definition.id} is invalid`);
    }
    weighted += row.score * row.weight;
    totalWeight += row.weight;
  }
  if (!catalog.capabilities.some((row) => row.id === targetCapability) ||
      report.weighted_score !== Number((weighted / totalWeight).toFixed(3))) {
    fail("consumed score report weighted score is invalid");
  }
}

async function validateScoreConsumption({ entry, evidenceDirectory, campaignFile, bundleFile, payload,
  candidate, authority, catalog, catalogSha256, sourceCommit }) {
  const consumption = entry.consumption;
  exactKeys(consumption, [
    "bundle_path", "bundle_sha256", "receipt_path", "receipt_sha256",
    "source_run_metadata_path", "source_run_metadata_sha256",
  ], "score campaign consumption");
  for (const key of ["bundle_sha256", "receipt_sha256", "source_run_metadata_sha256"]) {
    if (!shaPattern.test(consumption[key])) fail(`score campaign consumption ${key} is invalid`);
  }
  const receiptFile = await boundedEvidenceFile(
    evidenceDirectory, consumption.receipt_path, consumption.receipt_sha256, "score consumption receipt",
  );
  const receiptBundle = await boundedEvidenceFile(
    evidenceDirectory, consumption.bundle_path, consumption.bundle_sha256, "score consumption receipt bundle",
  );
  const sourceMetadataFile = await boundedEvidenceFile(
    evidenceDirectory, consumption.source_run_metadata_path, consumption.source_run_metadata_sha256,
    "score source run metadata",
  );
  const receipt = parseUniqueJson(receiptFile.bytes, "score consumption receipt").value;
  exactKeys(receipt, ["content_sha256", "payload", "schema"], "score consumption receipt envelope");
  const receiptPayload = receipt.payload;
  exactKeys(receiptPayload, ["consumer", "input", "report", "schema", "source_run"], "score consumption receipt");
  exactKeys(receiptPayload.consumer,
    ["catalog_blob", "commit", "repository", "scorer_blob", "script_blob", "tree", "workflow_blob"],
    "score consumption consumer");
  exactKeys(receiptPayload.input,
    ["artifact_name", "bundle_sha256", "campaign_sha256", "observer_commit", "observer_tree"],
    "score consumption input");
  exactKeys(receiptPayload.report, ["sha256", "value"], "score consumption report");
  exactKeys(receiptPayload.source_run,
    ["attempt", "conclusion", "event", "head_branch", "head_sha", "id", "metadata_sha256", "repository", "url", "workflow"],
    "score consumption source run");
  if (receipt.schema !== "pareto-score-capability-consumption-envelope/v1" ||
      receiptPayload.schema !== "pareto-score-capability-consumption/v1" ||
      receipt.content_sha256 !== digest(Buffer.from(JSON.stringify(canonical(receiptPayload)))) ||
      receiptPayload.source_run.metadata_sha256 !== consumption.source_run_metadata_sha256 ||
      receiptPayload.input.campaign_sha256 !== digest(campaignFile.bytes) ||
      receiptPayload.input.bundle_sha256 !== digest(bundleFile.bytes) ||
      receiptPayload.input.observer_commit !== sourceCommit ||
      receiptPayload.input.observer_tree !== payload.observer.tree ||
      receiptPayload.input.artifact_name !== `${authority.capability_id.toLowerCase()}-attested-${receiptPayload.source_run.id}` ||
      !shaPattern.test(receiptPayload.report.sha256)) {
    fail("score consumption receipt identity is invalid");
  }
  const metadata = parseUniqueJson(sourceMetadataFile.bytes, "score source run metadata").value;
  const sourceRun = receiptPayload.source_run;
  if (String(metadata?.id) !== sourceRun.id || metadata?.name !== authority.protocol.workflow_name ||
      metadata?.path !== authority.protocol.workflow || metadata?.event !== sourceRun.event ||
      metadata?.head_branch !== sourceRun.head_branch || metadata?.head_sha !== sourceRun.head_sha ||
      metadata?.status !== "completed" || metadata?.conclusion !== sourceRun.conclusion ||
      metadata?.run_attempt !== sourceRun.attempt || sourceRun.event !== "workflow_dispatch" ||
      sourceRun.head_branch !== "main" || sourceRun.head_sha !== sourceCommit || sourceRun.conclusion !== "success" ||
      metadata?.repository?.full_name?.toLowerCase() !== githubRepositorySlug(candidate.repository).toLowerCase() ||
      sourceRun.repository.toLowerCase() !== metadata.repository.full_name.toLowerCase() ||
      sourceRun.workflow !== authority.protocol.workflow || sourceRun.url !== metadata.html_url) {
    fail("score consumption source run is invalid");
  }
  const consumer = receiptPayload.consumer;
  if (!/^[a-f0-9]{40}$/.test(consumer.commit) || !/^[a-f0-9]{40}$/.test(consumer.tree) ||
      normalizedRepository(consumer.repository) !== normalizedRepository(candidate.repository) ||
      await git(root, ["rev-parse", `${consumer.commit}^{tree}`]).catch(() => "") !== consumer.tree ||
      !await strictGitAncestor(sourceCommit, consumer.commit) ||
      !await strictGitAncestor(consumer.commit, candidate.commit)) {
    fail("score consumption commit is not a strict observer-to-consumer-to-current descendant");
  }
  const consumerBindings = {
    workflow_blob: authority.protocol.consumer_paths.workflow,
    script_blob: authority.protocol.consumer_paths.script,
    scorer_blob: authority.protocol.subject_paths.scorer_blob,
    catalog_blob: authority.protocol.subject_paths.catalog_blob,
  };
  if (Object.values(consumerBindings).some((value) => typeof value !== "string")) {
    fail("score consumption protocol paths are incomplete");
  }
  const stablePaths = new Set([
    authority.protocol.adapter, authority.protocol.observer, authority.protocol.workflow,
    ...Object.values(authority.protocol.consumer_paths), ...Object.values(authority.protocol.runtime_paths),
    ...Object.values(authority.protocol.subject_paths),
  ]);
  for (const [key, objectPath] of Object.entries(consumerBindings)) {
    if (await gitIdentityAt(consumer.commit, objectPath) !== consumer[key]) {
      fail(`score consumption ${key} does not match its consumer commit`);
    }
  }
  for (const objectPath of stablePaths) {
    const sourceObject = await gitIdentityAt(sourceCommit, objectPath);
    if (!sourceObject || await gitIdentityAt(consumer.commit, objectPath) !== sourceObject ||
        await gitIdentityAt(candidate.commit, objectPath) !== sourceObject) {
      fail("score consumption control changed across observer, consumer, and current candidate");
    }
  }
  validateConsumedScoreReport(receiptPayload.report.value, {
    candidate: { repository: consumer.repository, commit: consumer.commit, tree: consumer.tree },
    catalog,
    catalogSha256,
    targetCapability: authority.capability_id,
  });
  return {
    bundle_path: receiptBundle.path,
    bundle_sha256: consumption.bundle_sha256,
    expected: {
      subject_name: path.basename(receiptFile.path),
      subject_sha256: consumption.receipt_sha256,
      repository_slug: githubRepositorySlug(candidate.repository),
      source_commit: consumer.commit,
      workflow: authority.protocol.consumer_paths.workflow,
      workflow_name: authority.protocol.consumer_workflow_name,
    },
  };
}

async function verifyScoreCampaign(entry, evidenceDirectory, candidate, authority, fixedObserverAuthority, loaded,
  allowPendingConsumption = false) {
  const { bundleFile, campaignFile, envelope } = loaded;
  if (!entry.consumption && !allowPendingConsumption) {
    fail("score campaign requires one signed consumption receipt");
  }
  const campaignDirectory = path.dirname(campaignFile.path);
  const payload = envelope.payload;
  const adapter = await loadCampaignAdapter(authority);
  const protocolCoverage = authority.protocol.coverage;
  if (typeof adapter.verifyObservationFacts !== "function") {
    fail("score campaign adapter contract is unavailable");
  }
  exactKeys(payload, ["admission", "authority", "capability_id", "observations", "observer", "result", "schema", "subject"], "EVAL-02 campaign payload");
  if (envelope.content_sha256 !== digest(Buffer.from(JSON.stringify(canonical(payload)))) ||
      payload.schema !== "pareto-score-capability-campaign/v1" ||
      payload.admission !== "strict_descendant_only" || payload.authority !== "github_attestation_subject" ||
      payload.capability_id !== authority.capability_id || payload.result !== "pass" ||
      !Array.isArray(payload.observations) ||
      payload.observations.length !== protocolCoverage.environments.length * protocolCoverage.trials_per_environment) {
    fail("EVAL-02 campaign semantics are invalid");
  }
  const { sourceCommit, sourceTree } = await validateScoreCampaignIdentity(payload, candidate, authority);
  const sourceCandidate = { repository: candidate.repository, commit: sourceCommit, tree: sourceTree };
  const sourceCatalogBytes = await gitBytes(root, ["show", `${sourceCommit}:evals/capabilities.json`]);
  const sourceCatalog = parseUniqueJson(sourceCatalogBytes, "EVAL-02 source catalog").value;
  validateCatalog(sourceCatalog);
  const sourceCatalogSha256 = digest(sourceCatalogBytes);
  const sourceDirectory = await boundedEvidenceDirectory(campaignDirectory, "source-campaign", "EVAL-02 source campaign");
  const sourceCampaign = await boundedEvidenceFile(sourceDirectory, "ins-01-campaign.json", null, "EVAL-02 source campaign");
  const sourceBundle = await boundedEvidenceFile(sourceDirectory, "ins-01-campaign-attestation.json", null, "EVAL-02 source campaign attestation");
  const sourceInput = { campaign_sha256: digest(sourceCampaign.bytes), bundle_sha256: digest(sourceBundle.bytes) };
  const sourceEntry = {
    campaign_path: "ins-01-campaign.json",
    campaign_sha256: sourceInput.campaign_sha256,
    bundle_path: "ins-01-campaign-attestation.json",
    bundle_sha256: sourceInput.bundle_sha256,
  };
  const sourceLoaded = await loadAttestedCampaign(sourceEntry, sourceDirectory);
  const sourceAuthority = fixedObserverAuthority.get(authority.binding.parameters.source_capability);
  await validateInstallCampaignIdentity(sourceLoaded.envelope.payload, candidate, sourceAuthority);

  const expectedSlots = protocolCoverage.environments.flatMap((environment) =>
    Array.from({ length: protocolCoverage.trials_per_environment }, (_, index) => `${environment}:${index + 1}`));
  const actualSlots = [];
  const verificationPlan = [];
  let reportDigests = null;
  for (const [index, row] of payload.observations.entries()) {
    exactKeys(row, ["bundle_path", "bundle_sha256", "content_sha256", "environment", "trial_id"],
      `EVAL-02 campaign observation ${index + 1}`);
    if (!expectedSlots.includes(`${row.environment}:${row.trial_id}`) || !shaPattern.test(row.bundle_sha256) ||
        !shaPattern.test(row.content_sha256)) fail("EVAL-02 campaign observation is invalid");
    actualSlots.push(`${row.environment}:${row.trial_id}`);
    const runner = row.environment === "linux" ? "Linux" : "Windows";
    const slug = authority.capability_id.toLowerCase();
    const directory = `observations/${slug}-${runner}-${row.trial_id}`;
    if (row.bundle_path !== `${directory}/attestation.json`) fail("EVAL-02 campaign observation path is invalid");
    const observationFile = await boundedEvidenceFile(
      campaignDirectory, `${directory}/observation-${runner}-${row.trial_id}.json`, null, "EVAL-02 observation",
    );
    const observationEnvelope = parseUniqueJson(observationFile.bytes, "EVAL-02 observation").value;
    const adapterObservation = adapter.verifyObservationFacts({
      envelope: observationEnvelope,
      campaign: payload,
      environment: row.environment,
      capability_id: authority.capability_id,
      parameters: authority.binding.parameters,
    });
    exactKeys(adapterObservation, ["facts_sha256", "payload", "schema"], "score campaign adapter observation");
    if (adapterObservation.schema !== "pareto-campaign-adapter-result/v1" ||
        !shaPattern.test(adapterObservation.facts_sha256)) fail("score campaign adapter observation is invalid");
    const observation = adapterObservation.payload;
    if (observationEnvelope.content_sha256 !== row.content_sha256 ||
        JSON.stringify(canonical(observation.input)) !== JSON.stringify(canonical(sourceInput))) {
      fail("EVAL-02 observation does not match its campaign or source input");
    }
    const reports = Object.fromEntries(await Promise.all(Object.entries(observation.reports).map(async ([name, report]) => [
      name, await boundedEvidenceFile(campaignDirectory, `${directory}/${report.path}`, report.sha256, `EVAL-02 ${name} report`),
    ])));
    if (!reports.positive.bytes.equals(reports.recovery.bytes) ||
        reports.unknown_score.bytes.toString("utf8") !== "evidence has unknown or missing fields\n") {
      fail("EVAL-02 recovery or unknown-field control is invalid");
    }
    for (const [name, mode] of [["positive", "positive"], ["negative", "negative"], ["recovery", "positive"]]) {
      validateObservedScoreReport(parseUniqueJson(reports[name].bytes, `EVAL-02 ${name} report`).value, {
        candidate: sourceCandidate,
        mode,
        catalog: sourceCatalog,
        catalogSha256: sourceCatalogSha256,
        sourceCapability: authority.binding.parameters.source_capability,
      });
    }
    const currentDigests = Object.fromEntries(Object.entries(reports).map(([name, file]) => [name, digest(file.bytes)]));
    if (reportDigests && JSON.stringify(currentDigests) !== JSON.stringify(reportDigests)) {
      fail("EVAL-02 environments did not reproduce identical reports");
    }
    reportDigests = currentDigests;
    const observationBundle = await boundedEvidenceFile(
      campaignDirectory, row.bundle_path, row.bundle_sha256, "EVAL-02 observation attestation",
    );
    verificationPlan.push({
      bundle_path: observationBundle.path,
      bundle_sha256: row.bundle_sha256,
      expected: {
        subject_name: path.basename(observationFile.path),
        subject_sha256: digest(observationFile.bytes),
        repository_slug: githubRepositorySlug(candidate.repository),
        source_commit: sourceCommit,
        workflow: authority.protocol.workflow,
        workflow_name: authority.protocol.workflow_name,
      },
    });
  }
  if (JSON.stringify(actualSlots) !== JSON.stringify(expectedSlots)) fail("EVAL-02 campaign coverage is invalid");
  verificationPlan.push({
    bundle_path: bundleFile.path,
    bundle_sha256: entry.bundle_sha256,
    expected: {
      subject_name: path.basename(campaignFile.path),
      subject_sha256: entry.campaign_sha256,
      repository_slug: githubRepositorySlug(candidate.repository),
      source_commit: sourceCommit,
      workflow: authority.protocol.workflow,
      workflow_name: authority.protocol.workflow_name,
    },
  });
  if (entry.consumption) {
    verificationPlan.push(await validateScoreConsumption({
      entry,
      evidenceDirectory,
      campaignFile,
      bundleFile,
      payload,
      candidate,
      authority,
      catalog: sourceCatalog,
      catalogSha256: sourceCatalogSha256,
      sourceCommit,
    }));
  }
  try {
    await verifySigstoreBatchInChild(verificationPlan);
  } catch (error) {
    fail(`EVAL-02 campaign attestation verification failed: ${error instanceof Error ? error.message : String(error)}`);
  }
  let sourceResult;
  try {
    sourceResult = await verifyInstallCampaign(
      sourceEntry, sourceDirectory, candidate,
      sourceAuthority, sourceLoaded,
    );
  } catch (error) {
    fail(`EVAL-02 source INS campaign verification failed: ${error instanceof Error ? error.message : String(error)}`);
  }
  if (sourceResult.score !== repeatedAttestedCampaignScore) fail("EVAL-02 source campaign is not the canonical repeated control");
  return {
    capability_id: authority.capability_id,
    score: singleAttestedCampaignScore,
    maturity: "dynamic",
    reason: "single_attested_score_observer_campaign",
  };
}

async function verifyAttestedCampaign(entry, evidenceDirectory, candidate, fixedObserverAuthority,
  allowPendingConsumption = false) {
  const loaded = await loadAttestedCampaign(entry, evidenceDirectory);
  const capabilityId = loaded.envelope.payload?.capability_id;
  const authority = fixedObserverAuthority.get(capabilityId);
  if (!authority?.implemented ||
      (authority.binding.protocol === "score-v1" &&
        !fixedObserverAuthority.get(authority.binding.parameters.source_capability)?.implemented)) {
    fail(`${capabilityId ?? "unknown"} attested campaign lacks implemented scenario authority`);
  }
  if (authority.binding.protocol === "install-v1") {
    return verifyInstallCampaign(entry, evidenceDirectory, candidate, authority, loaded);
  }
  if (authority.binding.protocol === "score-v1") {
    return verifyScoreCampaign(
      entry, evidenceDirectory, candidate, authority, fixedObserverAuthority, loaded, allowPendingConsumption,
    );
  }
  fail("attested campaign protocol is unsupported");
}

function validateObservation(observation, capabilities, requirements) {
  exactKeys(observation, ["capability_id", "scenario", "case_id", "trial_id", "environment_id", "subject_id", "producer_id", "observer_id", "source_kind", "result", "artifact_path", "content_sha256"], "observation");
  if (!capabilities.has(observation.capability_id)) fail(`observation capability is unknown: ${observation.capability_id}`);
  if (!requirements.scenarios.includes(observation.scenario)) fail(`observation scenario is unknown: ${observation.scenario}`);
  for (const key of ["case_id", "trial_id", "environment_id", "subject_id", "producer_id", "observer_id", "artifact_path"]) atom(observation[key], `observation ${key}`);
  if (!sourceKinds.has(observation.source_kind) || !results.has(observation.result)) fail("observation source or result is invalid");
  if (!shaPattern.test(observation.content_sha256)) fail("observation digest is invalid");
  if (observation.source_kind === "independent_review" && (observation.observer_id === observation.subject_id || observation.observer_id === observation.producer_id)) {
    fail("independent review observer must differ from subject and producer");
  }
}

function scoreCapability(observations, gaps, localTraceCeiling, attestedCampaigns) {
  const passed = observations.filter((entry) => entry.result === "pass" && entry.source_verified === true);
  const unverifiedPass = observations.filter((entry) => entry.result === "pass" && entry.source_verified !== true);
  const failed = observations.filter((entry) => entry.result === "fail");
  const unavailable = observations.filter((entry) => entry.result === "unavailable");
  const criticalGap = gaps.some((gap) => gap.severity === "critical");
  const materialGap = gaps.length > 0;
  if (materialGap || failed.length > 0 || unverifiedPass.length > 0) {
    const reason = criticalGap ? "critical_gap" : materialGap ? "material_gap" : failed.length > 0 ? "failed_observation" : "unverified_pass";
    return { score: 0, maturity: "contradicted", reason };
  }
  if (unavailable.length > 0) return { score: 0, maturity: "unavailable", reason: "unavailable_observation" };
  if (attestedCampaigns.length > 0) {
    const [campaign] = attestedCampaigns;
    return { score: campaign.score, maturity: campaign.maturity, reason: campaign.reason };
  }
  if (passed.length === 0) return { score: 0, maturity: "absent", reason: "no_passing_evidence" };
  return { score: localTraceCeiling, maturity: "declared", reason: "local_writable_trace_has_no_provider_attestation" };
}

async function scoreEvidenceInternal({ evidencePath }, allowAttested, allowPendingConsumption = false) {
  if (!evidencePath) fail("evidence path is required");
  const { value: evidence } = await readUniqueJson(evidencePath, "capability evidence");
  if (evidence.schema_version === 1) {
    exactKeys(evidence, ["schema_version", "catalog_sha256", "candidate", "attempt_inventory", "observations", "open_gaps"], "evidence");
  } else if (evidence.schema_version === 2) {
    exactKeys(evidence, ["schema_version", "catalog_sha256", "candidate", "attempt_inventory", "observations", "attested_campaigns", "open_gaps"], "evidence");
  } else {
    fail("evidence schema version is unsupported");
  }
  exactKeys(evidence.candidate, ["repository", "commit", "tree"], "candidate");
  atom(evidence.candidate.repository, "candidate repository");
  if (!/^[a-f0-9]{40}$/.test(evidence.candidate.commit) || !/^[a-f0-9]{40}$/.test(evidence.candidate.tree)) fail("candidate Git identity is invalid");
  const catalogBytes = await verifyCandidate(root, evidence.candidate);
  const { value: catalog } = parseUniqueJson(catalogBytes, "capability catalog");
  const catalogContract = validateCatalog(catalog);
  const capabilities = catalogContract.capabilities;
  const fixedObserverAuthority = await verifyCommittedFixedObserverBindings(root, evidence.candidate, capabilities);
  if (evidence.catalog_sha256 !== digest(catalogBytes)) fail("evidence catalog binding is stale or invalid");
  exactKeys(evidence.attempt_inventory, ["status", "locator"], "attempt inventory");
  if (evidence.attempt_inventory.status !== "unavailable") fail("provider-attested attempt inventory is not supported by this scorer");
  atom(evidence.attempt_inventory.locator, "attempt inventory locator");
  if (!Array.isArray(evidence.observations) || !Array.isArray(evidence.open_gaps)) fail("evidence observations and gaps must be arrays");
  const attestedCampaignEntries = evidence.schema_version === 2 ? evidence.attested_campaigns : [];
  if (!Array.isArray(attestedCampaignEntries)) fail("attested campaigns must be an array");
  if (attestedCampaignEntries.length > 0 && evidence.observations.length > 0) {
    fail("attested campaigns cannot share a process with locally loaded observation runtimes");
  }
  enterEvidenceRuntimeMode(attestedCampaignEntries.length > 0
    ? "attested"
    : evidence.observations.length > 0 ? "local" : null);
  if (attestedCampaignEntries.length > 0 && !allowAttested) {
    fail("attested scoring requires a one-time CLI scorer process");
  }
  const committedCases = evidence.observations.length > 0
    ? await committedCapabilityCases(root, evidence.candidate, capabilities)
    : new Map();

  const keys = new Set();
  const trialArtifacts = new Set();
  const evidenceDirectory = path.dirname(path.resolve(evidencePath));
  for (const observation of evidence.observations) {
    validateObservation(observation, capabilities, catalog.default_requirements);
    const committedCase = committedCases.get(observation.case_id);
    if (!committedCase || committedCase.binding.id !== observation.capability_id || committedCase.binding.scenario !== observation.scenario) {
      fail("observation does not match one committed capability case");
    }
    const key = [observation.capability_id, observation.scenario, observation.case_id, observation.trial_id, observation.environment_id, observation.source_kind, observation.observer_id].join("\u0000");
    if (keys.has(key)) fail("evidence repeats one observation identity");
    keys.add(key);
    const trialArtifact = [observation.capability_id, observation.scenario, observation.case_id,
      observation.source_kind, observation.source_kind === "deterministic_replay"
        ? observation.trial_id : observation.content_sha256].join("\u0000");
    if (trialArtifacts.has(trialArtifact)) fail("evidence reuses one artifact as multiple trials");
    trialArtifacts.add(trialArtifact);
    observation.source_verified = await validateArtifact(observation, evidenceDirectory, evidence.candidate, committedCase);
  }

  const attestedCampaigns = [];
  const attestedCapabilities = new Set();
  for (const entry of attestedCampaignEntries) {
    const campaign = await verifyAttestedCampaign(
      entry, evidenceDirectory, evidence.candidate, fixedObserverAuthority, allowPendingConsumption,
    );
    if (attestedCapabilities.has(campaign.capability_id)) fail("evidence repeats one attested capability campaign");
    attestedCapabilities.add(campaign.capability_id);
    attestedCampaigns.push(campaign);
  }

  const gapsByCapability = new Map();
  for (const gap of evidence.open_gaps) {
    exactKeys(gap, ["capability_id", "severity", "description", "locator"], "gap");
    if (!capabilities.has(gap.capability_id) || !["material", "critical"].includes(gap.severity)) fail("gap capability or severity is invalid");
    atom(gap.description, "gap description");
    atom(gap.locator, "gap locator");
    gapsByCapability.set(gap.capability_id, [...(gapsByCapability.get(gap.capability_id) ?? []), gap]);
  }

  const rows = [...capabilities.values()].map((capability) => {
    const observations = evidence.observations.filter((entry) => entry.capability_id === capability.id);
    const capabilityCampaigns = attestedCampaigns.filter((entry) => entry.capability_id === capability.id);
    const gaps = gapsByCapability.get(capability.id) ?? [];
    const score = catalogContract.unreviewedTerminalIds.has(capability.id)
      ? { score: 0, maturity: "unavailable", reason: "atomicity_unresolved" }
      : scoreCapability(observations, gaps, catalog.local_trace_ceiling, capabilityCampaigns);
    return {
      ...capability,
      ...score,
      observation_count: observations.length,
      attested_campaign_count: capabilityCampaigns.length,
      unavailable_count: observations.filter((entry) => entry.result === "unavailable").length,
      gap_count: gaps.length,
    };
  });
  const weightedScore = rows.reduce((sum, row) => sum + row.score * row.weight, 0) / rows.reduce((sum, row) => sum + row.weight, 0);
  const minimumScore = Math.min(...rows.map((row) => row.score));
  const criticalBreaches = rows.filter((row) => row.critical && row.score < catalog.target_score).map((row) => row.id);
  const belowTarget = rows.filter((row) => row.score < catalog.target_score).map((row) => row.id);
  const evidenceCeiling = attestedCampaigns.length > 0
    ? Math.max(...attestedCampaigns.map((campaign) => campaign.score))
    : catalog.local_trace_ceiling;
  return {
    schema_version: evidence.schema_version,
    catalog_sha256: digest(catalogBytes),
    candidate: evidence.candidate,
    target_score: catalog.target_score,
    evidence_ceiling: evidenceCeiling,
    evidence_limit: attestedCampaigns.length > 0
      ? evidenceCeiling === repeatedAttestedCampaignScore
        ? "repeated_attested_fixed_observer_campaign; independent_observer_process_isolation_and_provider_attempt_inventory_unavailable"
        : "single_attested_fixed_observer_campaign; varied_repetition_and_provider_attempt_inventory_unavailable"
      : "provider_attested_attempt_inventory_unavailable",
    weighted_score: Number(weightedScore.toFixed(3)),
    minimum_score: minimumScore,
    eligible: weightedScore >= catalog.target_score && minimumScore >= catalog.target_score && criticalBreaches.length === 0,
    below_target: belowTarget,
    critical_breaches: criticalBreaches,
    capabilities: rows,
  };
}

export async function scoreEvidence(options) {
  return scoreEvidenceInternal(options, false);
}

export async function validateCatalogFile(catalogPath = defaultCatalogPath) {
  const { bytes, value } = await readUniqueJson(catalogPath, "capability catalog");
  validateCatalog(value);
  return digest(bytes);
}

const invokedAsMain = import.meta.main === true;
if (invokedAsMain) {
  try {
    if (nodeProcess.argv[2] === "--verify-sigstore-batch") {
      if (nodeProcess.argv.length !== 5) fail("isolated Sigstore batch verifier arguments are invalid");
      const planBytes = Buffer.from(nodeProcess.argv[3], "base64");
      if (planBytes.toString("base64") !== nodeProcess.argv[3]) fail("isolated Sigstore batch plan encoding is invalid");
      const { value: plan } = parseUniqueJson(planBytes, "isolated Sigstore batch plan");
      const receipt = await verifySigstoreBundleBatch(plan, nodeProcess.argv[4]);
      console.log(JSON.stringify(receipt));
    } else if (nodeProcess.argv[2] === "--verify-sigstore") {
      if (nodeProcess.argv.length !== 7) fail("isolated Sigstore verifier arguments are invalid");
      const expectationBytes = Buffer.from(nodeProcess.argv[5], "base64");
      if (expectationBytes.toString("base64") !== nodeProcess.argv[5]) fail("isolated Sigstore expectation encoding is invalid");
      const { value: expected } = parseUniqueJson(expectationBytes, "isolated Sigstore expectation");
      const receipt = await verifySigstoreBundleFile(nodeProcess.argv[3], nodeProcess.argv[4], expected, nodeProcess.argv[6]);
      console.log(JSON.stringify(receipt));
    } else {
      const consumePending = nodeProcess.argv[2] === "--consume-attested-campaign";
      const evidencePath = consumePending ? nodeProcess.argv[3] : nodeProcess.argv[2];
      if (nodeProcess.argv.length !== (consumePending ? 4 : 3)) {
        fail("capability scorer accepts one evidence path and an optional consumption mode");
      }
      const report = await scoreEvidenceInternal({ evidencePath }, true, consumePending);
      console.log(JSON.stringify(report, null, 2));
      if (!report.eligible) nodeProcess.exitCode = 1;
    }
  } catch (error) {
    console.error(error.message);
    nodeProcess.exitCode = 1;
  }
}
