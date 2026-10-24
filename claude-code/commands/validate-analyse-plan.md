---
name: validate-analyse-plan
description: "Validate the structure and coherence of an analysis plan against /analyse-project requirements"
---

# /aikido:validate-analyse-plan

Check whether the current project has an AI-KIDO installation and read its `.aikido/lock.json` first. If the project has `prompts/hard_points/commands/validate-analyse-plan.md`, use that project-pinned command. Otherwise use the bundled command at `${CLAUDE_PLUGIN_ROOT}/payload/prompts/hard_points/commands/validate-analyse-plan.md`. Never write into the plugin cache.

Follow that command's instructions exactly. A plugin install does not initialize or update the project by itself.