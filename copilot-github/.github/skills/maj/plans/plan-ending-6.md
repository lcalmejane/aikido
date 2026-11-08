# Plan Ending-6 – Final AI-KIDO Compliance Validation

> **Type**: ending | **Order**: 6 | **Blocking**: NO

## Objective

Prepare compliance validation by `agent-aikido-validator`, analyze its
run-specific result, and log the outcome. The Node engines never invoke an
agent; the host retains responsibility for dispatch, review, and authorization.

## Phase 1 – Prepare and inspect

Run `ending-6-validation.mjs list SOURCE` to identify critical paths. A
nonzero exit is reported as a warning. Then prepare the validation context:

```text
node /canonical/source/prompts/hard_points/system/maj/scripts/ending-6-validation.mjs prepare /canonical/source
```

Exit 0 returns a unique private directory path. A nonzero exit means status
`UNKNOWN`; retain that status and do not reuse any earlier report. If the
engine returns `MANUAL`, leave the outcome as manual. Otherwise, the host
dispatches the authorized validator using that run's `context.md`, waits for
completion, and reviews its result.

## Phase 2 – Analyze and log

After host dispatch completes, analyze only the report in the returned run
directory. Preserve `UNKNOWN` on an engine failure, and preserve `MANUAL` when
no dispatch was possible. Recognized outcomes are `OK`, `KO`, `UNKNOWN`, and
`MANUAL`.

```text
node /canonical/source/prompts/hard_points/system/maj/scripts/ending-6-validation.mjs analyze /private/validation-run-directory
```

The host records the outcome and validation directory/mode using
`create-log.mjs` at a unique path under `SOURCE/prompts/spec/logs/`. Log failure
is a warning and does not change the result.

```text
node /canonical/source/prompts/hard_points/system/maj/scripts/create-log.mjs /canonical/source/prompts/spec/logs/phase-6-unique.log "Plan Ending-6 : Final Compliance Validation" "Status: UNKNOWN; Validation directory or mode: MANUAL"
```

This phase is non-blocking. Missing or ambiguous reports remain `UNKNOWN`;
`KO` remains a detected failure and must not be reported as compliance.
