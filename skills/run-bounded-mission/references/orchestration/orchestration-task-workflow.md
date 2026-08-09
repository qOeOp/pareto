# Codex Task Dispatch

Load this owner for an independent outcome, an existing child, or Hub orchestration. It owns native
Task identity, admission, DAG relations, active-task custody, bounded observation, fan-in, and
endpoints. It does not own a second lifecycle, leaf work, review, CI, or merge.

## Admit outcomes and authority

Create a Mission only when it has an independently valuable consumer outcome, bounded scope,
falsifiable acceptance, one write owner, and an independently closable endpoint. Diagnosis, testing,
documentation sync, review correction, and support work for one outcome stay inside its Mission.
Creation requires explicit user approval of the exact ready packet.

Before a Goal-driven effect, observe Goal capability and reconcile the matching Goal. The Goal stores
only the overall outcome and completion boundary. No Goal, missing capability, or a nonmatching Goal
freezes Goal/DAG effects; a Goal continuation is never a work clock.

Classify task metadata through [canonical task types](orchestration-task-types.md) only when proposing a
new independent Mission. A packet owns one stable label and exact title. Native identity is always the
exact threadId/hostId, never a title, list resemblance, or serial.

## Keep one compact DAG

The Hub checkpoint is the only active-run projection. Each approved node retains its exact identity,
owner/write surface, endpoint, candidate or terminal locator, and non-empty slices:

```text
waiting | runnable | running | frozen | needs_attention | terminal
```

Admit only:

- blocks(A, B): B names the exact prerequisite, locator, consuming slice, and release observation;
- superseded_by(A, B): B demonstrably absorbs A's outcome or publication surface;
- revalidate_after(A, evidence): the named A slice must consume a changed head, authority, contract,
  or component observation.

Every edge must have an immutable locator and bounded affected slice. Recompute the release graph
before a dependent effect; a cycle or overlapping writer returns the component to Plan. Repository
labels, receipt order, elapsed time, or task status cannot invent an edge.

The Hub owns the registered active-task set, exact cursors, consumed actionable locators, current
window, and next observation action. A child owns its Frame through Finalize, implementation,
verification, CI, review, waiting, and terminal evidence. Hub work is limited to admission, custody,
DAG/authority reconciliation, fan-in, and guarded merge.

## Admit one native Task message

Freeze the complete packet before effect: current Frame and Plan, Origin, owner and paths, consumer
and acceptance, dependencies, authority and prohibited effects, endpoint, interaction language, and
one next legal action. Bind its canonical UTF-8 bytes, length, and SHA-256 for producer/recovery
identity; this does not prove bytes received by the model.

Before create, close the mode-scoped authoritative set from checkpointed packets, attempts, receipts,
and exact identities. Reconcile any known colliding identity once and make one bounded list observation
only when needed for custody. An exact collision reuses the recorded task; ambiguous or possible
success forbids another create.

Create once. A clientThreadId is a consumed pending attempt and cannot be read, renamed, messaged, or
retried until causally mapped to threadId/hostId. For an exact identity, set and read back the exact
title once, send the complete packet once, and treat the native send receipt as semantic release.
Continuation uses the same identity/title/single-send gate and never a supplement. Failure, mismatch,
or ambiguous effect is host-defect/no-change; do not retry, repacket, or create a replacement.

After release, add the child to the active set. Outside Hub mode, return immediately. In Hub mode,
monitor only through the custody contract below.

## Observe events without polling

An observation window is admitted by one explicit user request, one unseen terminal or
needs-attention receipt, or one checkpointed next observation action. Callback transport is an
optional early wake: it may report a structural authority gap, changed dependency receipt, or terminal
state, but it does not replace Hub custody or make arrival order authoritative.

A child's terminal or needs-attention final is itself a short decision-first handoff. Use the exact
native-task identity carried by transport; repeat it inline only when unavailable or ambiguous. Lead
with outcome or state, any current blocker or dependency, next legal Hub action, and effects. Inline
candidate, head, PR, or verification only when it changes that action; otherwise use its existing
native-task, Git, GitHub, or artifact locator. Do not repeat Frame, Plan, history, or full CI/check
lists. If any handoff-relevant evidence lacks a usable locator or is malformed, unknown, or
unavailable, say so inline and fail closed for the affected action. Locators may compress only
available, well-formed evidence.

For ordinary custody, issue at most one cursor-bound bounded wait over the complete exact active set in
one scheduling slice. Choose a nonzero bound from current task state or a known external deadline. An
explicit status request uses one timeoutMs: 0 snapshot. Use one bounded thread read only when an
admitted receipt or user question requires history.

Only unseen terminal or needs-attention content changes the DAG, authority, candidate validity,
release predicate, or endpoint. An unchanged, duplicate, timed-out, or non-actionable observation
produces no commentary, message, history read, repository/GitHub/Goal effect, or immediate
resubscription: record the next observation action and silently yield.

For each continued target require cursor continuity, target/host identity, and non-regressing
revision. An early wake may omit a target; retain its prior facts but do not call it unchanged.
Malformed, unknown, discontinuous, or incomplete evidence freezes only affected slices and emits one
compact needs-attention result with the exact predicate and earliest useful read. Task, reviewer,
transport, or host unavailability never creates a retry loop or a new task.

At a changed window, reconcile each stable component once against current Goal, task, Git, GitHub,
dependency, and authority facts. Main reproduces decisive consumer conflicts and records each member
accepted, rejected, or superseded_by. Then emit one replacement checkpoint and release a direct
successor's recorded next owner in the same turn. One receipt never triggers repeated global passes.

## Critical-path and endpoints

Independent nodes may work in parallel; shared owner, write surface, contract, or unknown independence
serializes them. A predecessor that changes the canonical source freezes only the successor's
dependency-consuming and final identity-bound slices. After exact merged evidence, recover the same
child, integrate once, and revalidate changed inputs; never replace it.

One child owns at most one candidate branch and one PR. PR endpoints are:

- open: exact candidate published in the authorized Draft/Ready state;
- merge-ready: exact candidate satisfies [GitHub delivery](../delivery/delivery-pullrequest-workflow.md)
  without merging;
- merged: child stops at merge-ready; Hub alone performs the separately authorized guarded merge;
- no-PR: closes on its admitted consumer evidence.

Hub accepts a terminal handoff only when identity, candidate, base, endpoint, conversations, checks,
freshness, and authority match current owners. Drift returns the same child to Plan. Closed,
superseded, rejected, waiting, or unavailable nodes remain explicit evidence and cannot satisfy another
endpoint.

Complete the overall Goal only after every required node has exact endpoint evidence or explicit
authorized cancellation. A child never updates the Goal.

## Capability fallback

Unavailable Goal capability freezes Goal/DAG effects but permits an explicitly Goal-unbound single
Mission. Unavailable native Task capability preserves the approved packet and reports the missing
effect; it authorizes no hidden sub-agent, branch, retry, or replacement. Never serialize Hub state
into repository files or add an automation, reminder, daemon, heartbeat, queue, or scheduler.
