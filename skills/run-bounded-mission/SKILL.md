---
name: run-bounded-mission
description: "Run a compact Request Admission gate and Frame, Plan, Execute, Verify, Finalize workflow. Use only when the user affirmatively invokes the exact token $run-bounded-mission, clearly asks to use or run the bounded mission workflow, pairs one exact live Codex task deep link (codex://threads/...) with a short request to watch, observe, or diagnose it, repository instructions require it for non-trivial implementation or delivery, or a later commit, push, pull-request, or merge turn continues a candidate produced under this workflow. Quoting, naming, linking, inspecting, auditing, explaining, generically diagnosing, or negating the token, skill name, or path is not invocation; a bare task link is also not invocation. Without one of those positive entries, do not use it for answer-only work, mechanical edits, routine status, task management, or internal subtasks. An affirmative explicit invocation wins over otherwise excluded request types, including when appended to the request."
---

# Run Bounded Mission

Use one conversation-owned lifecycle preceded by its entrance gate:

```text
Request Admission → Frame → Plan → Execute → Verify → Finalize
```

Request Admission is the Frame entrance gate, not a sixth lifecycle stage, second Spec, or Mission.

The main agent owns Request Admission, Frame, Plan admission, the single writable candidate, evidence
and finding judgment, effects, acceptance, and Finalize. A support lane may return evidence or a
frozen leaf but cannot own those decisions. Keep repository authority current-state-only,
dependencies acyclic, and the user's interaction language unchanged unless the user changes it.

Do not create a coordinator, registry, scheduler, ledger, database, daemon, retry engine, wrapper, or
compatibility path unless requested product behavior requires it. Prefer no change, deletion, or an
existing owner. Compression must preserve consumer behavior, unique authority, fail-close boundaries,
and observable acceptance.

## Request Admission

Before any admission evidence probe, bind the exact original user request by a conversation-native
locator or a lossless bounded quotation; a summary is not the source. Separate user-owned intent,
preferences, constraints, non-goals, acceptance, and explicit effect authority from technical or
causal premises and the requested mechanism. Treat premises as claims and the mechanism as a candidate
route unless the user explicitly owns it as a hard constraint. Current repository/runtime and real
consumer behavior own local technical facts; an agent-preferred request is only a proposal.

Freeze a read-only projection, then append its result after any admitted probe:

```text
Request admission projection
Original request: <exact request or locator>
User-owned intent / authority: <outcome, preferences, constraints, acceptance, effects>
Consumer / no-change harm: <behavior changed; observable harm if unchanged>
Material premises / mechanism: <claims to validate; candidate route or hard constraint>
Result: <status; admitted or proposed request; reason and decisive evidence>
```

Use `Direct` only when consumer, authority, acceptance, reversibility, premises, and project impact are
clear without external, structural, safety, or unknown consequence; emit only the compact projection
and load no history or conditional owner. Otherwise use the cheapest current repository/runtime or
consumer observation that can decide admission. For decision-changing bounded history, consequential
ambiguity, or external evidence, load [decision evidence](references/planning/planning-decision-evidence.md).
Mechanism comparison and structural choice remain in Plan.

`admitted_as_requested` and `admitted_normalized` are the only admitted results. Both require a real
consumer, a supported conclusion about no-change behavior, supported or testable necessary premises,
sufficient authority, and project impact that preserves existing owners, fail-close boundaries,
critical floors, and safe effects. Normalize only when every user-owned field is preserved and
`material_change: none`; retain
`original_request`, `admitted_request`, and `normalization`. A no-change result is normalized only when
current behavior already satisfies every user-owned field and no consumer harm remains.
`needs_user_alignment` asks the smallest question only the user can answer when a material reframe or
choice among user-owned fields or a hard mechanism constraint is required; preserve the original and
proposed requests, material diff, evidence, harm, and recommendation. `not_admitted` names the failed
consumer, contradicted necessary premise, critical floor, project constraint, safe path, or effect
authority; a corrected proposal is not admitted by implication. `evidence_unavailable` names the
decision-changing fact and finite Stop and freezes only its dependent admission. A contradicted,
unknown, unavailable, or reproduction-required necessary premise cannot reach its dependent Frame.
Re-run admission after a decisive correction or new observation; never silently convert a material
reframe into normalization.

Only an admitted projection may form Frame. Admission itself authorizes no mutation, candidate, branch,
worktree, PR, commit, shared external effect, Goal, or native Task. Conditional evidence support remains
read-only and cannot choose the Outcome, generate Frame, or decide admission for Main.

## Frame

Before a decision-changing probe or mutation, state:

```text
Frame projection
Request origin / admission: <original request and admitted projection locators>
Outcome / consumer: <observable result and real consumer>
Included / excluded: <scope and non-goals>
Authority / effects: <canonical authority; permitted and prohibited effects>
Acceptance: <falsifiable evidence and unavailable evidence>
Origin / Stop: <immutable origin and finite stops>
```

The admitted request, its immutable original-request locator, and current repository or user authority
remain canonical. A material change to any field freezes mutation and unissued effects, invalidates
the Plan, and requires a new projection; changing a user-owned field also requires alignment and
re-admission.

Choose session mode from independently valuable outcomes:

- zero: work directly;
- one: use the current task, Goal-unbound unless explicit matching Goal authority exists;
- multiple: require a matching active Goal and load
  [Codex task dispatch](references/orchestration/orchestration-task-workflow.md).

Observe Goal capability before a Goal effect; absence freezes only Goal/DAG-dependent effects. A Goal
is persistence for the overall outcome, not a clock or work scheduler.

