import { createHash } from "node:crypto";
import { execFile } from "node:child_process";
import { readFile, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import process from "node:process";
import { promisify } from "node:util";
import { fileURLToPath } from "node:url";
import { rejectDuplicateJsonObjectMembers } from "./json.mjs";
import { verifyObservationFacts } from "./campaign-verifiers/install.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const execFileAsync = promisify(execFile);
const cleanEnvironment = Object.fromEntries(Object.entries(process.env).filter(([name]) =>
  !/^(?:GIT_|NODE_|DYLD_|LD_|GH_TOKEN$|GITHUB_TOKEN$)/i.test(name)));
const gitPath = process.platform === "win32" ? "C:\\Program Files\\Git\\cmd\\git.exe" : "/usr/bin/git";
const gitOptions = [
  "-c", "core.fsmonitor=false",
  "-c", "core.untrackedCache=false",
  ...(process.platform === "win32" ? ["-c", "core.autocrlf=true"] : []),
];
const gitEnvironment = {
  ...cleanEnvironment,
  GIT_CONFIG_GLOBAL: process.platform === "win32" ? "NUL" : os.devNull,
  GIT_CONFIG_NOSYSTEM: "1",
  GIT_NO_REPLACE_OBJECTS: "1",
  GIT_OPTIONAL_LOCKS: "0",
};
const oidPattern = /^[a-f0-9]{40}$/;
const runIdPattern = /^[1-9][0-9]{0,19}$/;
const shaPattern = /^sha256:[a-f0-9]{64}$/;

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

function exactKeys(value, expected, label) {
  if (!value || typeof value !== "object" || Array.isArray(value)) fail(`${label} must be an object`);
  const actual = Object.keys(value).sort();
  const wanted = [...expected].sort();
  if (actual.length !== wanted.length || actual.some((key, index) => key !== wanted[index])) {
    fail(`${label} has unknown or missing fields`);
  }
}

function parseUniqueJson(bytes, label) {
  const source = bytes.toString("utf8");
  rejectDuplicateJsonObjectMembers(source, label);
  try {
    return JSON.parse(source);
  } catch {
    fail(`${label} is not valid JSON`);
  }
}

function repositorySlug(value) {
  const match = String(value).match(/github\.com[/:]([^/]+)\/([^/]+?)(?:\.git)?$/i);
  if (!match) fail("consumer repository is not a GitHub repository");
  return `${match[1]}/${match[2]}`;
}

function normalizedRepository(value) {
  return String(value)
    .replace(/^git@github\.com:/, "https://github.com/")
    .replace(/^ssh:\/\/git@github\.com\//, "https://github.com/")
    .replace(/\.git$/, "");
}

function sha256(bytes) {
  return `sha256:${createHash("sha256").update(bytes).digest("hex")}`;
}

export function expectedInstallJobNames() {
  const names = [];
  for (const runner of ["Linux", "Windows"]) {
    for (const trial of [1, 2, 3]) {
      names.push(`observe-ins-01-${runner}-${trial}`);
      names.push(`attest-ins-01-${runner}-${trial}`);
    }
  }
  names.push("aggregate-ins-01", "attest-complete-ins-01-campaign");
  return names.sort();
}

async function boundedCampaignFile(campaignRoot, relative, label) {
  if (typeof relative !== "string" || !/^[A-Za-z0-9][A-Za-z0-9./-]{0,255}$/.test(relative) ||
      relative.includes("..")) fail(`${label} path is invalid`);
  const resolved = path.resolve(campaignRoot, relative);
  if (!resolved.startsWith(`${campaignRoot}${path.sep}`)) fail(`${label} escapes the campaign`);
  return readFile(resolved);
}

export async function validateCampaignEnvelope(campaign, { campaignRoot, cases, workflowId }) {
  exactKeys(campaign, ["schema", "content_sha256", "payload"], "INS-01 campaign envelope");
  exactKeys(campaign.payload, [
    "schema", "authority", "capability_id", "coverage", "environments", "observations",
    "observer", "result", "run", "scenarios", "subject",
  ], "INS-01 campaign payload");
  exactKeys(campaign.payload.observer, ["commit", "script_blob", "tree"], "INS-01 campaign observer");
  exactKeys(campaign.payload.subject, [
    "repository", "commit", "tree", "skill_tree", "codex_agents_tree", "codex_session_hook_blob",
    "installer_blob",
  ], "INS-01 campaign subject");
  exactKeys(campaign.payload.scenarios, ["negative", "positive", "recovery"], "INS-01 campaign scenarios");
  exactKeys(campaign.payload.run, ["attempt", "id", "number", "workflow_id"], "INS-01 campaign run");
  const expectedSlots = ["linux:1", "linux:2", "linux:3", "win32:1", "win32:2", "win32:3"];
  const observations = campaign.payload.observations;
  const actualSlots = Array.isArray(observations)
    ? observations.map((row) => {
      exactKeys(row, ["bundle_path", "bundle_sha256", "content_sha256", "environment", "trial_id"],
        "INS-01 campaign observation");
      if (!shaPattern.test(row.bundle_sha256) || !shaPattern.test(row.content_sha256) ||
          !/^[A-Za-z0-9][A-Za-z0-9./-]{0,255}$/.test(row.bundle_path) || row.bundle_path.includes("..")) {
        fail("INS-01 campaign observation identity is invalid");
      }
      return `${row.environment}:${row.trial_id}`;
    }).sort()
    : [];
  if (campaign.schema !== "pareto-capability-campaign-envelope/v1" ||
      campaign.content_sha256 !== sha256(Buffer.from(JSON.stringify(canonical(campaign.payload)))) ||
      campaign.payload.schema !== "pareto-capability-campaign/v2" ||
      campaign.payload.authority !== "github_attestation_subject" ||
      campaign.payload.capability_id !== "INS-01" || campaign.payload.result !== "pass" ||
      JSON.stringify(campaign.payload.coverage) !==
        JSON.stringify({ environments: ["linux", "win32"], trials_per_environment: 3 }) ||
      JSON.stringify(campaign.payload.environments) !== JSON.stringify(["linux", "win32"]) ||
      !runIdPattern.test(campaign.payload.run.id) || campaign.payload.run.number !== 1 ||
      campaign.payload.run.attempt !== 1 || campaign.payload.run.workflow_id !== workflowId ||
      JSON.stringify(actualSlots) !== JSON.stringify(expectedSlots) ||
      !oidPattern.test(campaign.payload.observer.commit) ||
      !oidPattern.test(campaign.payload.observer.script_blob) ||
      !oidPattern.test(campaign.payload.observer.tree) ||
      !oidPattern.test(campaign.payload.subject.commit) ||
      !oidPattern.test(campaign.payload.subject.tree) ||
      !oidPattern.test(campaign.payload.subject.skill_tree) ||
      !oidPattern.test(campaign.payload.subject.codex_agents_tree) ||
      !oidPattern.test(campaign.payload.subject.codex_session_hook_blob) ||
      !oidPattern.test(campaign.payload.subject.installer_blob) ||
      campaign.payload.subject.commit !== campaign.payload.observer.commit ||
      campaign.payload.subject.tree !== campaign.payload.observer.tree ||
      JSON.stringify(campaign.payload.scenarios) !== JSON.stringify(cases)) {
    fail("INS-01 campaign identity is invalid");
  }
  for (const row of observations) {
    const runner = row.environment === "linux" ? "Linux" : "Windows";
    const directory = `observations/ins-01-${runner}-${row.trial_id}`;
    if (row.bundle_path !== `${directory}/attestation.json`) {
      fail("INS-01 campaign observation path is invalid");
    }
    const observationBytes = await boundedCampaignFile(
      campaignRoot, `${directory}/observation-${runner}-${row.trial_id}.json`, "INS-01 observation",
    );
    const observation = parseUniqueJson(observationBytes, "INS-01 observation");
    exactKeys(observation, ["schema", "content_sha256", "payload"], "INS-01 observation envelope");
    exactKeys(observation.payload, [
      "schema", "authority", "capability_id", "environment", "observer", "result", "scenarios", "subject",
      "trial_id",
    ], "INS-01 observation payload");
    exactKeys(observation.payload.environment, ["arch", "codex_entry_sha256", "codex_user_agent", "node", "platform"],
      "INS-01 observation environment");
    if (observation.schema !== "pareto-capability-observation-envelope/v1" ||
        observation.content_sha256 !== sha256(Buffer.from(JSON.stringify(canonical(observation.payload)))) ||
        observation.content_sha256 !== row.content_sha256 ||
        observation.payload.schema !== "pareto-capability-observation/v2" ||
        observation.payload.authority !== "fixed_observer_real_consumer" ||
        observation.payload.capability_id !== "INS-01" || observation.payload.result !== "pass" ||
        observation.payload.environment.platform !== row.environment ||
        !shaPattern.test(observation.payload.environment.codex_entry_sha256) ||
        observation.payload.trial_id !== row.trial_id ||
        JSON.stringify(canonical(observation.payload.observer)) !==
          JSON.stringify(canonical(campaign.payload.observer)) ||
        JSON.stringify(canonical(observation.payload.subject)) !==
          JSON.stringify(canonical(campaign.payload.subject))) {
      fail("INS-01 campaign observation semantics are invalid");
    }
    const adapterResult = verifyObservationFacts({
      payload: observation.payload,
      capability_id: "INS-01",
      cases,
      parameters: { kind: "skill" },
    });
    if (adapterResult.schema !== "pareto-campaign-adapter-result/v1" ||
        !shaPattern.test(adapterResult.facts_sha256)) {
      fail("INS-01 campaign adapter result is invalid");
    }
    const bundleBytes = await boundedCampaignFile(campaignRoot, row.bundle_path, "INS-01 observation bundle");
    if (sha256(bundleBytes) !== row.bundle_sha256) fail("INS-01 observation bundle digest is invalid");
  }
  return { observer: campaign.payload.observer, run: campaign.payload.run, subject: campaign.payload.subject };
}

export function validateSourceRunMetadata(metadata, { sourceRunId, campaignCommit, campaignRun, repository }) {
  if (!runIdPattern.test(sourceRunId) || !oidPattern.test(campaignCommit) ||
      String(metadata?.id) !== sourceRunId || metadata?.name !== "observe-install-skill-capability" ||
      metadata?.path !== ".github/workflows/observe-install-skill-capability.yml" ||
      metadata?.event !== "workflow_dispatch" || metadata?.head_branch !== "main" ||
      metadata?.head_sha !== campaignCommit || metadata?.status !== "completed" ||
      metadata?.conclusion !== "success" || metadata?.run_number !== 1 || metadata?.run_attempt !== 1 ||
      String(metadata?.workflow_id) !== campaignRun?.workflow_id ||
      campaignRun?.id !== sourceRunId || campaignRun?.number !== metadata.run_number ||
      campaignRun?.attempt !== metadata.run_attempt ||
      metadata?.repository?.full_name?.toLowerCase() !== repositorySlug(repository).toLowerCase() ||
      metadata?.html_url !== `https://github.com/${metadata.repository.full_name}/actions/runs/${sourceRunId}`) {
    fail("source run metadata is invalid");
  }
  return {
    id: sourceRunId,
    number: 1,
    attempt: 1,
    workflow_id: campaignRun.workflow_id,
    repository: metadata.repository.full_name,
    workflow: metadata.path,
    event: metadata.event,
    head_branch: metadata.head_branch,
    head_sha: metadata.head_sha,
    conclusion: metadata.conclusion,
    url: metadata.html_url,
  };
}

export function validateAttestationVerification(bytes) {
  const lines = bytes.toString("utf8").trim().split(/\r?\n/);
  if (lines.length !== 7) fail("campaign attestation verification is incomplete");
  for (const [index, line] of lines.entries()) {
    rejectDuplicateJsonObjectMembers(line, `campaign attestation verification ${index + 1}`);
    let value;
    try {
      value = JSON.parse(line);
    } catch {
      fail("campaign attestation verification is invalid JSON");
    }
    if (!value || typeof value !== "object" || Array.isArray(value)) {
      fail("campaign attestation verification is invalid");
    }
    exactKeys(value, ["attestation", "verificationResult"],
      `campaign attestation verification ${index + 1}`);
  }
  return { count: 7, sha256: sha256(bytes) };
}

export function validateSourceRunJobs(pages, { sourceRunId }) {
  if (!Array.isArray(pages) || pages.length === 0 || pages.length > 4 || !runIdPattern.test(sourceRunId)) {
    fail("source run job inventory is invalid");
  }
  const jobs = [];
  for (const [index, page] of pages.entries()) {
    exactKeys(page, ["jobs", "total_count"], `source run jobs page ${index + 1}`);
    if (!Number.isInteger(page.total_count) || !Array.isArray(page.jobs)) {
      fail("source run job inventory page is invalid");
    }
    jobs.push(...page.jobs);
  }
  const expected = expectedInstallJobNames();
  if (pages.some((page) => page.total_count !== expected.length) || jobs.length !== expected.length) {
    fail("source run job inventory is incomplete or contains extra attempts");
  }
  const ids = new Set();
  const names = new Set();
  const summary = [];
  for (const job of jobs) {
    if (!Number.isInteger(job?.id) || job.id < 1 || ids.has(job.id) ||
        typeof job?.name !== "string" || names.has(job.name) || !expected.includes(job.name) ||
        String(job.run_id) !== sourceRunId || job.run_attempt !== 1 || job.status !== "completed" ||
        job.conclusion !== "success" || typeof job.started_at !== "string" ||
        typeof job.completed_at !== "string" || typeof job.html_url !== "string") {
      fail("source run job inventory contains a failed, duplicate, retried, or unknown job");
    }
    ids.add(job.id);
    names.add(job.name);
    summary.push({
      id: job.id,
      name: job.name,
      run_attempt: 1,
      status: job.status,
      conclusion: job.conclusion,
      started_at: job.started_at,
      completed_at: job.completed_at,
      url: job.html_url,
    });
  }
  if (JSON.stringify([...names].sort()) !== JSON.stringify(expected)) {
    fail("source run job inventory does not match the canonical attempt matrix");
  }
  return summary.sort((left, right) => left.name.localeCompare(right.name));
}

export function buildConsumptionReceipt({
  sourceRun, sourceRunMetadataSha256, sourceRunJobsSha256, attempts,
  campaignSha256, bundleSha256, attestationVerificationSha256, campaignObserver, consumer,
}) {
  if ([sourceRunMetadataSha256, sourceRunJobsSha256, campaignSha256, bundleSha256,
    attestationVerificationSha256]
    .every((value) => shaPattern.test(value)) === false ||
      !oidPattern.test(campaignObserver?.commit) || !oidPattern.test(campaignObserver?.tree) ||
      !oidPattern.test(consumer?.commit) || !oidPattern.test(consumer?.tree) ||
      ![consumer.workflow_blob, consumer.script_blob, consumer.scenario_blob].every((value) => oidPattern.test(value)) ||
      !Array.isArray(attempts) || attempts.length !== expectedInstallJobNames().length) {
    fail("install consumption receipt identity is invalid");
  }
  const payload = {
    schema: "pareto-install-capability-consumption/v1",
    source_run: {
      ...sourceRun,
      metadata_sha256: sourceRunMetadataSha256,
      jobs_sha256: sourceRunJobsSha256,
    },
    input: {
      artifact_name: `ins-01-v2-attested-${sourceRun.id}`,
      campaign_sha256: campaignSha256,
      bundle_sha256: bundleSha256,
      attestation_verification_sha256: attestationVerificationSha256,
      observer_commit: campaignObserver.commit,
      observer_tree: campaignObserver.tree,
    },
    attempts,
    consumer,
  };
  return {
    schema: "pareto-install-capability-consumption-envelope/v1",
    content_sha256: sha256(Buffer.from(JSON.stringify(canonical(payload)))),
    payload,
  };
}

async function git(...args) {
  const result = await execFileAsync(gitPath, [...gitOptions, "-C", root, ...args], {
    encoding: "utf8",
    env: gitEnvironment,
    timeout: 30_000,
  });
  return result.stdout.trim();
}

async function validateCampaignGitIdentity({ observer, subject, repository, scenarioDesign }) {
  if (!observer || !subject || typeof observer !== "object" || typeof subject !== "object") {
    fail("INS-01 campaign Git source is invalid");
  }
  const commit = await git("rev-parse", "HEAD");
  const sourceCommit = observer.commit;
  if (sourceCommit === commit || await git("cat-file", "-t", sourceCommit) !== "commit" ||
      await git("rev-parse", `${sourceCommit}^{tree}`) !== observer.tree) {
    fail("INS-01 campaign Git source is invalid");
  }
  await git("merge-base", "--is-ancestor", sourceCommit, commit).catch(() =>
    fail("INS-01 campaign is not an ancestor of its independent consumer"));
  const binding = scenarioDesign?.fixed_observers?.["INS-01"];
  const rows = scenarioDesign?.scenarios?.filter((row) => row.capability_id === "INS-01") ?? [];
  const cases = Object.fromEntries(rows.map((row) => [row.scenario, row.case_id]));
  if (binding?.protocol !== "install-skill-v2" || binding?.parameters?.kind !== "skill" ||
      !/^[1-9][0-9]{0,19}$/.test(binding.parameters.workflow_id) ||
      JSON.stringify(Object.keys(cases).sort()) !== JSON.stringify(["negative", "positive", "recovery"])) {
    fail("install-skill-v2 is not the canonical INS-01 binding");
  }
  const paths = [
    "evals/scenarios.json",
    "scripts/campaign-verifiers/install.mjs",
    "scripts/observe-install-capability.mjs",
    ".github/workflows/observe-install-skill-capability.yml",
    ".github/workflows/consume-install-capability.yml",
    "scripts/consume-install-capability.mjs",
    "scripts/json.mjs",
    "package.json",
    "package-lock.json",
    "skills/run-bounded-mission",
    "codex/agents",
    "codex/hooks/qoeop-trade-session-start.mjs",
    "scripts/install-codex.mjs",
  ];
  const sourceObjects = Object.fromEntries(await Promise.all(paths.map(async (objectPath) =>
    [objectPath, await git("rev-parse", `${sourceCommit}:${objectPath}`)])));
  const currentObjects = Object.fromEntries(await Promise.all(paths.map(async (objectPath) =>
    [objectPath, await git("rev-parse", `${commit}:${objectPath}`)])));
  if (JSON.stringify(sourceObjects) !== JSON.stringify(currentObjects) ||
      normalizedRepository(subject.repository).toLowerCase() !==
        normalizedRepository(repository).toLowerCase() ||
      subject.commit !== sourceCommit || subject.tree !== observer.tree ||
      observer.script_blob !== sourceObjects["scripts/observe-install-capability.mjs"] ||
      subject.skill_tree !== sourceObjects["skills/run-bounded-mission"] ||
      subject.codex_agents_tree !== sourceObjects["codex/agents"] ||
      subject.codex_session_hook_blob !== sourceObjects["codex/hooks/qoeop-trade-session-start.mjs"] ||
      subject.installer_blob !== sourceObjects["scripts/install-codex.mjs"]) {
    fail("INS-01 campaign controls or subject drifted before consumption");
  }
  return { cases, commit, sourceCommit, workflowId: binding.parameters.workflow_id };
}

async function consume({
  campaignDirectory, output, sourceRunId, sourceRunMetadata, sourceRunJobs,
  attestationVerification,
}) {
  const campaignRoot = path.resolve(campaignDirectory);
  const [campaignBytes, bundleBytes, metadataBytes, jobsBytes, verificationBytes, scenarioBytes,
    commit, tree, repository,
    workflowBlob, scriptBlob, scenarioBlob] = await Promise.all([
    readFile(path.join(campaignRoot, "ins-01-campaign.json")),
    readFile(path.join(campaignRoot, "ins-01-campaign-attestation.json")),
    readFile(path.resolve(sourceRunMetadata)),
    readFile(path.resolve(sourceRunJobs)),
    readFile(path.resolve(attestationVerification)),
    readFile(path.join(root, "evals", "scenarios.json")),
    git("rev-parse", "HEAD"),
    git("rev-parse", "HEAD^{tree}"),
    git("config", "--get", "remote.origin.url"),
    git("rev-parse", "HEAD:.github/workflows/consume-install-capability.yml"),
    git("rev-parse", "HEAD:scripts/consume-install-capability.mjs"),
    git("rev-parse", "HEAD:evals/scenarios.json"),
  ]);
  const campaign = parseUniqueJson(campaignBytes, "INS-01 campaign");
  const scenarioDesign = parseUniqueJson(scenarioBytes, "scenario authority");
  const preliminary = await validateCampaignGitIdentity({
    observer: campaign.payload?.observer,
    subject: campaign.payload?.subject,
    repository,
    scenarioDesign,
  });
  const { observer: campaignObserver, run: campaignRun } = await validateCampaignEnvelope(campaign, {
    campaignRoot,
    cases: preliminary.cases,
    workflowId: preliminary.workflowId,
  });
  const sourceRun = validateSourceRunMetadata(parseUniqueJson(metadataBytes, "source run metadata"), {
    sourceRunId,
    campaignCommit: campaignObserver.commit,
    campaignRun,
    repository,
  });
  const attempts = validateSourceRunJobs(parseUniqueJson(jobsBytes, "source run jobs"), { sourceRunId });
  const verified = validateAttestationVerification(verificationBytes);
  const receipt = buildConsumptionReceipt({
    sourceRun,
    sourceRunMetadataSha256: sha256(metadataBytes),
    sourceRunJobsSha256: sha256(jobsBytes),
    attempts,
    campaignSha256: sha256(campaignBytes),
    bundleSha256: sha256(bundleBytes),
    attestationVerificationSha256: verified.sha256,
    campaignObserver,
    consumer: {
      repository,
      commit,
      tree,
      workflow_blob: workflowBlob,
      script_blob: scriptBlob,
      scenario_blob: scenarioBlob,
    },
  });
  await writeFile(path.resolve(output), `${JSON.stringify(canonical(receipt), null, 2)}\n`, { flag: "wx" });
}

if (import.meta.main === true) {
  try {
    const args = process.argv.slice(2);
    if (args.length !== 12 || args[0] !== "--campaign-dir" || args[2] !== "--source-run-id" ||
        args[4] !== "--source-run-metadata" || args[6] !== "--source-run-jobs" ||
        args[8] !== "--attestation-verification" || args[10] !== "--output" ||
        args.filter((_, index) => index % 2 === 1).some((value) => !value)) {
      fail("usage: consume-install-capability.mjs --campaign-dir <path> --source-run-id <id> --source-run-metadata <path> --source-run-jobs <path> --attestation-verification <path> --output <path>");
    }
    await consume({
      campaignDirectory: args[1],
      sourceRunId: args[3],
      sourceRunMetadata: args[5],
      sourceRunJobs: args[7],
      attestationVerification: args[9],
      output: args[11],
    });
  } catch (error) {
    console.error(error instanceof Error ? error.message : String(error));
    process.exitCode = 1;
  }
}
