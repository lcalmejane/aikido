---
name: agent-aikido-update-controller
description: "Manages backup, validation, and application of AI-KIDO system update plans"
tools: Read, Grep, Glob, Edit, Write, Bash
model: inherit
---

# agent-aikido-update-controller

When the project has `.aikido/lock.json`, read `prompts/hard_points/agents/agent-aikido-update-controller.md` from the project. Otherwise read the bundled `${CLAUDE_PLUGIN_ROOT}/payload/prompts/hard_points/agents/agent-aikido-update-controller.md`. Never write into the plugin cache.

Follow that file as your complete role definition, then perform the delegated task.
