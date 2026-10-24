import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { resolve } from 'node:path';

const policy = JSON.parse(readFileSync(new URL('./policy.json', import.meta.url), 'utf8'));
// Harnesses that ship their own general orchestrator: AI-KIDO always collaborates there.
const nativeHosts = new Set(['claude-code', 'kiro', 'codex', 'roo-code']);
const scopes = new Set([
  'general_orchestration', 'scoped_orchestration', 'delegation', 'specialist', 'utility'
]);
const taskStates = new Set(['pending', 'running', 'ok', 'partial', 'blocked', 'error']);
const resultStatuses = new Set(['ok', 'partial', 'blocked', 'error']);
const coordinations = new Set(['lead', 'collaborate', 'direct']);
const executors = new Set(['aikido', 'native']);
const transportKinds = new Set(['agent', 'thread', 'mcp', 'direct']);
const RESULT_CONTRACT = 'task-result/1';

function number(value, label, minimum = 0) {
  if (!Number.isFinite(value) || value < minimum) {
    throw new Error(`${label} must be a finite number >= ${minimum}`);
  }
  return value;
}

function integer(value, label, minimum = 0) {
  number(value, label, minimum);
  if (!Number.isSafeInteger(value)) throw new Error(`${label} must be an integer`);
  return value;
}

function routeId(route) {
  if (!route || typeof route.model !== 'string' || !route.model.trim() ||
      typeof route.connection !== 'string' || !route.connection.trim()) {
    throw new Error('A route requires nonempty model and connection IDs');
  }
  return JSON.stringify([route.model, route.connection]);
}

/**
 * Coordination mode. The AI-KIDO orchestrator NEVER refuses to work:
 * - lead:        verified host, complete inventory, no other general orchestrator -> owns the request.
 * - collaborate: a native/general orchestrator exists (or ambiguous roles, or native harness)
 *                -> it stays in charge; AI-KIDO executes direct tools, guides it with the JSON
 *                plan, and takes over only what the native one verifiably cannot do.
 * - direct:      host or inventory cannot be established -> executes the work itself with its own
 *                tools, sequentially, without claiming coordination of other agents.
 */
export function activation(snapshot, config = policy) {
  if (!snapshot || typeof snapshot !== 'object' || Array.isArray(snapshot)) {
    throw new Error('Capability snapshot must be an object');
  }
  const host = typeof snapshot.host === 'string'
    ? snapshot.host.trim().toLowerCase().replace(/[ _]+/g, '-') : '';
  const self = config.activation.self;
  const declared = snapshot.native_orchestrator;
  const parallel = typeof declared?.supports_parallel === 'boolean' ? declared.supports_parallel : null;
  const outcome = (coordination, reason, id = null) => ({
    status: 'active', coordination, reason,
    native_orchestrator: coordination === 'collaborate'
      ? { id: typeof declared?.id === 'string' && declared.id.trim() ? declared.id : id, supports_parallel: parallel }
      : null
  });
  if (nativeHosts.has(host) || config.activation.native_hosts.includes(host)) {
    return outcome('collaborate', 'native_host', `host:${host}`);
  }
  if (!config.activation.lead_hosts.includes(host)) return outcome('direct', 'unsupported_host');
  if (snapshot.inventory_complete !== true ||
      !Array.isArray(snapshot.agents) || !Array.isArray(snapshot.tools)) {
    return outcome('direct', 'incomplete_inventory');
  }
  const entries = [...snapshot.agents, ...snapshot.tools];
  const general = entries.find(entry => entry?.id !== self && entry?.scope === 'general_orchestration');
  if (general) return outcome('collaborate', 'native_orchestrator_present', general.id);
  const ambiguous = entries.findIndex(entry => !entry || typeof entry.id !== 'string' ||
    !entry.id.trim() || (entry.id !== self && !scopes.has(entry.scope)));
  if (ambiguous !== -1) return outcome('collaborate', 'ambiguous_inventory', entries[ambiguous]?.id || null);
  return { status: 'active', coordination: 'lead', reason: 'no_general_orchestrator', native_orchestrator: null };
}

