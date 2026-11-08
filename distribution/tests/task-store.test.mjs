import { after, test } from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { createHash, randomUUID } from 'node:crypto';
import {
  appendFileSync, existsSync, mkdirSync, readFileSync, rmSync, unlinkSync, writeFileSync,
} from 'node:fs';
import { homedir } from 'node:os';
import { join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  openTaskStore, resolveTaskStoreRoot, TASK_EVENT_SCHEMA,
  validateWorkflow,
} from '../lib/task-store/index.mjs';
import * as taskStoreModule from '../lib/task-store/index.mjs';
import { runTaskCLI } from '../lib/task-store/cli.mjs';
import {
  createPrivatePlan, instantiatePrivatePlan, preparePrivatePlan,
} from '../lib/task-store/private-plan-import.mjs';
import { nativeCommandWrapper, validateCatalog } from '../scripts/build.mjs';

const REPO = resolve(fileURLToPath(new URL('../..', import.meta.url)));
const userData = process.platform === 'darwin'
  ? join(homedir(), 'Library', 'Application Support')
  : process.platform === 'win32'
    ? join(process.env.LOCALAPPDATA || homedir(), 'aikido-task-store-tests')
    : join(process.env.XDG_DATA_HOME || join(homedir(), '.local', 'share'), 'aikido-task-store-tests');
const runRoot = join(userData, `aikido-task-store-tests-${process.pid}-${randomUUID()}`);
mkdirSync(runRoot, { recursive: true, mode: 0o700 });
let clockMs = Date.parse('2026-11-07T10:00:00.000Z');
let idCounter = 0;
const nextId = () => `test-${++idCounter}`;
const actor = { id: 'alice', type: 'human', scope: { projectId: 'project-a' } };

function harness(name) {
  const storeRoot = join(runRoot, name);
  const open = (options = {}) => openTaskStore({
    workspacePath: REPO,
    storeRoot,
    actor,
    clock: () => new Date(clockMs),
    idGenerator: nextId,
    ...options,
  });
  return { storeRoot, open };
}

function preservedPlanSource(prompt) {
  const marker = '--- exact source begins ---\n';
  const start = prompt.indexOf(marker);
  const end = prompt.lastIndexOf('\n--- exact source ends ---');
  assert.ok(start >= 0 && end > start, 'plan prompt has explicit source boundaries');
  return prompt.slice(start + marker.length, end);
}

function runNextHostHook(store, hooks, authorize = () => true) {
  const intent = store.listPendingHookInvocations()[0];
  if (!intent) return null;
  const hook = hooks.find((item) => item.id === intent.hook.id
    && item.version === intent.hook.version && item.sha256 === intent.hook.sha256);
  assert.ok(hook, `host hook is registered: ${intent.hook.id}@${intent.hook.version}`);
  const output = hook.run(intent.context);
  const commands = Array.isArray(output) ? output : output?.commands ?? [];
  return store.applyHookCommands(intent.id, commands, { authorize });
}

function advanceAutomaticToComplete(store, task) {
  let current = task;
  for (const toStepId of ['execute', 'verify', 'approve', 'complete']) {
    if (current.stepId === toStepId) continue;
    current = store.advanceWorkflow(current.id, { toStepId }, { expectedRevision: current.revision });
  }
  return current;
}

after(() => rmSync(runRoot, { recursive: true, force: true }));

test('default root stays outside the checkout and explicit in-checkout roots are rejected', () => {
  const root = resolveTaskStoreRoot(REPO);
  assert.ok(!root.startsWith(`${REPO}/`));
  const { open } = harness('unsafe-root');
  assert.throws(() => open({ storeRoot: join(REPO, 'distribution', 'tests', 'fixtures', 'private-store') }), {
    code: 'unsafe_path',
  });
});

test('new tasks pin automatic by default, preserve explicit workflows, and relocate projections on advancement', () => {
  const { open, storeRoot } = harness('default-workflow');
  const store = open();
  const workflow = store.getWorkflow('automatic', '1.0.0');
  const backlog = store.createTask({ id: 'default-backlog', title: 'Default workflow' });
  assert.equal(backlog.state, 'backlog');
  assert.equal(backlog.workflowId, workflow.id);
  assert.equal(backlog.workflowVersion, workflow.version);
  assert.equal(backlog.workflowSha256, workflow.sha256);
  assert.equal(backlog.stepId, 'plan');
  assert.equal(backlog.revision, 1);
  const planPath = join(storeRoot, 'boards', 'default', 'automatic', 'plan', `${backlog.id}.json`);
  const executePath = join(storeRoot, 'boards', 'default', 'automatic', 'execute', `${backlog.id}.json`);
  assert.ok(existsSync(planPath));

  const explicit = {
    schemaVersion: 'workflow/1',
    id: 'custom-task-workflow',
    version: '2.0.0',
    entryStepId: 'draft',
    terminalStepIds: ['finished'],
    steps: [
      { id: 'draft', type: 'plan', transitions: ['work'] },
      { id: 'work', type: 'dispatch', transitions: ['finished'] },
      { id: 'finished', type: 'wait', transitions: [] },
    ],
  };
  const customWorkflow = store.registerWorkflow(explicit);
  const custom = store.createTask({
    id: 'custom-task', title: 'Explicit workflow', workflowId: explicit.id, workflowVersion: explicit.version,
  });
  assert.equal(custom.workflowId, explicit.id);
  assert.equal(custom.workflowVersion, explicit.version);
  assert.equal(custom.workflowSha256, customWorkflow.sha256);
  assert.equal(custom.stepId, 'draft');
  assert.throws(() => store.createTask({ title: 'Unknown workflow', workflowId: 'missing-workflow' }), {
    code: 'workflow_missing',
  });
  assert.throws(() => store.createTask({ title: 'Missing workflow ID', workflowVersion: '1.0.0' }), {
    code: 'validation',
  });
  assert.throws(() => store.createTask({ title: 'Empty workflow ID', workflowId: '' }), { code: 'validation' });
  assert.throws(() => store.createTask({ title: 'Null workflow ID', workflowId: null }), { code: 'validation' });

  const advanced = store.advanceWorkflow(backlog.id, { toStepId: 'execute' }, { expectedRevision: backlog.revision });
  assert.equal(advanced.revision, 2);
  assert.equal(advanced.state, 'backlog');
  assert.equal(advanced.stepId, 'execute');
  assert.equal(existsSync(planPath), false);
  assert.ok(existsSync(executePath));
  store.close();
});

test('CLI task creation pins automatic and only advances after explicit ready state', () => {
  const storeRoot = join(runRoot, 'cli-default-workflow-store');
  const inputPath = join(runRoot, 'cli-default-workflow.json');
  writeFileSync(inputPath, JSON.stringify({ title: 'Ready from CLI', state: 'ready' }));
  const ready = runTaskCLI(['task', 'create', '--file', inputPath, '--workspace', REPO, '--store', storeRoot], { cwd: REPO });
  assert.equal(ready.exitCode, 0, ready.result.message);
  assert.equal(ready.result.task.workflowId, 'automatic');
  assert.equal(ready.result.task.workflowVersion, '1.0.0');
  assert.equal(ready.result.task.state, 'ready');
  assert.equal(ready.result.task.stepId, 'execute');

  writeFileSync(inputPath, JSON.stringify({ title: 'Backlog from CLI' }));
  const backlog = runTaskCLI(['task', 'create', '--file', inputPath, '--workspace', REPO, '--store', storeRoot], { cwd: REPO });
  assert.equal(backlog.exitCode, 0, backlog.result.message);
  assert.equal(backlog.result.task.workflowId, 'automatic');
  assert.equal(backlog.result.task.stepId, 'plan');
  assert.equal(backlog.result.task.state, 'backlog');
});

test('workflow CLI validates without a store and updates only immutable matching versions', () => {
  const directory = join(runRoot, 'workflow-cli-input');
  const storeRoot = join(runRoot, 'workflow-cli-store');
  mkdirSync(directory);
  const file = join(directory, 'workflow.json');
  const definition = {
    schemaVersion: 'workflow/1', id: 'cli-workflow', version: '1.0.0',
    entryStepId: 'verify', terminalStepIds: ['verify'],
    steps: [{ id: 'verify', type: 'verify', transitions: [] }],
  };
  writeFileSync(file, JSON.stringify(definition));
  const invoke = (...args) => runTaskCLI([
    'task', 'workflow', ...args, '--workspace', REPO, '--store', storeRoot,
  ]);
  assert.equal(invoke('validate', '--file', file).exitCode, 0);
  assert.equal(existsSync(storeRoot), false);
  assert.equal(invoke('create', '--file', file).exitCode, 0);
  assert.equal(invoke('create', '--file', file).result.code, 'already_exists');
  writeFileSync(file, JSON.stringify({ ...definition, version: '1.1.0' }));
  assert.equal(invoke('update', 'wrong-id', '--file', file).result.code, 'workflow_invalid');
  assert.equal(invoke('update', definition.id, '--file', file).exitCode, 0);
  const original = invoke('show', definition.id, '--workflow-version', '1.0.0').result.workflow;
  assert.deepEqual(original.definition, definition);
  writeFileSync(file, JSON.stringify({ ...definition, entryStepId: 'absent' }));
  assert.equal(invoke('validate', '--file', file).exitCode, 1);
});

