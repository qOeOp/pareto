# GitHub Delivery

Load only when the frozen endpoint includes a GitHub pull request. GitHub delivery is part of
Finalize, not a separate lifecycle or a custom merge service.

Freeze the repository, pull request, base, candidate head, and endpoint (`open`, `merge-ready`,
`merged`, or `cleanup`). For `open`, `merge-ready`, or `merged`, also freeze the Draft/Ready state,
required signals, merge method, and authority for each write: publication, comment, review request or
submission, thread resolution, repository settings, auto-merge or queue changes, and merge. For
`cleanup`, treat the candidate head as the exact merged head and instead freeze the merge commit and
evidence, exact inventory, and authority for each cleanup effect; those delivery-only fields and
authorities do not apply.

Raw GitHub data remains authority for pull-request facts. Use the connected GitHub owner or `gh`
under its current official contract. The waiter below owns only deterministic Codex provider
classification; it is not acceptance or merge authority.

## Pull request title preflight

Before any pull-request creation or title-edit effect, including `gh pr create` and
`gh pr edit --title`, resolve the current repository's title authority during Plan. When it
constrains title shape, bind one repository-owned executable validator shared with the remote gate;
prose, templates, inferred commit messages, and copied patterns are not validators. Keep this skill
generic and do not encode repository-specific title formats here. If the repository has no title-
shape authority, do not invent one.

Generate one proposed title from the Mission outcome under that authority. Immediately before the
effect, run the admitted validator against that exact string. A missing or stale validator, or a
nonzero result, freezes before any pull-request effect. On success, pass the same value explicitly
with `--title`; never let `gh` infer a different title. A changed proposed title requires fresh
validation.

Close only the exact frozen endpoint:

- `open`: publish the exact candidate to the frozen repository, base, and authorized Draft/Ready
  state. Do not import review, check, conversation, race, or merge requirements into this endpoint.
- `merge-ready`: satisfy the complete barrier below for the exact candidate without merging it.
- `merged`: first satisfy the merge-ready barrier, then verify that GitHub merged that exact head
  under separately frozen merge authority.
- `cleanup`: consume GitHub's exact merged-head evidence, then close only the separately authorized
  post-merge cleanup contract below; do not rerun publication, manual discovery, merge-ready, or
  merge barriers. This endpoint belongs only to a direct Mission or hub Finalize after node closure;
  it is not a task-dispatch pull-request endpoint, child-delivery state, or node closure.

For `open`, complete the Mission's required verification before publication. For `merge-ready` or
`merged`, freeze a review-stable candidate only after affected real-consumer and owner checks,
complete diff inspection, `git diff --check`, every activated independent instruction or judge audit,
and the full root gate. Publish that exact candidate, then let final-head CI and manual discovery run
concurrently; publication is not the endpoint. A correction invalidates only affected evidence and
must leave the corrected final head through the full root gate and final-head CI before the barrier.

## Manual exact-head discovery

Automatic Codex review is disabled for this repository. Do not infer otherwise from PR creation,
Ready state, or provider boilerplate that lists possible triggers. For a `merge-ready` or `merged`
endpoint, the Frame and admitted Plan must separately authorize a manual review request for the named
repository, pull request, and exact review-stable head. That authority is one effect, not a numeric
attempt or revision budget; it never implies a per-revision request or a request-until-clean loop.
For `open`, successful publication in the requested Draft/Ready state does not request or wait for
discovery.

Use a user-authenticated `gh` or UI issue-comment path owned by the authorized human actor in the
admitted Plan. The connected `add_comment_to_issue` action is not trigger authority: a comment
performed through the `chatgpt-codex-connector` app is a same-app self-trigger and cannot start
provider discovery. Do not use GitHub's generic reviewer-request path because the repository waiter
cannot correlate it. Immediately before the external effect:

1. validate any created or edited PR title through the repository-owned title preflight above;
2. run the existing helper's request-effect preflight against a complete canonical live snapshot:

   ```text
   bun .agents/skills/run-bounded-mission/scripts/wait-pr-codex-review.ts --request-effect-preflight --repo <owner/name> --request-author <authorized-login> <pr-number>
   ```

   The preflight and waiter history share one extractor that enumerates every request-shaped PR issue
   comment before actor, app, edit, head, or provenance classification. Request-shaped means the
   comment body begins at byte zero with the `@codex review` command and its token boundary; quoted,
   embedded, or explanatory mentions elsewhere in provider or human prose are not request attempts.
   The preflight exposes each
   attempt's locator and the complete attempt count, and returns a machine
   `effect_authority.disposition`. It is only a deterministic
   no-prior-attempt safety gate; the admitted Mission/delegation remains the external-effect authority.
   The automated path may pass only when the complete snapshot contains genuinely zero prior
   request-shaped attempts. Any prior valid, malformed, edited, wrong-head, human-authored,
   connector-app, other-app, or unknown-provenance attempt freezes automated posting permanently.
   A candidate/head change, corrected candidate, evidence
   invalidation, provider result, finding, disposition, revision count, repacket, time, locator, or
   prose never renews that path. The helper accepts no caller-supplied representation of a later
   user/Hub authority event and cannot prove one. A human may act outside this automation, but this
   Skill never infers or manufactures that authority. `posting_frozen_*`, incomplete pagination or
   provenance, unavailable evidence, or a nonzero exit freezes posting; do not fall back to a
   browser, connector, reconstructed count, or another request.

   The earlier incident acceptance suggestion for an explicitly authorized later request is
   superseded by the independent authority-representation finding: this repository has no
   authoritative later-event producer/readback contract. Corrected heads close through independent
   evaluator evidence, a non-empty finding disposition/resolved thread when applicable, and CI, never
   an automated rereview.
3. render exactly one trigger from the existing helper, preserve its exact bytes, and validate those
   bytes offline against the frozen full lowercase 40-hex head before posting:

   ```text
   bun .agents/skills/run-bounded-mission/scripts/wait-pr-codex-review.ts --render-request <candidate-head>
   bun .agents/skills/run-bounded-mission/scripts/wait-pr-codex-review.ts --validate-request <candidate-head> < request-body
   ```

   The rendered body is:

   ```text
   @codex review

   Exact head: `<candidate-head>`
   ```

4. re-read the open PR and require its repository, base, Ready state, and head to match the frozen
   candidate; require the stable-candidate evidence above and the still-current allowed preflight;
5. require the active `gh` viewer or UI actor to equal the authorized human actor, then post through
   that user-authenticated issue-comment path with only the frozen repository, PR number, and
   validated body;
6. read back the exact created comment and require its locator, author, exact body, requested head,
   unedited timestamps/state, and `performed_via_github_app=null` before waiting. Null is a required
   observed postcondition for this request, not a universal claim about all CLI writes. Missing
   provenance, any GitHub app, or a readback mismatch fails admission; the exact connector app is
   classified `self-trigger` immediately.

A failed local syntax or read-only preflight freezes only the unissued effect; it neither mutates nor
invalidates the candidate. An ambiguous write result requires a fresh issue-comment read before any
further action and never permits a duplicate request by assumption.

