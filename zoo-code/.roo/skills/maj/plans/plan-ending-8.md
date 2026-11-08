# Plan Ending-8 – Mappings and Configuration Deployment from TARGET

> **Type**: ending | **Order**: 8 | **Blocking**: Runtime/write errors block;
> absent optional inputs and validation warnings do not.

## Objective and inputs

Copy approved mappings and supported root configuration from TARGET to SOURCE:
`.roo/commands/`, `.claude/commands/`, `.claude/agents/`, `AGENTS.md`,
`CLAUDE.md`, `commands_list.md`, `agents_list.md`, `skills_list.md`, and
optional `.roomodes`. Direction is TARGET → SOURCE. `README.md` is not copied.

Use the Node.js 24+ engine
`SOURCE/prompts/hard_points/system/maj/scripts/maj-node-migration.mjs`.
The host must use process calls with argument arrays and check each exit code;
do not use shell, pipelines, or generated wrappers.

## Phase 0 – Preflight

Using host filesystem APIs, verify SOURCE is an existing canonical,
non-symlink directory and the engine is a regular non-symlink file. If TARGET
is absent, report the plan skipped. If present, require a canonical,
non-symlink directory. Inspect only the supported mapping directories and root
allowlist to determine whether there is anything to deploy. If there are no
supported files, report a skip without modifying SOURCE. Node.js below v24,
unsafe paths, or inspection errors are blocking.

## Phases 1–3 – Deploy supported files

Invoke each operation separately and consume its count only after exit 0.
Any nonzero exit is a blocking deployment failure; report its exact diagnostic
and stop. The engine creates directories as needed, backs up an existing
destination before replacement, copies only supported files, and never deletes
unrelated files.

```text
node /canonical/source/prompts/hard_points/system/maj/scripts/maj-node-migration.mjs deploy-commands --quiet /canonical/target /canonical/source
node /canonical/source/prompts/hard_points/system/maj/scripts/maj-node-migration.mjs deploy-agents --quiet /canonical/target /canonical/source
node /canonical/source/prompts/hard_points/system/maj/scripts/maj-node-migration.mjs deploy-root-files --quiet /canonical/target /canonical/source
```

Destination backups use unique `.bak.<timestamp>` names. Inspect the backups
and deployed content; never overwrite a backup or infer transactionality across
the three operations.

## Phase 4 – Validate deployment

Validate expected names and bytes after all deployment calls. Exit 0 means the
validation completed; output is `PASSED` or `WARNINGS: N issue(s)`. Warnings
are non-blocking but must be reported. A nonzero exit means validation could
not complete and is blocking.

```text
node /canonical/source/prompts/hard_points/system/maj/scripts/maj-node-migration.mjs validate-deployment --quiet /canonical/target /canonical/source
```

## Phase 5 – Log

The host records SOURCE, TARGET, counts, validation result, and backup guidance
in a unique phase-8 log under `SOURCE/prompts/spec/logs/`. Pass the log text as
the Node process's stdin (not through a shell) to `write-log`. A nonzero exit
is blocking; accept the reported path only after exit 0.

```text
node /canonical/source/prompts/hard_points/system/maj/scripts/maj-node-migration.mjs write-log --quiet /canonical/source
```

## Outcome and limits

Missing optional files are skipped, validation warnings are reported, and no
unrelated SOURCE files are removed. Unsafe paths, old/missing Node, permission
problems, or IO failures stop the plan. Review the copied mappings, root files,
and unique backups before continuing.
