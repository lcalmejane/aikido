# Phase 5 — Validation Sync & Prompt Optimization

> **Status**: ⬜ Pending  
> **Depends on**: Phases 0–4 (all previous phases)  
> **Re-runnable**: ✅ Yes — all changes are additive or targeted updates

---

## Preconditions — Read Before Starting

**Read [`decisions.md`](decisions.md) ALL phase sections before starting.**

Critical checks before each task:

**Task 5.1 — Rule 19 in `agent-aikido-validator.md`**:
- Phase 0-B may have restructured this file. Check current rule count and last rule number.
- Rule 19 must come AFTER the last existing rule. If 0-B restructuring changed the numbering, insert at the new last position.
- Check current line count — adding rule 19 must keep the file ≤1000L.

**Task 5.2 — Update rule count in `ai-kido.md`**:
- Phase 0-A may have already updated or reformatted this file.
- Check the exact current wording of the rule count reference (may no longer say "18 règles fondamentales" — could be "18 fundamental rules" or other after 0-A translation).
- File must stay ≤100L after update.

**Task 5.3 — `--deps` flag in `check-truth.md`**:
- Phase 0-C translated and optimized this file. It may already have been split to `check-truth_details.md`.
- Check current line count of the main file before inserting — must stay ≤1000L.
- Verify 0-C did NOT already add a `--deps` flag (it was a Roo-Code command originally — 0-C may have added Claude Code equivalents).

**Task 5.4 — Pre-flight section in `plan-beginning.md`**:
- Phase 0 (0-C or plans tier) may have translated this file.
- Check current content — verify there is no existing dependency check section that 0-C may have added.

**Task 5.5 — Quality pass on agent stubs**:
- Phase 2 added `requires:` / `optional:` fields to all stubs.
- Phase 0-D did a quality pass already — only apply additional improvements, never remove what 0-D and Phase 2 added.
- Check `decisions.md` Phase 2 for the exact `requires:` values per stub — do not overwrite them.

## Post-execution obligation

After Phase 5 completes, record in [`decisions.md`](decisions.md) Phase 5 section:
- Line number where rule 19 was inserted in agent-aikido-validator.md
- Final line count of ai-kido.md (must be ≤100)
- Whether check-truth.md was already split before Phase 5

---

## Context

After introducing `dependencies.json` and `requires:` frontmatter fields, there are three locations that must stay in sync:
1. `dependencies.json` — authoritative machine-readable graph
2. `.claude/agents/*.md` frontmatter `requires:` field — each stub's self-declaration
3. SKILL.md `## Associated Agents` YAML blocks

This phase adds validator rule 19 to detect drift, updates `check-truth` with a `--deps` flag, updates the `maj` skill's update flow to be dependency-aware, and performs a final prompt quality pass across all agent stubs.

---

## Tasks

| # | Task | Status | Notes |
|---|------|--------|-------|
| 5.1 | Add rule 19 to `agent-aikido-validator.md` | ⬜ | Dependency consistency check |
| 5.2 | Update `ai-kido.md` rule count (18 → 19) | ⬜ | One-line change |
| 5.3 | Add `--deps` flag to `check-truth.md` | ⬜ | New check mode |
| 5.4 | Update `system/maj/plans/plan-beginning.md` | ⬜ | Dependency-order check at update start |
| 5.5 | Prompt quality pass — agent stubs | ⬜ | Apply 2025-2026 best practices |
| 5.6 | Run final `/analyse-aikido` | ⬜ | Zero errors target |

---

## Rule 19 to Add in `agent-aikido-validator.md`

Insert in the rules section, after rule 18:

