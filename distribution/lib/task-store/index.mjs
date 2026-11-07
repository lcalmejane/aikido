import { createHash, randomUUID } from 'node:crypto';
import {
  chmodSync, closeSync, constants, existsSync, fsyncSync, lstatSync, mkdirSync, openSync,
  readFileSync, readdirSync, realpathSync, renameSync, unlinkSync, writeFileSync,
} from 'node:fs';
import { homedir, userInfo } from 'node:os';
import { basename, dirname, isAbsolute, join, relative, resolve, sep } from 'node:path';

export const TASK_STORE_SCHEMA = 'task-store/1';
export const TASK_CARD_SCHEMA = 'task-card/1';
export const WORKFLOW_SCHEMA = 'workflow/1';
export const TASK_EVENT_SCHEMA = 'task-event/1';
export const PRIVATE_PLAN_IMPORT_REF_KIND = 'aikido-legacy-plan-sha256';
export const TASK_RESULT_STATUSES = Object.freeze(['ok', 'partial', 'blocked', 'error']);
export const TASK_STATES = Object.freeze(['backlog', 'ready', 'running', 'waiting', 'review', 'done', 'cancelled']);
export const EXECUTION_STATES = Object.freeze(['queued', 'running', 'idle', 'interrupted', 'closed']);
export const SCHEDULE_STATUSES = Object.freeze(['intent-recorded', 'requested', 'acknowledged', 'unavailable', 'error']);
export const HOOK_COMMAND_TYPES = Object.freeze(['task.create', 'task.transition', 'task.verify']);
const POOL_EVENT_TYPES = Object.freeze(['spawn', 'start', 'result', 'reset', 'close', 'peer-message']);

const ID = /^[A-Za-z0-9][A-Za-z0-9._-]{0,127}$/;
const HASH = /^[a-f0-9]{64}$/;
const ISO_WITH_ZONE = /^\d{4}-\d\d-\d\dT\d\d:\d\d(?::\d\d(?:\.\d{1,9})?)?(?:Z|[+-]\d\d:\d\d)$/;
const INTERNAL_SUPPRESS_HOOKS = Symbol('internal suppress hooks');
const INTERNAL_SUPPRESS_DEFAULT_WORKFLOW = Symbol('internal suppress default workflow');
const STEP_TYPES = new Set(['plan', 'dispatch', 'wait', 'verify', 'approve']);
const TRANSITIONS = {
  backlog: new Set(['ready', 'cancelled']),
  ready: new Set(['running', 'waiting', 'cancelled']),
  running: new Set(['waiting', 'review', 'cancelled']),
  waiting: new Set(['ready', 'running', 'cancelled']),
  review: new Set(['ready', 'done', 'waiting', 'cancelled']),
  done: new Set(),
  cancelled: new Set(),
};
const DEFAULT_LIMITS = Object.freeze({
  maxChildrenPerCause: 16,
  maxCommandsPerCause: 32,
  maxHookDepth: 8,
  maxAttempts: 8,
});

export class TaskStoreError extends Error {
  constructor(code, message, details = undefined) {
    super(message);
    this.name = 'TaskStoreError';
    this.code = code;
    if (details !== undefined) this.details = details;
  }
}

function fail(code, message, details) {
  throw new TaskStoreError(code, message, details);
}

function canonicalize(value) {
  if (Array.isArray(value)) return value.map(canonicalize);
  if (value && typeof value === 'object') {
    return Object.fromEntries(Object.keys(value).sort().map((key) => [key, canonicalize(value[key])]));
  }
  return value;
}

function canonicalJson(value) {
  return JSON.stringify(canonicalize(value));
}

export function hashWorkflow(definition) {
  return createHash('sha256').update(canonicalJson(definition)).digest('hex');
}

function safeId(value, label) {
  if (typeof value !== 'string' || !ID.test(value)) fail('validation', `${label} must be a safe stable identifier`);
  return value;
}

function incrementRevision(revision) {
  if (!Number.isSafeInteger(revision) || revision < 1 || revision >= Number.MAX_SAFE_INTEGER) {
    fail('revision_exhausted', 'Task revision is outside the safe integer range');
  }
  return revision + 1;
}

function clone(value) {
  return structuredClone(value);
}

function parseTime(value, label, { required = false } = {}) {
  if (value === undefined || value === null || value === '') {
    if (required) fail('validation', `${label} is required`);
    return null;
  }
  if (typeof value !== 'string' || !ISO_WITH_ZONE.test(value) || !Number.isFinite(Date.parse(value))) {
    fail('validation', `${label} must be an ISO 8601 timestamp with an explicit UTC offset`);
  }
  return new Date(value).toISOString();
}

function validateTimezone(timezone) {
  if (typeof timezone !== 'string' || !timezone) fail('validation', 'timezone must be an IANA timezone');
  try {
    new Intl.DateTimeFormat('en', { timeZone: timezone }).format(0);
  } catch {
    fail('validation', `Unknown IANA timezone: ${timezone}`);
  }
  return timezone;
}

function validateActor(actor) {
  if (!actor || typeof actor !== 'object') fail('actor_required', 'An authenticated host-supplied actor is required');
  safeId(actor.id, 'actor.id');
  if (!['human', 'service', 'host'].includes(actor.type)) fail('actor_required', 'actor.type must be human, service, or host');
  const scope = {};
  const allowedScope = new Set(['tenantId', 'projectId', 'sessionId']);
  if (actor.scope !== undefined && (!actor.scope || typeof actor.scope !== 'object' || Array.isArray(actor.scope))) {
    fail('actor_required', 'actor.scope must be an object');
  }
  for (const [key, value] of Object.entries(actor.scope ?? {})) {
    if (!allowedScope.has(key) || typeof value !== 'string' || value.length > 256) {
      fail('actor_required', `Unsupported or invalid actor scope: ${key}`);
    }
    scope[key] = value;
  }
  return {
    id: actor.id,
    type: actor.type,
    ...(Object.keys(scope).length ? { scope } : {}),
  };
}

function isWithin(parent, child) {
  const rel = relative(parent, child);
  return rel === '' || (rel !== '..' && !rel.startsWith(`..${sep}`) && !isAbsolute(rel));
}

function assertNoSymlinkComponents(path) {
  const absolute = resolve(path);
  const root = resolve(sep);
  let current = root;
  for (const component of absolute.slice(root.length).split(sep).filter(Boolean)) {
    current = join(current, component);
    let stat;
    try {
      stat = lstatSync(current);
    } catch (error) {
      if (error.code === 'ENOENT') continue;
      throw error;
    }
    if (stat.isSymbolicLink()) fail('unsafe_path', `Symbolic links are not allowed in task-store paths: ${current}`);
  }
}

function makePrivateDirectory(path) {
  mkdirSync(path, { recursive: true, mode: 0o700 });
  assertNoSymlinkComponents(path);
  if (!lstatSync(path).isDirectory()) fail('unsafe_path', `Expected a directory: ${path}`);
  try {
    chmodSync(path, 0o700);
  } catch (error) {
    if (process.platform !== 'win32') throw error;
  }
}

function nearestExistingRealPath(path) {
  let current = resolve(path);
  const suffix = [];
  while (!existsSync(current)) {
    suffix.unshift(basename(current));
    const parent = dirname(current);
    if (parent === current) fail('unsafe_path', `No existing parent for store path: ${path}`);
    current = parent;
  }
  const real = realpathSync(current);
  return resolve(real, ...suffix);
}

function findCheckoutRoot(workspacePath) {
  let current = realpathSync(workspacePath);
  while (true) {
    const marker = join(current, '.git');
    if (existsSync(marker)) return current;
    const parent = dirname(current);
    if (parent === current) return realpathSync(workspacePath);
    current = parent;
  }
}

function userDataDirectory({ env = process.env, platform = process.platform, home = homedir() } = {}) {
  if (platform === 'win32') return resolve(env.LOCALAPPDATA || env.APPDATA || join(home, 'AppData', 'Local'));
  if (platform === 'darwin') return resolve(join(home, 'Library', 'Application Support'));
  return resolve(env.XDG_DATA_HOME || join(home, '.local', 'share'));
}

export function resolveTaskStoreRoot(workspacePath, env = process.env, platform = process.platform, home = homedir()) {
  if (typeof workspacePath !== 'string' || !isAbsolute(workspacePath)) {
    fail('validation', 'workspacePath must be an absolute path');
  }
  let workspace;
  try {
    workspace = realpathSync(workspacePath);
  } catch (error) {
    fail('validation', `workspacePath must exist: ${error.message}`);
  }
  const workspaceId = createHash('sha256').update(workspace).digest('hex').slice(0, 24);
  const base = userDataDirectory({ env, platform, home });
  const candidate = resolve(base, 'aikido', 'tasks', workspaceId);
  const realCandidate = nearestExistingRealPath(candidate);
  if (isWithin(findCheckoutRoot(workspace), realCandidate)) fail('unsafe_path', 'Task store must be outside the workspace checkout');
  return candidate;
}

function ensureOutsideWorkspace(workspacePath, storeRoot) {
  if (typeof storeRoot !== 'string' || !isAbsolute(storeRoot)) fail('validation', 'storeRoot must be absolute');
  const workspace = findCheckoutRoot(workspacePath);
  const resolvedStore = nearestExistingRealPath(storeRoot);
  if (isWithin(workspace, resolvedStore)) fail('unsafe_path', 'Task store must be outside the workspace checkout');
}

function safeReadJson(path, label) {
  assertNoSymlinkComponents(path);
  const info = lstatSync(path);
  if (!info.isFile()) fail('corrupt_store', `${label} is not a regular file`);
  try {
    return JSON.parse(readFileSync(path, 'utf8'));
  } catch (error) {
    fail('corrupt_store', `Cannot read ${label}: ${error.message}`);
  }
}

function writeAtomic(path, contents) {
  makePrivateDirectory(dirname(path));
  assertNoSymlinkComponents(path);
  if (existsSync(path) && !lstatSync(path).isFile()) fail('unsafe_path', `Refusing non-file target: ${path}`);
  const temp = `${path}.${process.pid}.${randomUUID()}.tmp`;
  const fd = openSync(temp, 'wx', 0o600);
  try {
    writeFileSync(fd, contents);
    fsyncSync(fd);
  } finally {
    closeSync(fd);
  }
  renameSync(temp, path);
  const dirFd = openSync(dirname(path), constants.O_RDONLY);
  try { fsyncSync(dirFd); } finally { closeSync(dirFd); }
}

function makeEventId(generator) {
  const value = generator();
  return safeId(value, 'generated event id');
}

function normalizeClock(clock) {
  const value = clock();
  const date = value instanceof Date ? value : new Date(value);
  if (!Number.isFinite(date.getTime())) fail('clock_error', 'Injected clock returned an invalid timestamp');
  return date.toISOString();
}

function validateHookReference(hook) {
  return hook && typeof hook === 'object'
    && typeof hook.id === 'string' && ID.test(hook.id)
    && typeof hook.version === 'string' && hook.version.length <= 64
    && HASH.test(hook.sha256 ?? '')
    && ['beforeTransition', 'onExit', 'onEnter', 'onTaskStart', 'onTaskResult', 'afterTransition', 'executionEvent'].includes(hook.phase)
    && (hook.eventTypes === undefined || (Array.isArray(hook.eventTypes)
      && hook.eventTypes.length > 0 && hook.eventTypes.every((type) => POOL_EVENT_TYPES.includes(type))));
}

export function validateWorkflow(definition) {
  const errors = [];
  const error = (message) => errors.push(message);
  if (!definition || typeof definition !== 'object' || Array.isArray(definition)) {
    return { valid: false, errors: ['workflow must be an object'] };
  }
  if (definition.schemaVersion !== WORKFLOW_SCHEMA) error(`schemaVersion must be ${WORKFLOW_SCHEMA}`);
  if (typeof definition.id !== 'string' || !ID.test(definition.id)) error('id must be a safe stable identifier');
  if (typeof definition.version !== 'string' || !/^\d+\.\d+\.\d+$/.test(definition.version)) error('version must be semantic x.y.z');
  if (!Array.isArray(definition.steps) || definition.steps.length === 0) error('steps must be a non-empty array');
  const steps = Array.isArray(definition.steps) ? definition.steps : [];
  const byId = new Map();
  for (const step of steps) {
    if (!step || typeof step !== 'object' || typeof step.id !== 'string' || !ID.test(step.id)) {
      error('every step needs a safe stable id');
      continue;
    }
    if (byId.has(step.id)) error(`duplicate step id: ${step.id}`);
    byId.set(step.id, step);
    if (!STEP_TYPES.has(step.type)) error(`${step.id}: unknown step type`);
    if (!Array.isArray(step.transitions)) error(`${step.id}: transitions must be an array`);
  }
  if (!byId.has(definition.entryStepId)) error('entryStepId must identify a step');
  const terminals = new Set(Array.isArray(definition.terminalStepIds) ? definition.terminalStepIds : []);
  if (terminals.size === 0) error('terminalStepIds must name at least one terminal step');
  for (const terminal of terminals) if (!byId.has(terminal)) error(`unknown terminal step: ${terminal}`);
  const edges = new Map();
  for (const [stepId, step] of byId) {
    const transitions = Array.isArray(step.transitions) ? step.transitions : [];
    const targets = [];
    for (const transition of transitions) {
      const target = typeof transition === 'string' ? transition : transition?.to;
      if (!byId.has(target)) error(`${stepId}: transition targets unknown step ${target}`);
      else targets.push(target);
    }
    if (terminals.has(stepId) && transitions.length) error(`${stepId}: terminal step cannot have transitions`);
    if (!terminals.has(stepId) && transitions.length === 0) error(`${stepId}: non-terminal step needs transitions`);
    edges.set(stepId, targets);
  }
  const visiting = new Set();
  const visited = new Set();
  function visit(stepId) {
    if (visiting.has(stepId)) {
      error(`workflow cycle detected at ${stepId}`);
      return;
    }
    if (visited.has(stepId)) return;
    visiting.add(stepId);
    for (const target of edges.get(stepId) ?? []) visit(target);
    visiting.delete(stepId);
    visited.add(stepId);
  }
  if (byId.has(definition.entryStepId)) visit(definition.entryStepId);
  for (const stepId of byId.keys()) if (!visited.has(stepId)) error(`unreachable step: ${stepId}`);
  const reachableTerminals = [...terminals].some((terminal) => visited.has(terminal));
  if (!reachableTerminals) error('entryStepId cannot reach a terminal step');
  if (definition.hooks !== undefined && !Array.isArray(definition.hooks)) error('hooks must be an array');
  for (const hook of definition.hooks ?? []) if (!validateHookReference(hook)) error('invalid hook reference');
  const limits = definition.limits ?? {};
  for (const name of Object.keys(DEFAULT_LIMITS)) {
    if (limits[name] !== undefined && (!Number.isInteger(limits[name]) || limits[name] < 1 || limits[name] > 10000)) {
      error(`limits.${name} must be an integer from 1 to 10000`);
    }
  }
  return { valid: errors.length === 0, errors };
}

