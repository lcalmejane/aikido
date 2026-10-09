# AI-KIDO Copilot Integration

Follow [AGENTS.md](../AGENTS.md) for Memory Bank navigation and JSON exchanges.

The [AI-KIDO orchestrator](agents/agent-aikido-orchestrator.agent.md) always
works. With a complete inventory and no other general orchestrator it leads.
If another general orchestrator exists in registered agents or tools, it
collaborates: it follows that orchestrator's definition, guides it with a JSON
plan, runs direct/MCP tasks itself and takes over only what it verifiably cannot
do (for example parallel tasks). If the inventory cannot be established it works
directly. Selecting a model from Claude does not change the Copilot harness identity.

Bind delegation and MCP calls to the Tools actually exposed in the current
context, using their exact names and schemas. Do not require `new_task` or any
other harness-specific API. Worker Tools/MCP are not implicitly inherited.
The agent chooses sequential or parallel ready batches from dependencies,
resource locks, accepted results and the concurrency each executor really has.

Every exchange with agents, threads, MCP tools and the native orchestrator is
one strict JSON object ([contract](../prompts/hard_points/system/orchestrator/contract.schema.json)).

Instructions cannot intercept every prompt, hide an agent, switch the running
model or create provider connections. Automatic enforcement requires a host
adapter calling the [decision evaluator](../prompts/hard_points/system/orchestrator/runtime.mjs)
before dispatch; otherwise use the Copilot agent selector and the prompt rules.
