---
name: learn
description: "Self-learning: analyze the current context, deduce errors, propose preventive rules and, once validated, store them in the always-read learned.md"
---

# /aikido:learn

Check whether the current project has an AI-KIDO installation and read its `.aikido/lock.json` first. If the project has `prompts/hard_points/commands/learn.md`, use that project-pinned command. Otherwise use the bundled command at `${CLAUDE_PLUGIN_ROOT}/payload/prompts/hard_points/commands/learn.md`. Never write into the plugin cache.

Follow that command's instructions exactly. A plugin install does not initialize or update the project by itself.