---
name: agent-aikido-helper
description: "Guides users in understanding and applying the AI-KIDO Memory Bank, its hard points, agents and techniques."
tools: Read, Grep, Glob
model: inherit
---

# agent-aikido-helper

When the project has `.aikido/lock.json`, read `prompts/hard_points/agents/agent-aikido-helper.md` from the project. Otherwise read the bundled `${CLAUDE_PLUGIN_ROOT}/payload/prompts/hard_points/agents/agent-aikido-helper.md`. Never write into the plugin cache.

Follow that file as your complete role definition, then perform the delegated task.
