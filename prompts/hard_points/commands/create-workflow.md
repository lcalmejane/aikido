---
description: Create and register an immutable declarative AI-KIDO workflow version.
---

# /create-workflow

1. Define a `workflow/1` JSON file with a stable `id`, semantic `version`,
   `entryStepId`, terminal step IDs and reachable steps.
2. Use only step types `plan`, `dispatch`, `wait`, `verify` and `approve`.
   Transitions must be acyclic; include no inline JavaScript, shell, credentials
   or permissions.
3. Validate through the deterministic engine:
   `aikido task workflow register --file <private-json>`.
4. Show the resulting `id`, version and SHA-256 snapshot. A published version
   is immutable; changes require a new version.
5. Do not execute workflow hooks unless a host has registered and authorized
   the referenced module. Hook commands are bounded typed requests, not direct
   file writes.
