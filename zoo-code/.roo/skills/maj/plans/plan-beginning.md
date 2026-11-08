# Plan Beginning – Post-Backup Initialization

> **Type** : beginning | **Ordre** : -1 | **Bloquant** : OUI

## 🎯 Objective

Prepare the AI-KIDO update environment by verifying backups, loading context, and generating initial structures for comparison.

This plan executes **immediately after** the initial backup is created and **before** the version plan selection.

---

## 📥 Required Inputs

- `$SOURCE` : Absolute path to the directory containing the current AI-KIDO base (current project)
- `$TARGET` : Absolute path to the directory containing the update files (validated external source)

**Example**: set SOURCE and TARGET in the host context to the canonical project
and reviewed update source paths. Do not initialize these values through a
generated shell fragment.

---

## 📋 Execution Steps

### 1️⃣ Phase 1.1 : Initial Backup Verification (NON-BLOCKING)

**Action : Verify the existence of a recent backup**

```text
node /canonical/source/prompts/hard_points/system/maj/scripts/beginning-check-backup.mjs /canonical/source
```

This script searches for the most recent backup in `backups/aikido-backup-*.tgz`.
The host records the path from stdout on exit 0. On nonzero exit, report the
stderr warning, set `LATEST_BACKUP` to absent, and continue to the mandatory
verification backup.
- **Output** : One absolute path on stdout, or empty when no matching backup exists;
  warnings and errors go to stderr. This lookup checks file presence, not archive validity.
- **Exit code** : 0 on success or absence, nonzero on errors (reported but non-blocking).
- **Safety** : Symlinked backup directories or matching files are refused.

---

### 1️⃣ Phase 1.2 : Verification Backup Creation (BLOCKING)

**Action : Create a verification backup before any modification**

```text
node /canonical/source/prompts/hard_points/system/maj/scripts/create-backup.mjs /canonical/source aikido-verif-backup
```

The Node.js 24+ engine calls external `tar`
(argument array, no shell). It saves the historical selection, not the whole project.
- **Files saved** : `.claude .roo .roomodes agents_list.md commands_list.md AGENTS.md CLAUDE.md README.md prompts`
- **Missing members** : Optional, skipped with stderr warnings; no members is an error.
- **Output** : One exact absolute path on stdout, only after successful tar, nonempty output and synchronization:
  `$SOURCE/backups/aikido-verif-backup-YYYYMMDD-HHMMSS-UUID.tgz`.
- **Intentional differences** : Backups belong to SOURCE, not cwd; exclusive private
  archive creation, unique suffix, diagnostics on stderr, no false success after tar failure.
  Symlinks in the backup destination/ancestors and unsafe prefixes/paths are refused.
  Member symlinks are archived as links (never dereferenced).
  Ambient tar/gzip option variables are cleared to prevent deletion/dereference hooks.
  Supports macOS and Linux: tar runs with cwd SOURCE, stdout goes to an exclusively
  created file descriptor; SOURCE/backup ancestors are checked before and after tar.
  These checks are NOT atomic: no hostile concurrent directory rename/symlink swap
  is permitted. Node cannot guarantee race-free path traversal portably.
  A detected replacement is a blocking error; no failed archive is read.
  Failed/interrupted artifacts are retained, never accepted as verification backups;
  the engine never overwrites or removes an existing entry.
- **Exit code** : 0 on success, 1 on failure (BLOCKING)
- **Caller contract** : SOURCE is an absolute canonical path without trailing slash.
  Never inspect/read an archive after failure; do not continue with an old VERIF_BACKUP.
- **Host gate**: accept exactly one stdout path only after exit 0; verify it is
  a regular, non-symlink file under SOURCE/backups with the expected prefix.
  Any unexpected output or nonzero exit is blocking; do not continue.

---

### 2️⃣ Phase 2 : Update Context Loading (BLOCKING)

**Action : Load or detect current and target versions**

```text
node /canonical/source/prompts/hard_points/system/maj/scripts/beginning-detect-versions.mjs /canonical/source /canonical/target
```

This script automatically detects versions from `prompts/hard_points/ai-kido.md`.
- **Output** : `CURRENT_VERSION TARGET_VERSION` (format: "1.3.0 1.3.1")
- **Diagnostics** : stderr only; the wrapper calls the Node.js 24+ version engine.
- **Export** : The calling plan exports `$MAJ_CURRENT_VERSION` and `$MAJ_TARGET_VERSION` in Phase 3; a child process cannot export to its parent.
- **Exit code** : 0 on success, 1 on failure (BLOCKING)

---

### 3️⃣ Phase 3 : Variable Export for Subsequent Plans (BLOCKING)

**Action : Export global variables**

**Objective** : Make variables available for all subsequent plans.

The host validates that stdout contains exactly two nonempty, whitespace-free
version tokens. On any nonzero exit or malformed output, report the engine
diagnostic and stop with the blocking version-detection failure. Retain the
validated versions, paths, and backup result in the orchestrator context for
subsequent plans; child-process environment export is not implied.

---

### 4️⃣ Phase 4 : Startup Log (NON-BLOCKING)

**Action : Create the initial log file**

The host assembles the startup-log content from the validated context and calls
`create-log.mjs` with a unique, non-existing destination under
`SOURCE/prompts/spec/logs/`, the title `Update Start`, and the content. Use the
Node engine's exact exit status: report a nonzero result as a warning and
continue; never accept an existing path as a newly created log.

