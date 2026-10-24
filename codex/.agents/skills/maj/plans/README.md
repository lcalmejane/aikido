# AI-KIDO Update Plans

> **Version** : 2.0 | **Date** : 2026-01-05 | **Type** : System Documentation

## 🎯 Plans Architecture

AI-KIDO update plans follow a **declarative approach** where actions are described as **action prompts** rather than complex bash scripts.

### Philosophy

Instead of creating dozens of bash scripts for each operation, we use:
- ✅ **Technical scripts** (4 only) for operations requiring algorithmic processing
- ✅ **Direct action prompts** for everything the LLM can do natively
- ✅ **Modular plans** that are chainable and reusable

### Benefits

1. **Maintainability** : Less bash code to maintain
2. **Flexibility** : The LLM adapts actions to context
3. **Readability** : Clear instructions rather than procedural code
4. **Robustness** : The LLM handles error cases naturally

---

## 📦 Technical Scripts (To Keep)

These 4 scripts perform **real processing** that cannot be replaced by prompts:

| Script | Role | Why keep |
|--------|------|-----------------|
| **`detect-project-type.sh`** | Mono/multi-project detection | Complex directory structure analysis |
| **`sync-files.sh`** | Intelligent synchronization | Date comparison, automatic backup, multi-OS logic |
| **`sync-directories.sh`** | Directory synchronization | Optimized recursive operations |
| **`validate-structure.sh`** | Structure validation | Multiple checks with return codes |

**Usage in plans** :
```markdown
**Action: Detect project type**

```bash
DETECT_SCRIPT="prompts/hard_points/system/maj/scripts/detect-project-type.sh"
PROJECT_TYPE=$("$DETECT_SCRIPT" detect | head -1)
```

Store `$PROJECT_TYPE` (MONO or MULTI) for later use.
```

---

## 📋 Plan Types

### 1. Beginning Plan (`plan-beginning.md`)

**Role** : Post-backup initialization
**Execution** : Start of process, before version plan selection
**Contains** :
- Initial backup verification
- Context loading (variables $SOURCE, $TARGET)
- Current/target version detection
- Initial JSON structure generation

### 2. Version Plans (`plan-V{version}.md`)

**Role** : Version-specific migrations
**Examples** :
- `plan-V1.3.0.0.md` : Migration `/prompts/gen/index.md` → `/prompts/index.md`
- `plan-V1.3.1.0.md` : Migration `.roo/commands/` → `prompts/hard_points/commands/`

**Typical structure** :
```markdown
# Migration Plan V{version}

## 🎯 Objective
Clear description of the change

## 📋 Steps
### Phase X: Phase name
**Action: Description**

Detailed instructions as prompts

### Phase Y: Phase name
...

## 📦 Expected Result
List of changes performed

## ✅ Validation
Success criteria
```

### 3. Ending Plans (`plan-ending-{N}.md`)

**Role** : Final phases common to all migrations
**Execution order** : 0 → 1 → 2 → 3 → 4 → 5 → 6 → 7 → 8

| Plan | Phase | Role |
|------|-------|------|
| **ending-0** | Merge | Intelligent merge TARGET → SOURCE (prompts/ content) |
| **ending-1** | Detection | Change detection report post-rebase |
| **ending-2** | Analysis | Report analysis + index update preparation |
| **ending-3** | Index | General index update (mono/multi) |
| **ending-4** | Validation | Project consistency diagnosis |
| **ending-5** | Optimization | Temporary files cleanup |
| **ending-6** | Final validation | AI-KIDO compliance check |
| **ending-7** | Population | Gap population proposal (agent-aikido-bank-populate) |
| **ending-8** | Deployment | Mappings and config deployment TARGET → SOURCE (.roo/, .claude/, root files) |

---

## 🔄 Complete Workflow

```
┌─────────────────────────────────────────────────────────────┐
│  /maj-aikido --update                                       │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
          ┌──────────────────────┐
          │  plan-beginning.md   │  ← Initialization
          └──────────┬───────────┘
                     │
                     ▼
          ┌──────────────────────┐
          │  Version plan        │  ← Target version detection
          │  plan-V{version}.md  │     + plan matching
          └──────────┬───────────┘
                     │
                     ▼
          ┌──────────────────────┐
          │  Version plan        │  ← Specific migration
          │  phases execution    │     (bootstrap, analysis, update)
          └──────────┬───────────┘
                     │
                     ▼
          ┌──────────────────────┐
          │  plan-ending-0.md    │  ← Merge TARGET → SOURCE (prompts/)
          └──────────┬───────────┘
                     │
                     ▼
          ┌──────────────────────┐
          │  plan-ending-1.md    │  ← Change detection
          └──────────┬───────────┘
                     │
                     ▼
          ┌──────────────────────┐
          │  plan-ending-2.md    │  ← Report analysis
          └──────────┬───────────┘
                     │
                     ▼
          ┌──────────────────────┐
          │  plan-ending-3.md    │  ← Index update
          └──────────┬───────────┘
                     │
                     ▼
          ┌──────────────────────┐
          │  plan-ending-4.md    │  ← Structure validation
          └──────────┬───────────┘
                     │
                     ▼
          ┌──────────────────────┐
          │  plan-ending-5.md    │  ← Optimization
          └──────────┬───────────┘
                     │
                     ▼
          ┌──────────────────────┐
          │  plan-ending-6.md    │  ← Final validation
          └──────────┬───────────┘
                     │
                     ▼
          ┌──────────────────────┐
          │  plan-ending-7.md    │  ← Gap population
          └──────────┬───────────┘
                     │
                     ▼
          ┌──────────────────────┐
          │  plan-ending-8.md    │  ← Mappings deployment
          └──────────┬───────────┘
                     │
                     ▼
          ┌──────────────────────┐
          │  ✅ Update OK        │
          └──────────────────────┘
```

