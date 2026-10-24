# AI-KIDO for Codex CLI and IDE

AI-KIDO - AI Memory Bank Construction Method by Meta harness.

This is a **workspace adapter**, not an installed Codex plugin. The package contains the shared
bootstrap/update runtime and canonical Memory Bank payload. Bootstrap installs:

- a bounded AI-KIDO block in the project's `AGENTS.md`;
- commands as fallback Skills in `.agents/skills/<command>/SKILL.md`, with no deprecated
  `.codex/prompts/` copy;
- all six system Skills in `.agents/skills/`, including their resources and discovery metadata;
- all 15 agents in `.codex/agents/*.toml`, pointing to their project-pinned canonical role files.

The package does not change `~/.codex/`, `.codex/config.toml`, models, credentials, MCP settings,
network access, sandbox settings or project trust. Do not install another copy of these Skills
as a plugin or at user scope: Codex can show duplicate names rather than merging them.

## Install into a project

Prerequisite: Node.js with support for the bundled `.mjs` runtime (validated with Node 26.12.1).
Obtain a verified extracted `codex` package. Remote publication and installation from GitHub have
not been qualified yet; these instructions do not claim a published 1.5 release exists.

Keep the package **outside** the target project. Replace both absolute paths below. The runtime
does not download dependencies or contact a model provider.

```bash
node /path/to/codex-package/scripts/validate-package.mjs /path/to/codex-package
node /path/to/codex-package/scripts/bootstrap-plan.mjs \
  --root /path/to/project --package /path/to/codex-package --mode STANDARD
```

Review the JSON plan and confirm its exact `planId`:

```bash
node /path/to/codex-package/scripts/bootstrap-plan.mjs \
  --root /path/to/project --package /path/to/codex-package --mode STANDARD \
  --apply --confirm <plan-id>
```

`LIGHT` and `UNSET` are also supported. `UNSET` installs the method without inventing project
knowledge; invoke `$init-aikido` afterwards to initialize it. A conflicting existing wrapper
blocks installation rather than being overwritten. Existing user instructions are retained.

You can run these commands yourself in a terminal. If Codex runs them, preview in a read-only
session first; applying requires permission to write to the project. Use the host's approval
flow and workspace-write mode for the confirmed apply, not unrestricted access or `--yolo`.
If a sandbox or protected path refuses a write, stop and surface the error; do not bypass it.
The package remains read-only input, and all project knowledge stays in the project.

## Use in CLI

Start a **new** session at the installed project's root. Codex reads `AGENTS.md` when the session
starts. A same-directory `AGENTS.override.md` replaces it; nested overrides, global instructions
and the instruction-size budget can also affect discovery. Inspect these before assuming that
the managed block was loaded. The adapter never rewrites such overrides.

- Run `/skills` or type `$` to select a Skill, for example `$list-command`, `$analyse-project`,
  `$init-aikido`, or the independent system Skill `$orchestrator`.
- Ask Codex to delegate a bounded task to `agent-aikido-validator` (or another generated name);
  use `/subagents` to inspect its thread. These agent names are not slash commands.
- The native Codex coordinator remains in charge. Use the orchestrator Skill for coordination;
  do not ask Codex to spawn a second general coordinator.

Custom agents inherit the parent's model, permissions, provider and MCP servers. The generated
TOML deliberately sets only `name`, `description` and `developer_instructions`. A read-only role's
"Do not edit files" instruction is behavioral guidance, **not** an OS-enforced sandbox.
Project-local configuration/agent discovery can require trusting the project in Codex. Trust is
an operator decision; the adapter does not grant it.

## Use in the IDE extension

Open the installed project as the workspace and start a new Codex chat. Use `/skills` or `$` to
select the same project Skills. Ask explicitly for the named custom agent and inspect the
subagent activity if the installed extension exposes that UI. Select the parent permission
mode in the IDE before requesting writes; CLI flags do not configure the extension.

Check the extension version independently of `codex --version`. Shared file formats do not
prove that a particular installed IDE release supports every CLI feature.

## Update and remove

Use the runtime from the new verified package to plan a three-way update:

```bash
node /path/to/new-codex-package/scripts/update-plan.mjs \
  --root /path/to/project --package /path/to/new-codex-package
```

Review conflicts and confirm with the same arguments plus `--apply --confirm <plan-id>`.
An unchanged upstream wrapper preserves local customization. Concurrent upstream/local changes
are explicit conflicts. Never resolve them by deleting the project's Memory Bank.

To remove unchanged adapters and the managed instruction block while preserving knowledge:

```bash
node /path/to/codex-package/scripts/update-plan.mjs --root /path/to/project --uninstall
node /path/to/codex-package/scripts/update-plan.mjs \
  --root /path/to/project --uninstall --apply --confirm <plan-id>
```

Modified wrappers remain user-owned. Updates and removal produce a local recovery backup;
the runtime's `--recover <backup-path>` restores it after review.

## Qualification and reproducible checks

Documentation checked on 2026-10-24:

- [Skills, locations, discovery and explicit invocation](https://developers.openai.com/codex/skills)
- [Custom agent TOML and inherited permissions](https://developers.openai.com/codex/subagents)
- [AGENTS.md precedence and size budget](https://developers.openai.com/codex/guides/agents-md)
- [Sandbox, approvals and project trust](https://developers.openai.com/codex/agent-approvals-security)
- [Codex IDE entry point](https://developers.openai.com/codex/ide/features)

| Surface | Evidence | Status |
|---|---|---|
| Extracted package/runtime | Automated install in STANDARD/LIGHT/UNSET, metadata, all agents, update, conflicts, removal and recovery | Tested without Codex inference |
| Codex CLI | Official formats and invocation documented | Native recipe not run: CLI unavailable |
| Codex IDE | Official Skills and subagent support documented separately | Native recipe not run |
| Immutable GitHub installation | Requires a published package and clean-environment install | Not run |

For a native CLI recipe, record `codex --version`, package source SHA, OS, permission mode and
fixture path. In a disposable Git project: install, start a new session, verify the AI-KIDO
instruction block, select `$list-command`, run a read-only task via `agent-aikido-validator`,
and inspect `/subagents`. Confirm the role file was read and no edits occurred.

Repeat independently in the IDE, recording its extension version and permission UI. Then edit a
wrapper locally, update the package and remove adapters; verify the local edit and project
knowledge survive. Record actual results, including discovery failures and approval denials.
Until those recipes run, neither CLI nor IDE is claimed end-to-end compatible, including
discovery of the generated hyphenated custom agent names.
