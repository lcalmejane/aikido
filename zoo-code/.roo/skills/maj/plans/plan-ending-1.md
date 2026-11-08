# Plan Ending-1 – Per-file Post-update Change Detection

> **Type** : ending | **Ordre** : 1 | **Bloquant** : OUI for capture and freshness errors

Compare SOURCE content before and after update. This plan does not generate or
read structure master indexes and does not call the index generator.

## Inputs and contract

- Node.js 24+, canonical SOURCE and an existing private work directory outside
  the project, used exclusively by this run (`MAJ_WORK_DIR`).
- `maj_before.json` comes from [beginning](plan-beginning.md).
- Both snapshots have the shape
  `{format:"aikido-maj-content-v1",phase:"before"|"after",run:uuid,
  root:canonicalSOURCE,files:{relativePath:{sha256:hex64,size_bytes:integer}}}`.
  AFTER retains BEFORE's run UUID and SOURCE; mismatches fail comparison.
- Scope: SOURCE regular files under `prompts/hard_points/` and `prompts/gen/`.
  Exclude `prompts/spec/`, directories named `backups`, names containing `.bak`,
  archives ending `.tgz`, `.tar`, `.tar.gz`, staging files ending `.tmp` or
  `.partial`, names beginning `.ending-0-`/`.ending-1-`, and structure-generated
  `prompts/hard_points/system/structure/index.json` and `indices/`.
- Missing selected subtrees are empty. Selected symlinks, nonregular files,
  control characters, backslashes, non-UTF-8 names and unsafe paths fail closed.
  Captures rescan the file set and recheck each content hash before publishing.
  Same-size changes are detected; timestamps are not compared.

## Execution

Do not run until the preceding update/fusion gate permits continuation.
The default work directory is historical `/tmp/aikido` when omitted. Use the
same explicit directory for beginning and every ending-1/ending-2 call.

1. Run the before-snapshot prerequisite check. Stop if it fails or does not
   return `NO_SKIP`; rerun beginning before any update in that case.
2. Capture the AFTER snapshot using the explicit SOURCE and the same work
   directory. Stop on any nonzero exit.
3. Compare the paired snapshots. A nonzero exit invalidates the old report and
   blocks continuation.
4. Read the statistics output only after exit 0. Do not treat unavailable
   output as zero changes.

The corresponding Node CLI calls are:

```text
node /canonical/source/prompts/hard_points/system/maj/scripts/ending-1-workflow.mjs check-before --dir /private/maj-work-directory
node /canonical/source/prompts/hard_points/system/maj/scripts/ending-1-workflow.mjs generate-after /canonical/source --dir /private/maj-work-directory
node /canonical/source/prompts/hard_points/system/maj/scripts/ending-1-compare-structures.mjs --dir /private/maj-work-directory
node /canonical/source/prompts/hard_points/system/maj/scripts/ending-1-workflow.mjs statistics --dir /private/maj-work-directory
```

Shell wrappers retain their names and executable permissions; the historical
`generate-after` name now means content capture, not index generation.
Only counters/status appear on stdout for status/statistics entry points.
`check-before` invalidates the receipt and reports file presence; AFTER capture
validates the snapshot schema and SOURCE pairing before use.

## Outputs and anti-stale receipts

- `maj_after.json`: paired AFTER snapshot.
- `maj_diff.json`: `{path:{before:fingerprint|null,after:fingerprint|null}}`.
  Additions have `before:null`, deletions `after:null`; modified entries carry
  both fingerprints. Unchanged entries and snapshot metadata are not reported.
- `maj_diff.state.json`: version-1 receipt with run, status and SHA-256 of the
  exact bytes of `maj_before.json`, `maj_after.json` and `maj_diff.json`.
- Each beginning, prerequisite check, AFTER capture or comparison attempt
  invalidates the previous receipt before reading/capturing inputs. Failures
  retain existing reports but never validate them. Comparison alone completes
  the receipt. Ending-2 verifies all three hashes on every consumption and
  accepts the unchanged before/after report contract.
- V3.1 master indexes are rejected. The comparator's historical generic-object
  library compatibility remains available for existing callers/tests; production
  AFTER generation accepts only the new typed BEFORE snapshot.

## Safety and limits

Successful capture/comparison returns 0; missing, malformed or mismatched
snapshots, unsafe outputs, changed files and operational errors return 1.
Work-directory symlinks and symlinked snapshot/report destinations are refused.
An invalidation failure is blocking; never continue with a previous receipt.
Unavailability is not zero changes.

Filesystem checks are not an atomic transaction against concurrent hostile
renames or ABA edits. Use trusted roots and exclusive access; stop on detected
concurrent changes. The fingerprints cover file bytes, not permissions or empty
directories. Archival-looking files matching exclusions are intentionally absent.
No project files or real index outputs are modified by this plan.

## Verification and integration

Run isolated tests (fixtures are created in the OS temporary directory, then removed):

```text
node --test distribution/tests/maj-content-roundtrip.test.mjs distribution/tests/maj-ending.test.mjs distribution/tests/maj-ending-0-content.test.mjs distribution/tests/maj-fusion-mode.test.mjs
```

The distribution catalog tests and CI include the content engine and tests.
No release is claimed until new engines are included in the tracked payload.
Continue to [ending-2](plan-ending-2.md) only with a fresh
completed receipt. The reviewed intelligent-fusion gate in
[ending-0](plan-ending-0.md) is independent and still applies.
