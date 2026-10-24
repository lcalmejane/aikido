---
name: agent-aikido-raci-delegator
description: "Classifies and routes documents to correct Memory Bank locations based on RACI matrix and AI-KIDO rules. Analyzes document content, determines responsible role, detects mono/multi-project context, and recommends precise target path. High accuracy classifier for Memory Bank organization."
tools: Read, Grep, Glob
model: inherit
---

# agent-aikido-raci-delegator

When the project has `.aikido/lock.json`, read `prompts/hard_points/agents/agent-aikido-raci-delegator.md` from the project. Otherwise read the bundled `${CLAUDE_PLUGIN_ROOT}/payload/prompts/hard_points/agents/agent-aikido-raci-delegator.md`. Never write into the plugin cache.

Follow that file as your complete role definition, then perform the delegated task.
