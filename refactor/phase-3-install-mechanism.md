# Phase 3 — Claude Code Install Mechanism

> **Status**: ⬜ Pending  
> **Depends on**: Phase 1 (manifest), Phase 2 (dependency graph)  
> **Re-runnable**: ✅ Yes — changes to skill-manage.md are additive

---

## Preconditions — Read Before Starting

**Read [`decisions.md`](decisions.md) Phases 0-C, 1, and 2 sections first.**

Critical checks:
1. **skill-manage.md state after Phase 0-C**: Phase 0-C may have already modified `skill-manage.md` (translation + optimization + possible split). Check:
   - Current line count (the plan's limit is 1000L — available headroom for Phase 3 additions)
   - Whether a `skill-manage_details.md` was created by 0-C (if so, the main file is already trimmed)
   - Whether 0-C replaced any Roo-Code tool references that appear in the full-pack install flow description
   
2. **`aikido-manifest.json` paths (Phase 1 decisions)**: Phase 3 references `aikido-manifest.json` `common_paths` in the install flow. Verify the paths listed in the Phase 3 flow match what Phase 1 actually wrote.

3. **`dependencies.json` `install_order` (Phase 2 decisions)**: The install flow in Phase 3 follows this order. Verify against the actual `install_order` written by Phase 2 (may differ slightly from the plan if Phase 2 adjusted for split files or corrected paths).

## Post-execution obligation

After Phase 3 completes, record in [`decisions.md`](decisions.md) Phase 3 section:
- Final line count of skill-manage.md
- Whether a `_details.md` split was needed (and what went there)
- Line number where the full-pack section was inserted
- Any flags (`--dry-run`, `--mode`) that were added differently than planned

---

## Context

Currently `skill-manage get <slug>` installs individual skills from a GitLab group. There is no way to bootstrap an entire new project — all agents, skills, commands, and memory bank infrastructure — in one command.

This phase extends `skill-manage` to handle a special slug `aikido-common` that triggers a **full-pack install** rather than a single skill install. The install follows the dependency order from `dependencies.json`.

**Reuses**: Existing clone/archive logic in `skill-manage`, existing `agent-aikido-indexer` for registry sync, existing `agent-aikido-validator` for post-install validation.

---

## Tasks

| # | Task | Status | Notes |
|---|------|--------|-------|
| 3.1 | Add full-pack install mode detection to `skill-manage.md` | ⬜ | Detect `aikido-common` slug OR `aikido-manifest.json` in source |
| 3.2 | Define the 5-phase install flow in `skill-manage.md` | ⬜ | See flow below |
| 3.3 | Add `--dry-run` flag documentation | ⬜ | Lists what would be installed without executing |
| 3.4 | Add `--mode standard|light` flag documentation | ⬜ | Selects ai-kido.md vs ai-kido-light.md |
| 3.5 | Test dry-run in empty project | ⬜ | Manual test |

---

## Install Flow Design

```
skill-manage get aikido-common [--source <url|path>] [--mode standard|light] [--dry-run]
```

### Detection logic (insert in existing `get` ACTION of skill-manage.md)

```
IF SELECTED_SKILL == "aikido-common" OR source_root contains "aikido-manifest.json":
  → SWITCH to FULL-PACK INSTALL mode
  → Read aikido-manifest.json for install plan
  → Read dependencies.json for install_order
  → Execute phases 0–4 below
  → SKIP standard SKILL.md registration flow
ELSE:
  → Continue with existing single-skill install flow
```

### Phase 0 — Bootstrap check
- Check if `.claude/agents/` contains any `agent-aikido-*.md` files
- If yes → UPDATE mode (skip scaffold creation)
- If no → FRESH INSTALL mode

### Phase 1 — Source acquisition
- Reuse existing skill-manage clone logic: `git clone $AIKIDO_COMMON_SOURCE /tmp/aikido-install-$(date +%Y%m%d)/`
- If `--source` provided: use that instead of `$AIKIDO_COMMON_SOURCE`
- Validate `aikido-manifest.json` and `dependencies.json` exist in source

### Phase 2 — Dependency-ordered agent install
- Read `dependencies.json` `install_order` array
- For each agent in order:
  - Copy `<source>/.claude/agents/<stub>.md` → `./.claude/agents/<stub>.md`
  - Copy `<source>/prompts/hard_points/agents/<spec>.md` → `./prompts/hard_points/agents/<spec>.md`
  - Verify `requires` dependencies are present before continuing
- If `--dry-run`: print list only, do not copy

### Phase 3 — Skills, commands, and hard points install
- Copy all paths from `aikido-manifest.json` `common_paths` (excluding agents, already done)
- Skip paths in `protected_paths`
- On conflict with modified local file: apply `on_conflict` strategy (`ask` by default)

### Phase 4 — Bootstrap files install
- Copy all files from `aikido-manifest.json` `install.bootstrap_files`
- These are safe to overwrite (AGENTS.md, CLAUDE.md, registries, prompts/index.md)

### Phase 5 — Post-install
- Create `prompts/gen/` scaffold (from `post_install_scaffold`) if FRESH INSTALL and if not already existing
- Run `agent-aikido-indexer` to sync registries
- Run `agent-aikido-validator` on all installed files
- Print install summary: version installed, file count, warnings

---

## Section to Add in `skill-manage.md`

The following section should be **inserted after the ACTION `get` header and before its existing pipeline description**, as a new sub-section:

```markdown
### Full-Pack Install Mode (`aikido-common`)

When slug is `aikido-common` (or source root contains `aikido-manifest.json`), switches to full-pack install:

**Command**:
```
/skill-manage get aikido-common [--source <url|path>] [--mode standard|light] [--dry-run]
```

**Flags**:
- `--source`: Override default source from `AIKIDO_COMMON_SOURCE` in skills.cfg
- `--mode standard|light`: Select ai-kido.md (default) or ai-kido-light.md as rule file
- `--dry-run`: Print what would be installed without executing changes

**Install phases**:
1. Bootstrap check (fresh vs update)
2. Source acquisition (clone from AIKIDO_COMMON_SOURCE or --source)
3. Dependency-ordered agent install (follow install_order in dependencies.json)
4. Skills, commands, hard points install (follow common_paths in aikido-manifest.json)
5. Bootstrap files install (AGENTS.md, CLAUDE.md, registries, prompts/index.md)
6. Post-install: gen/ scaffold (fresh only) + registry sync + validation

**Protected paths** (never overwritten): `prompts/spec/`, `prompts/gen/`

**Agents called**: agent-aikido-indexer (registry sync), agent-aikido-validator (post-install check)
```

---

## Prompt to Execute

```
You are extending the skill-manage command to support full-pack install of the AI-KIDO common base.

CONTEXT:
- File to modify: prompts/hard_points/commands/skill-manage.md
- Reference: refactor/phase-3-install-mechanism.md contains the exact section to add and the install flow design
- Existing skill-manage.md has 4 actions: search, get, update, uninstall

TASK:
1. Read prompts/hard_points/commands/skill-manage.md completely first
2. Locate the ACTION `get` section
3. Insert the "Full-Pack Install Mode" sub-section from the reference file
   - Insert AFTER the `get` action header, BEFORE the existing single-skill pipeline description
   - The new section describes detection logic and the 5-phase install flow
4. Add `--dry-run` and `--mode` to the global flags section if it exists, or create one

MANDATORY RULES:
1. PRESERVE all existing content — no existing section may be removed or shortened
2. Do not change any other action (search, update, uninstall)
3. The new section is additive only — it describes a new code path that only activates for `aikido-common`
4. Maintain AI-KIDO line limit: commands ≤1000 lines total
   - If adding the section would exceed 1000 lines, split skill-manage.md into skill-manage.md + skill-manage_details.md (overflow file pattern from ai-kido.md rule 4)
5. After modification, run agent-aikido-validator on the file

CHAIN-OF-THOUGHT:
- Read current file → count current lines
- Check if new content fits within 1000 lines
- If yes: insert directly
- If no: identify overflow content (least-critical sections) → create _details.md + add link

OUTPUT FORMAT:
## skill-manage.md
- Lines before: X
- Lines after: Y
- Within limit (≤1000): [yes/no]
- Split needed: [yes/no → if yes, describe what went to _details.md]
- Section inserted at line: Z

## Validation
- agent-aikido-validator result: [pass/fail + issues]
```

---

## Verification

```bash
# Check skill-manage.md line count
wc -l prompts/hard_points/commands/skill-manage.md

# Verify full-pack section was added
grep -n "aikido-common\|Full-Pack\|FULL-PACK" prompts/hard_points/commands/skill-manage.md

# Verify --dry-run is documented
grep -n "dry-run\|dry_run" prompts/hard_points/commands/skill-manage.md

# Verify protected_paths reference is present
grep -n "protected_paths\|prompts/spec\|prompts/gen" prompts/hard_points/commands/skill-manage.md

# Verify existing actions still present (regression check)
for action in "search" "update" "uninstall"; do
  grep -q "ACTION.*$action\|## $action\|### $action" prompts/hard_points/commands/skill-manage.md \
    && echo "✅ $action action preserved" || echo "❌ $action action MISSING"
done
```

---

## Result

> _Fill this section after execution_

**Date completed**: —  
**skill-manage.md modified**: ⬜  
**Lines before / after**: — / —  
**Within 1000-line limit**: ⬜  
**Split needed**: — (yes/no)  
**Full-pack section added**: ⬜  
**Existing actions preserved**: ⬜  
**Validation**: ⬜ Pending

### Notes

_Record any decisions about line splitting, edge cases in the install flow, flags added._
