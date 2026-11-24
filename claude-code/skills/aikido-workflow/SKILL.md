---
name: aikido-workflow
description: Use when writing, editing, testing, scoring or publishing an AI-KIDO workflow/2 definition (.workflow.md), from a command, the editor or the file itself.
---
When the project has `.aikido/lock.json`, prefer its installed `prompts/hard_points/` source. Otherwise read the bundled source at `${CLAUDE_PLUGIN_ROOT}/payload/prompts/hard_points/system/aikido-workflow/SKILL.md`. Never write into the plugin cache.


# AI-KIDO Workflows (`workflow/2`)

A workflow is one `.workflow.md` file: front matter, a human part (Mermaid
`stateDiagram-v2` and a "States" section) generated from the JSON block, and the
JSON block, which is the source of truth. Never edit a published version: a
change creates the next version (patch by default, minor when inputs or outputs change).

## Format

- `schemaVersion: "workflow/2"`, stable `id`, semantic `version`, `entry`, `states`.
- State types: `task` (agent, prompt, `mcp`, `tools`, `skills`, `hooks.pre|post`, `next`),
  `choice` (`branches[].when`, `decide`, `otherwise`), `parallel` (`branches`, `join`, `next`),
  `wait`, `approval`, `terminal` (`outcome`).
- Every loop is bounded by `limits.maxAttempts` or a choice leaving it. No inline
  code, credentials or permissions; script hooks are referenced by path and hash.

## Mermaid subset read back into the JSON

States, labelled transitions `a --> b : label`, `<<choice>>`, `<<fork>>`, `<<join>>`,
`[*]` and `%%` comments. Anything else is refused with its line number.

## Deterministic steps (no model)

Run through `aikido task workflow <op>` (Node 24+), or the Core Agent MCP tools of the same name:

| Step | CLI | Core Agent MCP |
|---|---|---|
| Validate schema and semantics | `validate --file <f>` | `workflow_validate` |
| JSON → human part | `render --file <f> [--lang fr]` | `workflow_render` |
| Diagram ↔ JSON after an edit | `sync --file <f.workflow.md> [--prefer json\|human]` | `workflow_parse` |
| Compare two versions | `diff --file <new> --against <old>` | `workflow_diff` |
| Simulate with stub agents | `test --file <f>` | `workflow_test` |
| Check a proposal from text | `propose --file <f> --proposals <p.json>` | `workflow_understand` |
| Graph compiled by the engine | — | `workflow_compile` |
| Automated share | — | `workflow_score` |

## Rules

1. Render after every JSON edit; sync after every diagram edit. On `conflict`, show
   both differences and ask which one to keep.
2. Natural-language changes (prompt, condition, hook described in a sentence) become
   value proposals `[{ path: "states/<id>/<field>", value }]`. Show the returned diff
   and apply only after the user agrees; never apply silently.
3. Before saving, `test` must report `complete: true` (every state covered, no stuck path).
4. Save with `aikido task workflow save` or the `workflow_save` tool; publishing to a
   remote Core Agent is a separate, confirmed step.
