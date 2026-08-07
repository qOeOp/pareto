#!/usr/bin/env bun

import { createHash } from "node:crypto"
import {
  closeSync,
  constants as fsConstants,
  fchmodSync,
  fstatSync,
  fsyncSync,
  lstatSync,
  mkdirSync,
  openSync,
  readdirSync,
  readFileSync,
  readSync,
  realpathSync,
  writeSync,
} from "node:fs"
import { basename, dirname, isAbsolute, resolve } from "node:path"

const INPUT_SCHEMA = "mission-evaluator-packet-input/v1"
const ARTIFACT_SET_SCHEMA = "mission-evaluator-artifact-set/v4"
const ADMISSION_SCHEMA = "mission-evaluator-artifact-admission/v1"
const TERMINAL_OBSERVATION_SCHEMA = "mission-evaluator-terminal-observation/v1"
const SHARED_CORE_SCHEMA = "mission-evaluator-shared-core/v2"
const LENS_DELTA_SCHEMA = "mission-evaluator-lens-delta/v1"
const DISPATCH_SCHEMA = "mission-evaluator-dispatch/v1"
const BINDING_SCHEMA = "mission-evaluator-binding/v3"
const SCRIPT_PATH = ".agents/skills/run-bounded-mission/scripts/evaluator-packet.ts"
const BINDING_PATH = ".agents/skills/run-bounded-mission/scripts/evaluator-binding.ts"
const LOCAL_CANDIDATE = ":local-worktree:"
const REVIEWER_CONTRACT = ".agents/skills/run-bounded-mission/references/verification/reviewer-handoff.md"
const RELOCATED_REVIEWER_CONTRACT = ".agents/skills/run-bounded-mission/references/verification/reviewer-handoff.md"
const EVALUATOR_ROLE = "mission_evaluator"
const ENFORCEMENT_MODES = new Set(["sandbox-enforced", "integrity-checked"])
const LENS_ORDER = ["authority_representation", "consumer_fail_close_closure"] as const
const SCRATCH_DIRECTORIES = ["home", "tmp", "xdg-cache", "xdg-config", "xdg-data"] as const
const OUTSIDE_STATE_PROCEDURE = "recompute-and-compare-exact-packet-named-fingerprints-before-terminal-and-main-acceptance"

type LensName = typeof LENS_ORDER[number]

interface Arguments {
  repository: string
  origin: string
  candidate: string
  enforcement: string
  requiredFiles: string[]
  outputDirectory: string
  controlRepository?: string
  controlOrigin?: string
  targetRoot?: string
}

interface AdmissionArguments {
  artifact: string
  size: number
  sha256: string
  auditSet: "single" | "complementary_pair"
  assignedRiskLens: LensName
  assignedLensDeltaSha256: string
  commonPacketLocator: string
  helperCommit: string
  helperPath: string
  helperBlobOid: string
  helperBlobSha256: string
  helperSize: number
  candidateLocator: string
}

interface ObservationArguments {
  admission: AdmissionArguments
  scratchRoot: string
  phase: "pre" | "post"
  action: "emit" | "verify"
}

interface LensInput {
  name: LensName
  activation_predicate: string
  required_inspected_scope: string
  required_terminal_evidence: string
  representative_refutation: string
  stop: string
}

interface PacketInput {
  schema: typeof INPUT_SCHEMA
  frame: string
  plan: string
  audit_set: "single" | "complementary_pair"
  admission: {
    planned_launch_context: string
    instruction_origin: string
    automatic_discovery_boundary: string
    parent_receipt_route: string
  }
  replay: {
    main_ci_corroboration: string
    optional_supporting_claims: string
    concurrently_pending: string
    unavailable_evidence: string
  }
  lenses: LensInput[]
}

interface CommandResult {
  exitCode: number
  stdout: Uint8Array
  stderr: Uint8Array
}

class PacketRejected extends Error {}

function reject(reason: string): never {
  throw new PacketRejected(reason)
}

function sha256(bytes: Uint8Array | string): string {
  return createHash("sha256").update(bytes).digest("hex")
}

function canonicalLine(value: unknown): Uint8Array {
  return new TextEncoder().encode(`${JSON.stringify(value)}\n`)
}

function concatBytes(values: Uint8Array[]): Uint8Array {
  return Buffer.concat(values.map((value) => Buffer.from(value)))
}

function decodeUtf8(bytes: Uint8Array, label: string): string {
  try {
    return new TextDecoder("utf-8", { fatal: true }).decode(bytes)
  } catch {
    reject(`${label} must be valid UTF-8`)
  }
}

function semanticString(value: unknown, field: string): string {
  if (typeof value !== "string" || value.length === 0) reject(`${field} must be a non-empty string`)
  for (let index = 0; index < value.length; index += 1) {
    const code = value.charCodeAt(index)
    if (code < 0xd800 || code > 0xdfff) continue
    if (code > 0xdbff || index + 1 >= value.length) reject(`${field} contains an unpaired surrogate`)
    const next = value.charCodeAt(index + 1)
    if (next < 0xdc00 || next > 0xdfff) reject(`${field} contains an unpaired surrogate`)
    index += 1
  }
  return value
}

function record(value: unknown, field: string): Record<string, unknown> {
  if (value == null || typeof value !== "object" || Array.isArray(value)) {
    reject(`${field} must be an object`)
  }
  return value as Record<string, unknown>
}

function exactKeys(value: Record<string, unknown>, field: string, expected: string[]): void {
  const actual = Object.keys(value).sort()
  const wanted = [...expected].sort()
  if (JSON.stringify(actual) !== JSON.stringify(wanted)) {
    reject(`${field} fields must be exactly: ${expected.join(" ")}`)
  }
}

function parsePacketInput(bytes: Uint8Array): PacketInput {
  const text = decodeUtf8(bytes, "stdin")
  let parsed: unknown
  try {
    parsed = JSON.parse(text)
  } catch {
    reject("stdin must contain one canonical JSON LF frame")
  }
  const value = record(parsed, "input")
  exactKeys(value, "input", ["schema", "frame", "plan", "audit_set", "admission", "replay", "lenses"])
  if (value.schema !== INPUT_SCHEMA) reject(`unsupported input schema: ${String(value.schema)}`)
  if (value.audit_set !== "single" && value.audit_set !== "complementary_pair") {
    reject(`unsupported audit set: ${String(value.audit_set)}`)
  }

  const admissionValue = record(value.admission, "admission")
  exactKeys(admissionValue, "admission", [
    "planned_launch_context",
    "instruction_origin",
    "automatic_discovery_boundary",
    "parent_receipt_route",
  ])
  const replayValue = record(value.replay, "replay")
  exactKeys(replayValue, "replay", [
    "main_ci_corroboration",
    "optional_supporting_claims",
    "concurrently_pending",
    "unavailable_evidence",
  ])
  if (!Array.isArray(value.lenses)) reject("lenses must be an ordered array")

  const lenses = value.lenses.map((item, index): LensInput => {
    const lens = record(item, `lenses[${index}]`)
    exactKeys(lens, `lenses[${index}]`, [
      "name",
      "activation_predicate",
      "required_inspected_scope",
      "required_terminal_evidence",
      "representative_refutation",
      "stop",
    ])
    if (!LENS_ORDER.includes(lens.name as LensName)) {
      reject(`unsupported lens: ${String(lens.name)}`)
    }
    return {
      name: lens.name as LensName,
      activation_predicate: semanticString(lens.activation_predicate, `lenses[${index}].activation_predicate`),
      required_inspected_scope: semanticString(lens.required_inspected_scope, `lenses[${index}].required_inspected_scope`),
      required_terminal_evidence: semanticString(lens.required_terminal_evidence, `lenses[${index}].required_terminal_evidence`),
      representative_refutation: semanticString(lens.representative_refutation, `lenses[${index}].representative_refutation`),
      stop: semanticString(lens.stop, `lenses[${index}].stop`),
    }
  })
  const lensNames = lenses.map((lens) => lens.name)
  if (new Set(lensNames).size !== lensNames.length) reject("duplicate lenses are not allowed")
  if (value.audit_set === "single" && lenses.length !== 1) reject("single audit set requires exactly one lens")
  if (value.audit_set === "complementary_pair"
      && JSON.stringify(lensNames) !== JSON.stringify(LENS_ORDER)) {
    reject(`complementary_pair lenses must use this order: ${LENS_ORDER.join(" ")}`)
  }

  const input: PacketInput = {
    schema: INPUT_SCHEMA,
    frame: semanticString(value.frame, "frame"),
    plan: semanticString(value.plan, "plan"),
    audit_set: value.audit_set,
    admission: {
      planned_launch_context: semanticString(admissionValue.planned_launch_context, "admission.planned_launch_context"),
      instruction_origin: semanticString(admissionValue.instruction_origin, "admission.instruction_origin"),
      automatic_discovery_boundary: semanticString(
        admissionValue.automatic_discovery_boundary,
        "admission.automatic_discovery_boundary",
      ),
      parent_receipt_route: semanticString(admissionValue.parent_receipt_route, "admission.parent_receipt_route"),
    },
    replay: {
      main_ci_corroboration: semanticString(replayValue.main_ci_corroboration, "replay.main_ci_corroboration"),
      optional_supporting_claims: semanticString(
        replayValue.optional_supporting_claims,
        "replay.optional_supporting_claims",
      ),
      concurrently_pending: semanticString(replayValue.concurrently_pending, "replay.concurrently_pending"),
      unavailable_evidence: semanticString(replayValue.unavailable_evidence, "replay.unavailable_evidence"),
    },
    lenses,
  }
  if (!Buffer.from(canonicalLine(input)).equals(Buffer.from(bytes))) {
    reject("stdin must contain one canonical JSON UTF-8 LF frame with fields in contract order")
  }
  return input
}

