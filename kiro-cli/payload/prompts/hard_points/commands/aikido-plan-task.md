---
description: Create and instantiate a private task plan against a versioned workflow.
---

# /aikido-plan-task

1. Save the user-approved plan as a private JSON input file, outside Git and the
   Memory Bank. Keep prompt text and references scoped to the authorized user
   and workspace.
2. Create it with `aikido task plan create --file <private-json>`, or invoke
   the installed Task Store Skill's `task.mjs` with Node 24 when the npm CLI is
   unavailable. Select `automatic`, `analysis` or `implementation` as appropriate.
3. Show the plan and its pinned workflow ID/version/hash before instantiation.
4. After authorization, run `aikido task plan instantiate <plan-id>`. The engine
   validates task links as a DAG and returns stable task IDs.
5. Never start a worker from plan creation alone. Dispatch requires the
   selected authenticated host; AI-KIDO provides no dispatcher or scheduler.
