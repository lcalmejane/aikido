// workflow/2: schema, validation, step graph, `.workflow.md` rendering and reading, Mermaid subset parsing, patches and
// structural diff. No runtime dependency: every host (CLI, Core Agent, tatami-agent) uses this single code.
import { createHash } from 'node:crypto';

export const WORKFLOW_SCHEMA = 'workflow/2';
export const STATE_TYPES = Object.freeze(['task', 'choice', 'parallel', 'wait', 'approval', 'terminal']);
export const TASK_STAGES = Object.freeze(['plan', 'dispatch', 'verify']);
export const HOOK_PHASES = Object.freeze(['beforeTransition', 'onExit', 'onEnter', 'onTaskStart', 'onTaskResult', 'afterTransition', 'executionEvent']);
export const POOL_EVENT_TYPES = Object.freeze(['spawn', 'start', 'result', 'reset', 'close', 'peer-message']);
export const WORKFLOW_LIMITS = Object.freeze(['maxChildrenPerCause', 'maxCommandsPerCause', 'maxHookDepth', 'maxAttempts', 'maxParallel']);
const PUBLICATIONS = ['draft', 'testing', 'published'];
const OUTCOMES = ['success', 'failure', 'cancelled'];
const CAPABILITY_MODES = ['auto', 'inherit', 'list'];
const ID = /^[A-Za-z0-9][A-Za-z0-9._-]{0,127}$/;
const HASH = /^[a-f0-9]{64}$/;
const VERSION = /^\d+\.\d+\.\d+$/;
const MAX_STATES = 200;

const isObject = value => !!value && typeof value === 'object' && !Array.isArray(value);
const isText = value => typeof value === 'string' && value.trim().length > 0;
const isLabel = value => isText(value) || (isObject(value) && Object.keys(value).length > 0 && Object.values(value).every(isText));
const isTextList = value => Array.isArray(value) && value.every(isText);

/** Display text of a label (string or { lang: text }), English first, then the first language written. */
export function labelText(label, lang = 'en') {
  if (typeof label === 'string') return label;
  if (isObject(label)) return label[lang] ?? label.en ?? Object.values(label)[0] ?? '';
  return '';
}

/** Outgoing targets of a state, in rendering order. Parallel branches are listed in `branchTargets`. */
export function stateTargets(state) {
  if (!isObject(state)) return [];
  if (state.type === 'choice') {
    return [...(state.branches ?? []).map(branch => branch?.to), ...(state.decide?.options ?? []).map(option => option?.to),
      ...(state.otherwise ? [state.otherwise] : [])].filter(Boolean);
  }
  if (state.type === 'terminal') return [];
  return state.next ? [state.next] : [];
}
const branchTargets = state => state?.type === 'parallel' && Array.isArray(state.branches) ? state.branches.flat().filter(isText) : [];

/** Normalised graph used by the Task Store: entry, terminals and targets per state. */
export function workflowGraph(definition) {
  const states = new Map((definition?.states ?? []).filter(isObject).map(state => [state.id, state]));
  return {
    entry: definition?.entry,
    terminals: [...states.values()].filter(state => state.type === 'terminal').map(state => state.id),
    states,
    targets: id => stateTargets(states.get(id)),
  };
}

/** States of a strictly linear workflow (task, wait or approval chain ending on one terminal), or undefined. */
export function linearStates(definition) {
  const { entry, states } = workflowGraph(definition);
  const ordered = [];
  for (let state = states.get(entry); state; state = states.get(state.next)) {
    if (ordered.includes(state) || !['task', 'wait', 'approval', 'terminal'].includes(state.type)) return undefined;
    ordered.push(state);
    if (state.type === 'terminal') break;
  }
  return ordered.length === states.size && ordered.at(-1)?.type === 'terminal' ? ordered : undefined;
}

/**
 * Hooks run by the Task Store host, identified by hash: workflow-level hooks by phase and event, plus state `pre`
 * (onEnter) and `post` (onExit) hooks carrying a `sha256`. Returned in the host shape { id, version, sha256, phase, stepId?, eventTypes? }.
 */
export function hostHooks(definition) {
  const hooks = (definition?.hooks ?? []).map(({ state, ...hook }) => ({ ...hook, ...(state ? { stepId: state } : {}) }));
  for (const state of definition?.states ?? []) {
    for (const [slot, phase] of [['pre', 'onEnter'], ['post', 'onExit']]) {
      for (const hook of state?.hooks?.[slot] ?? []) {
        if (hook?.sha256) hooks.push({ id: hook.id, version: hook.version, sha256: hook.sha256, phase, stepId: state.id });
      }
    }
  }
  return hooks;
}

function validHostHook(hook) {
  return isObject(hook) && typeof hook.id === 'string' && ID.test(hook.id)
    && typeof hook.version === 'string' && hook.version.length > 0 && hook.version.length <= 64
    && HASH.test(hook.sha256 ?? '') && HOOK_PHASES.includes(hook.phase)
    && (hook.state === undefined || (typeof hook.state === 'string' && ID.test(hook.state)))
    && (hook.eventTypes === undefined || (Array.isArray(hook.eventTypes) && hook.eventTypes.length > 0
      && hook.eventTypes.every(type => POOL_EVENT_TYPES.includes(type))));
}

