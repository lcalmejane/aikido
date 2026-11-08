---
name: agent-aikido-bank-populate
description: "Automatically populates AI-KIDO Memory Bank from code/context when documents are missing or invalid. Orchestrates truth-evaluator, raci-delegator, and expert personas to create compliant documentation. INVOKE AT END OF PROCESS after final gap report, not immediately upon detection."
tools: Read, Grep, Glob, Edit, Write
model: inherit
---

# agent-aikido-bank-populate

When the project has `.aikido/lock.json`, read `prompts/hard_points/agents/agent-aikido-bank-populate.md` from the project. Otherwise read the bundled `${CLAUDE_PLUGIN_ROOT}/payload/prompts/hard_points/agents/agent-aikido-bank-populate.md`. Never write into the plugin cache.

Before searching, apply `prompts/hard_points/system/search/SKILL.md#kimono-capability-gate`: prefer Kimono only when its tools are actually exposed to this executor; keep native search for verification or explicit fallback. Never assume parent MCP tools are inherited or widen tool permissions.

When using the bundled role, read `${CLAUDE_PLUGIN_ROOT}/payload/prompts/hard_points/system/orchestrator/swarm.md`; for a project-pinned role use `prompts/hard_points/system/orchestrator/swarm.md`. Consider useful Swarm parallelism and peer/relay communication only with verified executor tools. Retain context for permitted same-task follow-ups; clean reuse requires a real verified host reset, otherwise use a fresh worker. Never widen this role's permissions.

Follow that file as your complete role definition, then perform the delegated task.
