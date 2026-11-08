import { createHash } from 'node:crypto';
import { lstatSync, readFileSync, realpathSync } from 'node:fs';
import { userInfo } from 'node:os';
import { isAbsolute, join, relative, resolve, sep } from 'node:path';
import { openTaskStore, validateWorkflow } from './index.mjs';
import {
  createPrivatePlan, instantiatePrivatePlan, isPrivatePlanImport, preparePrivatePlan,
} from './private-plan-import.mjs';

const VALUE_OPTIONS = new Set([
  '--workspace', '--store', '--file', '--state', '--workflow', '--workflow-version',
  '--revision', '--to', '--reason', '--at', '--timezone', '--before', '--backlog',
  '--confirm-token', '--accepted', '--service-file', '--task-file', '--task-id', '--source',
  '--plan-id', '--expected-sha256', '--expected-workflow-sha256',
]);
const FLAG_OPTIONS = new Set([
  '--dry-run', '--execute', '--due', '--confirm-missed', '--acknowledge-rejection',
  '--confirm-create', '--confirm-instantiate',
]);

function cliError(code, message) {
  const error = new Error(message);
  error.code = code;
  throw error;
}

export function parseTaskArgs(argv) {
  const [area, operation, ...tail] = argv;
  if (!['task', 'plan', 'workflow', 'store'].includes(area)) {
    cliError('usage', 'Usage: aikido task <task|plan|workflow|store> <operation> [id] [options]');
  }
  const options = {};
  const positional = [];
  for (let index = 0; index < tail.length; index += 1) {
    const token = tail[index];
    if (FLAG_OPTIONS.has(token)) {
      if (Object.hasOwn(options, token)) cliError('usage', `Duplicate option: ${token}`);
      options[token] = true;
    } else if (VALUE_OPTIONS.has(token)) {
      if (Object.hasOwn(options, token)) cliError('usage', `Duplicate option: ${token}`);
      if (!tail[index + 1] || tail[index + 1].startsWith('--')) cliError('usage', `${token} requires a value`);
      options[token] = tail[index + 1];
      index += 1;
    } else if (token.startsWith('--')) cliError('usage', `Unknown option: ${token}`);
    else positional.push(token);
  }
  const integer = (name) => {
    if (options[name] === undefined) return undefined;
    if (!/^\d+$/.test(options[name])) cliError('usage', `${name} must be a non-negative integer`);
    return Number(options[name]);
  };
  options.revision = integer('--revision');
  if (options['--accepted'] !== undefined && !['true', 'false'].includes(options['--accepted'])) {
    cliError('usage', '--accepted must be true or false');
  }
  return { area, operation, positional, options };
}

function normalizeTaskCLIArgs(argv) {
  if (argv[0] !== 'task') return argv;
  const nested = argv.slice(1);
  return ['plan', 'workflow', 'store'].includes(nested[0])
    ? nested
    : ['task', ...nested];
}

function readJsonInput(path, cwd) {
  const absolute = resolve(cwd, path);
  let info;
  try { info = lstatSync(absolute); } catch (error) { cliError('input_file', `Cannot read input file: ${error.message}`); }
  if (!info.isFile() || info.isSymbolicLink() || info.size > 2_000_000) {
    cliError('input_file', 'Input must be a regular, non-symlink JSON file no larger than 2 MB');
  }
  try { return JSON.parse(readFileSync(absolute, 'utf8')); } catch (error) {
    cliError('input_file', `Invalid JSON input: ${error.message}`);
  }
}

function checkoutRoot(workspacePath) {
  let current;
  try { current = realpathSync(workspacePath); } catch (error) {
    cliError('host_command_input', `Workspace must exist: ${error.message}`);
  }
  while (true) {
    try {
      lstatSync(join(current, '.git'));
      return current;
    } catch (error) {
      if (error.code !== 'ENOENT') throw error;
    }
    const parent = resolve(current, '..');
    if (parent === current) return realpathSync(workspacePath);
    current = parent;
  }
}

