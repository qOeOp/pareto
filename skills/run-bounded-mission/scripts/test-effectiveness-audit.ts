#!/usr/bin/env bun

import { spawnSync } from "node:child_process"
import { createHash } from "node:crypto"
import { posix } from "node:path"

const schemaVersion = "bounded-mission.test-effectiveness-evidence.v2"
const sourceExtensions = [
  ".ts", ".tsx", ".mts", ".cts", ".js", ".jsx", ".mjs", ".cjs",
  ".py", ".rs", ".go", ".sh", ".bash", ".zsh",
]
const importSourceExtensions = [".ts", ".tsx", ".mts", ".cts", ".js", ".jsx", ".mjs", ".cjs"]
const importExtensions = ["", ".ts", ".tsx", ".mts", ".cts", ".js", ".jsx", ".mjs", ".cjs", "/index.ts", "/index.tsx", "/index.js", "/index.mjs"]
const classifications = [
  "real_behavior_regression",
  "outdated_contract_or_assertion",
  "implementation_coupled_change_detector",
  "scenario_gap",
  "oracle_assertion_gap",
  "selection_or_routing_gap",
  "mock_or_fake_isolation_distortion",
  "environment_concurrency_or_time_gap",
  "flake_or_infrastructure",
] as const

type Classification = (typeof classifications)[number]

interface Arguments {
  origin: string
  candidate: string
  ownerRoots: string[]
  scope?: string
  classification?: Classification
  bddRoot?: string
}

interface Revision {
  requested: string
  commit: string
  tree: string
}

interface Change {
  status: string
  path: string
  previous_path?: string
}

interface ImportEdge {
  importer: string
  target: string
  specifier: string
}

type ImportAnalysisReason =
  | "parse_error"
  | "non_literal_module_specifier"
  | "unsupported_module_syntax"
  | "unsupported_language"

interface TreeEntry {
  path: string
  object: string
}

interface ImportAnalysisIssue {
  path: string
  reasons: ImportAnalysisReason[]
}

interface ImportAnalysis {
  edges: ImportEdge[]
  files_analyzed: number
  incomplete_files: ImportAnalysisIssue[]
}

interface TestMetadata {
  path: string
  changed_status: string
  direct_changed_source_imports: string[]
  unique_value_evidence: {
    changed_source_imports_unique_to_test: string[]
    test_labels_unique_to_test: string[]
  }
  cost_signals: {
    lines: number
    bytes: number
    test_cases: number
    assertions: number
    mock_or_fake_mentions: number
    time_or_concurrency_mentions: number
    changed_with_imported_source: boolean
    exact_content_duplicate_paths: string[]
    runtime: { status: "unavailable"; milliseconds: null }
  }
  labels: string[]
  content_hash: string
}

const invocationDirectory = process.cwd()
const gitEnvironment = Object.freeze({
  ...process.env,
  GIT_NO_LAZY_FETCH: "1",
  GIT_TERMINAL_PROMPT: "0",
  GIT_OPTIONAL_LOCKS: "0",
})

