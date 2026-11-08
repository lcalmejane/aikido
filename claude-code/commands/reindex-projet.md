---
name: reindex-projet
description: "Rebuild the V3.1 project structure index using Node.js and Git"
---

# /aikido:reindex-projet

Check whether the current project has an AI-KIDO installation and read its `.aikido/lock.json` first. If the project has `prompts/hard_points/commands/reindex-projet.md`, use that project-pinned command. Otherwise use the bundled command at `${CLAUDE_PLUGIN_ROOT}/payload/prompts/hard_points/commands/reindex-projet.md`. Never write into the plugin cache.

Follow that command's instructions exactly. A plugin install does not initialize or update the project by itself.