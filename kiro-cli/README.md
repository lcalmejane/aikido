# AI-KIDO for Kiro CLI

This adapter targets **Kiro CLI**, not just the Kiro IDE. It packages:

- AI-KIDO commands as Agent Skills in `.kiro/skills/<name>/SKILL.md`; use `/name`
  to invoke them in Kiro CLI.
- AI-KIDO system Skills in `.kiro/skills/`.
- Custom agents in `.kiro/agents/<name>.md`, using the documented Markdown
  configuration format.
- The shared AI-KIDO project Memory Bank, bootstrapped into `prompts/`.

The bootstrap does not write Kiro user settings, MCP configuration, permissions,
or hooks. Kiro CLI's capability-based permission policy remains under the user's
control. Existing files are reviewed by the bootstrap plan and are not silently
overwritten.

## Install into a project

Use a package built from a pinned AI-KIDO commit. With Kiro CLI installed, run
the package bootstrap from the project directory:

```bash
node /path/to/aikido-package/scripts/bootstrap-plan.mjs \
  --root "$PWD" --package /path/to/aikido-package --mode STANDARD
```

Review the plan and its conflicts. Apply only after reviewing it, using the
returned plan ID:

```bash
node /path/to/aikido-package/scripts/bootstrap-plan.mjs \
  --root "$PWD" --package /path/to/aikido-package --mode STANDARD \
  --apply --confirm <plan-id>
```

Use `LIGHT` for the lighter entry-point template. `UNSET` installs the method
without selecting a mode. The generated package is the runtime source; do not
install files by copying from the AI-KIDO development checkout.

## Use in Kiro CLI

- Type `/` and select an AI-KIDO command Skill, or invoke it directly, for
  example `/init-aikido`, `/maj-aikido`, or `/list-command`.
- System Skills such as `orchestrator` are available through the same Skill
  discovery and slash-command interface.
- The custom agents reference their canonical role prompts through `resources`
  and declare Kiro tool selectors derived from the canonical agent metadata.
  The orchestrator leaves `tools` unset to inherit Kiro's available tools and
  declares the permitted AI-KIDO sub-agent names through
  `toolsSettings.subagent.availableAgents`.
- Kiro's normal permission and approval controls still apply. The adapter does
  not pre-approve file, shell, network, or MCP operations.

Kiro CLI reads workspace Skills, custom agents, steering, and `AGENTS.md`.
The bootstrap adds its managed instruction block to `AGENTS.md`; this is the
shared cross-host entry point and is intentionally not duplicated into a
second steering file.

## Update and remove

Build a newer package, then use the packaged `scripts/update-plan.mjs` to review
and apply a three-way update. User changes that conflict with upstream changes
remain explicit conflicts rather than being replaced:

```bash
node /path/to/new-aikido-package/scripts/update-plan.mjs \
  --root "$PWD" --package /path/to/new-aikido-package
node /path/to/new-aikido-package/scripts/update-plan.mjs \
  --root "$PWD" --package /path/to/new-aikido-package --apply --confirm <plan-id>
```

To remove unchanged adapters and the managed instruction block while preserving
the project's Memory Bank:

```bash
node /path/to/aikido-package/scripts/update-plan.mjs --root "$PWD" --uninstall
node /path/to/aikido-package/scripts/update-plan.mjs \
  --root "$PWD" --uninstall --apply --confirm <plan-id>
```

Modified adapters are preserved. Updates and removal create a local recovery
backup; use `--recover <backup-path>` to restore it after review.

## Qualification

The package generator and the shared bootstrap/update runtime are covered by
automated tests. Those tests do not prove that a particular installed Kiro CLI
release discovers every Skill, accepts every custom-agent field, or invokes
sub-agents as expected. Before claiming a native Kiro CLI integration, perform
the CLI-specific discovery, invocation, permission, update, and removal recipe
in `.local-plans/aikido-distribution/TASKS.md` with a recorded CLI version.

Official references:

- [Kiro CLI](https://kiro.dev/docs/cli/)
- [Skills](https://kiro.dev/docs/skills/)
- [Custom agents](https://kiro.dev/docs/custom-agents/)
- [Sub-agents](https://kiro.dev/docs/custom-agents/subagents/)
- [Steering](https://kiro.dev/docs/steering/)
- [Permissions](https://kiro.dev/docs/permissions/)
