import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { mkdir, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { stringify as stringifyYaml } from "yaml";
import { checkScenarioAuthority } from "./check-scenario-authority.mjs";

const gitExecutable = process.platform === "win32" ? "git.exe" : "/usr/bin/git";
const fixture = await mkdtemp(path.join(os.tmpdir(), "pareto-scenario-authority-"));
const runGit = (...args) => execFileSync(gitExecutable, ["-C", fixture, ...args], { encoding: "utf8" }).trim();

try {
  runGit("init", "--quiet");
  runGit("config", "user.name", "Pareto Test");
  runGit("config", "user.email", "pareto@example.invalid");
  runGit("checkout", "--quiet", "-b", "main");
  const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
  for (const file of [
    "evals/capabilities.json", "evals/scenarios.json", "evals/cases/golden.yaml", "evals/cases/holdout.yaml",
    ".github/workflows/scenario-authority.yml", ".github/workflows/observe-install-capability.yml",
    ".github/workflows/observe-score-capability.yml", ".github/workflows/consume-score-capability.yml",
    "scripts/capability-catalog.mjs",
    "scripts/check-scenario-authority.mjs",
    "scripts/self-test.mjs", "scripts/validate.mjs", "scripts/capability-score.mjs", "scripts/observe-install-capability.mjs",
    "scripts/observe-score-capability.mjs", "scripts/consume-score-capability.mjs", "scripts/json.mjs",
    "scripts/campaign-verifiers/install.mjs", "scripts/campaign-verifiers/score.mjs",
    "package.json", "package-lock.json",
  ]) {
    const target = path.join(fixture, file);
    await mkdir(path.dirname(target), { recursive: true });
    await writeFile(target, await readFile(path.join(root, file)));
  }
  // Keep one intentionally incomplete canonical slot in this isolated fixture so the
  // monotonic executable-case checks remain meaningful after the current corpus is complete.
  const fixtureDesignPath = path.join(fixture, "evals/scenarios.json");
  const fixtureGoldenPath = path.join(fixture, "evals/cases/golden.yaml");
  const fixtureDesign = JSON.parse(await readFile(fixtureDesignPath, "utf8"));
  const fixtureRow = fixtureDesign.scenarios.find((entry) => entry.case_id === "ins-02-positive");
  delete fixtureRow.executable_suite;
  const fixtureGolden = (await import("yaml")).parse(await readFile(fixtureGoldenPath, "utf8"));
  await writeFile(fixtureDesignPath, `${JSON.stringify(fixtureDesign, null, 2)}\n`);
  await writeFile(fixtureGoldenPath, stringifyYaml(fixtureGolden.filter((testCase) =>
    testCase.metadata.observations.capability.case_id !== fixtureRow.case_id)));
  runGit("add", ".");
  runGit("commit", "--quiet", "-m", "base");
  const base = runGit("rev-parse", "HEAD");

  const commitMutation = async (name, mutate, origin = base) => {
    runGit("checkout", "--quiet", "-B", name, origin);
    await mutate();
    runGit("add", ".");
    runGit("commit", "--quiet", "--allow-empty", "-m", name);
    return runGit("rev-parse", "HEAD");
  };
  const designPath = path.join(fixture, "evals/scenarios.json");
  const goldenPath = path.join(fixture, "evals/cases/golden.yaml");
  const catalogPath = path.join(fixture, "evals/capabilities.json");

  const migrateCatalogToV2 = async () => {
    const catalog = JSON.parse(await readFile(catalogPath, "utf8"));
    catalog.schema_version = 2;
    catalog.capabilities = catalog.capabilities.map((row) => ({
      ...row,
      atomicity: "unreviewed",
      split_from: null,
    }));
    await writeFile(catalogPath, `${JSON.stringify(catalog, null, 2)}\n`);
  };
  const appendSplit = async (parentId, childIds, omittedSlot = null) => {
    const catalog = JSON.parse(await readFile(catalogPath, "utf8"));
    const parent = catalog.capabilities.find((row) => row.id === parentId);
    for (const childId of childIds) {
      catalog.capabilities.push({
        id: childId,
        domain: parent.domain,
        name: `Atomic child ${childId}`,
        owner: parent.owner,
        consumer: parent.consumer,
        weight: 1,
        critical: parent.critical,
        atomicity: "unreviewed",
        split_from: parentId,
      });
    }
    await writeFile(catalogPath, `${JSON.stringify(catalog, null, 2)}\n`);
    const design = JSON.parse(await readFile(designPath, "utf8"));
    for (const childId of childIds) {
      for (const scenario of ["positive", "negative", "recovery"]) {
        if (`${childId}/${scenario}` === omittedSlot) continue;
        design.scenarios.push({
          capability_id: childId,
          scenario,
          case_id: `${childId.toLowerCase()}-${scenario}`,
          observer_kind: "fixed_real_consumer",
          authority_status: "authority_unavailable",
          missing_authority: "scenario_consumer_binding",
        });
      }
    }
    await writeFile(designPath, `${JSON.stringify(design, null, 2)}\n`);
  };

  const migration = await commitMutation("catalog-v2-migration", migrateCatalogToV2);
  const migrationResult = checkScenarioAuthority({ repo: fixture, base, candidate: migration });
  assert.equal(migrationResult.slots, 117);

  for (const [field, value] of [
    ["trials_per_scenario", 4],
    ["environments", 3],
    ["independent_observers", 3],
  ]) {
    const migrationDrift = await commitMutation(`migration-${field}-drift`, async () => {
      await migrateCatalogToV2();
      const catalog = JSON.parse(await readFile(catalogPath, "utf8"));
      catalog.default_requirements[field] = value;
      await writeFile(catalogPath, `${JSON.stringify(catalog, null, 2)}\n`);
    });
    assert.throws(() => checkScenarioAuthority({ repo: fixture, base, candidate: migrationDrift }),
      /changed canonical catalog scoring or evidence requirements/);

    const v2Drift = await commitMutation(`v2-${field}-drift`, async () => {
      const catalog = JSON.parse(await readFile(catalogPath, "utf8"));
      catalog.default_requirements[field] = value;
      await writeFile(catalogPath, `${JSON.stringify(catalog, null, 2)}\n`);
    }, migration);
    assert.throws(() => checkScenarioAuthority({ repo: fixture, base: migration, candidate: v2Drift }),
      /changed canonical catalog scoring or evidence requirements/);
  }

  const split = await commitMutation("atomic-split", async () => {
    await appendSplit("ORC-05", ["ORC-07", "ORC-08"]);
  }, migration);
  const splitResult = checkScenarioAuthority({ repo: fixture, base: migration, candidate: split });
  assert.equal(splitResult.slots, 123);

  const oneChild = await commitMutation("one-child-split", async () => {
    await appendSplit("ORC-05", ["ORC-07"]);
  }, migration);
  assert.throws(() => checkScenarioAuthority({ repo: fixture, base: migration, candidate: oneChild }),
    /split requires at least two new children/);

  const missingChildSlot = await commitMutation("missing-child-slot", async () => {
    await appendSplit("ORC-05", ["ORC-07", "ORC-08"], "ORC-08/recovery");
  }, migration);
  assert.throws(() => checkScenarioAuthority({ repo: fixture, base: migration, candidate: missingChildSlot }),
    /scenario slots must equal the 123-slot capability catalog/);

  const changedCanonicalCapability = await commitMutation("changed-canonical-capability", async () => {
    const catalog = JSON.parse(await readFile(catalogPath, "utf8"));
    catalog.capabilities[0].name = "Rewritten authority";
    await writeFile(catalogPath, `${JSON.stringify(catalog, null, 2)}\n`);
  }, migration);
  assert.throws(() => checkScenarioAuthority({ repo: fixture, base: migration, candidate: changedCanonicalCapability }),
    /changed or reordered canonical capability KRN-01/);

  const deletedCanonicalCapability = await commitMutation("deleted-canonical-capability", async () => {
    const catalog = JSON.parse(await readFile(catalogPath, "utf8"));
    catalog.capabilities.pop();
    await writeFile(catalogPath, `${JSON.stringify(catalog, null, 2)}\n`);
  }, migration);
  assert.throws(() => checkScenarioAuthority({ repo: fixture, base: migration, candidate: deletedCanonicalCapability }),
    /deleted canonical capabilities/);

  const inheritedCase = await commitMutation("inherited-case", async () => {
    await appendSplit("ORC-05", ["ORC-07", "ORC-08"]);
    const design = JSON.parse(await readFile(designPath, "utf8"));
    const parentCase = design.scenarios.find((row) => row.capability_id === "ORC-05").case_id;
    design.scenarios.find((row) => row.capability_id === "ORC-07").case_id = parentCase;
    await writeFile(designPath, `${JSON.stringify(design, null, 2)}\n`);
  }, migration);
  assert.throws(() => checkScenarioAuthority({ repo: fixture, base: migration, candidate: inheritedCase }),
    /scenario design has duplicate identity/);

  const resplitParent = await commitMutation("resplit-parent", async () => {
    await appendSplit("ORC-05", ["ORC-09", "ORC-10"]);
  }, split);
  assert.throws(() => checkScenarioAuthority({ repo: fixture, base: split, candidate: resplitParent }),
    /must split one canonical terminal capability/);

  const selfParent = await commitMutation("self-parent", async () => {
    await appendSplit("ORC-05", ["ORC-07", "ORC-08"]);
    const catalog = JSON.parse(await readFile(catalogPath, "utf8"));
    catalog.capabilities.find((row) => row.id === "ORC-07").split_from = "ORC-07";
    await writeFile(catalogPath, `${JSON.stringify(catalog, null, 2)}\n`);
  }, migration);
  assert.throws(() => checkScenarioAuthority({ repo: fixture, base: migration, candidate: selfParent }),
    /split parent is invalid/);

  const cyclicLineage = await commitMutation("cyclic-lineage", async () => {
    const catalog = JSON.parse(await readFile(catalogPath, "utf8"));
    catalog.capabilities.find((row) => row.id === "KRN-01").split_from = "KRN-02";
    catalog.capabilities.find((row) => row.id === "KRN-02").split_from = "KRN-01";
    await writeFile(catalogPath, `${JSON.stringify(catalog, null, 2)}\n`);
  }, migration);
  assert.throws(() => checkScenarioAuthority({ repo: fixture, base: migration, candidate: cyclicLineage }),
    /capability lineage contains a cycle/);

  const multipleParents = await commitMutation("multiple-parents", async () => {
    const catalog = JSON.parse(await readFile(catalogPath, "utf8"));
    catalog.capabilities[0].split_from = ["KRN-02", "KRN-03"];
    await writeFile(catalogPath, `${JSON.stringify(catalog, null, 2)}\n`);
  }, migration);
  assert.throws(() => checkScenarioAuthority({ repo: fixture, base: migration, candidate: multipleParents }),
    /split_from is invalid/);

  const unverifiedAtomicity = await commitMutation("unverified-atomicity", async () => {
    const catalog = JSON.parse(await readFile(catalogPath, "utf8"));
    catalog.capabilities[0].atomicity = "atomic";
    await writeFile(catalogPath, `${JSON.stringify(catalog, null, 2)}\n`);
  }, migration);
  assert.throws(() => checkScenarioAuthority({ repo: fixture, base: migration, candidate: unverifiedAtomicity }),
    /atomicity requires a future independent authority consumer/);

  const addition = await commitMutation("addition", async () => {
    const design = JSON.parse(await readFile(designPath, "utf8"));
    const row = design.scenarios.find((entry) => entry.executable_suite === undefined);
    row.executable_suite = "golden";
    const golden = (await import("yaml")).parse(await readFile(goldenPath, "utf8"));
    const added = structuredClone(golden.find((testCase) => testCase.description.startsWith("[full]")));
    added.description = "[full] monotonic addition";
    added.metadata.observations.capability = { id: row.capability_id, scenario: row.scenario, case_id: row.case_id };
    golden.push(added);
    await writeFile(designPath, `${JSON.stringify(design, null, 2)}\n`);
    await writeFile(goldenPath, stringifyYaml(golden));
  });
  const additionResult = checkScenarioAuthority({ repo: fixture, base, candidate: addition });
  assert.equal(additionResult.candidateCases, additionResult.canonicalCases + 1);

  const fixedObserverAdmission = await commitMutation("fixed-observer-admission", async () => {
    const design = JSON.parse(await readFile(designPath, "utf8"));
    for (const row of design.scenarios.filter((entry) => entry.capability_id === "INS-01")) {
      row.authority_status = "implemented";
      row.missing_authority = null;
    }
    await writeFile(designPath, `${JSON.stringify(design, null, 2)}\n`);
  });
  checkScenarioAuthority({ repo: fixture, base, candidate: fixedObserverAdmission });

  const partialFixedObserverAdmission = await commitMutation("partial-fixed-observer-admission", async () => {
    const design = JSON.parse(await readFile(designPath, "utf8"));
    const rows = design.scenarios.filter((entry) => entry.capability_id === "INS-01");
    const row = rows[0];
    const canonicalImplemented = rows.every((entry) => entry.authority_status === "implemented");
    row.authority_status = canonicalImplemented ? "authority_unavailable" : "implemented";
    row.missing_authority = canonicalImplemented ? "scenario_consumer_binding" : null;
    await writeFile(designPath, `${JSON.stringify(design, null, 2)}\n`);
  });
  assert.throws(() => checkScenarioAuthority({ repo: fixture, base, candidate: partialFixedObserverAdmission }),
    /must admit all INS-01 fixed-observer scenarios atomically|changed canonical INS-01\/positive authority without an admitted fixed observer/);

  const partialFixedObserverDowngrade = await commitMutation("partial-fixed-observer-downgrade", async () => {
    const design = JSON.parse(await readFile(designPath, "utf8"));
    const row = design.scenarios.find((entry) => entry.capability_id === "INS-01");
    row.authority_status = "authority_unavailable";
    row.missing_authority = "scenario_consumer_binding";
    await writeFile(designPath, `${JSON.stringify(design, null, 2)}\n`);
  }, fixedObserverAdmission);
  assert.throws(() => checkScenarioAuthority({
    repo: fixture, base: fixedObserverAdmission, candidate: partialFixedObserverDowngrade,
  }), /changed canonical INS-01\/positive authority without an admitted fixed observer/);

  const inventedObserverAdmission = await commitMutation("invented-observer-admission", async () => {
    const design = JSON.parse(await readFile(designPath, "utf8"));
    const row = design.scenarios.find((entry) => entry.capability_id === "PLN-03");
    row.authority_status = "implemented";
    row.missing_authority = null;
    await writeFile(designPath, `${JSON.stringify(design, null, 2)}\n`);
  });
  assert.throws(() => checkScenarioAuthority({ repo: fixture, base, candidate: inventedObserverAdmission }),
    /authority without an admitted fixed observer/);

  const observerAndAuthorityChange = await commitMutation("observer-and-authority-change", async () => {
    const design = JSON.parse(await readFile(designPath, "utf8"));
    const row = design.scenarios.find((entry) => entry.capability_id === "INS-01");
    row.authority_status = "implemented";
    row.missing_authority = null;
    const observerPath = path.join(fixture, "scripts", "observe-install-capability.mjs");
    await writeFile(observerPath, `${await readFile(observerPath, "utf8")}\n// candidate observer drift\n`);
    await writeFile(designPath, `${JSON.stringify(design, null, 2)}\n`);
  });
  assert.throws(() => checkScenarioAuthority({ repo: fixture, base, candidate: observerAndAuthorityChange }),
    /changed protected scenario authority control scripts\/observe-install-capability\.mjs/);

  const selfTestDrift = await commitMutation("self-test-drift", async () => {
    const selfTestPath = path.join(fixture, "scripts", "self-test.mjs");
    await writeFile(selfTestPath, `${await readFile(selfTestPath, "utf8")}\n// candidate self-test drift\n`);
  });
  assert.throws(() => checkScenarioAuthority({ repo: fixture, base, candidate: selfTestDrift }),
    /changed protected scenario authority control scripts\/self-test\.mjs/);

  const scoreConsumerDrift = await commitMutation("score-consumer-drift", async () => {
    const consumerPath = path.join(fixture, "scripts", "consume-score-capability.mjs");
    await writeFile(consumerPath, `${await readFile(consumerPath, "utf8")}\n// candidate consumer drift\n`);
  });
  assert.throws(() => checkScenarioAuthority({ repo: fixture, base, candidate: scoreConsumerDrift }),
    /changed protected scenario authority control scripts\/consume-score-capability\.mjs/);

  const scoreConsumerWorkflowDrift = await commitMutation("score-consumer-workflow-drift", async () => {
    const workflowPath = path.join(fixture, ".github", "workflows", "consume-score-capability.yml");
    await writeFile(workflowPath, `${await readFile(workflowPath, "utf8")}\n# candidate consumer workflow drift\n`);
  });
  assert.throws(() => checkScenarioAuthority({ repo: fixture, base, candidate: scoreConsumerWorkflowDrift }),
    /changed protected scenario authority control \.github\/workflows\/consume-score-capability\.yml/);

  const malformedAddition = await commitMutation("malformed-addition", async () => {
    const design = JSON.parse(await readFile(designPath, "utf8"));
    const row = design.scenarios.find((entry) => entry.executable_suite === undefined);
    row.executable_suite = "golden";
    const golden = (await import("yaml")).parse(await readFile(goldenPath, "utf8"));
    golden.push({
      description: "[full] malformed addition",
      metadata: { observations: { capability: { id: row.capability_id, scenario: row.scenario, case_id: row.case_id } } },
    });
    await writeFile(designPath, `${JSON.stringify(design, null, 2)}\n`);
    await writeFile(goldenPath, stringifyYaml(golden));
  });
  assert.throws(() => checkScenarioAuthority({ repo: fixture, base, candidate: malformedAddition }),
    /requires prompt and assertions/);

  const thirdSmoke = await commitMutation("third-smoke", async () => {
    const design = JSON.parse(await readFile(designPath, "utf8"));
    const row = design.scenarios.find((entry) => entry.executable_suite === undefined);
    row.executable_suite = "golden";
    const golden = (await import("yaml")).parse(await readFile(goldenPath, "utf8"));
    const added = structuredClone(golden.find((testCase) => testCase.description.startsWith("[full]")));
    added.description = "[smoke] third smoke";
    added.metadata.observations.capability = { id: row.capability_id, scenario: row.scenario, case_id: row.case_id };
    golden.push(added);
    await writeFile(designPath, `${JSON.stringify(design, null, 2)}\n`);
    await writeFile(goldenPath, stringifyYaml(golden));
  });
  assert.throws(() => checkScenarioAuthority({ repo: fixture, base, candidate: thirdSmoke }),
    /must retain exactly two smoke cases/);

  const duplicateDescription = await commitMutation("duplicate-description", async () => {
    const design = JSON.parse(await readFile(designPath, "utf8"));
    const row = design.scenarios.find((entry) => entry.executable_suite === undefined);
    row.executable_suite = "golden";
    const golden = (await import("yaml")).parse(await readFile(goldenPath, "utf8"));
    const added = structuredClone(golden.find((testCase) => testCase.description.startsWith("[full]")));
    added.metadata.observations.capability = { id: row.capability_id, scenario: row.scenario, case_id: row.case_id };
    golden.push(added);
    await writeFile(designPath, `${JSON.stringify(design, null, 2)}\n`);
    await writeFile(goldenPath, stringifyYaml(golden));
  });
  assert.throws(() => checkScenarioAuthority({ repo: fixture, base, candidate: duplicateDescription }),
    /duplicate description/);

  const coordinatedDeletion = await commitMutation("coordinated-deletion", async () => {
    const design = JSON.parse(await readFile(designPath, "utf8"));
    const golden = (await import("yaml")).parse(await readFile(goldenPath, "utf8"));
    const removed = golden.shift().metadata.observations.capability.case_id;
    delete design.scenarios.find((row) => row.case_id === removed).executable_suite;
    await writeFile(designPath, `${JSON.stringify(design, null, 2)}\n`);
    await writeFile(goldenPath, stringifyYaml(golden));
  });
  assert.throws(() => checkScenarioAuthority({ repo: fixture, base, candidate: coordinatedDeletion }),
    /changed canonical .* executable suite/);

  const authorityDowngrade = await commitMutation("authority-downgrade", async () => {
    const design = JSON.parse(await readFile(designPath, "utf8"));
    const row = design.scenarios.find((entry) => entry.observer_kind === "external_authority");
    row.observer_kind = "native_thread";
    row.missing_authority = "host_native_provenance";
    await writeFile(designPath, `${JSON.stringify(design, null, 2)}\n`);
  });
  assert.throws(() => checkScenarioAuthority({ repo: fixture, base, candidate: authorityDowngrade }),
    /changed canonical .* observer_kind/);

  const weakenedCase = await commitMutation("weakened-case", async () => {
    const golden = (await import("yaml")).parse(await readFile(goldenPath, "utf8"));
    golden[0].assert.pop();
    await writeFile(goldenPath, stringifyYaml(golden));
  });
  assert.throws(() => checkScenarioAuthority({ repo: fixture, base, candidate: weakenedCase }),
    /requires deterministic assertions/);

  const catalogDrift = await commitMutation("catalog-drift", async () => {
    const catalogPath = path.join(fixture, "evals/capabilities.json");
    const catalog = JSON.parse(await readFile(catalogPath, "utf8"));
    catalog.capabilities[0].critical = false;
    await writeFile(catalogPath, `${JSON.stringify(catalog, null, 2)}\n`);
  });
  assert.throws(() => checkScenarioAuthority({ repo: fixture, base, candidate: catalogDrift }),
    /changed the canonical v1 capability catalog/);

  const topLevelScore = await commitMutation("top-level-score", async () => {
    const design = JSON.parse(await readFile(designPath, "utf8"));
    design.score = 9.5;
    await writeFile(designPath, `${JSON.stringify(design, null, 2)}\n`);
  });
  assert.throws(() => checkScenarioAuthority({ repo: fixture, base, candidate: topLevelScore }),
    /scenario design identity is invalid/);

  const weakenedControl = await commitMutation("weakened-control", async () => {
    const workflowPath = path.join(fixture, ".github/workflows/scenario-authority.yml");
    await writeFile(workflowPath, (await readFile(workflowPath, "utf8")).replace(
      "github.event.pull_request.base.sha", "github.event.pull_request.head.sha"));
  });
  assert.throws(() => checkScenarioAuthority({ repo: fixture, base, candidate: weakenedControl }),
    /changed protected scenario authority control/);
} finally {
  await rm(fixture, { recursive: true, force: true });
}

process.stdout.write("Canonical scenario authority tests passed.\n");
