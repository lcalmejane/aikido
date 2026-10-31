# AI-KIDO integrations

AI-KIDO can be added to a project through host-native plugins where available
or through workspace files understood by the assistant. Choose the package
that matches the host and use the same release tag for installation and later
updates.

## Available integrations

| Assistant | Package | How AI-KIDO appears |
|---|---|---|
| Claude Code | `claude-code` | Marketplace plugin with slash commands, Skills and agents |
| Claude Cowork | `claude-cowork` | Account plugin with slash commands, Skills and agents |
| VS Code / GitHub Copilot | `copilot-vscode` | Agent Plugin with slash prompts, Skills and agents |
| GitHub Copilot coding agent | `copilot-github` | Repository Skills, agents and project instructions |
| Codex CLI and IDE | `codex` | Workspace Skills, custom agents and project instructions |
| Kiro CLI | `kiro-cli` | Workspace Skills, slash commands, agents and project instructions |
| Zoo Code | `zoo-code` | Workspace slash commands, custom modes and project instructions |
| Roo Code | `roo-code-legacy` | Workspace slash commands, custom modes and project instructions |
| Google Antigravity | `antigravity` | Workspace Skills, agents and project instructions |

Claude Cowork plugins are installed to the user's Claude account. The same
package can be uploaded through **Customize > Plugins > Add > Upload plugin**.

## Get a package

Use the immutable AI-KIDO distribution tag and select the package directory
for the assistant:

```bash
git clone --depth 1 --branch aikido-dist-v1.5.2 \
  https://github.com/lcalmejane/aikido.git aikido-dist
```

The package directories are `claude-code/`, `claude-cowork/`,
`copilot-vscode/`, `copilot-github/`, `codex/`, `kiro-cli/`, `zoo-code/`,
`roo-code-legacy/` and `antigravity/`.

For Claude Code, add the pinned marketplace and install the plugin:

```bash
claude plugin marketplace add \
  https://github.com/lcalmejane/aikido.git#aikido-dist-v1.5.2
claude plugin install aikido@aikido
```

For Claude Cowork, upload the contents of `claude-cowork/` as a plugin through
the account's plugin settings. For workspace integrations, keep the selected
package outside the target project and follow its `README.md`.

## Initialize a project

The package runtime creates a reviewable installation plan. Select the target
project and a `STANDARD`, `LIGHT` or `UNSET` entry point:

```bash
node /path/to/selected-package/scripts/bootstrap-plan.mjs \
  --root /path/to/project --package /path/to/selected-package --mode STANDARD
```

Review the listed project files, then apply using the plan ID returned by the
command:

```bash
node /path/to/selected-package/scripts/bootstrap-plan.mjs \
  --root /path/to/project --package /path/to/selected-package \
  --mode STANDARD --apply --confirm <plan-id>
```

After installation, run the AI-KIDO initialization command in the selected
assistant to start building the project's Memory Bank.

## Update or remove an installation

Installing a newer assistant plugin and updating the AI-KIDO method in a
project are separate actions. To update the project, point the new package's
runtime at the existing project:

```bash
node /path/to/new-package/scripts/update-plan.mjs \
  --root /path/to/project --package /path/to/new-package
```

Review the plan and resolve any requested choices before applying it with
`--apply --confirm <plan-id>`. To migrate an existing project without an
AI-KIDO lock, add `--migrate`.

To remove AI-KIDO integration files while keeping the project's Memory Bank,
preview and confirm an uninstall with the same runtime:

```bash
node /path/to/package/scripts/update-plan.mjs \
  --root /path/to/project --uninstall
node /path/to/package/scripts/update-plan.mjs \
  --root /path/to/project --uninstall --apply --confirm <plan-id>
```

Project knowledge remains in the project when an assistant plugin or workspace
integration is removed.
