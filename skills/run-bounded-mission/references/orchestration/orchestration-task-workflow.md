# Codex Task Dispatch

Load this reference only for the session modes selected by `SKILL.md`: routing or creating an
independent outcome, operating an existing child, or investigating one separately valuable
follow-up. Lifecycle and orchestration authority remain in `SKILL.md`. This file projects that
authority onto current Codex task tools without adding durable state, a queue, ledger, daemon,
scheduler service, database, background automation, generic DAG helper, second CLI, or second
lifecycle.

## Mission admission and mode

Classify each requested result against the same consumer boundary. An independent Mission must have:

- an Outcome valuable to a named real consumer;
- bounded Scope and non-goals;
- Acceptance that can independently falsify its result;
- an independent owner, write surface, and delivery boundary;
- a disposition that can be independently accepted, blocked, or cancelled.

Diagnosis, testing, documentation synchronization, review corrections, coupled producer/consumer
changes for one consumer behavior, and researcher, planner, evaluator, or other support roles remain
internal subtasks and receive no separate child task or pull request. Foreground continuation,
correction, review, status, or feedback also stays with its Mission. Repeating, renaming, resuming,
or moving the same unresolved gap is continuation of the existing Mission and inherits its Origin,
Stop, findings, and rejected candidates.

Task creation requires the user's explicit request or approval of every exact ready packet.

## Goal boundary

Before every Goal-driven effect, observe whether the current host exposes each required Goal tool.
When `get_goal` is exposed, reconcile its result, the request, and the complete replacement checkpoint;
missing restatement does not remove approved work. The tool surface is session-local evidence: a
prior call, checkpoint, static contract, or another session cannot establish current capability. In
multi-Mission mode:

- no Goal retains the proposal and freezes child, publication, and merge-release effects; only
  explicit overall-Goal authority permits one `create_goal`, followed by a matching observation;
- an ordinary task never reopens or replaces a completed Goal; an explicitly authorized different
  Goal preserves old terminal evidence, uses one replacement `create_goal`, then is observed again;
  never use `update_goal` for reopening or replacement;
- paused or blocked follows the host Goal contract and preserves causal Stop; never overwrite a
  nonmatching unfinished Goal. If persistence is declined, reframe Goal-unbound current-thread work.

When `get_goal` is not exposed, record `Goal capability: unavailable; persistence: none` with the
observed tool-surface locator in the current Frame/checkpoint. Proposals and their complete prompts may
remain visible in the existing conversation checkpoint, but child dispatch, dependency release,
publication, merge-release, and every Goal effect stay frozen. Do not call an absent tool, synthesize a
Goal or DAG, treat the checkpoint as Goal persistence, or describe informal foreground sequencing as
Goal-backed orchestration. A zero- or single-Mission foreground path may continue only when it needs no
Goal effect and is explicitly projected as Goal-unbound.

The Goal holds only overall Outcome, constraints, and completion boundary. Nodes, identities,
candidates, findings, Stop, and GitHub facts stay in their existing owners. `update_goal` only marks
the matching overall Goal terminal when permitted; Goal use adds no wrapper, retry, ledger, CLI,
lifecycle, or hidden execution.

## Hub replacement checkpoint

Load the shared [Mission replacement checkpoint](orchestration-context-recovery.md) and extend it with
every in-boundary proposed or approved node. Per node retain only the current release slice; approved
prompt and consent/create facts; pressure, findings, rejected candidates, and resume gate; exact task
identities or receipt with unknowns explicit; and pull-request/candidate/terminal facts needed for the
next endpoint effect. Retain each admitted relation with its evidence locator and affected slice, plus
the current component snapshot that groups those nodes. Never omit a superseded, interrupted, blocked,
or identity-pending node merely because it has no runnable slice.

Set checkpoint mode to `hub`. Bind each user-visible route/slice to `native_task` and its next-owner edge,
and each support slice separately to `internal_support`; never collapse or overwrite mixed bindings.
Retain activated paths with candidate-independent locators and every approved route's disposition plus
next owner or terminal locator. Agent routing may serve a support slice without changing its node into a
sub-agent. Missing, duplicate, conflicting, or unbound bindings freeze the slice and dependents.

For every proposed, attempted, or created node retain one causal collision projection from its exact
stable label/title, Outcome and consumer, owner/write surface, and endpoint. Bind its canonical UTF-8
length and SHA-256 in the existing packet/checkpoint; exclude changing Origin, Plan, candidate, status,
and evidence so ordinary continuation cannot mint another identity. The projection is a pre-create
comparison key, not task identity, a counter, registry, or stored index. Exact `threadId`/`hostId`
remains the only created-task identity.

Keep assessment data once at checkpoint level, or bind one immutable locator and hash; never copy it
into nodes. Native tasks own identity, Git and GitHub own repository facts, and canonical task type is
non-authorizing metadata from [task type classification](orchestration-task-types.md), not lifecycle,
priority, route, or policy. The coherence-window rule below owns replacement timing.

## Architecture-wave evidence graph

Build the current wave from approved node packets and authoritative observations; do not persist a
graph or infer one from labels, receipt order, task titles, elapsed time, or message count. Admit only
these relation kinds:

- `blocks(predecessor, successor)`: name the exact prerequisite evidence and immutable locator, the
  successor slice that consumes it, and the observation that releases that slice. Freeze only that
  consuming slice and any canonical-ref final slice whose identity depends on it. The successor may
  continue hub-proven disjoint Frame, Plan, Execute, and nonidentity checks.
