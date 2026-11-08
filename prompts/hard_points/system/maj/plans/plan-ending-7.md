# Plan Ending-7 – Gap Population Proposal

> **Type**: ending | **Order**: 7 | **Blocking**: NO

## Objective

Detect gaps in the Memory Bank and, when needed, prepare a proposal for
`agent-aikido-bank-populate`. This phase is informational and does not populate
or overwrite files. A validation report from ending-6 is optional context only.

## Phase 1 – Detect gaps

Invoke the Node engine with explicit SOURCE and consume counts only on exit 0.
Stdout is `missing-directories missing-files`; missing paths are reported on
stderr. A nonzero exit means the gap status is unknown, not zero.

```text
node /canonical/source/prompts/hard_points/system/maj/scripts/ending-7-gaps.mjs detect /canonical/source
```

## Phase 2 – Prepare a proposal

If either count is positive, pass both counts and SOURCE to the proposal
operation. The engine returns `agent`, `manual`, or `none` context. It does not
invoke the agent or apply changes. The host may dispatch the authorized
population agent with the returned context; review its proposal and obtain
required approval before any file writes. If counts are unavailable or
proposal preparation fails, report a warning and do not infer zero gaps.

```text
node /canonical/source/prompts/hard_points/system/maj/scripts/ending-7-gaps.mjs propose /canonical/source 2 3
```

The private context is created by the engine in an OS-managed temporary
location. Do not copy it to a shared directory or treat its existence as
approval to populate.

## Phase 3 – Log and continue

The host records known/unknown gap counts and proposal status in a unique log
under `SOURCE/prompts/spec/logs/` using `create-log.mjs`. Logging failures are
reported but do not block the workflow. Continue only to another applicable
approved plan; gap analysis alone does not mean the update is complete.
