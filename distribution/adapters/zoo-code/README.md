# AI-KIDO for Zoo Code

This is the primary adapter for the maintained Zoo Code project. It packages:

- AI-KIDO commands as native slash commands in `.roo/commands/<name>.md`.
- AI-KIDO agent prompts as custom modes in `.roomodes`.
- The shared AI-KIDO Memory Bank and bootstrap/update runtime.

Zoo Code documents the same `.roo/commands/` and `.roomodes` project formats
used by its Roo Code predecessor. This is a direct workspace adapter, not a
Zoo Code extension or Marketplace package.
Choose this package **or** the legacy Roo Code package for a workspace; both
write the same `.roo/commands/` and `.roomodes` paths and are not co-installable.

## Install into a project

Build/use a package pinned to an AI-KIDO commit. From the intended project,
preview the bootstrap:

```bash
node /path/to/zoo-code-package/scripts/bootstrap-plan.mjs \
  --root "$PWD" --package /path/to/zoo-code-package --mode STANDARD
```

Review every planned file and conflict. If `.roomodes` already exists, the
bootstrap reports a conflict instead of replacing or merging the shared file.
Back up and merge its `customModes` yourself before retrying. Apply a reviewed
plan with its returned ID:

```bash
node /path/to/zoo-code-package/scripts/bootstrap-plan.mjs \
  --root "$PWD" --package /path/to/zoo-code-package --mode STANDARD \
  --apply --confirm <plan-id>
```

Use `LIGHT` or `UNSET` to select another entry-point template.

## Use in Zoo Code

- Type `/` and select an AI-KIDO command, such as `/init-aikido` or
  `/maj-aikido`.
- Select an AI-KIDO custom mode from the mode picker for an agent persona.
- The modes declare Roo-compatible tool groups derived from each canonical
  agent's tool frontmatter. The orchestrator mode keeps its existing behavior
  as a top-level coordinator and does not list itself as a worker.

The adapter does not install or alter global settings, `.roo/mcp.json`,
`.roo/rules/`, MCP servers, models, or approval policies. Existing custom
commands at the generated paths are preserved as conflicts.

## Update and remove

Use `scripts/update-plan.mjs` from a newer package to preview and apply
three-way updates. Modified command files are preserved or presented as
conflicts; they are never silently replaced. Uninstall removes unchanged
command wrappers and managed instruction blocks, but deliberately preserves
`.roomodes` because it is a shared user configuration file. Remove the
AI-KIDO modes from that file manually after backing it up.

## Qualification

Build, package integrity, bootstrap conflicts, and shared runtime behavior are
automated. They are not a native Zoo Code session test. Record the installed
Zoo Code version and test slash-command discovery, mode switching, file
permissions, update, and removal before claiming end-to-end compatibility.

Official references:

- [Zoo Code custom modes](https://docs.zoocode.dev/features/custom-modes)
- [Zoo Code slash commands](https://docs.zoocode.dev/features/slash-commands)
- [Zoo Code custom instructions](https://docs.zoocode.dev/features/custom-instructions)
- [Zoo Code MCP](https://docs.zoocode.dev/features/mcp/using-mcp-in-roo)
- [Roo-to-Zoo migration](https://docs.zoocode.dev/roo-to-zoo-migration)
