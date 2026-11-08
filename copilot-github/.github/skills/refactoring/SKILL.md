---
name: refactoring
description: "Use when refactoring or mass-editing a codebase or the Memory Bank: choose the cheapest deterministic route (existing tool, generic Node engine, temporary script outside Git, or direct edit), split large file sets into wide batches, and report only short ok/failure results."
---

# Refactoring - System Skill

Runtime: Node.js 24+ (`.mjs`, no dependency), per the
[Default Tooling Standard](../../../prompts/hard_points/system/Skills.md#default-tooling-standard-nodejs).
Used by [`agent-aikido-refactoring`](../../../prompts/hard_points/agents/agent-aikido-refactoring.md).

## Goal

Change many files at the lowest token cost with deterministic, reviewable,
reversible results. Never paste large file lists or file contents into the
context: pass counts, batch ids and short samples.

## Step 0 - Capabilities (once per task, never assumed)

- **RTK**: follow the runtime gate in
  [check-cli](../../../prompts/hard_points/commands/check-cli.md#rtk-detection-for-command-optimization).
  When ON, use it only for shell output nobody parses; never for the engine's JSON.
- **Kimono**: follow the
  [capability gate](../../../prompts/hard_points/system/search/SKILL.md#kimono-capability-gate) to locate
  call sites, then verify exact text with native reads. Fall back explicitly.
- **Scope first**: apply [scope-first](../../../prompts/hard_points/system/search/scope-first.md); state paths,
  extensions and exclusions before any search or plan.
- **Swarm / parallel workers**: only as described in
  [swarm.md](../../../prompts/hard_points/system/orchestrator/swarm.md), selected from verified executor tools.

## Step 1 - Choose the route (stop at the first that fits)

| # | Route | Use when | Cost |
|---|---|---|---|
| 1 | Existing tool | A formatter, codemod, linter `--fix`, IDE rename or project script already does it | lowest |
| 2 | Engine `refactor.mjs` | Literal/regex find-and-replace across files, same rule everywhere | low |
| 3 | Temporary script outside Git | Rule needs logic (AST-like parsing, moves, per-file conditions) but is still deterministic | low-medium |
| 4 | Direct edit | 1-3 files, or each change needs judgement | per-file |

Decide from the number of files and whether the rule is mechanical. State the
chosen route and why in one line. Judgement-heavy work on many files goes to
sub-agents (Step 4), never to a script that guesses.

## Step 2 - Engine commands

`node prompts/hard_points/system/refactoring/scripts/refactor.mjs <command> --root <project> [options]`

Every command prints one JSON object and exits nonzero unless `status` is `ok`
(`stale`, `partial`, `error` are failures). State is stored outside the
project, in `<tmp>/aikido-refactor/<root-hash>/` (override with
`AIKIDO_REFACTOR_STATE`); nothing is written to Git.

| Command | Purpose |
|---|---|
| `scan` | Counts, bytes, extension histogram, short sample |
| `batches --batch-size N --batch-bytes N` | Split the scope into wide batches, return a manifest id |
| `batch --manifest ID --index N` | File list of one batch (give this to one sub-agent) |
| `plan --find X --replace Y [--regex --word --ignore-case --flags f]` | Dry analysis: files, matches, per-file hash |
| `apply --plan ID [--batch N] [--dry-run]` | Write with backup; refuses if any file changed since the plan |
| `rollback --plan ID [--force]` | Restore originals; keeps later human edits unless `--force` |
| `report --plan ID` | applied / remaining counters |
| `script-new --name NAME` | Create a temporary script from the template (route 3) |

Scope options, shared by `scan`, `batches` and `plan`: `--path` (repeatable),
`--ext`, `--include`/`--exclude` globs, `--max-bytes`, `--no-git`. Scope follows
`.gitignore` inside a Git repository, otherwise skips `.git`, `node_modules`,
symlinks, binary and non-UTF-8 files. With `--regex`, `$1` style replacements
apply.

Limits: text find-and-replace only. Renames that must understand syntax
(scoping, imports) use route 1 or 3, and the result is checked with the
project's own tests.

## Step 3 - Temporary scripts (route 3)

1. `script-new` copies the template outside the project. Edit only the scope
   predicate and the pure `transform`.
2. Run it without `--apply` first (dry-run default) and read the counters.
3. Run with `--apply`, then re-run: a second run must change nothing.
4. Delete the script once accepted. Never commit it or place it in `prompts/`.

## Step 4 - Batches and sub-agents

- Prefer **wide** batches (default 40 files / 400 KB); do not split into many
  small tasks. A deterministic batch is applied by the engine in the same
  worker, not delegated.
- Delegate one batch per sub-agent only when the batch needs judgement or its
  context would exceed the budget. Give it: the batch id, the rule, the
  acceptance command and the exclusive file ownership. Batches that share a
  file or resource run sequentially (the orchestrator's resource locks).
- Sub-agents and tools return **short reports**:
  `{"batch":3,"status":"ok","changed":38,"failed":[]}`. On failure add up to 5
  paths with a code, never logs or diffs.
- The coordinator owns integration and acceptance: re-run the project's
  tests/linter, then `report`. Follow the
  [orchestrator contract](../../../prompts/hard_points/system/orchestrator/SKILL.md) when a plan is exchanged.

## Step 5 - Safety and acceptance

- Work on a clean or committed tree when possible; never commit, push or
  publish unasked.
- `plan` before `apply`; `apply --dry-run` for large scopes; apply batch by
  batch when risk is high.
- A `stale` result means someone changed a file: re-plan, do not force.
- Accept only after the project's checks pass; otherwise `rollback`.
- Report: route chosen, scope, files/matches/batches, applied/remaining,
  failures, checks run, RTK/Kimono/Swarm status (ON/OFF/unknown with reason).
  Do not claim token savings that were not measured.
