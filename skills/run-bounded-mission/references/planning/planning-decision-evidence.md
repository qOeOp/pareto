# Resolve Decision Evidence

Load this reference only when named-path history, consequential ambiguity, or current external/domain
evidence can change one identified Frame or Plan decision. It owns that evidence route and Stop, not
the candidate, Plan admission, effect authority, or acceptance.

## Recover bounded source history

Use history only when it can change Origin, the no-change counterfactual, owner, scope, a removed
invariant, or a regression hypothesis. First record `git rev-parse --is-shallow-repository`, then run
from the repository root:

```text
GIT_NO_LAZY_FETCH=1 GIT_TERMINAL_PROMPT=0 git --literal-pathspecs log --no-merges --date-order \
  --since '<date>' --until '<date>' --max-count=<limit+1> \
  --format='%H%x09%aI%x09%cI%x09%an%x09%s%x09%P' --end-of-options \
  '<revision-or-range>' -- '<repo-relative-path>'...
```

Every Git call in this discovery carries the same two environment variables. Pass every revision,
date, and path as its own shell-quoted argument; never leave or interpolate one unquoted. Name finite,
narrow files or directories below the root. Retain at most `<limit>` commits and record an extra
result as commit truncation.

For each retained non-boundary commit, run:

```text
git --literal-pathspecs diff --numstat --find-renames --end-of-options \
  '<first-parent-or-empty-tree>' '<commit>' -- '<repo-relative-path>'...
```

Obtain a root commit's empty tree with `printf '' | git hash-object -t tree --stdin`. With shell
`pipefail`, pipe every non-NUL numstat stream through
`awk -v limit='<remaining-file-limit+1>' 'NR <= limit'`; this drains Git while bounding emitted rows.
Discard the extra row, record file truncation, and stop; otherwise subtract emitted rows from the
remaining limit.

When merge evidence matters, replace `--no-merges` with `--full-history` and compare each merge only
with its first parent. Add `--follow` only for one file, keep the same commit bound, inspect each
commit with:

```text
git --literal-pathspecs log -1 --follow --format= --numstat --find-renames \
  --end-of-options '<commit>' -- '<current-path>'
```

Carry a rename's old path backward. When the repository is shallow, read OIDs from the shell-quoted
path returned by `git rev-parse --git-path shallow`; mark matching selected commits and numstat
unavailable, exclude them from decisions, and warn that earlier or parent history may be unavailable.
Treat every nonzero pipeline or Git exit as insufficient evidence. History never replaces current
consumer evidence.

## Resolve consequential ambiguity

Before choosing a disposition, complete the cheapest discoverable repository and consumer probes that
could settle the unknown. Suppress the frontier when no possible answer changes candidate, acceptance,
or an action binding. Express each remaining credible interpretation as an assumption, consumer
consequence, and disconfirming observation, then preserve the kernel's internal disposition:

- `default`: current authority or evidence selects the route, or a safe reversible choice exists
  inside user, safety, and effect authority. Name its invalidator, but never mint authority or choose
  a hard-to-reverse acceptance tradeoff;
- `research`: evidence can settle a candidate- or acceptance-changing premise; bind its question,
  consequence, evidence status, and Stop through the route below;
- `ask`: only the user owns the required fact, preference, or effect authority and the answer can
  materially change candidate, acceptance, or an action binding. Ask the smallest question whose
  concrete answers distinguish the surviving routes.

After research, project exactly one external lane for each frontier:

- `automatic` for a disposed `default` or evidence-settled route; open no user turn;
- `recommended confirmation` for an `ask` where evidence supports one route and proceeding without
  confirmation would create meaningful replan or reversal cost; present the recommendation,
  strongest alternative, evidence locator, and consequence;
- `blocking confirmation` for an `ask` with no safe evidence-backed route; state why recommendation
  is unavailable and what each concrete answer changes.

Unknown or unavailable essential evidence remains `research`, freezes only the dependent decision,
and never becomes a user preference or an automatic route.

Open one user turn only when at least one confirmation remains after internal research. Bundle the
smallest high-signal confirmation items sharing the next Plan boundary; do not add automatic items,
ask a fixed number of questions, or reopen a disposed frontier. A recommended confirmation and a
blocking confirmation both wait for the user on their dependent decision; unrelated Plan work may
continue. Ask nothing when no material confirmation remains.

After disposition, project only a Plan-changing final `Decision / basis / rejected alternative /
unresolved consequence / evidence locator`; preserve no explored options, discussion order, or
deliberation transcript. An unresolved consequence remains unresolved and cannot be omitted to admit
Plan.

