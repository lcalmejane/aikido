# Migration Plan V1.3.0.0 – Moving from `/prompts/gen/index.md` to `/prompts/index.md`

## 🎯 Objective
Migrate the project's unique entry point from **`/prompts/gen/index.md`** to **`/prompts/index.md`** following the complete update process defined by the `maj-aikido` command.  
The plan must be executed sequentially by the **agent‑aikido‑update‑controller** agent and cover all phases of backup, bootstrap, differential analysis, hard-point updates, critical merge, synchronization and final validation.

## 📋 Plan Steps

### -1️⃣ Phase -1 – Source Selection & Validation
1. **Bootstrap detection**  
   ```bash
   mkdir -p "/tmp/aikido"
   if [ -f "/tmp/aikido/aikido-bootstrap-*.env" ]; then
     source "/tmp/aikido/aikido-bootstrap-*.env"
     echo "🔄 Resuming bootstrap – source already validated"
   fi
   ```
2. **Source type selection** (`git` | `local` | `archive`) – user interaction via integrated script.  
3. **Source validation** with `prompts/hard_points/system/maj/scripts/validate-aikido-source.sh`.  
   ```bash
   VALIDATE_SCRIPT="prompts/hard_points/system/maj/scripts/validate-aikido-source.sh"
   "$VALIDATE_SCRIPT" validate "$SOURCE_PATH"
   ```

### -0.7️⃣ Phase -0.7 – Auto-update of `maj-aikido` (bootstrap)
1. **Comparison of local version vs source** via `compare-command-versions.sh`.  
2. **If difference detected** :  
   - Backup of current file ` prompts/hard_points/commands/maj-aikido.md `  
   - Replacement with source version  
   - Exit 42 to restart the process with the new version.  

### -0.5️⃣ Phase -0.5 – Differential Analysis
1. **Target version detection** (`VERSION_TARGET="1.3"`).  
2. **Differences analysis** with `prompts/hard_points/system/maj/scripts/analyze-aikido-update.sh`.  
3. **Analysis report** stored in `/tmp/aikido/aikido-report-data-$$.json`.

### -0️⃣ Phase -0 – Files Update
#### 0.1 Hard-points (mandatory)
```bash
for file in prompts/hard_points/ai-kido.md prompts/hard_points/ai-kido-light.md; do
  cp "$SOURCE_PATH/$file" "$file" && echo "✅ $file replaced"
done
```
#### 0.2 Documentation & critical files (intelligent merge)
- **AGENTS.md**, **CLAUDE.md**, **.roomodes**, **README.md** → merge via `agent-aikido-fusion`.  
- **Standard documentation** (`prompts/index.md`, `prompts/gen/index.md`) → update with `interactive-file-update.sh`.

#### 0.3 New files synchronization
- Copy of files not existing locally from the source (`sync-files.sh`).  

#### 0.4 `.roomodes` configuration update
- Merge via `merge-roomodes.sh`.

#### 0.5 Final report generation
```bash
REPORT_SCRIPT="prompts/hard_points/system/maj/scripts/generate-report.sh"
REPORT_FILE="prompts/spec/logs/maj-aikido-report-$(date +%Y%m%d-%H%M%S).md"
"$REPORT_SCRIPT" --template update --data "$REPORT_DATA" --output "$REPORT_FILE"
```

### 0️⃣ Phase 0 – Entry Point Migration
1. **Backup of the old index**  
   ```bash
   cp prompts/gen/index.md "prompts/gen/index.md.bak.$(date +%Y%m%d-%H%M%S)"
   echo "✅ Backup of prompts/gen/index.md completed"
   ```
2. **Creation of the new index**  
   ```bash
   cp prompts/gen/index.md prompts/index.md
   # Adding standard header
   sed -i '1i\
---\nversion: "1.3.0.0"\ndate: "$(date +%Y-%m-%d)"\nstatus: "draft"\n---\n' prompts/index.md
   echo "✅ New /prompts/index.md created"
   ```
3. **Update of internal references**  
   ```bash
   grep -rl "prompts/gen/index.md" . | while read -r file; do
     sed -i "s|prompts/gen/index.md|prompts/index.md|g" "$file"
   done
   echo "✅ References updated"
   ```

### 0.1️⃣ Phase 0.1 – Post-migration Validation
- **Residuals detection**  
  ```bash
  if grep -qr "prompts/gen/index.md" .; then
    echo "⚠️ Remaining references detected"
    exit 1
  fi
  echo "✅ No residuals found"
  ```
- **New index validation** with `agent-aikido-validator`  
  ```bash
  agent-aikido-validator --path prompts/index.md
  ```

### 0.2️⃣ Phase 0.2 – Cleanup (optional)
- Deletion of the old index after successful validation  
  ```bash
  rm -f prompts/gen/index.md
  echo "🗑️ Old /prompts/gen/index.md deleted"
  ```

### 0.3️⃣ Phase 0.3 – Global Structure Validation
- Execution of `validate-structure.sh` according to the project type (mono)  
  ```bash
  VALIDATE_SCRIPT="prompts/hard_points/system/maj/scripts/validate-structure.sh"
  "$VALIDATE_SCRIPT" "." --type mono --version 1.3
  ```

## 📦 Expected Result
- `/prompts/index.md` contains the same content as the old index, enriched with a version header `1.3.0.0`.  
- All project references now point to `/prompts/index.md`.  
- No file references `/prompts/gen/index.md` anymore.  
- Hard-points, critical documentation and configuration are up to date and validated.  
- A complete update report is generated in `prompts/spec/logs/`.  

## 🛠️ Execution
The plan must be invoked by the command:
```bash
/maj-aikido --update
```
The **agent‑aikido‑update‑controller** agent will read this file from `prompts/hard_points/system/maj/plans/plan-V1.3.0.0.md` and execute each phase in the indicated order.  

---  
*Generated by **agent‑aikido‑update‑controller** – Version 1.3.0.0*  
