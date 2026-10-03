# AI-KIDO Memory Bank Refactoring

> **Started**: 2026-08-05 | **Status**: 🟡 In Progress | **Version target**: 1.4.0

## Objective

Transform the AI-KIDO memory bank into a **downloadable, installable base pack** for Claude Code:

1. Translate all prompts to English
2. Package the full project as a distributable "common aikido" base (all agents, skills, rules, infrastructure)
3. Add a formal machine-readable dependency graph between agents and skills
4. Enable one-command bootstrap: `skill-manage get aikido-common`
5. Clearly separate **common** (reusable, overwritable) from **project-specific** content

## Principles

- **Preserve all existing functions** — every agent, skill, command must keep its full feature set
- **Optimize prompts** — apply 2025-2026 prompting/meta-prompting best practices (mandatory sections, clear role/task/context/output separation, chain-of-thought where needed)
- **Semantic density** — maximum information, minimum tokens (AI-KIDO rule 11)
- **Reversible phases** — each phase can be re-run or rolled back independently
- **Validatable** — each phase has explicit verification steps

## Phases

| # | File | Status | Result |
|---|------|--------|--------|
| 0 | [phase-0-translation.md](phase-0-translation.md) | ✅ Completed 2026-08-05 (5 sub-phases) | All files EN, 6 splits, 0-B/0-C/0-D/0-E done |
| 1 | [phase-1-manifest.md](phase-1-manifest.md) | ⬜ Pending | — |
| 2 | [phase-2-dependency-graph.md](phase-2-dependency-graph.md) | ⬜ Pending | — |
| 3 | [phase-3-install-mechanism.md](phase-3-install-mechanism.md) | ⬜ Pending | — |
| 4 | [phase-4-common-layer.md](phase-4-common-layer.md) | ⬜ Pending | — |
| 5 | [phase-5-validation-sync.md](phase-5-validation-sync.md) | ⬜ Pending | — |

## Status Legend

| Icon | Meaning |
|------|---------|
| ⬜ | Pending — not started |
| 🟡 | In Progress |
| ✅ | Completed and validated |
| 🔁 | Re-run needed |
| ❌ | Blocked |

## How to Use This Refactor

1. **Read [`decisions.md`](decisions.md) first** — it tracks all structural changes between phases
2. Start with `phase-0-translation.md` (5 sub-phases: 0-A → 0-E)
3. Each phase file contains: preconditions (what to read from decisions.md), tasks, prompt to execute, verification, and result tracking
4. **After each phase/sub-phase**: fill the Result section AND append decisions to `decisions.md`
5. If a phase needs improvement, edit its file and re-run — the phase is self-contained
6. `decisions.md` is the **contract bus** — it prevents phase N from breaking phase N+1

## Key Files Modified Across All Phases

```
aikido-manifest.json          ← NEW (Phase 1)
dependencies.json             ← NEW (Phase 2)
common/README.md              ← NEW (Phase 4)
.claude/agents/*.md           ← Modified: requires/optional frontmatter (Phase 2)
prompts/hard_points/system/*/SKILL.md  ← Modified: structured agents section (Phase 2)
prompts/hard_points/commands/skill-manage.md  ← Modified: full-pack install (Phase 3)
prompts/hard_points/agents/agent-aikido-validator.md  ← Modified: rule 19 (Phase 5)
prompts/hard_points/ai-kido.md  ← Modified: rule count update (Phase 5)
```
