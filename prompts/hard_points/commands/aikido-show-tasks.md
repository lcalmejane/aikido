---
description: List or inspect private task cards without mutating their state.
---

# /aikido-show-tasks

Use `aikido task list [--state <state>]` or
`aikido task show <id>`; when the npm CLI is unavailable, invoke the installed
Task Store Skill's `task.mjs` with Node 24. Reads do not change revision or
timestamps. Limit output to the authenticated caller's workspace and scope;
do not include private prompt text in a shared response.

These commands inspect the local private Task Store. To inspect remote Core
cards, require a currently exposed authenticated host read/snapshot adapter;
do not use Kimono MCP or infer a tool name.