const BUILTIN_WORKFLOWS = [
  {
    schemaVersion: WORKFLOW_SCHEMA, id: 'automatic', version: '1.0.0', entryStepId: 'plan',
    terminalStepIds: ['complete'],
    steps: [
      { id: 'plan', type: 'plan', transitions: ['execute'] },
      { id: 'execute', type: 'dispatch', transitions: ['verify'] },
      { id: 'verify', type: 'verify', transitions: ['approve'] },
      { id: 'approve', type: 'approve', transitions: ['complete'] },
      { id: 'complete', type: 'wait', transitions: [] },
    ],
  },
  {
    schemaVersion: WORKFLOW_SCHEMA, id: 'analysis', version: '1.0.0', entryStepId: 'scope',
    terminalStepIds: ['accepted'],
    steps: [
      { id: 'scope', type: 'plan', transitions: ['investigate'] },
      { id: 'investigate', type: 'dispatch', transitions: ['review'] },
      { id: 'review', type: 'verify', transitions: ['approval'] },
      { id: 'approval', type: 'approve', transitions: ['accepted'] },
      { id: 'accepted', type: 'wait', transitions: [] },
    ],
  },
  {
    schemaVersion: WORKFLOW_SCHEMA, id: 'implementation', version: '1.0.0', entryStepId: 'design',
    terminalStepIds: ['accepted'],
    steps: [
      { id: 'design', type: 'plan', transitions: ['implement'] },
      { id: 'implement', type: 'dispatch', transitions: ['verify'] },
      { id: 'verify', type: 'verify', transitions: ['approval'] },
      { id: 'approval', type: 'approve', transitions: ['accepted'] },
      { id: 'accepted', type: 'wait', transitions: [] },
    ],
  },
];

function workflowDefaults(id, version) {
  return BUILTIN_WORKFLOWS.find((workflow) => workflow.id === id && (!version || workflow.version === version));
}

function dependencyGraph(tasks) {
  const byId = new Map(tasks.map((task) => [task.id, task]));
  const visiting = new Set();
  const visited = new Set();
  function visit(id) {
    if (visiting.has(id)) fail('cycle', `Task dependency cycle detected at ${id}`);
    if (visited.has(id)) return;
    visiting.add(id);
    const task = byId.get(id);
    if (!task) fail('validation', `Unknown task reference: ${id}`);
    for (const dependency of task.dependsOn ?? []) {
      if (!byId.has(dependency)) fail('validation', `Unknown dependency ${dependency} for ${id}`);
      visit(dependency);
    }
    if (task.parentId) {
      if (!byId.has(task.parentId)) fail('validation', `Unknown parent ${task.parentId} for ${id}`);
      visit(task.parentId);
    }
    visiting.delete(id);
    visited.add(id);
  }
  for (const id of byId.keys()) visit(id);
  return byId;
}

function validateTaskInput(input) {
  if (!input || typeof input !== 'object' || Array.isArray(input)) fail('validation', 'task input must be an object');
  if (typeof input.title !== 'string' || !input.title.trim()) fail('validation', 'title is required');
  const labels = input.labels ?? [];
  if (!Array.isArray(labels) || labels.some((label) => typeof label !== 'string')) fail('validation', 'labels must be strings');
  const dependsOn = input.dependsOn ?? [];
  const relatedTo = input.relatedTo ?? [];
  if (!Array.isArray(dependsOn) || !Array.isArray(relatedTo)) fail('validation', 'task links must be arrays');
  const acceptanceCriteria = input.acceptanceCriteria ?? [];
  if (!Array.isArray(acceptanceCriteria) || acceptanceCriteria.some((item) => typeof item !== 'string' || !item.trim())) {
    fail('validation', 'acceptanceCriteria must contain non-empty strings');
  }
  if (input.prompt !== undefined && (typeof input.prompt !== 'string' || Buffer.byteLength(input.prompt, 'utf8') > 1_000_000)) {
    fail('validation', 'prompt must be a string no larger than 1 MB');
  }
  if (input.inputRefs !== undefined && (!Array.isArray(input.inputRefs) || input.inputRefs.length > 128
    || input.inputRefs.some((item) => !item || typeof item !== 'object' || typeof item.kind !== 'string' || typeof item.id !== 'string'))) {
    fail('validation', 'inputRefs must be an array of {kind,id} references');
  }
  if (input.workflowId !== undefined && (typeof input.workflowId !== 'string' || !input.workflowId.trim())) {
    fail('validation', 'workflowId must be a non-empty string');
  }
  const workflowId = input.workflowId === undefined ? undefined : safeId(input.workflowId, 'workflowId');
  if (input.workflowVersion !== undefined && !workflowId) fail('validation', 'workflowVersion requires workflowId');
  if (input.workflowSha256 !== undefined && !workflowId) fail('validation', 'workflowSha256 requires workflowId');
  if (input.workflowSha256 !== undefined && !HASH.test(input.workflowSha256)) fail('validation', 'workflowSha256 must be a SHA-256 hash');
  if (input.required !== undefined && typeof input.required !== 'boolean') fail('validation', 'required must be boolean');
  if (input.retryPolicy !== undefined && (!Number.isInteger(input.retryPolicy?.maxAttempts)
    || input.retryPolicy.maxAttempts < 1 || input.retryPolicy.maxAttempts > DEFAULT_LIMITS.maxAttempts)) {
    fail('validation', `retryPolicy.maxAttempts must be 1..${DEFAULT_LIMITS.maxAttempts}`);
  }
  const scheduledAt = parseTime(input.scheduledAt, 'scheduledAt');
  const timezone = input.timezone ? validateTimezone(input.timezone) : null;
  if (scheduledAt && !timezone) fail('validation', 'timezone is required with scheduledAt');
  return {
    title: input.title.trim(),
    ...(typeof input.summary === 'string' ? { summary: input.summary } : {}),
    ...(typeof input.prompt === 'string' ? { prompt: input.prompt } : {}),
    ...(input.inputRefs ? { inputRefs: clone(input.inputRefs) } : {}),
    labels: [...new Set(labels)].sort(),
    ...(input.backlogId ? { backlogId: safeId(input.backlogId, 'backlogId') } : {}),
    ...(Number.isInteger(input.priority) ? { priority: input.priority } : {}),
    ...(input.stepId ? { stepId: safeId(input.stepId, 'stepId') } : {}),
    ...(input.parentId ? { parentId: safeId(input.parentId, 'parentId') } : {}),
    dependsOn: [...new Set(dependsOn.map((id) => safeId(id, 'dependsOn id')))],
    relatedTo: [...new Set(relatedTo.map((id) => safeId(id, 'relatedTo id')))],
    acceptanceCriteria: [...acceptanceCriteria],
    ...(workflowId ? { workflowId } : {}),
    ...(input.workflowVersion !== undefined ? { workflowVersion: safeId(input.workflowVersion, 'workflowVersion') } : {}),
    ...(input.workflowSha256 ? { workflowSha256: input.workflowSha256 } : {}),
    ...(input.planId ? { planId: safeId(input.planId, 'planId') } : {}),
    required: input.required !== false,
    ...(input.hookPolicy === 'none' ? { hookPolicy: 'none' } : {}),
    ...(input.assignment && typeof input.assignment === 'object' ? { desiredAssignment: clone(input.assignment) } : {}),
    ...(input.retryPolicy && typeof input.retryPolicy === 'object' ? { retryPolicy: clone(input.retryPolicy) } : {}),
    dueAt: parseTime(input.dueAt, 'dueAt'),
    notBefore: parseTime(input.notBefore, 'notBefore'),
    scheduledAt,
    ...(timezone ? { timezone } : {}),
  };
}

function validateResult(result) {
  if (!result || !TASK_RESULT_STATUSES.includes(result.status)) fail('validation', `result.status must be ${TASK_RESULT_STATUSES.join('|')}`);
  if (result.summary !== undefined && typeof result.summary !== 'string') fail('validation', 'result.summary must be a string');
  if (result.artifacts !== undefined && !Array.isArray(result.artifacts)) fail('validation', 'result.artifacts must be an array');
  return {
    status: result.status,
    ...(typeof result.summary === 'string' ? { summary: result.summary } : {}),
    ...(Array.isArray(result.artifacts) ? { artifacts: clone(result.artifacts) } : {}),
  };
}

function eventReferencesTasks(event, ids) {
  const data = event.data ?? {};
  if (ids.has(data.task?.id) || ids.has(data.attempt?.taskId) || ids.has(data.taskId)) return true;
  if (data.tasks?.some((task) => ids.has(task.id))) return true;
  if (data.hookIntents?.some((intent) => ids.has(intent.taskId)
    || ids.has(intent.context?.task?.id)
    || ids.has(intent.context?.nextTask?.id)
    || ids.has(intent.command?.taskId)
    || ids.has(intent.command?.input?.parentId))) return true;
  if (ids.has(data.intent?.taskId) || ids.has(data.intent?.context?.task?.id)
    || ids.has(data.intent?.command?.taskId)
    || ids.has(data.intent?.command?.input?.parentId)) return true;
  return false;
}

function validateHookCommand(command) {
  if (!command || !HOOK_COMMAND_TYPES.includes(command.type)) fail('hook_command', 'Hook returned an unsupported command');
  if (command.type === 'task.create') validateTaskInput(command.input);
  if (command.type === 'task.transition') {
    safeId(command.taskId, 'hook taskId');
    if (!TASK_STATES.includes(command.to)) fail('hook_command', 'Hook transition has an invalid target state');
  }
  if (command.type === 'task.verify') {
    safeId(command.taskId, 'hook taskId');
    if (typeof command.criterionId !== 'string' || !command.criterionId.trim()) fail('hook_command', 'criterionId is required');
    if (typeof command.evidence !== 'string' || !command.evidence.trim()) fail('hook_command', 'evidence is required');
  }
  return clone(command);
}

function buildActorScope(actor, workspaceId) {
  return { workspaceId, ...actor.scope };
}

export function openTaskStore(options = {}) {
  return new TaskStore(options);
}

function validateBeforeHookResults(references, results) {
  if (!references.length) return;
  if (!Array.isArray(results)) {
    fail('hook_host_required', 'A host must evaluate beforeTransition hooks before the state transition');
  }
  for (const reference of references) {
    const result = results.find((item) => item?.id === reference.id
      && item.version === reference.version && item.sha256 === reference.sha256);
    if (!result) fail('hook_host_required', `Missing host result for beforeTransition hook ${reference.id}@${reference.version}`);
    if (result.allow !== true) fail('transition_refused', result.reason || `Transition refused by ${reference.id}@${reference.version}`);
    if (result.commands !== undefined && (!Array.isArray(result.commands) || result.commands.length > 0)) {
      fail('hook_command', 'beforeTransition hooks cannot return commands');
    }
  }
}

export class TaskStore {
  constructor({
    workspacePath, actor, storeRoot, clock = () => new Date(), idGenerator = randomUUID,
    hookRegistry = [], authorizedCommands = [], lockStaleCheck,
  } = {}) {
    if (typeof workspacePath !== 'string' || !isAbsolute(workspacePath)) fail('validation', 'workspacePath must be absolute');
    try {
      this.workspacePath = realpathSync(workspacePath);
    } catch (error) {
      fail('validation', `workspacePath must exist: ${error.message}`);
    }
    this.workspaceId = createHash('sha256').update(this.workspacePath).digest('hex').slice(0, 24);
    this.actor = validateActor(actor);
    if (typeof clock !== 'function' || typeof idGenerator !== 'function') fail('validation', 'clock and idGenerator must be functions');
    this.clock = clock;
    this.idGenerator = idGenerator;
    this.limits = { ...DEFAULT_LIMITS };
    this.authorizedCommands = new Set(authorizedCommands);
    if (!Array.isArray(hookRegistry) || hookRegistry.length) {
      fail('hook_host_required', 'Hook modules are registered and executed by the host, not AI-KIDO');
    }
    this.storeRoot = resolve(storeRoot ?? resolveTaskStoreRoot(this.workspacePath));
    ensureOutsideWorkspace(this.workspacePath, this.storeRoot);
    makePrivateDirectory(this.storeRoot);
    const actualRoot = realpathSync(this.storeRoot);
    if (isWithin(this.workspacePath, actualRoot)) fail('unsafe_path', 'Task store must be outside the workspace checkout');
    this.storeRoot = actualRoot;
    this.paths = {
      metadata: join(this.storeRoot, 'store.json'),
      journal: join(this.storeRoot, 'journal', 'events.jsonl'),
      lock: join(this.storeRoot, 'writer.lock'),
      plans: join(this.storeRoot, 'plans'),
      workflows: join(this.storeRoot, 'workflows'),
      boards: join(this.storeRoot, 'boards'),
      archive: join(this.storeRoot, 'archive'),
      purgePreviews: join(this.storeRoot, 'purge-previews'),
    };
    makePrivateDirectory(this.storeRoot);
    makePrivateDirectory(dirname(this.paths.journal));
    makePrivateDirectory(this.paths.plans);
    makePrivateDirectory(this.paths.workflows);
    makePrivateDirectory(this.paths.boards);
    makePrivateDirectory(this.paths.archive);
    makePrivateDirectory(this.paths.purgePreviews);
    this.closed = false;
    this.acquireLock(lockStaleCheck);
    try {
      this.initializeMetadata();
      this.tasks = new Map();
      this.plans = new Map();
      this.attempts = new Map();
      this.events = [];
      this.eventIds = new Set();
      this.externalEventIds = new Set();
      this.hookIntents = new Map();
      this.tombstones = new Map();
      this.replay();
      this.installBuiltinWorkflows();
      this.loadPurgePreviews();
      this.reconcile();
    } catch (error) {
      this.releaseLock();
      throw error;
    }
  }

