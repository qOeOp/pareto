---
name: run-bounded-mission
description: "Run a compact Frame, Plan, Execute, Verify, Finalize workflow. Use only when the user affirmatively invokes the exact token $run-bounded-mission, clearly asks to use or run the bounded mission workflow, repository instructions require it for non-trivial implementation or delivery, or a later commit, push, pull-request, or merge turn continues a candidate produced under this workflow. Quoting, naming, linking, inspecting, auditing, explaining, diagnosing, or negating the token, skill name, or path is not invocation. Without one of those positive entries, do not use it for answer-only work, mechanical edits, routine status, task management, or internal subtasks. An affirmative explicit invocation wins over otherwise excluded request types, including when appended to the request."
---

# Run Bounded Mission

Use one conversation-owned lifecycle:

```text
Frame → Plan → Execute → Verify → Finalize
```

The frontmatter description alone owns entry. Stages, projections, and checkpoints are conversation
evidence, not durable workflow state. Do not create a coordinator, registry, scheduler, ledger,
database, daemon, state machine, retry engine, or helper unless the requested product behavior needs
one.

The main agent owns Frame, Plan admission, the one writable candidate, evidence and finding judgment,
effects, acceptance, and Finalize. Support lanes return bounded evidence, proposals, or frozen leaves;
they cannot authorize effects, widen scope, choose a route, or accept the candidate.

Inherit the user's current interaction language across Hub, child, and support-lane user-visible
commentary and Finalize output unless the user changes it. Preserve code, commands, schemas,
identifiers, and raw evidence in their original form.

Keep repository authority current-state-only and dependency direction acyclic. Replace or delete
superseded authority with the slice that promotes the final owner; do not add reverse edges or
continue a loop that produces no decision-relevant evidence.

## Frame

Immediately after entry and before any decision-changing probe or mutation, emit:

```text
Frame projection
Outcome / consumer: <observable result; real consumer>
Included / excluded: <scope; non-goals>
Authority / effects: <canonical authority; permitted and prohibited effects>
Acceptance: <falsifiable and unavailable evidence>
Origin / Stop: <current origin; finite evidence-backed stops>
```

Populate every label with ordinary prose. The raw request and repository or user authority remain
canonical; a projection cannot repair entry, add authority, or persist lifecycle identity. Change a
material Frame field explicitly before continuing and never silently widen scope, authority,
acceptance, or Stop.

Prefer no change, deletion, direct reuse, or a narrower behavior when it closes the Outcome. Treat a
requested mechanism as a proposal when repository evidence shows a smaller or safer path. Counts of
lines, files, diffs, steps, agents, revisions, time, tokens, or checks are diagnostics unless the user
makes one the Outcome; none decides admission, routing, Stop, or acceptance. Compression cannot trade
away consumer behavior, evidence, readability, authority closure, or fail-close boundaries. Judge
minimality by removing unconsumed owners, duplicate authority or state, branches, adapters,
exceptions, indirection, and superseded paths—not by net deletion.

Keep independent outcomes separate from diagnosis, tests, documentation sync, review correction,
coupled work, and support roles. For a separate outcome, existing child, follow-up, or multi-Mission
operation, load [Codex task dispatch](references/orchestration/orchestration-task-workflow.md); it owns proposal, consent,
identity, dependency, title, and endpoint projection.

### Session mode

At entry, a new turn, compaction recovery, or a resumed hub checkpoint, first compare the latest
request and observed effect against the complete current Frame. A material change to Outcome or
consumer, scope or non-goal, expected repository or external effect, authority, acceptance, Origin,
Stop, or the resulting no/single/multi-Mission classification freezes the next mutation and every
unissued effect. Explicitly reframe, invalidate the old Plan, and re-run mode selection before any of
them; a remembered mode or unchanged task identity is not evidence that the Frame stayed material-
equivalent.

Before a Goal-bound mode or Goal-driven effect, inspect the current callable tool surface. Call
`get_goal` only when it is exposed; documentation, a prior session, conversation prose, or a
checkpoint cannot prove current Goal capability:

- zero independent Missions: work directly and leave Goal untouched;
- one: use the current task unless separate routing was explicitly requested; join a Goal only with
  explicit Goal authority and a matching overall Outcome;
- two or more: require a matching active overall Goal and load task dispatch before any Goal-driven
  effect.

