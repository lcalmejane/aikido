# Migration Plan V1.3.1.0 – Historical Command-System Migration

> **Status: BLOCKED — historical reference only. Do not execute.**
> The former procedure included unsafe file moves, generated wrapper writes,
> malformed instructions, shared temporary paths, and calls to tools or scripts
> that may not exist. It does not authorize direct hard-point replacement.

## Historical objective

The original proposal moved command implementations from `.roo/commands/` to
`prompts/hard_points/commands/` and added Roo and Claude mapping files.

## Blocking findings

- The procedure did not define a reviewed command inventory or collision policy.
- It proposed bulk moves and generated mapping content without validating the
  target paths, existing files, or backups.
- Reference replacement was not constrained to an explicit file allowlist.
- The referenced source-validation and migration utilities are not maintained.

## Safe disposition

Do not run this historical plan. For managed installations, use the packaged
Node update planner and review its concrete plan before applying. Any future
migration must use supported Node.js CLI engines, exclusive backups, an
explicit path allowlist, and host-reviewed changes; no shell fragment from the
historical plan is executable.
