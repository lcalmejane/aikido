---
name: analyse-aikido
description: "Complete audit of AI-KIDO Truth Tables to detect drifts, inconsistencies, and broken links"
---

# /aikido:analyse-aikido

Check whether the current project has an AI-KIDO installation and read its `.aikido/lock.json` first. If the project has `prompts/hard_points/commands/analyse-aikido.md`, use that project-pinned command. Otherwise use the bundled command at `${CLAUDE_PLUGIN_ROOT}/payload/prompts/hard_points/commands/analyse-aikido.md`. Never write into the plugin cache.

Follow that command's instructions exactly. A plugin install does not initialize or update the project by itself.