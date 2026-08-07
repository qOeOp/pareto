# Route Agent Lanes

Load this reference only when the main agent has one concrete evidence question, one frozen
non-overlapping build leaf, or at least two independent frozen-candidate risk questions. It is the
single common-protocol owner for researcher, planner, builder, and advisory lanes; their role TOMLs
contain startup deltas only. The independent evaluator instead loads its complete protocol from
`../verification/reviewer-handoff.md` after packet admission.

Every researcher, planner, builder, or advisory packet names an immutable Origin and this exact path.
The selected role loads these bytes from that Origin before acting and rejects missing, mutable,
candidate-controlled, or mismatched protocol. Do not copy this common protocol into role config or a
dispatch packet. Agent lanes are conditional work routes, not a lifecycle, standing team, vote,
authority transfer, or acceptance owner. Use no lane when launch, reference loading, duplicated
context, validation, and synthesis cost is not clearly lower than doing the work in main.

Every packet also carries the current user-inherited `interaction_language` as an ordinary instruction.
Use it for user- or hub-visible commentary and Finalize prose while preserving code, commands, schemas,
identifiers, fixed return shapes, and raw evidence in their original form. Only an explicit user
change replaces it. A role, task boundary, dispatch, Handoff, later turn, or compaction never infers a
new value from prompt language, locale, repository text, or recent output.

This reference owns the current role load map:

- `mission_planner` additionally loads `../planning/planning-decision-workflow.md`, and loads
  `../planning/planning-revision-workflow.md` only when revision pressure is its activation predicate;
- `mission_researcher` additionally loads `../planning/planning-decision-evidence.md`, and loads
  `../planning/planning-decision-workflow.md`
  only for `reuse/prior_art`;
- `fast_builder` additionally loads `../execution/execution-mission-routing-policy.md`.

A role delta first reads the immutable Origin's `orchestration-agent-routing.md` to select the protocol version. When
an older Origin does not declare this map, that selector plus the same Origin's same-name
`.codex/agents/<role>.toml` form the admitted legacy load set; the legacy TOML remains the sole role
protocol in that branch. Admit it only when its name, model, reasoning effort, and sandbox match the
current role and its instructions are neither a role delta nor another fallback; reject any mismatch
or missing or mutable file. This is a version-compatibility load condition, not a second current
authority. Never substitute candidate bytes for either branch or claim that selecting the legacy
branch loaded only the TOML.

The main agent always owns Frame, Plan admission, conflict judgment, the writable winner, evidence
synthesis, effects, acceptance, and Finalize. A lane returns evidence, a proposal, or a bounded leaf
diff; it cannot widen scope, authorize an effect, or choose a Mission route.

Classify the work before selecting a route. Model names configure existing roles; they do not define
the work class or transfer its owner.

## Emit one pre-dispatch routing receipt

Before every internal agent dispatch, and when task dispatch invokes this owner before its one native
create attempt, consume one current runnable slice and emit one compact receipt. Load
[execution routing](../execution/execution-mission-routing-policy.md) before projecting its quality
floor, empirical evidence, maturity, or fallback. The runnable slice supplies task semantics and real
consumer; material risks and permissions or effects; immutable inputs and dependency slice; owner,
exact paths, write set, candidate shape and scale, oracle, Stop, and critical-path status; whether
external research or independent judgment is required; latency target; and current empirical evidence.
Missing or mutable authority, owner, boundary, oracle, or permission freezes dispatch. Missing model,
quota, cost, or telemetry evidence instead keeps the current authorized main or host-default route only
when the receipt names that fallback and marks the dependent comparison unavailable.

```text
Pre-dispatch routing receipt
Input: <semantics; risk; permissions/effects; dependency slice; owner/write set; candidate scale; research/independent judgment; latency target; quality floor; empirical evidence locators>
Route: <lane; observed model or unavailable; observed reasoning effort or unavailable>
Topology: <single or pair; parallel or serial; dependency basis>
Fallback: <one authorized fallback and trigger, or none>
Evidence: <maturity; quality result; elapsed and token telemetry or unavailable; coordination/correction limits>
```

