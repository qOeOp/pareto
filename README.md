# Pareto

A portable Agent Skills collection with deterministic validation and reproducible model evaluations.
The repository keeps runtime skills under one authority, `skills/`, and evaluation assets under
`evals/`.

## Install

This repository distributes exactly one Skill: `run-bounded-mission`.

```bash
npx -y skills@1.5.22 add qOeOp/pareto --list
npx -y skills@1.5.22 add qOeOp/pareto --skill run-bounded-mission --agent codex --global --copy --yes
npx -y skills@1.5.22 add qOeOp/pareto --skill run-bounded-mission --agent claude-code --global --copy --yes
```

Codex projects that use the bundled custom agent roles should clone a pinned commit and run:

```bash
node scripts/install-codex.mjs --lock /path/to/codex-skills.lock.json
node scripts/install-codex.mjs --check --lock /path/to/codex-skills.lock.json
```

This installs the Skill under `~/.agents/skills/` and only the four owned profiles under
`$CODEX_HOME/agents/` (or `~/.codex/agents/`). The installer never changes unrelated skills or agent
profiles. A project can pin this repository in its root `AGENTS.md`; all of its clones and worktrees
then share the same user-level installation without tracking `.agents/` or `.codex/` copies.
The lock binds the repository, commit, root tree, installed subtrees, installer blob, and presence on
the fetched `origin/main`; a wrong or stale checkout fails before installation.

Use a release tag or commit after the repository name when reproducibility matters. Update or remove
the installed copy through the same pinned CLI.

## Validate and evaluate

Node.js `^22.22.2 || ^24.15.0 || >=26.0.0` is required for repository development. Skill consumers do not need these
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
results remain ignored; committed comparisons stay disabled until a replayable producer and a real
consumer exist.

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
| Codex | User-level Skill discovery and four optional custom agent profiles | Explicit pinned install; no repository-local hook, MCP server, state, or permission grant |
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
