---
name: aikido-deps
description: "Use when checking whether the dependencies, images, extensions and tools of any project or workspace are current, or when a pinned version may no longer exist."
---

## Cowork execution boundary

Before following the canonical instructions, verify that the plugin root `${CLAUDE_PLUGIN_ROOT}` resolves to a readable installed package. Resolve relative references from the canonical source file, not this generated wrapper. Use only tools actually exposed in this Cowork session; Claude Code tool names do not prove that those tools are available here.

Before any project write, confirm the user-selected persistent project folder and its access permissions. Do not assume `${CLAUDE_PROJECT_DIR}`, a host filesystem path, or a temporary session directory is the intended project. Bootstrap, migration, update and removal additionally require an available command tool and Node.js. Use the packaged runtime with explicit `--root` and `--package` paths where applicable; review its plan and obtain confirmation of the exact plan ID before applying it. Do not replace the runtime with manual copies.

For `/aikido:init-aikido` without an installed lock, first choose STANDARD, LIGHT or UNSET with the user and run `node "<plugin-root>/scripts/bootstrap-plan.mjs" --root "<project-root>" --package "<plugin-root>" --mode <mode>`. Apply only after confirmation using `--apply --confirm <plan-id>`, then follow the canonical initialization command.

If a required path, tool, runtime or permission is unavailable, stop before writing and report `AIKIDO_COWORK_UNAVAILABLE` with the missing prerequisite. Do not install dependencies, change permissions or claim success to bypass the restriction. Never write into the plugin cache. These are prompt instructions, not a host-enforced sandbox.

When the project has `.aikido/lock.json`, prefer its installed `prompts/hard_points/` source. Otherwise read the bundled source at `${CLAUDE_PLUGIN_ROOT}/payload/prompts/hard_points/system/aikido-deps/SKILL.md`. Never write into the plugin cache.


# AI-KIDO Dependency Check

Run `aikido deps check`, or `node <skill-dir>/deps-check.mjs check` with Node 24+.
The command is read-only and works on any project: it discovers every Git repository
under `--root` and needs no project-specific configuration.

## Covered sources

| Files | Source compared |
|---|---|
| `package.json` | npm |
| `Cargo.toml` | crates.io |
| `requirements*.txt` | PyPI |
| `go.mod` | Go module proxy |
| `Dockerfile*`, `compose*.yml` | Docker Hub or the image registry |
| `--install-extension publisher.name@version` | Open VSX |
| GitHub release URLs and `cargo install --git --tag` | GitHub releases |

## Options

`--root <dir>`, `--project <name>`, `--format json|text`, `--offline` (inventory only,
nothing is sent) and `--fail-on missing|major|minor|patch` (default `missing`).

## Reading the report

`missing`: the pinned version does not exist and the build will fail; fix it first.
`major`, `minor`, `patch`: a newer stable version exists. `unknown`: the source could
not be read, for example a private registry; never report it as up to date.
`ignored`: accepted in `.aikido-deps.json`:

    { "ignore": [{ "name": "node", "version": "24-slim", "reason": "LTS line" }] }

## Rules

- Dependency names and versions are sent to public registries. Scopes declared with a
  private registry in `.npmrc` are skipped. Use `--offline` for confidential projects.
- The command never changes a file. Propose upgrades, then build and test each one.
  Major upgrades need an explicit user decision.
