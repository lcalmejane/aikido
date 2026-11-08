# Private Task Store

The Task Store is a deterministic Node.js library and command distributed with
AI-KIDO. It stores private task cards, plans, workflow snapshots and events. It
is not a server, worker, scheduler, watcher, RAG corpus, or model-managed state
file. AI-KIDO starts no resident process and makes no network requests.

## Private storage and authority

`openTaskStore` requires an existing absolute workspace path and an actor
provided by the caller. By default, data is stored outside the checkout at
`aikido/tasks/<workspace-id>` in the OS user-data directory. The store rejects
paths inside the workspace, symlink components, and writes without its
exclusive lock. The journal is authoritative; projections are reconstructible.

Host adapters MUST derive the actor, workspace/session scope, host identity and
capability evidence from their authenticated host connection. The library
validates actor shape and scope but cannot authenticate external credentials or
prove caller-supplied capability claims. Never accept these values from task
JSON or model output. Cards, prompts, attempts and events stay outside Git,
Memory Bank, Kimono, RAG, shared exports and model/tool output.

## Data model

- Cards have immutable `createdAt`, revision-checked mutations, and `updatedAt`
  only for effective changes. Pass the current integer revision to mutations.
- `parentId` and `dependsOn` form a validated DAG. Required children and
  dependencies must be complete before a parent can become `done`.
- Results (`ok`, `partial`, `blocked`, `error`) are separate from acceptance.
  Results move a task to review or waiting, never to accepted or done.
  `acceptTask` records an explicit authorized decision; `done` is a further
  explicit transition requiring acceptance and verified criteria.
- Rejections require explicit reviewer acknowledgement before resuming.
  Retries are new attempts on the same task.
- Archive is reversible. Purge requires a revision-checked preview and
  confirmation token, then retains only a minimal tombstone.
- Workflow snapshots are immutable `{id, version, sha256, definition}`.
  New tasks pin `automatic@1.0.0` when no workflow is supplied; an explicit
  workflow/version is preserved and an invalid selection is rejected. Backlog
  tasks start at the workflow's `plan` step. Card state and workflow step remain
  separate; plans pin their selected workflow and instantiate a deterministic DAG.

## Hooks and execution

Workflow hooks are declarative `{id, version, sha256, phase}` references only.
They never contain inline code. A host registers and runs approved hook modules
using its own verified execution mechanism. AI-KIDO records hook invocations,
deduplicates them by cause/reference, checks cycles and budgets, and applies
only host-returned typed commands. It does not import, invoke or schedule hook
modules. `beforeTransition` hooks must be evaluated by the host and their
matching results supplied to the revision-checked transition call; otherwise
the transition is rejected.

`prepareDispatch({taskInput,parentTaskId?,assignment?,idempotencyKey,
expectedParentRevision?})` returns exactly `{task,attempt}` after persisting a
child card and queued attempt. `taskInput` includes a required `title` and
optional `summary`, `prompt`, `inputRefs`, `labels`, `backlogId`, `priority`,
`parentId`, `dependsOn`, `relatedTo`, `workflowId`, `workflowVersion`,
`workflowSha256`, `planId`, `stepId`, `required`, `acceptanceCriteria`,
`retryPolicy`, dates and `timezone`. The host persists that returned binding
before spawning its own worker, then calls
`markAttemptStarted(taskId,attemptId,{expectedRevision,leaseId?})` immediately
before execution; that returns the updated `{task,attempt}` with a lease.
AI-KIDO defines no provider-neutral serialized dispatch request and does not
call a dispatcher. The authenticated host owns its own execution request,
hook registration, polling and callback delivery. A worker result does not
accept or finish its parent.

The host advances the built-in automatic path only after an explicit ready or
schedule approval, advances successful/partial execution to `verify` while the
card enters `review`, and records explicit human acceptance before moving to
`complete`. A separate explicit transition is still required to mark a task
`done`. Custom workflows are never skipped by this automatic path.

## Host scheduling and callbacks

`scheduleTask(id, {scheduledAt, timezone, notBefore?, dueAt?, policy?},
{expectedRevision})` records local intent only; it does not dispatch, register
a job or wake a closed application. The card's
`scheduleRegistration.status` starts as `intent-recorded`.
`recordScheduleOutcome(id, outcome, {expectedRevision})` records an event with
required `eventId`, `correlationId`, and status `requested`, `acknowledged`,
`unavailable` or `error`. `requested` requires the selected host identity and
host-verified capability evidence `{capability:"task-scheduling",
supported:true,verifiedAt,source}`. `acknowledged` requires a host `jobId` or
`subscriptionId`; `error` requires `{code, message}`. Repeated event IDs are
idempotent; reuse with different content fails. The host owns the actual
schedule API call and its async callbacks.

`dispatchDue()` is a read-only preview. `dispatchDue({dryRun:false})` fails
with `dispatcher_unavailable`. Only the host can execute a task.

