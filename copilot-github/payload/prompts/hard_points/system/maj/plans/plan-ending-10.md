# Plan Ending-10 – Centralized Error Handling

> **Type** : ending-error | **Order** : 10 (invoked only on error) | **Blocking** : NO

## 🎯 Objective

Provide a centralized diagnosis of errors that occurred during the AI-KIDO update process, propose correction solutions and offer rollback options.

This plan is invoked **only on failure** of one of the previous plans (ending-0 to ending-7) or at the explicit request of the user.

---

## 📥 Required Inputs

- `$SOURCE` : Current project directory
- `$FAILED_PLAN` : Name of the failed plan (e.g. "ending-3")
- `$ERROR_CODE` : Returned error code (e.g. 1, 42)
- `$ERROR_MESSAGE` : Error message (optional)
- Logs from previous phases in `$SOURCE/prompts/spec/logs/`

---

## 📋 Execution Steps

### 1️⃣ Phase 1 : Error Context Collection (NON BLOCKING)

**Action : Gather all information about the failure**

```bash
bash prompts/hard_points/system/maj/scripts/ending-10-collect-error-context.sh "$SOURCE" "$FAILED_PLAN" "$ERROR_CODE" "$ERROR_MESSAGE"
```

This script collects the complete error context.
- **Function** : Displays failed plan, code, message, date, recent logs
- **Output** : `/tmp/aikido/error-context.txt`
- **Exit code** : 0 (always, non blocking)

---

### 2️⃣ Phase 2 : Automatic Diagnosis (NON BLOCKING)

**Action : Analyze the probable cause based on the failed plan**

```bash
bash prompts/hard_points/system/maj/scripts/ending-10-diagnostic-by-plan.sh "$FAILED_PLAN" "$SOURCE"
```

This script displays a diagnosis specific to the failed plan.
- **Function** : Analysis by case (ending-0 to 7, beginning, unknown)
- **Output** : Probable causes + proposed solutions
- **Exit code** : 0 (always, non blocking)

---

### 3️⃣ Phase 3 : Recovery Options (NON BLOCKING)

**Action : Propose actions to the user**

```bash
echo "═══════════════════════════════════════════════════════════════"
echo "🔧 RECOVERY OPTIONS"
echo "═══════════════════════════════════════════════════════════════"
echo ""

echo "1️⃣ FIX AND RESTART"
echo "   Apply the solutions proposed above then:"
echo "   /maj-aikido --update"
echo ""

echo "2️⃣ FULL ROLLBACK"
echo "   Restore state before update:"
echo "   LATEST_BACKUP=\$(ls -t backups/aikido-verif-backup-*.tgz | head -1)"
echo "   tar -xzf \"\$LATEST_BACKUP\" -C ."
echo "   echo \"✅ Rollback performed from \$LATEST_BACKUP\""
echo ""

echo "3️⃣ PARTIAL ROLLBACK"
echo "   Restore only critical files:"
echo "   tar -xzf backups/aikido-verif-backup-*.tgz prompts/hard_points/"
echo "   tar -xzf backups/aikido-verif-backup-*.tgz AGENTS.md CLAUDE.md"
echo ""

echo "4️⃣ IN-DEPTH DIAGNOSIS"
echo "   Invoke agent-aikido-validator for complete analysis:"
echo "   # Create diagnostic context"
echo "   cat > /tmp/aikido/diagnostic-context.md <<DIAG"
echo "   # Error Diagnosis $FAILED_PLAN"
echo "   "
echo "   Failed plan: $FAILED_PLAN"
echo "   Error code: $ERROR_CODE"
echo "   Message: $ERROR_MESSAGE"
echo "   "
echo "   Mission: Analyze logs and propose detailed correction plan"
echo "   DIAG"
echo ""

echo "5️⃣ MANUAL MODE"
echo "   Continue manually without /maj-aikido:"
echo "   - Fix the identified files"
echo "   - Validate: bash prompts/hard_points/system/maj/scripts/validate-structure.sh ."
echo "   - Restart individual plans if necessary"
echo ""

echo "═══════════════════════════════════════════════════════════════"
echo ""
```

---

### 4️⃣ Phase 4 : Error Report Generation (NON BLOCKING)

**Action : Create detailed report for debugging**

```bash
ERROR_REPORT=$(bash prompts/hard_points/system/maj/scripts/ending-10-generate-error-report.sh "$SOURCE" "$FAILED_PLAN" "$ERROR_CODE" "$ERROR_MESSAGE")

echo "📝 Error report created: $ERROR_REPORT"
cat "$ERROR_REPORT"
```

This script generates a complete markdown report.
- **Function** : Report with context, diagnosis, logs, backups, recommended actions
- **Output** : `$SOURCE/prompts/spec/logs/error-report-YYYYMMDD-HHMMSS.md`
- **Return** : Report path
- **Exit code** : 0 (always, non blocking)

---

### 5️⃣ Phase 5 : Logging (NON BLOCKING)

**Action : Create centralized error handling log**

```bash
LOG_FILE="$SOURCE/prompts/spec/logs/phase-10-error.log"

cat > "$LOG_FILE" <<LOG
═══════════════════════════════════════════════════════════════
Plan Ending-10 : Centralized Error Handling
═══════════════════════════════════════════════════════════════
Date: $(date '+%Y-%m-%d %H:%M:%S')

ERROR:
  Failed plan    : $FAILED_PLAN
  Code           : $ERROR_CODE
  Message        : $ERROR_MESSAGE

DIAGNOSIS:
  Report         : $ERROR_REPORT
  Solutions      : See automatic diagnosis above

OPTIONS PROVIDED:
  1. Fix and restart
  2. Full rollback
  3. Partial rollback
  4. In-depth diagnosis
  5. Manual mode

═══════════════════════════════════════════════════════════════
LOG

echo "📝 Log created: $LOG_FILE"
echo ""
```

---

## 📤 Produced Outputs

| File | Description | Required |
|---------|-------------|-------------|
| `$SOURCE/prompts/spec/logs/error-report-*.md` | Complete error report | ✅ YES |
| `$SOURCE/prompts/spec/logs/phase-10-error.log` | Error handling log | ✅ YES |
| stdout | Diagnosis + recovery options | ✅ YES |

---

## ✅ Success Criteria

The **ending-10** plan is considered successful in **ALL cases** :

1. ✅ Diagnosis performed
2. ✅ Solutions proposed
3. ✅ Report generated
4. ✅ Recovery options presented

**Note** : This plan is **NON BLOCKING** and informational. It helps resolve the error but does not fix it automatically.

---

## ❌ Failure Handling

This plan **cannot fail**. Even if the report generation fails, the diagnosis is displayed on screen.

---

## 🔗 Chaining

After this plan:
- 🛑 **Workflow stopped** (waiting for user action)
- 🔄 **User chooses**: Fix/Rollback/Manual
- 🔄 **Restart** `/maj-aikido --update` after correction

---

## 📚 References

- **Backups** : `backups/aikido-verif-backup-*.tgz`
- **Logs** : `prompts/spec/logs/phase-*.log`
- **Validation scripts** : `prompts/hard_points/system/maj/scripts/`

---

*Plan ending-10 v2.0 – Centralized error handling with automatic diagnosis*