The waiter first selects the locator- and actor-bound request attempt. Its current provider closure is
the immutable creation/submission-time interval after that request and before the next review request;
`updatedAt` may detect editing but never admits a lifecycle member. The closure's review threads must
join a provider review by review ID and that review's exact requested head. The request's original
actor remains the only authority for its resolver/disposition binding. Historical requests, signals,
reviews, threads, and dispositions remain machine-visible request history but cannot arbitrate the
selected attempt's terminal state. A disposition remains with the attempt that owns its finding
thread and review even when it is posted after a later request. Provider evidence exactly on either
request boundary is not a lifecycle member: its signals and threads are retained as non-terminal
boundary history and force incomplete discovery. The waiter may accept the provider's `THUMBS_UP` reaction on that
same request comment or on the pull request as a clean manual result only when the request is
unedited, its body matches the template exactly, its embedded full head equals the current snapshot
head, and the reaction follows the request within that closure with matching provider, target, and
causal order.
A provider `EYES` reaction on the exact request or pull request is progress evidence only: it neither starts a new attempt
nor advances the request-bound provider-signal window, and cannot hide a material signal after it.
A generated clean comment is notification only and cannot itself prove a terminal clean result. Its
bounded envelope must contain the exact canonical clean assertion, one reviewed-head field that
normalizes to the selected request's full exact head, and one closed `<details>...</details>` region
whose optional structural summary and contents have no authority. A bounded Git abbreviation is only
a provider representation and becomes the full head solely by matching that already selected exact
request; it never supplies authority itself. This is a
representation boundary, not a list of generated help-text phrases: changes inside the details region
do not change classification, while an unknown first line, missing or duplicate head, text outside the
envelope, malformed boundary, or wrong head fails closed. Only a structured exact-target reaction or
exact-head GitHub review state after the exact request supplies terminal authority. A bare legacy request,
edited request, stale or wrong head, same-app or other app transport, wrong provider or target,
ambiguous order, or changed PR head remains invalid or outstanding and fail-closed. Request admission
never suppresses already observed provider facts in its own selected closure, and provider discovery
also exhausts provider-authored replies and nested reactions retained in review threads; any such
representation without structured envelope authority is unknown and blocks clean arbitration.
never repairs invalid request admission.

The helper owns one snapshot, not a polling loop. The host waits first for a new GitHub activity/event
observation; when no event surface is available it waits for one bounded coherence-window expiry. Only
that changed input permits another snapshot. Do not immediately resubscribe, narrate an unchanged
snapshot, or rerun the same `gh`/GraphQL pair merely because the prior result was pending. Then run
`bun .agents/skills/run-bounded-mission/scripts/wait-pr-codex-review.ts --repo <owner/name> --request-locator <readback-node-id> --request-author <authorized-login> <pr-number>`
as its read-only snapshot owner. Pass the exact opaque, non-empty readback node ID without
normalization. Each invocation emits one `codex-review-receipt/v2` JSON object. It
preserves the legacy `repository`, `pull_request`, `head_oid`, `status`, and `reason` fields and adds
orthogonal machine projections:

- `request.classification` is one of `valid`, `missing`, `malformed`, `edited`, `ambiguous`,
  `wrong-head`, `self-trigger`, or `incomplete`, with the request locator, candidate locators, author,
  timestamps/edit state, body, requested head, performed GitHub app provenance, and the complete
  observed request history needed to retain an earlier request-to-finding binding; the expected
  readback locator/authorized actor and their binding result are machine fields, and a mismatch is
  `incomplete` rather than a new attempt. `request.effect_authority` exposes the complete shared
  request-shaped attempt count/locators/history; zero attempts is only the first-request safety
  precondition, while
  any prior attempt permanently freezes the automated posting path;
- `discovery.status` is one of `waiting`, `clean`, `finding_unrouted`, or `finding_routed`; its
  reviewed head, provider review, clean/progress signal, structured integrity problems, and finding
  array are only the selected current attempt. Its `provider_signals` are lossless envelopes classified
  as `clean_authority`, `progress`, `finding`, `capability_unavailable`, `notification`, or `unknown`.
  Those classes are derived from GitHub reaction/review state, exact target/head, review/thread join,
  and issue-comment app provenance; only `clean_authority` is clean, and every `unknown` fails closed.
  Provider review body wording is not clean/finding authority. Its ordered `history` array retains
  every request attempt with that request's raw provider signals, non-terminal boundary provider signals, and its
  non-terminal boundary provider threads, plus request-bound finding/thread/resolver/disposition
  projections, so consumers do not manually rejoin lifecycles. An exact connector-authored request is retained and classified as its own self-trigger
attempt rather than projected as a provider finding in another attempt. Every in-window provider
thread is retained before review-ID/head joining; an absent or mismatched review binding is incomplete
discovery and cannot be hidden by a clean signal.
- `provider_snapshot` is present only when the broad classifier reports `usage-failure`. It is the
  lossless normalized snapshot already fetched by the waiter, including PR state/head/completeness,
  every top-level signal with issue-comment app provenance, every review thread comment, and reactions
  on every fetched surface. It is evaluator input only and grants no terminal status or acceptance
  authority.

