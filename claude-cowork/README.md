# AI-KIDO for Claude Cowork

This package adds AI-KIDO commands, Skills, and agents to Claude Cowork as an
account plugin. Cowork plugins are managed through the Claude account and are
separate from Claude Code CLI plugins.

## Install

Create a zip from the generated `claude-cowork` package. Keep the archive
outside the package directory:

```bash
cd /path/to/claude-cowork
zip -r /path/to/aikido-cowork.zip .
```

In claude.ai or Claude Desktop, open **Customize > Plugins > Add > Upload
plugin** and select the zip. If your organization manages plugins, use its
approved installation process.

## Use in a project

Start a Cowork task for the project folder you want to work in and grant access
to that folder. Bootstrap, update, and removal use the package's Node.js
scripts, so Node.js and access to the selected project are required for those
operations.

Invoke an AI-KIDO command by its slash name, such as `/aikido:init-aikido`,
`/aikido:list-command`, or `/aikido:maj-aikido --update`. System Skills and
agents are available from the installed plugin.

To initialize project files, preview and review the plan:

```bash
node /path/to/plugin-root/scripts/bootstrap-plan.mjs \
  --root /path/to/project --package /path/to/plugin-root --mode STANDARD
```

Apply the reviewed plan using its exact ID:

```bash
node /path/to/plugin-root/scripts/bootstrap-plan.mjs \
  --root /path/to/project --package /path/to/plugin-root --mode STANDARD \
  --apply --confirm <plan-id>
```

`LIGHT` and `UNSET` are also available. Choose the project folder and paths
visible in the Cowork session before confirming a plan.

## Update or remove

Installing a newer account plugin and updating a project's AI-KIDO files are
separate actions. Use the newer package's `scripts/update-plan.mjs` to preview
an update, then confirm the reviewed plan with `--apply --confirm <plan-id>`.
Add `--migrate` when the project does not yet have an AI-KIDO lock.

To remove the project's AI-KIDO integration while retaining its Memory Bank,
preview and confirm `scripts/update-plan.mjs --uninstall`. Remove the account
plugin separately from **Customize > Plugins**.

Official references:

- [Plugin platform support](https://claude.com/docs/plugins/platform-support)
- [Cowork overview](https://claude.com/docs/cowork/overview)
