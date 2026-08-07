# Evidence Assessment Matrices

Use this capability to compare an evidenced system baseline with the final integrated outcome. It is read-only decision support inside `Plan` and integrated-candidate `Verify`/`Finalize`, not a sixth
lifecycle stage, acceptance gate, quality ceremony, or standing audit.

## Activate narrowly

Activation is owned by the canonical three-branch predicate in `SKILL.md`; do not widen or reinterpret
it here. For its multi-Mission branch, name the graph admission, ordering, verification, or later
proposal decision the comparison can change. For its optimization/refactor branch, name the local
gain and possible system regression being distinguished.

Do not activate merely because work is large, contains two Missions, changes many files, uses agents, or would benefit from generic quality. Skip it when one Mission's ordinary acceptance evidence fully
answers the decision. Name the assessment object, real consumer of the assessment, exact Origin,
included modules or capabilities, excluded scope, and the decision the comparison can change.

## Freeze the Plan baseline

Before the first dependent mutation or child dispatch, inspect current owners, contracts, consumers,
runtime evidence, relevant history, and known failure paths. Then copy and fill
`../../assets/optimization-assessment-template.md`.

Choose only decision-relevant dimensions. Each dimension must name one consumer-facing capability or
system property, a non-zero weight, an evidence-backed weight rationale tied to the named decision,
direct evidence, the current gap, and an observable target. Freeze whether it is critical and, when
critical, its numeric score floor; use `none` for non-critical rows. Weights must total 100. A floor
breach is reported independently of the weighted total. Record evidence maturity separately from score:

- `contradicted`: current evidence disproves the claimed capability;
- `declared`: documentation or prompt claims it, without a reachable owner;
- `reachable`: an owner and call path exist, without a successful dynamic result;
- `dynamic`: a bound real or controlled scenario succeeded once;
- `stable`: representative positive, negative, and recovery scenarios repeatedly support it.

Freeze the comparison design with the baseline and intended final candidate locators, scenario or
task inputs, consumer, model, permissions, tools, environment, and evidence capture.
For trigger or routing dimensions include intended activation, difficult near-miss non-activation,
and recovery cases. When repeated stochastic observations are available, report their sample scope
and variation rather than only an average; otherwise label the result as one observation.

Record context and coordination cost separately from quality: always-loaded skill characters or
tokens, conditionally loaded references/assets, copied lane packets, dispatch/return/synthesis events,
elapsed time, exposed input/output/cached/reasoning tokens, correction and recheck work, and whether
each value is observed, estimated, or unavailable. Do not require a benchmark harness or repository
test artifact merely to populate these fields.

When lifecycle QA supplies a compressed self-QA terminal receipt, consume it only as a locator-bound
trend input. QA remains the owner of signal capture, causal fingerprinting, clustering, cost and
recurrence reconstruction, classification, repair tracking, and dynamic acceptance; this assessment
does not recompute those facts into a second history. Read the receipt, current checkpoint, and anomaly
locators first and drill into native task or Git/GitHub evidence only when one assessment row requires
it. A single observation is not a trend, and a missing prior window stays unavailable.

For an activated same-rubric comparison, use decision-relevant recurrence, rework, waiting, and
token/context or coordination-cost evidence from that receipt alongside the frozen dimensions. Bind
each value to its observation window and evidence locator, keep incidental and systemic signals
distinct, and expose critical regressions independently of the weighted total. Assessment consumes
the trend to inform a named Plan, integrated verification, or later refactor decision; it neither
routes the repair nor creates a task, ledger, benchmark store, or acceptance gate.

When the named assessment decision compares implementation, TDD, frozen mechanical work, or
model/effort routes, load [execution routing](../execution/execution-mission-routing-policy.md) before
making that comparison and before the dependent Execute work. Use the existing matrix as the compact
performance receipt; do not create a separate log or artifact. For each materially different
scenario, bind its candidate or control locator, consumer quality floor and result, observed
model/effort or `unavailable`, elapsed and token/context evidence, coordination events,
correction/recheck cost, reused and invalidated evidence, route verdict, and unproved route plus
fail-safe fallback. Reuse the matrix's scenario coverage, dimension rows, cost surfaces, and limits
rather than duplicating them in another shape. A missing host metric stays unavailable and makes only
its dependent comparison non-comparable.

