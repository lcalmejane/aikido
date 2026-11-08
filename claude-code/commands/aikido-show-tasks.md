---
name: aikido-show-tasks
description: "List or inspect private task cards without mutating their state."
---

# /aikido:aikido-show-tasks

Check whether the current project has an AI-KIDO installation and read its `.aikido/lock.json` first. If the project has `prompts/hard_points/commands/aikido-show-tasks.md`, use that project-pinned command. Otherwise use the bundled command at `${CLAUDE_PLUGIN_ROOT}/payload/prompts/hard_points/commands/aikido-show-tasks.md`. Never write into the plugin cache.

Follow that command's instructions exactly. A plugin install does not initialize or update the project by itself.