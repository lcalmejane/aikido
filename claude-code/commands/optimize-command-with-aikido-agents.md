---
name: optimize-command-with-aikido-agents
description: "Analyze and optimize AI-KIDO commands with available technical agents"
---

# /aikido:optimize-command-with-aikido-agents

Check whether the current project has an AI-KIDO installation and read its `.aikido/lock.json` first. If the project has `prompts/hard_points/commands/optimize-command-with-aikido-agents.md`, use that project-pinned command. Otherwise use the bundled command at `${CLAUDE_PLUGIN_ROOT}/payload/prompts/hard_points/commands/optimize-command-with-aikido-agents.md`. Never write into the plugin cache.

Follow that command's instructions exactly. A plugin install does not initialize or update the project by itself.