Host lifecycle callbacks use `recordPoolEvent` with
`schemaVersion: "task-event/1"`, `eventId`, `taskId`, optional `attemptId`,
`origin`, optional `sequence`/`revision`, timestamp, type
(`spawn`, `start`, `result`, `reset`, `close`, or `peer-message`), payload and
optional asserted scope. Events are deduplicated and correlated to the task
and attempt. Host callbacks must bind actor identity through the authenticated
adapter, not event JSON. Acceptance is not a pool event: call
`acceptTask(id,{accepted,reason},{expectedRevision,eventId?})` after host
authorization. A duplicate acceptance event ID for the same action returns
the current card without a new revision; conflicting reuse fails.

Watchers are also host-owned and opt-in. The package defines no watcher
registration API or background loop. A host without verified schedule/event
capabilities records `unavailable`; it must not claim execution or sync.

## API and command

The npm package exports the same engine as `@aikido-method/cli/task-store` (Node.js
24+). The installed system Skill contains `index.mjs`, `index.d.ts`, `cli.mjs`
and `task.mjs`; it can be used without the npm package:

```js
import { openTaskStore } from '@aikido-method/cli/task-store';

const store = openTaskStore({
  workspacePath: realProjectRoot,
  actor: { id: authenticatedActorId, type: 'host', scope: { projectId } },
});
```

Invoke the installed deterministic command as
`node <installed-task-store-directory>/task.mjs task ...`, or use
`aikido task ...` from the npm package. The CLI uses the invoking OS user as a
local actor and is not a product authentication boundary.

```text
aikido task store init|doctor|reconcile
aikido task workflow register --file <workflow.json>
aikido task workflow create --file <workflow.json>
aikido task workflow update <id> --file <new-version.json>
aikido task workflow validate --file <workflow.json>
aikido task workflow list|show <id>
aikido task plan create|list|show|update|instantiate ...
aikido task create|list|show|update|link|transition|accept ...
aikido task host-command prepare-create --file <private-submission.json> --service-file <authenticated-descriptor.json>
aikido task host-command prepare-schedule --file <private-submission.json> --service-file <authenticated-descriptor.json> --task-file <actual-host-result.json> [--task-id <id>]
aikido task schedule <id> --at <ISO-8601-offset> --timezone <IANA> --revision <n>
aikido task schedule-result <id> --file <host-outcome.json> --revision <n>
aikido task run --due [--confirm-missed]
aikido task pause|resume|cancel|archive|restore <id> --revision <n>
aikido task purge-preview [--before <timestamp>]
aikido task purge --confirm-token <token>
```

Input JSON may contain private content; keep it outside the checkout.
Workflow validation does not open or create a private store. Updates register
an immutable version; they never rewrite snapshots pinned by existing plans.
Mutations require current revisions and acceptance requires an explicit
boolean. Purge requires a token from a prior preview.

`host-command prepare-create|prepare-schedule` reads private JSON files and
emits a `task-host-command/1` envelope with `executed: false`. It is offline
preparation only: it includes no credentials, does not authenticate a caller,
invoke an API, persist a remote acknowledgement, dispatch work or start a
scheduler. A real host adapter must discover the live authenticated
`task-service/1` descriptor, bind its project/session scope and invoke the
envelope. Preparation requires the descriptor to advertise enabled Core
Agent scheduling; Copilot Cloud, AI Hubs and unadvertised targets are
unavailable. The selected Core target is recorded as envelope metadata only;
Core commands do not receive `targetId`, and Core selects the authorized route
from session settings. The submission file uses `schemaVersion: "task-submission/1"`
with a stable `submissionId`, private `prompt`, optional `title`, installed
`agent`, `mode: "act"` and an optional workflow pair (`workflowId`,
`workflowVersion`). By default the create envelope pins `automatic@1.0.0`;
custom workflow IDs must be paired with an explicit version. Core
`task-service/1` create accepts these two fields and validates that the pinned
workflow exists. The schedule command does not accept workflow fields. For
scheduling, include future `scheduledAt` with an explicit offset plus a
matching IANA `timezone`. `scheduleAttempt` defaults to 1.

The current Core service has no workflow-discovery route. Use an exact custom
workflow ID/version only when available from authenticated host context or
provided by the user; Core validates it on create. If validation rejects it,
do not silently substitute another workflow. Changing workflow after an
uncertain create outcome requires resolving the original command before
starting a new submission.

The create envelope's command ID is stable for the submission ID, so a lost
create acknowledgement can be retried without creating a second card. Schedule
preparation requires an actual matching create acknowledgement, or after a
definite rejection an authenticated `task-snapshot/1` plus `--task-id`. The
schedule envelope uses the card's current revision. Replay the exact envelope
after an unknown outcome; only after a definite rejection refresh the same
card and increment `scheduleAttempt` to create a new command ID. Report success
only from an actual host acknowledgement matching the command ID and containing
the job ID and acknowledgement ID. Never synthesize an acknowledgement from
the prepared envelope.

## Deterministic testing

Tests and embedding hosts can inject `clock` and `idGenerator` through
`openTaskStore` to verify timestamps, IDs, idempotency, interruption recovery,
schedule callbacks and retry behavior without relying on wall-clock time or
random values.
