---
name: agent-aikido-explore-all
description: "Orchestrates parallel search in both Memory Bank (explore-bank) and source code (explore-code) simultaneously. Launches both agents in parallel via Task tool with CASE_SENSITIVITY:BOTH (handles case-sensitive and case-insensitive in single pass), waits for results, combines output. Use when search scope is unclear or when need comprehensive view (docs + code). Minimal overhead, pure orchestration, no chaining."
tools: Read, Grep, Glob, Task
model: inherit
---

# agent-aikido-explore-all

When the project has `.aikido/lock.json`, read `prompts/hard_points/agents/agent-aikido-explore-all.md` from the project. Otherwise read the bundled `${CLAUDE_PLUGIN_ROOT}/payload/prompts/hard_points/agents/agent-aikido-explore-all.md`. Never write into the plugin cache.

Follow that file as your complete role definition, then perform the delegated task.