export function selectRoute(snapshot, task, config = policy) {
  const rule = config.routing.classes[task?.class];
  if (!rule) throw new Error('Unknown task class');
  const input = integer(task.input_tokens, 'input_tokens');
  const output = integer(task.output_tokens, 'output_tokens');
  const context = integer(task.context_tokens, 'context_tokens');
  const quality = Math.max(rule.min_quality,
    integer(task.min_quality ?? rule.min_quality, 'min_quality', 1));
  if (typeof snapshot.can_select_model !== 'boolean') {
    throw new TypeError('can_select_model must be a boolean');
  }
  if (!snapshot.can_select_model) {
    return { status: 'selection_unsupported', model: null, connection: null,
      estimated_cost: null, reason: 'Use permitted inherited model; do not claim a selected route' };
  }
  if (!Array.isArray(snapshot.available_routes)) throw new Error('available_routes must be an array');
  // A route may carry the host `mode` that applies it (Roo: the model is bound to a mode through
  // its API profile, so choosing the target mode of the delegation tool IS choosing the model).
  const available = new Map(snapshot.available_routes.map(route => {
    const id = routeId(route);
    if (route.mode !== undefined && route.mode !== null &&
        (typeof route.mode !== 'string' || !route.mode.trim())) {
      throw new Error('A route mode must be a nonempty string');
    }
    return [id, route.mode ?? null];
  }));
  const required = snapshot.required_route ? routeId(snapshot.required_route) : null;
  const candidates = [];
  const seen = new Set();
  const minSamples = integer(config.routing.min_samples, 'min_samples', 1);
  const coldStart = config.routing.cold_start?.enabled === true &&
    !(config.routing.cold_start.excluded_classes ?? []).includes(task.class);
  number(rule.min_success_rate, 'min_success_rate');
  if (rule.min_success_rate > 1) throw new Error('min_success_rate must be <= 1');
  for (const row of config.routing.models) {
    const id = routeId(row);
    if (seen.has(id)) throw new Error('Duplicate model/connection route');
    seen.add(id);
    if (!available.has(id) || (required && id !== required)) continue;
    const candidate = eligibleRoute(row, task.class,
      { quality, context, input, output, minSamples, coldStart, successRate: rule.min_success_rate });
    if (candidate) {
      const mode = available.get(id);
      candidates.push({ id, ...candidate, ...(mode ? { mode } : {}) });
    }
  }
  candidates.sort((a, b) => a.estimated_cost - b.estimated_cost ||
    a.latency_ms - b.latency_ms || compareIds(a.id, b.id));
  if (!candidates.length) return { status: 'blocked', reason: 'no_eligible_route' };
  const { id, ...selected } = candidates[0];
  if (selected.basis) selected.latency_ms = null; // unmeasured: never present a placeholder as a measurement
  return { status: 'selected', ...selected, currency: config.routing.currency };
}

function compareIds(a, b) {
  if (a === b) return 0;
  return a < b ? -1 : 1;
}

function eligibleRoute(row, taskClass, requirements) {
  if (row.authorized !== true) return null;
  const quality = integer(row.quality, 'quality', 1);
  const capacity = integer(row.context_tokens, 'model context_tokens', 1);
  const inputPrice = number(row.input_per_million, 'input_per_million');
  const outputPrice = number(row.output_per_million, 'output_per_million');
  const stats = row.stats?.[taskClass];
  // Cold start: only a row DERIVED from a price source (`estimate: true`) may be tried before it
  // has `min_samples` measurements, and only while its few observed results stay above the
  // class threshold. Measured rows never get this allowance.
  const coldAllowed = row.estimate === true && requirements.coldStart === true;
  if ((!stats && !coldAllowed) || quality < requirements.quality ||
      capacity < Math.max(requirements.context, requirements.input) + requirements.output) return null;
  let latency = Number.MAX_SAFE_INTEGER;
  let basis = null;
  if (stats) {
    const samples = integer(stats.samples, 'samples');
    const passed = integer(stats.passed, 'passed');
    if (passed > samples) throw new Error('passed cannot exceed samples');
    const measured = number(stats.latency_ms, 'latency_ms');
    if (coldAllowed && samples < requirements.minSamples) {
      if (samples > 0 && passed / samples < requirements.successRate) return null;
      basis = 'unmeasured_source_estimate';
      if (samples > 0) latency = measured;
    } else {
      if (samples < requirements.minSamples || passed / samples < requirements.successRate) return null;
      latency = measured;
    }
  } else {
    basis = 'unmeasured_source_estimate';
  }
  const cost = (requirements.input * inputPrice + requirements.output * outputPrice) / 1_000_000;
  if (!Number.isFinite(cost)) throw new Error('Estimated cost overflow');
  return { model: row.model, connection: row.connection,
    estimated_cost: cost, latency_ms: latency, ...(basis ? { basis } : {}) };
}

function inventory(entries, label) {
  if (!Array.isArray(entries)) throw new Error(`${label} must be an array`);
  const result = new Map();
  for (const entry of entries) {
    if (!entry || typeof entry.id !== 'string' || !entry.id.trim()) {
      throw new Error(`${label} entries require an ID`);
    }
    if (result.has(entry.id)) throw new Error(`Duplicate ${label} ID: ${entry.id}`);
    result.set(entry.id, entry);
  }
  return result;
}

