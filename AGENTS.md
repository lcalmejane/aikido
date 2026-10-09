# AI Agents Configuration

> **Version**: 1.4 | **Date**: 2026-08-05 | **AI-KIDO Mode**: STANDARD

This file is the **standardized interface** exposing the AI-KIDO Memory Bank per LLM standard. It references personas, concepts, techniques and use cases via exclusive links (no content duplication).

## 📐 Internal Aikido Agents as Tools/Modes

Internal `agent-aikido-*` agents are simultaneously **tools**, **agents** and **modes**.
All return interactions between a mode and an internal Aikido agent **must be encoded as JSON**.
**Single JSON call per request** — aggregate multiple calls into one request with combined parameters.

**Orchestration**: [agent-aikido-orchestrator](prompts/hard_points/agents/agent-aikido-orchestrator.md)
always works and adapts to the orchestrator already present: it **leads** when no
other general orchestrator exists (complete inventory), **collaborates** with an
existing native orchestrator (Claude Code, Kiro, Codex, Roo, or any registered
one: it follows its definition, guides it with a JSON plan, runs direct/MCP tasks
itself and takes over only what it verifiably cannot do, e.g. parallel tasks), or
**works directly** when the host is unknown. Native orchestration and host
instructions retain priority.
Use its [system skill](prompts/hard_points/system/orchestrator/SKILL.md),
[JSON contract](prompts/hard_points/system/orchestrator/contract.schema.json) and
[routing policy](prompts/hard_points/system/orchestrator/policy.json); never invent model availability or costs.

- **Project Name**: AI-KIDO Best Practices
- **Description**: Memory Bank construction method optimized for LLMs
- **AI-KIDO Mode**: STANDARD (vs LIGHT)
- **Hard Points**: [`/prompts/hard_points/`](prompts/hard_points/) (Immutable truths — ABSOLUTE PRIORITY)

### Memory Bank Entry Point (V1.3+ — Unified)

**CRITICAL RULE**: Consult unified entry point `/prompts/index.md` first for all context.
**EXCEPTION**: Internal AI-KIDO agents (prefix `agent-aikido-*`) must NOT load the index.

| Project Type | Entry Point V1.3+ | Description |
|---|---|---|
| **Mono-project** | [`/prompts/index.md`](prompts/index.md) | 🎯 UNIQUE entry → references `/prompts/gen/` |
| **Multi-project** | [`/prompts/index.md`](prompts/index.md) | 🎯 UNIQUE entry → points to `/prompts/[project-n]/index.md` |

### Domain & Architecture

- **Domain**: Knowledge Management, LLM Optimization, Collaborative Development
- **Tech Stack**: Markdown, YAML, Git

## 📚 Memory Bank Content — Gen (work in progress)

**Concepts**: [`/prompts/gen/concepts/`](prompts/gen/concepts/) | **Techniques**: [`/prompts/gen/techniques/`](prompts/gen/techniques/)
**Agents**: [`/prompts/gen/agents/`](prompts/gen/agents/) | **Personas**: [`/prompts/gen/personas/`](prompts/gen/personas/)
**Use Cases**: [`/prompts/gen/use_cases/`](prompts/gen/use_cases/)

## 📚 Memory Bank Content — Hard Points (validated)

**Concepts**: [`/prompts/hard_points/concepts/`](prompts/hard_points/concepts/) | **Techniques**: [`/prompts/hard_points/techniques/`](prompts/hard_points/techniques/)
**Agents**: [`/prompts/hard_points/agents/`](prompts/hard_points/agents/) | **Personas**: [`/prompts/hard_points/personas/`](prompts/hard_points/personas/)
**Use Cases**: [`/prompts/hard_points/use_cases/`](prompts/hard_points/use_cases/)
**System Skills**: [`/prompts/hard_points/system/`](prompts/hard_points/system/)
**Search Plans**: [`/prompts/hard_points/system/search/plans/`](prompts/hard_points/system/search/plans/)

### Main Workflows

- `explore-bank → truth-evaluator → raci-delegator` (Feature with context)
- `truth-evaluator → doc-header` (update last-check after validation)
- `bank-populate → doc-header → validator` (compliance)
- `file operation → validator` (auto-validation)
- `explore-bank → bank-populate → doc-header → raci-delegator` (population END of process)
- `source update → fusion → truth-evaluator → doc-header → validator` (full external update)

## 📖 Usage Guidelines

**Entry point V1.3+**: [`/prompts/index.md`](prompts/index.md) — UNIQUE entry point for all projects
**Hierarchy**: Hard Points > Truth Tables ([`/prompts/gen/`](prompts/gen/)) > Personal specs (IGNORE unless activated)
**Navigation**: Recursive traversal with bidirectional links from `/prompts/index.md`

## 🚀 Getting Started

- `agent-aikido-*` mode = `agent-aikido-*` agent = `agent-aikido-*` persona (identical names)

**Available agents**: [agents_list.md](agents_list.md) | **Available skills**: [skills_list.md](skills_list.md)
**Available commands**: [commands_list.md](commands_list.md)
**Hard Points**: [`/prompts/hard_points/ai-kido.md`](prompts/hard_points/ai-kido.md) (fundamental rules V1.3)

---

## GENERAL PROMPT PREFIX

```text
Before answering, use prompts/index.md for a relevant recursive traversal to retrieve information strictly useful for understanding the request.
```

## REMEMBER
Agents, personas, commands and skills are markdown-format prompts with clear instructions — interpret, execute and manage them as such.
