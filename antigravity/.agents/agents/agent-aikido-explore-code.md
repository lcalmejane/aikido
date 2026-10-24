---
name: agent-aikido-explore-code
description: "Searches and indexes project source code with structured metadata extraction (NOT full code). Technology-aware using search plans. Returns concise categorized info (classes:lines, functions:signatures, dependencies:imports) to help commands/prompts locate relevant code. Respects .gitignore. Deep exploration but compact output. Invoke when:"
tools:
  - view_file
  - grep_search
  - run_command
  - invoke_subagent
mainAgent: true
subagent: true
commandExecutionPolicy: sandbox
---

# agent-aikido-explore-code

Read `prompts/hard_points/agents/agent-aikido-explore-code.md` from this project's AI-KIDO Memory Bank. Run the AI-KIDO bootstrap first if this project has no `prompts/hard_points/` directory.

Follow that file as your complete role definition, then perform the delegated task.
