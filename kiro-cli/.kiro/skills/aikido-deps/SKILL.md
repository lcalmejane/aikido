---
name: aikido-deps
description: "Use when checking whether the dependencies, images, extensions and tools of any project or workspace are current, or when a pinned version may no longer exist."
---

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
