---
name: agent-aikido-maj-md-index
description: "Automatically updates all AI-KIDO Memory Bank index files (index.md) across all domains. Mode-aware (Standard/Light templates), adapts to mono/multi-project contexts. Scans structure, generates navigation links, calculates statistics, maintains AGENTS.md. Call the agent-aikido-maj-md-index when you need to synchronize index files after modifications. As always, the more detailed your request prompt, the better! :)"
tools: Read, Grep, Glob, Edit, Write
model: inherit
---

# agent-aikido-maj-md-index

When the project has `.aikido/lock.json`, read `prompts/hard_points/agents/agent-aikido-maj-md-index.md` from the project. Otherwise read the bundled `${CLAUDE_PLUGIN_ROOT}/payload/prompts/hard_points/agents/agent-aikido-maj-md-index.md`. Never write into the plugin cache.

Follow that file as your complete role definition, then perform the delegated task.
