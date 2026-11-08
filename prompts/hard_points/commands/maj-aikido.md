---
description: "Update and complete AI-KIDO synchronization via modular plan system"
---

# /maj-aikido

**Purpose**: Orchestrate AI-KIDO updates by delegating operations to modular plans.

**Safety gate:** Never execute a plan marked blocked or historical, even if a
later instruction says to execute every phase. The historical V1.3.0.0 plan
contains unsafe and unavailable operations. For managed installations, prefer
the packaged Node planner below; review its output and obtain approval before
applying. If the required safe workflow is unavailable, stop and report it.

> **Version**: 3.0 | **Architecture**: Modular Plans V2.0 | **Role**: Orchestrator

---

## Usage

[MANDATORY]

```text
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

Discover this executor's tools using the
[Kimono capability gate](../system/search/SKILL.md#kimono-capability-gate).
Supply verified names via `AIKIDO_TOOLS` or `--tools-file` to the packaged update
or check runtime. Preview detection without writes; refresh local flags only
during the approved update/check. Forward the status and permitted bindings
to plans/agents, preserving native verification and explicit search fallback.

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

4. AI-KIDO PLUGIN PACKAGE - an installed plugin package or extracted host package

Enter your choice (1/2/3/4):
```

2. **Wait and store response** in `$SOURCE_TYPE` (values: "1" | "2" | "3" | "4")

#### Step 3: Source Retrieval & Validation by Type

##### 3.1 GIT Source (if choice = 1)

**Action: Clone or update the AI-KIDO Git repository using the host's Git actions**

1. Use `git@github.com:lcalmejane/aikido.git` and the target
   `prompts/spec/aikido-source-git`.

2. Check whether the target repository exists using a host directory action:
   - If it exists:
     - Display `Existing repository detected, updating...`
     - Use host Git actions to fetch remote branches and tags.
   - Otherwise:
     - Display `Cloning repository...`
     - Use the host Git clone action with the selected repository and target.

3. **List available branches and tags**:
   - Use host Git actions to list remote branches and the ten newest version
     tags.

4. **Ask for desired branch**:
   - Display: `Which branch do you want to use? (ENTER for 'main')`
   - Store the selected branch (default: `main`).

5. **Checkout branch**:
   - Use host Git actions to checkout the selected branch and pull its remote
     updates.

6. **Tag option** (optional):
   - Ask: `Do you want to use a specific tag? (yes/no)`
   - If yes: list tags and checkout selected tag

7. **Set TARGET**: `TARGET="$TARGET_PATH"`

##### 3.2 LOCAL Source (if choice = 2)

**Action: Select an already-extracted local directory using host file actions**

1. **List available directories**:
   - Use a scoped Glob action for `prompts/spec/aikido-*`.
   - Display list or message if none found

2. **Ask for directory name**:
   - Display: `Enter directory name (e.g. aikido-v1.3-custom):`
   - Store the selected directory name.

3. **Verify existence**:
   - Resolve the selected directory under `prompts/spec/`. If it does not
     exist, display an error and stop.

4. Use the verified directory as the selected source.
5. A downloaded release or a working copy is the user's own: do not require a checksum, a lock or the
   official repository. Run the update runtime with `--trust local`, report its `warnings` and
   `versionChange` (`upgrade`, `same`, `downgrade`) to the user, and apply the exact plan once confirmed,
   a regression included. Trace the source in the lock; never block on its identity.

##### 3.3 ARCHIVE Source (if choice = 3)

**Action: Extract an archive with a host archive action (tar.gz, tgz, zip)**

1. **List available archives**:
   - Use a scoped Glob action for supported archive extensions under
     `prompts/spec/`.
   - Display list or message if none found

2. **Ask for archive name**:
   - Display: `Enter archive name (e.g. ai-kido-v1.3.tar.gz):`
   - Store the selected archive name.

3. **Verify existence**:
   - Resolve and verify the selected archive under `prompts/spec/`. If absent,
     display an error and stop.

4. **Prepare extraction**:
   - Extract the version from the archive name and use the current date to
     form `prompts/spec/aikido-source-v{version}-{date}`. Create the target
     through the host's directory action.

5. **Extract by format**:
   - Use the host's archive extraction action for the verified archive and
     target directory. Reject unsupported formats. If extraction is not
     supported by the host, report that limitation and stop without fallback
     to a shell command.

6. Use the extracted target directory as the selected source.

##### 3.4 AI-KIDO Plugin Package (if choice = 4)

**Action: Select the active plugin package or an extracted package directory**

1. If the host provides `${CLAUDE_PLUGIN_ROOT}`, use that resolved plugin root as the default.
   Otherwise ask for the path to an extracted host package directory.
2. Resolve the selected path to an absolute path; do not infer it from the project directory or
   search other plugin caches.
3. Verify that `package-manifest.json`, `payload/`, `templates/` and the package runtime exist.
   Start Node directly using the host's argv-based process action, with the
   absolute path to `scripts/validate-package.mjs` followed by the resolved
   package root. Require a successful exit and valid output. Do not execute a
   shell or pipeline; if direct process execution is unavailable, report the
   limitation and stop. `host-actions.mjs` is a library, not a registered Tool.

4. Require a valid package manifest and a package host compatible with this host. Do not accept a
   bare source repository, a package from another host, or an unverified staging folder.
5. Set `TARGET` to the validated package root and `SOURCE_TYPE=4`.
6. Do not extract this source or pass it through the legacy version-plan chain. After the common
   update runtime has shown its read-only plan, ask the user to confirm that exact plan before
   invoking its apply operation. Plugin update and project-method update are separate operations.

#### Step 4: Source Validation