try {
  const args = parseArguments(process.argv.slice(2))
  const repositoryRoot = git(["rev-parse", "--show-toplevel"]).trim()
  process.chdir(repositoryRoot)
  const origin = resolveRevision(args.origin)
  const candidate = resolveRevision(args.candidate)
  for (const ownerRoot of args.ownerRoots) {
    if (!gitObjectExists(`${origin.commit}:${ownerRoot}`) && !gitObjectExists(`${candidate.commit}:${ownerRoot}`)) {
      throw new Error(`--owner-root does not exist at origin or candidate: ${ownerRoot}`)
    }
  }
  const changes = readChanges(origin.commit, candidate.commit, args.scope)
  const candidatePaths = changes.length > 0 || args.bddRoot != null ? readTreePaths(candidate.commit) : []
  const candidatePathSet = new Set(candidatePaths)
  const ownerRoots = args.ownerRoots
    .slice()
    .sort((left, right) => right.length - left.length || left.localeCompare(right))
  const changesByOwner = new Map<string, Change[]>()

  for (const change of changes) {
    for (const owner of ownersForChange(change, ownerRoots)) {
      const owned = changesByOwner.get(owner) ?? []
      owned.push(change)
      changesByOwner.set(owner, owned)
    }
  }

  const changedSourcePaths = new Set(
    changes
      .filter((change) => change.status !== "D" && isSourcePath(change.path))
      .map((change) => change.path),
  )
  const importAnalysis = changedSourcePaths.size > 0
    ? readImportEdges(
        candidate.commit,
        candidatePaths,
        candidatePathSet,
        changedSourcePaths,
        args.scope,
      )
    : { edges: [], files_analyzed: 0, incomplete_files: [] }
  const importEdges = importAnalysis.edges
  const importersByTarget = groupImporters(importEdges)
  const allAffectedTests = buildTestMetadata(
    candidate.commit,
    candidatePaths,
    changes,
    importEdges,
    changedSourcePaths,
    ownerRoots,
    args.scope,
  )
  const deletedTestPaths = changes
    .filter((change) => change.status === "D" && isTestPath(change.path))
    .map((change) => change.path)
    .sort()
  const affectedOwnerNames = new Set(changesByOwner.keys())
  for (const test of allAffectedTests) {
    const owner = ownerForPath(test.path, ownerRoots)
    if (owner) affectedOwnerNames.add(owner)
  }

  const affectedOwners = [...affectedOwnerNames]
    .sort()
    .map((owner) => {
      const ownerChanges = changesByOwner.get(owner) ?? []
      const ownerTests = allAffectedTests.filter((test) => ownerForPath(test.path, ownerRoots) === owner)
      const ownerChangedSources = ownerChanges
        .filter((change) =>
          change.status !== "D"
          && ownerForPath(change.path, ownerRoots) === owner
          && isSourcePath(change.path))
        .map((change) => change.path)
        .sort()
      const reverseImporters = [...new Set(ownerChangedSources.flatMap((path) => importersByTarget.get(path) ?? []))]
        .filter((path) => !isTestPath(path))
        .sort()
      const entrypointPaths = candidatePaths.filter((path) => isEntrypoint(owner, path)).sort()
      return {
        owner,
        changes: ownerChanges.map(publicChange),
        consumer_leads: {
          contract_paths: candidatePathSet.has(`${owner}/CONTRACT.md`) ? [`${owner}/CONTRACT.md`] : [],
          entrypoint_paths: entrypointPaths,
          package_scripts: readPackageScripts(candidate.commit, owner, candidatePathSet),
          reverse_importers: reverseImporters,
          status: reverseImporters.length > 0 || entrypointPaths.length > 0
            ? "static_leads_found"
            : "unresolved",
          uncertainty: "static paths do not prove production reachability or execution",
        },
        changed_source_paths: ownerChangedSources,
        deleted_test_paths: deletedTestPaths.filter((path) => ownerForPath(path, ownerRoots) === owner),
        candidate_tests: ownerTests.map(stripPrivateTestFields),
      }
    })

  const noDirectStaticCandidateEvidence =
    importAnalysis.incomplete_files.length === 0
    && changes.length > 0
    && allAffectedTests.length === 0
    && deletedTestPaths.length === 0
  const bddStepEvidence = args.bddRoot == null
    ? { status: "not_requested" as const }
    : inspectBddStepEvidence(candidate.commit, candidatePaths, args.bddRoot)

  const evidence = {
    schema_version: schemaVersion,
    inputs: {
      origin,
      candidate,
      owner_roots: ownerRoots,
      scope: args.scope ?? null,
      classification: args.classification == null
        ? { status: "unresolved", value: null, allowed_values: classifications }
        : {
            status: "provided",
            value: args.classification,
            allowed_values: classifications,
          },
    },
    authority: {
      mode: "read_only",
      priority: [
        "frozen_outcome_and_current_contract",
        "production_consumer_behavior",
        "owner_and_compatible_boundary_contract",
        "tests_and_test_doubles",
      ],
      test_authority_status: "requires_review",
      forbidden_claims: [
        "coverage_proven",
        "deletion_safe",
        "mutation_score",
        "acceptance_signed",
      ],
    },
    import_analysis: {
      status: importAnalysis.incomplete_files.length === 0 ? "complete" : "incomplete",
      files_analyzed: importAnalysis.files_analyzed,
      incomplete_files: importAnalysis.incomplete_files,
    },
    summary: {
      changed_files: changes.length,
      affected_owners: affectedOwners.length,
      changed_source_files: changedSourcePaths.size,
      candidate_tests: allAffectedTests.length,
      deleted_test_files: deletedTestPaths.length,
      no_direct_static_candidate_evidence: noDirectStaticCandidateEvidence,
    },
    bdd_step_evidence: bddStepEvidence,
    affected_owners: affectedOwners,
    unowned_changes: changes
      .filter((change) => ownershipPaths(change).some((path) => !ownerForPath(path, ownerRoots)))
      .map(publicChange),
    deleted_test_review: {
      paths: deletedTestPaths,
      status: deletedTestPaths.length > 0 ? "requires_origin_review" : "none",
      uncertainty: deletedTestPaths.length > 0
        ? "deleted test behavior, unique value, and replacement evidence are not present in the candidate tree"
        : null,
    },
    escaped_defect_review: {
      classification_status: args.classification == null ? "unresolved" : "provided",
      classification: args.classification ?? null,
      questions: [
        question("expected_detection_layer", "Which layer or real consumer should have detected the defect?"),
        question("miss_reason", "Why did the existing selection, scenario, boundary, or oracle miss it?"),
        question("adjacent_blind_spots", "Which adjacent defects share the same blind spot?"),
        question("strengthen_or_replace", "Can an existing test be strengthened or replaced instead of adding another test?"),
        question("obsolete_tests", "Which old tests are now redundant or obsolete, and what unique value evidence prevents deletion?"),
      ],
    },
    caveats: [
      "Static imports, labels, exact-content duplicates, size, mock, and time/concurrency mentions are review leads only.",
      "Runtime timing is reported only when tracked evidence exists; this helper does not execute tests.",
      "No coverage, mutation effectiveness, behavioral equivalence, production reachability, or deletion safety is inferred.",
      "no_direct_static_candidate_evidence means only that no changed test or direct candidate-tree import was found; transitive paths and deleted sources remain unresolved.",
      "Deleted tests are listed as origin-review uncertainty; candidate-tree absence is never deletion evidence.",
      "A provided failure classification is context only and never selects a test action.",
      "Non-JavaScript/TypeScript reverse imports remain unresolved; non-literal module routing is reported as incomplete.",
      "Owner mapping is limited to the repository-relative roots supplied by the caller.",
      "BDD Step evidence is a static candidate-tree observation. Fixture, launcher, and selection evidence stay separate from an unobserved SUT result.",
    ],
  }

  process.stdout.write(`${JSON.stringify(evidence, null, 2)}\n`)
} catch (error) {
  const message = portableMessage(error instanceof Error ? error.message : String(error))
  process.stderr.write(`${JSON.stringify({
    schema_version: "bounded-mission.test-effectiveness-error.v1",
    error: { code: "audit_failed", message },
  }, null, 2)}\n`)
  process.exit(1)
}

