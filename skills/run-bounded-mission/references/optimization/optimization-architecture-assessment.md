# Architecture Sensor Evidence

Use an available, repository-approved architecture sensor only for material structural change,
cross-owner effects, or persistent patch pressure. It is optional supporting evidence; its score
never decides acceptance.

Do not install a sensor or dependency unless the frozen authority permits it. Record the tool and
version, scan root, rules revision, origin and candidate identities, before and after results, exit
status, and coverage limits. Keep local sensor snapshots uncommitted.

Freeze any baseline before inspecting the candidate; never refresh it to manufacture a pass. Scores
and aggregate gates can hide one violation replacing another, so inspect reproducible rule-level
changes and the real affected boundary.

Create or change a repository rule only when repeated evidence demonstrates a stable architectural
invariant, an existing repository-native owner can enforce it, and authority covers the change.
Never encode a one-off aesthetic preference, aggregate score threshold, or speculative design.

Treat unavailable or inconsistent results as unavailable. Escalate only when the actual change and
reproducible output demonstrate a structural regression or repository-owned rule violation.
