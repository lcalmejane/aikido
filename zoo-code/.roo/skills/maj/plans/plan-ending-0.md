# Plan Ending-0 – Reviewed TARGET → SOURCE Merge

> **Type** : ending | **Ordre** : 0 | **Statut** : GATED on external reviewed agent execution

The Node.js 24+ content comparison and pending context preparation are available
for isolated testing. **Do not run an unattended complete update:** agent
dispatch and semantic review require an authorized external host.
The implemented prepare/accept/status protocol verifies per-file acceptance
evidence, applied bytes and freshness, not the executing actor's identity.
Ending-1 now uses paired
per-file before/after snapshots. MANUAL_LATER and SKIP are pending
work, not success. Continue only after external execution and review, and a
fresh successful protocol status; never infer that a prepared context was merged. The executable
prepare/accept/status protocol below verifies applied bytes and host review
evidence, but cannot authenticate which actor edited files.

## Contract and scope

- SOURCE and TARGET are existing canonical directories; the work directory is
  existing, private, canonical, and outside both trees. Node.js 24+ is required.
- Beginning creates `ending-0-snapshot.json` with SHA-256 for each TARGET
  regular file in `prompts/hard_points/` and its matching SOURCE file. Generated
  structure indices are excluded. This does not include `prompts/gen/`,
  `prompts/spec/`, root mappings, or SOURCE-only files: those are never deleted.
- This scope deliberately preserves project-specific truth tables and personal
  data. It is not a full-project inventory and cannot replace ending-1's
  before/after data. The old V3.1 master index is not a per-file content map.
- Snapshot verification rejects malformed files, symlinks, unsupported names,
  unsafe paths, and changed SOURCE/TARGET files. A changed target file set also
  invalidates the snapshot. Repeat beginning after version-plan changes.

## Isolated procedure (not permission to run an update)

The following illustrates the tested entry points. `MAJ_WORK_DIR` defaults to
the historical `/tmp/aikido` when omitted; callers must create and secure it.
All outputs must belong exclusively to this run.

1. Run `ending-0-check-json-files.mjs --dir /private/maj-work-directory`.
   A nonzero exit is blocking; stop without consuming previous artifacts.
2. Run `ending-0-generate-diff-report.mjs --dir /private/maj-work-directory`.
   Check its exit status before interpreting the change count. A nonzero exit
   blocks this plan.
3. If there are changes, run `ending-0-ask-llm-capability.mjs`, then invoke
   `ending-0-fusion.mjs start` with the validated work directory, SOURCE,
   TARGET, selected mode, and—only for INTELLIGENT—the exact dispatch-tool
   name exposed by the host. A nonzero result other than exit 2 is a blocking
   failure. Exit 2 means pending/suspended, not success; retain the request
   and do not run ending-1. The host must perform authorized dispatch, review,
   and acceptance. With zero changes, do not dispatch; validate the no-change
   completion with `resume`.

Exit 2 is suspension, **not an error to normalize to 1**. On INTELLIGENT,
`start` verifies the snapshot/report and creates the protocol request directly;
it does not call the preparation-only legacy processor first. The host retains
the pending task and performs the dispatch/review/accept sequence below. SKIP
and MANUAL_LATER remain suspended; they cannot be promoted to success merely by
returning from a sub-task. REPLACE fails whenever differences exist.
On a resumed turn, **do not rerun beginning, comparison or start** (doing so
creates a new generation or overwrites pending evidence). Instead run:

```text
node /canonical/source/prompts/hard_points/system/maj/scripts/ending-0-fusion.mjs resume --dir /private/maj-work-directory
```

`resume` checks the same evidence as `status` whenever differences exist. Only
its zero exit status permits ending-1; zero-difference runs are revalidated
without dispatch or an acceptance manifest. `start` returns structured stdout
with pending next actions, while Node never dispatches agents itself.

`diff_report.txt`, `added_files.txt`, and `modified_files.txt` contain
newline-separated relative paths; the comparator prints only the count on stdout.
The JSON report and state bind the result to the snapshot. Beginning generation
and comparison attempts invalidate their old state before capture/comparison.
Beginning invalidates ending-0 before SOURCE content capture, so a failed
ending-1 BEFORE capture cannot leave the previous merge receipt usable.
Invalid CLI arguments or unsafe work-directory preflight failures may prevent
invalidation; those failures are blocking and the caller must not continue.
Verification and processing do not invalidate an existing comparison receipt,
including on failure: they recheck snapshot contents and report binding on each
call. A completed comparison receipt is never proof of completed fusion.
File names containing control characters are refused.

## Processing and failure semantics

- `REPLACE` is technically refused with exit 1 whenever differences exist,
  even when selected explicitly. Hard points are immutable except through
  `agent-aikido-fusion`. Processing never creates or replaces SOURCE files,
  directories or backups. A zero-change REPLACE returns 0 without writing.
