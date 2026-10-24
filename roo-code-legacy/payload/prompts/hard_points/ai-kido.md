# AI‑KIDO – Practical LLM Guide

> **Version**: 1.3.1‑LLM | **Usage**: Direct reference for LLM interactions

## GENERAL PROMPT PREFIX
```text
Except for internal "agent‑aikido‑*" agents: before answering, use prompts/index.md for a relevant recursive traversal to retrieve information strictly useful for understanding the request.
```

## EXCEPTIONS
- Internal AI‑KIDO agents (prefix `agent‑aikido‑*`) already have the necessary rules

## NATURE: METHOD + META-HARNESS
- **AI‑KIDO is a method**: rules, truth hierarchy, single entry point — tool- and model-agnostic.
- **The tools are a meta-harness**: the functions built into the knowledge base agents, skills and tools assemble an ad-hoc harness on the fly (context, agents, tools, checks) per task.
- **Generated use cases**: each harness becomes a use case capitalized in `use_cases/`. Details: [Method and meta-harness](ai-kido_details.md#method-and-meta-harness)

## FUNDAMENTAL USAGE RULES (summary)
1. **🌳 Document Tree**: Recursive tree traversal from [`/prompts/index.md`](../index.md)
2. **📊 Theory/Practice Separation**: `concepts/` + `personas/` (theory) vs `techniques/` + `use_cases/` (practice)
3. **🔄 Introspection**: Management rules are part of themselves (this file)
4. **📏 Line Limits**: ≤100 lines (short), ≤500 lines (standard), ≤1000 lines (commands, personas, agents, skills). **CRITICAL**: `prompts/index.md`, `AGENTS.md`, `CLAUDE.md`, `ai-kido.md` and `ai-kido-light.md` MUST stay ≤100 lines (offload to `_details` files). `prompts/hard_points/system/structure/index.json` — no limit.
5. **✂️ Auto-Split**: Intelligent split with preserved links when limit exceeded
6. **🔗 Bidirectional Links**: Systematic A ↔ B chaining
7. **⚖️ Balanced Tree**: Factor 3-7 children/parent, depth ≤ 4 levels
8. **🏗️ Bicephalous Architecture**: `gen/` (mutable) vs `hard_points/` (rigid)
9. **👥 Specialist Agents**: Personas for LLM query optimization
10. **🎭 Orchestrator Agent**: Coordinates specialist agents
11. **🗜️ Semantic Density**: Maximum information, minimum words
12. **📈 Mermaid Diagrams**: Visual compression for semantic density
13. **🔍 Vector Indexing**: Local RAG mode of the workspace
14. **🔄 Continuous Improvement**: Automatic evolution based on needs and LLM
15. **👨‍💼 Role-Based Distribution**: Subdirectories assigned to team members
16. **🤖 AGENTS.md Compliance**: Mandatory sync with AGENTS.md standard
17. **🔄 Agent-Persona Bidirectionality**: 1:1 correspondence between AGENTS.md agents and AI-KIDO personas
18. **⚙️ Commands**: Defined in [`prompts/hard_points/commands/`](prompts/hard_points/commands/) — referenced only in [`AGENTS.md`](AGENTS.md), never in [`index.md`](../gen/index.md)

## AUTO-POPULATION RULES (summary)
- **User Signal**: any reported error immediately creates a preventive rule.
- **Auto-Detection**: 2+ similar errors trigger proactive rule generation.
- **Thresholds**: Critical (immediate), Fast (2×), Standard (3×).
- **Integration**: automatic insertion in the appropriate directory + index update.

## ANALYSIS CAPITALIZATION RULES (summary)
1. Check existence before creation.
2. Systematically consult the `/prompts/gen/` tree.
3. Maximize information density per word.
4. Continuously enrich truth tables.
5. Maintain alignment between all elements.
6. Document every important decision.

## MANDATORY DIRECTORY STRUCTURE (summary)
```
.claude
├── commands/                  # AI-KIDO command mappings
├── agents/                    # AI-KIDO agent mappings
agents_list.md
commands_list.md
AGENTS.md / CLAUDE.md / README.md
/prompts/
├── index.md                    # UNIQUE ENTRY POINT
├── gen/                        # concepts/ techniques/ agents/ personas/ use_cases/
├── hard_points/                # index.md concepts/ techniques/ commands/ system/ agents/ personas/ use_cases/
└── spec/logs/
```

## COMPLIANCE RULES (summary)
- **500 lines max** per hard point file.
- **Semantic density** > 80% useful information.
- **Bidirectional links** mandatory between concepts, techniques, personas and use_cases.
- **Hard points** immutable except via `agent‑aikido‑fusion`.
- **Commands** referenced only in `AGENTS.md`, never in `index.md`.

<details>
<summary>See full detailed document</summary>
[Full content](`prompts/hard_points/ai-kido_details.md`)
</details>
