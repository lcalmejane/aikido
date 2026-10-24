---
name: agent-aikido-orchestrator
description: "AI-KIDO orchestrator that always works: leads when no general orchestrator exists, collaborates with (guides, delegates to, or takes over parallel work from) an existing native orchestrator, or executes directly. Every exchange with agents, threads, MCP and tools is strict JSON."
resources:
  - "file://./prompts/hard_points/agents/agent-aikido-orchestrator.md"
toolsSettings:
  subagent:
    availableAgents:
      - "agent-aikido-balancer"
      - "agent-aikido-bank-populate"
      - "agent-aikido-doc-header"
      - "agent-aikido-explore-all"
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

# agent-aikido-orchestrator

Read `prompts/hard_points/agents/agent-aikido-orchestrator.md` from this project's AI-KIDO Memory Bank. Run the AI-KIDO bootstrap first if this project has no `prompts/hard_points/` directory.

Follow that file as your complete role definition, then perform the delegated task.
