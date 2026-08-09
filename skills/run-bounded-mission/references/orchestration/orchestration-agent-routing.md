# Route Agent Lanes

Load this owner only for one unresolved evidence question, one frozen mechanical leaf, or an admitted
independent candidate lens. Main retains Frame, Plan, the writable winner, fan-in, effects, acceptance,
and Finalize. A lane returns evidence, a proposal, or a bounded leaf.

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

| Need                                                                    | Lowest sufficient route                              | Stop / fallback                                                 |
| ----------------------------------------------------------------------- | ---------------------------------------------------- | --------------------------------------------------------------- |
| Frame, Plan admission, cross-owner/safety judgment, synthesis, Finalize | authorized main                                      | never delegate                                                  |
| evidenced structural challenge                                          | one `mission_planner` proposal                       | main decides                                                    |
| one decision-changing current/external fact                             | one `mission_researcher` brief                       | main or freeze dependent decision                               |
| ordinary implementation                                                 | main or one standard builder                         | single writer                                                   |
| exact low-risk mechanical leaf                                          | `fast_builder` only when all fields below are frozen | standard main once if capability is unavailable before dispatch |
| frozen-candidate semantic risk                                          | reviewer-handoff's zero/one/two lens set             | unsupported; no retry                                           |

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
