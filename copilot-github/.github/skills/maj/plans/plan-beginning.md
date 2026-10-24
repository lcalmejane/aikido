# Plan Beginning – Post-Backup Initialization

> **Type** : beginning | **Ordre** : -1 | **Bloquant** : OUI

## 🎯 Objective

Prepare the AI-KIDO update environment by verifying backups, loading context, and generating initial structures for comparison.

This plan executes **immediately after** the initial backup is created and **before** the version plan selection.

---

## 📥 Required Inputs

- `$SOURCE` : Absolute path to the directory containing the current AI-KIDO base (current project)
- `$TARGET` : Absolute path to the directory containing the update files (validated external source)

**Example** :
```bash
export SOURCE="/path/to/ai-kido-best-practices"
export TARGET="/path/to/ai-kido-best-practices/prompts/spec/aikido-source-git"
```

---

## 📋 Execution Steps

### 1️⃣ Phase 1.1 : Initial Backup Verification (NON-BLOCKING)

**Action : Verify the existence of a recent backup**

```bash
LATEST_BACKUP=$(bash prompts/hard_points/system/maj/scripts/beginning-check-backup.sh)
```

This script searches for the most recent backup in `backups/aikido-backup-*.tgz`.
- **Output** : Path to backup or warning message
- **Exit code** : 0 (always, non-blocking)

---

### 1️⃣ Phase 1.2 : Verification Backup Creation (BLOCKING)

**Action : Create a verification backup before any modification**

```bash
bash prompts/hard_points/system/maj/scripts/create-backup.sh "$SOURCE" "aikido-verif-backup"
VERIF_BACKUP_EXIT=$?
```

This script creates a complete project backup with timestamp.
- **Files saved** : `.claude .roo .roomodes agents_list.md commands_list.md AGENTS.md CLAUDE.md README.md prompts`
- **Output** : `backups/aikido-verif-backup-YYYYMMDD-HHMMSS.tgz`
- **Exit code** : 0 on success, 1 on failure (BLOCKING)

---

### 2️⃣ Phase 2 : Update Context Loading (BLOCKING)

**Action : Load or detect current and target versions**

```bash
VERSION_OUTPUT=$(bash prompts/hard_points/system/maj/scripts/beginning-detect-versions.sh "$SOURCE" "$TARGET")
VERSION_EXIT=$?

if [ $VERSION_EXIT -eq 0 ]; then
  MAJ_CURRENT_VERSION=$(echo "$VERSION_OUTPUT" | awk '{print $1}')
  MAJ_TARGET_VERSION=$(echo "$VERSION_OUTPUT" | awk '{print $2}')
else
  echo "❌ ERROR : Version detection failed"
  exit 1
fi
```

This script automatically detects versions from `prompts/hard_points/ai-kido.md`.
- **Output** : `CURRENT_VERSION TARGET_VERSION` (format: "1.3.0 1.3.1")
- **Export** : Variables `$MAJ_CURRENT_VERSION` and `$MAJ_TARGET_VERSION`
- **Exit code** : 0 on success, 1 on failure (BLOCKING)

---

### 3️⃣ Phase 3 : Variable Export for Subsequent Plans (BLOCKING)

**Action : Export global variables**

**Objective** : Make variables available for all subsequent plans.

```bash
export MAJ_CURRENT_VERSION
export MAJ_TARGET_VERSION
export LATEST_BACKUP
export SOURCE
export TARGET

echo "✅ Variables exported for subsequent plans"
echo "   MAJ_CURRENT_VERSION = $MAJ_CURRENT_VERSION"
echo "   MAJ_TARGET_VERSION  = $MAJ_TARGET_VERSION"
echo "   SOURCE              = $SOURCE"
echo "   TARGET              = $TARGET"
```

---

### 4️⃣ Phase 4 : Startup Log (NON-BLOCKING)

**Action : Create the initial log file**

```bash
LOG_FILE="prompts/spec/logs/maj-aikido-start-$(date +%Y%m%d-%H%M%S).log"
LOG_CONTENT="AI-KIDO Update Start

CONTEXT :
  Backup used           : ${LATEST_BACKUP:-None}
  Verification backup   : ${VERIF_BACKUP:-Not created}
  Current version       : $MAJ_CURRENT_VERSION
  Target version        : $MAJ_TARGET_VERSION

DIRECTORIES :
  Source : $SOURCE
  Target : $TARGET"

bash prompts/hard_points/system/maj/scripts/create-log.sh "$LOG_FILE" "Update Start" "$LOG_CONTENT"
```

