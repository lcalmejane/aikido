---
name: compile-agent-from-use
description: "Interactive compilation of specialized AI-KIDO agents with user questionnaire"
---

# /aikido:compile-agent-from-use

Check whether the current project has an AI-KIDO installation and read its `.aikido/lock.json` first. If the project has `prompts/hard_points/commands/compile-agent-from-use.md`, use that project-pinned command. Otherwise use the bundled command at `${CLAUDE_PLUGIN_ROOT}/payload/prompts/hard_points/commands/compile-agent-from-use.md`. Never write into the plugin cache.

Follow that command's instructions exactly. A plugin install does not initialize or update the project by itself.