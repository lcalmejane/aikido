## AI-KIDO Memory Bank

This project uses AI-KIDO {{AIKIDO_VERSION}}, an AI Memory Bank construction method by meta-harness.

- **Entry point**: read [`prompts/index.md`](prompts/index.md) first and follow its links recursively,
  loading only what the request needs.
- **Priority**: `prompts/hard_points/` (method, immutable) > `prompts/gen/` (project Truth Tables)
  > `prompts/spec/` (personal, ignored unless explicitly activated).
- **Internal agents** (`agent-aikido-*`) do not load `prompts/index.md`; exchanges with them are strict JSON.
- **Orchestration**: [`agent-aikido-orchestrator`](prompts/hard_points/agents/agent-aikido-orchestrator.md)
  collaborates with the host's native orchestrator when one exists.
- **Catalog**: [agents](agents_list.md) | [commands](commands_list.md) | [skills](skills_list.md)