- `superseded_by(leaf, architecture_node)`: bind the admitted architecture Outcome and the owner,
  write-surface, contract, or consumer evidence proving that the leaf would be absorbed or overwritten.
  Do not create an uncreated leaf. Preserve any existing child identity, candidate, findings, endpoint,
  and terminal facts; stopping or cancelling it still requires current authority and one message to
  its exact identity. Revalidate the leaf instead when absorption is unproved.
- `revalidate_after(node, evidence)`: bind one exact head, authority digest, consumer contract, or
  component snapshot, the affected node slice, and its revalidation oracle. Independent earlier work
  may continue, but the affected slice cannot release from age, a label, or predecessor completion
  alone; it consumes the newly observed evidence and invalidates only changed inputs.

An unknown kind, missing endpoint, mutable or unavailable locator, unbounded affected slice, or hidden
release predicate is unknown-impact and fails closed. A packet's `after` list is only the task-dispatch
projection of admitted `blocks` and dependency-bearing `revalidate_after` relations; it is not a fourth
relation or separate authority. Include every projected edge in the cycle and release checks below.

Project one compact Hub graph from the current checkpoint and authoritative observations; never store
or update it as another state owner. For each node show its exact identity and only the non-empty
members of `waiting`, `runnable`, `running`, `frozen`, `needs_attention`, and `terminal`. These members
are independently derived slices rather than one exclusive lifecycle enum, so a child may have
running work while other named slices remain frozen. Bind every runnable, running, or frozen slice to
its owner and evidence locator; bind each freeze to its reason and release observation. Preserve a
native blocked reason and completed reason/result plus their raw locator instead of flattening them
into a label. `terminal` is exclusive only after the node's frozen endpoint owner reports terminal
evidence; delivery `merge-ready` remains a child handoff rather than a merged-node terminal.

Classify a slice as `waiting` only while an admitted declared observation is pending without an
authority gap; as `runnable` after its release predicate is observed and before its owner starts; as
`running` only from current native owner evidence; and as `frozen` whenever an exact barrier holds it.
A node may therefore expose several of those members at once. Render one compact line per node in the
fixed order above, with slice names and locator-bound reasons/results, and omit empty members; this is
a projection convention, not a schema or state machine.

Before choosing a monitoring target, discussion focus, spare-capacity lane, or other scheduling slice,
reopen every waiting slice's exact blocker and release-predicate locator once and rebuild the compact
graph. A changed predicate moves that slice to `runnable` and its recorded next owner/action before the
Hub follows an unrelated active task. Focus changes, ordinary discussion, an idle child, or a terminal
local candidate cannot remove, postpone, or hide that edge. Recovery only after a user reminder is a
functional task-loss signal, not evidence that the original release executed.

Derive `needs_attention` only from a structural or user-authority gap, a real exception, or
unknown-impact evidence that needs Hub arbitration. Ordinary progress, elapsed time, commentary,
tool activity, a pending provider, or an unchanged wait is not attention. Preserve any unknown native
status and raw representation, mark the affected slices `frozen` plus `needs_attention`, and close the
coherence window for authoritative reconciliation. The projection may be printed or carried in the
replacement checkpoint, but it authorizes no dispatch, release, retry, acceptance, or effect.

Before dispatch, derive causal pressure edges from current evidence that one node invalidates another's
owner, write surface, contract, premise, candidate, or canonical-ref slice. Group nodes only when that
closure is stable for the current immutable component snapshot. Fan in each stable component's impact
once. If the pressure graph has a non-trivial strongly connected component with multiple members or
an explicit self-loop, freeze further member patching and return the whole component to hub Plan for
one component Mission with one Outcome, owner, write set,
Acceptance, Origin, and endpoint. Preserve every prior node and identity as source evidence; do not
sequence the cycle as `A → B → C → A`, transfer a candidate, or create the component without ordinary
proposal and consent. Recompute the release DAG after component admission and require it to be acyclic.

## Dependency and interruption gates

Nodes without a direct `after` edge keep their whole-Mission parallel path when owner, surface,
contract, premise, dependency, and effect are independent. The same owner, overlapping write
surfaces, a shared contract, or unknown independence serializes the nodes.

Independent nodes in one repository may still Frame, Plan, Execute, and run affected checks that do
not bind the canonical ref in parallel. When two endpoints require merge to the same strict canonical
ref, admit a direct `after` edge that orders only dependency-consuming work and the successor's
identity-bound final-Verify/publication release slice. It does not delay approved child creation or
hub-proven disjoint Frame, Plan, Execute, and nonidentity checks. Every predecessor packet must declare
the `merged` endpoint on its canonical source; actual observed `MERGED` is the later release predicate,
and `open`, `merge-ready`, unknown, or mismatched endpoints fail closed. Only the one explicit next
successor may run final candidate audit, final root gate, publication, manual discovery, delivery
barrier, or merge effect. If no direct edge selects one successor, freeze every same-ref final slice
and return the ordering to hub Plan. Do not record a slot, queue, timer, or other lifecycle state.

Before admission, test the complete projected `after` edge set for acyclicity after any pressure SCC
has converged. Any remaining cycle returns the affected graph to hub Plan and permits zero dispatch
until a relation, component Outcome, or evidence locator changes; do not leave every node deferred or
add a scheduler, helper, stored graph, or arbitrary edge direction to break the cycle.

