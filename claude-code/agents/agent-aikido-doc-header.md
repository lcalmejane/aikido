---
name: agent-aikido-doc-header
description: "Standardizes and manages AI-KIDO document headers with versioning, truth validation metadata, and source traceability. Ensures consistent header format across all Memory Bank documents."
tools: Read, Grep, Glob, Edit, Write
model: inherit
---

# agent-aikido-doc-header

When the project has `.aikido/lock.json`, read `prompts/hard_points/agents/agent-aikido-doc-header.md` from the project. Otherwise read the bundled `${CLAUDE_PLUGIN_ROOT}/payload/prompts/hard_points/agents/agent-aikido-doc-header.md`. Never write into the plugin cache.

Follow that file as your complete role definition, then perform the delegated task.