function validateCondition(when, where, error) {
  if (!isObject(when)) return error(`${where}: when must be an object`);
  if (when.attemptsBelow !== undefined) {
    if (!Number.isInteger(when.attemptsBelow) || when.attemptsBelow < 1 || when.attemptsBelow > 10000) error(`${where}: attemptsBelow must be an integer from 1 to 10000`);
    return;
  }
  if (!isText(when.path)) return error(`${where}: when needs a path or attemptsBelow`);
  const tests = ['equals', 'notEquals', 'in', 'exists'].filter(name => when[name] !== undefined);
  if (tests.length !== 1) error(`${where}: when needs exactly one of equals, notEquals, in, exists`);
  if (when.in !== undefined && !Array.isArray(when.in)) error(`${where}: in must be an array`);
  if (when.exists !== undefined && typeof when.exists !== 'boolean') error(`${where}: exists must be a boolean`);
}

function validateCapabilities(state, where, error) {
  if (state.mcp !== undefined) {
    if (!isObject(state.mcp) || !CAPABILITY_MODES.includes(state.mcp.mode)) error(`${where}: mcp.mode must be auto, inherit or list`);
    else if (state.mcp.mode === 'list' && !(isTextList(state.mcp.servers) && state.mcp.servers.length)) error(`${where}: mcp list needs servers`);
    else if (state.mcp.mode !== 'list' && state.mcp.servers !== undefined) error(`${where}: mcp servers are only for list mode`);
  }
  for (const name of ['tools', 'skills']) {
    const value = state[name];
    if (value !== undefined && value !== 'auto' && value !== 'inherit' && !isTextList(value)) error(`${where}: ${name} must be auto, inherit or a list of names`);
  }
}

function validateStateHooks(state, where, ids, error) {
  if (state.hooks === undefined) return;
  if (!isObject(state.hooks) || Object.keys(state.hooks).some(key => key !== 'pre' && key !== 'post')) return error(`${where}: hooks only accept pre and post`);
  for (const slot of ['pre', 'post']) {
    const list = state.hooks[slot] ?? [];
    if (!Array.isArray(list)) { error(`${where}: hooks.${slot} must be an array`); continue; }
    for (const hook of list) {
      const at = `${where}: hook ${hook?.id ?? '?'}`;
      if (!isObject(hook) || typeof hook.id !== 'string' || !ID.test(hook.id)) { error(`${where}: every hook needs a safe id`); continue; }
      const scripted = isText(hook.script);
      if (!scripted && !(isText(hook.agent) && isText(hook.prompt))) error(`${at} needs a script, or an agent and a prompt`);
      if (hook.sha256 !== undefined && !(HASH.test(hook.sha256) && isText(hook.version) && hook.version.length <= 64)) error(`${at}: a hashed hook needs sha256 and version`);
      const onFailure = hook.onFailure ?? 'block';
      if (!['block', 'continue'].includes(onFailure) && !(typeof onFailure === 'string' && onFailure.startsWith('goto:') && ids.has(onFailure.slice(5)))) {
        error(`${at}: onFailure must be block, continue or goto:<existing state>`);
      }
    }
  }
}

function validateState(state, ids, branchOwners, error) {
  const where = state.id;
  const needNext = () => { if (!isText(state.next)) error(`${where}: next is required`); else if (!ids.has(state.next)) error(`${where}: next targets unknown state ${state.next}`); };
  if (state.label !== undefined && !isLabel(state.label)) error(`${where}: label must be text or a { lang: text } map`);
  if (state.mode !== undefined && !['auto', 'manual'].includes(state.mode)) error(`${where}: mode must be auto or manual`);
  if (state.type !== 'task' && state.stage !== undefined) error(`${where}: stage is only for task states`);
  switch (state.type) {
    case 'task':
      needNext();
      if (state.stage !== undefined && !TASK_STAGES.includes(state.stage)) error(`${where}: stage must be plan, dispatch or verify`);
      for (const name of ['agent', 'prompt', 'script']) if (state[name] !== undefined && state[name] !== null && !isText(state[name])) error(`${where}: ${name} must be text`);
      validateCapabilities(state, where, error);
      validateStateHooks(state, where, ids, error);
      if (state.output !== undefined && !(isObject(state.output) && (state.output.schema === undefined || isObject(state.output.schema)))) error(`${where}: output.schema must be an object`);
      break;
    case 'choice': {
      const branches = state.branches ?? [];
      if (!Array.isArray(branches)) { error(`${where}: branches must be an array`); break; }
      branches.forEach((branch, index) => {
        if (!isObject(branch)) return error(`${where}: branch ${index + 1} must be an object`);
        validateCondition(branch.when, `${where} branch ${index + 1}`, error);
        if (!ids.has(branch.to)) error(`${where}: branch ${index + 1} targets unknown state ${branch.to}`);
      });
      if (state.decide !== undefined) {
        const decide = state.decide;
        if (!isObject(decide) || !isText(decide.agent) || !isText(decide.prompt) || !Array.isArray(decide.options) || decide.options.length < 2) {
          error(`${where}: decide needs an agent, a prompt and at least two options`);
        } else {
          const seen = new Set();
          for (const option of decide.options) {
            if (!isObject(option) || typeof option.id !== 'string' || !ID.test(option.id) || seen.has(option.id)) error(`${where}: every decide option needs a unique safe id`);
            else if (!ids.has(option.to)) error(`${where}: option ${option.id} targets unknown state ${option.to}`);
            seen.add(option?.id);
          }
        }
      }
      if (!branches.length && state.decide === undefined) error(`${where}: a choice needs branches or decide`);
      if (state.otherwise !== undefined && !ids.has(state.otherwise)) error(`${where}: otherwise targets unknown state ${state.otherwise}`);
      if (state.decide === undefined && state.otherwise === undefined) error(`${where}: a deterministic choice needs otherwise`);
      break;
    }
    case 'parallel': {
      needNext();
      const branches = state.branches;
      if (!Array.isArray(branches) || branches.length < 2 || branches.some(branch => !Array.isArray(branch) || !branch.length)) {
        error(`${where}: parallel needs at least two non-empty branches`);
        break;
      }
      for (const id of branches.flat()) {
        if (!ids.has(id)) error(`${where}: branch targets unknown state ${id}`);
        else if (branchOwners.has(id)) error(`${where}: state ${id} already belongs to parallel ${branchOwners.get(id)}`);
        else branchOwners.set(id, where);
        if (id === where) error(`${where}: a parallel cannot contain itself`);
      }
      const join = state.join ?? 'all';
      if (!(join === 'all' || join === 'any' || (Number.isInteger(join) && join >= 1 && join <= branches.length))) error(`${where}: join must be all, any or 1..${branches.length}`);
      break;
    }
    case 'wait':
      needNext();
      if (state.until !== undefined && !isText(state.until) && !isObject(state.until)) error(`${where}: until must be text or an object`);
      break;
    case 'approval':
      needNext();
      if (state.approvers !== undefined && !isTextList(state.approvers)) error(`${where}: approvers must be a list of names`);
      if (state.timeout !== undefined && !isText(state.timeout) && !(Number.isInteger(state.timeout) && state.timeout > 0)) error(`${where}: timeout must be a duration`);
      break;
    case 'terminal':
      if (!OUTCOMES.includes(state.outcome ?? 'success')) error(`${where}: outcome must be success, failure or cancelled`);
      if (state.next !== undefined) error(`${where}: a terminal state has no next`);
      break;
    default:
      error(`${where}: unknown state type ${state.type}`);
  }
}