The receipt is current conversation evidence for one causally bound dispatch attempt, not a task
field, durable record, scheduler, ledger, registry, or second state machine. A changed input invalidates
only its dependent fields and requires a replacement before dispatch. Task dispatch retains consent,
user-visible model, task identity, and create authority; orchestration retains graph and priority;
reviewer handoff retains evaluator-set selection; main retains every judgment and effect. The receipt
records those supplied decisions and never reselects them.

After a child or internal lane reaches terminal, update only the compact receipt with the actual
route, observed model and effort or `unavailable`, elapsed and token telemetry or `unavailable`,
coordination and correction, fallback, quality-floor result, and resulting maturity. Fan that evidence
in once at the owning terminal boundary. Ordinary progress, lane chatter, and partial telemetry do not
return to the Hub or trigger a new routing decision.

## Route reasoning and build work

For a build-route decision, selective-TDD criteria on that route, model or reasoning-effort
comparison, or a frozen mechanical leaf, use
[execution routing](../execution/execution-mission-routing-policy.md). It supplies operational
criteria under the kernel; this reference remains the sole lane admission, protocol, exact-model
observation, and fallback owner.

| Work | Lane and model/effort projection | Topology | Fallback | Admission boundary |
| --- | --- | --- | --- | --- |
| Frame, Plan admission, cross-owner or safety judgment, finding synthesis, Finalize | authorized high-reasoning main; exact identity or `unavailable` | serial decision owner | none | never delegate the decision |
| evidenced structural Plan challenge | `mission_planner`; observe role-owned model/effort | one proposal | high-reasoning main | main admits or rejects it |
| ordinary implementation | main or one standard builder; observe exact identity | single writer; parallel only for independent paths | main | frozen owner, path, boundary, candidate shape, and verification route |
| low-risk mechanical leaf | `fast_builder` on exact `gpt-5.3-codex-spark` / low | one embedded builder | standard main once | every execution-policy Spark gate holds; never create a user-visible task |
| deterministic repository or environment fact | existing helper or direct command; no model | serial only when inputs depend | `evidence_unavailable` | exact inputs and directly checkable output |
| bounded repository synthesis | fast explorer; observed identity | one read-only lane | main | every fast evidence gate holds |
| bounded current or external evidence | `mission_researcher`; observe role-owned model/effort | one question; dependent research serial | main or freeze dependent decision | one decision-changing external question |
| spare-capacity self-QA retrospective | one ordinary read-only support lane; observed identity | single and noncritical | `no-signal` | task dispatch proves idle capacity and supplies exact terminal/checkpoint/anomaly locators |
| frozen-candidate advisory lens | ordinary read-only support lane; observed identity | two or more independent lenses may parallelize | main inspection | advisory predicates and immutable candidate hold |
| independent candidate audit | reviewer-selected `mission_evaluator` route; observe role-owned model/effort | single or complementary pair as supplied | reviewer-owned fail-closed route | fresh non-builder context, immutable candidate, and integrity gates |

The role files own their pinned model and reasoning settings. For an unpinned internal route, treat
the selected model as host-discretionary and do not promise an exact model without observing it.
User-visible Mission model authority remains with task dispatch. The execution policy details builder
semantics and the evidence used to compare Spark economics on an activated route. This reference
admits the lane, observes the exact model, and owns standard-main fallback; ambiguity in Plan, authority,
owner, boundary, or oracle returns to main before dispatch.

## Route read-only evidence

Admit a fast lane only when its packet asks one narrow unambiguous question, names every input,
requires a compact directly checkable return, cannot authorize a write or acceptance on error, has
one short Stop, and can change exactly one main-agent decision. Refuse fast handling for user
authority, Frame or Plan ownership, candidate writing, cross-owner architecture, security or trust
judgment, conflict adjudication, or Finalize.

Use one standard lane when a broader read-only question remains:

- a repository explorer synthesizes named repository locators;
- `mission_researcher` gathers decision-changing current or external evidence;
- `mission_planner` compares supplied structural choices after its activation predicate holds.

