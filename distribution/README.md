# AI-KIDO distribution

AI-KIDO can be installed into a project for the assistant you use. Each
package contains the host integration and the shared runtime used to initialize,
update, or remove AI-KIDO project files.

## Choose an assistant

See the [host integration guide](docs/host-integrations.md) for package
selection and installation steps. Assistant-specific instructions are available here:

- [Claude Code](docs/host-integrations.md#available-integrations)
- [Claude Cowork](adapters/claude-cowork/README.md)
- [VS Code / GitHub Copilot](docs/host-integrations.md#available-integrations)
- [GitHub Copilot coding agent](docs/host-integrations.md#available-integrations)
- [Codex CLI and IDE](adapters/codex/README.md)
- [Kiro CLI](adapters/kiro-cli/README.md)
- [Zoo Code](adapters/zoo-code/README.md)
- [Roo Code](adapters/roo-code-legacy/README.md)
- [Google Antigravity](adapters/antigravity/README.md)

## Initialize a project

Keep the selected package outside the project. Preview the bootstrap plan and
review the files it will add or update:

```bash
node /path/to/package/scripts/bootstrap-plan.mjs \
  --root /path/to/project --package /path/to/package --mode STANDARD
```

Apply the reviewed plan using its exact ID:

```bash
node /path/to/package/scripts/bootstrap-plan.mjs \
  --root /path/to/project --package /path/to/package \
  --mode STANDARD --apply --confirm <plan-id>
```

Use `LIGHT` for a lighter project entry point or `UNSET` to install AI-KIDO
without choosing a mode. After bootstrap, invoke the AI-KIDO initialization
command in your assistant to begin the project's Memory Bank.

## Update or remove

Use the runtime from the package version you want to install to preview an
update. Review the plan and resolve any listed choices before applying it with
`--apply --confirm <plan-id>`. A project without an AI-KIDO lock can be brought
under management with `--migrate`.

To remove AI-KIDO integration files while retaining project knowledge, preview
and confirm an uninstall with `scripts/update-plan.mjs --uninstall`. Project
knowledge remains in the project when an assistant plugin or workspace
integration is removed.
