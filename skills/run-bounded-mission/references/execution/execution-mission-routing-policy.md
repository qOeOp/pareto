# Route Mission Execution

Load this reference when [agent lane routing](../orchestration/orchestration-agent-routing.md) prepares
its required pre-dispatch receipt, admits build work or model/effort comparison, or when an activated
assessment compares execution routes. It supplies the detailed operational criteria for quality
floors, route evidence, candidate-local implementation, selective TDD, frozen mechanical leaves, and
empirical model/effort comparison on those activated paths. The
kernel remains the execution, coordination-cost, and verification-evidence authority; agent routing
remains the lane authority; reviewer handoff remains the evaluator authority. This reference cannot
replace their rules or own Mission lifecycle, user-visible model authority, acceptance, or effects.

Choose a route from the unresolved work and its consequence, not from task size, model availability,
quota, or a permanent work-class table. Keep the main agent as the one semantic writer and decision
owner. A builder may return a bounded diff only after Plan freezes owner, exact paths, affected
boundary, candidate shape, oracle, and Stop.

## Project evidence before dispatch

For every route receipt, freeze the cheapest decisive quality floor before comparing latency, tokens,
or quota. It includes consumer success, required evidence completeness, the route-specific oracle,
and every applicable safety, permission, authority, and effect invariant. Reject a route that misses
any floor. Missing telemetry invalidates only the comparison that consumes it; keep the current
authorized main or host-default route and required controls, and record the alternative and metric as
`unavailable` rather than blocking unrelated work.

Project the evidence maturity owned by
[assessment](../optimization/optimization-mission-assessment.md): `contradicted`, `declared`,
`reachable`, `dynamic`, or `stable`. Use `unavailable` only when the evidence needed to classify the
route is absent. A configured role, model label, or static call path cannot exceed `reachable`; one
causally bound successful terminal can reach `dynamic`; `stable` requires representative positive,
negative, and recovery scenarios to support the route repeatedly. Record quality benefit separately
and only as `observed` when a
quality-floor-passing paired comparison shows the relevant Pareto improvement. Otherwise it is
`unproved` or `unavailable`.

The pre-dispatch projection records the evidence available for the decision, never the result it
hopes to obtain. At terminal, replace its evidence line with the actual route, observed model and
reasoning effort or `unavailable`, elapsed and exposed token telemetry or `unavailable`, coordination,
correction and recheck work, fallback, quality-floor result, and justified maturity change. Do not
send partial telemetry as progress or retain the receipt outside the current conversation, task
terminal, or activated assessment.

## Keep implementation candidate-local

Implement the smallest coherent slice that reaches the real consumer. Use a direct main-agent edit
when the change is obvious or when serializing, launching, reloading context, rechecking the candidate,
and inspecting a return would cost at least as much as the work.

Use a selective TDD inner loop only when all of these facts hold:

- the behavior and oracle are already admitted, so a failing check cannot choose product semantics;
- a fast focused check can fail for the intended reason before implementation and pass afterward;
- the check exercises a maintained consumer or contract instead of prompt wording or implementation
  trivia;
- the loop shortens correction feedback enough to repay test authoring and maintenance.

TDD remains inside Execute. It cannot freeze requirements, admit a Plan, replace end-to-end consumer
evidence, or require every Mission to add a test. Use direct implementation plus the existing oracle
when the change is declarative, mechanical, already covered, or cheaper to verify after the edit.
Follow the verification test-integrity owner when a failure can change the candidate or a test is
added, restructured, or removed.

Apply the kernel's concurrency and evidence-invalidating rules when executing the selected route.
Keep dependent steps sequential. Release independent reads, non-overlapping build leaves, root checks,
and audits from immutable inputs as soon as their prerequisites exist. Give overlapping files one
writer, freeze one integrated candidate, and fan in once. A lane may not consume sibling output unless
that dependency was admitted; do not repeat summaries or rerun an unaffected gate to create progress.

## Qualify a frozen Spark leaf

Use the repository's `fast_builder` only for a genuine deterministic, low-risk mechanical leaf. The
packet must freeze the immutable Origin, exact paths, owner, affected boundary, replacement or
transformation shape, acceptance commands, one writer, and Stop. No design, wording, authority,
safety, secrets, schema, public-contract, dependency, concurrency, authentication, live-write, or
external-effect decision may remain.

For a revision leaf, main first reproduces the material finding, classifies it as candidate-local,
and proves that owner, path, boundary, oracle, and correction semantics are unchanged. Spark never
interprets instruction or judge semantics. It may apply exact replacement bytes to such a file only
when the packet supplies those bytes and the required independent audit remains bound.

Agent lane routing may admit Spark only when comparable observed evidence shows that mechanical
execution time or tokens saved exceed all of these costs: packet serialization, launch and reference
loading, candidate fingerprint recheck, supplied checks, main diff inspection, and any correction
needed after return.
Static role configuration, available quota, a model label, revision count, or an estimate without a
comparable observation is not proof. With no genuine qualifying leaf or comparable measurement, keep
the work in main and record Spark economics as unproved; never fabricate a typo, no-op, finding, test,
or cleanup to obtain a sample.

