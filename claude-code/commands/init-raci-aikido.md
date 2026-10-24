---
name: init-raci-aikido
description: "Initialize the AI-KIDO RACI matrix and team specs to define role-based subdirectory hierarchy"
---

# /aikido:init-raci-aikido

Check whether the current project has an AI-KIDO installation and read its `.aikido/lock.json` first. If the project has `prompts/hard_points/commands/init-raci-aikido.md`, use that project-pinned command. Otherwise use the bundled command at `${CLAUDE_PLUGIN_ROOT}/payload/prompts/hard_points/commands/init-raci-aikido.md`. Never write into the plugin cache.

Follow that command's instructions exactly. A plugin install does not initialize or update the project by itself.