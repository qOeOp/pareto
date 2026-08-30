# Codex Task Dispatch

Load this owner after Frame selects native Hub or for an existing native Task. It owns native identity,
DAG/custody, fan-in, and endpoints - not lane work, review, CI, or merge.

## Bind the native boundary

A **native Task** is a peer user Task, not a subagent or host child. Frame must bind the explicit user
request, durable independent outcome, and native-only need. Native create/reuse and send receipts alone
admit `threadId`/`hostId` to the logical Hub DAG and active set; `agentThreadId` never does. Main owns
Frame, Plan, integration, acceptance, and effects; each native Task Main owns its separate candidate.
Classify custody by receipt, never names or locators. Missing capability freezes the node; a new user
outcome or wider effect still requires alignment.

The native active set is peer-Task custody, not a lane gate. Never add `agentThreadId`, serialize lanes
on native unavailability, or create a Task merely for parallelism.

Before a Goal effect, reconcile the matching Goal and apply the kernel binding rule. It stores overall
outcome and completion, not work cadence; absent capability or a nonmatching Goal freezes only that
effect. An asynchronous Hub may bind it only while a runnable operation or the checkpointed active-task
wait below exists.

For new native Missions only, [canonical task types](orchestration-task-types.md) owns one stable
label/title; native identity remains exact `threadId`/`hostId`. Only a Hub creates or reuses it. A Task
or single Main returns a further native-only outcome as one ready proposal.

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

The Hub owns active Tasks, cursors, the current window, DAG/authority, fan-in, and guarded merge. Each
native Task owns Frame through Finalize. Before integrating its separate candidate, require exact
terminal evidence and scope; otherwise recover that Task or freeze its node. Intra-Mission writable
lanes instead mutate only Main's leased paths; Main inspects their return and owns the resulting
candidate.

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

For a detached native Mission, use the installer-owned controller at
`<codex-root>/native-task-controller/native-task-controller.mjs`. Invoke `dispatch` once with one new,
absolute, Hub-owned receipt directory plus the exact Codex executable identity, cwd, prompt file,
sandbox, model, and timeout. Detached execution is fixed to `approvalPolicy=never`. The controller
creates the receipt directory as the consumed attempt lease, starts one app-server Task, atomically
writes `start.json` only after exact `thread/start` and `turn/start`, and writes `terminal.json` only
after exact terminal `thread/read`. A returned `starting` attempt is consumed but not identity-admitted;
invoke no second dispatch. A returned `running` or `terminal` start receipt admits only its exact
thread/turn. A request mismatch, existing directory without a valid matching attempt, or `failure.json`
freezes that node.

On a later admitted wake, invoke `inspect` with only that exact receipt directory. It is a bounded local
receipt read, not a Task history scan or scheduler. `starting` and `running` are silent waiting;
`needs_attention` and `terminal` are actionable. Repeating `dispatch` with the identical request and
directory is a receipt recovery read and never creates another Task. Never infer identity from title,
list results, process id, or receipt-directory name.

The existing Hub creates once. A clientThreadId is a consumed pending attempt; do not read, rename,
message, or retry it before causal mapping to threadId/hostId. Set/read an exact title once and send
once; the native receipt is semantic release. Continuation shares that gate and has no supplement.
Failure, mismatch, or ambiguity is host-defect/no-change; never retry, repacket, or replace.

After release, add the peer Task to the Hub active set and monitor only through the custody contract below.

## Observe Task events without polling

Host wake admission consumes exactly one just-issued first observation, actionable callback, exact
non-carrier user request, matching Goal continuation for a checkpointed non-empty active set, or due
tick from a product-native recurring monitor with user-authorized target, cadence, output policy, and
terminal condition. The wake owner never owns the DAG, authority, or candidate.

The Hub consumes Finalize's Task decision index with the native identity carried by transport.
Missing, malformed, unknown, or unavailable locators freeze only the dependent Hub action; the
acceptance gate below still resolves every required fact from its current owner.

When every active Task uses controller receipts, one wake may inspect each exact active receipt once and
must not also call native wait/status transport. Otherwise, use the native transport below.
One Hub turn owns at most one native cursor-bound wait over the complete exact active set. It is a
notification accelerator, never acceptance or custody authority. Bind Stop and a host-safe finite
timeout; explicit status uses one timeoutMs: 0 snapshot. A native `wait_threads.timeoutMs` bounds only its
event wait; a trailing bounded progress snapshot may add latency, so that value is never the caller-visible
deadline. Put the one native wait in one `functions.exec` cell and set that call's `yield_time_ms` earlier than
Stop. If it completes before that deadline, consume its byte-bounded receipt and clear the cell normally. If
it returns `Script running with cell ID`, immediately call `functions.wait` once with that exact `cell_id` and
`terminate: true`; require the terminal cleanup receipt, discard late output, retain the cursor, checkpoint
caller-deadline transport failure, and end the window. A promise race or yield without exact cell termination
leaks the transport and is forbidden. If the host cannot prove bounded yield, exact cell custody, and terminal
cleanup for the current call, do not invoke the wait; observation is unavailable. The wrapper deadline is
transport control, not a second scheduler, wake, retry, fallback read, or state authority.