Every cross-node prerequisite that can block task creation, publication, or merge must be an existing
direct `after` edge in that cycle check; a release slice cannot hide another graph. Reject every other
edge into a Git-backed node unless all predecessor packets declare `merged` on their canonical source,
and never admit `open` or `merge-ready` and later force it to merge.

If a predecessor is cancelled, retain affected descendants and return them to Plan. Each is cancelled
under current authority, reconnected and revalidated, left pending for missing Outcome or authority,
or proven independent. Removing the edge requires a newly observed source ref and tip plus re-admitted
Outcome, Acceptance, owner and write conflicts, prerequisites, and endpoint; call the source canonical
only when declared. Otherwise the edge remains. Never silently delete or indefinitely defer a node.

A rejected candidate stays with its existing child and inherited Frame, findings, Stop predicates,
and endpoint. Local corrections remain there; causal pressure follows the main skill inside that
Mission and authorizes no successor, transfer, or Goal replacement. A true block freezes only
dependent descendants.

After the shared recovery gate releases the hub, apply the slice contract below before another
effect. A hub freeze does not pause a child. Pause, cancel, reframe, or continue it only by one
authorized message to its exact identity after checkpoint, authority, candidate, and source
reconciliation. That continuation creates no Mission or lifecycle `Resume`; a priority insertion is
a separate request or approved node.

One child hosts one Outcome, managed worktree, eventual branch, and at most one pull request. It owns
its candidate and verification; the hub owns admission, checkpoint, monitoring, source observation,
and merge effects. Neither mirrors the other's stages or lanes. Messages and root turns create no
Mission.

## Critical-path choreography

Use this protocol only when an earlier endpoint changes a later source or input; independent paths
keep their ordinary parallel route.

For an ordinary dependency edge, the hub may release only bounded read-only preparation through
[agent lane routing](orchestration-agent-routing.md) before the predecessor closes when immutable
inputs plus owner, surface, contract, and writes are disjoint. It creates no Mission, consent, or
external effect; every dependency-consuming write or effect stays frozen at that barrier.

For the identity-bound final-release edge above, an already approved packet may create its one
successor child once through Native dispatch before the predecessor closes only after binding the
canonical source ref and its observed tip immediately before that attempt and requiring immutable
Origin to equal the tip. Its preflight below reports the exact child-worktree HEAD before substantive
work. Before any early slice releases, the hub freshly observes the canonical source-ref tip and
requires both that tip and the child HEAD to equal frozen Origin. Missing, unavailable, advanced, or
mismatched evidence freezes every early, dependency-consuming, and final slice and returns the same
child to Plan without replacement, duplicate creation, new consent, or integration. Release only hub-
proven disjoint Frame, Plan, Execute, and nonidentity checks; dependency-consuming work and the
identity-bound final slice stay frozen. After
[GitHub delivery](../delivery/delivery-pullrequest-workflow.md) reports the verified exact predecessor
head `MERGED`, close the coherence window, observe the latest canonical tip, recover the exact child
identity in its same worktree, integrate or rebase once, and revalidate affected evidence before
releasing those slices. Identity mismatch, conflict, changed input, or lost independence returns that
same child to Plan. Once that integration is consumed, any later drift, changed input, identity
mismatch, conflict, or lost independence also returns the same child to Plan without another
integration; never replace it or create a duplicate.

Only an ordinary dependent ineligible for that early creation waits for predecessor merge, canonical-
tip observation, a new `ready` packet, and fresh approval before creation. A non-Git dependent may
release at its predecessor's endpoint. Invalidate only evidence with a changed source, dependency,
base, merge-tree, or declared input.

Inside one child, independent exact-candidate discovery, evaluation, CI, and security work may fan
out. Its finding owner validates fan-in, stales affected output, and binds the root gate to the final
candidate. It owns all five stages and ordinary local correction through its endpoint. The hub sees
only Goal/DAG/authority/locator/effect/terminal facts, a component impact that changes those facts, a
structural or user-authority gap, or a terminal locator; never child stages, lanes, local findings,
correction turns, or counts.

A `merged` node derives child delivery as `merge-ready`; child Finalize accepts only at that exact-
candidate barrier and sends one terminal handoff. Hub Finalize reconciles once, without repeating
candidate, root, or full-review acceptance: matching Goal and checkpoint authority, the unique
repository and canonical-ref merge effect, exact head and base, unresolved conversations, required
final-head and provider signals, mergeability, and queue policy.

If those facts match the handoff and [GitHub delivery](../delivery/delivery-pullrequest-workflow.md), the hub makes the
separately authorized guarded exact-head merge in that turn without a release message. Hub-owned
metadata or authority drift freezes only the effect. Candidate, head, base, merge-tree, finding,
check, or other affected-input drift stales the handoff; after checkpoint reconciliation, one message
returns the same child to Plan. It grants no second integration or rebase, reset, replacement child,
or merge authority. Queue or auto behavior follows GitHub delivery, needs separate authority, and
remains pending rather than direct-merge evidence. After GitHub reports the exact head merged, record
`MERGED`, candidate head, merge commit, and canonical tip; dependents wait for that observation.
Later hygiene belongs to a separately approved Mission.

## Outcomes discovered during a Mission

