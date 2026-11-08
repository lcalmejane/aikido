---
name: init-glossaire
description: "Create or update the project business glossary organized by domains/expert personas in AI-KIDO Memory Bank"
---

# /init-glossaire

Read and execute `prompts/hard_points/commands/init-glossaire.md` from the initialized project's AI-KIDO Memory Bank.

Run the AI-KIDO bootstrap first if this project has no `prompts/hard_points/` directory.

Before searching, apply `prompts/hard_points/system/search/SKILL.md#kimono-capability-gate`: prefer Kimono only when its tools are actually exposed to this executor; keep native search for verification or explicit fallback. Never assume parent MCP tools are inherited or widen tool permissions.