The helper joins those facts inside the same snapshot invocation. Reason text is explanatory only;
callers consume the machine fields and exit code. Unknown or missing provenance, actor, locator,
reviewed commit, binding, representation, or pagination fails closed. Other GitHub summaries cannot
override this classifier:

- exit `0` is a terminal clean result for the exact reviewed head;
- exit `10` is pending and remains in the bounded wait lane;
- exit `20` is terminal routed discovery only: every finding has a non-empty disposition from the
  exact authorized request actor and a thread resolved by that same actor, but it is not clean;
- exit `1` covers invalid request admission, same-app self-trigger, provider usage/rate-limit,
  incomplete evidence, mismatch, ambiguous signal, provider failure, and unrouted finding;
- exit `2` is reserved for CLI argument or invocation usage errors.

### Provider-unavailability evaluator fallback

The waiter's broad `usage-failure` classification is non-authorizing. Use this route only when the
same receipt includes the lossless `provider_snapshot` fetched by the waiter. Main freezes and
replays the exact receipt plus canonical JSON-LF bytes and digest of that snapshot. It must validate
the exact current PR, head, request locator, authorized actor, unedited body and app provenance;
complete pagination and open-PR state; exactly one connector capability-usage signal after the
request; no semantic finding, clean result, review, thread, reaction, edit, provider sibling,
ambiguous boundary, equal-time or later invocation, contradiction, or discovery problem other than
`usage-failure`; and unchanged raw bytes. Reason text, joined findings, a usage signal, or main's
deterministic replay grants no acceptance.

Before launching fallback evaluators, main checks whether a complementary candidate audit completed
before the manual request and still binds the exact current candidate, complete Frame and Plan,
immutable control plane, member manifest, and common locator. Both members must be independently
admitted, `completed`, `[no_finding]`, and `mutation_observation=not_applicable` as a non-authorizing
semantic declaration; reject a missing or different member value as an attempted override. Main must
then project the authoritative `mutation_observation=none` only after exact post-return replay of
target, control, artifact, outside-state, and scratch-manifest fingerprints with no drift. When that
qualifying pair exists, its independent semantic result combines with the valid raw-provider
replay to substitute for the unavailable manual-discovery terminal. Neither component substitutes
alone, and an audit that started after the request cannot qualify for reuse.

Only when no qualifying exact-candidate audit exists may main bind the frozen receipt, snapshot, and
exact candidate into one new `complementary_pair`. A false positive may spend evaluator work but
cannot accept the review terminal.

Load the reviewer handoff. Assign `authority_representation` to verify the request locator, actor,
body, head, edit state and app provenance; provider identity and app provenance; genuine capability
unavailability; pagination completeness; and every unknown or ambiguous representation. Assign
`consumer_fail_close_closure` to inspect every top-level comment, review, inline reply, reaction,
edit, attempt boundary and semantic provider result; reject any later or equal-time ambiguous
invocation or material finding; and verify that the snapshot still concerns the exact open PR and
candidate head. Neither lens may consume the waiter's classification, reason text, or joined
findings as its conclusion.

On the evaluator route, only valid fan-in of both exact artifacts with `review_status=completed`,
`[no_finding]`, matching candidate and common locator, and the literal non-authorizing member
`mutation_observation=not_applicable`, followed by Main's authoritative `mutation_observation=none`
after successful post-return fingerprint checks, may
substitute for the unavailable manual-discovery terminal. The reviewer handoff's ordinary set-wide
generic fallback remains the only evaluator-route fallback. A stale, partial, unsupported,
mismatched, unavailable, finding-bearing, or non-`none` Main projection supplies no acceptance. Do not request
another review and do not ask the user for a per-PR confirmation.

This pair replaces only the unavailable manual-discovery result. It does not replace candidate
verification, affected independent audits, the final root gate, final-head CI, disposition of any
material finding, zero unresolved conversations, head/base/synthetic-merge-commit/merge-tree
stability, queue policy, or
merge authority. Missing, incomplete, stale, oversized, or unbound snapshot bytes; PR/head drift;
request or provenance mismatch; semantic findings; later or ambiguous invocations; edit ambiguity;
provider siblings; pagination gaps; or post-return drift make the fallback unavailable.

