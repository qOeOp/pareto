import { execFileSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { parse as parseYaml } from "yaml";
import {
  atomicityRequiredStaticPaths,
  capabilityScenarios,
  compareCapabilityCatalogs,
} from "./capability-catalog.mjs";
import { parseAgentMessagePolicy } from "./agent-message-trajectory.mjs";
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

function exactKeys(value, expected, label, optional = new Set()) {
  if (!value || typeof value !== "object" || Array.isArray(value)) fail(`${label} must be an object`);
  const actual = Object.keys(value).sort();
  const allowed = new Set([...expected, ...optional]);
  if ([...expected].some((key) => !Object.hasOwn(value, key)) || actual.some((key) => !allowed.has(key))) {
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
    `${label} observations`, new Set(["agent_messages"]));
  parseAgentMessagePolicy(observations.agent_messages, `${label} observations.agent_messages`);
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
const coreControlPlaneFiles = [
  ".github/workflows/scenario-authority.yml",
  "scripts/capability-catalog.mjs",
  "scripts/check-scenario-authority.mjs",
  "scripts/self-test.mjs",
  "scripts/validate.mjs",
  "scripts/capability-score.mjs",
  "scripts/agent-message-trajectory.mjs",
  "scripts/json.mjs",
  "package.json",
  "package-lock.json",
];

export function checkScenarioAuthority({ repo = defaultRepo, base, candidate }) {
  const resolvedRepo = path.resolve(repo);
  assertCommit(resolvedRepo, base, "base");
  assertCommit(resolvedRepo, candidate, "candidate");
  const { design: baseDesign, slots: baseSlots } = parseDesign(resolvedRepo, base, "base");
  const { design: candidateDesign, slots: candidateSlots } = parseDesign(resolvedRepo, candidate, "candidate");
  const fixedObserverCapabilities = new Set(Object.keys(candidateDesign.fixed_observers));
  if (JSON.stringify(canonical(candidateDesign.attested_protocols)) !==
        JSON.stringify(canonical(baseDesign.attested_protocols)) ||
      JSON.stringify(canonical(candidateDesign.fixed_observers)) !==
        JSON.stringify(canonical(baseDesign.fixed_observers))) {
    fail("candidate changed the canonical fixed observer bindings");
  }
  const protocolControlFiles = Object.values(baseDesign.attested_protocols).flatMap((protocol) => [
    protocol.adapter,
    protocol.observer,
    protocol.workflow,
    ...Object.values(protocol.consumer_paths ?? {}),
    ...Object.values(protocol.runtime_paths ?? {}),
  ]).filter((file) => file !== "evals/scenarios.json");
  for (const file of new Set([...coreControlPlaneFiles, ...protocolControlFiles])) {
    if (committedText(resolvedRepo, candidate, file) !== committedText(resolvedRepo, base, file)) {
      fail(`candidate changed protected scenario authority control ${file}`);
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
      candidateRow.observer_kind === "fixed_real_consumer" && fixedObserverCapabilities.has(candidateRow.capability_id);
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
