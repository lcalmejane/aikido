# AI-KIDO Distribution (work in progress, 1.5)

Packaging sources that will install the AI-KIDO method into any project and expose it to
several AI hosts (Claude Code, VS Code / Copilot, GitHub coding agent, Codex, Kiro CLI,
Zoo Code, legacy Roo Code, Google Antigravity, Claude Cowork).

The canonical method stays in [`prompts/hard_points/`](../prompts/hard_points/index.md).
This directory only contains what is needed to copy it into a project and keep it updatable.

## Layout

| Path | Content |
|---|---|
| [`templates/`](templates/manifest.json) | Blank project skeleton: entry point per mode, `gen/` and `spec/` indexes, root lists, managed instruction blocks |
| [`schemas/`](schemas/lock.schema.json) | JSON schema of `.aikido/lock.json` |
| [`lib/`](lib/) | Dependency-free Node helpers: catalog lists, templates, managed blocks, lock validation, bootstrap planning and three-way update planning |
| [`catalog.json`](catalog.json) | Canonical command, system skill and agent inventory plus per-host delivery decisions |
| [`scripts/`](scripts/) | Bootstrap and update planners, package validation, and deterministic package builder |
| [`docs/`](docs/lock-and-merge.md) | Installed state, managed blocks and merge policy |
| [`tests/`](tests/) | `node:test` suites and fixtures |

Staging includes the closed method payload, package validation, confirmed bootstrap, lock-based
updates, conservative legacy migration, and adapter-only uninstall with targeted backups and
explicit recovery. Host-native end-to-end qualification and publication remain future work.
Nothing here is published yet.

## Commands exposed per host

AI-KIDO system skills are published as skills wherever the host supports them.
Each command is published as a native slash command where the host has one; a skill wrapping
the command is generated **only** for hosts without user slash commands or with a deprecated
mechanism, never both for the same command on the same host.
The catalog leaves unverified host surfaces disabled; its qualification labels are not end-to-end
compatibility claims.

Every wrapper is **generated** from the canonical sources under `prompts/hard_points/`; the
hand-written wrappers of this repository (`.claude/`, `.github/agents/`, `.roo/`, `.roomodes`) are
not distribution sources. Each enabled host receives one native wrapper for **every** catalog
agent. A wrapper only points to its canonical role file; its tool list is derived from the
canonical `tools` frontmatter mapped to portable capabilities (read, write, shell, delegate), and
an unknown tool fails the build instead of being guessed. Agents always keep read access to load
their role file. The orchestrator inherits the parent tools and is not exposed as a sub-agent where
the host allows that restriction.

| Host | Commands | Agents | Qualification |
|---|---|---|---|
| Claude Code | Native plugin command | Plugin `agents/*.md` | Qualified, not tested end to end |
| Claude Cowork | Native plugin command | Plugin `agents/*.md` | Qualified with conditions, not tested |
| VS Code / Copilot | Agent Plugins 1.0: slash prompts, Skills | `com.github.copilot/agents/*.agent.md` | Qualified, not tested end to end |
| GitHub Copilot coding agent | Fallback Skills in `.github/skills/`, `AGENTS.md` block | `.github/agents/*.agent.md` | Qualified, not tested end to end |
| Codex | Fallback Skill | `.codex/agents/*.toml` | Qualified, not tested end to end |
| Kiro CLI | Native Skill-command (one file, not a second fallback Skill) | `.kiro/agents/*.md` | Qualified, not tested end to end |
| Zoo Code | Native command in `.roo/commands/` | One custom mode per agent in `.roomodes` | Qualified, not tested end to end |
| Roo Code (legacy) | Native command in `.roo/commands/` | One custom mode per agent in `.roomodes` | Legacy/archive format, not tested |
| Google Antigravity | Fallback Skill | `.agents/agents/*.md` (documented tool names only) | Qualified, not tested end to end |
| Copilot Cowork | Not generated | Not generated | Optional final target, unverified |