function readPrivateHostJson(path, cwd, workspacePath, label) {
  const absolute = resolve(cwd, path);
  let realPath;
  try {
    const info = lstatSync(absolute);
    if (!info.isFile() || info.isSymbolicLink()) cliError('input_file', `${label} must be a regular non-symlink file`);
    realPath = realpathSync(absolute);
  } catch (error) {
    if (error.code === 'input_file') throw error;
    cliError('input_file', `Cannot read ${label}: ${error.message}`);
  }
  const checkout = checkoutRoot(workspacePath);
  const pathFromCheckout = relative(checkout, realPath);
  if (pathFromCheckout === '' ||
      (pathFromCheckout !== '..' && !pathFromCheckout.startsWith(`..${sep}`) && !isAbsolute(pathFromCheckout))) {
    cliError('private_input_required', `${label} must be stored outside the workspace checkout`);
  }
  return readJsonInput(realPath, cwd);
}

function requireRevision(options) {
  if (!Number.isInteger(options.revision)) cliError('usage', '--revision is required for mutations');
  return options.revision;
}

function requireId(positional) {
  if (!positional[0]) cliError('usage', 'An object ID is required');
  return positional[0];
}

function requiredText(value, label, max = 500) {
  if (typeof value !== 'string' || !value.trim() || value.length > max || /[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/.test(value)) {
    cliError('host_command_input', `${label} must be a non-empty string of at most ${max} characters`);
  }
  return value.trim();
}

function commandId(submissionId, operation, attempt = 1) {
  const digest = createHash('sha256')
    .update(`ai-kido-task-host-command/1\u0000${submissionId}\u0000${operation}\u0000${attempt}`)
    .digest('hex')
    .slice(0, 32)
    .split('');
  digest[12] = '5';
  digest[16] = ((Number.parseInt(digest[16], 16) & 0x3) | 0x8).toString(16);
  const hex = digest.join('');
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}

function advanceAutomaticStep(store, task, fromStepId, toStepId) {
  if (task.workflowId !== 'automatic' || task.workflowVersion !== '1.0.0') return task;
  const workflow = store.getWorkflow(task.workflowId, task.workflowVersion);
  const expectedSteps = [
    { id: 'plan', type: 'plan', transitions: ['execute'] },
    { id: 'execute', type: 'dispatch', transitions: ['verify'] },
    { id: 'verify', type: 'verify', transitions: ['approve'] },
    { id: 'approve', type: 'approve', transitions: ['complete'] },
    { id: 'complete', type: 'wait', transitions: [] },
  ];
  const definition = workflow?.definition;
  const valid = workflow?.sha256 === task.workflowSha256
    && definition?.entryStepId === 'plan'
    && definition.terminalStepIds.length === 1 && definition.terminalStepIds[0] === 'complete'
    && definition.steps.length === expectedSteps.length
    && expectedSteps.every((expected, index) => {
      const step = definition.steps[index];
      return step.id === expected.id && step.type === expected.type
        && JSON.stringify(step.transitions) === JSON.stringify(expected.transitions);
    })
    && !(definition.hooks?.length);
  if (!valid) cliError('workflow_snapshot', 'Pinned automatic@1.0.0 workflow does not match its built-in definition');
  if (task.stepId !== fromStepId) return task;
  if (!expectedSteps.find((step) => step.id === fromStepId)?.transitions.includes(toStepId)) {
    cliError('workflow_transition', `Automatic workflow cannot transition ${fromStepId} -> ${toStepId}`);
  }
  return store.advanceWorkflow(task.id, { toStepId }, { expectedRevision: task.revision });
}

function advanceAutomaticReady(store, task) {
  return task.state === 'ready' ? advanceAutomaticStep(store, task, 'plan', 'execute') : task;
}

function validateHostService(value) {
  if (!value || typeof value !== 'object' || Array.isArray(value) ||
      value.schemaVersion !== 'task-service/1' || value.enabled !== true ||
      value.capabilities?.commands !== true || value.capabilities?.scheduling !== true) {
    cliError('host_unavailable', 'An enabled authenticated task-service/1 descriptor with command and scheduling capabilities is required');
  }
  const scope = value.scope;
  if (!scope || typeof scope.projectId !== 'string' || !scope.projectId.trim() ||
      scope.projectId.length > 256 || typeof scope.sessionId !== 'string' ||
      !scope.sessionId.trim() || scope.sessionId.length > 256) {
    cliError('host_unavailable', 'The host descriptor must bind a project and session scope');
  }
  if (!Array.isArray(value.targets) || value.targets.length > 20) {
    cliError('host_unavailable', 'The host descriptor must advertise its verified task targets');
  }
  const targetIds = new Set();
  for (const target of value.targets) {
    if (!target || typeof target.id !== 'string' || !/^[A-Za-z0-9._~-]{1,200}$/.test(target.id) ||
        typeof target.label !== 'string' || !target.label.trim() || target.label.length > 100 ||
        !['core', 'copilot-cloud', 'ai-hub'].includes(target.kind) || typeof target.enabled !== 'boolean' ||
        target.reason !== undefined && (typeof target.reason !== 'string' || target.reason.length > 300) ||
        targetIds.has(target.id)) {
      cliError('host_unavailable', 'The host descriptor contains an invalid task target');
    }
    targetIds.add(target.id);
  }
  if (!value.targets.some((target) =>
    target.id === 'core-agent' && target.kind === 'core' && target.enabled === true)) {
    cliError('host_unavailable', 'The live host descriptor does not advertise an enabled Core Agent target');
  }
  return {
    schemaVersion: value.schemaVersion,
    scope: { projectId: scope.projectId, sessionId: scope.sessionId },
  };
}

function validateSubmission(value, { scheduled = false } = {}) {
  const allowed = new Set([
    'schemaVersion', 'submissionId', 'title', 'prompt', 'agent', 'mode',
    'scheduledAt', 'timezone', 'targetId', 'scheduleAttempt', 'workflowId', 'workflowVersion',
  ]);
  if (!value || typeof value !== 'object' || Array.isArray(value) ||
      Object.keys(value).some((key) => !allowed.has(key)) ||
      value.schemaVersion !== 'task-submission/1') {
    cliError('host_command_input', 'Input must match task-submission/1 and contain no unrecognized fields');
  }
  const submissionId = requiredText(value.submissionId, 'submissionId', 128);
  if (!/^[A-Za-z0-9][A-Za-z0-9._-]{0,127}$/.test(submissionId)) {
    cliError('host_command_input', 'submissionId must be a safe stable identifier');
  }
  const prompt = requiredText(value.prompt, 'prompt', 100_000);
  if (value.title !== undefined && typeof value.title !== 'string') {
    cliError('host_command_input', 'title must be text when supplied');
  }
  const defaultTitle = prompt.replace(/[\u0000-\u001f\u007f]/g, ' ').replace(/\s+/g, ' ').slice(0, 120);
  const title = requiredText(value.title?.trim() ? value.title : defaultTitle, 'title', 120);
  if ((value.workflowId === undefined) !== (value.workflowVersion === undefined)) {
    cliError('host_command_input', 'workflowId and workflowVersion must be supplied together');
  }
  const workflowId = value.workflowId === undefined ? 'automatic' : requiredText(value.workflowId, 'workflowId', 200);
  const workflowVersion = value.workflowVersion === undefined ? '1.0.0'
    : requiredText(value.workflowVersion, 'workflowVersion', 100);
  if (!/^[A-Za-z0-9._~-]{1,200}$/.test(workflowId) ||
      !/^[A-Za-z0-9._~-]{1,100}$/.test(workflowVersion)) {
    cliError('host_command_input', 'workflowId and workflowVersion must be safe identifiers');
  }
  const targetId = value.targetId ?? 'core-agent';
  if (targetId !== 'core-agent') {
    cliError('host_unavailable', 'Only the advertised Core Agent target is supported; Copilot Cloud and other targets are unavailable');
  }
  const common = {
    submissionId,
    prompt,
    title,
    agent: requiredText(value.agent, 'agent', 200),
    mode: value.mode,
    targetId,
    workflowId,
    workflowVersion,
  };
  if (common.mode !== 'act') cliError('host_command_input', 'Explicit task scheduling requires Act mode');
  if (!scheduled) return common;
  const scheduledAt = value.scheduledAt;
  const timestamp = typeof scheduledAt === 'string'
    ? scheduledAt.match(/^(\d{4})-(\d\d)-(\d\d)T(\d\d):(\d\d)(?::(\d\d)(?:\.\d{1,9})?)?(Z|[+-]\d\d:\d\d)$/)
    : null;
  const timestampMs = timestamp ? Date.parse(scheduledAt) : Number.NaN;
  if (!timestamp || !Number.isFinite(timestampMs) || timestampMs <= Date.now()) {
    cliError('host_command_input', 'scheduledAt must be a valid future ISO 8601 timestamp with an explicit UTC offset; use /aikido-launch-task for immediate execution');
  }
  const calendar = timestamp.slice(1, 7).map(Number);
  const normalized = new Date(Date.UTC(calendar[0], calendar[1] - 1, calendar[2], calendar[3], calendar[4], Number(timestamp[6] ?? 0)));
  if (normalized.getUTCFullYear() !== calendar[0] || normalized.getUTCMonth() + 1 !== calendar[1] ||
      normalized.getUTCDate() !== calendar[2] || calendar[3] > 23 || calendar[4] > 59 || Number(timestamp[6] ?? 0) > 59) {
    cliError('host_command_input', 'scheduledAt contains an invalid calendar date or time');
  }
  const timezone = requiredText(value.timezone, 'timezone', 100);
  let zoneFormatter;
  try {
    zoneFormatter = new Intl.DateTimeFormat('en', {
      timeZone: timezone, year: 'numeric', month: '2-digit', day: '2-digit',
      hour: '2-digit', minute: '2-digit', second: '2-digit', hourCycle: 'h23',
    });
    zoneFormatter.format(0);
  } catch {
    cliError('host_command_input', 'timezone must be a valid IANA timezone');
  }
  const zoneParts = Object.fromEntries(zoneFormatter.formatToParts(new Date(timestampMs))
    .filter((part) => part.type !== 'literal').map((part) => [part.type, Number(part.value)]));
  if (['year', 'month', 'day', 'hour', 'minute', 'second'].some((part, index) =>
    zoneParts[part] !== calendar[index])) {
    cliError('host_command_input', 'scheduledAt offset does not match the selected IANA timezone');
  }
  const scheduleAttempt = value.scheduleAttempt ?? 1;
  if (!Number.isSafeInteger(scheduleAttempt) || scheduleAttempt < 1) {
    cliError('host_command_input', 'scheduleAttempt must be a positive safe integer');
  }
  return { ...common, scheduledAt: new Date(scheduledAt).toISOString(), timezone, scheduleAttempt };
}

function preparedHostCommand(service, command, capability) {
  return {
    schemaVersion: 'task-host-command/1',
    status: 'prepared',
    executed: false,
    requiresAuthenticatedHostInvocation: true,
    service: { ...service, capability },
    target: { id: 'core-agent' },
    command,
  };
}

function hostCommandResult(positional, options, cwd, workspacePath) {
  const action = positional[0];
  if (positional.length !== 1) {
    cliError('usage', 'Host command preparation accepts private input files only; do not pass prompt text as positional arguments');
  }
  if (!['prepare-create', 'prepare-schedule'].includes(action)) {
    cliError('usage', 'Usage: aikido task host-command <prepare-create|prepare-schedule> --file <private-input.json> --service-file <authenticated-descriptor.json> [--task-file <actual-host-result.json> --task-id <id>]');
  }
  if (!options['--file'] || !options['--service-file']) {
    cliError('usage', `host-command ${action} requires --file and --service-file`);
  }
  const input = validateSubmission(readPrivateHostJson(options['--file'], cwd, workspacePath, 'Private submission'), {
    scheduled: action === 'prepare-schedule',
  });
  const service = validateHostService(readPrivateHostJson(options['--service-file'], cwd, workspacePath, 'Host descriptor'));
  if (action === 'prepare-create') {
    return preparedHostCommand(service, {
      commandId: commandId(input.submissionId, 'create'),
      command: 'create',
      input: {
        title: input.title,
        prompt: input.prompt,
        state: 'ready',
        workflowId: input.workflowId,
        workflowVersion: input.workflowVersion,
      },
    }, 'commands');
  }
  if (!options['--task-file']) {
    cliError('usage', 'host-command prepare-schedule requires --task-file with the actual create acknowledgement or refreshed task snapshot');
  }
  const taskData = readPrivateHostJson(options['--task-file'], cwd, workspacePath, 'Host task result');
  let task;
  if (taskData?.schemaVersion === 'task-command-result/1') {
    if (taskData.commandId !== commandId(input.submissionId, 'create')) {
      cliError('host_acknowledgement', 'Create acknowledgement does not match this submission');
    }
    task = taskData.task;
  } else if (taskData?.schemaVersion === 'task-snapshot/1') {
    const taskId = requiredText(options['--task-id'], '--task-id', 200);
    const matches = taskData.tasks?.filter((item) => item?.id === taskId) ?? [];
    if (matches.length !== 1) cliError('host_snapshot', 'Authenticated task snapshot must contain exactly one matching card');
    task = matches[0];
  } else {
    cliError('host_acknowledgement', 'Task input must be an actual task-command-result/1 acknowledgement or task-snapshot/1 response');
  }
  if (!task || typeof task.id !== 'string' || !/^[A-Za-z0-9._~-]{1,200}$/.test(task.id) ||
      task.state !== 'ready' || !Number.isSafeInteger(task.revision) || task.revision < 1) {
    cliError('host_acknowledgement', 'Host task result must identify a ready card and its current positive revision');
  }
  return preparedHostCommand(service, {
    commandId: commandId(input.submissionId, 'schedule', input.scheduleAttempt),
    command: 'schedule',
    taskId: task.id,
    expectedRevision: task.revision,
    input: {
      scheduledAt: input.scheduledAt,
      timezone: input.timezone,
      agent: input.agent,
      mode: input.mode,
    },
  }, 'commands+scheduling');
}

function operationResult(store, parsed, cwd) {
  const { area, operation, positional, options } = parsed;
  if (area === 'task' && operation === 'host-command') {
    const workspacePath = resolve(cwd, options['--workspace'] ?? '.');
    return { status: 'ok', ...hostCommandResult(positional, options, cwd, workspacePath) };
  }
  if (area === 'store') {
    if (operation === 'init') return { status: 'ok', storeRoot: store.storeRoot, workspaceId: store.workspaceId };
    if (operation === 'doctor') return { status: 'ok', ...store.doctor() };
    if (operation === 'reconcile') return { status: 'ok', ...store.reconcile() };
    cliError('usage', 'Store operations: init, doctor, reconcile');
  }
  if (area === 'workflow') {
    if (operation === 'list') return { status: 'ok', workflows: store.listWorkflows() };
    if (['register', 'create', 'update'].includes(operation)) {
      if (!options['--file']) cliError('usage', `workflow ${operation} requires --file <json>`);
      const definition = readJsonInput(options['--file'], cwd);
      const validation = validateWorkflow(definition);
      if (!validation.valid) cliError('workflow_invalid', validation.errors.join('; '));
      if (operation === 'update') {
        const id = requireId(positional);
        if (definition.id !== id) cliError('workflow_invalid', 'Updated workflow ID must match the selected workflow');
        if (!store.getWorkflow(id)) cliError('not_found', 'Workflow not found');
      }
      if (operation === 'create' && store.getWorkflow(definition.id)) {
        cliError('already_exists', 'Workflow already exists; use update with a new version');
      }
      return { status: 'ok', workflow: store.registerWorkflow(definition) };
    }
    if (operation === 'show') {
      const workflow = store.getWorkflow(requireId(positional), options['--workflow-version']);
      if (!workflow) cliError('not_found', 'Workflow not found');
      return { status: 'ok', workflow };
    }
    cliError('usage', 'Workflow operations: register/create --file, update <id> --file, validate --file, list, show <id>');
  }
  if (area === 'plan') {
    if (operation === 'import') {
      if (options['--plan-id']) {
        if (positional.length || options['--source'] || options['--confirm-create'] ||
            options['--expected-sha256'] || options['--expected-workflow-sha256'] ||
            options['--workflow'] || options['--workflow-version']) {
          cliError('usage', 'plan import --plan-id cannot be combined with source, create, workflow, or hash options');
        }
        if (!options['--confirm-instantiate']) {
          cliError('authorization_required', 'Instantiating an imported plan requires --confirm-instantiate after separate user approval');
        }
        const expectedRevision = requireRevision(options);
        return {
          status: 'ok',
          instantiated: instantiatePrivatePlan({
            store, planId: options['--plan-id'], expectedRevision, authorized: true,
          }),
        };
      }
      if (positional.length || !options['--source'] || options['--confirm-instantiate'] ||
          (options['--confirm-create'] && (!options['--expected-sha256'] || !options['--expected-workflow-sha256'])) ||
          (!options['--confirm-create'] && (options['--expected-sha256'] || options['--expected-workflow-sha256']))) {
        cliError('usage', 'plan import requires --source <workspace-relative-plan-path> or --plan-id <id> --confirm-instantiate');
      }
      const workspacePath = resolve(cwd, options['--workspace'] ?? '.');
      const prepared = preparePrivatePlan({
        store,
        workspacePath,
        sourcePath: options['--source'],
        workflowId: options['--workflow'],
        workflowVersion: options['--workflow-version'],
        expectedSourceHash: options['--expected-sha256'],
        expectedWorkflowHash: options['--expected-workflow-sha256'],
      });
      if (!options['--confirm-create']) return { status: 'preview', preview: prepared };
      return {
        status: 'ok',
        created: createPrivatePlan({ store, prepared, authorized: true }),
      };
    }
    if (operation === 'create') {
      if (!options['--file']) cliError('usage', 'plan create requires --file <json>');
      const plan = store.createPlan(readJsonInput(options['--file'], cwd), {
        workflowId: options['--workflow'], workflowVersion: options['--workflow-version'],
      });
      return { status: 'ok', plan };
    }
    if (operation === 'list') return { status: 'ok', plans: store.listPlans() };
    if (operation === 'show') {
      const plan = store.getPlan(requireId(positional));
      if (!plan) cliError('not_found', 'Plan not found');
      return { status: 'ok', plan };
    }
    if (operation === 'update') {
      if (!options['--file']) cliError('usage', 'plan update requires --file <json patch>');
      return { status: 'ok', plan: store.updatePlan(requireId(positional), readJsonInput(options['--file'], cwd), {
        expectedRevision: requireRevision(options),
      }) };
    }
    if (operation === 'instantiate') {
      const id = requireId(positional);
      const plan = store.getPlan(id);
      if (!plan) cliError('not_found', 'Plan not found');
      if (isPrivatePlanImport(plan)) {
        if (!options['--confirm-instantiate']) {
          cliError('authorization_required', 'Instantiating an imported plan requires --confirm-instantiate after separate user approval');
        }
        return {
          status: 'ok',
          instantiated: instantiatePrivatePlan({
            store, planId: id, expectedRevision: requireRevision(options), authorized: true,
          }),
        };
      }
      if (options['--confirm-instantiate'] || options.revision !== undefined) {
        cliError('usage', '--confirm-instantiate and --revision are supported only for imported plans');
      }
      return { status: 'ok', ...store.instantiatePlan(id, {
        workflowId: options['--workflow'], workflowVersion: options['--workflow-version'],
      }) };
    }
    cliError('usage', 'Plan operations: import --source [--confirm-create --expected-sha256 --expected-workflow-sha256], import --plan-id --revision --confirm-instantiate, create --file, list, show <id>, update <id> --file --revision, instantiate <id>');
  }
  if (area === 'task') {
    if (operation === 'create') {
      if (!options['--file']) cliError('usage', 'task create requires --file <json>');
      return { status: 'ok', task: advanceAutomaticReady(store, store.createTask(readJsonInput(options['--file'], cwd))) };
    }
    if (operation === 'list') return { status: 'ok', tasks: store.listTasks({
      state: options['--state'], workflowId: options['--workflow'], backlogId: options['--backlog'],
    }) };
    if (operation === 'show') {
      const task = store.getTask(requireId(positional));
      if (!task) cliError('not_found', 'Task not found');
      return { status: 'ok', task };
    }
    if (operation === 'update') {
      if (!options['--file']) cliError('usage', 'task update requires --file <json patch>');
      return { status: 'ok', task: store.updateTask(requireId(positional), readJsonInput(options['--file'], cwd), {
        expectedRevision: requireRevision(options),
      }) };
    }
    if (operation === 'link') {
      if (!options['--file']) cliError('usage', 'task link requires --file <json links>');
      return { status: 'ok', task: store.linkTasks(requireId(positional), readJsonInput(options['--file'], cwd), {
        expectedRevision: requireRevision(options),
      }) };
    }
    if (operation === 'transition') {
      if (!options['--to']) cliError('usage', 'task transition requires --to <state>');
      const task = store.transitionTask(requireId(positional), {
        to: options['--to'], reason: options['--reason'],
      }, { expectedRevision: requireRevision(options) });
      return { status: 'ok', task: options['--to'] === 'ready' ? advanceAutomaticReady(store, task) : task };
    }
    if (operation === 'accept') {
      if (options['--accepted'] === undefined) cliError('usage', 'task accept requires --accepted true|false');
      let task = store.acceptTask(requireId(positional), {
        accepted: options['--accepted'] === 'true', reason: options['--reason'],
      }, { expectedRevision: requireRevision(options) });
      if (options['--accepted'] === 'true') {
        task = advanceAutomaticStep(store, task, 'verify', 'approve');
        task = advanceAutomaticStep(store, task, 'approve', 'complete');
      }
      return { status: 'ok', task };
    }
    if (operation === 'schedule') {
      if (!options['--at'] || !options['--timezone']) cliError('usage', 'task schedule requires --at and --timezone');
      const id = requireId(positional);
      const expectedRevision = requireRevision(options);
      let task = store.getTask(id);
      if (task) {
        store.transitionTask(id, { to: task.state }, { expectedRevision });
        task = advanceAutomaticReady(store, task);
      }
      return { status: 'ok', task: store.scheduleTask(id, {
        scheduledAt: options['--at'], timezone: options['--timezone'],
      }, { expectedRevision: task?.revision ?? expectedRevision }) };
    }
    if (operation === 'schedule-result') {
      if (!options['--file']) cliError('usage', 'task schedule-result requires --file <host-outcome.json>');
      return { status: 'ok', ...store.recordScheduleOutcome(
        requireId(positional),
        readJsonInput(options['--file'], cwd),
        { expectedRevision: requireRevision(options) },
      ) };
    }
    if (operation === 'run') {
      if (options['--due'] !== true) cliError('usage', 'task run requires --due');
      if (options['--execute']) cliError('dispatcher_unavailable', 'No host dispatcher is configured for the standalone CLI; use an authorized host adapter');
      return { status: 'ok', ...store.dispatchDue({
        now: new Date().toISOString(),
        dryRun: true,
        includeMissed: options['--confirm-missed'] === true,
      }) };
    }
    if (operation === 'archive') return { status: 'ok', task: store.archiveTask(requireId(positional), { expectedRevision: requireRevision(options) }) };
    if (operation === 'restore') return { status: 'ok', task: store.restoreTask(requireId(positional), { expectedRevision: requireRevision(options) }) };
    if (operation === 'purge-preview') return { status: 'ok', preview: store.previewPurge({
      before: options['--before'], workflowId: options['--workflow'], backlogId: options['--backlog'],
    }) };
    if (operation === 'purge') {
      if (!options['--confirm-token']) cliError('confirmation_required', 'task purge requires --confirm-token from a prior preview');
      return { status: 'ok', ...store.confirmPurge(options['--confirm-token']) };
    }
    if (operation === 'unschedule') return { status: 'ok', task: store.unscheduleTask(requireId(positional), { expectedRevision: requireRevision(options) }) };
    if (operation === 'pause') return { status: 'ok', task: store.pauseTask(requireId(positional), {
      expectedRevision: requireRevision(options), reason: options['--reason'],
    }) };
    if (operation === 'resume') return { status: 'ok', task: store.resumeTask(requireId(positional), {
      expectedRevision: requireRevision(options), scheduledAt: options['--at'],
      acknowledgeRejection: options['--acknowledge-rejection'] === true,
    }) };
    if (operation === 'cancel') return { status: 'ok', task: store.cancelTask(requireId(positional), {
      expectedRevision: requireRevision(options), reason: options['--reason'],
    }) };
    cliError('usage', 'Task operations: create, list, show, update, transition, accept, schedule, schedule-result, run, pause, resume, cancel, archive, restore, purge-preview, purge, unschedule');
  }
  cliError('usage', 'Unknown task-store command');
}

function cliActor() {
  let username = 'local-user';
  try { username = userInfo().username || username; } catch {}
  const id = /^[A-Za-z0-9][A-Za-z0-9._-]{0,127}$/.test(username)
    ? username
    : `os-${createHash('sha256').update(username).digest('hex').slice(0, 24)}`;
  return { id, type: 'human' };
}

export function runTaskCLI(argv, { cwd = process.cwd(), env = process.env } = {}) {
  let store;
  try {
    const parsed = parseTaskArgs(normalizeTaskCLIArgs(argv));
    if (parsed.area === 'workflow' && parsed.operation === 'validate') {
      if (!parsed.options['--file']) cliError('usage', 'workflow validate requires --file <json>');
      const validation = validateWorkflow(readJsonInput(parsed.options['--file'], cwd));
      return {
        exitCode: validation.valid ? 0 : 1,
        result: { status: validation.valid ? 'ok' : 'error', ...validation },
      };
    }
    if (parsed.area === 'task' && parsed.operation === 'host-command') {
      const result = operationResult(null, parsed, cwd);
      return { exitCode: 0, result };
    }
    const workspacePath = resolve(cwd, parsed.options['--workspace'] ?? '.');
    store = openTaskStore({
      workspacePath,
      actor: cliActor(),
      ...(parsed.options['--store'] ? { storeRoot: resolve(cwd, parsed.options['--store']) } : {}),
    });
    const result = operationResult(store, parsed, cwd);
    return { exitCode: 0, result };
  } catch (error) {
    return {
      exitCode: error.code === 'usage' ? 2 : 1,
      result: { status: 'error', code: error.code ?? 'task_store_error', message: error.message },
    };
  } finally {
    store?.close();
  }
}
