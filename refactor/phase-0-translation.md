# Phase 0 — Translation + Prompt Optimization (French → English)

> **Status**: ⬜ Pending  
> **Strategy**: Full rewrite from `main` — do NOT rebase `1.3.1en-version` (untrusted)  
> **Re-runnable**: ✅ Yes — each sub-phase is independent per file group  
> **Estimated effort**: High (translate + optimize ~50 key files)

---

## Preconditions

**First phase — no upstream dependencies.**  
Read [`decisions.md`](decisions.md) before starting (will be empty initially — that is expected).

## Post-execution obligation

After completing **each sub-phase**, record every structural decision in [`decisions.md`](decisions.md):
- Any file that was split into `main + _details.md` → record both paths
- Any section header renamed → record old and new name
- Any frontmatter field added/removed in stubs → record which field and which files
- Any Roo-Code tool reference replaced → record old → new mapping
- Any agent spec section restructured that Phase 2 will target (e.g. agents section in SKILL.md)

**These records are contracts for Phases 2–5. Missing entries = broken downstream phases.**

---

## Context

The existing `1.3.1en-version` branch (Feb 2026, ~170 files) is NOT trusted as a quality baseline. This phase does a **fresh translation + prompt optimization** directly from `main`, treating each file as an opportunity to:

1. Translate to English (canonical terminology)
2. Apply 2025-2026 prompting best practices
3. Enforce AI-KIDO line limits (splitting oversize files)
4. Remove verbosity and redundancy without losing functionality

### Current State Assessment

Key problems found in existing files:

| Problem | Example | Files affected |
|---------|---------|----------------|
| **French body in otherwise-English files** | `explore-bank.md` has French warning block in English file | Most hard_points agents |
| **Oversize files** | `explore-bank.md` 1195L, `projet-index.md` 1153L, `analyse-project.md` 1323L | 8+ files exceed 1000L limit |
| **Verbose redundancy** | explore-bank repeats performance numbers 3× in different sections | Agents, commands |
| **Pseudo-code as instructions** | Python/bash heuristic blocks that LLMs don't execute | explore-bank, explore-code |
| **Mixed language** | French section headers inside English content | Commands, agents |
| **Filler phrases** | "Il est important de noter que...", "Please note that..." | Commands |
| **Redundant warnings** | 3 different "DO NOT load index.md" banners in same file | Agent specs |

### Prompt Optimization Principles (2025-2026 best practices)

1. **Role → Task → Context → Output** structure for every agent/command
2. **Mandatory sections explicit**: mark `[MANDATORY]` vs `[OPTIONAL]`  
3. **Imperative voice**: "Do X" not "You should do X" or "It is recommended to do X"
4. **Decision trees over pseudo-code**: LLMs follow markdown logic, not Python/bash
5. **One warning, not three**: collapse repeated warnings into one authoritative block
6. **Chain-of-thought only where needed**: not in every section header
7. **Semantic density**: remove filler ("In order to", "Note that", "Please be aware")
8. **Output format always defined**: downstream callers need predictable structure
9. **No self-referential verbosity**: don't describe what you're about to describe

---

## Sub-phases

