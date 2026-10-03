# Plan Ending-8 – Mappings and Configuration Deployment from TARGET

> **Type** : ending | **Order** : 8 | **Blocking** : NO (with warnings)

## 🎯 Objective

Deploy configuration files, mappings and root repository files from the external repository (TARGET) to the current project (SOURCE) to complete the update.

This plan copies from **TARGET → SOURCE** :

- Mappings `.roo/commands/`
- Mappings `.claude/commands/`
- Mappings `.claude/agents/`
- Root files (`AGENTS.md`, `CLAUDE.md`, `commands_list.md`, `agents_list.md`, `skills_list.md`)

**Why this plan?** Plan ending-0 (merge) copies ONLY files in `/prompts/`. Mappings and root files are not merged automatically.

---

## 📥 Required Inputs

- `$SOURCE` : Current project directory (destination)
- `$TARGET` : External source directory (decompressed git repository, file source)
- UPDATE mode : This plan executes **IN PRIORITY** in `--update` mode, but can also execute in SYNC mode if needed

---

## 📋 Execution Steps

### 0️⃣ Phase 0 : Prerequisites Check

**Action : Verify that TARGET exists and contains files to deploy**

```bash
if [ ! -d "$TARGET" ]; then
  echo "⚠️  TARGET does not exist: $TARGET"
  echo "   Plan ending-8 skipped"
  exit 0
fi

# Count available files in TARGET
TARGET_FILES_COUNT=0

[ -d "$TARGET/.roo/commands" ] && TARGET_FILES_COUNT=$((TARGET_FILES_COUNT + $(find "$TARGET/.roo/commands" -name "*.md" -type f 2>/dev/null | wc -l | tr -d ' ')))
[ -d "$TARGET/.claude/commands" ] && TARGET_FILES_COUNT=$((TARGET_FILES_COUNT + $(find "$TARGET/.claude/commands" -name "*.md" -type f 2>/dev/null | wc -l | tr -d ' ')))
[ -d "$TARGET/.claude/agents" ] && TARGET_FILES_COUNT=$((TARGET_FILES_COUNT + $(find "$TARGET/.claude/agents" -name "*.md" -type f 2>/dev/null | wc -l | tr -d ' ')))

if [ "$TARGET_FILES_COUNT" -eq 0 ]; then
  echo "ℹ️  No mapping files detected in TARGET"
  echo "   Plan ending-8 skipped (TARGET does not contain mappings to deploy)"
  exit 0
fi

echo "✅ $TARGET_FILES_COUNT mapping file(s) detected in TARGET"
echo "   Deployment to SOURCE activated"
```

**Result** :

- If TARGET empty or without mappings: skip this plan
- If TARGET contains mappings: continue

---

### 1️⃣ Phase 1 : Commands Mappings Deployment (NON BLOCKING)

**Action : Copy command mappings from TARGET to SOURCE**

```bash
COMMANDS_DEPLOYED=$(bash prompts/hard_points/system/maj/scripts/ending-8-deploy-commands.sh "$TARGET" "$SOURCE")
```

This script copies `.roo/commands/` and `.claude/commands/` mappings from TARGET to SOURCE.

- **Function** : Creates directories if necessary, copies mappings with backup, checks consistency
- **Return** : Number of deployed commands (format: "X")
- **Exit code** : 0 (always, non blocking)

**Script details** :

1. Create `$SOURCE/.roo/commands/` if it does not exist
2. Create `$SOURCE/.claude/commands/` if it does not exist
3. For each `.md` file in `$TARGET/.roo/commands/` :
   - If exists in SOURCE: create backup `.bak.YYYYMMDD-HHMMSS`
   - Copy from TARGET → SOURCE
4. Repeat for `.claude/commands/`
5. Count and display results

---

### 2️⃣ Phase 2 : Agents Mappings Deployment (NON BLOCKING)

**Action : Copy agent mappings from TARGET to SOURCE**

```bash
AGENTS_DEPLOYED=$(bash prompts/hard_points/system/maj/scripts/ending-8-deploy-agents.sh "$TARGET" "$SOURCE")
```

This script copies `.claude/agents/` mappings from TARGET to SOURCE.

- **Function** : Creates directory if necessary, copies agent mappings with backup
- **Return** : Number of deployed agents (format: "X")
- **Exit code** : 0 (always, non blocking)

**Script details** :

1. Create `$SOURCE/.claude/agents/` if it does not exist
2. For each `.md` file in `$TARGET/.claude/agents/` :
   - If exists in SOURCE: create backup `.bak.YYYYMMDD-HHMMSS`
   - Copy from TARGET → SOURCE
3. Count and display results

---

### 3️⃣ Phase 3 : Root Files Deployment (NON BLOCKING)

**Action : Deploy and regenerate root files from TARGET to SOURCE**

```bash
ROOT_FILES_DEPLOYED=$(bash prompts/hard_points/system/maj/scripts/ending-8-deploy-root-files.sh "$TARGET" "$SOURCE")
```

This script deploys essential root files from TARGET to SOURCE with intelligent logic.

