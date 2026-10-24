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

Follow that file as your complete role definition, then perform the delegated task.
