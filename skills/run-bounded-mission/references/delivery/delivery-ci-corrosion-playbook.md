# Repair CI Corrosion

## Activation

Load only when delivery evidence shows a missing, stale, wrong-head, duplicate, contradictory, or
misrouted CI result, or when workflow triggers/path filters prevent the required owner or consumer
check from running. An individual product failure, provider-review state, queue state, or preference
for another CI vendor does not activate it.

## Evidence

Freeze repository, workflow revision, base, exact candidate head or merge-tree identity, required-
check authority, raw check suites/runs, trigger event, path filters, job dependencies, and affected
owner/consumer commands. Treat GitHub summaries and names as projections until joined to raw head,
workflow, app, and conclusion facts. Preserve missing pagination, rerun provenance, skipped jobs, and
external required-check settings as unknown when unavailable.

## Taxonomy

- **selection gap:** the changed owner or consumer is not selected by the root quality entry;
- **trigger gap:** event, branch, path, or conditional filters suppress required execution;
- **head-binding gap:** success belongs to another commit, merge tree, or workflow revision;
- **duplicate authority:** multiple jobs or settings claim the same required result inconsistently;
- **dependency gap:** a required job can pass or skip without its producer/consumer prerequisite;
- **environment distortion:** cache, permissions, secrets, services, concurrency, or time hide reality;
- **flake/infrastructure:** transport or runner instability is misreported as product evidence;
- **truth gap:** delivery prose claims a check set or conclusion not present in the raw snapshot.

## Decision

Repair the earliest existing owner: repository root quality entry, affected package check, workflow,
or separately authorized repository setting. Keep product behavior and lower authoritative tests
unchanged when the failure is CI-only. Prefer removing duplicate status authority or directly wiring
the real command over adding an adapter, aggregator, retry service, or second CI framework.

## Repair

Make the smallest owner-local trigger, selection, dependency, environment, or status-binding change.
Preserve exact-head and fail-close semantics. Bind any repository-setting write, rerun, cancellation,
or external effect to separate authority; a YAML edit does not authorize it. Keep provider review,
conversation disposition, merge, queue, and Hub protocol in their existing delivery owners.

## Anti-pattern

Do not rename jobs to manufacture required status, accept success from a stale head, make required
checks optional to unblock delivery, or retry nondeterminism until green. Do not duplicate the root
gate in CI, add a new workflow for one command, rely on UI summaries, or treat an empty/non-required
check set as passing. Do not use browser or connector state as a Git/GitHub fallback.

## Verification

Run the affected owner and direct-consumer commands locally, validate workflow syntax with the
repository-approved tool, and exercise the changed trigger/path selection when safely reproducible.
On the published exact candidate, require the complete non-empty required final-head check set, raw
head/workflow/app binding, correct conclusions, zero contradictory duplicate authority, and no base,
head, activity, or merge-tree drift. Report external setting or runner evidence unavailable rather
than inferring it.
