import { createHash, randomUUID } from "node:crypto";
import { execFile } from "node:child_process";
import { readFile, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import process from "node:process";
import { promisify } from "node:util";
import { fileURLToPath } from "node:url";
import { rejectDuplicateJsonObjectMembers } from "./json.mjs";

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
const shaPattern = /^sha256:[a-f0-9]{64}$/;
const oidPattern = /^[a-f0-9]{40}$/;
const runIdPattern = /^[1-9][0-9]{0,19}$/;

function fail(message) {
  throw new Error(message);
}

function sha256(bytes) {
  return `sha256:${createHash("sha256").update(bytes).digest("hex")}`;
}

function canonical(value) {
  if (Array.isArray(value)) return value.map(canonical);
  if (value && typeof value === "object") {
    return Object.fromEntries(Object.keys(value).sort().map((key) => [key, canonical(value[key])]));
  }
  return value;
}

function repositorySlug(value) {
  const match = String(value).match(/github\.com[/:]([^/]+)\/([^/]+?)(?:\.git)?$/i);
  if (!match) fail("consumer repository is not a GitHub repository");
  return `${match[1]}/${match[2]}`;
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

export function buildEvidenceManifest({ bundleSha256, campaignSha256, candidate, catalogSha256 }) {
  if (!shaPattern.test(bundleSha256) || !shaPattern.test(campaignSha256) || !shaPattern.test(catalogSha256) ||
      !candidate || typeof candidate.repository !== "string" ||
      !/^[a-f0-9]{40}$/.test(candidate.commit) || !/^[a-f0-9]{40}$/.test(candidate.tree)) {
    fail("campaign consumer identity is invalid");
  }
  return {
    schema_version: 2,
    catalog_sha256: catalogSha256,
    candidate,
    attempt_inventory: {
      status: "unavailable",
      locator: "provider-attested complete attempt inventory unavailable",
    },
    observations: [],
    attested_campaigns: [{
      campaign_path: "eval-02-campaign.json",
      campaign_sha256: campaignSha256,
      bundle_path: "eval-02-campaign-attestation.json",
      bundle_sha256: bundleSha256,
    }],
    open_gaps: [],
  };
}

export function validateSourceRunMetadata(metadata, { sourceRunId, campaignCommit, repository }) {
  if (!runIdPattern.test(sourceRunId) || !oidPattern.test(campaignCommit) ||
      String(metadata?.id) !== sourceRunId || metadata?.name !== "observe-score-capability" ||
      metadata?.path !== ".github/workflows/observe-score-capability.yml" ||
      metadata?.event !== "workflow_dispatch" || metadata?.head_branch !== "main" ||
      metadata?.head_sha !== campaignCommit || metadata?.status !== "completed" ||
      metadata?.conclusion !== "success" || !Number.isInteger(metadata?.run_attempt) || metadata.run_attempt < 1 ||
      metadata?.repository?.full_name?.toLowerCase() !== repositorySlug(repository).toLowerCase() ||
      metadata?.html_url !== `https://github.com/${metadata.repository.full_name}/actions/runs/${sourceRunId}`) {
    fail("source run metadata is invalid");
  }
  return {
    id: sourceRunId,
    attempt: metadata.run_attempt,
    repository: metadata.repository.full_name,
    workflow: metadata.path,
    event: metadata.event,
    head_branch: metadata.head_branch,
    head_sha: metadata.head_sha,
    conclusion: metadata.conclusion,
    url: metadata.html_url,
  };
}

export function buildConsumptionReceipt({
  sourceRun, sourceRunMetadataSha256, campaignSha256, bundleSha256, campaignObserver,
  consumer, report, reportSha256,
}) {
  if (!shaPattern.test(sourceRunMetadataSha256) || !shaPattern.test(campaignSha256) ||
      !shaPattern.test(bundleSha256) || !shaPattern.test(reportSha256) ||
      !oidPattern.test(campaignObserver?.commit) || !oidPattern.test(campaignObserver?.tree) ||
      !oidPattern.test(consumer?.commit) || !oidPattern.test(consumer?.tree) ||
      ![consumer.workflow_blob, consumer.script_blob, consumer.scorer_blob, consumer.catalog_blob]
        .every((value) => oidPattern.test(value))) {
    fail("consumption receipt identity is invalid");
  }
  const payload = {
    schema: "pareto-score-capability-consumption/v1",
    source_run: { ...sourceRun, metadata_sha256: sourceRunMetadataSha256 },
    input: {
      artifact_name: `eval-02-attested-${sourceRun.id}`,
      campaign_sha256: campaignSha256,
      bundle_sha256: bundleSha256,
      observer_commit: campaignObserver.commit,
      observer_tree: campaignObserver.tree,
    },
    consumer,
    report: { sha256: reportSha256, value: report },
  };
  return {
    schema: "pareto-score-capability-consumption-envelope/v1",
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

async function consume({ campaignDirectory, output, sourceRunId, sourceRunMetadata }) {
  const campaignRoot = path.resolve(campaignDirectory);
  const outputPath = path.resolve(output);
  const [campaignBytes, bundleBytes, catalogBytes, sourceRunMetadataBytes, commit, tree, repository,
    workflowBlob, scriptBlob, scorerBlob, catalogBlob] = await Promise.all([
    readFile(path.join(campaignRoot, "eval-02-campaign.json")),
    readFile(path.join(campaignRoot, "eval-02-campaign-attestation.json")),
    readFile(path.join(root, "evals", "capabilities.json")),
    readFile(path.resolve(sourceRunMetadata)),
    git("rev-parse", "HEAD"),
    git("rev-parse", "HEAD^{tree}"),
    git("config", "--get", "remote.origin.url"),
    git("rev-parse", "HEAD:.github/workflows/consume-score-capability.yml"),
    git("rev-parse", "HEAD:scripts/consume-score-capability.mjs"),
    git("rev-parse", "HEAD:scripts/capability-score.mjs"),
    git("rev-parse", "HEAD:evals/capabilities.json"),
  ]);
  const catalog = parseUniqueJson(catalogBytes, "capability catalog");
  const campaign = parseUniqueJson(campaignBytes, "EVAL-02 campaign");
  exactKeys(campaign, ["schema", "content_sha256", "payload"], "EVAL-02 campaign envelope");
  exactKeys(campaign.payload?.observer, ["commit", "script_blob", "tree"], "EVAL-02 campaign observer");
  const candidate = { repository, commit, tree };
  const sourceRun = validateSourceRunMetadata(parseUniqueJson(sourceRunMetadataBytes, "source run metadata"), {
    sourceRunId,
    campaignCommit: campaign.payload.observer.commit,
    repository,
  });
  const evidence = buildEvidenceManifest({
    bundleSha256: sha256(bundleBytes),
    campaignSha256: sha256(campaignBytes),
    candidate,
    catalogSha256: sha256(catalogBytes),
  });
  const evidencePath = path.join(campaignRoot, `.consume-${process.pid}-${randomUUID()}.json`);
  try {
    await writeFile(evidencePath, `${JSON.stringify(evidence, null, 2)}\n`, { encoding: "utf8", flag: "wx" });
    let result;
    try {
      result = await execFileAsync(process.execPath, [
        path.join(root, "scripts", "capability-score.mjs"), "--consume-attested-campaign", evidencePath,
      ], {
        cwd: root,
        encoding: "utf8",
        env: cleanEnvironment,
        timeout: 120_000,
        maxBuffer: 16 * 1024 * 1024,
      });
      fail("global capability gate unexpectedly passed");
    } catch (error) {
      if (error?.code !== 1 || error?.signal || error?.stderr !== "" || typeof error?.stdout !== "string") throw error;
      result = error;
    }
    const reportBytes = Buffer.from(result.stdout, "utf8");
    const report = parseUniqueJson(reportBytes, "consumed score report");
    exactKeys(report, [
      "below_target", "candidate", "capabilities", "catalog_sha256", "critical_breaches", "eligible",
      "evidence_ceiling", "evidence_limit", "minimum_score", "schema_version", "target_score", "weighted_score",
    ], "consumed score report");
    const receipt = buildConsumptionReceipt({
      sourceRun,
      sourceRunMetadataSha256: sha256(sourceRunMetadataBytes),
      campaignSha256: sha256(campaignBytes),
      bundleSha256: sha256(bundleBytes),
      campaignObserver: campaign.payload.observer,
      consumer: {
        repository,
        commit,
        tree,
        workflow_blob: workflowBlob,
        script_blob: scriptBlob,
        scorer_blob: scorerBlob,
        catalog_blob: catalogBlob,
      },
      report,
      reportSha256: sha256(reportBytes),
    });
    await writeFile(outputPath, `${JSON.stringify(canonical(receipt), null, 2)}\n`, { flag: "wx" });
  } finally {
    await rm(evidencePath, { force: true });
  }
}

if (import.meta.main === true) {
  try {
    const args = process.argv.slice(2);
    if (args.length !== 8 || args[0] !== "--campaign-dir" || args[2] !== "--source-run-id" ||
        args[4] !== "--source-run-metadata" || args[6] !== "--output" ||
        !args[1] || !args[3] || !args[5] || !args[7]) {
      fail("usage: consume-score-capability.mjs --campaign-dir <path> --source-run-id <id> --source-run-metadata <path> --output <path>");
    }
    await consume({
      campaignDirectory: args[1],
      sourceRunId: args[3],
      sourceRunMetadata: args[5],
      output: args[7],
    });
  } catch (error) {
    console.error(error instanceof Error ? error.message : String(error));
    process.exitCode = 1;
  }
}
