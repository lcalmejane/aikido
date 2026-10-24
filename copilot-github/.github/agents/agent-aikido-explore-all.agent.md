---
name: agent-aikido-explore-all
description: "Orchestrates parallel search in both Memory Bank (explore-bank) and source code (explore-code) simultaneously. Launches both agents in parallel via Task tool with CASE_SENSITIVITY:BOTH (handles case-sensitive and case-insensitive in single pass), waits for results, combines output. Use when search scope is unclear or when need comprehensive view (docs + code). Minimal overhead, pure orchestration, no chaining."
tools: ["read","search","agent"]
---

# agent-aikido-explore-all

Read `prompts/hard_points/agents/agent-aikido-explore-all.md` from this project's AI-KIDO Memory Bank. Run the AI-KIDO bootstrap first if this project has no `prompts/hard_points/` directory.

Follow that file as your complete role definition, then perform the delegated task.