- **Function** : Copy, merge or regeneration depending on file type
- **Return** : Number of deployed files (format: "X")
- **Exit code** : 0 (always, non blocking)

**Strategy by file type** :

**A. Files to REPLACE** (simple copy with backup) :
- `AGENTS.md` - Standard agents documentation
- `CLAUDE.md` - Standard Claude documentation

**B. Files to MERGE** (intelligent merge) :
- `.roomodes` - Roo configuration (preserves project-specific modes)
- `README.md` - Project documentation (preserves project-specific sections)

**C. Files to REGENERATE** (Memory Bank scan + merge) :
- `agents_list.md` - Agents list (scan `/prompts/hard_points/agents/` + TARGET)
- `commands_list.md` - Commands list (scan `/prompts/hard_points/commands/` + TARGET)
- `skills_list.md` - Skills list (scan `/prompts/hard_points/system/*/SKILL.md` + TARGET)

**Script details** :

1. **For files to REPLACE** :
   - Check existence in TARGET
   - If exists in SOURCE: create backup `.bak.YYYYMMDD-HHMMSS`
   - Copy from TARGET → SOURCE

2. **For files to MERGE** :
   - Read TARGET version and SOURCE version
   - Identify project-specific sections in SOURCE
   - Intelligently merge while preserving project context
   - Create backup before merge
   - Write merged file to SOURCE

3. **For files to REGENERATE** :
   - Scan the current SOURCE Memory Bank (`/prompts/hard_points/`)
   - Scan TARGET version for new elements
   - Merge both lists (SOURCE + TARGET)
   - Deduplicate and sort
   - Create backup of old file
   - Generate new complete and up-to-date file in SOURCE
   - **Guarantee** : The file corresponds EXACTLY to Memory Bank content

4. Count and display results by category

---

### 4️⃣ Phase 4 : Deployment Validation (NON BLOCKING)

**Action : Verify that files were copied correctly**

```bash
VALIDATION_RESULT=$(bash prompts/hard_points/system/maj/scripts/ending-8-validate-deployment.sh "$TARGET" "$SOURCE")
```

This script validates that all files present in TARGET were copied to SOURCE.

- **Function** : Compares TARGET vs SOURCE files, detects missing ones
- **Return** : Validation result (format: "PASSED" or "WARNINGS: X missing files")
- **Exit code** : 0 (always, non blocking)

**Checks** :

1. Count files in `$TARGET/.roo/commands/`
2. Count files in `$SOURCE/.roo/commands/`
3. Compare: if difference → warning
4. Repeat for `.claude/commands/` and `.claude/agents/`
5. Check presence of root files in SOURCE

---

### 5️⃣ Phase 5 : Final Statistics (NON BLOCKING)

**Action : Display global deployment statistics**

```bash
echo "═══════════════════════════════════════════════════════════════"
echo "📊 DEPLOYMENT STATISTICS from TARGET"
echo "═══════════════════════════════════════════════════════════════"
echo ""

echo "TARGET (external repository) : $TARGET"
echo "SOURCE (current project)     : $SOURCE"
echo ""

echo "DEPLOYMENT PERFORMED (TARGET → SOURCE):"
echo "  Commands mappings           : $COMMANDS_DEPLOYED file(s)"
echo "  Agents mappings             : $AGENTS_DEPLOYED file(s)"
echo "  Root files                  : $ROOT_FILES_DEPLOYED file(s)"
echo ""

echo "VALIDATION:"
echo "  Result                      : $VALIDATION_RESULT"
echo ""

if [ "$VALIDATION_RESULT" != "PASSED" ]; then
  echo "⚠️  WARNING:"
  echo "  Some files were not deployed correctly."
  echo "  Check the logs for more details."
  echo ""
fi

echo "RECOMMENDATIONS:"
echo "  1. Verify that SOURCE contains all expected files"
echo "  2. Test the deployed commands and agents"
echo "  3. Consult backups (.bak.*) if rollback is needed"
echo ""

echo "═══════════════════════════════════════════════════════════════"
echo ""
```

---

### 6️⃣ Phase 6 : Logging (NON BLOCKING)

**Action : Create deployment log**

```bash
mkdir -p "$SOURCE/prompts/spec/logs"
LOG_FILE="$SOURCE/prompts/spec/logs/phase-8.log"

cat > "$LOG_FILE" <<LOG
═══════════════════════════════════════════════════════════════
Plan Ending-8 : Deployment from TARGET
═══════════════════════════════════════════════════════════════
Date: $(date '+%Y-%m-%d %H:%M:%S')

TARGET (source)         : $TARGET
SOURCE (destination)    : $SOURCE

FLOW: TARGET → SOURCE (external repository → current project)

DEPLOYMENT PERFORMED:
  Commands mappings       : $COMMANDS_DEPLOYED file(s)
  Agents mappings         : $AGENTS_DEPLOYED file(s)
  Root files              : $ROOT_FILES_DEPLOYED file(s)

VALIDATION:
  Result                  : $VALIDATION_RESULT

STATUS: Success (non blocking)

BACKUPS CREATED:
  All overwritten files have a .bak.YYYYMMDD-HHMMSS backup

RECOMMENDATIONS:
  - Check SOURCE after deployment
  - Test commands and agents
  - Consult backups if rollback needed

═══════════════════════════════════════════════════════════════
LOG

echo "📝 Log created: $LOG_FILE"
echo ""
```

