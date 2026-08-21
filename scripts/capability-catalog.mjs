const catalogKeys = Object.freeze([
  "schema_version", "target_score", "local_trace_ceiling", "score_anchors",
  "default_requirements", "capabilities",
]);
const baseCapabilityKeys = Object.freeze([
  "id", "domain", "name", "owner", "consumer", "weight", "critical",
]);
const v2CapabilityKeys = Object.freeze([...baseCapabilityKeys, "atomicity", "split_from"]);
const atomicityAtomKeys = Object.freeze([
  ...baseCapabilityKeys, "acceptance", "falsifier", "overlap_ids",
]);
const atomicityDecisionKeys = Object.freeze([
  "capability_id", "disposition", "atoms", "reviewed_base", "reviewed_surfaces",
]);
export const atomicityRequiredStaticPaths = Object.freeze([
  ".github/workflows/scenario-authority.yml",
  "codex/agents/mission-evaluator.toml",
  "evals/CONTRACT.md",
  "evals/cases/golden.yaml",
  "evals/cases/holdout.yaml",
  "evals/scenarios.json",
  "package-lock.json",
  "package.json",
  "scripts/agent-message-trajectory.mjs",
  "scripts/capability-catalog.mjs",
  "scripts/capability-score.mjs",
  "scripts/check-scenario-authority.mjs",
  "scripts/json.mjs",
  "scripts/observe-score-capability.mjs",
  "scripts/validate.mjs",
  "skills/run-bounded-mission/references/verification/reviewer-handoff.md",
]);
const sha256Pattern = /^sha256:[0-9a-f]{64}$/;
const objectIdPattern = /^[0-9a-f]{40,64}$/;
const expectedAnchors = Object.freeze({
  absent_or_contradicted: 0,
  declared: 2,
  reachable: 4,
  dynamic: 6,
  representative: 8,
  varied_no_material_gap: 9.5,
});
const expectedScenarios = Object.freeze(["positive", "negative", "recovery"]);
const expectedSources = Object.freeze(["deterministic_replay", "native_trace", "independent_review"]);

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

function canonical(value) {
  if (Array.isArray(value)) return value.map(canonical);
  if (value && typeof value === "object") {
    return Object.fromEntries(Object.keys(value).sort().map((key) => [key, canonical(value[key])]));
  }
  return value;
}

function same(left, right) {
  return JSON.stringify(canonical(left)) === JSON.stringify(canonical(right));
}

function scoringDefinition(row) {
  return Object.fromEntries(baseCapabilityKeys.map((key) => [key, row[key]]));
}

function sameSet(left, right) {
  return Array.isArray(left) && left.length === new Set(left).size &&
    same([...left].sort(), [...right].sort());
}

function repositoryPath(value) {
  return typeof value === "string" && value.length > 0 && value.length <= 256 && !value.startsWith("/") &&
    !value.includes("\\") && !value.split("/").some((part) => !part || part === "." || part === "..");
}

export const capabilityScenarios = new Set(expectedScenarios);

