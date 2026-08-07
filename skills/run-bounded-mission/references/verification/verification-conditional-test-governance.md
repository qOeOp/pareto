# Select Conditional Test Evidence

Load this reference only after test-effectiveness governance identifies a decision about executable
behavior examples, a test-first implementation loop, assertion strength, Gherkin/Step integrity, or
a test-deletion candidate. Do not load it for an ordinary Mission, a mechanical change, or a
localized regression whose authority and cheapest decisive oracle are already clear.

This reference selects evidence. It does not require BDD, TDD, mutation, or test cleanup; add a test
framework; create a traceability ledger; or authorize a Spec, test, production, or deletion change.

## Bind authority and relationships

Freeze the current intent and acceptance authority before choosing test authority. Bind the current
solution/test authority when one exists, the candidate or acceptance boundary, and the observable
consumer behavior. Treat requirements, rules, examples, tests, Steps, implementation units, and
consumer evidence as a many-to-many relationship graph:

- one rule may need several examples and tests;
- one example or test may cover several rules or implementation units;
- one implementation unit may support several behaviors;
- a Step definition may serve several scenarios without making files or names the relationship
  authority.

Record only the relations needed to explain selection and acceptance in the current Plan and evidence
prose. Do not require one requirement, Spec file, scenario, test, or code file per peer object, and do
not create a durable matrix when current locators close the relationship.

Keep a Spec immutable only after its authority and the current candidate/acceptance boundary are
frozen. If consumer evidence proves that authority wrong, return to Plan, revise the final-state Spec
and dependent evidence, and remove superseded exploration or diary material. Never preserve a known-
wrong Spec merely to keep its digest stable.

## Choose the cheapest decisive method

Start with no special method. Select one only when its observation can change the candidate or
acceptance more cheaply than the strongest alternative. Add another method only when it covers a
different unresolved risk; do not stack the rows as ceremony.

| Method | Activate only when | Decisive evidence and Stop |
| --- | --- | --- |
| BDD outer loop | shared intent or acceptance remains ambiguous, or cross-boundary user/domain behavior needs executable examples as acceptance | agreed rules and examples fail before implementation and pass through the real behavior boundary; stop when examples close the disputed behavior |
| Selective TDD inner loop | the current evidence decision asks whether test-first feedback would expose a design or boundary error in an already-admitted narrow implementation rule | select or reject that evidence route, then pass an admitted route through [agent lane routing](../orchestration/orchestration-agent-routing.md), which loads [Mission execution](../execution/execution-mission-routing-policy.md) without requiring an agent lane |
| [Targeted mutation](verification-test-corrosion-playbook.md) | tests pass but a named plausible fault could survive because assertion strength is uncertain | the bounded fault is killed or exposes a scenario/oracle gap; stop after the named risk is resolved or the method ceases to be decisive |
| [Step governance](verification-bdd-step-corrosion-playbook.md) | Gherkin and Step definitions exist or are proposed for the current behavior | the effective runner configuration gives every executable Step one intended match and no unconsumed glue; stop after semantic and runtime matching close |
| [Test GC](../optimization/optimization-test-gc-playbook.md) | test or glue cost, redundancy, obsolescence, or reachability is a current decision | authority, reachability, unique value, replacement, and runtime evidence support an owner-reviewed action; stop at a proposal when deletion safety is not closed |

When no row activates, use the normal consumer check and narrowest owner regression. Counts, coverage,
method popularity, an available tool, or a request to add tests do not activate a row.

Compare cost before selecting a row: record the minimum context needed to explain the risk, estimated
or observed runtime, expected correction loop, and resulting test-maintenance surface. A green-test
count never raises the decision quality. Prefer `none` or native regression when it closes the same
risk; BDD/TDD/mutation/GC each need an unresolved risk that the cheaper route cannot decide.

| Representative condition | Cheapest decisive selection | Stop |
| --- | --- | --- |
| contract and real consumer are clear; ordinary regression directly distinguishes the change | native regression | owner/direct-consumer result closes the behavior |
| no behavior change or test risk remains | none | do not add a method as ceremony |
| examples resolve cross-boundary domain intent | BDD outer loop | real executable examples close the ambiguity |
| an admitted narrow rule may reveal a design/boundary error through test-first feedback | selective TDD | route decision is made; it does not claim an independent oracle |
| a named fault can survive a passing scenario because its assertion is uncertain | one targeted mutation | same fault is killed or exposes the oracle gap |
| current cost/redundancy/reachability decision may remove evidence | Test GC proposal | retain evidence until authority, runtime reachability and unique value close |

## Select the outer and inner evidence conditionally

Use BDD as an outer loop only when collaborative examples clarify or decisively exercise user- or
domain-visible behavior.
Formulate scenarios in domain language around observable outcomes, not UI gestures, database state,
API plumbing, or implementation order. A scenario is acceptance evidence, not a one-to-one wrapper
around a unit test or source file.

For TDD, decide here only whether test-first feedback is relevant evidence for the current
implementation risk. If selected, treat it as the concrete execution-route question and load
[agent lane routing](../orchestration/orchestration-agent-routing.md); it may keep the work in main and loads
[Mission execution](../execution/execution-mission-routing-policy.md), which owns route prerequisites,
loop mechanics, fallback, concurrency, and closure. BDD does not imply TDD for every unit, and TDD
does not require a Gherkin outer loop.

If the requirement, Spec, test, and code disagree, repair the authority that is wrong. Do not make a
lower-authority test green by changing correct consumer behavior, and do not freeze a scenario that
consumer evidence disproves.

## Load only the selected method

After one row activates, load only its linked owner-local playbook. Keep the method question, bounded
scope, decisive observation, cost, and remaining risk in the current Plan and evidence. Do not load a
second row unless it covers a different unresolved consumer risk, and do not add a report schema or
change diary.

For BDD, retain the source/selection/result separation used by the effective runner: source fixture
and AST locators, selected executable scenarios and definitions, then individual result events. A
failed fixture, launcher, support-code load, tag/path selection, undefined Step, or ambiguity ends
before SUT; record `sut_result=not_started` instead of reporting it as red or green. Static helper
output is `declared` evidence only. A dry-load/usage run is dynamic selection evidence, while a
scenario result with its behavior oracle is separately dynamic SUT evidence.
