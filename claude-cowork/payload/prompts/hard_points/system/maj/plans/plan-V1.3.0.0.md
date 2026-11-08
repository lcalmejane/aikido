# Migration Plan V1.3.0.0 – Historical Entry-Point Migration

> **Status: BLOCKED — historical reference only. Do not execute.**
> The described migration is unsafe and its former external scripts are not
> maintained. It allowed unbounded reference replacement and omitted the
> required reviewed Node update-planner flow. No equivalence or authorization
> to reproduce its steps is claimed.

## Historical objective

The original proposal moved the primary entry point from
`prompts/gen/index.md` to `prompts/index.md`, updated references, preserved the
old index, and ran structure validation.

## Blocking findings

- The old procedure referenced missing validation, comparison, synchronization,
  merge, and reporting scripts.
- It proposed broad edits across project files without an explicit allowlist or
  reviewed per-file change set.
- It did not safely establish source provenance, backup ownership, or a
  transactional rollback.
- The current structure validator may still require
  `prompts/gen/index.md`; removing or replacing it is not approved by this plan.

## Safe disposition

Do not run this historical plan. For managed installations, use the packaged
Node update planner, inspect its proposed paths and changes, obtain approval,
and validate backups and results before applying. For other projects, create a
new scoped plan with explicit Node CLI operations and host-controlled review.