A missing, completed, paused, blocked, or nonmatching Goal freezes multi-Mission effects until task
dispatch reconciles it. If `get_goal` is unavailable, an ordinary zero- or single-Mission path may
continue only as explicitly Goal-unbound current-thread work; multi-Mission dispatch, dependency
release, publication, and Goal effects fail closed through task dispatch's observable capability
fallback. Never claim that a Goal or DAG was persisted, or infer Goal create, update, replacement,
resume, or completion authority.

Before delegation, task control, or a recovered Hub's non-recovery repository read, classify the
requested mechanism. A user-visible independent Mission loads task dispatch and uses native Codex Task;
an internal support lane loads agent routing, and a collaboration sub-agent never satisfies native Task.
After `get_goal`, recovered Hub, node, create-attempt/receipt, or child-identity evidence loads task
dispatch and its recorded next owner before the gated action. Missing or unknown mode, route/slice,
activated-owner set, or next-owner edge freezes that read, delegation, control, and effect.

Before an action, native-task, support-lane, or evaluator dispatch, its owning route must bind the
complete consumer-visible packet before launch. The packet carries every activated authority and
precondition, exact inter-step byte edge, current Frame/Plan and mode, Goal capability and persistence,
Origin and dependency, exact native title and interaction language when applicable, observed or
unavailable model/effort, and one next legal action. Bind the canonical payload's UTF-8 bytes, length,
and SHA-256 outside that payload. The fresh consumer verifies that identity as its first gate; a
summary, prefix, truncation, later supplement, prose reconstruction, or mismatched member freezes the
dispatch and cannot be repaired after launch. The route owner defines the concrete packet shape; this
kernel adds no envelope, helper, registry, or compatibility path.

Before pull-request metadata create or edit, load [GitHub delivery](references/delivery/delivery-pullrequest-workflow.md)
through a candidate-independent immutable-Origin or neutral-authority locator. Candidate absence cannot
deactivate the operation-applicable gate owned there. Metadata create/edit consumes its title authority
and validator, binds the exact result before the effect, and requires exact remote readback afterward;
manual review-request effects separately consume that owner's request preflight, renderer, and request
validator. Missing, nonzero, stale, candidate-controlled, or mismatched evidence freezes only that effect
rather than inventing another authority or CLI.

## Transitions and routing

Advance only on these observations:

- `Frame → Plan`: every Frame field supports the next decision, consequential ambiguity is resolved
  or isolated, and Stop is finite;
- `Plan → Execute`: owner, path, boundary, candidate shape, verification, and required action bindings
  are admitted with no decision-changing premise unresolved, and every activated Design Loop has
  returned its one complete current Plan;
- `Execute → Verify`: the admitted candidate and complete mission-owned diff, including untracked
  material, are available;
- `Verify → Finalize`: decisive passes, failures, findings, and unavailable evidence are recorded for
  the current candidate;
- `Finalize → accept`: acceptance is satisfied and recoverably bound to a commit or preserved diff.

Otherwise freeze mutation and unissued effects, enter Finalize, and route the coherent evidence set
at its highest boundary:

1. changed Outcome, consumer, scope, non-goal, authority, acceptance, Origin, or Stop returns to
   Frame;
2. invalid owner, path, boundary, responsibility shape, or oracle; the same causal root recurring;
   or a non-shrinking or growing candidate returns to Plan through
   [revision-pressure replan](references/planning/planning-revision-workflow.md);
3. an otherwise candidate-local finding returns to Execute for the smallest coherent root-cause
   correction;
4. `blocked` requires observed provenance bound to a required decision proving unavailable authority,
   evidence, or capability; unsatisfiable acceptance; or no viable route after a completed structural
   replan under the unchanged Frame.

Once a coherent set selects a higher boundary, a later lower finding cannot overwrite it. A no-viable
or non-convergence claim must bind the current Frame and actual replan generation or candidate
fingerprint; counts and generic failure classes do not prove either.

Use `Resume` only for a genuinely temporary unavailable predicate. Release it only with a new
observation for the same fact category and required decision. Unsatisfiable acceptance has no Resume
under the unchanged Frame; a later credible path returns through Plan, never directly to Verify.
Do not repeat an unchanged failed command, investigation, candidate, external request, or wait. Name
the changed input, environment, authority, candidate, or evidence and the observation that can now
disconfirm the prior result.

### Override and recovery

A user override freezes the next mutation and every unissued effect. Plain cancellation ends the
Mission and preserves its existing candidate when one exists. Explicit discard or revert authorizes
cleanup only of the exactly identified mission-owned diff after comparing and preserving unrelated
work. A changed Frame uses `reframe`; an unrelated Outcome stays separate; new authority never applies
retroactively.

