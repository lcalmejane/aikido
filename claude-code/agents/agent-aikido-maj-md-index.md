---
name: agent-aikido-maj-md-index
description: "Automatically updates all AI-KIDO Memory Bank index files (index.md) across all domains. Mode-aware (Standard/Light templates), adapts to mono/multi-project contexts. Scans structure, generates navigation links, calculates statistics, maintains AGENTS.md. Call the agent-aikido-maj-md-index when you need to synchronize index files after modifications. As always, the more detailed your request prompt, the better! :)"
tools: Read, Grep, Glob, Edit, Write
model: inherit
---

# agent-aikido-maj-md-index

When the project has `.aikido/lock.json`, read `prompts/hard_points/agents/agent-aikido-maj-md-index.md` from the project. Otherwise read the bundled `${CLAUDE_PLUGIN_ROOT}/payload/prompts/hard_points/agents/agent-aikido-maj-md-index.md`. Never write into the plugin cache.

Before searching, apply `prompts/hard_points/system/search/SKILL.md#kimono-capability-gate`: prefer Kimono only when its tools are actually exposed to this executor; keep native search for verification or explicit fallback. Never assume parent MCP tools are inherited or widen tool permissions.

When using the bundled role, read `${CLAUDE_PLUGIN_ROOT}/payload/prompts/hard_points/system/orchestrator/swarm.md`; for a project-pinned role use `prompts/hard_points/system/orchestrator/swarm.md`. Consider useful Swarm parallelism and peer/relay communication only with verified executor tools. Retain context for permitted same-task follow-ups; clean reuse requires a real verified host reset, otherwise use a fresh worker. Never widen this role's permissions.

Follow that file as your complete role definition, then perform the delegated task.
