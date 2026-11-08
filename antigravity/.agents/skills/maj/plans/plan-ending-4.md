# Plan Ending-4 – Project Structure Validation

> **Type**: ending | **Order**: 4 | **Blocking**: YES

## Objective and inputs

Validate SOURCE structure using Node.js 24+ engines. Inputs are canonical
`SOURCE` and `PROJECT_TYPE` (`MONO` or `MULTI`), normally established by
beginning/ending-3. The optional ending-2 summary is informational only.

All commands below are direct Node invocations. The host must pass arguments
as an array, retain each exit status, and never rely on shell variables or
generated wrappers. If the type is absent, detect it against SOURCE; if the
detector fails, report its error and stop. Reject an invalid type before
validation.

```text
node /canonical/source/prompts/hard_points/system/maj/scripts/detect-project-type.mjs detect /canonical/source
```

## Phase 1 – Run validation

Run the Node validation wrapper with explicit SOURCE and type. It resolves the
validator from SOURCE, runs `validate-structure.mjs` as a child Node process,
and propagates its status: 0 is success; 1 indicates structural validation
failure; 2 indicates invalid invocation or operational error. Capture and
retain the original status and diagnostics.

```text
node /canonical/source/prompts/hard_points/system/maj/scripts/ending-4-run-validation.mjs /canonical/source MONO
```

## Phase 2 – Diagnose failures

Only if validation failed, run the detailed structure diagnostic with the same
SOURCE and type. A diagnostic failure is a warning; it must not overwrite or
clear the original validation failure.

```text
node /canonical/source/prompts/hard_points/system/maj/scripts/ending-4-diagnostic-structure.mjs /canonical/source MONO
```

## Phase 3 – Log and gate

The host records project type, SOURCE, original validation status/code, and
the validator path in a uniquely named file under
`SOURCE/prompts/spec/logs/`, using `create-log.mjs`. Logging is best effort;
report its failure without changing the validation result.

```text
node /canonical/source/prompts/hard_points/system/maj/scripts/create-log.mjs /canonical/source/prompts/spec/logs/phase-4-unique.log "Plan Ending-4 : Structure Validation" "Project type: MONO; Status: SUCCESS; Exit code: 0"
```

Only exit 0 from validation permits continuation to ending-5. On failure,
stop the workflow after diagnosis/logging, report the exact error, and
recommend repairing missing paths or regenerating indexes through ending-3.
Never report a failed validation as successful because diagnosis or logging
completed.
