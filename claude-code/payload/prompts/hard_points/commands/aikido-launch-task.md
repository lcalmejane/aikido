---
description: Launch an explicitly requested private task through a verified authenticated host action.
---

# /aikido-launch-task

Use this only when the user explicitly asks to launch or execute a task. Ordinary
conversation, analysis or implementation requests stay in the current
conversation unless the user asks for a task card.

1. Collect a private prompt, optional title, installed agent/persona, configured
   provider and execution mode. Pin `automatic@1.0.0` by default, or use another
   workflow only when its exact ID/version is available in authenticated host
   context or explicitly provided by the user. Require Act mode; do not bypass
   Plan, permissions or confirmation.
2. Discover the current host's actual authenticated task-action capability.
   The host must authenticate the actor and bind project/session scope itself.
   Select Core Agent only if the live Core descriptor advertises that exact
   enabled target. Copilot Cloud is unavailable/disabled; do not substitute a
   provider, AI Hub, Kimono MCP or local runner.
3. If no real host launch adapter is exposed, stop and report that launch is
   unavailable. Do not create a partial card, infer an MCP tool name, or claim
   that a prepared request was dispatched.
4. Keep the prompt in a private file outside the checkout; never put it in
   command-line arguments, logs, the Memory Bank, Kimono, RAG or shared output.
   The Node task-store CLI may prepare a typed create envelope from private
   files, but it does not authenticate, invoke the host or launch work.
5. Include the selected `workflowId` and `workflowVersion` in the create
   envelope. `task-service/1` create accepts these fields and Core validates
   that the pinned workflow exists. Show the title, agent/provider, exact
   workflow ID/version, scope and target for confirmation before invoking the
   discovered authenticated action. If Core rejects an unavailable workflow,
   do not silently fall back; obtain an explicit selection and use a new
   submission ID.
   The selected Core target is a client-side guard, not a command input;
   Core derives the authorized provider route from session settings.
   Report a launch only from the host's matching verified acknowledgement.
