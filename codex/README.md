# AI-KIDO for Codex CLI and IDE

The Codex package adds project-scoped Skills, custom agents, and the shared
AI-KIDO Memory Bank. It does not change user-level Codex settings.

## Install into a project

Keep the package outside the target project. Preview the bootstrap plan:

```bash
node /path/to/codex-package/scripts/bootstrap-plan.mjs \
  --root /path/to/project --package /path/to/codex-package --mode STANDARD
```

Review the plan and apply it using its exact `planId`:

```bash
node /path/to/codex-package/scripts/bootstrap-plan.mjs \
  --root /path/to/project --package /path/to/codex-package --mode STANDARD \
  --apply --confirm <plan-id>
```

`LIGHT` and `UNSET` are also supported. Existing project instructions and
customizations are included in the plan for review.

## Use in Codex

Open the installed project in Codex and start a new session. In the CLI, use
`/skills` or type `$` to select an AI-KIDO Skill, such as `$list-command`,
`$analyse-project`, or `$init-aikido`. Ask Codex to use a named AI-KIDO custom
agent when a task needs one.

In the IDE, open the same installed project and select its Skills and agents
from the Codex chat interface. Set the desired permission mode in Codex before
requesting file changes.

## Update or remove

Use `scripts/update-plan.mjs` from the package version you want to install.
Review the plan and resolve any choices before applying it with
`--apply --confirm <plan-id>`. Add `--migrate` to bring a project without an
AI-KIDO lock under management.

To remove AI-KIDO integration files while retaining the project's Memory Bank,
preview and confirm an uninstall:

```bash
node /path/to/codex-package/scripts/update-plan.mjs --root /path/to/project --uninstall
node /path/to/codex-package/scripts/update-plan.mjs \
  --root /path/to/project --uninstall --apply --confirm <plan-id>
```

Official references:

- [Codex Skills](https://developers.openai.com/codex/skills)
- [Codex subagents](https://developers.openai.com/codex/subagents)
- [AGENTS.md instructions](https://developers.openai.com/codex/guides/agents-md)
- [Codex IDE](https://developers.openai.com/codex/ide/features)
