---
name: init-aikido
description: "Initialize the AI-KIDO Memory Bank with fundamental project elements"
---

# /aikido:init-aikido

Check whether the current project has an AI-KIDO installation and read its `.aikido/lock.json` first. If the project has `prompts/hard_points/commands/init-aikido.md`, use that project-pinned command. Otherwise use the bundled command at `${CLAUDE_PLUGIN_ROOT}/payload/prompts/hard_points/commands/init-aikido.md`. Never write into the plugin cache.

If `.aikido/lock.json` is missing, install the project files before initializing: ask the user to choose STANDARD, LIGHT or UNSET, then run `node "${CLAUDE_PLUGIN_ROOT}/scripts/bootstrap-plan.mjs" --root "<project-root>" --package "${CLAUDE_PLUGIN_ROOT}" --mode <mode>`. Show the plan, and only after the user confirms its exact plan ID rerun it with `--apply --confirm <plan-id>`. Never copy payload files manually. Then continue with the project-pinned command.

Follow that command's instructions exactly. A plugin install does not initialize or update the project by itself.