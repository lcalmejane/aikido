# AI-KIDO for Kiro CLI

The Kiro CLI package adds AI-KIDO command Skills, system Skills, custom agents,
and the shared project Memory Bank.

## Install into a project

Preview the bootstrap plan from the project directory:

```bash
node /path/to/aikido-package/scripts/bootstrap-plan.mjs \
  --root "$PWD" --package /path/to/aikido-package --mode STANDARD
```

Review the plan and apply it using its returned ID:

```bash
node /path/to/aikido-package/scripts/bootstrap-plan.mjs \
  --root "$PWD" --package /path/to/aikido-package --mode STANDARD \
  --apply --confirm <plan-id>
```

Use `LIGHT` or `UNSET` to choose another project entry point. The bootstrap
plan lists the project files that will be installed.

## Use in Kiro CLI

Type `/` and select an AI-KIDO Skill, or invoke a command directly, for
example `/init-aikido`, `/maj-aikido`, or `/list-command`. System Skills and
custom agents are available from the project.

The bootstrap adds a managed AI-KIDO instruction block to `AGENTS.md`, the
shared project entry point used by the adapter.

## Update or remove

Use `scripts/update-plan.mjs` from the package version you want to install to
preview an update. Review the plan and confirm it with
`--apply --confirm <plan-id>`. Add `--migrate` for a project without an
AI-KIDO lock.

To remove AI-KIDO integration files while retaining project knowledge, preview
and confirm an uninstall:

```bash
node /path/to/aikido-package/scripts/update-plan.mjs --root "$PWD" --uninstall
node /path/to/aikido-package/scripts/update-plan.mjs \
  --root "$PWD" --uninstall --apply --confirm <plan-id>
```

Official references:

- [Kiro CLI](https://kiro.dev/docs/cli/)
- [Skills](https://kiro.dev/docs/skills/)
- [Custom agents](https://kiro.dev/docs/custom-agents/)
- [Sub-agents](https://kiro.dev/docs/custom-agents/subagents/)
- [Steering](https://kiro.dev/docs/steering/)
- [Permissions](https://kiro.dev/docs/permissions/)