  acquireLock(lockStaleCheck) {
    assertNoSymlinkComponents(this.paths.lock);
    try {
      const fd = openSync(this.paths.lock, 'wx', 0o600);
      writeFileSync(fd, JSON.stringify({ pid: process.pid, openedAt: normalizeClock(this.clock), token: this.idGenerator() }));
      fsyncSync(fd);
      closeSync(fd);
      return;
    } catch (error) {
      if (error.code !== 'EEXIST') throw error;
    }
    let lock;
    try {
      lock = safeReadJson(this.paths.lock, 'writer lock');
    } catch (error) {
      fail('writer_locked', `Task store writer lock cannot be verified: ${error.message}`);
    }
    let stale = false;
    if (typeof lockStaleCheck === 'function') stale = Boolean(lockStaleCheck(lock));
    else if (Number.isInteger(lock.pid)) {
      try { process.kill(lock.pid, 0); } catch (error) { stale = error.code === 'ESRCH'; }
    }
    if (!stale) fail('writer_locked', 'Task store already has an active writer');
    unlinkSync(this.paths.lock);
    this.acquireLock(() => false);
  }

  releaseLock() {
    if (!this.paths?.lock) return;
    try {
      if (existsSync(this.paths.lock) && lstatSync(this.paths.lock).isFile()) unlinkSync(this.paths.lock);
    } catch {}
  }

  initializeMetadata() {
    if (!existsSync(this.paths.metadata)) {
      writeAtomic(this.paths.metadata, `${JSON.stringify({
        schemaVersion: TASK_STORE_SCHEMA,
        workspaceId: this.workspaceId,
        createdAt: normalizeClock(this.clock),
      }, null, 2)}\n`);
    }
    const metadata = safeReadJson(this.paths.metadata, 'store metadata');
    if (metadata.schemaVersion !== TASK_STORE_SCHEMA) fail('schema_mismatch', `Unsupported task store schema: ${metadata.schemaVersion}`);
    if (metadata.workspaceId !== this.workspaceId) fail('scope_mismatch', 'Task store belongs to a different realpath workspace');
  }

  appendEvent(event) {
    if (this.eventIds.has(event.eventId)) fail('duplicate_event', `Event ID already exists: ${event.eventId}`);
    makePrivateDirectory(dirname(this.paths.journal));
    assertNoSymlinkComponents(this.paths.journal);
    const line = `${JSON.stringify(event)}\n`;
    const flags = constants.O_WRONLY | constants.O_APPEND | constants.O_CREAT | (constants.O_NOFOLLOW ?? 0);
    const fd = openSync(this.paths.journal, flags, 0o600);
    try {
      writeFileSync(fd, line);
      fsyncSync(fd);
    } finally {
      closeSync(fd);
    }
    this.events.push(event);
    this.eventIds.add(event.eventId);
    this.applyEvent(event);
  }

  makeEvent(operation, data, { eventId, externalEventId, causationId, rootEventId, receivedAt, hookDepth } = {}) {
    const recordedAt = normalizeClock(this.clock);
    return {
      schemaVersion: TASK_EVENT_SCHEMA,
      eventId: eventId ?? makeEventId(this.idGenerator),
      workspaceId: this.workspaceId,
      actor: clone(this.actor),
      recordedAt,
      operation,
      ...(externalEventId ? { externalEventId } : {}),
      ...(causationId ? { causationId } : {}),
      ...(rootEventId ? { rootEventId } : {}),
      ...(Number.isInteger(hookDepth) ? { hookDepth } : {}),
      ...(receivedAt ? { receivedAt } : {}),
      data: clone(data),
    };
  }

  replay() {
    if (!existsSync(this.paths.journal)) return;
    assertNoSymlinkComponents(this.paths.journal);
    const raw = readFileSync(this.paths.journal);
    if (raw.length && raw[raw.length - 1] !== 0x0a) {
      fail('truncated_journal', 'Task journal ends with an incomplete line; run doctor/reconcile after preserving the file');
    }

    const lines = raw.toString('utf8').split('\n').filter(Boolean);
    for (const [index, line] of lines.entries()) {
      let event;
      try { event = JSON.parse(line); } catch (error) {
        fail('corrupt_store', `Invalid journal event at line ${index + 1}: ${error.message}`);
      }
      if (event.schemaVersion !== TASK_EVENT_SCHEMA || event.workspaceId !== this.workspaceId) {
        fail('corrupt_store', `Invalid journal scope/schema at line ${index + 1}`);
      }
      if (this.eventIds.has(event.eventId)) continue;
      this.events.push(event);
      this.eventIds.add(event.eventId);
      this.applyEvent(event);
    }
  }

  loadPurgePreviews() {
    if (!existsSync(this.paths.purgePreviews)) return;
    this.purgePreviews = new Map();
    assertNoSymlinkComponents(this.paths.purgePreviews);
    for (const entry of readdirSync(this.paths.purgePreviews, { withFileTypes: true })) {
      if (!entry.isFile() || !entry.name.endsWith('.json')) continue;
      const preview = safeReadJson(join(this.paths.purgePreviews, entry.name), 'purge preview');
      if (preview.workspaceId === this.workspaceId && preview.actorId === this.actor.id) this.purgePreviews.set(preview.token, preview);
    }
  }

  applyEvent(event) {
    const { operation, data } = event;
    if (event.externalEventId) this.externalEventIds.add(event.externalEventId);
    for (const intent of data.hookIntents ?? []) this.hookIntents.set(intent.id, clone(intent));
    if (operation === 'task.created' || operation === 'task.updated' || operation === 'task.transitioned'
      || operation === 'task.archived' || operation === 'task.restored' || operation === 'task.attempt'
      || operation === 'task.result' || operation === 'task.accepted' || operation === 'task.execution-event'
      || operation === 'task.paused' || operation === 'task.resumed' || operation === 'task.cancelled'
      || operation === 'task.verified' || operation === 'task.dispatch-prepared' || operation === 'task.step-transitioned'
      || operation === 'task.schedule-outcome') {
      this.tasks.set(data.task.id, clone(data.task));
      for (const attempt of data.attempts ?? []) this.attempts.set(attempt.id, clone(attempt));
      if (data.attempt) this.attempts.set(data.attempt.id, clone(data.attempt));
    } else if (operation === 'plan.created' || operation === 'plan.updated' || operation === 'plan.instantiated') {
      this.plans.set(data.plan.id, clone(data.plan));
      for (const task of data.tasks ?? []) this.tasks.set(task.id, clone(task));
    } else if (operation === 'hook.intent') {
      this.hookIntents.set(data.intent.id, clone(data.intent));
    } else if (operation === 'hook.intent-applied') {
      const intent = this.hookIntents.get(data.intentId);
      if (intent) intent.status = 'applied';
    } else if (operation === 'task.purged') {
      this.tasks.delete(data.taskId);
      this.attempts.delete(data.taskId);
      this.tombstones.set(data.taskId, clone(data.tombstone));
    }
  }

  installBuiltinWorkflows() {
    for (const workflow of BUILTIN_WORKFLOWS) this.registerWorkflow(workflow, { builtin: true });
  }

  workflowPath(id, version, hash) {
    return join(this.paths.workflows, safeId(id, 'workflow id'), `${safeId(version, 'workflow version')}-${hash}.json`);
  }

  registerWorkflow(definition, { builtin = false } = {}) {
    const validation = validateWorkflow(definition);
    if (!validation.valid) fail('workflow_invalid', 'Workflow definition is invalid', validation.errors);
    const workflow = clone(definition);
    const sha256 = hashWorkflow(workflow);
    const existingVersion = this.getWorkflow(workflow.id, workflow.version);
    if (existingVersion && existingVersion.sha256 !== sha256) {
      fail('workflow_immutable', `Workflow ${workflow.id}@${workflow.version} already exists with a different hash`);
    }
    const path = this.workflowPath(workflow.id, workflow.version, sha256);
    if (existsSync(path)) {
      const stored = safeReadJson(path, 'workflow snapshot');
      if (hashWorkflow(stored.definition) !== sha256) fail('corrupt_store', 'Workflow snapshot hash mismatch');
      return { id: workflow.id, version: workflow.version, sha256, definition: clone(stored.definition) };
    }
    makePrivateDirectory(dirname(path));
    writeAtomic(path, `${JSON.stringify({
      schemaVersion: WORKFLOW_SCHEMA,
      id: workflow.id,
      version: workflow.version,
      sha256,
      definition: workflow,
      ...(builtin ? { builtin: true } : {}),
      createdAt: normalizeClock(this.clock),
    }, null, 2)}\n`);
    return { id: workflow.id, version: workflow.version, sha256, definition: workflow };
  }

  getWorkflow(id, version) {
    safeId(id, 'workflow id');
    const directory = join(this.paths.workflows, id);
    if (!existsSync(directory)) return null;
    assertNoSymlinkComponents(directory);
    const files = readdirSync(directory).filter((name) => name.endsWith('.json')).sort((a, b) => {
      const aVersion = a.slice(0, a.indexOf('-'));
      const bVersion = b.slice(0, b.indexOf('-'));
      return aVersion.localeCompare(bVersion, undefined, { numeric: true });
    });
    const snapshots = files.map((name) => safeReadJson(join(directory, name), 'workflow snapshot'));
    const snapshot = version ? snapshots.find((item) => item.version === version) : snapshots.at(-1);
    if (snapshot && (snapshot.id !== id || version && snapshot.version !== version
      || hashWorkflow(snapshot.definition) !== snapshot.sha256)) {
      fail('corrupt_store', `Workflow snapshot hash or identity mismatch: ${id}@${snapshot.version}`);
    }
    return snapshot ? { id: snapshot.id, version: snapshot.version, sha256: snapshot.sha256, definition: clone(snapshot.definition) } : null;
  }

  listWorkflows() {
    if (!existsSync(this.paths.workflows)) return [];
    return readdirSync(this.paths.workflows, { withFileTypes: true })
      .filter((entry) => entry.isDirectory() && ID.test(entry.name))
      .flatMap((entry) => readdirSync(join(this.paths.workflows, entry.name))
        .filter((name) => name.endsWith('.json'))
        .map((name) => safeReadJson(join(this.paths.workflows, entry.name, name), 'workflow snapshot')))
      .map((item) => ({ id: item.id, version: item.version, sha256: item.sha256 }))
      .sort((a, b) => a.id.localeCompare(b.id) || a.version.localeCompare(b.version));
  }

  appendHookIntents(sourceEvent, hooks, context) {
    const intents = [];
    for (const reference of hooks) {
      const key = `${reference.id}@${reference.version}`;
      if (reference.phase === 'beforeTransition') continue;
      const id = createHash('sha256').update(`${sourceEvent.eventId}|${key}|${reference.phase}`).digest('hex');
      if (this.hookIntents.has(id)) continue;
      intents.push({
        id,
        hook: { ...reference },
        context: clone(context),
      });
    }
    const rootEventId = sourceEvent.rootEventId ?? sourceEvent.eventId;
    const rootCount = this.events
      .filter((event) => (event.rootEventId ?? event.eventId) === rootEventId)
      .reduce((count, event) => count + (event.data.hookIntents?.length ?? 0), 0);
    if (rootCount + intents.length > (this.limits.maxCommandsPerCause)) {
      fail('hook_budget', `Hook command budget exceeded for cause ${rootEventId}`);
    }
    return intents.map((intent) => ({
      schemaVersion: 'hook-intent/1',
      ...intent,
      sourceEventId: sourceEvent.eventId,
      rootEventId,
      taskId: context.task?.id ?? context.nextTask?.id ?? null,
      depth: (context.hookDepth ?? 0) + 1,
      status: 'pending',
      createdAt: sourceEvent.recordedAt,
    }));
  }

  taskHooks(task, phase, stepId = task.stepId) {
    if (task.hookPolicy === 'none') return [];
    const workflow = task.workflowId ? this.getWorkflow(task.workflowId, task.workflowVersion) : null;
    return (workflow?.definition.hooks ?? []).filter((hook) => hook.phase === phase && (!hook.stepId || hook.stepId === stepId));
  }

  addIntents(events, intents) {
    if (events.length && intents.length) events[0].data.hookIntents = intents.map(clone);
  }

  assertExpectedRevision(task, expectedRevision) {
    if (!Number.isSafeInteger(expectedRevision)) fail('revision_required', 'expectedRevision must be a safe integer');
    if (!Number.isSafeInteger(task.revision) || task.revision < 1) fail('corrupt_store', 'Task revision is not a positive safe integer');
    if (task.revision !== expectedRevision) {
      fail('revision_conflict', `Expected revision ${expectedRevision}, current revision is ${task.revision}`, {
        expectedRevision, actualRevision: task.revision,
      });
    }
  }

  assertTaskOwner(task) {
    if (task.ownerId !== this.actor.id && this.actor.type !== 'service') fail('unauthorized', 'Actor does not own this task');
    if (task.workspaceId !== this.workspaceId) fail('scope_mismatch', 'Task belongs to another workspace');
    for (const [key, value] of Object.entries(this.actor.scope ?? {})) {
      if (task.scope?.[key] !== value) fail('scope_mismatch', `Task belongs to another ${key}`);
    }
  }

  getTask(id) {
    safeId(id, 'task id');
    const task = this.tasks.get(id);
    if (task) this.assertTaskOwner(task);
    return task ? clone(task) : null;
  }

  listTasks(filter = {}) {
    return [...this.tasks.values()]
      .filter((task) => (this.actor.type === 'service' || task.ownerId === this.actor.id)
        && Object.entries(this.actor.scope ?? {}).every(([key, value]) => task.scope?.[key] === value))
      .filter((task) => !filter.state || task.state === filter.state)
      .filter((task) => !filter.backlogId || task.backlogId === filter.backlogId)
      .filter((task) => !filter.workflowId || task.workflowId === filter.workflowId)
      .filter((task) => !filter.planId || task.planId === filter.planId)
      .filter((task) => filter.archived === undefined || Boolean(task.archivedAt) === Boolean(filter.archived))
      .sort((a, b) => (b.priority ?? 0) - (a.priority ?? 0) || a.order - b.order || a.id.localeCompare(b.id))
      .map(clone);
  }

