---
name: aikido-tasks
description: Use when creating, launching, scheduling, stopping, deleting or tracking AI-KIDO task cards and workflows, with or without Tatami Core Agent.
---
When the project has `.aikido/lock.json`, prefer its installed `prompts/hard_points/` source. Otherwise read the bundled source at `${CLAUDE_PLUGIN_ROOT}/payload/prompts/hard_points/system/aikido-tasks/SKILL.md`. Never write into the plugin cache.


# AI-KIDO Tasks and Workflows

Drive cards and workflows only through `aikido task ...`, or the installed
`task-store/task.mjs` with Node 24+. Never edit card or workflow files by hand.
Start with `aikido task host status` to see which modules are present.

## Modules are optional

Each command detects Tatami Core Agent on every run. A card is handled where it
lives: Core Agent cards are piloted on the Core Agent, local cards stay local.
Without a Core Agent everything keeps working locally, except launching work,
which needs an execution host. `--local` forces local operation.

## Cards

| Goal | Command |
|---|---|
| List, inspect, history | `task list`, `task show <id>`, `task events <id>` |
| Create or edit | `task create --file <json>`, `task update <id> --file <json>` |
| Launch now | `task launch --prompt-file <file> [--title <t>] [--workflow <id>] [--agent <path>] [--target <id>]` |
| Move a local card to the Core Agent and launch it | `task launch <id>` |
| Schedule | `task schedule <id> --at <iso> [--timezone <tz>]`, `task unschedule <id>` |
| Stop, pause, resume, cancel | `task stop <id>`, `task pause <id>`, `task resume <id>`, `task cancel <id>` |
| Validate, close | `task accept <id> --accepted true`, `task done <id>` |
| Archive, restore, delete | `task archive <id>`, `task restore <id>`, `task delete <id> --confirm` |
| Move waiting local cards to the Core Agent | `task sync --confirm` |

Keep prompts in private files outside the checkout. Launching requires an explicit
user request. Confirm with the user before `delete` and `sync`.

## Workflows

`workflow list|show <id>`, `workflow save --file <draft.json>`,
`workflow delete <id> --confirm`, `workflow sync`. Method templates live in
`prompts/hard_points/workflows/` (read-only), project templates in
`prompts/gen/workflows/`. Details: [task store contract](../task-store/task-store.md).

## Remote Core Agent

`task config core-agent show|set|clear`. Pass the token with `--token-env <VARIABLE>`
or `--token-file <file>`, never as a value. Environment alternative:
`AIKIDO_CORE_AGENT_URL`, `AIKIDO_CORE_AGENT_TOKEN`, `AIKIDO_CORE_AGENT_PROJECT`.
