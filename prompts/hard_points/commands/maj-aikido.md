---
description: "Update and complete AI-KIDO synchronization via modular plan system"
---

# /maj-aikido

**Purpose**: Orchestrate AI-KIDO updates by delegating operations to modular plans.

> **Version**: 3.0 | **Architecture**: Modular Plans V2.0 | **Role**: Orchestrator

---

## Usage

[MANDATORY]

```bash
# UPDATE mode - update from external source
/maj-aikido --update

# SYNC mode - classic post-rebase synchronization
/maj-aikido
```

---

## Overview

This command **orchestrates** the AI-KIDO update by delegating operations to **modular plans**:

- **plan-beginning.md** : Initialization and version detection
- **plan-V{version}.md** : Version-specific migration
- **plan-ending-{0-8}.md** : Common final phases (merge, validation, population)
- **plan-ending-10.md** : Centralized error handling

**Philosophy**: The command does NOT perform actions itself — it **executes plans** in the correct order.

---

## Prerequisites

- AI-KIDO memory bank initialized
- For `--update` mode: access to source (Git, local directory, or archive)
- Plan files present in `prompts/hard_points/system/maj/plans/`

---

## Steps

### GLOBAL WORKFLOW

```
+-------------------------------------------------------------+
|  Preparatory Phase: Source Selection & Validation           |
|  (only in --update mode)                                    |
+--------------------+----------------------------------------+
                     |
                     v
          +----------------------+
          |  plan-beginning.md   |  <- Initialization + version detection
          +----------+-----------+
                     |
                     v
          +----------------------+
          |  plan-V{version}.md  |  <- Version-specific migration
          +----------+-----------+
                     |
                     v
          +----------------------+
          |  plan-ending-0.md    |  <- Intelligent merge
          |  plan-ending-1.md    |  <- Change detection
          |  plan-ending-2.md    |  <- Report analysis
          |  plan-ending-3.md    |  <- Index update
          |  plan-ending-4.md    |  <- Structure validation
          |  plan-ending-5.md    |  <- Optimization
          |  plan-ending-6.md    |  <- Final validation
          |  plan-ending-7.md    |  <- Gap population
          |  plan-ending-8.md    |  <- Mappings deployment
          +----------+-----------+
                     |
                     v
          +----------------------+
          |  Update complete     |
          +----------------------+
```

---

### PREPARATORY PHASE: Source Selection & Validation

**ONLY IF** `--update` mode is detected.

#### Step 1: Execution Mode Detection

**Action: Detect execution mode based on arguments**

1. **Check command arguments**:
   - If argument = `--update` OR `-u` → UPDATE mode
   - Otherwise → SYNC mode (post-rebase synchronization only)

2. **Display detected mode**:
   - UPDATE mode: `MODE: UPDATE from external sources`
   - SYNC mode: `MODE: SYNC post-rebase`

3. **If SYNC mode**:
   - Skip directly to plan orchestration (next section)
   - Variables `$SOURCE` and `$TARGET` will be identical (current project)

#### Step 2: Source Type Selection (UPDATE mode only)

**Action: Ask the user to select a source type**

1. **Display selection menu**:

```
===============================================================
  SOURCE SELECTION FOR UPDATE
===============================================================

Choose the update source:

1. GIT AI-KIDO - Official AI-KIDO repository
   Source: git@github.com:lcalmejane/aikido.git

2. LOCAL DIRECTORY - Already extracted directory
   Location: prompts/spec/aikido-*

3. ARCHIVE - tar.gz, tgz, or zip file
   Location: prompts/spec/*.{tar.gz,tgz,zip}

Enter your choice (1/2/3):
```

2. **Wait and store response** in `$SOURCE_TYPE` (values: "1" | "2" | "3")

#### Step 3: Source Retrieval & Validation by Type

##### 3.1 GIT Source (if choice = 1)

**Action: Clone or update the AI-KIDO Git repository**

