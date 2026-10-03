# Phase 4 — Common Pack Documentation Layer

> **Status**: ⬜ Pending  
> **Depends on**: Phase 1 (manifest)  
> **Re-runnable**: ✅ Yes — creates new files only

---

## Preconditions — Read Before Starting

**Read [`decisions.md`](decisions.md) Phase 1 section first.**

Critical checks:
1. **`aikido-manifest.json` confirmed paths**: `common/README.md` links to `aikido-manifest.json`, `dependencies.json`, `agents_list.md`, `skills_list.md`. Verify all these files exist before creating the README.
2. **Agent count**: The table in `common/README.md` says "Agent stubs (13)" — if Phase 0-D found that `agent-aikido-helper` has no stub (`stub: null` in dependencies.json), adjust the count to 12 deployed stubs + 1 spec-only.
3. **Spec-only agents**: `agent-aikido-helper` may not have a `.claude/agents/` stub — update the table note accordingly.

## Post-execution obligation

After Phase 4 completes, record in [`decisions.md`](decisions.md) Phase 4 section:
- Any link in `common/README.md` that was adjusted (path not found, count updated)
- Whether root README.md was split or not (line count before/after)

---

## Context

After introducing `aikido-manifest.json`, downstream projects need a clear landing page explaining:
- What the common pack is and what it contains
- How to install it in a new project
- What they should NOT modify (will be overwritten on update)
- What is project-specific (their `prompts/gen/` and `prompts/spec/`)

**Physical relocation of files under a `common/` directory is NOT done** — this would break 500+ internal links. Instead, a thin `common/` documentation layer is created that references the manifest as the boundary authority.

---

## Tasks

| # | Task | Status | Notes |
|---|------|--------|-------|
| 4.1 | Create `common/README.md` | ⬜ | See template below |
| 4.2 | Create `common/CHANGELOG.md` | ⬜ | See template below |
| 4.3 | Update root `README.md` — add "Install as common pack" section | ⬜ | Brief section, see below |

---

## File to Create: `common/README.md`

```markdown
# AI-KIDO Common Pack

> **Version**: 1.4.0 | **Type**: Claude Code Agent Pack

The AI-KIDO Common Pack is the reusable base layer of the AI-KIDO memory bank system.
It provides all agents, skills, rules, and memory bank infrastructure needed by any project.

## What Is Included

The common pack is declared in [`/aikido-manifest.json`](/aikido-manifest.json).

| Component | Location | Overwritable on update |
|-----------|----------|----------------------|
| Agent stubs (13) | `.claude/agents/agent-aikido-*.md` | ✅ Yes |
| Agent specs (14) | `prompts/hard_points/agents/` | ✅ Yes |
| Commands (21) | `prompts/hard_points/commands/` + `.claude/commands/` | ✅ Yes |
| Skills (5) | `prompts/hard_points/system/` | ✅ Yes |
| Rules | `prompts/hard_points/ai-kido.md` + `ai-kido-light.md` | ✅ Yes |
| Configuration | `prompts/hard_points/configuration/` | ✅ Yes |
| Entry point | `prompts/index.md` | ✅ Yes |
| Bootstrap files | `AGENTS.md`, `CLAUDE.md`, registries | ✅ Yes |

## What Is NOT Included (Project-Specific)

| Component | Location | Modified by pack update |
|-----------|----------|------------------------|
| Truth Tables | `prompts/gen/` | ❌ Never |
| Personal workspace | `prompts/spec/` | ❌ Never |
| Project personas | `prompts/gen/personas/` | ❌ Never |
| Project use cases | `prompts/gen/use_cases/` | ❌ Never |

## Install in a New Project

```bash
# Bootstrap from scratch
/skill-manage get aikido-common

# With a specific source
/skill-manage get aikido-common --source git@github.com:your-org/ai-kido-best-practices.git

# Dry run (see what would be installed)
/skill-manage get aikido-common --dry-run