test('historical plans preview losslessly, create only with approval, pin workflows and instantiate separately', () => {
  const { open } = harness('historical-plan-import');
  const store = open();
  const analysisPath = 'prompts/hard_points/system/analyse/plans/plan-standard.md';
  const analysisText = readFileSync(join(REPO, analysisPath), 'utf8');
  const analysisHash = createHash('sha256').update(analysisText).digest('hex');
  const preview = preparePrivatePlan({
    store,
    workspacePath: REPO,
    sourcePath: analysisPath,
    expectedSourceHash: analysisHash,
  });
  assert.equal(preview.source.sha256, analysisHash);
  assert.equal(preview.source.kind, 'analysis');
  assert.equal(preview.workflow.id, 'analysis');
  assert.equal(preview.workflow.version, '1.0.0');
  assert.doesNotMatch(JSON.stringify(preview), /Sources to Analyze/);
  assert.throws(() => preparePrivatePlan({
    store,
    workspacePath: REPO,
    sourcePath: analysisPath,
    expectedWorkflowHash: '0'.repeat(64),
  }), { code: 'workflow_changed' });
  assert.throws(() => preparePrivatePlan({
    store, workspacePath: REPO, sourcePath: analysisPath, expectedSourceHash: '0'.repeat(64),
  }), { code: 'source_changed' });
  assert.throws(() => createPrivatePlan({ store, prepared: preview }), {
    code: 'authorization_required',
  });
  const created = createPrivatePlan({ store, prepared: preview, authorized: true });
  assert.equal(created.revision, 1);
  assert.throws(() => store.instantiatePlan(created.planId), { code: 'authorization_required' });
  assert.throws(() => store.instantiatePlan(created.planId, {
    authorized: true, expectedRevision: created.revision + 1,
  }), { code: 'plan_changed' });
  const privatePlan = store.getPlan(created.planId);
  assert.equal(privatePlan.workflow.sha256, preview.workflow.sha256);
  assert.equal(preservedPlanSource(privatePlan.tasks[0].prompt), analysisText);
  assert.match(privatePlan.tasks[0].prompt, new RegExp(analysisHash));
  assert.equal(readFileSync(join(REPO, analysisPath), 'utf8'), analysisText);

  const customDefinition = {
    schemaVersion: 'workflow/1',
    id: 'legacy-search-review',
    version: '2.0.0',
    entryStepId: 'draft',
    terminalStepIds: ['finished'],
    steps: [
      { id: 'draft', type: 'plan', transitions: ['search'] },
      { id: 'search', type: 'dispatch', transitions: ['finished'] },
      { id: 'finished', type: 'wait', transitions: [] },
    ],
  };
  const customWorkflow = store.registerWorkflow(customDefinition);
  const searchPath = 'prompts/hard_points/system/search/plans/plan-generic.md';
  const searchText = readFileSync(join(REPO, searchPath), 'utf8');
  const searchPreview = preparePrivatePlan({
    store,
    workspacePath: REPO,
    sourcePath: searchPath,
    workflowId: customDefinition.id,
    workflowVersion: customDefinition.version,
  });
  assert.equal(searchPreview.source.kind, 'code-search');
  assert.equal(searchPreview.workflow.sha256, customWorkflow.sha256);
  const searchPlan = createPrivatePlan({ store, prepared: searchPreview, authorized: true });
  const savedSearch = store.getPlan(searchPlan.planId);
  assert.equal(preservedPlanSource(savedSearch.tasks[0].prompt), searchText);
  assert.equal(savedSearch.workflow.id, customDefinition.id);
  assert.throws(() => instantiatePrivatePlan({
    store, planId: searchPlan.planId, expectedRevision: searchPlan.revision,
  }), { code: 'authorization_required' });
  assert.throws(() => instantiatePrivatePlan({
    store, planId: searchPlan.planId, expectedRevision: searchPlan.revision + 1, authorized: true,
  }), { code: 'plan_changed' });
  const instantiated = instantiatePrivatePlan({
    store, planId: searchPlan.planId, expectedRevision: searchPlan.revision, authorized: true,
  });
  assert.ok(instantiated.tasks.length > 0);
  assert.ok(instantiated.tasks.every(task => task.state === 'backlog'));
  store.close();
});

test('CLI import binds create approval to preview hash and instantiation to plan revision', () => {
  const storeRoot = join(runRoot, 'historical-plan-cli-store');
  const sourcePath = 'prompts/hard_points/system/search/plans/plan-generic.md';
  const content = readFileSync(join(REPO, sourcePath), 'utf8');
  const sourceHash = createHash('sha256').update(content).digest('hex');
  const invoke = (...args) => runTaskCLI([
    'plan', 'import', ...args, '--workspace', REPO, '--store', storeRoot,
  ], { cwd: REPO });
  const preview = invoke('--source', sourcePath);
  assert.equal(preview.exitCode, 0, preview.result.message);
  assert.equal(preview.result.status, 'preview');
  assert.equal(preview.result.preview.source.sha256, sourceHash);
  assert.doesNotMatch(JSON.stringify(preview.result), /Search Patterns/);
  assert.equal(invoke('--source', sourcePath, '--confirm-create').result.code, 'usage');
  const created = invoke(
    '--source', sourcePath, '--confirm-create',
    '--expected-sha256', sourceHash,
    '--expected-workflow-sha256', preview.result.preview.workflow.sha256,
  );
  assert.equal(created.exitCode, 0, created.result.message);
  assert.equal(created.result.created.source.sha256, sourceHash);
  const withoutApproval = invoke('--plan-id', created.result.created.planId, '--revision', '1');
  assert.equal(withoutApproval.result.code, 'authorization_required');
  const genericWithoutApproval = runTaskCLI([
    'plan', 'instantiate', created.result.created.planId,
    '--workspace', REPO, '--store', storeRoot,
  ], { cwd: REPO });
  assert.equal(genericWithoutApproval.result.code, 'authorization_required');
  const instantiated = invoke(
    '--plan-id', created.result.created.planId, '--revision', '1', '--confirm-instantiate',
  );
  assert.equal(instantiated.exitCode, 0, instantiated.result.message);
  assert.ok(instantiated.result.instantiated.tasks.every(task => task.state === 'backlog'));
});

test('canonical task-store skill runtime is shipped and byte-synced into both distributions', () => {
  const source = join(REPO, 'prompts', 'hard_points', 'system', 'task-store');
  const catalog = JSON.parse(readFileSync(join(REPO, 'distribution', 'catalog.json'), 'utf8'));
  assert.ok(catalog.systemSkills.some((skill) => skill.name === 'task-store'
    && skill.source === 'prompts/hard_points/system/task-store'));
  for (const file of ['index.mjs', 'index.d.ts', 'cli.mjs']) {
    const canonical = readFileSync(join(source, file));
    assert.deepEqual(readFileSync(join(REPO, 'distribution', 'lib', 'task-store', file)), canonical);
    assert.deepEqual(readFileSync(join(REPO, 'distribution', 'npm', 'lib', 'task-store', file)), canonical);
  }
  const canonicalDoc = readFileSync(join(source, 'task-store.md'));
  assert.deepEqual(readFileSync(join(REPO, 'distribution', 'docs', 'task-store.md')), canonicalDoc);
  assert.deepEqual(readFileSync(join(REPO, 'distribution', 'npm', 'docs', 'task-store.md')), canonicalDoc);
  for (const file of ['SKILL.md', 'task-store.md', 'task.mjs']) {
    assert.ok(existsSync(join(source, file)));
  }
  const cli = spawnSync(process.execPath, [
    join(source, 'task.mjs'), 'task', 'store', 'init',
    '--workspace', REPO, '--store', join(runRoot, 'skill-cli-store'),
  ], { encoding: 'utf8' });
  assert.equal(cli.status, 0, cli.stderr);
  assert.equal(JSON.parse(cli.stdout).status, 'ok');
});