1. **Define variables**:
   - `AIKIDO_REPO="git@github.com:lcalmejane/aikido.git"`
   - `TARGET_PATH="$(pwd)/prompts/spec/aikido-source-git"`

2. **Check if repository already exists**:
   - If `TARGET_PATH/.git` exists:
     - Display `Existing repository detected, updating...`
     - Run via Bash tool: `cd $TARGET_PATH && git fetch --all --tags && cd -`
   - Otherwise:
     - Display `Cloning repository...`
     - Run via Bash tool: `git clone $AIKIDO_REPO $TARGET_PATH`

3. **List available branches and tags**:
   - Branches: `cd $TARGET_PATH && git branch -r | sed 's/origin\///' | grep -v HEAD`
   - Tags: `cd $TARGET_PATH && git tag --sort=-version:refname | head -10`

4. **Ask for desired branch**:
   - Display: `Which branch do you want to use? (ENTER for 'main')`
   - Store in `$SELECTED_BRANCH` (default: "main")

5. **Checkout branch**:
   - Run via Bash tool: `cd $TARGET_PATH && git checkout $SELECTED_BRANCH && git pull origin $SELECTED_BRANCH && cd -`

6. **Tag option** (optional):
   - Ask: `Do you want to use a specific tag? (yes/no)`
   - If yes: list tags and checkout selected tag

7. **Set TARGET**: `TARGET="$TARGET_PATH"`

##### 3.2 LOCAL Source (if choice = 2)

**Action: Select an already-extracted local directory**

1. **List available directories**:
   - Run via Bash tool: `ls -d prompts/spec/aikido-* 2>/dev/null`
   - Display list or message if none found

2. **Ask for directory name**:
   - Display: `Enter directory name (e.g. aikido-v1.3-custom):`
   - Store in `$DIR_NAME`

3. **Verify existence**:
   - `TARGET_PATH="prompts/spec/$DIR_NAME"`
   - If directory does not exist → Display error and EXIT 1

4. **Set TARGET**: `TARGET="$TARGET_PATH"`

##### 3.3 ARCHIVE Source (if choice = 3)

**Action: Extract an archive (tar.gz, tgz, zip)**

1. **List available archives**:
   - Run via Bash tool: `ls prompts/spec/*.{tar.gz,tgz,zip} 2>/dev/null`
   - Display list or message if none found

2. **Ask for archive name**:
   - Display: `Enter archive name (e.g. ai-kido-v1.3.tar.gz):`
   - Store in `$ARCHIVE_NAME`

3. **Verify existence**:
   - `ARCHIVE_PATH="prompts/spec/$ARCHIVE_NAME"`
   - If file does not exist → Display error and EXIT 1

4. **Prepare extraction**:
   - Extract version from name: `VERSION_FROM_FILE=$(echo "$ARCHIVE_NAME" | sed -E 's/.*-v?([0-9]+\.[0-9]+(\.[0-9]+)?).*/\1/')`
   - Create target directory: `TARGET_PATH="prompts/spec/aikido-source-v${VERSION_FROM_FILE}-$(date +%Y%m%d)"`
   - Run via Bash tool: `mkdir -p "$TARGET_PATH"`

5. **Extract by format**:
   - If `.tar.gz` or `.tgz`: run via Bash tool: `tar -xzf "$ARCHIVE_PATH" -C "$TARGET_PATH" --strip-components=1`
   - If `.zip`: run via Bash tool: `unzip -q "$ARCHIVE_PATH" -d "$TARGET_PATH"`
   - Other format → Error and EXIT 1

6. **Set TARGET**: `TARGET="$TARGET_PATH"`

#### Step 4: Source Validation

**Action: Validate the AI-KIDO source**

1. **Check required files** in `$TARGET`:
   - `prompts/hard_points/ai-kido.md`
   - `prompts/hard_points/ai-kido-light.md`
   - `AGENTS.md`
   - `CLAUDE.md`

