# Method workflows

Read-only `workflow/1` templates distributed with AI-KIDO, one immutable file per
version: `<id>/<version>.json`. They take priority over project templates in
`prompts/gen/workflows/`. See the [task store contract](../system/task-store/task-store.md).

`workflow/2` is the adopted successor: a `.workflow.md` file whose JSON block is
authoritative (states `task`, `choice`, `parallel`, `wait`, `approval`,
`terminal`; `auto` or `manual` mode; per-state agent, prompt, MCP, tools, skills
and pre/post hooks). Workflows are Full Auto by default, with `review:automated`.
It replaces `workflow/1` without dual reading or migration as soon as the Task
Store library validates it; until then the library accepts `workflow/1` only.
