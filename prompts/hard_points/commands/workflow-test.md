---
description: Simulate a workflow/2 with stub agents and report coverage, branches and loop bounds.
---

# /workflow-test

Run `aikido task workflow test --file <f>` (or `workflow_test`). Report each path and
its end, uncovered states, stuck paths and the loop bound used. A workflow whose
report is not `complete` is not saved as `testing` or published. To run it for real,
launch a card with this workflow on a local or CLI Core Agent.