`.roomodes` is a shared user file: install refuses to overwrite a foreign one and uninstall keeps
it. Zoo Code and legacy Roo Code have separate package identities and qualification records even
though their currently documented workspace paths overlap. Zoo Code is the maintained target;
the Roo package is best-effort against archived documentation, not evidence of active support.
Select only one of those packages for a workspace; their `.roo/commands/` and `.roomodes` targets
overlap and are not co-installable.

## Bootstrap plan and application

The planner inventories package and template targets and reports writes, existing user-owned files,
managed-block conflicts and unsafe symlink paths. Planning does not write files. Review the plan,
then apply a generated host package by confirming the exact `planId`; the application verifies the
package first, preserves conflicting user files, writes baseline copies for three-way files and
writes `.aikido/lock.json` last. Reapplying the same package to an unchanged installation is a no-op.

```bash
node distribution/scripts/bootstrap-plan.mjs \
  --root /path/to/project --mode STANDARD --version 1.5.0 \
  --name "Example project" --hosts claude-code
```

For a package build, first plan against the extracted host package:

```bash
node distribution/scripts/bootstrap-plan.mjs \
  --root /path/to/project --mode STANDARD --package /path/to/package
```

After reviewing all paths and the returned plan ID, apply that plan:

```bash
node distribution/scripts/bootstrap-plan.mjs \
  --root /path/to/project --mode STANDARD --package /path/to/package \
  --apply --confirm <plan-id>
```

## Updating an installed project

Use the update runtime bundled in the host package. It compares the installed lock, the current
project files and the new package. Unchanged upstream files preserve local edits; simultaneous local
and upstream edits are reported as conflicts and require resolution before applying. Removed
three-way files are deleted only when their contents still match the installed version; modified
orphans are preserved and reported. Create-only indexes are never overwritten or recreated.

```bash
node /path/to/package/scripts/update-plan.mjs \
  --root /path/to/project --package /path/to/new-package
```

Review all actions and the plan ID, then explicitly confirm it:

```bash
node /path/to/package/scripts/update-plan.mjs \
  --root /path/to/project --package /path/to/new-package \
  --apply --confirm <plan-id>
```

Apply saves the exact files it will change under `.aikido/backups/updates/`. If the process is
interrupted, restore the returned backup path with:

```bash
node /path/to/package/scripts/update-plan.mjs \
  --root /path/to/project --recover .aikido/backups/updates/<update-id>
```

The lock is written last. Backups remain local and are not removed after recovery. The planner
requires a valid lock and a package built for the same single host. A legacy project without a lock
can be migrated explicitly; migration records existing files and baselines without rewriting
project knowledge:

```bash
node /path/to/package/scripts/update-plan.mjs \
  --root /path/to/project --package /path/to/package --migrate
```

Review the plan and confirm it with `--migrate --apply --confirm <plan-id>`. Migration skips missing
files and create-only indexes, preserves user-authored differences, and does not alter `gen/`,
`spec/` or instruction content.

To remove host adapters while keeping the installed Memory Bank, preview and confirm an uninstall:

```bash
node /path/to/package/scripts/update-plan.mjs --root /path/to/project --uninstall
node /path/to/package/scripts/update-plan.mjs \
  --root /path/to/project --uninstall --apply --confirm <plan-id>
```

Uninstall removes unchanged managed wrappers and instruction blocks. Modified wrappers and blocks
are preserved as user-owned content; knowledge files and their lock entries remain. The operation
also writes a targeted recovery backup.

## Deterministic package build

Build into a new or empty output directory. The builder refuses to overwrite non-empty directories.
Use the same source revision to compare builds; `uncommitted` is the default until a release build
passes its immutable source SHA.

```bash
node distribution/scripts/build.mjs --out /tmp/aikido-dist --revision <40-character-source-sha>
```

