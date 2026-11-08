---
name: aikido-schedule-task
description: "Schedule an explicitly requested private task through a verified authenticated Core host action."
---

# /aikido:aikido-schedule-task

Check whether the current project has an AI-KIDO installation and read its `.aikido/lock.json` first. If the project has `prompts/hard_points/commands/aikido-schedule-task.md`, use that project-pinned command. Otherwise use the bundled command at `${CLAUDE_PLUGIN_ROOT}/payload/prompts/hard_points/commands/aikido-schedule-task.md`. Never write into the plugin cache.

Follow that command's instructions exactly. A plugin install does not initialize or update the project by itself.