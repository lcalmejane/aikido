---
name: agent-aikido-orchestrator
description: "AI-KIDO orchestrator that always works: leads when no general orchestrator exists, collaborates with (guides, delegates to, or takes over parallel work from) an existing native orchestrator, or executes directly. Every exchange with agents, threads, MCP and tools is strict JSON."
model: inherit
---

# agent-aikido-orchestrator

When the project has `.aikido/lock.json`, read `prompts/hard_points/agents/agent-aikido-orchestrator.md` from the project. Otherwise read the bundled `${CLAUDE_PLUGIN_ROOT}/payload/prompts/hard_points/agents/agent-aikido-orchestrator.md`. Never write into the plugin cache.

Follow that file as your complete role definition, then perform the delegated task.
