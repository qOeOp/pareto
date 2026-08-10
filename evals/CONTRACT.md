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
`response.metadata.skillCalls` heuristically from a limited set of legacy Skill roots that excludes the
production `$HOME/.agents/skills` root. The runner therefore removes Promptfoo's `skill-used` assertions
from its in-memory runtime case projection and replays activation directly from successful
`response.raw.items` commands against the exact installed root after Promptfoo returns. Runtime cases
and configuration are passed through Promptfoo's programmatic evaluator and are not written into the
evaluated workspace, so the subject receives the prompt but not a colocated oracle file. The committed
case metadata remains the activation oracle and the remaining deterministic assertions stay owned by
Promptfoo. This evidence is classified only as `dynamic_heuristic`; it is not a host-native route receipt and can miss activation that does not emit
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
redacts the working-directory and explicit `HOME`/`CODEX_HOME` values in exported JSON; result acceptance
requires those exact redaction markers plus the invoked provider identity, model, reasoning effort, and all remaining safety fields. Every result row
names that provider and reproduces its selected case's exact vars and assertion inventory; and every
assertion has an explicit passing component outcome. Skill activation is replayed against successful
Skill-path `command_execution` items parsed from duplicate-safe `response.raw` JSON; Promptfoo's
incomplete `skillCalls` metadata is not an authority. Artifact-controlled vars or declared component
success cannot override contradictory positive or negative activation evidence. Required replayable
item classes and unavailable mechanism axes are bound
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

The runner invokes the production installer against an exact clean `HEAD` and directs its user-level
Skill and four custom-agent profiles into disposable `HOME` and `CODEX_HOME` roots passed through the
Codex provider's explicit `cli_env`. It does not install a project-local `.agents/skills` fixture.
Before Promptfoo is imported, the runner also binds `PROMPTFOO_CONFIG_DIR` to the disposable evaluation
root, sets the vendor telemetry/update flags, and installs an exact hostname guard that rejects all
`promptfoo.app` network traffic while leaving the model provider route untouched. This closes
Promptfoo `0.122.0`'s otherwise unconditional anonymous "telemetry disabled" request. Accepted results
require `author: null`, so ambient Promptfoo account or cloud identity cannot enter the evidence artifact.
The installer performs byte-exact post-install verification before Codex starts, and the runner repeats
that check. Repository-owned Git
calls derive their root explicitly and clear inherited `GIT_*` selectors case-insensitively, including the disposable
workspace initialization, installer lock verification, and delivery receipt identity checks, so caller environment
cannot redirect repository authority.

## Committed comparisons

`evals/baselines/` may be absent or an empty real directory. The validator rejects any indexed file,
workspace entry, ignored entry, subdirectory, non-directory, or symlink there. Its index query starts
from the repository root derived from the validator and clears inherited `GIT_*` selectors
case-insensitively.

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

## Atomic capability scoring

`evals/capabilities.json` is the sole fine-grained capability inventory. Each leaf has one owner,
real consumer, equal default weight, and an explicit critical-floor classification. The deterministic
scorer reports both the weighted aggregate and the minimum leaf score. Completion requires both to be
at least 9.5 and every critical leaf to pass; no weight, domain aggregate, or unrelated strong leaf may
hide a weaker capability.

The scorer consumes content-addressed raw Codex rollout JSONL, not agent-authored numeric scores. Duplicate
members, stale catalog identity, duplicate trials, unknown leaves, self-described independent review,
artifact drift, failed observations, and material or critical gaps fail closed. Source adapters derive
session/parent identities, terminal task and token receipts, tool execution for deterministic replay,
the exact candidate-bound capability result, unavailable evidence, gaps, and mutation observation from
the raw trace. Independent review must be a native subagent rollout. Plain files or evidence fields
cannot unlock the 9.5 anchor. Local rollout files are writable by the same host and therefore cannot
prove their own completeness or authenticity. They are capped at 2 even when their internal shape is
consistent; the assessor does not publish a higher "observed" score from author-controlled oracle text.
The 9.5 anchor remains unavailable until Codex exposes a provider-attested complete attempt
inventory with a repository verifier; the scorer rejects manifests that pretend this authority exists.

The CLI is an explicit operator gate, not a host Goal integration: it exits nonzero for every report
whose minimum leaf is below 9.5. The candidate repository must match the scorer checkout's exact origin;
its commit must be the clean checkout `HEAD`, its tree must resolve exactly, and its committed catalog
blob must equal the catalog being scored. The catalog is the checked-in 39-leaf authority; callers
cannot substitute a smaller catalog. An explicit unavailable attempt is non-authorizing, and an
unavailable provider inventory is reported as the global evidence limit rather than hidden by selected
passes.

`scripts/capability-score.mjs` is an assessor, not a result producer, trace store, benchmark scheduler,
or capability repair owner. Raw private traces remain external. A published assessment may contain
only content digests, generalized capability IDs, scores derived by this assessor, explicit gaps, and
the exact candidate/catalog identities.

## Regression rule

A route below a safety or required-behavior floor fails regardless of aggregate score. For comparable
pre/post runs, reject a change when any critical deterministic assertion regresses, public
withheld-regression pass rate
falls, or semantic quality falls without an explicitly accepted tradeoff. Prefer lower latency,
tokens, cost, or effort only among routes that still pass the same quality and safety floors.

One observation proves only a reachable dynamic path. Stable model/effort guidance requires varied
cases and repeated trials; labels, folder count, or a lower numeric cost cannot supply that evidence.
