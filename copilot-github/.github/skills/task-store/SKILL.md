---
name: task-store
description: "Manage private AI-KIDO task cards, plans and workflows with deterministic Node commands and an external authenticated host."
---

# AI-KIDO Task Store

Use the installed `task-store/task.mjs` script with Node 24+, or the
`@aikido-method/cli/task-store` package API. The canonical runtime, CLI, declarations
and data/API contract are shipped in this Skill directory. Do not edit private
task JSON, projections or journals directly, and never use an LLM to choose or
apply a state transition.

## Commands

- `node <task-store-dir>/task.mjs task store init|doctor|reconcile`
- `node <task-store-dir>/task.mjs task workflow create|update|register|validate|list|show ...`
- `node <task-store-dir>/task.mjs plan import --source <workspace-relative-plan-path> [--workflow <id> --workflow-version <version>]`
- `node <task-store-dir>/task.mjs plan import --source <workspace-relative-plan-path> --confirm-create --expected-sha256 <reviewed-source-hash> --expected-workflow-sha256 <reviewed-workflow-hash>`
- `node <task-store-dir>/task.mjs plan import --plan-id <id> --revision <reviewed-revision> --confirm-instantiate`
- `node <task-store-dir>/task.mjs task plan create|list|show|update|instantiate ...`
- `node <task-store-dir>/task.mjs task create|list|show|update|link|transition|accept ...`
- `node <task-store-dir>/task.mjs task schedule <id> --at <ISO-with-offset> --timezone <IANA> --revision <n>`
- `node <task-store-dir>/task.mjs task schedule-result <id> --file <host-outcome.json> --revision <n>`
- `node <task-store-dir>/task.mjs task host-command prepare-create --file <private-submission.json> --service-file <authenticated-descriptor.json>`
- `node <task-store-dir>/task.mjs task host-command prepare-schedule --file <private-submission.json> --service-file <authenticated-descriptor.json> --task-file <actual-host-result.json> [--task-id <id>]`
- `node <task-store-dir>/task.mjs task run --due` (preview only)
- `node <task-store-dir>/task.mjs task pause|resume|cancel|archive|restore ...`
- `node <task-store-dir>/task.mjs task purge-preview`, then `purge --confirm-token <token>`

The CLI binds the invoking OS user as actor. Product adapters bind actor,
workspace/session scope, host and capabilities from authenticated host context.
Never accept them from card JSON, event payloads or model output.

## Host boundary

- AI-KIDO is a knowledge base and deterministic Node library, not a server,
  scheduler, worker, watcher or orchestration runtime. It starts no resident
  process and makes no network calls.
- `scheduleTask` records intent only. `recordScheduleOutcome` persists
  `requested | acknowledged | unavailable | error`; a date cannot wake a
  closed CLI/IDE. `task run --due` only previews.
- `host-command prepare-create|prepare-schedule` only prepares typed envelopes.
  Inputs and descriptors are private files, never argv. Envelopes contain no
  credentials and have `executed: false`; only a discovered authenticated host
  adapter may invoke them. Preparation cannot authenticate a supplied
  descriptor or acknowledgement.
- Preparation requires an enabled `task-service/1` descriptor scoped to a
  project/session and an advertised enabled `core-agent` target. Cloud, AI Hub
  and other targets are unavailable. Schedule timestamps must be future ISO
  timestamps whose offset matches a valid IANA timezone.
- Target selection is client-side envelope metadata. Never send `targetId` as
  a Core command input; Core derives the authorized route from session settings.
- Create envelopes pin `automatic@1.0.0` by default, or preserve a supplied
  `workflowId`/`workflowVersion` pair. Core create accepts and validates that
  pair; schedule commands do not carry workflow fields. Core currently exposes
  no workflow-discovery route, so do not invent custom workflow IDs.
- `TaskStore.createTask` and CLI `task create` pin `automatic@1.0.0` when the
  workflow is omitted. Backlog cards stay at `plan`; only an explicit ready or
  schedule approval advances this exact built-in workflow to `execute`.
- Core advances successful/partial results to `verify` while the card remains
  in `review`. Explicit acceptance advances `verify → approve → complete`;
  marking the card `done` remains a separate explicit transition. Custom
  workflows are not auto-advanced or skipped.
- Reuse a submission ID after a lost create acknowledgement. Replay the exact
  schedule envelope after an unknown outcome. Only after a definite host
  rejection may a caller refresh the same card's revision and increment
  `scheduleAttempt`. Preparation is never a host acknowledgement.
- `prepareDispatch` creates the task/attempt before an authenticated host
  dispatch. The host starts it with `markAttemptStarted` and records async
  callbacks through `recordPoolEvent` (`task-event/1`). Results require separate
  explicit acceptance and transition to `done`.
- Hooks are versioned references; only the verified host registers and runs
  them. The store records/deduplicates invocations and validates typed commands
  returned by the host. A `beforeTransition` hook must be evaluated by the
  host before its matching revision-checked transition.
- Watchers and callbacks are host-owned. If the selected host lacks a verified
  capability, record it as unavailable; never simulate scheduling or sync.
- Keep cards, prompts, attempts and event journals outside Git, Memory Bank,
  Kimono, RAG, shared exports and model/tool output.
- Historical analysis and code-search Markdown plans can be imported without
  changing their Git source. Import preserves the exact source text in one
  private plan, records its SHA-256 and immutable workflow pin, and reports
  unsupported formats instead of guessing at structure. Preview is read-only;
  `--confirm-create` plus the reviewed source and workflow hashes requires
  separate user approval. Imported plans require a second, separate approval
  bound to the reviewed plan revision via `--confirm-instantiate`; this creates
  backlog cards only and never dispatches or schedules work.
- Indexing, search, incremental updates, watchers, package generation and
  package validation exclude conventional private paths and custom Task Store
  roots identified by their `store.json` schema. Private content is not a
  shared export format.

See `task-store.md` for the data model and public API.
