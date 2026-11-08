# AI-KIDO integrations

AI-KIDO can be added to a project through host-native plugins where available
or through workspace files understood by the assistant. Choose the package
that matches the host and use the same release tag for installation and later
updates.

All package runtimes require a separately available Node.js executable and
permission to run commands in the intended environment. The stable Node.js 24+
baseline and its diagnostic limitations are described in the
[distribution guide](../README.md#runtime-and-execution). A plugin being
installed does not establish that its agent can execute the runtime.

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

## Install with npm

The `@aikido-method/cli` package bundles every host package and detects the assistant
CLIs installed on the machine, never by running them. Detection has three
layers, reported per host with the evidence that proved it:

1. **Machine**: a binary on `PATH`, or an editor extension (for example the
   Codex and Zoo Code VS Code extensions).
2. **Workspace proof**: a binary in the project's `node_modules/.bin`
   (`workspace-binary`), or a directory that only one host creates
   (`.claude`, `.codex`, `.kiro`).
3. **Hints**: directories shared by several hosts (`.roo`, `.agents`,
   `.github/agents`). A hint is listed in `hints` but never wrapped, because it
   cannot tell the hosts apart.


```text
npx @aikido-method/cli detect
npx @aikido-method/cli init            # plan only
npx @aikido-method/cli init --yes      # apply the plan, then wrap every detected CLI
npx @aikido-method/cli update --yes
npx @aikido-method/cli sync            # pick up a CLI installed later
```

`init`, `update` and `uninstall` always print the plan first and write nothing
without `--yes`. After each run the package runtime is kept in
`.aikido/state/cli-runtime/<host>/` (ignored by Git). `/skill-manage`,
`/create-skill`, `/create-command`, `/create-persona` and `/maj-aikido` then call
`prompts/hard_points/system/host-sync/host-sync.mjs`, so a new or updated Skill,
agent or command is available to every installed CLI immediately. The package
is built by `distribution/npm/scripts/prepack.mjs` from the tagged sources.

## Install or update from a local folder

`aikido init|update --from <folder>` and `bootstrap-plan.mjs` / `update-plan.mjs --package <folder> --trust local`
use a folder you already downloaded: a `dist` branch clone, an extracted release, one host package, or a source
checkout (built into `.aikido/state/source-build/`). With `--trust local` the identity checks (ledger sums, official
commit, official repository) are reported as `warnings` instead of blocking, and the lock records the bytes really
installed. The plan reports `versionChange` (`initial`, `upgrade`, `same`, `downgrade`, `unknown`): a regression is
announced and applied only after you confirm the exact plan. Safety checks always block. See
[`npm/README.md`](../npm/README.md).

## Get a package

Use the immutable AI-KIDO distribution tag and select the package directory
for the assistant:

```text
git clone --depth 1 --branch aikido-dist-v1.5.3  https://github.com/lcalmejane/aikido.git aikido-dist
```

The package directories are `claude-code/`, `claude-cowork/`,
`copilot-vscode/`, `copilot-github/`, `codex/`, `kiro-cli/`, `zoo-code/`,
`roo-code-legacy/` and `antigravity/`.

For Claude Code, add the pinned marketplace and install the plugin:

```text
claude plugin marketplace add  https://github.com/lcalmejane/aikido.git#aikido-dist-v1.5.3
claude plugin install aikido@aikido
```

For Claude Cowork, upload the contents of `claude-cowork/` as a plugin through
the account's plugin settings. For workspace integrations, keep the selected
package outside the target project and follow its `README.md`.

## Initialize a project

The package runtime creates a reviewable installation plan. Select the target
project and a `STANDARD`, `LIGHT` or `UNSET` entry point:

```text
node /path/to/selected-package/scripts/bootstrap-plan.mjs  --root /path/to/project --package /path/to/selected-package --mode STANDARD
```

Review the listed project files, then apply using the plan ID returned by the
command:

```text
node /path/to/selected-package/scripts/bootstrap-plan.mjs  --root /path/to/project --package /path/to/selected-package  --mode STANDARD --apply --confirm <plan-id>
```

After installation, run the AI-KIDO initialization command in the selected
assistant to start building the project's Memory Bank.

## Update or remove an installation

Installing a newer assistant plugin and updating the AI-KIDO method in a
project are separate actions. To update the project, point the new package's
runtime at the existing project:

```text
node /path/to/new-package/scripts/update-plan.mjs  --root /path/to/project --package /path/to/new-package
```

Review the plan and resolve any requested choices before applying it with
`--apply --confirm <plan-id>`. To migrate an existing project without an
AI-KIDO lock, add `--migrate`.

For a locally customized tracked file that also changed upstream, first merge
the upstream changes into the local file and review the result. Preview again
with `--keep-local path/to/file,another/file` to explicitly preserve those
resolved files. Use the same option when confirming the resulting plan.
The updater keeps their bytes and records the new upstream baseline; it does
not accept untracked collisions, symlinks, missing files or unsafe paths.
Back up local files before manual merging. No wildcard or blanket force exists.

For a workspace-only installation without a host plugin cache, keep the
selected package runtime available: project method installation copies payload
and wrappers, not the plugin's runtime. A source build can retain packages in
the ignored `.aikido/state/cli-runtime/` directory (`--out`), then use its
`<host-id>/scripts/update-plan.mjs` for the project update. `/check-cli` uses
that same persistent package after the chat is reopened. Do not overwrite an
existing runtime directory without reviewing/backing up its contents.

To remove AI-KIDO integration files while keeping the project's Memory Bank,
preview and confirm an uninstall with the same runtime:

```text
node /path/to/package/scripts/update-plan.mjs  --root /path/to/project --uninstall
node /path/to/package/scripts/update-plan.mjs  --root /path/to/project --uninstall --apply --confirm <plan-id>
```

Project knowledge remains in the project when an assistant plugin or workspace
integration is removed.

## Audit host registration surfaces

After `/skill-manage` installs, updates (including `up_to_date`), or removes a
skill, run `/check-cli` for the calling assistant. It audits catalog commands
and agents, bundled and installed Skills, and host instruction/configuration
surfaces. Shared `AGENTS.md` is used by Copilot and other AGENTS-compatible
hosts; Claude Code additionally uses `CLAUDE.md`, and Zoo/Roo modes are checked
through their declared `.roomodes` target.

Every host package contains the persistent `scripts/check-cli.mjs` runtime,
its `lib/` dependencies, `catalog.json` and `templates/`. Invoke it from the
selected installed package (never from a temporary build directory). The
current CLI must be passed explicitly as `--host` (or `AIKIDO_HOST`); never
infer the caller from existing host directories or the selected model.

Preview before applying:

```text
node /path/to/selected-package/scripts/check-cli.mjs  --root /path/to/project --host <catalog-host-id> --check
node /path/to/selected-package/scripts/check-cli.mjs  --root /path/to/project --host <catalog-host-id> --repair --dry-run
```

Apply only after approval by repeating the second command without
`--dry-run`. The JSON report distinguishes file conformance from host runtime
discovery. Only marker-managed wrappers and lock-verified instruction blocks are updated
or removed; recognizable legacy wrappers remain unchanged, while unmarked or
customized files are reported as conflicts and preserved. Skills, commands
and agents are read as Markdown only: skill scripts, hooks, providers, MCP
configuration and secrets are never executed or modified.
