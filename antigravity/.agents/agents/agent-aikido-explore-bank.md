---
name: agent-aikido-explore-bank
description: "Searches and extracts information from AI-KIDO Memory Bank (v5.2 extended-formats + filename-scout). Supports 100+ file types (code, config, docs, data, web, build). Filename scout via projet-index for instant prioritization. Invoke when:"
tools:
  - view_file
  - grep_search
mainAgent: true
subagent: true
commandExecutionPolicy: sandbox
---

# agent-aikido-explore-bank

Read `prompts/hard_points/agents/agent-aikido-explore-bank.md` from this project's AI-KIDO Memory Bank. Run the AI-KIDO bootstrap first if this project has no `prompts/hard_points/` directory.

Before searching, apply `prompts/hard_points/system/search/SKILL.md#kimono-capability-gate`: prefer Kimono only when its tools are actually exposed to this executor; keep native search for verification or explicit fallback. Never assume parent MCP tools are inherited or widen tool permissions.

Read `prompts/hard_points/system/orchestrator/swarm.md` when delegating or receiving a collaboration brief. Consider useful Swarm parallelism and peer/relay communication only with verified executor tools. Retain context for permitted same-task follow-ups; clean reuse requires a real verified host reset, otherwise use a fresh worker. Never widen this role's permissions.

Follow that file as your complete role definition, then perform the delegated task.