function ids(values, label) {
  if (!Array.isArray(values) || values.some(value => typeof value !== 'string' || !value.trim()) ||
      new Set(values).size !== values.length) {
    throw new Error(`${label} must contain unique nonempty strings`);
  }
  return values;
}

function overlaps(a, b) {
  const left = withoutTrailingSlashes(a);
  const right = withoutTrailingSlashes(b);
  return a === '*' || b === '*' || left === right ||
    left.startsWith(`${right}/`) || right.startsWith(`${left}/`);
}

function withoutTrailingSlashes(value) {
  let end = value.length;
  while (end > 0 && value[end - 1] === '/') end--;
  return value.slice(0, end);
}

function conflicts(a, b) {
  return a.resources.write.some(key =>
    [...b.resources.read, ...b.resources.write].some(other => overlaps(key, other))) ||
    b.resources.write.some(key => a.resources.read.some(other => overlaps(key, other)));
}

/**
 * Derive the scheduling fields (agent, dispatch_tool) from the JSON `transport` of a
 * contract task. A retained thread is an exclusive resource: never two concurrent
 * mutations of the same conversation. Legacy tasks without `transport` pass through.
 */
function normalizeJob(task) {
  const transport = task.transport;
  if (transport === undefined) return task;
  if (!transport || typeof transport !== 'object' || Array.isArray(transport)) {
    throw new TypeError(`Invalid transport: ${task.id}`);
  }
  const result = { ...task };
  if (transport.kind === 'agent' || transport.kind === 'thread') {
    result.agent = transport.agent;
    result.dispatch_tool = transport.dispatch_tool;
    if (transport.kind === 'thread' && typeof transport.thread_id === 'string' &&
        Array.isArray(task.resources?.write)) {
      result.resources = { ...task.resources, write: [...task.resources.write, `thread/${transport.thread_id}`] };
    }
  } else if (transport.kind === 'mcp' || transport.kind === 'direct') {
    if (!Array.isArray(task.tools) || !task.tools.includes(transport.tool)) {
      throw new Error(`Transport tool must be listed in tools: ${task.id}`);
    }
    result.agent = null;
    result.dispatch_tool = undefined;
  } else {
    throw new Error(`Unknown transport kind: ${task.id}`);
  }
  return result;
}

function validateJob(task, tasks) {
  ids(task.depends_on, 'depends_on');
  ids(task.tools, 'task tools');
  if (!taskStates.has(task.state)) throw new Error(`Invalid task state: ${task.id}`);
  if (task.agent !== null && (typeof task.agent !== 'string' || !task.agent.trim())) {
    throw new TypeError(`Task requires an agent ID or null: ${task.id}`);
  }
  for (const key of ['read', 'write']) {
    ids(task.resources?.[key], `resources.${key}`);
    if (task.resources[key].some(resource =>
      resource.includes('\\') || resource.split('/').some(part => part === '.' || part === '..'))) {
      throw new Error(`Resources must be normalized: ${task.id}`);
    }
  }
  if (task.depends_on.some(id => !tasks.has(id))) throw new Error(`Unknown dependency: ${task.id}`);
}

function orderJobs(work) {
  const byId = new Map(work.map(task => [task.id, task]));
  const visiting = new Set();
  const visited = new Set();
  const ordered = [];
  function visit(task) {
    if (visiting.has(task.id)) throw new Error('Dependency cycle');
    if (visited.has(task.id)) return;
    visiting.add(task.id);
    task.depends_on.forEach(id => visit(byId.get(id)));
    visiting.delete(task.id);
    visited.add(task.id);
    ordered.push(task);
  }
  work.forEach(visit);
  return ordered;
}

function toolBlocker(task, agents, tools, self) {
  let registry = tools;
  if (task.agent !== null) {
    const agent = agents.get(task.agent);
    const dispatch = tools.get(task.dispatch_tool);
    if (!agent || task.agent === self || agent.scope === 'general_orchestration') {
      return 'unavailable_worker';
    }
    if (agent.tools_complete !== true) return 'unknown_worker_tools';
    if (dispatch?.scope !== 'delegation' || dispatch.authorized !== true) {
      return 'unavailable_dispatch_tool';
    }
    registry = inventory(agent.tools, `worker ${task.agent} tool`);
  }
  if (task.tools.some(id => registry.get(id)?.authorized !== true)) {
    return 'unavailable_or_unauthorized_tool';
  }
  return null;
}

function prerequisiteRejected(task, blocked) {
  return ['partial', 'blocked', 'error'].includes(task.state) ||
    (task.state === 'ok' && task.acceptance_verified !== true) ||
    blocked.some(item => item.id === task.id);
}

