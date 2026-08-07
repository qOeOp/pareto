#!/usr/bin/env bun

import { createHash } from "node:crypto"
import {
  type BigIntStats,
  closeSync,
  constants as fsConstants,
  fstatSync,
  lstatSync,
  openSync,
  readFileSync,
  readlinkSync,
  realpathSync,
} from "node:fs"
import { isAbsolute, resolve } from "node:path"

const SCHEMA = "mission-evaluator-binding/v3"
const SCRIPT_PATH = ".agents/skills/run-bounded-mission/scripts/evaluator-binding.ts"
const LOCAL_CANDIDATE = ":local-worktree:"
const ENFORCEMENT_MODES = new Set(["sandbox-enforced", "integrity-checked"])

interface Inputs {
  repository: string
  origin: string
  candidate: string
  enforcement: string
  requiredFiles: string[]
  controlRepository?: string
  controlOrigin?: string
  targetRoot?: string
}

interface GitResult {
  exitCode: number
  stdout: Uint8Array
  stderr: Uint8Array
}

class BindingRejected extends Error {}

function sha256(bytes: Uint8Array | string): string {
  return createHash("sha256").update(bytes).digest("hex")
}

async function emit(value: unknown, exitCode: number): Promise<void> {
  await Bun.write(Bun.stdout, `${JSON.stringify(value)}\n`)
  process.exitCode = exitCode
}

function reject(reason: string): never {
  throw new BindingRejected(reason)
}

