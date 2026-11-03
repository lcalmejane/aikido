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

Resolve the package root from the active host integration's installed
distribution (for Claude Code, its active plugin root). The persistent package
contains `scripts/check-cli.mjs`, `lib/`, `templates/`, and `catalog.json`.
Never look for it under the project root or use a temporary build directory.
If the active package root, runtime or catalog is unavailable, stop and report
that fact; do not reconstruct wrappers by hand.

First run a read-only audit:

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

The engine only reads Markdown, the distribution catalog, templates, the
project lock and wrapper configuration. It never executes installed skill
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
