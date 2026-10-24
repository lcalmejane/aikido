---
name: validate-search-plan
description: "Validate the structure and coherence of a code search plan against agent-aikido-explore-code requirements"
---

# /aikido:validate-search-plan

Check whether the current project has an AI-KIDO installation and read its `.aikido/lock.json` first. If the project has `prompts/hard_points/commands/validate-search-plan.md`, use that project-pinned command. Otherwise use the bundled command at `${CLAUDE_PLUGIN_ROOT}/payload/prompts/hard_points/commands/validate-search-plan.md`. Never write into the plugin cache.

Follow that command's instructions exactly. A plugin install does not initialize or update the project by itself.