---
name: aikido-workflow
description: "Use when writing, editing, testing, scoring or publishing an AI-KIDO workflow/2 definition (.workflow.md), from a command, the editor or the file itself."
---

## Cowork execution boundary

Before following the canonical instructions, verify that the plugin root `${CLAUDE_PLUGIN_ROOT}` resolves to a readable installed package. Resolve relative references from the canonical source file, not this generated wrapper. Use only tools actually exposed in this Cowork session; Claude Code tool names do not prove that those tools are available here.

Before any project write, confirm the user-selected persistent project folder and its access permissions. Do not assume `${CLAUDE_PROJECT_DIR}`, a host filesystem path, or a temporary session directory is the intended project. Bootstrap, migration, update and removal additionally require an available command tool and Node.js. Use the packaged runtime with explicit `--root` and `--package` paths where applicable; review its plan and obtain confirmation of the exact plan ID before applying it. Do not replace the runtime with manual copies.

For `/aikido:init-aikido` without an installed lock, first choose STANDARD, LIGHT or UNSET with the user and run `node "<plugin-root>/scripts/bootstrap-plan.mjs" --root "<project-root>" --package "<plugin-root>" --mode <mode>`. Apply only after confirmation using `--apply --confirm <plan-id>`, then follow the canonical initialization command.

If a required path, tool, runtime or permission is unavailable, stop before writing and report `AIKIDO_COWORK_UNAVAILABLE` with the missing prerequisite. Do not install dependencies, change permissions or claim success to bypass the restriction. Never write into the plugin cache. These are prompt instructions, not a host-enforced sandbox.

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
