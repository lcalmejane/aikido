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
