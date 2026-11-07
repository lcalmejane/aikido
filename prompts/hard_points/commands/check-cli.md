---
description: "Audit and safely register all AI-KIDO distribution interfaces for the calling CLI"
---

# /check-cli

Audit every project-level interface in the selected host distribution:
catalog agents/personas and commands (including `/check-cli` and its
`/check-claude` alias), bundled system Skills, separately installed Skills,
and host instruction/configuration surfaces. Use the packaged
`distribution/catalog.json`, templates and renderer runtime as the only
inventory and layout source. Shared `AGENTS.md` is also the instructions
entry point for Copilot; Claude Code additionally uses `CLAUDE.md`, while
Zoo/Roo agent modes are checked through the catalog's `.roomodes` surface.

## Host identity

Use the **calling CLI's host identity**, not the selected model and not the
presence of `.claude/`, `.roo/`, `.github/`, or another host directory. Prefer
the host identifier explicitly supplied by the active command integration. If
the runtime cannot establish it, ask the user to select an ID from
`distribution/catalog.json`; do not guess. Pass that identity as `--host`.

## Execution

Prefer the package root supplied by the active host integration (for Claude
Code, its active plugin root). For a workspace-only installation, use
`.aikido/state/cli-runtime/<calling-host-id>/` when the installer has retained
the package there. The persistent package contains `scripts/check-cli.mjs`,
`lib/`, `templates/`, and `catalog.json`; validate it with its
`scripts/validate-package.mjs` before using it.
Select the host from the actual caller context first, never from whichever
runtime directories exist. Do not search unrelated plugin caches or use
a temporary build directory. If neither package root, runtime nor catalog is
available, stop and report that fact; do not reconstruct wrappers by hand.

For every host, first discover the current executor's tools following the
[Kimono capability gate](../system/search/SKILL.md#kimono-capability-gate).
Pass the complete, verified inventory as `AIKIDO_TOOLS` (a JSON array of exact
callable names) or `--tools-file <inventory.json>`. A connected remote MCP is
eligible only when the host exposes its tools; a configured URL is not proof.
The runtime reports `kimono.status` and `kimono.tools` and refreshes the local
`kimono` flag only with a supplied inventory. No inventory means `unknown`,
without clearing an existing flag. The same input is accepted by packaged
bootstrap and update; none of these scripts opens MCP connections or reads secrets.
`--dry-run` leaves both Kimono and RTK state untouched.

For `zoo-code`, the check detects RTK by running `rtk --version` and records
`rtk: ON` or `rtk: OFF` in the local, Git-ignored
`.aikido/state/features.json`. Updating this file, with RTK and/or Kimono flags
merged together, is the only project write performed by a normal check;
`--repair --dry-run` does not write it. Install and update use
the same detection to include or remove `.roo/rules/rtk.md`.

## RTK detection for command optimization

`--detect-features` enables the same RTK detection for **any calling host**,
including Claude Code, Codex and Copilot. Without this option or a supplied
Kimono inventory, other hosts' normal checks remain read-only. Use this gate from
[/optimize-command-with-aikido-agents](optimize-command-with-aikido-agents.md)
and [/create-command](create-command.md), using the validated runtime and
caller identity described above:

```bash
node "<distribution-root>/scripts/check-cli.mjs" \
  --root "<project-root>" --host "<calling-host-id>" --check --detect-features
```

Add `--dry-run` to detect without writing, including during analysis before
the user selects a dry-run or approves changes. Read `featureFlags.rtk` from
the JSON result; never trust a stale saved flag or infer RTK from host/model.
Pass the current tool inventory too, and apply the shared Kimono gate before
recommending search substitutions. Keep Kimono retrieval and RTK shell-output
opportunities separate; preserve native verification and explicit fallbacks.
Only a missing executable means `OFF`; execution errors must stop detection
and be reported, not treated as absence. Preserve other flags and the portable
lock. This gate does not install RTK, hooks or the Zoo Code rule.

When `ON`, consider RTK as a separate shell-output optimization, not an agent:
use it only for supported commands whose reduced output preserves the required
result. Check support with `rtk --help`; keep native tools and unsupported
commands unchanged. Never compress output consumed by a parser, exact-content
comparison or exhaustive inventory. Avoid double-prefixing `rtk` and leave
existing rewrite hooks intact. When `OFF`, use original commands without RTK.
Generated commands must retain this runtime condition, never hard-code the
current machine's `ON` state or require RTK on another installation. Include
the flag, eligible substitutions, skipped commands and reasons in optimization
reports. Report RTK gains separately from agent gains; use measurements when
available (`rtk gain`), otherwise mark them unmeasured.

First run the audit:

```bash
node "<distribution-root>/scripts/check-cli.mjs" \
  --root "<project-root>" --host "<calling-host-id>" --check
```

The script emits one JSON result with `created`, `updated`, `unchanged`,
`removed`, `conflicts`, `unsupported`, and a separate `runtimeDiscovery`
result. File conformance is not proof that the CLI has discovered or loaded a
wrapper.

For a preview of changes:

```bash
node "<distribution-root>/scripts/check-cli.mjs" \
  --root "<project-root>" --host "<calling-host-id>" --repair --dry-run
```

Show the plan and conflicts to the user. Apply only after explicit approval:

```bash
node "<distribution-root>/scripts/check-cli.mjs" \
  --root "<project-root>" --host "<calling-host-id>" --repair
```

Apart from the feature-state detection above, the engine only reads
Markdown, the distribution catalog, templates, the project lock and wrapper
configuration. It never executes installed skill
scripts, install hooks, providers, MCP configuration or secrets. It writes
only the selected host's declared wrapper and instruction surfaces. Generated
blocks are marked; updates replace only those blocks. Recognizable legacy
wrappers are accepted without being rewritten. Unmarked custom files, edited
metadata, symlinks, target collisions and custom content that cannot be safely
preserved are reported as conflicts, not overwritten. Instruction blocks are
updated only when the installed lock confirms their unchanged baseline.
Removed canonical skills cause only clean generated wrappers to be removed;
customized orphans remain conflicts.

## Legacy command

`/check-claude` is a strict alias for this full pipeline with
`--host claude-code`. Its Claude-specific instruction checks include the
managed `CLAUDE.md` block and preserve content outside that block; do not run
a second, independent legacy wrapper-generation workflow.
