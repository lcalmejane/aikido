---
name: check-truth
description: "Verify coherence between AI-KIDO documentation and source code, detect obsolescence, and propose automatic remediation"
---

# /aikido:check-truth

Check whether the current project has an AI-KIDO installation and read its `.aikido/lock.json` first. If the project has `prompts/hard_points/commands/check-truth.md`, use that project-pinned command. Otherwise use the bundled command at `${CLAUDE_PLUGIN_ROOT}/payload/prompts/hard_points/commands/check-truth.md`. Never write into the plugin cache.

Follow that command's instructions exactly. A plugin install does not initialize or update the project by itself.