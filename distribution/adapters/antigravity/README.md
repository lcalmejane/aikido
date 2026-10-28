# AI-KIDO for Google Antigravity

The Antigravity package adds AI-KIDO command and system Skills, custom agents,
and the shared project Memory Bank.

## Install into a project

From the project directory, preview the bootstrap plan:

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

Use `LIGHT` or `UNSET` to choose another entry point. The bootstrap plan lists
the project files that will be installed.

## Use in Antigravity

Invoke a command Skill by slash name, such as `/init-aikido` or
`/list-command`. Select a custom agent in the agent picker or launch one from
the CLI with `agy --agent agent-aikido-validator`.

AI-KIDO agents use explicit tool selections, and shell actions use
Antigravity's configured command execution policy. Set the desired project
permissions in Antigravity before requesting changes.

## Update or remove

Use `scripts/update-plan.mjs` from the package version you want to install to
preview and review an update. Confirm the plan with
`--apply --confirm <plan-id>`. Add `--migrate` when the project has no
AI-KIDO lock.

To remove AI-KIDO integration files while preserving the project's Memory
Bank, preview and confirm an uninstall:

```bash
node /path/to/aikido-package/scripts/update-plan.mjs --root "$PWD" --uninstall
node /path/to/aikido-package/scripts/update-plan.mjs \
  --root "$PWD" --uninstall --apply --confirm <plan-id>
```

Official references:

- [Antigravity custom agents](https://antigravity.google/blog/introducing-custom-agents/)
- [Antigravity subagents](https://antigravity.google/docs/subagents/)
- [Antigravity Skills](https://antigravity.google/docs/skills/)
