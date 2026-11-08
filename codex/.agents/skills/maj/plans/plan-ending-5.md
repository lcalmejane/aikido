# Plan Ending-5 – Temporary and Backup Review

> **Type**: ending | **Order**: 5 | **Blocking**: NO

## Objective and inputs

Review SOURCE backups and optional historical `/tmp/aikido` contents without
deleting files. Inputs are canonical SOURCE and Node.js 24+. Existing scripts
do not maintain a persistent ownership registry, so this phase skips cleanup.
The host invokes Node with an argument array and checks each exit status.

## Phase 1 – Cleanup assessment

```text
node /canonical/source/prompts/hard_points/system/maj/scripts/ending-5-review.mjs cleanup /canonical/source
```

The current engine reports `SKIPPED` and explains that no deletion occurred.
Any nonzero exit means the assessment is unknown; report a warning and do not
delete anything. No other `*.tmp` file is removed.

## Phase 2 – Read-only review

Invoke the backup and temporary-directory inspections independently. Consume
stdout only on exit 0. Backup output is `total recent old`; temporary output
is `file-count total-bytes`. Preserve `unknown` on failures, never substitute
zero. An absent shared temp directory yields `0 0`.

```text
node /canonical/source/prompts/hard_points/system/maj/scripts/ending-5-review.mjs backups /canonical/source
node /canonical/source/prompts/hard_points/system/maj/scripts/ending-5-review.mjs temp-info
```

Recent backups are less than one hour old; old backups are more than 24 hours
old. Symlinks are not followed. These are read-only snapshots and concurrent
filesystem changes are not atomic.

## Phase 3 – Log and continue

The host records cleanup, backup, and temporary review results in a unique log
under `SOURCE/prompts/spec/logs/` using `create-log.mjs`. Logging failures are
reported but do not block ending-6.

```text
node /canonical/source/prompts/hard_points/system/maj/scripts/create-log.mjs /canonical/source/prompts/spec/logs/phase-5-unique.log "Plan Ending-5 : Temporary and Backup Review" "Cleanup: SKIPPED; Backups: unknown; Shared temp: unknown"
```

This plan never deletes backups, shared temporary files, or arbitrary project
files. Safe ownership tracking and removal of orphaned AI-KIDO temporaries
remain future work.

## References

- [Review engine](../scripts/ending-5-review.mjs)
- [Backup creation](../scripts/create-backup.mjs)
