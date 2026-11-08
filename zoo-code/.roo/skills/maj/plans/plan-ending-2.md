# Plan Ending-2 – Differences Report Analysis

> **Type**: ending | **Order**: 2 | **Blocking**: NO, except backup-list publication

## Objective and inputs

Analyze the fresh ending-1 report and prepare a human-readable summary before
ending-3. Inputs are canonical SOURCE, the same private exclusive
`MAJ_WORK_DIR` used by beginning/ending-1, and its paired snapshots and
completed report receipt. A `.bak` filename is only a review candidate, never
deletion authority.

The host invokes Node CLI operations with an argument array and checks exit
status before interpreting stdout. No shell, external JSON tool, or generated
wrapper is used.

## Phase 1 – Check and read the report

Check report availability. `PRESENT` means usable, `EMPTY` means missing,
invalid, or stale data and is a degraded non-blocking result. Operational
errors are also degraded; report them and do not consume their stdout.

```text
node /canonical/source/prompts/hard_points/system/maj/scripts/ending-2-report.mjs check --dir /private/maj-work-directory
```

Only when present, display and validate the report. The engine verifies the
receipt and exact hashes for both snapshots and the report. A stale report
must be treated as unavailable and ending-1 rerun before relying on its data.

```text
node /canonical/source/prompts/hard_points/system/maj/scripts/ending-2-report.mjs display --dir /private/maj-work-directory
node /canonical/source/prompts/hard_points/system/maj/scripts/ending-2-report.mjs validate --dir /private/maj-work-directory
```

## Phase 2 – Analyze and scan backups

When valid, analyze the report with `--list`. The final stdout line is
`TOTAL ADDED REMOVED MODIFIED`; unavailable data prints `N/A N/A N/A N/A`.
The host preserves unknown values on errors and never normalizes unavailable
data to zero. JSON-escaped path lines are informational and deterministic.

```text
node /canonical/source/prompts/hard_points/system/maj/scripts/ending-2-report.mjs analyze --list --dir /private/maj-work-directory
```

Scan SOURCE for names containing `.bak` and publish a fresh list in the work
directory, including an empty list when there are none. A scan/publication
failure is blocking because a previous list must not be consumed. The scan
does not follow symlinks; filenames with newlines cannot be represented safely.

```text
node /canonical/source/prompts/hard_points/system/maj/scripts/ending-2-report.mjs backups /canonical/source --dir /private/maj-work-directory
```

## Phase 3 – Publish summary and log

The host assembles a human-readable summary from validated values (or `N/A`
for unavailable report data), backup count/list path, analysis status, and
current date. Send that content as stdin to `ending-2-report.mjs summary
--dir WORK_DIR` using the host's process API. Check exit status; a failure is
blocking and the old summary must not be treated as current.

```text
node /canonical/source/prompts/hard_points/system/maj/scripts/ending-2-report.mjs summary --dir /private/maj-work-directory
```

The summary states that ending-3 regenerates templates independently and does
not consume this summary. Read and present the newly published file for human
review. Then create a unique phase-2 log under SOURCE logs with
`create-log.mjs`; a log-write failure blocks chaining.

```text
node /canonical/source/prompts/hard_points/system/maj/scripts/create-log.mjs /canonical/source/prompts/spec/logs/phase-2-unique.log "Plan Ending-2 : Differences Report Analysis" "Analysis status: unavailable; backup files: 0"
```

## Outputs and continuation

- `ending2_summary.txt`: human-readable review summary.
- `backup_files_list.txt`: freshly scanned candidates, not deletion authority.
- A unique phase-2 log under `SOURCE/prompts/spec/logs/`.

Missing/invalid/stale reports remain non-blocking and appear as N/A, not zero.
An operational report error is recorded as error. Continue to ending-3 only
after a new backup scan/list and summary are successfully published.
