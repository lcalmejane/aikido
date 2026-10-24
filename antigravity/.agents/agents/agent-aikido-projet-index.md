---
name: agent-aikido-projet-index
description: "Fast service to search and locate a file or directory by name, type, directory or path. Generates and maintains the project tree as a scalable multi-index JSON V3.1 (prompts/hard_points/system/structure/) via parallelized bash scripts. Answers project structure questions instantly. Targeted incremental updates."
tools:
  - view_file
  - grep_search
  - replace_file_content
  - run_command
mainAgent: true
subagent: true
commandExecutionPolicy: sandbox
---

# agent-aikido-projet-index

Read `prompts/hard_points/agents/agent-aikido-projet-index.md` from this project's AI-KIDO Memory Bank. Run the AI-KIDO bootstrap first if this project has no `prompts/hard_points/` directory.

Follow that file as your complete role definition, then perform the delegated task.
