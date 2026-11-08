---
name: create-skill
description: "Interactive guide to create a complete AI-KIDO Skill skeleton"
---

# /create-skill

**Purpose**: Interactively guide the user through creating a complete AI-KIDO Skill skeleton with all required files and metadata.

---

## Usage

```
/create-skill
```

## Prerequisites

- Working directory is an AI-KIDO project
- `skills_list.md` exists and is accessible
- `prompts/hard_points/system/` directory exists

## Steps

Direct LLM execution — ❌ no bash script · ✅ Ask user directly + Write tool

**Skill Reference**: [`Skills.md`](../system/Skills.md) · Structure: `prompts/hard_points/system/{slug}/` · Progressive disclosure 3 levels (~100 tokens metadata / <5k instructions / resources on demand)

### Step 0 — Duplicate Detection

Inspect the directory structure first, then scan existing Markdown files only
within `prompts/hard_points/commands`, `.roo` and `.claude`. Follow
[`scope-first.md`](../system/search/scope-first.md). Display each source label,
basename and frontmatter description or first heading. Report read errors;
missing optional host directories can be reported as absent.

Ask the user directly: `1. No — new Skill` · `2. Yes — package [NAME]` · `3. Uncertain — details [NAME]` · `4. Extend [NAME]`
If packaging → Read source file → pre-fill `SKILL_NAME/DESC/INSTRUCTIONS/SOURCE_COMMAND` → **skip to Step 2**

### Step 1 — Existing Skills Inventory

Inspect the subdirectories of `prompts/hard_points/system` first, then list
their `SKILL.md` files and display each parent directory and description.
Display list + `Reference: skills_list.md`

### Steps 2–8 — Questionnaire (Ask user directly)

| Step | Question | Suggestions | Variable |
|------|----------|-------------|----------|
| 2 | Skill name? (kebab-case) | `code-review` · `deploy-check` · `doc-generator` · `test-runner` | `SKILL_NAME` |
| 3 | One-sentence description | *(free text)* | `SKILL_DESC` |
| 4 | Category? | `analysis/understanding` · `generation/creation` · `validation/verification` · `search/exploration` | `SKILL_CATEGORY` |
| 5 | Execution steps (numbered list) | *(free text)* | `SKILL_INSTRUCTIONS` |
| 6 | Output format? | `JSON {status,result,summary,details}` · `Markdown {Summary,Details,Recommendations}` · `JSON {matches[],summary,total_count}` · `Plain text UTF-8` | `SKILL_OUTPUT` |
| 7 | Dependencies/libraries? | `None` · `Node.js 24+ (default, node: built-ins only)` · `Other runtime (exception: user must justify, recorded in SKILL.md)` | `SKILL_RESOURCES` |
| 8 | Associated AI-KIDO agents? | `explore-bank` · `explore-code` · `bank-populate` · `None` | `SKILL_AGENTS` |

Step 2: validate uniqueness (`prompts/hard_points/system/{SKILL_NAME}` must not exist) · conflict → propose `{name}-v2`

### Step 9 — Optional Files (Ask user directly)

`1. SKILL.md only` · `2. + references/` · `3. + examples/` · `4. Everything (references/ + examples/ + scripts/ + templates/ + documentation/)`
→ Boolean variables: `WITH_REF` · `WITH_EX` · `WITH_SCRIPTS` · `WITH_TPL` · `WITH_DOC`

### Step 10 — Generation (Write tool)

Display summary then create:

**10.1 `SKILL.md`** — MANDATORY
```markdown
# {Formatted Name} – AI-KIDO Internal Skill

## Description
{SKILL_DESC}

## Metadata
```yaml
name: "{SKILL_NAME}"
version: "1.0.0"
author: "AI-KIDO Team"
category: "{SKILL_CATEGORY}"
metadata_tokens: ~100
{If SOURCE_COMMAND → source_command: "{SOURCE_COMMAND}"}
```

## Instructions (level 2)
{SKILL_INSTRUCTIONS numbered}
4. Return:
   ```{json|markdown|text}
   {SKILL_OUTPUT}
   ```

## Resources (level 3)
{SKILL_RESOURCES}
{WITH_REF → - `references/` – Reference documentation}
{WITH_EX  → - `examples/`   – Usage examples}
{WITH_SCRIPTS → - `scripts/` – Utility scripts}
{WITH_TPL → - `templates/`  – Templates}
{WITH_DOC → - `documentation/documentation.md` – Detailed documentation}

## Usage
Claude invokes this Skill when a request {trigger}.
Progressive disclosure: metadata → instructions → resources on demand.

## Notes
- Stateless: each call is independent.
- Results returned in UTF-8.

## Associated Aikido Agents
{For each SKILL_AGENTS → - `{slug}` – {role}}
```

**10.2** `references/README.md` *(if `WITH_REF`)* — Sections: Overview / Input parameters (table) / Output format / Constraints / See also
**10.3** `examples/README.md` *(if `WITH_EX`)* — Minimum 2 examples: Input + Expected output per use case
**10.4** `scripts/helper.mjs` + `scripts/helper.test.mjs` *(if `WITH_SCRIPTS`)* — MUST follow the [Default Tooling Standard (Node.js)](../system/Skills.md#default-tooling-standard-nodejs): `#!/usr/bin/env node`, exported pure core + thin `main()`, `node:` built-ins only, one bounded JSON object on stdout, explicit `{"status":"error","code","message"}` and nonzero exit on failure, `node --test` tests. Check `node --version` first and use the highest version available in the workspace without raising the 24+ baseline. Never generate `.sh`/`.py`/`.ps1` entry points unless the user chose the exception in Step 7. Do not claim unimplemented behavior succeeds.
**10.5** `templates/template.txt` *(if `WITH_TPL`)* — `[SECTION_N]` sections + `{{VARIABLE_N}}` variables
**10.6** `documentation/documentation.md` *(if `WITH_DOC`)* — Architecture / Mermaid flow / Decisions / Limitations / History

### Step 11 — Registration (Edit tool)

Add to `skills_list.md` (alphabetical order):
```markdown
- **{SKILL_NAME}** – {SKILL_DESC} – [`prompts/hard_points/system/{SKILL_NAME}/SKILL.md`](prompts/hard_points/system/{SKILL_NAME}/SKILL.md)
```

### Step 11bis — Make it available to every installed CLI

Run `node prompts/hard_points/system/host-sync/host-sync.mjs --dry-run` first, show the planned wrapper changes, then, after explicit approval, run it without `--dry-run`. It detects every assistant CLI installed on the machine (plus the hosts remembered in `.aikido/state/hosts.json`) and creates the Skill wrappers, agents and command entries for each of them through the audited `/check-cli` engine. Report `results[].status`; `conflict` means a customized wrapper was preserved. `runtime-missing` → tell the user to run `aikido sync` once. Never write host directories by hand.

### Step 12 — Final Report (Output result to user)

```
Skill "{SKILL_NAME}" created | Category: {SKILL_CATEGORY} | v1.0.0 | Stateless

Files created : SKILL.md {+ references/} {+ examples/} {+ scripts/} {+ templates/} {+ documentation/}
Updated       : skills_list.md

NEXT: complete SKILL.md → /create-persona (agents) → /analyse-aikido (compliance)
```

## Output

A complete Skill skeleton at `prompts/hard_points/system/{SKILL_NAME}/` with:
- `SKILL.md` (mandatory)
- Optional directories based on user selection
- Entry added to `skills_list.md`

## Notes

| Error | Action |
|-------|--------|
| Invalid name (not kebab-case) | Propose automatic correction |
| Skill already exists | Propose `{name}-v2` or cancel |
| Empty description | Ask again with examples |
| Write error | Report + retry |

**Integration**: `/skill-manage search` (verify before creation) → `/create-skill` → `/create-persona` → `/create-command` → `/analyse-aikido` → `/reindex-projet`
