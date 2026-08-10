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
- `full`: all public golden cases in `cases/golden.yaml`, two trials each.
- `holdout`: all public withheld-regression cases in the separate `cases/holdout.yaml`, three
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

`capabilities.json` is the only leaf inventory. `scenarios.json` gives every leaf exactly one positive,
negative, and recovery design slot and fixes the required observer class. It contains no score, result,
run, artifact, attempt, owner, weight, consumer, or campaign state. A complete design matrix proves only
that no leaf/scenario was omitted; `authority_unavailable` remains non-evidence and cannot raise a score.
Schema v1 accepts only `authority_unavailable`; a later schema may admit an implemented authority only
when the validator also consumes that observer's exact case binding instead of trusting the matrix field.
The missing-authority class fixes the observer kind rather than letting a case author downgrade it.
`executable_suite`, when present, creates a two-way binding to exactly one golden or holdout case; omitting
or moving that case fails validation. It is corpus structure only, not evidence that the required observer ran.
These candidate-owned checks establish internal consistency only. Schema v1 is bootstrap-only and
non-authorizing: coordinated edits to both the matrix and corpus are not anti-omission evidence. A later
canonical-base consumer must reject deletion, suite movement, or authority-class downgrade before any such
claim can be admitted.

`cases/golden.yaml` and `cases/holdout.yaml` are the executable text corpus authority. Descriptions carry the
suite selector; prompts express generalized consumer tasks without private repositories, task
locators, transcripts, or business content. Every case binds exactly one primary capability, scenario,
stable case ID, deterministic text behavior, and an out-of-prompt observation contract in
`metadata.observations`. Its binding must resolve to the corresponding `scenarios.json` slot. A case may
exercise supporting behavior for a stronger observer class, but it cannot substitute for that observer
or turn an unavailable authority into evidence. One case never upgrades unrelated leaves. Model-graded rubrics may be added only when semantic
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
Recovery must restore the same installed manifest, loader result, and protocol notification state as
the positive path; shaped but divergent recovery fields are not recovery evidence.
GitHub-hosted execution becomes external evidence only through an offline-verifiable Sigstore bundle
bound to the exact signer workflow and digest; a CI status, uploaded JSON, custom predicate, or
candidate-controlled workflow is not sufficient. The first observer candidate is bootstrap evidence
only and cannot raise a score. A later scorer candidate may consume a real bundle only after the
observer is canonical, independently reviewed, and invoked from that immutable revision.
Repeated observation requires one separately scheduled observer job and a separate signing job with
one Sigstore bundle for every environment-and-trial slot. Subject code must not share the signing job
or its OIDC authority. The campaign may index those bundles but cannot turn labels, filenames,
or an unsigned aggregate into freshness evidence. A later scorer must verify every nested observation
bundle as well as the campaign bundle before repetition can change maturity.
An attested campaign additionally requires a `main` dispatch whose subject commit equals the fixed
observer commit; ancestor status or a caller-selected revision is insufficient.
Evidence schema v2 may reference the campaign JSON and Sigstore bundle as external, content-addressed
files. A fresh child of the absolute current Node executable copies the package-lock-pinned Sigstore bundle, TUF,
protobuf, core, and verifier packages into an ephemeral directory, rejects symlinks, and requires their complete
file-tree digest to equal the reviewed candidate constant before importing them. The child receives no parent loader
arguments and clears Node, Git, and dynamic-loader environment selectors. One child may verify one bounded campaign
batch while reusing that exact frozen runtime; every indexed observation bundle and the aggregate campaign bundle
still receives its own signature, subject, signer, transparency-log, and content-identity verification. It reads the content-bound bundled
`trusted_root.json` directly and does not run a TUF updater or make a network request. It then requires the exact
repository, signer workflow, `main` ref, source commit,
GitHub-hosted runner claims, CT log, and transparency log; then it independently replays the campaign envelope,
SLSA subject, Git ancestry, observer/workflow blobs, and current installer, Skill, profile, and hook
identities. Freshness also binds the observer's package manifest, dependency lock, and shared JSON parser,
because they select the Codex loader and parse its protocol. A changed bundle, self-hosted runner,
stale consumer surface, non-`main` signer, or caller
invented scenario fails closed. One Linux+Windows positive/negative/recovery campaign establishes one
dynamic observation and scores 6. Six separately scheduled and individually signed Linux/Windows trials
establish representative repetition at 8 only when all six slots and signatures verify. Independent
observer and provider-complete attempt requirements remain unavailable rather than being inferred from
the signatures.
The next observer schema runs three fresh positive/negative/recovery trials in each of Linux and Windows
as six separately scheduled and attested jobs. Its bootstrap aggregator rejects missing, duplicate, and
cross-subject slots and records each observation and bundle digest; substitution resistance remains
unavailable until the later scorer verifies every recorded bundle against its observation bytes.
Its first canonical campaign is bootstrap evidence only. A later scorer may raise only `INS-01` to 8
after it verifies the campaign signature, the exact six-slot matrix, every raw observation envelope,
and every nested signature against the raw file bytes. Repetition by one fixed observer still does not
satisfy the independent-observer requirement, prove process isolation between the same-repository
observer and subject, or authorize 9.5.
An attested campaign cannot share one scorer process with locally loaded Promptfoo, YAML, rollout, or
native-trace observations; those evidence classes require separate manifests so writable runtime
dependencies cannot precede the content-bound verifier.
Repository object reads use the platform's protected absolute system Git path rather than `PATH`, disable replace
objects, fsmonitor and untracked-cache shortcuts, isolate system/global config, and reject replace refs, grafts,
alternates, assume-unchanged and skip-worktree entries. The Node and Git
executables, same-principal processes, and local filesystem remain explicit host trust boundaries; this
fixed-observer design is therefore capped at 8 and cannot establish provider-attested completeness or the 9.5
anchor. A non-repeated campaign remains capped at 6. The parent owns the private verifier directory and removes it after success, child failure, or timeout; the
child also removes it defensively. The child lets its exact JSON receipt drain normally instead of forcing process exit.
The installer observer accepts only version-bound app-server notification schemas. Environment-local
remote-control identity and structured config warnings are recorded by shape only; neither is a pass
oracle, and the exact Skill discovery response plus installation counterfactuals must still pass.
Linux observes a disposable `HOME`. Windows uses the otherwise-absent `.agents` directory under the
ephemeral runner's real OS profile because Codex resolves that root through the Windows known-folder
API rather than environment overrides; the observer atomically claims a previously absent root,
refuses pre-existing state, atomically moves the claimed directory to an isolated sibling custody,
and verifies its identity before removal in `finally`.

