# Test Integrity

Load this owner only when a test signal can change the candidate, an escaped defect shows a missing
oracle, or tests themselves are being added, restructured, or removed. It is not a default workflow.

Authority descends from user/runtime outcome to real consumer, owner contract, then tests. A test that
contradicts higher authority is repaired or removed; unresolved authority returns to Plan. Classify
the signal only as far as evidence supports: product regression, obsolete assertion,
implementation-coupled detector, scenario/oracle/selection gap, distorted double,
environment/concurrency/time gap, or harness/flake failure.

Use the narrowest maintained native test owner and public behavior oracle that can refute the defect.
Static imports, reachability, coverage, counts, snapshots, lexical matches, or file presence alone do
not prove execution, behavior, redundancy, or safe deletion. Fixture/setup/load/selection/runner
failure before the SUT is `unavailable` behavior evidence, never a product pass or failure.

Record evidence as `declared`, `reachable`, `dynamic`, `stable`, or `unavailable`. Deleting or
weakening a test requires the real consumer, the superseding oracle/contract, positive and refuting
cases, and proof that no unique failure signal or owner edge is lost. Otherwise preserve it.
