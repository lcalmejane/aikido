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

Before using the Node runtime, inspect the current host's Node capability and
version. The stable Node 24+ baseline is the target; do not assume Node is
present because another host or executor has it. If the capability is absent,
denied or fails, report that the runtime audit is unavailable; never install
Node or change permissions automatically.

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
Use an exposed host direct-process action to launch Node with the packaged
`scripts/check-cli.mjs` and each flag or value as a separate argv entry.
Alternatively, an actual host Node execution facility may import the packaged
`auditCli` API directly. `host-actions.mjs` is a library, not an automatically
registered Tool. Do not construct shell text; if neither execution facility is
available, report the limitation and stop.

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

For `zoo-code`, the check detects RTK through the packaged host-feature
inspection and records `rtk: ON` or `rtk: OFF` in the local, Git-ignored
`.aikido/state/features.json`. Updating this file, with RTK and/or Kimono flags
merged together, is the only project write performed by a normal check;
`--repair --dry-run` does not write it. Install and update use
the same detection to include or remove `.roo/rules/rtk.md`.

## RTK detection for command optimization

`detectFeatures: true` enables the same RTK detection for **any calling host**,
including Claude Code, Codex and Copilot. Without this option or a supplied
Kimono inventory, other hosts' normal checks remain read-only. Use this gate from
[/optimize-command-with-aikido-agents](optimize-command-with-aikido-agents.md)
and [/create-command](create-command.md), using the validated runtime and
caller identity described above:

Invoke the packaged Node script using the verified host identity and separate
argv entries for `--root`, the project root, `--host`, the host ID, `--check`
and `--detect-features`.

Add `--dry-run` to detect without writing, including during analysis before
the user selects a dry-run or approves changes. Read `featureFlags.rtk` from
the JSON result; never trust a stale saved flag or infer RTK from host/model.
Pass the current tool inventory too, and apply the shared Kimono gate before
recommending search substitutions. Keep Kimono retrieval and RTK shell-output
opportunities separate; preserve native verification and explicit fallbacks.
Only a confirmed missing executable means `OFF`; permission errors and other
inspection failures must stop detection and be reported, not treated as
absence. Preserve other flags and the portable lock. This gate does not install
RTK, hooks or the Zoo Code rule.

When `ON`, consider RTK as a separate output optimization, not an agent: use it
only for supported host actions whose reduced output preserves the required
result. Obtain its supported-action list from the host, keep native tools and
unsupported actions unchanged, and never compress output consumed by a parser,
exact-content comparison or exhaustive inventory. Avoid duplicate RTK
processing and leave existing rewrite hooks intact. When `OFF`, use original
host actions without RTK.
Generated commands must retain this runtime condition, never hard-code the
current machine's `ON` state or require RTK on another installation. Include
the flag, eligible substitutions, skipped commands and reasons in optimization
reports. Report RTK gains separately from agent gains; use measurements when
available (`rtk gain`), otherwise mark them unmeasured.

First invoke the packaged script with separate argv entries `--root`, the
project root, `--host`, the verified host ID, and `--check`.

The script emits one JSON result with `created`, `updated`, `unchanged`,
`removed`, `conflicts`, `unsupported`, and a separate `runtimeDiscovery`
result. `nodeRuntime` reports the version, executable and baseline assessment
of this process only; `below-baseline` is an advisory, not a proof of failure.
It does not establish availability or permission in another executor. File
conformance is not proof that the CLI has discovered or loaded a wrapper.

For a preview, call the same script with root and host, followed by separate
`--repair` and `--dry-run` argv entries.

Show the plan and conflicts to the user. Apply only after explicit approval by
calling the same script with root, host and `--repair`, without `--dry-run`.

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

## All installed CLIs

`/check-cli` audits the calling host. To wrap every assistant CLI installed on the
machine or in the workspace, use the host-sync entry point
`prompts/hard_points/system/host-sync/host-sync.mjs` (or `aikido sync` / `aikido check`
from the npm package). It detects CLIs from `PATH` and editor extensions only, then
runs the retained runtime once per detected host. It never writes outside the
catalog-declared targets. Use `--check` or `--dry-run` first.

## Legacy command

`/check-claude` is a strict alias for this full pipeline with
`--host claude-code`. Its Claude-specific instruction checks include the
managed `CLAUDE.md` block and preserve content outside that block; do not run
a second, independent legacy wrapper-generation workflow.
