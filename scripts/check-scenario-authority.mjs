import { execFileSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { parse as parseYaml } from "yaml";
import {
  atomicityRequiredStaticPaths,
  capabilityScenarios,
  compareCapabilityCatalogs,
} from "./capability-catalog.mjs";
import { rejectDuplicateJsonObjectMembers } from "./json.mjs";

const defaultRepo = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const gitExecutable = process.platform === "win32" ? "git.exe" : "/usr/bin/git";
const gitEnvironment = {
  ...Object.fromEntries(Object.entries(process.env).filter(([name]) => !/^GIT_/i.test(name))),
  GIT_CONFIG_NOSYSTEM: "1",
  GIT_CONFIG_GLOBAL: process.platform === "win32" ? "NUL" : "/dev/null",
  GIT_NO_REPLACE_OBJECTS: "1",
  GIT_OPTIONAL_LOCKS: "0",
  LC_ALL: "C",
};
const rawItemTypes = new Set([
  "command_execution", "file_change", "mcp_tool_call", "agent_message", "reasoning", "web_search",
  "todo_list", "error",
]);
const unavailableAxes = new Set([
  "conversation_compaction_state", "external_evaluator_state", "external_provider_state", "github_state",
  "host_native_skill_route", "native_goal_state", "native_task_state",
]);
const forbiddenPublicEvidence = [
  /qOeOp\/trade/i,
  /github\.com\/qOeOp\/trade/i,
  /\/Users\/[A-Za-z0-9._-]+\//,
  /\bitem-\d+\b/,
  /\bPR\s*#\d+\b/i,
  /\b019f[a-f0-9-]{20,}\b/i,
  /BINANCE_API_(?:KEY|SECRET)/,
];

function fail(message) {
  throw new Error(message);
}

function git(repo, args, encoding = "utf8") {
  try {
    return execFileSync(gitExecutable, [
      "--no-replace-objects",
      "-c", "core.fsmonitor=false",
      "-c", "core.untrackedCache=false",
      "-c", "core.hooksPath=/dev/null",
      "-C", repo,
      ...args,
    ], { env: gitEnvironment, encoding, maxBuffer: 8 * 1024 * 1024 });
  } catch {
    fail("canonical scenario authority Git read failed");
  }
}

function assertCommit(repo, oid, label) {
  if (!/^[0-9a-f]{40,64}$/.test(oid)) fail(`${label} must be a full Git object ID`);
  if (git(repo, ["cat-file", "-t", oid]).trim() !== "commit") fail(`${label} must identify a commit`);
}

function verifyDirectTransition(repo, base, candidate) {
  const ancestry = git(repo, ["rev-list", "--parents", "-n", "1", candidate]).trim().split(/\s+/);
  if (ancestry.length !== 2 || ancestry[0] !== candidate || ancestry[1] !== base) {
    fail("atomicity transition candidate must have the supplied base as its sole parent");
  }
  const candidateTree = git(repo, ["rev-parse", `${candidate}^{tree}`]).trim();
  const mergeTree = git(repo, ["merge-tree", "--write-tree", base, candidate]).trim().split(/\r?\n/)[0];
  if (mergeTree !== candidateTree) {
    fail("atomicity transition merge tree differs from the checked candidate tree");
  }
}

function committedText(repo, oid, file) {
  return git(repo, ["show", `${oid}:${file}`]);
}

function committedTextOptional(repo, oid, file) {
  const match = git(repo, ["ls-tree", "--name-only", oid, "--", file]).trim();
  return match === file ? committedText(repo, oid, file) : null;
}

function canonical(value) {
  if (Array.isArray(value)) return value.map(canonical);
  if (value && typeof value === "object") {
    return Object.fromEntries(Object.keys(value).sort().map((key) => [key, canonical(value[key])]));
  }
  return value;
}

function exactKeys(value, expected, label) {
  if (!value || typeof value !== "object" || Array.isArray(value)) fail(`${label} must be an object`);
  const actual = Object.keys(value).sort();
  const wanted = [...expected].sort();
  if (actual.length !== wanted.length || actual.some((key, index) => key !== wanted[index])) {
    fail(`${label} has invalid fields`);
  }
}

function validateCase(row, suite, label) {
  if (forbiddenPublicEvidence.some((pattern) => pattern.test(JSON.stringify(row)))) {
    fail(`${label} contains forbidden public evidence`);
  }
  if (typeof row?.vars?.prompt !== "string" || !Array.isArray(row.assert) || row.assert.length === 0) {
    fail(`${label} requires prompt and assertions`);
  }
  const activation = row.assert.filter((entry) =>
    entry?.type === "skill-used" || entry?.type === "not-skill-used");
  if (activation.length !== 1 || activation[0].value !== "run-bounded-mission") {
    fail(`${label} requires one exact Skill activation oracle`);
  }
  const deterministic = row.assert.filter((entry) => !activation.includes(entry));
  if (deterministic.length === 0 || deterministic.some((entry) =>
    !["contains", "contains-all", "not-contains", "equals"].includes(entry?.type))) {
    fail(`${label} requires deterministic assertions`);
  }
  exactKeys(row.metadata, new Set(["observations"]), `${label} metadata`);
  const observations = row.metadata.observations;
  exactKeys(observations,
    new Set(["capability", "behavioral_oracle", "skill_activation", "required_raw_item_types", "unavailable"]),
    `${label} observations`);
  exactKeys(observations.capability, new Set(["id", "scenario", "case_id"]), `${label} capability`);
  exactKeys(observations.skill_activation, new Set(["status", "expected"]), `${label} activation`);
  const expected = activation[0].type === "skill-used" ? "used" : "not_used";
  if (observations.behavioral_oracle !== "deterministic_text" ||
      observations.skill_activation.status !== "dynamic_heuristic" ||
      observations.skill_activation.expected !== expected) {
    fail(`${label} observation contract is invalid`);
  }
  if (!Array.isArray(observations.required_raw_item_types) ||
      observations.required_raw_item_types.some((type) => !rawItemTypes.has(type)) ||
      new Set(observations.required_raw_item_types).size !== observations.required_raw_item_types.length ||
      (expected === "used" && !observations.required_raw_item_types.includes("command_execution"))) {
    fail(`${label} raw observation contract is invalid`);
  }
  if (!Array.isArray(observations.unavailable) ||
      !observations.unavailable.includes("host_native_skill_route") ||
      observations.unavailable.some((axis) => !unavailableAxes.has(axis)) ||
      new Set(observations.unavailable).size !== observations.unavailable.length) {
    fail(`${label} unavailable observation contract is invalid`);
  }
  return { binding: observations.capability, suite };
}

function parseJsonBlob(repo, oid, file, label) {
  const source = committedText(repo, oid, file);
  rejectDuplicateJsonObjectMembers(source, label);
  try {
    return JSON.parse(source);
  } catch {
    fail(`${label} must be valid JSON`);
  }
}

function parseAtomicityAdmission(repo, oid, label, allowMissing = false) {
  const source = committedTextOptional(repo, oid, "evals/atomicity-admission.json");
  if (source === null) {
    if (allowMissing) return { schema_version: 1, decision: null };
    fail(`${label} atomicity admission is missing`);
  }
  rejectDuplicateJsonObjectMembers(source, `${label} atomicity admission`);
  try {
    return JSON.parse(source);
  } catch {
    fail(`${label} atomicity admission must be valid JSON`);
  }
}

function atomicityOwnerPath(repo, commit, owner, label) {
  const matches = git(repo, ["ls-tree", "-r", "--name-only", commit])
    .trim().split(/\r?\n/).filter((file) => file === owner || file.endsWith(`/${owner}`));
  if (matches.length !== 1) fail(`atomicity ${label} owner path is unavailable or ambiguous`);
  return matches[0];
}

function expectedAtomicitySurfaces(repo, commit, catalog, decision) {
  const source = catalog.capabilities.find((row) => row.id === decision.capability_id);
  const owners = [source?.owner, ...decision.atoms.map((entry) => entry.owner)];
  const paths = [...new Set([
    ...atomicityRequiredStaticPaths,
    ...owners.map((owner) => atomicityOwnerPath(repo, commit, owner, owner)),
  ])].sort();
  return paths.map((surfacePath) => ({
    path: surfacePath,
    blob: git(repo, ["rev-parse", `${commit}:${surfacePath}`]).trim(),
  }));
}

function verifyAtomicityReviewBinding(repo, decision, {
  reviewedBase, currentCommit, catalog, label, allowChangedPaths = new Set(),
}) {
  if (decision.reviewed_base.commit !== reviewedBase ||
      decision.reviewed_base.tree !== git(repo, ["rev-parse", `${reviewedBase}^{tree}`]).trim()) {
    fail(`${label} atomicity decision does not bind the exact reviewed base`);
  }
  const expected = expectedAtomicitySurfaces(repo, reviewedBase, catalog, decision);
  const source = catalog.capabilities.find((row) => row.id === decision.capability_id);
  const owners = [source?.owner, ...decision.atoms.map((entry) => entry.owner)];
  const reviewedOwnerPaths = owners.map((owner) => atomicityOwnerPath(repo, reviewedBase, owner, owner));
  const currentOwnerPaths = owners.map((owner) => atomicityOwnerPath(repo, currentCommit, owner, owner));
  if (JSON.stringify(currentOwnerPaths) !== JSON.stringify(reviewedOwnerPaths)) {
    fail(`${label} atomicity owner resolution drifted after review`);
  }
  const actual = [...decision.reviewed_surfaces].sort((left, right) =>
    left.path < right.path ? -1 : left.path > right.path ? 1 : 0);
  if (JSON.stringify(actual) !== JSON.stringify(expected)) {
    fail(`${label} atomicity decision does not bind the exhaustive owner, consumer, case, and control surface`);
  }
  for (const surface of expected) {
    if (allowChangedPaths.has(surface.path)) continue;
    const currentBlob = git(repo, ["rev-parse", `${currentCommit}:${surface.path}`]).trim();
    if (currentBlob !== surface.blob) {
      fail(`${label} atomicity decision is stale for a reviewed owner or consumer surface`);
    }
  }
}

function verifySplitScenarioDelta(repo, reviewedBase, candidate, decision) {
  const { design: reviewedDesign, slots: reviewedSlots } = parseDesign(repo, reviewedBase, "reviewed base");
  const { design: candidateDesign, slots: candidateSlots } = parseDesign(repo, candidate, "split candidate");
  const addedRows = decision.atoms.flatMap((entry) => [...capabilityScenarios].map((scenario) => ({
    capability_id: entry.id,
    scenario,
    case_id: `${entry.id.toLowerCase()}-${scenario}`,
    observer_kind: "fixed_real_consumer",
    authority_status: "authority_unavailable",
    missing_authority: "scenario_consumer_binding",
  })));
  const reviewedSource = committedText(repo, reviewedBase, "evals/scenarios.json");
  const suffix = "\n  ]\n}\n";
  if (!reviewedSource.endsWith(suffix)) fail("reviewed scenario design lacks the canonical append boundary");
  const expectedSource = `${reviewedSource.slice(0, -suffix.length)},\n${
    addedRows.map((row) => `    ${JSON.stringify(row)}`).join(",\n")
  }${suffix}`;
  if (committedText(repo, candidate, "evals/scenarios.json") !== expectedSource) {
    fail("split consumption did not preserve the reviewed scenario bytes plus its exact new slots");
  }
  if (JSON.stringify(canonical(candidateDesign.attested_protocols)) !==
        JSON.stringify(canonical(reviewedDesign.attested_protocols)) ||
      JSON.stringify(canonical(candidateDesign.fixed_observers)) !==
        JSON.stringify(canonical(reviewedDesign.fixed_observers))) {
    fail("split consumption changed reviewed scenario authority bindings");
  }
  for (const [slot, reviewedRow] of reviewedSlots) {
    const candidateRow = candidateSlots.get(slot);
    if (!candidateRow || JSON.stringify(canonical(candidateRow)) !== JSON.stringify(canonical(reviewedRow))) {
      fail(`split consumption is stale for reviewed scenario slot ${slot}`);
    }
  }
  const atomIds = new Set(decision.atoms.map((entry) => entry.id));
  if (candidateSlots.size !== reviewedSlots.size + atomIds.size * capabilityScenarios.size) {
    fail("split consumption changed more than its reviewed scenario slots");
  }
  for (const capabilityId of atomIds) {
    for (const scenario of capabilityScenarios) {
      const slot = `${capabilityId}/${scenario}`;
      const row = candidateSlots.get(slot);
      if (!row || reviewedSlots.has(slot) || row.case_id !== `${capabilityId.toLowerCase()}-${scenario}` ||
          row.observer_kind !== "fixed_real_consumer" || row.authority_status !== "authority_unavailable" ||
          row.missing_authority !== "scenario_consumer_binding" || row.executable_suite !== undefined) {
        fail(`split consumption has invalid reviewed scenario slot ${slot}`);
      }
    }
  }
}

function parseDesign(repo, oid, label) {
  const design = parseJsonBlob(repo, oid, "evals/scenarios.json", `${label} scenario design`);
  if (design?.schema_version !== 3 || !Array.isArray(design.scenarios) ||
      !design.attested_protocols || Array.isArray(design.attested_protocols) ||
      !design.fixed_observers || Array.isArray(design.fixed_observers) ||
      Object.keys(design).sort().join(",") !== "attested_protocols,fixed_observers,scenarios,schema_version") {
    fail(`${label} scenario design identity is invalid`);
  }
  const slots = new Map();
  const caseIds = new Set();
  const required = new Set([
    "capability_id", "scenario", "case_id", "observer_kind", "authority_status", "missing_authority",
  ]);
  for (const row of design.scenarios) {
    const keys = new Set(Object.keys(row ?? {}));
    if ([...required].some((key) => !keys.has(key)) ||
        [...keys].some((key) => !required.has(key) && key !== "executable_suite")) {
      fail(`${label} scenario design row has invalid fields`);
    }
    const slot = `${row?.capability_id}/${row?.scenario}`;
    if (slots.has(slot) || caseIds.has(row?.case_id)) fail(`${label} scenario design has duplicate identity`);
    slots.set(slot, row);
    caseIds.add(row?.case_id);
  }
  return { design, slots };
}

const protocolFields = [
  "adapter", "consumer_paths", "consumer_workflow_name", "coverage", "observer", "protocol",
  "runtime_paths", "subject_paths", "workflow", "workflow_name",
];

function safeRepositoryPath(value) {
  return typeof value === "string" && value.length > 0 && value.length <= 256 &&
    !value.startsWith("/") && !value.includes("\\") &&
    !value.split("/").some((part) => !part || part === "." || part === "..");
}

function committedPathExists(repo, oid, file) {
  return git(repo, ["ls-tree", "--name-only", oid, "--", file]).trim() === file;
}

function protocolVersion(value, label) {
  const match = /^pareto-fixed-observer-protocol\/v([1-9][0-9]*)$/.exec(value ?? "");
  if (!match) fail(`${label} protocol version is invalid`);
  return Number(match[1]);
}

function protocolControlFiles(design, protocolIds = new Set(Object.keys(design.attested_protocols))) {
  return Object.entries(design.attested_protocols)
    .filter(([protocolId]) => protocolIds.has(protocolId))
    .flatMap(([, protocol]) => [
    protocol.adapter,
    protocol.observer,
    protocol.workflow,
    ...Object.values(protocol.consumer_paths ?? {}),
    ...Object.values(protocol.runtime_paths ?? {}),
    ]).filter((file) => file !== "evals/scenarios.json");
}

function validateProtocolDesign(repo, candidate, design, label) {
  for (const [protocolId, protocol] of Object.entries(design.attested_protocols)) {
    exactKeys(protocol, new Set(protocolFields), `${label} protocol ${protocolId}`);
    protocolVersion(protocol.protocol, `${label} protocol ${protocolId}`);
    exactKeys(protocol.coverage, new Set(["environments", "trials_per_environment"]),
      `${label} protocol ${protocolId} coverage`);
    if (!Array.isArray(protocol.coverage.environments) || protocol.coverage.environments.length === 0 ||
        new Set(protocol.coverage.environments).size !== protocol.coverage.environments.length ||
        protocol.coverage.environments.some((environment) => typeof environment !== "string" || !environment) ||
        !Number.isInteger(protocol.coverage.trials_per_environment) ||
        protocol.coverage.trials_per_environment < 1 ||
        !safeRepositoryPath(protocol.adapter) || !safeRepositoryPath(protocol.observer) ||
        !safeRepositoryPath(protocol.workflow) ||
        !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(protocol.workflow_name) ||
        (protocol.consumer_workflow_name !== null &&
          !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(protocol.consumer_workflow_name))) {
      fail(`${label} protocol ${protocolId} binding is invalid`);
    }
    for (const [group, paths] of [
      ["consumer", protocol.consumer_paths], ["runtime", protocol.runtime_paths],
      ["subject", protocol.subject_paths],
    ]) {
      if (!paths || typeof paths !== "object" || Array.isArray(paths) ||
          Object.values(paths).some((file) => !safeRepositoryPath(file))) {
        fail(`${label} protocol ${protocolId} ${group} paths are invalid`);
      }
    }
    const hasConsumer = Object.keys(protocol.consumer_paths).length > 0;
    if (hasConsumer !== (protocol.consumer_workflow_name !== null)) {
      fail(`${label} protocol ${protocolId} consumer identity is invalid`);
    }
    for (const file of [protocol.adapter, protocol.observer, protocol.workflow,
      ...Object.values(protocol.consumer_paths), ...Object.values(protocol.runtime_paths),
      ...Object.values(protocol.subject_paths)]) {
      if (!committedPathExists(repo, candidate, file)) {
        fail(`${label} protocol ${protocolId} path is unavailable: ${file}`);
      }
    }
  }
  for (const [capabilityId, binding] of Object.entries(design.fixed_observers)) {
    exactKeys(binding, new Set(["parameters", "protocol"]), `${label} fixed observer ${capabilityId}`);
    if (!design.attested_protocols[binding.protocol] || !binding.parameters ||
        typeof binding.parameters !== "object" || Array.isArray(binding.parameters)) {
      fail(`${label} fixed observer ${capabilityId} binding is invalid`);
    }
    const keys = Object.keys(binding.parameters).sort();
    const validInstallV1 = binding.protocol === "install-v1" &&
      ((JSON.stringify(keys) === JSON.stringify(["kind"]) && binding.parameters.kind === "skill") ||
        (JSON.stringify(keys) === JSON.stringify(["kind", "profile"]) &&
          binding.parameters.kind === "profile" &&
          /^[a-z0-9-]+\.toml$/.test(binding.parameters.profile)));
    const validInstallV2 = binding.protocol === "install-skill-v2" &&
      (JSON.stringify(keys) === JSON.stringify(["kind"]) ||
        JSON.stringify(keys) === JSON.stringify(["kind", "workflow_id"])) &&
      binding.parameters.kind === "skill" &&
      (binding.parameters.workflow_id === undefined ||
        /^[1-9][0-9]{0,19}$/.test(binding.parameters.workflow_id));
    const validScoreV1 = binding.protocol === "score-v1" &&
      JSON.stringify(keys) === JSON.stringify(["source_capability"]) &&
      typeof binding.parameters.source_capability === "string";
    if ((!validInstallV1 && !validInstallV2 && !validScoreV1) ||
        !design.scenarios.some((row) => row.capability_id === capabilityId) ||
        (validScoreV1 && !design.scenarios.some((row) =>
          row.capability_id === binding.parameters.source_capability))) {
      fail(`${label} fixed observer ${capabilityId} parameters are invalid`);
    }
  }
}

function validateProtocolEvolution(baseDesign, candidateDesign) {
  for (const [protocolId, baseProtocol] of Object.entries(baseDesign.attested_protocols)) {
    const candidateProtocol = candidateDesign.attested_protocols[protocolId];
    if (!candidateProtocol) fail(`candidate deleted canonical protocol ${protocolId}`);
    const baseVersion = protocolVersion(baseProtocol.protocol, `base protocol ${protocolId}`);
    const candidateVersion = protocolVersion(candidateProtocol.protocol, `candidate protocol ${protocolId}`);
    const identityFields = protocolFields.filter((field) => field !== "coverage");
    const baseIdentity = Object.fromEntries(identityFields.map((field) => [field, baseProtocol[field]]));
    const candidateIdentity = Object.fromEntries(identityFields.map((field) => [field, candidateProtocol[field]]));
    if (candidateVersion < baseVersion ||
        (candidateVersion === baseVersion &&
          JSON.stringify(canonical(candidateIdentity)) !== JSON.stringify(canonical(baseIdentity))) ||
        baseProtocol.coverage.environments.some((environment) =>
          !candidateProtocol.coverage.environments.includes(environment)) ||
        candidateProtocol.coverage.trials_per_environment < baseProtocol.coverage.trials_per_environment) {
      fail(`candidate downgraded canonical protocol ${protocolId}`);
    }
  }
  for (const [capabilityId, baseBinding] of Object.entries(baseDesign.fixed_observers)) {
    const candidateBinding = candidateDesign.fixed_observers[capabilityId];
    if (!candidateBinding) fail(`candidate deleted canonical fixed observer ${capabilityId}`);
    if (candidateBinding.protocol === baseBinding.protocol) {
      for (const [key, value] of Object.entries(baseBinding.parameters)) {
        if (JSON.stringify(canonical(candidateBinding.parameters[key])) !== JSON.stringify(canonical(value))) {
          fail(`candidate rewrote canonical fixed observer ${capabilityId} parameter ${key}`);
        }
      }
    } else {
      const baseVersion = protocolVersion(
        baseDesign.attested_protocols[baseBinding.protocol]?.protocol,
        `base fixed observer ${capabilityId}`,
      );
      const candidateVersion = protocolVersion(
        candidateDesign.attested_protocols[candidateBinding.protocol]?.protocol,
        `candidate fixed observer ${capabilityId}`,
      );
      if (candidateVersion <= baseVersion ||
          candidateBinding.parameters.kind !== baseBinding.parameters.kind) {
        fail(`candidate downgraded canonical fixed observer ${capabilityId}`);
      }
    }
  }
}

function validateScenarioAuthorityWorkflow(repo, candidate) {
  let workflow;
  try {
    workflow = parseYaml(committedText(repo, candidate, ".github/workflows/scenario-authority.yml"),
      { uniqueKeys: true });
  } catch {
    fail("candidate scenario-authority workflow is invalid");
  }
  const types = workflow?.on?.pull_request_target?.types;
  const job = workflow?.jobs?.["canonical-scenario-authority"];
  const steps = job?.steps ?? [];
  const checkout = steps.find((step) => String(step?.uses ?? "").startsWith("actions/checkout@"));
  const setupNode = steps.find((step) => String(step?.uses ?? "").startsWith("actions/setup-node@"));
  const install = steps.find((step) => step?.run === "npm ci --ignore-scripts");
  const fetch = steps.find((step) => step?.name === "Fetch exact candidate without checkout");
  const enforce = steps.find((step) => step?.name === "Enforce canonical scenario authority");
  if (workflow?.name !== "scenario-authority" ||
      JSON.stringify(Object.keys(workflow ?? {}).sort()) !== JSON.stringify(["jobs", "name", "on", "permissions"]) ||
      JSON.stringify(Object.keys(workflow?.on ?? {})) !== JSON.stringify(["pull_request_target"]) ||
      JSON.stringify(Object.keys(workflow?.on?.pull_request_target ?? {})) !== JSON.stringify(["types"]) ||
      JSON.stringify(Object.keys(workflow?.permissions ?? {})) !== JSON.stringify(["contents"]) ||
      workflow?.permissions?.contents !== "read" ||
      JSON.stringify(types) !== JSON.stringify(["opened", "reopened", "synchronize", "ready_for_review"]) ||
      JSON.stringify(Object.keys(workflow?.jobs ?? {})) !== JSON.stringify(["canonical-scenario-authority"]) ||
      JSON.stringify(Object.keys(job ?? {}).sort()) !== JSON.stringify(["runs-on", "steps"]) ||
      job?.["runs-on"] !== "ubuntu-latest" || steps.length !== 5 ||
      steps[0] !== checkout || steps[1] !== setupNode || steps[2] !== install || steps[3] !== fetch ||
      steps[4] !== enforce || !/^actions\/checkout@[a-f0-9]{40}$/.test(checkout?.uses ?? "") ||
      !/^actions\/setup-node@[a-f0-9]{40}$/.test(setupNode?.uses ?? "") ||
      JSON.stringify(Object.keys(checkout ?? {}).sort()) !== JSON.stringify(["uses", "with"]) ||
      JSON.stringify(Object.keys(setupNode ?? {}).sort()) !== JSON.stringify(["uses", "with"]) ||
      JSON.stringify(Object.keys(install ?? {})) !== JSON.stringify(["run"]) ||
      JSON.stringify(Object.keys(fetch ?? {}).sort()) !== JSON.stringify(["env", "name", "run", "shell"]) ||
      JSON.stringify(Object.keys(enforce ?? {}).sort()) !== JSON.stringify(["env", "name", "run"]) ||
      JSON.stringify(Object.keys(fetch?.env ?? {}).sort()) !== JSON.stringify(["CANDIDATE_SHA", "PR_NUMBER"]) ||
      JSON.stringify(Object.keys(enforce?.env ?? {}).sort()) !== JSON.stringify(["BASE_SHA", "CANDIDATE_SHA"]) ||
      checkout?.with?.ref !== "${{ github.event.pull_request.base.sha }}" ||
      checkout?.with?.["fetch-depth"] !== 0 || checkout?.with?.["persist-credentials"] !== false ||
      JSON.stringify(Object.keys(checkout?.with ?? {}).sort()) !==
        JSON.stringify(["fetch-depth", "persist-credentials", "ref"]) ||
      setupNode?.with?.["node-version"] !== 24 || setupNode?.with?.cache !== "npm" ||
      JSON.stringify(Object.keys(setupNode?.with ?? {}).sort()) !== JSON.stringify(["cache", "node-version"]) ||
      fetch?.env?.CANDIDATE_SHA !== "${{ github.event.pull_request.head.sha }}" ||
      fetch?.env?.PR_NUMBER !== "${{ github.event.pull_request.number }}" ||
      fetch?.shell !== "bash" || String(fetch?.run).trim() !== [
        'git fetch --no-tags origin "refs/pull/${PR_NUMBER}/head"',
        'test "$(git rev-parse FETCH_HEAD)" = "$CANDIDATE_SHA"',
      ].join("\n") ||
      enforce?.env?.BASE_SHA !== "${{ github.event.pull_request.base.sha }}" ||
      enforce?.env?.CANDIDATE_SHA !== "${{ github.event.pull_request.head.sha }}" ||
      enforce?.run !== 'node scripts/check-scenario-authority.mjs --base "$BASE_SHA" --candidate "$CANDIDATE_SHA"') {
    fail("candidate weakened the canonical scenario-authority workflow");
  }
}

function parseCases(repo, oid, label) {
  const cases = new Map();
  const descriptions = new Set();
  let smokeCases = 0;
  for (const [file, allowedSuite] of [
    ["evals/cases/golden.yaml", new Set(["smoke", "full"])],
    ["evals/cases/holdout.yaml", new Set(["holdout"])],
  ]) {
    let rows;
    try {
      rows = parseYaml(committedText(repo, oid, file), { uniqueKeys: true });
    } catch {
      fail(`${label} ${file} must be valid unique-key YAML`);
    }
    if (!Array.isArray(rows)) fail(`${label} ${file} must contain cases`);
    for (const row of rows) {
      const suite = /^\[(smoke|full|holdout)\] /.exec(row?.description ?? "")?.[1];
      if (!allowedSuite.has(suite)) fail(`${label} executable corpus has invalid suite identity`);
      if (descriptions.has(row.description)) fail(`${label} executable corpus has duplicate description`);
      descriptions.add(row.description);
      if (suite === "smoke") smokeCases += 1;
      const { binding } = validateCase(row, suite, `${label} ${row.description}`);
      if (!binding?.case_id || cases.has(binding.case_id)) {
        fail(`${label} executable corpus has invalid or duplicate identity`);
      }
      cases.set(binding.case_id, {
        capability_id: binding.id,
        scenario: binding.scenario,
        suite: suite === "holdout" ? "holdout" : "golden",
        definition: JSON.stringify(canonical(row)),
      });
    }
  }
  if (smokeCases !== 2) fail(`${label} executable corpus must retain exactly two smoke cases`);
  return cases;
}

const protectedFields = [
  "capability_id",
  "scenario",
  "case_id",
  "observer_kind",
];
const protectedScenarioAuthorityControls = [
  "scripts/check-scenario-authority.mjs",
  "scripts/check-scenario-authority.test.mjs",
  "scripts/validate.mjs",
];
export function checkScenarioAuthority({ repo = defaultRepo, base, candidate }) {
  const resolvedRepo = path.resolve(repo);
  assertCommit(resolvedRepo, base, "base");
  assertCommit(resolvedRepo, candidate, "candidate");
  const { design: baseDesign, slots: baseSlots } = parseDesign(resolvedRepo, base, "base");
  const { design: candidateDesign, slots: candidateSlots } = parseDesign(resolvedRepo, candidate, "candidate");
  validateProtocolDesign(resolvedRepo, base, baseDesign, "base");
  validateProtocolDesign(resolvedRepo, candidate, candidateDesign, "candidate");
  validateProtocolEvolution(baseDesign, candidateDesign);
  validateScenarioAuthorityWorkflow(resolvedRepo, candidate);
  for (const file of protectedScenarioAuthorityControls) {
    if (committedText(resolvedRepo, candidate, file) !== committedText(resolvedRepo, base, file)) {
      fail(`candidate changed protected scenario authority control ${file}`);
    }
  }
  const fixedObserverCapabilities = new Set(Object.keys(candidateDesign.fixed_observers));
  const baseFixedObserverCapabilities = new Set(Object.keys(baseDesign.fixed_observers));
  const protocolAuthorityChanged = JSON.stringify(canonical(candidateDesign.attested_protocols)) !==
      JSON.stringify(canonical(baseDesign.attested_protocols)) ||
    JSON.stringify(canonical(candidateDesign.fixed_observers)) !==
      JSON.stringify(canonical(baseDesign.fixed_observers));
  if (protocolAuthorityChanged) {
    const changedProtocols = new Set();
    for (const protocolId of new Set([
      ...Object.keys(baseDesign.attested_protocols), ...Object.keys(candidateDesign.attested_protocols),
    ])) {
      if (JSON.stringify(canonical(baseDesign.attested_protocols[protocolId])) !==
          JSON.stringify(canonical(candidateDesign.attested_protocols[protocolId]))) {
        changedProtocols.add(protocolId);
      }
    }
    const bindingProtocols = new Set();
    let bindingChanged = false;
    for (const capabilityId of new Set([
      ...Object.keys(baseDesign.fixed_observers), ...Object.keys(candidateDesign.fixed_observers),
    ])) {
      const baseBinding = baseDesign.fixed_observers[capabilityId];
      const candidateBinding = candidateDesign.fixed_observers[capabilityId];
      if (JSON.stringify(canonical(baseBinding)) !== JSON.stringify(canonical(candidateBinding))) {
        bindingChanged = true;
        if (baseBinding?.protocol) bindingProtocols.add(baseBinding.protocol);
        if (candidateBinding?.protocol) bindingProtocols.add(candidateBinding.protocol);
      }
    }
    if (changedProtocols.size > 1 ||
        (bindingChanged && [...changedProtocols].some((protocolId) => !bindingProtocols.has(protocolId)))) {
      fail("protocol migration must isolate one binding-owned protocol");
    }
    const affectedProtocols = new Set([...bindingProtocols, ...changedProtocols]);
    const permitted = new Set([
      "evals/scenarios.json",
      "evals/CONTRACT.md",
      ...protocolControlFiles(baseDesign, affectedProtocols),
      ...protocolControlFiles(candidateDesign, affectedProtocols),
    ]);
    for (const file of [...permitted]) {
      if (file.endsWith(".mjs")) permitted.add(file.replace(/\.mjs$/, ".test.mjs"));
    }
    const changedFiles = git(resolvedRepo, ["diff", "--name-only", base, candidate])
      .trim().split(/\r?\n/).filter(Boolean);
    if (changedFiles.some((file) => !permitted.has(file))) {
      fail("fixed-observer migration changed a file outside its explicit control surface");
    }
  }
  const baseCatalog = parseJsonBlob(resolvedRepo, base, "evals/capabilities.json", "base capability catalog");
  const candidateCatalog = parseJsonBlob(resolvedRepo, candidate, "evals/capabilities.json", "candidate capability catalog");
  const baseAdmission = parseAtomicityAdmission(resolvedRepo, base, "base", true);
  const candidateAdmission = parseAtomicityAdmission(resolvedRepo, candidate, "candidate");
  const catalogEvolution = compareCapabilityCatalogs(
    baseCatalog, candidateCatalog, baseAdmission, candidateAdmission,
  );
  if (catalogEvolution.atomicityTransition === "proposed" ||
      catalogEvolution.atomicityTransition.startsWith("consumed_")) {
    verifyDirectTransition(resolvedRepo, base, candidate);
  }
  if (catalogEvolution.atomicityTransition === "proposed") {
    verifyAtomicityReviewBinding(resolvedRepo, candidateAdmission.decision, {
      reviewedBase: base,
      currentCommit: candidate,
      catalog: baseCatalog,
      label: "candidate",
    });
  } else if (catalogEvolution.atomicityTransition.startsWith("consumed_")) {
    const reviewedBase = baseAdmission.decision.reviewed_base.commit;
    if (git(resolvedRepo, ["merge-base", reviewedBase, base]).trim() !== reviewedBase) {
      fail("base no longer descends from the reviewed atomicity source");
    }
    verifyAtomicityReviewBinding(resolvedRepo, baseAdmission.decision, {
      reviewedBase,
      currentCommit: candidate,
      catalog: baseCatalog,
      label: "consumed",
      allowChangedPaths: catalogEvolution.atomicityTransition === "consumed_split"
        ? new Set(["evals/scenarios.json"])
        : new Set(),
    });
    if (catalogEvolution.atomicityTransition === "consumed_split") {
      verifySplitScenarioDelta(resolvedRepo, reviewedBase, candidate, baseAdmission.decision);
    }
  }
  const catalogChanged = catalogEvolution.migrated || catalogEvolution.appendedIds.size > 0 ||
    catalogEvolution.atomicityTransition === "consumed_atomic";
  if (catalogEvolution.atomicityTransition !== "unchanged") {
    const changedFiles = git(resolvedRepo, ["diff", "--name-only", base, candidate]).trim().split(/\r?\n/).filter(Boolean);
    const permitted = new Set(["evals/atomicity-admission.json"]);
    if (catalogEvolution.atomicityTransition === "consumed_atomic") permitted.add("evals/capabilities.json");
    if (catalogEvolution.atomicityTransition === "consumed_split") {
      permitted.add("evals/capabilities.json");
      permitted.add("evals/scenarios.json");
    }
    if (changedFiles.length === 0 || changedFiles.some((file) => !permitted.has(file))) {
      fail("atomicity transition must use its isolated canonical write set");
    }
  }
  const expectedSlots = catalogEvolution.candidate.capabilities.size * capabilityScenarios.size;
  if (candidateSlots.size !== expectedSlots) {
    fail(`candidate scenario slots must equal the ${expectedSlots}-slot capability catalog`);
  }

  const promotedCapabilities = new Set();
  for (const [slot, baseRow] of baseSlots) {
    const candidateRow = candidateSlots.get(slot);
    if (!candidateRow) fail(`candidate deleted canonical scenario slot ${slot}`);
    if (catalogChanged && JSON.stringify(canonical(candidateRow)) !== JSON.stringify(canonical(baseRow))) {
      fail(`catalog evolution cannot change canonical scenario slot ${slot}`);
    }
    for (const field of protectedFields) {
      if (candidateRow[field] !== baseRow[field]) fail(`candidate changed canonical ${slot} field ${field}`);
    }
    const authorityUnchanged = candidateRow.authority_status === baseRow.authority_status &&
      candidateRow.missing_authority === baseRow.missing_authority;
    const admittedFixedObserver = baseRow.authority_status === "authority_unavailable" &&
      ["fixed_consumer_observer", "scenario_consumer_binding"].includes(baseRow.missing_authority) &&
      candidateRow.authority_status === "implemented" && candidateRow.missing_authority === null &&
      candidateRow.observer_kind === "fixed_real_consumer" &&
      baseFixedObserverCapabilities.has(candidateRow.capability_id);
    if (admittedFixedObserver) promotedCapabilities.add(candidateRow.capability_id);
    if (!authorityUnchanged && !admittedFixedObserver) {
      fail(`candidate changed canonical ${slot} authority without an admitted fixed observer`);
    }
    if (baseRow.executable_suite !== undefined && candidateRow.executable_suite !== baseRow.executable_suite) {
      fail(`candidate changed canonical ${slot} executable suite`);
    }
    if (baseRow.executable_suite === undefined && candidateRow.executable_suite !== undefined &&
        !["golden", "holdout"].includes(candidateRow.executable_suite)) {
      fail(`candidate added invalid ${slot} executable suite`);
    }
  }

  for (const capabilityId of catalogEvolution.appendedIds) {
    for (const scenario of capabilityScenarios) {
      const slot = `${capabilityId}/${scenario}`;
      const row = candidateSlots.get(slot);
      if (!row || baseSlots.has(slot) || row.case_id !== `${capabilityId.toLowerCase()}-${scenario}` ||
          row.observer_kind !== "fixed_real_consumer" || row.authority_status !== "authority_unavailable" ||
          row.missing_authority !== "scenario_consumer_binding" || row.executable_suite !== undefined) {
        fail(`new capability ${capabilityId} must start with one unavailable zero-evidence ${scenario} slot`);
      }
    }
  }
  for (const capabilityId of fixedObserverCapabilities) {
    const rows = [...candidateSlots.values()].filter((row) => row.capability_id === capabilityId);
    const changed = rows.some((row) => {
      const baseRow = baseSlots.get(`${row.capability_id}/${row.scenario}`);
      return row.authority_status !== baseRow.authority_status || row.missing_authority !== baseRow.missing_authority;
    });
    if (changed && (rows.length !== 3 || rows.some((row) =>
      row.authority_status !== "implemented" || row.missing_authority !== null))) {
      fail(`candidate must admit all ${capabilityId} fixed-observer scenarios atomically`);
    }
  }

  if (promotedCapabilities.size > 0) {
    for (const capabilityId of promotedCapabilities) {
      const baseBinding = baseDesign.fixed_observers[capabilityId];
      const candidateBinding = candidateDesign.fixed_observers[capabilityId];
      if (JSON.stringify(canonical(candidateBinding)) !== JSON.stringify(canonical(baseBinding))) {
        fail(`fixed-observer promotion changed base-owned binding ${capabilityId}`);
      }
      const protocolId = baseBinding.protocol;
      if (JSON.stringify(canonical(candidateDesign.attested_protocols[protocolId])) !==
          JSON.stringify(canonical(baseDesign.attested_protocols[protocolId]))) {
        fail(`fixed-observer promotion changed base-owned protocol ${protocolId}`);
      }
      for (const file of protocolControlFiles(baseDesign, new Set([protocolId]))) {
        if (committedText(resolvedRepo, candidate, file) !== committedText(resolvedRepo, base, file)) {
          fail(`fixed-observer promotion changed base-owned control ${file}`);
        }
      }
    }
    const changedFiles = git(resolvedRepo, ["diff", "--name-only", base, candidate])
      .trim().split(/\r?\n/).filter(Boolean);
    const permitted = new Set([
      "evals/scenarios.json", "evals/cases/golden.yaml", "evals/cases/holdout.yaml",
    ]);
    if (changedFiles.some((file) => !permitted.has(file))) {
      fail("fixed-observer promotion must use its isolated scenario and case write set");
    }
  }

  const baseCases = parseCases(resolvedRepo, base, "base");
  const candidateCases = parseCases(resolvedRepo, candidate, "candidate");
  if (catalogEvolution.atomicityTransition !== "unchanged" &&
      (baseCases.size !== candidateCases.size || [...baseCases].some(([id, row]) =>
        candidateCases.get(id)?.definition !== row.definition))) {
    fail("atomicity transition cannot change executable cases");
  }
  for (const [caseId, baseCase] of baseCases) {
    const candidateCase = candidateCases.get(caseId);
    if (!candidateCase || candidateCase.definition !== baseCase.definition) {
      fail(`candidate deleted or moved canonical executable case ${caseId}`);
    }
  }
  for (const [caseId, candidateCase] of candidateCases) {
    const row = [...candidateSlots.values()].find((entry) => entry.case_id === caseId);
    if (!row || row.capability_id !== candidateCase.capability_id || row.scenario !== candidateCase.scenario ||
        row.executable_suite !== candidateCase.suite) {
      fail(`candidate executable case ${caseId} lacks one exact scenario binding`);
    }
  }
  for (const row of candidateSlots.values()) {
    if (row.executable_suite !== undefined && !candidateCases.has(row.case_id)) {
      fail(`candidate scenario ${row.case_id} lacks its executable case`);
    }
  }
  return { slots: candidateSlots.size, canonicalCases: baseCases.size, candidateCases: candidateCases.size };
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const args = Object.fromEntries(process.argv.slice(2).map((value, index, all) =>
    value.startsWith("--") ? [value.slice(2), all[index + 1]] : null).filter(Boolean));
  if (!args.base || !args.candidate) fail("usage: check-scenario-authority.mjs --base <oid> --candidate <oid> [--repo <path>]");
  const result = checkScenarioAuthority({ repo: args.repo ?? defaultRepo, base: args.base, candidate: args.candidate });
  process.stdout.write(`Canonical scenario authority preserved: ${result.slots} slots, ${result.canonicalCases} canonical cases, ${result.candidateCases} candidate cases.\n`);
}