When Mission evidence reveals another outcome, preserve it without widening the current Frame or
repairing an unrelated defect. Once a diagnosis satisfies the independent-Mission admission threshold,
give it one checkpoint disposition before the current turn boundary: add a proposed or approved node
to the existing hub inventory and re-evaluate direct dependencies and conflicts; bind `deduplicated`
to one exact existing node and equivalent Outcome; or bind `rejected` to explicit user authority. In a
single-Mission session, the checkpoint may retain at most one narrow `proposed — Goal persistence
unavailable` follow-up and must freeze its dispatch and current-Mission Finalize until the user routes,
deduplicates, or rejects it. A diagnosis in commentary, a future-work promise, or an unlocated note is
not a disposition and may not disappear at compaction. Do not silently dispatch it. Refactor, test,
documentation, performance, security, removal, and other descriptions use the same admission contract.

An independent outcome remains proposed while the user edits or withholds approval. Before assigning
its label, load [task type classification](orchestration-task-types.md) and classify exactly one
canonical owner domain from Outcome, consumer, owner, and Acceptance. Missing, ambiguous, unknown, or
stale classification keeps the packet `deferred` and returns the decision to main; never mint a code
from wording or a legacy prefix.

The packet owns one stable label matching `[A-Z]{3}-[0-9]{2}` and one title formed exactly as
`<label> · <short description>`. Its code must be a current canonical member and its number must be
`01` through `99`. Close the numbering scope over the current mode's authoritative dispatch set. In
`single`, that set is the one follow-up packet retained by the current foreground Mission plus its
causally bound approval, create attempt, receipt, and exact live identity facts; that Mission's current
effecting turn is the sole dispatcher, with no Goal, DAG, Hub checkpoint, or Hub-wave binding. In `hub`,
the set is the complete current proposed/approved Goal/DAG-node inventory plus every bound attempt,
receipt, and exact live identity fact in the Hub checkpoint; the packet binds the one exact Hub
dispatcher. Unknown or mixed mode freezes creation. The packet owner assigns the lowest unused display
serial in that closed scope within the canonical code; different codes each begin at `01`.
Freeze it across edits, consent, creation, recovery, and continuation of that causally identical
Mission. A same-code collision in the current dispatch set, exhausted range, missing node, missing or duplicate
attempt/receipt, or unresolved relevant live identity defers only the affected assignment or release to
main. `threadId`/`hostId`, never title or serial, owns native identity. The serial is display metadata:
never derive identity, priority, order, dependency, or retry count from it and never add a counter
service. Historical or unrelated titles remain exact immutable facts but neither reserve a serial nor
prove a mapping; recovery never renames or backfills them.

Write the short description and user-visible packet commentary in the inherited
`interaction_language`; preserve the ASCII code, identifiers, commands, schemas, and raw evidence in
their original form.

Preserve the exact label, title, compact canonical type projection, and type-authority locator across
edits and recovery. The type is a metadata hook only and cannot select priority, lifecycle, route,
lane, model, reasoning effort, dependency, verdict, or scheduling policy. Keep a packet `deferred`
until all frozen facts satisfy that exact relation. Approval permits one native create attempt for
that exact packet.

## Proposal and consent

Every packet declares the presentation-time fact `ready` or `deferred`, exact prerequisites, immutable
Origin, and the read-only owner surface that revalidates state-sensitive facts. Git-backed `ready`
requires a ref-reachable Origin and no dirty-only evidence. When readiness needs the latest integrated
result, bind its canonical source ref and observed tip and require Origin to equal it; any unmet
prerequisite, unreachable revision, or advanced/mismatched ref makes the packet `deferred`. Final-
release readiness always binds that source ref and observed tip immediately before its one create
attempt and requires Origin equality; a changed or mismatched tip defers creation and every early
slice. Post-merge reconciliation is a release gate for the same child, not a new Origin or consent.

Present a short default summary first: canonical task type, stable label and exact title, `ready | deferred`, why it
matters now, Outcome and scope/non-goals, decisive evidence and Origin, Acceptance, and authority or
external effects.

Before presenting a packet as `ready`, observe and bind the current native Task-control contracts that
the packet will consume: `list_threads`, `create_thread`, current-task `set_thread_title` with omitted
`threadId` when that branch is available, and exact-identity setter, readback, and message release for a
dispatcher-held branch. That branch additionally binds a host-owned uninterrupted serialization contract
covering setter through release receipt and excluding title/message interleave. An atomic-create branch
additionally requires an explicit host guarantee that
the exact title is committed before child execution and a causally bound exact identity/title receipt;
field exposure is insufficient. Freeze the create-time capability branch, its exact call shapes, one
mode-scoped dispatcher authority, its host-serialized single-effecting-turn guarantee, and the closed
authoritative dispatch-set predicate into the editable packet. For `single`, bind the current Mission's
causal approval and current effecting turn; for `hub`, bind the exact Hub dispatcher and current wave.
Missing, ambiguous, concurrent, or
non-targetable controls keep it `deferred` or `host-defect/no-change`; a later contract or branch change
is a material packet revision and requires the complete packet to be presented and approved again.

Retain the complete editable child prompt in the checkpoint. Quote current Frame and Plan projections
with raw evidence locators, never the transcript; keep the raw request or child-accessible locator
canonical. Include label/title, prerequisites/source/revalidation, project/environment, the preflight
below, and remaining five-stage/endpoint instructions. Carry the current user-inherited
`interaction_language` as an ordinary prompt fact: child-visible commentary and Finalize use it while
code, commands, schemas, identifiers, and raw evidence keep their original form. Only an explicit user
change replaces it; task creation, a later turn, Handoff, or compaction never re-infers it from prompt
content, locale, or recent messages.

