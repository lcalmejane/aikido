---
description: Import an existing AI-KIDO analysis or code-search plan into the private Task Store without changing its source.
---

# /aikido-import-plan

Use the deterministic Task Store adapter to preserve an existing historical
Markdown plan as one private analysis plan. Supported sources are files named
`plan.md`, `plan-*.md` under the canonical analysis or search plan directories.
Unsupported formats and structures receive an explicit diagnostic; never infer,
rewrite, split, or discard plan sections.

1. Preview using the workspace-relative source path:
   `node <task-store-dir>/task.mjs plan import --source <path> --workspace <workspace>`
   The preview reports the source SHA-256, kind, and pinned workflow snapshot,
   but never includes private prompt content.
2. Show that preview to the user. Create only after separate, explicit user
   approval, by repeating the command with `--confirm-create
   --expected-sha256 <reviewed-source-hash>
   --expected-workflow-sha256 <reviewed-workflow-hash>`. The adapter verifies
   both hashes again; if either changed, preview again and request approval for
   the new source and workflow pin.
3. Show the resulting private plan and its workflow pin. Instantiate only after
   separate, explicit user approval:
   `node <task-store-dir>/task.mjs plan import --plan-id <id> --revision <reviewed-revision> --confirm-instantiate --workspace <workspace>`
4. Instantiation creates backlog task cards only. It never dispatches, schedules,
   or starts a worker. Dispatch requires a separate explicit request through the
   authenticated host integration.

The default workflow is `analysis@1.0.0` for both source kinds. A user may select
a different already-registered immutable workflow with `--workflow` and
`--workflow-version`. Source files remain in Git unchanged; the private plan
stores their exact content and SHA-256 provenance.