The current staging mappings cover Claude Code command wrappers, a VS Code Agent Plugins 1.0 plugin,
Codex, GitHub coding agent and Antigravity fallback Skills, Kiro native Skill-commands, separate
Zoo Code and legacy Roo command wrappers, and generated agent wrappers for every enabled host.
These are build mappings, not tested host integrations.
Generated packages are staging outputs, not installable releases. Package integrity is validated
after extraction; host-specific end-to-end testing and release publication remain future work.

The VS Code package uses the portable Agent Plugins 1.0 manifest (`plugin.json`), with Copilot
slash prompts and custom agents under `com.github.copilot/`, and system Skills under `skills/`.
Install the generated `copilot-vscode` directory with VS Code's **Chat: Install Plugin From
Source** command, then bootstrap the target project from the same package. This keeps plugin
commands separate from workspace `.github/prompts/` files, so commands are not duplicated.
The package shape and Skill metadata are tested locally; the native Copilot runtime could not be
tested in this environment because the GitHub Copilot VS Code extension is not installed.

The GitHub coding agent (Copilot cloud agent on GitHub.com) has no slash commands or prompt
files, so the `copilot-github` package installs repository files only: commands become fallback
Skills and system Skills are copied under `.github/skills/` (with `name`/`description` metadata),
registered agents under `.github/agents/`, and the shared `AGENTS.md` managed block provides the
instructions. On GitHub.com, ask Copilot to use the Skill by name; Copilot also selects it when
relevant. Markdown links in copied Skills are rebased so they still reach the installed Memory Bank.
Bootstrap one Copilot adapter per project: VS Code also reads `.github/skills/` and
`.github/agents/`, so adding the `copilot-vscode` plugin to a `copilot-github` project would expose
each command twice. No `copilot-setup-steps.yml` is generated because the Skills need no extra
dependencies; MCP servers stay a repository setting. The cloud-agent runtime has not been tested
end to end.
[Custom instructions support](https://docs.github.com/en/copilot/reference/custom-instructions-support),
[Adding agent skills](https://docs.github.com/en/copilot/how-tos/copilot-on-github/customize-copilot/customize-cloud-agent/add-skills),
[Customization cheat sheet](https://docs.github.com/en/copilot/reference/customization-cheat-sheet).

Official format references:
[Agent Plugins in VS Code](https://code.visualstudio.com/docs/agent-customization/agent-plugins),
[Agent plugin authoring reference](https://code.visualstudio.com/docs/agents/reference/agent-plugin-reference).

### Codex CLI and IDE workspace adapter

The Codex package installs repository-scoped `.agents/skills/`, all 15 `.codex/agents/*.toml`
wrappers and the shared `AGENTS.md` block. Commands are invoked with `$<name>` or selected through
`/skills`, not installed as deprecated custom prompts. System Skills receive valid discovery
metadata; their resources and relative Memory Bank links remain usable after bootstrap.

The [Codex adapter guide](adapters/codex/README.md) is included as the generated package's
`README.md`. It covers installation, sandbox/approval requirements, precedence of `AGENTS.override.md`,
updates, removal and separate CLI/IDE recipes. No plugin or user-level configuration is installed,
so the workspace adapter does not introduce plugin/workspace duplicates.

Extracted-package tests cover STANDARD/LIGHT/UNSET installation, all agent wrappers, legacy
migration, personalized updates, explicit conflicts, removal and recovery outside the source tree.
These test the Node runtime, **not** native Codex discovery or inference. Codex CLI is unavailable
in the current environment, and the IDE recipe has not run; both remain explicitly untested.
Agent role instructions do not create a separate sandbox: Codex agents inherit the parent
permissions, model and MCP servers.

## Tests

Node.js only, no npm dependency (tested with Node.js 26):

```bash
node --test distribution/tests/*.test.mjs prompts/hard_points/system/orchestrator/*.test.mjs
```