Before approval and again immediately before creation, freeze one complete canonical UTF-8 payload
containing the exact title and label; interaction language; current Frame and admitted Plan; raw request
or immutable locator; Origin, dependency edges and release predicates; authority and prohibited
effects; preconditions and their executable producer/setup; selected `single | hub` mode; freshly
observed Goal-tool availability and persistence; observed or honestly unavailable model/effort; exact
owner inputs and evidence locators; endpoint; Stop; and one next legal action. Record its byte length
and `sha256:<lowercase-64-hex>` outside the payload. The payload, identity, and approved create branch
form one packet; changing any member invalidates approval. Native Task title remains packet identity
metadata and never becomes a Conventional pull-request title.

The create/release transport bootstrap outside that payload contains only its encoding, exact length
and SHA-256, complete encoded bytes, and the instruction to decode and verify them. It must not itself
invoke this Skill, assign the Mission or role, expose a partial Frame, request a repository read, or
authorize any other action: those instructions live only inside the user-approved payload and become
active after admission. Otherwise a fresh host may load workflow or repository authority before it can
verify the packet, which is a first-action admission failure even if a later hash check succeeds.

Freeze one approved endpoint per node. A `merged` node derives child `merge-ready`, freezes hub merge
authority/effect, and follows Critical-path choreography; this projection is no new Goal endpoint.
Pull-request endpoints load [GitHub delivery](../delivery/delivery-pullrequest-workflow.md), and `open`
or `merge-ready` never grants merge. A no-PR endpoint keeps its falsifiable terminal evidence.

End `ready` with **Create this task?** and `deferred` with **Create this task? — unavailable until
`<exact prerequisite>`**. A reply to the latter is no authority. The user may edit, reject, or approve
named ready proposals; unambiguous approval after the ready question is the host-required request.
Until then, edits and rejection stay in the hub and no task exists.

For multiple outcomes, present one stable-labeled packet per node so the user can approve a subset or
ready wave. Its one create attempt consumes approval; deferred nodes cannot bypass prerequisites.

## Generic child preflight

The child's first legal operation after any required atomic title effect is packet admission: obtain
the complete payload delivered by the selected create/release branch, recompute its exact UTF-8 length
and SHA-256 without parsing or reserializing it, and compare both with the frozen identity. Only then
may it interpret the decoded instructions, activate their named workflow/role, or execute the payload's
next legal action. An absent field, prefix, summary, truncation,
wrong member, newline drift, reordered or reserialized content, identity mismatch, or later supplement
is `packet-admission-defect/no-change`; stop before Mission commentary, Goal access, repository reads,
bootstrap, or other substantive work. The dispatcher cannot repair the same launch by sending another
message, reconstructing prose, or falling back to remembered Hub context.

Freeze the exact expected title and one observed create-time capability branch into the packet before
creation. Use atomic creation only when the current host contract explicitly guarantees that passing the
title commits that exact title before child execution and returns a causally bound exact identity/title
receipt; pass it once and use that receipt as the pre-Frame gate. A `title` input or later readback alone
does not prove this contract.

Otherwise prefer an observed current-task `set_thread_title` call that permits omitted `threadId`: make
that the child prompt's first operation, before commentary, Frame, `get_goal`, reads, Git, or other work,
pass only the frozen title, and require its returned calling `threadId` plus exact title as the pre-Frame
gate. The child calls it exactly once; failure, mismatch, or later recovery never permits another setter.

When that child control is absent, a dispatcher-held branch requires exact-target parent
`set_thread_title`, `read_thread`, and `send_message_to_thread`. Create with only a frozen gate-bootstrap
prompt: its first turn performs no Mission commentary, Frame, `get_goal`, read, Git, or other substantive
work and terminates or yields with one bootstrap receipt. Auto-generated title is resemblance only.
After a causally bound exact `threadId`/`hostId` is available, the dispatcher sets the frozen canonical
title once, reads that exact task back once, then sends the complete approved Mission packet once as the
causally bound release/new turn, all inside the observed branch-scoped uninterrupted host turn; no other
title or message effect may interleave before the release receipt. Bind the bootstrap receipt and all
three parent results in the checkpoint. A `clientThreadId` cannot enter these controls. Missing,
contradictory, unavailable, failed, or mismatched branch or serialization evidence freezes work and
identity effects as `host-defect/unproved`. If none of the three gates is available, report
`host-defect/no-change`; do not add a lock, registry, wrapper, retry, or second lifecycle.

Derive preflight from current owner manifests and lockfile. Name exact repository path/HEAD/status,
executables, and dependency-directory existence/symlink/ignore/status facts. A final-release child
also receives frozen Origin and reports its exact child-worktree HEAD before substantive work for the
hub-owned equality gate above. Before substantive work, the child observes the current Goal-tool
surface. It calls and reports `get_goal` when exposed; otherwise it reports `Goal capability:
unavailable; persistence: none` and continues only as its ordinary single Mission. It never creates or
updates the hub Goal.

If tools are absent, authorize at most one manifest/lock-supported, exact non-interactive bootstrap.
Exclude credentials, relevant secrets, environment files, lifecycle scripts, and live effects. Record
exit/time and prove generated dependencies ignored and outside status; without a safe deterministic
command, stop before substantive read/mutation and report the missing dependency.

