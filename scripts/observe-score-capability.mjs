#!/usr/bin/env node

import { spawnSync } from "node:child_process";
import { createHash, randomUUID } from "node:crypto";
import { lstat, readFile, readdir, realpath, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { rejectDuplicateJsonObjectMembers } from "./json.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const scorerPath = path.join(root, "scripts", "capability-score.mjs");
const catalogPath = path.join(root, "evals", "capabilities.json");
const capabilityId = "EVAL-02";
const expectedRepository = "https://github.com/qOeOp/pareto";
const trustedGit = process.platform === "win32" ? "C:\\Program Files\\Git\\cmd\\git.exe" : "/usr/bin/git";
const cases = Object.freeze({
  negative: "score-cannot-hide-failed-floor",
  positive: "signed-campaign-produces-bounded-report",
  recovery: "score-recovers-after-gap-removal",
});
const oidPattern = /^[a-f0-9]{40}$/;
const shaPattern = /^sha256:[a-f0-9]{64}$/;
const cleanEnvironment = Object.fromEntries(Object.entries(process.env).filter(([name]) =>
  !/^(?:GIT_|NODE_|DYLD_|LD_)/i.test(name)));
const gitEnvironment = {
  ...cleanEnvironment,
  GIT_CONFIG_GLOBAL: process.platform === "win32" ? "NUL" : os.devNull,
  GIT_CONFIG_NOSYSTEM: "1",
  GIT_NO_REPLACE_OBJECTS: "1",
  GIT_OPTIONAL_LOCKS: "0",
};

export function trustedGitOptions(platform = process.platform) {
  return [
    "-c", "core.fsmonitor=false",
    "-c", "core.untrackedCache=false",
    ...(platform === "win32" ? ["-c", "core.autocrlf=true"] : []),
  ];
}

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

function parseJson(bytes, label) {
  rejectDuplicateJsonObjectMembers(bytes.toString("utf8"), label);
  try {
    return JSON.parse(bytes);
  } catch {
    fail(`${label} is not valid JSON`);
  }
}

function run(command, args, options = {}) {
  const result = spawnSync(command, args, {
    cwd: options.cwd,
    encoding: "utf8",
    env: options.env ?? cleanEnvironment,
    maxBuffer: 8 * 1024 * 1024,
    timeout: options.timeout ?? 180_000,
  });
  return {
    error: result.error?.code ?? null,
    signal: result.signal ?? null,
    status: result.status,
    stderr: result.stderr ?? "",
    stdout: result.stdout ?? "",
  };
}

function git(...args) {
  const result = run(trustedGit, [
    ...trustedGitOptions(), "-C", root, ...args,
  ], { env: gitEnvironment, timeout: 30_000 });
  if (result.status !== 0 || result.error || result.signal) fail("observer Git identity is unavailable");
  return result.stdout.trim();
}

function gitBytes(...args) {
  const result = spawnSync(trustedGit, [...trustedGitOptions(), "-C", root, ...args], {
    encoding: null,
    env: gitEnvironment,
    maxBuffer: 2 * 1024 * 1024,
    timeout: 30_000,
  });
  if (result.status !== 0 || result.error || result.signal || !Buffer.isBuffer(result.stdout)) {
    fail("observer Git blob authority is unavailable");
  }
  return result.stdout;
}

export function committedCatalogBytes(commit) {
  if (!oidPattern.test(commit)) fail("observer commit identity is invalid");
  const bytes = gitBytes("show", `${commit}:evals/capabilities.json`);
  if (bytes.length < 1 || bytes.length > 1024 * 1024) fail("capability catalog blob is invalid");
  return bytes;
}

function normalizedRepository(value) {
  return value
    .replace(/^git@github\.com:/, "https://github.com/")
    .replace(/^ssh:\/\/git@github\.com\//, "https://github.com/")
    .replace(/\.git$/, "");
}

function observerIdentity() {
  const identity = {
    commit: git("rev-parse", "HEAD"),
    script_blob: git("rev-parse", "HEAD:scripts/observe-score-capability.mjs"),
    tree: git("rev-parse", "HEAD^{tree}"),
  };
  if (!Object.values(identity).every((value) => oidPattern.test(value)) ||
      normalizedRepository(git("remote", "get-url", "origin")) !== expectedRepository ||
      git("status", "--porcelain=v1", "--untracked-files=all")) {
    fail("observer checkout identity is invalid");
  }
  const ancestry = run(trustedGit, [
    ...trustedGitOptions(), "-C", root,
    "merge-base", "--is-ancestor", identity.commit, "refs/remotes/origin/main",
  ], { env: gitEnvironment, timeout: 30_000 });
  if (ancestry.status !== 0 || ancestry.error || ancestry.signal) fail("observer commit is not canonical main history");
  return identity;
}

function subjectIdentity(observer) {
  const identity = {
    repository: expectedRepository,
    commit: observer.commit,
    tree: observer.tree,
    scorer_blob: git("rev-parse", "HEAD:scripts/capability-score.mjs"),
    catalog_blob: git("rev-parse", "HEAD:evals/capabilities.json"),
    contract_blob: git("rev-parse", "HEAD:evals/CONTRACT.md"),
  };
  if (!Object.values(identity).slice(1).every((value) => oidPattern.test(value))) {
    fail("scoring subject identity is invalid");
  }
  return identity;
}

async function safeFile(directory, name, label, maximum = 32 * 1024 * 1024) {
  const directoryReal = await realpath(directory);
  const file = path.resolve(directoryReal, name);
  const directInfo = await lstat(file).catch(() => null);
  const resolved = await realpath(file).catch(() => "");
  const info = resolved ? await lstat(resolved).catch(() => null) : null;
  const relative = resolved ? path.relative(directoryReal, resolved) : "";
  if (!directInfo?.isFile() || directInfo.isSymbolicLink() || !info?.isFile() || info.isSymbolicLink() ||
      info.size < 1 || info.size > maximum || !relative || relative.startsWith(`..${path.sep}`) || path.isAbsolute(relative)) {
    fail(`${label} is missing or unsafe`);
  }
  return { bytes: await readFile(resolved), path: resolved };
}

function capability(report, id) {
  const rows = report.capabilities;
  if (!Array.isArray(rows)) fail("scorer report capabilities are invalid");
  const matches = rows.filter((row) => row?.id === id);
  if (matches.length !== 1) fail(`scorer report lacks exact ${id} capability`);
  return matches[0];
}

export function validateObservedScoreReport(report, candidate, mode, catalog, catalogSha256) {
  exactKeys(report, [
    "below_target", "candidate", "capabilities", "catalog_sha256", "critical_breaches", "eligible",
    "evidence_ceiling", "evidence_limit", "minimum_score", "schema_version", "target_score", "weighted_score",
  ], "scorer report");
  const catalogRows = catalog?.capabilities;
  if (!Array.isArray(catalogRows) || catalogRows.length !== 39 ||
      new Set(catalogRows.map((row) => row?.id)).size !== catalogRows.length) {
    fail("capability catalog inventory is invalid");
  }
  if (JSON.stringify(canonical(report.candidate)) !== JSON.stringify(canonical(candidate)) || report.schema_version !== 2 ||
      report.catalog_sha256 !== catalogSha256 || report.target_score !== catalog.target_score ||
      report.evidence_ceiling !== 8 || report.minimum_score !== 0 || report.eligible !== false ||
      report.evidence_limit !== "repeated_attested_fixed_observer_campaign; independent_observer_process_isolation_and_provider_attempt_inventory_unavailable") {
    fail("scorer report global gate is invalid");
  }
  const expectedCapabilityIds = catalogRows.map((row) => row.id).sort();
  const actualCapabilityIds = report.capabilities.map((row) => row?.id).sort();
  if (JSON.stringify(actualCapabilityIds) !== JSON.stringify(expectedCapabilityIds) ||
      JSON.stringify([...report.below_target].sort()) !== JSON.stringify(expectedCapabilityIds) ||
      JSON.stringify([...report.critical_breaches].sort()) !==
        JSON.stringify(catalogRows.filter((row) => row.critical).map((row) => row.id).sort())) {
    fail("scorer report capability inventory is invalid");
  }
  const catalogById = new Map(catalogRows.map((row) => [row.id, row]));
  for (const row of report.capabilities) {
    exactKeys(row, [
      "attested_campaign_count", "consumer", "critical", "domain", "gap_count", "id", "maturity", "name",
      "observation_count", "owner", "reason", "score", "unavailable_count", "weight",
    ], `scorer report capability ${row.id}`);
    const definition = catalogById.get(row.id);
    const install = row.id === "INS-01";
    const expected = install && mode === "positive"
      ? { score: 8, maturity: "representative", reason: "repeated_attested_fixed_observer_campaign", gap_count: 0 }
      : install && mode === "negative"
        ? { score: 0, maturity: "contradicted", reason: "critical_gap", gap_count: 1 }
        : { score: 0, maturity: "absent", reason: "no_passing_evidence", gap_count: 0 };
    if (["domain", "name", "owner", "consumer", "weight", "critical"].some((key) => row[key] !== definition[key]) ||
        row.score !== expected.score || row.maturity !== expected.maturity || row.reason !== expected.reason ||
        row.observation_count !== 0 || row.attested_campaign_count !== (install ? 1 : 0) ||
        row.unavailable_count !== 0 || row.gap_count !== expected.gap_count) {
      fail(`scorer report capability ${row.id} is invalid`);
    }
  }
  const totalWeight = catalogRows.reduce((sum, row) => sum + row.weight, 0);
  const expectedWeightedScore = mode === "positive"
    ? Number((8 * catalogById.get("INS-01").weight / totalWeight).toFixed(3))
    : 0;
  if (report.weighted_score !== expectedWeightedScore) fail("scorer report weighted score is invalid");
  return report;
}

async function runScorer(inputDir, evidence) {
  const evidencePath = path.join(inputDir, `.eval-02-${randomUUID()}.json`);
  await writeFile(evidencePath, `${JSON.stringify(canonical(evidence))}\n`, { flag: "wx" });
  try {
    const result = run(process.execPath, [scorerPath, evidencePath], { cwd: root });
    return result;
  } finally {
    await rm(evidencePath, { force: true });
  }
}

function parsedReport(result, candidate, mode, catalog, catalogSha256) {
  if (result.status !== 1 || result.error || result.signal || result.stderr !== "" || result.stdout.length === 0) {
    fail(`scorer ${mode} process result is invalid`);
  }
  return validateObservedScoreReport(
    parseJson(Buffer.from(result.stdout), `scorer ${mode} report`), candidate, mode, catalog, catalogSha256,
  );
}

async function observe({ sourceCampaignDir, output }) {
  const observer = observerIdentity();
  const subject = subjectIdentity(observer);
  const campaign = await safeFile(sourceCampaignDir, "ins-01-campaign.json", "source campaign");
  const bundle = await safeFile(sourceCampaignDir, "ins-01-campaign-attestation.json", "source campaign attestation");
  parseJson(campaign.bytes, "source campaign");
  parseJson(bundle.bytes, "source campaign attestation");
  const catalogBytes = committedCatalogBytes(observer.commit);
  const catalogValue = parseJson(catalogBytes, "capability catalog");
  const catalogSha256 = digest(catalogBytes);
  const candidate = { repository: expectedRepository, commit: subject.commit, tree: subject.tree };
  const baseEvidence = {
    schema_version: 2,
    catalog_sha256: catalogSha256,
    candidate,
    attempt_inventory: { status: "unavailable", locator: "provider-attested complete attempt inventory unavailable" },
    observations: [],
    attested_campaigns: [{
      campaign_path: path.basename(campaign.path),
      campaign_sha256: digest(campaign.bytes),
      bundle_path: path.basename(bundle.path),
      bundle_sha256: digest(bundle.bytes),
    }],
    open_gaps: [],
  };
  const positive = parsedReport(
    await runScorer(sourceCampaignDir, baseEvidence), candidate, "positive", catalogValue, catalogSha256,
  );
  const negativeEvidence = structuredClone(baseEvidence);
  negativeEvidence.open_gaps.push({
    capability_id: "INS-01",
    severity: "critical",
    description: "EVAL-02 synthetic critical-floor control",
    locator: "observe-score-capability:critical-floor-control",
  });
  const negative = parsedReport(
    await runScorer(sourceCampaignDir, negativeEvidence), candidate, "negative", catalogValue, catalogSha256,
  );
  const unknownFieldEvidence = { ...structuredClone(baseEvidence), score: 9.5 };
  const unknown = await runScorer(sourceCampaignDir, unknownFieldEvidence);
  if (unknown.status !== 1 || unknown.error || unknown.signal || unknown.stdout !== "" ||
      unknown.stderr !== "evidence has unknown or missing fields\n") {
    fail("scorer unknown-score-field control did not fail closed");
  }
  const recovery = parsedReport(
    await runScorer(sourceCampaignDir, baseEvidence), candidate, "positive", catalogValue, catalogSha256,
  );
  if (JSON.stringify(canonical(recovery)) !== JSON.stringify(canonical(positive))) {
    fail("scorer recovery did not reproduce the original report");
  }
  const input = {
    campaign_sha256: digest(campaign.bytes),
    bundle_sha256: digest(bundle.bytes),
  };
  const payload = canonical({
    schema: "pareto-capability-observation/v3",
    admission: "bootstrap_only",
    authority: "fixed_observer_real_consumer",
    capability_id: capabilityId,
    environment: { arch: os.arch(), node: process.version, platform: process.platform },
    input,
    observer,
    result: "pass",
    scenarios: {
      negative: {
        case_id: cases.negative,
        critical_floor_report_sha256: digest(Buffer.from(JSON.stringify(canonical(negative)))),
        result: "pass",
        unknown_score_diagnostic_sha256: digest(Buffer.from(unknown.stderr)),
      },
      positive: {
        case_id: cases.positive,
        eligible: positive.eligible,
        evidence_ceiling: positive.evidence_ceiling,
        ins_01_score: capability(positive, "INS-01").score,
        minimum_score: positive.minimum_score,
        report_sha256: digest(Buffer.from(JSON.stringify(canonical(positive)))),
        result: "pass",
      },
      recovery: {
        case_id: cases.recovery,
        report_sha256: digest(Buffer.from(JSON.stringify(canonical(recovery)))),
        result: "pass",
      },
    },
    subject,
    trial_id: 1,
  });
  const envelope = canonical({
    schema: "pareto-capability-observation-envelope/v1",
    content_sha256: digest(Buffer.from(JSON.stringify(payload))),
    payload,
  });
  await writeFile(output, `${JSON.stringify(envelope)}\n`, { flag: "wx" });
}

function validateObservation(envelope, observer) {
  exactKeys(envelope, ["content_sha256", "payload", "schema"], "EVAL-02 observation envelope");
  const payload = envelope.payload;
  if (envelope.schema !== "pareto-capability-observation-envelope/v1" ||
      envelope.content_sha256 !== digest(Buffer.from(JSON.stringify(canonical(payload))))) {
    fail("EVAL-02 observation envelope is invalid");
  }
  exactKeys(payload, [
    "admission", "authority", "capability_id", "environment", "input", "observer", "result", "scenarios", "schema", "subject", "trial_id",
  ], "EVAL-02 observation");
  exactKeys(payload.environment, ["arch", "node", "platform"], "EVAL-02 observation environment");
  exactKeys(payload.input, ["bundle_sha256", "campaign_sha256"], "EVAL-02 observation input");
  exactKeys(payload.observer, ["commit", "script_blob", "tree"], "EVAL-02 observation observer");
  exactKeys(payload.subject, ["catalog_blob", "commit", "contract_blob", "repository", "scorer_blob", "tree"], "EVAL-02 observation subject");
  exactKeys(payload.scenarios, ["negative", "positive", "recovery"], "EVAL-02 observation scenarios");
  exactKeys(payload.scenarios.negative,
    ["case_id", "critical_floor_report_sha256", "result", "unknown_score_diagnostic_sha256"],
    "EVAL-02 negative scenario");
  exactKeys(payload.scenarios.positive,
    ["case_id", "eligible", "evidence_ceiling", "ins_01_score", "minimum_score", "report_sha256", "result"],
    "EVAL-02 positive scenario");
  exactKeys(payload.scenarios.recovery, ["case_id", "report_sha256", "result"], "EVAL-02 recovery scenario");
  if (payload.schema !== "pareto-capability-observation/v3" || payload.admission !== "bootstrap_only" ||
      payload.authority !== "fixed_observer_real_consumer" ||
      payload.capability_id !== capabilityId || payload.result !== "pass" ||
      JSON.stringify(payload.observer) !== JSON.stringify(observer) || payload.subject.commit !== observer.commit ||
      payload.trial_id !== 1 || !["linux", "win32"].includes(payload.environment?.platform) ||
      !shaPattern.test(payload.input?.campaign_sha256) || !shaPattern.test(payload.input?.bundle_sha256) ||
      payload.subject.repository !== expectedRepository ||
      !Object.values(payload.observer).every((value) => oidPattern.test(value)) ||
      !["catalog_blob", "commit", "contract_blob", "scorer_blob", "tree"]
        .every((key) => oidPattern.test(payload.subject[key])) ||
      payload.scenarios.negative.case_id !== cases.negative ||
      !shaPattern.test(payload.scenarios.negative.critical_floor_report_sha256) ||
      !shaPattern.test(payload.scenarios.negative.unknown_score_diagnostic_sha256) ||
      payload.scenarios.positive.case_id !== cases.positive || payload.scenarios.positive.eligible !== false ||
      payload.scenarios.positive.evidence_ceiling !== 8 || payload.scenarios.positive.ins_01_score !== 8 ||
      payload.scenarios.positive.minimum_score !== 0 || !shaPattern.test(payload.scenarios.positive.report_sha256) ||
      payload.scenarios.recovery.case_id !== cases.recovery ||
      payload.scenarios.recovery.report_sha256 !== payload.scenarios.positive.report_sha256 ||
      Object.values(payload.scenarios).some((scenario) => scenario.result !== "pass")) {
    fail("EVAL-02 observation semantics are invalid");
  }
  return payload;
}

async function aggregate({ inputDir, output }) {
  const observer = observerIdentity();
  const directories = (await readdir(inputDir, { withFileTypes: true }))
    .filter((entry) => entry.isDirectory() && !entry.isSymbolicLink())
    .sort((left, right) => left.name.localeCompare(right.name));
  if (directories.length !== 2) fail("EVAL-02 campaign requires exactly two attested observations");
  const rows = [];
  for (const directory of directories) {
    const directoryPath = path.join(inputDir, directory.name);
    const files = (await readdir(directoryPath)).sort();
    const observationNames = files.filter((name) => /^observation-(?:Linux|Windows)-1\.json$/.test(name));
    if (files.length !== 2 || observationNames.length !== 1 || !files.includes("attestation.json")) {
      fail("EVAL-02 campaign input is incomplete");
    }
    const observationFile = await safeFile(directoryPath, observationNames[0], "EVAL-02 observation", 4 * 1024 * 1024);
    const envelope = parseJson(observationFile.bytes, "EVAL-02 observation");
    const payload = validateObservation(envelope, observer);
    const attestation = await safeFile(directoryPath, "attestation.json", "EVAL-02 observation attestation", 4 * 1024 * 1024);
    const bundle = parseJson(attestation.bytes, "EVAL-02 observation attestation");
    exactKeys(bundle, ["dsseEnvelope", "mediaType", "verificationMaterial"], "EVAL-02 observation attestation");
    if (bundle.mediaType !== "application/vnd.dev.sigstore.bundle.v0.3+json") fail("EVAL-02 attestation media type is invalid");
    rows.push({
      bundle_path: path.posix.join(path.basename(inputDir), directory.name, "attestation.json"),
      bundle_sha256: digest(attestation.bytes),
      content_sha256: envelope.content_sha256,
      environment: payload.environment.platform,
      input: payload.input,
      subject: payload.subject,
      trial_id: payload.trial_id,
    });
  }
  const slots = rows.map((row) => `${row.environment}:${row.trial_id}`).sort();
  const expected = ["linux:1", "win32:1"];
  if (JSON.stringify(slots) !== JSON.stringify(expected) ||
      rows.some((row) => JSON.stringify(row.subject) !== JSON.stringify(rows[0].subject) ||
        JSON.stringify(row.input) !== JSON.stringify(rows[0].input))) {
    fail("EVAL-02 campaign lacks exact coverage for one subject and input");
  }
  const payload = canonical({
    schema: "pareto-capability-campaign/v2",
    admission: "bootstrap_only",
    authority: "github_attestation_subject",
    capability_id: capabilityId,
    coverage: { environments: ["linux", "win32"], trials_per_environment: 1 },
    environments: ["linux", "win32"],
    observations: rows.map(({ bundle_path, bundle_sha256, content_sha256, environment, trial_id }) => ({
      bundle_path, bundle_sha256, content_sha256, environment, trial_id,
    })).sort((left, right) => left.environment.localeCompare(right.environment) || left.trial_id - right.trial_id),
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
    if (!value || !["--source-campaign-dir", "--input-dir", "--output"].includes(flag) || flag in options) {
      fail(`unsupported, duplicate, or incomplete argument: ${flag ?? "<missing>"}`);
    }
    options[flag] = value;
  }
  if (!options["--output"]) fail("--output is required");
  const observing = options["--source-campaign-dir"] !== undefined;
  const aggregating = options["--input-dir"] !== undefined;
  if (observing === aggregating) {
    fail("choose one complete observation or aggregation mode");
  }
  return {
    sourceCampaignDir: observing ? path.resolve(options["--source-campaign-dir"]) : undefined,
    inputDir: aggregating ? path.resolve(options["--input-dir"]) : undefined,
    output: path.resolve(options["--output"]),
  };
}

const invokedAsMain = process.argv[1] &&
  await realpath(path.resolve(process.argv[1])).catch(() => "") === await realpath(fileURLToPath(import.meta.url));
if (invokedAsMain) {
  try {
    const options = parseArguments(process.argv.slice(2));
    if (options.inputDir) await aggregate(options);
    else await observe(options);
  } catch (error) {
    process.stderr.write(`${error.message}\n`);
    process.exitCode = 1;
  }
}