2. **Extract source version** from `$TARGET/prompts/hard_points/ai-kido.md`:
   - Find line: `> **Version**: X.X.X-MODE`
   - Store in `$SOURCE_VERSION`

3. **Result**:
   - If all files exist AND version detected:
     - Display `Source AI-KIDO validated (version $SOURCE_VERSION)`
     - Display `   Path: $TARGET`
     - Continue to next step
   - Otherwise:
     - Display `ERROR: Invalid AI-KIDO source`
     - List missing files
     - EXIT 1

#### Step 5: Export Global Variables

**Action: Export variables for all plans**

1. **Define and export**:
   - `SOURCE="$(pwd)"` (current project)
   - `TARGET` (already defined in previous steps)

2. **Display summary**:

```
===============================================================
  PREPARATORY PHASE COMPLETE
===============================================================

Exported variables:
  SOURCE (current project)  : $SOURCE
  TARGET (external source)  : $TARGET
  SOURCE VERSION            : $SOURCE_VERSION

Ready for plan orchestration...
```

---

### PLAN ORCHESTRATION

#### Critical Rule

**ABSOLUTE PROHIBITION**: The LLM must NEVER summarize, simplify, or skip steps from the plans.

**ABSOLUTE OBLIGATION**: For each plan, the LLM MUST:

1. **Create a dedicated sub-task** via Agent tool or Code sub-task
2. **Read the complete plan** via Read tool
3. **Execute ALL phases** of the plan in exact order
4. **Call ALL scripts** mentioned in the plan (no summarizing)
5. **Verify ALL success conditions** before moving to the next plan
6. **Log every action** performed

**Mandatory execution format**:
```
For each plan X:
  1. Create sub-task (Agent tool or Code mode)
  2. Read complete plan X
  3. Execute phase 1 of plan X
  4. Execute phase 2 of plan X
  5. ...
  6. Execute phase N of plan X
  7. Verify complete success
  8. Move to next plan
```

#### Phase 1: Execute plan-beginning

**Action: Create a dedicated sub-task to execute the initialization plan**

1. **Locate the plan**: `prompts/hard_points/system/maj/plans/plan-beginning.md`

2. **Verify existence**:
   - If file not found → Display error and EXIT 1

3. **Create a sub-task** (via Agent tool or Code sub-task) with the message:
```
Execute plan-beginning.md IN FULL:
- Read file prompts/hard_points/system/maj/plans/plan-beginning.md
- Execute ALL phases in exact order
- Call ALL mentioned scripts
- Do NOT summarize, do NOT skip anything
- Verify all success conditions
- Log every action
```

4. **Display banner**:
```
===============================================================
  EXECUTING: plan-beginning.md (DEDICATED SUB-TASK)
===============================================================
```

5. **Wait for sub-task completion** and retrieve:
   - Exported variables: `$MAJ_CURRENT_VERSION`, `$MAJ_TARGET_VERSION`
   - Success status of each phase
   - Execution logs

6. **Verify plan success conditions**:
   - If BLOCKING phase fails → EXIT 1
   - If success → Continue to Phase 2

#### Phase 2: Version Plan Selection & Execution

**Action: Create a dedicated sub-task to execute the version plan**

1. **Extract version number**:
   - From `$MAJ_TARGET_VERSION`, extract `X.X.X` (remove `-LLM` or `-STANDARD` suffix)
   - Store in `$VERSION_NUMBER`

2. **Build plan path**:
   - `PLAN_VERSION="prompts/hard_points/system/maj/plans/plan-V${VERSION_NUMBER}.0.md"`
   - Example: `1.3.1-LLM` → `plan-V1.3.1.0.md`

3. **Check plan existence**:
   - If file not found:
     - Display `No specific plan for version $VERSION_NUMBER`
     - Skip directly to Phase 3 (ending plans)
   - If file exists:
     - **Create a sub-task** (via Agent tool or Code sub-task) with the message:
