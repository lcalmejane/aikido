---
description: "Run the AI-KIDO distribution audit for Claude Code"
---

# /check-claude

This command is a strict compatibility alias for `/check-cli` with the fixed
host ID `claude-code`. It does not run an independent wrapper-generation
workflow.

Use an exposed host direct-process action to invoke Node and the installed
distribution's `scripts/check-cli.mjs`, passing the current project root,
fixed host ID `claude-code` and `--check` as separate argv entries according
to `/check-cli`. Resolve the package root as described in `/check-cli`;
workspace-only installations can retain it in
`.aikido/state/cli-runtime/claude-code/`. Do not invoke a shell or infer host
identity from installed directories.

The audit includes Claude Code's `.claude/commands`, `.claude/agents` and
`.claude/skills` surfaces, plus the shared `AGENTS.md` and Claude-specific
`CLAUDE.md` instruction blocks. The latter must retain its `@AGENTS.md` and
`@prompts/gen/learned.md` imports. Follow `/check-cli`'s review, dry-run and
explicit-approval requirements before applying repairs.
