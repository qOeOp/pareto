# Delivery Artifact Custody

Load this owner at every terminal or authorized-cancellation endpoint; an exact merged-head/tree
readback additionally supplies merge absorption authority. Reconciliation is mandatory; deletion,
archive, cache removal, and remote mutation require authority for each exact target. Inventory only
artifacts created, adopted, or used by the Mission. Never infer names, scan unrelated history, use
globs, or remove a raw worktree path.

Bind the endpoint, task identity, canonical remote commit/tree, applicable merged PR/head/tree, and
every task-owned remote branch, local branch, worktree, cache, tag, registration, and continuing source
checkout. Classify each row:

- **Remote/local branch:** with exact authority, delete only the unchanged ref whose candidate is
  absorbed by the verified merge and read back absence; otherwise preserve its owner and endpoint.
- **Task/worktree:** archive/remove only the exact terminal, unpinned, recoverable task whose clean
  worktree HEAD/tree is bound and has no unique commit or is absorbed by the verified merge. Preserve
  dirty, active, permanent, detached-unique, unmatched, or user-owned state with a recovery locator.
- **Prunable registration:** inventory is not deletion authority. Preserve the exact registration by
  default; with exact authority, prune only that registration and read back its absence. Never use a
  broad prune as proof that unrelated registrations are safe.
- **Continuing source checkout:** if it will supply repository instructions or Skills, require a
  clean same-repository checkout with no unique commit, then fast-forward or detach it to the exact
  canonical ref and read back commit/tree. Preserve dirty, unique, or ambiguous state and mark it
  non-authoritative.
- **Cache/tag:** keep caches separate from candidate custody; remove only an exact ignored cache with
  authority and capacity readback. Preserve tags unless the user names the exact deletion effect.

An already-equal row is terminal after readback. A preserved row is terminal only with an exact owner,
reason, recovery locator, and whether it may keep supplying runtime instructions. `unknown`, unmatched,
or unowned state returns `needs_attention` and keeps the Mission or Hub node open. Lack of destructive
authority is not loss: emit one compact approval boundary or explicit preserve disposition instead of
waiting for the user to rediscover the artifact.

Read back every issued effect and the continuing source checkout. Report each row as `cleaned`,
`already_equal`, `preserved`, `partial`, or `unknown`. One failed row stops dependent rows and never
widens authority. Finalize only when every task-owned row has a terminal disposition and the checkout
that will supply future repository instructions is either exact-current or explicitly non-authoritative.
