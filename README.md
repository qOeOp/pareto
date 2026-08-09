# qOeOp Skills

A portable Agent Skills collection with deterministic validation and reproducible model evaluations.
The repository keeps runtime skills under one authority, `skills/`, and evaluation assets under
`evals/`.

## Install

This repository distributes exactly one Skill: `run-bounded-mission`.

```bash
npx -y skills@1.5.22 add qOeOp/skills --list
npx -y skills@1.5.22 add qOeOp/skills --skill run-bounded-mission --agent codex --global --copy --yes
npx -y skills@1.5.22 add qOeOp/skills --skill run-bounded-mission --agent claude-code --global --copy --yes
```

Use a release tag or commit after the repository name when reproducibility matters. Update or remove
the installed copy through the same pinned CLI.

## Validate and evaluate

Node.js 22.22 or newer is required for repository development. Skill consumers do not need these
development dependencies; the conditional delivery-receipt path requires Go 1.25 or newer.

```bash
npm ci --ignore-scripts
npm run check
npm run eval:smoke
npm run eval:full
npm run eval:holdout
npm run eval:matrix
```

The dynamic commands use Promptfoo's Codex SDK provider in a disposable Git repository with the Skill
materialized only from the frozen Git tree. Network and approvals are disabled, and the repository
rule fixture requires `run-bounded-mission` only for non-trivial implementation or delivery. Raw
results remain ignored; only reviewed summaries may become baselines.

- `smoke` exercises explicit activation and a quoted-token answer-only near miss.
- `full` adds the maintained public golden behavior corpus and repeats each case twice.
- `holdout` runs a public withheld-regression file excluded from normal tuning, and only from a clean
  committed candidate with exact commit/tree/Skill-tree/matrix binding. It is author-readable, so it
  is not blind-holdout evidence; blind-holdout and 9.5 completion evidence are currently unavailable.
- `matrix` changes only the declared model/reasoning-effort cell.

See [the evaluation contract](evals/CONTRACT.md) for the observation boundary, thresholds, evidence
fields, and honest unavailable rules.

## Capability boundary

| Surface | Runtime capability | Repository convention |
| --- | --- | --- |
| Agent Skills | `SKILL.md` with progressive `references/`, `scripts/`, and `assets/` | `skills/<name>/` is the only distributable source |
| Codex | Local Skill discovery and direct installation | No repository-local hook, MCP server, state, or permission grant |
| Other agents | Consumer-specific install paths and activation behavior | `skills@1.5.22` performs explicit copy/symlink installation |
| Evaluation | Provider-specific model execution and telemetry | Promptfoo `0.122.0`, versioned cases, frozen matrix, heuristic Skill-path replay, raw unavailable fields |

The open [Agent Skills specification](https://agentskills.io/specification) defines the portable
format. OpenAI's [Skill documentation](https://learn.chatgpt.com/docs/build-skills) defines Codex and
ChatGPT behavior. Directories such as `evals/` and `agents/` are repository or product conventions;
they are not portable Skill runtime capabilities. `allowed-tools`, installation, authorization,
model selection, telemetry, hooks, and persistent state remain consumer-specific.

## Security and data

- Treat Skill scripts, Promptfoo configuration, providers, assertions, and fixtures as code with the
  invoking user's permissions; they are not a sandbox boundary.
- Evaluation dependencies are development-only and may carry transitive advisories. Bootstrap with
  lifecycle scripts disabled, review `npm audit`, and do not expose the evaluator to untrusted input.
- Never commit credentials, private transcripts, private task locators, incident text, or business
  repositories to public cases.
- Run dynamic evaluations with least-privileged credentials and restricted egress.
- Preserve raw provider-reported token fields. Do not infer cost when the provider does not report it
  or the pricing source is not versioned.

The repository does not currently declare a license. Public visibility alone does not grant reuse or
redistribution rights.