  createTask(input, options = {}) {
    const {
      eventId, causationId, rootEventId, hookDepth,
      [INTERNAL_SUPPRESS_DEFAULT_WORKFLOW]: suppressDefaultWorkflow = false,
    } = options;
    const value = validateTaskInput(input);
    const id = safeId(input.id ?? this.idGenerator(), 'task id');
    if (this.tasks.has(id) || this.tombstones.has(id)) fail('duplicate_id', `Task id already exists: ${id}`);
    if (value.parentId) this.requireTask(value.parentId);
    for (const relation of [...value.dependsOn, ...value.relatedTo]) this.requireTask(relation);
    const workflow = value.workflowId
      ? this.getWorkflow(value.workflowId, value.workflowVersion)
      : suppressDefaultWorkflow ? null : this.getWorkflow('automatic', '1.0.0');
    if ((value.workflowId || !suppressDefaultWorkflow) && !workflow) {
      fail('workflow_missing', `Workflow not found: ${value.workflowId ?? 'automatic@1.0.0'}`);
    }
    if (value.workflowSha256 && workflow?.sha256 !== value.workflowSha256) fail('workflow_snapshot', 'Workflow hash does not match the requested snapshot');
    const now = normalizeClock(this.clock);
    const task = {
      schemaVersion: TASK_CARD_SCHEMA,
      id,
      workspaceId: this.workspaceId,
      ownerId: this.actor.id,
      scope: buildActorScope(this.actor, this.workspaceId),
      revision: 1,
      createdAt: now,
      updatedAt: now,
      state: input.state ?? 'backlog',
      executionStatus: input.executionStatus ?? 'idle',
      backlogId: value.backlogId ?? 'default',
      order: Number.isFinite(input.order) ? input.order : this.tasks.size,
      title: value.title,
      summary: value.summary ?? '',
      prompt: value.prompt ?? '',
      inputRefs: value.inputRefs ?? [],
      labels: value.labels,
      priority: value.priority ?? 0,
      parentId: value.parentId ?? null,
      dependsOn: value.dependsOn,
      relatedTo: value.relatedTo,
      workflowId: workflow?.id ?? value.workflowId ?? null,
      workflowVersion: workflow?.version ?? null,
      workflowSha256: workflow?.sha256 ?? null,
      planId: value.planId ?? null,
      requiredForParent: value.required,
      stepId: value.stepId ?? workflow?.definition?.entryStepId ?? null,
      acceptanceCriteria: value.acceptanceCriteria,
      acceptance: { accepted: false, reason: null, acceptedBy: null, acceptedAt: null },
      result: null,
      attempts: [],
      attemptCount: 0,
      createdBy: clone(this.actor),
      dueAt: value.dueAt,
      notBefore: value.notBefore,
      scheduledAt: value.scheduledAt,
      timezone: value.timezone ?? null,
      scheduleRegistration: value.scheduledAt ? {
        status: 'intent-recorded',
        correlationId: null,
        host: null,
        capabilityEvidence: null,
        jobId: null,
        subscriptionId: null,
        error: null,
        requestedAt: null,
        acknowledgedAt: null,
      } : null,
      desiredAssignment: value.desiredAssignment ?? null,
      retryPolicy: value.retryPolicy ?? { maxAttempts: DEFAULT_LIMITS.maxAttempts },
      archivedAt: null,
      hookPolicy: value.hookPolicy ?? 'inherit',
      ...(input.waitingReason ? { waitingReason: clone(input.waitingReason) } : {}),
    };
    if (!TASK_STATES.includes(task.state)) fail('validation', `Invalid task state: ${task.state}`);
    if (!['backlog', 'ready'].includes(task.state)) fail('validation', 'New tasks must start in backlog or ready');
    if (!EXECUTION_STATES.includes(task.executionStatus)) fail('validation', `Invalid executionStatus: ${task.executionStatus}`);
    if (workflow && !workflow.definition.steps.some((step) => step.id === task.stepId)) {
      fail('workflow_step', `Unknown workflow step: ${task.stepId}`);
    }
    const event = this.makeEvent('task.created', { task }, { eventId, causationId, rootEventId, hookDepth });
    this.appendEvent(event);
    this.writeTaskProjection(task);
    return clone(task);
  }

  requireTask(id) {
    const task = this.tasks.get(id);
    if (!task) fail('not_found', `Task not found: ${id}`);
    this.assertTaskOwner(task);
    return task;
  }

  updateTask(id, patch, { expectedRevision } = {}) {
    const current = this.requireTask(safeId(id, 'task id'));
    this.assertExpectedRevision(current, expectedRevision);
    if (!patch || typeof patch !== 'object' || Array.isArray(patch)) fail('validation', 'patch must be an object');
    const allowed = new Set(['title', 'summary', 'prompt', 'inputRefs', 'labels', 'priority', 'acceptanceCriteria', 'dueAt', 'notBefore', 'scheduledAt', 'timezone', 'desiredAssignment', 'retryPolicy']);
    for (const key of Object.keys(patch)) if (!allowed.has(key)) fail('validation', `Task field is not editable: ${key}`);
    const next = clone(current);
    if ('title' in patch) {
      if (typeof patch.title !== 'string' || !patch.title.trim()) fail('validation', 'title is required');
      next.title = patch.title.trim();
    }
    if ('summary' in patch) {
      if (typeof patch.summary !== 'string') fail('validation', 'summary must be a string');
      next.summary = patch.summary;
    }
    if ('prompt' in patch) {
      if (typeof patch.prompt !== 'string' || Buffer.byteLength(patch.prompt, 'utf8') > 1_000_000) fail('validation', 'prompt must be a string no larger than 1 MB');
      next.prompt = patch.prompt;
    }
    if ('inputRefs' in patch) {
      if (!Array.isArray(patch.inputRefs) || patch.inputRefs.length > 128
        || patch.inputRefs.some((item) => !item || typeof item !== 'object' || typeof item.kind !== 'string' || typeof item.id !== 'string')) {
        fail('validation', 'inputRefs must be an array of {kind,id} references');
      }
      next.inputRefs = clone(patch.inputRefs);
    }
    if ('labels' in patch) {
      if (!Array.isArray(patch.labels) || patch.labels.some((label) => typeof label !== 'string')) fail('validation', 'labels must be strings');
      next.labels = [...new Set(patch.labels)].sort();
    }
    if ('priority' in patch) {
      if (!Number.isInteger(patch.priority)) fail('validation', 'priority must be an integer');
      next.priority = patch.priority;
    }
    if ('acceptanceCriteria' in patch) {
      if (!Array.isArray(patch.acceptanceCriteria) || patch.acceptanceCriteria.some((item) => typeof item !== 'string' || !item.trim())) {
        fail('validation', 'acceptanceCriteria must contain non-empty strings');
      }
      next.acceptanceCriteria = [...patch.acceptanceCriteria];
    }
    for (const field of ['dueAt', 'notBefore', 'scheduledAt']) if (field in patch) next[field] = parseTime(patch[field], field);
    if ('timezone' in patch) next.timezone = patch.timezone === null ? null : validateTimezone(patch.timezone);
    for (const field of ['desiredAssignment', 'retryPolicy']) if (field in patch) next[field] = clone(patch[field]);
    if (canonicalJson(next) === canonicalJson(current)) return clone(current);
    next.revision = incrementRevision(next.revision);
    next.updatedAt = normalizeClock(this.clock);
    const event = this.makeEvent('task.updated', { task: next });
    this.appendEvent(event);
    this.writeTaskProjection(next);
    return clone(next);
  }

  linkTasks(id, links, { expectedRevision } = {}) {
    const current = this.requireTask(safeId(id, 'task id'));
    this.assertExpectedRevision(current, expectedRevision);
    if (!links || typeof links !== 'object') fail('validation', 'links must be an object');
    const next = clone(current);
    if ('parentId' in links) {
      next.parentId = links.parentId === null ? null : safeId(links.parentId, 'parentId');
      if (next.parentId) this.requireTask(next.parentId);
    }
    if ('dependsOn' in links) {
      if (!Array.isArray(links.dependsOn)) fail('validation', 'dependsOn must be an array');
      next.dependsOn = [...new Set(links.dependsOn.map((value) => safeId(value, 'dependsOn id')))];
      for (const dependency of next.dependsOn) this.requireTask(dependency);
    }
    if ('relatedTo' in links) {
      if (!Array.isArray(links.relatedTo)) fail('validation', 'relatedTo must be an array');
      next.relatedTo = [...new Set(links.relatedTo.map((value) => safeId(value, 'relatedTo id')))];
      for (const related of next.relatedTo) this.requireTask(related);
      if (next.relatedTo.includes(id)) fail('validation', 'A task cannot be related to itself');
    }
    if (canonicalJson(next) === canonicalJson(current)) return clone(current);
    const allTasks = [...this.tasks.values()].map((task) => task.id === id ? next : task);
    dependencyGraph(allTasks);
    next.revision = incrementRevision(next.revision);
    next.updatedAt = normalizeClock(this.clock);
    this.appendEvent(this.makeEvent('task.updated', { task: next }));
    this.writeTaskProjection(next);
    return clone(next);
  }

  transitionTask(id, { to, reason } = {}, {
    expectedRevision, causationId, rootEventId, hookDepth, acknowledgeRejection = false, suppressHooks = false,
    beforeHookResults, [INTERNAL_SUPPRESS_HOOKS]: internalSuppressHooks = false,
  } = {}) {
    suppressHooks = internalSuppressHooks;
    const current = this.requireTask(safeId(id, 'task id'));
    this.assertExpectedRevision(current, expectedRevision);
    if (!TASK_STATES.includes(to)) fail('validation', `Invalid task state: ${to}`);
    if (current.state === to) return clone(current);
    if (!TRANSITIONS[current.state].has(to)) fail('invalid_transition', `Cannot transition ${current.state} -> ${to}`);
    const beforeHooks = suppressHooks ? [] : this.taskHooks(current, 'beforeTransition', current.stepId);
    validateBeforeHookResults(beforeHooks, beforeHookResults);
    if (current.state === 'waiting' && current.waitingReason?.type === 'approval'
      && to === 'ready' && acknowledgeRejection !== true) {
      fail('approval_required', 'Resuming rejected work requires acknowledgeRejection:true');
    }
    if (to === 'running') {
      const blockers = this.blockingDependencies(current);
      if (blockers.length) fail('dependency_blocked', `Task has incomplete dependencies: ${blockers.join(', ')}`, blockers);
    }
    if (to === 'done') {
      if (current.acceptance.accepted !== true) fail('acceptance_required', 'A task must be explicitly accepted before done');
      const unverified = (current.acceptanceCriteria ?? [])
        .filter((criterionId) => !current.verifications?.[criterionId]?.evidence);
      if (unverified.length) fail('criteria_unverified', 'All acceptance criteria need recorded verification before done', unverified);
      const unfinishedChildren = [...this.tasks.values()]
        .filter((child) => child.parentId === current.id && child.requiredForParent !== false)
        .filter((child) => child.state !== 'done' || child.acceptance?.accepted !== true)
        .map((child) => child.id);
      if (unfinishedChildren.length) fail('children_blocked', 'Required child tasks must be accepted before the parent can finish', unfinishedChildren);
    }
    const next = clone(current);
    const oldStep = next.stepId;
    if (next.workflowId && to === 'done') {
      const workflow = this.getWorkflow(next.workflowId, next.workflowVersion);
      if (!workflow?.definition.terminalStepIds.includes(next.stepId)) {
        fail('workflow_transition', 'Task cannot finish before reaching a terminal workflow step');
      }
    }
    const event = this.makeEvent('task.transitioned', {
      task: { ...next, state: to, waitingReason: to === 'waiting' ? (reason ?? { type: 'pause', detail: 'Waiting requested' }) : null },
      ...(acknowledgeRejection ? { rejectionAcknowledged: true } : {}),
    }, { causationId, rootEventId, hookDepth });
    const taskNext = event.data.task;
    taskNext.revision = incrementRevision(taskNext.revision);
    taskNext.updatedAt = event.recordedAt;
    const allHooks = suppressHooks ? [] : [
      ...this.taskHooks(current, 'onExit', oldStep),
      ...this.taskHooks(taskNext, 'onEnter', taskNext.stepId),
      ...this.taskHooks(taskNext, 'afterTransition', taskNext.stepId),
    ];
    const intents = this.appendHookIntents(event, allHooks, {
      task: clone(current), nextTask: clone(taskNext), event: clone(event),
      from: current.state, to, reason: reason ?? null, hookDepth: event.hookDepth ?? 0,
    });
    const events = [event];
    this.addIntents(events, intents);
    for (const item of events) this.appendEvent(item);
    this.writeTaskProjection(taskNext);
    return clone(taskNext);
  }

  advanceWorkflow(id, { toStepId } = {}, {
    expectedRevision, causationId, rootEventId, hookDepth, beforeHookResults,
  } = {}) {
    const current = this.requireTask(safeId(id, 'task id'));
    this.assertExpectedRevision(current, expectedRevision);
    if (!current.workflowId) fail('workflow_missing', 'Task is not associated with a workflow');
    const workflow = this.getWorkflow(current.workflowId, current.workflowVersion);
    if (!workflow || workflow.sha256 !== current.workflowSha256) {
      fail('workflow_snapshot', 'Task workflow snapshot is missing or does not match the pinned hash');
    }
    const target = safeId(toStepId, 'toStepId');
    const from = workflow?.definition.steps.find((step) => step.id === current.stepId);
    if (!from) fail('workflow_step', `Current workflow step is missing: ${current.stepId}`);
    const targets = (from.transitions ?? []).map((item) => typeof item === 'string' ? item : item.to);
    if (!targets.includes(target)) fail('workflow_transition', `Workflow step ${current.stepId} cannot transition to ${target}`);
    const next = clone(current);
    next.stepId = target;
    next.revision = incrementRevision(next.revision);
    next.updatedAt = normalizeClock(this.clock);
    const event = this.makeEvent('task.step-transitioned', { task: next, fromStepId: current.stepId, toStepId: target }, {
      causationId, rootEventId, hookDepth,
    });
    const beforeHooks = this.taskHooks(current, 'beforeTransition', current.stepId);
    validateBeforeHookResults(beforeHooks, beforeHookResults);
    const hooks = [
      ...this.taskHooks(current, 'onExit', current.stepId),
      ...this.taskHooks(next, 'onEnter', target),
      ...this.taskHooks(next, 'afterTransition', target),
    ];
    const intents = this.appendHookIntents(event, hooks, {
      task: clone(current), nextTask: clone(next), event, fromStepId: current.stepId,
      toStepId: target, hookDepth: event.hookDepth ?? 0,
    });
    const events = [event];
    this.addIntents(events, intents);
    for (const item of events) this.appendEvent(item);
    this.writeTaskProjection(next);
    return clone(next);
  }