Collect and validate the complete manual result before changing the candidate. Route the coherent
set by its highest material boundary: a Frame-contract failure returns to Frame; an owner, path,
boundary, responsibility-shape, or oracle failure, recurrence of the same causal root, candidate
non-convergence, or boundary growth returns the same Mission to Plan; otherwise combine all
reproduced candidate-local findings into the smallest coherent root-cause correction in Execute.
Apply the main skill's predicate and anti-metric rules; discovery never authorizes a successor
Mission, replacement task, `Stop+1`, or terminal rejection.

Thread resolution is a separate write authority and may occur only after the finding is verified as
addressed, inapplicable, duplicate, or non-material; `outdated` alone is not evidence.

After every complete provider finding is reproduced and routed, a non-empty disposition reply plus a
resolved thread is terminal routed discovery. Preserve that result and revalidate each disposition
against the corrected final candidate; do not require the provider to report clean on that later head.
Rerun affected evidence, every candidate-affected independent audit, the final root gate, and complete
non-empty final-head CI, but do not automatically request another review. A separate request requires
a new evidenced reason and explicit authority in Frame and Plan; a correction, revision count,
`Stop+1`, latency, or a preferred clean result supplies neither.

Keep related Missions on the direct per-PR path owned by task dispatch. Do not combine their branches,
heads, or reviews merely to reduce invocations; admit aggregation only when an existing owner proves
the complete source, merge, review, and exact-head acceptance chain without new coordinator machinery.

Retain one final delivery receipt in the handoff, not a ledger. After the child-controlled evidence
producers are terminal and their current candidate identity snapshot is captured, but before the Hub's
final mutable-identity and activity freshness reread, collect only compact locators for
`real_consumer`, `root`, `audit`, `ci`, `provider`, `conversation`, and `drift`, each with its exact
candidate head, caller-observed result, and a content SHA-256 or explicit `null` when the native locator
is the only authority. Do not copy evaluator packets, check logs, provider snapshots, conversations,
or long command output into this receipt.

Use the existing waiter helper's single delivery-receipt mode. Feed `create` one canonical JSON-LF
`delivery-barrier-input/v3` record containing repository, PR, candidate head and its Git tree OID,
observed base ref/OID, the raw GraphQL `potentialMergeCommit { oid tree { oid } }` object or `null`,
queue state, and the locator array. Do not flatten `potentialMergeCommit.oid` into a tree field: it is
the synthetic merge commit OID, while only `potentialMergeCommit.tree.oid` is the merge-tree OID.
The helper structurally extracts and separately retains both identities, rejects a flattened,
partial, or same-OID representation, and requires the candidate tree and extracted merge-tree OID
to resolve locally as Git `tree` objects. It also resolves the exact candidate head as a local Git
`commit` and requires `head_tree_oid` to equal `git rev-parse <head-oid>^{tree}`; a different but valid
tree object is not accepted. The helper also computes
`git merge-tree --write-tree <base-oid> <head-oid>` on both create and verify and requires that exact
Git tree object to equal `potentialMergeCommit.tree.oid`; a missing object, conflict, mismatch,
unrelated existing tree, or commit-typed OID fails closed. The helper then validates exact fields,
normalizes repository and locator order, joins every locator to the same head, requires every named
evidence kind, bounds the compact representation, and emits one canonical
`delivery-barrier-receipt/v3` JSON-LF envelope with the inner byte count and SHA-256:

```text
bun .agents/skills/run-bounded-mission/scripts/wait-pr-codex-review.ts \
  --delivery-receipt create < delivery-barrier-input.jsonl
```

Replay the exact returned bytes before handoff or Hub consumption; `verify` requires the separately
retained digest rather than trusting the embedded value:

```text
bun .agents/skills/run-bounded-mission/scripts/wait-pr-codex-review.ts \
  --delivery-receipt verify --sha256 <sha256:digest> < delivery-barrier-receipt.jsonl
```

