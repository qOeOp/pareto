# Repair Documentation Corrosion

## Activation

Load only when repository documentation contradicts current authority or consumer behavior, duplicates
another owner, preserves superseded exploration as current guidance, or leaves a real consumer unable
to find the current contract. Grammar, length, age, or a documentation request alone does not activate
this playbook.

## Evidence

Bind the claimed behavior, canonical owner, direct readers or tooling consumers, current code/schema/
contract locators, and every inbound link to the affected document. Use bounded history only when it
can distinguish a removed invariant from stale prose. Mark generated, dynamically discovered, or
externally published consumers `Unknown` when they cannot be closed.

## Taxonomy

- **stale authority:** prose describes behavior or ownership that no longer exists;
- **parallel authority:** two current documents answer the same semantic question differently;
- **exploration diary:** rejected options or migration history is presented as current design;
- **orphan:** a stable document has no real reader, load route, or maintained inbound locator;
- **mirror:** prose manually repeats an executable schema, manifest, index, or test contract;
- **misplaced contract:** cross-module semantics live in a local file, or local I/O pollutes root docs;
- **unverifiable projection:** a diagram or overview cannot be regenerated or checked against owners.

## Decision

Choose the authority that is wrong before editing. Prefer executable contracts and existing semantic
owners; retain prose only for stable meaning that those surfaces cannot express. Use `docs/` for
product or cross-module semantics and the owner `CONTRACT.md` for stable module I/O. Keep the final
state only. If no stable reader needs repository authority, keep the decision Mission-local.

## Repair

Update the canonical owner and every real inbound consumer in one slice. Delete superseded exploration,
duplicate current-state prose, and obsolete links when the replacement is admitted. Replace manual
mirrors with a direct locator or mechanically derived view. Preserve history in Git rather than in the
current contract. Keep new paths lowercase ASCII with hyphens except repository convention names.

## Anti-pattern

Do not add a README, index, changelog, migration diary, compatibility note, or architecture overview
without a named recurring consumer. Do not document an intended future as current behavior, copy a
schema or load route into prose, or retain obsolete text for context. Passing tests do not prove prose
truth, and a clean link checker does not prove semantic authority.

## Verification

Exercise the reader or tooling path that consumes the document. Resolve all changed links and search
for superseded owner names, paths, claims, and exploration artifacts. Compare the final prose with the
current executable contract and direct consumer behavior. Render diagrams or formatted artifacts when
layout carries meaning. Prove no duplicate current authority or manual mirror remains, and report any
unresolved external publication separately.
