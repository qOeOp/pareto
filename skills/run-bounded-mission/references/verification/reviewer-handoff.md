# Minimum Sufficient Review Contract

Main owns candidate identity, evidence, findings, repository/GitHub/Goal/delivery effects, acceptance,
and Finalize. A fresh read-only reviewer returns one material risk conclusion; it has none of those
authorities and is neither a vote nor authority transfer.

## Admission

Dispatch only a frozen committed candidate (`repository`, base commit, candidate commit/tree and exact
Git path locators) or an authorized content-addressed local snapshot with immutable Origin, archive,
manifest, and verified digests. Supply the complete Frame and Plan, one risk lens, direct immutable
evidence locators or explicit `unavailable`, and a neutral review-control locator independent of the
candidate.

Main opens every locator before launch and records exact candidate/control identities, repository
status, and affected-file and tree fingerprints for comparison after return. Mutable worktree paths,
prose summaries, reconstructed commands, inaccessible evidence, and candidate-owned control are
unsupported. Do not rebuild, repackage, retry, or materialize a packet to make them pass.

The review input is the sole frozen evaluator packet. Its binding is candidate commit/tree (or local
snapshot digest), base/Origin, neutral control, one lens, and exact evidence locators. From a
Main-observed execution boundary, select exactly one initial consumer: native `mission_evaluator` when
available, otherwise one fresh generic reviewer. No second schema, helper, compatibility packet, or
persistent record sits between this owner and that consumer.

## Smallest audit set

Use no reviewer when there is no material semantic, authority, external-effect, or new-contract risk.
Use one reviewer for one material risk. Use two only for two independent, falsifiable questions:

- `authority_representation`: provenance, authority-bearing representations, unknown values, and
  candidate/control self-authorization;
- `consumer_fail_close_closure`: real consumers, missing/wrong/stale inputs, terminal failures, and
  whether a refuting representation reaches the decision.

All reviewers consume the same candidate and control, one lens each, without sibling results. Delay,
timeout, unsupported transport, invalid output, or a finding never creates a retry or repacket.

## Reviewer boundary and return

The selected reviewer does not edit, delegate, communicate laterally, or perform an external effect.
It scans the complete changed surface and direct consumers before using
auxiliary evidence. Missing required evidence is `unsupported`, not `no_finding` or a candidate defect.

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
Every finding is only a lead until Main independently reproduces it through the smallest real consumer;
Main exact-deduplicates the ordered union and resolves disagreement by current authority and reproduced
impact, never reviewer count. Unsupported evidence remains explicit and cannot authorize delivery.
Hub alone authorizes merge.
