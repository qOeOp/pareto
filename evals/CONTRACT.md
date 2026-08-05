# Evaluation Contract

## Authority and scope

`evals/promptfooconfig.yaml` is the only dynamic harness configuration. Promptfoo owns provider
execution, assertions, repeats, caching, thresholds, and raw result shape. Repository scripts may
prepare a disposable Skill fixture, select a suite, and launch Promptfoo; they must not implement a
second evaluator.

Public cases contain generalized or synthetic data only. Private incidents, transcripts, task
locators, business repositories, credentials, and provider receipts remain external and uncommitted.

## Suites

- `smoke`: one positive Skill route and one near-miss negative control, one trial each.
- `full`: smoke plus public maintained regressions, two trials each.
- `holdout`: cases excluded from normal tuning, three trials each, run only after the candidate and
  matrix are frozen.

Changing a Skill, case, rubric, provider configuration, model, effort, permission, tool surface, or
environment invalidates only results that consume the changed input. A holdout result is never reused
after its candidate or matrix changes.

## Case design

Executable cases live in `cases/cases.yaml`. Descriptions carry the suite selector; prompts express
consumer tasks rather than expected wording. Assertions prefer deterministic observable behavior.
Model-graded rubrics are used only when semantic quality cannot be reduced to a stable deterministic
check.

`cases/workflow-families.json` holds generalized future workflow-skill families. They are corpus
authority, not runtime workflow authority, and are not executable until a real target Skill and
consumer contract are deliberately admitted. The required families are task recovery, hub/child
authority, dependency DAG and supersession, evaluator admission, provider unavailability fallback,
stale worktree bootstrap, exact-head delivery, coordination churn, and conditional BDD/TDD/playbook
routing.

## Trial evidence

Keep Promptfoo's raw per-trial evidence locally. A committed baseline summary may contain only:

- exact repository commit or tree and Skill digest;
- case and suite IDs;
- provider, exact model, and reasoning effort, or `unavailable`;
- pass/fail plus assertion and rubric scores;
- elapsed time and provider-reported input, output, cached-input, and reasoning tokens;
- provider-reported cost, a versioned price-source calculation, or `unavailable`;
- trial count, pass rate, mean, median, p95, and variance when repeated observations exist;
- environment and tool versions needed to reproduce the comparison.

Never estimate a missing provider field or expose a local absolute path, credential, thread/session
identifier, private source locator, prompt cache, or raw transcript in a committed baseline.

## Regression rule

A route below a safety or required-behavior floor fails regardless of aggregate score. For comparable
pre/post runs, reject a change when any critical deterministic assertion regresses, holdout pass rate
falls, or semantic quality falls without an explicitly accepted tradeoff. Prefer lower latency,
tokens, cost, or effort only among routes that still pass the same quality and safety floors.

One observation proves only a reachable dynamic path. Stable model/effort guidance requires varied
cases and repeated trials; labels, folder count, or a lower numeric cost cannot supply that evidence.