function classifyJob(task, context) {
  if (task.state === 'running' || (task.state === 'ok' && task.acceptance_verified === true)) {
    return { kind: 'ignore' };
  }
  if (task.state !== 'pending') {
    return { kind: 'blocked', reason: task.state === 'ok' ? 'acceptance_unverified' : task.state };
  }
  const reason = toolBlocker(task, context.agents, context.tools, context.self);
  if (reason) return { kind: 'blocked', reason };
  const dependencies = task.depends_on.map(id => context.byId.get(id));
  if (dependencies.some(dep => prerequisiteRejected(dep, context.blocked))) {
    return { kind: 'blocked', reason: 'prerequisite_not_accepted' };
  }
  if (dependencies.some(dep => dep.state !== 'ok')) {
    return { kind: 'waiting', reason: 'dependencies_pending' };
  }
  if (context.running.length + context.launch.length >= context.limit) {
    return { kind: 'waiting', reason: 'concurrency_limit' };
  }
  if ([...context.running, ...context.launch].some(other => conflicts(task, other))) {
    return { kind: 'waiting', reason: 'resource_conflict' };
  }
  return { kind: 'launch' };
}

function batchStatus(launch, running, waiting, blocked) {
  if (launch.length) return 'ready';
  if (running.length) return 'waiting';
  if (blocked.length) return 'blocked';
  if (waiting.length) return 'waiting';
  return 'complete';
}

function batchMode(launch, running) {
  if (!launch.length) return 'none';
  return launch.length > 1 || running.length ? 'parallel' : 'sequential';
}

/**
 * Who executes each launched task.
 * - lead / direct: AI-KIDO dispatches with its own tools.
 * - collaborate: the native orchestrator stays in charge and receives the JSON plan
 *   (guide + delegate). AI-KIDO executes direct tool calls itself and TAKES OVER a parallel
 *   batch only when the native one is verified unable to parallelize while AI-KIDO verifiably can.
 *   Unknown native capability never triggers a takeover (fail closed).
 */
function assignExecutors(launch, running, gate, supportsParallel) {
  const parallel = launch.length > 1 || (launch.length > 0 && running.length > 0);
  const nativeParallel = gate.native_orchestrator?.supports_parallel ?? null;
  return launch.map(task => {
    if (gate.coordination !== 'collaborate') return { id: task.id, executor: 'aikido', reason: 'own_dispatch' };
    if (task.agent === null) return { id: task.id, executor: 'aikido', reason: 'direct_tool' };
    if (parallel && nativeParallel === false && supportsParallel) {
      return { id: task.id, executor: 'aikido', reason: 'takeover_parallel' };
    }
    return { id: task.id, executor: 'native',
      reason: parallel && nativeParallel !== true ? 'native_parallel_unverified' : 'native_delegation' };
  });
}

export function nextBatch(snapshot, plan, config = policy) {
  const gate = activation(snapshot, config);
  if (typeof snapshot.supports_parallel !== 'boolean' && gate.coordination !== 'direct') {
    throw new TypeError('supports_parallel must be a verified boolean');
  }
  const supportsParallel = snapshot.supports_parallel === true && gate.coordination !== 'direct';
  const agents = inventory(Array.isArray(snapshot.agents) ? snapshot.agents : [], 'agent');
  const tools = inventory(Array.isArray(snapshot.tools) ? snapshot.tools : [], 'tool');
  const tasks = inventory(plan?.tasks, 'task');
  const work = [...tasks.values()].map(task => normalizeJob({ ...task, state: task.state ?? 'pending' }));
  work.forEach(task => validateJob(task, tasks));
  const ordered = orderJobs(work);
  const byId = new Map(work.map(task => [task.id, task]));
  const running = work.filter(task => task.state === 'running');
  const launch = [];
  const waiting = [];
  const blocked = [];
  const limit = supportsParallel
    ? integer(config.limits.max_parallel_tasks, 'max_parallel_tasks', 1) : 1;
  const context = { agents, tools, byId, running, launch, blocked, limit, self: config.activation.self };
  for (const task of ordered) {
    const decision = classifyJob(task, context);
    if (decision.kind === 'launch') launch.push(task);
    if (decision.kind === 'waiting') waiting.push({ id: task.id, reason: decision.reason });
    if (decision.kind === 'blocked') blocked.push({ id: task.id, reason: decision.reason });
  }
  return {
    status: batchStatus(launch, running, waiting, blocked),
    mode: batchMode(launch, running),
    coordination: gate.coordination,
    launch: launch.map(task => task.id),
    assignments: assignExecutors(launch, running, gate, supportsParallel),
    running: running.map(task => task.id), waiting, blocked
  };
}

