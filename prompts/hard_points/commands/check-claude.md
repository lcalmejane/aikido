---
description: "Run the AI-KIDO distribution audit for Claude Code"
---

# /check-claude

This command is a strict compatibility alias for `/check-cli` with the fixed
host ID `claude-code`. It does not run an independent wrapper-generation
workflow.

Run the packaged `scripts/check-cli.mjs` from the installed AI-KIDO
distribution against the current project:

```bash
node "<installed-claude-code-distribution>/scripts/check-cli.mjs" \
  --root "<project-root>" --host claude-code --check
```

The audit includes Claude Code's `.claude/commands`, `.claude/agents` and
`.claude/skills` surfaces, plus the shared `AGENTS.md` and Claude-specific
`CLAUDE.md` instruction blocks. The latter must retain its `@AGENTS.md` and
`@prompts/gen/learned.md` imports. Follow `/check-cli`'s review, dry-run and
explicit-approval requirements before applying repairs.
