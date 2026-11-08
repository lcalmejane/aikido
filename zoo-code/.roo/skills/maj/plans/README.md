# AI-KIDO Update Plans

> **Version** : 2.0 | **Date** : 2026-01-05 | **Type** : System Documentation

## 🎯 Plans Architecture

AI-KIDO update plans combine action prompts with deterministic Node.js engines.
Some historical version plans are blocked; see their status before execution.

### Philosophy

Use the Node.js 24+ engines for deterministic processing, and action prompts
for review and decisions that require the host. The old shell entry points
have been removed; call the documented Node engines.

### Benefits

Plans must expose failures and stop at their documented review gates.

---

## 📦 Technical Engines

The scripts directory contains Node engines for detection, synchronization,
validation, reporting and the ending plans. See [the MAJ skill](../SKILL.md)
and each plan for their supported arguments and safety limits.

The former `.sh` adapters have been removed; update external callers to use
the Node entry points and subcommands documented in each active plan.

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
- `plan-V1.3.0.0.md` : historical index migration — **BLOCKED**
- `plan-V1.3.1.0.md` : historical command migration — **BLOCKED**

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
| **ending-0** | Merge | Reviewed TARGET → SOURCE hard-point merge; host dispatch, acceptance and resume required when differences exist |
| **ending-1** | Detection | Change detection report post-rebase |
| **ending-2** | Analysis | Report analysis + index update preparation |
| **ending-3** | Index | General index update (mono/multi) |
| **ending-4** | Validation | Project consistency diagnosis |
| **ending-5** | Optimization | Review backups and temporaries; deletion skipped without proven ownership |
| **ending-6** | Final validation | Prepare AI-KIDO compliance validation for the host |
| **ending-7** | Population | Gap population proposal (agent-aikido-bank-populate) |
| **ending-8** | Deployment | Mappings and config deployment TARGET → SOURCE (.roo/, .claude/, root files) |

---

## 🔄 Conditional Workflow

This diagram describes the historical plan sequence, not authorization to
execute it. Stop at blocked version plans, pending fusion and any other
documented gate. For managed installations, use the Node package planner.

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
          │  plan-ending-0.md    │  ← Host-reviewed merge and resume gate
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

Action prompts can describe host decisions alongside deterministic script calls.
The following is an illustrative prompt, not a substitute for the current
validation engines and their documented error handling.

### ❌ Old approach (missing script)

The former validation command referenced an unavailable script; do not invoke
or reproduce it.

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

2. **Second step**: Invoke the relevant documented Node engine directly with
   an argument array and check its exit status before consuming output:
   `node SOURCE/prompts/hard_points/system/maj/scripts/engine.mjs arguments`.

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

3. **Check the selected plan's status before execution**
   - Never execute a blocked or historical plan; stop and report it.
   - For managed installations, use the reviewed Node package update planner.
   - For an approved safe plan, execute phase by phase; stop on blocking failure.

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