**Action: Validate the AI-KIDO source**

1. For Git, local directory and archive sources, check required files in `$TARGET`:
   - `prompts/hard_points/ai-kido.md`
   - `prompts/hard_points/ai-kido-light.md`
   - `AGENTS.md`
   - `CLAUDE.md`

2. For those legacy sources, extract source version from `$TARGET/prompts/hard_points/ai-kido.md`:
   - Find line: `> **Version**: X.X.X-MODE`
   - Store in `$SOURCE_VERSION`

3. For package source (`SOURCE_TYPE=4`), the package validator is authoritative:
   - Read `version`, `host` and `sourceRevision` from its validated `package-manifest.json`.
   - Store `version` in `$SOURCE_VERSION`.
   - Do not require repository-root `AGENTS.md` or `CLAUDE.md`; these are not package payload files.

4. **Result**:
   - If source-specific validation succeeds and the version is detected:
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
4. **Call the scripts required by the selected branch** (no summarizing);
   do not execute alternative examples or resumed phases blindly. Ending-0
   suspends pending external dispatch/review and resumes only through its verifier.
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

**Package source branch**: when `SOURCE_TYPE=4`, do not execute `plan-beginning.md`, the
version-migration plans, or `plan-ending-0` through `plan-ending-8`. Those plans operate on a
repository checkout and could copy repository-level configuration into the project. Instead, use
the bundled distribution runtime. Resolve the active plugin root from the host's
plugin context; do not treat it as an environment variable or infer it from the
project directory.
If the project has no `.aikido/lock.json` but does have `prompts/hard_points/`, offer the explicit
non-destructive migration path instead of attempting a regular update:

Start Node through the host's direct-process action with the absolute path to
`scripts/update-plan.mjs` followed by the separate argv entries
`["--root", currentProjectRoot, "--package", targetPackage, "--migrate"]`.

Review the migration report and confirm its exact plan ID with `--migrate --apply --confirm`.
Migration only records existing files and saves source baselines; it does not rewrite project
knowledge, indexes, generated lists or user instruction files. If no existing AI-KIDO method is
present, stop and use the bootstrap flow instead.

For an existing lock:

1. Run the read-only update planner with the current project root and `$TARGET` package:

   Start Node directly with the absolute path to `scripts/update-plan.mjs`
   and argv entries `["--root", currentProjectRoot, "--package", targetPackage]`.

2. Display file decisions, conflicts and the returned confirmation ID; planning makes no project
   writes. If conflicts are present, stop and ask for manual resolution before replanning.
3. After explicit user approval, invoke apply with the exact displayed ID:

   After approval, start the same Node script directly with the same root and
   package arguments plus `["--apply", "--confirm", reviewedPlanId]`.

4. Report the targeted backup path returned by apply. If recovery is needed, restore only from that
   exact backup:

   Start the same Node script directly with arguments
   `["--root", currentProjectRoot, "--recover", backupPath]`.

5. Report conflicts or failures and leave existing Git/local/archive workflows unchanged.
6. After a successful apply or migration, bring every assistant CLI installed on this machine up
   to date: start Node directly with the absolute path to the same package's `scripts/sync-hosts.mjs`
   and argv entries `["--root", currentProjectRoot, "--dry-run"]`, show the plan, and after explicit
   approval run it again without `--dry-run`. Alternatively, add `"--sync-hosts"` to the
   `--apply` call above to do both in one step. The project-side entry
   `prompts/hard_points/system/host-sync/host-sync.mjs` does the same from an installed project.

For Git, local directory and archive sources, continue with the existing modular plan chain below.

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
   - If ending-0 is not found → Stop (mandatory fusion gate missing)
   - For other plans, follow their required/optional status; never skip a required gate

3. **Create a sub-task** (via Agent tool or Code sub-task) with the message:
```
Execute plan-ending-${N}.md IN FULL:
- Read file prompts/hard_points/system/maj/plans/plan-ending-${N}.md
- Execute ALL phases in exact order
- Call the scripts for the selected branch only; examples and resumed phases
  are not instructions to execute every alternative
- Verify all required inputs (files, variables)
- Verify all success conditions
- For ending-0, use ending-0-fusion.mjs start for INTELLIGENT; supply the exact
  host-exposed dispatch tool as MAJ_DISPATCH_TOOL. Exit 2 means pending.
- Do not normalize pending into failure or claim completion. Return the request file and host next actions.
- Only a current verified resume/status result (or verified zero differences) permits ending-1.
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
   - **plan-ending-0** : Host-dispatched reviewed fusion under prompts/hard_points;
     `ending-0-fusion.mjs start` prepares `ending-0-fusion.request.json`.
     The coordinator uses an actually exposed dispatch tool and authorized
     `agent-aikido-fusion` executor, never assumes worker permissions, and
     reviews every applied result. It writes the acceptance manifest specified
     in the plan, runs `accept`, then `resume`/`status` with the same MAJ_WORK_DIR.
     Node does not invoke the agent. Keep the workflow suspended until the
     verification succeeds; SKIP/MANUAL_LATER remain pending and REPLACE is refused.
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
   - ending-0 exit 2/pending → Suspend and return the host dispatch/review/accept
     actions; do not launch ending-1 or show success. Resume the existing request
     rather than restarting beginning/comparison/start.
   - ending-0 completion → Require fresh verified `ending-0-fusion.mjs resume`
     (or revalidated zero differences). A prepared request or generic sub-task
     `ok` message is insufficient.
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
     - `detect-project-type.mjs`
     - `maj-node-migration.mjs sync-file`
     - `maj-node-migration.mjs sync-directories`
     - `validate-structure.mjs`
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
