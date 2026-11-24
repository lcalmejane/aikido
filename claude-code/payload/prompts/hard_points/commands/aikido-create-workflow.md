---
description: Create and register an immutable declarative AI-KIDO workflow version.
---

# /aikido-create-workflow

1. Define a `workflow/2` definition (a `.workflow.md` file or its JSON block) with a
   stable `id`, semantic `version`, an `entry` state and reachable states ending on a
   `terminal` state. A draft for the Core Agent lists ordered steps typed `plan`,
   `dispatch` (exactly one), `verify`, `approve` or `wait`; it becomes a Full Auto
   workflow, or one with approval when it has an `approve` step.
2. Use only state types `task`, `choice`, `parallel`, `wait`, `approval` and
   `terminal`. Every loop is bounded (`limits.maxAttempts` or a choice leaving it);
   include no inline JavaScript, shell, credentials or permissions.
3. Save through the deterministic command, which uses Tatami Core Agent when it
   is present and the knowledge base otherwise:
   `aikido task workflow save --file <draft-json>`. Check the route with
   `aikido task host status`.
4. Show the resulting `id`, version and SHA-256 snapshot. A published version
   is immutable; changes require a new version.
5. Do not execute workflow hooks unless a host has registered and authorized
   the referenced module. Hook commands are bounded typed requests, not direct
   file writes.
