### Skills (Agent Skills)

Implemented skills are listed in `skills_list.md` and follow the CLAUDE.md standard for Agent Skills.

#### Conditional Orchestration

The [aikido-orchestrator system skill](orchestrator/SKILL.md) supports the
[conditional runtime persona](../agents/agent-aikido-orchestrator.md).
It gates activation on verified Copilot capabilities and routes eligible work by
measured cost/quality using a configurable JSON policy. It does not replace a
native general orchestrator. See the [registry](../../../skills_list.md).

#### What is a Skill?

A **Skill** is a specialized capability module that extends Claude's functionality autonomously. It is a packaged resource including instructions, metadata, and optional resources.

**Source**: [Skills Overview](https://docs.claude.com/en/docs/agents-and-tools/agent-skills/overview.md)

#### Key Characteristics

* **Autonomous invocation**: Claude automatically decides when to use a Skill based on the conversation context
* **Modular architecture**: Packaged as a directory with structured files
* **Progressive disclosure**: Progressive information loading in 3 levels:
  * **Level 1**: Metadata (~100 tokens, always loaded)
  * **Level 2**: Instructions (<5k tokens, loaded on activation)
  * **Level 3**: Resources (unlimited, loaded on demand)

**Source**: [Skills Overview - Architecture](https://docs.claude.com/en/docs/agents-and-tools/agent-skills/overview.md)

#### Skill Structure

skill-name/
├── SKILL.md           # Main file (required)
├── references/       # Reference documentation (optional)
├── examples/        # Usage examples (optional)
├── personas/        # Personas (optional)
├── scripts/           # Utility scripts (optional)
│   └── helper.mjs
|── templates/         # File templates (optional)
|   └── template.txt
└── documentation/         # Detailed documentation (optional)
    └── documentation.md

**Source**: [Skills Format](https://code.claude.com/docs/en/skills.md)

#### Default Tooling Standard (Node.js)

Every skill that is **created, optimized or compiled** (`/create-skill`,
`/skill-manage`, `/optimize-command-with-aikido-agents`,
`/compile-agent-from-use`, `agent-aikido-*`) MUST implement its deterministic
tooling in **Node.js ES modules** (`.mjs`). This is the default; it applies
unless the user explicitly asks for another runtime and the reason is recorded
in the skill's `SKILL.md`.

1. **Runtime**: baseline stable Node.js 24+. Before writing or running a script,
   check `node --version` in the executor that will run it. Use the highest
   Node.js version available in the agent-accessible workspace, but only syntax
   and APIs supported by the detected version; never raise the declared
   baseline silently. Never install Node.js or change permissions without
   approval; if Node.js is unavailable, report the blocked operation.
2. **Dependencies**: none by default. Use `node:` built-in modules only
   (`node:fs`, `node:path`, `node:child_process` with `execFile`/argument
   arrays, `node:test`). Any third-party package requires an explicit decision
   recorded in `SKILL.md`; no `package.json` install step is assumed.
3. **Layout**: `scripts/<name>.mjs` with a `#!/usr/bin/env node` header, an
   exported pure core (testable) and a thin `main()` CLI entry point; tests in
   `scripts/<name>.test.mjs` run with `node --test`.
4. **Contract**: bounded, versioned JSON on stdout (one object), human text on
   stderr, explicit `{"status":"error","code","message"}` on failure, nonzero
   exit code on failure, validated inputs, read-only planning separated from
   approved writes. Never claim an unimplemented behavior succeeds.
5. **Not allowed by default**: new `.sh`, `.bash`, `.zsh`, `.py`, `.ps1` or
   `.bat` entry points. Existing non-Node scripts of a skill being optimized or
   compiled are migrated to `.mjs`, or the exception is documented and the
   migration listed as a gap. Markdown-only skills (no script) remain valid.
6. **Declaration**: `SKILL.md` states `Runtime: Node.js 24+ (.mjs, no
   dependency)` and the exact command to run each script.

Commands that generate or rewrite skills apply this standard automatically and
report any deviation. See the shared runtime baseline in
[`distribution/README.md`](../../../distribution/README.md#runtime-and-execution).
