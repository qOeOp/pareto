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
- `full`: all 16 public golden cases in `cases/golden.yaml`, two trials each.
- `holdout`: the four public withheld-regression cases in the separate `cases/holdout.yaml`, three
  trials each. The runner never loads this file for smoke/full and requires a clean Git
  commit, binds the exact commit, tree, `skills/` tree, and matrix digest into Promptfoo output, and
  rejects identity drift before accepting the result. Because this file is committed and readable by
  candidate authors, it is not a blind holdout. Blind-holdout evidence and the corresponding 9.5
  completion claim remain `unavailable`; this repository does not create a second private runtime or
  state authority to simulate one.

Changing a Skill, case, rubric, provider configuration, model, effort, permission, tool surface, or
environment invalidates only results that consume the changed input. A holdout result is never reused
after its candidate or matrix changes.

## Case design

`cases/golden.yaml` and `cases/holdout.yaml` are the only corpus authority. Descriptions carry the
suite selector; prompts express generalized consumer tasks without private repositories, task
locators, transcripts, or business content. Every case binds deterministic text behavior plus an
out-of-prompt observation contract in `metadata.observations`. Model-graded rubrics may be added only when semantic
quality cannot be reduced to a stable check and every provider-capable grading route is preflighted
against the exact admitted provider/model/effort authority.

The disposable repository contains one synthetic repository instruction: use the installed Skill for
non-trivial implementation or delivery, not for answer-only work. This makes repository-rule
auto-trigger a real consumer path rather than prompt prose. Promptfoo `0.122.0` derives
`response.metadata.skillCalls` heuristically from a successful `command_execution` whose command text
contains a recognized `SKILL.md` path; each entry has `source: heuristic`. Result admission replays
that derivation from `response.raw.items` and rejects disagreement, but classifies the evidence only
as `dynamic_heuristic`. It is not a host-native route receipt, can miss activation that does not emit
such a command, and cannot by itself prove stable activation. Current Codex SDK output does not expose
trustworthy native Task, Goal, compaction, GitHub, evaluator, or reference-read state. Each affected
case records that mechanism axis as `unavailable`; deterministic answer text remains a
`deterministic_text` behavioral oracle and cannot upgrade an unavailable runtime observation.

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
invoked model, reasoning effort, working directory, and read-only provider configuration. Promptfoo
redacts the working-directory value in exported JSON; result acceptance requires that exact redaction
marker plus the invoked provider identity, model, reasoning effort, and all remaining safety fields. Every result row
names that provider and reproduces its selected case's exact vars and assertion inventory; and every
assertion has an explicit passing component outcome. Heuristic Skill-use assertions are replayed with
the selected case's expected vars against `response.metadata.skillCalls`, and those calls must exactly
match successful Skill-path `command_execution` items parsed from duplicate-safe `response.raw` JSON;
artifact-controlled vars or declared component success cannot override contradictory positive or
negative oracle evidence. Required replayable item classes and unavailable mechanism axes are bound
per case outside the prompt. The production assertion engine recomputes every deterministic assertion
from `response.output`; artifact-declared component success is non-authorizing. A successful raw turn
must match the current Codex SDK's exact completed item union, contain unique ordered item IDs, terminal
status and exit evidence where defined, and end in the agent message that equals the response. Unknown,
partial, in-progress, or reordered terminal items fail closed. Raw items do not expose Hub fan-in,
dependency release, Goal state, or native Task state, so cases about those mechanisms remain
behavioral text plus `unavailable` runtime axes and require an external real-session trace for stronger
claims. The first raw user message must equal the selected case's exact `vars.prompt`; a successful row
must contain no raw `error` item; and repeated trials must carry distinct raw-turn receipts with
provider-produced item IDs that are disjoint across rows. Row success and aggregate counts alone never
authorize an evaluation result.

The runner materializes its Skill workspace only from regular tracked blobs in the exact Git
`HEAD:skills` tree. It never copies working-tree, untracked, or ignored Skill material into an
evaluation workspace; unsupported Git entry modes, invalid UTF-8 paths, normalization collisions, and
unsafe paths fail closed. The complete tree is validated before any destination write; Windows
separator, case, or resolved-target collisions also fail closed on every host.

