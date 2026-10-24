# {{PROJECT_NAME}} - AI-KIDO Knowledge Base

> **AI-KIDO**: {{AIKIDO_VERSION}} | **Entry Point**: `/prompts/index.md`

AIKIDO_MODE: UNSET

The AI-KIDO method is installed in [`hard_points/`](hard_points/index.md) but the Memory Bank
is **not initialized** yet. Run `/init-aikido`: it asks for the mode (STANDARD or LIGHT)
and replaces this file with the project's entry point.

LLM_TRACIBILITY=FALSE

## Structure

- [`gen/`](gen/index.md): Project Truth Tables (empty until initialization)
- [`hard_points/`](hard_points/index.md): Immutable truths - absolute priority
- [`spec/`](spec/index.md): Personal space - ignored unless explicitly activated
