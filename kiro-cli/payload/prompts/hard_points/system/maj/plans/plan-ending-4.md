# Plan Ending-4 – Project Structure Validation

> **Type** : ending | **Order** : 4 | **Blocking** : YES

## 🎯 Objective

Diagnose the consistency and compliance of the project structure after the index update and file synchronization.

This plan uses the **technical script** `validate-structure.sh` to verify that the project follows the AI-KIDO rules according to its type (MONO or MULTI).

---

## 📥 Required Inputs

- `$SOURCE` : Current project directory
- `$PROJECT_TYPE` : Project type ("MONO" or "MULTI" - defined by plan-beginning or ending-3)
- `/tmp/aikido/ending2_summary.txt` : Phase 2 summary (optional)

---

## 📋 Execution Steps

### 1️⃣ Phase 1 : Prerequisites Check (BLOCKING)

**Action : Verify that the project type is defined**

```bash
echo "🔍 Checking prerequisites..."

if [ -z "$PROJECT_TYPE" ]; then
  echo "⚠️  Variable PROJECT_TYPE not defined, auto-detection..."

  # Use the technical detection script
  DETECT_SCRIPT="$SOURCE/prompts/hard_points/system/maj/scripts/detect-project-type.sh"

  if [ ! -f "$DETECT_SCRIPT" ]; then
    echo "❌ ERROR: Detection script not found"
    echo "   Expected path: $DETECT_SCRIPT"
    exit 1
  fi

  DETECT_OUTPUT=$("$DETECT_SCRIPT" detect)
  PROJECT_TYPE=$(echo "$DETECT_OUTPUT" | head -1)

  echo "✅ Detected type: $PROJECT_TYPE"
  export PROJECT_TYPE
else
  echo "✅ Project type defined: $PROJECT_TYPE"
fi
```

---

### 2️⃣ Phase 2 : Structure Validation with Technical Script (BLOCKING)

**Action : Execute the validation script**

```bash
bash prompts/hard_points/system/maj/scripts/ending-4-run-validation.sh "$SOURCE" "$PROJECT_TYPE"
VALIDATION_EXIT=$?

if [ $VALIDATION_EXIT -eq 0 ]; then
  VALIDATION_STATUS="SUCCESS"
else
  VALIDATION_STATUS="FAILED"
fi
```

This script runs validate-structure.sh with the correct parameters.
- **Function** : Locates and launches structure validation
- **Parameters** : Project type + version 1.3
- **Exit code** : 0 if structure is valid, 1 otherwise (BLOCKING)

---

### 3️⃣ Phase 3 : Detailed Diagnosis (IF FAILURE)

**Action : If validation failed, provide detailed diagnosis**

```bash
if [ "$VALIDATION_STATUS" = "FAILED" ]; then
  bash prompts/hard_points/system/maj/scripts/ending-4-diagnostic-structure.sh "$SOURCE" "$PROJECT_TYPE"
fi
```

This script displays a detailed diagnosis of the structure.
- **Function** : Checks hard points, indexes, essential directories
- **Output** : Complete diagnosis with ✅/❌ for each element
- **Exit code** : 0 (always, diagnosis only)

---

### 4️⃣ Phase 4 : Logging (NON BLOCKING)

**Action : Create validation log**

```bash
mkdir -p "$SOURCE/prompts/spec/logs"
LOG_FILE="$SOURCE/prompts/spec/logs/phase-4.log"

cat > "$LOG_FILE" <<LOG
═══════════════════════════════════════════════════════════════
Plan Ending-4 : Structure Validation
═══════════════════════════════════════════════════════════════
Date: $(date '+%Y-%m-%d %H:%M:%S')

CONFIGURATION:
  Project type   : $PROJECT_TYPE
  Version        : 1.3
  Directory      : $SOURCE

VALIDATION RESULT:
  Status         : $VALIDATION_STATUS
  Exit code      : $VALIDATION_EXIT
  Script         : $VALIDATE_SCRIPT

$([ "$VALIDATION_STATUS" = "FAILED" ] && echo "ISSUES DETECTED: See diagnosis above" || echo "Structure compliant with AI-KIDO")

═══════════════════════════════════════════════════════════════
LOG

echo "📝 Log created: $LOG_FILE"
echo ""
```