  blockingDependencies(task) {
    const blocked = [];
    for (const id of task.dependsOn ?? []) {
      const dependency = this.tasks.get(id);
      if (!dependency || dependency.state !== 'done' || dependency.acceptance?.accepted !== true) blocked.push(id);
    }
    return blocked;
  }

  startAttempt(id, assignment, { expectedRevision, idempotencyKey } = {}) {
    const taskId = safeId(id, 'task id');
    if (idempotencyKey !== undefined) safeId(idempotencyKey, 'idempotencyKey');
    const task = this.requireTask(taskId);
    if (idempotencyKey) {
      const duplicate = this.events.find((event) => event.operation === 'task.attempt'
        && event.data.idempotencyKey === idempotencyKey);
      if (duplicate) {
        if (duplicate.data.task.id !== taskId) fail('idempotency_conflict', 'Attempt idempotency key was already used for another task');
        const requestHash = createHash('sha256').update(canonicalJson({
          taskId, assignment: assignment ?? null, expectedRevision,
        })).digest('hex');
        if (duplicate.data.idempotencyHash && duplicate.data.idempotencyHash !== requestHash) {
          fail('idempotency_conflict', 'Attempt idempotency key was reused with different input');
        }
        const attempt = this.attempts.get(duplicate.data.attempt.id);
        if (!attempt) fail('corrupt_store', 'Idempotent attempt record is missing');
        return { task: clone(task), attempt: clone(attempt) };
      }
    }
    this.assertExpectedRevision(task, expectedRevision);
    if (!['ready', 'waiting'].includes(task.state)) fail('invalid_transition', `Cannot start an attempt from ${task.state}`);
    if (task.state === 'waiting' && task.waitingReason?.type === 'approval') fail('approval_required', 'Task is waiting for approval');
    const blockers = this.blockingDependencies(task);
    if (blockers.length) fail('dependency_blocked', `Task has incomplete dependencies: ${blockers.join(', ')}`, blockers);
    const maxAttempts = task.retryPolicy?.maxAttempts ?? DEFAULT_LIMITS.maxAttempts;
    if (!Number.isInteger(maxAttempts) || maxAttempts < 1 || task.attemptCount >= maxAttempts) fail('attempt_limit', 'Task attempt limit reached');
    const attempt = {
      id: safeId(this.idGenerator(), 'attempt id'),
      taskId: task.id,
      number: task.attemptCount + 1,
      status: 'queued',
      assignment: assignment ? clone(assignment) : task.desiredAssignment,
      createdAt: normalizeClock(this.clock),
      startedAt: null,
      finishedAt: null,
      result: null,
      lease: null,
    };
    const next = clone(task);
    if (next.state === 'waiting') {
      next.state = 'ready';
      next.waitingReason = null;
    }
    next.attempts = [...next.attempts, attempt.id];
    next.attemptCount += 1;
    next.executionStatus = 'queued';
    if (next.scheduledAt) {
      next.lastScheduledAt = next.scheduledAt;
      next.scheduledAt = null;
    }
    next.revision = incrementRevision(next.revision);
    next.updatedAt = normalizeClock(this.clock);
    const idempotencyHash = idempotencyKey
      ? createHash('sha256').update(canonicalJson({ taskId, assignment: assignment ?? null, expectedRevision })).digest('hex')
      : undefined;
    const event = this.makeEvent('task.attempt', {
      task: next, attempt,
      ...(idempotencyKey ? { idempotencyKey, idempotencyHash } : {}),
    });
    this.appendEvent(event);
    this.writeTaskProjection(next);
    return { task: clone(next), attempt: clone(attempt) };
  }

  prepareDispatch({ taskInput, parentTaskId, assignment, idempotencyKey, expectedParentRevision } = {}) {
    safeId(idempotencyKey, 'idempotencyKey');
    const requestHash = createHash('sha256').update(canonicalJson({
      taskInput, parentTaskId: parentTaskId ?? null, assignment: assignment ?? null,
      expectedParentRevision: expectedParentRevision ?? null,
    })).digest('hex');
    const duplicate = this.events.find((event) => event.operation === 'task.dispatch-prepared' && event.data.idempotencyKey === idempotencyKey);
    if (duplicate) {
      if (duplicate.data.idempotencyHash && duplicate.data.idempotencyHash !== requestHash) {
        fail('idempotency_conflict', 'Dispatch idempotency key was reused with different input');
      }
      const task = this.requireTask(duplicate.data.task.id);
      const attempt = this.attempts.get(duplicate.data.attempt.id);
      if (!attempt) fail('corrupt_store', 'Idempotent dispatch attempt record is missing');
      return { task: clone(task), attempt: clone(attempt) };
    }
    const input = { ...taskInput, ...(parentTaskId ? { parentId: parentTaskId } : {}), desiredAssignment: assignment };
    if (parentTaskId) {
      const parent = this.requireTask(safeId(parentTaskId, 'parentTaskId'));
      this.assertExpectedRevision(parent, expectedParentRevision);
      if (parent.workflowId) {
        input.workflowId ??= parent.workflowId;
        input.workflowVersion ??= parent.workflowVersion;
        input.workflowSha256 ??= parent.workflowSha256;
      }
      input.planId ??= parent.planId;
    }
    const value = validateTaskInput(input);
    if (value.parentId) this.requireTask(value.parentId);
    for (const dep of value.dependsOn) this.requireTask(dep);
    const id = safeId(input.id ?? this.idGenerator(), 'task id');
    if (this.tasks.has(id) || this.tombstones.has(id)) fail('duplicate_id', `Task id already exists: ${id}`);
    const workflow = value.workflowId ? this.getWorkflow(value.workflowId, value.workflowVersion) : null;
    if (value.workflowId && !workflow) fail('workflow_missing', `Workflow not found: ${value.workflowId}`);
    if (value.workflowSha256 && workflow?.sha256 !== value.workflowSha256) fail('workflow_snapshot', 'Workflow hash does not match the requested snapshot');
    if (value.workflowId && value.stepId && !workflow.definition.steps.some((step) => step.id === value.stepId)) {
      fail('workflow_step', `Unknown workflow step: ${value.stepId}`);
    }
    const blockers = value.dependsOn.filter((dependency) => this.tasks.get(dependency)?.state !== 'done'
      || this.tasks.get(dependency)?.acceptance?.accepted !== true);
    if (blockers.length) fail('dependency_blocked', `Dispatch has incomplete dependencies: ${blockers.join(', ')}`, blockers);
    const now = normalizeClock(this.clock);
    const task = {
      schemaVersion: TASK_CARD_SCHEMA, id, workspaceId: this.workspaceId, ownerId: this.actor.id,
      scope: buildActorScope(this.actor, this.workspaceId),
      revision: 1, createdAt: now, updatedAt: now, state: 'ready', executionStatus: 'queued',
      backlogId: value.backlogId ?? 'default', order: this.tasks.size, title: value.title,
      summary: value.summary ?? '', labels: value.labels, priority: value.priority ?? 0,
      prompt: value.prompt ?? '', inputRefs: value.inputRefs ?? [],
      parentId: value.parentId ?? null, dependsOn: value.dependsOn, relatedTo: value.relatedTo,
      workflowId: workflow?.id ?? value.workflowId ?? null, workflowVersion: workflow?.version ?? null,
      workflowSha256: workflow?.sha256 ?? null, planId: value.planId ?? null,
      requiredForParent: value.required,
      stepId: value.stepId ?? workflow?.definition.entryStepId ?? null,
      acceptanceCriteria: value.acceptanceCriteria,
      acceptance: { accepted: false, reason: null, acceptedBy: null, acceptedAt: null },
      result: null, attempts: [], attemptCount: 1, createdBy: clone(this.actor),
      dueAt: value.dueAt, notBefore: value.notBefore, scheduledAt: value.scheduledAt,
      timezone: value.timezone ?? null, desiredAssignment: value.desiredAssignment ?? null,
      retryPolicy: value.retryPolicy ?? { maxAttempts: DEFAULT_LIMITS.maxAttempts }, archivedAt: null,
      hookPolicy: value.hookPolicy ?? 'inherit',
    };
    const attempt = {
      id: safeId(this.idGenerator(), 'attempt id'), taskId: id, number: 1, status: 'queued',
      assignment: assignment ? clone(assignment) : task.desiredAssignment, createdAt: now,
      startedAt: null, finishedAt: null, result: null, lease: null,
    };
    task.attempts = [attempt.id];
    const event = this.makeEvent('task.dispatch-prepared', { task, attempt, idempotencyKey, idempotencyHash: requestHash });
    this.appendEvent(event);
    this.writeTaskProjection(task);
    return { task: clone(task), attempt: clone(attempt) };
  }

  markAttemptStarted(taskId, attemptId, { leaseId, expectedRevision } = {}) {
    const task = this.requireTask(safeId(taskId, 'task id'));
    this.assertExpectedRevision(task, expectedRevision);
    const attempt = this.attempts.get(safeId(attemptId, 'attempt id'));
    if (!attempt || attempt.taskId !== task.id) fail('not_found', `Attempt not found: ${attemptId}`);
    if (attempt.status !== 'queued') fail('attempt_state', `Attempt is ${attempt.status}, not queued`);
    if (task.state !== 'ready') fail('invalid_transition', `Task must be ready before dispatch, got ${task.state}`);
    const nextAttempt = {
      ...clone(attempt), status: 'running', startedAt: normalizeClock(this.clock),
      lease: { id: safeId(leaseId ?? this.idGenerator(), 'lease id'), acquiredAt: normalizeClock(this.clock) },
    };
    const nextTask = clone(task);
    nextTask.state = 'running';
    nextTask.executionStatus = 'running';
    nextTask.revision = incrementRevision(nextTask.revision);
    nextTask.updatedAt = normalizeClock(this.clock);
    const event = this.makeEvent('task.attempt', { task: nextTask, attempt: nextAttempt });
    this.appendEvent(event);
    this.writeTaskProjection(nextTask);
    return { task: clone(nextTask), attempt: clone(nextAttempt) };
  }

  recordAttemptResult(taskId, attemptId, result) {
    const task = this.requireTask(safeId(taskId, 'task id'));
    const attempt = this.attempts.get(safeId(attemptId, 'attempt id'));
    if (!attempt || attempt.taskId !== task.id) fail('not_found', `Attempt not found: ${attemptId}`);
    if (!['queued', 'running', 'interrupted'].includes(attempt.status)) fail('attempt_state', `Attempt is already ${attempt.status}`);
    const normalized = validateResult(result);
    const now = normalizeClock(this.clock);
    const late = task.state !== 'running' || task.executionStatus !== 'running';
    const nextAttempt = {
      ...clone(attempt), status: normalized.status,
      result: { ...normalized, ...(late ? { late: true } : {}) },
      finishedAt: now, lease: null,
    };
    const nextTask = clone(task);
    nextTask.result = { ...normalized, attemptId, recordedAt: now, ...(late ? { late: true } : {}) };
    if (late) nextTask.lateResults = [...(nextTask.lateResults ?? []), nextTask.result];
    else {
      nextTask.executionStatus = 'idle';
      if (normalized.status === 'ok' || normalized.status === 'partial') nextTask.state = 'review';
      else {
        nextTask.state = 'waiting';
        nextTask.waitingReason = { type: normalized.status === 'error' ? 'error' : 'interruption', detail: normalized.summary ?? normalized.status };
      }
    }
    nextTask.revision = incrementRevision(nextTask.revision);
    nextTask.updatedAt = now;
    const source = this.makeEvent('task.result', { task: nextTask, attempt: nextAttempt });
    const hooks = this.taskHooks(nextTask, 'onTaskResult');
    const intents = this.appendHookIntents(source, hooks, { task: clone(task), result: normalized, attempt: nextAttempt, event: source, hookDepth: 0 });
    const events = [source];
    this.addIntents(events, intents);
    for (const event of events) this.appendEvent(event);
    this.writeTaskProjection(nextTask);
    return { task: clone(nextTask), attempt: clone(nextAttempt) };
  }

  acceptTask(id, { accepted, reason } = {}, { expectedRevision, eventId } = {}) {
    const task = this.requireTask(safeId(id, 'task id'));
    if (eventId !== undefined) {
      const externalEventId = safeId(eventId, 'eventId');
      const prior = this.events.find((event) => event.externalEventId === externalEventId);
      if (prior) {
        if (prior.operation !== 'task.accepted' || prior.data.task.id !== task.id
          || prior.data.task.acceptance.accepted !== accepted
          || prior.data.task.acceptance.reason !== (typeof reason === 'string' ? reason : null)) {
          fail('idempotency_conflict', 'Acceptance eventId was already used for a different action');
        }
        return clone(task);
      }
    }
    this.assertExpectedRevision(task, expectedRevision);
    if (task.state !== 'review') fail('acceptance_state', 'Only a task in review can be accepted');
    if (typeof accepted !== 'boolean') fail('validation', 'accepted must be boolean');
    const next = clone(task);
    next.acceptance = {
      accepted,
      reason: typeof reason === 'string' ? reason : null,
      acceptedBy: this.actor.id,
      acceptedAt: normalizeClock(this.clock),
    };
    if (!accepted) {
      next.state = 'waiting';
      next.waitingReason = { type: 'approval', detail: reason || 'Acceptance declined' };
    }
    next.revision = incrementRevision(next.revision);
    next.updatedAt = next.acceptance.acceptedAt;
    const event = this.makeEvent('task.accepted', { task: next }, {
      ...(eventId ? { eventId, externalEventId: eventId } : {}),
    });
    const intents = this.appendHookIntents(event, this.taskHooks(next, 'afterTransition'), {
      task: clone(task), nextTask: clone(next), event, from: task.state, to: next.state, hookDepth: 0,
    });
    const events = [event];
    this.addIntents(events, intents);
    for (const item of events) this.appendEvent(item);
    this.writeTaskProjection(next);
    return clone(next);
  }

