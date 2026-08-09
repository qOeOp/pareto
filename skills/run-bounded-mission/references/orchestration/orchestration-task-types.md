# Canonical Task Types

Load only when task dispatch must classify a new Outcome. This file owns codes; task workflow owns
identity, title, numbering, consent, and dispatch. Classify by the primary consumer/owner/acceptance,
not verb, filename, lane, model, or lifecycle stage. Multiple independent Outcomes split before
classification; ambiguity is `unknown` and stops type-dependent creation.

| Code  | Owner domain                                                                       |
| ----- | ---------------------------------------------------------------------------------- |
| `ARC` | cross-owner architecture, authority, dependency direction, cohesion                |
| `DLV` | PR, CI, exact-head delivery, merge/release handoff, cleanup                        |
| `DEV` | ordinary product/runtime/correctness/security/data implementation not owned below  |
| `OPS` | environments, worktrees, toolchains, operational capability                        |
| `OPT` | latency, context, cost, throughput, or efficiency with outcome preserved           |
| `ORC` | task identity/dispatch, Hub DAG, dependency release, bounded observation, recovery |
| `PLN` | Frame, Plan, decision evidence, structural design                                  |
| `QUA` | lifecycle signal classification, evidence routing, closure verification            |
| `RSH` | decision-changing research system and evidence acquisition                         |
| `TST` | the test system or test policy as the primary deliverable                          |
| `VER` | independent candidate/instruction/judge/evidence verification                      |

Internal planning, research, building, testing, QA routing, review, and delivery stay inside their
existing Mission. Historical identities remain exact historical facts and are never renamed or used
as fallback aliases. A new code requires an independent current-main Plan proving a real creation
consumer and mutually exclusive boundaries.
