---
description: Publish a tested workflow/2 version to the project's Core Agent, after confirmation.
---

# /workflow-publish

1. Check `validate` and `test` (`complete: true`) on the exact version to publish.
2. Show id, version, SHA-256 and the diff against the published version.
3. Publishing reaches every project member: ask for confirmation, then save the
   version with `publication: published` on the remote Core Agent. Never overwrite a
   published version.