```
Execute plan-V${VERSION_NUMBER}.0.md IN FULL:
- Read file ${PLAN_VERSION}
- Execute ALL phases in exact order
- Call ALL mentioned scripts
- Do NOT summarize, do NOT skip anything
- Verify all success conditions
- Log every action
```
     - Display banner with plan name
     - Wait for sub-task completion

4. **Error handling**:
   - If BLOCKING phase fails → Launch `plan-ending-10.md` (error diagnostics)
   - If success → Continue to Phase 3

#### Phase 3: Ending Plans Chain (0→8)

**Action: Create a dedicated sub-task for EACH ending plan in strict order 0→1→2→3→4→5→6→7→8**

**Critical Rule**: Each ending plan MUST be executed in a separate sub-task.

For **each ending plan** in order (N = 0 to 8):

1. **Locate plan**: `prompts/hard_points/system/maj/plans/plan-ending-${N}.md`

2. **Verify existence**:
   - If not found → Warning + skip to next

3. **Create a sub-task** (via Agent tool or Code sub-task) with the message:
```
Execute plan-ending-${N}.md IN FULL:
- Read file prompts/hard_points/system/maj/plans/plan-ending-${N}.md
- Execute ALL phases in exact order
- Call ALL mentioned scripts (do not summarize)
- Verify all required inputs (files, variables)
- Verify all success conditions
- Log every action performed
- Do NOT summarize, do NOT skip anything
```

4. **Display banner** with plan number:
```
===============================================================
  EXECUTING: plan-ending-${N}.md (DEDICATED SUB-TASK)
===============================================================
```

5. **Ending plans context** (for information only):
   - **plan-ending-0** : Intelligent merge TARGET → SOURCE (prompts/ content)
   - **plan-ending-1** : Change detection (diff report generation)
   - **plan-ending-2** : Report analysis + index update preparation
   - **plan-ending-3** : General index update (mono/multi)
   - **plan-ending-4** : Structure validation (coherence diagnostics)
   - **plan-ending-5** : Optimization (temporary file cleanup)
   - **plan-ending-6** : Final validation (AI-KIDO compliance)
   - **plan-ending-7** : Population (gap proposals via agent-aikido-bank-populate)
   - **plan-ending-8** : Deployment of mappings and config TARGET → SOURCE (.roo/, .claude/, root files)

6. **Wait for sub-task completion** and retrieve:
   - Success status of each plan phase
   - Generated files
   - Exported variables
   - Execution logs

7. **Error handling**:
   - BLOCKING plan fails → Launch `plan-ending-10.md` (diagnostics)
   - NON-BLOCKING plan fails → Warning + continue to next

8. **Move to next ending plan** (N+1) and repeat steps 1-7

---

## Output

### Finalization

**Action: Display the final update report**

1. **Display success banner**:

```
===============================================================
  AI-KIDO UPDATE COMPLETE
===============================================================
```

2. **Display summary**:

```
SUMMARY:
  Version before : $MAJ_CURRENT_VERSION
  Version after  : $MAJ_TARGET_VERSION
  Source (current project)  : $SOURCE
  Target (external source)  : $TARGET

PLANS EXECUTED:
  plan-beginning.md
  plan-V${VERSION_NUMBER}.0.md (if applicable)
  plan-ending-0.md through plan-ending-8.md

GENERATED FILES:
  - Logs    : prompts/spec/logs/maj-aikido-*.log
  - JSON    : /tmp/aikido/maj_*.json
  - Backups : backups/aikido-*.tgz

RECOMMENDED NEXT ACTIONS:
  1. Check validation logs (prompts/spec/logs/)
  2. Test migrated commands
  3. Re-run indexing if needed: /reindex-projet
  4. Review validation reports
```

---

## Notes

### Error Handling

**Action: Handle critical errors occurring during the process**

If a critical error occurs at **any step**:

1. **Display error banner**:

```
===============================================================
  CRITICAL ERROR DETECTED
===============================================================
```

2. **Display error details**:
   - Phase where the error occurred
   - Full error message
   - Context (variables, affected files)

3. **Launch diagnostics plan**:
   - Locate: `prompts/hard_points/system/maj/plans/plan-ending-10.md`
   - If present:
     - Display `Launching error diagnostics (plan-ending-10)...`
     - Read and execute plan-ending-10
   - If absent:
     - Display `Diagnostics plan not found`
     - Indicate manual recovery procedure

4. **Indicate recovery procedure**:

```
RECOVERY:
  1. A verification backup was created before modifications
  2. Locate: backups/aikido-verif-backup-*.tgz
  3. Restore: tar -xzf backups/aikido-verif-backup-*.tgz
  4. Analyze error in logs
  5. Fix the problem
  6. Restart: /maj-aikido --update
```

5. **EXIT 1** to stop the process

### Important Notes for Execution

**For the LLM Agent**

When executing this command:

1. **ABSOLUTE OBLIGATION: CREATE SUB-TASKS**
   - **EACH plan** (beginning, version, ending-0 through ending-8) MUST be executed in a **dedicated sub-task**
   - Create a sub-task via Agent tool or Code sub-task
   - NEVER execute multiple plans in the same sub-task
   - NEVER execute a plan directly without a sub-task

2. **ABSOLUTE PROHIBITION: SUMMARIZE OR SKIP**
   - NEVER summarize a plan's actions
   - NEVER skip a plan phase
   - NEVER say "I executed phases X through Y" without actually executing them
   - ALWAYS read the complete plan via Read tool
   - ALWAYS execute each phase sequentially

3. **OBLIGATION: CALL ALL SCRIPTS**
   - When a plan mentions a script, call it via Bash tool
   - NEVER summarize a script call with "I verified..."
   - Scripts authorized in plans:
     - `detect-project-type.sh`
     - `sync-files.sh`
     - `sync-directories.sh`
     - `validate-structure.sh`
     - All scripts in `prompts/hard_points/system/maj/scripts/`

4. **OBLIGATION: FOLLOW STRICT ORDER**
   - Mandatory order: beginning → version (if exists) → ending-0 → ending-1 → ... → ending-8
   - NEVER reverse order
   - NEVER parallelize plans
   - Wait for complete plan completion before moving to next

5. **OBLIGATION: VERIFY SUCCESS CONDITIONS**
   - After each plan phase, verify its success
   - If BLOCKING phase fails → Stop and launch plan-ending-10.md
   - If NON-BLOCKING phase fails → Log warning and continue

6. **OBLIGATION: LOG EVERY ACTION**
   - Log every executed phase
   - Log every called script
   - Log every generated file
   - Log every exported variable

7. **OBLIGATION: MAINTAIN CONTEXT**
   - Export variables between plans
   - Pass results from one plan to the next
   - Preserve logs of all phases

### Benefits of this Architecture

- **Maintainability**: Modifying a plan = modifying 1 file (not 1860 lines)
- **Reusability**: Common ending plans for all migrations
- **Testability**: Each plan can be tested independently
- **Clarity**: Clear separation of responsibilities
- **Scalability**: Adding a new version = create 1 plan-V{version}.md

### References

- **Plans**: [`prompts/hard_points/system/maj/plans/`](../system/maj/plans/)
- **Technical scripts**: [`prompts/hard_points/system/maj/scripts/`](../system/maj/scripts/)
- **Plans README**: [`prompts/hard_points/system/maj/plans/README.md`](../system/maj/plans/README.md)
- **Agent Update Controller**: [`prompts/hard_points/agents/agent-aikido-update-controller.md`](../agents/agent-aikido-update-controller.md)

---

**Optimized with modular plan system V2.0 - Version 3.0**

This command is a **lightweight orchestrator** that delegates to specialized plans.
