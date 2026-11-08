# AI Hub capabilities and stateful worker contract

> **Version**: 1.0 | **Date**: 2026-11-07 | **Status**: Active

Navigation: [Swarm](swarm.md) · [Orchestration skill](SKILL.md) ·
[Task exchanges](contract.schema.json) · [Capability schema](ai-hub.schema.json).

## Hub, model and MCP are separate objects

An AI Hub is the authorized execution host: it discovers capabilities, owns
worker state and dispatches tasks. A model API alone is not a Hub.
A Kimono MCP knowledge server alone is not a worker pool. An adapter may combine
them without making model selection, credentials or parent tools inheritable.
Tatami Core is the default Hub in the Tatami stack. Tatami Agent may use a local
Hub in standalone VS Code, or an authorized remote Hub through a compatible
adapter. A future provider connector is not evidence of current availability.

## Discovery and negotiation

`ai-hub/1` describes a verified, authenticated, project-scoped host using
[ai-hub.schema.json](ai-hub.schema.json). Capture the descriptor after connection
and revalidate when reconnecting or switching project, hub or permissions.
The Tatami-compatible REST facade exposes it at
`GET /api/workspaces/:projectId/agent/hub`; other hosts bind their real discovery
tool and transport. Do not send a Tatami request to an arbitrary provider API.

The capabilities are independent booleans:
`pool`, `state`, `retain`, `reset`, `peerMessaging`, `parallel`,
`cancellation`, `persistence`. Unsupported capabilities stay disabled.
Activation can be automatic and invisible in the UI, never invisible to
permissions, execution traces, errors or acceptance checks.

Intersect server capabilities, adapter support, worker tool selection and
project/Plan permissions. Missing discovery is not permission to assume support.
A legacy connection may keep its previously supported ordinary chat path,
without claiming pool capabilities. Malformed descriptors, unknown versions,
wrong project IDs and contradictory limits must produce explicit errors.
`maxParallel <= maxWorkers`; parallel execution requires `maxParallel > 1`.
State/reuse/peer features require a pool. A pool using AI-KIDO exchanges declares
`task-request/2` and `task-result/1`. Names identify bindings, not authority.

## Worker tool bindings

The `ai-hub/1` facade exposes these normalized tool IDs and input shapes.
An adapter must actually register them and translate to the provider's verified
native operations; the model must never invent aliases for unavailable tools.
Other native hosts can follow the Swarm policy without claiming this facade.
The transport
validates its own schema and derives the actor from the authorized worker,
not from a `sender` or `caller` supplied in arguments.

| Binding | Input | Effect |
|---|---|---|
| `agent_pool_spawn` | `{agent, request, taskId?}` | Select and validate a pending task, open separate context, return handle without waiting |
| `agent_pool_resume` | `{workerId, request, taskId?}` | Same-task idle follow-up; after verified reset, a fresh assignment |
| `agent_pool_status` | `{workerId?}` | Actual bounded state, not inferred model progress |
| `agent_pool_wait` | `{workerId, timeoutMs?}` | Bounded completion wait, no busy polling |
| `agent_pool_send` | `{recipient, message}` | Host-bound sender, scoped provisional JSON finding |
| `agent_pool_receive` | `{}` | Receive the actor's bounded mailbox |
| `agent_pool_reset` | `{workerId}` | Clear idle worker history, task-local state and mailbox/membership |
| `agent_pool_close` | `{workerId}` | Cancel and retire; wait for owned execution to settle |
| `agent_pool_accept` | `{workerId, accepted, reason}` | Coordinator decision, distinct from result validity or tool success |

In model-facing facade tools, `request` and `message` are strings containing
exactly one strict `task-request/2` or `task-result/1` JSON object, respectively,
without fences or surrounding text. This binding supports strict tool schemas
without stripping the contract's open context/route dictionaries. The host
parses and canonically validates the string; native in-process callers may pass
the same object directly. Adapter responses may carry state and
metadata, but the worker's final result itself must be `task-result/1`.
Use the canonical dependency-free [exchange validator](exchange.mjs).
The [offline runtime](runtime.mjs) delegates exchange validation to it.

The host binds the request, task ID, persona, project/session and thread handle.
A thread's final result must carry the assigned handle, not another worker's.
Malformed output is an execution error, never converted to a fabricated `ok`.
Task-result `ok` proves neither acceptance nor correctness. Only the coordinator
releases dependencies after recorded acceptance against the assigned checks.
`taskId` is required when the request contains more than one task. Dependencies
refer to tasks in that full plan; the host selects one assignment per worker.
Client-supplied task `state` or `acceptance_verified` cannot grant acceptance.
Only the host's recorded coordinator decisions release queued dependents.

## State, concurrency and communication

The reference lifecycle includes queued/running, idle, interrupted and closed
states. An idle worker may have an explicit failed task result; lifecycle and
task-result status are separate. Exact names are advertised by the adapter.
A busy worker cannot
accept a concurrent conversation turn, change persona or reset. Resume verifies
request/task identity, current sources, model route, allowed tools and trust
boundary. New assignments need a fresh worker or verified reset.
Each reset invalidates old task membership, pending messages and acceptance;
stale generation handles must never deliver traffic to a new assignment.

Workers remain bounded by hub limits, task budgets, dependency gates and
hierarchical read/write resource locks. Those locks coordinate the pool only,
not external editors, Git operations or another host. Declared resource ownership
does not itself enforce file access; host tools enforce the task's permitted scope.
Opaque mutable shell, install or import tools require a whole-workspace scope
and coarse lock when the host cannot confine their effects to narrower grants.
A working directory alone is not confinement. A local unsandboxed shell cannot
prove read-only effects merely from declared resource metadata.
Peer messaging does not imply parallel execution. A mailbox message is
provisional and cannot accept a task, grant tools, change scope or overwrite
coordinator instructions. No mutual waits or unbounded broadcasts.

If persistence is advertised, snapshots include task identity, retained history,
mailboxes, generation and acceptance, stored under the authenticated session.
On process restart, active execution is explicitly interrupted; never pretend a
model/process continued or re-execute side effects implicitly. History-based
resume is not a provider's native session resume. Cancellation does not revert
external files. Reset clears task context, not external files or credentials.

## Distribution and future adapters

Hub adapters and portable engines belong in their owning product repositories,
not in the knowledge base. Ship explicit reviewed snapshots with hashes and
truthful source provenance; independent builds must not reach sibling/private
repositories. A capability cannot be enabled solely by installing these rules.

Provider-specific Cloud/CLI connectors, cross-Hub delegation, remote reconnect,
durable distributed resource leases and Tatami IDE are separate integrations.
Before advertising them, test their real authorization, concurrency, cancellation,
mailbox and lifecycle semantics against this contract; use safe fallback when a
provider only offers one-shot work.