Agent lane routing must observe `fast_builder` on exact `gpt-5.3-codex-spark`; the TOML and this policy
are not runtime proof. It owns the one-time standard-main fallback for unavailable or mismatched
capability, ambiguity, path growth, or a failed premise. Never retry the fast lane or substitute
another fast model. Spark cannot own the five Mission stages, branch, commit, push, publish, comment,
review, resolve, deploy, schedule, trade, accept, Finalize, or cause another shared-state or live effect.

## Select model and effort from evidence

Task dispatch owns model consent for a user-visible Mission, and role files own their configured
models. This policy cannot override either. Compare model or reasoning-effort routes only when the
host exposes more than one authorized route and the decision can change a future equivalent route.

Before comparing, freeze the task distribution, consumer, quality floor, scenario inputs, Origin,
prompt and loaded references, permissions, tools, environment, evidence capture, and candidate or
expected output. Change one model/effort variable at a time. Record exact observed route identity;
host-default or hidden identity stays `unavailable`.

Measure at least:

- consumer success, required evidence completeness, and every critical quality-floor result;
- elapsed latency plus input, output, cached, and reasoning tokens when the host exposes them;
- loaded context, copied packets, dispatch/return/synthesis events, and fan-in work;
- correction, candidate recheck, regression rerun, and human or main-agent inspection cost;
- capability, transport, or route failures and the fallback actually used.

Reject every route below a quality or safety floor before comparing cost. Among the survivors, prefer
only an observed Pareto improvement for the relevant task distribution; a route wins when another
authorized route does not match or improve its quality while also matching or improving latency,
token/context, coordination, and correction cost. Treat one stochastic observation as one observation,
not a permanent ranking. A changed model version, role prompt, tool surface, repository contract, or
task distribution invalidates only the comparison that depended on it.

Do not write a permanent model table from intuition or promote the newest, largest, cheapest, or
highest-effort route by label. When comparison evidence, exact model identity, or an authorized route
is unavailable, keep the current authorized main route and required risk controls, mark alternatives
unproved, and do not silently lower effort or quality.

## Compare representative route pairs

Use the next naturally occurring, genuinely qualified instance for each row. Freeze the same Origin,
input, consumer, prompt and loaded references, permissions, tools, environment, evidence capture, and
expected output. Do not manufacture a task, typo, no-op, finding, test, or cleanup to fill a cell. A
missing specimen or host metric remains `unavailable` and does not delay unrelated work.

| Scenario | Paired routes | Quality floor | Terminal evidence |
| --- | --- | --- | --- |
| small mechanical build or revise | exact-byte main control vs qualified `fast_builder` | identical bounded diff; one writer; supplied checks; no path growth | actual route/model/effort; elapsed; tokens or `unavailable`; inspection, correction, fallback |
| bounded code leaf | current authorized main or standard builder vs one authorized alternative | public consumer and owner regressions pass; frozen boundary and effects | consumer result; latency/context; coordination; correction and recheck |
| decision-changing research | main evidence work vs one `mission_researcher` brief | decisive primary evidence, contradictions, limits, Stop, and exact Plan consequence | route identity; source reopening; elapsed/tokens; synthesis correction or fallback |
| structural planner dispute | high-reasoning main control vs one `mission_planner` proposal | owner and consumer closure, credible alternative, kill conditions, verification, and no authority transfer | proposal completeness; elapsed/tokens; coordination and main correction |
| independent evaluator audit | reviewer-selected current route vs one reviewer-authorized alternative only when available | exact candidate and complete packet binding, integrity, valid result schema, and no unowned mutation | selected set; model/effort; terminal validity; transport/fallback; correction |
| independent multi-lane work | the same fixed lanes serially vs in parallel | identical immutable inputs, lens boundaries, quality results, and one fan-in | critical-path elapsed; copied context; coordination events; conflicts and correction |

A comparison that changes the role protocol, tools, or topology measures the route package, not the
model alone. Select a model or reasoning effort only from a comparison that holds those controls fixed
and changes one authorized model/effort variable. The reviewer packet continues to select evaluator
count and lenses; this matrix records that route and never adds an evaluator. One stochastic result is
one observation, not a durable ranking or default.

Current OpenAI guidance supports this evidence shape: compare reasoning settings on representative
workloads, measure task success, completeness, evidence, tokens, latency, and cost, and count fewer
calls or turns as an improvement only after quality still passes. See [Using GPT-5.6](https://developers.openai.com/api/docs/guides/latest-model.md)
and [Evaluation best practices](https://developers.openai.com/api/docs/guides/evaluation-best-practices).

## Apply evidence decisions and close once

Use the kernel's Verify rule to decide what a candidate change invalidates. Record the source,
dependency closure, configuration, toolchain, environment, route, and decision-specific inputs that
justify reusing unchanged discovery or focused checks. Rerun the final root gate only after an
affected change or corrected failure.

Reviewer handoff alone selects zero, one, or a complementary pair of independent auditors from the
actual material risk predicates. This route schedules exactly that admitted set, never extra
evaluators for confidence, votes, or a retry loop. When the root gate and selected audit consume the
same frozen candidate and neither feeds the other, run them concurrently and fan in once.

The compact pre-dispatch receipt and its terminal update are the default observable route evidence.
When evidence assessment is activated, reuse its frozen dimensions, scenario coverage, cost surfaces,
and limits rather than creating another performance record. Otherwise retain only the terminal receipt's
observed route, quality floor, decisive cost or latency evidence, reused or invalidated evidence, and
unproved route plus fallback. Create no ledger, benchmark harness, or durable per-run history.
