---
name: run-bounded-mission
description: "Run a compact Frame, Plan, Execute, Verify, Finalize workflow. Use only when the user affirmatively invokes the exact token $run-bounded-mission, clearly asks to use or run the bounded mission workflow, repository instructions require it for non-trivial implementation or delivery, or a later commit, push, pull-request, or merge turn continues a candidate produced under this workflow. Quoting, naming, linking, inspecting, auditing, explaining, diagnosing, or negating the token, skill name, or path is not invocation. Without one of those positive entries, do not use it for answer-only work, mechanical edits, routine status, task management, or internal subtasks. An affirmative explicit invocation wins over otherwise excluded request types, including when appended to the request."
---

# Run Bounded Mission

Use one conversation-owned lifecycle:

```text
Frame → Plan → Execute → Verify → Finalize
```

The main agent owns Frame, Plan admission, the single writable candidate, evidence and finding
judgment, effects, acceptance, and Finalize. A support lane may return evidence or a frozen leaf but
cannot own those decisions. Keep repository authority current-state-only, dependencies acyclic, and
the user's interaction language unchanged unless the user changes it.

Do not create a coordinator, registry, scheduler, ledger, database, daemon, retry engine, wrapper, or
compatibility path unless requested product behavior requires it. Prefer no change, deletion, or an
existing owner. Compression must preserve consumer behavior, unique authority, fail-close boundaries,
and observable acceptance.

## Frame

Before a decision-changing probe or mutation, state:

```text
Frame projection
Outcome / consumer: <observable result and real consumer>
Included / excluded: <scope and non-goals>
Authority / effects: <canonical authority; permitted and prohibited effects>
Acceptance: <falsifiable evidence and unavailable evidence>
Origin / Stop: <immutable origin and finite stops>
```

The request and current repository or user authority remain canonical. A material change to any field
freezes mutation and unissued effects, invalidates the Plan, and requires a new projection.

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

Load [lifecycle QA](references/quality-assurance/quality-assurance-lifecycle-policy.md) only for a
concrete lifecycle mismatch or an explicit complaint about this Skill. QA classifies and routes; it
does not repair, schedule, retain custody, or own another lifecycle.

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
[replacement checkpoint](references/orchestration/orchestration-context-recovery.md). Replace it after
any decision-changing Frame, Plan, origin, candidate, evidence, effect, authority, Stop, Resume, or
terminal change.

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
the [minimum review contract](references/verification/reviewer-handoff.md). Use one reviewer for one
material risk; use two only for two independent, falsifiable risks. Pure documentation or local
governance with no runtime, external-effect, authority, or new-contract risk needs no evaluator.
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
