---
name: aikido-plan-task
description: "Create and instantiate a private task plan against a versioned workflow."
---

# /aikido:aikido-plan-task

Check whether the current project has an AI-KIDO installation and read its `.aikido/lock.json` first. If the project has `prompts/hard_points/commands/aikido-plan-task.md`, use that project-pinned command. Otherwise use the bundled command at `${CLAUDE_PLUGIN_ROOT}/payload/prompts/hard_points/commands/aikido-plan-task.md`. Never write into the plugin cache.

Follow that command's instructions exactly. A plugin install does not initialize or update the project by itself.