export function validateCapabilityCatalog(catalog, label = "catalog") {
  exactKeys(catalog, catalogKeys, label);
  if (![1, 2].includes(catalog.schema_version) || catalog.target_score !== 9.5 ||
      catalog.local_trace_ceiling !== 2) {
    fail(`${label} version, target, or local trace ceiling is unsupported`);
  }
  exactKeys(catalog.score_anchors, Object.keys(expectedAnchors), `${label} score anchors`);
  if (!same(catalog.score_anchors, expectedAnchors)) {
    fail(`${label} score anchors must remain 0/2/4/6/8/9.5`);
  }
  exactKeys(catalog.default_requirements, [
    "scenarios", "sources", "trials_per_scenario", "environments", "independent_observers",
  ], `${label} default requirements`);
  const requirements = catalog.default_requirements;
  if (!same(requirements.scenarios, expectedScenarios) || !same(requirements.sources, expectedSources) ||
      !Number.isInteger(requirements.trials_per_scenario) || requirements.trials_per_scenario < 3 ||
      !Number.isInteger(requirements.environments) || requirements.environments < 2 ||
      !Number.isInteger(requirements.independent_observers) || requirements.independent_observers < 2) {
    fail(`${label} varied-evidence requirements are invalid or too weak`);
  }
  if (!Array.isArray(catalog.capabilities) || catalog.capabilities.length === 0) {
    fail(`${label} capabilities are empty`);
  }

  const rows = new Map();
  for (const row of catalog.capabilities) {
    exactKeys(row, catalog.schema_version === 1 ? baseCapabilityKeys : v2CapabilityKeys,
      `${label} capability`);
    const id = atom(row.id, `${label} capability id`);
    if (!/^[A-Z]{3,4}-\d{2}$/.test(id) || rows.has(id)) {
      fail(`${label} capability id is invalid or duplicated: ${id}`);
    }
    for (const key of ["domain", "name", "owner", "consumer"]) atom(row[key], `${label} ${id} ${key}`);
    if (row.weight !== 1) fail(`${label} capability ${id} weight must remain one`);
    if (typeof row.critical !== "boolean") fail(`${label} capability ${id} critical must be boolean`);
    if (catalog.schema_version === 2) {
      if (!["unreviewed", "atomic"].includes(row.atomicity)) {
        fail(`${label} capability ${id} atomicity is invalid`);
      }
      if (row.split_from !== null &&
          (typeof row.split_from !== "string" || !/^[A-Z]{3,4}-\d{2}$/.test(row.split_from))) {
        fail(`${label} capability ${id} split_from is invalid`);
      }
    }
    rows.set(id, row);
  }
  if (catalog.schema_version === 2) {
    for (const row of rows.values()) {
      if (row.split_from !== null && (!rows.has(row.split_from) || row.split_from === row.id)) {
        fail(`${label} capability ${row.id} split parent is invalid`);
      }
      const lineage = new Set([row.id]);
      let parent = row.split_from;
      while (parent !== null) {
        if (lineage.has(parent)) fail(`${label} capability lineage contains a cycle`);
        lineage.add(parent);
        parent = rows.get(parent).split_from;
      }
    }
  }

  const parents = new Set(catalog.schema_version === 2
    ? [...rows.values()].filter((row) => row.split_from !== null).map((row) => row.split_from)
    : []);
  const terminalIds = new Set([...rows.keys()].filter((id) => !parents.has(id)));
  return {
    schemaVersion: catalog.schema_version,
    rawRows: rows,
    capabilities: new Map([...rows].map(([id, row]) => [id, scoringDefinition(row)])),
    terminalIds,
    unreviewedTerminalIds: new Set(catalog.schema_version === 2
      ? [...terminalIds].filter((id) => rows.get(id).atomicity === "unreviewed")
      : []),
  };
}

