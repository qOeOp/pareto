# Evaluation Contract

## Authority and scope

`evals/promptfooconfig.yaml` is the only dynamic harness configuration. Promptfoo owns provider
execution, assertions, repeats, caching, thresholds, and raw result shape. Repository scripts may
prepare a disposable Skill fixture, select a suite, and launch Promptfoo; they must not implement a
second evaluator.

Public cases contain generalized or synthetic data only. Private incidents, transcripts, task
locators, business repositories, credentials, and provider receipts remain external and uncommitted.

## Suites

- `smoke`: the two `[smoke]` cases in `cases/golden.yaml`, one trial each.
- `full`: all 15 public golden cases in `cases/golden.yaml`, two trials each.
- `holdout`: the four cases in the separate `cases/holdout.yaml`, three trials each. The runner
  never loads this file for smoke/full and requires a clean Git
  commit, binds the exact commit, tree, `skills/` tree, and matrix digest into Promptfoo output, and
  rejects identity drift before accepting the result.

Changing a Skill, case, rubric, provider configuration, model, effort, permission, tool surface, or
environment invalidates only results that consume the changed input. A holdout result is never reused
after its candidate or matrix changes.

## Case design

`cases/golden.yaml` and `cases/holdout.yaml` are the only corpus authority. Descriptions carry the
suite selector; prompts express generalized consumer tasks without private repositories, task
locators, transcripts, or business content. Every case binds native Skill activation/nonactivation
plus deterministic observable receipt fields. Model-graded rubrics may be added only when semantic
quality cannot be reduced to a stable check and every provider-capable grading route is preflighted
against the exact admitted provider/model/effort authority.

The disposable repository contains one synthetic repository instruction: use the installed Skill for
non-trivial implementation or delivery, not for answer-only work. This makes repository-rule
auto-trigger a real consumer path rather than prompt prose. Promptfoo's `response.metadata.skillCalls`
is the activation observation. Current Codex SDK output does not expose a trustworthy reference-read
trace, so lazy-owner loading remains behaviorally checked while the actual read trace is recorded as
`unavailable`; model output cannot upgrade that observation.

## Trial evidence

Keep Promptfoo's raw per-trial evidence locally. A committed baseline summary may contain only:

- exact repository commit or tree and Skill digest;
- case and suite IDs;
- provider, exact model, and reasoning effort, or `unavailable`;
- pass/fail plus assertion and rubric scores;
- elapsed time and provider-reported input, output, cached-input, and reasoning tokens;
- provider-reported cost, a versioned price-source calculation, or `unavailable`;
- trial count, pass rate, mean, median, p95, and variance when repeated observations exist;
- environment and tool versions needed to reproduce the comparison.

Repository acceptance reads Promptfoo result artifacts as raw JSON and rejects duplicate object
members before normalization; exit zero never authorizes a last-wins representation.
Before any provider-capable command, the runner requires exactly one canonical provider and the exact
invoked model, reasoning effort, working directory, and read-only provider configuration. Result
acceptance requires exactly that provider identity, model, and reasoning effort; every result row
names that provider and reproduces its selected case's exact vars and assertion inventory; and every
assertion has an explicit passing component outcome. Native Skill-use assertions are replayed with
the selected case's expected vars against the row's explicit `response.metadata.skillCalls`;
artifact-controlled vars or declared component success cannot override contradictory positive or
negative oracle evidence. Row success and aggregate counts alone never authorize an evaluation result.

The runner materializes its Skill workspace only from regular tracked blobs in the exact Git
`HEAD:skills` tree. It never copies working-tree, untracked, or ignored Skill material into an
evaluation workspace; unsupported Git entry modes, invalid UTF-8 paths, normalization collisions, and
unsafe paths fail closed. The complete tree is validated before any destination write; Windows
separator, case, or resolved-target collisions also fail closed on every host.

Any committed smoke baseline has one exact representation. Its top-level keys are
`schema_version`, `suite`, `attempted_at`, `candidate`, `case_ids`, `environment`, `cells`, `result`,
and `raw_result_committed`. `candidate` contains only `commit`, `tree`, `skill_sha256`, and
`skills_tree_oid`, plus `promptfoo_config`. `promptfoo_config` contains only the historical repo-relative `path`, Git
`blob_oid`, raw-byte `sha256`, and sole parsed `provider`; `environment` contains only `node`, `npm`,
`promptfoo`, and `skills_cli`. `case_ids` must exactly match the smoke cases, and cells must exactly
match the model/effort matrix. Every cell contains `provider`, `model`, `reasoning_effort`,
`planned_trials`, `completed_trials`, `errored_trials`, and `status`, plus the following
status-dependent fields:

- `completed`: `quality`, `elapsed_ms`, `input_tokens`, `output_tokens`, `cached_input_tokens`,
  `reasoning_tokens`, and `cost`; `reason` is
  forbidden. All planned trials completed without error. `quality` contains only `passed`,
  `passed_trials`, `total_assertions`, `passed_assertions`, `assertion_score`, `rubric_score`,
  `pass_rate`, `mean`, `median`, `p95`, and `variance`. Trial counts determine `pass_rate`; assertion
  counts determine `assertion_score`; `total_assertions` equals the sum of assertions in every
  selected smoke case multiplied by `trials_per_cell`; `passed` means every trial and assertion
  passed; and `median <= p95`.
- `unavailable`: `reason` plus `quality`, `elapsed_ms`, `input_tokens`, `output_tokens`,
  `cached_input_tokens`, `reasoning_tokens`, and `cost`,
  with every evidence field exactly `unavailable`. All planned trials errored and none completed.
- `not_run`: the same fields as `unavailable`; no trial completed or errored and every evidence field
  is exactly `unavailable`.

Unknown, missing, or status-forbidden fields fail validation. `result` is `completed` only when every
cell completed; otherwise it is `unavailable` and at least one cell must have status `unavailable`.
Duplicate raw JSON object members fail before normalization. Every cell provider must equal the sole
provider parsed from the recorded historical Promptfoo blob, not the mutable working-tree config.
The recorded historical candidate must exist in the current repository history, resolve to the
recorded tree and complete `skills/` tree, predate or equal `attempted_at`, expose exactly the recorded
Skill names, reproduce every recorded `SKILL.md` SHA-256 digest, and expose the recorded config path
as the recorded blob and raw-byte digest.

Static repository validation proves referential and causal consistency among committed Git objects
and the baseline representation. It does not prove that the provider actually ran, provide
tamper-proof external attestation, or make the repository history an immutable service.

Never estimate a missing provider field or expose a local absolute path, credential, thread/session
identifier, private source locator, prompt cache, or raw transcript in a committed baseline.

## Regression rule

A route below a safety or required-behavior floor fails regardless of aggregate score. For comparable
pre/post runs, reject a change when any critical deterministic assertion regresses, holdout pass rate
falls, or semantic quality falls without an explicitly accepted tradeoff. Prefer lower latency,
tokens, cost, or effort only among routes that still pass the same quality and safety floors.

One observation proves only a reachable dynamic path. Stable model/effort guidance requires varied
cases and repeated trials; labels, folder count, or a lower numeric cost cannot supply that evidence.
