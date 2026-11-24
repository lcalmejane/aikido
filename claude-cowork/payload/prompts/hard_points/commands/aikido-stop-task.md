---
description: Stop a running private task, on the Core Agent when it runs there.
---

# /aikido-stop-task

Run `aikido task stop <id>`. The card is routed to where it lives: a Core Agent card is paused and its active job is cancelled; a local card is paused. Work already done is not undone. Resume later with `aikido task resume <id>`.
