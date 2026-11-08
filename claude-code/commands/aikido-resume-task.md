---
name: aikido-resume-task
description: "Resume a waiting task with a revision-checked state change."
---

# /aikido:aikido-resume-task

Check whether the current project has an AI-KIDO installation and read its `.aikido/lock.json` first. If the project has `prompts/hard_points/commands/aikido-resume-task.md`, use that project-pinned command. Otherwise use the bundled command at `${CLAUDE_PLUGIN_ROOT}/payload/prompts/hard_points/commands/aikido-resume-task.md`. Never write into the plugin cache.

Follow that command's instructions exactly. A plugin install does not initialize or update the project by itself.