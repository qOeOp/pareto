# qOeOp Skills

A portable Agent Skills collection with deterministic validation and reproducible model evaluations.
The repository keeps runtime skills under one authority, `skills/`, and evaluation assets under
`evals/`.

## Install

List or install skills across Codex, Claude Code, Cursor, and other supported consumers with the
pinned [`skills`](https://github.com/vercel-labs/skills) CLI:

```bash
npx -y skills@1.5.22 add qOeOp/skills --list
npx -y skills@1.5.22 add qOeOp/skills --skill lightweight-charts --agent codex --global --copy --yes
npx -y skills@1.5.22 add qOeOp/skills --skill midscene-visual-testing --agent claude-code --global --copy --yes
```

Use a release tag or commit after the repository name when reproducibility matters, for example
`qOeOp/skills@v0.1.0`. Update and uninstall through the same CLI:

```bash
npx -y skills@1.5.22 update --global --yes
npx -y skills@1.5.22 remove --global lightweight-charts --yes
```

Codex can also install one skill directly from its GitHub directory with `$skill-installer`.

## Validate and evaluate

Node.js 22.22 or newer is required for repository development. Skill consumers do not need these
development dependencies.

```bash
npm ci
npm run check
npm run eval:smoke
npm run eval:full
npm run eval:holdout
npm run eval:matrix
```

The dynamic commands use Promptfoo's Codex SDK provider in a disposable Git repository with a
read-only filesystem sandbox, network disabled, approvals disabled, and a fresh response cache.
They require a working Codex login or an explicitly supplied provider credential. Raw results are
local ignored artifacts; only reviewed, sanitized summaries may become baselines.

- `smoke` proves the runner, Skill discovery, one positive task, and one near-miss negative control.
- `full` adds maintained public regression cases and repeats trials.
- `holdout` is excluded from normal tuning and runs only against a frozen release candidate.
- `matrix` changes only the declared model/reasoning-effort cell and records provider-reported usage.

See [the evaluation contract](evals/CONTRACT.md) for thresholds, evidence fields, holdout rules, and
the generalized workflow scenario families.

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
- Never commit credentials, private transcripts, private task locators, incident text, or business
  repositories to public cases.
- Run dynamic evaluations with least-privileged credentials and restricted egress.
- Preserve raw provider-reported token fields. Do not infer cost when the provider does not report it
  or the pricing source is not versioned.

The repository does not currently declare a license. Public visibility alone does not grant reuse or
redistribution rights.
