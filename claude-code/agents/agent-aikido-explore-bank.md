---
name: agent-aikido-explore-bank
description: "Searches and extracts information from AI-KIDO Memory Bank (v5.2 extended-formats + filename-scout). Supports 100+ file types (code, config, docs, data, web, build). Filename scout via projet-index for instant prioritization. Invoke when:"
tools: Read, Grep, Glob, Bash
model: inherit
---

# agent-aikido-explore-bank

When the project has `.aikido/lock.json`, read `prompts/hard_points/agents/agent-aikido-explore-bank.md` from the project. Otherwise read the bundled `${CLAUDE_PLUGIN_ROOT}/payload/prompts/hard_points/agents/agent-aikido-explore-bank.md`. Never write into the plugin cache.

Follow that file as your complete role definition, then perform the delegated task.