/** Strongly connected components (Tarjan), to find loops and their exits. */
function components(ids, targets) {
  let index = 0;
  const stack = [], onStack = new Set(), order = new Map(), low = new Map(), result = [];
  const visit = id => {
    order.set(id, index); low.set(id, index); index += 1; stack.push(id); onStack.add(id);
    for (const target of targets(id)) {
      if (!order.has(target)) { visit(target); low.set(id, Math.min(low.get(id), low.get(target))); }
      else if (onStack.has(target)) low.set(id, Math.min(low.get(id), order.get(target)));
    }
    if (low.get(id) === order.get(id)) {
      const group = [];
      let item;
      do { item = stack.pop(); onStack.delete(item); group.push(item); } while (item !== id);
      result.push(group);
    }
  };
  for (const id of ids) if (!order.has(id)) visit(id);
  return result;
}

/**
 * Schema and semantic validation. `resolve` (optional) checks host names: { agent, mcp, skill, script } each
 * returning true when the name exists on the host.
 */
export function validateWorkflow(definition, { resolve } = {}) {
  const errors = [];
  const error = message => { errors.push(message); };
  if (!isObject(definition)) return { valid: false, errors: ['workflow must be an object'] };
  if (definition.schemaVersion !== WORKFLOW_SCHEMA) error(`schemaVersion must be ${WORKFLOW_SCHEMA}`);
  if (typeof definition.id !== 'string' || !ID.test(definition.id)) error('id must be a safe stable identifier');
  if (typeof definition.version !== 'string' || !VERSION.test(definition.version)) error('version must be semantic x.y.z');
  if (definition.publication !== undefined && !PUBLICATIONS.includes(definition.publication)) error('publication must be draft, testing or published');
  if (definition.label !== undefined && !isLabel(definition.label)) error('label must be text or a { lang: text } map');
  if (definition.description !== undefined && typeof definition.description !== 'string') error('description must be text');
  const defaults = definition.defaults ?? {};
  if (!isObject(defaults)) error('defaults must be an object');
  else {
    if (defaults.mode !== undefined && !['auto', 'manual'].includes(defaults.mode)) error('defaults.mode must be auto or manual');
    if (defaults.review !== undefined && !['automated', 'human'].includes(defaults.review)) error('defaults.review must be automated or human');
    if (defaults.capabilities !== undefined && !CAPABILITY_MODES.includes(defaults.capabilities)) error('defaults.capabilities must be auto, inherit or list');
    if (defaults.agent !== undefined && !isText(defaults.agent)) error('defaults.agent must be text');
    if (defaults.retries !== undefined && !(Number.isInteger(defaults.retries) && defaults.retries >= 0 && defaults.retries <= 100)) error('defaults.retries must be an integer from 0 to 100');
  }
  if (definition.inputs !== undefined && !isObject(definition.inputs)) error('inputs must be a JSON schema object');
  const states = Array.isArray(definition.states) ? definition.states : [];
  if (!states.length || states.length > MAX_STATES) error(`states must hold 1 to ${MAX_STATES} states`);
  const ids = new Set();
  for (const state of states) {
    if (!isObject(state) || typeof state.id !== 'string' || !ID.test(state.id)) { error('every state needs a safe stable id'); continue; }
    if (ids.has(state.id)) error(`duplicate state id: ${state.id}`);
    ids.add(state.id);
  }
  const byId = new Map(states.filter(state => isObject(state) && ids.has(state.id)).map(state => [state.id, state]));
  const branchOwners = new Map();
  for (const state of byId.values()) validateState(state, ids, branchOwners, error);
  if (!byId.has(definition.entry)) error('entry must identify a state');
  if (branchOwners.has(definition.entry)) error('entry cannot be inside a parallel branch');
  const targets = id => [...stateTargets(byId.get(id)), ...branchTargets(byId.get(id))].filter(target => byId.has(target));
  const reached = new Set();
  const walk = id => { if (reached.has(id) || !byId.has(id)) return; reached.add(id); for (const target of targets(id)) walk(target); };
  walk(definition.entry);
  for (const id of byId.keys()) if (!reached.has(id)) error(`unreachable state: ${id}`);
  if (![...reached].some(id => byId.get(id).type === 'terminal')) error('entry cannot reach a terminal state');
  const limits = definition.limits ?? {};
  if (!isObject(limits)) error('limits must be an object');
  else {
    for (const name of WORKFLOW_LIMITS) {
      if (limits[name] !== undefined && (!Number.isInteger(limits[name]) || limits[name] < 1 || limits[name] > 10000)) error(`limits.${name} must be an integer from 1 to 10000`);
    }
    if (limits.budgetTokens !== undefined && limits.budgetTokens !== null && !(Number.isInteger(limits.budgetTokens) && limits.budgetTokens > 0)) error('limits.budgetTokens must be null or a positive integer');
  }
  // A loop is bounded by limits.maxAttempts, or by a choice inside it with an exit leaving the loop.
  for (const group of components([...byId.keys()], targets)) {
    const set = new Set(group);
    const looping = group.length > 1 || targets(group[0]).includes(group[0]);
    if (!looping || limits.maxAttempts !== undefined) continue;
    const exit = group.some(id => byId.get(id).type === 'choice' && targets(id).some(target => !set.has(target)));
    if (!exit) error(`unbounded loop through ${group.sort().join(', ')}: add limits.maxAttempts or a choice leaving the loop`);
  }
  if (definition.hooks !== undefined && !Array.isArray(definition.hooks)) error('hooks must be an array');
  for (const hook of Array.isArray(definition.hooks) ? definition.hooks : []) {
    if (!validHostHook(hook)) error('invalid hook reference');
    else if (hook.state !== undefined && !ids.has(hook.state)) error(`hook ${hook.id} targets unknown state ${hook.state}`);
  }
  if (resolve) {
    const check = (kind, name, where) => { if (isText(name) && resolve[kind] && !resolve[kind](name)) error(`${where}: ${kind} ${name} is not available on this host`); };
    check('agent', defaults.agent, 'defaults');
    for (const state of byId.values()) {
      check('agent', state.agent, state.id);
      check('script', state.script, state.id);
      for (const server of state.mcp?.mode === 'list' ? state.mcp.servers : []) check('mcp', server, state.id);
      for (const skill of Array.isArray(state.skills) ? state.skills : []) check('skill', skill, state.id);
      for (const hook of [...(state.hooks?.pre ?? []), ...(state.hooks?.post ?? [])]) { check('agent', hook?.agent, state.id); check('script', hook?.script, state.id); }
      if (state.decide) check('agent', state.decide.agent, state.id);
    }
  }
  return { valid: errors.length === 0, errors };
}