  scheduleTask(id, schedule, { expectedRevision } = {}) {
    if (!schedule || typeof schedule !== 'object') fail('validation', 'schedule must be an object');
    const task = this.requireTask(safeId(id, 'task id'));
    this.assertExpectedRevision(task, expectedRevision);
    const scheduledAt = parseTime(schedule.scheduledAt, 'scheduledAt', { required: true });
    const timezone = validateTimezone(schedule.timezone);
    const next = clone(task);
    next.scheduledAt = scheduledAt;
    next.timezone = timezone;
    next.notBefore = parseTime(schedule.notBefore, 'notBefore');
    next.dueAt = parseTime(schedule.dueAt, 'dueAt');
    next.scheduleRegistration = {
      status: 'intent-recorded',
      correlationId: null,
      host: null,
      capabilityEvidence: null,
      jobId: null,
      subscriptionId: null,
      error: null,
      requestedAt: null,
      acknowledgedAt: null,
    };
    if (schedule.policy !== undefined) {
      if (schedule.policy !== 'confirm-missed') fail('validation', 'schedule.policy must be confirm-missed');
      next.schedulePolicy = schedule.policy;
    }
    if (canonicalJson(next) === canonicalJson(task)) return clone(task);
    next.revision = incrementRevision(next.revision);
    next.updatedAt = normalizeClock(this.clock);
    this.appendEvent(this.makeEvent('task.updated', { task: next }));
    this.writeTaskProjection(next);
    return clone(next);
  }

  recordScheduleOutcome(id, outcome, { expectedRevision } = {}) {
    if (!outcome || typeof outcome !== 'object' || !SCHEDULE_STATUSES.includes(outcome.status)
      || outcome.status === 'intent-recorded') {
      fail('validation', `Schedule outcome status must be one of ${SCHEDULE_STATUSES.filter((item) => item !== 'intent-recorded').join(', ')}`);
    }
    const task = this.requireTask(safeId(id, 'task id'));
    const eventId = safeId(outcome.eventId, 'schedule outcome eventId');
    const outcomeHash = createHash('sha256').update(canonicalJson(outcome)).digest('hex');
    const prior = this.events.find((event) => event.externalEventId === eventId);
    if (prior) {
      if (prior.operation !== 'task.schedule-outcome' || prior.data.task.id !== task.id
        || prior.data.outcomeHash !== outcomeHash) {
        fail('idempotency_conflict', 'Schedule outcome eventId was already used for a different action');
      }
      return { duplicate: true, task: clone(task) };
    }
    this.assertExpectedRevision(task, expectedRevision);
    if (!task.scheduledAt) fail('schedule_missing', 'A schedule intent must be recorded before host registration');
    const correlationId = safeId(outcome.correlationId, 'schedule outcome correlationId');
    const current = task.scheduleRegistration ?? { status: 'intent-recorded' };
    const allowed = {
      'intent-recorded': new Set(['requested', 'unavailable', 'error']),
      requested: new Set(['acknowledged', 'unavailable', 'error']),
      acknowledged: new Set(),
      unavailable: new Set(),
      error: new Set(),
    };
    if (!allowed[current.status]?.has(outcome.status)) {
      fail('schedule_state', `Cannot record schedule outcome ${outcome.status} after ${current.status}`);
    }
    let host = current.host ?? null;
    if (outcome.host !== undefined && outcome.host !== null) {
      const { hostId, connectionId, executorId } = outcome.host;
      host = {
        hostId: safeId(hostId, 'host.hostId'),
        connectionId: safeId(connectionId, 'host.connectionId'),
        executorId: safeId(executorId, 'host.executorId'),
      };
    }
    if (outcome.status === 'requested' && (!host || !outcome.capabilityEvidence)) {
      fail('validation', 'A requested schedule needs a selected host and host-verified capability evidence');
    }
    if (outcome.capabilityEvidence !== undefined) {
      const evidence = outcome.capabilityEvidence;
      if (!evidence || evidence.capability !== 'task-scheduling' || typeof evidence.supported !== 'boolean'
        || typeof evidence.source !== 'string' || !evidence.source.trim()) {
        fail('validation', 'capabilityEvidence needs capability, supported, verifiedAt, and source');
      }
      parseTime(evidence.verifiedAt, 'capabilityEvidence.verifiedAt', { required: true });
      if (outcome.status === 'requested' && evidence.supported !== true) {
        fail('capability_unavailable', 'Host capability evidence does not authorize schedule registration');
      }
    }
    if (outcome.status === 'acknowledged' && !host) {
      fail('validation', 'An acknowledged schedule needs the host that accepted it');
    }
    if (outcome.status === 'acknowledged' && !outcome.jobId && !outcome.subscriptionId) {
      fail('validation', 'An acknowledged schedule needs a host jobId or subscriptionId');
    }
    if (outcome.status === 'error' && (!outcome.error || typeof outcome.error.code !== 'string'
      || typeof outcome.error.message !== 'string')) {
      fail('validation', 'An error schedule outcome needs error.code and error.message');
    }
    const capabilityEvidence = outcome.capabilityEvidence === undefined
      ? current.capabilityEvidence ?? null
      : clone(outcome.capabilityEvidence);
    const now = normalizeClock(this.clock);
    const registration = {
      status: outcome.status,
      correlationId,
      host,
      capabilityEvidence,
      jobId: outcome.jobId === undefined ? current.jobId ?? null : safeId(outcome.jobId, 'jobId'),
      subscriptionId: outcome.subscriptionId === undefined
        ? current.subscriptionId ?? null
        : safeId(outcome.subscriptionId, 'subscriptionId'),
      error: outcome.error ? {
        code: safeId(outcome.error.code, 'error.code'),
        message: String(outcome.error.message).slice(0, 1000),
      } : null,
      requestedAt: outcome.status === 'requested' ? now : current.requestedAt ?? null,
      acknowledgedAt: outcome.status === 'acknowledged' ? now : current.acknowledgedAt ?? null,
    };
    const next = clone(task);
    next.scheduleRegistration = registration;
    next.revision = incrementRevision(next.revision);
    next.updatedAt = now;
    const event = this.makeEvent('task.schedule-outcome', { task: next, outcome: clone(registration), outcomeHash }, {
      eventId, externalEventId: eventId, receivedAt: now,
    });
    this.appendEvent(event);
    this.writeTaskProjection(next);
    return { duplicate: false, task: clone(next) };
  }

  unscheduleTask(id, { expectedRevision } = {}) {
    const task = this.requireTask(safeId(id, 'task id'));
    this.assertExpectedRevision(task, expectedRevision);
    const next = clone(task);
    next.scheduledAt = null;
    next.notBefore = null;
    next.timezone = null;
    next.scheduleRegistration = null;
    if (canonicalJson(next) === canonicalJson(task)) return clone(task);
    next.revision = incrementRevision(next.revision);
    next.updatedAt = normalizeClock(this.clock);
    this.appendEvent(this.makeEvent('task.updated', { task: next }));
    this.writeTaskProjection(next);
    return clone(next);
  }

  pauseTask(id, { expectedRevision, reason = 'pause requested' } = {}) {
    return this.transitionTask(id, { to: 'waiting', reason: { type: 'pause', detail: reason } }, { expectedRevision });
  }

  resumeTask(id, { expectedRevision, scheduledAt, acknowledgeRejection = false } = {}) {
    const task = this.requireTask(safeId(id, 'task id'));
    this.assertExpectedRevision(task, expectedRevision);
    if (task.state !== 'waiting') fail('invalid_transition', `Cannot resume from ${task.state}`);
    const next = this.transitionTask(id, { to: 'ready' }, { expectedRevision, acknowledgeRejection });
    if (scheduledAt) return this.scheduleTask(id, { scheduledAt, timezone: task.timezone ?? 'UTC' }, { expectedRevision: next.revision });
    return next;
  }

  cancelTask(id, { expectedRevision, reason } = {}) {
    return this.transitionTask(id, { to: 'cancelled', reason }, { expectedRevision });
  }

  recordExecutionEvent(event) {
    if (!event || typeof event !== 'object' || typeof event.type !== 'string') fail('validation', 'execution event needs a type');
    return this.recordPoolEvent({
      schemaVersion: TASK_EVENT_SCHEMA,
      eventId: event.eventId ?? this.idGenerator(),
      taskId: event.taskId,
      attemptId: event.attemptId,
      origin: event.origin ?? 'host',
      sequence: event.sequence,
      revision: event.revision,
      timestamp: event.timestamp ?? normalizeClock(this.clock),
      type: event.type,
      payload: event.payload ?? {},
      scope: event.scope,
    });
  }

  recordPoolEvent(event) {
    if (!event || event.schemaVersion !== TASK_EVENT_SCHEMA || !POOL_EVENT_TYPES.includes(event.type)) {
      fail('validation', 'Pool event must match task-event/1 and use a supported type');
    }
    const eventId = safeId(event.eventId, 'eventId');
    if (typeof event.origin !== 'string' || !event.origin.trim()) fail('validation', 'Pool event origin is required');
    if (event.timestamp === undefined) fail('validation', 'Pool event timestamp is required');
    if (event.sequence !== undefined && !(Number.isSafeInteger(event.sequence) && event.sequence >= 0)
      && !(typeof event.sequence === 'string' && event.sequence.length > 0)) {
      fail('validation', 'Pool event sequence must be a non-negative integer or non-empty cursor');
    }
    if (event.revision !== undefined && (!Number.isSafeInteger(event.revision) || event.revision < 1)) {
      fail('validation', 'Pool event revision must be a positive safe integer');
    }
    const prior = this.events.find((item) => item.externalEventId === eventId);
    if (prior) {
      if (prior.operation !== 'task.execution-event' || prior.data.hostEvent?.taskId !== event.taskId
        || canonicalJson(prior.data.hostEvent) !== canonicalJson(event)) {
        fail('idempotency_conflict', 'Host eventId was already used for a different event');
      }
      return { duplicate: true, task: this.getTask(event.taskId) };
    }
    const task = this.requireTask(safeId(event.taskId, 'taskId'));
    if (event.scope?.workspaceId && event.scope.workspaceId !== this.workspaceId) fail('scope_mismatch', 'Pool event belongs to another workspace');
    for (const [key, value] of Object.entries(event.scope ?? {})) {
      if (task.scope?.[key] !== value) fail('scope_mismatch', `Pool event belongs to another ${key}`);
    }
    const attempt = event.attemptId ? this.attempts.get(safeId(event.attemptId, 'attemptId')) : null;
    if (!['peer-message', 'accept'].includes(event.type) && (!attempt || attempt.taskId !== task.id)) {
      fail('not_found', 'Pool event attempt does not belong to task');
    }
    if (attempt && attempt.taskId !== task.id) fail('not_found', 'Pool event attempt does not belong to task');
    const receivedAt = normalizeClock(this.clock);
    parseTime(event.timestamp, 'event timestamp', { required: true });
    const next = clone(task);
    let nextAttempt = attempt ? clone(attempt) : null;
    if (event.type === 'start' || event.type === 'spawn') {
      if (!nextAttempt || !['queued', 'running'].includes(nextAttempt.status)) fail('attempt_state', 'Pool start event does not match an active attempt');
      nextAttempt.status = 'running';
      nextAttempt.startedAt ??= parseTime(event.timestamp, 'event timestamp', { required: true });
      next.executionStatus = 'running';
      if (next.state === 'ready') next.state = 'running';
    } else if (event.type === 'result') {
      if (!nextAttempt || !['queued', 'running', 'interrupted'].includes(nextAttempt.status)) fail('attempt_state', 'Pool result does not match an active attempt');
      const result = validateResult(event.payload);
      const late = task.state !== 'running' || task.executionStatus !== 'running';
      nextAttempt.status = result.status;
      nextAttempt.result = { ...result, ...(late ? { late: true } : {}) };
      nextAttempt.finishedAt = receivedAt;
      nextAttempt.lease = null;
      next.result = { ...result, attemptId: nextAttempt.id, sourceTimestamp: event.timestamp ?? null, recordedAt: receivedAt, ...(late ? { late: true } : {}) };
      if (late) next.lateResults = [...(next.lateResults ?? []), next.result];
      else {
        next.executionStatus = 'idle';
        next.state = ['ok', 'partial'].includes(result.status) ? 'review' : 'waiting';
        if (next.state === 'waiting') next.waitingReason = { type: result.status === 'error' ? 'error' : 'interruption', detail: result.summary ?? result.status };
      }
    } else if (event.type === 'reset' || event.type === 'close') {
      next.executionStatus = event.type === 'reset' ? 'interrupted' : 'closed';
      if (nextAttempt && ['queued', 'running'].includes(nextAttempt.status)) {
        nextAttempt.status = 'interrupted';
        nextAttempt.finishedAt = receivedAt;
        nextAttempt.lease = null;
      }
      if (next.state === 'running') {
        next.state = 'waiting';
        next.waitingReason = { type: 'interruption', detail: event.type };
      }
    } else if (event.type === 'peer-message') {
      next.activity = [...(next.activity ?? []), {
        eventId, type: 'peer-message', origin: event.origin,
        recordedAt: receivedAt, sourceTimestamp: event.timestamp ?? null,
      }];
    }
    const effective = canonicalJson(next) !== canonicalJson(task) || (nextAttempt && canonicalJson(nextAttempt) !== canonicalJson(attempt));
    if (!effective) {
      const recorded = this.makeEvent('task.execution-event', {
        task,
        ...(nextAttempt ? { attempt: nextAttempt } : {}),
        hostEvent: clone(event),
      }, {
        eventId, externalEventId: eventId, receivedAt,
      });
      this.appendEvent(recorded);
      return { duplicate: false, task: clone(task) };
    }
    next.revision = incrementRevision(next.revision);
    next.updatedAt = receivedAt;
    const source = this.makeEvent('task.execution-event', { task: next, ...(nextAttempt ? { attempt: nextAttempt } : {}), hostEvent: clone(event) }, {
      eventId, externalEventId: eventId, receivedAt,
    });
    const phase = event.type === 'start' ? 'onTaskStart' : event.type === 'result' ? 'onTaskResult' : 'executionEvent';
    const hooks = this.taskHooks(next, phase).filter((hook) => phase !== 'executionEvent' || !hook.eventTypes || hook.eventTypes.includes(event.type));
    const intents = this.appendHookIntents(source, hooks, { task: clone(task), nextTask: clone(next), attempt: nextAttempt, hostEvent: clone(event), event: source, hookDepth: 0 });
    const pending = [source];
    this.addIntents(pending, intents);
    for (const item of pending) this.appendEvent(item);
    this.writeTaskProjection(next);
    return { duplicate: false, task: clone(next), attempt: nextAttempt ? clone(nextAttempt) : null };
  }