function parseMaterializeArguments(argv: string[]): Arguments {
  const values = new Map<string, string>()
  const requiredFiles: string[] = []
  const singleValueFlags = new Set([
    "--repository",
    "--origin",
    "--candidate",
    "--enforcement",
    "--output-directory",
    "--control-repository",
    "--control-origin",
    "--target-root",
  ])

  for (let index = 0; index < argv.length; index += 2) {
    const flag = argv[index]
    const value = argv[index + 1]
    if (value === undefined) reject(`missing value for ${flag ?? "argument"}`)
    if (flag === "--required-file") {
      if (requiredFiles.includes(value)) reject(`duplicate required file: ${value}`)
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
  const outputDirectory = values.get("--output-directory")
  const controlRepository = values.get("--control-repository")
  const controlOrigin = values.get("--control-origin")
  const targetRoot = values.get("--target-root")
  if (!repository || !origin || !candidate || !enforcement || !outputDirectory || requiredFiles.length === 0) {
    reject(
      "required materialize arguments: --repository --origin --candidate --enforcement --output-directory --required-file",
    )
  }
  if (!/^[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+$/.test(repository)) reject("repository must be owner/name")
  if (!ENFORCEMENT_MODES.has(enforcement)) reject("unsupported enforcement mode")
  const externalValues = [controlRepository, controlOrigin, targetRoot].filter(Boolean).length
  if (externalValues !== 0 && externalValues !== 3) {
    reject("external materialize requires --control-repository --control-origin --target-root together")
  }
  if (controlRepository && !/^[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+$/.test(controlRepository)) {
    reject("control repository must be owner/name")
  }
  if (targetRoot && (!isAbsolute(targetRoot) || resolve(targetRoot) !== targetRoot || /[\0\n\r]/.test(targetRoot))) {
    reject("target root must be a canonical absolute path without control characters")
  }
  if (!isAbsolute(outputDirectory) || outputDirectory.includes("\0") || outputDirectory.includes("\n")) {
    reject("output directory must be an absolute path without control characters")
  }
  return {
    repository,
    origin,
    candidate,
    enforcement,
    requiredFiles,
    outputDirectory,
    controlRepository,
    controlOrigin,
    targetRoot,
  }
}

function decimal(value: string | undefined, field: string): number {
  if (!value || !/^(0|[1-9][0-9]*)$/.test(value)) reject(`${field} must be a canonical decimal integer`)
  const parsed = Number(value)
  if (!Number.isSafeInteger(parsed)) reject(`${field} exceeds the safe integer range`)
  return parsed
}

function digest(value: string | undefined, field: string): string {
  if (!value || !/^sha256:[0-9a-f]{64}$/.test(value)) reject(`${field} must be sha256:<lowercase-64-hex>`)
  return value
}

function oid(value: string | undefined, field: string): string {
  if (!value || !/^[0-9a-f]{40}$/.test(value)) reject(`${field} must be a lowercase full SHA-1 OID`)
  return value
}

function parseAdmissionArguments(argv: string[]): AdmissionArguments {
  const values = new Map<string, string>()
  const flags = new Set([
    "--artifact",
    "--size",
    "--sha256",
    "--audit-set",
    "--assigned-risk-lens",
    "--assigned-lens-delta-sha256",
    "--common-packet-locator",
    "--helper-commit",
    "--helper-path",
    "--helper-blob-oid",
    "--helper-blob-sha256",
    "--helper-size",
    "--candidate-locator",
  ])
  for (let index = 0; index < argv.length; index += 2) {
    const flag = argv[index]
    const value = argv[index + 1]
    if (value === undefined) reject(`missing value for ${flag ?? "argument"}`)
    if (!flags.has(flag)) reject(`unsupported admission argument: ${flag}`)
    if (values.has(flag)) reject(`duplicate admission argument: ${flag}`)
    values.set(flag, value)
  }
  if (values.size !== flags.size) reject(`admit requires exactly: ${[...flags].join(" ")}`)

  const artifact = values.get("--artifact")!
  if (!isAbsolute(artifact) || resolve(artifact) !== artifact || /[\0\n\r]/.test(artifact)) {
    reject("artifact must be a canonical absolute path without control characters")
  }
  const assignedRiskLens = values.get("--assigned-risk-lens") as LensName
  if (!LENS_ORDER.includes(assignedRiskLens)) reject("unsupported assigned risk lens")
  const auditSet = values.get("--audit-set")
  if (auditSet !== "single" && auditSet !== "complementary_pair") reject("unsupported audit set")
  const helperPath = values.get("--helper-path")!
  if (helperPath !== SCRIPT_PATH) reject(`helper path must be ${SCRIPT_PATH}`)
  const candidateLocator = values.get("--candidate-locator")!
  if (!/^commit:[0-9a-f]{40}$/.test(candidateLocator)
      && !/^local:sha256:[0-9a-f]{64}$/.test(candidateLocator)) {
    reject("candidate locator must be commit:<lowercase-full-SHA-1> or local:sha256:<lowercase-64-hex>")
  }
  return {
    artifact,
    size: decimal(values.get("--size"), "size"),
    sha256: digest(values.get("--sha256"), "sha256"),
    auditSet,
    assignedRiskLens,
    assignedLensDeltaSha256: digest(
      values.get("--assigned-lens-delta-sha256"),
      "assigned lens delta SHA-256",
    ),
    commonPacketLocator: digest(values.get("--common-packet-locator"), "common packet locator"),
    helperCommit: oid(values.get("--helper-commit"), "helper commit"),
    helperPath,
    helperBlobOid: oid(values.get("--helper-blob-oid"), "helper blob OID"),
    helperBlobSha256: digest(values.get("--helper-blob-sha256"), "helper blob SHA-256"),
    helperSize: decimal(values.get("--helper-size"), "helper size"),
    candidateLocator,
  }
}

function parseObservationArguments(argv: string[]): ObservationArguments {
  const observationFlags = new Set(["--scratch-root", "--phase", "--action"])
  const admissionArgv: string[] = []
  const observationValues = new Map<string, string>()
  for (let index = 0; index < argv.length; index += 2) {
    const flag = argv[index]
    const value = argv[index + 1]
    if (value === undefined) reject(`missing value for ${flag ?? "observation argument"}`)
    if (observationFlags.has(flag)) {
      if (observationValues.has(flag)) reject(`duplicate observation argument: ${flag}`)
      observationValues.set(flag, value)
    } else {
      admissionArgv.push(flag, value)
    }
  }
  if (observationValues.size !== observationFlags.size) {
    reject(`observe requires exactly: ${[...observationFlags].join(" ")}`)
  }
  const admission = parseAdmissionArguments(admissionArgv)
  const scratchRoot = observationValues.get("--scratch-root")!
  if (!isAbsolute(scratchRoot) || resolve(scratchRoot) !== scratchRoot || /[\0\n\r]/.test(scratchRoot)) {
    reject("scratch root must be a canonical absolute path without control characters")
  }
  const expectedScratchRoot = resolve(dirname(admission.artifact), "scratch", admission.assignedRiskLens)
  if (scratchRoot !== expectedScratchRoot) reject("scratch root does not match the artifact and assigned lens")
  const phase = observationValues.get("--phase")
  if (phase !== "pre" && phase !== "post") reject("observation phase must be pre or post")
  const action = observationValues.get("--action")
  if (action !== "emit" && action !== "verify") reject("observation action must be emit or verify")
  if (phase === "pre" && action === "verify") reject("only the post observation is a terminal receipt")
  return { admission, scratchRoot, phase, action }
}

function run(cwd: string, argv: string[]): CommandResult {
  const result = Bun.spawnSync(argv, {
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

function commandBytes(cwd: string, argv: string[]): Uint8Array {
  const result = run(cwd, argv)
  if (result.exitCode !== 0) {
    const detail = decodeUtf8(result.stderr, `${argv[0]} stderr`).trim()
    reject(`${argv[0]} ${argv[1] ?? ""} failed${detail ? `: ${detail}` : ""}`)
  }
  return result.stdout
}

function gitText(cwd: string, args: string[]): string {
  return decodeUtf8(commandBytes(cwd, ["git", ...args]), `git ${args[0]} stdout`).trim()
}

function immutableCommit(cwd: string, value: string, label: string): string {
  const oid = gitText(cwd, ["rev-parse", "--verify", "--end-of-options", `${value}^{commit}`])
  if (!/^[0-9a-f]{40}$/.test(oid)) reject(`${label} did not resolve to a full SHA-1 commit OID`)
  return oid
}

function bindingLine(cwd: string, args: Arguments): { bytes: Uint8Array; value: Record<string, unknown> } {
  const argv = [
    "bun", BINDING_PATH,
    "--repository", args.repository,
    "--origin", args.origin,
    "--candidate", args.candidate,
    "--enforcement", args.enforcement,
    ...args.requiredFiles.flatMap((path) => ["--required-file", path]),
    ...(args.targetRoot ? [
      "--control-repository", args.controlRepository!,
      "--control-origin", args.controlOrigin!,
      "--target-root", args.targetRoot,
    ] : []),
  ]
  const result = run(cwd, argv)
  if (result.exitCode !== 0) {
    const detail = decodeUtf8(result.stdout, "binding stdout").trim()
      || decodeUtf8(result.stderr, "binding stderr").trim()
    reject(`binding helper rejected${detail ? `: ${detail}` : ""}`)
  }
  const text = decodeUtf8(result.stdout, "binding stdout")
  if (!text.endsWith("\n") || text.slice(0, -1).includes("\n")) {
    reject("binding helper must emit exactly one JSON LF line")
  }
  let parsed: unknown
  try {
    parsed = JSON.parse(text)
  } catch {
    reject("binding helper emitted malformed JSON")
  }
  const value = record(parsed, "binding")
  exactKeys(value, "binding", [
    "schema",
    "status",
    "repository",
    "enforcement",
    "control_plane",
    "target_worktree",
    "origin",
    "candidate",
    "diff",
    "required_files",
    "replay",
    "binding_fingerprint_sha256",
  ])
  if (value.schema !== BINDING_SCHEMA || value.status !== "bound") reject("binding helper did not bind")
  if (value.repository !== args.repository || value.enforcement !== args.enforcement) {
    reject("binding repository or enforcement mismatch")
  }
  const fingerprint = semanticString(value.binding_fingerprint_sha256, "binding.binding_fingerprint_sha256")
  if (!/^[0-9a-f]{64}$/.test(fingerprint)) reject("binding fingerprint is malformed")
  const { binding_fingerprint_sha256: ignored, ...body } = value
  void ignored
  if (sha256(JSON.stringify(body)) !== fingerprint) reject("binding fingerprint mismatch")
  return { bytes: result.stdout, value }
}

async function helperIdentity(
  cwd: string,
  locator: string,
  label: string,
  requireRuntimeMatch: boolean,
): Promise<Record<string, unknown>> {
  const commit = immutableCommit(cwd, locator, label)
  const oid = gitText(cwd, ["rev-parse", "--verify", "--end-of-options", `${commit}:${SCRIPT_PATH}`])
  const type = gitText(cwd, ["cat-file", "-t", oid])
  if (type !== "blob") reject(`${label} packet helper is not a blob: ${type}`)
  const committedBytes = commandBytes(cwd, ["git", "cat-file", "blob", oid])
  const runtimeBytes = new Uint8Array(await Bun.file(import.meta.path).arrayBuffer())
  if (requireRuntimeMatch && !Buffer.from(committedBytes).equals(Buffer.from(runtimeBytes))) {
    reject(`runtime packet helper bytes do not match ${label} blob`)
  }
  return {
    commit,
    path: SCRIPT_PATH,
    blob_oid: oid,
    blob_sha256: sha256(committedBytes),
    size: committedBytes.length,
    invocation_argv: [...Bun.argv],
  }
}

function segmentRecord(name: string, bytes: Uint8Array): Record<string, unknown> {
  return {
    name,
    encoding: "utf-8",
    size: bytes.length,
    sha256: `sha256:${sha256(bytes)}`,
  }
}

function canonicalOutputIdentity(schema: string, bytes: Uint8Array): Record<string, unknown> {
  return {
    schema,
    encoding: "canonical-json-lf",
    size: bytes.length,
    sha256: `sha256:${sha256(bytes)}`,
  }
}

async function buildDispatches(args: Arguments, inputBytes: Uint8Array) {
  const input = parsePacketInput(inputBytes)
  const cwd = gitText(process.cwd(), ["rev-parse", "--show-toplevel"])
  if (!isAbsolute(cwd) || resolve(cwd) !== cwd || realpathSync(cwd) !== cwd || /[\0\n\r]/.test(cwd)) {
    reject("control-plane working directory must be a canonical absolute path without control characters")
  }
  const binding = bindingLine(cwd, args)
  const origin = record(binding.value.origin, "binding.origin")
  const candidate = record(binding.value.candidate, "binding.candidate")
  const controlPlane = record(binding.value.control_plane, "binding.control_plane")
  const targetWorktree = record(binding.value.target_worktree, "binding.target_worktree")
  const targetRoot = semanticString(targetWorktree.root, "binding.target_worktree.root")
  const resolvedOrigin = immutableCommit(targetRoot, args.origin, "target Origin")
  let resolvedCandidate: string | undefined
  const candidateKind = semanticString(candidate.kind, "binding.candidate.kind")
  const candidateLocator = semanticString(candidate.locator, "binding.candidate.locator")
  if (origin.commit !== resolvedOrigin) reject("stale Origin or binding")
  if (candidateKind === "local") {
    if (args.candidate !== LOCAL_CANDIDATE
        || candidate.base_commit !== resolvedOrigin
        || candidateLocator !== candidate.locator
        || !/^local:sha256:[0-9a-f]{64}$/.test(candidateLocator)
        || args.targetRoot === undefined) {
      reject("stale local candidate or binding")
    }
  } else if (candidateKind === "committed") {
    resolvedCandidate = immutableCommit(targetRoot, args.candidate, "target candidate")
    if (candidate.commit !== resolvedCandidate || candidateLocator !== `commit:${resolvedCandidate}`) {
      reject("stale committed candidate or binding")
    }
  } else {
    reject("unsupported binding candidate kind")
  }

  const lensRecords = input.lenses.map((lens) => {
    const bytes = canonicalLine({
      schema: LENS_DELTA_SCHEMA,
      assigned_risk_lens: lens.name,
      activation_predicate: lens.activation_predicate,
      required_inspected_scope: lens.required_inspected_scope,
      required_terminal_evidence: lens.required_terminal_evidence,
      representative_refutation: lens.representative_refutation,
      stop: lens.stop,
    })
    return { name: lens.name, bytes, sha256: sha256(bytes), size: bytes.length }
  })
  const manifest = lensRecords.map((lens) => ({
    name: lens.name,
    sha256: `sha256:${lens.sha256}`,
    size: lens.size,
  }))
  const external = args.targetRoot !== undefined
  const packetHelperCommit = external
    ? immutableCommit(cwd, args.controlOrigin!, "control-plane Origin")
    : resolvedCandidate ?? reject("committed candidate did not resolve")
  const admissionHelperCommit = external ? packetHelperCommit : resolvedOrigin
  const helper = await helperIdentity(cwd, packetHelperCommit, external ? "control-plane Origin" : "candidate", true)
  const admissionHelper = await helperIdentity(cwd, admissionHelperCommit, "admission Origin", false)
  const frameBytes = new TextEncoder().encode(input.frame)
  const planBytes = new TextEncoder().encode(input.plan)
  const bindingFingerprint = semanticString(
    binding.value.binding_fingerprint_sha256,
    "binding.binding_fingerprint_sha256",
  )
  const sharedCore = canonicalLine({
    schema: SHARED_CORE_SCHEMA,
    candidate_locator: candidateLocator,
    control_plane: {
      head: controlPlane.head,
      tree: controlPlane.tree,
      worktree_candidate_material_fingerprint_sha256: controlPlane.worktree_candidate_material_fingerprint_sha256,
      enforcement: args.enforcement,
      binding_identity: `${BINDING_SCHEMA}:${bindingFingerprint}`,
      mutation_observation: "none",
    },
    target_worktree: {
      repository: args.repository,
      head: targetWorktree.head,
      tree: candidate.tree,
      worktree_candidate_material_fingerprint_sha256:
        targetWorktree.worktree_candidate_material_fingerprint_sha256,
      ignored_material_policy: targetWorktree.ignored_material_policy,
    },
    packet_helper: helper,
    frame: input.frame,
    frame_utf8_size: frameBytes.length,
    frame_utf8_sha256: `sha256:${sha256(frameBytes)}`,
    plan: input.plan,
    plan_utf8_size: planBytes.length,
    plan_utf8_sha256: `sha256:${sha256(planBytes)}`,
    audit_set: input.audit_set,
    required_lenses: input.lenses.map((lens) => lens.name),
    lens_manifest: manifest,
    admission: input.admission,
    replay: input.replay,
  })
  const commonPacketLocator = `sha256:${sha256(sharedCore)}`
  const dispatches = lensRecords.map((lens) => {
    const header = canonicalLine({
      schema: DISPATCH_SCHEMA,
      purpose: "independent candidate audit",
      reviewer_contract: REVIEWER_CONTRACT,
      common_packet_locator: commonPacketLocator,
      assigned_risk_lens: lens.name,
      assigned_lens_delta_sha256: `sha256:${lens.sha256}`,
      segments: [
        segmentRecord("binding", binding.bytes),
        segmentRecord("shared_core", sharedCore),
        segmentRecord("lens_delta", lens.bytes),
      ],
    })
    const bytes = concatBytes([header, binding.bytes, sharedCore, lens.bytes])
    return {
      assigned_risk_lens: lens.name,
      size: bytes.length,
      sha256: `sha256:${sha256(bytes)}`,
      bytes,
    }
  })
  return {
    workingDirectory: cwd,
    candidateLocator,
    commonPacketLocator,
    auditSet: input.audit_set,
    dispatches,
    admissionHelper,
  }
}

function sameFile(left: ReturnType<typeof lstatSync>, right: ReturnType<typeof fstatSync>): boolean {
  return left.dev === right.dev && left.ino === right.ino && left.size === right.size
}

function materializeArtifact(directory: string, bytes: Uint8Array, digestValue: string): string {
  const directoryStat = lstatSync(directory)
  if (!directoryStat.isDirectory() || directoryStat.isSymbolicLink()) {
    reject("output directory must be a non-symlink directory")
  }
  const canonicalDirectory = realpathSync(directory)
  if (resolve(directory) !== canonicalDirectory) reject("output directory must be a canonical absolute path")
  const artifact = resolve(canonicalDirectory, `${digestValue}.dispatch`)
  let descriptor: number | undefined
  try {
    descriptor = openSync(
      artifact,
      fsConstants.O_WRONLY | fsConstants.O_CREAT | fsConstants.O_EXCL | fsConstants.O_NOFOLLOW,
      0o400,
    )
    let offset = 0
    while (offset < bytes.length) offset += writeSync(descriptor, bytes, offset, bytes.length - offset)
    fsyncSync(descriptor)
    fchmodSync(descriptor, 0o400)
  } finally {
    if (descriptor !== undefined) closeSync(descriptor)
  }
  const artifactStat = lstatSync(artifact)
  if (!artifactStat.isFile() || artifactStat.isSymbolicLink() || (artifactStat.mode & 0o222) !== 0) {
    reject("materialized artifact must be a read-only regular file")
  }
  if (artifactStat.size !== bytes.length || basename(artifact) !== `${digestValue}.dispatch`) {
    reject("materialized artifact size or content-addressed name mismatch")
  }
  return artifact
}

function createOwnerOnlyDirectory(path: string, label: string): void {
  try {
    mkdirSync(path, { mode: 0o700 })
  } catch {
    reject(`${label} must not exist before materialization`)
  }
  const observed = lstatSync(path)
  const owner = process.geteuid?.()
  if (!observed.isDirectory() || observed.isSymbolicLink() || modeText(observed.mode) !== "0700"
      || owner === undefined || observed.uid !== owner) {
    reject(`${label} must be an owner-only non-symlink mode-0700 directory`)
  }
}

function materializeScratchRoots(directory: string, lenses: LensName[]): Map<LensName, string> {
  const canonicalDirectory = realpathSync(directory)
  if (resolve(directory) !== canonicalDirectory) reject("output directory must be a canonical absolute path")
  const scratchParent = resolve(canonicalDirectory, "scratch")
  createOwnerOnlyDirectory(scratchParent, "scratch parent")
  const roots = new Map<LensName, string>()
  for (const lens of lenses) {
    const root = resolve(scratchParent, lens)
    createOwnerOnlyDirectory(root, `scratch root for ${lens}`)
    for (const name of SCRATCH_DIRECTORIES) {
      createOwnerOnlyDirectory(resolve(root, name), `scratch ${lens}/${name}`)
    }
    const observed = scanScratch(root)
    if (observed.manifestSha256 !== emptyScratchManifestSha256()
        || observed.files !== 0 || observed.bytes !== 0 || observed.rootMode !== "0700") {
      reject(`scratch root for ${lens} did not materialize as the exact empty boundary`)
    }
    roots.set(lens, root)
  }
  return roots
}

function admissionArgv(
  helperPath: string,
  artifact: string,
  size: number,
  wholeSha256: string,
  auditSet: string,
  assignedRiskLens: string,
  assignedLensDeltaSha256: string,
  commonPacketLocator: string,
  helperCommit: string,
  helperBlobOid: string,
  helperBlobSha256: string,
  helperSize: number,
  candidateLocator: string,
): string[] {
  return [
    "bun", helperPath, "admit",
    "--artifact", artifact,
    "--size", String(size),
    "--sha256", wholeSha256,
    "--audit-set", auditSet,
    "--assigned-risk-lens", assignedRiskLens,
    "--assigned-lens-delta-sha256", assignedLensDeltaSha256,
    "--common-packet-locator", commonPacketLocator,
    "--helper-commit", helperCommit,
    "--helper-path", helperPath,
    "--helper-blob-oid", helperBlobOid,
    "--helper-blob-sha256", helperBlobSha256,
    "--helper-size", String(helperSize),
    "--candidate-locator", candidateLocator,
  ]
}

function observationArgv(admitArgv: string[], scratchRoot: string, phase: "pre" | "post", action: "emit" | "verify") {
  return [
    ...admitArgv.slice(0, 2), "observe", ...admitArgv.slice(3),
    "--scratch-root", scratchRoot,
    "--phase", phase,
    "--action", action,
  ]
}

async function materialize(): Promise<Uint8Array> {
  const args = parseMaterializeArguments(Bun.argv.slice(3))
  const inputBytes = new Uint8Array(await Bun.stdin.arrayBuffer())
  const built = await buildDispatches(args, inputBytes)
  const helper = record(built.admissionHelper, "admission helper")
  const helperCommit = oid(String(helper.commit), "admission helper commit")
  const helperPath = semanticString(helper.path, "admission helper path")
  const helperBlobOid = oid(String(helper.blob_oid), "admission helper blob OID")
  const helperBlobSha256 = `sha256:${semanticString(helper.blob_sha256, "admission helper blob SHA-256")}`
  const helperSize = integer(helper.size, "admission helper size")
  const scratchRoots = materializeScratchRoots(
    args.outputDirectory,
    built.dispatches.map((dispatch) => dispatch.assigned_risk_lens),
  )
  const artifacts = built.dispatches.map((dispatch) => {
    const digestValue = dispatch.sha256.slice("sha256:".length)
    const path = materializeArtifact(args.outputDirectory, dispatch.bytes, digestValue)
    const headerEnd = dispatch.bytes.indexOf(10)
    const header = canonicalRecord(dispatch.bytes.slice(0, headerEnd + 1), "dispatch header")
    const assignedLensDeltaSha256 = semanticString(
      header.assigned_lens_delta_sha256,
      "assigned lens delta SHA-256",
    )
    const admitArgv = admissionArgv(
      helperPath,
      path,
      dispatch.size,
      dispatch.sha256,
      built.auditSet,
      dispatch.assigned_risk_lens,
      assignedLensDeltaSha256,
      built.commonPacketLocator,
      helperCommit,
      helperBlobOid,
      helperBlobSha256,
      helperSize,
      built.candidateLocator,
    )
    const admissionArgs: AdmissionArguments = {
      artifact: path,
      size: dispatch.size,
      sha256: dispatch.sha256,
      auditSet: built.auditSet,
      assignedRiskLens: dispatch.assigned_risk_lens,
      assignedLensDeltaSha256,
      commonPacketLocator: built.commonPacketLocator,
      helperCommit,
      helperPath,
      helperBlobOid,
      helperBlobSha256,
      helperSize,
      candidateLocator: built.candidateLocator,
    }
    const admissionBytes = admittedFrame(admissionArgs)
    const scratchRoot = scratchRoots.get(dispatch.assigned_risk_lens)
    if (!scratchRoot) reject(`scratch root is missing for ${dispatch.assigned_risk_lens}`)
    const preBytes = preObservationFrame(admissionArgs, scratchRoot, admissionBytes)
    return {
      assigned_risk_lens: dispatch.assigned_risk_lens,
      path,
      size: dispatch.size,
      sha256: dispatch.sha256,
      audit_set: built.auditSet,
      assigned_lens_delta_sha256: assignedLensDeltaSha256,
      common_packet_locator: built.commonPacketLocator,
      helper: {
        commit: helperCommit,
        path: helperPath,
        blob_oid: helperBlobOid,
        blob_sha256: helperBlobSha256,
        size: helperSize,
      },
      candidate_locator: built.candidateLocator,
      admit: {
        role: EVALUATOR_ROLE,
        cwd: built.workingDirectory,
        argv: admitArgv,
        stdout: canonicalOutputIdentity(ADMISSION_SCHEMA, admissionBytes),
      },
      observe: {
        role: EVALUATOR_ROLE,
        cwd: built.workingDirectory,
        pre: {
          argv: observationArgv(admitArgv, scratchRoot, "pre", "emit"),
          stdout: canonicalOutputIdentity(TERMINAL_OBSERVATION_SCHEMA, preBytes),
        },
        post: {
          argv: observationArgv(admitArgv, scratchRoot, "post", "emit"),
          stdin: {
            source: "observe.pre.stdout",
            transfer: "exact-raw-bytes",
          },
          stdout: {
            schema: TERMINAL_OBSERVATION_SCHEMA,
            encoding: "canonical-json-lf",
            identity: "bind-runtime-size-and-sha256-before-consumer",
          },
        },
        verify: {
          argv: observationArgv(admitArgv, scratchRoot, "post", "verify"),
          stdin: {
            sources: ["observe.pre.stdout", "observe.post.stdout"],
            transfer: "exact-raw-concatenation-in-order",
            identity: "require-each-producer-size-and-sha256",
          },
          stdout: {
            source: "observe.post.stdout",
            transfer: "byte-exact-reproduction",
          },
        },
      },
    }
  })
  return canonicalLine({
    schema: ARTIFACT_SET_SCHEMA,
    status: "materialized",
    common_packet_locator: built.commonPacketLocator,
    artifacts,
  })
}

function canonicalRecord(bytes: Uint8Array, label: string): Record<string, unknown> {
  if (bytes.length === 0 || bytes.at(-1) !== 10 || bytes.slice(0, -1).includes(10)) {
    reject(`${label} must be exactly one JSON LF frame`)
  }
  let parsed: unknown
  try {
    parsed = JSON.parse(decodeUtf8(bytes.slice(0, -1), label))
  } catch {
    reject(`${label} must contain valid JSON`)
  }
  if (!Buffer.from(canonicalLine(parsed)).equals(Buffer.from(bytes))) {
    reject(`${label} must be canonical UTF-8 JSON-LF`)
  }
  return record(parsed, label)
}

function integer(value: unknown, field: string): number {
  if (!Number.isSafeInteger(value) || (value as number) < 0) reject(`${field} must be a non-negative safe integer`)
  return value as number
}

function stringArray(value: unknown, field: string): string[] {
  if (!Array.isArray(value) || value.some((item) => typeof item !== "string")) {
    reject(`${field} must be an array of strings`)
  }
  return value as string[]
}

function replayBinding(cwd: string, value: Record<string, unknown>, bytes: Uint8Array): {
  repository: string
  origin: Record<string, unknown>
  candidate: Record<string, unknown>
  controlPlane: Record<string, unknown>
  targetWorktree: Record<string, unknown>
  requiredFiles: string[]
  fingerprint: string
  enforcement: string
} {
  exactKeys(value, "binding", [
    "schema", "status", "repository", "enforcement", "control_plane", "origin", "candidate", "diff",
    "target_worktree", "required_files", "replay", "binding_fingerprint_sha256",
  ])
  if (value.schema !== BINDING_SCHEMA || value.status !== "bound") reject("binding schema or status mismatch")
  const controlPlane = record(value.control_plane, "binding.control_plane")
  const origin = record(value.origin, "binding.origin")
  const candidate = record(value.candidate, "binding.candidate")
  const targetWorktree = record(value.target_worktree, "binding.target_worktree")
  if (!Array.isArray(value.required_files)) reject("binding.required_files must be an array")
  const requiredFiles = value.required_files.map((item, index) => semanticString(
    record(item, `binding.required_files[${index}]`).path,
    `binding.required_files[${index}].path`,
  ))
  const enforcement = semanticString(value.enforcement, "binding.enforcement")
  const controlRepository = semanticString(controlPlane.repository, "binding.control_plane.repository")
  const targetRepository = semanticString(value.repository, "binding.repository")
  const targetRoot = semanticString(targetWorktree.root, "binding.target_worktree.root")
  const external = controlRepository !== targetRepository || targetRoot !== cwd
  const candidateKind = semanticString(candidate.kind, "binding.candidate.kind")
  const candidateLocator = semanticString(candidate.locator, "binding.candidate.locator")
  const candidateArgument = candidateKind === "local"
    ? LOCAL_CANDIDATE
    : candidateKind === "committed"
      ? semanticString(candidate.commit, "binding.candidate.commit")
      : reject("unsupported binding candidate kind")
  if (candidateKind === "local" && !/^local:sha256:[0-9a-f]{64}$/.test(candidateLocator)) {
    reject("local binding candidate locator is malformed")
  }
  if (candidateKind === "committed" && candidateLocator !== `commit:${candidateArgument}`) {
    reject("committed binding candidate locator mismatch")
  }
  const replayed = bindingLine(cwd, {
    repository: targetRepository,
    origin: semanticString(origin.commit, "binding.origin.commit"),
    candidate: candidateArgument,
    enforcement,
    requiredFiles,
    outputDirectory: "/",
    ...(external ? {
      controlRepository,
      controlOrigin: semanticString(controlPlane.head, "binding.control_plane.head"),
      targetRoot,
    } : {}),
  })
  if (!Buffer.from(replayed.bytes).equals(Buffer.from(bytes))) reject("binding does not match immutable-Origin replay")
  const fingerprint = semanticString(replayed.value.binding_fingerprint_sha256, "binding fingerprint")
  return {
    repository: semanticString(value.repository, "binding.repository"),
    origin,
    candidate,
    controlPlane,
    targetWorktree,
    requiredFiles,
    fingerprint,
    enforcement,
  }
}

function validateRuntimeHelper(cwd: string, args: AdmissionArguments): void {
  const oidValue = gitText(cwd, [
    "rev-parse", "--verify", "--end-of-options", `${args.helperCommit}:${args.helperPath}`,
  ])
  if (oidValue !== args.helperBlobOid || gitText(cwd, ["cat-file", "-t", oidValue]) !== "blob") {
    reject("helper commit/path/blob identity mismatch")
  }
  const committed = commandBytes(cwd, ["git", "cat-file", "blob", oidValue])
  const runtime = new Uint8Array(readFileSync(import.meta.path))
  if (committed.length !== args.helperSize || runtime.length !== args.helperSize) reject("helper size mismatch")
  if (`sha256:${sha256(committed)}` !== args.helperBlobSha256
      || `sha256:${sha256(runtime)}` !== args.helperBlobSha256
      || !Buffer.from(committed).equals(Buffer.from(runtime))) {
    reject("runtime helper bytes do not match the bound helper blob")
  }
}

function validatePacketHelper(
  cwd: string,
  value: unknown,
  args: AdmissionArguments,
  binding: ReturnType<typeof replayBinding>,
): string {
  const helper = record(value, "shared_core.packet_helper")
  exactKeys(helper, "shared_core.packet_helper", [
    "commit", "path", "blob_oid", "blob_sha256", "size", "invocation_argv",
  ])
  const commit = oid(String(helper.commit), "packet helper commit")
  const path = semanticString(helper.path, "packet helper path")
  const blobOid = oid(String(helper.blob_oid), "packet helper blob OID")
  const targetRoot = semanticString(binding.targetWorktree.root, "binding.target_worktree.root")
  const external = targetRoot !== cwd || binding.repository !== binding.controlPlane.repository
  const expectedHelperCommit = external ? binding.controlPlane.head : binding.candidate.commit
  if (commit !== expectedHelperCommit || path !== SCRIPT_PATH) {
    reject("artifact packet helper role binding mismatch")
  }
  const observedOid = gitText(cwd, ["rev-parse", "--verify", "--end-of-options", `${commit}:${path}`])
  const bytes = commandBytes(cwd, ["git", "cat-file", "blob", observedOid])
  if (observedOid !== blobOid || helper.blob_sha256 !== sha256(bytes) || helper.size !== bytes.length) {
    reject("artifact packet helper identity mismatch")
  }
  const admissionOrigin = external ? binding.controlPlane.head : binding.origin.commit
  const originHelperOid = gitText(cwd, [
    "rev-parse", "--verify", "--end-of-options", `${String(admissionOrigin)}:${SCRIPT_PATH}`,
  ])
  const originHelperBytes = commandBytes(cwd, ["git", "cat-file", "blob", originHelperOid])
  const expectedReviewerContract = Buffer.from(bytes).equals(Buffer.from(originHelperBytes))
    ? REVIEWER_CONTRACT
    : external
      ? reject("external packet helper must equal the immutable control-plane Origin helper")
      : validateReviewerContractRelocation(cwd, originHelperBytes, bytes, binding)
  const invocation = stringArray(helper.invocation_argv, "shared_core.packet_helper.invocation_argv")
  if (invocation.length < 3 || basename(invocation[0]) !== "bun"
      || (invocation[1] !== SCRIPT_PATH && !invocation[1].endsWith(`/${SCRIPT_PATH}`))
      || invocation[2] !== "materialize") {
    reject("artifact packet helper invocation owner mismatch")
  }
  const materialize = parseMaterializeArguments(invocation.slice(3))
  const expectedRequiredFiles = [...binding.requiredFiles].sort()
  const candidateKind = semanticString(binding.candidate.kind, "binding.candidate.kind")
  const candidateMatches = candidateKind === "local"
    ? materialize.candidate === LOCAL_CANDIDATE
      && binding.candidate.base_commit === binding.origin.commit
    : candidateKind === "committed"
      ? immutableCommit(targetRoot, materialize.candidate, "packet helper invocation target candidate")
        === binding.candidate.commit
      : false
  if (materialize.repository !== binding.repository
      || immutableCommit(targetRoot, materialize.origin, "packet helper invocation target Origin")
        !== binding.origin.commit
      || !candidateMatches
      || materialize.enforcement !== binding.enforcement
      || materialize.outputDirectory !== dirname(args.artifact)
      || materialize.targetRoot !== (external ? targetRoot : undefined)
      || materialize.controlRepository !== (external ? binding.controlPlane.repository : undefined)
      || (external
        && immutableCommit(cwd, materialize.controlOrigin!, "packet helper invocation control Origin")
          !== binding.controlPlane.head)
      || JSON.stringify([...materialize.requiredFiles].sort()) !== JSON.stringify(expectedRequiredFiles)) {
    reject("artifact packet helper invocation binding mismatch")
  }
  return expectedReviewerContract
}

function reviewerContractDeclaration(path: string): Uint8Array {
  return new TextEncoder().encode(`const REVIEWER_${"CONTRACT"} = ${JSON.stringify(path)}`)
}

function treeBlob(cwd: string, commit: string, path: string): { mode: string; oid: string } | null {
  const result = run(cwd, ["git", "ls-tree", "-z", commit, "--", path])
  if (result.exitCode !== 0) reject("reviewer contract tree lookup failed")
  if (result.stdout.length === 0) return null
  const text = decodeUtf8(result.stdout, "reviewer contract tree entry")
  const match = /^([0-7]{6}) blob ([0-9a-f]{40})\t([^\0]+)\0$/.exec(text)
  if (!match || match[3] !== path) reject("reviewer contract tree entry mismatch")
  return { mode: match[1], oid: match[2] }
}

function validateReviewerContractRelocation(
  cwd: string,
  originHelperBytes: Uint8Array,
  candidateHelperBytes: Uint8Array,
  binding: ReturnType<typeof replayBinding>,
): string {
  const oldDeclaration = Buffer.from(reviewerContractDeclaration(REVIEWER_CONTRACT))
  const newDeclaration = Buffer.from(reviewerContractDeclaration(RELOCATED_REVIEWER_CONTRACT))
  const originBytes = Buffer.from(originHelperBytes)
  const candidateBytes = Buffer.from(candidateHelperBytes)
  const declarationOffset = originBytes.indexOf(oldDeclaration)
  if (declarationOffset < 0 || originBytes.lastIndexOf(oldDeclaration) !== declarationOffset) {
    reject("Origin packet helper does not contain exactly one current reviewer contract declaration")
  }
  const expectedCandidateBytes = Buffer.concat([
    originBytes.subarray(0, declarationOffset),
    newDeclaration,
    originBytes.subarray(declarationOffset + oldDeclaration.length),
  ])
  if (!candidateBytes.equals(expectedCandidateBytes)) {
    reject("candidate packet helper is not the exact reviewer contract declaration transition")
  }
  if (!binding.requiredFiles.includes(REVIEWER_CONTRACT)) {
    reject("Origin reviewer contract is missing from replayed required-file bindings")
  }

  const originCommit = semanticString(binding.origin.commit, "binding.origin.commit")
  const candidateCommit = semanticString(binding.candidate.commit, "binding.candidate.commit")
  const originOld = treeBlob(cwd, originCommit, REVIEWER_CONTRACT)
  const originNew = treeBlob(cwd, originCommit, RELOCATED_REVIEWER_CONTRACT)
  const candidateOld = treeBlob(cwd, candidateCommit, REVIEWER_CONTRACT)
  const candidateNew = treeBlob(cwd, candidateCommit, RELOCATED_REVIEWER_CONTRACT)
  if (!originOld || originNew || candidateOld || !candidateNew) {
    reject("reviewer contract relocation endpoints do not match the predeclared transition")
  }
  if (originOld.mode !== candidateNew.mode || originOld.oid !== candidateNew.oid) {
    reject("reviewer contract relocation changed blob content or file mode")
  }
  const rename = commandBytes(cwd, [
    "git", "diff", "--name-status", "-z", "--find-renames=100%", originCommit, candidateCommit, "--",
    REVIEWER_CONTRACT, RELOCATED_REVIEWER_CONTRACT,
  ])
  const expectedRename = Buffer.from(`R100\0${REVIEWER_CONTRACT}\0${RELOCATED_REVIEWER_CONTRACT}\0`)
  if (!Buffer.from(rename).equals(expectedRename)) reject("reviewer contract relocation is not the exact Git R100 rename")
  return RELOCATED_REVIEWER_CONTRACT
}

function readArtifact(args: AdmissionArguments): Uint8Array {
  if (realpathSync(args.artifact) !== args.artifact) reject("artifact path must not contain symlink components")
  const before = lstatSync(args.artifact)
  if (!before.isFile() || before.isSymbolicLink()) reject("artifact must be a non-symlink regular file")
  if ((before.mode & 0o222) !== 0) reject("artifact must be read-only")
  if (before.size !== args.size) reject("artifact size mismatch")
  if (basename(args.artifact) !== `${args.sha256.slice("sha256:".length)}.dispatch`) {
    reject("artifact path is not content-addressed by the expected whole SHA-256")
  }
  const descriptor = openSync(args.artifact, fsConstants.O_RDONLY | fsConstants.O_NOFOLLOW)
  try {
    const opened = fstatSync(descriptor)
    if (!sameFile(before, opened) || !opened.isFile() || (opened.mode & 0o222) !== 0) {
      reject("artifact changed between path validation and open")
    }
    const bytes = new Uint8Array(args.size)
    let offset = 0
    while (offset < bytes.length) {
      const count = readSync(descriptor, bytes, offset, bytes.length - offset, offset)
      if (count === 0) reject("artifact truncated during read")
      offset += count
    }
    const extra = new Uint8Array(1)
    if (readSync(descriptor, extra, 0, 1, offset) !== 0) reject("artifact has appended bytes")
    const afterRead = fstatSync(descriptor)
    const afterPath = lstatSync(args.artifact)
    if (!sameFile(before, afterRead) || !sameFile(afterPath, afterRead)
        || before.mtimeMs !== afterRead.mtimeMs || before.ctimeMs !== afterRead.ctimeMs) {
      reject("artifact or path drifted during read")
    }
    if (`sha256:${sha256(bytes)}` !== args.sha256) reject("artifact whole SHA-256 mismatch")
    return bytes
  } finally {
    closeSync(descriptor)
  }
}

function validateSharedCore(
  cwd: string,
  value: Record<string, unknown>,
  raw: Uint8Array,
  args: AdmissionArguments,
  binding: ReturnType<typeof replayBinding>,
): string {
  exactKeys(value, "shared_core", [
    "schema", "candidate_locator", "control_plane", "target_worktree", "packet_helper", "frame", "frame_utf8_size",
    "frame_utf8_sha256", "plan", "plan_utf8_size", "plan_utf8_sha256", "audit_set", "required_lenses",
    "lens_manifest", "admission", "replay",
  ])
  if (value.schema !== SHARED_CORE_SCHEMA || value.candidate_locator !== args.candidateLocator) {
    reject("shared core schema or candidate locator mismatch")
  }
  if (`sha256:${sha256(raw)}` !== args.commonPacketLocator) reject("shared core common locator mismatch")
  const external = binding.repository !== binding.controlPlane.repository
    || binding.targetWorktree.root !== cwd
  const expectedAdmissionHelper = external ? binding.controlPlane.head : binding.origin.commit
  if (args.helperCommit !== expectedAdmissionHelper || args.helperCommit !== binding.controlPlane.head) {
    reject("admission helper does not belong to binding Origin")
  }
  if (binding.candidate.locator !== args.candidateLocator) {
    reject("binding candidate does not match compact locator")
  }
  const control = record(value.control_plane, "shared_core.control_plane")
  exactKeys(control, "shared_core.control_plane", [
    "head", "tree", "worktree_candidate_material_fingerprint_sha256", "enforcement", "binding_identity",
    "mutation_observation",
  ])
  if (control.head !== binding.controlPlane.head || control.tree !== binding.controlPlane.tree
      || control.worktree_candidate_material_fingerprint_sha256
        !== binding.controlPlane.worktree_candidate_material_fingerprint_sha256
      || control.binding_identity !== `${BINDING_SCHEMA}:${binding.fingerprint}`
      || control.enforcement !== binding.enforcement
      || control.mutation_observation !== "none") {
    reject("shared core control-plane or binding identity mismatch")
  }
  const target = record(value.target_worktree, "shared_core.target_worktree")
  exactKeys(target, "shared_core.target_worktree", [
    "repository", "head", "tree", "worktree_candidate_material_fingerprint_sha256", "ignored_material_policy",
  ])
  if (target.repository !== binding.repository
      || target.head !== binding.targetWorktree.head
      || target.tree !== binding.candidate.tree
      || target.worktree_candidate_material_fingerprint_sha256
        !== binding.targetWorktree.worktree_candidate_material_fingerprint_sha256
      || target.ignored_material_policy !== binding.targetWorktree.ignored_material_policy) {
    reject("shared core target worktree binding mismatch")
  }
  const reviewerContract = validatePacketHelper(cwd, value.packet_helper, args, binding)
  const frame = semanticString(value.frame, "shared_core.frame")
  const plan = semanticString(value.plan, "shared_core.plan")
  const frameBytes = new TextEncoder().encode(frame)
  const planBytes = new TextEncoder().encode(plan)
  if (value.frame_utf8_size !== frameBytes.length || value.frame_utf8_sha256 !== `sha256:${sha256(frameBytes)}`
      || value.plan_utf8_size !== planBytes.length || value.plan_utf8_sha256 !== `sha256:${sha256(planBytes)}`) {
    reject("shared core Frame or Plan byte binding mismatch")
  }
  const requiredLenses = stringArray(value.required_lenses, "shared_core.required_lenses")
  if (value.audit_set !== args.auditSet) reject("shared core audit set mismatch")
  if (value.audit_set === "single" && requiredLenses.length !== 1) reject("single audit set lens count mismatch")
  if (value.audit_set === "complementary_pair"
      && JSON.stringify(requiredLenses) !== JSON.stringify(LENS_ORDER)) reject("complementary lens order mismatch")
  if (!requiredLenses.includes(args.assignedRiskLens)) reject("assigned lens missing from shared core")
  if (!Array.isArray(value.lens_manifest) || value.lens_manifest.length !== requiredLenses.length) {
    reject("shared core lens manifest mismatch")
  }
  value.lens_manifest.forEach((item, index) => {
    const manifest = record(item, `shared_core.lens_manifest[${index}]`)
    exactKeys(manifest, `shared_core.lens_manifest[${index}]`, ["name", "sha256", "size"])
    if (manifest.name !== requiredLenses[index]) reject("lens manifest order mismatch")
    digest(String(manifest.sha256), `shared_core.lens_manifest[${index}].sha256`)
    integer(manifest.size, `shared_core.lens_manifest[${index}].size`)
    if (manifest.name === args.assignedRiskLens && manifest.sha256 !== args.assignedLensDeltaSha256) {
      reject("assigned lens manifest digest mismatch")
    }
  })
  const admission = record(value.admission, "shared_core.admission")
  exactKeys(admission, "shared_core.admission", [
    "planned_launch_context", "instruction_origin", "automatic_discovery_boundary", "parent_receipt_route",
  ])
  const replay = record(value.replay, "shared_core.replay")
  exactKeys(replay, "shared_core.replay", [
    "main_ci_corroboration", "optional_supporting_claims", "concurrently_pending", "unavailable_evidence",
  ])
  for (const [field, item] of [...Object.entries(admission), ...Object.entries(replay)]) {
    semanticString(item, `shared_core.${field}`)
  }
  return reviewerContract
}

function validateLens(value: Record<string, unknown>, args: AdmissionArguments): void {
  exactKeys(value, "lens_delta", [
    "schema", "assigned_risk_lens", "activation_predicate", "required_inspected_scope",
    "required_terminal_evidence", "representative_refutation", "stop",
  ])
  if (value.schema !== LENS_DELTA_SCHEMA || value.assigned_risk_lens !== args.assignedRiskLens) {
    reject("lens delta schema or assigned lens mismatch")
  }
  for (const field of [
    "activation_predicate", "required_inspected_scope", "required_terminal_evidence",
    "representative_refutation", "stop",
  ]) semanticString(value[field], `lens_delta.${field}`)
}

function admittedFrame(args: AdmissionArguments): Uint8Array {
  const cwd = gitText(process.cwd(), ["rev-parse", "--show-toplevel"])
  validateRuntimeHelper(cwd, args)
  const bytes = readArtifact(args)
  const headerEnd = bytes.indexOf(10)
  if (headerEnd < 0) reject("dispatch header LF is missing")
  const header = canonicalRecord(bytes.slice(0, headerEnd + 1), "dispatch header")
  exactKeys(header, "dispatch header", [
    "schema", "purpose", "reviewer_contract", "common_packet_locator", "assigned_risk_lens",
    "assigned_lens_delta_sha256", "segments",
  ])
  if (header.schema !== DISPATCH_SCHEMA || header.purpose !== "independent candidate audit"
      || header.common_packet_locator !== args.commonPacketLocator
      || header.assigned_risk_lens !== args.assignedRiskLens
      || header.assigned_lens_delta_sha256 !== args.assignedLensDeltaSha256) {
    reject("dispatch header binding mismatch")
  }
  if (!Array.isArray(header.segments) || header.segments.length !== 3) reject("dispatch segments mismatch")
  const expectedNames = ["binding", "shared_core", "lens_delta"]
  const slices: Uint8Array[] = []
  let offset = headerEnd + 1
  header.segments.forEach((item, index) => {
    const segment = record(item, `dispatch.segments[${index}]`)
    exactKeys(segment, `dispatch.segments[${index}]`, ["name", "encoding", "size", "sha256"])
    if (segment.name !== expectedNames[index] || segment.encoding !== "utf-8") {
      reject("dispatch segment order, name, or encoding mismatch")
    }
    const size = integer(segment.size, `dispatch.segments[${index}].size`)
    const end = offset + size
    if (end > bytes.length) reject(`dispatch segment ${String(segment.name)} is truncated`)
    const raw = bytes.slice(offset, end)
    if (segment.sha256 !== `sha256:${sha256(raw)}`) reject(`dispatch segment ${String(segment.name)} digest mismatch`)
    slices.push(raw)
    offset = end
  })
  if (offset !== bytes.length) reject("dispatch has appended bytes or incorrect segment sizes")
  if (`sha256:${sha256(slices[1])}` !== args.commonPacketLocator
      || `sha256:${sha256(slices[2])}` !== args.assignedLensDeltaSha256) {
    reject("dispatch common or assigned lens raw digest mismatch")
  }

  const bindingValue = canonicalRecord(slices[0], "binding")
  const sharedCoreValue = canonicalRecord(slices[1], "shared_core")
  const lensValue = canonicalRecord(slices[2], "lens_delta")
  const binding = replayBinding(cwd, bindingValue, slices[0])
  const expectedReviewerContract = validateSharedCore(cwd, sharedCoreValue, slices[1], args, binding)
  if (header.reviewer_contract !== expectedReviewerContract) reject("dispatch reviewer contract binding mismatch")
  validateLens(lensValue, args)
  return canonicalLine({
    schema: ADMISSION_SCHEMA,
    status: "admitted",
    artifact: { path: args.artifact, size: args.size, sha256: args.sha256 },
    common_packet_locator: args.commonPacketLocator,
    audit_set: args.auditSet,
    assigned_risk_lens: args.assignedRiskLens,
    assigned_lens_delta_sha256: args.assignedLensDeltaSha256,
    candidate_locator: args.candidateLocator,
    helper: {
      commit: args.helperCommit,
      path: args.helperPath,
      blob_oid: args.helperBlobOid,
      blob_sha256: args.helperBlobSha256,
      size: args.helperSize,
    },
    binding: bindingValue,
    shared_core: sharedCoreValue,
    lens_delta: lensValue,
  })
}

function preObservationFrame(
  args: AdmissionArguments,
  scratchRoot: string,
  admission: Uint8Array,
): Uint8Array {
  const preManifestSha256 = emptyScratchManifestSha256()
  return canonicalLine({
    schema: TERMINAL_OBSERVATION_SCHEMA,
    status: "observed",
    phase: "pre",
    candidate_locator: args.candidateLocator,
    common_packet_locator: args.commonPacketLocator,
    assigned_risk_lens: args.assignedRiskLens,
    scratch_root: scratchRoot,
    root_mode: "0700",
    pre_manifest_sha256: preManifestSha256,
    post_manifest_sha256: preManifestSha256,
    files: 0,
    bytes: 0,
    outside_state_procedure: {
      admission_replay_sha256: `sha256:${sha256(admission)}`,
      packet_named_fingerprints: OUTSIDE_STATE_PROCEDURE,
    },
  })
}

function admit(): Uint8Array {
  return admittedFrame(parseAdmissionArguments(Bun.argv.slice(3)))
}

interface ScratchEntry {
  rawPath: Buffer
  record: Record<string, unknown>
}

function modeText(mode: number): string {
  return (mode & 0o7777).toString(8).padStart(4, "0")
}

function directoryNames(path: string): Buffer[] {
  return (readdirSync(path, { encoding: "buffer" }) as Buffer[]).sort(Buffer.compare)
}

function relativePath(raw: Buffer): string {
  const path = decodeUtf8(raw, "scratch relative path")
  if (!Buffer.from(path, "utf8").equals(raw)) reject("scratch relative path is not canonical UTF-8")
  return path
}

function readStableFile(path: string, before: ReturnType<typeof lstatSync>, owner: number): Uint8Array {
  const descriptor = openSync(path, fsConstants.O_RDONLY | fsConstants.O_NOFOLLOW)
  try {
    const opened = fstatSync(descriptor)
    if (!sameFile(before, opened) || !opened.isFile() || opened.uid !== owner || opened.nlink !== 1) {
      reject("scratch file changed, has the wrong owner, or has aliases before read")
    }
    const bytes = new Uint8Array(readFileSync(descriptor))
    const afterRead = fstatSync(descriptor)
    const afterPath = lstatSync(path)
    if (!sameFile(before, afterRead) || !sameFile(afterPath, afterRead)
        || afterRead.uid !== owner || afterRead.nlink !== 1
        || before.mtimeMs !== afterRead.mtimeMs || before.ctimeMs !== afterRead.ctimeMs) {
      reject("scratch file or path drifted during read")
    }
    return bytes
  } finally {
    closeSync(descriptor)
  }
}

function scanScratch(root: string): { manifestSha256: string; files: number; bytes: number; rootMode: string } {
  if (realpathSync(root) !== root) reject("scratch root must not contain symlink components")
  const rootStat = lstatSync(root)
  if (!rootStat.isDirectory() || rootStat.isSymbolicLink()) reject("scratch root must be a non-symlink directory")
  const rootMode = modeText(rootStat.mode)
  if (rootMode !== "0700") reject("scratch root mode must be 0700")
  const owner = process.geteuid?.()
  if (owner === undefined || rootStat.uid !== owner) reject("scratch root must be owned by the evaluator user")

  const entries: ScratchEntry[] = []
  let files = 0
  let bytes = 0
  const visit = (absolutePath: string, rawPath: Buffer, topLevel: boolean): void => {
    const path = relativePath(rawPath)
    const before = lstatSync(absolutePath)
    if (before.isSymbolicLink()) reject(`scratch entry must not be a symlink: ${path}`)
    const mode = modeText(before.mode)
    if ((before.mode & 0o022) !== 0) reject(`scratch entry must not be group- or other-writable: ${path}`)
    if (before.uid !== owner) reject(`scratch entry must be owned by the evaluator user: ${path}`)
    if (before.isDirectory()) {
      if (topLevel && mode !== "0700") reject(`scratch top-level directory mode must be 0700: ${path}`)
      const descriptor = openSync(
        absolutePath,
        fsConstants.O_RDONLY | fsConstants.O_DIRECTORY | fsConstants.O_NOFOLLOW,
      )
      try {
        const opened = fstatSync(descriptor)
        if (!sameFile(before, opened) || !opened.isDirectory() || opened.uid !== owner) {
          reject(`scratch directory changed or has the wrong owner before traversal: ${path}`)
        }
        entries.push({ rawPath, record: { path, type: "directory", mode } })
        for (const name of directoryNames(absolutePath)) {
          const childRaw = Buffer.concat([rawPath, Buffer.from("/"), name])
          visit(resolve(absolutePath, relativePath(name)), childRaw, false)
        }
        const afterTraversal = fstatSync(descriptor)
        const afterPath = lstatSync(absolutePath)
        if (!sameFile(before, afterTraversal) || !sameFile(afterPath, afterTraversal)
            || afterTraversal.uid !== owner
            || before.mtimeMs !== afterTraversal.mtimeMs || before.ctimeMs !== afterTraversal.ctimeMs) {
          reject(`scratch directory or path drifted during traversal: ${path}`)
        }
      } finally {
        closeSync(descriptor)
      }
      return
    }
    if (!before.isFile()) reject(`unsupported scratch entry type: ${path}`)
    if (before.nlink !== 1) reject(`scratch file must not have hard-link aliases: ${path}`)
    const content = readStableFile(absolutePath, before, owner)
    entries.push({
      rawPath,
      record: {
        path,
        type: "file",
        mode,
        size: content.length,
        sha256: `sha256:${sha256(content)}`,
      },
    })
    files += 1
    bytes += content.length
    if (!Number.isSafeInteger(bytes)) reject("scratch byte count exceeds the safe integer range")
  }
  const rootDescriptor = openSync(root, fsConstants.O_RDONLY | fsConstants.O_DIRECTORY | fsConstants.O_NOFOLLOW)
  try {
    const openedRoot = fstatSync(rootDescriptor)
    if (!sameFile(rootStat, openedRoot) || !openedRoot.isDirectory() || openedRoot.uid !== owner) {
      reject("scratch root changed or has the wrong owner before traversal")
    }
    const topNames = directoryNames(root)
    const expectedNames = SCRATCH_DIRECTORIES.map((name) => Buffer.from(name))
    if (topNames.length !== expectedNames.length
        || topNames.some((name, index) => !Buffer.from(name).equals(expectedNames[index]!))) {
      reject(`scratch root must contain exactly: ${SCRATCH_DIRECTORIES.join(" ")}`)
    }
    for (const name of topNames) visit(resolve(root, relativePath(name)), name, true)
    const afterTraversal = fstatSync(rootDescriptor)
    const afterPath = lstatSync(root)
    if (!sameFile(rootStat, afterTraversal) || !sameFile(afterPath, afterTraversal)
        || afterTraversal.uid !== owner
        || rootStat.mtimeMs !== afterTraversal.mtimeMs || rootStat.ctimeMs !== afterTraversal.ctimeMs) {
      reject("scratch root or path drifted during traversal")
    }
  } finally {
    closeSync(rootDescriptor)
  }
  entries.sort((left, right) => Buffer.compare(left.rawPath, right.rawPath))
  const manifest = concatBytes(entries.map((entry) => canonicalLine(entry.record)))
  return { manifestSha256: `sha256:${sha256(manifest)}`, files, bytes, rootMode }
}

function emptyScratchManifestSha256(): string {
  const manifest = concatBytes(SCRATCH_DIRECTORIES.map((path) => canonicalLine({
    path,
    type: "directory",
    mode: "0700",
  })))
  return `sha256:${sha256(manifest)}`
}

async function observe(): Promise<Uint8Array> {
  const args = parseObservationArguments(Bun.argv.slice(3))
  const admission = admittedFrame(args.admission)
  const scratch = scanScratch(args.scratchRoot)
  const preManifestSha256 = emptyScratchManifestSha256()
  const preObservation = preObservationFrame(args.admission, args.scratchRoot, admission)
  if (args.phase === "pre") {
    if (scratch.manifestSha256 !== preManifestSha256 || scratch.files !== 0 || scratch.bytes !== 0) {
      reject("pre observation requires the exact empty scratch manifest")
    }
    return preObservation
  }

  const input = new Uint8Array(await Bun.stdin.arrayBuffer())
  const preEnd = input.indexOf(10) + 1
  const preReceipt = args.action === "emit" ? input : input.slice(0, preEnd)
  const terminalReceipt = args.action === "verify" ? input.slice(preEnd) : new Uint8Array()
  if (preEnd === 0 || !Buffer.from(preReceipt).equals(Buffer.from(preObservation))) {
    reject("post observation requires the exact raw pre observation")
  }
  const expected = canonicalLine({
    schema: TERMINAL_OBSERVATION_SCHEMA,
    status: "observed",
    phase: "post",
    candidate_locator: args.admission.candidateLocator,
    common_packet_locator: args.admission.commonPacketLocator,
    assigned_risk_lens: args.admission.assignedRiskLens,
    scratch_root: args.scratchRoot,
    root_mode: scratch.rootMode,
    pre_observation_sha256: `sha256:${sha256(preReceipt)}`,
    pre_manifest_sha256: preManifestSha256,
    post_manifest_sha256: scratch.manifestSha256,
    files: scratch.files,
    bytes: scratch.bytes,
    outside_state_procedure: {
      admission_replay_sha256: `sha256:${sha256(admission)}`,
      packet_named_fingerprints: OUTSIDE_STATE_PROCEDURE,
    },
  })
  if (args.action === "verify") {
    if (!Buffer.from(terminalReceipt).equals(Buffer.from(expected))) {
      reject("terminal observation does not byte-match the deterministic replay")
    }
  }
  return expected
}

const mode = Bun.argv[2]
try {
  let result: Uint8Array
  if (mode === "materialize") result = await materialize()
  else if (mode === "admit") result = admit()
  else if (mode === "observe") result = await observe()
  else reject("required mode: materialize | admit | observe")
  await Bun.write(Bun.stdout, result)
} catch (error) {
  const reason = error instanceof Error ? error.message : "unknown failure"
  const schema = mode === "admit" ? ADMISSION_SCHEMA
    : mode === "observe" ? TERMINAL_OBSERVATION_SCHEMA
      : ARTIFACT_SET_SCHEMA
  await Bun.write(Bun.stdout, canonicalLine({ schema, status: "rejected", reason }))
  process.exitCode = 1
}
