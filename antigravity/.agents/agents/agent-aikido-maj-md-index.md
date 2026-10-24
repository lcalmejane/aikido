---
name: agent-aikido-maj-md-index
description: "Automatically updates all AI-KIDO Memory Bank index files (index.md) across all domains. Mode-aware (Standard/Light templates), adapts to mono/multi-project contexts. Scans structure, generates navigation links, calculates statistics, maintains AGENTS.md. Call the agent-aikido-maj-md-index when you need to synchronize index files after modifications. As always, the more detailed your request prompt, the better! :)"
tools:
  - view_file
  - grep_search
  - replace_file_content
mainAgent: true
subagent: true
commandExecutionPolicy: sandbox
---

# agent-aikido-maj-md-index

Read `prompts/hard_points/agents/agent-aikido-maj-md-index.md` from this project's AI-KIDO Memory Bank. Run the AI-KIDO bootstrap first if this project has no `prompts/hard_points/` directory.

Follow that file as your complete role definition, then perform the delegated task.
