---
name: workflow-publish
description: "Publish a tested workflow/2 version to the project's Core Agent, after confirmation."
---

# /aikido:workflow-publish

Check whether the current project has an AI-KIDO installation and read its `.aikido/lock.json` first. If the project has `prompts/hard_points/commands/workflow-publish.md`, use that project-pinned command. Otherwise use the bundled command at `${CLAUDE_PLUGIN_ROOT}/payload/prompts/hard_points/commands/workflow-publish.md`. Never write into the plugin cache.

Follow that command's instructions exactly. A plugin install does not initialize or update the project by itself.