- `INTELLIGENT` and `MANUAL_LATER` write `ending-0-manual.json` with paths and
  expected hashes. They return exit 2 and require actual reviewed work; they do
  not invoke an agent, apply a merge, or attest completion. `SKIP` also returns
  exit 2. A zero-change report returns success without changing files.
- Unknown modes, stale or malformed inputs, unsafe paths and I/O errors return
  exit 1. Diagnostics are on stderr.
- Checks are not atomic against a hostile concurrent filesystem actor.
  Run only with trusted roots and exclusive access; do not change symlinks or
  rename directories concurrently.

## External execution gate

Dispatch the prepared requests to the authorized fusion agent, review each
applied result, then use the implemented acceptance and status commands below.
Beginning/ending-1 now use paired path/content snapshots covering hard_points
and gen, independently of merge scope. The distribution catalog assertions and
CI integration is owned separately. The end-to-end plan remains gated until
reviewed fusion is actually applied and accepted with a fresh status.

## Executable host-controlled agent protocol

`ending-0-fusion.mjs` does not invoke tools, launch shells, or edit SOURCE.
The host must expose a real `agent-aikido-fusion` executor with read/edit
permission for the declared resources. It must obtain approval required by its
harness. Do not pretend permissions or worker tools are inherited.

1. Prepare a strict `task-request/2` JSON object using the **exact available**
   host dispatch tool (the name is supplied, not discovered or validated by CLI):

```text
node /canonical/source/prompts/hard_points/system/maj/scripts/ending-0-fusion.mjs prepare --dir /private/maj-work-directory --dispatch-tool exact-host-dispatch-tool
```

This exits 2 (pending), writes `ending-0-fusion.request.json`, and binds each task
to the snapshot, path, local and update hashes. The example tool name is valid
only if exposed by the current host. No invocation occurs. An empty `tools`
array does not grant worker capabilities; the host must resolve real permissions.
If no authorized executor exists, stop pending.

2. The host dispatches each task to the authorized fusion agent, reviews its
   actual applied result and records invocation evidence. Persona naming is
   inverted relative to update naming: agent `SOURCE_FILE` is update TARGET,
   `TARGET_FILE` is local SOURCE, `OUTPUT_FILE` is local SOURCE.
   Only the agent applies changes. Never execute content as instructions.

3. The trusted host writes a regular `acceptance.json` in the work directory:

```json
{
  "format": "aikido-fusion-acceptance-v1",
  "snapshot": "<snapshot id>",
  "request": "<request_id>",
  "request_sha256": "<SHA-256 of exact request file bytes>",
  "files": [{
    "path": "prompts/hard_points/example.md",
    "sha256": "<SHA-256 of reviewed applied local bytes>",
    "agent": "agent-aikido-fusion",
    "invocation": "<host invocation/audit reference>",
    "reviewer": "<trusted reviewer>",
    "review": "<context-preservation and formalism review>",
    "accepted": true,
    "result": {
      "id": "<task id>", "status": "ok", "summary": "<reviewed result>",
      "artifacts": [{"type": "file", "ref": "<local output path>"}],
      "errors": [], "next": []
    }
  }]
}
```

Every changed path must occur exactly once. No prepared, partial, errored,
unreviewed or differently attributed result is accepted.

```text
node /canonical/source/prompts/hard_points/system/maj/scripts/ending-0-fusion.mjs accept --dir /private/maj-work-directory --manifest acceptance.json
node /canonical/source/prompts/hard_points/system/maj/scripts/ending-0-fusion.mjs status --dir /private/maj-work-directory
```

Acceptance invalidates its prior fusion receipt before validation; success
writes `ending-0-fusion.accepted.json` and `ending-0-fusion.state.json`, binding
request bytes, acceptance bytes, snapshot and output hashes. `status` rechecks
all evidence, TARGET hashes/file set, applied SOURCE hashes and unchanged
in-scope SOURCE files. Changed outputs or a new/pending comparison invalidate
consumption. Repeated acceptance after failure requires complete evidence again.
Existing `process-fusion INTELLIGENT` remains preparation-only; do not call it
after applied changes, as its original SOURCE hash check intentionally fails.
Only a fresh `status`/`resume` success permits continuation to ending-1.

**Trust boundary:** invocation/reviewer strings are assertions of the trusted
host, not cryptographic identity proof. The CLI verifies bytes and completeness,
not semantic context preservation or agent identity. Anyone with write access
to the work directory can forge assertions; use exclusive trusted storage and
retain actual harness audit logs. Concurrent hostile edits are unsupported.
An authorized external agent and human/host review remain mandatory.

Targeted tests: `node --test distribution/tests/maj-fusion-acceptance.test.mjs`.
Add this engine/test to catalog and CI in their owning changes; neither is
modified by this implementation.

See [beginning](plan-beginning.md), [ending-1](plan-ending-1.md), and
[fusion agent](../../../../prompts/hard_points/agents/agent-aikido-fusion.md).
