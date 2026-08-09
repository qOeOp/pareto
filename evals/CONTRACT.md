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

Keep Promptfoo's raw per-trial evidence locally. The repository has no producer or consumer for a
committed evaluation summary, so it does not commit one. Dynamic result admission still binds exact
candidate, case, provider, model, reasoning effort, assertions, elapsed time, token counts, and
provider-reported cost when those fields are available.

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

## Committed comparisons

`evals/baselines/` may be absent or an empty real directory. The validator rejects any indexed file,
workspace entry, ignored entry, subdirectory, non-directory, or symlink there. Its index query starts
from the repository root derived from the validator and clears inherited `GIT_*` selectors.

Zero committed comparisons means zero durable dynamic evidence; it makes no quality, provider,
regression, model, effort, token, latency, or cost claim. `unavailable` and `not_run` remain honest
terminal outcomes, not repository evidence.

A committed comparison may return only when all of these exist together:

- a deterministic producer derived from admitted per-row raw artifacts;
- exact candidate, cases, matrix, provider, model, effort, and environment binding;
- replayable evidence for every published quality, latency, token, and cost field;
- a real downstream consumer that changes a decision from that summary;
- squash-portable provenance plus cross-platform adversarial tests.

The producer must also exclude local paths, credentials, task/session identifiers, private locators,
prompt caches, and raw transcripts. Until those consumers exist, schema and provenance machinery stay
deleted rather than preserving an unusable second evidence ledger.

## Regression rule

A route below a safety or required-behavior floor fails regardless of aggregate score. For comparable
pre/post runs, reject a change when any critical deterministic assertion regresses, public
withheld-regression pass rate
falls, or semantic quality falls without an explicitly accepted tradeoff. Prefer lower latency,
tokens, cost, or effort only among routes that still pass the same quality and safety floors.

One observation proves only a reachable dynamic path. Stable model/effort guidance requires varied
cases and repeated trials; labels, folder count, or a lower numeric cost cannot supply that evidence.
