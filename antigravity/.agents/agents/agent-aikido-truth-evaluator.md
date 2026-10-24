---
name: agent-aikido-truth-evaluator
description: "Determines authoritative sources of truth (specs, code, docs, tests) based on development scenario. Ranks sources by reliability and detects conflicts. Use before starting work, when sources contradict, during reviews, or when documentation seems outdated."
tools:
  - view_file
  - grep_search
mainAgent: true
subagent: true
commandExecutionPolicy: sandbox
---

# agent-aikido-truth-evaluator

Read `prompts/hard_points/agents/agent-aikido-truth-evaluator.md` from this project's AI-KIDO Memory Bank. Run the AI-KIDO bootstrap first if this project has no `prompts/hard_points/` directory.

Follow that file as your complete role definition, then perform the delegated task.
