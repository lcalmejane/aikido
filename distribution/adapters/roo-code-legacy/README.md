# AI-KIDO for Roo Code

Use this package to add AI-KIDO to an existing Roo Code project. For a project
using Zoo Code, use the [Zoo Code package](../zoo-code/README.md). Select only
one package per project because both use the same command and mode paths.

## Install into a project

Preview the bootstrap plan:

```bash
node /path/to/roo-code-package/scripts/bootstrap-plan.mjs \
  --root "$PWD" --package /path/to/roo-code-package --mode STANDARD
```

Review the plan and apply it using its returned ID:

```bash
node /path/to/roo-code-package/scripts/bootstrap-plan.mjs \
  --root "$PWD" --package /path/to/roo-code-package --mode STANDARD \
  --apply --confirm <plan-id>
```

If the project already has a `.roomodes` file, review that planned change
before applying it.

## Use in Roo Code

Invoke commands as `/name` from `.roo/commands/`, such as `/init-aikido`.
Select AI-KIDO personas as custom modes in `.roomodes`.

## Update or remove

Use `scripts/update-plan.mjs` from the package version you want to install to
preview an update, then apply the reviewed plan with
`--apply --confirm <plan-id>`. To remove AI-KIDO integration files while
retaining project knowledge, preview and confirm an uninstall. The shared
`.roomodes` file is kept; remove AI-KIDO modes from it after reviewing the
file.
