# AI-KIDO Distribution (work in progress, 1.5)

Packaging sources that will install the AI-KIDO method into any project and expose it to
several AI hosts (Claude Code, VS Code / Copilot, GitHub coding agent, Codex, Kiro CLI,
Zoo Code / Roo, Google Antigravity, Claude Cowork).

The canonical method stays in [`prompts/hard_points/`](../prompts/hard_points/index.md).
This directory only contains what is needed to copy it into a project and keep it updatable.

## Layout

| Path | Content |
|---|---|
| [`templates/`](templates/manifest.json) | Blank project skeleton: entry point per mode, `gen/` and `spec/` indexes, root lists, managed instruction blocks |
| [`schemas/`](schemas/lock.schema.json) | JSON schema of `.aikido/lock.json` |
| [`lib/`](lib/) | Dependency-free Node helpers: templates, managed blocks, lock validation and merge decisions |
| [`docs/`](docs/lock-and-merge.md) | Installed state, managed blocks and merge policy |
| [`tests/`](tests/) | `node:test` suites and fixtures |

Planned next: catalog and host adapters, bootstrap (dry run, then idempotent apply), update.
Nothing here is published yet.

## Commands exposed per host

AI-KIDO system skills are published as skills wherever the host supports them.
Each command is published as a native slash command where the host has one; a skill wrapping
the command is generated **only** for hosts without user slash commands or with a deprecated
mechanism, never both for the same command on the same host.

## Tests

Node.js only, no npm dependency (tested with Node.js 26):

```bash
node --test distribution/tests/*.test.mjs
```
