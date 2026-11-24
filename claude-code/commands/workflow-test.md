---
name: workflow-test
description: "Simulate a workflow/2 with stub agents and report coverage, branches and loop bounds."
---

# /aikido:workflow-test

Check whether the current project has an AI-KIDO installation and read its `.aikido/lock.json` first. If the project has `prompts/hard_points/commands/workflow-test.md`, use that project-pinned command. Otherwise use the bundled command at `${CLAUDE_PLUGIN_ROOT}/payload/prompts/hard_points/commands/workflow-test.md`. Never write into the plugin cache.

Follow that command's instructions exactly. A plugin install does not initialize or update the project by itself.