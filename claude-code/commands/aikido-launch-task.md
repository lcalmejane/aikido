---
name: aikido-launch-task
description: "Launch an explicitly requested private task through a verified authenticated host action."
---

# /aikido:aikido-launch-task

Check whether the current project has an AI-KIDO installation and read its `.aikido/lock.json` first. If the project has `prompts/hard_points/commands/aikido-launch-task.md`, use that project-pinned command. Otherwise use the bundled command at `${CLAUDE_PLUGIN_ROOT}/payload/prompts/hard_points/commands/aikido-launch-task.md`. Never write into the plugin cache.

Follow that command's instructions exactly. A plugin install does not initialize or update the project by itself.