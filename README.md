# qOeOp Skills

A portable Agent Skills collection with deterministic validation and reproducible model evaluations.
The repository keeps runtime skills under one authority, `skills/`, and evaluation assets under
`evals/`.

## Install

Runtime installation is intentionally unavailable in this cleanup candidate. Distribution is
admitted only when `skills/` contains at least one real maintained Skill with matching validation and
evaluation evidence; an empty inventory fails closed.

## Validate and evaluate

Node.js 22.22 or newer is required for repository development. Skill consumers do not need these
development dependencies.

```bash
npm ci --ignore-scripts
npm run check
```

The cleanup candidate intentionally cannot pass `npm run check`: the production validator requires a
real Skill, executable cases, and a bound baseline. Evaluation commands and install instructions are
re-admitted only with those real consumers. See [the evaluation contract](evals/CONTRACT.md) for the
fail-closed requirements and generalized workflow scenario families.

## Capability boundary

| Surface | Runtime capability | Repository convention |
| --- | --- | --- |
| Agent Skills | `SKILL.md` with progressive `references/`, `scripts/`, and `assets/` | `skills/<name>/` is the only distributable source |
| Codex | Local Skill discovery and direct installation | No repository-local hook, MCP server, state, or permission grant |
| Other agents | Consumer-specific install paths and activation behavior | `skills@1.5.22` performs explicit copy/symlink installation |
| Evaluation | Provider-specific model execution and telemetry | Promptfoo `0.122.0`, versioned cases, frozen matrix, raw unavailable fields |

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
