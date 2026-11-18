// Entry point of `aikido task`: uses Tatami Core Agent when it is present for this workspace, otherwise works locally.
import { existsSync, readFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { runTaskCLI, taskSummary } from './cli.mjs';
import { clearConnection, detectCoreAgent, saveConnection, showConnection } from './module-link.mjs';
import { BUILTIN_WORKFLOW_IDS, deleteFromLibrary, draftFromDefinition, hasLibraryVersion, listLibrary, publish, saveToLibrary } from './workflow-library.mjs';

const CLI_SESSION = 'AI-KIDO CLI';
const TASK_OPERATIONS = new Set(['list', 'show', 'events', 'create', 'update', 'launch', 'transition', 'accept', 'done', 'schedule', 'unschedule',
  'stop', 'pause', 'resume', 'cancel', 'archive', 'restore', 'delete', 'sync']);
const HOSTED_VALUES = new Set(['--session', '--title', '--prompt-file', '--target', '--agent', '--mode', '--cursor', '--limit',
  '--url', '--project', '--user', '--token', '--token-env', '--token-file']);
const WORKFLOW_OPERATIONS = new Set(['list', 'show', 'save', 'delete', 'sync', 'register', 'create', 'update']);

const storeOption = argv => value(argv, '--store') ? ['--store', value(argv, '--store')] : [];
const hasKnowledgeBase = workspace => existsSync(join(workspace, 'prompts'));
function fail(code, message) { throw Object.assign(new Error(message), { code }); }
const ok = (route, value) => ({ exitCode: 0, result: { status: 'ok', route, ...value } });

/** Removes the options handled here and keeps the rest for the local CLI. */
function extract(argv) {
  const rest = [], options = {};
  for (let index = 0; index < argv.length; index += 1) {
    if (argv[index] === '--local' || argv[index] === '--confirm') options[argv[index]] = true;
    else if (HOSTED_VALUES.has(argv[index])) options[argv[index]] = argv[++index];
    else rest.push(argv[index]);
  }
  return { rest, options };
}
function value(argv, name) { const index = argv.indexOf(name); return index < 0 ? undefined : argv[index + 1]; }
function positional(argv) {
  const valued = /^--(workspace|store|file|state|workflow|workflow-version|revision|to|reason|at|timezone|accepted)$/;
  return argv.slice(2).find((token, index, list) => !token.startsWith('--') && !valued.test(list[index - 1] ?? ''));
}
function jsonFile(argv, cwd) {
  const file = value(argv, '--file');
  if (!file) fail('usage', 'This operation requires --file <json>');
  return JSON.parse(readFileSync(resolve(cwd, file), 'utf8'));
}

/** Makes the knowledge-base templates usable by local cards, then publishes private workflows missing from the base. */
function registerLibrary(workspace, argv) {
  const base = storeOption(argv);
  const registered = [], errors = [...listLibrary(workspace).errors];
  for (const item of listLibrary(workspace).workflows) {
    const { exitCode, result } = runTaskCLI(['workflow', 'register', '--file', item.file, '--workspace', workspace, ...base]);
    if (exitCode) errors.push({ id: item.id, error: result.message }); else registered.push(`${item.id}@${item.version}`);
  }
  return { registered, errors };
}
function syncLocal(workspace, argv) {
  const outcome = registerLibrary(workspace, argv), published = [];
  if (hasKnowledgeBase(workspace)) for (const item of privateWorkflows(workspace, storeOption(argv))) {
    if (hasLibraryVersion(workspace, item.id, item.version)) continue;
    publish(workspace, item); published.push(`${item.id}@${item.version}`);
  }
  return { ...outcome, published };
}
function privateWorkflows(workspace, base) {
  const { result } = runTaskCLI(['workflow', 'list', '--workspace', workspace, ...base]);
  return (result.workflows ?? []).filter(item => !BUILTIN_WORKFLOW_IDS.includes(item.id)).flatMap(item => {
    const shown = runTaskCLI(['workflow', 'show', item.id, '--workflow-version', item.version, '--workspace', workspace, ...base]).result;
    return shown.workflow?.definition ? [shown.workflow.definition] : [];
  });
}

async function workflowOnCore(core, operation, argv, cwd, workspace) {
  const { client } = core;
  if (operation === 'list') return ok('core-agent', await client.tool('workflows_list'));
  if (operation === 'show') {
    const id = positional(argv);
    const workflow = (await client.tool('workflows_list')).workflows.find(item => item.id === id);
    if (!workflow) fail('not_found', 'Workflow not found');
    return ok('core-agent', { workflow });
  }
  if (operation === 'delete') return ok('core-agent', await client.tool('workflow_delete', { id: positional(argv) }));
  if (operation === 'sync') {
    const known = new Set((await client.tool('workflows_list')).workflows.map(item => item.id));
    const published = [], skipped = [];
    for (const definition of privateWorkflows(workspace, [])) {
      if (known.has(definition.id)) continue;
      const draft = draftFromDefinition(definition);
      if (!draft) { skipped.push(definition.id); continue; }
      const saved = await client.tool('workflow_save', draft); published.push(`${saved.id}@${saved.version}`);
    }
    return ok('core-agent', { published, skipped });
  }
  const input = jsonFile(argv, cwd);
  const draft = input.schemaVersion ? draftFromDefinition(input) : input;
  if (!draft) fail('workflow_invalid', 'The Core Agent only runs linear workflows with exactly one dispatch step and no hooks');
  return ok('core-agent', { workflow: await client.tool('workflow_save', draft) });
}

function workflowLocally(operation, argv, cwd, workspace, options) {
  if (operation === 'sync') return ok('local', syncLocal(workspace, argv));
  if (operation === 'save') return ok('local', { workflow: saveToLibrary(workspace, jsonFile(argv, cwd)) });
  if (operation === 'delete') {
    deleteFromLibrary(workspace, positional(argv));
    return ok('local', { deleted: true });
  }
  const library = listLibrary(workspace);
  if (operation === 'show') {
    const found = library.workflows.find(item => item.id === positional(argv));
    return found ? ok('local', { workflow: found }) : runTaskCLI(argv, { cwd });
  }
  const outcome = runTaskCLI(argv, { cwd });
  if (operation === 'list' && !outcome.exitCode) {
    const ids = new Set(library.workflows.map(item => item.id));
    return ok('local', { workflows: [...outcome.result.workflows.filter(item => !ids.has(item.id)), ...library.workflows], errors: library.errors });
  }
  if (!outcome.exitCode && outcome.result.workflow?.definition) {
    const { id, version, definition } = outcome.result.workflow;
    if (hasKnowledgeBase(workspace) && !hasLibraryVersion(workspace, id, version)) publish(workspace, definition);
  }
  return outcome;
}

async function cliSession(client) {
  const existing = (await client.tool('sessions_list')).find(item => item.title === CLI_SESSION);
  return existing?.id ?? (await client.tool('session_create', { title: CLI_SESSION })).id;
}
async function coreCards(client) {
  const { cards = [], enabled } = await client.tool('cards_list', { full: true, limit: 2000 });
  if (enabled === false) fail('task_service_disabled', 'The Task Service is disabled on this Core Agent');
  return cards;
}
const localArgs = (argv, ...args) => [...args, ...['--workspace', '--store'].flatMap(name => value(argv, name) ? [name, value(argv, name)] : [])];
function localCard(argv, id, cwd, env) {
  const { exitCode, result } = runTaskCLI(localArgs(argv, 'task', 'show', id), { cwd, env });
  return exitCode ? undefined : result.task;
}
const scheduleInput = (argv, options, at) => ({ scheduledAt: at ?? value(argv, '--at') ?? new Date().toISOString(),
  timezone: value(argv, '--timezone') ?? Intl.DateTimeFormat().resolvedOptions().timeZone, agent: options['--agent'] ?? '', mode: options['--mode'] ?? 'act',
  ...(options['--target'] ? { targetId: options['--target'] } : {}) });

function coreCommand(operation, argv, cwd, options) {
  const reason = value(argv, '--reason');
  const withReason = reason ? { reason } : {};
  switch (operation) {
    case 'update': return ['update', jsonFile(argv, cwd)];
    case 'transition': return ['transition', { to: value(argv, '--to'), ...withReason }];
    case 'done': return ['transition', { to: 'done', ...withReason }];
    case 'accept': return ['accept', { accepted: value(argv, '--accepted') !== 'false', ...withReason }];
    case 'schedule': return ['schedule', scheduleInput(argv, options)];
    case 'stop': return ['pause', withReason];
    case 'pause': case 'cancel': return [operation, withReason];
    default: return [operation, {}];
  }
}

/** Creates a card on the Core Agent and schedules it, now or at the requested date, as tatami-agent does. */
async function launchOnCore(client, input, argv, options, commandId) {
  const session = await cliSession(client);
  const created = await client.tool('card_command', { session, command: 'create', input: { ...input, state: 'ready' }, ...(commandId ? { commandId } : {}) });
  const scheduled = await client.tool('card_command', { session, command: 'schedule', taskId: created.task.id, expectedRevision: created.task.revision, input: scheduleInput(argv, options) });
  return { task: scheduled.task, job: scheduled.job, session };
}
function launchInput(argv, cwd, options) {
  const file = value(argv, '--file') ? jsonFile(argv, cwd) : {};
  const prompt = options['--prompt-file'] ? readFileSync(resolve(cwd, options['--prompt-file']), 'utf8').trim() : file.prompt;
  if (!prompt) fail('usage', 'task launch requires <id>, --prompt-file <file> or --file <json>');
  const workflowId = value(argv, '--workflow') ?? file.workflowId;
  return { title: options['--title'] ?? file.title ?? prompt.replace(/\s+/g, ' ').slice(0, 120), prompt, ...(workflowId ? { workflowId } : {}) };
}
const cardFields = card => ({ title: card.title, ...(card.summary ? { summary: card.summary } : {}), ...(card.prompt ? { prompt: card.prompt } : {}),
  ...(card.workflowId && card.workflowId !== 'automatic' ? { workflowId: card.workflowId } : {}) });

function localOperation(operation, id, argv, cwd, env, options) {
  const card = id ? localCard(argv, id, cwd, env) : undefined;
  if (id && !card) fail('not_found', 'Task not found');
  const revision = value(argv, '--revision') ?? card?.revision;
  const run = (...args) => runTaskCLI(localArgs(argv, 'task', ...args), { cwd, env });
  const reason = value(argv, '--reason') ? ['--reason', value(argv, '--reason')] : [];
  if (operation === 'events') fail('unsupported', 'Event history is available for Core Agent cards');
  if (operation === 'stop') return run('pause', id, '--revision', String(revision), ...reason);
  if (operation === 'done') return run('transition', id, '--to', 'done', '--revision', String(revision), ...reason);
  if (operation === 'delete') {
    if (!card.archivedAt) {
      const archived = run('archive', id, '--revision', String(revision));
      if (archived.exitCode) return archived;
    }
    const preview = run('purge-preview', '--task-id', id);
    return preview.exitCode ? preview : run('purge', '--confirm-token', preview.result.preview.token);
  }
  if (id && !value(argv, '--revision')) return runTaskCLI([...argv, '--revision', String(revision)], { cwd, env });
  return runTaskCLI(argv, { cwd, env });
}

async function taskCommand(core, operation, argv, cwd, env, options) {
  const client = core.available ? core.client : undefined;
  if (operation === 'delete' && !options['--confirm']) fail('confirmation_required', 'task delete requires --confirm');
  if (operation === 'sync' && !options['--confirm']) fail('confirmation_required', 'task sync requires --confirm');
  if ((operation === 'launch' || operation === 'sync') && !client) fail('host_unavailable', `No Core Agent is available: ${core.reason}`);
  const cards = client ? await coreCards(client) : [];
  if (operation === 'list') {
    const local = runTaskCLI(argv, { cwd, env });
    if (local.exitCode) return local;
    const state = value(argv, '--state'), workflow = value(argv, '--workflow');
    const remote = cards.filter(card => (!state || card.state === state) && (!workflow || card.workflowId === workflow));
    return ok(client ? 'core-agent' : 'local', { tasks: [...remote.map(card => ({ ...(argv.includes('--full') ? card : taskSummary(card)), location: 'core-agent' })), ...local.result.tasks.map(card => ({ ...card, location: 'local' }))] });
  }
  if (operation === 'sync') {
    const waiting = runTaskCLI(localArgs(argv, 'task', 'list', '--full'), { cwd, env }).result.tasks.filter(card => ['backlog', 'ready'].includes(card.state) && !card.archivedAt);
    const session = await cliSession(client), imported = [];
    for (const card of waiting) {
      const created = await client.tool('card_command', { session, command: 'create', commandId: `aikido-import-${card.id}`.slice(0, 200), input: { ...cardFields(card), state: card.state } });
      runTaskCLI(localArgs(argv, 'task', 'cancel', card.id, '--revision', String(card.revision), '--reason', 'Moved to the Core Agent'), { cwd, env });
      imported.push({ from: card.id, to: created.task.id });
    }
    return ok('core-agent', { imported });
  }
  const id = operation === 'create' ? undefined : positional(argv);
  if (operation === 'launch') {
    if (!id) return ok('core-agent', await launchOnCore(client, launchInput(argv, cwd, options), argv, options));
    const card = localCard(argv, id, cwd, env);
    if (!card) fail('not_found', 'Local task not found');
    const launched = await launchOnCore(client, cardFields(card), argv, options, `aikido-launch-${card.id}`.slice(0, 200));
    runTaskCLI(localArgs(argv, 'task', 'cancel', id, '--revision', String(card.revision), '--reason', 'Moved to the Core Agent'), { cwd, env });
    return ok('core-agent', { ...launched, movedFrom: id });
  }
  if (operation === 'schedule' && !id) {
    if (!client) fail('usage', 'task schedule requires <id> without a Core Agent');
    return ok('core-agent', await launchOnCore(client, launchInput(argv, cwd, options), argv, options));
  }
  if (operation === 'create') {
    if (!client) return undefined;
    return ok('core-agent', await client.tool('card_command', { session: options['--session'] ?? await cliSession(client), command: 'create', input: jsonFile(argv, cwd) }));
  }
  const card = cards.find(item => item.id === id);
  if (!card) return localOperation(operation, id, argv, cwd, env, options);
  if (operation === 'show') return ok('core-agent', { task: card });
  if (operation === 'events') {
    const page = await client.tool('card_events', { session: card.session, ...(options['--cursor'] ? { cursor: options['--cursor'] } : {}), ...(options['--limit'] ? { limit: Number(options['--limit']) } : {}) });
    return ok('core-agent', { cursor: page.cursor, events: page.events.filter(event => event.taskId === id) });
  }
  const [command, input] = coreCommand(operation, argv, cwd, options);
  return ok('core-agent', await client.tool('card_command', { session: card.session, command, input, taskId: id, expectedRevision: Number(value(argv, '--revision') ?? card.revision) }));
}

function configCommand(argv, workspace, options, env) {
  if (argv[1] !== 'core-agent' || !['show', 'set', 'clear'].includes(argv[2])) fail('usage', 'Usage: task config core-agent show|set|clear');
  if (argv[2] === 'show') return ok('local', { connection: showConnection(workspace) });
  if (argv[2] === 'clear') return ok('local', { connection: clearConnection(workspace) });
  if (options['--token']) fail('usage', 'Pass the token with --token-env <VARIABLE> or --token-file <file>');
  const token = options['--token-env'] ? env[options['--token-env']] : options['--token-file'] ? readFileSync(resolve(workspace, options['--token-file']), 'utf8').trim() : undefined;
  return ok('local', { connection: saveConnection(workspace, { url: options['--url'], project: options['--project'], user: options['--user'], token }) });
}

export async function runHostedTaskCLI(input, { cwd = process.cwd(), env = process.env, fetcher = fetch } = {}) {
  const { rest: argv, options } = extract(input);
  const [area, operation] = argv;
  const workspace = resolve(cwd, value(argv, '--workspace') ?? '.');
  const config = area === 'task' && operation === 'config';
  const routed = area === 'host' || config || (area === 'workflow' && WORKFLOW_OPERATIONS.has(operation))
    || (area === 'task' && TASK_OPERATIONS.has(operation));
  if (!routed) return runTaskCLI(argv, { cwd, env });
  try {
    if (config) return configCommand(argv.slice(1), workspace, options, env);
    const core = options['--local'] ? { available: false, reason: 'local mode requested' } : await detectCoreAgent(workspace, { env, fetcher });
    if (area === 'host') {
      if (operation !== 'status') fail('usage', 'Host operations: status');
      const library = listLibrary(workspace);
      return ok(core.available ? 'core-agent' : 'local', { coreAgent: core.available ? { available: true, source: core.source, project: core.project } : { available: false, reason: core.reason },
        library: { workflows: library.workflows.length, errors: library.errors } });
    }
    if (area === 'workflow' && operation === 'delete' && !options['--confirm']) fail('confirmation_required', 'workflow delete requires --confirm');
    if (area === 'workflow') return core.available ? await workflowOnCore(core, operation, argv, cwd, workspace) : workflowLocally(operation, argv, cwd, workspace, options);
    if (operation === 'create' && !core.available) registerLibrary(workspace, argv);
    return await taskCommand(core, operation, argv, cwd, env, options) ?? runTaskCLI(argv, { cwd, env });
  } catch (error) {
    return { exitCode: error.code === 'usage' ? 2 : 1, result: { status: 'error', code: error.code ?? 'task_store_error', message: error.message } };
  }
}
