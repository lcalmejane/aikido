# AI-KIDO for Roo Code (legacy)

This package preserves a separate, best-effort target for existing Roo Code
workspaces. Roo Code's project development was wound down; Zoo Code is the
maintained fork and the recommended target for new installations. The generated
`.roo/commands/` and `.roomodes` formats are based on the archived Roo Code
documentation and are not a claim of current Roo Code support.
Choose this package **or** the Zoo Code package for a workspace; both write the
same `.roo/commands/` and `.roomodes` paths and are not co-installable.

## Install into a project

Preview the package bootstrap before applying it:

```bash
node /path/to/roo-code-legacy-package/scripts/bootstrap-plan.mjs \
  --root "$PWD" --package /path/to/roo-code-legacy-package --mode STANDARD
```

Review the plan and use the returned ID to apply. An existing `.roomodes` file
causes an explicit conflict rather than being replaced. Back it up and merge
its `customModes` manually before retrying.

```bash
node /path/to/roo-code-legacy-package/scripts/bootstrap-plan.mjs \
  --root "$PWD" --package /path/to/roo-code-legacy-package --mode STANDARD \
  --apply --confirm <plan-id>
```

Commands are exposed as `/name` from `.roo/commands/<name>.md`; agent personas
are custom modes in `.roomodes`. The adapter does not alter `.roo/mcp.json`,
`.roo/rules/`, global settings, or approval policies. Uninstall preserves the
shared `.roomodes` file; back it up and remove the AI-KIDO modes manually.

## Qualification

This legacy package is generated and statically checked separately from
Zoo Code. Roo Code has no native end-to-end recipe here. Prefer Zoo Code for
new projects, and do not infer that a successful Zoo Code test validates Roo.

Archived reference:

- [Roo Code custom modes (archived documentation)](https://roocodeinc.github.io/Roo-Code/features/custom-modes/)
- [Zoo Code migration guide](https://docs.zoocode.dev/roo-to-zoo-migration)
