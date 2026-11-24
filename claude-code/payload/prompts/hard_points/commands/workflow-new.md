---
description: Create a workflow/2 draft, check it and save it as a new workflow.
---

# /workflow-new

Apply the [aikido-workflow skill](../system/aikido-workflow/SKILL.md).

1. Ask for the goal, the steps, who works on each (agent or human) and how it ends.
2. Write the JSON block (`publication: draft`, version `1.0.0`), then `render` it.
3. Run `validate` and `test`; fix until `complete: true`.
4. Show the diagram, then save with `aikido task workflow save` (or `workflow_save`).
