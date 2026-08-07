# Govern Test Effectiveness

Load this reference only when a test failure can change the candidate, an escaped defect demonstrates
that existing tests missed required behavior, or the Mission may restructure tests. It governs the
decision; it is not another test runner, coverage gate, mutation platform, ledger, or acceptance
authority.

## Resolve authority first

Use this order:

1. frozen user outcome and current product/runtime contract;
2. behavior observed through the real production consumer;
3. owner contract and compatible cross-owner boundary;
4. tests and their fixtures, mocks, snapshots, and implementation assumptions.

Tests are evidence, not the final judge. Before changing production code for a red test, identify the
behavior the test claims, the contract or consumer evidence that authorizes it, and the failure class.
If the test contradicts a higher-authority contract or consumer, preserve production behavior and
revise, replace, lower, or nominate the test for deletion. If authority remains ambiguous, return to
Plan; do not make the code green by weakening required behavior.

## Classify the signal

Choose exactly one class when evidence supports it; otherwise record the classification as unresolved
and investigate:

| Machine value | Meaning | Default route |
| --- | --- | --- |
| `real_behavior_regression` | required consumer behavior regressed | fix production behavior and retain a behavior-level oracle |
| `outdated_contract_or_assertion` | test encodes a superseded contract or assertion | replace or delete the obsolete evidence |
| `implementation_coupled_change_detector` | test mirrors call shape, order, private structure, or code transformation without proving behavior | replace with a public behavior oracle or delete if it has no unique value |
| `scenario_gap` | the relevant state, boundary, or sequence was never exercised | strengthen the narrowest authoritative layer |
| `oracle_assertion_gap` | the scenario ran but assertions could not distinguish correct from faulty behavior | strengthen or replace the oracle |
| `selection_or_routing_gap` | the test or gate did not select the affected owner, consumer, or path | repair selection at the existing routing owner |
| `mock_or_fake_isolation_distortion` | a double diverged from the real boundary or hid integration behavior | replace with contract/integration evidence or a faithful fake |
| `environment_concurrency_or_time_gap` | environment, ordering, concurrency, clock, or timing behavior was absent | exercise the missing boundary without weakening deterministic lower tests |
| `flake_or_infrastructure` | the signal is nondeterministic or the harness/infrastructure failed | isolate and repair the signal; never reinterpret it as a product regression without evidence |

## Route the repair decision

After classification, load [test corrosion](verification-test-corrosion-playbook.md) only when the
current decision must repair test selection, scenario coverage, a boundary, a double, or an oracle.
It owns the escaped-defect review, repair actions, bounded targeted-mutation method, anti-patterns,
and repair verification. Keep classification here; do not copy it into the playbook.

## Select conditional test evidence

Load [Conditional test governance](verification-conditional-test-governance.md) only when the
current decision depends on executable behavior examples, a test-first implementation loop,
assertion-strength falsification, Gherkin/Step integrity, or a test-deletion candidate. Do not load it
for an ordinary Mission whose authoritative behavior and cheapest decisive oracle are already clear.
It selects among those capabilities; it does not make any of them a default stack.

## Produce read-only evidence

Use the deterministic helper only with immutable Git revisions:

```bash
bun .agents/skills/run-bounded-mission/scripts/test-effectiveness-audit.ts \
  --origin <full-origin-commit-hash> \
  --candidate <full-candidate-commit-hash> \
  --owner-root <repository-relative-owner> \
  [--owner-root <repository-relative-owner> ...] \
  [--scope <repository-relative-owner>] \
  [--classification <machine-value>] \
  [--bdd-root <repository-relative-bdd-corpus>]
```

Both revision arguments must be complete 40- or 64-character lowercase Git commit hashes; symbolic
refs, abbreviated hashes, and revision expressions fail closed. The Agent derives canonical owner
roots from authority at both revisions and passes their union; `--scope` only narrows changed paths.
The helper reads immutable Git source and metadata and emits one JSON evidence document. It never
runs tests or mutation, writes files, infers coverage, or declares deletion safe. Treat its importer,
duplication, size, mock, timing, and concurrency signals as leads. Parse gaps set
`import_analysis.status=incomplete`; affected non-JavaScript/TypeScript source inputs recognized
by extension or a conventional `src`/`proto` location do the same with reason
`unsupported_language`; missing or dynamic evidence stays unresolved, and
`no_direct_static_candidate_evidence` does not mean no tests exist. The helper does not recommend an
action or authorize a Test Refactor Mission.

When `--bdd-root` is present, `bdd_step_evidence` is a bounded lexical candidate-tree observation for
a feature/Step corpus. Its fixture/glue encoding is `valid_utf8` only after fatal decoding; malformed
source fails the helper closed rather than yielding lossy text. Its `parser_coverage.status=incomplete`
means every used, unused, undefined,
ambiguous, overlapping, universal, and parameter-soup value is an explicitly named unverified lead,
not a complete static classification. Its `pre_sut` fields are deliberately
separate from `sut_result`: failed fixture creation, support-code loading, runner launch, or effective
selection is `pre_sut_failed` with `sut_result=not_started`, never a SUT pass or SUT failure. The
helper does not launch a runner, apply custom parameter types, or infer dynamic loading; its launcher
and SUT result therefore remain unavailable/not observed until the real consumer provides them.

Use the four evidence locations without collapsing them into a green count:

| Location | Minimum record | It can prove | It cannot prove |
| --- | --- | --- | --- |
| fixture | source, version, encoding, intended scenario | declared input | selected, loaded, or executed behavior |
| launcher | executable argv/configuration and exit | the runner started or failed before SUT | scenario result when selection never completed |
| selection | effective feature, Step, tag/path and dry-load/usage result | what the runner attempted and matching defects | SUT behavior without a result event |
| SUT result | scenario/test identity, outcome, oracle and direct consumer | the named behavior result | fixture/launcher health beyond its observation |

Record each as `declared`, `reachable`, `dynamic`, `stable`, or `unavailable` independently. A
pre-SUT failure is a selection/launcher signal, not a behavior classification; resolve it before
calling the test red or green. The helper's lexical BDD findings are candidates for the real runner's
dry-load and usage evidence, never permission to change glue or production code. Localization,
Scenario Outlines, aliases, dynamic registration, custom parameters, comments, strings, and
non-JavaScript/TypeScript glue remain Unknown unless the effective runner closes them.

When the evidence instead supports suite-wide redundancy, obsolescence, layering, or deletion
pressure, route the optimizer to [Test GC](../optimization/optimization-test-gc-playbook.md). A
separate Test Refactor Mission still requires the existing
[Refactor Mission proposal](../optimization/optimization-refactor-workflow.md) predicate, consent, and
dispatch authority; neither this policy nor either playbook creates it.
