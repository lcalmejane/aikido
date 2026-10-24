---
name: agent-aikido-orchestrator
description: "AI-KIDO orchestrator that always works: leads when no general orchestrator exists, collaborates with (guides, delegates to, or takes over parallel work from) an existing native orchestrator, or executes directly. Every exchange with agents, threads, MCP and tools is strict JSON."
tools:
  - view_file
  - grep_search
  - replace_file_content
  - run_command
  - invoke_subagent
mainAgent: true
subagent: false
commandExecutionPolicy: sandbox
---

# agent-aikido-orchestrator

Read `prompts/hard_points/agents/agent-aikido-orchestrator.md` from this project's AI-KIDO Memory Bank. Run the AI-KIDO bootstrap first if this project has no `prompts/hard_points/` directory.

Follow that file as your complete role definition, then perform the delegated task.