The repository may contain zero committed smoke baselines. That is an explicit no-dynamic-evidence
state: it makes no quality, provider-execution, or regression claim. A baseline whose candidate can
no longer be reconstructed from the committed repository is removed rather than translated onto a
different commit or treated as a current-main run.

Any committed smoke baseline has one exact representation. Its top-level keys are
`schema_version`, `suite`, `attempted_at`, `candidate`, `case_ids`, `environment`, `cells`, `result`,
and `raw_result_committed`. `candidate` contains only `commit`, `tree`, `skill_sha256`, and
`skills_tree_oid`, plus `promptfoo_config`. `promptfoo_config` contains only the historical repo-relative `path`, Git
`blob_oid`, raw-byte `sha256`, and sole parsed `provider`; `environment` contains only `node`, `npm`,
`promptfoo`, and `skills_cli`. `case_ids` must exactly match the smoke cases, and cells must exactly
match the model/effort matrix. A `YYYY-MM-DD-smoke.json` filename must match `attempted_at`'s UTC
date, so there is intentionally at most one committed smoke baseline per UTC day. Every cell contains `provider`, `model`, `reasoning_effort`,
`planned_trials`, `completed_trials`, `errored_trials`, and `status`, plus the following
status-dependent fields:

- `completed`: rejected. The repository has no committed producer that binds a baseline to
  replayable per-row provider assertion evidence. A handwritten summary, digest, or raw ignored
  artifact is not such evidence. The existing runner can create ignored raw artifacts but cannot
  produce an admissible committed completed baseline; that producer capability remains unavailable.
- `unavailable`: `reason` plus `quality`, `elapsed_ms`, `input_tokens`, `output_tokens`,
  `cached_input_tokens`, `reasoning_tokens`, and `cost`,
  with every evidence field exactly `unavailable`. All planned trials errored and none completed.
- `not_run`: the same fields as `unavailable`; no trial completed or errored and every evidence field
  is exactly `unavailable`.

Unknown, missing, or status-forbidden fields fail validation. `result` must be `unavailable` and at
least one cell must have status `unavailable`.
Duplicate raw JSON object members fail before normalization. Every cell provider must equal the sole
provider parsed from the recorded historical Promptfoo blob, not the mutable working-tree config.
The recorded historical candidate must exist in the current repository history, resolve to the
recorded tree and complete `skills/` tree, predate or equal `attempted_at`, expose exactly the recorded
Skill names, reproduce every recorded `SKILL.md` SHA-256 digest, and expose the recorded config path
as the recorded blob and raw-byte digest. Its smoke cases and model/effort matrix are loaded from that
same candidate commit, never from the mutable current checkout.

Static repository validation proves referential and causal consistency among committed Git objects
and the baseline representation. It does not prove that the provider actually ran, provide
tamper-proof external attestation, or make the repository history an immutable service.

The validator accepts no `evals/baselines/` directory or an empty one. It inventories and reads every
present `100644` `YYYY-MM-DD-smoke.json` only from the exact `HEAD` Git tree, in deterministic path
order. Before consumption it independently rejects HEAD-to-index drift, index-to-working-tree drift,
index flags or aliases (including assume-unchanged and skip-worktree), and untracked material under
`evals/baselines/`. Every Git consumer runs from the repository root derived from the validator script
and clears inherited Git directory, worktree, index, common-directory, object-store, and config/pathspec
selectors, so caller environment cannot redirect that authority. Ignored material is not read by that consumer. A future committed baseline
therefore still needs its own reconstructable candidate and a committed replayable producer receipt;
it cannot borrow an unreachable pull-request object or an ignored raw result from an earlier run.

Never estimate a missing provider field or expose a local absolute path, credential, thread/session
identifier, private source locator, prompt cache, or raw transcript in a committed baseline.

## Regression rule

A route below a safety or required-behavior floor fails regardless of aggregate score. For comparable
pre/post runs, reject a change when any critical deterministic assertion regresses, public
withheld-regression pass rate
falls, or semantic quality falls without an explicitly accepted tradeoff. Prefer lower latency,
tokens, cost, or effort only among routes that still pass the same quality and safety floors.

One observation proves only a reachable dynamic path. Stable model/effort guidance requires varied
cases and repeated trials; labels, folder count, or a lower numeric cost cannot supply that evidence.
