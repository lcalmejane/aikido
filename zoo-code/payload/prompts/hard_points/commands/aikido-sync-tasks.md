---
description: Move waiting local cards to the Core Agent.
---

# /aikido-sync-tasks

Run `aikido task host status`, then ask the user to confirm and run `aikido task sync --confirm`. Waiting local cards are created on the Core Agent and cancelled locally. Running the command twice creates no duplicate.