// ---------------------------------------------------------------------------
// JSON contract validation (task-request/2 and task-result/1). No dependency, no eval.
// ---------------------------------------------------------------------------

const isObject = value => value !== null && typeof value === 'object' && !Array.isArray(value);
const isText = value => typeof value === 'string' && value.trim() !== '';
const isTextList = value => Array.isArray(value) && value.every(isText) && new Set(value).size === value.length;

function keysCheck(value, required, optional, path, errors) {
  if (!isObject(value)) {
    errors.push(`${path}: must be an object`);
    return false;
  }
  for (const key of required) if (!(key in value)) errors.push(`${path}.${key}: required`);
  const allowed = new Set([...required, ...optional]);
  for (const key of Object.keys(value)) if (!allowed.has(key)) errors.push(`${path}.${key}: unknown key`);
  return true;
}

function transportErrors(transport, path, errors) {
  if (!isObject(transport) || !transportKinds.has(transport.kind)) {
    errors.push(`${path}.kind: must be one of ${[...transportKinds].join('|')}`);
    return;
  }
  const shapes = {
    agent: [['kind', 'dispatch_tool', 'agent'], ['persona']],
    thread: [['kind', 'dispatch_tool', 'agent', 'thread_id'], ['persona']],
    mcp: [['kind', 'server', 'tool', 'arguments'], []],
    direct: [['kind', 'tool', 'arguments'], []]
  };
  const [required, optional] = shapes[transport.kind];
  keysCheck(transport, required, optional, path, errors);
  for (const key of ['dispatch_tool', 'agent', 'server', 'tool']) {
    if (key in transport && !isText(transport[key])) errors.push(`${path}.${key}: nonempty string`);
  }
  if ('arguments' in transport && !isObject(transport.arguments)) errors.push(`${path}.arguments: object`);
  if ('thread_id' in transport && transport.thread_id !== null && !isText(transport.thread_id)) {
    errors.push(`${path}.thread_id: null (new thread) or nonempty string (follow-up)`);
  }
}

function taskErrors(task, path, errors) {
  const required = ['id', 'depends_on', 'transport', 'tools', 'resources', 'state', 'acceptance', 'return'];
  const optional = ['persona', 'skills', 'acceptance_verified', 'reason', 'route', 'context', 'executor'];
  if (!keysCheck(task, required, optional, path, errors)) return;
  if ('id' in task && !isText(task.id)) errors.push(`${path}.id: nonempty string`);
  for (const key of ['depends_on', 'tools', 'acceptance']) {
    if (key in task && !isTextList(task[key])) errors.push(`${path}.${key}: unique nonempty strings`);
  }
  if (Array.isArray(task.acceptance) && task.acceptance.length === 0) errors.push(`${path}.acceptance: at least one check`);
  if ('skills' in task && !isTextList(task.skills)) errors.push(`${path}.skills: unique nonempty strings`);
  if ('state' in task && !taskStates.has(task.state)) errors.push(`${path}.state: invalid`);
  if ('return' in task && task.return !== RESULT_CONTRACT) errors.push(`${path}.return: must be "${RESULT_CONTRACT}"`);
  if ('executor' in task && task.executor !== null && !executors.has(task.executor)) {
    errors.push(`${path}.executor: aikido|native|null`);
  }
  if ('acceptance_verified' in task && typeof task.acceptance_verified !== 'boolean') {
    errors.push(`${path}.acceptance_verified: boolean`);
  }
  if ('persona' in task && task.persona !== null && !isText(task.persona)) errors.push(`${path}.persona: string|null`);
  if (keysCheck(task.resources, ['read', 'write'], [], `${path}.resources`, errors)) {
    for (const key of ['read', 'write']) {
      if (key in task.resources && !isTextList(task.resources[key])) {
        errors.push(`${path}.resources.${key}: unique nonempty strings`);
      }
    }
  }
  transportErrors(task.transport, `${path}.transport`, errors);
  if (isObject(task.transport) && ['mcp', 'direct'].includes(task.transport.kind) &&
      Array.isArray(task.tools) && !task.tools.includes(task.transport.tool)) {
    errors.push(`${path}.tools: must list transport.tool "${task.transport.tool}"`);
  }
}

