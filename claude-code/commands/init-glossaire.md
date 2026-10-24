---
name: init-glossaire
description: "Create or update the project business glossary organized by domains/expert personas in AI-KIDO Memory Bank"
---

# /aikido:init-glossaire

Check whether the current project has an AI-KIDO installation and read its `.aikido/lock.json` first. If the project has `prompts/hard_points/commands/init-glossaire.md`, use that project-pinned command. Otherwise use the bundled command at `${CLAUDE_PLUGIN_ROOT}/payload/prompts/hard_points/commands/init-glossaire.md`. Never write into the plugin cache.

Follow that command's instructions exactly. A plugin install does not initialize or update the project by itself.