This script creates a formatted log to trace the start of the process.
- **Output** : `prompts/spec/logs/maj-aikido-start-YYYYMMDD-HHMMSS.log`
- **Exit code** : 0 (always, non-blocking)

---

### 5️⃣ Phase 5 : Initial Project Structure Generation (NON-BLOCKING)

**Action : Generate JSON indexes for future comparison**

```bash
bash prompts/hard_points/system/maj/scripts/beginning-generate-structure.sh "$SOURCE" "$TARGET"
```

This script generates JSON structures for TARGET and SOURCE projects (before).
- **Outputs** :
  - `/tmp/aikido/maj_target.json` : External project structure
  - `/tmp/aikido/maj_before.json` : Current project structure before update
- **Exit code** : 0 (always, non-blocking - displays warnings on failure)

---

## 📤 Produced Outputs

| Variable/File | Description | Scope |
|------------------|-------------|--------|
| `$MAJ_CURRENT_VERSION` | Current AI-KIDO version (ex: `1.3.0-LLM`) | Global (exported) |
| `$MAJ_TARGET_VERSION` | Target AI-KIDO version (ex: `1.3.1-LLM`) | Global (exported) |
| `$LATEST_BACKUP` | Initial backup path | Global (exported) |
| `$VERIF_BACKUP` | Verification backup path | Local |
| `$LOG_FILE` | Startup log file | Local |
| `/tmp/aikido/maj_target.json` | TARGET structure (JSON) | Temporary file |
| `/tmp/aikido/maj_before.json` | SOURCE structure before update (JSON) | Temporary file |

---

## ✅ Success Conditions

The `beginning` plan is considered successful if **ALL** these conditions are met:

1. ✅ A verification backup was created (`$VERIF_BACKUP` exists)
2. ✅ CURRENT and TARGET versions are detected (non-empty)
3. ✅ Variables are correctly exported
4. ✅ The startup log is created

**Non-blocking conditions** (warnings only) :
- ⚠️  Initial backup not found
- ⚠️  JSON structure generation failed

---

## ❌ Failure Handling

If a **BLOCKING** phase fails:

1. **Display a clear error message** with exact cause
2. **DO NOT continue** toward version plan selection
3. **EXIT 1** to stop the process
4. **The user must** :
   - Fix the problem (permissions, missing files)
   - Relaunch `/maj-aikido --update`

**Failure message example** :
```
❌ CRITICAL ERROR : Phase 1.2 (Verification backup) failed

Cause : Unable to create backups/aikido-verif-backup-20260105-143022.tgz
Possible reason : Insufficient permissions on the backups/ directory

Required action :
  1. Check permissions : ls -la backups/
  2. Create directory if necessary : mkdir -p backups && chmod 755 backups
  3. Relaunch : /maj-aikido --update

═══════════════════════════════════════════════════════════════
```

---

## 🔗 Chaining

Once this plan succeeds, the system moves to:

1. **Automatic version plan selection** according to `$MAJ_TARGET_VERSION`
   - Ex: `1.3.0.0` → `plan-V1.3.0.0.md`
   - Ex: `1.3.1.0` → `plan-V1.3.1.0.md`

2. **Version plan execution** (migration-specific phases)

3. **Ending plan chaining** : 0 → 1 → 2 → 3 → 4 → 5 → 6 → 7

---

## 📚 References

- **Structure generation script** : [`prompts/hard_points/system/structure/scripts/generate-all-indexes-v3.1.sh`](../../../../prompts/hard_points/system/structure/scripts/generate-all-indexes-v3.1.sh)
- **index.json format** : [`prompts/hard_points/system/structure/SKILL.md`](../../../../prompts/hard_points/system/structure/SKILL.md)
- **Version plans** : [`prompts/hard_points/system/maj/plans/plan-V*.md`](.)

---

*Plan beginning v2.0 – Declarative approach with action prompts*