---

## 📤 Produced Outputs

| File/Directory | Description | Strategy |
|--------------------|-------------|-----------|
| `$SOURCE/.roo/commands/*.md` | Roo command mappings | Copy from TARGET |
| `$SOURCE/.claude/commands/*.md` | Claude command mappings | Copy from TARGET |
| `$SOURCE/.claude/agents/*.md` | Claude agent mappings | Copy from TARGET |
| `$SOURCE/AGENTS.md` | Agents documentation | **REPLACED** from TARGET |
| `$SOURCE/CLAUDE.md` | Claude documentation | **REPLACED** from TARGET |
| `$SOURCE/commands_list.md` | Commands list | **REGENERATED** (scan SOURCE + TARGET) |
| `$SOURCE/agents_list.md` | Agents list | **REGENERATED** (scan SOURCE + TARGET) |
| `$SOURCE/skills_list.md` | Skills list | **REGENERATED** (scan SOURCE + TARGET) |
| `$SOURCE/.roomodes` | Roo configuration | **MERGED** (SOURCE + TARGET) |
| `$SOURCE/README.md` | Project documentation | **MERGED** (SOURCE + TARGET) |
| `$SOURCE/prompts/spec/logs/phase-8.log` | Deployment log | Generated |
| `*.bak.YYYYMMDD-HHMMSS` | Backups of overwritten files | Created automatically |

---

## ✅ Success Criteria

The **ending-8** plan is considered successful in **ALL cases** :

1. ✅ Commands mappings copied (or none found in TARGET)
2. ✅ Agents mappings copied (or none found in TARGET)
3. ✅ Root files copied (or none found in TARGET)
4. ✅ Validation performed (warnings accepted)
5. ✅ Log created

**Note** : This plan is **NON BLOCKING** and always succeeds. Warnings are logged but do not stop the process.

---

## ❌ Failure Handling

This plan **cannot fail** in a blocking way:

### Degraded cases (warnings):

1. **File missing in TARGET** → Skip this file (normal, TARGET may not have all files)
2. **Insufficient SOURCE permissions** → Warning + manual recommendation
3. **SOURCE directory does not exist** → Creation attempt + warning on failure

**Example of degraded behavior** :

```
⚠️  WARNING: Partial deployment

Files missing in TARGET (normal):
  - .roomodes (optional file)
  - skills_list.md (not present in external repository)

Files not copied to SOURCE:
  - AGENTS.md (Permission denied on SOURCE)

Recommendation:
  Copy manually or adjust SOURCE permissions.

Deployment: 12/14 files (85%)

The plan continues normally (non blocking).
```

---

## 🔗 Chaining

This plan executes **after plan ending-7** (gap population):

**Old workflow**:

```
ending-0 → ending-1 → ending-2 → ending-3 → ending-4 → ending-5 → ending-6 → ending-7 → END
```

**New workflow**:

```
ending-0 → ending-1 → ending-2 → ending-3 → ending-4 → ending-5 → ending-6 → ending-7 → ending-8 → END
```

**Execution condition**:

- ✅ If TARGET contains mappings: Plan ending-8 executes
- ⚠️ If TARGET empty or without mappings: Plan ending-8 is skipped (phase 0 exit 0)

---

## 📚 References

- **Commands mappings** : `.roo/commands/`, `.claude/commands/`
- **Agents mappings** : `.claude/agents/`
- **Root files** : `AGENTS.md`, `CLAUDE.md`, `commands_list.md`, `agents_list.md`, `skills_list.md`
- **Roo configuration** : `.roomodes`

---

## 🎯 Important Notes

### Why this plan?

**Plan ending-0 (merge)** copies ONLY files in `/prompts/`. The following files are **never merged** automatically:

- Command and agent mappings (`.roo/`, `.claude/`)
- Root documentation files (`AGENTS.md`, etc.)
- Roo configuration (`.roomodes`)

**Without this plan**: The current project (SOURCE) remains incomplete after the update, without the new mappings from the external repository (TARGET).

### Execution Timing

This plan executes **LAST** (after ending-7) to guarantee that:

1. All update plans are completed
2. `/prompts/` content is already merged (ending-0)
3. Gaps have been filled (ending-7)
4. Mappings and config from TARGET are added to complete the update

### Flow Direction

**CORRECT FLOW**: TARGET → SOURCE

- **TARGET** = External git repository (contains new AI-KIDO version)
- **SOURCE** = Current project (to be updated)
- **Objective**: Copy TARGET mappings to SOURCE to complete the update

---

*Plan ending-8 v2.0 – Mappings and configuration deployment from TARGET (corrected flow)*
