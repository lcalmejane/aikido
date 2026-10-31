# {{PROJECT_NAME}} - AI-KIDO Knowledge Base

> **AI-KIDO**: {{AIKIDO_VERSION}} | **Mode**: LIGHT | **Entry Point**: `/prompts/index.md`

This file is the **unique entry point** of the project's AI-KIDO Memory Bank (Truth Tables).
Navigate recursively from here and load only what the current request needs.

## Rules

**[AI-KIDO Light - Guide](hard_points/ai-kido-light.md)** - ABSOLUTE PRIORITY

**[Learned rules](gen/learned.md)** - ALWAYS READ with the guide above (written by `/learn`, may be empty).

Hierarchy: [`hard_points/`](hard_points/index.md) (method, immutable) > [`gen/`](gen/index.md)
(project Truth Tables) > [`spec/`](spec/index.md) (personal, ignored unless explicitly activated).

### Log Traceability

LLM_TRACIBILITY=FALSE - set to TRUE to enable logging, see [`hard_points/gestion-logs-aikido.md`](hard_points/gestion-logs-aikido.md).

## Structure

- [`gen/concepts/`](gen/concepts/index.md): Core concepts (unified files preferred)
- [`gen/techniques/`](gen/techniques/index.md): Practical methods
- [`gen/personas/`](gen/personas/index.md): Role prompts (3-5 max)
- [`gen/use_cases/`](gen/use_cases/index.md): Context applications (3-5 max)
- [`hard_points/`](hard_points/index.md): Immutable truths - absolute priority
- [`spec/`](spec/index.md): Personal space - ignored unless explicitly activated

Run `/init-aikido` to describe the project context, domain and stack here.