Each dispatch supplies one question, bounded scope, read-only authority, exact sources, required
return, cheapest main-agent validation, one Stop, and escalation conditions. Require exact locators,
minimal observations, conflicts and limits, and a stop reason. The main agent reopens decisive
locators and verifies the result.

Before launch, freeze that complete support packet as one canonical UTF-8 payload and record its byte
length plus SHA-256 outside the payload. Include the current Frame/Plan slice; route, role and exact
question; read-only authority and prohibited effects; every source, precondition, dependency and typed
producer-output edge; interaction language; observed or unavailable model/effort; required return;
Stop; and one first legal action. The launch bootstrap outside that payload contains only its encoding,
exact length and SHA-256, complete encoded bytes, and the instruction to decode and verify them; it
must not invoke the role, expose a partial question or Frame, request a source read, or authorize any
other action. The lane's sole first substantive action is this admission: use only an observed local
byte/length/hash verifier, without parsing or reserializing the payload, then return a machine-checkable
match or mismatch receipt. Only a match activates the role and packet; an unavailable verifier,
prefix, summary, truncation, wrong-member projection, missing control fingerprint, prose reconstruction,
newline/length/hash drift, or later supplement fails closed before any source, role, or other tool use.
Main may use the already-declared fallback once; it never repairs a running lane with addenda or
repacket churn, and this bootstrap creates no helper, envelope schema, or compatibility path.

For a spare-capacity self-QA retrospective, task dispatch alone owns activation and critical-path
protection. Give one ordinary support agent one exact task and the current terminal, replacement-
checkpoint, and exception or anomaly locators. Require checkpoint-first inspection, signal-only
drill-down, and one finite Stop before any broad history scan. The return contains only raw evidence,
consequence, observed or unavailable cost, a candidate causal root and owner, and the Stop; main later
activates lifecycle QA for any classification and routing. The lane grants no QA, repair, acceptance,
task-creation, or effect authority. `no-signal`, late, malformed, incomplete, or unavailable evidence
ends that lane; do not retry it or delay newly runnable critical-path work for fan-in.

A planner or researcher must not inspect live agent, thread, lifecycle, transcript, or task state;
consume live or unadmitted sibling output; communicate laterally with sibling agents; delegate; or
trigger an external write or effect. Only completed briefs sanitized and supplied by the main agent
are admitted packet evidence.

### Mission planner delta

Use `mission_planner` only for an evidenced harmful or unjustified mechanism, revision-pressure
incumbent, materially different credible paths, or consequential cross-owner trade-off. Supply the
complete current Frame locator, immutable repository evidence, activation predicate, completed briefs,
one decision question, required return, and branch Stop. It does not search or inspect live task state.

Require exactly one result: `not_triggered`, `evidence_unavailable`, `needs_user_alignment`,
`frame_mismatch`, `mechanism_rejected`, or `ready_for_plan_admission`. A ready proposal names the
selected owner and smallest vertical candidate; affected surfaces and exercises; responsibility
added, retained, and deleted; compatible boundary evidence; structural kill conditions; coherent
slices; required support lanes; real-consumer/regression verification; and delivery prerequisites.
For every nontrivial action outside ordinary main capability it also names execution owner, exact
effect and authority, and observed capability or a later owned fail-closed gate. It treats endpoint
and authorized effects as Frame inputs and never infers publication, review, merge, or deployment
authority.

Return `not_triggered` when the supplied activation predicate is absent. Treat completed briefs as
claims and use only their decisive locators, conflicts, negative evidence, and unavailable facts; do
not repeat their research. Classify every remaining decision-changing gap as evidence-owned or user-
owned. A user-owned preference or authority choice returns `needs_user_alignment` with one smallest
separating question. Missing required evidence returns `evidence_unavailable` with the blocked decision
and exact missing evidence. No executable path that preserves every Frame field returns
`frame_mismatch` with the smallest demonstrated reframe reason. Decisive evidence that rejects the
requested mechanism while a narrower path preserves the Frame returns `mechanism_rejected` with the
refused mechanism, decisive evidence, preserved outcome, smallest substitute, and its admission packet.