export function validateAtomicityAdmission(admission, catalog, label = "atomicity admission") {
  exactKeys(admission, ["schema_version", "decision"], label);
  if (admission.schema_version !== 1) fail(`${label} schema is unsupported`);
  const contract = validateCapabilityCatalog(catalog, `${label} catalog`);
  if (admission.decision === null) return { decision: null, contract };

  const decision = admission.decision;
  exactKeys(decision, atomicityDecisionKeys, `${label} decision`);
  exactKeys(decision.reviewed_base, ["commit", "tree"], `${label} reviewed base`);
  if (!objectIdPattern.test(decision.reviewed_base.commit) || !objectIdPattern.test(decision.reviewed_base.tree) ||
      !Array.isArray(decision.reviewed_surfaces) || decision.reviewed_surfaces.length === 0 ||
      decision.reviewed_surfaces.length > 64) {
    fail(`${label} reviewed source identity is invalid`);
  }
  const surfacePaths = new Set();
  for (const surface of decision.reviewed_surfaces) {
    exactKeys(surface, ["path", "blob"], `${label} reviewed surface`);
    if (!repositoryPath(surface.path) || !objectIdPattern.test(surface.blob) || surfacePaths.has(surface.path)) {
      fail(`${label} reviewed surface is invalid or duplicated`);
    }
    surfacePaths.add(surface.path);
  }
  const capabilityId = atom(decision.capability_id, `${label} capability id`);
  if (!contract.terminalIds.has(capabilityId)) {
    fail(`${label} target must be one current terminal capability`);
  }
  if (!["atomic", "split"].includes(decision.disposition) || !Array.isArray(decision.atoms)) {
    fail(`${label} disposition or atoms are invalid`);
  }
  const source = contract.rawRows.get(capabilityId);
  if (source.atomicity !== "unreviewed") fail(`${label} target is already atomic`);
  if (![...surfacePaths].some((file) => file === source.owner || file.endsWith(`/${source.owner}`))) {
    fail(`${label} does not bind the capability owner surface`);
  }
  if ((decision.disposition === "atomic" && decision.atoms.length !== 1) ||
      (decision.disposition === "split" && decision.atoms.length < 2)) {
    fail(`${label} atom count does not match its disposition`);
  }

  const atomIds = new Set();
  for (const entry of decision.atoms) {
    exactKeys(entry, atomicityAtomKeys, `${label} atom`);
    const id = atom(entry.id, `${label} atom id`);
    if (!/^[A-Z]{3,4}-\d{2}$/.test(id) || atomIds.has(id)) fail(`${label} atom id is invalid or duplicated`);
    atomIds.add(id);
    for (const key of ["domain", "name", "owner", "consumer", "acceptance", "falsifier"]) {
      atom(entry[key], `${label} atom ${id} ${key}`);
    }
    if (entry.weight !== 1 || typeof entry.critical !== "boolean") {
      fail(`${label} atom ${id} scoring definition is invalid`);
    }
    const ownerSurfaces = [...surfacePaths].filter((file) =>
      file === entry.owner || file.endsWith(`/${entry.owner}`));
    if (ownerSurfaces.length !== 1) {
      fail(`${label} atom ${id} does not bind one exact owner surface`);
    }
  }
  if (decision.disposition === "atomic") {
    if (!same(scoringDefinition(decision.atoms[0]), scoringDefinition(source))) {
      fail(`${label} atomic decision changed the canonical capability definition`);
    }
  } else {
    for (const entry of decision.atoms) {
      if (contract.rawRows.has(entry.id) || entry.domain !== source.domain) {
        fail(`${label} split atom ${entry.id} is not a new capability in the parent domain`);
      }
    }
  }

  const comparisonUniverse = new Set([
    ...[...contract.terminalIds].filter((id) => id !== capabilityId),
    ...atomIds,
  ]);
  for (const entry of decision.atoms) {
    const expected = [...comparisonUniverse].filter((id) => id !== entry.id);
    if (!sameSet(entry.overlap_ids, expected)) {
      fail(`${label} atom ${entry.id} does not cover the complete overlap universe`);
    }
  }
  return { decision, contract };
}