test('task, plan and transition operations do not require an LLM or network fetch', () => {
  const { open } = harness('no-model');
  const originalFetch = globalThis.fetch;
  globalThis.fetch = () => { throw new Error('network access is disabled in this test'); };
  try {
    const store = open();
    const plan = store.createPlan({
      id: 'offline-plan', type: 'analysis', title: 'Offline plan',
      tasks: [{ key: 'inspect', title: 'Inspect locally' }],
    });
    const [task] = store.instantiatePlan(plan.id).tasks;
    const ready = store.transitionTask(task.id, { to: 'ready' }, { expectedRevision: task.revision });
    assert.equal(ready.state, 'ready');
    store.close();
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test('CLI requires explicit acceptance outcome', () => {
  const { storeRoot } = harness('cli-accept');
  const initialized = runTaskCLI(['task', 'store', 'init', '--store', storeRoot], { cwd: REPO });
  assert.equal(initialized.exitCode, 0);
  assert.equal(initialized.result.status, 'ok');
  const result = runTaskCLI(['task', 'accept', 'missing', '--revision', '1', '--store', storeRoot], {
    cwd: REPO,
  });
  assert.equal(result.exitCode, 2);
  assert.equal(result.result.code, 'usage');
  assert.match(result.result.message, /--accepted true\|false/);
  const unavailable = runTaskCLI(['task', 'run', '--due', '--execute', '--store', storeRoot], { cwd: REPO });
  assert.equal(unavailable.exitCode, 1);
  assert.equal(unavailable.result.code, 'dispatcher_unavailable');
});

test('host-command preparation is typed, scoped, idempotent and never executes', () => {
  const directory = join(runRoot, 'host-command-input');
  mkdirSync(directory);
  const inputFile = join(directory, 'submission.json');
  const serviceFile = join(directory, 'service.json');
  const taskFile = join(directory, 'host-result.json');
  const taskStoreRoot = join(directory, 'must-not-be-opened');
  const input = {
    schemaVersion: 'task-submission/1',
    submissionId: 'submission-2026-001',
    title: 'Run the requested task',
    prompt: 'Private prompt body',
    agent: 'agents/worker.md',
    mode: 'act',
    scheduledAt: '2030-01-10T10:30:00Z',
    timezone: 'UTC',
  };
  writeFileSync(inputFile, JSON.stringify(input));
  writeFileSync(serviceFile, JSON.stringify({
    schemaVersion: 'task-service/1',
    enabled: true,
    scope: { projectId: 'project-private', sessionId: 'session-private' },
    capabilities: { commands: true, scheduling: true, snapshot: true, events: true, hooks: false },
    targets: [{ id: 'core-agent', label: 'Core Agent', kind: 'core', enabled: true }],
    accessToken: 'must-not-be-copied-to-envelope',
  }));
  const invoke = (...args) => runTaskCLI(['task', 'host-command', ...args, '--store', taskStoreRoot], { cwd: REPO });
  const create = invoke('prepare-create', '--file', inputFile, '--service-file', serviceFile);
  assert.equal(create.exitCode, 0, create.result.message);
  assert.equal(create.result.schemaVersion, 'task-host-command/1');
  assert.equal(create.result.executed, false);
  assert.equal(existsSync(taskStoreRoot), false);
  assert.equal(invoke('prepare-create', 'Private prompt on argv', '--file', inputFile, '--service-file', serviceFile).result.code, 'usage');
  assert.equal(create.result.requiresAuthenticatedHostInvocation, true);
  assert.deepEqual(create.result.service, {
    schemaVersion: 'task-service/1',
    scope: { projectId: 'project-private', sessionId: 'session-private' },
    capability: 'commands',
  });
  assert.deepEqual(create.result.target, { id: 'core-agent' });
  assert.deepEqual(create.result.command, {
    commandId: create.result.command.commandId,
    command: 'create',
    input: {
      title: input.title, prompt: input.prompt, state: 'ready',
      workflowId: 'automatic', workflowVersion: '1.0.0',
    },
  });
  assert.doesNotMatch(JSON.stringify(create.result), /must-not-be-copied/);
  assert.deepEqual(invoke('prepare-create', '--file', inputFile, '--service-file', serviceFile).result, create.result);
  const customWorkflow = {
    ...input, submissionId: 'submission-custom-workflow',
    workflowId: 'review-and-build', workflowVersion: '2.1.0',
  };
  writeFileSync(inputFile, JSON.stringify(customWorkflow));
  const customCreate = invoke('prepare-create', '--file', inputFile, '--service-file', serviceFile);
  assert.equal(customCreate.exitCode, 0, customCreate.result.message);
  assert.deepEqual(
    { workflowId: customCreate.result.command.input.workflowId, workflowVersion: customCreate.result.command.input.workflowVersion },
    { workflowId: 'review-and-build', workflowVersion: '2.1.0' },
  );
  writeFileSync(inputFile, JSON.stringify({
    ...input, submissionId: 'submission-incomplete-workflow', workflowId: 'review-and-build',
  }));
  assert.equal(invoke('prepare-create', '--file', inputFile, '--service-file', serviceFile).result.code, 'host_command_input');
  writeFileSync(inputFile, JSON.stringify(input));
  for (const script of [
    join(REPO, 'distribution', 'npm', 'bin', 'aikido.mjs'),
    join(REPO, 'prompts', 'hard_points', 'system', 'task-store', 'task.mjs'),
  ]) {
    const args = script.endsWith('aikido.mjs')
      ? [script, 'task', 'host-command', 'prepare-create', '--file', inputFile, '--service-file', serviceFile]
      : [script, 'task', 'host-command', 'prepare-create', '--file', inputFile, '--service-file', serviceFile];
    const cli = spawnSync(process.execPath, args, { cwd: REPO, encoding: 'utf8' });
    assert.equal(cli.status, 0, cli.stderr);
    assert.equal(JSON.parse(cli.stdout).executed, false);
  }

  writeFileSync(taskFile, JSON.stringify({
    schemaVersion: 'task-command-result/1',
    commandId: create.result.command.commandId,
    task: { id: 'core-card-1', title: input.title, state: 'ready', revision: 4 },
  }));
  const schedule = invoke('prepare-schedule', '--file', inputFile, '--service-file', serviceFile, '--task-file', taskFile);
  assert.equal(schedule.exitCode, 0, schedule.result.message);
  assert.deepEqual(schedule.result.command, {
    commandId: schedule.result.command.commandId,
    command: 'schedule',
    taskId: 'core-card-1',
    expectedRevision: 4,
    input: {
      scheduledAt: '2030-01-10T10:30:00.000Z',
      timezone: 'UTC',
      agent: 'agents/worker.md',
      mode: 'act',
    },
  });
  assert.deepEqual(schedule.result.target, { id: 'core-agent' });
  assert.equal(Object.hasOwn(schedule.result.command.input, 'targetId'), false);
  assert.equal(schedule.result.executed, false);
  assert.deepEqual(invoke('prepare-schedule', '--file', inputFile, '--service-file', serviceFile, '--task-file', taskFile).result, schedule.result);

  const zonedInput = {
    ...input, submissionId: 'submission-2026-zoned',
    scheduledAt: '2030-01-10T10:30:00+01:00', timezone: 'Europe/Paris',
  };
  writeFileSync(inputFile, JSON.stringify(zonedInput));
  const zonedCreate = invoke('prepare-create', '--file', inputFile, '--service-file', serviceFile);
  writeFileSync(taskFile, JSON.stringify({
    schemaVersion: 'task-command-result/1',
    commandId: zonedCreate.result.command.commandId,
    task: { id: 'core-card-zoned', title: input.title, state: 'ready', revision: 1 },
  }));
  const zonedSchedule = invoke('prepare-schedule', '--file', inputFile, '--service-file', serviceFile, '--task-file', taskFile);
  assert.equal(zonedSchedule.exitCode, 0, zonedSchedule.result.message);
  assert.equal(zonedSchedule.result.command.input.scheduledAt, '2030-01-10T09:30:00.000Z');

  writeFileSync(inputFile, JSON.stringify({ ...input, scheduleAttempt: 2 }));
  writeFileSync(taskFile, JSON.stringify({
    schemaVersion: 'task-snapshot/1',
    tasks: [{ id: 'core-card-1', title: input.title, state: 'ready', revision: 5 }],
    jobs: [],
  }));
  const retry = invoke('prepare-schedule', '--file', inputFile, '--service-file', serviceFile,
    '--task-file', taskFile, '--task-id', 'core-card-1');
  assert.equal(retry.exitCode, 0, retry.result.message);
  assert.equal(retry.result.command.taskId, schedule.result.command.taskId);
  assert.equal(retry.result.command.expectedRevision, 5);
  assert.notEqual(retry.result.command.commandId, schedule.result.command.commandId);
});

test('host-command preparation fails closed for invalid dates, unknown targets and nonmatching acknowledgements', () => {
  const directory = join(runRoot, 'host-command-gates');
  mkdirSync(directory);
  const inputFile = join(directory, 'submission.json');
  const serviceFile = join(directory, 'service.json');
  const taskFile = join(directory, 'host-result.json');
  const input = {
    schemaVersion: 'task-submission/1', submissionId: 'safe-id',
    prompt: 'Private task', agent: 'worker', mode: 'act',
    scheduledAt: '2030-01-10T10:30:00Z', timezone: 'UTC',
  };
  const service = {
    schemaVersion: 'task-service/1', enabled: true,
    scope: { projectId: 'p', sessionId: 's' },
    capabilities: { commands: true, scheduling: true },
    targets: [{ id: 'core-agent', label: 'Core Agent', kind: 'core', enabled: true }],
  };
  writeFileSync(inputFile, JSON.stringify(input));
  writeFileSync(serviceFile, JSON.stringify(service));
  const invoke = (...args) => runTaskCLI(['task', 'host-command', ...args], { cwd: REPO });
  const prepare = () => invoke('prepare-schedule', '--file', inputFile, '--service-file', serviceFile, '--task-file', taskFile);
  writeFileSync(taskFile, JSON.stringify({
    schemaVersion: 'task-command-result/1', commandId: 'wrong-command',
    task: { id: 'card', state: 'ready', revision: 1 },
  }));
  assert.equal(prepare().result.code, 'host_acknowledgement');
  writeFileSync(taskFile, JSON.stringify({
    schemaVersion: 'task-command-result/1',
    commandId: runTaskCLI(['task', 'host-command', 'prepare-create', '--file', inputFile, '--service-file', serviceFile], { cwd: REPO }).result.command.commandId,
    task: { id: 'card', state: 'waiting', revision: 1 },
  }));
  assert.equal(prepare().result.code, 'host_acknowledgement');

  writeFileSync(inputFile, JSON.stringify({ ...input, scheduledAt: '2030-02-30T10:30:00Z' }));
  assert.equal(prepare().result.code, 'host_command_input');
  writeFileSync(inputFile, JSON.stringify({ ...input, scheduledAt: '2020-01-10T10:30:00Z' }));
  assert.equal(prepare().result.code, 'host_command_input');
  writeFileSync(inputFile, JSON.stringify({ ...input, timezone: 'not/a-timezone' }));
  assert.equal(prepare().result.code, 'host_command_input');
  writeFileSync(inputFile, JSON.stringify({ ...input, scheduledAt: '2030-01-10T10:30:00Z', timezone: 'Europe/Paris' }));
  assert.equal(prepare().result.code, 'host_command_input');
  writeFileSync(inputFile, JSON.stringify({ ...input, targetId: 'copilot-cloud' }));
  assert.equal(prepare().result.code, 'host_unavailable');
  writeFileSync(inputFile, JSON.stringify(input));
  writeFileSync(serviceFile, JSON.stringify({ ...service, enabled: false }));
  assert.equal(prepare().result.code, 'host_unavailable');
  writeFileSync(serviceFile, JSON.stringify({
    ...service, targets: [{ id: 'copilot-cloud', label: 'Copilot Cloud', kind: 'copilot-cloud', enabled: true }],
  }));
  assert.equal(prepare().result.code, 'host_unavailable');
});

test('task prompt commands use prefixed canonical names and contain no unprefixed registrations', () => {
  const catalog = JSON.parse(readFileSync(join(REPO, 'distribution', 'catalog.json'), 'utf8'));
  assert.deepEqual(validateCatalog(catalog), []);
  const byName = new Map(catalog.commands.map((command) => [command.name, command]));
  const expectedSources = new Map([
    ['aikido-launch-task', 'prompts/hard_points/commands/aikido-launch-task.md'],
    ['aikido-schedule-task', 'prompts/hard_points/commands/aikido-schedule-task.md'],
    ['aikido-plan-task', 'prompts/hard_points/commands/aikido-plan-task.md'],
    ['aikido-show-tasks', 'prompts/hard_points/commands/aikido-show-tasks.md'],
    ['aikido-resume-task', 'prompts/hard_points/commands/aikido-resume-task.md'],
  ]);
  for (const [name, sourcePath] of expectedSources) {
    const command = byName.get(name);
    assert.ok(command, `catalog includes ${name}`);
    assert.equal(command.source, sourcePath);
    const source = readFileSync(join(REPO, command.source), 'utf8');
    assert.match(nativeCommandWrapper(command, source), new RegExp(`# \\/${name}\\n`));
    assert.match(source, new RegExp(`# \\/${name}\\n`));
  }
  for (const oldName of ['plan-task', 'show-tasks', 'resume-task']) {
    assert.equal(byName.has(oldName), false, `catalog does not include ${oldName}`);
    assert.equal(existsSync(join(REPO, 'prompts', 'hard_points', 'commands', `${oldName}.md`)), false);
  }
  assert.equal(byName.has('launch-task'), false);
  assert.equal(byName.has('schedule-task'), false);
});

test('creation, revisions, immutable createdAt, effective updatedAt, and scoped reads', () => {
  const { open } = harness('revisions');
  const store = open();
  const created = store.createTask({ id: 'revision-task', title: 'first', state: 'ready' });
  assert.equal(created.createdAt, created.updatedAt);
  clockMs += 1_000;
  assert.equal(store.updateTask(created.id, { title: 'first' }, { expectedRevision: 1 }).updatedAt, created.updatedAt);
  const changed = store.updateTask(created.id, { summary: 'changed' }, { expectedRevision: 1 });
  assert.equal(changed.createdAt, created.createdAt);
  assert.notEqual(changed.updatedAt, created.updatedAt);
  assert.equal(changed.revision, 2);
  assert.throws(() => store.updateTask(created.id, { title: 'stale' }, { expectedRevision: 1 }), {
    code: 'revision_conflict',
  });
  store.close();

  const replayed = open();
  assert.equal(replayed.getTask(created.id).createdAt, created.createdAt);
  assert.equal(replayed.getTask(created.id).updatedAt, changed.updatedAt);
  assert.equal(replayed.getTask(created.id).revision, changed.revision);
  assert.equal(replayed.updateTask(created.id, { summary: 'changed' }, {
    expectedRevision: changed.revision,
  }).updatedAt, changed.updatedAt);
  replayed.close();

  const other = open({ actor: { id: 'bob', type: 'human', scope: { projectId: 'project-a' } } });
  assert.deepEqual(other.listTasks(), []);
  assert.throws(() => other.getTask(created.id), { code: 'unauthorized' });
  other.close();

  const otherProject = open({ actor: { id: 'alice', type: 'human', scope: { projectId: 'project-b' } } });
  assert.throws(() => otherProject.getTask(created.id), { code: 'scope_mismatch' });
  otherProject.close();
});

test('dependency and parent graphs reject cycles and block dependent or parent completion', () => {
  const { open } = harness('dag');
  const store = open();
  const parent = store.createTask({ id: 'parent', title: 'parent', state: 'ready' });
  const child = store.createTask({ id: 'child', title: 'child', parentId: parent.id, state: 'ready' });
  assert.throws(() => store.linkTasks(parent.id, { parentId: child.id }, { expectedRevision: parent.revision }), { code: 'cycle' });
  const parentAttempt = store.startAttempt(parent.id, null, { expectedRevision: parent.revision });
  const parentRunning = store.markAttemptStarted(parent.id, parentAttempt.attempt.id, { expectedRevision: parentAttempt.task.revision });
  const parentReview = store.recordAttemptResult(parent.id, parentRunning.attempt.id, { status: 'ok' }).task;
  const acceptedParent = store.acceptTask(parent.id, { accepted: true }, { expectedRevision: parentReview.revision });
  const parentComplete = advanceAutomaticToComplete(store, acceptedParent);
  assert.throws(() => store.transitionTask(parent.id, { to: 'done' }, { expectedRevision: parentComplete.revision }), {
    code: 'children_blocked',
  });
  const childAttempt = store.startAttempt(child.id, null, { expectedRevision: child.revision });
  const childRunning = store.markAttemptStarted(child.id, childAttempt.attempt.id, { expectedRevision: childAttempt.task.revision });
  const childReview = store.recordAttemptResult(child.id, childRunning.attempt.id, { status: 'ok' }).task;
  const childAccepted = store.acceptTask(child.id, { accepted: true }, { expectedRevision: childReview.revision });
  const childComplete = advanceAutomaticToComplete(store, childAccepted);
  store.transitionTask(child.id, { to: 'done' }, { expectedRevision: childComplete.revision });
  const finishedParent = store.transitionTask(parent.id, { to: 'done' }, { expectedRevision: parentComplete.revision });
  assert.equal(finishedParent.state, 'done');
  store.close();
});

test('completion requires criteria verification in addition to result and acceptance', () => {
  const { open } = harness('acceptance-criteria');
  const store = open();
  const task = store.createTask({
    id: 'criteria-task',
    title: 'Criteria task',
    state: 'ready',
    acceptanceCriteria: ['tests-pass'],
  });
  const attempt = store.startAttempt(task.id, null, { expectedRevision: task.revision });
  const started = store.markAttemptStarted(task.id, attempt.attempt.id, { expectedRevision: attempt.task.revision });
  const review = store.recordAttemptResult(task.id, started.attempt.id, { status: 'ok' }).task;
  const accepted = store.acceptTask(task.id, { accepted: true }, { expectedRevision: review.revision });
  assert.throws(() => store.transitionTask(task.id, { to: 'done' }, { expectedRevision: accepted.revision }), {
    code: 'criteria_unverified',
  });
  const verified = store.recordVerification(task.id, 'tests-pass', 'CI run 42 passed', {
    expectedRevision: accepted.revision,
  });
  const complete = advanceAutomaticToComplete(store, verified);
  assert.equal(store.transitionTask(task.id, { to: 'done' }, { expectedRevision: complete.revision }).state, 'done');
  store.close();
});

test('retry attempts reuse a card and are idempotent across a repeated request', () => {
  const { open } = harness('retry-attempt');
  const store = open();
  const task = store.createTask({ id: 'retry-card', title: 'Retry card', state: 'ready' });
  const first = store.startAttempt(task.id, null, { expectedRevision: task.revision });
  const running = store.markAttemptStarted(task.id, first.attempt.id, { expectedRevision: first.task.revision });
  const failed = store.recordAttemptResult(task.id, running.attempt.id, { status: 'error', summary: 'retryable' });
  const retry = store.startAttempt(task.id, { workerId: 'worker-2' }, {
    expectedRevision: failed.task.revision,
    idempotencyKey: 'retry-request-1',
  });
  const replay = store.startAttempt(task.id, { workerId: 'worker-2' }, {
    expectedRevision: failed.task.revision,
    idempotencyKey: 'retry-request-1',
  });
  assert.equal(retry.task.id, task.id);
  assert.equal(retry.task.attemptCount, 2);
  assert.equal(replay.task.revision, retry.task.revision);
  assert.equal(replay.attempt.id, retry.attempt.id);
  assert.throws(() => store.startAttempt(task.id, { workerId: 'different-worker' }, {
    expectedRevision: failed.task.revision,
    idempotencyKey: 'retry-request-1',
  }), { code: 'idempotency_conflict' });
  const startedRetry = store.markAttemptStarted(task.id, retry.attempt.id, {
    expectedRevision: retry.task.revision,
  });
  const replayAfterStart = store.startAttempt(task.id, { workerId: 'worker-2' }, {
    expectedRevision: failed.task.revision,
    idempotencyKey: 'retry-request-1',
  });
  assert.equal(replayAfterStart.task.revision, startedRetry.task.revision);
  assert.equal(replayAfterStart.attempt.status, 'running');
  store.close();
});

test('new child dispatch preparation is idempotent and binds workflow before spawn', () => {
  const { open } = harness('prepare-dispatch');
  const store = open();
  const parent = store.createTask({
    id: 'dispatch-parent',
    title: 'Parent',
    workflowId: 'analysis',
    state: 'ready',
  });
  const request = {
    taskInput: { id: 'dispatch-child', title: 'Child', stepId: 'investigate' },
    parentTaskId: parent.id,
    assignment: { workerId: 'worker-1' },
    idempotencyKey: 'dispatch-key-1',
    expectedParentRevision: parent.revision,
  };
  const prepared = store.prepareDispatch(request);
  const replay = store.prepareDispatch(request);
  assert.equal(prepared.task.id, 'dispatch-child');
  assert.equal(prepared.task.parentId, parent.id);
  assert.equal(prepared.task.workflowId, 'analysis');
  assert.equal(prepared.task.workflowVersion, '1.0.0');
  assert.equal(replay.task.id, prepared.task.id);
  assert.equal(replay.attempt.id, prepared.attempt.id);
  assert.throws(() => store.prepareDispatch({
    ...request, taskInput: { ...request.taskInput, title: 'Different child' },
  }), { code: 'idempotency_conflict' });
  store.close();
});

test('workflow validation, immutable snapshots, and repeatable plan instantiation preserve a DAG', () => {
  const { open } = harness('plans');
  const store = open();
  const plan = store.createPlan({
    id: 'analysis-plan',
    type: 'analysis',
    title: 'Analysis',
    tasks: [
      { key: 'inspect', title: 'Inspect sources', acceptanceCriteria: ['evidence'] },
      { key: 'report', title: 'Write report', parentKey: 'inspect', dependsOn: ['inspect'] },
    ],
  });
  assert.equal(plan.workflow.id, 'analysis');
  assert.match(plan.workflow.sha256, /^[a-f0-9]{64}$/);
  const instance = store.instantiatePlan(plan.id);
  assert.equal(instance.tasks.length, 2);
  assert.equal(instance.tasks[1].parentId, instance.tasks[0].id);
  assert.deepEqual(instance.tasks[1].dependsOn, [instance.tasks[0].id]);
  assert.deepEqual(store.instantiatePlan(plan.id).tasks.map((task) => task.id), instance.tasks.map((task) => task.id));
  assert.throws(() => store.registerWorkflow({
    schemaVersion: 'workflow/1',
    id: 'analysis',
    version: '1.0.0',
    entryStepId: 'one',
    terminalStepIds: ['two'],
    steps: [{ id: 'one', type: 'plan', transitions: ['two'] }, { id: 'two', type: 'verify', transitions: [] }],
  }), { code: 'workflow_immutable' });
  const invalid = validateWorkflow({
    schemaVersion: 'workflow/1',
    id: 'cycle',
    version: '1.0.0',
    entryStepId: 'a',
    terminalStepIds: ['b'],
    steps: [{ id: 'a', type: 'plan', transitions: ['b'] }, { id: 'b', type: 'verify', transitions: ['a'] }],
  });
  assert.equal(invalid.valid, false);
  assert.ok(invalid.errors.some((error) => error.includes('cycle')));
  store.close();
});

test('plans stay pinned to immutable workflow versions', () => {
  const { open } = harness('workflow-pinning');
  const store = open();
  const workflowV1 = {
    schemaVersion: 'workflow/1',
    id: 'pinned-workflow',
    version: '1.0.0',
    entryStepId: 'draft',
    terminalStepIds: ['done'],
    steps: [
      { id: 'draft', type: 'plan', transitions: ['done'] },
      { id: 'done', type: 'verify', transitions: [] },
    ],
  };
  const snapshotV1 = store.registerWorkflow(workflowV1);
  const plan = store.createPlan({
    id: 'pinned-plan', type: 'custom', title: 'Pinned',
    workflowId: workflowV1.id,
    tasks: [{ key: 'one', title: 'Task one' }],
  });
  const workflowV2 = structuredClone(workflowV1);
  workflowV2.version = '2.0.0';
  workflowV2.steps[0].transitions = ['review'];
  workflowV2.steps.splice(1, 0, { id: 'review', type: 'approve', transitions: ['done'] });
  const snapshotV2 = store.registerWorkflow(workflowV2);
  assert.notEqual(snapshotV1.sha256, snapshotV2.sha256);
  assert.equal(store.getPlan(plan.id).workflow.version, '1.0.0');
  assert.equal(store.getPlan(plan.id).workflow.sha256, snapshotV1.sha256);
  const instance = store.instantiatePlan(plan.id);
  assert.equal(instance.tasks[0].workflowVersion, '1.0.0');
  assert.equal(instance.tasks[0].workflowSha256, snapshotV1.sha256);
  store.close();
});

test('exclusive writer, stale-lock recovery, crash projection recovery, and truncated journal detection', () => {
  const { storeRoot, open } = harness('recovery');
  const store = open();
  assert.throws(() => open(), { code: 'writer_locked' });
  const task = store.createTask({ id: 'recover-me', title: 'Recovery fixture' });
  const projection = join(storeRoot, 'boards', 'default', 'automatic', 'plan', `${task.id}.json`);
  assert.ok(existsSync(projection));
  unlinkSync(projection);
  store.close();
  const recovered = open();
  assert.ok(existsSync(projection));
  assert.equal(recovered.getTask(task.id).createdAt, task.createdAt);
  recovered.close();

  writeFileSync(join(storeRoot, 'writer.lock'), JSON.stringify({ pid: 2147483647 }), { mode: 0o600 });
  const staleRecovered = open();
  assert.ok(staleRecovered.doctor().writerOwned);
  staleRecovered.close();

  appendFileSync(join(storeRoot, 'journal', 'events.jsonl'), '{"truncated":');
  assert.throws(() => open(), { code: 'truncated_journal' });
});

test('pool event de-duplication keeps results distinct from acceptance and preserves late results', () => {
  const { open, storeRoot } = harness('pool-events');
  const store = open();
  const task = store.createTask({ id: 'pool-task', title: 'Pool task', state: 'ready' });
  const prepared = store.startAttempt(task.id, { workerId: 'worker-1' }, { expectedRevision: task.revision });
  const started = store.markAttemptStarted(task.id, prepared.attempt.id, { expectedRevision: prepared.task.revision });
  const start = {
    schemaVersion: TASK_EVENT_SCHEMA,
    eventId: 'pool-start',
    taskId: task.id,
    attemptId: started.attempt.id,
    origin: 'core-pool',
    timestamp: new Date(clockMs).toISOString(),
    type: 'start',
    payload: {},
  };
  store.recordPoolEvent(start);
  const resultEvent = { ...start, eventId: 'pool-result', type: 'result', payload: { status: 'ok', summary: 'ready for review' } };
  const result = store.recordPoolEvent(resultEvent);
  assert.equal(result.task.state, 'review');
  assert.equal(result.task.acceptance.accepted, false);
  assert.equal(store.recordPoolEvent(resultEvent).duplicate, true);
  const accepted = store.acceptTask(task.id, { accepted: true }, {
    expectedRevision: result.task.revision, eventId: 'pool-accept',
  });
  assert.equal(accepted.acceptance.accepted, true);
  const duplicateAcceptance = store.acceptTask(task.id, { accepted: true }, {
    expectedRevision: result.task.revision, eventId: 'pool-accept',
  });
  assert.equal(duplicateAcceptance.revision, accepted.revision);
  assert.throws(() => store.recordPoolEvent({
    ...start, eventId: 'pool-accept-invalid', attemptId: undefined, type: 'accept', payload: { accepted: true },
  }), { code: 'validation' });
  const complete = advanceAutomaticToComplete(store, accepted);
  const done = store.transitionTask(task.id, { to: 'done' }, { expectedRevision: complete.revision });
  assert.equal(done.state, 'done');

  const rejectedTask = store.createTask({ id: 'rejected-task', title: 'Rejection path', state: 'ready' });
  const rejectedAttempt = store.startAttempt(rejectedTask.id, null, { expectedRevision: rejectedTask.revision });
  const rejectedRunning = store.markAttemptStarted(rejectedTask.id, rejectedAttempt.attempt.id, {
    expectedRevision: rejectedAttempt.task.revision,
  });
  store.recordPoolEvent({
    ...start, eventId: 'rejection-start', taskId: rejectedTask.id, attemptId: rejectedRunning.attempt.id,
    type: 'start', payload: {},
  });
  const rejectedReview = store.recordPoolEvent({
    ...start, eventId: 'rejection-result', taskId: rejectedTask.id, attemptId: rejectedRunning.attempt.id,
    type: 'result', payload: { status: 'ok' },
  });
  const rejected = store.acceptTask(rejectedTask.id, { accepted: false, reason: 'needs changes' }, {
    expectedRevision: rejectedReview.task.revision, eventId: 'rejection-accept',
  });
  assert.equal(rejected.state, 'waiting');
  assert.equal(rejected.acceptance.accepted, false);
  assert.deepEqual(rejected.waitingReason, { type: 'approval', detail: 'needs changes' });
  assert.ok(rejected.revision > rejectedReview.task.revision);
  assert.throws(() => store.transitionTask(rejectedTask.id, { to: 'ready' }, {
    expectedRevision: rejected.revision,
  }), { code: 'approval_required' });
  assert.throws(() => store.resumeTask(rejectedTask.id, {
    expectedRevision: rejected.revision,
  }), { code: 'approval_required' });
  const resubmitted = store.resumeTask(rejectedTask.id, {
    expectedRevision: rejected.revision, acknowledgeRejection: true,
  });
  const events = readFileSync(join(storeRoot, 'journal', 'events.jsonl'), 'utf8')
    .split('\n').filter(Boolean).map((line) => JSON.parse(line));
  assert.ok(events.some((event) => event.operation === 'task.transitioned'
    && event.data.task.id === rejectedTask.id && event.data.rejectionAcknowledged === true));
  const retry = store.startAttempt(rejectedTask.id, null, { expectedRevision: resubmitted.revision });
  assert.equal(retry.task.id, rejectedTask.id);
  assert.equal(retry.task.attemptCount, 2);

  const lateTask = store.createTask({ id: 'late-task', title: 'Late event', state: 'ready' });
  const lateAttempt = store.startAttempt(lateTask.id, null, { expectedRevision: lateTask.revision });
  const lateRunning = store.markAttemptStarted(lateTask.id, lateAttempt.attempt.id, { expectedRevision: lateAttempt.task.revision });
  store.recordPoolEvent({
    ...start, eventId: 'late-reset', taskId: lateTask.id, attemptId: lateRunning.attempt.id,
    type: 'reset', payload: { reason: 'host stopped' },
  });
  const lateResult = store.recordPoolEvent({
    ...start, eventId: 'late-result', taskId: lateTask.id, attemptId: lateRunning.attempt.id,
    type: 'result', payload: { status: 'ok' },
  });
  assert.equal(lateResult.task.state, 'waiting');
  assert.equal(lateResult.task.lateResults.at(-1).late, true);
  store.close();

  const reopened = open();
  assert.equal(reopened.recordPoolEvent(resultEvent).duplicate, true);
  assert.equal(reopened.getTask(task.id).state, 'done');
  reopened.close();
});

test('due preview is deterministic and host schedule outcomes are revisioned, correlated, and idempotent', () => {
  const { open } = harness('scheduler');
  const store = open();
  const scheduledAt = new Date(clockMs).toISOString();
  const due = store.createTask({ id: 'due-task', title: 'Due', state: 'ready', scheduledAt, timezone: 'Europe/Paris' });
  assert.equal(due.scheduleRegistration.status, 'intent-recorded');
  assert.equal(store.scheduleTask(due.id, { scheduledAt, timezone: 'Europe/Paris' }, {
    expectedRevision: due.revision,
  }).revision, due.revision);
  const preview = store.dispatchDue({ now: scheduledAt });
  assert.deepEqual(preview.eligible.map((task) => task.id), [due.id]);
  assert.throws(() => store.dispatchDue({ now: scheduledAt, dryRun: false }), {
    code: 'dispatcher_unavailable',
  });
  const requested = store.recordScheduleOutcome(due.id, {
    eventId: 'schedule-request-1',
    correlationId: 'correlation-1',
    status: 'requested',
    host: { hostId: 'core-agent', connectionId: 'core-local', executorId: 'core-worker' },
    capabilityEvidence: {
      capability: 'task-scheduling', supported: true, verifiedAt: scheduledAt, source: 'core-agent-capability-query',
    },
  }, { expectedRevision: due.revision });
  assert.equal(requested.task.scheduleRegistration.status, 'requested');
  const acknowledged = store.recordScheduleOutcome(due.id, {
    eventId: 'schedule-ack-1',
    correlationId: 'correlation-1',
    status: 'acknowledged',
    host: { hostId: 'core-agent', connectionId: 'core-local', executorId: 'core-worker' },
    jobId: 'core-job-1',
  }, { expectedRevision: requested.task.revision });
  assert.equal(acknowledged.task.scheduleRegistration.jobId, 'core-job-1');
  const duplicate = store.recordScheduleOutcome(due.id, {
    eventId: 'schedule-ack-1',
    correlationId: 'correlation-1',
    status: 'acknowledged',
    host: { hostId: 'core-agent', connectionId: 'core-local', executorId: 'core-worker' },
    jobId: 'core-job-1',
  }, { expectedRevision: requested.task.revision });
  assert.equal(duplicate.duplicate, true);
  assert.equal(duplicate.task.revision, acknowledged.task.revision);
  assert.throws(() => store.recordScheduleOutcome(due.id, {
    eventId: 'schedule-ack-1', correlationId: 'correlation-1', status: 'unavailable',
  }, { expectedRevision: requested.task.revision }), { code: 'idempotency_conflict' });

  const unavailable = store.createTask({
    id: 'unavailable-task', title: 'No host scheduler', state: 'ready',
    scheduledAt, timezone: 'UTC',
  });
  const unavailableResult = store.recordScheduleOutcome(unavailable.id, {
    eventId: 'schedule-unavailable-1',
    correlationId: 'correlation-unavailable-1',
    status: 'unavailable',
    error: { code: 'capability_unavailable', message: 'Selected host cannot schedule tasks' },
  }, { expectedRevision: unavailable.revision });
  assert.equal(unavailableResult.task.scheduleRegistration.status, 'unavailable');

  const failed = store.createTask({
    id: 'schedule-error-task', title: 'Host registration error', state: 'ready',
    scheduledAt, timezone: 'UTC',
  });
  const failedResult = store.recordScheduleOutcome(failed.id, {
    eventId: 'schedule-error-1',
    correlationId: 'correlation-error-1',
    status: 'error',
    error: { code: 'host_registration_failed', message: 'Host rejected the registration' },
  }, { expectedRevision: failed.revision });
  assert.equal(failedResult.task.scheduleRegistration.error.code, 'host_registration_failed');

  clockMs += 120_000;
  const late = store.createTask({
    id: 'missed-task', title: 'Missed', state: 'ready',
    scheduledAt: new Date(clockMs - 120_000).toISOString(), timezone: 'UTC',
  });
  assert.ok(store.dispatchDue({ now: new Date(clockMs).toISOString() }).missed.some((item) => item.task.id === late.id));
  assert.ok(store.dispatchDue({ now: new Date(clockMs).toISOString(), includeMissed: true })
    .eligible.some((item) => item.id === late.id));
  const notBefore = store.createTask({
    id: 'not-before-task',
    title: 'Wait until allowed',
    state: 'ready',
    scheduledAt: new Date(clockMs).toISOString(),
    notBefore: new Date(clockMs + 60_000).toISOString(),
    timezone: 'UTC',
  });
  assert.ok(store.dispatchDue({ now: new Date(clockMs).toISOString() }).blocked
    .some((item) => item.task.id === notBefore.id && item.reason === 'not_before'));
  assert.throws(() => store.scheduleTask(late.id, {
    scheduledAt: '2026-11-07T01:30:00', timezone: 'America/New_York',
  }, { expectedRevision: late.revision }), { code: 'validation' });
  const firstFold = store.scheduleTask(late.id, {
    scheduledAt: '2026-11-01T01:30:00-04:00', timezone: 'America/New_York',
  }, { expectedRevision: late.revision });
  const secondFold = store.scheduleTask(late.id, {
    scheduledAt: '2026-11-01T01:30:00-05:00', timezone: 'America/New_York',
  }, { expectedRevision: firstFold.revision });
  assert.notEqual(firstFold.scheduledAt, secondFold.scheduledAt);
  store.close();

  const reopened = open();
  assert.equal(reopened.getTask(due.id).scheduleRegistration.status, 'acknowledged');
  const duplicateAfterReplay = reopened.recordScheduleOutcome(due.id, {
    eventId: 'schedule-ack-1',
    correlationId: 'correlation-1',
    status: 'acknowledged',
    host: { hostId: 'core-agent', connectionId: 'core-local', executorId: 'core-worker' },
    jobId: 'core-job-1',
  }, { expectedRevision: due.revision });
  assert.equal(duplicateAfterReplay.duplicate, true);
  assert.equal(duplicateAfterReplay.task.revision, acknowledged.task.revision);
  reopened.close();
});

test('AI-KIDO task-store exposes no resident scheduler and does not execute scheduled work', () => {
  const { open } = harness('no-resident-scheduler');
  assert.equal(Object.hasOwn(taskStoreModule, 'startOptInScheduler'), false);
  const runtime = readFileSync(new URL('../lib/task-store/index.mjs', import.meta.url), 'utf8');
  assert.doesNotMatch(runtime, /\bsetInterval\s*\(/);
  assert.doesNotMatch(runtime, /\bsetTimeout\s*\(/);
  const store = open();
  const scheduledAt = new Date(clockMs).toISOString();
  const due = store.createTask({ id: 'scheduler-live', title: 'Preview only', state: 'ready', scheduledAt, timezone: 'UTC' });
  assert.deepEqual(store.dispatchDue({ now: scheduledAt }).eligible.map((task) => task.id), [due.id]);
  assert.equal(store.getTask(due.id).state, 'ready');
  store.close();
});

test('host interruption callbacks persist and reopen without an AI-KIDO redispatch loop', () => {
  const { open } = harness('scheduler-interrupted');
  let store = open();
  const scheduledAt = new Date(clockMs).toISOString();
  const task = store.createTask({ id: 'interrupted-schedule', title: 'Unknown effect', state: 'ready', scheduledAt, timezone: 'UTC' });
  const started = store.startAttempt(task.id, null, { expectedRevision: task.revision });
  const running = store.markAttemptStarted(task.id, started.attempt.id, { expectedRevision: started.task.revision });
  const interruption = store.recordPoolEvent({
    schemaVersion: TASK_EVENT_SCHEMA,
    eventId: 'host-reset-1',
    taskId: task.id,
    attemptId: started.attempt.id,
    origin: 'core-agent',
    timestamp: scheduledAt,
    type: 'reset',
    payload: { reason: 'host disconnected after unknown effect' },
  });
  assert.equal(interruption.task.executionStatus, 'interrupted');
  assert.equal(interruption.task.state, 'waiting');
  assert.ok(running.task.revision < interruption.task.revision);
  store.close();

  store = open();
  assert.equal(store.getTask(task.id).executionStatus, 'interrupted');
  assert.deepEqual(store.dispatchDue({ now: scheduledAt }).eligible, []);
  store.close();
});

test('archive, restore, and confirmation-gated purge survive reopen and erase private card content', () => {
  const { storeRoot, open } = harness('purge');
  let store = open();
  const task = store.createTask({ id: 'private-card', title: 'Private fixture', prompt: 'private-prompt-fixture' });
  const archived = store.archiveTask(task.id, { expectedRevision: task.revision });
  const preview = store.previewPurge();
  assert.equal(store.getTask(task.id).id, task.id);
  store.close();

  store = open();
  const restored = store.restoreTask(task.id, { expectedRevision: archived.revision });
  assert.equal(restored.createdAt, task.createdAt);
  assert.throws(() => store.confirmPurge(preview.token), { code: 'confirmation_stale' });
  const archivedAgain = store.archiveTask(task.id, { expectedRevision: restored.revision });
  const secondPreview = store.previewPurge();
  assert.notEqual(secondPreview.token, preview.token);
  const result = store.confirmPurge(secondPreview.token);
  assert.deepEqual(result.purged, [task.id]);
  assert.equal(store.getTask(task.id), null);
  const journal = readFileSync(join(storeRoot, 'journal', 'events.jsonl'), 'utf8');
  assert.doesNotMatch(journal, /private-prompt-fixture/);
  assert.ok(!existsSync(join(storeRoot, 'archive', archivedAgain.archivedAt.slice(0, 4), archivedAgain.archivedAt.slice(5, 7), 'automatic', `${task.id}.json`)));
  store.close();
});

test('registered hooks return bounded typed commands and refuse causal loops', () => {
  const { open } = harness('hooks');
  const hash = 'a'.repeat(64);
  const makeChild = {
    id: 'make-child', version: '1.0.0', sha256: hash, phase: 'afterTransition',
    run: ({ to, task }) => (to === 'ready' ? [{ type: 'task.create', input: { title: 'Generated child', parentId: task.id } }] : []),
  };
  const loop = {
    id: 'cycle-hook', version: '1.0.0', sha256: 'b'.repeat(64), phase: 'afterTransition',
    run: ({ to, task }) => (to === 'ready'
      ? [{ type: 'task.transition', taskId: task.id, to: 'waiting' }]
      : to === 'waiting' ? [{ type: 'task.transition', taskId: task.id, to: 'ready' }] : []),
  };
  const veto = {
    id: 'veto', version: '1.0.0', sha256: 'c'.repeat(64), phase: 'beforeTransition',
    run: () => ({ allow: false, reason: 'policy refusal' }),
  };
  const peerMessageHook = {
    id: 'peer-message-hook', version: '1.0.0', sha256: 'd'.repeat(64),
    phase: 'executionEvent', eventTypes: ['peer-message'],
    run: ({ task }) => [{ type: 'task.create', input: { title: 'Peer activity', parentId: task.id } }],
  };
  const store = open({ authorizedCommands: ['task.create', 'task.transition'] });
  store.registerWorkflow({
    schemaVersion: 'workflow/1', id: 'hooked', version: '1.0.0',
    entryStepId: 'work', terminalStepIds: ['finish'],
    steps: [{ id: 'work', type: 'dispatch', transitions: ['finish'] }, { id: 'finish', type: 'verify', transitions: [] }],
    hooks: [{ id: makeChild.id, version: makeChild.version, sha256: hash, phase: makeChild.phase }],
  });
  const hooked = store.createTask({ id: 'hooked-task', title: 'Hook target', workflowId: 'hooked' });
  const ready = store.transitionTask(hooked.id, { to: 'ready' }, { expectedRevision: hooked.revision });
  assert.equal(store.listPendingHookCommands().length, 1);
  assert.equal(store.listTasks().filter((task) => task.parentId === hooked.id).length, 0);
  assert.equal(runNextHostHook(store, [makeChild]).status, 'applied');
  assert.equal(store.listTasks().filter((task) => task.parentId === hooked.id).length, 1);
  const hookChild = store.listTasks().find((task) => task.parentId === hooked.id);
  assert.equal(hookChild.workflowId, null);
  assert.equal(hookChild.stepId, null);
  assert.equal(store.listPendingHookCommands().length, 0);

  store.registerWorkflow({
    schemaVersion: 'workflow/1', id: 'looping', version: '1.0.0',
    entryStepId: 'work', terminalStepIds: ['finish'],
    steps: [{ id: 'work', type: 'dispatch', transitions: ['finish'] }, { id: 'finish', type: 'verify', transitions: [] }],
    hooks: [{ id: loop.id, version: loop.version, sha256: loop.sha256, phase: loop.phase }],
  });
  const target = store.createTask({ id: 'loop-target', title: 'Loop target', workflowId: 'looping' });
  store.transitionTask(target.id, { to: 'ready' }, { expectedRevision: target.revision });
  assert.equal(runNextHostHook(store, [loop]).status, 'applied');
  assert.equal(runNextHostHook(store, [loop]).status, 'applied');
  const cycleResult = runNextHostHook(store, [loop]);
  assert.equal(cycleResult.reason, 'hook_cycle');

  store.registerWorkflow({
    schemaVersion: 'workflow/1', id: 'event-hooked', version: '1.0.0',
    entryStepId: 'work', terminalStepIds: ['finish'],
    steps: [{ id: 'work', type: 'dispatch', transitions: ['finish'] }, { id: 'finish', type: 'verify', transitions: [] }],
    hooks: [{
      id: peerMessageHook.id, version: peerMessageHook.version, sha256: peerMessageHook.sha256,
      phase: peerMessageHook.phase, eventTypes: peerMessageHook.eventTypes,
    }],
  });
  const eventTarget = store.createTask({ id: 'event-hook-target', title: 'Event hook target', workflowId: 'event-hooked' });
  const peerMessage = {
    schemaVersion: TASK_EVENT_SCHEMA, eventId: 'peer-message-1', taskId: eventTarget.id,
    origin: 'agent-pool', timestamp: new Date(clockMs).toISOString(),
    type: 'peer-message', payload: { kind: 'status' },
  };
  assert.equal(store.recordPoolEvent(peerMessage).duplicate, false);
  assert.equal(store.recordPoolEvent(peerMessage).duplicate, true);
  assert.equal(runNextHostHook(store, [peerMessageHook]).status, 'applied');
  assert.equal(store.listTasks().filter((task) => task.parentId === eventTarget.id).length, 1);

  store.registerWorkflow({
    schemaVersion: 'workflow/1', id: 'vetoed', version: '1.0.0',
    entryStepId: 'work', terminalStepIds: ['finish'],
    steps: [{ id: 'work', type: 'dispatch', transitions: ['finish'] }, { id: 'finish', type: 'verify', transitions: [] }],
    hooks: [{ id: veto.id, version: veto.version, sha256: veto.sha256, phase: veto.phase }],
  });
  const vetoed = store.createTask({ id: 'veto-target', title: 'Veto target', workflowId: 'vetoed' });
  const vetoResult = veto.run({ task: vetoed, to: 'ready' });
  assert.throws(() => store.transitionTask(vetoed.id, { to: 'ready' }, {
    expectedRevision: vetoed.revision,
    beforeHookResults: [{
      id: veto.id, version: veto.version, sha256: veto.sha256,
      allow: vetoResult.allow, reason: vetoResult.reason,
    }],
  }), { code: 'transition_refused' });
  assert.equal(store.getTask(vetoed.id).revision, vetoed.revision);
  assert.equal(store.getTask(hooked.id).revision, ready.revision);
  store.close();
});

test('hook intentions replay without rerunning callbacks or reapplying completed effects', () => {
  const { open } = harness('hook-replay');
  let hookCalls = 0;
  const childHook = {
    id: 'restart-safe-child',
    version: '1.0.0',
    sha256: 'e'.repeat(64),
    phase: 'afterTransition',
    run: ({ to, task }) => {
      hookCalls += 1;
      return to === 'ready'
        ? [{ type: 'task.create', input: { title: 'Restart-safe child', parentId: task.id } }]
        : [];
    },
  };
  const options = {
    authorizedCommands: ['task.create'],
  };
  let store = open(options);
  store.registerWorkflow({
    schemaVersion: 'workflow/1',
    id: 'restart-safe',
    version: '1.0.0',
    entryStepId: 'work',
    terminalStepIds: ['finish'],
    steps: [
      { id: 'work', type: 'dispatch', transitions: ['finish'] },
      { id: 'finish', type: 'verify', transitions: [] },
    ],
    hooks: [{ id: childHook.id, version: childHook.version, sha256: childHook.sha256, phase: childHook.phase }],
  });
  const task = store.createTask({ id: 'restart-safe-task', title: 'Restart safe', workflowId: 'restart-safe' });
  store.transitionTask(task.id, { to: 'ready' }, { expectedRevision: task.revision });
  assert.equal(hookCalls, 0);
  store.close();

  store = open(options);
  assert.equal(hookCalls, 0);
  assert.equal(store.listPendingHookCommands().length, 1);
  assert.equal(runNextHostHook(store, [childHook]).status, 'applied');
  assert.equal(hookCalls, 1);
  assert.equal(store.listTasks().filter((item) => item.parentId === task.id).length, 1);
  store.close();

  store = open(options);
  assert.equal(hookCalls, 1);
  assert.equal(store.listPendingHookCommands().length, 0);
  assert.equal(store.listTasks().filter((item) => item.parentId === task.id).length, 1);
  store.close();
});

test('causal hook cycles spanning two cards are detected and bounded', () => {
  const { open } = harness('cross-card-hook-cycle');
  const togglePeer = {
    id: 'toggle-peer',
    version: '1.0.0',
    sha256: 'f'.repeat(64),
    phase: 'afterTransition',
    run: ({ task, to }) => {
      if (task.id === 'cycle-a' && to === 'ready') return [{ type: 'task.transition', taskId: 'cycle-b', to: 'waiting' }];
      if (task.id === 'cycle-b' && to === 'waiting') return [{ type: 'task.transition', taskId: 'cycle-a', to: 'waiting' }];
      if (task.id === 'cycle-a' && to === 'waiting') return [{ type: 'task.transition', taskId: 'cycle-b', to: 'ready' }];
      if (task.id === 'cycle-b' && to === 'ready') return [{ type: 'task.transition', taskId: 'cycle-a', to: 'ready' }];
      return [];
    },
  };
  const store = open({ authorizedCommands: ['task.transition'] });
  store.registerWorkflow({
    schemaVersion: 'workflow/1',
    id: 'two-card-cycle',
    version: '1.0.0',
    entryStepId: 'work',
    terminalStepIds: ['finish'],
    steps: [
      { id: 'work', type: 'dispatch', transitions: ['finish'] },
      { id: 'finish', type: 'verify', transitions: [] },
    ],
    hooks: [{
      id: 'toggle-peer', version: '1.0.0', sha256: 'f'.repeat(64), phase: 'afterTransition',
    }],
  });
  const first = store.createTask({ id: 'cycle-a', title: 'Cycle A', workflowId: 'two-card-cycle' });
  store.createTask({ id: 'cycle-b', title: 'Cycle B', state: 'ready', workflowId: 'two-card-cycle' });
  store.transitionTask(first.id, { to: 'ready' }, { expectedRevision: first.revision });
  const outcomes = [];
  for (let index = 0; index < 8 && store.listPendingHookCommands().length > 0; index += 1) {
    outcomes.push(runNextHostHook(store, [togglePeer]));
  }
  assert.ok(outcomes.some((item) => item?.reason === 'hook_cycle'));
  assert.equal(store.listPendingHookCommands().length, 0);
  assert.equal(store.getTask('cycle-b').state, 'waiting');
  assert.equal(store.getTask('cycle-b').waitingReason?.type, 'hook_cycle');
  store.close();
});
