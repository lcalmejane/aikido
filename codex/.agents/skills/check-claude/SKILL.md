---
name: check-claude
description: "Run the AI-KIDO distribution audit for Claude Code"
---

# $check-claude

Read and execute `prompts/hard_points/commands/check-claude.md` from the initialized project's AI-KIDO Memory Bank.

Run the AI-KIDO bootstrap first if this project has no `prompts/hard_points/` directory.

Before searching, apply `prompts/hard_points/system/search/SKILL.md#kimono-capability-gate`: prefer Kimono only when its tools are actually exposed to this executor; keep native search for verification or explicit fallback. Never assume parent MCP tools are inherited or widen tool permissions.
