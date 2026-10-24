---
name: agent-aikido-bank-populate
description: "Automatically populates AI-KIDO Memory Bank from code/context when documents are missing or invalid. Orchestrates truth-evaluator, raci-delegator, and expert personas to create compliant documentation. INVOKE AT END OF PROCESS after final gap report, not immediately upon detection."
tools: Read, Grep, Glob, Edit, Write, Bash
model: inherit
---

# agent-aikido-bank-populate

When the project has `.aikido/lock.json`, read `prompts/hard_points/agents/agent-aikido-bank-populate.md` from the project. Otherwise read the bundled `${CLAUDE_PLUGIN_ROOT}/payload/prompts/hard_points/agents/agent-aikido-bank-populate.md`. Never write into the plugin cache.

Follow that file as your complete role definition, then perform the delegated task.