`verify` decodes the raw stdin bytes with fatal UTF-8 handling and requires the inner evidence schema
and representation to be already normalized and canonical; it never repairs or normalizes receipt
bytes during replay. Missing or altered bytes, digest, locator, candidate head, evidence kind, field,
UTF-8 sequence, or canonical LF fails nonzero. The helper only collects, normalizes, joins, hashes,
and replays caller-supplied facts;
opaque `result` values remain owned by their real consumer. It cannot choose scope or authority,
classify a finding, decide acceptance, waive evidence, or authorize merge.

Both `create` and `verify` apply one raw-byte boundary before producing canonical output: stdin must be
strict valid UTF-8 and byte-for-byte equal to the sole contract-ordered canonical JSON-LF
serialization of the decoded value. Any prefix, suffix, BOM, alternate newline, reordered key, or
decode/encode normalization fails before a receipt can be created or replayed.

For a `merged` node, the child sends this verified compact receipt once and stops at `merge-ready`.
The Hub reconciles its own Goal/DAG/authority effect, replays the receipt, and does not rerun child
consumer, root, audit, CI, provider, or conversation work. Immediately before guarded merge it
refetches the mutable Git identities—head, base, synthetic merge commit, merge-tree, and
queue/auto-merge state—and rereads
the current final-head activity for the complete required-check set, provider signals, and review
conversations. Each activity set must still be terminal, must contain no new or changed signal or
unresolved conversation, and must match the receipt's corresponding locator, result, and content
digest. Identity or activity drift stales the handoff and returns the same child through task
dispatch. This is a freshness reread of authority facts, not a rerun of child evidence production.
The receipt itself proves neither acceptance nor merge authority.

This ordering is strict: child evidence producers finish, the child creates and verifies one compact
receipt, and only then may the Hub perform the receipt-bound final freshness reread. Never condition
receipt creation on completing that final reread; doing so creates a circular barrier with no first
valid receipt.

## Merge-ready barrier

Immediately before accepting `merge-ready` or performing a merge, observe one current snapshot:

1. repository and PR match the frozen target;
2. PR is open, has the required Draft/Ready state, and targets the frozen base;
3. PR head equals the verified candidate;
4. the complete non-empty set of required final-head checks exists and passes;
5. the frozen discovery classification has a terminal route disposition, either directly or through
   the exact provider-unavailability fallback above; every material finding has a disposition
   revalidated against the final candidate, and any separately required current-candidate reviews are
   terminal;
6. zero unresolved conversations remain;
7. auto-merge or merge-queue state cannot race the snapshot;
8. a final refetch shows no head, base, synthetic merge commit, merge-tree, queue/auto-merge,
   required-check, provider-signal, or conversation-activity drift from the compact receipt.

Select CI from raw exact-identity data, not a rollup's worst historical conclusion. Resolve the
complete non-empty required-context authority first. For each required Checks API context, list check
runs through GitHub's [exact-ref endpoint](https://docs.github.com/en/rest/checks/runs#list-check-runs-for-a-git-reference)
for the exact candidate or required test-merge SHA with `filter=latest`, retain the returned run
ID, name, app ID, check-suite ID, `head_sha`, status, conclusion, and timestamps, and require its
terminal conclusion under the repository rule. A superseded older `CANCELLED` run is history and
cannot override a newer selected terminal; a selected latest cancelled, stale, pending, missing, or
wrong-head run fails. Also fetch commit statuses for that exact SHA: when a check run and commit status
share a required name, both remain required. Pagination, duplicate name/app authority, missing app,
unknown conclusion, or disagreement between the required-context owner and raw runs fails closed.
Bind the canonical selected-run/status snapshot and digest to the compact `ci` locator, then repeat the
same selection during the final freshness read; never substitute `gh pr checks`, a check-suite
aggregate, or an earlier workflow run as authority.

Unknown, absent, stale, or pending required final-head data fails the barrier. The completed manual
review is intentionally discovery rather than final-head acceptance evidence. A material finding or
any candidate, head, base, or merge-tree change returns to Verify.

When the failure is rooted in CI selection, triggers, path filters, final-head binding, duplicate
status authority, or a required-check contract, load [CI corrosion](delivery-ci-corrosion-playbook.md)
for the owner-local repair. Do not use that playbook to alter provider review, merge, queue, or Hub
authority.

