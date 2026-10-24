---
name: search
description: "This Skill provides search capabilities across the *Memory Bank* and the project source code."
---

## Cowork execution boundary

Before following the canonical instructions, verify that the plugin root `${CLAUDE_PLUGIN_ROOT}` resolves to a readable installed package. Resolve relative references from the canonical source file, not this generated wrapper. Use only tools actually exposed in this Cowork session; Claude Code tool names do not prove that those tools are available here.

Before any project write, confirm the user-selected persistent project folder and its access permissions. Do not assume `${CLAUDE_PROJECT_DIR}`, a host filesystem path, or a temporary session directory is the intended project. Bootstrap, migration, update and removal additionally require an available command tool and Node.js. Use the packaged runtime with explicit `--root` and `--package` paths where applicable; review its plan and obtain confirmation of the exact plan ID before applying it. Do not replace the runtime with manual copies.

For `/aikido:init-aikido` without an installed lock, first choose STANDARD, LIGHT or UNSET with the user and run `node "<plugin-root>/scripts/bootstrap-plan.mjs" --root "<project-root>" --package "<plugin-root>" --mode <mode>`. Apply only after confirmation using `--apply --confirm <plan-id>`, then follow the canonical initialization command.

If a required path, tool, runtime or permission is unavailable, stop before writing and report `AIKIDO_COWORK_UNAVAILABLE` with the missing prerequisite. Do not install dependencies, change permissions or claim success to bypass the restriction. Never write into the plugin cache. These are prompt instructions, not a host-enforced sandbox.

When the project has `.aikido/lock.json`, prefer its installed `prompts/hard_points/` source. Otherwise read the bundled source at `${CLAUDE_PLUGIN_ROOT}/payload/prompts/hard_points/system/search/SKILL.md`. Never write into the plugin cache.


# Search – AI-KIDO Internal Skill

## Description
This Skill provides search capabilities across the *Memory Bank* and the project source code.
It enables Claude to query, filter, and retrieve relevant information from documents, prompts, and code artifacts.

## Metadata
- **Name**: search
- **Version**: 1.0.0
- **Author**: AI-KIDO Team
- **Category**: search / exploration
- **Metadata tokens** ≈ 100

## Instructions (level 2)
1. Receive the search query (keyword, regular expression, or semantic description).
2. Determine the scope:
   - **Memory Bank**: traverse files under `prompts/` (index, hard_points, gen, etc.).
   - **Code base**: traverse project source files (e.g. `*.py`, `*.js`, `*.md`).
3. Apply search algorithms:
   - Simple text search.
   - Regular expression search.
   - Semantic search (via embeddings, if available).
4. Return a structured result:
   ```json
   {
     "matches": [
       {
         "path": "path/to/file.md",
         "line": 42,
         "excerpt": "…excerpt containing the term…"
       }
     ],
     "summary": "Total number of matches and overview of results."
   }
   ```

## Resources (level 3)
- Python libraries: `re`, `fnmatch`, `whoosh` (optional for full-text search).
- Prompt templates: `templates/search_prompt.txt` (optional).
- Usage examples: `examples.md` (optional).

## Usage
Claude invokes this Skill automatically when an explicit search query is detected.
The Skill first loads metadata, then instructions, and finally additional resources only if needed (progressive disclosure).

## Notes
- The Skill is **stateless**: each call is independent.
- Size limit: the search query must be under 2k tokens.
- Results are returned in UTF-8 without additional formatting.

## Associated Aikido Agents
- `agent-aikido-explore-all` – combines search and analysis, uses the **search** Skill.
- `agent-aikido-explore-code` – explores source code and uses the **search** Skill to locate information.
- `agent-aikido-explore-bank` – searches the Memory Bank using the **search** Skill.
