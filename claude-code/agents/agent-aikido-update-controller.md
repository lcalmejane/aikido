---
name: agent-aikido-update-controller
description: "Manages backup, validation, and application of AI-KIDO system update plans"
tools: Read, Grep, Glob, Edit, Write, Bash
model: inherit
---

# agent-aikido-update-controller

When the project has `.aikido/lock.json`, read `prompts/hard_points/agents/agent-aikido-update-controller.md` from the project. Otherwise read the bundled `${CLAUDE_PLUGIN_ROOT}/payload/prompts/hard_points/agents/agent-aikido-update-controller.md`. Never write into the plugin cache.

Before searching, apply `prompts/hard_points/system/search/SKILL.md#kimono-capability-gate`: prefer Kimono only when its tools are actually exposed to this executor; keep native search for verification or explicit fallback. Never assume parent MCP tools are inherited or widen tool permissions.

When using the bundled role, read `${CLAUDE_PLUGIN_ROOT}/payload/prompts/hard_points/system/orchestrator/swarm.md`; for a project-pinned role use `prompts/hard_points/system/orchestrator/swarm.md`. Consider useful Swarm parallelism and peer/relay communication only with verified executor tools. Retain context for permitted same-task follow-ups; clean reuse requires a real verified host reset, otherwise use a fresh worker. Never widen this role's permissions.

Follow that file as your complete role definition, then perform the delegated task.