export function compareCapabilityCatalogs(baseCatalog, candidateCatalog, baseAdmission = null, candidateAdmission = null) {
  const base = validateCapabilityCatalog(baseCatalog, "base capability catalog");
  const candidate = validateCapabilityCatalog(candidateCatalog, "candidate capability catalog");
  if (candidate.schemaVersion < base.schemaVersion || candidate.schemaVersion > base.schemaVersion + 1) {
    fail("candidate capability catalog schema transition is invalid");
  }
  const envelope = (catalog) => Object.fromEntries(Object.entries(catalog)
    .filter(([key]) => !["schema_version", "capabilities"].includes(key)));
  if (!same(envelope(baseCatalog), envelope(candidateCatalog))) {
    fail("candidate changed canonical catalog scoring or evidence requirements");
  }

  if (base.schemaVersion === 1 && candidate.schemaVersion === 1) {
    if (!same(baseCatalog, candidateCatalog)) fail("candidate changed the canonical v1 capability catalog");
    return { migrated: false, appendedIds: new Set(), base, candidate, atomicityTransition: "unchanged" };
  }
  if (base.schemaVersion === 1) {
    if (candidateCatalog.capabilities.length !== baseCatalog.capabilities.length) {
      fail("v1 to v2 migration cannot add or delete capabilities");
    }
    for (let index = 0; index < baseCatalog.capabilities.length; index += 1) {
      const source = baseCatalog.capabilities[index];
      const migrated = candidateCatalog.capabilities[index];
      if (!same(source, scoringDefinition(migrated)) || migrated.atomicity !== "unreviewed" ||
          migrated.split_from !== null) {
        fail(`v1 to v2 migration changed capability ${source.id}`);
      }
    }
    return { migrated: true, appendedIds: new Set(), base, candidate, atomicityTransition: "unchanged" };
  }
  if (candidate.schemaVersion !== 2) fail("candidate capability catalog cannot downgrade from v2");
  if (candidateCatalog.capabilities.length < baseCatalog.capabilities.length) {
    fail("candidate deleted canonical capabilities");
  }
  const pending = baseAdmission === null
    ? null
    : validateAtomicityAdmission(baseAdmission, baseCatalog, "base atomicity admission").decision;
  const proposed = baseAdmission !== null && pending === null && candidateAdmission?.decision !== null;
  if (candidateAdmission !== null) {
    validateAtomicityAdmission(candidateAdmission, candidateCatalog, "candidate atomicity admission");
  }
  const consumed = pending !== null && candidateAdmission?.decision === null;
  const unchangedAdmission = baseAdmission === null || same(baseAdmission, candidateAdmission);
  if (!proposed && !consumed && !unchangedAdmission) {
    fail("candidate changed the pending atomicity admission without consuming it");
  }

  let atomicPromotions = 0;
  for (let index = 0; index < baseCatalog.capabilities.length; index += 1) {
    const source = baseCatalog.capabilities[index];
    const target = candidateCatalog.capabilities[index];
    const admittedAtomicPromotion = consumed && pending.disposition === "atomic" &&
      source.id === pending.capability_id && source.atomicity === "unreviewed" && target.atomicity === "atomic" &&
      same(scoringDefinition(source), scoringDefinition(target)) && source.split_from === target.split_from;
    if (admittedAtomicPromotion) atomicPromotions += 1;
    if (!same(source, target) && !admittedAtomicPromotion) {
      fail(`candidate changed or reordered canonical capability ${source.id}`);
    }
  }

  const appended = candidateCatalog.capabilities.slice(baseCatalog.capabilities.length);
  const appendedIds = new Set(appended.map((row) => row.id));
  const childrenByParent = new Map();
  for (const row of appended) {
    if (row.split_from === null || !base.rawRows.has(row.split_from) || !base.terminalIds.has(row.split_from)) {
      fail(`new capability ${row.id} must split one canonical terminal capability`);
    }
    childrenByParent.set(row.split_from, [...(childrenByParent.get(row.split_from) ?? []), row.id]);
  }
  for (const [parent, children] of childrenByParent) {
    if (children.length < 2) fail(`capability ${parent} split requires at least two new children`);
  }
  if (proposed && (!same(baseCatalog, candidateCatalog) || appended.length > 0)) {
    fail("atomicity review admission cannot change the capability catalog");
  }
  if (appended.length > 0) {
    if (!consumed || pending.disposition !== "split" ||
        new Set(appended.map((row) => row.split_from)).size !== 1 ||
        appended[0].split_from !== pending.capability_id) {
      fail("candidate split lacks one previously admitted atomicity decision");
    }
    const expected = pending.atoms.map((entry) => scoringDefinition(entry));
    if (!same(appended.map((row) => scoringDefinition(row)), expected) ||
        appended.some((row) => row.atomicity !== "unreviewed")) {
      fail("candidate split does not match the previously admitted atom definitions");
    }
  }
  if (consumed && pending.disposition === "atomic" && appended.length > 0) {
    fail("atomic promotion cannot append split children");
  }
  if (consumed && pending.disposition === "atomic" && atomicPromotions !== 1) {
    fail("atomicity admission must promote its exact reviewed capability");
  }
  if (consumed && pending.disposition === "split" && atomicPromotions !== 0) {
    fail("split admission cannot promote an existing capability");
  }
  if (consumed && pending.disposition === "split" && appended.length === 0) {
    fail("split admission must append its reviewed children");
  }
  return {
    migrated: false,
    appendedIds,
    base,
    candidate,
    atomicityTransition: proposed
      ? "proposed"
      : consumed
        ? `consumed_${pending.disposition}`
        : "unchanged",
  };
}
