# Phase 1 — Common Pack Manifest (`aikido-manifest.json`)

> **Status**: ⬜ Pending  
> **Depends on**: Phase 0 (translation)  
> **Re-runnable**: ✅ Yes — manifest is a new file, no destructive changes

---

## Preconditions — Read Before Starting

**Read [`decisions.md`](decisions.md) Phase 0 section first.**

Key checks from Phase 0 results:
- **Split files from 0-B**: The `common_paths` glob `"prompts/hard_points/agents/"` covers all files including `_details.md` splits — no manifest change needed UNLESS a spec file moved to a different directory. If any spec moved, update the manifest path accordingly.
- **split files from 0-C**: Same rule applies to `"prompts/hard_points/commands/"`.
- **Confirm `ai-kido_details.md` exists**: The manifest already lists it in `common_paths` — verify it was created by 0-A (if ai-kido.md was split), otherwise remove that entry.

## Post-execution obligation

After Phase 1 completes, record in [`decisions.md`](decisions.md) Phase 1 section:
- All confirmed `common_paths` entries (which exist vs which were adjusted)
- Any path added or removed from the manifest schema versus the plan

---

## Context

There is currently no machine-readable declaration of what belongs to the "common aikido" pack (reusable by any project) versus project-specific content. This makes it impossible for install tooling to know what to copy, what to protect, and what to skip.

This phase creates `aikido-manifest.json` and updates `skills.cfg` and `maj-aikido.md` to reference it.

**Common** = overwritable on update (hard points authority — AI-KIDO rule 8)  
**Spec** = never overwritten (project-generated or project-personal)

---

## Tasks

| # | Task | Status | Notes |
|---|------|--------|-------|
| 1.1 | Create `aikido-manifest.json` at project root | ⬜ | See schema below |
| 1.2 | Add `MANIFEST_FILE` and `AIKIDO_COMMON_SOURCE` to `skills.cfg` | ⬜ | |
| 1.3 | Update `maj-aikido.md` — reference manifest as boundary authority | ⬜ | Targeted addition only |
| 1.4 | Verify all `common_paths` entries exist | ⬜ | Script below |
| 1.5 | Verify no `spec_paths` overlap with `common_paths` | ⬜ | |

---

## File to Create: `aikido-manifest.json`

```json
{
  "aikido": {
    "version": "1.4.0",
    "name": "aikido-common",
    "description": "AI-KIDO base pack — agents, skills, rules, and memory bank infrastructure",
    "homepage": "https://github.com/your-org/ai-kido-best-practices"
  },
  "pack": {
    "type": "common",
    "min_claude_code_version": "1.0",
    "mode_support": ["standard", "light"]
  },
  "common_paths": [
    ".claude/agents/agent-aikido-*.md",
    ".claude/commands/*.md",
    "prompts/hard_points/agents/",
    "prompts/hard_points/commands/",
    "prompts/hard_points/system/",
    "prompts/hard_points/ai-kido.md",
    "prompts/hard_points/ai-kido-light.md",
    "prompts/hard_points/ai-kido_details.md",
    "prompts/hard_points/ai-kido-light_details.md",
    "prompts/hard_points/gestion-logs-aikido.md",
    "prompts/hard_points/configuration/"
  ],
  "spec_paths": [
    "prompts/spec/",
    "prompts/gen/"
  ],
  "install": {
    "bootstrap_files": [
      "AGENTS.md",
      "CLAUDE.md",
      "agents_list.md",
      "skills_list.md",
      "commands_list.md",
      "prompts/index.md",
      "prompts/hard_points/ai-kido.md",
      "prompts/hard_points/ai-kido-light.md"
    ],
    "protected_paths": [
      "prompts/spec/",
      "prompts/gen/"
    ],
    "on_conflict": "ask",
    "post_install_scaffold": [
      "prompts/gen/concepts/index.md",
      "prompts/gen/techniques/index.md",
      "prompts/gen/personas/index.md",
      "prompts/gen/use_cases/index.md",
      "prompts/gen/skills/",
      "prompts/gen/agents/index.md",
      "prompts/spec/index.md"
    ]
  }
}
```

---

## Files to Modify

### `prompts/hard_points/configuration/skills.cfg`

Add at end:
```ini
# Common pack manifest and source
MANIFEST_FILE=aikido-manifest.json
AIKIDO_COMMON_SOURCE=git@github.com:lcalmejane/aikido.git
```

### `prompts/hard_points/commands/maj-aikido.md`

Add a reference in the "boundaries" section:
```markdown
## Common / Spec Boundary

The authoritative source for what is common vs project-specific is `aikido-manifest.json` at the project root:
- `common_paths` — overwritten on update (hard points authority)
- `spec_paths` — never overwritten
```

---

## Prompt to Execute

```
You are creating the AI-KIDO common pack manifest.

CONTEXT:
- Project: /Users/lcare/workspace/best-p/ai-kido-best-practices
- File to create: aikido-manifest.json at project root
- Reference: refactor/phase-1-manifest.md contains the exact JSON schema to use

MANDATORY RULES:
1. Create the file exactly as specified in the schema (preserve all fields, paths, and structure)
2. Verify each path listed in common_paths exists in the repository before finalizing
3. Ensure no path in spec_paths overlaps with common_paths
4. Add MANIFEST_FILE and AIKIDO_COMMON_SOURCE keys to prompts/hard_points/configuration/skills.cfg
5. Add a "Common / Spec Boundary" section to prompts/hard_points/commands/maj-aikido.md
   - Insert AFTER the existing introduction section, BEFORE the first action definition
   - 5-8 lines maximum, reference aikido-manifest.json
   - Preserve all existing content unchanged

PRESERVE: All existing content in skills.cfg and maj-aikido.md — only append/insert, never overwrite

OUTPUT FORMAT:
## Files Created
- [path] — [status]

## Files Modified  
- [path] — [what was added]

## Validation
- common_paths verified: X/X exist
- spec_paths overlap check: [pass/fail]
```

---

## Verification

```bash
# Validate JSON syntax
python3 -m json.tool aikido-manifest.json > /dev/null && echo "✅ Valid JSON" || echo "❌ Invalid JSON"

# Check all common_paths entries exist (for non-glob paths)
python3 -c "
import json, os, glob
m = json.load(open('aikido-manifest.json'))
for p in m['common_paths']:
    if '*' in p:
        found = glob.glob(p)
        print(f'✅ {p}: {len(found)} files' if found else f'⚠️  {p}: 0 files (check pattern)')
    else:
        print(f'✅ {p}' if os.path.exists(p) else f'❌ MISSING: {p}')
"

# Verify skills.cfg has new keys
grep "MANIFEST_FILE\|AIKIDO_COMMON_SOURCE" prompts/hard_points/configuration/skills.cfg

# Verify maj-aikido.md references the manifest
grep "aikido-manifest" prompts/hard_points/commands/maj-aikido.md
```

---

## Result

> _Fill this section after execution_

**Date completed**: —  
**aikido-manifest.json created**: ⬜  
**skills.cfg updated**: ⬜  
**maj-aikido.md updated**: ⬜  
**common_paths verified**: — / —  
**JSON valid**: ⬜  
**Validation**: ⬜ Pending

### Notes

_Record any paths that were missing, decisions on glob patterns, edge cases._