## Merge

Merge only with separately frozen authority. Prefer an exact-head guarded host operation; with
`gh pr merge`, use `--match-head-commit` and never infer `--auto` or `--admin` authority.

If the base requires a merge queue, freeze queue authority plus the synthetic merge commit and
merge-tree acceptance identities;
otherwise block. Armed or queued is pending, not merged.

Accept `merged` only after GitHub reports that the verified head merged. Record the repository, PR,
head, base, synthetic merge commit or merge-tree identity, merged commit, and observation time. A pre-existing or externally
performed merge is evidence to inspect, not proof that this mission performed an authorized effect.

When behavior is version-sensitive, consult GitHub's current auto-merge documentation and the
official `gh pr merge` reference before acting.

## Post-merge cleanup

Cleanup is a separately approved effect set after merge, not an implication of publication, merge,
task ownership, or permission to write the repository. Start only after GitHub reports the exact
frozen candidate head `MERGED`; record repository, pull request, head, base, merge commit, and
observation time before inspecting any cleanup target. A pre-existing or externally performed merge
can satisfy this evidence gate, but grants no cleanup authority.

Freeze an exact inventory before the first effect and retain every exact authorized identity even
when it is absent. For each artifact record presence as `present`, `absent`, or `unknown`, its
owner-specific identity and OID, using `N/A` only when it is absent or non-Git, plus its authority and
recoverability. Include the remote branch; Codex task and observed managed worktree; local branch;
each local Mission tag and each remote Mission tag as separate artifacts; and the designated
local-main checkout, local-main OID, remote, canonical full ref, and observed remote-main OID. Keep
unknown or non-target artifacts out of the inventory. Do not discover a broader cleanup set while
executing.

Classify the cleanup target set before admitting any row:

| Observation | Admission | Required receipt |
| --- | --- | --- |
| exact candidate is reported `MERGED` and every target identity/OID is resolved | Admit only the separately authorized rows whose preconditions still match | Record exact before/after identity and safe post-read for each row |
| target already equals its row postcondition | Perform no write; classify from the live state as `already_absent` or `already_equal` | Record the same exact identity read that proved idempotence |
| merge identity, target, owner, authority, policy, presence, OID, worktree binding, or remote state is uncertain | Admit no dependent effect and preserve the target | Record `preserved` with the exact unavailable or mismatched fact; do not broaden discovery or authority |

Branch, tag, managed-worktree, and designated-main rows never inherit authority from one another or
from merge. Resolve every local/remote full ref and OID separately, and require a row-local safe
readback after any admitted effect. An unavailable atomic owner remains an evidence-backed preserve,
not permission to synthesize a helper or weaken the expected-identity contract.

Apply only the rows with separately frozen authority. An exact deletion artifact recorded absent
succeeds as `already_absent`; non-deletion rows use their row-specific status. A pre-effect OID,
owner, policy, status, or classification mismatch is `preserved` plus its reason, never a request to
widen authority or force the operation. Use `partial` only when an effect changed state before a
required postcondition failed; record its actual before/after state, reason, recovery, and dependency
stop.