For Hub work, task dispatch owns native identity, DAG, active-task custody, callbacks, bounded
observation, fan-in, and endpoints. A Hub acts only on an admitted user request, unseen terminal or
needs-attention receipt, or one checkpointed observation action. An unchanged observation is a silent
yield with no immediate resubscription. Callback transport may close a window early but is not the
only custody mechanism.

For a native Task, bind one exact target, one complete message, required title/identity gates, and the
observable native send receipt. Raw payload length or digest is producer identity, not proof of model
receipt. Missing, duplicate, supplemental, or ambiguous delivery is host-defect/no-change; never repair
it by retrying or creating a replacement task.

Load [lifecycle QA](references/quality-assurance/quality-assurance-lifecycle-policy.md) only for a concrete lifecycle mismatch, an explicit complaint, or an explicit request to watch, observe, or diagnose one exact live Mission; peer diagnosis defaults to a read-only sentinel and QA only classifies and routes.

Patch pressure, repeated authority, a capability without a real consumer, documentation/implementation
drift, or recurring rework/communication inflation activates the Optimization owner for an integrated
necessity test and overall subtraction; do not add another local patch or anti-corrosion runbook.

## Plan

Inspect the current owner, affected contract and real consumers, tests or executable checks, history
only when decision-relevant, and working-tree state. Choose the smallest vertical candidate.

```text
Plan projection
Owner / path: <one owner and exact write surface>
Boundary: <consumer and contract invariants>
Candidate: <smallest behavior and responsibility change>
Verification: <real consumer, regressions, root gate, unavailable evidence>
Dependencies / action bindings: <prerequisites and effect gates>
```

Admit the Plan only when every material decision has a consumer, unknowns are resolved or isolated,
the candidate cannot admit an unseen compatible representation, and every effect has current
authority. Load conditional owners only when their predicates hold:

- [decision evidence](references/planning/planning-decision-evidence.md) for decision-changing history,
  ambiguity, or external evidence;
- [Plan Design Loop](references/planning/planning-decision-workflow.md) for credible structural paths
  or consequential cross-owner trade-offs;
- [test integrity](references/verification/verification-test-integrity-policy.md) when test evidence or
  test restructuring can change the candidate;
- [optimization assessment](references/optimization/optimization-mission-assessment.md) only for an
  explicitly requested scored or system comparison;
- [agent routing](references/orchestration/orchestration-agent-routing.md) for one unresolved evidence
  question, one frozen mechanical leaf, or independent frozen-candidate risk questions.

After a nontrivial Plan, emit the complete
[replacement checkpoint](references/orchestration/orchestration-context-recovery.md); the Plan
projection is not that checkpoint. After context compaction, load that recovery owner before mutation
or an unissued effect. Replace the checkpoint after any decision-changing Frame, Plan, origin,
candidate, evidence, effect, authority, Stop, Resume, or terminal change.

## Execute

Implement only the admitted candidate. Keep one writer for overlapping files and preserve unrelated
work. A count, deadline, review finding, available model, or local friction cannot widen the candidate
or authorize an effect.

Do not commit, push, publish, comment, resolve, merge, deploy, schedule, trade, or perform another
shared-state effect without authority for that exact effect. Candidate-local defects return to the
smallest root correction; owner, boundary, oracle, repeated-root, or non-shrinking-candidate pressure
returns to Plan.

## Verify

For the exact candidate:

1. exercise the real consumer;
2. run the smallest authoritative owner and boundary regressions;
3. inspect the complete diff and run the repository root gate plus git diff --check;
4. prove checks created no unintended workspace changes;
5. record failures and unavailable evidence without turning them into passes.

Tests support but do not override a higher-authority consumer. Static closure is not dynamic proof.
Candidate changes stale only affected evidence. Mark claims `declared`, `reachable`, `dynamic`, or
`stable`; success claims require the maturity promised, and missing evidence remains unavailable.

Instruction, judge, or material deterministic-helper changes require a fresh independent audit. Load
the [minimum review contract](references/verification/reviewer-handoff.md). Derive material risks from
the affected contracts and consumers, then prove each is covered by Main verification or a falsifiable
lens. Normally use zero to two reviewers; split a candidate with more independent risks, except an
indivisible high-consequence candidate may justify another contract-bound lens. Pure documentation or
local governance with no runtime, external-effect, authority, or new-contract risk needs no evaluator.
Timeout, unsupported transport, a finding, or an invalid return never authorizes retry or repacket.
Main reproduces every material finding and owns the verdict.

## Finalize

Choose the highest affected boundary: reframe, replan, revise, blocked, or accept. Blocked requires
evidence that a required authority, capability, or fact is unavailable, acceptance is unsatisfiable,
or a completed structural replan has no viable route. Temporary unavailability may Resume only on a
new observation for the same predicate.

Accept only a verified exact candidate bound to a commit or preserved diff. Lead with the result and
exact effect state; distinguish current external evidence, local inference, and unavailable evidence.

Load [GitHub delivery](references/delivery/delivery-pullrequest-workflow.md) before PR publication,
merge-readiness, merge, or cleanup. It owns title validation, exact-head CI, conversations,
mergeability, freshness, guarded merge, and conditional cleanup. A child ending at a merged endpoint
hands off merge-ready evidence; Hub alone owns merge and node closure.

A Mission that created a task, branch, worktree, PR, cache, or continuing source checkout is not
terminal until each task-owned artifact has a current terminal disposition. At every terminal or
authorized-cancellation endpoint, reconcile
[artifact custody](references/delivery/delivery-postmerge-cleanup.md); inventory and freshness readback
are mandatory, while deletion, archive, or cache removal still requires authority for the exact target.
Unknown or unmatched state returns `needs_attention`, never silent completion.

Load [refactor proposals](references/optimization/optimization-refactor-workflow.md) only after related
Missions are integrated and terminal; proposals require new user approval.