function parseArguments(values: string[]): Arguments {
  if (values.includes("--help")) {
    process.stdout.write([
      "Usage: test-effectiveness-audit.ts --origin <commit> --candidate <commit>",
      "  --owner-root <repository-relative-path> [--owner-root <repository-relative-path> ...]",
      "  [--scope <repository-relative-owner>] [--bdd-root <repository-relative-path>]",
      `  [--classification <${classifications.join("|")}>]`,
      "",
    ].join("\n"))
    process.exit(0)
  }
  const parsed = new Map<string, string>()
  const ownerRoots: string[] = []
  for (let index = 0; index < values.length; index += 2) {
    const key = values[index]
    const value = values[index + 1]
    if (!key?.startsWith("--") || value == null || value.startsWith("--")) {
      throw new Error(`invalid arguments near ${key ?? "<end>"}`)
    }
    if (key === "--owner-root") {
      if (!isRepositoryRelative(value)) {
        throw new Error("--owner-root must be a normalized repository-relative path")
      }
      if (!ownerRoots.includes(value)) ownerRoots.push(value)
      continue
    }
    if (parsed.has(key)) throw new Error(`duplicate argument: ${key}`)
    parsed.set(key, value)
  }
  for (const key of parsed.keys()) {
    if (!["--origin", "--candidate", "--scope", "--classification", "--bdd-root"].includes(key)) {
      throw new Error(`unsupported argument: ${key}`)
    }
  }
  const origin = parsed.get("--origin")
  const candidate = parsed.get("--candidate")
  if (!origin || !candidate || ownerRoots.length === 0) {
    throw new Error("--origin, --candidate, and at least one --owner-root are required")
  }
  if (!isFullObjectId(origin) || !isFullObjectId(candidate)) {
    throw new Error("--origin and --candidate must be full Git commit hashes")
  }
  const scope = parsed.get("--scope")
  if (scope != null && !isRepositoryRelative(scope)) {
    throw new Error("--scope must be a normalized repository-relative path")
  }
  const classification = parsed.get("--classification")
  if (classification != null && !classifications.includes(classification as Classification)) {
    throw new Error(`unsupported classification: ${classification}`)
  }
  const bddRoot = parsed.get("--bdd-root")
  if (bddRoot != null && !isRepositoryRelative(bddRoot)) {
    throw new Error("--bdd-root must be a normalized repository-relative path")
  }
  return {
    origin,
    candidate,
    ownerRoots,
    scope: scope === "." ? undefined : scope,
    classification: classification as Classification | undefined,
    bddRoot,
  }
}

function resolveRevision(requested: string): Revision {
  const commit = git(["rev-parse", "--verify", "--end-of-options", `${requested}^{commit}`]).trim()
  const tree = git(["rev-parse", "--verify", "--end-of-options", `${commit}^{tree}`]).trim()
  if (!isFullObjectId(commit) || !isFullObjectId(tree)) {
    throw new Error(`revision did not resolve to immutable identities: ${requested}`)
  }
  if (commit !== requested) {
    throw new Error("revision token must equal its resolved immutable commit identity")
  }
  return { requested, commit, tree }
}

function readChanges(origin: string, candidate: string, scope?: string): Change[] {
  const args = ["diff", "--name-status", "-z", "--find-renames", origin, candidate, "--"]
  if (scope) args.push(literalPathspec(scope))
  const scopedChanges = readChangeDiff(args)
  if (scope == null) return scopedChanges
  if (scopedChanges.length === 0) return []
  return readChangeDiff(["diff", "--name-status", "-z", "--find-renames", origin, candidate, "--"])
    .filter((change) => ownershipPaths(change).some((path) => isWithin(path, scope)))
}

function readChangeDiff(args: string[]): Change[] {
  const result = spawnSync("git", args, {
    env: gitEnvironment,
    maxBuffer: 64 * 1024 * 1024,
  })
  if (result.status !== 0) throw new Error(result.stderr.toString().trim() || "git diff failed")
  const rawFields = splitNull(result.stdout)
  let fields: string[]
  try {
    const decoder = new TextDecoder("utf-8", { fatal: true })
    fields = rawFields.map((field) => decoder.decode(field))
  } catch {
    throw new Error("git diff contains a non-UTF-8 path")
  }
  const changes: Change[] = []
  for (let index = 0; index < fields.length;) {
    const status = fields[index++]
    if (!status) throw new Error("git diff returned incomplete change data")
    if (status.startsWith("R") || status.startsWith("C")) {
      const previousPath = fields[index++]
      const path = fields[index++]
      if (!previousPath || !path) throw new Error("git diff returned incomplete change data")
      changes.push({ status, path, previous_path: previousPath })
    } else {
      const path = fields[index++]
      if (!path) throw new Error("git diff returned incomplete change data")
      changes.push({ status, path })
    }
  }
  return changes.sort((left, right) => left.path.localeCompare(right.path))
}

