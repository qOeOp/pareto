# Codex Task Dispatch

Load this owner for independent outcomes, existing children, or Hub orchestration. It owns native Task
admission, identity, DAG/custody, fan-in, and endpoints - not leaf work, review, CI, or merge.

## Choose the execution primitive

- A **native Task** is a bounded, accepted, independently closable consumer outcome created and sent
  by native thread tools. Only its native create/reuse and send receipts admit `threadId`/`hostId` to
  the Goal DAG and active-task set and confer child lifecycle, candidate, or PR custody.
- An **agent lane** follows [agent routing](orchestration-agent-routing.md) and uses `spawn_agent` for
  one bounded question, frozen mechanical leaf, or review inside one Mission; it has no independent
  outcome, custody, branch, PR, or effect. An exposed `agentThreadId` remains agent activity, not Task
  admission.
- **Main** owns ordinary implementation and lifecycle authority; support work stays in its outcome's Mission.

Classify custody by issuing receipt, never names or thread locators. Explicit
Hub-mode approval of bounded independent outcomes authorizes exact native-Task packets within the
admitted Frame/effects. A new outcome or wider effect requires alignment. Missing or ambiguous native-
Task capability freezes its node; never substitute an agent lane.

Before a Goal effect, reconcile the matching Goal. It stores overall outcome and completion, not a work
clock; absent capability or a nonmatching Goal freezes Goal/DAG effects.

For new independent Missions only, [canonical task types](orchestration-task-types.md) owns one stable
label/title; native identity remains exact `threadId`/`hostId`. Only a Hub creates or reuses it. A child
or single Main returns a further independent outcome as one ready proposal.

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

Freeze before effect: Frame, Plan, Origin, owner/paths, consumer/acceptance, dependencies,
authority/effect limits, endpoint, language, and next legal action.
An initial release carries those fields once. A continuation is exactly:

```text
prior: <last admitted native message item locator>
delta: <changed identity/contract/finding and action; or action-only with verify equivalence>
verify: <changed-input gates; unchanged-input/same-recipe evidence locators>
return: Finalize
stop: <finite blocker and effect boundary>
```

Missing prior/equivalence or any copied stable field, evidence/history inventory, or terminal shape
stops the send. Canonical UTF-8 bytes/length/SHA-256 identify producer recovery, not model receipt.

Before create, close the mode-scoped authoritative set from checkpointed packets, attempts, receipts,
and identities. Reconcile a known collision once; observe the bounded list only for custody. Reuse an
exact collision; ambiguous or possible success forbids create.

The existing Hub creates once. A clientThreadId is a consumed pending attempt; do not read, rename,
message, or retry it before causal mapping to threadId/hostId. Set/read an exact title once and send
once; the native receipt is semantic release. Continuation shares that gate and has no supplement.
Failure, mismatch, or ambiguity is host-defect/no-change; never retry, repacket, or replace.

After release, add the child to the Hub active set and monitor only through the custody contract below.

## Observe child events without polling

An observation window is admitted by one explicit user status request, one unseen terminal or
needs-attention receipt, or one checkpointed next observation action. Callback transport is an
optional early wake: it may report a structural authority gap, changed dependency receipt, or terminal
state, but it does not replace Hub custody or make arrival order authoritative.

The Hub consumes Finalize's child decision index with the native identity carried by transport.
Missing, malformed, unknown, or unavailable locators freeze only the dependent Hub action; the
acceptance gate below still resolves every required fact from its current owner.

Ordinary child custody uses one native cursor-bound wait over the complete exact active set. Bind Stop
and its finite timeout first; stop on an actionable receipt, user input, or expiry. An explicit status
request uses one timeoutMs: 0 snapshot. Host orchestration may cancel non-returning transport at a
stricter caller deadline; Main never emulates either deadline with sleep, thread reads, commentary,
retry, or resubscription. Expiry or transport failure ends the session with custody intact. Admit a
thread read only after an actionable receipt or explicit user history question, and only when the host
bounds exact target, turn, item, and output before model context; otherwise history is unavailable.

Only a receipt changing the next Hub operation, authority, identity, candidate verdict, DAG release,
Stop/Resume, or endpoint is actionable. Progress stays with the child until such a receipt needs it.
Other results stay inside the session; at expiry yield silently with no Hub output, checkpoint, read,
effect, or same-turn resubscription. `source=goal` carries but never wakes one checkpointed wait. Only
a target callback or authenticated user input wakes it; an unchanged window consumes it. Carrier
status and time create no cadence.

For each continued target require cursor continuity, target/host identity, and non-regressing
revision. An early wake may omit a target; retain its prior facts but do not call it unchanged.
Malformed, unknown, discontinuous, or incomplete evidence freezes affected slices and emits one
needs-attention result with its predicate and earliest useful read. Transport or host unavailability
ends the session with custody intact and authorizes no same-turn read or retry.

For a changed Hub window, reconcile all stable components once against current
Goal/task/Git/GitHub/dependency/authority. Main reproduces decisive consumer conflicts and records each
member accepted, rejected, or superseded_by. Replace one private checkpoint for the wave, publish only
if recovery permits, and release every newly ready nonconflicting direct successor in the same turn.
One receipt never repeats global passes.

## Critical-path and endpoints

At each Plan or reconciliation, partition nodes by owner, write surface, contract, external effect
target, and dependency-consuming slice. Release every nonconflicting runnable slice in the same wave;
one blocked writer cannot hold frozen-input review, delivery preparation, consumer-revalidation
preparation, or successor investigation. Serialize only overlaps and unknown independence. Bind
shared non-repository mutation targets before dispatch. A predecessor that changes the canonical
source freezes only the successor's dependency-consuming and final identity-bound slices. After exact
merged evidence, recover the same child, integrate once, and revalidate changed inputs; never replace
it.

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
