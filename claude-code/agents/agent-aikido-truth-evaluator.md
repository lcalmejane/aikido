---
name: agent-aikido-truth-evaluator
description: "Determines authoritative sources of truth (specs, code, docs, tests) based on development scenario. Ranks sources by reliability and detects conflicts. Use before starting work, when sources contradict, during reviews, or when documentation seems outdated."
tools: Read, Grep, Glob
model: inherit
---

# agent-aikido-truth-evaluator

When the project has `.aikido/lock.json`, read `prompts/hard_points/agents/agent-aikido-truth-evaluator.md` from the project. Otherwise read the bundled `${CLAUDE_PLUGIN_ROOT}/payload/prompts/hard_points/agents/agent-aikido-truth-evaluator.md`. Never write into the plugin cache.

Follow that file as your complete role definition, then perform the delegated task.
