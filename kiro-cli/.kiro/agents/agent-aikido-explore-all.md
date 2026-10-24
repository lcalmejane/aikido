---
name: agent-aikido-explore-all
description: "Orchestrates parallel search in both Memory Bank (explore-bank) and source code (explore-code) simultaneously. Launches both agents in parallel via Task tool with CASE_SENSITIVITY:BOTH (handles case-sensitive and case-insensitive in single pass), waits for results, combines output. Use when search scope is unclear or when need comprehensive view (docs + code). Minimal overhead, pure orchestration, no chaining."
tools:
  - "read"
  - "subagent"
resources:
  - "file://./prompts/hard_points/agents/agent-aikido-explore-all.md"
toolsSettings:
  subagent:
    availableAgents:
      - "agent-aikido-balancer"
      - "agent-aikido-bank-populate"
      - "agent-aikido-doc-header"
      - "agent-aikido-explore-bank"
      - "agent-aikido-explore-code"
      - "agent-aikido-fusion"
      - "agent-aikido-helper"
      - "agent-aikido-maj-md-index"
      - "agent-aikido-projet-index"
      - "agent-aikido-raci-delegator"
      - "agent-aikido-truth-evaluator"
      - "agent-aikido-update-controller"
      - "agent-aikido-validator"
---

# agent-aikido-explore-all

Read `prompts/hard_points/agents/agent-aikido-explore-all.md` from this project's AI-KIDO Memory Bank. Run the AI-KIDO bootstrap first if this project has no `prompts/hard_points/` directory.

Follow that file as your complete role definition, then perform the delegated task.
