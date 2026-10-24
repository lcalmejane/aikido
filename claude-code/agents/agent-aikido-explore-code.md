---
name: agent-aikido-explore-code
description: "Searches and indexes project source code with structured metadata extraction (NOT full code). Technology-aware using search plans. Returns concise categorized info (classes:lines, functions:signatures, dependencies:imports) to help commands/prompts locate relevant code. Respects .gitignore. Deep exploration but compact output. Invoke when:"
tools: Read, Grep, Glob, Bash, Task
model: inherit
---

# agent-aikido-explore-code

When the project has `.aikido/lock.json`, read `prompts/hard_points/agents/agent-aikido-explore-code.md` from the project. Otherwise read the bundled `${CLAUDE_PLUGIN_ROOT}/payload/prompts/hard_points/agents/agent-aikido-explore-code.md`. Never write into the plugin cache.

Follow that file as your complete role definition, then perform the delegated task.