`EVAL-02` uses a separate fixed observer to execute the canonical scorer CLI as a black box against
one already-attested INS-01 campaign. Its positive path requires the signed campaign to score only
INS-01 at 8 while the global minimum stays 0 and eligibility stays false. Its negative path injects
one explicit critical-gap control and one unknown high-score field; the former must reduce the affected
capability to 0 and the latter must be rejected before scoring. Recovery removes only the synthetic gap,
reuses the unchanged signed input, and requires a fresh scorer process to reproduce the original report
byte-for-byte after canonicalization. One Linux and one Windows observation are signed separately;
the observation and aggregate jobs have no OIDC authority, while signing jobs download bytes without
checking out or executing candidate code. The observer independently replays the exact 39-row catalog,
per-row scores and counts, weighted score, below-target set, critical-breach set, and global gate rather
than trusting a report summary. The signed input campaign is retained with the output so the reports and
controls remain replayable. The first campaign generated before a campaign consumer existed is permanently
`bootstrap_only`, non-authorizing, and cannot raise a score. Later observations retain the exact positive,
negative, recovery, and unknown-field diagnostic bytes under their signed digests and are marked
`strict_descendant_only` under a separate EVAL schema.
EVAL-02 may reach at most 6 only after its campaign consumer is canonical, a later unchanged scorer is
observed, and a strict subsequent scorer verifies both observation bundles, the aggregate bundle, the exact
scorer/catalog/contract/observer blobs, the fixed source-campaign files and digests, the three reports,
and the diagnostic.
The observed commit itself can never consume its campaign. Manual dispatch
does not prove a complete attempt inventory, representative repetition, independent observation, or the
8/9.5 anchors; failures and replacement runs remain unavailable rather than being selected away.

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
