# Mission Replacement Checkpoint

Use one conversation checkpoint after a nontrivial Plan and replace it after any decision-changing
Frame, Plan, Origin, candidate, evidence, effect, authority, Stop, Resume, route, or terminal change.
It indexes native task, Git, GitHub, and user facts; it is not a registry, ledger, scheduler, or
authority.

```text
Mission checkpoint
Frame: <complete current Frame, including interaction language>
Plan: <complete admitted Plan, or none - invalidated/pending admission>
Origin / candidate / effects: <exact identities, diff or none, issued and unissued effects>
Evidence / findings: <decisive passes, failures, unavailable evidence, dispositions>
Position / next legal operation: <one stage or route and one action>
Mode / owners: <single or hub; active slice -> mechanism -> owner -> predicate -> action>
Task custody: <exact identities, title/send receipts, active set, DAG relations, cursors,
  consumed actionable locators, current window and next observation action>
Authority / Stop / Resume / terminal: <current values and release predicates>
```

Retain only fields that can change the next decision. A native packet is indexed by its immutable
producer identity and exact send receipt; do not copy its bytes into another store. Missing,
conflicting, stale, duplicate, or candidate-controlled identity or authority freezes the affected
action.

## Recovery gate

A new turn, interruption, compaction, source drift, or user override freezes mutation and unissued
effects. The Plan projection, a compaction summary, or recovery prose does not restore Execute
admission. Before the first later mutation or unissued effect, reconcile the raw request and
checkpoint with current Goal capability when relevant, exact task identities, Git, GitHub, external
effects, and every activated owner, then emit the complete current Mission checkpoint with exact live
identities. If an affected identity cannot be read, keep only that action frozen and name its earliest
useful read. A material Frame change clears the Plan completely before a new one is admitted.

For single mode, require the same Mission, Origin/candidate, next owner, and effect boundary. For Hub
mode, additionally require:

- every approved or attempted node and its exact disposition;
- an acyclic current DAG with immutable relation locators;
- one registered active-task set and exact cursor per continued target;
- consumed terminal/needs-attention locators and component conflict dispositions;
- one current window and one next observation action.

Recovery does not adopt a same-title task, retry an ambiguous create/send, or infer no change from an
omitted target. Goal continuation may execute only the checkpointed observation action; it cannot
invent targets or cadence. An unchanged bounded observation is a silent yield with no immediate
resubscription. Callback unavailability does not erase active-task custody.

Key a user pause to its exact user-event locator in `Authority / Stop / Resume`. A finite pause is
acknowledged once. Consume the recorded finite pause as Resume only when current authority proves that
the exact matching Goal resumed from that pause: an active/Resume observation locator strictly later
than the bound pause proves its paused-to-active transition, or an authenticated host contract causally
binds that transition to the exact pause. The checkpoint must bind that same finite user-event locator,
with no newer or conflicting user control event. A `source=goal` continuation is only the carrier or
wake unless that authenticated contract supplies the ordered exact-Goal Resume fact; its text or
provenance alone never releases work. Continue with the checkpointed next legal action without
repeating, extending, or re-arming the consumed pause. A still-paused Goal, an indefinite pause, a
conflicting or newer user control event, stale or unordered active state, or unavailable current
Goal/locator authority keeps affected effects frozen and permits at most the original acknowledgement;
elapsed time alone never releases work. Only a new exact user pause event can arm another pause.

When a release predicate changed, invoke its recorded next owner before unrelated work. When evidence
is malformed, unknown, or unavailable, freeze only its consumers and name the earliest observation
that can change the decision. Ordinary friction is not blocked, and elapsed time never releases work.
