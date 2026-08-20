# Codex Task Dispatch

Load this owner for an independent outcome, an existing child, or Hub orchestration. It owns native
Task identity, admission, DAG relations, active-task custody, bounded observation, fan-in, and
endpoints. It does not own a second lifecycle, leaf work, review, CI, or the merge procedure.

## Admit outcomes and authority

Create a Mission only when it has an independently valuable consumer outcome, bounded scope,
falsifiable acceptance, one write owner, and an independently closable endpoint. Diagnosis, testing,
documentation sync, review correction, and support work for one outcome stay inside its Mission.
Creation requires explicit user approval of the exact ready packet.

Before creation, apply the parent-cancellation counterfactual. If cancelling the parent outcome leaves
no independently valuable real consumer and no meaningful closable endpoint, the work remains inside
the parent lifecycle instead of becoming a Mission.

Before a Goal-driven effect, observe Goal capability and reconcile the matching Goal. The Goal stores
only the overall outcome and completion boundary. No Goal, missing capability, or a nonmatching Goal
freezes Goal/DAG effects; a Goal continuation is never a work clock.

Classify task metadata through [canonical task types](orchestration-task-types.md) only when proposing a
new independent Mission. A packet owns one stable label and exact title. Native identity is always the
exact threadId/hostId, never a title, list resemblance, or serial.

Only an existing Hub creates or reuses a native Task. A child or single-Mission Main that discovers a
further independent outcome returns one exact ready proposal to its Hub or user; it does not create a
nested active-task set or native Task.

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

Any support lane remains local to its one dispatching Mission under
[agent routing](orchestration-agent-routing.md). It never enters the Hub active-task set, carries an
independent outcome, replaces a native Task, or supplies another node's endpoint.

## Admit one native Task message

Freeze the complete packet before effect: current Frame and Plan, Origin, owner and paths, consumer
and acceptance, dependencies, authority and prohibited effects, endpoint, interaction language, and
one next legal action. Bind its canonical UTF-8 bytes, length, and SHA-256 for producer/recovery
identity; this does not prove bytes received by the model.

Before create, close the mode-scoped authoritative set from checkpointed packets, attempts, receipts,
and exact identities. Reconcile any known colliding identity once and make one bounded list observation
only when needed for custody. An exact collision reuses the recorded task; ambiguous or possible
success forbids another create.

The existing Hub creates once. A clientThreadId is a consumed pending attempt and cannot be read, renamed, messaged, or
retried until causally mapped to threadId/hostId. For an exact identity, set and read back the exact
title once, send the complete packet once, and treat the native send receipt as semantic release.
Continuation uses the same identity/title/single-send gate and never a supplement. Failure, mismatch,
or ambiguous effect is host-defect/no-change; do not retry, repacket, or create a replacement.

After release, add the child to the Hub active set and monitor only through the custody contract below.

## Observe child events without polling

An observation window is admitted by one explicit user status request, one unseen terminal or
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

For ordinary child custody, one observation action is a finite session over the complete exact active
set. Bind its Stop and its quiet-deadline continuation before starting. When the host supports
programmatic orchestration, chain cursor-bound waits inside that session without returning timeout or
progress-only results to Main. Stop on an actionable receipt, user input, or the session deadline. An
internal wait timeout never shortens the session; choose its deadline from user responsiveness and the
expected in-flight operation. An explicit status request uses one timeoutMs: 0 snapshot. Use one
bounded thread read only when an admitted receipt or user question requires history.

Only a receipt changing the next Hub operation, authority, identity, candidate verdict, DAG release,
Stop/Resume, or endpoint is actionable. Progress-only file, command, build, or partial-check updates
stay with the child until needed by an actionable receipt. Other, duplicate, or timed-out results stay
inside the admitted session. At its deadline yield silently: no Hub communication, replacement
checkpoint, read, effect, or same-turn resubscription. Goal continuation may execute only the exact
quiet-deadline action already in the checkpoint; elapsed time cannot invent or change a session.

For each continued target require cursor continuity, target/host identity, and non-regressing
revision. An early wake may omit a target; retain its prior facts but do not call it unchanged.
Malformed, unknown, discontinuous, or incomplete evidence freezes affected slices and emits one
needs-attention result with its predicate and earliest useful read. Transport or host unavailability
ends the session with custody intact and authorizes no same-turn read or retry.

For a Hub child at a changed window, reconcile each stable component once against current Goal, task, Git, GitHub,
dependency, and authority facts. Main reproduces decisive consumer conflicts and records each member
accepted, rejected, or superseded_by. Then emit one replacement checkpoint and release a direct
successor's recorded next owner in the same turn. One receipt never triggers repeated global passes.

## Critical-path and endpoints

Independent nodes may work in parallel; overlap in an owner, repository path, contract, or external
effect target serializes only that critical slice; unknown independence does the same. Bind shared
non-repository mutation targets before dispatch. A predecessor that changes the canonical source
freezes only the successor's dependency-consuming and final identity-bound slices. After exact merged
evidence, recover the same child, integrate once, and revalidate changed inputs; never replace it.

One child owns at most one candidate branch and one PR. GitHub Delivery owns publication,
merge-readiness, and guarded-merge procedure. PR endpoints are:

- open: exact candidate published in the authorized Draft/Ready state;
- merge-ready: exact candidate satisfies [GitHub delivery](../delivery/delivery-pullrequest-workflow.md)
  without merging;
- merged: child stops at merge-ready; Hub alone performs the separately authorized merge effect under
  Delivery's procedure and closes the node after exact readback;
- no-PR: closes on its admitted consumer evidence.

Hub accepts a terminal handoff only when identity, candidate, base, endpoint, conversations, checks,
freshness, and authority match current owners. Drift returns the same child to Plan. Closed,
superseded, rejected, waiting, or unavailable nodes remain explicit evidence and cannot satisfy another
endpoint.

Complete the overall Goal only after every required node has exact endpoint evidence or explicit
authorized cancellation. A child never updates the Goal.

## Capability fallback

Unavailable Goal capability freezes Goal/DAG effects but permits an explicitly Goal-unbound single
Mission. Native Task custody runs from consumed create/send attempt to exact endpoint or explicit
cancellation/reframe; availability never vacates its identity, owner, candidate, or endpoint. Before
identity, ambiguous success is host-defect/no-change. After identity, preserve the Task, candidate,
branch, and worktree; mark its node `needs_attention` until that same Task resumes. Retry, replacement,
support/hidden writer, Hub foreground execution, or substitute endpoint is forbidden. Independent
nodes may continue.
Never serialize Hub state into repository files or add an automation, reminder, daemon, heartbeat,
queue, or scheduler.