function readTree(candidate: string, paths?: string[]): TreeEntry[] {
  const args = ["ls-tree", "-r", "-z", candidate]
  if (paths && paths.length > 0) args.push("--", ...paths.map(literalPathspec))
  const result = spawnSync("git", args, {
    env: gitEnvironment,
    maxBuffer: 64 * 1024 * 1024,
  })
  if (result.status !== 0) throw new Error(result.stderr.toString().trim() || "git ls-tree failed")
  const decoder = new TextDecoder("utf-8", { fatal: true })
  const entries: TreeEntry[] = []
  for (const record of splitNull(result.stdout)) {
    const pathStart = record.indexOf(9)
    if (pathStart < 0) throw new Error("git ls-tree returned incomplete entry data")
    const header = record.toString("ascii", 0, pathStart).split(" ")
    try {
      entries.push({
        object: header[2],
        path: decoder.decode(record.subarray(pathStart + 1)),
      })
    } catch {
      throw new Error("git tree contains a non-UTF-8 path")
    }
  }
  return entries.sort((left, right) => left.path.localeCompare(right.path))
}

function readTreePaths(candidate: string): string[] {
  const result = spawnSync("git", ["ls-tree", "-r", "-z", "--name-only", candidate], {
    env: gitEnvironment,
    maxBuffer: 64 * 1024 * 1024,
  })
  if (result.status !== 0) throw new Error(result.stderr.toString().trim() || "git ls-tree failed")
  const decoder = new TextDecoder("utf-8", { fatal: true })
  try {
    return splitNull(result.stdout).map((path) => decoder.decode(path)).sort()
  } catch {
    throw new Error("git tree contains a non-UTF-8 path")
  }
}

function splitNull(value: Buffer): Buffer[] {
  const fields: Buffer[] = []
  for (let start = 0; start < value.length;) {
    const end = value.indexOf(0, start)
    if (end < 0) throw new Error("git returned incomplete NUL-delimited data")
    fields.push(value.subarray(start, end))
    start = end + 1
  }
  return fields
}

function ownerForPath(path: string, ownerRoots: string[]): string | null {
  return ownerRoots.find((root) => path === root || path.startsWith(`${root}/`)) ?? null
}

function ownershipPaths(change: Change): string[] {
  return change.status.startsWith("R") && change.previous_path
    ? [change.previous_path, change.path]
    : [change.path]
}

function ownersForChange(change: Change, ownerRoots: string[]): string[] {
  return [...new Set(ownershipPaths(change)
    .map((path) => ownerForPath(path, ownerRoots))
    .filter((owner): owner is string => owner != null))]
}

