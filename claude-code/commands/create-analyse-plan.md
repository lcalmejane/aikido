---
name: create-analyse-plan
description: "Create a new project analysis plan for /analyse-project by guiding the user through the process"
---

# /aikido:create-analyse-plan

Check whether the current project has an AI-KIDO installation and read its `.aikido/lock.json` first. If the project has `prompts/hard_points/commands/create-analyse-plan.md`, use that project-pinned command. Otherwise use the bundled command at `${CLAUDE_PLUGIN_ROOT}/payload/prompts/hard_points/commands/create-analyse-plan.md`. Never write into the plugin cache.

Follow that command's instructions exactly. A plugin install does not initialize or update the project by itself.