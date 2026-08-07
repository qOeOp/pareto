# Repair Architecture Corrosion

## Activation

Load only when evidence shows duplicated or missing authority, scattered responsibility, a material
static dependency cycle, unjustified service or module boundaries, mixed organization axes, or
persistent structural patch pressure. Untidy paths, file counts, dependency counts, or a preferred
style do not activate this playbook.

## Evidence

Set a bounded inspection budget and inspect three to seven decisive seams plus representative
unaffected units. Label consequential claims `Observed`, `Declared`, `Inferred`, or `Unknown`, and
bind every observed claim to a repository locator or bounded command. Connect actors and outcomes,
value streams, deployables, components, public contracts, direct consumers, durable state, side
effects, static dependencies, runtime interactions, and verification boundaries. Treat current paths
and containers as evidence of current behavior, not authority for the target.

## Taxonomy

- **split authority:** more than one owner decides the same durable fact, invariant, or side effect;
- **scattered responsibility:** one capability requires coordinated edits across unrelated owners;
- **pass-through boundary:** removing a layer erases ceremony rather than redistributing complexity;
- **mixed-axis tree:** one subtree alternates business, runtime, layer, language, or artifact axes;
- **static/runtime confusion:** temporal interaction cycles are used to justify static dependency cycles;
- **polluted legacy premise:** compatibility or a current container is treated as target authority;
- **unjustified distribution:** a service lacks an independent deployment, scaling, security, failure,
  state, SLO, contract, or operating reason.

## Decision

Compare no change, incremental repair, selective reconstruction, and semantic re-foundation only when
each is credible. Choose the narrowest posture that restores sole authority and consumer coherence.
Design outside-in: actors and outcomes; value streams and invariants; state and side-effect authority;
interaction and failure semantics; logical units; then physical paths. Choose one primary organization
axis per governed subtree. Prefer a module unless an independently necessary service boundary is
proved.

## Repair

Assign each affected asset exactly one disposition: `keep`, `move`, `merge`, `split`, `introduce`,
`extract`, `replace`, `quarantine`, or `retire`. Preserve behavior and consumer obligations explicitly;
do not preserve a polluted container merely to reuse its code. Keep target static dependencies
acyclic, model runtime commands/queries/events separately, and give every durable fact, decision, and
external side effect one final owner. Migrate by independently verifiable cutovers; forbid new
consumers of quarantined paths and name their retirement observation.

## Anti-pattern

Do not recreate an Analyze→Blueprint→Implement lifecycle, a repository map, task ledger, registry,
or second state owner. Do not infer semantic ownership from directories, imports, co-change, scores,
or size alone. Do not add services, adapters, compatibility layers, generic `common`/`utils` owners,
or bulk moves without a consumer and cutover oracle. Migration difficulty changes sequence; it does
not silently veto the strongest supported target.

## Verification

Exercise affected direct consumers, build/release/deployable units, and owner contracts. Recompute the
target static graph and prove it is acyclic; inspect runtime edges for contract, ordering, timeout,
retry, idempotency, and unknown-outcome semantics where relevant. Recheck the sole-authority map.
Hide implementation contents and use the target tree plus one-line responsibilities to verify that a
fresh reader can recover major capabilities, deployables, state owners, and named retrieval paths.
Report unresolved dynamic or generated edges as `Unknown`, not passing.
