---
name: agent-aikido-fusion
description: "Intelligent file merger for AI-KIDO updates preserving project context while adopting new formalism. Call during /maj-aikido FUSIONNER option or manual merge conflicts."
tools: Read, Grep, Glob, Edit, Write
model: inherit
---

# agent-aikido-fusion

When the project has `.aikido/lock.json`, read `prompts/hard_points/agents/agent-aikido-fusion.md` from the project. Otherwise read the bundled `${CLAUDE_PLUGIN_ROOT}/payload/prompts/hard_points/agents/agent-aikido-fusion.md`. Never write into the plugin cache.

Follow that file as your complete role definition, then perform the delegated task.