function buildTestMetadata(
  candidate: string,
  candidatePaths: string[],
  changes: Change[],
  importEdges: ImportEdge[],
  changedSourcePaths: Set<string>,
  ownerRoots: string[],
  scope?: string,
): TestMetadata[] {
  const changeStatus = new Map(changes.map((change) => [change.path, change.status]))
  const importsByFile = new Map<string, ImportEdge[]>()
  for (const edge of importEdges) {
    const edges = importsByFile.get(edge.importer) ?? []
    edges.push(edge)
    importsByFile.set(edge.importer, edges)
  }
  const relevantTestOwners = new Set(candidatePaths
    .filter(isTestPath)
    .filter((path) => {
      if (changeStatus.has(path)) return true
      return (importsByFile.get(path) ?? []).some((edge) => changedSourcePaths.has(edge.target))
    })
    .map((path) => ownerForPath(path, ownerRoots))
    .filter((owner): owner is string => owner != null))
  const allOwnerTests = candidatePaths
    .filter(isTestPath)
    .filter((path) => {
      const owner = ownerForPath(path, ownerRoots)
      return owner != null && relevantTestOwners.has(owner)
    })
  const testObjects = new Map(allOwnerTests.length === 0
    ? []
    : readTree(candidate, [...relevantTestOwners, ...(scope ? [scope] : [])])
      .map((entry) => [entry.path, entry.object]))
  const testContents = readRevisionFiles(allOwnerTests, testObjects)
  const records = allOwnerTests.map((path): TestMetadata & { relevant: boolean } => {
    const content = testContents.get(path)!
    const directChangedImports = [...new Set(
      (importsByFile.get(path) ?? [])
        .map((edge) => edge.target)
        .filter((target) => changedSourcePaths.has(target)),
    )].sort()
    const status = changeStatus.get(path) ?? "unchanged"
    const labels = testLabels(content)
    return {
      path,
      changed_status: status,
      direct_changed_source_imports: directChangedImports,
      unique_value_evidence: {
        changed_source_imports_unique_to_test: [],
        test_labels_unique_to_test: [],
      },
      cost_signals: {
        lines: lineCount(content),
        bytes: Buffer.byteLength(content),
        test_cases: labels.length,
        assertions: countMatches(content, /\b(?:expect|assert(?:\.[A-Za-z]+|[A-Z][A-Za-z]+)?)\s*\(/g),
        mock_or_fake_mentions: countMatches(content, /\b(?:mock|spyOn|stub|fake)\b/gi),
        time_or_concurrency_mentions: countMatches(content, /\b(?:setTimeout|Date\.now|sleep|concurrent|parallel|thread|worker)\b/g),
        changed_with_imported_source: status !== "unchanged" && directChangedImports.length > 0,
        exact_content_duplicate_paths: [],
        runtime: { status: "unavailable", milliseconds: null },
      },
      labels,
      content_hash: sha256(content),
      relevant: status !== "unchanged" || directChangedImports.length > 0,
    }
  })

  const importFrequency = frequency(records.flatMap((record) => record.direct_changed_source_imports))
  const labelFrequency = frequency(records.flatMap((record) => record.labels))
  const contentGroups = groupBy(records, (record) => record.content_hash)
  const relevantRecords = records.filter((record) => record.relevant)

  for (const record of records) {
    record.unique_value_evidence.changed_source_imports_unique_to_test =
      record.direct_changed_source_imports.filter((path) => importFrequency.get(path) === 1)
    record.unique_value_evidence.test_labels_unique_to_test =
      record.labels.filter((label) => labelFrequency.get(label) === 1).sort()
    record.cost_signals.exact_content_duplicate_paths =
      (contentGroups.get(record.content_hash) ?? [])
        .map((item) => item.path)
        .filter((path) => path !== record.path)
        .sort()
  }

  return relevantRecords
    .sort((left, right) => left.path.localeCompare(right.path))
}

function readImportEdges(
  candidate: string,
  candidatePaths: string[],
  pathSet: Set<string>,
  changedSourcePaths: Set<string>,
  scope?: string,
): ImportAnalysis {
  const packagePaths = candidatePaths.filter((path) => path === "package.json" || path.endsWith("/package.json"))
  const packageEntries = packagePaths.length === 0 ? [] : readTree(candidate, packagePaths)
  const packageObjects = new Map(packageEntries.map((entry) => [entry.path, entry.object]))
  const packageContents = readRevisionFiles(packagePaths, packageObjects)
  const packageRoots = new Map<string, string>()
  for (const packagePath of packagePaths) {
    try {
      const value = JSON.parse(packageContents.get(packagePath)!) as { name?: unknown }
      if (typeof value.name === "string") packageRoots.set(value.name, posix.dirname(packagePath))
    } catch {
      // Malformed package manifests do not contribute import aliases.
    }
  }
  const edges: ImportEdge[] = []
  const incompleteFiles = [...changedSourcePaths]
    .filter((path) => !isImportSourcePath(path))
    .sort()
    .map((path): ImportAnalysisIssue => ({ path, reasons: ["unsupported_language"] }))
  const importSourcePaths = discoverImportSourcePaths(
    candidate,
    candidatePaths,
    changedSourcePaths,
    packageRoots,
    scope,
  )
  const scopedPaths = scope == null
    ? undefined
    : [scope, ...importSourcePaths.filter((path) => !isWithin(path, scope))]
  const importEntries = readTree(candidate, scopedPaths)
  const importObjects = new Map(importEntries.map((entry) => [entry.path, entry.object]))
  const importSources = readRevisionFiles(importSourcePaths, importObjects)
  for (const importer of importSourcePaths) {
    const source = importSources.get(importer)!
    const analysis = importSpecifiers(importer, source)
    if (analysis.issue) incompleteFiles.push(analysis.issue)
    for (const specifier of analysis.specifiers) {
      const target = resolveImport(importer, specifier, pathSet, packageRoots)
      if (target) edges.push({ importer, target, specifier })
    }
  }
  return {
    edges: edges.sort((left, right) =>
      left.importer.localeCompare(right.importer)
      || left.target.localeCompare(right.target)
      || left.specifier.localeCompare(right.specifier)),
    files_analyzed: importSourcePaths.length,
    incomplete_files: incompleteFiles.sort((left, right) => left.path.localeCompare(right.path)),
  }
}

function discoverImportSourcePaths(
  candidate: string,
  candidatePaths: string[],
  changedSourcePaths: Set<string>,
  packageRoots: Map<string, string>,
  scope?: string,
): string[] {
  const allImportSourcePaths = candidatePaths.filter(isImportSourcePath)
  if (scope == null) return allImportSourcePaths

  const hints = new Set<string>()
  const paths = new Set(allImportSourcePaths.filter((path) =>
    isWithin(path, scope) || changedSourcePaths.has(path)))
  for (const target of changedSourcePaths) {
    const extension = importSourceExtensions.find((candidateExtension) => target.endsWith(candidateExtension))
    if (!extension) continue
    const extensionless = target.slice(0, -extension.length)
    const basename = posix.basename(extensionless)
    hints.add(basename)
    if (basename === "index") {
      const indexRoot = posix.dirname(extensionless)
      hints.add(posix.basename(indexRoot))
      for (const path of allImportSourcePaths) {
        if (isWithin(path, indexRoot)) paths.add(path)
      }
    }
    for (const [packageName, packageRoot] of packageRoots) {
      if (isWithin(target, packageRoot)) hints.add(packageName)
    }
  }
  for (const path of grepPaths(candidate, [...hints, "\\"])) {
    if (isImportSourcePath(path)) paths.add(path)
  }
  return [...paths].sort()
}

function grepPaths(candidate: string, patterns: string[]): string[] {
  if (patterns.length === 0) return []
  const args = ["grep", "-l", "-z", "-I", "-F"]
  for (const pattern of patterns) args.push("-e", pattern)
  args.push(candidate, "--")
  const result = spawnSync("git", args, {
    env: gitEnvironment,
    maxBuffer: 64 * 1024 * 1024,
  })
  if (result.status === 1) return []
  if (result.status !== 0) throw new Error(result.stderr.toString().trim() || "git grep failed")
  const prefix = `${candidate}:`
  const decoder = new TextDecoder("utf-8", { fatal: true })
  try {
    return splitNull(result.stdout).map((record) => {
      const value = decoder.decode(record)
      if (!value.startsWith(prefix)) throw new Error("git grep returned an unexpected path")
      return value.slice(prefix.length)
    }).sort()
  } catch (error) {
    if (error instanceof Error && error.message === "git grep returned an unexpected path") throw error
    throw new Error("git grep contains a non-UTF-8 path", { cause: error })
  }
}

function readRevisionFiles(paths: string[], objects: Map<string, string>): Map<string, string> {
  if (paths.length === 0) return new Map()
  const result = spawnSync("git", ["cat-file", "--batch"], {
    env: gitEnvironment,
    input: paths.map((path) => `${objects.get(path)!}\n`).join(""),
    maxBuffer: 256 * 1024 * 1024,
  })
  if (result.status !== 0) {
    throw new Error(result.stderr.toString().trim() || "git cat-file failed")
  }

  const files = new Map<string, string>()
  let offset = 0
  for (const path of paths) {
    const headerEnd = result.stdout.indexOf(10, offset)
    if (headerEnd < 0) throw new Error(`git cat-file returned an incomplete header for ${path}`)
    const header = result.stdout.toString("utf8", offset, headerEnd)
    const match = /^[0-9a-f]+ blob ([0-9]+)$/.exec(header)
    if (!match) throw new Error(`git cat-file could not read ${path}`)
    const contentStart = headerEnd + 1
    const contentEnd = contentStart + Number(match[1])
    if (result.stdout[contentEnd] !== 10) {
      throw new Error(`git cat-file returned incomplete content for ${path}`)
    }
    try {
      files.set(path, new TextDecoder("utf-8", { fatal: true }).decode(result.stdout.subarray(contentStart, contentEnd)))
    } catch {
      throw new Error(`git blob is not valid UTF-8: ${path}`)
    }
    offset = contentEnd + 1
  }
  if (offset !== result.stdout.length) {
    throw new Error("git cat-file returned unexpected trailing data")
  }
  return files
}

function importSpecifiers(
  path: string,
  source: string,
): { specifiers: string[]; issue?: ImportAnalysisIssue } {
  const loader = loaderForPath(path)
  const transpiler = new Bun.Transpiler({ loader })
  const parsedSource = source.replace(/^#![^\n]*(?:\n|$)/, "")
  let runtimeImports: ReturnType<Bun.Transpiler["scanImports"]>
  try {
    runtimeImports = transpiler.scanImports(parsedSource)
  } catch {
    return {
      specifiers: [],
      issue: { path, reasons: ["parse_error"] },
    }
  }

  const supplemental = supplementalModuleSpecifiers(
    parsedSource,
    transpiler,
    loader === "ts" || loader === "tsx",
    runtimeImports.filter((item) => item.kind === "dynamic-import").length,
  )
  const reasons = [...new Set(supplemental.reasons)].sort()
  return {
    specifiers: [...new Set([...runtimeImports.map((item) => item.path), ...supplemental.specifiers])].sort(),
    ...(reasons.length > 0
      ? { issue: { path, reasons } }
      : {}),
  }
}

function supplementalModuleSpecifiers(
  source: string,
  transpiler: Bun.Transpiler,
  isTypeScript: boolean,
  provenDynamicImports: number,
): { specifiers: string[]; reasons: ImportAnalysisReason[] } {
  const specifiers: string[] = []
  const reasons: ImportAnalysisReason[] = []
  if (/\bmodule\s*\.\s*require\s*\(/.test(source)) {
    try {
      specifiers.push(...transpiler.scanImports(transpiler.transformSync(source)).map((item) => item.path))
    } catch {
      reasons.push("unsupported_module_syntax")
    }
  }
  if (isTypeScript && (/\b(?:import|export)\s+type\b/.test(source) || /\b(?:import|export)\s*\{\s*type\b/.test(source))) {
    reasons.push("unsupported_module_syntax")
  }
  if (isTypeScript && [...source.matchAll(/\bimport\s*\(/g)].length > provenDynamicImports) {
    reasons.push("unsupported_module_syntax")
  }
  if (/\b(?:import|require)\s*\((?!\s*["'])/.test(source)
    || /\bmodule\s*\.\s*require\s*\((?!\s*["'])/.test(source)) {
    reasons.push("non_literal_module_specifier")
  }
  return { specifiers, reasons }
}

function loaderForPath(path: string): "ts" | "tsx" | "js" | "jsx" {
  if (path.endsWith(".tsx")) return "tsx"
  if (path.endsWith(".jsx")) return "jsx"
  if ([".ts", ".mts", ".cts"].some((extension) => path.endsWith(extension))) return "ts"
  return "js"
}

function resolveImport(
  importer: string,
  specifier: string,
  pathSet: Set<string>,
  packageRoots: Map<string, string>,
): string | undefined {
  let base: string | undefined
  if (specifier.startsWith(".")) {
    base = posix.normalize(posix.join(posix.dirname(importer), specifier))
  } else {
    const packageName = [...packageRoots.keys()]
      .sort((left, right) => right.length - left.length)
      .find((name) => specifier === name || specifier.startsWith(`${name}/`))
    if (packageName) {
      const suffix = specifier.slice(packageName.length).replace(/^\//, "")
      base = posix.join(packageRoots.get(packageName)!, suffix)
    } else {
      return undefined
    }
  }
  if (!base) return undefined
  return importExtensions.map((extension) => `${base}${extension}`).find((path) => pathSet.has(path))
}

function readPackageScripts(candidate: string, owner: string, pathSet: Set<string>): string[] {
  const path = `${owner}/package.json`
  if (!pathSet.has(path)) return []
  const content = git(["show", `${candidate}:${path}`])
  try {
    const value = JSON.parse(content) as { scripts?: unknown }
    if (!value.scripts || typeof value.scripts !== "object" || Array.isArray(value.scripts)) return []
    return Object.keys(value.scripts).sort()
  } catch {
    return []
  }
}

function isEntrypoint(owner: string, path: string): boolean {
  if (!(path === owner || path.startsWith(`${owner}/`))) return false
  return /\/src\/(?:scripts\/)?main\.[^.]+$/.test(path)
    || /\/src\/index\.[^.]+$/.test(path)
    || /\/(?:bin|cli)\.[^.]+$/.test(path)
}

function isSourcePath(path: string): boolean {
  return !isTestPath(path)
    && (sourceExtensions.some((extension) => path.endsWith(extension))
      || /(?:^|\/)(?:src|proto)(?:\/|$)/.test(path))
}

function isImportSourcePath(path: string): boolean {
  return importSourceExtensions.some((extension) => path.endsWith(extension))
}

function isTestPath(path: string): boolean {
  return /(?:^|\/)(?:test|tests|test-support)(?:\/|$)/.test(path)
    || /\.(?:test|spec)\.[^.]+$/.test(path)
    || /(?:^|\/)test_[^/]+\.py$/.test(path)
    || /(?:^|\/)[^/]+_test\.go$/.test(path)
}

interface BddDefinition {
  path: string
  line: number
  expression: string
  matcher: RegExp | null
  captures: number
  universal_candidate: boolean
  parameter_soup_candidate: boolean
}

function inspectBddStepEvidence(candidate: string, candidatePaths: string[], root: string) {
  const rootPaths = candidatePaths.filter((path) => isWithin(path, root))
  if (rootPaths.length === 0) throw new Error(`--bdd-root does not exist at candidate: ${root}`)
  const featurePaths = rootPaths.filter((path) => path.endsWith(".feature")).sort()
  const sourcePaths = rootPaths.filter(isImportSourcePath).sort()
  const entries = readTree(candidate, [...featurePaths, ...sourcePaths])
  const contents = readRevisionFiles([...featurePaths, ...sourcePaths], new Map(entries.map((entry) => [entry.path, entry.object])))
  const phrases = featurePaths.flatMap((path) => readFeaturePhrases(path, contents.get(path)!))
  const definitions = sourcePaths.flatMap((path) => readStepDefinitions(path, contents.get(path)!))
  const matches = phrases.map((phrase) => ({
    ...phrase,
    matching_definitions: definitions
      .filter((definition) => definition.matcher?.test(phrase.text))
      .map((definition) => ({ path: definition.path, line: definition.line, expression: definition.expression })),
  }))
  const used = new Set(matches.flatMap((match) => match.matching_definitions.map((definition) => `${definition.path}:${definition.line}`)))
  const ambiguous = matches.filter((match) => match.matching_definitions.length > 1)
  return {
    status: "lexical_unverified" as const,
    root,
    parser_coverage: {
      status: "incomplete" as const,
      uncertainty: "The helper uses a bounded lexical scan, not Gherkin or language AST parsing. Localization, Scenario Outlines, aliases, dynamic registration, custom parameters, comments, and strings can require the effective runner.",
    },
    pre_sut: {
      fixture_sources: {
        status: "declared" as const,
        encoding: { status: "valid_utf8" as const },
        feature_paths: featurePaths,
      },
      glue_sources: {
        status: "unverified" as const,
        encoding: { status: "valid_utf8" as const },
        definition_paths: [...new Set(definitions.map((definition) => definition.path))].sort(),
      },
      selection: {
        status: "unverified" as const,
        selected_root: root,
        uncertainty: "This is lexical candidate-tree path selection, not effective runner selection or complete Step registration discovery.",
      },
      launcher: {
        status: "unavailable" as const,
        uncertainty: "The helper does not load support code or invoke a BDD runner.",
      },
    },
    sut_result: {
      status: "not_observed" as const,
      value: null,
      uncertainty: "A fixture, selection, or launcher observation cannot be reported as a SUT pass or failure.",
    },
    phrases: matches,
    definitions: definitions.map(({ matcher: _matcher, ...definition }) => ({
      ...definition,
      static_usage_candidate: used.has(`${definition.path}:${definition.line}`) ? "used" : "unused",
    })),
    undefined_phrase_candidates: matches.filter((match) => match.matching_definitions.length === 0),
    ambiguous_phrase_candidates: ambiguous,
    overlapping_definition_candidates: [...new Map(ambiguous.flatMap((match) => match.matching_definitions)
      .map((definition) => [`${definition.path}:${definition.line}`, definition])).values()],
    universal_step_candidates: definitions
      .filter((definition) => definition.universal_candidate)
      .map((definition) => ({ path: definition.path, line: definition.line, expression: definition.expression })),
    parameter_soup_candidates: definitions
      .filter((definition) => definition.parameter_soup_candidate)
      .map((definition) => ({ path: definition.path, line: definition.line, expression: definition.expression, captures: definition.captures })),
    caveat: "Every lexical match, usage, overlap, universal, and parameter-soup value is an unverified lead. Effective runtime loading, custom parameter types, source parsing, and SUT results remain unresolved until the real runner observes them.",
  }
}

function readFeaturePhrases(path: string, content: string): Array<{ path: string; line: number; keyword: string; text: string }> {
  const phrases: Array<{ path: string; line: number; keyword: string; text: string }> = []
  for (const [index, line] of content.split("\n").entries()) {
    const match = /^\s*(Given|When|Then|And|But)\s+(.+?)\s*$/.exec(line)
    if (match) phrases.push({ path, line: index + 1, keyword: match[1], text: match[2] })
  }
  return phrases
}

function readStepDefinitions(path: string, content: string): BddDefinition[] {
  const definitions: BddDefinition[] = []
  const pattern = /\b(?:Given|When|Then|defineStep)\s*\(\s*(?:(["'`])((?:\\.|(?!\1)[\s\S])*)\1|\/((?:\\.|[^/])*)\/([a-z]*))/g
  for (const match of content.matchAll(pattern)) {
    const expression = match[2] == null ? `/${match[3]}/${match[4] ?? ""}` : match[2]
    const regex = match[2] == null
      ? compileRegexExpression(match[3] ?? "", match[4] ?? "")
      : compileCucumberExpression(match[2])
    const captures = match[2] == null
      ? countCaptures(match[3] ?? "")
      : [...match[2].matchAll(/\{(?:string|int|float|word)\}/g)].length
    const line = content.slice(0, match.index ?? 0).split("\n").length
    definitions.push({
      path,
      line,
      expression,
      matcher: regex,
      captures,
      universal_candidate: match[2] == null ? /(?:^|[^\\])\.\*/.test(match[3] ?? "") : /^\{(?:string|word)\}$/.test(match[2]),
      parameter_soup_candidate: captures >= 3 || (match[2] == null && /\?\)|\|/.test(match[3] ?? "")),
    })
  }
  return definitions
}

function compileRegexExpression(source: string, flags: string): RegExp | null {
  try {
    return new RegExp(source, flags.replace(/[gy]/g, ""))
  } catch {
    return null
  }
}

function compileCucumberExpression(expression: string): RegExp | null {
  const parts = expression.split(/(\{(?:string|int|float|word)\})/g)
  const source = parts.map((part) => {
    if (part === "{string}") return '"([^"\\n]+)"'
    if (part === "{int}") return "(-?\\d+)"
    if (part === "{float}") return "(-?(?:\\d+\\.?\\d*|\\.\\d+))"
    if (part === "{word}") return "([^\\s]+)"
    return escapeRegex(part)
  }).join("")
  try {
    return new RegExp(`^${source}$`)
  } catch {
    return null
  }
}

function escapeRegex(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
}

function countCaptures(source: string): number {
  return [...source.matchAll(/(^|[^\\])\((?!\?)/g)].length
}

function testLabels(content: string): string[] {
  const labels: string[] = []
  for (const match of content.matchAll(/\b(?:test|it)\s*\(\s*["'`]([^"'`]+)["'`]/g)) {
    labels.push(match[1])
  }
  return labels.sort()
}

function countMatches(content: string, pattern: RegExp): number {
  return [...content.matchAll(pattern)].length
}

function lineCount(content: string): number {
  if (content.length === 0) return 0
  return content.endsWith("\n") ? content.split("\n").length - 1 : content.split("\n").length
}

function frequency(values: string[]): Map<string, number> {
  const result = new Map<string, number>()
  for (const value of values) result.set(value, (result.get(value) ?? 0) + 1)
  return result
}

function groupBy<T>(values: T[], key: (value: T) => string): Map<string, T[]> {
  const result = new Map<string, T[]>()
  for (const value of values) {
    const bucket = result.get(key(value)) ?? []
    bucket.push(value)
    result.set(key(value), bucket)
  }
  return result
}

function groupImporters(edges: ImportEdge[]): Map<string, string[]> {
  const result = new Map<string, string[]>()
  for (const edge of edges) {
    const importers = result.get(edge.target) ?? []
    importers.push(edge.importer)
    result.set(edge.target, importers)
  }
  for (const [target, importers] of result) result.set(target, [...new Set(importers)].sort())
  return result
}

function stripPrivateTestFields(test: TestMetadata): Omit<TestMetadata, "labels" | "content_hash"> {
  const {
    labels: _labels,
    content_hash: _contentHash,
    relevant: _relevant,
    ...publicFields
  } = test as TestMetadata & { relevant?: boolean }
  return publicFields
}

function publicChange(change: Change): Change {
  return change.previous_path
    ? { status: change.status, path: change.path, previous_path: change.previous_path }
    : { status: change.status, path: change.path }
}

function question(id: string, prompt: string): { id: string; prompt: string; status: "unanswered"; answer: null } {
  return { id, prompt, status: "unanswered", answer: null }
}

function sha256(value: string): string {
  return createHash("sha256").update(value).digest("hex")
}

function isRepositoryRelative(value: string): boolean {
  return value.length > 0
    && !value.startsWith("/")
    && !value.includes("\\")
    && posix.normalize(value) === value
    && value !== ".."
    && !value.startsWith("../")
}

function isWithin(path: string, root: string): boolean {
  return root === "." || path === root || path.startsWith(`${root}/`)
}

function literalPathspec(path: string): string {
  return `:(literal)${path}`
}

function isFullObjectId(value: string): boolean {
  return /^(?:[a-f0-9]{40}|[a-f0-9]{64})$/.test(value)
}

function portableMessage(message: string): string {
  const root = process.cwd().replaceAll("\\", "/")
  const invocation = invocationDirectory.replaceAll("\\", "/")
  return message.replaceAll(root, ".").replaceAll(invocation, ".").replaceAll("\\", "/")
}

function git(args: string[]): string {
  const result = spawnSync("git", args, {
    env: gitEnvironment,
    encoding: "utf8",
    maxBuffer: 64 * 1024 * 1024,
  })
  if (result.status !== 0) {
    throw new Error(result.stderr.trim() || `git ${args[0]} failed`)
  }
  return result.stdout
}

function gitObjectExists(object: string): boolean {
  return spawnSync("git", ["cat-file", "-e", object], { env: gitEnvironment }).status === 0
}
