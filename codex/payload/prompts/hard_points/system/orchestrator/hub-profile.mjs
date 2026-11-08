const features = ['pool', 'state', 'retain', 'reset', 'peerMessaging', 'parallel', 'cancellation', 'persistence'];
const object = value => value !== null && typeof value === 'object' && !Array.isArray(value);
const text = value => typeof value === 'string' && value.trim() !== '';
const list = value => Array.isArray(value) && value.every(text) && new Set(value).size === value.length;

function shape(value, keys, path, errors) {
  if (!object(value)) { errors.push(`${path}: object required`); return false; }
  for (const key of keys) if (!Object.hasOwn(value, key)) errors.push(`${path}.${key}: required`);
  for (const key of Object.keys(value)) if (!keys.includes(key)) errors.push(`${path}.${key}: unknown key`);
  return true;
}

export function validateHubProfile(profile, projectId) {
  const errors = [];
  if (!shape(profile, ['version', 'id', 'kind', 'contracts', 'capabilities', 'limits', 'tools', 'scope'], 'hub', errors)) {
    return { valid: false, errors };
  }
  if (profile.version !== 1) errors.push('hub.version: must be 1');
  if (!text(profile.id)) errors.push('hub.id: nonempty string');
  if (!['core', 'local', 'external'].includes(profile.kind)) errors.push('hub.kind: core|local|external');
  const contracts = Array.isArray(profile.contracts) ? profile.contracts : [];
  const toolIds = Array.isArray(profile.tools) ? profile.tools : [];
  if (!list(profile.contracts) || !contracts.includes('ai-hub/1')) errors.push('hub.contracts: ai-hub/1 required');
  if (!list(profile.tools)) errors.push('hub.tools: unique nonempty strings');
  if (shape(profile.scope, ['projectId'], 'hub.scope', errors)) {
    if (!text(profile.scope.projectId)) errors.push('hub.scope.projectId: nonempty string');
    if (projectId !== undefined && profile.scope.projectId !== projectId) errors.push('hub.scope.projectId: wrong project');
  }
  if (shape(profile.limits, ['maxWorkers', 'maxParallel'], 'hub.limits', errors)) {
    for (const key of ['maxWorkers', 'maxParallel']) {
      if (!Number.isSafeInteger(profile.limits[key]) || profile.limits[key] < 1 || profile.limits[key] > 100) {
        errors.push(`hub.limits.${key}: integer 1..100`);
      }
    }
    if (profile.limits.maxParallel > profile.limits.maxWorkers) errors.push('hub.limits: parallel exceeds workers');
  }
  if (shape(profile.capabilities, features, 'hub.capabilities', errors)) {
    for (const key of features) {
      if (typeof profile.capabilities[key] !== 'boolean') errors.push(`hub.capabilities.${key}: boolean required`);
    }
    const caps = profile.capabilities;
    if (!caps.pool && features.slice(1).some(key => caps[key] === true)) errors.push('hub.capabilities: worker features require pool');
    if (caps.parallel && !(profile.limits?.maxParallel > 1)) errors.push('hub.capabilities.parallel: concurrency must exceed 1');
    if (!caps.parallel && profile.limits?.maxParallel !== 1) errors.push('hub.limits.maxParallel: disabled parallel requires 1');
    if (caps.pool && !['task-request/2', 'task-result/1'].every(id => contracts.includes(id))) {
      errors.push('hub.contracts: pool requires task-request/2 and task-result/1');
    }
    const requiredTools = {
      pool: ['agent_pool_spawn', 'agent_pool_status', 'agent_pool_wait', 'agent_pool_accept'],
      state: ['agent_pool_status'],
      retain: ['agent_pool_resume'],
      reset: ['agent_pool_reset'],
      peerMessaging: ['agent_pool_send', 'agent_pool_receive'],
      cancellation: ['agent_pool_close'],
    };
    for (const [capability, tools] of Object.entries(requiredTools)) {
      if (caps[capability] === true && !tools.every(id => toolIds.includes(id))) {
        errors.push(`hub.capabilities.${capability}: corresponding tools absent`);
      }
    }
    if (caps.retain && !caps.state || caps.reset && !caps.state || caps.persistence && !caps.state) {
      errors.push('hub.capabilities: retain/reset/persistence require state');
    }
  }
  return { valid: errors.length === 0, errors };
}

export function negotiateHubProfile(profile, { projectId, supported, authorizedTools } = {}) {
  const checked = validateHubProfile(profile, projectId);
  if (!checked.valid) throw new Error(`Invalid AI Hub profile: ${checked.errors.join('; ')}`);
  const tools = profile.tools.filter(id => authorizedTools?.includes(id));
  const capabilities = Object.fromEntries(features.map(key => [key, profile.capabilities[key] && supported?.[key] === true]));
  const bindings = {
    pool: ['agent_pool_spawn', 'agent_pool_status', 'agent_pool_wait', 'agent_pool_accept'],
    state: ['agent_pool_status'], retain: ['agent_pool_resume'], reset: ['agent_pool_reset'],
    peerMessaging: ['agent_pool_send', 'agent_pool_receive'], cancellation: ['agent_pool_close'],
  };
  for (const [key, required] of Object.entries(bindings)) {
    capabilities[key] &&= required.every(id => tools.includes(id));
  }
  for (const key of features.slice(1)) capabilities[key] &&= capabilities.pool;
  for (const key of ['retain', 'reset', 'persistence']) capabilities[key] &&= capabilities.state;
  const enabledBindings = new Set(Object.entries(bindings).flatMap(([key, ids]) => capabilities[key] ? ids : []));
  const allBindings = new Set(Object.values(bindings).flat());
  return { capabilities, tools: tools.filter(id => !allBindings.has(id) || enabledBindings.has(id)), limits: {
    maxWorkers: profile.limits.maxWorkers,
    maxParallel: capabilities.parallel ? profile.limits.maxParallel : 1,
  } };
}
