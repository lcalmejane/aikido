---
description: Schedule an explicitly requested private task through a verified authenticated Core host action.
---

# /aikido-schedule-task

Use this only when the user explicitly asks to create and schedule a task.
Ordinary conversation stays in the current conversation. For immediate
execution, use `/aikido-launch-task`; do not turn an immediate request into a
resident AI-KIDO scheduler.

1. Collect the private prompt, optional title, installed agent/persona,
   configured provider, `automatic@1.0.0` by default (or an exact other
   workflow ID/version available in authenticated host context or specified by
   the user), Act mode, future date/time and its IANA timezone.
   Reject invalid, past or ambiguous local times; confirm the displayed
   timezone instead of silently assuming UTC.
2. Discover the live authenticated `task-service/1` descriptor and current
   project/session scope from the host. Proceed only when commands and
   scheduling are enabled and `core-agent` is explicitly advertised as an
   enabled Core target. Copilot Cloud remains disabled; other providers,
   AI Hubs and Kimono MCP are not substitutes.
3. If no real authenticated host command adapter is exposed, stop before
   mutation and report scheduling unavailable. Do not invent a tool name or
   claim that the local Task Store CLI can schedule remote work.
4. Store prompt and schedule inputs in private files outside the checkout, not
   argv. `aikido task host-command prepare-create` emits a typed create command
   envelope; invoke it through the discovered authenticated host adapter and
   retain its actual matching `task-command-result/1` acknowledgement. Then
   run `aikido task host-command prepare-schedule` with that result (or a fresh
   authenticated `task-snapshot/1` after a definite rejection) to prepare the
   schedule envelope.
   The create command carries `workflowId` and `workflowVersion` (both are
   accepted by `task-service/1` create); Core validates and pins that workflow
   before the separate schedule command. The schedule command itself does not
   take workflow fields or `targetId`; the selected Core target is a
   client-side guard and Core derives the route from session settings. If Core
   rejects an unavailable workflow, never silently substitute another one.
5. An unknown/network outcome must replay the exact same command ID and body.
   After a definite host rejection, refresh the same card's revision and
   increment `scheduleAttempt` in the private input before preparing a new
   schedule command. Never create a replacement card for a schedule retry.
6. Claim success only when the host returns a matching command ID and actual
   job ID/acknowledgement ID. The CLI only prepares envelopes; it does not
   dispatch, schedule, persist a remote acknowledgement or run a background
   scheduler.
