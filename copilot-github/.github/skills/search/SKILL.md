---
name: search
description: "This Skill provides search capabilities across the *Memory Bank* and the project source code."
---

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