---

### 5️⃣ Phase 5 : Final Decision (BLOCKING)

**Action : Decide whether the workflow should continue or stop**

```bash
if [ "$VALIDATION_STATUS" = "SUCCESS" ]; then
  echo "═══════════════════════════════════════════════════════════════"
  echo "✅ PLAN ENDING-4 SUCCEEDED"
  echo "═══════════════════════════════════════════════════════════════"
  echo ""
  echo "   Structure validated successfully"
  echo "   Moving to plan ending-5 (optimization)..."
  echo ""
  exit 0
else
  echo "═══════════════════════════════════════════════════════════════"
  echo "❌ PLAN ENDING-4 FAILED"
  echo "═══════════════════════════════════════════════════════════════"
  echo ""
  echo "   RECOMMENDED ACTIONS:"
  echo ""
  echo "   1. Review the detailed diagnosis above"
  echo "   2. Fix missing files/directories"
  echo "   3. If indexes missing: restart plan ending-3"
  echo "   4. If hard points missing: restore from backup"
  echo "   5. Restart /maj-aikido after corrections"
  echo ""
  echo "   OR"
  echo ""
  echo "   6. Move to plan ending-10 (error handling) for in-depth diagnosis"
  echo ""
  echo "═══════════════════════════════════════════════════════════════"
  echo ""

  # BLOCKING EXIT
  exit 1
fi
```

---

## 📤 Produced Outputs

| File | Description | Required |
|---------|-------------|-------------|
| `$SOURCE/prompts/spec/logs/phase-4.log` | Validation log | ✅ YES |
| stdout | Detailed diagnosis (on failure) | ✅ YES (on failure) |

---

## ✅ Success Criteria

The **ending-4** plan is considered successful if:

1. ✅ Script `validate-structure.sh` executes without error
2. ✅ Exit code = 0 (valid structure)
3. ✅ Log created with SUCCESS

**Note** : This plan is **BLOCKING**. If validation fails, the workflow stops.

---

## ❌ Failure Handling

### Blocking failures:

1. **Script validate-structure.sh not found**
   ```
   ❌ CRITICAL ERROR: Validation script missing

   Expected path: prompts/hard_points/system/maj/scripts/validate-structure.sh

   Required action:
     1. Check AI-KIDO project integrity
     2. Restore from backup:
        tar -xzf backups/aikido-verif-backup-*.tgz
     3. Restart /maj-aikido
   ```

2. **Validation failed (exit code != 0)**
   ```
   ❌ ERROR: Structure not compliant with AI-KIDO V1.3

   Project type: MONO
   Issues detected:
     - /prompts/index.md missing
     - /prompts/hard_points/ai-kido.md missing

   Recommended actions:
     1. If index missing: Restart plan ending-3
     2. If hard points missing: Restore from TARGET
        cp "$TARGET/prompts/hard_points/ai-kido.md" "$SOURCE/prompts/hard_points/"
     3. Run manual validation:
        bash prompts/hard_points/system/maj/scripts/validate-structure.sh . --type MONO --version 1.3
     4. Restart /maj-aikido if OK
   ```

### Cases not handled by this plan:

- **Insufficient permissions** → Script error
- **Severely corrupted project** → Full backup restore required

---

## 🔗 Chaining

### If validation succeeded:
- ✅ Project structure compliant with AI-KIDO V1.3
- ✅ Move to **plan ending-5** (optimization/cleanup)

### If validation failed:
- ❌ Workflow **BLOCKED**
- ⚠️ **Detailed diagnosis displayed**
- 📋 **Recommended actions** provided
- 🔄 **Manual correction required**
- 🔄 Possibility to move to **plan ending-10** (error handling)

---

## 📚 References

- **Validation script** : [`prompts/hard_points/system/maj/scripts/validate-structure.sh`](../scripts/validate-structure.sh)
- **Project detection script** : [`prompts/hard_points/system/maj/scripts/detect-project-type.sh`](../scripts/detect-project-type.sh)
- **AI-KIDO hard points** : [`prompts/hard_points/ai-kido.md`](../../../ai-kido.md)

---

*Plan ending-4 v2.0 – Blocking structure validation with detailed diagnosis*