A terminal cleanup receipt proves only that this wrapper stopped its owned cell; deterministic text cannot
prove live host hard-real-time cancellation. In legacy closure output, `pending_wait_handler:
abandoned_at_caller_deadline` means its late receipt is abandoned after exact-cell termination, never that the
transport remains running. `live_host_hard_realtime_cancellation: unproved` preserves that evidence limit and
does not weaken the mandatory cleanup path.

Only a receipt changing the next operation, authority, identity, candidate verdict, DAG release,
Stop/Resume, or endpoint is actionable; Task progress never is. Progress/expiry is silent waiting and
Waiting never enters blocked audit. Only a later admitted wake may re-arm the exact wait; a source=goal
wake must match its checkpointed non-empty active set.

On transport failure, checkpoint the exact target-set/cursor/failure-class key and consecutive-window
count, saturated at three; clear it only after a successful cursor-bound wait or target-set change.
Fallback reads never clear it. Counts one and two are silent;
count three is unavailable only when decision consumption is blocked and no independent running or
runnable node can progress. After a wait-handler capability failure, retain cursor and end the window
without retry. A later admitted scheduling action may use one bounded exact-target status read only to
unblock a terminal or needs-attention decision, never to relay progress, scan history, or replace a Task receipt.

An empty active set is a DAG scheduling event, not evidence that the Goal is blocked. Missing Finalize
from a known Task returns that node to one exact runnable recovery; a repeated empty completion freezes
only that node. Release every independent runnable node in the same turn; with no recovery, release, or
wait, apply the kernel inherited-Goal transition.

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

An exact merged PR readback closes through one indivisible Hub node transition, not progress. Match it
to exactly one immutable native DAG node by native Task identity, repository and PR, admitted endpoint,
candidate head/tree, and current merge commit/tree. First give every task-owned artifact a terminal
custody disposition except the exact Task archive row selected for an already-authorized effect. Mark
that row pending, replace the checkpoint with one exact task-bound pending archive attempt, and keep the
node in the native active set. Issue it once. Its authoritative readback terminalizes that final row.
Response loss or ambiguous success never authorizes reissue, Task recovery, or replacement; a later
admitted action may only reconcile the pending attempt by authoritative archive readback.

After every required archive effect has an exact receipt/readback, one replacement checkpoint records
the consumed merge receipt keyed by all of those Git/GitHub identities; marks the node terminal; removes that
exact Task, cursor, pending attempt, and transport-failure state from the native active set; and releases
its newly ready successors. Commit none of this closing transition while any match, custody disposition,
or effect receipt is missing, stale, ambiguous, or unknown. Keep the exact node and pending attempt in
custody as `needs_attention`, perform no successor effect, and never create, recover, or publish duplicate
work from the unconsumed outcome. A later identical merged readback is a deduplicated no-op by its
consumed merge receipt. `agentThreadId` and agent-lane state never participate in this native-node transition.

## Critical-path and endpoints

At each Plan or reconciliation, partition nodes by owner, write surface, contract, external effect
target, and dependency-consuming slice. Release every nonconflicting runnable slice in the same wave;
one blocked writer cannot hold frozen-input review, delivery preparation, consumer-revalidation
preparation, or successor investigation. Serialize only overlaps and unknown independence. Bind
shared non-repository mutation targets before dispatch. A predecessor that changes the canonical
source freezes only the successor's dependency-consuming and final identity-bound slices. After exact
merged evidence, the Hub reconciles the same immutable node through the authoritative readbacks above;
it never recovers, replaces, or continues the terminal Task before or after consuming the merge receipt.
Revalidate only the released successors' changed inputs.

One native Task owns at most one candidate branch and one PR. GitHub Delivery owns publication,
merge-readiness, and guarded-merge procedure. PR endpoints are:

- open: exact candidate published in the authorized Draft/Ready state;
- merge-ready: exact candidate satisfies [GitHub delivery](../delivery/delivery-pullrequest-workflow.md)
  without merging;
- merged: the Task stops at merge-ready; Hub alone performs the separately authorized merge effect under
  Delivery's procedure and closes the node after exact readback;
- no-PR: closes on its admitted consumer evidence.

Hub accepts a terminal handoff only when identity, candidate, base, endpoint, conversations, checks,
freshness, and authority match current owners. Drift returns the same Task to Plan. Closed,
superseded, rejected, waiting, or unavailable nodes remain explicit evidence and cannot satisfy another
endpoint.

Complete the overall Goal only after every required node has exact endpoint evidence or explicit
authorized cancellation. A native Task never updates the Goal.

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
