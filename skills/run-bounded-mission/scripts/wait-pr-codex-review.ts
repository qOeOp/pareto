#!/usr/bin/env bun

import { createHash } from "node:crypto"

const PROVIDER_LOGIN = "chatgpt-codex-connector"
const PROVIDER_APP_ID = 1144995
const RECEIPT_SCHEMA = "codex-review-receipt/v2"
const REQUEST_VALIDATION_SCHEMA = "codex-review-request-validation/v1"
const REQUEST_EFFECT_PREFLIGHT_SCHEMA = "codex-review-request-effect-preflight/v1"
const DELIVERY_BARRIER_INPUT_SCHEMA = "delivery-barrier-input/v3"
const DELIVERY_BARRIER_EVIDENCE_SCHEMA = "delivery-barrier-evidence/v3"
const DELIVERY_BARRIER_RECEIPT_SCHEMA = "delivery-barrier-receipt/v3"
const CLEAN_COMMENT_HEADING = /^Codex Review: Didn['’]t find any major issues\.(?: (?=[^\r\n]{1,64}$)\S(?:[^\r\n]*\S)?)?$/
const REVIEWED_COMMIT = /^\*\*Reviewed commit:\*\* `([0-9a-f]{7,40})`$/
const USAGE_FAILURE = /(usage limit|rate limit|quota exceeded|try again later)/i
const REVIEW_REQUEST = /^@codex[ \t]+review\b/i
const EXACT_HEAD_REVIEW_REQUEST = /^@codex review\n\nExact head: `([0-9a-f]{40})`$/
const REQUESTED_HEAD = /^@codex review\n\nExact head:\s*`?([0-9a-f]{40})`?$/

export type RequestClassification =
  | "valid"
  | "missing"
  | "malformed"
  | "edited"
  | "ambiguous"
  | "wrong-head"
  | "self-trigger"
  | "incomplete"

export type DiscoveryStatus = "waiting" | "clean" | "finding_unrouted" | "finding_routed"

export type DiscoveryProblem =
  | "pull-request-closed"
  | "snapshot-incomplete"
  | "usage-failure"
  | "provider-edited"
  | "provider-wrong-head"
  | "provider-result-incomplete"

export type ProviderSignalClassification =
  | "clean_authority"
  | "progress"
  | "finding"
  | "capability_unavailable"
  | "notification"
  | "unknown"

export interface GitHubAppProvenance {
  id: number
  slug: string
}

export interface ReviewReaction {
  author: string
  at: string
  content: string
}

export interface ReviewSignal {
  author: string
  at: string
  kind: "comment" | "reaction" | "review"
  target: string
  body?: string
  reaction?: string
  reviewState?: string
  reviewId?: string
  commitOid?: string
  locator?: string
  databaseId?: number
  url?: string
  performedViaGithubApp?: GitHubAppProvenance | null
  includesCreatedEdit?: boolean
  lastEditedAt?: string
  updatedAt?: string
  reactions?: ReviewReaction[]
}

export interface ReviewThread {
  locator?: string
  resolved: boolean
  resolvedBy?: string
  comments: Array<{
    locator?: string
    url?: string
    author: string
    at: string
    body: string
    reviewId?: string
    includesCreatedEdit?: boolean
    lastEditedAt?: string
    reactions?: ReviewReaction[]
  }>
}

export interface CodexReviewSnapshot {
  state: string
  headRefOid: string
  createdAt: string
  complete: boolean
  signals: ReviewSignal[]
  threads: ReviewThread[]
}

export interface CodexReviewDecision {
  status: "passed" | "pending" | "failed"
  reason: string
  request: ReviewRequestProjection
  discovery: ReviewDiscoveryProjection
  exitCode: 0 | 1 | 10 | 20
}

export interface ObservedReviewRequestProjection {
  classification: RequestClassification
  locator: string | null
  comment_id: number | null
  url: string | null
  author: string | null
  created_at: string | null
  updated_at: string | null
  edited: boolean | null
  body: string | null
  requested_head: string | null
  provenance_complete: boolean
  performed_via_github_app: GitHubAppProvenance | null
}

export interface ReviewRequestProjection extends ObservedReviewRequestProjection {
  expected_locator: string
  expected_author: string
  binding_matches: boolean | null
  candidate_locators: string[]
  observed: ObservedReviewRequestProjection[]
  effect_authority?: ReviewRequestEffectAuthorityProjection
}

export type RequestEffectAuthorityDisposition =
  | "posting_allowed_first_request"
  | "posting_frozen_prior_attempt_exists"
  | "posting_frozen_attempt_provenance"
  | "posting_frozen_snapshot_incomplete"

export interface ReviewRequestEffectAuthorityProjection {
  disposition: RequestEffectAuthorityDisposition
  effect_allowed: boolean
  request_author: string
  attempt_count: number
  attempt_locators: string[]
  attempts: ObservedReviewRequestProjection[]
  latest_attempt_at: string | null
}

export interface ReviewRequestExpectation {
  locator: string
  author: string
}

export interface ReviewEvidenceProjection {
  locator: string
  url: string | null
  author: string
  at: string
  body: string
  edited: boolean
}

export interface ProviderReviewProjection {
  locator: string
  url: string | null
  author: string
  at: string
  state: string
  reviewed_head: string
  edited: boolean
}

export interface ReviewFindingProjection {
  reviewed_head: string | null
  provider_review: ProviderReviewProjection | null
  finding: ReviewEvidenceProjection
  thread: {
    locator: string
    resolved: boolean
    resolver: string | null
  } | null
  disposition: ReviewEvidenceProjection | null
  routed: boolean
}

export interface ReviewAttemptHistoryProjection {
  request: ObservedReviewRequestProjection
  provider_signals: ProviderSignalEnvelope[]
  boundary_provider_signals: ProviderSignalEnvelope[]
  boundary_provider_threads: ReviewThread[]
  findings: ReviewFindingProjection[]
}

export interface ProviderSignalEnvelope {
  classification: ProviderSignalClassification
  reviewed_head: string | null
  signal: ReviewSignal
}

export interface ReviewDiscoveryProjection {
  status: DiscoveryStatus
  reviewed_head: string | null
  provider_review: ProviderReviewProjection | null
  clean_signal: ReviewEvidenceProjection | null
  progress_signal: ReviewEvidenceProjection | null
  findings: ReviewFindingProjection[]
  provider_signals: ProviderSignalEnvelope[]
  history: ReviewAttemptHistoryProjection[]
  problems: DiscoveryProblem[]
}

const DELIVERY_EVIDENCE_KINDS = [
  "real_consumer",
  "root",
  "audit",
  "ci",
  "provider",
  "conversation",
  "drift",
] as const

type DeliveryEvidenceKind = typeof DELIVERY_EVIDENCE_KINDS[number]

interface DeliveryEvidenceLocator {
  kind: DeliveryEvidenceKind
  locator: string
  head_oid: string
  result: string
  content_sha256: string | null
}

interface DeliveryBarrierEvidence {
  schema: typeof DELIVERY_BARRIER_EVIDENCE_SCHEMA
  repository: string
  pull_request: number
  head_oid: string
  head_tree_oid: string
  base_ref: string
  base_oid: string
  merge_commit_oid: string | null
  merge_tree_oid: string | null
  queue_state: string
  evidence: DeliveryEvidenceLocator[]
}

interface DeliveryBarrierReceipt {
  schema: typeof DELIVERY_BARRIER_RECEIPT_SCHEMA
  bytes: number
  sha256: string
  receipt: DeliveryBarrierEvidence
}

export function renderCodexReviewRequest(headOid: string): string {
  if (!/^[0-9a-f]{40}$/.test(headOid)) throw new Error("head must be a full lowercase 40-hex OID")
  return `@codex review\n\nExact head: \`${headOid}\``
}

export function validateCodexReviewRequest(body: string, expectedHead: string): {
  schema: typeof REQUEST_VALIDATION_SCHEMA
  classification: "valid" | "malformed" | "wrong-head"
  expected_head: string
  requested_head: string | null
  body: string
} {
  if (!/^[0-9a-f]{40}$/.test(expectedHead)) throw new Error("head must be a full lowercase 40-hex OID")
  const requestedHead = EXACT_HEAD_REVIEW_REQUEST.exec(body)?.[1] ?? REQUESTED_HEAD.exec(body)?.[1] ?? null
  const classification = EXACT_HEAD_REVIEW_REQUEST.test(body)
    ? (requestedHead === expectedHead ? "valid" : "wrong-head")
    : "malformed"
  return {
    schema: REQUEST_VALIDATION_SCHEMA,
    classification,
    expected_head: expectedHead,
    requested_head: requestedHead,
    body,
  }
}

export function classifyRequestEffectAuthority(
  snapshot: CodexReviewSnapshot,
  requestAuthor: string,
): ReviewRequestEffectAuthorityProjection {
  if (!/^[A-Za-z\d](?:[A-Za-z\d-]{0,37}[A-Za-z\d])?$/.test(requestAuthor)) {
    throw new Error("request author is invalid")
  }

  const rawAttempts = extractRequestAttempts(snapshot)
  const attempts = rawAttempts.map((signal) => projectObservedRequest(snapshot, signal))
  const attemptLocators = attempts.map((attempt) => attempt.locator)
    .filter((locator): locator is string => locator !== null)
  const latestAttemptAt = attempts.at(-1)?.created_at ?? null
  const attemptProvenanceComplete = attempts.every((attempt) =>
    attempt.locator !== null
      && attempt.author?.toLowerCase() === requestAuthor.toLowerCase()
      && attempt.edited === false
      && attempt.provenance_complete
      && attempt.performed_via_github_app === null
      && isIsoTimestamp(attempt.created_at),
  )

  let disposition: RequestEffectAuthorityDisposition
  let effectAllowed = false
  if (!snapshot.complete) disposition = "posting_frozen_snapshot_incomplete"
  else if (!attemptProvenanceComplete) disposition = "posting_frozen_attempt_provenance"
  else if (attempts.length === 0) {
    disposition = "posting_allowed_first_request"
    effectAllowed = true
  } else disposition = "posting_frozen_prior_attempt_exists"

  return {
    disposition,
    effect_allowed: effectAllowed,
    request_author: requestAuthor,
    attempt_count: attempts.length,
    attempt_locators: attemptLocators,
    attempts,
    latest_attempt_at: latestAttemptAt,
  }
}

export function classifyCodexReview(
  snapshot: CodexReviewSnapshot,
  expectation: ReviewRequestExpectation,
): CodexReviewDecision {
  const { request, expectedAttempt, nextRequestAt, attempts } = classifyRequest(snapshot, expectation)
  request.effect_authority = classifyRequestEffectAuthority(snapshot, expectation.author)
  const currentAttempt = request.classification === "valid" ? expectedAttempt : null
  const attemptAt = currentAttempt ? timestampValue(currentAttempt.at) : timestampValue(snapshot.createdAt)
  const attemptTarget = currentAttempt?.target ?? "pull-request"
  const expectedRequestedHead = currentAttempt
    ? projectObservedRequest(snapshot, currentAttempt).requested_head
    : null
  const allProviderSignals = exhaustiveProviderSignals(snapshot).filter((signal) =>
    !(signal.kind === "comment" && signalLocator(signal) === expectation.locator))
    .sort(compareSignals)
  const history = attempts.map((attempt, index) => {
    const historyAt = timestampValue(attempt.at)
    const nextHistoryAt = attempts.slice(index + 1)
      .map((value) => timestampValue(value.at))
      .find((value) => value > historyAt) ?? null
    const historyRequest = projectObservedRequest(snapshot, attempt)
    const providerSignals = allProviderSignals.filter((signal) =>
      timestampValue(signal.at) > historyAt
        && (nextHistoryAt === null || timestampValue(signal.at) < nextHistoryAt),
    )
    const boundaryProviderSignals = allProviderSignals.filter((signal) =>
      timestampValue(signal.at) === historyAt || timestampValue(signal.at) === nextHistoryAt,
    )
    const boundaryProviderThreads = snapshot.threads.filter((thread) => {
      const first = thread.comments[0]
      const firstAt = timestampValue(first?.at ?? "")
      return isProvider(first?.author ?? "") && (firstAt === historyAt || firstAt === nextHistoryAt)
    })
    const { findings } = projectFindings(
      snapshot,
      providerSignals.filter((signal) => signal.kind !== "review" || signal.commitOid === historyRequest.requested_head),
      attempt.author,
      historyAt,
      nextHistoryAt,
    )
    return {
      request: historyRequest,
      provider_signals: providerSignals.map((signal) => providerSignalEnvelope(
        signal,
        historyRequest.requested_head,
        attempt.target,
      )),
      boundary_provider_signals: boundaryProviderSignals.map((signal) => providerSignalEnvelope(
        signal,
        historyRequest.requested_head,
        attempt.target,
      )),
      boundary_provider_threads: boundaryProviderThreads,
      findings,
    }
  })
  const currentProviderSignals = allProviderSignals.filter(
    (signal) => currentAttempt !== null
      && timestampValue(signal.at) > attemptAt
      && (nextRequestAt === null || timestampValue(signal.at) < nextRequestAt),
  )
  const providerSignals = currentProviderSignals.map((signal) => providerSignalEnvelope(
    signal,
    expectedRequestedHead,
    attemptTarget,
  ))
  const problems: DiscoveryProblem[] = []
  if (snapshot.state !== "OPEN") problems.push("pull-request-closed")
  if (!snapshot.complete) problems.push("snapshot-incomplete")
  if (currentAttempt && allProviderSignals.some((signal) =>
    timestampValue(signal.at) === attemptAt || timestampValue(signal.at) === nextRequestAt,
  )) problems.push("provider-result-incomplete")
  if (currentAttempt && snapshot.threads.some((thread) => {
    const first = thread.comments[0]
    const firstAt = timestampValue(first?.at ?? "")
    return isProvider(first?.author ?? "") && (firstAt === attemptAt || firstAt === nextRequestAt)
  })) problems.push("provider-result-incomplete")
  if (currentProviderSignals.some((signal) => isEditedSignal(signal) && (
    signal.kind === "review" || signal.kind === "comment"
  ))) problems.push("provider-edited")
  if (providerSignals.some((envelope) => envelope.classification === "unknown")) {
    problems.push("provider-result-incomplete")
  }
  const usageFailure = providerSignals.find((envelope) =>
    envelope.classification === "capability_unavailable")
  if (usageFailure) problems.push("usage-failure")
  if (currentProviderSignals.some((signal) => {
    if (signal.kind === "review") {
      return signal.commitOid !== undefined && signal.commitOid !== expectedRequestedHead
    }
    const reviewedCommit = signal.kind === "comment" ? cleanNotificationHead(signal.body ?? "") : null
    return reviewedCommit !== null && !expectedRequestedHead?.startsWith(reviewedCommit)
  })) problems.push("provider-wrong-head")

  const { findings, incomplete } = projectFindings(
    snapshot,
    currentProviderSignals.filter((signal) => signal.kind !== "review" || signal.commitOid === expectedRequestedHead),
    currentAttempt?.author ?? expectation.author,
    attemptAt,
    nextRequestAt,
  )
  if (incomplete) problems.push("provider-result-incomplete")
  const relatedEyes = providerSignals.filter((envelope) => envelope.classification === "progress")
  const cleanTerminal = currentAttempt
    ? providerSignals.find((envelope) => envelope.classification === "clean_authority")
    : undefined
  const routedFindings = findings.length > 0 && findings.every((finding) => finding.routed)
  const discoveryStatus: DiscoveryStatus = findings.length > 0
    ? (routedFindings ? "finding_routed" : "finding_unrouted")
    : (cleanTerminal ? "clean" : "waiting")
  const findingReview = [...findings].reverse().find((finding) => finding.provider_review !== null)?.provider_review ?? null
  const terminalReview = cleanTerminal?.signal.kind === "review"
    ? providerReviewProjection(cleanTerminal.signal)
    : null
  const observedReview = currentProviderSignals
    .filter((signal) => signal.kind === "review" && signal.commitOid === expectedRequestedHead)
    .map(providerReviewProjection)
    .filter((review): review is ProviderReviewProjection => review !== null)
    .at(-1) ?? null
  const reviewedHead = findings.at(-1)?.reviewed_head
    ?? cleanTerminal?.reviewed_head
    ?? observedReview?.reviewed_head
    ?? (cleanTerminal ? expectedRequestedHead : null)
  const discovery: ReviewDiscoveryProjection = {
    status: discoveryStatus,
    reviewed_head: reviewedHead ?? null,
    provider_review: findingReview ?? terminalReview ?? observedReview,
    clean_signal: cleanTerminal ? signalEvidence(cleanTerminal.signal) : null,
    progress_signal: relatedEyes.length > 0 ? signalEvidence(relatedEyes.at(-1)!.signal) : null,
    findings,
    provider_signals: providerSignals,
    history,
    problems: [...new Set(problems)],
  }

  if (snapshot.state !== "OPEN") {
    return decision("failed", `pull request is ${snapshot.state.toLowerCase()}`, 1, request, discovery)
  }
  if (!snapshot.complete) {
    return decision("failed", "GitHub response exceeded a supported pagination boundary", 1, request, discovery)
  }
  if (request.classification !== "valid") {
    return decision("failed", requestFailureReason(request.classification), 1, request, discovery)
  }
  if (discovery.problems.length > 0) {
    return decision("failed", discoveryProblemReason(discovery.problems[0]!), 1, request, discovery)
  }
  if (discovery.status === "finding_unrouted") {
    return decision("failed", "Codex returned an unrouted review finding", 1, request, discovery)
  }
  if (discovery.status === "finding_routed") {
    return decision("failed", "Codex review finding was routed and resolved", 20, request, discovery)
  }
  if (discovery.status === "clean") {
    return decision("passed", "Codex review completed cleanly", 0, request, discovery)
  }
  if (discovery.progress_signal !== null) {
    return decision("pending", "Codex review is still in progress", 10, request, discovery)
  }
  return decision("pending", "Codex review has not produced a terminal result", 10, request, discovery)
}

function decision(
  status: CodexReviewDecision["status"],
  reason: string,
  exitCode: CodexReviewDecision["exitCode"],
  request: ReviewRequestProjection,
  discovery: ReviewDiscoveryProjection,
): CodexReviewDecision {
  return { status, reason, request, discovery, exitCode }
}

function requestFailureReason(classification: RequestClassification): string {
  const reasons: Record<RequestClassification, string> = {
    valid: "Codex review request is valid",
    missing: "Codex review request is missing",
    malformed: "Codex review request is malformed",
    edited: "an edited Codex review request cannot start an attempt",
    ambiguous: "multiple review requests have no reliable order",
    "wrong-head": "Codex review request targets a different head",
    "self-trigger": "Codex connector cannot trigger its own review",
    incomplete: "Codex review request provenance is incomplete",
  }
  return reasons[classification]
}

function discoveryProblemReason(problem: DiscoveryProblem): string {
  const reasons: Record<DiscoveryProblem, string> = {
    "pull-request-closed": "pull request is not open",
    "snapshot-incomplete": "GitHub review snapshot is incomplete",
    "usage-failure": "Codex reported a usage or rate limit",
    "provider-edited": "an edited Codex provider result cannot prove a terminal result",
    "provider-wrong-head": "Codex approved a different head",
    "provider-result-incomplete": "Codex provider result is missing required lifecycle evidence",
  }
  return reasons[problem]
}

function classifyRequest(snapshot: CodexReviewSnapshot, expectation: ReviewRequestExpectation): {
  request: ReviewRequestProjection
  expectedAttempt: ReviewSignal | null
  nextRequestAt: number | null
  attempts: ReviewSignal[]
} {
  const attempts = extractRequestAttempts(snapshot)
  const requests = attempts
  const locatorAttempts = attempts.filter((signal) => signalLocator(signal) === expectation.locator)
  const expectedAttempt = locatorAttempts.find((signal) =>
    signal.author.toLowerCase() === expectation.author.toLowerCase(),
  ) ?? null
  const nextRequestAt = expectedAttempt
    ? attempts.reduce<number | null>((next, signal) => {
      const at = timestampValue(signal.at)
      return at > timestampValue(expectedAttempt.at) && (next === null || at < next) ? at : next
    }, null)
    : null
  const observed = attempts.map((signal) => projectObservedRequest(snapshot, signal))
  if (requests.length === 0) {
    return { request: emptyRequest("missing", expectation), expectedAttempt: null, nextRequestAt, attempts }
  }
  if (locatorAttempts.length > 1) {
    return {
      request: {
        ...emptyRequest("ambiguous", expectation),
        candidate_locators: [...new Set(locatorAttempts.map(signalLocator).filter((value): value is string => value !== null))].sort(),
        observed,
      },
      expectedAttempt: null,
      nextRequestAt,
      attempts,
    }
  }
  const latestAt = Math.max(...requests.map((signal) => timestampValue(signal.at)))
  const latest = requests.filter((signal) => timestampValue(signal.at) === latestAt)
  const candidateLocators = latest.map(signalLocator).filter((value): value is string => value !== null).sort()
  if (latest.length !== 1) {
    return {
      request: { ...emptyRequest("ambiguous", expectation), candidate_locators: candidateLocators, observed },
      expectedAttempt,
      nextRequestAt,
      attempts,
    }
  }
  const selected = locatorAttempts.length === 1 ? locatorAttempts[0]! : latest[0]!
  const projected = projectObservedRequest(snapshot, selected)
  const bindingMatches = projected.locator === expectation.locator
    && projected.author?.toLowerCase() === expectation.author.toLowerCase()
  const classification = bindingMatches
    ? projected.classification
    : (projected.locator === expectation.locator && projected.classification === "self-trigger"
      ? "self-trigger"
      : "incomplete")
  return {
    request: {
      ...projected,
      classification,
      expected_locator: expectation.locator,
      expected_author: expectation.author,
      binding_matches: bindingMatches,
      candidate_locators: candidateLocators,
      observed,
    },
    expectedAttempt,
    nextRequestAt,
    attempts,
  }
}

function extractRequestAttempts(snapshot: CodexReviewSnapshot): ReviewSignal[] {
  return snapshot.signals.filter((signal) =>
    signal.kind === "comment" && REVIEW_REQUEST.test(signal.body ?? ""),
  ).sort(compareSignals)
}

function projectObservedRequest(
  snapshot: CodexReviewSnapshot,
  selected: ReviewSignal,
): ObservedReviewRequestProjection {
  const body = selected.body ?? ""
  const exactHead = EXACT_HEAD_REVIEW_REQUEST.exec(body)?.[1] ?? null
  const requestedHead = exactHead ?? REQUESTED_HEAD.exec(body)?.[1] ?? null
  const edited = isEditedSignal(selected)
  const provenanceComplete = selected.performedViaGithubApp !== undefined
  const bindingComplete = signalLocator(selected) !== null
    && selected.author !== ""
    && isIsoTimestamp(selected.at)
    && isIsoTimestamp(selected.updatedAt ?? selected.at)
  const app = selected.performedViaGithubApp ?? null
  let classification: RequestClassification
  if (edited) classification = "edited"
  else if (!provenanceComplete || !bindingComplete) classification = "incomplete"
  else if (isProvider(selected.author) || (app?.id === PROVIDER_APP_ID && app.slug === PROVIDER_LOGIN)) classification = "self-trigger"
  else if (app !== null) classification = "incomplete"
  else if (exactHead === null) classification = "malformed"
  else if (exactHead !== snapshot.headRefOid) classification = "wrong-head"
  else classification = "valid"
  return {
    classification,
    locator: signalLocator(selected),
    comment_id: selected.databaseId ?? null,
    url: selected.url ?? null,
    author: selected.author || null,
    created_at: selected.at,
    updated_at: selected.updatedAt ?? selected.at,
    edited,
    body,
    requested_head: requestedHead,
    provenance_complete: provenanceComplete,
    performed_via_github_app: app,
  }
}

function emptyRequest(
  classification: RequestClassification,
  expectation: ReviewRequestExpectation,
): ReviewRequestProjection {
  return {
    classification,
    locator: null,
    expected_locator: expectation.locator,
    expected_author: expectation.author,
    binding_matches: null,
    candidate_locators: [],
    observed: [],
    comment_id: null,
    url: null,
    author: null,
    created_at: null,
    updated_at: null,
    edited: null,
    body: null,
    requested_head: null,
    provenance_complete: false,
    performed_via_github_app: null,
  }
}

function isEditedSignal(signal: ReviewSignal): boolean {
  return signal.includesCreatedEdit === true
    || signal.lastEditedAt !== undefined
    || (signal.updatedAt !== undefined && signal.updatedAt !== signal.at)
}

function signalLocator(signal: ReviewSignal): string | null {
  return signal.locator ?? (signal.target.startsWith("comment:") ? signal.target.slice("comment:".length) : signal.target)
}

function signalEvidence(signal: ReviewSignal): ReviewEvidenceProjection | null {
  const locator = signalLocator(signal)
  if (!locator || !signal.author || !isIsoTimestamp(signal.at)) return null
  const body = signal.body ?? signal.reaction ?? signal.reviewState ?? ""
  return { locator, url: signal.url ?? null, author: signal.author, at: signal.at, body, edited: isEditedSignal(signal) }
}

function compareSignals(left: ReviewSignal, right: ReviewSignal): number {
  return timestampValue(left.at) - timestampValue(right.at)
    || left.kind.localeCompare(right.kind)
    || (signalLocator(left) ?? "").localeCompare(signalLocator(right) ?? "")
}

function exhaustiveProviderSignals(snapshot: CodexReviewSnapshot): ReviewSignal[] {
  const signals = snapshot.signals.filter((signal) => isProvider(signal.author))
  for (const signal of snapshot.signals) {
    const parentLocator = signalLocator(signal) ?? signal.target
    for (const [index, reaction] of (signal.reactions ?? []).entries()) {
      if (!isProvider(reaction.author)) continue
      signals.push({
        author: reaction.author,
        at: reaction.at,
        kind: "reaction",
        target: `signal:${parentLocator}`,
        locator: `${parentLocator}:reaction:${index}`,
        reaction: reaction.content,
      })
    }
  }
  for (const thread of snapshot.threads) {
    for (const [commentIndex, comment] of thread.comments.entries()) {
      const commentLocator = comment.locator ?? `${thread.locator ?? "thread"}:comment:${commentIndex}`
      if (commentIndex > 0 && isProvider(comment.author)) {
        signals.push({
          author: comment.author,
          at: comment.at,
          kind: "comment",
          target: `thread-comment:${commentLocator}`,
          locator: commentLocator,
          url: comment.url,
          body: comment.body,
          reviewId: comment.reviewId,
          includesCreatedEdit: comment.includesCreatedEdit,
          lastEditedAt: comment.lastEditedAt,
        })
      }
      for (const [reactionIndex, reaction] of (comment.reactions ?? []).entries()) {
        if (!isProvider(reaction.author)) continue
        signals.push({
          author: reaction.author,
          at: reaction.at,
          kind: "reaction",
          target: `thread-comment:${commentLocator}`,
          locator: `${commentLocator}:reaction:${reactionIndex}`,
          reaction: reaction.content,
        })
      }
    }
  }
  return signals
}

function providerSignalEnvelope(
  signal: ReviewSignal,
  expectedHead: string | null,
  attemptTarget: string,
): ProviderSignalEnvelope {
  let classification: ProviderSignalClassification = "unknown"
  let reviewedHead: string | null = null
  if (signal.kind === "reaction") {
    const targetMatches = signal.target === attemptTarget || signal.target === "pull-request"
    if (targetMatches && signal.reaction === "THUMBS_UP") classification = "clean_authority"
    else if (targetMatches && signal.reaction === "EYES") classification = "progress"
  } else if (signal.kind === "review") {
    reviewedHead = signal.commitOid ?? null
    if (expectedHead !== null && reviewedHead === expectedHead) {
      if (signal.reviewState === "APPROVED") classification = "clean_authority"
      else if (isFindingReviewState(signal.reviewState)) classification = "finding"
    }
  } else if (isProviderApp(signal.performedViaGithubApp)) {
    const embeddedReviewedHead = cleanNotificationHead(signal.body ?? "")
    reviewedHead = embeddedReviewedHead
    if (embeddedReviewedHead !== null && expectedHead?.startsWith(embeddedReviewedHead)) {
      reviewedHead = expectedHead
      classification = "notification"
    }
    else if (USAGE_FAILURE.test(signal.body ?? "")) classification = "capability_unavailable"
  }
  return { classification, reviewed_head: reviewedHead, signal }
}

function isProviderApp(app: GitHubAppProvenance | null | undefined): boolean {
  return app?.id === PROVIDER_APP_ID && app.slug === PROVIDER_LOGIN
}

function isFindingReviewState(state: string | undefined): boolean {
  return state === "COMMENTED" || state === "CHANGES_REQUESTED"
}

function providerReviewProjection(signal: ReviewSignal): ProviderReviewProjection | null {
  const locator = signalLocator(signal)
  if (signal.kind !== "review" || !locator || !signal.author || !signal.reviewState || !signal.commitOid) return null
  return {
    locator,
    url: signal.url ?? null,
    author: signal.author,
    at: signal.at,
    state: signal.reviewState,
    reviewed_head: signal.commitOid,
    edited: isEditedSignal(signal),
  }
}

function threadCommentEvidence(comment: ReviewThread["comments"][number]): ReviewEvidenceProjection | null {
  if (!comment.locator || !comment.author || !isIsoTimestamp(comment.at) || comment.body.trim() === "") return null
  return {
    locator: comment.locator,
    url: comment.url ?? null,
    author: comment.author,
    at: comment.at,
    body: comment.body,
    edited: comment.includesCreatedEdit === true || comment.lastEditedAt !== undefined,
  }
}

function projectFindings(
  snapshot: CodexReviewSnapshot,
  providerSignals: ReviewSignal[],
  authorizedActor: string,
  attemptAt: number,
  nextRequestAt: number | null,
): {
  findings: ReviewFindingProjection[]
  incomplete: boolean
} {
  const findings: ReviewFindingProjection[] = []
  const representedReviews = new Set<string>()
  let incomplete = false
  for (const thread of snapshot.threads.filter((value) => {
    const first = value.comments[0]
    const firstAt = timestampValue(first?.at ?? "")
    return isProvider(first?.author ?? "")
      && firstAt > attemptAt
      && (nextRequestAt === null || firstAt < nextRequestAt)
  })) {
    const first = thread.comments[0]!
    if (first.reviewId) representedReviews.add(first.reviewId)
    const reviewSignal = providerSignals.find((signal) => signal.kind === "review" && signal.reviewId === first.reviewId)
    const review = reviewSignal ? providerReviewProjection(reviewSignal) : null
    const structuredFindingReview = reviewSignal?.commitOid !== undefined
      && isFindingReviewState(reviewSignal.reviewState)
    const finding = threadCommentEvidence(first)
    const resolver = thread.resolvedBy && !isProvider(thread.resolvedBy) ? thread.resolvedBy : null
    const dispositionComment = resolver
      ? thread.comments.find((comment) => comment.author.toLowerCase() === resolver.toLowerCase()
        && timestampValue(comment.at) > timestampValue(first.at)
        && comment.body.trim() !== "")
      : undefined
    const disposition = dispositionComment ? threadCommentEvidence(dispositionComment) : null
    const threadProjection = thread.locator ? {
      locator: thread.locator,
      resolved: thread.resolved,
      resolver,
    } : null
    if (!finding || finding.edited || !review || review.edited || !structuredFindingReview || !threadProjection
      || disposition?.edited) incomplete = true
    findings.push({
      reviewed_head: review?.reviewed_head ?? null,
      provider_review: review,
      finding: finding ?? {
        locator: first.locator ?? "missing",
        url: first.url ?? null,
        author: first.author,
        at: first.at,
        body: first.body,
        edited: first.includesCreatedEdit === true || first.lastEditedAt !== undefined,
      },
      thread: threadProjection,
      disposition,
      routed: Boolean(
        review && !review.edited && structuredFindingReview && finding && !finding.edited && threadProjection
          && thread.resolved && resolver && resolver.toLowerCase() === authorizedActor.toLowerCase()
          && disposition && disposition.author.toLowerCase() === authorizedActor.toLowerCase()
          && !disposition.edited,
      ),
    })
  }
  for (const signal of providerSignals) {
    if (signal.reviewId && representedReviews.has(signal.reviewId)) continue
    if (signal.kind !== "review" || !isFindingReviewState(signal.reviewState)) continue
    const evidence = signalEvidence(signal)
    const review = providerReviewProjection(signal)
    if (!evidence || evidence.edited || (signal.kind === "review" && (!review || review.edited))) incomplete = true
    if (!evidence) continue
    findings.push({
      reviewed_head: review?.reviewed_head ?? null,
      provider_review: review,
      finding: evidence,
      thread: null,
      disposition: null,
      routed: false,
    })
  }
  findings.sort((left, right) => timestampValue(left.finding.at) - timestampValue(right.finding.at))
  return { findings, incomplete }
}

interface Connection<T> {
  nodes: T[]
  pageInfo: { hasNextPage: boolean }
}

interface GraphPullRequest {
  number: number
  state: string
  headRefOid: string
  createdAt: string
  reactions: Connection<{ content: string; createdAt: string; user: { login: string } | null }>
  comments: Connection<{
    id: string
    databaseId: number
    url: string
    author: { login: string } | null
    body: string
    createdAt: string
    updatedAt: string
    includesCreatedEdit: boolean
    lastEditedAt: string | null
    reactions: Connection<{ content: string; createdAt: string; user: { login: string } | null }>
  }>
  reviews: Connection<{
    id: string
    url: string
    author: { login: string } | null
    body: string
    state: string
    createdAt: string
    submittedAt: string | null
    commit: { oid: string }
    includesCreatedEdit: boolean
    lastEditedAt: string | null
    reactions: Connection<{ content: string; createdAt: string; user: { login: string } | null }>
  }>
  reviewThreads: Connection<{
    id: string
    isResolved: boolean
    resolvedBy: { login: string } | null
    comments: Connection<{
      id: string
      url: string
      author: { login: string } | null
      body: string
      createdAt: string
      includesCreatedEdit: boolean
      lastEditedAt: string | null
      pullRequestReview: { id: string }
      reactions: Connection<{ content: string; createdAt: string; user: { login: string } | null }>
    }>
  }>
}

interface ReviewOutput {
  schema: typeof RECEIPT_SCHEMA
  repository: string
  pull_request: number
  head_oid: string | null
  status: "passed" | "pending" | "failed"
  reason: string
  request: ReviewRequestProjection
  discovery: ReviewDiscoveryProjection
  provider_snapshot?: CodexReviewSnapshot
}

interface RestIssueComment {
  id: number
  node_id: string
  html_url: string
  body: string
  user: { login: string }
  created_at: string
  updated_at: string
  performed_via_github_app: GitHubAppProvenance | null
}

class ReviewSnapshotError extends Error {
  constructor(message: string, readonly headOid: string | null, cause: unknown) {
    super(message, { cause })
  }
}

const QUERY = `
query($owner: String!, $name: String!, $number: Int!) {
  repository(owner: $owner, name: $name) {
    nameWithOwner
    pullRequest(number: $number) {
      number
      state
      headRefOid
      createdAt
      reactions(first: 100) {
        nodes { content createdAt user { login } }
        pageInfo { hasNextPage }
      }
      comments(first: 100) {
        nodes {
          id
          databaseId
          url
          author { login }
          body
          createdAt
          updatedAt
          includesCreatedEdit
          lastEditedAt
          reactions(first: 100) {
            nodes { content createdAt user { login } }
            pageInfo { hasNextPage }
          }
        }
        pageInfo { hasNextPage }
      }
      reviews(first: 100) {
        nodes {
          id
          url
          author { login }
          body
          state
          createdAt
          submittedAt
          commit { oid }
          includesCreatedEdit
          lastEditedAt
          reactions(first: 100) {
            nodes { content createdAt user { login } }
            pageInfo { hasNextPage }
          }
        }
        pageInfo { hasNextPage }
      }
      reviewThreads(first: 100) {
        nodes {
          id
          isResolved
          resolvedBy { login }
          comments(first: 100) {
            nodes {
              id
              url
              author { login }
              body
              createdAt
              includesCreatedEdit
              lastEditedAt
              pullRequestReview { id }
              reactions(first: 20) {
                nodes { content createdAt user { login } }
                pageInfo { hasNextPage }
              }
            }
            pageInfo { hasNextPage }
          }
        }
        pageInfo { hasNextPage }
      }
    }
  }
}`

async function fetchSnapshot(repository: string, number: number): Promise<CodexReviewSnapshot> {
  const [owner, name] = repository.split("/")
  let response: {
    data?: {
      repository?: { nameWithOwner?: string; pullRequest?: GraphPullRequest | null } | null
    }
    errors?: unknown[]
  }
  try {
    const parsed: unknown = JSON.parse(runGh([
      "api",
      "graphql",
      "-f",
      `query=${QUERY}`,
      "-F",
      `owner=${owner}`,
      "-F",
      `name=${name}`,
      "-F",
      `number=${number}`,
    ])) as typeof response
    if (!isRecord(parsed)) throw new Error("GitHub returned malformed response")
    response = parsed as typeof response
  } catch (error) {
    if (error instanceof Error && error.message === "GitHub CLI request failed") throw error
    if (error instanceof Error && error.message === "GitHub returned malformed response") throw error
    throw new Error("GitHub returned invalid JSON", { cause: error })
  }
  if (response.errors !== undefined && !Array.isArray(response.errors)) {
    throw new Error("GitHub returned malformed response")
  }
  if (response.errors?.length) {
    throw new Error("GitHub query returned errors")
  }
  const graphRepository = response.data?.repository
  if (!graphRepository) throw new Error("repository was not found")
  if (typeof graphRepository.nameWithOwner !== "string"
    || !matchesRepository(graphRepository.nameWithOwner, repository)) {
    throw new Error("GitHub returned a different repository")
  }
  const pullRequest = graphRepository.pullRequest
  if (!pullRequest) throw new Error("pull request was not found")
  if (!isPullRequestNumber(pullRequest.number)) {
    throw new Error("GitHub returned malformed pull request data")
  }
  if (pullRequest.number !== number) throw new Error("GitHub returned a different pull request")
  const observedHead = isHeadOid(pullRequest.headRefOid) ? pullRequest.headRefOid : null
  try {
    assertPullRequest(pullRequest)
  } catch (error) {
    throw new ReviewSnapshotError("GitHub returned malformed pull request data", observedHead, error)
  }
  let issueComments: RestIssueComment[]
  try {
    issueComments = fetchIssueComments(repository, number)
  } catch (error) {
    throw new ReviewSnapshotError(
      error instanceof Error ? error.message : "unexpected provider failure",
      observedHead,
      error,
    )
  }
  const issueCommentsById = new Map(issueComments.map((comment) => [comment.id, comment]))
  const graphIssueCommentIds = new Set(pullRequest.comments.nodes.map((comment) => comment.databaseId))
  if (graphIssueCommentIds.size !== pullRequest.comments.nodes.length
    || pullRequest.comments.nodes.some((comment) => !issueCommentsById.has(comment.databaseId))
    || (!pullRequest.comments.pageInfo.hasNextPage && issueComments.length !== pullRequest.comments.nodes.length)) {
    throw new ReviewSnapshotError("GitHub issue-comment collections did not bind", observedHead, null)
  }

  const signals: ReviewSignal[] = []
  for (const reaction of pullRequest.reactions.nodes) {
    signals.push({
      author: reaction.user?.login ?? "",
      at: reaction.createdAt,
      kind: "reaction",
      target: "pull-request",
      locator: "pull-request",
      reaction: reaction.content,
    })
  }
  for (const comment of pullRequest.comments.nodes) {
    const restComment = issueCommentsById.get(comment.databaseId)
    if (!restComment
      || restComment.node_id !== comment.id
      || restComment.html_url !== comment.url
      || (restComment.user.login !== (comment.author?.login ?? "")
        && !(isProvider(restComment.user.login) && isProvider(comment.author?.login ?? "")))
      || restComment.body !== comment.body
      || restComment.created_at !== comment.createdAt
      || restComment.updated_at !== comment.updatedAt) {
      throw new ReviewSnapshotError("GitHub issue-comment provenance did not bind to GraphQL", observedHead, null)
    }
    const target = `comment:${comment.id}`
    signals.push({
      author: comment.author?.login ?? "",
      at: comment.createdAt,
      locator: comment.id,
      databaseId: comment.databaseId,
      url: comment.url,
      updatedAt: comment.updatedAt,
      includesCreatedEdit: comment.includesCreatedEdit,
      lastEditedAt: comment.lastEditedAt ?? undefined,
      performedViaGithubApp: restComment.performed_via_github_app,
      kind: "comment",
      target,
      body: comment.body,
    })
    for (const reaction of comment.reactions.nodes) {
      signals.push({
        author: reaction.user?.login ?? "",
        at: reaction.createdAt,
        kind: "reaction",
        target,
        locator: comment.id,
        url: comment.url,
        reaction: reaction.content,
      })
    }
  }
  for (const review of pullRequest.reviews.nodes) {
    signals.push({
      author: review.author?.login ?? "",
      at: review.submittedAt ?? review.createdAt,
      locator: review.id,
      url: review.url,
      kind: "review",
      target: "review",
      body: review.body,
      reviewState: review.state,
      reviewId: review.id,
      commitOid: review.commit.oid,
      includesCreatedEdit: review.includesCreatedEdit,
      lastEditedAt: review.lastEditedAt ?? undefined,
      reactions: review.reactions.nodes.map((reaction) => ({
        author: reaction.user?.login ?? "",
        at: reaction.createdAt,
        content: reaction.content,
      })),
    })
  }
  const actorsComplete = pullRequest.reactions.nodes.every((reaction) => reaction.user !== null)
    && pullRequest.comments.nodes.every((comment) => comment.author !== null
      && comment.reactions.nodes.every((reaction) => reaction.user !== null))
    && pullRequest.reviews.nodes.every((review) => review.author !== null
      && review.reactions.nodes.every((reaction) => reaction.user !== null))
    && pullRequest.reviewThreads.nodes.every((thread) => (!thread.isResolved || thread.resolvedBy !== null)
      && thread.comments.nodes.every((comment) => comment.author !== null
        && comment.reactions.nodes.every((reaction) => reaction.user !== null)))

  return {
    state: pullRequest.state,
    headRefOid: pullRequest.headRefOid,
    createdAt: pullRequest.createdAt,
    complete: !pullRequest.reactions.pageInfo.hasNextPage
      && !pullRequest.comments.pageInfo.hasNextPage
      && pullRequest.comments.nodes.every((comment) => !comment.reactions.pageInfo.hasNextPage)
      && !pullRequest.reviews.pageInfo.hasNextPage
      && pullRequest.reviews.nodes.every((review) => !review.reactions.pageInfo.hasNextPage)
      && !pullRequest.reviewThreads.pageInfo.hasNextPage
      && pullRequest.reviewThreads.nodes.every((thread) => !thread.comments.pageInfo.hasNextPage
        && thread.comments.nodes.every((comment) => !comment.reactions.pageInfo.hasNextPage))
      && actorsComplete,
    signals,
    threads: pullRequest.reviewThreads.nodes.map((thread) => ({
      locator: thread.id,
      resolved: thread.isResolved,
      resolvedBy: thread.resolvedBy?.login,
      comments: thread.comments.nodes.map((comment) => ({
        locator: comment.id,
        url: comment.url,
        author: comment.author?.login ?? "",
        at: comment.createdAt,
        body: comment.body,
        reviewId: comment.pullRequestReview.id,
        includesCreatedEdit: comment.includesCreatedEdit,
        lastEditedAt: comment.lastEditedAt ?? undefined,
        reactions: comment.reactions.nodes.map((reaction) => ({
          author: reaction.user?.login ?? "",
          at: reaction.createdAt,
          content: reaction.content,
        })),
      })),
    })),
  }
}

function fetchIssueComments(repository: string, number: number): RestIssueComment[] {
  let parsed: unknown
  try {
    parsed = JSON.parse(runGh([
      "api",
      "--paginate",
      "--slurp",
      `repos/${repository}/issues/${number}/comments`,
    ]))
  } catch (error) {
    if (error instanceof Error && error.message === "GitHub CLI request failed") throw error
    throw new Error("GitHub returned invalid issue-comment JSON", { cause: error })
  }
  if (!Array.isArray(parsed) || parsed.some((page) => !Array.isArray(page))) {
    throw new Error("GitHub returned malformed issue-comment pages")
  }
  const comments = parsed.flat()
  if (comments.some((comment) => !isRestIssueComment(comment))) {
    throw new Error("GitHub returned malformed issue-comment provenance")
  }
  const typed = (comments as RestIssueComment[]).map((comment): RestIssueComment => ({
    id: comment.id,
    node_id: comment.node_id,
    html_url: comment.html_url,
    body: comment.body,
    user: { login: comment.user.login },
    created_at: comment.created_at,
    updated_at: comment.updated_at,
    performed_via_github_app: comment.performed_via_github_app === null ? null : {
      id: comment.performed_via_github_app.id,
      slug: comment.performed_via_github_app.slug,
    },
  }))
  if (new Set(typed.map((comment) => comment.id)).size !== typed.length) {
    throw new Error("GitHub returned duplicate issue comments")
  }
  return typed
}

function runGh(args: string[]): string {
  const result = Bun.spawnSync(["gh", ...args], { stdout: "pipe", stderr: "pipe" })
  if (result.exitCode !== 0) {
    throw new Error("GitHub CLI request failed")
  }
  return result.stdout.toString()
}

function normalizeRepository(value: string): string {
  const match = /^([a-z\d](?:[a-z\d-]{0,37}[a-z\d])?)\/([a-z\d._-]{1,100})$/i.exec(value)
  if (!match || match[2] === "." || match[2] === "..") {
    throw new Error("repository must be owner/name")
  }
  return `${match[1].toLowerCase()}/${match[2].toLowerCase()}`
}

function canonicalJson(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map(canonicalJson).join(",")}]`
  if (isRecord(value)) {
    return `{${Object.keys(value).sort().map((key) =>
      `${JSON.stringify(key)}:${canonicalJson(value[key])}`).join(",")}}`
  }
  const encoded = JSON.stringify(value)
  if (encoded === undefined) throw new Error("canonical JSON contains an unsupported value")
  return encoded
}

function canonicalLine(value: unknown): string {
  return `${canonicalJson(value)}\n`
}

function decodeUtf8(bytes: Uint8Array, label: string): string {
  try {
    return new TextDecoder("utf-8", { fatal: true, ignoreBOM: true }).decode(bytes)
  } catch {
    throw new Error(`${label} is not valid UTF-8`)
  }
}

function equalBytes(left: Uint8Array, right: Uint8Array): boolean {
  return left.byteLength === right.byteLength
    && left.every((byte, index) => byte === right[index])
}

function parseCanonicalLine(bytes: Uint8Array, label: string): unknown {
  const decoded = decodeUtf8(bytes, label)
  if (decoded === "" || !decoded.endsWith("\n") || decoded.slice(0, -1).includes("\n")) {
    throw new Error(`${label} must be one canonical JSON-LF record`)
  }
  let parsed: unknown
  try {
    parsed = JSON.parse(decoded.slice(0, -1))
  } catch {
    throw new Error(`${label} is not valid JSON`)
  }
  const canonicalBytes = new TextEncoder().encode(canonicalLine(parsed))
  if (!equalBytes(canonicalBytes, bytes)) throw new Error(`${label} is not canonical JSON-LF`)
  return parsed
}

function hasExactKeys(value: Record<string, unknown>, expected: string[]): boolean {
  const actual = Object.keys(value).sort()
  return actual.length === expected.length
    && actual.every((key, index) => key === [...expected].sort()[index])
}

function isBoundedAtom(value: unknown, maximum: number): value is string {
  return typeof value === "string"
    && value.length > 0
    && value.length <= maximum
    && [...value].every((character) => {
      const codePoint = character.codePointAt(0)!
      return codePoint > 31
        && codePoint !== 127
        && (codePoint < 0xd800 || codePoint > 0xdfff)
    })
}

function isSha256(value: unknown): value is string {
  return typeof value === "string" && /^sha256:[0-9a-f]{64}$/.test(value)
}

function isBaseRef(value: unknown): value is string {
  return isBoundedAtom(value, 255)
    && value !== "@"
    && !value.startsWith("-")
    && !value.startsWith("/")
    && !value.endsWith("/")
    && !value.endsWith(".")
    && !value.includes("//")
    && !value.includes("..")
    && !value.includes("@{")
    && !/[ ~^:?*\\[\\]\\\\]/.test(value)
    && value.split("/").every((component) =>
      component.length > 0
        && !component.startsWith(".")
        && !component.endsWith(".lock"))
}

function isLocalGitTreeObject(value: string): boolean {
  const result = Bun.spawnSync(["git", "cat-file", "-t", value], {
    stdout: "pipe",
    stderr: "pipe",
  })
  return result.exitCode === 0 && new TextDecoder().decode(result.stdout) === "tree\n"
}

function localGitCommitTree(value: string): string | null {
  const type = Bun.spawnSync(["git", "cat-file", "-t", value], {
    stdout: "pipe",
    stderr: "pipe",
  })
  if (type.exitCode !== 0 || new TextDecoder().decode(type.stdout) !== "commit\n") return null
  const tree = Bun.spawnSync(["git", "rev-parse", "--verify", "--end-of-options", `${value}^{tree}`], {
    stdout: "pipe",
    stderr: "pipe",
  })
  if (tree.exitCode !== 0) return null
  const oid = new TextDecoder().decode(tree.stdout).trim()
  return isHeadOid(oid) ? oid : null
}

function localGitMergeTree(baseOid: string, headOid: string): string | null {
  const result = Bun.spawnSync(["git", "merge-tree", "--write-tree", baseOid, headOid], {
    stdout: "pipe",
    stderr: "pipe",
  })
  if (result.exitCode !== 0) return null
  const oid = new TextDecoder().decode(result.stdout).trim()
  return isHeadOid(oid) && isLocalGitTreeObject(oid) ? oid : null
}

function normalizeDeliveryEvidence(value: unknown, expectedHead: string): DeliveryEvidenceLocator[] {
  if (!Array.isArray(value) || value.length < DELIVERY_EVIDENCE_KINDS.length || value.length > 32) {
    throw new Error("delivery evidence must contain a bounded locator set")
  }
  const kindOrder = new Map(DELIVERY_EVIDENCE_KINDS.map((kind, index) => [kind, index]))
  const seen = new Set<string>()
  const normalized = value.map((entry): DeliveryEvidenceLocator => {
    if (!isRecord(entry) || !hasExactKeys(entry, [
      "kind", "locator", "head_oid", "result", "content_sha256",
    ])) throw new Error("delivery evidence locator has unknown or missing fields")
    if (typeof entry.kind !== "string" || !kindOrder.has(entry.kind as DeliveryEvidenceKind)) {
      throw new Error("delivery evidence locator kind is unknown")
    }
    if (!isBoundedAtom(entry.locator, 2048) || !isBoundedAtom(entry.result, 256)) {
      throw new Error("delivery evidence locator or result is invalid")
    }
    if (entry.head_oid !== expectedHead) throw new Error("delivery evidence head does not match candidate")
    let contentSha256: string | null
    if (entry.content_sha256 === null) contentSha256 = null
    else if (isSha256(entry.content_sha256)) contentSha256 = entry.content_sha256
    else throw new Error("delivery evidence content SHA-256 is invalid")
    const key = `${entry.kind}\u0000${entry.locator}`
    if (seen.has(key)) throw new Error("delivery evidence locator is duplicated")
    seen.add(key)
    return {
      kind: entry.kind as DeliveryEvidenceKind,
      locator: entry.locator,
      head_oid: entry.head_oid,
      result: entry.result,
      content_sha256: contentSha256,
    }
  })
  for (const kind of DELIVERY_EVIDENCE_KINDS) {
    if (!normalized.some((entry) => entry.kind === kind)) {
      throw new Error(`delivery evidence is missing ${kind}`)
    }
  }
  return normalized.sort((left, right) =>
    kindOrder.get(left.kind)! - kindOrder.get(right.kind)!
      || (left.locator < right.locator ? -1 : left.locator > right.locator ? 1 : 0))
}

function normalizeDeliveryBarrier(value: unknown): DeliveryBarrierEvidence {
  if (!isRecord(value) || !hasExactKeys(value, [
    "schema", "repository", "pull_request", "head_oid", "head_tree_oid", "base_ref", "base_oid",
    "potential_merge_commit", "queue_state", "evidence",
  ]) || value.schema !== DELIVERY_BARRIER_INPUT_SCHEMA) {
    throw new Error("delivery barrier input has an invalid schema or fields")
  }
  let mergeCommitOid: string | null
  let mergeTreeOid: string | null
  if (value.potential_merge_commit === null) {
    mergeCommitOid = null
    mergeTreeOid = null
  } else if (isRecord(value.potential_merge_commit)
    && hasExactKeys(value.potential_merge_commit, ["oid", "tree"])
    && isHeadOid(value.potential_merge_commit.oid)
    && isRecord(value.potential_merge_commit.tree)
    && hasExactKeys(value.potential_merge_commit.tree, ["oid"])
    && isHeadOid(value.potential_merge_commit.tree.oid)
    && value.potential_merge_commit.oid !== value.potential_merge_commit.tree.oid) {
    mergeCommitOid = value.potential_merge_commit.oid
    mergeTreeOid = value.potential_merge_commit.tree.oid
  } else throw new Error("delivery barrier potential merge commit or tree identity is invalid")
  if (!isPullRequestNumber(value.pull_request)
    || !isHeadOid(value.head_oid)
    || !isHeadOid(value.head_tree_oid)
    || !isBaseRef(value.base_ref)
    || !isHeadOid(value.base_oid)
    || !isBoundedAtom(value.queue_state, 128)) {
    throw new Error("delivery barrier identity or mutable snapshot is invalid")
  }
  if (localGitCommitTree(value.head_oid) !== value.head_tree_oid) {
    throw new Error("delivery barrier head tree does not match the local head commit")
  }
  if (mergeTreeOid !== null && localGitMergeTree(value.base_oid, value.head_oid) !== mergeTreeOid) {
    throw new Error("delivery barrier merge tree does not match the local base and head")
  }
  return {
    schema: DELIVERY_BARRIER_EVIDENCE_SCHEMA,
    repository: normalizeRepository(typeof value.repository === "string" ? value.repository : ""),
    pull_request: value.pull_request,
    head_oid: value.head_oid,
    head_tree_oid: value.head_tree_oid,
    base_ref: value.base_ref,
    base_oid: value.base_oid,
    merge_commit_oid: mergeCommitOid,
    merge_tree_oid: mergeTreeOid,
    queue_state: value.queue_state,
    evidence: normalizeDeliveryEvidence(value.evidence, value.head_oid),
  }
}

function createDeliveryBarrierReceipt(bytes: Uint8Array): DeliveryBarrierReceipt {
  const receipt = normalizeDeliveryBarrier(parseCanonicalLine(bytes, "delivery barrier input"))
  const receiptBytes = canonicalLine(receipt)
  return {
    schema: DELIVERY_BARRIER_RECEIPT_SCHEMA,
    bytes: Buffer.byteLength(receiptBytes),
    sha256: `sha256:${createHash("sha256").update(receiptBytes).digest("hex")}`,
    receipt,
  }
}

function verifyDeliveryBarrierReceipt(bytes: Uint8Array, expectedSha256: string): DeliveryBarrierReceipt {
  if (!isSha256(expectedSha256)) throw new Error("expected delivery receipt SHA-256 is invalid")
  const value = parseCanonicalLine(bytes, "delivery barrier receipt")
  if (!isRecord(value) || !hasExactKeys(value, ["schema", "bytes", "sha256", "receipt"])
    || value.schema !== DELIVERY_BARRIER_RECEIPT_SCHEMA
    || !Number.isSafeInteger(value.bytes) || (value.bytes as number) <= 0
    || !isSha256(value.sha256)
    || value.sha256 !== expectedSha256
    || !isRecord(value.receipt)) {
    throw new Error("delivery barrier receipt has an invalid envelope or digest")
  }
  if (!hasExactKeys(value.receipt, [
    "schema", "repository", "pull_request", "head_oid", "head_tree_oid", "base_ref", "base_oid",
    "merge_commit_oid", "merge_tree_oid", "queue_state", "evidence",
  ]) || value.receipt.schema !== DELIVERY_BARRIER_EVIDENCE_SCHEMA) {
    throw new Error("delivery barrier receipt has an invalid inner schema or fields")
  }
  const mergeCommitOid = value.receipt.merge_commit_oid
  const mergeTreeOid = value.receipt.merge_tree_oid
  if ((mergeCommitOid === null) !== (mergeTreeOid === null)) {
    throw new Error("delivery barrier merge commit and tree must be jointly present or absent")
  }
  const {
    merge_commit_oid: ignoredMergeCommitOid,
    merge_tree_oid: ignoredMergeTreeOid,
    ...receiptInput
  } = value.receipt
  const input = {
    ...receiptInput,
    schema: DELIVERY_BARRIER_INPUT_SCHEMA,
    potential_merge_commit: mergeCommitOid === null
      ? null
      : { oid: mergeCommitOid, tree: { oid: mergeTreeOid } },
  }
  const receipt = normalizeDeliveryBarrier(input)
  const receiptBytes = canonicalLine(receipt)
  const observedSha256 = `sha256:${createHash("sha256").update(receiptBytes).digest("hex")}`
  const replayed: DeliveryBarrierReceipt = {
    schema: DELIVERY_BARRIER_RECEIPT_SCHEMA,
    bytes: value.bytes as number,
    sha256: value.sha256,
    receipt,
  }
  if (canonicalLine(value.receipt) !== receiptBytes
    || value.bytes !== Buffer.byteLength(receiptBytes)
    || value.sha256 !== observedSha256
    || !equalBytes(new TextEncoder().encode(canonicalLine(replayed)), bytes)) {
    throw new Error("delivery barrier receipt bytes or SHA-256 do not replay")
  }
  return replayed
}

function normalizeRequestExpectation(locator: string, author: string): ReviewRequestExpectation {
  if (locator === ""
    || !/^[A-Za-z\d](?:[A-Za-z\d-]{0,37}[A-Za-z\d])?$/.test(author)) {
    throw new Error("invalid request expectation")
  }
  return { locator, author }
}

function matchesRepository(value: string, expected: string): boolean {
  try {
    return normalizeRepository(value) === expected
  } catch {
    return false
  }
}

function assertPullRequest(value: GraphPullRequest): void {
  if (!isPullRequestNumber(value.number)
    || typeof value.state !== "string"
    || !isHeadOid(value.headRefOid)
    || !isIsoTimestamp(value.createdAt)
    || !isConnection(value.reactions)
    || !isConnection(value.comments)
    || !isConnection(value.reviews)
    || !isConnection(value.reviewThreads)
    || value.reactions.nodes.some((reaction) => !isReaction(reaction))
    || value.comments.nodes.some((comment) => !isComment(comment))
    || value.reviews.nodes.some((review) => !isReview(review))
    || value.reviewThreads.nodes.some((thread) => !isReviewThread(thread))) {
    throw new Error("GitHub returned malformed pull request data")
  }
}

function isConnection(value: unknown): value is Connection<unknown> {
  if (typeof value !== "object" || value === null) return false
  const connection = value as { nodes?: unknown; pageInfo?: { hasNextPage?: unknown } }
  return Array.isArray(connection.nodes)
    && typeof connection.pageInfo?.hasNextPage === "boolean"
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null
}

function isPullRequestNumber(value: unknown): value is number {
  return typeof value === "number" && Number.isSafeInteger(value) && value > 0
}

function isHeadOid(value: unknown): value is string {
  return typeof value === "string" && /^[0-9a-f]{40}(?:[0-9a-f]{24})?$/.test(value)
}

function isActor(value: unknown): boolean {
  return value === null || (isRecord(value) && typeof value.login === "string" && value.login !== "")
}

function isReaction(value: unknown): boolean {
  return isRecord(value)
    && typeof value.content === "string"
    && isIsoTimestamp(value.createdAt)
    && isActor(value.user)
}

function isComment(value: unknown): boolean {
  return isRecord(value)
    && typeof value.id === "string"
    && value.id !== ""
    && typeof value.databaseId === "number"
    && Number.isSafeInteger(value.databaseId)
    && value.databaseId > 0
    && typeof value.url === "string"
    && value.url !== ""
    && isActor(value.author)
    && typeof value.body === "string"
    && isIsoTimestamp(value.createdAt)
    && isIsoTimestamp(value.updatedAt)
    && typeof value.includesCreatedEdit === "boolean"
    && (value.lastEditedAt === null || isIsoTimestamp(value.lastEditedAt))
    && isConnection(value.reactions)
    && value.reactions.nodes.every((reaction) => isReaction(reaction))
}

function isReview(value: unknown): boolean {
  return isRecord(value)
    && typeof value.id === "string"
    && value.id !== ""
    && typeof value.url === "string"
    && value.url !== ""
    && isActor(value.author)
    && typeof value.body === "string"
    && typeof value.state === "string"
    && isIsoTimestamp(value.createdAt)
    && (value.submittedAt === null || isIsoTimestamp(value.submittedAt))
    && isRecord(value.commit)
    && isHeadOid(value.commit.oid)
    && typeof value.includesCreatedEdit === "boolean"
    && (value.lastEditedAt === null || isIsoTimestamp(value.lastEditedAt))
    && isConnection(value.reactions)
    && value.reactions.nodes.every((reaction) => isReaction(reaction))
}

function isReviewThread(value: unknown): boolean {
  return isRecord(value)
    && typeof value.id === "string"
    && value.id !== ""
    && typeof value.isResolved === "boolean"
    && isActor(value.resolvedBy)
    && isConnection(value.comments)
    && value.comments.nodes.length > 0
    && value.comments.nodes.every((comment) => isRecord(comment)
      && typeof comment.id === "string"
      && comment.id !== ""
      && typeof comment.url === "string"
      && comment.url !== ""
      && isActor(comment.author)
      && typeof comment.body === "string"
      && isIsoTimestamp(comment.createdAt)
      && typeof comment.includesCreatedEdit === "boolean"
      && (comment.lastEditedAt === null || isIsoTimestamp(comment.lastEditedAt))
      && isRecord(comment.pullRequestReview)
      && typeof comment.pullRequestReview.id === "string"
      && isConnection(comment.reactions)
      && comment.reactions.nodes.every((reaction) => isReaction(reaction)))
}

function isRestIssueComment(value: unknown): boolean {
  return isRecord(value)
    && typeof value.id === "number"
    && Number.isSafeInteger(value.id)
    && value.id > 0
    && typeof value.node_id === "string"
    && value.node_id !== ""
    && typeof value.html_url === "string"
    && value.html_url !== ""
    && typeof value.body === "string"
    && isRecord(value.user)
    && typeof value.user.login === "string"
    && value.user.login !== ""
    && isIsoTimestamp(value.created_at)
    && isIsoTimestamp(value.updated_at)
    && Object.prototype.hasOwnProperty.call(value, "performed_via_github_app")
    && (value.performed_via_github_app === null || isGitHubAppProvenance(value.performed_via_github_app))
}

function isGitHubAppProvenance(value: unknown): value is GitHubAppProvenance {
  return isRecord(value)
    && typeof value.id === "number"
    && Number.isSafeInteger(value.id)
    && value.id > 0
    && typeof value.slug === "string"
    && value.slug !== ""
}

function isIsoTimestamp(value: unknown): value is string {
  if (typeof value !== "string") return false
  const match = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2})(?:\.\d+)?(?:Z|[+-](\d{2}):(\d{2}))$/.exec(value)
  if (!match) return false
  const [year, month, day, hour, minute, second, offsetHour, offsetMinute] = match.slice(1).map(Number)
  const leapYear = year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0)
  const daysInMonth = month === 2 ? (leapYear ? 29 : 28) : ([4, 6, 9, 11].includes(month) ? 30 : 31)
  return month >= 1
    && month <= 12
    && day >= 1
    && day <= daysInMonth
    && hour <= 23
    && minute <= 59
    && second <= 59
    && (Number.isNaN(offsetHour) || (offsetHour <= 23 && offsetMinute <= 59))
    && Number.isFinite(Date.parse(value))
}

function timestampValue(value: string): number {
  return Date.parse(value)
}

function isProvider(login: string): boolean {
  return login.replace(/\[bot\]$/, "") === PROVIDER_LOGIN
}

function cleanNotificationHead(body: string): string | null {
  if (body.length > 16_384) return null
  const lines = body.split("\n")
  const cleanHeading = CLEAN_COMMENT_HEADING.exec(lines[0] ?? "")
  const reviewedCommit = REVIEWED_COMMIT.exec(lines[2] ?? "")?.[1]
  const details = lines.slice(4)
  return cleanHeading !== null
    && lines[1] === ""
    && reviewedCommit !== undefined
    && lines[3] === ""
    && details.length >= 2
    && /^<details>(?:[ \t]*<summary>[^<\r\n]*<\/summary>)?$/.test(details[0] ?? "")
    && details.at(-1) === "</details>"
    && !details.slice(1, -1).some((line) =>
      REVIEWED_COMMIT.test(line) || /<\/?details/i.test(line),
    )
    ? reviewedCommit
    : null
}

async function main(): Promise<number> {
  const args = process.argv.slice(2)
  if (args.includes("--help")) {
    console.log([
      "usage:",
      "  bun .agents/skills/run-bounded-mission/scripts/wait-pr-codex-review.ts --repo <owner/name> --request-locator <node-id> --request-author <login> <pr-number>",
      "  bun .agents/skills/run-bounded-mission/scripts/wait-pr-codex-review.ts --render-request <head-oid>",
      "  bun .agents/skills/run-bounded-mission/scripts/wait-pr-codex-review.ts --validate-request <head-oid> < request-body",
      "  bun .agents/skills/run-bounded-mission/scripts/wait-pr-codex-review.ts --request-effect-preflight --repo <owner/name> --request-author <login> <pr-number>",
      "  bun .agents/skills/run-bounded-mission/scripts/wait-pr-codex-review.ts --delivery-receipt create < canonical-input.jsonl",
      "  bun .agents/skills/run-bounded-mission/scripts/wait-pr-codex-review.ts --delivery-receipt verify --sha256 <sha256:digest> < receipt.jsonl",
    ].join("\n"))
    return 0
  }
  if (args[0] === "--render-request") {
    if (args.length !== 2) {
      console.error("codex-review: failed: expected --render-request and one full lowercase 40-hex head")
      return 2
    }
    try {
      process.stdout.write(renderCodexReviewRequest(args[1]!))
      return 0
    } catch (error) {
      console.error(`codex-review: failed: ${error instanceof Error ? error.message : "invalid head"}`)
      return 2
    }
  }
  if (args[0] === "--validate-request") {
    if (args.length !== 2) {
      console.error("codex-review: failed: expected --validate-request and one full lowercase 40-hex head")
      return 2
    }
    try {
      const validation = validateCodexReviewRequest(await Bun.stdin.text(), args[1]!)
      process.stdout.write(`${JSON.stringify(validation)}\n`)
      return validation.classification === "valid" ? 0 : 1
    } catch (error) {
      console.error(`codex-review: failed: ${error instanceof Error ? error.message : "invalid head"}`)
      return 2
    }
  }
  if (args[0] === "--request-effect-preflight") {
    const flagValue = (flag: string): string | undefined => {
      const index = args.indexOf(flag)
      return index >= 0 ? args[index + 1] : undefined
    }
    const flags = ["--repo", "--request-author"]
    const consumed = new Set([0])
    for (const flag of flags) {
      const index = args.indexOf(flag)
      consumed.add(index)
      consumed.add(index + 1)
    }
    const positional = args.filter((_, index) => !consumed.has(index))
    const number = positional.length === 1 && /^[1-9]\d*$/.test(positional[0] ?? "")
      ? Number(positional[0])
      : Number.NaN
    let repository: string
    let requestAuthor: string
    try {
      if (flags.some((flag) => args.filter((value) => value === flag).length !== 1)
        || !Number.isSafeInteger(number)) throw new Error("invalid request effect preflight arguments")
      repository = normalizeRepository(flagValue("--repo") ?? "")
      requestAuthor = flagValue("--request-author") ?? ""
      normalizeRequestExpectation("request-effect-preflight", requestAuthor)
    } catch (error) {
      console.error(`codex-review: failed: ${error instanceof Error ? error.message : "invalid preflight"}`)
      return 2
    }
    try {
      const snapshot = await fetchSnapshot(repository, number)
      const effectAuthority = classifyRequestEffectAuthority(snapshot, requestAuthor)
      process.stdout.write(`${JSON.stringify({
        schema: REQUEST_EFFECT_PREFLIGHT_SCHEMA,
        status: effectAuthority.effect_allowed ? "allowed" : "frozen",
        repository,
        pull_request: number,
        head_oid: snapshot.headRefOid,
        snapshot_complete: snapshot.complete,
        effect_authority: effectAuthority,
      })}\n`)
      return effectAuthority.effect_allowed ? 0 : 1
    } catch (error) {
      process.stderr.write(`${JSON.stringify({
        schema: REQUEST_EFFECT_PREFLIGHT_SCHEMA,
        status: "unavailable",
        repository,
        pull_request: number,
        head_oid: error instanceof ReviewSnapshotError ? error.headOid : null,
        reason: `evidence_unavailable: ${error instanceof Error ? error.message : "unexpected provider failure"}`,
      })}\n`)
      return 2
    }
  }
  if (args[0] === "--delivery-receipt") {
    try {
      if (args.length === 2 && args[1] === "create") {
        process.stdout.write(canonicalLine(createDeliveryBarrierReceipt(
          new Uint8Array(await Bun.stdin.arrayBuffer()),
        )))
        return 0
      }
      if (args.length === 4 && args[1] === "verify" && args[2] === "--sha256") {
        process.stdout.write(canonicalLine(verifyDeliveryBarrierReceipt(
          new Uint8Array(await Bun.stdin.arrayBuffer()),
          args[3]!,
        )))
        return 0
      }
      throw new Error("expected delivery-receipt create or verify with one SHA-256")
    } catch (error) {
      console.error(`codex-review: failed: ${error instanceof Error ? error.message : "invalid delivery receipt"}`)
      return 2
    }
  }
  const repoIndex = args.indexOf("--repo")
  const locatorIndex = args.indexOf("--request-locator")
  const authorIndex = args.indexOf("--request-author")
  const repositoryArgument = repoIndex >= 0 ? args[repoIndex + 1] : undefined
  const locatorArgument = locatorIndex >= 0 ? args[locatorIndex + 1] : undefined
  const authorArgument = authorIndex >= 0 ? args[authorIndex + 1] : undefined
  const consumedIndexes = new Set([
    repoIndex, repoIndex + 1,
    locatorIndex, locatorIndex + 1,
    authorIndex, authorIndex + 1,
  ])
  const positional = args.filter((_, index) => !consumedIndexes.has(index))
  const numberToken = positional[0]
  const number = typeof numberToken === "string" && /^[1-9]\d*$/.test(numberToken)
    ? Number(numberToken)
    : Number.NaN
  let repository: string
  let expectation: ReviewRequestExpectation
  try {
    repository = normalizeRepository(repositoryArgument ?? "")
    expectation = normalizeRequestExpectation(locatorArgument ?? "", authorArgument ?? "")
  } catch {
    console.error("codex-review: failed: repository, request locator, or request author is invalid")
    return 2
  }
  if (args.filter((arg) => arg === "--repo").length !== 1
    || args.filter((arg) => arg === "--request-locator").length !== 1
    || args.filter((arg) => arg === "--request-author").length !== 1
    || positional.length !== 1
    || !Number.isSafeInteger(number)) {
    console.error("codex-review: failed: expected repository, request locator/author, and one positive PR number")
    return 2
  }

  try {
    const snapshot = await fetchSnapshot(repository, number)
    const decision = classifyCodexReview(snapshot, expectation)
    writeOutput({
      schema: RECEIPT_SCHEMA,
      repository,
      pull_request: number,
      head_oid: snapshot.headRefOid,
      status: decision.status,
      reason: decision.reason,
      request: decision.request,
      discovery: decision.discovery,
      ...(decision.discovery.problems.includes("usage-failure") ? { provider_snapshot: snapshot } : {}),
    })
    return decision.exitCode
  } catch (error) {
    writeOutput({
      schema: RECEIPT_SCHEMA,
      repository,
      pull_request: number,
      head_oid: error instanceof ReviewSnapshotError ? error.headOid : null,
      status: "failed",
      reason: error instanceof Error ? error.message : "unexpected provider failure",
      request: emptyRequest("incomplete", expectation),
      discovery: {
        status: "waiting",
        reviewed_head: null,
        provider_review: null,
        clean_signal: null,
        progress_signal: null,
        findings: [],
        provider_signals: [],
        history: [],
        problems: ["snapshot-incomplete"],
      },
    })
    return 1
  }
}

function writeOutput(output: ReviewOutput): void {
  const line = `${JSON.stringify(output)}\n`
  if (output.status === "failed") process.stderr.write(line)
  else process.stdout.write(line)
}

if (import.meta.main) process.exitCode = await main()
