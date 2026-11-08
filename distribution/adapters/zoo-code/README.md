# AI-KIDO for Zoo Code

The Zoo Code package adds AI-KIDO commands, agent modes, and the shared
project Memory Bank. Choose this package or the Roo Code package for a project;
both use the same command and mode paths.

## Install into a project

Preview the bootstrap plan from the project directory:

```text
node /path/to/zoo-code-package/scripts/bootstrap-plan.mjs  --root /path/to/project --package /path/to/zoo-code-package --mode STANDARD
```

Review the listed files and apply the plan using its returned ID:

```text
node /path/to/zoo-code-package/scripts/bootstrap-plan.mjs  --root /path/to/project --package /path/to/zoo-code-package --mode STANDARD  --apply --confirm <plan-id>
```

Use `LIGHT` or `UNSET` for another project entry point. Review the plan's
`.roomodes` entry if the project already uses custom modes.

## Use in Zoo Code

Type `/` and select an AI-KIDO command, such as `/init-aikido` or
`/maj-aikido`. Select an AI-KIDO custom mode from the mode picker to use an
agent persona.

If `rtk --version` succeeds during installation or update, AI-KIDO sets the
local `rtk` flag to `ON` in `.aikido/state/features.json` and installs
`.roo/rules/rtk.md`. `/check-cli` refreshes this flag from the current host;
the feature-state file is local and ignored by Git. Zoo Code has no RTK-native
command-rewrite hook, so this rule only instructs agents to use the RTK CLI.

## Update or remove

Use `scripts/update-plan.mjs` from the package version you want to install to
preview an update. Review and confirm the plan with
`--apply --confirm <plan-id>`. To remove the AI-KIDO integration while
retaining project knowledge, preview and confirm an uninstall. The shared
`.roomodes` file is kept; remove the AI-KIDO entries from it after reviewing
the file.

Official references:

- [Zoo Code custom modes](https://docs.zoocode.dev/features/custom-modes)
- [Zoo Code slash commands](https://docs.zoocode.dev/features/slash-commands)
- [Zoo Code custom instructions](https://docs.zoocode.dev/features/custom-instructions)
