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
    ".github/workflows/observe-score-capability.yml", "scripts/check-scenario-authority.mjs",
    "scripts/self-test.mjs", "scripts/validate.mjs", "scripts/capability-score.mjs", "scripts/observe-install-capability.mjs",
    "scripts/observe-score-capability.mjs", "scripts/json.mjs",
    "package.json", "package-lock.json",
  ]) {
    const target = path.join(fixture, file);
    await mkdir(path.dirname(target), { recursive: true });
    await writeFile(target, await readFile(path.join(root, file)));
  }
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
    /changed the canonical capability catalog/);

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
