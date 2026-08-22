# Minimum Sufficient Review Contract

Main owns candidate identity, evidence, findings, repository/GitHub/Goal/delivery effects, acceptance,
and Finalize. A fresh read-only reviewer returns one material risk conclusion; it has none of those
authorities and is neither a vote nor authority transfer.

An Acceptance Doctor is exactly this contract. Every launch uses the
[shared prompt envelope](../orchestration/orchestration-agent-routing.md); this owner supplies its
review-specific identity, risk atom, oracle, return, and Stop. Discovery Doctor output is planning
evidence only; its reviewers, findings, or counts never replace this candidate-bound audit set.

## One-way admission

One review identity is `(repository, base/Origin, candidate commit/tree or snapshot digest, neutral
control, lens)`. Dispatch only a frozen committed candidate or, when committing is unavailable, an
authorized content-addressed local snapshot recoverable from immutable Origin plus a declared delta.
Mutable paths, candidate-owned control, inaccessible identities, or an incomplete snapshot are
unsupported.

The sole launch supplies that identity, a compact decision projection (owner, affected contract or
consumer, scope, effect boundary, acceptance and Stop), the falsifiable question and oracle, direct
immutable evidence locators or `unavailable`, and the return contract. For a committed candidate the
reviewer derives the complete changed surface from base to candidate; Main does not enumerate paths,
copy the diff, or transmit Frame and Plan. A local snapshot additionally binds its archive, manifest,
member modes, and verified digests. Do not add a helper, schema, or ledger to repair an incomplete
projection.

Finish writes and deterministic checks that can change the identity before dispatch. Review a material
effect before issuing it and mark its outcome unavailable; outcome arrival alone neither stales review
nor proves acceptance. Executable or product review still requires the original positive path, unless
the user independently admitted a lower-maturity outcome.

Pre-dispatch Main records status and composes packets from bound-repository Git output; transcription
blocks dispatch. Once any
dispatch is attempted, `unsupported`, invalid, or unavailable consumes that identity. Supplying omitted
fields, another prompt, follow-up, reviewer, role, or packet cannot repair or retry it; filling a missing
binding is packet correction, not a new identity. Only changing an already complete candidate, neutral
control, or lens after replan creates a new review identity.

Disposable recovery and verification state is never candidate custody. Create it under one exact
`mktemp -d` root and install cleanup for `EXIT`, `HUP`, `INT`, and `TERM` before materializing any
candidate bytes. A Rust replay sets `CARGO_INCREMENTAL=0` and keeps `CARGO_TARGET_DIR` inside that
root unless the repository's current check authority binds a stricter disposable target. Before a
long compile, run the repository's disk-budget gate when one exists; unavailable or failed disk
measurement freezes that compile rather than bypassing the gate. On interruption, terminate the
owned child first, remove the disposable root, and verify its absence. A reviewer return with a live
replay checkout, target directory, or unbounded external build cache is unsupported.

From a Main-observed execution boundary, select exactly one consumer: native `mission_evaluator` when
available, otherwise one fresh generic reviewer. No compatibility packet or persistent record sits
between this owner and that consumer.

## Smallest audit set

Before choosing reviewers, Main derives a bounded risk inventory from the Frame, Plan, changed surface,
real consumers, affected project contracts, external effects, and unavailable evidence. Map every
material risk to Main verification or one falsifiable lens; uncovered risk freezes acceptance.
Any independence premise uses the shared envelope's axes; shared authority is consistency evidence,
not an independent verifier.
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
exposure. Delay or a finding never creates another dispatch; terminal failures follow one-way
admission.

After Main reproduces a material finding, stop every undispatched reviewer because a correction will
stale the review set. For reviewers already in flight, Main records one bounded choice: fan them in
only when their expected distinct-root coverage can change the next correction or risk map;
otherwise stop or ignore them. Their returns remain candidate-bound planning leads and never become
Acceptance evidence for a corrected candidate.

A candidate correction stales its review set. Freeze the new boundary, derive the current risk map,
and dispatch only its required identities; deterministic evidence stales only where affected.

## Reviewer boundary and return

The selected reviewer does not edit, delegate, communicate laterally, or perform an external effect.
It inventories the complete changed surface, then deeply inspects the assigned lens's bounded
producer-to-consumer dependency closure and expands only when evidence crosses that boundary. Every
changed path remains mapped to Main verification or one lens; reading unrelated files in full is not
review completeness. Missing required evidence is `unsupported`, not `no_finding` or a candidate
defect.

Return only:

```text
review_status: completed | unsupported:<missing>
review_identity: <repository; Origin; candidate/tree or local digest; control; lens>
findings: no_finding | ordered <severity; invariant; cause locator; reproduction; preservation; next>
unavailable_evidence: <decision-relevant | none>
mutation_observation: none | detected:<locator> | unverified
```

`completed` asserts complete surface mapping and lens closure; omit passed inventories. Missing or wrong
identity, control, lens, closure, required evidence, or read-only proof is `unsupported`.

## Main fan-in

After each return, Main re-resolves the review identity and repository status. Any reviewer-visible
mutation or identity drift invalidates that member.
Every finding is only a lead until Main independently reproduces it through the smallest real consumer;
Main exact-deduplicates the ordered union and resolves disagreement by current authority and reproduced
impact, never reviewer count. Unsupported evidence remains explicit and cannot authorize delivery.
Hub alone authorizes merge.