export function validateRequest(request) {
  const errors = [];
  const required = ['version', 'request_id', 'caller', 'coordination', 'objective', 'constraints', 'tasks'];
  if (!keysCheck(request, required, [], 'request', errors)) return { valid: false, errors };
  if (request.version !== 2) errors.push('request.version: must be 2');
  if (!isText(request.request_id)) errors.push('request.request_id: nonempty string');
  if (!isText(request.objective)) errors.push('request.objective: nonempty string');
  if (!coordinations.has(request.coordination)) errors.push('request.coordination: lead|collaborate|direct');
  if (!Array.isArray(request.constraints) || !request.constraints.every(isText)) {
    errors.push('request.constraints: array of nonempty strings');
  }
  if (keysCheck(request.caller, ['agent', 'return_mode'], [], 'request.caller', errors)) {
    if (!isText(request.caller.agent)) errors.push('request.caller.agent: nonempty string');
    if (request.caller.return_mode !== null && !isText(request.caller.return_mode)) {
      errors.push('request.caller.return_mode: string|null');
    }
  }
  if (!Array.isArray(request.tasks) || request.tasks.length === 0) {
    errors.push('request.tasks: nonempty array');
  } else {
    request.tasks.forEach((task, index) => taskErrors(task, `request.tasks[${index}]`, errors));
    const seen = new Set();
    for (const task of request.tasks) {
      if (isText(task?.id) && seen.has(task.id)) errors.push(`request.tasks: duplicate id ${task.id}`);
      seen.add(task?.id);
    }
    for (const task of request.tasks) {
      for (const dep of Array.isArray(task?.depends_on) ? task.depends_on : []) {
        if (!seen.has(dep)) errors.push(`request.tasks.${task.id}.depends_on: unknown ${dep}`);
        if (dep === task.id) errors.push(`request.tasks.${task.id}.depends_on: self dependency`);
      }
    }
  }
  return { valid: errors.length === 0, errors };
}

/**
 * Validate one worker/native/coordinator result against `task-result/1`.
 * `request` (optional) binds the result to a known task and its transport.
 */
export function validateResult(result, request = null, config = policy) {
  const errors = [];
  const required = ['id', 'status', 'summary', 'artifacts', 'errors', 'next'];
  if (!keysCheck(result, required, ['thread_id', 'usage'], 'result', errors)) return { valid: false, errors };
  if ('usage' in result && keysCheck(result.usage, ['input_tokens', 'output_tokens'], ['cost_usd', 'model'], 'result.usage', errors)) {
    for (const key of ['input_tokens', 'output_tokens']) {
      if (!Number.isSafeInteger(result.usage[key]) || result.usage[key] < 0) {
        errors.push(`result.usage.${key}: non-negative integer`);
      }
    }
    if ('cost_usd' in result.usage && (!Number.isFinite(result.usage.cost_usd) || result.usage.cost_usd < 0)) {
      errors.push('result.usage.cost_usd: number >= 0');
    }
    if ('model' in result.usage && !isText(result.usage.model)) errors.push('result.usage.model: nonempty string');
  }
  if (!isText(result.id)) errors.push('result.id: nonempty string');
  if (!resultStatuses.has(result.status)) errors.push('result.status: ok|partial|blocked|error');
  if (typeof result.summary !== 'string') errors.push('result.summary: string');
  else if (result.summary.length > config.limits.result_summary_chars) {
    errors.push(`result.summary: at most ${config.limits.result_summary_chars} characters`);
  }
  if (!Array.isArray(result.artifacts) || result.artifacts.some(item =>
    !keysCheck(item, ['type', 'ref'], [], 'result.artifacts[]', errors) || !isText(item.type) || !isText(item.ref))) {
    errors.push('result.artifacts: array of {type, ref}');
  }
  if (!Array.isArray(result.errors) || result.errors.some(item =>
    !keysCheck(item, ['code', 'message'], [], 'result.errors[]', errors) || !isText(item.code) || typeof item.message !== 'string')) {
    errors.push('result.errors: array of {code, message}');
  } else if (result.status === 'ok' && result.errors.length) {
    errors.push('result.status: ok cannot carry errors');
  } else if (['blocked', 'error'].includes(result.status) && result.errors.length === 0) {
    errors.push(`result.errors: ${result.status} requires at least one error`);
  }
  if (!Array.isArray(result.next) || !result.next.every(isText)) errors.push('result.next: array of nonempty strings');
  if ('thread_id' in result && result.thread_id !== null && !isText(result.thread_id)) {
    errors.push('result.thread_id: string|null');
  }
  if (request && isText(result.id)) {
    const task = request.tasks?.find(item => item.id === result.id);
    if (!task) errors.push(`result.id: unknown task ${result.id}`);
    else if (task.transport?.kind === 'thread' && result.status !== 'blocked' && !isText(result.thread_id)) {
      errors.push('result.thread_id: required for a thread transport (reuse it for follow-ups)');
    }
  }
  return { valid: errors.length === 0, errors };
}

