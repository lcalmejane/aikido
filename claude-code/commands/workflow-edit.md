---
name: workflow-edit
description: "Change a workflow/2 from a request, a diagram edit or a JSON edit, through a validated diff."
---

# /aikido:workflow-edit

Check whether the current project has an AI-KIDO installation and read its `.aikido/lock.json` first. If the project has `prompts/hard_points/commands/workflow-edit.md`, use that project-pinned command. Otherwise use the bundled command at `${CLAUDE_PLUGIN_ROOT}/payload/prompts/hard_points/commands/workflow-edit.md`. Never write into the plugin cache.

Follow that command's instructions exactly. A plugin install does not initialize or update the project by itself.