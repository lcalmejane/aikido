---
name: clean-index
description: "Clean orphaned entries from the AI-KIDO structure index"
---

# /clean-index

Identify entries in the V3.1 by-id index whose project-relative paths no longer
exist, and remove only those entries. Run from the project root.

## Usage

[MANDATORY]

`/clean-index [--dry-run] [--confirm] [--verbose] [--rebuild]`

| Argument | Description |
|----------|-------------|
| `--dry-run` | Report without any writes; takes precedence over `--confirm`. |
| `--confirm` | Ask before making changes; `y`, `yes`, `o`, or `oui` approves. |
| `--verbose` | Display every valid and orphan path instead of only orphan examples. |
| `--rebuild` | Rebuild all indexes from the current project tree, even when no orphans are detected. |

Flags can be combined. Without `--confirm` cleanup is immediate.

## Execution

[MANDATORY]

Use an exposed host direct-process action to start Node with the absolute path
of `prompts/hard_points/system/structure/scripts/clean-orphans.mjs` followed
by the selected flags as separate argv entries. Set the working directory to
the project root; do not invoke a shell or construct a pipeline. If direct
argv execution is unavailable, report that limitation and stop.
`host-actions.mjs` is a library, not an automatically registered Tool.
Do not create a log or any other file for a dry run.

The engine reads the master and all routed by-id batches before writing. It
rejects malformed JSON, invalid entries, unsafe paths and symlink components;
an incomplete index is an error. To avoid numerical precision loss on rewrite,
numbers must be safe integers written without decimal or exponent notation.
If the master is absent, it reports that
there is nothing to clean and suggests `/reindex-projet`. Errors return a
nonzero status. Over 10% orphans produces a warning.

Without `--rebuild`, changed by-id batches, their counts and the master by-id counts, total and
last-check are updated; other metadata and valid entries are retained.
**Secondary indexes (by-path, alphabetical, directory and type), their master
routing and other statistics are not refreshed or checked. Run
`/reindex-projet` after any cleanup** before relying on them, even below 10%.
No claim of full index consistency is made when no orphans are found either.

With `--rebuild`, the engine scans the project and regenerates all indexes
using the same Node engine as `/reindex-projet`. This also adds newly visible
files and refreshes metadata; it is not limited to deleting orphan entries.
Git and Node.js 24+ are required. `--dry-run` reports this intention without
scanning or testing whether a rebuild will succeed; `--confirm` asks before
rebuilding. An incomplete or invalid existing by-id index still blocks this
command; use `/reindex-projet` to rebuild without first inspecting it.

The engine stages replacements and attempts rollback on ordinary write errors.
Multi-file replacement is not crash-atomic; a crash, concurrent modification,
or rollback failure may require `/reindex-projet`. Run with exclusive access
to the index and project tree. Symlink checks do not protect against a hostile
concurrent filesystem race. Project files themselves are never deleted.

## Related commands

- `/reindex-projet`: regenerate all indexes.
- `/analyse-aikido`: verify general Memory Bank coherence.
- `/maj-aikido`: update AI-KIDO.
