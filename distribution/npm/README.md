# @aikido-method/cli

Installs and keeps the AI-KIDO Memory Bank up to date, and makes it available to **every assistant CLI
installed on the machine** (Claude Code, Codex, Copilot, Kiro, Zoo/Roo Code, Antigravity…).

```text
npx @aikido-method/cli detect             # which CLIs are used here (PATH, editor extensions, workspace packages and host-only folders; shared folders are hints)
npx @aikido-method/cli init               # plan the installation (writes nothing)
npx @aikido-method/cli init --yes         # apply that exact plan, then wrap every detected CLI
npx @aikido-method/cli update --yes       # update the method and refresh every CLI
npx @aikido-method/cli sync               # re-detect CLIs and (re)generate wrappers, agents and Skills
npx @aikido-method/cli check              # report only, never writes
npx @aikido-method/cli uninstall --yes    # remove the managed adapters
```

Every command prints one JSON object. `init`, `update` and `uninstall` always show the plan first; nothing
is written without `--yes`, and conflicts or customised files are never overwritten.

| Option | Meaning |
|--------|---------|
| `--root DIR` | project directory (default: current directory) |
| `--host ID` | primary host package; default = first CLI detected (or the host recorded in the lock) |
| `--hosts a,b` | `sync`/`check` only: explicit host list instead of detection |
| `--mode` | `STANDARD` (default), `LIGHT` or `UNSET` |
| `--from PATH` | install or update from a local folder instead of the bundled packages (`--packages` is the same option) |
| `--force` | `update` only: the package wins every conflict. Locally edited files are overwritten, files the package no longer ships are removed even if edited, and managed blocks are replaced. The plan lists them in `forcedFiles`; each one is saved in `.aikido/backups/updates/` before it is written. Safety checks (paths, symbolic links, host) still block. Not combinable with `--keep-local` |
| `--dry-run` | `sync` only: plan the wrapper changes without writing |

## Install or update from a local folder

`--from` accepts, without any network access: a clone of the `dist` branch or an extracted release (a folder of
host packages), a single extracted host package, an extracted npm package, or a **local checkout of the AI-KIDO
source repository**, which is built into `.aikido/state/source-build/` and removed afterwards. It is the way to
test an update of the method on a workspace before publishing it.

```text
npx @aikido-method/cli update --from ~/Downloads/aikido-dist-v1.6.0        # plan
npx @aikido-method/cli update --from ~/Downloads/aikido-dist-v1.6.0 --yes  # apply that plan
npx @aikido-method/cli update --from ~/src/aikido --yes                    # a working copy, built on the fly
```

A local source is **analysed and announced, never refused for what it is**. Checksums, the official commit and
the official repository are not required: the plan only reports them under `plan.warnings`, and the lock records
the content really installed. The plan states the version direction in `plan.versionChange`
(`initial`, `upgrade`, `same`, `downgrade`, `unknown`); a regression is called out in the plan and in `next`, and
remains possible once you confirm that exact plan with `--yes`. Safety checks (paths outside the project, symbolic
links, wrong host, unreadable manifest) always block, whatever the origin.

After `init`/`update`/`sync` the package runtime is kept in `.aikido/state/cli-runtime/` (ignored by Git).
Inside the project, `/skill-manage --sync-hosts`, `/create-skill`, `/create-command`, `/create-persona` and
`/maj-aikido` use it through `prompts/hard_points/system/host-sync/host-sync.mjs`, so a new or updated Skill,
agent or command is immediately available to every installed CLI.

Requires Node.js 24 or later. No dependency, no network access at run time, no shell.

The package also exports the deterministic private task engine at
`@aikido-method/cli/task-store`. Use `aikido task ...` for local task, plan and
workflow operations; task data is stored outside the checkout. The standalone
CLI previews due work only. Actual scheduling requires an explicitly started
Node scheduler and an authorized host dispatcher supplied by an integration.
See `docs/task-store.md` for the data model, API and safety boundaries.

## Publishing

Maintainers publish from GitHub Actions using the manual `npm-publish.yml`
workflow on `main`, with a version matching this package's manifest. npm trusted
publishing must authorize GitHub user `lcalmejane`, repository `aikido`, workflow
`npm-publish.yml`, environment `release`, and direct `npm publish`.
The workflow uses OIDC and provenance; it does not use `NPM_TOKEN`.
Published npm versions cannot be overwritten.
