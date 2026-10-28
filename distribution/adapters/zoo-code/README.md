# AI-KIDO for Zoo Code

The Zoo Code package adds AI-KIDO commands, agent modes, and the shared
project Memory Bank. Choose this package or the Roo Code package for a project;
both use the same command and mode paths.

## Install into a project

Preview the bootstrap plan from the project directory:

```bash
node /path/to/zoo-code-package/scripts/bootstrap-plan.mjs \
  --root "$PWD" --package /path/to/zoo-code-package --mode STANDARD
```

Review the listed files and apply the plan using its returned ID:

```bash
node /path/to/zoo-code-package/scripts/bootstrap-plan.mjs \
  --root "$PWD" --package /path/to/zoo-code-package --mode STANDARD \
  --apply --confirm <plan-id>
```

Use `LIGHT` or `UNSET` for another project entry point. Review the plan's
`.roomodes` entry if the project already uses custom modes.

## Use in Zoo Code

Type `/` and select an AI-KIDO command, such as `/init-aikido` or
`/maj-aikido`. Select an AI-KIDO custom mode from the mode picker to use an
agent persona.

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