Before a shared checkpoint exists, interruption, compaction, chat Handoff, or source drift freezes
mutation and effects until the raw request plus conversation, Git, native-task, and external-effect
facts reconstruct the same complete Frame, candidate, evidence, position, next operation, authority,
Stop, Resume, and terminal condition. If a nontrivial Plan may have existed, load the checkpoint
instead of using this fallback. A tiny Mission with no admitted nontrivial Plan loads no checkpoint.

Immediately after every nontrivial Plan admission, load and emit the complete
[Mission replacement checkpoint](references/orchestration/orchestration-context-recovery.md). It alone owns compatible single-
Mission and hub recovery state. Replace it as a whole after any decision-changing fact. On a later
turn or interruption, observe the current Goal-tool surface, reconcile `get_goal` when exposed, and
reconcile mode, route/slice mechanisms, next-owner edges, and activated owners with immutable locators.
Release work only through the checkpoint's recovery gate; multi-Mission recovery also follows task
dispatch's capability fallback, and candidate deletion cannot erase a candidate-independent activation.

Load [lifecycle quality assurance](references/quality-assurance/quality-assurance-lifecycle-policy.md)
only for a concrete lifecycle mismatch; a user concern that the Skill is behaving incorrectly;
evidenced rework, waiting, permission, audit-duplication, or communication-cost pressure; or active
anomaly locators at Finalize or Goal-wave closure. With no concrete signal, load nothing. QA classifies
and routes the root cause to an existing owner; it does not repair or add a sixth stage. Do not copy
its receipt fields, statistics, clustering, remediation, or recurrence semantics into this kernel.

## Plan

Inspect the current owner, production entry when one exists, affected contracts and consumers, tests,
and working-tree state. Choose the smallest vertical change that closes the Outcome.

Name the consumer invariant and every representation axis the candidate relies on. Admit an axis only
when located authority makes it semantically relevant. If the candidate enumerates or depends on its
values or states, also require authority that makes the exact representation contractual or defines
an exhaustive versioned domain with an unknown-value policy. Samples, fixtures, local enums, observed
payloads, current paths, configuration, and tool availability do not close a space. A compatible
unseen representation that can reach the same consumer without all required authority rejects the
candidate and keeps the Mission in Plan.

A tiny Mission with no decision-changing Plan emits only the Frame projection and loads no heavy
reference.

For every nontrivial Plan, immediately before Execute emit:

```text
Plan projection
Owner / path: <existing owner; exact paths>
Boundary: <affected consumers and contracts; frozen write surface>
Candidate: <smallest responsibility and behavior shape>
Verification: <consumer and owner checks; final gate; unavailable evidence>
Dependencies / action bindings: <prerequisites; effect owner and authority; capability or gate>
```

Before admission, finish every discoverable repository or consumer probe that can dispose a
consequential unknown, then route what remains through Decision evidence as `default`, `research`, or
`ask`. Suppress a question unless no safe default exists and its answer materially changes candidate,
acceptance, or an action binding. Preserve only Plan-changing final decisions in `Candidate` as
`Decision / basis / rejected alternative / unresolved consequence`; add no field or log.

Admit only when every material decision has a downstream consumer, every research basis has evidence
status and Stop, and every slice has its earliest `replan` and `reframe` signal. This Plan-local
coherence preflight creates no state.

Plan is read-only. Freeze the mission-owned boundary against Origin and pre-existing user work. For
every nontrivial action outside ordinary observed capability, bind its owner, exact effect and
authority, plus the observed capability at the required stage or an owned later fail-closed gate.
Candidate-bound capability may use such a gate after Execute; never claim it early. Any unresolved
field keeps the Mission in Plan or returns it to Frame.

Load conditional Plan owners only when their exact predicate holds:

- [Decision evidence](references/planning/planning-decision-evidence.md): named-path history can change a decision;
  ambiguity can change candidate, consumer, authority, acceptance, or a hard-to-reverse choice; or
  current external/domain evidence is necessary because local authority cannot close the premise.
- [Plan Design Loop](references/planning/planning-decision-workflow.md): a material frontier needs more
  than a Direct Plan, including reuse or credible paths that can change authority, owner,
  responsibility, architecture, verification, or a hard-to-reverse choice; it owns Bounded and
  High-consequence shaping plus independently falsifiable slices.
- [Test effectiveness governance](references/verification/verification-test-integrity-policy.md): a test failure can
  change the candidate, an escaped defect exposes a blind spot, or the Mission may restructure tests.
