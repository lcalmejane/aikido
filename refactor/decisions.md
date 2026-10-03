# Refactoring Decisions Log

> **Purpose**: Track structural changes that affect downstream phases.  
> Each phase executor MUST read this file before starting work.  
> Each phase executor MUST append its decisions here after completion.

---

## How to Use

**Before starting a phase**: Read the full log below — especially entries from phases you depend on.  
**After completing a phase**: Add an entry in the correct section with every structural decision that could affect another phase.

A "structural decision" is anything that changes:
- A file path, name, or split (e.g. `foo.md` → `foo.md` + `foo_details.md`)
- A frontmatter field (added, renamed, removed)
- A section name or heading in a shared file
- A new file created that other phases must reference
- A feature preserved vs removed from an agent/command/skill

---

## Phase 0 — Decisions

> _Fill after Phase 0-A through 0-E complete_

### 0-A — Tier 1 Critical Files

**Completed**: 2026-08-05

| File | Lines before→after | Decision | Impact on later phases |
|------|-------------------|----------|----------------------|
| `prompts/hard_points/ai-kido.md` | 93→72 | Translated in-place, all 18 rules preserved | Phase 5 adds rule 19 after rule 18 |
| `prompts/index.md` | 41→41 | Translated in-place, `LLM_TRACIBILITY=TRUE` preserved | No structural change |
| `AGENTS.md` | 106→79 | Translated + compressed: removed redundant multi-project nav list, merged legacy note inline | Phase 5 quality pass must not re-add removed redundancy |
| `CLAUDE.md` | 44→44 | Translated, all `@import` lines untouched | No structural change |
| `agents_list.md` | 116→115 | Fully translated, all agents preserved | No structural change |
| `skills_list.md` | 7→7 | Translated descriptions only | No structural change |
| `commands_list.md` | 24→24 | Translated descriptions only | No structural change |

**No splits needed.** `ai-kido_details.md` already exists — no new `_details.md` created.
**All ≤100L limits respected**: ai-kido.md=72, index.md=41, AGENTS.md=79, CLAUDE.md=44.

### 0-B — Agent Specs

**Completed**: 2026-08-05. All 14 files processed.

**Files split (Phase 2 must use main file path in `dependencies.json` "spec" field)**:

| Original file | Main file (lines) | Details file (lines) | Content moved |
|--------------|-------------------|----------------------|---------------|
| `agent-aikido-explore-bank.md` | same path (≤900L) | `agent-aikido-explore-bank_details.md` | v4 obsolete cache protocol, v4 quick reference |
| `agent-aikido-projet-index.md` | same path (780L) | `agent-aikido-projet-index_details.md` (402L) | bash function implementations, extended scripts interface, v3.0 migration checklist |

**All other 12 files**: single file, no split. All within 1000L limit.

**Section headers renamed in `agent-aikido-update-controller.md`** (was 100% French):

| Old (French) | New (English) |
|---|---|
| `## Identité de l'agent` | `## Agent Identity` |
| `## Compétences de l'agent` | `## Agent Capabilities` |
| `## Mode de pensée` | `## Problem-Solving Approach` |
| `## Style de communication` | `## Communication Style` |
| `## Prompt système` | `## System Prompt` |

**In `agent-aikido-validator.md`**: `## Mode` → `## Return Mode`

**Phase 2 spec paths confirmed** (all main files, no renaming):
- `agent-aikido-explore-bank.md` → `prompts/hard_points/agents/agent-aikido-explore-bank.md` ✅
- `agent-aikido-projet-index.md` → `prompts/hard_points/agents/agent-aikido-projet-index.md` ✅
- All others → unchanged paths ✅

### 0-C — Commands

**Completed**: 2026-08-07. 4 critical oversize files translated and optimized. No splits.

**EXCEPTION CONFIRMED**: Commands are exempt from the 1000L split rule — kept as single files regardless of size. Commands execute as complete prompts — splitting breaks execution flow.

**Critical files translated (previously split incorrectly)**:

| File | Lines before | Lines after | Decision |
|------|-------------|-------------|----------|
| `analyse-project.md` | 1323L | 1014L | Translated + optimized in-place, no split |
| `init-raci-aikido.md` | 1070L | 639L | Translated + optimized in-place, no split |
| `init-aikido.md` | 1040L | 641L | Translated + optimized in-place, no split |
| `create-command.md` | 1017L | 572L | Translated + optimized in-place, no split |

**Roo-Code tool references replaced** in `init-aikido.md` (was referencing `ask_followup_question`, `write_to_file`, `apply_diff`, `read_file`, `list_files`, `attempt_completion` → replaced with Claude Code native tool descriptions).

**Phase 3**: Must accept `analyse-project.md` at 1014L as valid — no `_details.md`. All other command files are within limits.

**Phase 5**: `check-truth.md` state — 712L. No split. ~288L headroom for `--deps` flag.

**Note**: Other 17 commands were already translated in a previous run. Only these 4 critical oversize files needed re-translation after split revert.

### 0-D — Agent Stubs

**Completed**: 2026-08-05

All 13 stubs translated, warning standardized to `⚠️ **INTERNAL AGENT** — Do NOT load /prompts/index.md. ⚠️`

**Stubs with non-standard frontmatter** (Phase 2 must handle these carefully):