A null or absent native environment path proves only that no environment selection was carried. A
repository environment file, dependency directory, or available executable does not prove that
native setup ran.

## Native dispatch

Immediately before a native create attempt, project the exact currently runnable slice as the only
pre-dispatch routing input: immutable inputs, owner, exact paths, oracle, Stop, critical-path relation,
and permitted effect. When [agent routing](orchestration-agent-routing.md) plus its
[execution policy](../execution/execution-mission-routing-policy.md) has an activated consumer, invoke
that owner once and consume its exact five-part `Pre-dispatch routing receipt`: `Input` must bind the
same runnable slice and quality floor; `Route` supplies lane plus observed or unavailable model and
effort; `Topology` binds the supplied dependency shape; `Fallback` names its authorized trigger or
none; and `Evidence` supplies maturity, terminal quality, telemetry availability, and
coordination/correction limits. Missing, malformed, stale, unknown, or mismatched input, section, or
owned value freezes that slice and returns the route question to the same routing owner. Task dispatch
does not flatten, enumerate, or reproduce those domains. The receipt cannot change Frame, Plan, the
DAG, write ownership, user-visible Mission model authority, or task consent; it does not define a
route table. Ordinary route telemetry stays with the child and is fanned into the Hub only in its
terminal receipt unless it proves a real exception or structural gap.

Pre-admit the complete packet and every producer-to-consumer edge before issuing the create effect.
For a prerequisite or setup side effect, either name an ordered executable producer owned by the
packet or require the deterministic producer to perform it; prose-only filesystem, environment, or
transport prerequisites reject. For each inter-step dependency, bind the producer's exact raw output
bytes, length, and SHA-256 to the exact consumer stdin or file and preserve order. A dynamic producer
may publish its identity at runtime, but the edge and required identity fields must exist before launch.
Do not start a child and then supply a missing edge, authority member, locator, Frame slice, or control
fingerprint. A second packet/admission defect after this preflight returns the mechanism to its owner
and stops candidate delivery; do not churn through replacement packets.

Immediately before each create, close the mode-scoped authoritative dispatch set from the current
packet/checkpoint and its causally bound attempts and receipts, not from title inventory. For every
already-bound `threadId`/`hostId` relevant to the proposed node or an owner/write collision, perform one
exact-identity readback; an unavailable or mismatched read freezes only the affected create. Then call
`list_threads` once within the host's bounded limit as a collision observation. Its result may add an
observed relevant live fact, but absence from that bounded result proves neither absence nor completeness
and is never a missing-member error; do not paginate, repeat, or wait for a larger inventory. Explicit
truncation, saturation, or another completeness gap freezes only a decision that actually depends on an
unobserved result. A missing/duplicate authoritative member, attempt, receipt or exact identity,
overlapping writer, unresolved same-node attempt, or drift revises only the affected packet and requires
fresh approval. A `clientThreadId` blocks a second create for its node; unrelated or same-title results
cannot join the dispatch set. Revalidate remaining facts, source tip, the mode-scoped dispatcher, and the
host guarantee that only one effecting turn for that dispatcher can issue the node's create. Any second
creator binding, concurrent effecting turn, or unavailable serialization guarantee returns
`host-defect/no-change` before create. This is a pre-create gate, not identity mapping, global-history
scan, host-wide lock, or polling.

Compare the packet's causal collision projection with every current authoritative-set member before
the create effect. An exact match maps to that member's existing attempt or exact task and permits no
second create. The same stable label/title with a different projection, or a matching projection with
multiple attempts/identities, is a collision and fails closed before effect. A bounded list/search
resemblance cannot prove the match; when the authoritative member or exact identity is unavailable,
preserve the packet and stop rather than create a sibling duplicate.

Reobserve the approved Task-control contracts. Any schema, targetability, mode-scoped dispatch set, or
atomic-create/child-current-task/dispatcher-held branch drift materially revises the packet and requires
fresh approval before an attempt. Complete all read-only preconditions first: call `list_projects`,
inspect the selected project's `isGitRepository`, and recheck the mode-scoped dispatcher/serialized-turn gate.
Then call `create_thread` once with the complete approved prompt for an atomic-create or
child-current-task branch, or only the frozen gate-bootstrap prompt for a dispatcher-held branch. Pass
the frozen title only for an admitted atomic-create contract. Use the observed project/worktree target
for Git, or local only for an observed non-Git project that cannot share the foreground candidate. Omit
`startingState` and model overrides unless approved. The raw host create call/result is the attempt
record; never mark it issued before the call. Record only the returned exact identity or receipt and emit
the host's task link/directive. Bind that receipt in the checkpoint to the exact title, owner, and write
surface. It is causal conversation evidence, not a host-wide lock; creation is runnable only because the
single-dispatcher binding and observed host serialization excluded a second authorized creator first.

Keep the host default model for a user-visible Mission unless its packet explicitly authorizes a
different full-Mission model. Spark's leaf gates cannot own the child's five stages, so never select
it for this route or create a user-visible task for an internal build/revision leaf. Route the latter
through the custom `fast_builder` agent and its standard-main fallback.