Use these strict score anchors; interpolate only when the evidence explains the difference:

- `0`: absent, unusable, or contradicted;
- `2`: mostly a declaration or placeholder;
- `4`: structurally reachable, but execution or outcome is not proved;
- `6`: the main path works dynamically, with material instability or coverage gaps;
- `8`: representative paths are reliable, with a small number of evidenced defects;
- `9.5`: varied dynamic evidence, no open critical or major gap, low maintenance cost, and only
  bounded refinement remains;
- `10`: comprehensive dynamic evidence and no identifiable improvement without changing the outcome.

Compute the weighted total as `sum(weight × score) / 100`, rounded to one decimal. Also expose every
critical low dimension; an average must not hide it. A score cannot rise because code, files, agents,
steps, tests, checks, documentation, or process grew. Green checks support only the behavior they
actually exercise.

Freeze dimensions, weights, weight rationales, critical classifications and floors, score anchors,
evidence maturity, and targets before execution. A later material change to the assessment object,
consumer, scope, or rubric requires `reframe`; do not edit the baseline to manufacture improvement.
A newly discovered dimension is reported separately and has no retroactive baseline delta.

## Use the baseline without widening work

Map every admitted improvement target to an existing Mission Outcome and acceptance evidence. The
matrix can expose a gap or challenge a Plan, but cannot silently add work, authorize a task, transfer
ownership, or turn a score target into product acceptance. A user may make a dimension or score an
explicit Outcome; otherwise scores remain diagnostic.

Use agent lanes only when the matrix contains at least two independent decision-changing evidence
questions and support-lane coordination is expected to cost less than main-context inspection. The
main agent freezes the rubric, reopens decisive evidence, resolves conflicts, and owns every score.
Agents do not vote or average their judgments into the matrix.

## Reassess the integrated result

A baseline-only read-only request ends with the frozen baseline report; record that no post-candidate
exists and do not manufacture a delta. For any explicitly assessed single Mission, run the
post-assessment on its exact terminal local or endpoint candidate. For a multi-Mission assessment,
wait until every assessed node is terminal. Use a canonical integrated head only when every node
merged into one declared shared source and the observed head contains every assessed candidate;
otherwise use the complete set of exact terminal candidate locators and state that no singular
integrated-head assessment exists. Use the exact PR head for `open` or `merge-ready`; use an exact
commit, complete preserved diff, or immutable artifact locator for a local/no-PR endpoint. Reuse the same
dimensions, weights, anchors, consumers, and evidence standards. For each row report baseline, final
score, delta, new direct evidence, remaining gap, and maturity change.

Call a delta comparable only when every decision-changing frozen control—task/scenario inputs,
consumer, model, permissions, tools, environment, and evidence capture—is observed equivalent or
proved irrelevant to that row. When equivalence is unknown or a control changed, score the final
evidence independently, mark the delta `not comparable`, name the unavailable or changed control as
a limit, and do not attribute the difference to the skill or Mission graph.

Increase a score only when new evidence proves the corresponding capability or property. Preserve a
lower or unchanged score when implementation volume grew without better consumer evidence. Report
regressions even when the weighted total improves. Distinguish local Mission acceptance from composite
quality: an accepted node can leave an overall gap, and a high overall score cannot accept a failed
node.

End with the smallest evidence-backed priority list. A remaining gap becomes a new Mission proposal
only when it is independently valuable and satisfies task dispatch admission and consent. A structural
gap may feed Refactor Mission investigation, but its score or delta alone never justifies refactoring.
State which dimensions are dynamically proved, only reachable, unproved, or contradicted, and retain
the exact evidence locators needed for a later same-rubric reassessment.
