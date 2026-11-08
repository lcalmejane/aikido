const taskStates = new Set(['pending', 'running', 'ok', 'partial', 'blocked', 'error']);
const resultStatuses = new Set(['ok', 'partial', 'blocked', 'error']);
const coordinations = new Set(['lead', 'collaborate', 'direct']);
const executors = new Set(['aikido', 'native']);
const transportKinds = new Set(['agent', 'thread', 'mcp', 'direct']);
const RESULT_CONTRACT = 'task-result/1';
const defaultConfig = { limits: { result_summary_chars: 2000 } };

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
  if ('persona' in transport && transport.persona !== null && !isText(transport.persona)) {
    errors.push(`${path}.persona: string|null`);
  }
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
  for (const key of ['context', 'route']) {
    if (key in task && !isObject(task[key])) errors.push(`${path}.${key}: object`);
  }
  if ('reason' in task && typeof task.reason !== 'string') errors.push(`${path}.reason: string`);
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
      if (!isObject(task)) continue;
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
export function validateResult(result, request = null, config = defaultConfig) {
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