# Light mode (uses ai-kido-light.md instead of ai-kido.md)
/skill-manage get aikido-common --mode light
```

## Update an Existing Installation

```bash
/skill-manage update aikido-common
# or
/maj-aikido
```

## Agents Included

See [`/agents_list.md`](/agents_list.md) for the full list with descriptions and usage guidelines.
Dependency order: [`/dependencies.json`](/dependencies.json) `install_order` array.

## Skills Included

| Skill | Purpose |
|-------|---------|
| **search** | Memory Bank and source code search |
| **analyse** | Text, code and structured data analysis |
| **structure** | Directory tree generation and maintenance |
| **web** | Web interaction, site download, HTML normalization |
| **maj** | Complete AI-KIDO system update process |

See [`/skills_list.md`](/skills_list.md) for full details.
```

---

## File to Create: `common/CHANGELOG.md`

```markdown
# AI-KIDO Common Pack — Changelog

## 1.4.0 — 2026-08-05

### Added
- `aikido-manifest.json` — machine-readable common/spec boundary declaration
- `dependencies.json` — formal dependency graph for agents and skills
- `requires:` / `optional:` fields in all agent stub frontmatter
- Full-pack install mode in `skill-manage get aikido-common`
- `--dry-run` and `--mode` flags for skill-manage
- `common/` documentation layer

### Changed
- All prompts translated to English
- SKILL.md agent sections converted to structured YAML blocks
- `agent-aikido-validator` rule 19: dependency consistency check

### Agents (13 stubs + 14 specs)
- All agent stubs now declare explicit `requires:` and `optional:` fields

## 1.3.1 — 2026-02-XX

- English translation branch (1.3.1en-version) — merged in 1.4.0

## 1.3.0 — 2025-12-09

- Initial stable version with unified entry point (prompts/index.md)
- 13 agents, 5 skills, 22 commands
- Bicephalous architecture: gen/ vs hard_points/
```

---

## Section to Add in Root `README.md`

Insert after the existing introduction/description, before the "Getting Started" or first major section:

```markdown
## Install as Common Pack

AI-KIDO can be bootstrapped into any project as a downloadable Claude Code agent pack:

```bash
/skill-manage get aikido-common
```

This installs all agents, skills, commands, and memory bank rules.
See [`common/README.md`](common/README.md) for full details and options.
```

---

## Prompt to Execute

```
You are creating the common pack documentation layer for AI-KIDO.

CONTEXT:
- Project: /path/to/ai-kido-best-practices
- Reference: refactor/phase-4-common-layer.md contains exact file templates

TASK 1 — Create common/README.md:
- Create the file using the template from the reference
- Replace any placeholder URLs with actual repository paths
- Verify all internal links are correct (relative paths from common/ to root files)

TASK 2 — Create common/CHANGELOG.md:
- Create the file using the template from the reference

TASK 3 — Update root README.md:
- Read the current README.md first
- Insert the "Install as Common Pack" section AFTER the first paragraph/introduction
- PRESERVE all existing content

MANDATORY RULES:
1. All links in common/README.md must use absolute paths from project root (e.g., /aikido-manifest.json)
2. Do not create any other files — these 3 files only
3. Maintain AI-KIDO line limits: common/README.md ≤500 lines
4. After creation, verify all linked files exist: aikido-manifest.json, dependencies.json, agents_list.md, skills_list.md

OUTPUT FORMAT:
## Files created/modified
- [path]: [lines] lines

## Link verification
- aikido-manifest.json: [exists/missing]
- dependencies.json: [exists/missing]
- agents_list.md: [exists/missing]
- skills_list.md: [exists/missing]
```

---

## Verification

```bash
# Verify files were created
ls -la common/

# Check line counts
wc -l common/README.md common/CHANGELOG.md

# Verify key links in common/README.md resolve
grep -oP '\[.*?\]\(/?\K[^)]+' common/README.md | while read f; do
  [ -f "$f" ] && echo "✅ $f" || echo "❌ MISSING: $f"
done

# Verify README.md has the new section
grep -n "Install as Common Pack\|skill-manage get aikido-common" README.md
```

---

## Result

> _Fill this section after execution_

**Date completed**: —  
**common/README.md created**: ⬜  
**common/CHANGELOG.md created**: ⬜  
**README.md updated**: ⬜  
**All links valid**: ⬜  
**Validation**: ⬜ Pending

### Notes

_Record any link issues, decisions about what to include/exclude in the changelog._