| Artifact | Preconditions | Action | Postcondition | Failure disposition |
| --- | --- | --- | --- | --- |
| remote candidate branch | Exact full ref, presence, and OID are inventoried separately from merge authority | Preserve it. No current callable owner is proved to atomically bind the expected OID, absence of every open pull-request reference, repository policy, and delete authority; no deletion action is admitted | No branch state changes; an exact post-read records its actual presence and OID, with a present ref reported as `preserved`, never retired | An initially absent ref succeeds as `already_absent`. Drift, protection, an open-PR reference, policy or authority mismatch, or unknown state is preserved with the unavailable-owner capability reason |
| Codex-managed task/worktree | Exact task and host are terminal, unpinned, confirmed Codex-managed and non-permanent, have no newer activity or user work, and the candidate is recoverable; the observed current Codex app contract owns archive, background managed-worktree retirement, and a restore snapshot for this classification | Archive the exact task through that app owner and observe its background retirement; never remove its directory or run raw `git worktree remove` | Task is archived, managed worktree is absent, and the promised restore snapshot route is recorded | Already fully retired succeeds as `already_equal`. Active, pinned, permanent, dirty, unknown, or pre-effect contract mismatch is preserved. If archive changes task state but retirement or restore evidence is still incomplete, report `partial` and stop dependents |
| designated local `main` | Exact checkout is on the designated `main`, has empty tracked and untracked status, uses the frozen remote/canonical full ref, still equals the frozen local-main OID, and the observed remote ref still equals the frozen remote-main OID; no user change or divergence is present | Fetch only the explicit remote/full ref without tags, require the fetched ref to equal the frozen remote-main OID, then fast-forward the checkout to that exact OID with `git merge --ff-only <frozen-remote-oid>`; do not use `git pull`, stash, reset, rebase, or switch an unknown checkout | Local `main` and a fresh remote-ref read equal the frozen remote-main OID and the checkout remains clean; record `synchronized` when its OID changed and `already_equal` when it did not | An absent checkout, or any failure before the local-main OID moves, is `preserved` and stops dependents. If it moved but a later remote, cleanliness, or identity postcheck fails, report `partial` with actual before/after state and stop dependents |
| local candidate branch | Exact local name, full ref, presence, OID, and worktree ownership are inventoried | Preserve it. `git branch -d` does not bind the expected old OID, while expected-OID ref deletion does not enforce worktree ownership; no current native owner binds both, so no deletion action is admitted for ancestry or squash merges | No branch state changes; an exact post-read records its actual presence, OID, and worktree ownership, with a present ref reported as `preserved`, never retired | An initially absent ref succeeds as `already_absent`. Advanced, unmerged, checked-out, worktree-owned, squash-only, or unknown refs are preserved with the unavailable-owner capability reason; never use `-D`, `update-ref`, or a custom helper |
| local Mission tag | Exact local full tag ref was created for this Mission, was declared ephemeral before cleanup, still equals its frozen local OID, and local-tag cleanup is authorized | Default to preserve. With authority, delete only that explicit local full ref through an expected-OID compare-and-delete owner | An exact local ref read reports absent | Already absent succeeds. Undeclared, non-ephemeral, advanced, unauthorized, or unknown local tags are preserved |
| remote Mission tag | Exact remote full tag ref is inventoried separately, was created for this Mission, was declared ephemeral before cleanup, still equals its frozen remote OID, and remote-tag cleanup has separate authority and current policy permission | Default to preserve. With authority, delete only that explicit remote full ref through an owner bound to its expected remote OID; never infer its OID from the local tag | An exact remote-ref read reports absent | Already absent succeeds. Undeclared, non-ephemeral, divergent, advanced, policy-blocked, unauthorized, or unknown remote tags are preserved |

Keep the order fail-closed: freeze all rows; retire an eligible managed worktree and synchronize the
designated local `main` before finalizing the preserved local-branch receipt; and skip every later
action whose precondition depended on a failed, preserved, or partial earlier row. Independent tag
effects still need their own authority and current policy observations. Never use unresolved globs,
broad directories, `-D`, unconditional force, forced worktree removal, or `reset --hard`.

Finish with an exact receipt listing every inventoried artifact as `removed`, `already_absent`,
`synchronized`, `already_equal`, `preserved`, or `partial`. Record before/after presence and
owner-specific identity/OID, using `N/A` for absent or non-Git artifacts, plus reason, recoverability,
and every dependency stop. Managed worktrees use the app's saved snapshot when its observed current
contract provides one; a deleted tag can be recreated from its frozen OID only while that object
remains available; a fast-forwarded `main` is not rolled back by cleanup. An idempotent re-run must
classify the state it actually observes; it never rewrites a prior partial result as success.

Until a current owner proves the missing atomic branch-deletion contracts, Finalize must report the
aggregate user-visible outcome as safe partial cleanup, not as a `partial` row result, whenever either
candidate branch remains present and is preserved. An initially absent branch remains
`already_absent`; when both are absent, do not infer an aggregate partial outcome from the unavailable
deletion capability. Independently eligible artifacts may still close under their own rows.
