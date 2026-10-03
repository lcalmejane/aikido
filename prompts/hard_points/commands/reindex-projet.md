---
description: "Launch agent-aikido-projet-index to re-index the project"
---

# /reindex-projet

**Purpose**: Launch `agent-aikido-projet-index` to execute generate-all-indexes-v3.1.sh and re-index the project, generating a tracking log in `/prompts/spec/logs/`.

---

## Usage

[MANDATORY]
/reindex-projet [path]

- `path` (optional): relative path for targeted indexing (e.g., `src/Domain`)
- Without argument: full project indexing

## Prerequisites

- `agent-aikido-projet-index` agent available

## Steps

[MANDATORY]
1. Create directory `prompts/spec/logs/` if it does not exist.
2. Generate a timestamped log filename: `prompts/spec/logs/reindex-projet-YYYY-MM-DD_HH-MM-SS.log`
3. Display the start header.
4. Launch `agent-aikido-projet-index` to execute `generate-all-indexes-v3.1.sh` in a background task with the provided path (variable `$ARGUMENTS`) if present.
5. Display the agent ID and log path.
6. Monitor agent progress and display in real time:
   - Timestamp format: `[HH:MM:SS]`
   - Status symbols: ⚙️ (in progress), ✓ (success), ⚠️ (warning), ✗ (error)
   - Progress message
7. Write each output line to the log file.
8. When the agent completes, display the final summary.

[OPTIONAL]
- Do NOT edit or modify any file other than the log file.

## Output

```
╔══════════════════════════════════════════════════════════╗
║  PROJECT RE-INDEXING - START                             ║
╚══════════════════════════════════════════════════════════╝

⚙️  Agent launched in background (ID: [agent-id])
📝 Log: prompts/spec/logs/reindex-projet-[timestamp].log

[HH:MM:SS] ⚙️  Analyzing project structure...
[HH:MM:SS] ✓ Structure analyzed (125 files found)
[HH:MM:SS] ⚙️  Generating JSON index...
[HH:MM:SS] ✓ Index generated (2.4 MB)
[HH:MM:SS] ⚙️  Validating structure...
[HH:MM:SS] ✓ Validation complete

╔══════════════════════════════════════════════════════════╗
║  ✓ RE-INDEXING COMPLETE                                  ║
╚══════════════════════════════════════════════════════════╝

⏱️  Duration: [X] seconds
📝 Full log: prompts/spec/logs/reindex-projet-[timestamp].log
```

## Notes

- The log is kept for traceability in `/prompts/spec/logs/`
- On error, the log contains details for debugging
- Unicode characters (✓ ⚙️ ⚠️ ✗ ╔═╗) are supported by both Roo-Code and Claude Code terminals
