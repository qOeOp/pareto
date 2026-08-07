# Repair Test Corrosion

## Activation

Load only after test-integrity classification or a QA route shows that test selection, a scenario,
boundary, double, environment, or oracle cannot distinguish required behavior. Also load for one
bounded targeted-mutation question. Route suite-wide deletion pressure to Test GC and Gherkin glue to
the BDD Step playbook instead.

## Evidence

Freeze current intent and contract authority, the real consumer, production path, affected tests,
selection configuration, baseline result, and the escaped or plausible fault. For an escaped defect,
identify the layer that should have caught it, the blind spot, adjacent faults sharing that blind spot,
an existing test that can be strengthened or replaced, and any evidence made redundant. Keep missing
answers explicit.

## Taxonomy

Use the classification already selected by `verification-test-integrity-policy`: behavior regression,
outdated assertion, implementation coupling, scenario gap, oracle gap, selection/routing gap,
mock/fake distortion, environment/concurrency/time gap, or flake/infrastructure. Do not invent a
second classification. A passing test with an unproved oracle remains unresolved.

## Decision

Choose `keep`, `strengthen`, `replace`, `lower_layer`, `delete_candidate`, or
`further_investigation`. Fix production behavior only for a real behavior regression. Prefer
strengthening or replacing an existing maintained oracle over adding another test. Use targeted
mutation only when a named plausible fault can change the decision more cheaply than the strongest
alternative.

## Repair

Exercise the narrowest authoritative consumer and repair the classified blind spot. For targeted
mutation, require a bounded production path and fault operator, a passing unchanged baseline, exact
candidate restoration, acceptable runtime/review cost, and a surviving mutant that would change the
test or candidate decision. Use an existing compatible tool; otherwise use one exact reversible
manual fault and restore the candidate immediately. A killed mutant supports only the named fault; a
survivor requires an oracle, scenario, or selection repair.

For an assertion-strength question, use the same reversible fault against two otherwise identical
representative assertions: a survivor is evidence that the weak oracle did not distinguish that
fault; a kill after strengthening is evidence only for that named fault. Preserve baseline result,
fault bytes, selection identity, elapsed cost, and exact restoration. Compile errors, timeouts,
no-coverage, changed fixture/launcher selection, and runner startup failures are neither kills nor
SUT results; retain them as unavailable/pre-SUT evidence and use ordinary regression for environment
or integration behavior.

## Anti-pattern

Do not conclude “one bug, one test,” change correct production behavior for a lower-authority test,
assert private structure instead of behavior, or preserve a distorted double. Do not mutate the whole
repository, chase a global score, retain temporary faults, or count timeout, compile failure, runtime
error, or equivalent mutants as kills. Never delete from helper, coverage, count, or mutation output.

## Verification

Run the original escaped or plausible fault scenario, the repaired oracle, affected owner and direct-
consumer regressions, and the real selection configuration. For mutation, record baseline, operator,
scope, result, cost, remaining risk, and exact clean-candidate restoration. Inspect the diff for
implementation coupling or weakened assertions, then run the final root gate. Keep unsupported or
ambiguous faults unresolved.
