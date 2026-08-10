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
- `full`: all 19 public golden cases in `cases/golden.yaml`, two trials each.
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
locators, transcripts, or business content. Every case binds exactly one primary capability, scenario,
stable case ID, deterministic text behavior, and an out-of-prompt observation contract in
`metadata.observations`. One case never upgrades unrelated leaves. Model-graded rubrics may be added only when semantic
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
such a command, and cannot by itself prove stable activation. Current Codex app-server exposes
version-bound read-only thread, turn, and Goal snapshots. The `scripts/native-evidence.mjs` probe consumes
`initialize`, `thread/read`, `thread/turns/list`, and `thread/goal/get` over fixed stdio. It exhausts turn
pagination and accepts an exact one-turn task only when the named completed full turn's user prompt matches one
committed case, the terminal natural-language output passes that case's deterministic assertions, the
observed raw item types satisfy its requirements, and the command-path Skill-use heuristic matches its
activation oracle. The only admitted action item is one successful, structurally parsed, unchained read
of the installed Skill file; MCP, dynamic, mutating, nested-agent, error, context-compaction, unknown,
partial, in-progress, and failed items are rejected. Its terminal state remains in the receipt for scorer replay.
The probe derives the clean capability result from the committed case and exact clean
checkout; it never accepts an Agent-authored pass result. The scorer recomputes the receipt's prompt,
assertion inventory, activation expectation, and canonical-result summaries from the committed case;
terminal output and item identities remain digested. The receipt also binds the exact thread, Goal expectation, executable digest, and server version. It emits no raw
objective, path, source detail, or transcript; the scorer accepts a passing `native_trace` only through
this receipt. Command-path activation remains a local heuristic, not proof of host-native Skill routing.
This is a local-interface observation, not host attestation: an operator can still alter
or omit it, and the interface does not prove that a spawned task inherited no parent context. It therefore
cannot prove a complete attempt inventory, independent context, or unlock 9.5. Current Codex
SDK output still does not expose trustworthy compaction, GitHub, evaluator, reference-read, or
complete-attempt state. Each affected case records that mechanism axis as `unavailable`; deterministic answer text remains a
`deterministic_text` behavioral oracle and cannot upgrade an unavailable runtime observation.

## Trial evidence

Keep Promptfoo's raw per-trial evidence locally. The repository has no producer or consumer for a
committed evaluation summary, so it does not commit one. Dynamic result admission still binds exact
candidate, case, provider, model, reasoning effort, assertions, elapsed time, token counts, and
provider-reported cost when those fields are available.

After the complete result passes validation, the same runner writes one scorer-ready local evidence
manifest beside it. The manifest is derived from validated rows and committed case bindings; an
operator does not reconstruct capability, trial, principal, or digest fields. The scorer still
revalidates the referenced raw artifact and caches that validation once per artifact identity.

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

The scorer consumes content-addressed raw evidence, not agent-authored numeric scores. Deterministic
replay accepts only a complete Promptfoo artifact that passes the production row, assertion, raw-turn,
activation, candidate, suite, provider, model, and effort validator; the committed case supplies its
sole capability/scenario identity. Every evidence source must name one committed case with the same
capability and scenario; invented case labels cannot populate uncovered leaves. Native state uses the app-server receipt. Independent review uses a
native subagent rollout and Main-authored final JSON cannot substitute for deterministic replay.
Duplicate members, stale catalog or candidate identity, duplicate trials, unknown leaves,
self-described independent review, artifact drift, failed observations, and material or critical gaps
fail closed. Plain files or evidence fields cannot unlock the 9.5 anchor. Local artifacts are writable by the same host and therefore cannot
prove their own completeness or authenticity. They are capped at 2 even when their internal shape is
consistent; the assessor does not publish a higher "observed" score from author-controlled oracle text.
The 9.5 anchor remains unavailable until Codex exposes a provider-attested complete attempt
inventory with a repository verifier; the scorer rejects manifests that pretend this authority exists.

The local assessor does not derive representative coverage from writable trial, environment, or
reviewer labels. Those requirements remain unavailable until an external attempt authority can enforce them.

Deterministic runtime capabilities may use a fixed observer instead of a model text oracle. The
observer must execute the real consumer against one exact canonical-main subject, fail closed on its
positive, negative, and recovery matrix, and aggregate every prescribed environment before signing.
GitHub-hosted execution becomes external evidence only through an offline-verifiable Sigstore bundle
bound to the exact signer workflow and digest; a CI status, uploaded JSON, custom predicate, or
candidate-controlled workflow is not sufficient. The first observer candidate is bootstrap evidence
only and cannot raise a score. A later scorer candidate may consume a real bundle only after the
observer is canonical, independently reviewed, and invoked from that immutable revision.
An attested campaign additionally requires a `main` dispatch whose subject commit equals the fixed
observer commit; ancestor status or a caller-selected revision is insufficient.

The CLI is an explicit operator gate, not a host Goal integration: it exits nonzero for every report
whose minimum leaf is below 9.5. The candidate repository must match the scorer checkout's exact origin;
its commit must be the clean checkout `HEAD`, its tree must resolve exactly, and its committed catalog
blob must equal the catalog being scored. The catalog is the checked-in 39-leaf authority; callers
cannot substitute a smaller catalog. An explicit unavailable observation scores that leaf zero with
an explicit count and reason. An unavailable provider inventory is reported as the global evidence
limit rather than hidden by selected passes.

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