  createPlan(plan, { workflowId, workflowVersion } = {}) {
    if (!plan || typeof plan !== 'object' || !Array.isArray(plan.tasks) || plan.tasks.length === 0) {
      fail('validation', 'Plan needs a non-empty tasks array');
    }
    const id = safeId(plan.id ?? this.idGenerator(), 'plan id');
    if (this.plans.has(id)) fail('duplicate_id', `Plan id already exists: ${id}`);
    const selected = workflowId ?? plan.workflowId ?? (plan.type === 'analysis' ? 'analysis' : plan.type === 'implementation' ? 'implementation' : 'automatic');
    const workflow = this.getWorkflow(selected, workflowVersion ?? plan.workflowVersion) ?? workflowDefaults(selected, workflowVersion);
    if (!workflow) fail('not_found', `Workflow not found: ${selected}`);
    const snapshot = workflow.definition ? workflow : this.registerWorkflow(workflow);
    const keys = new Set();
    const taskDefinitions = plan.tasks.map((item, index) => {
      if (!item || typeof item !== 'object') fail('validation', `plan.tasks[${index}] must be an object`);
      const key = safeId(item.key ?? item.id ?? `task-${index + 1}`, 'plan task key');
      if (keys.has(key)) fail('duplicate_id', `Duplicate plan task key: ${key}`);
      keys.add(key);
      if (typeof item.title !== 'string' || !item.title.trim()) fail('validation', `Plan task ${key} needs a title`);
      return { ...clone(item), key };
    });
    for (const item of taskDefinitions) {
      for (const dependency of item.dependsOn ?? []) if (!keys.has(dependency)) fail('validation', `Unknown dependency ${dependency} for ${item.key}`);
      if (item.parentKey && !keys.has(item.parentKey)) fail('validation', `Unknown parent ${item.parentKey} for ${item.key}`);
      for (const related of item.relatedTo ?? []) if (!keys.has(related)) fail('validation', `Unknown related task ${related} for ${item.key}`);
    }
    dependencyGraph(taskDefinitions.map((item) => ({
      id: item.key, dependsOn: item.dependsOn ?? [],
      parentId: item.parentKey ?? null,
    })));
    const now = normalizeClock(this.clock);
    const value = {
      schemaVersion: 'task-plan/1',
      id,
      workspaceId: this.workspaceId,
      ownerId: this.actor.id,
      scope: buildActorScope(this.actor, this.workspaceId),
      revision: 1,
      createdAt: now,
      updatedAt: now,
      state: 'draft',
      title: typeof plan.title === 'string' && plan.title.trim() ? plan.title.trim() : 'Untitled plan',
      type: plan.type ?? 'automatic',
      workflow: { id: snapshot.id, version: snapshot.version, sha256: snapshot.sha256 },
      tasks: taskDefinitions,
      taskIds: {},
      provenance: { actor: clone(this.actor), createdAt: now },
    };
    this.appendEvent(this.makeEvent('plan.created', { plan: value }));
    this.writePlanProjection(value);
    return clone(value);
  }

  updatePlan(id, patch, { expectedRevision } = {}) {
    const current = this.plans.get(safeId(id, 'plan id'));
    if (!current) fail('not_found', `Plan not found: ${id}`);
    this.assertPlanOwner(current);
    if (!Number.isSafeInteger(expectedRevision)) fail('revision_required', 'expectedRevision must be a safe integer');
    if (!Number.isSafeInteger(current.revision) || current.revision < 1) fail('corrupt_store', 'Plan revision is not a positive safe integer');
    if (current.revision !== expectedRevision) fail('revision_conflict', `Expected revision ${expectedRevision}, current revision is ${current.revision}`);
    if (current.state !== 'draft') fail('plan_state', 'Instantiated plans are immutable; create a new plan version');
    if (Object.keys(patch ?? {}).some((key) => !['title', 'tasks', 'type'].includes(key))) fail('validation', 'Unsupported plan field');
    if (canonicalJson(patch ?? {}) === '{}') return clone(current);
    const candidate = { ...clone(current), ...clone(patch) };
    if (canonicalJson(candidate) === canonicalJson(current)) return clone(current);
    const next = { ...candidate, revision: incrementRevision(current.revision), updatedAt: normalizeClock(this.clock) };
    if (patch.tasks) {
      if (!Array.isArray(patch.tasks) || patch.tasks.length === 0) fail('validation', 'Plan tasks must be non-empty');
      const definitions = patch.tasks.map((item, index) => ({ ...clone(item), key: safeId(item.key ?? item.id ?? `task-${index + 1}`, 'plan task key') }));
      dependencyGraph(definitions.map((item) => ({ id: item.key, dependsOn: item.dependsOn ?? [], parentId: item.parentKey ?? null })));
      next.tasks = definitions;
    }
    this.appendEvent(this.makeEvent('plan.updated', { plan: next }));
    this.writePlanProjection(next);
    return clone(next);
  }

  getPlan(id) {
    const plan = this.plans.get(safeId(id, 'plan id'));
    if (plan) this.assertPlanOwner(plan);
    return plan ? clone(plan) : null;
  }

  listPlans() {
    return [...this.plans.values()]
      .filter((plan) => (this.actor.type === 'service' || plan.ownerId === this.actor.id)
        && Object.entries(this.actor.scope ?? {}).every(([key, value]) => plan.scope?.[key] === value))
      .sort((a, b) => a.createdAt.localeCompare(b.createdAt) || a.id.localeCompare(b.id))
      .map(clone);
  }

  assertPlanOwner(plan) {
    if (plan.ownerId !== this.actor.id && this.actor.type !== 'service') fail('unauthorized', 'Actor does not own this plan');
    if (plan.workspaceId !== this.workspaceId) fail('scope_mismatch', 'Plan belongs to another workspace');
    for (const [key, value] of Object.entries(this.actor.scope ?? {})) {
      if (plan.scope?.[key] !== value) fail('scope_mismatch', `Plan belongs to another ${key}`);
    }
  }

  instantiatePlan(id, {
    workflowId, workflowVersion, authorized = false, expectedRevision,
  } = {}) {
    const plan = this.plans.get(safeId(id, 'plan id'));
    if (!plan) fail('not_found', `Plan not found: ${id}`);
    this.assertPlanOwner(plan);
    const imported = plan.tasks.some((task) => (task.inputRefs ?? []).some((item) => (
      item.kind === PRIVATE_PLAN_IMPORT_REF_KIND && /^[a-f0-9]{64}$/.test(item.id)
    )));
    if (imported && authorized !== true) {
      fail('authorization_required', 'Instantiating an imported plan requires separate user authorization');
    }
    if (imported && expectedRevision !== plan.revision) {
      fail('plan_changed', 'The imported plan revision differs from the reviewed revision');
    }
    if (plan.state === 'instantiated') return { plan: clone(plan), tasks: Object.values(plan.taskIds).map((taskId) => this.getTask(taskId)) };
    const ref = plan.workflow;
    if ((workflowId && workflowId !== ref.id) || (workflowVersion && workflowVersion !== ref.version)) {
      fail('workflow_mismatch', 'Plan workflow snapshot is immutable; create a migration or new plan');
    }
    const workflow = this.getWorkflow(ref.id, ref.version);
    if (!workflow || workflow.sha256 !== ref.sha256) fail('workflow_snapshot', 'Plan workflow snapshot is missing or changed');
    const ids = new Map(plan.tasks.map((item) => [item.key, safeId(this.idGenerator(), 'task id')]));
    const now = normalizeClock(this.clock);
    const tasks = plan.tasks.map((item, index) => {
      const dependencies = (item.dependsOn ?? []).map((key) => ids.get(key));
      const taskInput = validateTaskInput({
        ...item,
        title: item.title,
        parentId: item.parentKey ? ids.get(item.parentKey) : undefined,
        dependsOn: dependencies,
        relatedTo: (item.relatedTo ?? []).map((key) => ids.get(key)),
        workflowId: ref.id,
        planId: plan.id,
        stepId: item.stepId ?? workflow.definition.entryStepId,
      });
      if (!workflow.definition.steps.some((step) => step.id === taskInput.stepId)) {
        fail('workflow_step', `Unknown workflow step ${taskInput.stepId} in task ${item.key}`);
      }
      if (!['backlog', 'ready'].includes(item.state ?? 'backlog')) {
        fail('validation', `Plan task ${item.key} must start in backlog or ready`);
      }
      return {
        schemaVersion: TASK_CARD_SCHEMA,
        id: ids.get(item.key),
        workspaceId: this.workspaceId,
        ownerId: this.actor.id,
        scope: buildActorScope(this.actor, this.workspaceId),
        revision: 1,
        createdAt: now,
        updatedAt: now,
        state: item.state ?? 'backlog',
        executionStatus: 'idle',
        backlogId: taskInput.backlogId ?? 'default',
        order: index,
        title: taskInput.title,
        summary: taskInput.summary ?? '',
        prompt: taskInput.prompt ?? '',
        inputRefs: taskInput.inputRefs ?? [],
        labels: taskInput.labels,
        priority: taskInput.priority ?? 0,
        parentId: taskInput.parentId ?? null,
        dependsOn: taskInput.dependsOn,
        relatedTo: taskInput.relatedTo,
        workflowId: ref.id,
        workflowVersion: ref.version,
        workflowSha256: ref.sha256,
        planId: plan.id,
        requiredForParent: taskInput.required,
        stepId: taskInput.stepId,
        acceptanceCriteria: taskInput.acceptanceCriteria,
        acceptance: { accepted: false, reason: null, acceptedBy: null, acceptedAt: null },
        result: null,
        attempts: [],
        attemptCount: 0,
        createdBy: clone(this.actor),
        dueAt: taskInput.dueAt,
        notBefore: taskInput.notBefore,
        scheduledAt: taskInput.scheduledAt,
        timezone: taskInput.timezone ?? null,
        desiredAssignment: taskInput.desiredAssignment ?? null,
        retryPolicy: taskInput.retryPolicy ?? { maxAttempts: DEFAULT_LIMITS.maxAttempts },
        archivedAt: null,
        hookPolicy: taskInput.hookPolicy ?? 'inherit',
      };
    });
    dependencyGraph(tasks);
    const nextPlan = {
      ...clone(plan),
      state: 'instantiated',
      revision: incrementRevision(plan.revision),
      updatedAt: now,
      taskIds: Object.fromEntries(ids),
      instantiatedAt: now,
    };
    this.appendEvent(this.makeEvent('plan.instantiated', { plan: nextPlan, tasks }));
    this.writePlanProjection(nextPlan);
    for (const task of tasks) this.writeTaskProjection(task);
    return { plan: clone(nextPlan), tasks: tasks.map(clone) };
  }

  dispatchDue({ now = normalizeClock(this.clock), dryRun = true, includeMissed = false } = {}) {
    if (dryRun !== true) fail('dispatcher_unavailable', 'AI-KIDO only previews due tasks; an authenticated host must dispatch them');
    const instant = parseTime(now, 'now', { required: true });
    const nowMs = Date.parse(instant);
    const due = this.listTasks().filter((task) => task.scheduledAt && Date.parse(task.scheduledAt) <= nowMs);
    const eligible = [];
    const blocked = [];
    const missed = [];
    for (const task of due) {
      const tooLate = nowMs - Date.parse(task.scheduledAt) > 60_000;
      if (tooLate && !includeMissed) {
        missed.push({ task, reason: 'missed_confirmation_required' });
        continue;
      }
      if (task.state !== 'ready') {
        blocked.push({ task, reason: `state_${task.state}` });
        continue;
      }
      if (task.notBefore && Date.parse(task.notBefore) > nowMs) {
        blocked.push({ task, reason: 'not_before' });
        continue;
      }
      const dependencies = this.blockingDependencies(task);
      if (dependencies.length) {
        blocked.push({ task, reason: 'dependencies', dependencies });
        continue;
      }
      eligible.push(task);
    }
    const sort = (a, b) => (b.priority ?? 0) - (a.priority ?? 0) || a.order - b.order || a.id.localeCompare(b.id);
    eligible.sort(sort);
    missed.sort((a, b) => sort(a.task, b.task));
    blocked.sort((a, b) => sort(a.task, b.task));
    return { eligible: eligible.map(clone), blocked: blocked.map(clone), missed: missed.map((item) => ({ ...item, task: clone(item.task) })) };
  }

  listPendingHookInvocations() {
    return [...this.hookIntents.values()].filter((intent) => intent.status === 'pending').map(clone);
  }

  listPendingHookCommands() {
    return this.listPendingHookInvocations();
  }

  recordHookCycle(intent, detail) {
    const targetId = intent.command?.taskId ?? intent.command?.input?.parentId
      ?? intent.taskId ?? intent.context?.task?.id ?? intent.context?.nextTask?.id;
    const task = this.tasks.get(targetId);
    if (!task) return;
    const reason = { type: 'hook_cycle', detail };
    if (task.state !== 'waiting' && TRANSITIONS[task.state]?.has('waiting')) {
      this.transitionTask(task.id, { to: 'waiting', reason }, {
        expectedRevision: task.revision,
        causationId: intent.sourceEventId,
        rootEventId: intent.rootEventId,
        hookDepth: intent.depth,
        [INTERNAL_SUPPRESS_HOOKS]: true,
      });
      return;
    }
    if (task.state !== 'waiting' || task.waitingReason?.type === 'hook_cycle') return;
    const next = clone(task);
    next.waitingReason = reason;
    next.revision = incrementRevision(next.revision);
    next.updatedAt = normalizeClock(this.clock);
    this.appendEvent(this.makeEvent('task.updated', { task: next }, {
      causationId: intent.sourceEventId,
      rootEventId: intent.rootEventId,
      hookDepth: intent.depth,
    }));
    this.writeTaskProjection(next);
  }