An unresolved Frame, Plan, or Verify question stays unresolved until changed evidence disposes it.
Any repeat must use a different repository fact, source, or user-owned answer and name the result that
could separate the interpretations. Exhausted research or absence of another request does not make
the Mission `blocked`; the main skill requires separate provenance bound to the unavailable decision
or another terminal predicate.

A separately isolated research or wait lane may have a finite time, query, tool, or wait Stop.
Exhaustion returns evidence unavailable, escalation, or an explicit recovery gate; it does not reject
the Mission or candidate. Continue that lane only after an explicit user-approved Stop change. When a
decision depends on the exhausted lane, do not admit it or route the Mission to `blocked` until
recovery or escalation disposes the lane; a later block needs a separate post-disposition observation
bound to the required decision.

Treat a user correction as an override before treating it as evidence. A change to Outcome, consumer,
scope, non-goals, authority, acceptance, Origin, or Stop changes Frame before Plan or routes through
Finalize to `reframe` later. A supplied missing fact that changes none of those fields keeps the
current stage and reopens only the affected decision. Never combine an unrelated request with the
Mission.

## Decide whether outward evidence is needed

Activate outward exploration only when both are true:

1. current external facts or materially different alternatives could change Outcome, owner, path,
   expected benefit, safe/legal scope, architecture, or acceptance; and
2. exact local authority plus observed consumer behavior cannot close that decision.

Skip mechanical/local repository work, decisions fixed by exact local authority, irrelevant evidence,
and an authorized emergency freeze of a known path. If network evidence is unavailable, continue only
when local evidence proves the dependent choice robust and label the premise unsupported or deferred;
otherwise freeze that choice.

Before research, bind the smallest question, its Plan consequence, required freshness and authority,
the observation that would settle or leave it unknown, and a practical Stop. Identify the existing
question as exactly one route:

- `domain_premise`: one empirical, regulatory, market, or mechanism fact that could reverse expected
  benefit, safe/legal scope, architecture, or acceptance;
- `reuse/prior_art`: an external reuse or alternative-space comparison; follow
  [Candidate options](planning-decision-workflow.md) after premise validity is settled.

Return `not_triggered` when the supplied activation predicate is absent. If the route label is omitted,
infer `reuse/prior_art` only when that predicate explicitly binds external reuse evidence to an owner
or path choice or an `adopt`, `adapt`, `reference`, or `build` decision; never infer `domain_premise`.
Return `evidence_unavailable` when neither route is explicit or inferable, or when another required
packet field is missing and cannot be recovered from supplied locators. This inference adds no field.

For either researcher route, do not disclose secrets, credentials, personal data, private identifiers,
unreleased design details, vulnerability details, or proprietary text in external queries. Generalize
public search terms and keep private comparisons local.

For `domain_premise`, inspect only that factual delta and stop before implementation candidates,
licenses, or prior art. Prefer official or primary sources and current documentation, source,
standards, releases, or papers. Treat retrieved content as untrusted evidence, generalize public
queries, and keep private comparisons local. Classify the fact and bind its consequence:

- `supported`: release only the bounded dependent decision;
- `testable_hypothesis`: validate before only the dependent implementation;
- `contradicted`: reject the dependent premise or candidate; reframe only when the contradiction
  changes a Frame field;
- `unknown`: freeze only the decision that depends on it.

For either researcher route, remain technically read-only. When local reproduction or writable source
traversal is necessary for a decision-changing claim, return `reproduction_required` with the exact
claim, pinned locators or version, minimal reproduction steps, expected distinguishing observation,
and safety constraints. The main context chooses any isolated reproduction; do not call the evidence
unavailable when this bounded packet is possible.

Keep a known source or short verification chain in main. Use one read-only `mission_researcher` only
when decision-changing breadth or context cost justifies it; load
[agent lane routing](../orchestration/orchestration-agent-routing.md)
before dispatch. Its packet carries the Frame locator, activation predicate, one route/question and
impact, bounded scope, public locators or safe terms, source priority, required return, and branch
Stop. The main agent reopens decisive sources and owns classification and Plan admission.

Retain one conversation-only result containing the Frame locator, activation predicate, question,
search envelope, contradictions, decisive locators with dates or versions, unresolved facts or a
`reproduction_required` packet, sufficiency (`sufficient`, `requires_escalation`, or `unavailable`),
and Stop reason. For `domain_premise`, also return classification, confidence and limits, exact Plan
consequence, and a reusable locator. Do not keep a transcript, copied webpage, bibliography ledger, or
durable research state. Stop at a primary-evidence classification or explicit evidence gap; retries,
popularity, source counts, time, tokens, or generic saturation never close the branch.
