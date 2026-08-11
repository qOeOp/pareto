const catalogKeys = Object.freeze([
  "schema_version", "target_score", "local_trace_ceiling", "score_anchors",
  "default_requirements", "capabilities",
]);
const baseCapabilityKeys = Object.freeze([
  "id", "domain", "name", "owner", "consumer", "weight", "critical",
]);
const v2CapabilityKeys = Object.freeze([...baseCapabilityKeys, "atomicity", "split_from"]);
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
      if (row.atomicity !== "unreviewed") {
        fail(`${label} capability ${id} atomicity requires a future independent authority consumer`);
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
    unreviewedTerminalIds: new Set(catalog.schema_version === 2 ? terminalIds : []),
  };
}

export function compareCapabilityCatalogs(baseCatalog, candidateCatalog) {
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
    return { migrated: false, appendedIds: new Set(), base, candidate };
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
    return { migrated: true, appendedIds: new Set(), base, candidate };
  }
  if (candidate.schemaVersion !== 2) fail("candidate capability catalog cannot downgrade from v2");
  if (candidateCatalog.capabilities.length < baseCatalog.capabilities.length) {
    fail("candidate deleted canonical capabilities");
  }
  for (let index = 0; index < baseCatalog.capabilities.length; index += 1) {
    const source = baseCatalog.capabilities[index];
    if (!same(source, candidateCatalog.capabilities[index])) {
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
  return { migrated: false, appendedIds, base, candidate };
}
