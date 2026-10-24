---
name: skill-manage
description: "Manage the complete lifecycle of AI-KIDO skills: search, install, update, and uninstall from a remote Git group"
---

# /aikido:skill-manage

Check whether the current project has an AI-KIDO installation and read its `.aikido/lock.json` first. If the project has `prompts/hard_points/commands/skill-manage.md`, use that project-pinned command. Otherwise use the bundled command at `${CLAUDE_PLUGIN_ROOT}/payload/prompts/hard_points/commands/skill-manage.md`. Never write into the plugin cache.

Follow that command's instructions exactly. A plugin install does not initialize or update the project by itself.