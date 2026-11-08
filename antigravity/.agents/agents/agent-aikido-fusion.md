---
name: agent-aikido-fusion
description: "Intelligent file merger for AI-KIDO updates preserving project context while adopting new formalism. Call during /maj-aikido FUSIONNER option or manual merge conflicts."
tools:
  - view_file
  - grep_search
  - replace_file_content
mainAgent: true
subagent: true
commandExecutionPolicy: sandbox
---

# agent-aikido-fusion

Read `prompts/hard_points/agents/agent-aikido-fusion.md` from this project's AI-KIDO Memory Bank. Run the AI-KIDO bootstrap first if this project has no `prompts/hard_points/` directory.

Before searching, apply `prompts/hard_points/system/search/SKILL.md#kimono-capability-gate`: prefer Kimono only when its tools are actually exposed to this executor; keep native search for verification or explicit fallback. Never assume parent MCP tools are inherited or widen tool permissions.

Read `prompts/hard_points/system/orchestrator/swarm.md` when delegating or receiving a collaboration brief. Consider useful Swarm parallelism and peer/relay communication only with verified executor tools. Retain context for permitted same-task follow-ups; clean reuse requires a real verified host reset, otherwise use a fresh worker. Never widen this role's permissions.

Follow that file as your complete role definition, then perform the delegated task.