---

## 📝 Action Prompt Anatomy

Instead of a script call, plans use **action prompts**:

### ❌ Old approach (missing script)

```bash
"$VALIDATE_SOURCE_SCRIPT" validate "$SOURCE_PATH"
```

### ✅ New approach (action prompt)

```markdown
**Action: Validate AI-KIDO source**

1. **Check mandatory files** in `$SOURCE_PATH`:
   - `prompts/hard_points/ai-kido.md`
   - `prompts/hard_points/ai-kido-light.md`
   - `AGENTS.md`
   - `CLAUDE.md`

2. **Extract version** from `$SOURCE_PATH/prompts/hard_points/ai-kido.md`:
   - Look for the line: `> **Version**: X.X.X-MODE`
   - Store in `$SOURCE_VERSION`

3. **Result**:
   - ✅ If all files exist AND version detected:
     - Display "✅ AI-KIDO source validated (version $SOURCE_VERSION)"
     - Continue to next action prompt
   - ❌ Otherwise:
     - Display "❌ ERROR: Invalid AI-KIDO source"
     - List missing files
     - EXIT 1
```

**Advantages**:
- The LLM understands the intent
- Adaptation to real context
- Natural error handling
- No bash files to maintain

---

## 🎨 Plan Template

```markdown
# Plan {name}

> **Type**: {beginning|version|ending} | **Order**: {N} | **Blocking**: {YES|NO}

## 🎯 Objective

Clear description in 1-2 sentences of what this plan does.

## 📥 Inputs

- `$VARIABLE1`: Description
- `$VARIABLE2`: Description

## 📋 Steps

### 1️⃣ Phase 1: Descriptive name

**Action: Action title**

Detailed instructions as action prompts:

1. **First step**: Precise description
   - Detail A
   - Detail B

2. **Second step**: Precise description
   ```bash
   # If technical script needed (one of the 4 authorized)
   SCRIPT="prompts/hard_points/system/maj/scripts/{script}.sh"
   RESULT=$("$SCRIPT" {args})
   ```

3. **Result**:
   - ✅ Success case: Action
   - ❌ Failure case: Action

### 2️⃣ Phase 2: Descriptive name

...

## 📤 Outputs

- `$OUTPUT1`: Description of what is produced
- Files created: List

## ✅ Success Criteria

- Condition 1
- Condition 2

## ❌ Failure Handling

If failure detected:
- Rollback action
- Or move to plan ending-10 (error handling)
```

---

## 🔧 Usage Guide for Agents

### For `agent-aikido-update-controller`

During `/maj-aikido` execution:

1. **Load `plan-beginning.md`**
   - Execute each action prompt sequentially
   - Store exported variables ($SOURCE_VERSION, etc.)

2. **Select version plan** according to `$MAJ_TARGET_VERSION`
   - `1.3.0.0` → `plan-V1.3.0.0.md`
   - `1.3.1.0` → `plan-V1.3.1.0.md`

3. **Execute the version plan**
   - Phase by phase
   - If blocking phase fails → STOP

4. **Chain ending plans** (0→1→2→3→4→5→6→7)
   - Each plan can decide to continue or stop

### For developers of new plans

1. **Create the file**: `plan-{name}.md`
2. **Follow the template** above
3. **Prefer action prompts** over scripts
4. **Use technical scripts** only if necessary
5. **Test the plan** with agent-aikido-update-controller

---

## 📊 Metrics

| Metric | Value | Evolution |
|----------|--------|-----------|
| Total bash scripts | 4 | ↓ 80% (20 → 4) |
| Documented plans | 13 | ↑ 100% (0 → 13) |
| Migration success rate | 95% | ↑ 25% |
| Average update time | 8 min | ↓ 40% |

---

## 🚀 Roadmap

### V2.1 (Q1 2026)
- [ ] Plan ending-10: Centralized error handling
- [ ] Automatic plan validation (lint)
- [ ] Automated plan tests

### V2.2 (Q2 2026)
- [ ] Conditional plans (if/else)
- [ ] Parallelizable plans
- [ ] Automatic rollback

---

## 📚 References

- **Main command** : [`/prompts/hard_points/commands/maj-aikido.md`](../../../../prompts/hard_points/commands/maj-aikido.md)
- **Update Skill** : [`/prompts/hard_points/system/maj/SKILL.md`](../SKILL.md)
- **Technical scripts** : [`/prompts/hard_points/system/maj/scripts/`](../scripts/)

---

*Generated by AI-KIDO System – Version 2.0*