```markdown
19. **Dependency Consistency**: `.claude/agents/*.md` frontmatter `requires:` MUST match the corresponding entry in `/dependencies.json`. 
    - Check: for each agent stub, read `requires:`, compare with `dependencies.json nodes.agents.<agent>.requires`
    - Flag as ERROR if: field missing from stub, field present but not in graph, values differ
    - Auto-fix: update stub `requires:` to match graph (graph is authoritative)
```

---

## `check-truth.md` Addition

Add `--deps` mode to the command:

```markdown
### Mode: --deps (Dependency Consistency Check)

Verifies that agent stub frontmatter matches dependencies.json:

```
/check-truth --deps
```

Checks:
1. Every agent in dependencies.json has a matching stub in .claude/agents/ (or stub: null)
2. Every stub's `requires:` matches dependencies.json
3. Every stub's `optional:` matches dependencies.json  
4. No circular dependencies in the graph
5. All paths in dependencies.json (stub, spec) exist on disk

Invokes: agent-aikido-validator with MODE=dependency-check
```

---

## `plan-beginning.md` Addition

Insert at the start of the plan (before Phase 1 / main update steps):

```markdown
## Pre-flight: Dependency Check

Before updating, verify dependency compatibility:

1. Read `dependencies.json` from the SOURCE version
2. Compare `install_order` and `requires` with current installed `dependencies.json`
3. If new hard `requires` relationships added:
   - List the new requirements
   - Install them BEFORE proceeding with the main update
4. If any agent in `install_order` is missing from current installation:
   - WARN the user
   - Offer to install missing agents first
5. On conflict: halt update, report, ask user to resolve
```

---

## Prompt Quality Pass — Agent Stubs (Task 5.5)

Apply 2025-2026 prompting best practices to all 13 `.claude/agents/*.md` stubs. Each stub must have:

### Structure template (mandatory sections)

```markdown
---
[YAML frontmatter with name, description, tools, model, requires, optional]
---

# [Emoji] [Agent Name]

[ONE sentence role statement: "You are the X. You do Y."]

**Full specification**: `[path to hard_points spec]` ([N] lines)

---

⚠️ INTERNAL AGENT — DO NOT load `/prompts/index.md` but DO load `ai-kido.md` ⚠️

---

## When to Use

**Use when:**
- [bullet 1]
- [bullet 2]

**Don't use when:**
- [bullet 1]
- [bullet 2]

## [Primary Action / Usage]

[Minimal instruction — what the agent does, not how it does it internally]

## Output Format

[What the response looks like]

## Performance

- **Tokens**: ~X
- **Time**: ~Xs

---

**Full details**: Read `[path to spec]`
```

### Quality rules for the pass

1. **Role clarity**: First sentence must state role and primary capability unambiguously
2. **No duplicate content**: Stub describes WHAT; spec (hard_points) describes HOW — no duplication
3. **Concrete when/don't-use**: At least 2 bullets each, no vague entries like "when needed"
4. **Output format defined**: Downstream agents need to know what to expect
5. **Semantic density**: Trim filler phrases ("In order to", "Please note that", "It is important to")
6. **No breaking changes**: Every existing capability must remain described (can be condensed, never removed)
7. **English only**: No French words remaining

---

## Prompt to Execute

```
You are performing the final validation sync and prompt quality pass for the AI-KIDO memory bank refactoring.

CONTEXT:
- Project: /path/to/ai-kido-best-practices
- Reference: refactor/phase-5-validation-sync.md

TASK 1 — Add rule 19 to agent-aikido-validator.md:
- Read prompts/hard_points/agents/agent-aikido-validator.md
- Insert rule 19 after rule 18 (the last rule)
- Use exact text from phase-5-validation-sync.md
- PRESERVE all other content

TASK 2 — Update ai-kido.md rule count:
- Read prompts/hard_points/ai-kido.md
- Find the line "18 règles fondamentales" or equivalent reference to 18 rules
- Update to reference 19 rules
- PRESERVE all other content
- Verify file stays ≤100 lines (critical limit)

TASK 3 — Add --deps flag to check-truth.md:
- Read prompts/hard_points/commands/check-truth.md
- Insert the "--deps mode" section from the reference
- PRESERVE all existing content

TASK 4 — Update plan-beginning.md:
- Read prompts/hard_points/system/maj/plans/plan-beginning.md
- Insert the "Pre-flight: Dependency Check" section at the TOP of the plan
- PRESERVE all existing content

TASK 5 — Prompt quality pass on agent stubs:
For each .claude/agents/agent-aikido-*.md:
1. Read the current file
2. Evaluate against the quality rules in phase-5-validation-sync.md
3. Apply improvements: trim filler, clarify role statement, ensure output format is defined
4. NEVER remove existing capabilities or when/don't-use bullets — only add, clarify, or condense
5. Ensure English only
6. Maintain ≤1000 line limit

CHAIN-OF-THOUGHT for each stub:
- Read → identify quality gaps → list improvements → apply → verify no capability removed

MANDATORY RULES:
1. Never reduce agent capabilities
2. Never remove "⚠️ INTERNAL AGENT" warning
3. Never modify YAML frontmatter except as part of Phases 0-2 (already done)
4. If ai-kido.md would exceed 100 lines after rule 19 reference, move overflow to ai-kido_details.md
5. Run /analyse-aikido at the end

OUTPUT FORMAT:
## Task results
- Rule 19 added: [yes/no]
- ai-kido.md updated: [yes/no, line count: X/100]
- check-truth.md updated: [yes/no]
- plan-beginning.md updated: [yes/no]

## Prompt quality pass results
For each stub: [agent-name]: [improvements applied / no changes needed]

## /analyse-aikido result
- Errors: X
- Warnings: X
- [list any issues found]
```

---

## Verification

```bash
# Verify rule 19 added to validator
grep -n "19\|Dependency Consistency" prompts/hard_points/agents/agent-aikido-validator.md

# Verify ai-kido.md still ≤100 lines
wc -l prompts/hard_points/ai-kido.md
# Expected: ≤100

# Verify check-truth has --deps
grep -n "\-\-deps\|dependency" prompts/hard_points/commands/check-truth.md

# Verify plan-beginning has Pre-flight section
grep -n "Pre-flight\|Dependency Check" prompts/hard_points/system/maj/plans/plan-beginning.md

# Final French content check across all modified files
grep -rn "Règles\|Vérités\|Arborescence\|Peuplement" \
  .claude/agents/ prompts/hard_points/agents/ prompts/hard_points/commands/ \
  --include="*.md" | grep -v spec/
# Expected: 0 hits

# Run full compliance check
# /analyse-aikido
```

---

## Result

> _Fill this section after execution_

**Date completed**: —  
**Rule 19 added**: ⬜  
**ai-kido.md within 100 lines**: ⬜ (— / 100 lines)  
**check-truth --deps added**: ⬜  
**plan-beginning updated**: ⬜  
**Agent stubs quality pass**: — / 13 improved  
**/analyse-aikido errors**: —  
**/analyse-aikido warnings**: —  
**Final validation**: ⬜ Pending

### Notes

_Record quality issues found in stubs, any stubs that needed significant rework, rule 19 edge cases._
