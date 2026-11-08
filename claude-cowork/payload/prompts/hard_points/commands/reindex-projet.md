---
name: reindex-projet
description: "Rebuild the V3.1 project structure index using Node.js and Git"
---

# /reindex-projet

Rebuild the full structure index for the current project using
`agent-aikido-projet-index`, or execute the same generator directly if that
agent is unavailable.

## Usage

`/reindex-projet` rebuilds the current project's complete index.
The historical optional subtree argument is not supported by the Node
generator. If one is supplied, explain that the operation is a full rebuild
and obtain approval before proceeding; do not silently index another root.

## Execution

Node.js 24+ and Git are required. Use an exposed host process action to start
Node directly with the absolute path of
`prompts/hard_points/system/structure/scripts/generate-all-indexes-v3.1.mjs`
as its sole argv argument. Set the working directory and `PROJECT_ROOT` to
the current project root. Do not use a shell, pipeline or command string; if
direct argv execution is unavailable, report the limitation and stop.
`host-actions.mjs` is a library, not an automatically registered Tool.
Wait for completion, check its exit code and report errors explicitly. On
success report the file count and statistics from
`prompts/hard_points/system/structure/index.json`. Do not claim that a
separate structural compliance validation ran.

The index is generated sequentially. Publication has rollback for ordinary
errors but is not crash-atomic across multiple files; prevent concurrent
index readers and writers. No background agent or tracking log is guaranteed.
See the [structure skill](../system/structure/SKILL.md) for exclusions and
other limits.
