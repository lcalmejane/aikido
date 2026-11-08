# Plan Ending-3 – General Index Update

> **Type**: ending | **Order**: 3 | **Blocking**: YES

## Objective and inputs

Generate or update the unified `/prompts/index.md` and, for MULTI projects,
each `/prompts/{project}/index.md`. Inputs are canonical `SOURCE`,
`PROJECT_TYPE` (`MONO` or `MULTI`), and for MULTI an explicit list of project
directory names. The engine does not read the ending-1 report or TARGET.

All former shell entry points were removed. Node.js 24+ is required. The host
must invoke the engine using a process API with an argument array, not through
a shell. Never infer success from output: check each process exit status.

## Phase 0 – Runtime and project type

Confirm Node.js is version 24 or newer. Check SOURCE and the engine
`SOURCE/prompts/hard_points/system/maj/scripts/maj-node-migration.mjs` as
existing regular non-symlink paths using host filesystem APIs. Missing/unsafe
paths block the plan.

If `PROJECT_TYPE` is absent, invoke the detector with explicit SOURCE and use
its first stdout line only after exit 0. Nonzero detection reports the engine
diagnostic and blocks. Reject any type other than MONO/MULTI before writing.

```text
node /canonical/source/prompts/hard_points/system/maj/scripts/detect-project-type.mjs detect /canonical/source
```

## Phase 1 – Generate indexes

For MONO, run the direct command below. For MULTI, require a nonempty,
distinct list of safe single-component project names and pass each name as an
individual argument in the process argument array. On any nonzero exit,
report the exact engine error/code and stop; do not continue to validation.

```text
node /canonical/source/prompts/hard_points/system/maj/scripts/maj-node-migration.mjs generate-mono /canonical/source
node /canonical/source/prompts/hard_points/system/maj/scripts/maj-node-migration.mjs generate-multi /canonical/source project-one project-two
```

The engine regenerates the known V1.3 templates. Before replacing changed
content it creates unique sibling backups; identical content remains untouched.
Backup failure blocks replacement. MULTI writes the global index and each
requested project index; multiple replacements are not transactional, so
review all results and restore only from the created backups if needed.

## Phase 2 – Validate

After generation succeeds, invoke validation with the same type and project
names. A nonzero exit is blocking and its diagnostics identify the invalid or
missing index. Do not report the plan as successful until validation returns 0.

```text
node /canonical/source/prompts/hard_points/system/maj/scripts/maj-node-migration.mjs validate-indexes /canonical/source MONO
node /canonical/source/prompts/hard_points/system/maj/scripts/maj-node-migration.mjs validate-indexes /canonical/source MULTI project-one project-two
```

## Outputs and limits

- MONO: `$SOURCE/prompts/index.md`.
- MULTI: `$SOURCE/prompts/index.md` plus one index for every supplied project.
- Validation checks regular non-symlink files, expected mode markers, project
  indexes, and their links from the global index.
- The engine preserves changed originals before replacement. Template
  regeneration can discard custom index text; inspect backups and the generated
  result. This plan does not merge or delete project content.

Continue only after successful validation. A missing Node runtime, unsafe
SOURCE/engine, invalid project name, failed backup, write failure, or failed
validation blocks the plan.
