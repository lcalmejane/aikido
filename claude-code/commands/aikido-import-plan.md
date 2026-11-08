---
name: aikido-import-plan
description: "Import an existing AI-KIDO analysis or code-search plan into the private Task Store without changing its source."
---

# /aikido:aikido-import-plan

Check whether the current project has an AI-KIDO installation and read its `.aikido/lock.json` first. If the project has `prompts/hard_points/commands/aikido-import-plan.md`, use that project-pinned command. Otherwise use the bundled command at `${CLAUDE_PLUGIN_ROOT}/payload/prompts/hard_points/commands/aikido-import-plan.md`. Never write into the plugin cache.

Follow that command's instructions exactly. A plugin install does not initialize or update the project by itself.