The packet remains the naming owner; never invent a field. Execute only its frozen atomic-create,
child-current-task, or dispatcher-held title gate above. Atomic work starts only from its exact
pre-execution identity/title receipt. Child-current-task work starts only from its exact setter receipt.
Dispatcher-held work starts only after the bootstrap receipt, setter result, exact-title readback, and
one complete-packet message release all bind the same exact task and uninterrupted host serialization
contract. Require any later exact-title readback and final-release HEAD report before monitoring or
release. Failure or mismatch freezes those actions; auto-title and list/search resemblance cannot repair
it, and later recovery permits no second setter or packet release.

A returned `clientThreadId` consumes creation but is only a dispatcher receipt: record/emit it, never
rename or pass it to wait/read/send. A dispatcher-held bootstrap remains no-work and receives no Mission
packet while that mapping is pending. It does not replace the child-current-task gate: that child may
proceed only after its one setter returns the exact calling `threadId` and title. Dispatcher identity
effects, monitoring, and release stay frozen until the host, user, or exact child receipt causally maps a
`threadId`/`hostId`; list/search resemblance cannot prove that mapping. Then run the frozen title gate
before those effects. Pending dispatcher identity permits no duplicate and is not Mission `blocked`.

Recovery resumes only a recorded exact `threadId`/`hostId`. An unmapped same-title task is resemblance:
never adopt, rename, or message it. Before an attempt it consumes no approval; after possible success
it authorizes no retry. Compaction changes neither rule.

An explicit no-effect create failure preserves the prompt but retry needs fresh authority and
revalidation; possible success forbids retry. A later identity resumes only through causal mapping to
that attempt. A separate manual task is not that mapping and needs Plan and authority to own the node.

Creation is non-blocking. Outside an admitted multi-Mission orchestration session, return after
creation without babysitting setup or child commentary. Inside that mode, the hub may use bounded
native monitoring only for the current ready wave or next merge gate. It must use exact `threadId`
and `hostId` facts and must not poll a queued `clientThreadId`.

The child owns its five stages through the delivery endpoint and never changes the hub Goal. A
`merged` node uses the derived `merge-ready` handoff; hub Finalize follows Critical-path choreography.

## Coherence windows and child controls

Operate on a child when the user asks, or when an admitted multi-Mission checkpoint names that child
at the current monitoring or merge gate:

- status or one-time monitoring: use one `wait_threads` call with `timeoutMs: 0`;
- ongoing monitoring: within one Hub scheduling slice, make at most one bounded `wait_threads` event
  wait for one to eight exact `threadId`/`hostId` targets and retain every returned target cursor. An
  actionable or terminal event closes the current coherence window for reconciliation. A timeout or
  snapshot with no actionable or terminal event ends and yields the scheduling slice immediately;
  do not resubscribe in that slice, keep it open as `running`, or narrate the unchanged state;
- later Goal continuation or a real health anomaly: make one compact cursor-bound read of the same
  exact targets, then act on an actionable or terminal event or yield again;
- feedback or continuation: call `send_message_to_thread` once with `threadId`, optional `hostId`,
  and the feedback in `prompt`, then return immediately;
- additional history needed for a current decision: use one bounded `read_thread`.

The child proactively reports only a structural authority gap, a real exception, or one terminal
receipt. Ordinary progress, local findings/corrections, publication steps, lanes, counts, commentary,
and tool activity stay there. An unchanged timeout produces zero Hub question, message, immediate
resubscription, or status narration; retain its cursor in conversation evidence without emitting a
checkpoint replacement solely for that unchanged observation. After yielding, spare capacity may
route only to another currently runnable DAG node or the already-approved read-only self-QA
retrospective below. It never holds the critical path open, invents work, or creates a background
monitor.

Dynamic acceptance uses the observed Hub refutation rather than compact-output size alone. Baseline A
repeated cursor-bound 60-second `wait_threads` timeouts while PERF and SKR had no actionable event;
although every call was event-based and compact, immediate resubscription made the sequence polling
and produced user-visible idle churn. Candidate B permits one coherence-window event wait in the
current scheduling slice and then yields; a later continuation or anomaly permits one compact cursor
read and must again act or yield. Any immediate no-event resubscription or unchanged narration fails
this acceptance condition.

Treat task events as compact wake hints, never arrival-ordered authority. Across cursor-bound waits in
the current released wave, retain every raw receipt and immutable locator. Normalize every
unrecognized, unclassifiable, malformed, or newly introduced receipt or status as unknown-impact;
preserve its raw representation and locator, close the window immediately, and freeze affected
questions, releases, judgments, and effects until authoritative reconciliation. Close that in-turn
coherence window at the first of:

- all tasks in the released stage reaching terminal evidence;
- an attention, error, conflict, or unknown-impact fact requiring hub authority;
- a dependency, publication, merge, or other declared effect barrier; or
- a turn/interruption/Handoff/compaction, source or authority drift, or user request/override.

An absent cursor is valid only for a target's first observation. A missing returned cursor, reset
cursor, malformed cursor, target/host mismatch, revision regression, or other continuity gap on a
continued target cannot prove that no event was lost: preserve the raw poll, close the window as
unknown-impact, and rebuild authority. A wake may return before every target is polled, so omitted
targets retain their prior facts but cannot be judged unchanged. Commentary and ordinary tool
progress may change a revision or appear in a timeout snapshot, but neither wakes the event wait nor
changes graph authority.