/** Parse a raw text reply; never evaluates it. */
export function parseResult(text, request = null, config = policy) {
  let value;
  try {
    value = JSON.parse(text);
  } catch (error) {
    return { valid: false, errors: [`result: not valid JSON (${error.message})`] };
  }
  return validateResult(value, request, config);
}

// ---------------------------------------------------------------------------
// Price source: a VOLATILE reference table (model, score, input/output price per million tokens).
// It is only a template to price models the agent discovers itself in the live context and Tools.
// It never creates a route, never authorizes a model and never replaces a price the host reports.
// ---------------------------------------------------------------------------

const nameTokens = value => String(value).toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim()
  .split(' ').filter(Boolean);

function csvCells(line) {
  const cells = [];
  let cell = '';
  let quoted = false;
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (quoted) {
      if (char !== '"') cell += char;
      else if (line[i + 1] === '"') { cell += '"'; i++; } else quoted = false;
    } else if (char === '"') quoted = true;
    else if (char === ',') { cells.push(cell.trim()); cell = ''; } else cell += char;
  }
  cells.push(cell.trim());
  return cells;
}

/** Parse the CSV text (BOM tolerated, FR or EN header, `$` prices). Never evaluates anything. */
export function parsePriceSource(text) {
  if (typeof text !== 'string') throw new TypeError('Price source must be text');
  const lines = text.replace(/^\uFEFF/, '').split(/\r?\n/).filter(line => line.trim());
  if (lines.length < 2) throw new Error('Price source needs a header and at least one row');
  const header = csvCells(lines[0]);
  const column = (pattern, label) => {
    const index = header.findIndex(cell => pattern.test(cell));
    if (index === -1) throw new Error(`Price source has no ${label} column`);
    return index;
  };
  const at = {
    model: column(/model|mod[eè]le/i, 'model'), score: column(/score/i, 'score'),
    input: column(/entr|input/i, 'input price'), output: column(/sortie|output/i, 'output price')
  };
  return lines.slice(1).map((line, offset) => {
    const cells = csvCells(line);
    const label = `Price source line ${offset + 2}`;
    const price = (index, name) => {
      const value = Number(String(cells[index] ?? '').replace(/[$\s]/g, ''));
      if (!Number.isFinite(value) || value < 0) throw new Error(`${label}: invalid ${name}`);
      return value;
    };
    const name = cells[at.model];
    if (!name) throw new Error(`${label}: missing model name`);
    return { name, tokens: nameTokens(name), score: price(at.score, 'score'),
      input_per_million: price(at.input, 'input price'), output_per_million: price(at.output, 'output price') };
  });
}

/**
 * Match a model ID discovered in the host (any vendor prefix/suffix) to a source row.
 * Token-based, longest match wins; "5.1" never matches "5"; ties with different prices are
 * ambiguous and left unmatched rather than guessed.
 */
export function findSourceRow(modelId, rows) {
  const wanted = nameTokens(modelId);
  let best = [];
  for (const row of rows) {
    const key = row.tokens;
    // Leading tokens (vendor/connection prefix) are free. Trailing tokens may only be a snapshot
    // suffix (date, latest, preview): "Flash Lite" or "5.5" must never inherit the price of "Flash"/"5".
    const found = key.length > 0 && wanted.some((_, start) => {
      if (start + key.length > wanted.length || !key.every((token, i) => wanted[start + i] === token)) return false;
      return wanted.slice(start + key.length).every(token => /^(\d{3,}|latest|preview)$/.test(token));
    });
    if (!found) continue;
    if (!best.length || key.length > best[0].tokens.length) best = [row];
    else if (key.length === best[0].tokens.length) best.push(row);
  }
  if (!best.length) return { row: null, reason: 'not_in_source' };
  const [row] = best;
  if (best.some(other => other.input_per_million !== row.input_per_million ||
      other.output_per_million !== row.output_per_million || other.score !== row.score)) {
    return { row: null, reason: 'ambiguous_source_match' };
  }
  return { row, match: row.tokens.length === wanted.length ? 'exact' : 'partial' };
}

function scoreToQuality(score, mapping) {
  const levels = [...mapping].sort((a, b) => b.min_score - a.min_score);
  return levels.find(level => score >= level.min_score)?.quality ?? 1;
}

function sourceAge(source, now) {
  if (!source?.date) return { age_days: null, stale: true };
  const age = (now.getTime() - Date.parse(source.date)) / 86_400_000;
  if (!Number.isFinite(age)) return { age_days: null, stale: true };
  return { age_days: Math.floor(age), stale: age > number(source.max_age_days ?? 0, 'max_age_days') };
}

