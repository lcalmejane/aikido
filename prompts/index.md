# AI-KIDO Knowledge Base

> **Version**: 1.3 | **Entry Point**: `/prompts/index.md` (UNIFIED since V1.3)

This file is the **UNIQUE entry point** of the AI‑KIDO **Truth Tables**. It references directories containing concepts, techniques, personas, use cases, hard points (immutable truths), and personal specs.

## Truth Tables System

The **Truth Tables** form our hierarchical memory system for capitalizing and structuring AI‑KIDO knowledge with bidirectional links.

### Log Traceability

LLM_TRACIBILITY=TRUE — retain this value to know whether traceability is active.
**If traceability is active, read the doc in** [`hard_points/gestion-logs-aikido.md`](hard_points/gestion-logs-aikido.md)

**🚨 AUTOMATIC LOGGING RULE:**
When a user interaction is detected and `LLM_TRACIBILITY=TRUE`:
1. Switch to CODE mode (if needed)
2. Write immediately to `/prompts/spec/logs/prompts.log`
3. Return to original mode to handle the request
This sequence runs BEFORE any other operation.

### ⚠️ PRIORITY RULES — AI-KIDO

**[AI-KIDO — Complete Guide](hard_points/ai-kido.md)** — ABSOLUTE PRIORITY (V1.3)

- **Architecture**: Tree structure, theory/practice separation, introspection, 500 lines max
- **Auto-Population**: Automatic trigger on error, adaptive thresholds
- **Agents**: Specialists + orchestrator, semantic density, vector indexing
- **Continuous Improvement**: Automatic evolution based on needs and LLM
- **Logs**: Conditional traceability, markdown format, structured storage

## Structure

- [`gen/concepts/`](gen/concepts/index.md) : Core concepts (1 file)
- [`gen/techniques/`](gen/techniques/index.md) : Practical methods (1 file)
- [`gen/personas/`](gen/personas/index.md) : Role prompts (12 agents)
- [`gen/use_cases/`](gen/use_cases/index.md) : Context applications (0 file)
- [`hard_points/`](hard_points/index.md) : Immutable truths — Absolute priority
  - [`hard_points/system/search/plans/`](hard_points/system/search/plans/) : Code search plans (3 plans: generic, php, javascript)
- [`spec/`](spec/index.md) : Personal space — Ignored unless explicitly activated
