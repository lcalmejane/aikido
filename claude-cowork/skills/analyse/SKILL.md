---
name: analyse
description: "This Skill provides analysis capabilities for text, code, and structured data."
---

## Cowork execution boundary

Before following the canonical instructions, verify that the plugin root `${CLAUDE_PLUGIN_ROOT}` resolves to a readable installed package. Resolve relative references from the canonical source file, not this generated wrapper. Use only tools actually exposed in this Cowork session; Claude Code tool names do not prove that those tools are available here.

Before any project write, confirm the user-selected persistent project folder and its access permissions. Do not assume `${CLAUDE_PROJECT_DIR}`, a host filesystem path, or a temporary session directory is the intended project. Bootstrap, migration, update and removal additionally require an available command tool and Node.js. Use the packaged runtime with explicit `--root` and `--package` paths where applicable; review its plan and obtain confirmation of the exact plan ID before applying it. Do not replace the runtime with manual copies.

For `/aikido:init-aikido` without an installed lock, first choose STANDARD, LIGHT or UNSET with the user and run `node "<plugin-root>/scripts/bootstrap-plan.mjs" --root "<project-root>" --package "<plugin-root>" --mode <mode>`. Apply only after confirmation using `--apply --confirm <plan-id>`, then follow the canonical initialization command.

If a required path, tool, runtime or permission is unavailable, stop before writing and report `AIKIDO_COWORK_UNAVAILABLE` with the missing prerequisite. Do not install dependencies, change permissions or claim success to bypass the restriction. Never write into the plugin cache. These are prompt instructions, not a host-enforced sandbox.

When the project has `.aikido/lock.json`, prefer its installed `prompts/hard_points/` source. Otherwise read the bundled source at `${CLAUDE_PLUGIN_ROOT}/payload/prompts/hard_points/system/analyse/SKILL.md`. Never write into the plugin cache.


# Analyse – AI-KIDO Internal Skill

## Description
This Skill provides analysis capabilities for text, code, and structured data.
It enables Claude to interpret, summarize, and extract relevant information from various documents.

## Metadata
- **Name**: analyse
- **Version**: 1.0.0
- **Author**: AI-KIDO Team
- **Category**: analysis / comprehension
- **Metadata tokens**: ~100 (loaded on each invocation)

## Instructions (level 2)
1. Receive the text or file to analyse.
2. Determine the content type (plain-text, code, JSON, etc.).
3. Apply extraction algorithms:
   - Concise summary (max 3 sentences).
   - Key entity extraction.
   - Detection of important sections.
4. Return a JSON object containing:
   ```json
   {
     "summary": "...",
     "entities": ["..."],
     "highlights": ["..."]
   }
   ```

## Resources (level 3)
- Python libraries: `nltk`, `spacy`, `tree-sitter` (for code).
- Prompt templates: `templates/analysis_prompt.txt` (optional).
- Usage examples: `examples.md` (optional).

## Usage
Claude invokes this Skill automatically when a query requires deep understanding of the provided content.
The Skill first loads metadata, then instructions, and finally additional resources only if needed (progressive disclosure).

## Notes
- The Skill is **stateless**: each call is independent.
- Size limit: up to 10k input tokens (beyond that, the text must be split).
- Results are returned in UTF-8 without additional formatting.

## Associated Aikido Agents
- `agent-aikido-update-controller` – manages the update process and uses the analyse Skill.
- `agent-aikido-bank-populate` – uses the analyse Skill to extract and analyse project content.
- `agent-aikido-explore-all` – combines search and analysis, including the analyse Skill.
- `agent-aikido-explore-code` – explores source code and applies the analyse Skill.
- `agent-aikido-explore-bank` – explores the Memory Bank and uses the analyse Skill.