This script creates a formatted log to trace the start of the process.
- **Output** : `$SOURCE/prompts/spec/logs/maj-aikido-start-YYYYMMDD-HHMMSS.log`
- **Exit code** : 0 on success; a failure is reported but does not block the update.
- **Safety** : The Node.js 24+ engine creates the log exclusively and refuses an existing path, including a symlink.

---

### 5️⃣ Phase 5 : Initial Content Snapshot (BLOCKING for ending-0)

Use an existing, canonical, private work directory outside SOURCE and TARGET
(`MAJ_WORK_DIR`); do not reuse an untrusted or concurrently used directory.
The historical default is `/tmp/aikido` for compatibility.

```text
node /canonical/source/prompts/hard_points/system/maj/scripts/beginning-generate-structure.mjs /canonical/source /canonical/target --dir /private/maj-work-directory
```

The host must provide the same private, exclusive work directory to every
subsequent plan. A nonzero exit blocks ending-0 and ending-1; do not consume
snapshots from a prior run.

Node.js 24+ captures SHA-256 digests of TARGET regular files under
`prompts/hard_points/` and the matching SOURCE files. It excludes generated
structure indexes and never updates either project. Project truth tables and
personal data are not merge inputs. The JSON file `ending-0-snapshot.json`
records `{format,id,source,target,files:{path:{source:sha256|null,target:sha256}}}`.
Changes between snapshot and comparison are blocking; repeat this phase if a
version plan changes a matching file.

This phase also creates `maj_before.json` for ending-1, independently of index
masters. Contract:
`{format:"aikido-maj-content-v1",phase:"before",run:uuid,root:canonicalSOURCE,
files:{path:{sha256:hex64,size_bytes:integer}}}`.
The scope is all regular SOURCE files under `prompts/hard_points/` and
`prompts/gen/`, excluding `prompts/spec/`, directories named `backups`, names
containing `.bak`, archives (`.tgz`, `.tar`, `.tar.gz`), staging files (`.tmp`,
`.partial`, `.ending-0-*`, `.ending-1-*`), and generated structure master/indices.
Missing gen/hard_points subtrees are empty; TARGET must contain eligible
hard points for the fusion snapshot. Symlinks and unrepresentable names in the
selected scope fail the capture. File paths and hashes are checked again before
publication. No index generator runs and no existing index is modified.
Each new beginning invalidates `maj_diff.state.json` before capture and creates
a new run UUID; ending-1 pairs its AFTER snapshot with this exact run and root.
Legacy masters cannot be consumed as content snapshots.

---

## 📤 Produced Outputs

| Variable/File | Description | Scope |
|------------------|-------------|--------|
| `$MAJ_CURRENT_VERSION` | Current AI-KIDO version (ex: `1.3.0-LLM`) | Global (exported) |
| `$MAJ_TARGET_VERSION` | Target AI-KIDO version (ex: `1.3.1-LLM`) | Global (exported) |
| `$LATEST_BACKUP` | Initial backup path | Global (exported) |
| `$VERIF_BACKUP` | Verification backup path | Local |
| `$LOG_FILE` | Startup log file | Local |
| `$MAJ_WORK_DIR/ending-0-snapshot.json` | SOURCE/TARGET content fingerprints for ending-0 | Work file |
| `$MAJ_WORK_DIR/maj_before.json` | SOURCE path/content snapshot for ending-1 | Work file |

---

## ✅ Success Conditions

The `beginning` plan is considered successful if **ALL** these conditions are met:

1. ✅ A verification backup was created (`$VERIF_BACKUP` exists)
2. ✅ CURRENT and TARGET versions are detected (non-empty)
3. ✅ Variables are correctly exported
4. ✅ The ending-0 content snapshot was generated

**Non-blocking conditions** (warnings only) :
- ⚠️  Initial backup not found
- ⚠️  Startup log creation failed

---

## ❌ Failure Handling

If a **BLOCKING** phase fails:

1. **Display a clear error message** with exact cause
2. **DO NOT continue** toward version plan selection
3. **EXIT 1** to stop the process
4. **The user must** :
   - Fix the problem (permissions, missing files)
   - Relaunch `/maj-aikido --update`

**Failure message example**: report the exact engine stderr and nonzero exit
for the verification-backup phase, identify the requested backup destination,
and stop before version-plan selection. The host may recommend checking the
directory permissions, but must not create directories or change permissions
without explicit authorization.

---

## 🔗 Chaining

The historical sequence is listed below for integration work. **Do not chain
the complete workflow while [ending-0](plan-ending-0.md) remains blocked.**

1. **Automatic version plan selection** according to `$MAJ_TARGET_VERSION`
   - Ex: `1.3.0.0` → `plan-V1.3.0.0.md`
   - Ex: `1.3.1.0` → `plan-V1.3.1.0.md`

2. **Version plan execution** (migration-specific phases)

3. **Ending plan chaining** : 0 → 1 → 2 → 3 → 4 → 5 → 6 → 7

---

## 📚 References

- **Content snapshot** : [`beginning-generate-structure.mjs`](../scripts/beginning-generate-structure.mjs)
- **Version plans** : [`prompts/hard_points/system/maj/plans/plan-V*.md`](.)

---

*Plan beginning v2.0 – Declarative approach with action prompts*