// ---------------------------------------------------------------------------------------------------------------
// Mermaid stateDiagram-v2 subset: states, labelled transitions, <<choice>>, <<fork>>, <<join>>, [*], comments.

const MERMAID_ID = /^[A-Za-z_][A-Za-z0-9_]*$/;
const quote = text => String(text).replace(/["\n\r]/g, ' ').trim();
const conditionText = when => {
  if (!isObject(when)) return '';
  if (when.attemptsBelow !== undefined) return `attempts < ${when.attemptsBelow}`;
  if (when.equals !== undefined) return `${when.path} = ${JSON.stringify(when.equals)}`;
  if (when.notEquals !== undefined) return `${when.path} ≠ ${JSON.stringify(when.notEquals)}`;
  if (when.in !== undefined) return `${when.path} ∈ ${JSON.stringify(when.in)}`;
  if (when.exists !== undefined) return `${when.path} ${when.exists ? 'exists' : 'missing'}`;
  return '';
};
const edgeLabel = text => quote(text).replace(/:/g, '∶');

/** Edges shown on the diagram: { from, to, label } with `[*]` for entry and terminals; fork and join for parallels. */
export function workflowEdges(definition) {
  const edges = [{ from: '[*]', to: definition.entry, label: '' }];
  for (const state of definition.states ?? []) {
    if (state.type === 'terminal') { edges.push({ from: state.id, to: '[*]', label: '' }); continue; }
    if (state.type === 'choice') {
      for (const branch of state.branches ?? []) edges.push({ from: state.id, to: branch.to, label: edgeLabel(branch.label ?? conditionText(branch.when)) });
      for (const option of state.decide?.options ?? []) edges.push({ from: state.id, to: option.to, label: edgeLabel(labelText(option.label) || option.id) });
      if (state.otherwise) edges.push({ from: state.id, to: state.otherwise, label: 'otherwise' });
      continue;
    }
    if (state.type === 'parallel') {
      const join = `${state.id}__join`;
      for (const branch of state.branches ?? []) {
        edges.push({ from: state.id, to: branch[0], label: '' });
        branch.slice(1).forEach((id, index) => edges.push({ from: branch[index], to: id, label: '' }));
        edges.push({ from: branch.at(-1), to: join, label: '' });
      }
      edges.push({ from: join, to: state.next, label: '' });
      continue;
    }
    if (state.next) edges.push({ from: state.id, to: state.next, label: '' });
  }
  return edges;
}

/** Deterministic `stateDiagram-v2` text of a definition. */
export function renderMermaid(definition, { lang = 'en' } = {}) {
  const alias = new Map();
  const used = new Set();
  const name = id => {
    if (id === '[*]') return id;
    if (!alias.has(id)) {
      let base = MERMAID_ID.test(id) ? id : `s_${id.replace(/[^A-Za-z0-9_]/g, '_')}`;
      for (let suffix = 2; used.has(base); suffix += 1) base = `${base}_${suffix}`;
      used.add(base); alias.set(id, base);
    }
    return alias.get(id);
  };
  const lines = ['stateDiagram-v2'];
  for (const state of definition.states ?? []) {
    const node = name(state.id);
    if (node !== state.id) lines.push(`    %% state ${node} = ${state.id}`);
    const label = labelText(state.label, lang);
    if (label && label !== state.id) lines.push(`    state "${quote(label)}" as ${node}`);
    if (state.type === 'choice') lines.push(`    state ${node} <<choice>>`);
    if (state.type === 'parallel') lines.push(`    state ${node} <<fork>>`, `    state ${name(`${state.id}__join`)} <<join>>`);
  }
  for (const edge of workflowEdges(definition)) {
    lines.push(`    ${name(edge.from)} --> ${name(edge.to)}${edge.label ? ` : ${edge.label}` : ''}`);
  }
  return `${lines.join('\n')}\n`;
}

const fail = (code, message, details) => { throw Object.assign(new Error(message), { code, ...(details ? { details } : {}) }); };

/**
 * Parses the supported `stateDiagram-v2` subset. Returns { nodes: Map id → kind, labels, edges }. Any other construct
 * is refused with its line number (code `workflow_diagram`).
 */
export function parseMermaid(text) {
  const nodes = new Map();
  const labels = new Map();
  const alias = new Map();
  const edges = [];
  const real = id => id === '[*]' ? id : alias.get(id) ?? id;
  const node = (id, line) => {
    if (id !== '[*]' && !MERMAID_ID.test(id)) fail('workflow_diagram', `Line ${line}: unsupported state name ${id}`);
    if (id !== '[*]' && !nodes.has(real(id))) nodes.set(real(id), 'state');
    return real(id);
  };
  let header = false;
  String(text).split(/\r?\n/).forEach((raw, index) => {
    const line = index + 1;
    const content = raw.trim();
    if (!content) return;
    let match;
    if ((match = content.match(/^%%\s*state\s+([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(\S+)$/))) { alias.set(match[1], match[2]); return; }
    if (content.startsWith('%%')) return;
    if (!header) {
      if (content !== 'stateDiagram-v2') fail('workflow_diagram', `Line ${line}: the diagram must start with stateDiagram-v2`);
      header = true;
      return;
    }
    if ((match = content.match(/^state\s+"([^"]*)"\s+as\s+(\S+)$/))) { labels.set(node(match[2], line), match[1]); return; }
    if ((match = content.match(/^state\s+(\S+)\s+<<(choice|fork|join)>>$/))) { const id = node(match[1], line); nodes.set(id, match[2]); return; }
    if ((match = content.match(/^(\S+)\s*-->\s*(\S+)(?:\s*:\s*(.*))?$/))) {
      edges.push({ from: node(match[1], line), to: node(match[2], line), label: (match[3] ?? '').trim(), line });
      return;
    }
    fail('workflow_diagram', `Line ${line}: unsupported construct: ${content}`);
  });
  if (!header) fail('workflow_diagram', 'Line 1: the diagram must start with stateDiagram-v2');
  return { nodes, labels, edges };
}

const edgeKey = edge => `${edge.from}\u0000${edge.to}`;

/**
 * Patch turning `definition` into what the diagram shows: states added, removed or renamed, and transitions added
 * or removed. Labels on existing edges are derived from JSON and are not compared.
 */
export function diagramPatch(definition, text) {
  const diagram = parseMermaid(text);
  const known = new Set((definition.states ?? []).map(state => state.id));
  const joins = new Set((definition.states ?? []).filter(state => state.type === 'parallel').map(state => `${state.id}__join`));
  const shown = new Set([...diagram.nodes.keys()].filter(id => !joins.has(id) && diagram.nodes.get(id) !== 'join'));
  const ops = [];
  let added = [...shown].filter(id => !known.has(id));
  let removed = [...known].filter(id => !shown.has(id));
  const rename = new Map();
  // A removed state and an added one with the same neighbours (or the only pair) is a rename.
  const neighbours = (edges, id) => JSON.stringify([edges.filter(edge => edge.to === id).map(edge => edge.from).sort(),
    edges.filter(edge => edge.from === id).map(edge => edge.to).sort()]);
  const currentEdges = workflowEdges(definition);
  for (const from of [...removed]) {
    const to = added.length === 1 && removed.length === 1 ? added[0]
      : added.find(id => neighbours(diagram.edges, id) === neighbours(currentEdges, from));
    if (!to) continue;
    rename.set(from, to);
    ops.push({ op: 'renameState', from, to });
    added = added.filter(id => id !== to); removed = removed.filter(id => id !== from);
  }
  for (const id of added) {
    const kind = diagram.nodes.get(id);
    const final = diagram.edges.some(edge => edge.from === id && edge.to === '[*]');
    ops.push({ op: 'addState', id, type: kind === 'choice' ? 'choice' : kind === 'fork' ? 'parallel' : final ? 'terminal' : 'task',
      ...(diagram.labels.has(id) ? { label: diagram.labels.get(id) } : {}) });
  }
  for (const id of removed) ops.push({ op: 'removeState', id });
  const renamed = id => rename.get(id) ?? id;
  const current = new Map(workflowEdges(definition).map(edge => ({ ...edge, from: renamed(edge.from), to: renamed(edge.to) })).map(edge => [edgeKey(edge), edge]));
  const wanted = new Map(diagram.edges.map(edge => [edgeKey(edge), edge]));
  for (const [key, edge] of wanted) if (!current.has(key)) ops.push({ op: 'addTransition', from: edge.from, to: edge.to, ...(edge.label ? { label: edge.label } : {}), line: edge.line });
  for (const [key, edge] of current) if (!wanted.has(key)) ops.push({ op: 'removeTransition', from: edge.from, to: edge.to });
  return ops;
}

/** Applies a diagram patch; parallel internals and natural-language conditions are refused (edit the JSON). */
export function applyWorkflowPatch(definition, ops) {
  const next = structuredClone(definition);
  const find = id => next.states.find(state => state.id === id);
  const refuse = (op, why) => fail('workflow_patch', `${op.op} ${op.from ?? op.id ?? ''} → ${op.to ?? ''}: ${why}`);
  for (const op of ops) {
    if (op.op === 'renameState') {
      const swap = id => id === op.from ? op.to : id;
      for (const state of next.states) {
        if (state.id === op.from) state.id = op.to;
        for (const field of ['next', 'otherwise']) if (state[field]) state[field] = swap(state[field]);
        for (const branch of state.type === 'choice' ? state.branches ?? [] : []) branch.to = swap(branch.to);
        for (const option of state.decide?.options ?? []) option.to = swap(option.to);
        if (state.type === 'parallel') state.branches = state.branches.map(branch => branch.map(swap));
        for (const hook of [...(state.hooks?.pre ?? []), ...(state.hooks?.post ?? [])]) if (hook.onFailure === `goto:${op.from}`) hook.onFailure = `goto:${op.to}`;
      }
      for (const hook of next.hooks ?? []) if (hook.state === op.from) hook.state = op.to;
      if (next.entry === op.from) next.entry = op.to;
    } else if (op.op === 'addState') {
      next.states.push({ id: op.id, type: op.type, ...(op.label ? { label: op.label } : {}), ...(op.type === 'terminal' ? { outcome: 'success' } : {}) });
    } else if (op.op === 'removeState') {
      next.states = next.states.filter(state => state.id !== op.id);
    }
  }
  for (const op of ops.filter(item => item.op === 'removeTransition')) {
    if (op.from === '[*]') { next.entry = undefined; continue; }
    const state = find(op.from);
    if (!state) continue;
    if (op.to === '[*]') { if (state.type === 'terminal') state.type = 'task'; continue; }
    if (state.type === 'choice') {
      state.branches = (state.branches ?? []).filter(branch => branch.to !== op.to);
      if (state.decide) state.decide.options = state.decide.options.filter(option => option.to !== op.to);
      if (state.otherwise === op.to) delete state.otherwise;
    } else if (state.type === 'parallel' || op.from.endsWith('__join')) refuse(op, 'edit parallel branches in the JSON definition');
    else if (state.next === op.to) delete state.next;
  }
  for (const op of ops.filter(item => item.op === 'addTransition')) {
    if (op.from === '[*]') { next.entry = op.to; continue; }
    const state = find(op.from);
    if (!state) refuse(op, 'unknown state');
    if (op.to === '[*]') { if (state.type !== 'terminal') { for (const key of Object.keys(state)) if (key !== 'id' && key !== 'label') delete state[key]; Object.assign(state, { type: 'terminal', outcome: 'success' }); } continue; }
    if (state.type === 'choice') {
      if (op.label === 'otherwise' && !state.otherwise) state.otherwise = op.to;
      else refuse(op, 'a choice condition must be structured in the JSON definition (workflow_understand)');
    } else if (state.type === 'parallel' || state.type === 'terminal') refuse(op, `${state.type} transitions are edited in the JSON definition`);
    else if (state.next) refuse(op, 'a state has a single next; use a choice');
    else state.next = op.to;
  }
  return next;
}

// ---------------------------------------------------------------------------------------------------------------
// `.workflow.md`: front matter, human part (title, description, diagram, states) and the JSON block that is the truth.

const sha = text => createHash('sha256').update(text).digest('hex');
const JSON_FENCE = '```json workflow/2';

function stateLine(state, defaults, lang) {
  const parts = [`### ${state.id}`];
  const label = labelText(state.label, lang);
  const head = [label && label !== state.id ? label : null, state.type, state.type === 'task' || state.mode ? state.mode ?? defaults.mode ?? 'auto' : null,
    state.agent ? `agent ${state.agent}` : null].filter(Boolean);
  const body = [];
  if (state.prompt) body.push(`Prompt: ${String(state.prompt).replace(/\s+/g, ' ').trim()}`);
  if (state.script) body.push(`Script: \`${state.script}\``);
  if (state.mcp) body.push(`MCP: ${state.mcp.mode}${state.mcp.servers ? ` (${state.mcp.servers.join(', ')})` : ''}`);
  for (const slot of ['pre', 'post']) {
    for (const hook of state.hooks?.[slot] ?? []) body.push(`Hook ${slot} ${hook.id}: ${hook.script ? `script \`${hook.script}\`` : `agent ${hook.agent}`}, on failure ${hook.onFailure ?? 'block'}`);
  }
  if (state.type === 'choice') {
    for (const branch of state.branches ?? []) body.push(`If ${branch.label ?? conditionText(branch.when)} → ${branch.to}`);
    if (state.decide) body.push(`Decided by ${state.decide.agent}: ${state.decide.options.map(option => `${option.id} → ${option.to}`).join(', ')}`);
    if (state.otherwise) body.push(`Otherwise → ${state.otherwise}`);
  }
  if (state.type === 'parallel') body.push(`Branches: ${state.branches.map(branch => branch.join(' → ')).join(' | ')}; join ${state.join ?? 'all'}`);
  if (state.type === 'approval' && state.approvers) body.push(`Approvers: ${state.approvers.join(', ')}`);
  if (state.type === 'terminal') body.push(`Outcome: ${state.outcome ?? 'success'}`);
  return `${parts[0]} — ${head.join(' · ')}\n${body.join('\n')}`.trimEnd();
}

function humanPart(definition, lang) {
  const title = labelText(definition.label, lang) || definition.id;
  const defaults = definition.defaults ?? {};
  return [`# ${title}`, '', ...(definition.description ? [definition.description.trim(), ''] : []),
    '## Diagram', '```mermaid', renderMermaid(definition, { lang }).trimEnd(), '```', '',
    '## States', '', definition.states.map(state => stateLine(state, defaults, lang)).join('\n\n'), ''].join('\n');
}

/** Deterministic `.workflow.md` text: identical definitions give identical files. */
export function renderWorkflow(definition, { lang = 'en' } = {}) {
  const json = JSON.stringify(definition, null, 2);
  const human = humanPart(definition, lang);
  const front = ['---', `id: ${definition.id}`, `version: ${definition.version}`, `publication: ${definition.publication ?? 'draft'}`,
    `lang: ${lang}`, `rendered-json-sha256: ${sha(json)}`, `rendered-human-sha256: ${sha(human)}`, '---', ''].join('\n');
  return `${front}${human}\n## Definition\n${JSON_FENCE}\n${json}\n\`\`\`\n`;
}

/**
 * Reads a `.workflow.md` text: the JSON block is the source of truth. Returns { definition, front, human, diagram,
 * status } where status says what changed since the last render: clean, json, human, or conflict (both).
 */
export function readWorkflowMarkdown(text) {
  const source = String(text).replace(/\r\n/g, '\n');
  const frontMatch = source.match(/^---\n([\s\S]*?)\n---\n/);
  if (!frontMatch) fail('workflow_file', 'A .workflow.md file starts with a front matter block');
  const front = Object.fromEntries(frontMatch[1].split('\n').map(line => line.match(/^([A-Za-z0-9-]+):\s*(.*)$/)).filter(Boolean).map(match => [match[1], match[2].trim()]));
  const start = source.indexOf(`\n${JSON_FENCE}\n`);
  if (start < 0) fail('workflow_file', `A .workflow.md file needs a ${JSON_FENCE} block`);
  const jsonStart = start + JSON_FENCE.length + 2;
  const end = source.indexOf('\n```', jsonStart - 1);
  if (end < 0) fail('workflow_file', 'The JSON block is not closed');
  const jsonText = source.slice(jsonStart, end);
  let definition;
  try { definition = JSON.parse(jsonText); } catch (error) { fail('workflow_file', `Invalid JSON block: ${error.message}`); }
  const definitionHeading = source.lastIndexOf('\n## Definition\n', start + 1);
  const human = source.slice(frontMatch[0].length, definitionHeading < 0 ? start : definitionHeading).replace(/\n$/, '') + '\n';
  const diagramMatch = human.match(/```mermaid\n([\s\S]*?)\n```/);
  for (const key of ['id', 'version']) {
    if (front[key] !== undefined && front[key] !== String(definition?.[key])) fail('workflow_file', `Front matter ${key} ${front[key]} does not match the JSON block`);
  }
  const jsonChanged = !!front['rendered-json-sha256'] && sha(JSON.stringify(definition, null, 2)) !== front['rendered-json-sha256'];
  const humanChanged = !!front['rendered-human-sha256'] && sha(human) !== front['rendered-human-sha256'];
  return { definition, front, human, diagram: diagramMatch?.[1] ?? null,
    status: jsonChanged && humanChanged ? 'conflict' : jsonChanged ? 'json' : humanChanged ? 'human' : 'clean' };
}

/**
 * Brings a `.workflow.md` back in sync. JSON changed → human part re-rendered; diagram changed → patch applied to the
 * JSON (refused when invalid); both → conflict with both differences, nothing applied unless `prefer` is json or human.
 */
export function syncWorkflowMarkdown(text, { prefer } = {}) {
  const read = readWorkflowMarkdown(text);
  const lang = read.front.lang || 'en';
  const patch = read.diagram ? diagramPatch(read.definition, read.diagram) : [];
  if (read.status === 'conflict' && !prefer) return { status: 'conflict', definition: read.definition, patch };
  if (read.status === 'human' || prefer === 'human') {
    const definition = applyWorkflowPatch(read.definition, patch);
    const validation = validateWorkflow(definition);
    if (!validation.valid) fail('workflow_invalid', validation.errors.join('; '), validation.errors);
    return { status: patch.length ? 'patched' : 'clean', definition, patch, text: renderWorkflow(definition, { lang }) };
  }
  return { status: read.status === 'clean' ? 'clean' : 'rendered', definition: read.definition, patch: [], text: renderWorkflow(read.definition, { lang }) };
}

// ---------------------------------------------------------------------------------------------------------------
// Structural diff: states keyed by id, other values compared deeply.

const same = (a, b) => JSON.stringify(a) === JSON.stringify(b);

/** Changes from `before` to `after`: [{ op: add|remove|change, path, before?, after? }], states keyed by id. */
export function diffWorkflows(before, after) {
  const changes = [];
  const walk = (a, b, path) => {
    if (same(a, b)) return;
    if (isObject(a) && isObject(b)) {
      for (const key of new Set([...Object.keys(a), ...Object.keys(b)])) {
        const at = path ? `${path}/${key}` : key;
        if (!(key in b)) changes.push({ op: 'remove', path: at, before: a[key] });
        else if (!(key in a)) changes.push({ op: 'add', path: at, after: b[key] });
        else if (at === 'states' && Array.isArray(a[key]) && Array.isArray(b[key])) walkStates(a[key], b[key]);
        else walk(a[key], b[key], at);
      }
      return;
    }
    changes.push({ op: 'change', path, before: a, after: b });
  };
  const walkStates = (a, b) => {
    const left = new Map(a.map(state => [state?.id, state]));
    const right = new Map(b.map(state => [state?.id, state]));
    for (const [id, state] of left) if (!right.has(id)) changes.push({ op: 'remove', path: `states/${id}`, before: state });
    for (const [id, state] of right) {
      if (!left.has(id)) changes.push({ op: 'add', path: `states/${id}`, after: state });
      else walk(left.get(id), state, `states/${id}`);
    }
    const order = list => list.map(state => state?.id).filter(id => left.has(id) && right.has(id));
    if (!same(order(a), order(b))) changes.push({ op: 'change', path: 'states/#order', before: a.map(state => state?.id), after: b.map(state => state?.id) });
  };
  walk(before, after, '');
  return changes;
}

// ---------------------------------------------------------------------------------------------------------------
// Simulation with stub agents (workflow_test) and validated value proposals (workflow_understand).

/**
 * Walks every branch from the entry with stub agents: each choice option is taken, parallel branches are visited,
 * each state is entered at most `maxVisits` times (limits.maxAttempts, else 3) so loops stay bounded. Returns the
 * paths (≤ `maxPaths`), their end (terminal outcome, `loop-bound` or `stuck`), covered and uncovered states.
 */
export function simulateWorkflow(definition, { maxPaths = 50 } = {}) {
  const validation = validateWorkflow(definition);
  if (!validation.valid) return { valid: false, errors: validation.errors, paths: [], covered: [], uncovered: [], complete: false };
  const { entry, states } = workflowGraph(definition);
  const maxVisits = Math.max(1, Math.min(10, definition.limits?.maxAttempts ?? 3));
  const covered = new Set();
  const paths = [];
  let truncated = false;
  const walk = (id, trail, visits) => {
    if (paths.length >= maxPaths) { truncated = true; return; }
    const state = states.get(id);
    const count = (visits[id] ?? 0) + 1;
    if (count > maxVisits) { paths.push({ trail, end: 'loop-bound' }); return; }
    const seen = { ...visits, [id]: count };
    const here = [...trail, id];
    covered.add(id);
    if (state.type === 'terminal') { paths.push({ trail: here, end: state.outcome ?? 'success' }); return; }
    if (state.type === 'parallel') {
      const inner = state.branches.flat();
      inner.forEach(stateId => covered.add(stateId));
      walk(state.next, [...here, ...inner], seen);
      return;
    }
    const targets = stateTargets(state).filter(target => (seen[target] ?? 0) < maxVisits);
    if (!targets.length) { paths.push({ trail: here, end: stateTargets(state).length ? 'loop-bound' : 'stuck' }); return; }
    for (const target of [...new Set(targets)]) walk(target, here, seen);
  };
  walk(entry, [], {});
  const uncovered = [...states.keys()].filter(id => !covered.has(id));
  const terminals = [...new Set(paths.filter(path => OUTCOMES.includes(path.end)).map(path => path.trail.at(-1)))];
  const stuck = paths.filter(path => path.end === 'stuck').length;
  return { valid: true, errors: [], maxVisits, paths, truncated, covered: [...covered], uncovered, terminals,
    complete: !uncovered.length && !stuck && terminals.length > 0 };
}

const settable = path => /^(label|description|defaults|inputs|limits|hooks)(\/|$)|^states\/[A-Za-z0-9._-]+\/(?!id(\/|$))[A-Za-z]/.test(path);

/**
 * Applies value proposals [{ path, value }] (value undefined → removed) to a copy: `states/<id>/<field>/...` or a
 * top-level field. Structure (ids, entry, schema) changes through `applyWorkflowPatch`. Never touches `definition`.
 * Returns { valid, errors, definition, changes } — the caller shows `changes` before applying anything.
 */
export function proposeWorkflowValues(definition, proposals) {
  if (!Array.isArray(proposals) || !proposals.length) fail('workflow_patch', 'proposals must be a non-empty list');
  const next = structuredClone(definition);
  for (const [index, proposal] of proposals.entries()) {
    const path = String(proposal?.path ?? '');
    if (!settable(path)) fail('workflow_patch', `proposal ${index + 1}: path ${path || '(empty)'} is not editable by value`);
    const keys = path.split('/');
    let target = next;
    if (keys[0] === 'states') {
      target = next.states.find(state => state?.id === keys[1]);
      if (!target) fail('workflow_patch', `proposal ${index + 1}: unknown state ${keys[1]}`);
      keys.splice(0, 2);
    }
    const last = keys.pop();
    for (const key of keys) target = isObject(target[key]) ? target[key] : (target[key] = {});
    if (proposal.value === undefined) delete target[last]; else target[last] = proposal.value;
  }
  const validation = validateWorkflow(next);
  return { valid: validation.valid, errors: validation.errors, definition: next, changes: diffWorkflows(definition, next) };
}