- [Evidence assessment matrices](references/optimization/optimization-mission-assessment.md): only an explicitly requested
  scored report, a named multi-Mission quality decision, or an optimization/refactor comparison that
  must distinguish local gain from system regression.
- [Agent lane routing](references/orchestration/orchestration-agent-routing.md): one concrete unresolved evidence question, one
  frozen non-overlapping build leaf, or independent frozen-candidate risk questions meet its cost and
  integrity predicates.

Projection values remain ordinary prose. Downstream packets quote or navigate only their relevant
current fields and raw evidence locators; only the reviewer packet receives the exact complete Frame,
Plan, and candidate bindings it defines.

## Execute

Implement only the admitted candidate. Keep one writer for overlapping files and preserve unrelated
work. The candidate is the mission-owned diff, not every staged, unstaged, or untracked path.

Do not commit, push, publish, open or merge a pull request, deploy, schedule, trade, comment, resolve,
or perform another shared-state or live effect without authority for that exact effect.

After main reproduces a material candidate-local finding, apply an obvious one- or two-line correction
in main. Load agent lane routing before any larger frozen mechanical leaf; it alone owns `fast_builder`
admission, exact-model observation, standard-main fallback, and coordination-cost comparison. A
finding, revision, model label, or available agent never selects the lane. Revision pressure loads its
replan owner before further mutation.

## Verify

Verify the exact mission-owned diff in proportion to risk:

1. exercise the real consumer for user or runtime behavior;
2. run the smallest authoritative owner and boundary regressions;
3. inspect the complete diff and run `git diff --check`;
4. prove checks created no unintended workspace changes;
5. report failed or unavailable evidence when it changes confidence.

Documents, static checks, and tests support but do not replace relevant consumer behavior. Do not
change correct production behavior for a lower-authority test. Do not keep repository tests for this
skill's instructions or bundled helpers; use actual helper calls, real Missions, and hub observation,
then fix the real owner on an observed failure.

Candidate changes invalidate only evidence whose inputs changed. Reuse discovery and unaffected
checks only when source, dependency closure, configuration, toolchain, environment, and evidence-
specific inputs remain identical. The root gate is candidate-bound and runs on the final integrated
candidate, repeating only after an affected change or corrected failure.

Release independent Verify work from immutable inputs. When final root verification and an independent
audit consume the same frozen candidate and neither feeds the other, freeze the exact commit or named-
Origin diff first, launch both concurrently, and fan in once. Keep them sequential when one is an
admitted input to the other.

Load [architecture sensor evidence](references/optimization/optimization-architecture-assessment.md) only for material structural
change, cross-owner effects, or persistent patch pressure. For two or more independent advisory risk
questions, use agent lane routing; advisory returns are untrusted leads, never acceptance or votes.

Instruction and judge changes require an independent audit. A deterministic helper does too when a
reviewer-packet risk is material. Load [the Verify reviewer packet](references/verification/reviewer-handoff.md);
it owns audit-set selection, immutable-Origin policy, exact complete candidate and Frame/Plan binding,
fresh non-builder context, integrity fallback, result classification, and fail-close gates. Main
reproduces and arbitrates every return. No valid current audit means no independent-audit or remote-
delivery claim.

## Finalize

Choose exactly one evidence-backed highest-boundary route and never weaken acceptance to manufacture
`accept`. Lead with the user-visible result and exact effect state; summarize changed paths, decisive
checks, and material limits. Label current external evidence, static/local inference, and unproved
assumptions. Do not emit internal lifecycle identities or a mandatory closing template, and do not
call model memory current best practice.

Accept only a verified candidate recoverably bound to its commit or preserved diff. Local-only work
stays uncommitted unless commit/publication authority exists. Publication is not acceptance. Reload
this skill for later commit, push, pull-request, or merge continuation instead of using a generic
publisher.

For a multi-Mission node ending `merged`, task dispatch projects child delivery as `merge-ready`:
child Finalize accepts only that exact-candidate handoff; hub Finalize alone owns guarded merge and
node closure.

Load [GitHub delivery](references/delivery/delivery-pullrequest-workflow.md) before any pull-request publication, review,
merge, or post-merge cleanup. It owns title validation, exact-head discovery, CI/conversation/
mergeability barriers, effect authority, and cleanup inventory. Load
[Refactor Mission proposals](references/optimization/optimization-refactor-workflow.md) only after two or more related
Missions are accepted and integrated at the canonical tip and every related node is terminal; a
child reports evidence only, and every proposal requires new user approval.
