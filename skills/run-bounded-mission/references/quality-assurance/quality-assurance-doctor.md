# Bounded Doctor

Load only for an explicit Doctor request or when Main has admitted a Doctor pass as the smallest way
to resolve a bounded cross-contract risk inventory. Doctor is a diagnostic route inside one existing
Mission. It creates no standing audit stage, issue queue, telemetry ledger, repair authority, or
acceptance authority.

## Choose the mode

`discovery` runs before dependent mutation against one frozen Origin or candidate when unfamiliar,
cross-contract risk can change Frame or Plan. `acceptance` runs only after deterministic Verify
against one acceptance-ready candidate and is exactly the existing
[minimum review contract](../verification/reviewer-handoff.md). A
Discovery result is planning evidence; it cannot accept a candidate or replace Acceptance review.
Routine, mechanical, single-contract work with executable coverage does not trigger Doctor.

## Close deterministic preflight first

Before any lens, freeze the repository, Origin/candidate, complete changed surface including
untracked material, real consumers, affected contracts, authority/effects, and available cost bound.
Run the cheapest authoritative deterministic checks that can decide the same questions: diff and
schema closure, lint/type/build/test or focused consumer checks, archive/fingerprint replay, evidence
locator reachability, input-domain capacity, stale-evidence checks, and declared executable refuters.
A known failure, mutable identity, unavailable required evidence, or pending candidate write stops
lens dispatch. Convert each reproduced Doctor finding into the smallest deterministic regression
before a later pass.

For an executable consumer outcome, the first preflight is the cheapest currently callable positive
golden path for the original admitted outcome at the maturity Main intends to claim. Bind the exact
deployed artifact/runtime to the frozen candidate and observe the final consumer result. A failed,
pending, differently deployed, or identity-unknown path stops every hardening or Acceptance lens that
cannot change that result. If the path is unavailable, Discovery may dispatch only a lens whose return
can resolve that exact blocker or a separately admitted lower-maturity decision; it cannot spend a
broad lens set and then use static, negative, or artifact evidence to imply product readiness.

## Select the minimum lenses

Express each residual risk as one atom:

```text
affected contract + refuting counterexample + preservation control + producer-to-consumer stage
oracle + finite Stop
```

Subtract atoms already closed deterministically and combine atoms with the same failed relationship
or root cause. Order the rest by consumer consequence, new coverage, oracle availability, and lowest
estimated context/token cost. Generic categories such as security, architecture, or product are not
lenses until they bind that atom. Compile every launch through the shared
[agent-routing prompt envelope](../orchestration/orchestration-agent-routing.md); a broad
`review the whole project` prompt is unsupported.

For parsed, encoded, normalized, generated, or mirrored representations, derive cases from an exact
immutable content-addressed locator and verified digest for the authoritative grammar, parser,
generator, or bounded-equivalence-class source. Bind the raw producer representation, every
transformation stage, the verifier, and the real consumer. A mutable name or named example does not
close the domain; require the refuter and a nearby valid preservation control to reach the same oracle.
Bind runtime-authority and verifier artifacts by exact immutable content-addressed locator and
verified digest. For every live-runtime claim, independently bind the exact native observation or
consumer readback to the observed artifact or runtime identity; artifact existence or static
configuration is not live authority. Artifact-only evidence is supported only for an explicitly
static outcome and oracle.

When a quality claim depends on an `independent` producer/verifier, bind the concrete separation axes:
model and provider, prompt/control lineage, input/evidence view, and failure authority. Each shared
axis is common-mode evidence on that axis; a second call through the same authority is a consistency
check, not an independent verifier. Missing independence freezes only the dependent independence
claim, not the underlying deterministic or consumer evidence.

Discovery starts with one highest-yield lens and normally dispatches sequentially. Main fans in and
reproduces its result before releasing another. Use at most three lenses for one frozen identity; at
most two may run together only when both are independently required and an explicit wall-time bound
outweighs their extra token exposure. Stop undispatched lenses on the first reproduced material
finding, identity churn, exhausted budget, unusable oracle, or no remaining uncovered atom. A timeout,
unsupported return, or finding never authorizes retrying the same atom.

Acceptance uses reviewer handoff's zero/one/two set. Only its indivisible high-consequence exception
may add a third distinct contract-bound lens. Discovery reviews and counts do not carry forward as
Acceptance evidence.

## Report cost and convergence

Keep one conversation-owned report, not a repository artifact or running ledger:

```text
doctor_identity: <mode, Origin/candidate, Skill/profile identities>
deterministic_preflight: <checks, result, elapsed; token cost separated or unavailable>
lenses: <selected and subtracted atoms with reasons>
fan_out: <prompt bytes/completeness, actual role/model/effort, elapsed/tokens or unavailable>
findings: <raw, Main-reproduced, deduplicated roots, deterministic regressions>
coverage: <closed and residual atoms>
stop: <reason and next Main decision>
```

Judge usefulness by reproduced root findings and decision-changing residual coverage at comparable
cost, not raw opinion, test, or lens counts. Repeated roots, declining marginal coverage, or prompt
and context growth without a changed decision is convergence pressure to stop or narrow the next
Doctor pass.
