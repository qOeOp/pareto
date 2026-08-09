# GitHub Delivery

Load this owner before publishing or changing a pull request, declaring merge-ready, merging, or
cleaning up. Delivery owns GitHub acceptance; it does not own candidate design, independent semantic
review, CI implementation, or Hub DAG state.

## Publish the exact candidate

Publication requires current authority for that effect, a committed candidate whose tree and diff
reproduce the accepted local state, a clean write surface, and the repository's current PR contract.
Validate the title with `.github/scripts/validate-pr-title.sh` before the create/edit effect. Push one
task branch, create the authorized Draft or Ready PR, then read back repository, number, URL, base,
head ref/OID, title, body, and state. Any mismatch stops delivery; never repair an uncertain effect by
creating a replacement PR.

PR prose reports the observable change, real-consumer verification, unavailable evidence, exact
candidate, and ownership of the next effect. It does not reproduce internal packets, check logs, or
deleted protocol history.

## Bind merge-ready evidence

A merge-ready handoff binds one exact head and base observation to:

| Evidence        | Acceptance                                                                                                                        |
| --------------- | --------------------------------------------------------------------------------------------------------------------------------- |
| `real_consumer` | The changed behavior is exercised through its direct consumer.                                                                    |
| `root`          | Repository root gate and `git diff --check` pass on the exact candidate.                                                          |
| `audit`         | Required independent lens is accepted, or its activation predicate is absent.                                                     |
| `ci`            | Every required check for the exact head is terminal-success; missing, pending, skipped-required, stale, or ambiguous checks stop. |
| `conversation`  | All material review threads/findings on the current candidate are resolved with evidence.                                         |
| `drift`         | Head, base, mergeability, required-check set, conversations, and candidate evidence have not changed since observation.           |

Potential merge commit and tree must be structured non-null GitHub data and must replay locally from
the observed base and head. Queue state, mergeability unknown/conflict, branch protection uncertainty,
or an unbound head stops. CI success for another head never transfers.

Use the sole receipt owner to turn typed JSON facts into canonical bytes; callers do not sort keys.
Set `skill_root` to the directory containing the exact `SKILL.md` loaded for this run. Use the
loader-supplied absolute path; never infer it from the repository cwd or an installation convention.
If that path or the receipt source is unavailable, stop Delivery.

```sh
receipt_source="$skill_root/scripts/delivery-receipt.go"
test -f "$receipt_source"
receipt_bin="$(mktemp "${TMPDIR:-/tmp}/rbm-delivery-receipt.XXXXXX")"
trap 'rm -f "$receipt_bin"' EXIT
go build -o "$receipt_bin" "$receipt_source"
"$receipt_bin" create \
  < delivery-barrier-input.json > delivery-barrier-receipt.jsonl
"$receipt_bin" verify \
  --sha256 <sha256:digest> < delivery-barrier-receipt.jsonl
```

`create` rejects duplicate JSON members before semantic parsing; missing/unknown fields or kinds;
wrong/stale Git identities; invalid merge representations; and duplicated evidence. Every required
kind accepts only `pass`; `audit` also accepts `not_required` when its locator starts with
`predicate:` and a content digest binds that predicate. The helper owns deterministic normalization
and serialization.
`verify` requires canonical JSON-LF byte identity, the supplied digest, exact schema, and a fresh local
Git replay. A failed create or verify is a delivery Stop, not permission to hand-edit a receipt.

## Guard the merge

Immediately before merge, refresh the exact PR head/base, potential merge tree, mergeability, required
checks, conversations, and drift evidence. Recreate and verify the compact receipt when any bound fact
changes. Only the authority named by the admitted lifecycle may merge; in a Hub DAG the Hub alone owns
merge and node closure. The child returns the exact PR/head/tree/receipt locators and does not merge.

After the effect, read back the terminal PR state and merge commit/tree. A non-terminal or mismatched
readback is `partial` or `unknown`, never success.

After every exact merged readback, load [artifact custody](delivery-postmerge-cleanup.md) in the same
Finalize slice. Its reconciliation and source-freshness readback require no destructive effect; each
delete, archive, or cache-removal target still requires exact authority. Do not close the task or Hub
node while a task-owned artifact is `unknown`, unmatched, or lacks a named preserved owner.
