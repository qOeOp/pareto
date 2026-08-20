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

Use `fork_turns: none` for every admitted lane and make the sole launch prompt its complete context.
An omitted or `all` full-history fork may inherit Main's role, silently copy unrelated context, and
hide an incomplete prompt; freeze before any host effect rather than correcting it with a second
request. A positive bounded fork is exceptional: Main must show that the exact inherited turns are
smaller than an equivalent locator-bound packet and contain no unrelated authority or private data.

## Compile one complete lane prompt

Main compiles every planner, researcher, builder, evaluator, explorer, worker, or generic lane from
the same envelope. The role label, a broad topic, the repository name, or inherited conversation is
not a prompt. The sole launch message binds:

- `mission_and_lane`: existing Mission identity, one role, and one bounded question, leaf, or lens;
- `identity`: immutable Skill root, Origin, exact input or candidate, and neutral control when used;
- `outcome_and_consumer`: the next Main decision changed by this return, the original admitted outcome
  and claimed maturity, and any independently admitted lower-maturity slice. For a lane supporting
  executable readiness or Acceptance, include the cheapest currently callable positive golden-path
  result and exact deployed candidate/runtime identity, or the precise unavailable blocker;
- `scope`: required inputs and locators, owned paths if writable, producer-to-consumer transformation
  stages and dependencies, and excluded surface;
- `risk_atom`: one affected contract or premise, refuting counterexample, preservation control, and
  consequence;
- `evidence_and_oracle`: direct evidence; actual runtime authority, verifier, and final-consumer
  identities; quality floor, reproduction, and unavailable evidence. Bind an artifact identity with
  its exact immutable content-addressed locator and verified digest. Any live-runtime claim also
  independently binds the exact native observation or consumer readback to the observed artifact or
  runtime identity; artifact existence alone is static evidence, not live authority;
- `authority_and_non_goals`: owner, write/effect boundary, prohibited actions, and no delegation;
- `return_and_budget`: exact output contract, interaction language, context/tool/token limits or
  `unavailable`, and finite Stop/fallback.

Reject the dispatch before a host effect when a required field is missing, contradictory, stale, or
filled by phrases such as `review everything`, `find any issue`, or `use your judgment`. Do not paste
an entire history, repository, diff, or log when an immutable locator and a bounded relevant excerpt
suffice. Do not repeat profile instructions in the prompt; add only task-specific facts. Main checks
that the question is decision-changing, the counterexample and preservation control traverse the
same affected stages to the real consumer, the oracle is usable by the selected role, and the
requested return is shorter than the supplied evidence. For a finite, parsed, encoded, normalized,
or mirrored representation domain, the packet binds an exact immutable content-addressed locator and
verified digest for the authoritative grammar, parser, generator, or bounded-equivalence-class source,
plus every stage that can change the representation; a mutable name or example list is not closure.
An unavailable required artifact identity, live observation/readback, verifier, or consumer identity
freezes dispatch rather than falling back to a static placeholder or prose name. Artifact-only proof
is supported only when the requested outcome and oracle are explicitly static.

A lane cannot narrow the original outcome to a static software slice to bypass a failed, pending,
differently deployed, or identity-unknown positive golden path. Dispatch supporting executable
readiness or Acceptance freezes until that path passes, unless the lane can change the exact blocker
or the user explicitly admitted the lower-maturity outcome as independently valuable. When the packet
calls a verifier or evidence source `independent`, it also binds separation across model/provider,
prompt or control lineage, evidence view, and failure authority. A repeated call through shared
authority is labeled a consistency check and cannot satisfy an independence premise.

This readiness rule does not block a pre-mutation planner, researcher, or Discovery lane before an
executable artifact or readiness claim exists. That lane binds one Frame/Plan prerequisite to making
the path callable, keeps the path and maturity unavailable, and cannot supply later readiness or
Acceptance evidence.

Before dispatch, put the exact immutable Skill root already bound for this Mission in the launch
packet. A missing, unreadable, mismatched, mutable, or candidate-controlled root freezes dispatch
before any host effect; never derive one from repository cwd, an installation convention, inherited
context, or the candidate. Apply the selected route's Stop/fallback: Main continues directly only
where that route permits; otherwise freeze the dependent decision.

One complete host dispatch is the effect; missing, ambiguous, supplemental, stale, or inherited input
after that attempt is terminal capability failure, not a retry trigger.

The selected role's configured model/effort is a route fact only when observed. Otherwise use the
authorized current main or host-default route, retain all risk controls, and mark comparison evidence
`unavailable`. Never lower quality because a preferred model is unavailable.

At terminal, record only prompt byte count and completeness, actual route/model/effort or
`unavailable`, consumer result, elapsed/token telemetry or `unavailable`, coordination/correction,
fallback, and Stop. Fan in once; ordinary progress does not become task communication or a durable
ledger.

## Role-specific outputs

`mission_planner` receives one evidenced mechanism/structural question and returns exactly:

```text
status: <not_triggered|evidence_unavailable|needs_user_alignment|frame_mismatch|mechanism_rejected|ready_for_plan_admission>
decision: <one conclusion; decisive locators>
candidate: <owner; smallest vertical slice/write surface; one decision-changing alternative or none>
dependencies: <exact prerequisites/revalidate locators or none>
verification: <real consumer; refuting and preservation oracle or unavailable>
stop: <kill and effect gates>
```

Use locators, not evidence prose, path/check inventories, state summaries, or the full DAG.

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
