# Codex Task Dispatch

Load this owner for independent outcomes, existing children, or Hub orchestration. It owns native Task
admission, identity, DAG/custody, fan-in, and endpoints - not leaf work, review, CI, or merge.

## Choose the execution primitive

- A **native Task** is a bounded, accepted, independently closable consumer outcome created and sent
  by native thread tools. Only its native create/reuse and send receipts admit `threadId`/`hostId` to
  the Hub DAG and active-task set and confer child lifecycle, candidate, or PR custody.
- An **agent lane** follows [agent routing](orchestration-agent-routing.md) and uses `spawn_agent` for
  one bounded question, frozen mechanical leaf, or review inside one Mission; it has no independent
  outcome, custody, branch, PR, or effect. An exposed `agentThreadId` remains agent activity, not Task
  admission.
- A **Leaf Main** (single or child) owns implementation; support stays inside that Mission.

Classify custody by issuing receipt, never names or thread locators. Explicit
Hub-mode approval of bounded independent outcomes authorizes exact native-Task packets within the
admitted Frame/effects. A new outcome or wider effect requires alignment. Missing or ambiguous native-
Task capability freezes its node; never substitute an agent lane.

Before a Goal effect, reconcile the matching Goal and apply the kernel binding rule. It stores overall
outcome and completion, not work cadence; absent capability or a nonmatching Goal freezes only that
effect. An asynchronous Hub may bind it only while a runnable operation or the checkpointed active-task
wait below exists.

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

The Hub owns active Tasks, cursors, the current window, DAG/authority, fan-in, and guarded merge. A
child owns Frame through Finalize. Before a Hub repository mutation, require exact terminal child
evidence and integration scope; otherwise release or recover its native Task, or freeze the node when
Task capability is unavailable. Agent lanes never satisfy this gate.

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

Host wake admission consumes exactly one just-issued first observation, actionable callback, exact
non-carrier user request, matching Goal continuation for a checkpointed non-empty active set, or due
tick from a product-native recurring monitor with user-authorized target, cadence, output policy, and
terminal condition. The wake owner never owns the DAG, authority, or candidate.

The Hub consumes Finalize's child decision index with the native identity carried by transport.
Missing, malformed, unknown, or unavailable locators freeze only the dependent Hub action; the
acceptance gate below still resolves every required fact from its current owner.

One Hub turn owns at most one native cursor-bound wait over the complete exact active set. Bind Stop
and the longest host-safe finite timeout first. It ends on an actionable receipt, authenticated user
input, expiry, or transport failure. An explicit status request uses one timeoutMs: 0 snapshot. Host
orchestration may cancel non-returning transport at a stricter caller deadline; Main never emulates
either deadline.

Only a receipt changing the next Hub operation, authority, identity, candidate verdict, DAG release,
Stop/Resume, or endpoint is actionable; child progress never is. Every other result retains custody
and ends the turn. Progress/expiry is silent waiting. For transport failure, checkpoint the exact
target-set/cursor/failure-class key and consecutive-window count, saturated at three; clear it after a
successful wait or target-set change. Counts one and two are silent with no read/retry; count three is
unavailable only when decision consumption is blocked and no independent running or runnable node can progress.
Waiting never enters blocked audit. Only a later admitted wake may re-arm the exact wait; a
source=goal wake must match its checkpointed non-empty active set. An empty active set is a DAG
scheduling event, not evidence that the Goal is blocked: missing Finalize from a known Task returns
that node to one exact runnable recovery; a repeated empty completion freezes only that node. Every
independent runnable node releases in the same turn. If neither recovery, release, nor a wait remains,
apply the kernel inherited-Goal transition.
Admit a thread read only after an actionable receipt or
explicit user history question, and only when the host bounds exact target, turn, item, and output
before model context; otherwise history is unavailable.

For each continued target require cursor continuity, target/host identity, and non-regressing
revision. An early wake may omit a target; retain its prior facts but do not call it unchanged.
`turnCompleted` proves an endpoint only when the wake turn and its exact terminal payload are present.
If the snapshot advanced to a successor turn and omitted that payload, treat it as incomplete transport
evidence, not carrier-only: retain the prior cursor and failure key; consume neither turn nor endpoint.
Malformed, unknown, discontinuous, or incomplete evidence freezes affected slices and emits one
needs-attention result with its predicate and earliest useful read. Transport or host unavailability
uses this rule; no same-turn fallback is authorized.

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

Unavailable Goal capability freezes only Goal effects. Native Task custody runs from consumed
create/send attempt to exact endpoint or explicit
cancellation/reframe; availability never vacates its identity, owner, candidate, or endpoint. Before
identity, ambiguous success is host-defect/no-change. After identity, preserve the Task, candidate,
branch, and worktree; mark its node `needs_attention` until that same Task resumes. Retry, replacement,
support/hidden writer, or substitute endpoint is forbidden. Independent
nodes may continue.
Never serialize Hub state or build a Skill-local clock, queue, daemon, or scheduler. Explicit recurring
observation uses the product-native wake owner above and remains Goal-unbound. A Goal-bound executable
Hub may carry only the exact checkpointed active-target wait.