| Sub-phase | Scope | Files | Status |
|-----------|-------|-------|--------|
| [0-A](#sub-phase-0-a--tier-1-critical-files) | Tier 1 — Critical (loaded every session) | 7 files | ⬜ |
| [0-B](#sub-phase-0-b--agent-specs-hard_pointsagents) | Agent specs (hard_points/agents/) | 14 files | ⬜ |
| [0-C](#sub-phase-0-c--commands-hard_pointscommands) | Commands (hard_points/commands/) | 21 files | ⬜ |
| [0-D](#sub-phase-0-d--agent-stubs-claudeagents) | Agent stubs (.claude/agents/) | 13 files | ⬜ |
| [0-E](#sub-phase-0-e--skill-files) | SKILL.md files (system/) | 5 files | ⬜ |

---

## Sub-phase 0-A — Tier 1: Critical Files

> Files loaded in every LLM session. Translation + optimization highest priority.

| File | Lines | Status | Notes |
|------|-------|--------|-------|
| `prompts/hard_points/ai-kido.md` | ~60 | ⬜ | ≤100L limit — translate headers only, rules already EN |
| `prompts/index.md` | ~50 | ⬜ | ≤100L limit — LLM_TRACIBILITY rule must stay |
| `AGENTS.md` | ~100 | ⬜ | ≤100L limit |
| `CLAUDE.md` | ~60 | ⬜ | ≤100L limit |
| `agents_list.md` | — | ⬜ | Translate table headers + descriptions |
| `skills_list.md` | — | ⬜ | Translate descriptions |
| `commands_list.md` | — | ⬜ | Translate descriptions |

### Prompt 0-A

```
ROLE: You are a bilingual prompt engineer optimizing AI-KIDO Tier 1 critical files.

TASK: Translate and optimize the following 7 files from French to English.
Files: prompts/hard_points/ai-kido.md, prompts/index.md, AGENTS.md, CLAUDE.md,
       agents_list.md, skills_list.md, commands_list.md

CONTEXT:
- These files are loaded in every LLM session (highest token cost)
- Current state: French section headers, French rule names, mixed language
- Line limits are CRITICAL: ai-kido.md, index.md, AGENTS.md, CLAUDE.md ≤100 lines EACH
- Translation glossary: see refactor/phase-0-translation.md#translation-glossary

FOR EACH FILE:
1. Read the full file
2. Translate all French text to English using canonical glossary terms
3. Apply optimization:
   - Remove filler phrases ("Note that", "It is important to", "Please be aware")
   - Use imperative voice ("Do X" not "You should do X")
   - Keep all functionality — no rule or feature may be removed
   - Collapse redundant warnings (≤1 instance per warning type)
4. Verify line count stays within limit
5. Write the updated file

[MANDATORY] PRESERVE:
- All internal links (relative paths unchanged)
- All YAML frontmatter keys and values
- LLM_TRACIBILITY=TRUE in prompts/index.md
- The ⚠️ INTERNAL AGENT warning pattern (translate text, keep structure)
- All rule numbers and their meaning

[MANDATORY] LINE LIMIT ENFORCEMENT:
- If a file would exceed its limit after optimization, split overflow to a _details.md file
- Add a link: "Full details: [filename_details.md](filename_details.md)"

OUTPUT FORMAT:
## File: [name]
- Lines: [before] → [after] (limit: [X])
- French terms translated: [list key ones]
- Optimizations applied: [list]
- Split needed: [yes/no]
```

---

## Sub-phase 0-B — Agent Specs (`hard_points/agents/`)

> 14 files, many oversize. These define the actual agent behavior. Translation + structural optimization.

### File inventory

| File | Lines | Priority | Status | Key issue |
|------|-------|----------|--------|-----------|
| `agent-aikido-explore-bank.md` | 1195 | 🔴 Critical | ⬜ | 1195L >> 1000L limit; French warning block; pseudo-code blocks |
| `agent-aikido-projet-index.md` | 1153 | 🔴 Critical | ⬜ | 1153L >> 1000L; likely verbose repetition |
| `agent-aikido-maj-md-index.md` | 751 | 🟡 High | ⬜ | Mixed language |
| `agent-aikido-explore-code.md` | 709 | 🟡 High | ⬜ | Pseudo-code pattern |
| `agent-aikido-balancer.md` | 618 | 🟡 High | ⬜ | |
| `agent-aikido-bank-populate.md` | 603 | 🟡 High | ⬜ | French warning block |
| `agent-aikido-doc-header.md` | 539 | 🟢 Normal | ⬜ | |
| `agent-aikido-truth-evaluator.md` | 336 | 🟢 Normal | ⬜ | |
| `agent-aikido-raci-delegator.md` | 307 | 🟢 Normal | ⬜ | |
| `agent-aikido-fusion.md` | 288 | 🟢 Normal | ⬜ | |
| `agent-aikido-validator.md` | ~143 | 🟢 Normal | ⬜ | |
| `agent-aikido-update-controller.md` | — | 🟢 Normal | ⬜ | |
| `agent-aikido-explore-all.md` | 274 | 🟢 Normal | ⬜ | |
| `agent-aikido-helper.md` | — | 🟢 Normal | ⬜ | |

### Mandatory agent spec structure (post-optimization)

Every agent spec must follow this structure:

```markdown
---
[YAML frontmatter]
---

⚠️ INTERNAL AGENT — Do NOT load `/prompts/index.md`. Load `ai-kido.md` directly. ⚠️

# [Agent Name]

**Role**: [One sentence — who you are and what you do]  
**Spec version**: [X.Y] | **Line budget**: [N]/1000

---

## When to Use

**Use:** [2-4 bullets — concrete triggers]  
**Skip:** [2-4 bullets — when another tool is better]

## [Core Execution Section]

[Imperative instructions. Decision trees in markdown. No pseudo-code.]

## Output Format

[Template or example of expected output]

## Performance

| Metric | Value |
|--------|-------|
| Tokens | ~X |
| Time | ~Xs |
```

### Oversize file handling

Files exceeding 1000L must be split:
- Keep the **operational core** in the main file (≤900L to leave room for future additions)
- Move **extended examples, detailed sub-plans, appendices** to `[agent-name]_details.md`
- Add at bottom: `**Extended details**: [agent-name_details.md](agent-name_details.md)`

### Prompt 0-B (run per file or per batch)

```
ROLE: You are a bilingual prompt engineer. You translate and optimize AI-KIDO agent specification files.

TASK: Process the file [FILENAME] in prompts/hard_points/agents/

CONTEXT:
- This is an AI-KIDO internal agent specification
- Current problems may include: French content, oversize (>1000 lines), verbose pseudo-code, redundant warnings
- All agent capabilities MUST be preserved — this is a refactor, not a reduction
- Line limit: ≤1000 lines (split to _details.md if needed)
- Glossary: refactor/phase-0-translation.md#translation-glossary

STEPS (follow in order):
1. Read the full file
2. Identify: [a] French text blocks, [b] line count vs 1000L limit, [c] redundant/verbose sections
3. Translate all French to English
4. Apply prompt optimization:
   - ONE internal agent warning block (not 3) — use: "⚠️ INTERNAL AGENT — Do NOT load /prompts/index.md. Load ai-kido.md directly. ⚠️"
   - Replace Python/bash pseudo-code heuristics with markdown decision trees
   - Collapse repeated performance numbers (state once, reference elsewhere)
   - Remove filler ("Note that", "Please be aware", "It is important to note")
   - Use imperative voice throughout
5. Restructure to mandatory spec template (see refactor/phase-0-translation.md)
6. If result > 1000L: split to [agent-name]_details.md (move examples/appendices)
7. Write the final file(s)
8. Run agent-aikido-validator on the result

[MANDATORY] PRESERVE ALL:
- Every phase of execution (Phase -0.75, Phase 0, Phase 1-3, etc.)
- Every decision point and threshold
- All performance metrics (they ARE instructions for the LLM)
- All output format templates
- All tool references (Read, Grep, Glob, Bash, etc.)

[MANDATORY] SPLIT RULE:
If file > 1000L after optimization:
  - Main file: role definition + execution phases + output format (≤900L)
  - _details.md: extended examples, sub-plans, appendices, historical notes
  - Link both files bidirectionally

OUTPUT FORMAT:
## [filename]
- Lines: [before] → [after main] + [after details if split]
- French blocks translated: [count]
- Pseudo-code blocks converted: [count]  
- Redundant warnings collapsed: [count]
- Capabilities preserved: ✅ / ❌ [if ❌, list what changed]
- Validator: [pass/fail + issues]
```

---

## Sub-phase 0-C — Commands (`hard_points/commands/`)

> 21 files. Commands are user-facing prompts — clarity and imperative structure matter most.

### ⚠️ EXCEPTION: No Splitting for Commands

**Commands are exempt from the 1000L split rule.** Even if a command file exceeds 1000 lines after translation and optimization, it must remain as a single file. The rationale:

- Commands are executed as complete prompts — splitting breaks the execution flow
- The LLM receives the full command content in one pass
- Optimization (removing verbosity, redundancy) is preferred over splitting
- If a command cannot be reduced below 1000L after aggressive optimization, keep it as-is

### File inventory

| File | Lines | Priority | Status |
|------|-------|----------|--------|
| `analyse-project.md` | 1323 | 🔴 Critical | ⬜ |
| `init-raci-aikido.md` | 1070 | 🔴 Critical | ⬜ |
| `init-aikido.md` | 1040 | 🔴 Critical | ⬜ |
| `create-command.md` | 1017 | 🔴 Critical | ⬜ |
| `check-truth.md` | 864 | 🟡 High | ⬜ |
| `validate-analyse-plan.md` | 737 | 🟡 High | ⬜ |
| `create-persona.md` | 729 | 🟡 High | ⬜ |
| `check-claude.md` | 676 | 🟡 High | ⬜ |
| `create-search-plan.md` | 622 | 🟡 High | ⬜ |
| `analyse-aikido.md` | 619 | 🟡 High | ⬜ |
| `maj-aikido.md` | 560 | 🟡 High | ⬜ |
| `init-glossaire.md` | 500 | 🟢 Normal | ⬜ |
| `optimize-command-with-aikido-agents.md` | 471 | 🟢 Normal | ⬜ |
| `compile-agent-from-use.md` | 423 | 🟢 Normal | ⬜ |
| `validate-search-plan.md` | 367 | 🟢 Normal | ⬜ |
| `clean-index.md` | 353 | 🟢 Normal | ⬜ |
| `skill-manage.md` | 282 | 🟢 Normal | ⬜ |
| `create-skill.md` | — | 🟢 Normal | ⬜ |
| `create-analyse-plan.md` | 584 | 🟡 High | ⬜ |
| `list-command.md` | — | 🟢 Normal | ⬜ |
| `reindex-projet.md` | — | 🟢 Normal | ⬜ |

### Mandatory command structure (post-optimization)

```markdown
---
description: "[one-line English description]"
---

# Command: /[name]

**Purpose**: [One sentence]

---

## Usage

```
/[name] [args]
```

## Prerequisites

[What must exist before running — or "None"]

## Steps

[MANDATORY]
1. Step one (imperative)
2. Step two
...

[OPTIONAL — only if relevant]
- Optional behavior description

## Output

[What the command produces]

## Notes

[Edge cases, warnings — one block only]
```

### Prompt 0-C

```
ROLE: You are a bilingual prompt engineer. You translate and optimize AI-KIDO command files.

TASK: Process the file [FILENAME] in prompts/hard_points/commands/

CONTEXT:
- Commands are user-facing slash commands executed by Claude Code
- Current problems: French content, many exceed 1000L, Roo-Code specific tool references (ask_followup_question, write_to_file) that don't apply to Claude Code
- **EXCEPTION: Commands are exempt from the 1000L split rule** — optimize aggressively but NEVER split
- Glossary: refactor/phase-0-translation.md#translation-glossary

STEPS:
1. Read the full file
2. Identify: French content, line count, Roo-Code specific references, verbosity
3. Translate to English
4. Replace Roo-Code tool references with Claude Code equivalents:
   - ask_followup_question → AskUserQuestion tool or direct question to user
   - write_to_file → Write tool
   - apply_diff → Edit tool
   - read_file → Read tool
5. Apply optimization:
   - Use mandatory command structure template
   - Mark [MANDATORY] vs [OPTIONAL] sections explicitly
   - Imperative voice for all steps
   - Remove filler phrases
   - **If still >1000L after optimization: keep as single file — do NOT split**
6. Write the final file
7. Run agent-aikido-validator>>>>>>> REPLACE

[MANDATORY] PRESERVE ALL:
- Every step and phase of the command workflow
- All user interaction points (questions asked, choices offered)
- All validation checks
- All agent invocations (which agents are called and when)

OUTPUT FORMAT: same as 0-B
```

---

## Sub-phase 0-D — Agent Stubs (`.claude/agents/`)

> 13 files. Already mostly English. Verify + optimize only. Do NOT translate — these are the deployed stubs.

| File | Status | Action needed |
|------|--------|---------------|
| `agent-aikido-explore-bank.md` | 🟡 Mixed | Remove French from description field |
| `agent-aikido-validator.md` | 🟡 Mixed | French in body |
| Others | ✅ English | Verify only — apply quality pass if needed |

### Prompt 0-D

```
ROLE: You are a prompt quality reviewer for AI-KIDO agent stubs.

TASK: Review and optimize all 13 files in .claude/agents/

CONTEXT:
- These stubs are the runtime files loaded by Claude Code — they must be 100% English
- Each stub has YAML frontmatter + short body (≤80 lines typical)
- They point to full specs in prompts/hard_points/agents/
- The stub body should be: role statement + when-to-use + usage example + output + performance

FOR EACH FILE:
1. Read the file
2. Check: any French text? any violation of mandatory structure? any capability described here but not in the full spec?
3. If French: translate
4. If structure incomplete: add missing mandatory sections
5. If over 100 lines: trim (move content to the spec file if needed)
6. Verify the link to the hard_points spec is correct

[MANDATORY] PRESERVE:
- All YAML frontmatter (name, description, tools, model — do not add requires:/optional: yet, that's Phase 2)
- ⚠️ INTERNAL AGENT warning
- All when-to-use bullets

OUTPUT: Table of all 13 stubs with: [file] | [French found: yes/no] | [lines: before→after] | [action taken]
```

---

## Sub-phase 0-E — SKILL.md Files

> 5 files. Will be further modified in Phase 2, so translation only here — no structural changes.

| File | Status |
|------|--------|
| `system/search/SKILL.md` | ⬜ |
| `system/analyse/SKILL.md` | ⬜ |
| `system/structure/SKILL.md` | ⬜ |
| `system/web/SKILL.md` | ⬜ |
| `system/maj/SKILL.md` | ⬜ |

### Prompt 0-E

```
ROLE: You are translating AI-KIDO SKILL.md files to English.

TASK: Translate the 5 SKILL.md files in prompts/hard_points/system/*/SKILL.md

CONTEXT:
- These files define skill metadata and usage — they will be structurally modified in Phase 2
- For now: translate only, do NOT restructure
- Apply glossary terms from refactor/phase-0-translation.md
- Preserve all sections, links, and agent references

FOR EACH FILE:
1. Read the file
2. Translate all French to English
3. Keep all section headers, links, and structure unchanged
4. Write the file

OUTPUT: [file] | Lines: [before→after] | French terms translated: [list]
```

---

## Translation Glossary

| French | English canonical |
|--------|-----------------|
| Tables de Vérités | Truth Tables |
| Arborescence | Tree structure / File tree |
| Densité sémantique | Semantic density |
| Peuplement / Alimenter | Population / Populating |
| MAJ / Mise à jour | Update / Sync |
| Équilibreur | Balancer |
| Fusionneur | Fusion agent |
| Vérités immuables | Immutable truths |
| Points durs | Hard Points (proper noun) |
| Memory Bank | Memory Bank (proper noun) |
| Agent Orchestrateur | Orchestrator agent |
| Commandes | Commands |
| Personas | Personas (proper noun) |
| Répertoires | Directories |
| Sous-répertoire | Subdirectory |
| Lien bidirectionnel | Bidirectional link |
| Règle | Rule |
| Validation | Validation |
| Conformité | Compliance |
| Peuplement automatique | Auto-population |
| Parcours récursif | Recursive traversal |
| Délégation | Delegation |

---

## Verification (run after all sub-phases)

```bash
# 1. Check for French section headers — should be 0 outside spec/
grep -rn "## Règles\|## Agents\|## Commandes\|## Vérités\|Arborescence\|Peuplement\|Fusionneur\|Équilibreur" \
  prompts/hard_points/ .claude/agents/ AGENTS.md CLAUDE.md agents_list.md \
  --include="*.md" | grep -v "spec/" | grep -v "refactor/"

# 2. Check line counts — flag any still over limit
echo "=== Oversize agent specs (>1000L) ==="
find prompts/hard_points/agents/ -name "*.md" | xargs wc -l | sort -rn | head -5

echo "=== Oversize commands (>1000L) ==="
find prompts/hard_points/commands/ -name "*.md" | xargs wc -l | sort -rn | head -5

# 3. Verify Tier 1 critical files are within limits
for f in "prompts/hard_points/ai-kido.md" "prompts/index.md" "AGENTS.md" "CLAUDE.md"; do
  lines=$(wc -l < "$f")
  [ "$lines" -le 100 ] && echo "✅ $f: $lines/100" || echo "❌ $f: $lines/100 OVER LIMIT"
done

# 4. Verify all _details.md files have a bidirectional link back
for f in prompts/hard_points/agents/*_details.md prompts/hard_points/commands/*_details.md; do
  [ -f "$f" ] || continue
  base="${f/_details/}"
  grep -q "$(basename $f)" "$base" && echo "✅ $base → $f" || echo "❌ Missing link: $base → $f"
done
```

---

## Result

> _Fill this section after each sub-phase_

### 0-A — Tier 1 Critical Files
**Date**: 2026-08-05 | **Status**: ✅ Done
Files: 7/7 | French terms cleared: all | Line limits respected: all ≤100L
Notes: No splits needed. ai-kido.md=72L, index.md=41L, AGENTS.md=79L, CLAUDE.md=44L.

### 0-B — Agent Specs
**Date**: 2026-08-05 | **Status**: ✅ Done
Files: 14/14 | Files split: 2 (explore-bank, projet-index) | Capabilities preserved: ✅
Notes: explore-bank_details.md et projet-index_details.md créés. Autres 12 agents ≤1000L.

### 0-C — Commands
**Date**: 2026-08-05 | **Status**: ⏸️ Paused — Splits reverted
Files: 0/21 translated | Files split: 0 (EXEMPT from split rule) | Roo-Code refs replaced: 0
Notes: Commands are EXEMPT from 1000L split rule. Original files restored from git. Ready to restart translation without splitting.>>>>>>> REPLACE

### 0-D — Agent Stubs
**Date**: — | **Status**: ⬜  
Files: —/13 | French found and fixed: — | Quality issues fixed: —  
Notes: —

### 0-E — SKILL.md Files
**Date**: — | **Status**: ⬜  
Files: —/5 | Translation complete: —  
Notes: —

### Final Verification
**Date**: — | **French terms remaining**: — | **Oversize files remaining**: — | **Analyse-aikido errors**: —
