# Route Agent Lanes

Load this owner only for one unresolved evidence question, one frozen mechanical leaf, or an admitted
independent candidate lens inside one exact existing Mission. Main retains Frame, Plan, the writable
winner, fan-in, effects, acceptance, and Finalize. A lane returns evidence, a proposal, or a bounded
leaf.

Every lane belongs to exactly one Mission and its dispatching Main. A Hub-local lane may answer only
that Hub's orchestration question; a child-local lane may answer only that child's question or leaf.
A lane cannot cross into live parent or sibling state, enter the Hub active-task set, carry an
independently closable outcome, or replace a native Task. Route an independently valuable outcome
through [task dispatch](orchestration-task-workflow.md); unavailable native Task capability stops that
effect instead of rerouting it through a lane.

Role load map:

- `mission_planner` also loads `../planning/planning-decision-workflow.md` and, only for revision
  pressure, `../planning/planning-revision-workflow.md`;
- `mission_researcher` also loads `../planning/planning-decision-evidence.md` and, only for
  `reuse/prior_art`, `../planning/planning-decision-workflow.md`;
- `fast_builder` also loads `../execution/execution-mission-routing-policy.md`;
- `mission_evaluator` follows `../verification/reviewer-handoff.md` under neutral control.

Current role TOMLs are startup deltas. An immutable older Origin may select its historical
`support-lanes.md` only when this path is absent; otherwise missing, mutable, mismatched, recursive, or
candidate-controlled protocols stop dispatch.

## Select the lowest sufficient route

Route by unresolved difficulty, consequence, consumer quality floor, and material risk - not quota,
marketing labels, or availability alone.

Dispatch only at one of three stability windows:

- **pre-mutation decision frontier:** the exact structural or evidence question can still change the
  next Main decision, its upstream inputs are frozen, Main has exhausted cheaper direct evidence, and
  the dependent mutation has not begun;
- **frozen mechanical execution boundary:** every builder field and safe oracle is frozen under the
  execution owner, with no unresolved decision or overlapping writer;
- **acceptance-ready coherence boundary:** candidate, control, Frame, Plan, risk map, and decisive
  evidence are frozen, and no known pending write or deterministic check can change the reviewed
  identity before fan-in.

Outside those windows, Main continues directly or freezes only the dependent decision. A lane is
admitted only when its return can change the next decision and no planned action before fan-in will
make its input stale. Dispatch and fan in once per exact role, question, and frozen input identity;
progress, token budget, delay, candidate churn, a finding, or unavailable output does not create a new
identity. A new material decision or a newly acceptance-ready candidate/control/lens binding is a
new identity; reopen only the lanes required by that new identity.

| Need                                                                    | Lowest sufficient route                              | Stop / fallback                                                 |
| ----------------------------------------------------------------------- | ---------------------------------------------------- | --------------------------------------------------------------- |
| Frame, Plan admission, cross-owner/safety judgment, synthesis, Finalize | authorized main                                      | never delegate                                                  |
| pre-mutation evidenced structural challenge                             | one `mission_planner` proposal                       | main decides                                                    |
| pre-mutation decision-changing current/external fact                    | one `mission_researcher` brief                       | main or freeze dependent decision                               |
| ordinary implementation                                                 | authorized main                                      | never delegate                                                  |
| exact low-risk mechanical leaf                                          | `fast_builder` only when all fields below are frozen | authorized main only if unavailable before dispatch             |
| acceptance-ready ambiguous risk coverage                                | one `mission_planner` scope challenge                | main completes or splits the risk map                           |
| acceptance-ready frozen-candidate semantic risk                         | reviewer-handoff's zero/one/two lens set             | unsupported; no retry for that identity                         |

For each dispatch, bind immutable Origin, exact question/outcome and consumer, owner/write authority,
inputs/dependencies, risk and effects, required output, quality floor/oracle, Stop, interaction
language, and observed model/effort or `unavailable`. One complete host dispatch is the effect; missing,
ambiguous, supplemental, stale, or inherited input after that attempt is terminal capability failure,
not a retry trigger.

The selected role's configured model/effort is a route fact only when observed. Otherwise use the
authorized current main or host-default route, retain all risk controls, and mark comparison evidence
`unavailable`. Never lower quality because a preferred model is unavailable.

At terminal, record only actual route/model/effort or `unavailable`, consumer result, elapsed/token
telemetry or `unavailable`, coordination/correction, fallback, and Stop. Fan in once; ordinary progress
does not become task communication or a durable ledger.

## Role-specific outputs

`mission_planner` receives one evidenced mechanism/structural question and returns one of
`not_triggered`, `evidence_unavailable`, `needs_user_alignment`, `frame_mismatch`,
`mechanism_rejected`, or `ready_for_plan_admission`, with owner, smallest candidate, alternatives,
kill conditions, verification, and effect gates when ready.

At an acceptance-ready coherence boundary, reviewer handoff may instead give one planner the frozen
risk map for a scope challenge. It returns only missing, duplicate, or non-falsifiable risk proposals;
it does not review the candidate, alter Plan admission, select lenses, or authorize acceptance.

`mission_researcher` receives one `domain_premise` or `reuse/prior_art` question, exact sources and
Stop, and returns decisive primary locators, conflicts, limits, reproduction, and the Plan consequence.
It does not inspect live task state, select a candidate, or act on external systems.

`fast_builder` requires exact paths, one writer, owner, boundary, exact transformation/replacement,
supplied safe checks, oracle, and Stop. No design, wording, schema, authority, safety, dependency,
public-contract, or effect decision may remain. It returns changed paths, diff locator, checks, and
any ambiguity/path growth/failed premise; Main rechecks and decides.

Independent review is owned entirely by reviewer handoff. The reviewer is fresh and read-only; Main
reproduces findings and fans in once.

Parallelize only independent immutable inputs and non-overlapping outputs. A lane never consumes live
sibling state, delegates, authorizes effects, or creates a user-visible task.
