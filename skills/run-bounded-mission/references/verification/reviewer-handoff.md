# Minimum Sufficient Review Contract

Main owns candidate identity, evidence, findings, repository/GitHub/Goal/delivery effects, acceptance,
and Finalize. A fresh read-only reviewer returns one material risk conclusion; it has none of those
authorities and is neither a vote nor authority transfer.

An Acceptance Doctor is exactly this contract. Every launch uses the
[shared prompt envelope](../orchestration/orchestration-agent-routing.md); this owner supplies its
review-specific identity, risk atom, oracle, return, and Stop. Discovery Doctor output is planning
evidence only; its reviewers, findings, or counts never replace this candidate-bound audit set.

## Admission

Dispatch only a frozen committed candidate (`repository`, base commit, candidate commit/tree and exact
Git path locators) or an authorized content-addressed local snapshot with immutable Origin, archive,
manifest, and verified digests. Supply the complete Frame and Plan, one risk lens, direct immutable
evidence locators or explicit `unavailable`, and a neutral review-control locator independent of the
candidate.

A local-snapshot recipe starts from the immutable Origin's complete tracked path-and-mode topology,
including ignored-but-tracked entries, then applies only the declared added, changed, renamed, or
deleted material. Empty-index or filesystem enumeration through current ignore rules is unsupported
unless it first proves the same Origin topology. Before dispatch, recovery from Origin plus that delta
must recreate the exact candidate tree, archive member set and modes, and archive digest; any omitted,
extra, or undeclared member makes the packet unsupported. Use the committed-candidate route whenever
it is available; a local snapshot is admissible only when that route is unavailable. Do not add a
snapshot helper, packet schema, or ledger to compensate for an incomplete projection.

The candidate is acceptance-ready only when no known pending write, effect, or required
deterministic check can change the candidate, control, risk map, lens, or decisive evidence before
fan-in. Finish those actions before dispatch; a review launched into known candidate churn is
unsupported even when its starting commit is immutable.

Main opens every locator before launch and records exact candidate/control identities, repository
status, and affected-file and tree fingerprints for comparison after return. Mutable worktree paths,
prose summaries, reconstructed commands, inaccessible evidence, and candidate-owned control are
unsupported. Do not rebuild, repackage, retry, or materialize a packet to make them pass.
Every byte fingerprint also binds an immutable byte-producing recipe: tool identity, arguments,
working/path scope, ordering, separators, and encoding. Recovery and fan-in replay that exact recipe;
a missing, changed, or failed recipe makes the comparison unsupported, not evidence of drift.

The review input is the sole frozen evaluator packet. Its binding is candidate commit/tree (or local
snapshot digest), base/Origin, neutral control, one lens, and exact evidence locators. From a
Main-observed execution boundary, select exactly one initial consumer: native `mission_evaluator` when
available, otherwise one fresh generic reviewer. No second schema, helper, compatibility packet, or
persistent record sits between this owner and that consumer.

## Smallest audit set

Before choosing reviewers, Main derives a bounded risk inventory from the Frame, Plan, changed surface,
real consumers, affected project contracts, external effects, and unavailable evidence. Map every
material risk to Main verification or one falsifiable lens; uncovered risk freezes acceptance.
When that coverage is materially ambiguous or high-consequence, use one read-only `mission_planner`
before reviewer launch to challenge missing, duplicate, or non-falsifiable risks. It receives the
Frame, Plan, changed paths, contract/consumer map, and proposed coverage only; it neither reviews the
candidate nor selects the final set. Main admits or rejects its proposal and freezes the coverage map.

Use no reviewer when the inventory has no material semantic, authority, external-effect, or
new-contract risk. Use one reviewer for one material question and normally at most two for independent
questions. The common lenses are:

- `authority_representation`: provenance, authority-bearing representations, unknown values, and
  candidate/control self-authorization;
- `consumer_fail_close_closure`: real consumers, missing/wrong/stale inputs, terminal failures, and
  whether a refuting representation reaches the decision.

They are templates, not a complete domain taxonomy. A project-specific lens must bind one affected
contract or consumer and a refuting observation. If more than two independent material questions
remain, split or narrow the candidate. Only an indivisible high-consequence candidate may add another
lens, with a distinct contract, oracle, and Stop; generic role labels or broad review categories do
not justify it.

All reviewers consume the same candidate and control, one lens each, without sibling results. When
more than one lens is required, order them by expected decision-changing finding yield, consumer
consequence, oracle quality, and context/token cost, and dispatch sequentially by default. Parallel
dispatch is supported only when the lenses are independently required and the estimated decision
latency saved by parallelism or expected distinct-root yield explicitly outweighs duplicate token
exposure. Delay, timeout,
unsupported transport, invalid output, or a finding never creates a retry or repacket.

After Main reproduces a material finding, stop every undispatched reviewer because a correction will
stale the review set. For reviewers already in flight, Main records one bounded choice: fan them in
only when their expected distinct-root coverage can change the next correction or risk map;
otherwise stop or ignore them. Their returns remain candidate-bound planning leads and never become
Acceptance evidence for a corrected candidate.

A candidate-local correction creates a new acceptance-ready candidate identity even when Frame and
Plan do not change. Because independent review binds the complete candidate, any candidate change
stales the prior review set; once the new boundary is frozen, derive its current risk map and dispatch
the required lenses once against that identity. Main's deterministic evidence stales only where
affected. Never relabel or retry the prior packet.

## Reviewer boundary and return

The selected reviewer does not edit, delegate, communicate laterally, or perform an external effect.
It inventories the complete changed surface, then deeply inspects the assigned lens's bounded
producer-to-consumer dependency closure and expands only when evidence crosses that boundary. Every
changed path remains mapped to Main verification or one lens; reading unrelated files in full is not
review completeness. Missing required evidence is `unsupported`, not `no_finding` or a candidate
defect.

Return only:

```text
review_status: completed | unsupported
candidate_identity: committed commit/tree | local:sha256:<digest>
candidate_origin:
candidate_material:
control_origin:
risk_lens:
findings: no_finding | ordered severity, cause, location, evidence, next action
inspected_scope:
coverage_closure: refuting and preservation paths, transformation stages, verifier, consumer, residual
unavailable_evidence:
observed_tool_surface:
mutation_observation: none | detected | unverified
limits:
```

`completed` requires the changed surface and assigned question to be resolved. Wrong identity/lens,
missing fields, mutation, unavailable required evidence, or candidate-controlled authority is
`unsupported`.

## Main fan-in

After each return, Main re-resolves and compares candidate/control identities, repository status, and
affected-file and tree fingerprints. Any reviewer-visible mutation or drift invalidates that member.
Call a fingerprint mismatch drift only when the same recorded byte-producing recipe resolved
successfully on both sides; never compare a recovered or reconstructed representation with the
recorded digest.
Every finding is only a lead until Main independently reproduces it through the smallest real consumer;
Main exact-deduplicates the ordered union and resolves disagreement by current authority and reproduced
impact, never reviewer count. Unsupported evidence remains explicit and cannot authorize delivery.
Hub alone authorizes merge.
