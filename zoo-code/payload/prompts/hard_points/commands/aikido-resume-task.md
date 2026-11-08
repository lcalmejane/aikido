---
description: Resume a waiting task with a revision-checked state change.
---

# /aikido-resume-task

1. Read the task and verify its current revision, waiting reason, dependencies,
   actor scope, route and any outstanding approval.
2. For ordinary waits, run `aikido task resume <id> --revision <n>` (or the
   installed Task Store Skill's `task.mjs` with Node 24). For a rejection,
   require explicit reviewer acknowledgement:
   `aikido task resume <id> --revision <n> --acknowledge-rejection`.
3. Resuming changes the card to `ready`; it does not dispatch or guarantee a
   wakeup. The authenticated selected host must separately authorize and
   dispatch it; AI-KIDO has no resident scheduler.
4. If a prior attempt has unknown effects, reconcile those effects before
   creating a new attempt. Retries are new attempts on the same task.
