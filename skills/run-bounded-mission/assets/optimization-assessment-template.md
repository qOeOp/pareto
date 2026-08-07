# Mission Assessment Matrix

```text
Assessment object: <system, capability set, optimization, or integrated Mission graph>
Assessment consumer and decision: <who uses this matrix; what decision it can change>
Origin: <exact commit, complete local candidate locator, or other immutable baseline>
Included modules/capabilities: <bounded inventory>
Excluded scope: <explicit non-goals>
Activation predicate: <exact canonical SKILL.md branch and decision-changing fact>
Rubric status: baseline_frozen | post_assessment
Comparison control: <baseline/final candidate locators; frozen scenarios, consumer, model,
  permissions, tools, environment, and evidence capture; each observed or proved irrelevant>
```

## Frozen baseline

| Dimension | Consumer/property | Weight + rationale | Critical floor | Baseline score | Evidence maturity | Direct evidence | Root gap | Observable target |
| --- | --- | --- | ---: | ---: | --- | --- | --- | --- |
| <decision-relevant dimension> | <consumer or property> | <non-zero; total 100; decision-backed reason> | <numeric or none> | <0-10> | <contradicted/declared/reachable/dynamic/stable> | <exact locator and observation> | <one causal gap> | <falsifiable target> |

Weighted baseline: `<sum(weight × score) / 100, one decimal>`

Critical floor breaches: `<dimensions whose frozen floor is breached, independent of the average>`

Scenario coverage: `<for trigger/routing dimensions: intended activation, near-miss non-activation,
negative/failure, and recovery cases>`

| Cost surface | Baseline value | Evidence status | Locator or method |
| --- | ---: | --- | --- |
| Always-loaded context | <characters or tokens> | <observed/estimated/unavailable> | <source or method> |
| Conditional context | <characters or tokens> | <observed/estimated/unavailable> | <source or method> |
| Lane packet copies and coordination events | <value> | <observed/estimated/unavailable> | <trace or method> |
| Elapsed time | <duration> | <observed/estimated/unavailable> | <trace or method> |

## Same-rubric reassessment

Final candidate: `<exact single candidate, complete terminal candidate set, canonical integrated head,
or not applicable for a baseline-only request>`

| Dimension | Weight + rationale | Critical floor | Baseline | Final | Delta | Comparable | Maturity change | New direct evidence | Remaining gap |
| --- | --- | ---: | ---: | ---: | ---: | --- | --- | --- | --- |
| <same frozen dimension> | <same frozen weight + reason> | <same floor or none> | <score> | <score> | <signed delta or not comparable> | <yes/no + changed or unavailable control> | <before → after> | <exact locator and observation> | <one remaining gap or none> |

Weighted final: `<one decimal>`

Weighted delta: `<signed one decimal only when every non-zero-weight row is comparable; otherwise not comparable>`

Regressions and critical floors: `<do not hide behind the weighted total>`

Final context/coordination cost: `<same cost surfaces and observed/estimated status>`

Newly discovered dimensions: `<reported without a retrospective baseline score or weight>`

## Evidence verdict and priorities

- Dynamically proved: `<dimensions and locators>`
- Structurally reachable only: `<dimensions and missing dynamic evidence>`
- Unproved or contradicted: `<dimensions and evidence>`
- Highest-value next gaps: `<smallest evidence-backed priorities; no automatic task creation>`
- Limits: `<coverage, environment, authority, and confidence limits>`