/**
 * Turn models DISCOVERED in the live context ([{model, connection, authorized, context_tokens, mode?}])
 * into catalog rows priced from the source. Rows are flagged `estimate: true` and carry no
 * statistics; unmatched models are reported, never invented.
 */
export function deriveCatalog(discovered, rows, config = policy, now = new Date()) {
  if (!Array.isArray(discovered)) throw new Error('discovered_models must be an array');
  const source = config.routing.price_sources?.[0] ?? null;
  const mapping = config.routing.score_to_quality ?? [];
  const models = [];
  const unmatched = [];
  const seen = new Set();
  for (const entry of discovered) {
    const id = routeId(entry);
    if (seen.has(id)) throw new Error('Duplicate discovered model/connection');
    seen.add(id);
    // `source_name`: the agent deduced the closest source row itself (e.g. same family and tier);
    // it must name an existing row, otherwise the model stays unmatched. Never invented here.
    const found = typeof entry.source_name === 'string' && entry.source_name.trim()
      ? (() => {
        const row = rows.find(item => item.name.toLowerCase() === entry.source_name.trim().toLowerCase());
        return row ? { row, match: 'deduced' } : { row: null, reason: 'source_name_unknown' };
      })()
      : findSourceRow(entry.model, rows);
    const skip = reason => unmatched.push({ model: entry.model, connection: entry.connection, reason });
    if (!found.row) skip(found.reason);
    else if (!Number.isSafeInteger(entry.context_tokens) || entry.context_tokens < 1) skip('context_tokens_unknown');
    else {
      models.push({
        model: entry.model, connection: entry.connection, authorized: entry.authorized === true,
        quality: scoreToQuality(found.row.score, mapping), context_tokens: entry.context_tokens,
        input_per_million: found.row.input_per_million, output_per_million: found.row.output_per_million,
        estimate: true, stats: {},
        source: { id: source?.id ?? null, name: found.row.name, match: found.match, score: found.row.score }
      });
    }
  }
  return { models, unmatched,
    source: source ? { id: source.id, date: source.date, volatile: source.volatile === true,
      ...sourceAge(source, now) } : null };
}

function withDerivedCatalog(snapshot, config) {
  if (!Array.isArray(snapshot.discovered_models)) return { snapshot, config, price_catalog: null };
  const now = snapshot.now === undefined ? new Date() : new Date(snapshot.now);
  if (Number.isNaN(now.getTime())) throw new Error('now must be a valid date');
  const file = config.routing.price_sources?.[0]?.file;
  const text = typeof snapshot.price_source_csv === 'string' ? snapshot.price_source_csv
    : file ? readFileSync(new URL(file, import.meta.url), 'utf8') : null;
  if (text === null) throw new Error('No price source configured');
  const derived = deriveCatalog(snapshot.discovered_models, parsePriceSource(text), config, now);
  const measured = new Set(config.routing.models.map(routeId));
  const models = [...config.routing.models, ...derived.models.filter(row => !measured.has(routeId(row)))];
  const routes = snapshot.discovered_models.filter(entry => entry.authorized === true)
    .map(({ model, connection, mode }) => ({ model, connection, ...(mode ? { mode } : {}) }));
  return {
    snapshot: { ...snapshot, available_routes: snapshot.available_routes?.length ? snapshot.available_routes : routes },
    config: { ...config, routing: { ...config.routing, models } },
    price_catalog: { source: derived.source,
      matched: derived.models.map(row => ({ model: row.model, connection: row.connection, quality: row.quality,
        source_name: row.source.name, match: row.source.match })),
      unmatched: derived.unmatched }
  };
}

export function evaluate(snapshot, config = policy) {
  const gate = activation(snapshot, config);
  const routed = withDerivedCatalog(snapshot, config);
  return {
    ...gate,
    ...(routed.price_catalog ? { price_catalog: routed.price_catalog } : {}),
    ...(snapshot.task ? { route: selectRoute(routed.snapshot, snapshot.task, routed.config) } : {}),
    ...(snapshot.plan ? { schedule: nextBatch(snapshot, snapshot.plan, config) } : {}),
    ...(snapshot.request ? { request_validation: validateRequest(snapshot.request) } : {}),
    ...(Array.isArray(snapshot.results) ? {
      result_validation: snapshot.results.map(result => validateResult(result, snapshot.request ?? null, config))
    } : {})
  };
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try {
    const snapshot = JSON.parse(readFileSync(0, 'utf8'));
    process.stdout.write(`${JSON.stringify(evaluate(snapshot))}\n`);
  } catch (error) {
    process.stderr.write(`${JSON.stringify({ status: 'error', error: error.message })}\n`);
    process.exitCode = 1;
  }
}
