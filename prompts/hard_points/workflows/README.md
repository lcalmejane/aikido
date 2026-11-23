# Method workflows

Read-only `workflow/2` templates distributed with AI-KIDO, one immutable file per
version: `<id>/<version>.workflow.md`. They take priority over project templates in
`prompts/gen/workflows/`, then `.tatami/workflows/`. See the
[task store contract](../system/task-store/task-store.md).

A `.workflow.md` file has a front matter (`id`, `version`, `publication`, render
hashes), a human part (title, description, `stateDiagram-v2` diagram, states) and a
`json workflow/2` block that is authoritative. States are `task`, `choice`,
`parallel`, `wait`, `approval` and `terminal`, in `auto` or `manual` mode, with
per-state agent, prompt, MCP, tools, skills and pre/post hooks. Workflows are Full
Auto by default (`review:automated`); built-ins `automatic`, `analysis` and
`implementation` (2.0.0) each have a `-with-approval` variant (`review:human`).
Validation, rendering, diagram parsing, patches and diff live in
[`workflow.mjs`](../system/task-store/workflow.mjs); `workflow/1` is no longer read.