When the main packet supplies an independent-audit predicate, a planner may return only a non-
dispatchable template that names the main-selected single or complementary-pair mode, Frame locator,
one lens per evaluator, planned fresh launch context, immutable instruction origin, discovery boundary,
integrity evidence, and failure branch. After Plan admission and candidate freeze, main alone inserts
the exact complete Plan, freezes lens bytes, invokes the reviewer packet helper, and dispatches. An
unavailable required evaluator is `evidence_unavailable`, not permission to weaken delivery.

An incomplete, ambiguous, conflicting, or source-blocked fast result may return once for standard
classification. Preserve Frame, Origin, Authority, and consumed Stop; do not retry fast, surround the
gap with sibling lanes, or reset evidence. Keep dependent questions sequential. Parallelize only
mutually independent questions whose inputs and outputs do not overlap or consume one another.

## Run independent audit lenses

Use [the reviewer handoff](../verification/reviewer-handoff.md) for every independent audit. It alone selects the
single or risk-triggered complementary-pair route and owns complete Frame and Plan rebinding, result
classification, fallback, and integrity gates. When it selects a pair, dispatch both one-lens
`mission_evaluator` instances concurrently from the same frozen binding and immutable,
content-addressed common packet core whose ordered manifest binds every exact lens delta;
neither may consume sibling output. Fan in once for main-agent reproduction and arbitration.

## Run advisory candidate lenses

Advisory review finds reproducible leads; it is not independent acceptance. Activate it only after
the writer stops and the candidate is frozen as an exact commit, or as a named origin plus complete
diff and untracked manifest. Fan out only when at least two of these mutually exclusive root-cause
lenses each have an independent question that can change main-agent judgment:

1. `safety_authority`: permissions, secrets, untrusted input, live writes, or agent/tool authority;
2. `architecture_boundary`: owner, responsibility, dependency direction, state, concurrency, or
   cross-owner contract;
3. `performance_context`: measured hot path, scale, I/O, memory, payload, or token/context growth;
4. `correctness_consumer`: remaining observable behavior, error path, contract, real consumer, or
   regression oracle.

Assign a root cause to the first matching lens above; shared immutable candidate bindings may repeat,
but lens questions and evidence slices must not. Keep a dependency sequential. Use no fan-out for a
small or mechanical candidate, zero or one actual risk question, a changing candidate, an incomplete
locator, user-owned authority, writable reproduction, external effects, or a question whose answer
feeds another lens.

An ordinary advisory agent is only behaviorally read-only. A shared checkout, fresh prompt, or role
label does not prove isolation. When the candidate controls discovered instructions, skills, agents,
judges, or reviewer policy, record that contamination and treat the return only as an untrusted lead;
it cannot satisfy an independent-audit requirement.

Only after advisory activation and candidate freeze, load
`../../assets/verification-advisory-template.md`. Copy and fill its complete dispatch packet once per activated
lens, without transcript, builder advocacy, sibling output, hidden reasoning, or secrets, and
require the agent to copy and fill its complete fixed return shape. Do not load the asset for other
lane routes. This shapes model output; it is not deterministic schema validation.

The main agent first recomputes the candidate locator; a change makes every bound return stale. It
then validates the schema and lens, reopens decisive evidence, reproduces material claims, deduplicates
causal roots, and resolves conflicts by provenance and consumer impact rather than agent count.
`partial`, `unsupported`, `mismatched`, and `unverified` never mean pass. Only the main agent maps a
verified finding to the highest Mission boundary and chooses the route.

Measure coordination before fan-out from the actual serialized common packet, each lens delta,
expected return bound, and the dispatch, return, candidate-recheck, validation, and synthesis events.
Compare their observed characters, available tokenizer count, and event count with the same evidence
work in the main context. Use fewer lenses whenever expected elapsed-time or context saving does not
exceed that copied context and coordination cost. These measurements route support only; they never
decide acceptance, Stop, revision, or an agent-count budget.

## Keep independent audit evidence fail-closed

An advisory lane never substitutes for the reviewer handoff, and no evaluator becomes a vote. Apply
that owner's endpoint restriction when any required current lens is invalid or unavailable. Generic
fallback evidence is integrity-checked, not sandbox-enforced.
