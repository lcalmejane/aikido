# AI-KIDO for Google Antigravity

This workspace adapter targets Antigravity 2.0 and the Antigravity CLI. It
packages:

- AI-KIDO commands and system Skills as workspace Skills in
  `.agents/skills/<name>/SKILL.md`.
- All canonical AI-KIDO agents as custom agents in
  `.agents/agents/<name>.md`.
- The shared AI-KIDO project Memory Bank, bootstrapped into `prompts/`.

Antigravity documents both `.agents/agents/<name>.md` and
`.agents/agents/<name>/agent.md` as workspace agent layouts. This adapter uses
the flat Markdown layout demonstrated by Antigravity's custom-agent guide.

The bootstrap does not change user-level settings, MCP server configuration,
or global permission settings. Generated agents explicitly use Antigravity's
`sandbox` command execution policy. Existing workspace files are reviewed by
the bootstrap plan and are not silently overwritten.

## Install into a project

Use a package built from a pinned AI-KIDO commit. Run the bootstrap from the
project directory:

```bash
node /path/to/aikido-package/scripts/bootstrap-plan.mjs \
  --root "$PWD" --package /path/to/aikido-package --mode STANDARD
```

Review the plan and its conflicts, then apply only after reviewing it with the
returned plan ID:

```bash
node /path/to/aikido-package/scripts/bootstrap-plan.mjs \
  --root "$PWD" --package /path/to/aikido-package --mode STANDARD \
  --apply --confirm <plan-id>
```

Use `LIGHT` for the lighter entry-point template. `UNSET` installs the method
without selecting a mode. The generated package is the runtime source; do not
install files by copying from the AI-KIDO development checkout.

## Use in Antigravity

- Invoke command Skills by slash name, for example `/init-aikido` or
  `/list-command`.
- System Skills such as `orchestrator` are available through workspace Skill
  discovery.
- Select a custom agent in the Antigravity agent picker, or launch one from the
  CLI with `agy --agent agent-aikido-validator`.
- Agents expose explicit tool allowlists using Antigravity's documented tool
  IDs. The orchestrator remains selectable as a main agent but is not
  invocable as a subagent; other agents support both roles.
- Agent shell execution uses Antigravity's `sandbox` command execution policy.
  The adapter does not enable automatic execution or change the user's safety
  settings.

The CLI and IDE can have different feature availability. Confirm support in
the installed Antigravity version before relying on custom-agent discovery in
the IDE.

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

To remove unchanged adapters and the managed instruction block while
preserving the project's Memory Bank:

```bash
node /path/to/aikido-package/scripts/update-plan.mjs --root "$PWD" --uninstall
node /path/to/aikido-package/scripts/update-plan.mjs \
  --root "$PWD" --uninstall --apply --confirm <plan-id>
```

Modified adapters are preserved. Updates and removal create a local recovery
backup; use `--recover <backup-path>` to restore it after review.

## Qualification

The package generator and shared bootstrap/update runtime are covered by
automated tests. Those tests do not prove that a particular installed
Antigravity release discovers every Skill, accepts every custom-agent field,
or invokes agents as expected. Before claiming native Antigravity integration,
perform the CLI and IDE discovery, invocation, permission, update, and removal
recipe in `.local-plans/aikido-distribution/TASKS.md` with a recorded version.

Official references:

- [Antigravity custom agents](https://antigravity.google/blog/introducing-custom-agents/)
- [Antigravity subagents](https://antigravity.google/docs/subagents/)
- [Antigravity Skills](https://antigravity.google/docs/skills/)