At the window, rebuild the current evidence graph, group its stable components, and reconcile exact
Goal, task, Git, GitHub, dependency, and authority facts once for the whole released wave. Arbitrate
terminal conflicts by those owners, fan in each component impact once, perform at most one stage-wide
global judgment, derive one hub position and next operation, and emit one complete checkpoint. Only
after that checkpoint may the hub issue a question/message or release an independent next stage or
declared effect. A dependent release, endpoint judgment, or other effect may not precede the
checkpoint. One receipt never resets the wave, starts a dependent, or triggers a global pass.

Multiple tasks or candidates with the same causal collision projection, overlapping Outcome/consumer,
or contradictory evaluator and direct-consumer evidence belong to one component conflict. Freeze
acceptance and every dependent release until Main reopens and reproduces the smallest decisive root
consumer fact, then records each candidate or task as exactly `accepted`, `rejected`, or
`superseded_by(<exact member>)` with its evidence locator. Evaluator status, `no_finding` count, task
recency, diff size, or Hub preference cannot select the winner. Preserve conflicting evidence and
unavailable reproduction honestly; no disposition means the component remains frozen.

Treat coordination as useful only when a new observation changes an admitted relation, component,
candidate validity, release predicate, authority, effect barrier, or terminal judgment. Low-information
messages alone are harmless; churn is evidenced when the same causal root repeatedly invalidates work
without changing one of those decisions. Route that pressure to the owning child or component Plan,
not another Hub round trip. A blocked child is not retried, replaced, or transferred without new
authority.

## Spare-capacity self-QA retrospective

This is a conditional read-only evidence lane, not standing work. Admit it only when the current hub
has no runnable critical-path slice—including task creation, dependency release, or dependency-
consuming work—no publication, merge, or other effect barrier needing attention, and an otherwise
unused support-agent slot. A pending wait alone does not prove spare capacity. Do not reserve a slot,
delay task creation or release, or wait for retrospective fan-in after critical-path work becomes
runnable.

Load [agent lane routing](orchestration-agent-routing.md). Assign one ordinary read-only support agent
to one exact existing task. It creates no task, file, branch, candidate, comment, or other effect and
receives no repair, acceptance, QA-classification, or hub authority. Start with that task's terminal
receipt, latest replacement checkpoint, and exception or anomaly locators. If they expose no concrete
consequence, return `no-signal` at the finite branch Stop; inspect deeper task, Git, or GitHub history
only for one signal that can change later classification or owner routing. Never default to a full
transcript scan.

Return one compact raw brief with the decisive evidence and consequence, observed or unavailable
cost, candidate causal root and owner, and branch Stop. A concrete return activates the kernel's
conditional lifecycle-QA route; QA then owns `systemic` or `incidental` classification, causal
fingerprint, canonical repair-owner routing, tracking, and dynamic acceptance, and may retain a
delete-first suggestion as advisory evidence. The routed owner alone selects and implements the actual
repair shape. The hub validates locators, groups matching fingerprints with the current component
once, and fans in one batch at the next natural checkpoint. It does not create one node per finding or
make a retrospective result a prerequisite for unaffected critical-path work. Incomplete, late,
malformed, or unavailable evidence remains fail-closed for its claim and cannot freeze an otherwise
supported release.

## Endpoint and overall completion

Compare every node with its own frozen endpoint and evidence owner. A no-pull-request node closes on
its admitted terminal consumer evidence. A derived child delivery endpoint is child evidence, not node
closure. A pull-request node closes only under the corresponding `open`, `merge-ready`, or `merged`
contract in GitHub delivery. Closed or superseded pull requests, rejected candidates, pending waits,
and blocked nodes remain checkpoint evidence; none silently satisfies a different endpoint.

Complete the matching overall Goal only after every node still required by its completion boundary
has exact endpoint evidence, every authorized cancellation is explicit, and the final evidence
handoff is retained. Do not force `open` or `merge-ready` nodes to merge, manufacture a pull request
for a no-PR endpoint, or let a child update the Goal. If progress is unavailable, preserve the full
checkpoint and use `blocked` only when the Goal tool contract and the main skill's evidence predicate
both permit it.

When assessment is active, the hub follows its conditional reference after required nodes are
terminal. Scores do not reopen a child or extend the graph; only an independently admitted gap may
become a new proposal.

## Capability fallback

If any Goal capability required by the selected mode is unavailable, report the exact unavailable
tool and affected effects before dispatch. Preserve the packets in the current replacement checkpoint
as conversation evidence, mark Goal persistence `none`, and freeze every Goal/DAG claim plus child,
dependency-release, publication, and merge-release effect. A supported Goal-unbound single Mission may
continue in the foreground; multi-Mission work stays proposal-only until a later session freshly
observes and reconciles the required Goal capability. This is an observable degradation, not a
substitute Goal or persisted scheduler.

If the native task host is unavailable or creation fails, preserve the approved packet and report
the exact missing capability or failure. Offer the complete prompt for manual task creation. The
independent outcome remains undispatched, but the foreground Mission is not blocked merely because
the hub cannot create a child.

Do not serialize the outcome in the current worktree, create another branch or pull request there,
hide it in a subagent, or claim a task identity that the host did not return. Host unavailability
never authorizes an automatic retry, replacement, duplicate create, or host transfer.

## Handoff boundaries

- Parent hub routing creates or operates a separate child identity.
- Codex chat Handoff moves the same chat and git state between Local and Worktree; it does not create
  a new Mission or deliver a candidate.

Use `fork_thread`, `handoff_thread`, archival, pinning, and renaming only under their separate current
host contracts. They are not substitutes for proposal-to-`create_thread` dispatch.