function parseInputs(argv: string[]): Inputs {
  const values = new Map<string, string>()
  const requiredFiles: string[] = []
  const singleValueFlags = new Set([
    "--repository",
    "--origin",
    "--candidate",
    "--enforcement",
    "--control-repository",
    "--control-origin",
    "--target-root",
  ])

  for (let index = 0; index < argv.length; index += 2) {
    const flag = argv[index]
    const value = argv[index + 1]
    if (value === undefined) reject(`missing value for ${flag ?? "argument"}`)
    if (flag === "--required-file") {
      requiredFiles.push(value)
      continue
    }
    if (!singleValueFlags.has(flag)) reject(`unsupported argument: ${flag}`)
    if (values.has(flag)) reject(`duplicate argument: ${flag}`)
    values.set(flag, value)
  }

  const repository = values.get("--repository")
  const origin = values.get("--origin")
  const candidate = values.get("--candidate")
  const enforcement = values.get("--enforcement")
  const controlRepository = values.get("--control-repository")
  const controlOrigin = values.get("--control-origin")
  const targetRoot = values.get("--target-root")
  if (!repository || !origin || !candidate || !enforcement) {
    reject("required arguments: --repository --origin --candidate --enforcement --required-file")
  }
  if (!/^[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+$/.test(repository)) {
    reject("repository must be owner/name")
  }
  if (!ENFORCEMENT_MODES.has(enforcement)) reject("unsupported enforcement mode")
  const externalValues = [controlRepository, controlOrigin, targetRoot].filter(Boolean).length
  if (externalValues !== 0 && externalValues !== 3) {
    reject("external binding requires --control-repository --control-origin --target-root together")
  }
  if (controlRepository && !/^[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+$/.test(controlRepository)) {
    reject("control repository must be owner/name")
  }
  if (targetRoot && (!isAbsolute(targetRoot) || resolve(targetRoot) !== targetRoot || /[\0\n\r]/.test(targetRoot))) {
    reject("target root must be a canonical absolute path without control characters")
  }
  if (requiredFiles.length === 0) reject("at least one --required-file is required")
  for (const value of [origin, candidate, ...requiredFiles]) {
    if (value.includes("\0") || value.includes("\n") || value.includes("\r")) {
      reject("refs and paths must not contain control characters")
    }
  }

  const normalizedFiles = [...new Set(requiredFiles)].sort(compareUtf8)
  for (const path of normalizedFiles) {
    if (path.startsWith("/") || path === "." || path === ".." || path.split("/").includes("..")) {
      reject(`required file must be repository-relative: ${path}`)
    }
  }
  return {
    repository,
    origin,
    candidate,
    enforcement,
    requiredFiles: normalizedFiles,
    controlRepository,
    controlOrigin,
    targetRoot,
  }
}

function compareUtf8(left: string, right: string): number {
  return Buffer.compare(Buffer.from(left), Buffer.from(right))
}

function runGit(cwd: string, args: string[]): GitResult {
  const result = Bun.spawnSync(["git", ...args], {
    cwd,
    env: {
      ...process.env,
      GIT_NO_LAZY_FETCH: "1",
      GIT_OPTIONAL_LOCKS: "0",
      GIT_TERMINAL_PROMPT: "0",
    },
    stderr: "pipe",
    stdout: "pipe",
  })
  return { exitCode: result.exitCode, stdout: result.stdout, stderr: result.stderr }
}

function gitBytes(cwd: string, args: string[]): Uint8Array {
  const result = runGit(cwd, args)
  if (result.exitCode !== 0) {
    const detail = new TextDecoder().decode(result.stderr).trim()
    reject(`git ${args[0]} failed${detail ? `: ${detail}` : ""}`)
  }
  return result.stdout
}

function gitText(cwd: string, args: string[]): string {
  return new TextDecoder().decode(gitBytes(cwd, args)).trim()
}

function resolveCommit(cwd: string, locator: string, label: string): string {
  const result = runGit(cwd, ["rev-parse", "--verify", "--end-of-options", `${locator}^{commit}`])
  if (result.exitCode !== 0) reject(`${label} does not resolve to a commit`)
  const oid = new TextDecoder().decode(result.stdout).trim()
  if (!/^[0-9a-f]{40}$/.test(oid)) reject(`${label} did not resolve to a full commit OID`)
  return oid
}

function normalizeRemoteRepository(remote: string): string | null {
  const scpMatch = /^[^@\s]+@[^:]+:(.+)$/.exec(remote)
  let path = scpMatch?.[1]
  if (!path) {
    try {
      path = new URL(remote).pathname
    } catch {
      path = remote
    }
  }
  const segments = path.replace(/^\/+/, "").replace(/\.git$/, "").split("/").filter(Boolean)
  if (segments.length < 2) return null
  return `${segments.at(-2)}/${segments.at(-1)}`
}

function commitParents(cwd: string, commit: string): string[] {
  const value = gitText(cwd, ["show", "--no-patch", "--format=%P", commit])
  return value ? value.split(" ") : []
}

function splitNulPaths(bytes: Uint8Array): string[] {
  const decoder = new TextDecoder("utf-8", { fatal: true })
  const paths: string[] = []
  let start = 0
  for (let index = 0; index < bytes.length; index += 1) {
    if (bytes[index] !== 0) continue
    if (index > start) {
      try {
        paths.push(decoder.decode(bytes.slice(start, index)))
      } catch {
        reject("Git path output must be valid UTF-8")
      }
    }
    start = index + 1
  }
  if (start !== bytes.length) reject("changed-path output was not NUL terminated")
  return paths.sort(compareUtf8)
}

function bytesRecord(bytes: Uint8Array) {
  return {
    encoding: "base64",
    size: bytes.length,
    sha256: sha256(bytes),
    bytes_base64: Buffer.from(bytes).toString("base64"),
  }
}

function sameFile(
  left: BigIntStats,
  right: BigIntStats,
): boolean {
  return left.dev === right.dev && left.ino === right.ino && left.size === right.size
    && left.mode === right.mode && left.nlink === right.nlink
    && left.mtimeNs === right.mtimeNs && left.ctimeNs === right.ctimeNs
}

function candidatePath(root: string, path: string, allowMissing: boolean): string {
  const absolute = resolve(root, path)
  if (absolute === root || !absolute.startsWith(`${root}/`)) reject(`candidate path escapes target root: ${path}`)
  let current = root
  for (const segment of path.split("/").slice(0, -1)) {
    current = resolve(current, segment)
    try {
      const stat = lstatSync(current)
      if (!stat.isDirectory() || stat.isSymbolicLink()) reject(`candidate path parent is not a direct directory: ${path}`)
    } catch (error) {
      if (allowMissing && (error as NodeJS.ErrnoException).code === "ENOENT") break
      throw error
    }
  }
  return absolute
}

function materialEntry(root: string, path: string, allowMissing: boolean) {
  const rawPath = Buffer.from(path, "utf8")
  if (/\0|\n|\r/.test(path) || !Buffer.from(new TextDecoder("utf-8", { fatal: true }).decode(rawPath)).equals(rawPath)) {
    reject(`candidate path is not canonical UTF-8: ${path}`)
  }
  const absolute = candidatePath(root, path, allowMissing)
  let before: BigIntStats
  try {
    before = lstatSync(absolute, { bigint: true })
  } catch (error) {
    if (allowMissing && (error as NodeJS.ErrnoException).code === "ENOENT") {
      return {
        path,
        raw_path: bytesRecord(rawPath),
        type: "missing",
        mode: "000000",
        size: 0,
        sha256: sha256(new Uint8Array()),
        bytes_base64: "",
      }
    }
    throw error
  }
  if (before.nlink !== 1n) reject(`candidate entry must not have hard-link aliases: ${path}`)
  if (before.isSymbolicLink()) {
    const target = readlinkSync(absolute, { encoding: "buffer" }) as Buffer
    const after = lstatSync(absolute, { bigint: true })
    if (!sameFile(before, after) || !after.isSymbolicLink()) reject(`candidate symlink drifted during read: ${path}`)
    return {
      path,
      raw_path: bytesRecord(rawPath),
      type: "symlink",
      mode: "120000",
      size: target.length,
      sha256: sha256(target),
      bytes_base64: target.toString("base64"),
    }
  }
  if (!before.isFile()) reject(`unsupported candidate entry type: ${path}`)
  const descriptor = openSync(absolute, fsConstants.O_RDONLY | fsConstants.O_NOFOLLOW)
  try {
    const opened = fstatSync(descriptor, { bigint: true })
    if (!sameFile(before, opened) || !opened.isFile() || opened.nlink !== 1n) {
      reject(`candidate file changed or has aliases before read: ${path}`)
    }
    const bytes = new Uint8Array(readFileSync(descriptor))
    const afterRead = fstatSync(descriptor, { bigint: true })
    const afterPath = lstatSync(absolute, { bigint: true })
    if (!sameFile(before, afterRead) || !sameFile(afterPath, afterRead)) {
      reject(`candidate file or path drifted during read: ${path}`)
    }
    return {
      path,
      raw_path: bytesRecord(rawPath),
      type: "file",
      mode: Number(opened.mode & 0o177777n).toString(8).padStart(6, "0"),
      size: bytes.length,
      sha256: sha256(bytes),
      bytes_base64: Buffer.from(bytes).toString("base64"),
    }
  } finally {
    closeSync(descriptor)
  }
}

function orderedUniquePaths(bytes: Uint8Array, label: string): string[] {
  const paths = splitNulPaths(bytes)
  if (new Set(paths).size !== paths.length) reject(`${label} contains duplicate paths`)
  return paths
}

function rejectPathCollisions(paths: string[]): void {
  const ordered = [...paths].sort(compareUtf8)
  for (let index = 1; index < ordered.length; index += 1) {
    const previous = ordered[index - 1]!
    const current = ordered[index]!
    if (previous === current) reject(`candidate material contains duplicate path: ${current}`)
    if (current.startsWith(`${previous}/`)) reject(`candidate material contains a path-prefix collision: ${previous}`)
  }
}

function localCapture(root: string) {
  const status = gitBytes(root, ["status", "--porcelain=v2", "-z", "--untracked-files=all", "--ignored=no"])
  const staged = gitBytes(root, [
    "diff", "--cached", "--binary", "--full-index", "--no-color", "--no-ext-diff", "--no-textconv",
    "--no-renames", "HEAD", "--",
  ])
  const unstaged = gitBytes(root, [
    "diff", "--binary", "--full-index", "--no-color", "--no-ext-diff", "--no-textconv", "--no-renames", "--",
  ])
  const combined = gitBytes(root, [
    "diff", "--binary", "--full-index", "--no-color", "--no-ext-diff", "--no-textconv", "--no-renames",
    "HEAD", "--",
  ])
  const stagedPathsRaw = gitBytes(root, ["diff", "--cached", "--name-only", "-z", "--no-renames", "HEAD", "--"])
  const unstagedPathsRaw = gitBytes(root, ["diff", "--name-only", "-z", "--no-renames", "--"])
  const combinedPathsRaw = gitBytes(root, ["diff", "--name-only", "-z", "--no-renames", "HEAD", "--"])
  const untrackedPathsRaw = gitBytes(root, ["ls-files", "--others", "--exclude-standard", "-z"])
  const trackedPathsRaw = gitBytes(root, ["ls-files", "-z"])
  const trackedPaths = [
    ...orderedUniquePaths(stagedPathsRaw, "staged changed paths"),
    ...orderedUniquePaths(unstagedPathsRaw, "unstaged changed paths"),
    ...orderedUniquePaths(combinedPathsRaw, "combined changed paths"),
  ]
  const untrackedPaths = orderedUniquePaths(untrackedPathsRaw, "untracked paths")
  const allTrackedPaths = new Set(orderedUniquePaths(trackedPathsRaw, "tracked paths"))
  for (const path of untrackedPaths) {
    if (allTrackedPaths.has(path)) reject(`candidate path is both tracked and untracked: ${path}`)
  }
  const changedTrackedPaths = [...new Set(trackedPaths)].sort(compareUtf8)
  const allPaths = [...changedTrackedPaths, ...untrackedPaths]
  rejectPathCollisions(allPaths)
  const trackedEntries = changedTrackedPaths.map((path) => materialEntry(root, path, true))
  const untrackedEntries = untrackedPaths.map((path) => materialEntry(root, path, false))
  const manifestBytes = Buffer.concat([
    ...trackedEntries.map((entry) => Buffer.from(`${JSON.stringify({ scope: "tracked", ...entry })}\n`)),
    ...untrackedEntries.map((entry) => Buffer.from(`${JSON.stringify({ scope: "untracked", ...entry })}\n`)),
  ])
  return {
    status: bytesRecord(status),
    diff: {
      kind: "local",
      staged: bytesRecord(staged),
      unstaged: bytesRecord(unstaged),
      combined: bytesRecord(combined),
      changed_paths: changedTrackedPaths,
      staged_paths: bytesRecord(stagedPathsRaw),
      unstaged_paths: bytesRecord(unstagedPathsRaw),
      combined_paths: bytesRecord(combinedPathsRaw),
    },
    untracked: {
      paths: bytesRecord(untrackedPathsRaw),
      entries: untrackedEntries,
    },
    tracked_entries: trackedEntries,
    manifest: bytesRecord(manifestBytes),
  }
}

function blobFingerprint(cwd: string, commit: string, path: string, required: boolean) {
  const object = runGit(cwd, ["rev-parse", "--verify", "--end-of-options", `${commit}:${path}`])
  if (object.exitCode !== 0) {
    if (required) reject(`required control-plane file is missing: ${path}`)
    return { present: false as const }
  }
  const oid = new TextDecoder().decode(object.stdout).trim()
  const type = gitText(cwd, ["cat-file", "-t", oid])
  if (type !== "blob") reject(`unsupported control-plane object type for ${path}: ${type}`)
  const bytes = gitBytes(cwd, ["cat-file", "blob", oid])
  return { present: true as const, oid, sha256: sha256(bytes), size: bytes.length }
}

try {
const inputs = parseInputs(Bun.argv.slice(2))
const initialCwd = process.cwd()
const controlRoot = gitText(initialCwd, ["rev-parse", "--show-toplevel"])
const external = inputs.targetRoot !== undefined
const controlRepository = inputs.controlRepository ?? inputs.repository
const observedControlRepository = normalizeRemoteRepository(gitText(controlRoot, ["remote", "get-url", "origin"]))
if (observedControlRepository !== controlRepository) {
  reject(
    `control repository mismatch: expected ${controlRepository}, observed ${observedControlRepository ?? "unresolved"}`,
  )
}

const controlOrigin = resolveCommit(controlRoot, inputs.controlOrigin ?? inputs.origin, "control-plane Origin")
const controlHead = resolveCommit(controlRoot, "HEAD", "control-plane HEAD")
if (controlHead !== controlOrigin) {
  reject(`control-plane HEAD ${controlHead} does not equal Origin ${controlOrigin}`)
}
const controlStatus = gitBytes(controlRoot, ["status", "--porcelain=v2", "-z", "--untracked-files=all", "--ignored=no"])
if (controlStatus.length !== 0) {
  reject(`control-plane worktree has tracked or untracked material; status_sha256=${sha256(controlStatus)}`)
}

const local = inputs.candidate === LOCAL_CANDIDATE
if (local && !external) reject("local candidate binding requires a separate --target-root and grouped control identity")
const targetRoot = external ? realpathSync(inputs.targetRoot!) : controlRoot
if (external && targetRoot !== inputs.targetRoot) reject("target root must not contain symlink components")
if (local && targetRoot === controlRoot) reject("local candidate target must be separate from the immutable control plane")
const observedTargetRepository = normalizeRemoteRepository(gitText(targetRoot, ["remote", "get-url", "origin"]))
if (observedTargetRepository !== inputs.repository) {
  reject(`target repository mismatch: expected ${inputs.repository}, observed ${observedTargetRepository ?? "unresolved"}`)
}
const origin = resolveCommit(targetRoot, inputs.origin, "target Origin")
const committedCandidate = local ? undefined : resolveCommit(targetRoot, inputs.candidate, "target candidate")
if (committedCandidate === origin) reject("candidate must differ from Origin")
const targetStatusArgs = external
  ? ["status", "--porcelain=v2", "-z", "--untracked-files=all", "--ignored=matching"]
  : ["status", "--porcelain=v2", "-z", "--untracked-files=all", "--ignored=no"]
const targetStatus = local
  ? gitBytes(targetRoot, ["status", "--porcelain=v2", "-z", "--untracked-files=all", "--ignored=no"])
  : gitBytes(targetRoot, targetStatusArgs)
if (external && !local && targetStatus.length !== 0) {
  reject(`target worktree has tracked, untracked, or ignored material; status_sha256=${sha256(targetStatus)}`)
}
const targetHead = resolveCommit(targetRoot, "HEAD", "target HEAD")
if (local && targetHead !== origin) {
  reject(`local candidate target HEAD ${targetHead} does not equal Origin ${origin}`)
}
if (external && !local && targetHead !== committedCandidate) {
  reject(`target HEAD ${targetHead} does not equal candidate ${committedCandidate}`)
}

const originTree = gitText(targetRoot, ["rev-parse", "--verify", `${origin}^{tree}`])
const originParents = commitParents(targetRoot, origin)
let candidate: Record<string, unknown>
let diff: Record<string, unknown>
if (local) {
  const first = localCapture(targetRoot)
  const second = localCapture(targetRoot)
  if (JSON.stringify(first) !== JSON.stringify(second)) reject("local candidate material drifted during binding")
  if (first.status.sha256 !== sha256(targetStatus)) reject("local candidate status drifted before binding")
  if (first.status.size === 0 || (first.diff.changed_paths.length === 0 && first.untracked.entries.length === 0)) {
    reject("local candidate must contain non-ignored tracked or untracked material")
  }
  const locatorBody = {
    repository: inputs.repository,
    origin: { commit: origin, tree: originTree },
    target_root: targetRoot,
    status: first.status,
    diff: first.diff,
    tracked_entries: first.tracked_entries,
    untracked: first.untracked,
    manifest: first.manifest,
  }
  const locator = `local:sha256:${sha256(JSON.stringify(locatorBody))}`
  candidate = {
    kind: "local",
    locator,
    base_commit: origin,
    tree: originTree,
    material: {
      status: first.status,
      tracked_entries: first.tracked_entries,
      untracked: first.untracked,
      manifest: first.manifest,
    },
  }
  diff = first.diff
} else {
  const committed = committedCandidate!
  const ancestry = runGit(targetRoot, ["merge-base", "--is-ancestor", origin, committed])
  if (ancestry.exitCode === 1) reject("candidate does not descend from Origin")
  if (ancestry.exitCode !== 0) reject("candidate ancestry could not be resolved")
  const candidateTree = gitText(targetRoot, ["rev-parse", "--verify", `${committed}^{tree}`])
  const candidateParents = commitParents(targetRoot, committed)
  const originDistance = Number(gitText(targetRoot, ["rev-list", "--count", `${origin}..${committed}`]))
  if (!Number.isSafeInteger(originDistance) || originDistance < 1) reject("candidate ancestry distance is invalid")
  const diffBytes = gitBytes(targetRoot, [
    "diff", "--binary", "--full-index", "--no-color", "--no-ext-diff", "--no-textconv", "--no-renames",
    origin, committed, "--",
  ])
  const changedPaths = splitNulPaths(gitBytes(targetRoot, [
    "diff", "--name-only", "-z", "--no-renames", origin, committed, "--",
  ]))
  if (changedPaths.length === 0 || diffBytes.length === 0) reject("candidate has no complete committed diff from Origin")
  candidate = {
    kind: "committed",
    locator: `commit:${committed}`,
    commit: committed,
    tree: candidateTree,
    parents: candidateParents,
    origin_is_ancestor: true,
    origin_is_direct_parent: candidateParents.includes(origin),
    origin_distance: originDistance,
  }
  diff = {
    kind: "committed",
    ...bytesRecord(diffBytes),
    changed_paths: changedPaths,
  }
}

const requiredFiles = inputs.requiredFiles.map((path) => ({
  path,
  control_origin: blobFingerprint(controlRoot, controlOrigin, path, true),
}))

const replayArgv = [
  "bun", SCRIPT_PATH,
  "--repository", inputs.repository,
  "--origin", origin,
  "--candidate", inputs.candidate,
  "--enforcement", inputs.enforcement,
  ...inputs.requiredFiles.flatMap((path) => ["--required-file", path]),
  ...(external ? [
    "--control-repository", controlRepository,
    "--control-origin", controlOrigin,
    "--target-root", targetRoot,
  ] : []),
]
const controlTree = gitText(controlRoot, ["rev-parse", "--verify", `${controlOrigin}^{tree}`])
const controlParents = commitParents(controlRoot, controlOrigin)
const candidateLocator = String(candidate.locator)
const binding = {
  schema: SCHEMA,
  status: "bound",
  repository: inputs.repository,
  enforcement: inputs.enforcement,
  control_plane: {
    repository: controlRepository,
    head: controlHead,
    tree: controlTree,
    parents: controlParents,
    candidate_material_status_sha256: sha256(controlStatus),
    worktree_candidate_material_fingerprint_sha256: sha256(
      `${controlRepository}\0${controlHead}\0${controlTree}\0${sha256(controlStatus)}`,
    ),
    ignored_material_policy: "excluded_non_candidate",
  },
  target_worktree: {
    root: targetRoot,
    head: targetHead,
    candidate_material_status_sha256: sha256(targetStatus),
    worktree_candidate_material_fingerprint_sha256: sha256(
      `${inputs.repository}\0${targetRoot}\0${targetHead}\0${String(candidate.tree)}\0${candidateLocator}\0${sha256(targetStatus)}`,
    ),
    ignored_material_policy: local ? "excluded_non_candidate" : external ? "must_be_absent" : "excluded_non_candidate",
  },
  origin: { commit: origin, tree: originTree, parents: originParents },
  candidate,
  diff,
  required_files: requiredFiles,
  replay: { argv: replayArgv },
}
const bindingFingerprint = sha256(JSON.stringify(binding))
await emit({ ...binding, binding_fingerprint_sha256: bindingFingerprint }, 0)
} catch (error) {
  if (!(error instanceof BindingRejected)) throw error
  await emit({ schema: SCHEMA, status: "rejected", reason: error.message }, 1)
}
