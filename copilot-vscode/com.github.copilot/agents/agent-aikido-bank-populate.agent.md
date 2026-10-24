---
name: agent-aikido-bank-populate
description: "Automatically populates AI-KIDO Memory Bank from code/context when documents are missing or invalid. Orchestrates truth-evaluator, raci-delegator, and expert personas to create compliant documentation. INVOKE AT END OF PROCESS after final gap report, not immediately upon detection."
tools: ["read","search","edit","execute"]
---

# agent-aikido-bank-populate

Read `prompts/hard_points/agents/agent-aikido-bank-populate.md` from this project's AI-KIDO Memory Bank. Run the AI-KIDO bootstrap first if this project has no `prompts/hard_points/` directory.

Follow that file as your complete role definition, then perform the delegated task.