| File | Lines after | Non-standard field | Notes |
|------|------------|-------------------|-------|
| `agent-aikido-update-controller.md` | 61 | Had `emoji: 🔧` and `color: blue` — removed during rewrite | Phase 2 inserts `requires:`/`optional:` after `model:` — confirmed clean |
| `agent-aikido-projet-index.md` | 122 | `description` field remains in French (frontmatter not translated per task rules) | Phase 2: French `description` is expected, not a bug |
| `agent-aikido-explore-bank.md` | 139 | Over 80L (intentional — dense test/schema content) | Phase 2: body-only change, frontmatter standard |
| All others | ≤86 | Standard: `name`, `description`, `tools`, `model` | Phase 2: insert `requires:`/`optional:` after `model:` line |

### 0-E — SKILL.md Files

**Completed**: 2026-08-05. Translation only — no structural changes.

| File | Agent section header after translation | Notes |
|------|---------------------------------------|-------|
| `system/search/SKILL.md` | `## Associated Aikido Agents` | Was "## Agents Aikido associés" |
| `system/analyse/SKILL.md` | `## Associated Aikido Agents` | Was "## Agents Aikido associés" |
| `system/structure/SKILL.md` | `## Associated Aikido Agents` | Was "## Agents Aikido associés" |
| `system/web/SKILL.md` | `## Associated Aikido Agents` | Was "## Agents Aikido associés" |
| `system/maj/SKILL.md` | `## Associated Aikido Agents` | Was "## Agents Aikido associés" |

**Phase 2 MUST search for `## Associated Aikido Agents` in all 5 SKILL.md files.** This is the confirmed header after 0-E translation.

---

## Phase 1 — Decisions

> _Fill after Phase 1 complete_

| Decision | Detail | Impact on later phases |
|----------|--------|----------------------|
| — | — | — |

**`aikido-manifest.json` paths confirmed**:
> Phase 3 reads aikido-manifest.json to determine what to install.  
> Phase 4 common/README.md links to aikido-manifest.json.

| Path entry | Confirmed exists | Notes |
|-----------|-----------------|-------|
| — | — | — |

---

## Phase 2 — Decisions

> _Fill after Phase 2 complete_

| Decision | Detail | Impact on later phases |
|----------|--------|----------------------|
| — | — | — |

**Agent stubs — frontmatter fields added**:
> Phase 5 quality pass must not remove these fields.

| Agent | requires: values | optional: values |
|-------|-----------------|-----------------|
| — | — | — |

**`dependencies.json` spec paths** (verify against Phase 0-B split decisions):
> If Phase 0-B split any agent spec, `dependencies.json` "spec" field must point to the correct file.

| Agent | spec path in dependencies.json | Split in 0-B? | Correct? |
|-------|-------------------------------|---------------|---------|
| agent-aikido-explore-bank | prompts/hard_points/agents/agent-aikido-explore-bank.md | — | — |
| agent-aikido-projet-index | prompts/hard_points/agents/agent-aikido-projet-index.md | — | — |

---

## Phase 3 — Decisions

> _Fill after Phase 3 complete_

| Decision | Detail | Impact on later phases |
|----------|--------|----------------------|
| — | — | — |

**skill-manage.md state after Phase 3**:
> Phase 5 must not overwrite or conflict with Phase 3 additions.

| Item | Value |
|------|-------|
| Lines after modification | — |
| Split needed? (y/n) | — |
| Details file created | — |
| Full-pack section inserted at line | — |

---

## Phase 4 — Decisions

> _Fill after Phase 4 complete_

| Decision | Detail | Impact on later phases |
|----------|--------|----------------------|
| — | — | — |

---

## Phase 5 — Decisions

> _Fill after Phase 5 complete_

| Decision | Detail | Impact on later phases |
|----------|--------|----------------------|
| — | — | — |

**Rule 19 location in agent-aikido-validator.md**:

| Item | Value |
|------|-------|
| Line number inserted | — |
| ai-kido.md lines after update | — /100 |

---

## Cross-Phase Contracts

> These are fixed agreements between phases that must not be broken.

| Contract | Phase produces | Phase consumes | What must be true |
|----------|---------------|---------------|-------------------|
| Agent stub frontmatter structure | 0-D | 2 | Every stub has `name:`, `description:`, `tools:`, `model:` — Phase 2 inserts `requires:`/`optional:` after `model:` |
| SKILL.md agents section header | 0-E | 2 | Header name after translation is recorded in 0-E decisions above — Phase 2 uses that exact name to locate the section |
| Agent spec file paths | 0-B | 2 | If any spec was split, Phase 2 `dependencies.json` "spec" field must point to the main file (not _details) |
| skill-manage.md content | 0-C, 3 | 5 | Phase 3 adds a section — Phase 5 must not remove or duplicate it |
| agent-aikido-validator.md rule count | 0-B | 5 | Phase 5 adds rule 19 — verify current rule count from Phase 0-B result before inserting |
| check-truth.md content | 0-C | 5 | Phase 5 adds `--deps` flag — verify Phase 0-C didn't already add it |
| plan-beginning.md content | 0-C (maj plans) | 5 | Phase 5 inserts pre-flight section at top — verify line count allows it |
| aikido-manifest.json `common_paths` | 1 | 3, 4 | Phase 3 install reads this file; Phase 4 README links to it |
| dependencies.json `install_order` | 2 | 3 | Phase 3 install follows this order |
| `_details.md` split files | 0-B, 0-C | 1 (manifest), 4 (changelog) | Manifest `common_paths` glob `prompts/hard_points/agents/` covers all files including splits — no manifest change needed unless a file moved directories |
