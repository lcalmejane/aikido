---
description: Change a workflow/2 from a request, a diagram edit or a JSON edit, through a validated diff.
---

# /workflow-edit

Apply the [aikido-workflow skill](../system/aikido-workflow/SKILL.md).

1. Read the current `.workflow.md`. Diagram edited → `sync`; JSON edited → `render`.
2. A request in words becomes value proposals checked by `propose` (`workflow_understand`).
3. Show the diff (`diff --against` the saved version) and apply only after agreement.
4. Run `test`, then save the next version; a published version is never edited in place.