  applyHookCommands(intentId, commands, { authorize } = {}) {
    if (typeof authorize !== 'function') fail('unauthorized', 'Applying host hook results requires an authorization callback');
    const intent = this.hookIntents.get(safeId(intentId, 'hook intent id'));
    if (!intent) fail('not_found', `Hook invocation not found: ${intentId}`);
    if (intent.status === 'applied') return { id: intent.id, status: 'duplicate', results: [] };
    if (!Array.isArray(commands)) fail('hook_command', 'Host hook result must contain an array of typed commands');
    if (commands.length > DEFAULT_LIMITS.maxCommandsPerCause) fail('hook_budget', 'Hook command limit exceeded');
    const results = [];
    for (const rawCommand of commands) {
      const command = validateHookCommand(rawCommand);
      if (!this.authorizedCommands.has(command.type)) {
        return { id: intent.id, status: 'blocked', reason: 'command_not_authorized', results };
      }
      const allowed = authorize(clone(intent), clone(command));
      if (allowed && typeof allowed.then === 'function') fail('async_authorize', 'Hook authorization callback must be synchronous');
      if (allowed !== true) {
        return { id: intent.id, status: 'blocked', reason: 'authorization_denied', results };
      }
      const causeCount = this.events.filter((event) => (event.rootEventId ?? event.eventId) === intent.rootEventId).length;
      if (intent.depth > DEFAULT_LIMITS.maxHookDepth || causeCount > DEFAULT_LIMITS.maxCommandsPerCause) {
        this.recordHookCycle({ ...intent, command }, 'Hook cause exceeded its depth or event budget');
        this.appendEvent(this.makeEvent('hook.intent-applied', { intentId: intent.id }));
        return { id: intent.id, status: 'blocked', reason: 'hook_cycle_or_budget', results };
      }
      try {
        const actionKey = `${intent.rootEventId}:${command.type}:${command.taskId ?? intent.id}:${command.to ?? command.criterionId ?? ''}`;
        const priorAction = this.events.find((event) => event.operation === 'hook.command-applied'
          && event.data.actionKey === actionKey);
        if (priorAction?.data.intentId === intent.id) {
          results.push({ id: intent.id, status: 'duplicate' });
          continue;
        }
        if (priorAction) {
          this.recordHookCycle({ ...intent, command }, 'Hook action repeated in the same causal chain');
          this.appendEvent(this.makeEvent('hook.intent-applied', { intentId: intent.id }));
          return { id: intent.id, status: 'blocked', reason: 'hook_cycle', results };
        }
        if (command.type === 'task.create') {
          if (causeCount > DEFAULT_LIMITS.maxChildrenPerCause) fail('hook_budget', 'Hook child-task budget exceeded');
          const taskId = command.input.id ?? `hook-${intent.id}`;
          if (!this.tasks.has(taskId)) {
            this.createTask({ ...command.input, id: taskId, hookPolicy: 'none' }, {
              causationId: intent.sourceEventId,
              rootEventId: intent.rootEventId,
              hookDepth: intent.depth,
              [INTERNAL_SUPPRESS_DEFAULT_WORKFLOW]: true,
            });
          }
        } else if (command.type === 'task.transition') {
          const task = this.requireTask(command.taskId);
          this.transitionTask(command.taskId, { to: command.to, reason: command.reason }, {
            expectedRevision: command.expectedRevision ?? task.revision,
            causationId: intent.sourceEventId,
            rootEventId: intent.rootEventId,
            hookDepth: intent.depth,
          });
        } else if (command.type === 'task.verify') {
          const task = this.requireTask(command.taskId);
          this.recordVerification(command.taskId, command.criterionId, command.evidence, {
            expectedRevision: command.expectedRevision ?? task.revision,
            causationId: intent.sourceEventId,
            rootEventId: intent.rootEventId,
            hookDepth: intent.depth,
          });
        }
        this.appendEvent(this.makeEvent('hook.command-applied', { intentId: intent.id, actionKey }, {
          causationId: intent.sourceEventId,
          rootEventId: intent.rootEventId,
        }));
        results.push({ id: intent.id, status: 'applied' });
      } catch (error) {
        return { id: intent.id, status: 'error', code: error.code ?? 'hook_command', reason: error.message, results };
      }
    }
    this.appendEvent(this.makeEvent('hook.intent-applied', { intentId: intent.id }, {
      causationId: intent.sourceEventId,
      rootEventId: intent.rootEventId,
    }));
    return { id: intent.id, status: 'applied', results };
  }

  recordVerification(id, criterionId, evidence, { expectedRevision, causationId, rootEventId, hookDepth } = {}) {
    const task = this.requireTask(safeId(id, 'task id'));
    this.assertExpectedRevision(task, expectedRevision);
    safeId(criterionId, 'criterionId');
    if (!task.acceptanceCriteria.includes(criterionId) && !task.acceptanceCriteria.some((item) => item === criterionId)) {
      fail('validation', `Unknown acceptance criterion: ${criterionId}`);
    }
    if (typeof evidence !== 'string' || !evidence.trim()) fail('validation', 'evidence is required');
    const next = clone(task);
    next.verifications ??= {};
    if (next.verifications[criterionId]?.evidence === evidence) return clone(task);
    next.verifications[criterionId] = { evidence, actor: clone(this.actor), recordedAt: normalizeClock(this.clock) };
    next.revision = incrementRevision(next.revision);
    next.updatedAt = next.verifications[criterionId].recordedAt;
    this.appendEvent(this.makeEvent('task.verified', { task: next }, { causationId, rootEventId, hookDepth }));
    this.writeTaskProjection(next);
    return clone(next);
  }

  archiveTask(id, { expectedRevision } = {}) {
    const task = this.requireTask(safeId(id, 'task id'));
    this.assertExpectedRevision(task, expectedRevision);
    if (task.archivedAt) return clone(task);
    const next = clone(task);
    next.archivedAt = normalizeClock(this.clock);
    next.revision = incrementRevision(next.revision);
    next.updatedAt = next.archivedAt;
    this.appendEvent(this.makeEvent('task.archived', { task: next }));
    this.writeTaskProjection(next);
    return clone(next);
  }

  restoreTask(id, { expectedRevision } = {}) {
    const task = this.requireTask(safeId(id, 'task id'));
    this.assertExpectedRevision(task, expectedRevision);
    if (!task.archivedAt) return clone(task);
    const next = clone(task);
    next.archivedAt = null;
    next.revision = incrementRevision(next.revision);
    next.updatedAt = normalizeClock(this.clock);
    this.appendEvent(this.makeEvent('task.restored', { task: next }));
    this.writeTaskProjection(next);
    return clone(next);
  }

  previewPurge(filter = {}) {
    const candidates = this.listTasks({ archived: true }).filter((task) => {
      if (filter.before && Date.parse(task.archivedAt) >= Date.parse(parseTime(filter.before, 'before', { required: true }))) return false;
      if (filter.workflowId && task.workflowId !== filter.workflowId) return false;
      if (filter.backlogId && task.backlogId !== filter.backlogId) return false;
      return true;
    });
    if (candidates.length === 0) fail('purge_empty', 'Purge preview found no archived tasks');
    const token = safeId(this.idGenerator(), 'purge confirmation token');
    const preview = {
      token,
      workspaceId: this.workspaceId,
      actorId: this.actor.id,
      candidates: candidates.map((task) => ({ id: task.id, revision: task.revision })),
      createdAt: normalizeClock(this.clock),
      digest: createHash('sha256').update(canonicalJson(candidates.map((task) => [task.id, task.revision]))).digest('hex'),
    };
    this.purgePreviews ??= new Map();
    this.purgePreviews.set(token, preview);
    writeAtomic(join(this.paths.purgePreviews, `${token}.json`), `${JSON.stringify(preview, null, 2)}\n`);
    return clone(preview);
  }

  confirmPurge(token) {
    safeId(token, 'purge confirmation token');
    const previewPath = join(this.paths.purgePreviews, `${token}.json`);
    const preview = this.purgePreviews?.get(token) ?? (existsSync(previewPath) ? safeReadJson(previewPath, 'purge preview') : null);
    if (!preview || preview.workspaceId !== this.workspaceId || preview.actorId !== this.actor.id) {
      fail('confirmation_stale', 'Unknown, expired, or unauthorized purge confirmation');
    }
    for (const item of preview.candidates) {
      const task = this.requireTask(item.id);
      if (!task.archivedAt || task.revision !== item.revision) fail('confirmation_stale', `Purge candidate changed: ${item.id}`);
    }
    const ids = new Set(preview.candidates.map((item) => item.id));
    const plansToScrub = new Map();
    for (const plan of this.plans.values()) {
      const removedKeys = new Set(Object.entries(plan.taskIds ?? []).filter(([, taskId]) => ids.has(taskId)).map(([key]) => key));
      if (!removedKeys.size) continue;
      const cleaned = clone(plan);
      cleaned.tasks = cleaned.tasks
        .filter((task) => !removedKeys.has(task.key))
        .map((task) => ({
          ...task,
          ...(task.dependsOn ? { dependsOn: task.dependsOn.filter((key) => !removedKeys.has(key)) } : {}),
          ...(removedKeys.has(task.parentKey) ? { parentKey: null } : {}),
        }));
      cleaned.taskIds = Object.fromEntries(Object.entries(cleaned.taskIds).filter(([key]) => !removedKeys.has(key)));
      cleaned.revision = incrementRevision(cleaned.revision);
      cleaned.updatedAt = normalizeClock(this.clock);
      plansToScrub.set(plan.id, cleaned);
    }
    const retained = this.events.filter((event) => {
      if (eventReferencesTasks(event, ids)) return false;
      if (plansToScrub.has(event.data?.plan?.id)) return false;
      return true;
    });
    for (const item of preview.candidates) {
      const task = this.tasks.get(item.id);
      const tombstone = {
        taskId: task.id,
        workspaceId: this.workspaceId,
        ownerIdHash: createHash('sha256').update(task.ownerId).digest('hex'),
        purgedAt: normalizeClock(this.clock),
        revision: incrementRevision(task.revision),
      };
      retained.push(this.makeEvent('task.purged', { taskId: task.id, tombstone }));
    }
    for (const plan of plansToScrub.values()) retained.push(this.makeEvent('plan.updated', { plan }));
    this.rewriteJournal(retained);
    this.replayFresh();
    this.reconcile();
    this.purgePreviews.delete(token);
    unlinkSync(previewPath);
    return { purged: [...ids], tombstones: [...ids].map((id) => clone(this.tombstones.get(id))) };
  }

  rewriteJournal(events) {
    const path = this.paths.journal;
    const content = events.map((event) => JSON.stringify(event)).join('\n') + (events.length ? '\n' : '');
    writeAtomic(path, content);
  }

  replayFresh() {
    this.tasks.clear();
    this.plans.clear();
    this.attempts.clear();
    this.events = [];
    this.eventIds.clear();
    this.externalEventIds.clear();
    this.hookIntents.clear();
    this.tombstones.clear();
    this.replay();
  }

  taskProjectionPath(task) {
    const workflow = safeId(task.workflowId ?? 'unassigned', 'workflow id');
    const step = safeId(task.stepId ?? 'backlog', 'step id');
    const backlog = safeId(task.backlogId ?? 'default', 'backlog id');
    return task.archivedAt
      ? join(this.paths.archive, task.archivedAt.slice(0, 4), task.archivedAt.slice(5, 7), workflow, `${task.id}.json`)
      : join(this.paths.boards, backlog, workflow, step, `${task.id}.json`);
  }

  writeTaskProjection(task) {
    const path = this.taskProjectionPath(task);
    writeAtomic(path, `${JSON.stringify(task, null, 2)}\n`);
    for (const base of [this.paths.boards, this.paths.archive]) this.removeObsoleteTaskProjections(base, task.id, path);
  }

  removeObsoleteTaskProjections(root, taskId, keepPath) {
    if (!existsSync(root)) return;
    const visit = (directory) => {
      for (const entry of readdirSync(directory, { withFileTypes: true })) {
        const path = join(directory, entry.name);
        if (entry.isSymbolicLink()) fail('unsafe_path', `Symbolic link in task projection tree: ${path}`);
        if (entry.isDirectory()) visit(path);
        else if (entry.isFile() && entry.name === `${taskId}.json` && resolve(path) !== resolve(keepPath)) unlinkSync(path);
      }
    };
    visit(root);
  }

  writePlanProjection(plan) {
    writeAtomic(join(this.paths.plans, `${safeId(plan.id, 'plan id')}.json`), `${JSON.stringify(plan, null, 2)}\n`);
  }

  reconcile() {
    makePrivateDirectory(this.paths.boards);
    makePrivateDirectory(this.paths.archive);
    makePrivateDirectory(this.paths.plans);
    for (const task of this.tasks.values()) this.writeTaskProjection(task);
    for (const plan of this.plans.values()) this.writePlanProjection(plan);
    for (const [id] of this.tombstones) {
      this.removeObsoleteTaskProjections(this.paths.archive, id, '');
      this.removeObsoleteTaskProjections(this.paths.boards, id, '');
    }
    return { tasks: this.tasks.size, plans: this.plans.size, events: this.events.length, tombstones: this.tombstones.size };
  }

  doctor() {
    const metadata = safeReadJson(this.paths.metadata, 'store metadata');
    return {
      schemaVersion: metadata.schemaVersion,
      workspaceId: this.workspaceId,
      storeRoot: this.storeRoot,
      events: this.events.length,
      tasks: this.tasks.size,
      plans: this.plans.size,
      pendingHookCommands: this.listPendingHookCommands().length,
      tombstones: this.tombstones.size,
      writerOwned: !this.closed,
    };
  }

  close() {
    if (this.closed) return;
    this.closed = true;
    this.releaseLock();
  }
}
