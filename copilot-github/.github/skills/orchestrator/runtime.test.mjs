import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import test from 'node:test';
import {
  activation, deriveCatalog, evaluate, findSourceRow, nextBatch, parsePriceSource, parseResult,
  selectRoute, validateRequest, validateResult
} from './runtime.mjs';

const policy = JSON.parse(readFileSync(new URL('./policy.json', import.meta.url), 'utf8'));
const snapshot = () => ({
  host: 'copilot', inventory_complete: true,
  agents: [{ id: 'agent-aikido-explore-all', scope: 'scoped_orchestration' }],
  tools: [{ id: 'Task', scope: 'delegation' }],
  available_routes: [], can_select_model: true
});
const task = () => ({
  class: 'analysis', input_tokens: 1000, output_tokens: 500, context_tokens: 1500
});
const model = (name, options = {}) => ({
  model: name, connection: 'copilot', authorized: true, quality: 2,
  context_tokens: 32000, input_per_million: 1, output_per_million: 2,
  stats: { analysis: { samples: 20, passed: 19, latency_ms: 100 } },
  ...options
});
const routing = rows => {
  const config = structuredClone(policy);
  config.routing.models = rows;
  const capabilities = snapshot();
  capabilities.available_routes = rows.map(({ model, connection }) => ({ model, connection }));
  return [capabilities, config];
};

for (const host of policy.activation.lead_hosts) {
  test(`lead on ${host} without general coordinator`, () => {
    const result = activation({ ...snapshot(), host });
    assert.equal(result.status, 'active');
    assert.equal(result.coordination, 'lead');
    assert.equal(result.native_orchestrator, null);
  });
}
for (const host of ['claude-code', 'Claude Code', 'kiro', 'codex', 'roo-code']) {
  test(`collaborate with the native orchestrator on ${host}`, () => {
    const result = activation({ ...snapshot(), host });
    assert.equal(result.status, 'active');
    assert.equal(result.coordination, 'collaborate');
    assert.equal(result.reason, 'native_host');
  });
}
for (const host of ['unknown', '']) {
  test(`work directly (never refuse) on ${host || 'missing host'}`, () => {
    const result = activation({ ...snapshot(), host });
    assert.equal(result.status, 'active');
    assert.equal(result.coordination, 'direct');
  });
}
for (const collection of ['agents', 'tools']) {
  test(`a general orchestrator in ${collection} makes AI-KIDO collaborate, not refuse`, () => {
    const capabilities = snapshot();
    capabilities[collection].push({ id: 'native-coordinator', scope: 'general_orchestration' });
    const result = activation(capabilities);
    assert.equal(result.status, 'active');
    assert.equal(result.coordination, 'collaborate');
    assert.equal(result.reason, 'native_orchestrator_present');
    assert.equal(result.native_orchestrator.id, 'native-coordinator');
  });
  test(`unknown scope in ${collection} fails closed to collaboration`, () => {
    const capabilities = snapshot();
    capabilities[collection].push({ id: 'orchestrator' });
    const result = activation(capabilities);
    assert.equal(result.coordination, 'collaborate');
    assert.equal(result.reason, 'ambiguous_inventory');
  });
}
test('own registry entry and scoped AI-KIDO coordinators do not prevent leading', () => {
  const capabilities = snapshot();
  capabilities.agents.push({ id: policy.activation.self, scope: 'general_orchestration' });
  capabilities.agents.push({ id: 'agent-aikido-bank-populate', scope: 'scoped_orchestration' });
  assert.equal(activation(capabilities).coordination, 'lead');
});
test('partial and malformed inventories degrade to direct work, never to refusal', () => {
  for (const patch of [{ inventory_complete: false }, { tools: undefined }, { agents: undefined }]) {
    const result = activation({ ...snapshot(), ...patch });
    assert.equal(result.status, 'active');
    assert.equal(result.coordination, 'direct');
  }
  assert.equal(activation({ ...snapshot(), agents: [null] }).coordination, 'collaborate');
  assert.equal(activation({ ...snapshot(), tools: [{ id: '', scope: 'utility' }] }).coordination, 'collaborate');
  assert.throws(() => activation(null), /snapshot/);
});
test('the declared native orchestrator capability is carried into the decision', () => {
  const result = activation({ ...snapshot(), host: 'roo-code',
    native_orchestrator: { id: 'roo-orchestrator', supports_parallel: false } });
  assert.deepEqual(result.native_orchestrator, { id: 'roo-orchestrator', supports_parallel: false });
  assert.equal(activation({ ...snapshot(), host: 'kiro' }).native_orchestrator.supports_parallel, null);
});
test('a native host still gets routing and request validation', () => {
  const result = evaluate({ ...snapshot(), host: 'codex', can_select_model: false, task: task() });
  assert.equal(result.coordination, 'collaborate');
  assert.equal(result.route.status, 'selection_unsupported');
});
test('operator policy decides which hosts lead; native hosts always collaborate', () => {
  const config = structuredClone(policy);
  config.activation.lead_hosts.push('codex', 'other-harness');
  assert.equal(activation({ ...snapshot(), host: 'codex' }, config).coordination, 'collaborate');
  assert.equal(activation({ ...snapshot(), host: 'other-harness' }, config).coordination, 'lead');
  config.activation.lead_hosts = [];
  assert.equal(activation(snapshot(), config).coordination, 'direct');
});
test('empty real-world catalog blocks automatic selection', () => {
  assert.deepEqual(selectRoute(snapshot(), task()),
    { status: 'blocked', reason: 'no_eligible_route' });
});
test('unsupported selection explicitly inherits without inventing a model or price', () => {
  const result = selectRoute({ ...snapshot(), can_select_model: false }, task());
  assert.equal(result.status, 'selection_unsupported');
  assert.equal(result.model, null);
  assert.equal(result.estimated_cost, null);
});
test('cheapest eligible route wins and exact estimated cost is returned', () => {
  const [capabilities, config] = routing([
    model('expensive'), model('cheap', { input_per_million: 0.2, output_per_million: 0.8 })
  ]);
  const result = evaluate({ ...capabilities, task: task() }, config);
  assert.equal(result.status, 'active');
  assert.equal(result.route.model, 'cheap');
  assert.equal(result.route.estimated_cost, 0.0006);
  assert.equal(result.route.currency, 'USD');
});
test('ineligible cheap routes cannot displace an eligible one', () => {
  const rows = [
    model('good'),
    model('unauthorized', { authorized: false, input_per_million: 0 }),
    model('weak', { quality: 1, input_per_million: 0 }),
    model('small', { context_tokens: 1999, input_per_million: 0 }),
    model('insufficient-samples', {
      stats: { analysis: { samples: 19, passed: 19, latency_ms: 1 } }
    }),
    model('unreliable', {
      stats: { analysis: { samples: 20, passed: 18, latency_ms: 1 } }
    }),
    model('unavailable', { input_per_million: 0 }),
    model('no-class-statistics', { stats: {} })
  ];
  const [capabilities, config] = routing(rows);
  capabilities.available_routes = capabilities.available_routes.filter(r => r.model !== 'unavailable');
  assert.equal(selectRoute(capabilities, task(), config).model, 'good');
});
test('context capacity includes expected output and cannot underreport input', () => {
  const [capabilities, config] = routing([model('exact', { context_tokens: 2000 })]);
  assert.equal(selectRoute(capabilities, task(), config).status, 'selected');
  assert.equal(selectRoute(capabilities, { ...task(), output_tokens: 501 }, config).status, 'blocked');
  assert.equal(selectRoute(capabilities, { ...task(), input_tokens: 2000 }, config).status, 'blocked');
});
test('explicit quality can raise but not lower policy requirements', () => {
  const [capabilities, config] = routing([model('normal')]);
  assert.equal(selectRoute(capabilities, { ...task(), min_quality: 3 }, config).status, 'blocked');
  config.routing.models[0].quality = 1;
  assert.equal(selectRoute(capabilities, { ...task(), min_quality: 1 }, config).status, 'blocked');
});
test('explicit model/connection is honored or blocked, never substituted', () => {
  const [capabilities, config] = routing([model('cheap'), model('chosen', { input_per_million: 5 })]);
  capabilities.required_route = { model: 'chosen', connection: 'copilot' };
  assert.equal(selectRoute(capabilities, task(), config).model, 'chosen');
  capabilities.required_route.connection = 'unavailable';
  assert.equal(selectRoute(capabilities, task(), config).status, 'blocked');
});
test('a route carries the host mode that applies it (Roo: model bound to a mode via its API profile)', () => {
  const [capabilities, config] = routing([
    model('cheap-model', { connection: 'roo-profile-cheap' }),
    model('strong-model', { connection: 'roo-profile-strong', quality: 4, input_per_million: 9 })
  ]);
  capabilities.available_routes = [
    { model: 'cheap-model', connection: 'roo-profile-cheap', mode: 'aikido-cheap' },
    { model: 'strong-model', connection: 'roo-profile-strong', mode: 'aikido-strong' }
  ];
  const cheap = selectRoute(capabilities, task(), config);
  assert.equal(cheap.model, 'cheap-model');
  assert.equal(cheap.mode, 'aikido-cheap');
  const strong = selectRoute(capabilities, { ...task(), min_quality: 4 }, config);
  assert.equal(strong.model, 'strong-model');
  assert.equal(strong.mode, 'aikido-strong');
  // Without a mode the route stays valid and carries no mode key.
  capabilities.available_routes = [{ model: 'cheap-model', connection: 'roo-profile-cheap' }];
  assert.equal('mode' in selectRoute(capabilities, task(), config), false);
  // A malformed mode is an explicit error, never silently ignored.
  capabilities.available_routes = [{ model: 'cheap-model', connection: 'roo-profile-cheap', mode: '' }];
  assert.throws(() => selectRoute(capabilities, task(), config), /mode/);
});
test('statistics are scoped to each model/connection pair', () => {
  const [capabilities, config] = routing([
    model('same-model'),
    model('same-model', { connection: 'other', stats: {} })
  ]);
  assert.equal(selectRoute(capabilities, task(), config).connection, 'copilot');
});
test('cost ties use latency then deterministic route IDs', () => {
  const [capabilities, config] = routing([
    model('z'), model('a'), model('slow', {
      stats: { analysis: { samples: 20, passed: 19, latency_ms: 200 } }
    })
  ]);
  assert.equal(selectRoute(capabilities, task(), config).model, 'a');
});
test('invalid inputs, measurements and duplicate routes raise explicit errors', () => {
  const [capabilities, config] = routing([model('normal')]);
  for (const patch of [{ class: 'unknown' }, { input_tokens: -1 },
    { output_tokens: 1.5 }, { context_tokens: null }]) {
    assert.throws(() => selectRoute(capabilities, { ...task(), ...patch }, config));
  }
  config.routing.models[0].stats.analysis.passed = 21;
  assert.throws(() => selectRoute(capabilities, task(), config), /exceed/);
  config.routing.models[0] = model('normal', { input_per_million: -1 });
  assert.throws(() => selectRoute(capabilities, task(), config), /finite/);
  config.routing.models = [model('normal'), model('normal')];
  assert.throws(() => selectRoute(capabilities, task(), config), /Duplicate/);
});
test('CLI emits one actionable JSON object or a nonzero explicit JSON error', () => {
  const script = new URL('./runtime.mjs', import.meta.url);
  const good = spawnSync(process.execPath, [script.pathname], {
    input: JSON.stringify(snapshot()), encoding: 'utf8'
  });
  assert.equal(good.status, 0);
  assert.equal(JSON.parse(good.stdout).status, 'active');
  assert.equal(good.stderr, '');
  const bad = spawnSync(process.execPath, [script.pathname], { input: '{', encoding: 'utf8' });
  assert.equal(bad.status, 1);
  assert.equal(bad.stdout, '');
  assert.equal(JSON.parse(bad.stderr).status, 'error');
});

const multiagent = () => ({
  ...snapshot(),
  supports_parallel: true,
  agents: [{
    id: 'worker', scope: 'specialist', tools_complete: true,
    tools: [{ id: 'mcp.repo/read', authorized: true }]
  }],
  tools: [
    { id: 'context.delegate', scope: 'delegation', authorized: true },
    { id: 'mcp.repo/read', scope: 'utility', authorized: true }
  ]
});
const job = (id, patch = {}) => ({
  id, depends_on: [], agent: 'worker', dispatch_tool: 'context.delegate',
  tools: ['mcp.repo/read'], resources: { read: [`repo/${id}`], write: [] },
  ...patch
});
const batch = (jobs, capabilities = multiagent()) =>
  nextBatch(capabilities, { tasks: jobs });

test('dispatch uses actual context Tool IDs, not a required new_task name', () => {
  const result = batch([job('a'), job('b')]);
  assert.deepEqual(result.launch, ['a', 'b']);
  assert.equal(result.mode, 'parallel');
  assert.equal(batch([job('a', { dispatch_tool: 'new_task' })]).blocked[0].reason,
    'unavailable_dispatch_tool');
});
test('MCP availability is worker-specific, not inherited from parent', () => {
  const capabilities = multiagent();
  capabilities.agents[0].tools = [];
  assert.equal(batch([job('a')], capabilities).blocked[0].reason, 'unavailable_or_unauthorized_tool');
  capabilities.agents[0].tools_complete = false;
  assert.equal(batch([job('a')], capabilities).blocked[0].reason, 'unknown_worker_tools');
});
test('authorized worker-only MCP Tool can be used without parent access', () => {
  const capabilities = multiagent();
  capabilities.tools = capabilities.tools.filter(tool => tool.scope === 'delegation');
  assert.deepEqual(batch([job('a')], capabilities).launch, ['a']);
});
test('direct calls need no delegation Tool, but require authorized context Tools', () => {
  const capabilities = multiagent();
  capabilities.tools = capabilities.tools.filter(tool => tool.scope !== 'delegation');
  const direct = job('direct', { agent: null });
  assert.deepEqual(batch([direct], capabilities).launch, ['direct']);
  capabilities.tools[0].authorized = false;
  assert.equal(batch([direct], capabilities).status, 'blocked');
});
test('unavailable/self workers and unauthorized delegation cannot launch', () => {
  assert.equal(batch([job('a', { agent: 'missing' })]).status, 'blocked');
  assert.equal(batch([job('a', { agent: policy.activation.self })]).status, 'blocked');
  const capabilities = multiagent();
  capabilities.tools[0].authorized = false;
  assert.equal(batch([job('a')], capabilities).status, 'blocked');
});
test('dependencies sequence and join only after verified completion', () => {
  const jobs = [job('a'), job('b'), job('join', { depends_on: ['a', 'b'] })];
  assert.deepEqual(batch(jobs).launch, ['a', 'b']);
  assert.deepEqual(batch(jobs).waiting, [{ id: 'join', reason: 'dependencies_pending' }]);
  jobs[0].state = 'ok';
  jobs[0].acceptance_verified = true;
  jobs[1].state = 'ok';
  assert.equal(batch(jobs).blocked.find(item => item.id === 'join').reason, 'prerequisite_not_accepted');
  jobs[1].acceptance_verified = true;
  assert.deepEqual(batch(jobs).launch, ['join']);
  jobs[2].state = 'ok';
  jobs[2].acceptance_verified = true;
  assert.equal(batch(jobs).status, 'complete');
});
test('failed/partial prerequisites block dependents while independent branches proceed', () => {
  for (const state of ['error', 'partial', 'blocked']) {
    const result = batch([job('a', { state }), job('dependent', { depends_on: ['a'] }), job('b')]);
    assert.deepEqual(result.launch, ['b']);
    assert.equal(result.blocked.find(item => item.id === 'dependent').reason, 'prerequisite_not_accepted');
  }
});
test('missing upstream capabilities block descendants regardless of task listing order', () => {
  const result = batch([
    job('last', { depends_on: ['middle'] }),
    job('middle', { depends_on: ['first'] }),
    job('first', { tools: ['not-in-context'] })
  ]);
  assert.equal(result.status, 'blocked');
  assert.deepEqual(result.launch, []);
  assert.deepEqual(result.waiting, []);
  assert.deepEqual(result.blocked, [
    { id: 'first', reason: 'unavailable_or_unauthorized_tool' },
    { id: 'middle', reason: 'prerequisite_not_accepted' },
    { id: 'last', reason: 'prerequisite_not_accepted' }
  ]);
});
test('read/read overlap is safe but file and MCP writes are serialized', () => {
  const resources = { read: ['mcp/repo'], write: [] };
  assert.equal(batch([job('a', { resources }), job('b', { resources })]).mode, 'parallel');
  const write = job('a', { resources: { read: [], write: ['mcp/repo/'] } });
  const read = job('b', { resources: { read: ['mcp/repo/object'], write: [] } });
  assert.equal(batch([write, read]).waiting[0].reason, 'resource_conflict');
  assert.equal(batch([read, write]).waiting[0].reason, 'resource_conflict');
  assert.equal(batch([write, job('b', { resources: write.resources })]).mode, 'sequential');
  assert.equal(batch([job('a', { resources: { read: [], write: ['*'] } }), read]).mode, 'sequential');
});
test('running tasks retain locks and consume the concurrency limit', () => {
  const running = job('a', { state: 'running', resources: { read: [], write: ['repo'] } });
  assert.equal(batch([running, job('b')]).waiting[0].reason, 'resource_conflict');
  const result = batch([job('a', { state: 'running' }), job('b'), job('c'), job('d')]);
  assert.deepEqual(result.launch, ['b', 'c']);
  assert.deepEqual(result.running, ['a']);
  assert.equal(result.waiting[0].reason, 'concurrency_limit');
});
test('host without parallel dispatch chooses sequential batches', () => {
  const capabilities = { ...multiagent(), supports_parallel: false };
  const result = batch([job('a'), job('b')], capabilities);
  assert.equal(result.mode, 'sequential');
  assert.deepEqual(result.launch, ['a']);
  assert.equal(batch([job('a', { state: 'running' }), job('b')], capabilities).launch.length, 0);
});
test('invalid DAGs, resources, states and duplicate inventories are explicit errors', () => {
  for (const jobs of [
    [job('a'), job('a')],
    [job('a', { depends_on: ['missing'] })],
    [job('a', { depends_on: ['b'] }), job('b', { depends_on: ['a'] })],
    [job('a', { resources: undefined })],
    [job('a', { resources: { read: ['repo/../a'], write: [] } })],
    [job('a', { state: 'success' })]
  ]) assert.throws(() => batch(jobs));
  const capabilities = multiagent();
  capabilities.tools.push(capabilities.tools[0]);
  assert.throws(() => batch([job('a')], capabilities), /Duplicate/);
  assert.throws(() => batch([job('a')], { ...multiagent(), supports_parallel: undefined }), /verified/);
});
test('evaluate exposes scheduling in every coordination mode', () => {
  const capabilities = { ...multiagent(), plan: { tasks: [job('a')] } };
  assert.deepEqual(evaluate(capabilities).schedule.launch, ['a']);
  assert.equal(evaluate(capabilities).schedule.coordination, 'lead');
  assert.equal(evaluate({ ...capabilities, host: 'kiro' }).schedule.coordination, 'collaborate');
});

const native = (parallel, host = 'roo-code') => ({
  ...multiagent(), host, native_orchestrator: { id: 'native', supports_parallel: parallel }
});
test('collaborate: the native orchestrator receives delegated work; direct tools stay with AI-KIDO', () => {
  const direct = job('d', { agent: null });
  const result = batch([job('a'), direct], native(true));
  assert.equal(result.coordination, 'collaborate');
  assert.deepEqual(result.assignments, [
    { id: 'a', executor: 'native', reason: 'native_delegation' },
    { id: 'd', executor: 'aikido', reason: 'direct_tool' }
  ]);
});
test('takeover: AI-KIDO runs a parallel batch the native orchestrator verifiably cannot', () => {
  const result = batch([job('a'), job('b')], native(false));
  assert.equal(result.mode, 'parallel');
  assert.deepEqual(result.assignments.map(item => [item.executor, item.reason]),
    [['aikido', 'takeover_parallel'], ['aikido', 'takeover_parallel']]);
});
test('no takeover when the native orchestrator parallelizes, or its ability is unknown', () => {
  assert.deepEqual(batch([job('a'), job('b')], native(true)).assignments.map(item => item.executor),
    ['native', 'native']);
  const unknown = batch([job('a'), job('b')], native(null));
  assert.deepEqual(unknown.assignments.map(item => item.reason),
    ['native_parallel_unverified', 'native_parallel_unverified']);
});
test('no takeover when AI-KIDO itself cannot dispatch in parallel', () => {
  const capabilities = { ...native(false), supports_parallel: false };
  const result = batch([job('a'), job('b')], capabilities);
  assert.equal(result.mode, 'sequential');
  assert.deepEqual(result.assignments.map(item => item.executor), ['native']);
});
test('direct mode schedules sequentially with own tools and no verified-parallel claim', () => {
  const capabilities = { ...multiagent(), host: 'unknown', supports_parallel: undefined };
  const result = batch([job('a', { agent: null }), job('b', { agent: null })], capabilities);
  assert.equal(result.coordination, 'direct');
  assert.equal(result.mode, 'sequential');
  assert.deepEqual(result.assignments, [{ id: 'a', executor: 'aikido', reason: 'own_dispatch' }]);
});

const request = () => ({
  version: 2, request_id: 'r1', caller: { agent: 'copilot', return_mode: null },
  coordination: 'lead', objective: 'Verify formats', constraints: ['read-only'],
  tasks: [
    { id: 'agent', depends_on: [], transport: { kind: 'agent', dispatch_tool: 'context.delegate', agent: 'worker' },
      tools: ['mcp.repo/read'], resources: { read: ['docs'], write: [] }, state: 'pending',
      acceptance: ['Report discrepancies'], return: 'task-result/1' },
    { id: 'thread', depends_on: ['agent'], transport: { kind: 'thread', dispatch_tool: 'context.delegate', agent: 'worker', thread_id: null },
      tools: [], resources: { read: [], write: ['docs/out'] }, state: 'pending',
      acceptance: ['Follow-up answered'], return: 'task-result/1' },
    { id: 'mcp', depends_on: [], transport: { kind: 'mcp', server: 'repo', tool: 'mcp.repo/read', arguments: { path: 'a' } },
      tools: ['mcp.repo/read'], resources: { read: ['repo/a'], write: [] }, state: 'pending',
      acceptance: ['File read'], return: 'task-result/1' },
    { id: 'direct', depends_on: [], transport: { kind: 'direct', tool: 'read_file', arguments: { path: 'a' } },
      tools: ['read_file'], resources: { read: ['a'], write: [] }, state: 'pending',
      acceptance: ['Content returned'], return: 'task-result/1' }
  ]
});
const okResult = (patch = {}) => ({
  id: 'agent', status: 'ok', summary: 'Done', artifacts: [], errors: [], next: [], ...patch
});
test('agent, thread, MCP and direct requests share one valid JSON contract', () => {
  assert.deepEqual(validateRequest(request()), { valid: true, errors: [] });
});
test('requests with free-form or ambiguous fields are rejected with precise paths', () => {
  const mutations = [
    r => { r.version = 1; },
    r => { r.coordination = 'inactive'; },
    r => { r.extra = true; },
    r => { delete r.tasks[0].transport; },
    r => { r.tasks[0].transport.kind = 'shell'; },
    r => { r.tasks[0].return = 'text'; },
    r => { r.tasks[0].acceptance = []; },
    r => { r.tasks[2].tools = []; },
    r => { r.tasks[2].transport.arguments = 'a'; },
    r => { delete r.tasks[1].transport.thread_id; },
    r => { r.tasks[1].depends_on = ['missing']; },
    r => { r.tasks[3].id = 'mcp'; },
    r => { r.tasks[0].resources = { read: [] }; }
  ];
  for (const mutate of mutations) {
    const candidate = request();
    mutate(candidate);
    assert.equal(validateRequest(candidate).valid, false, mutate.toString());
  }
  assert.equal(validateRequest('text').valid, false);
});
test('results: statuses are consistent with their errors and never invalid', () => {
  assert.equal(validateResult(okResult()).valid, true);
  assert.equal(validateResult(okResult({ status: 'success' })).valid, false);
  assert.equal(validateResult(okResult({ errors: [{ code: 'E', message: 'x' }] })).valid, false);
  assert.equal(validateResult(okResult({ status: 'error' })).valid, false);
  assert.equal(validateResult(okResult({ status: 'blocked', errors: [{ code: 'tool', message: 'missing' }] })).valid, true);
  assert.equal(validateResult(okResult({ artifacts: [{ type: 'file' }] })).valid, false);
  assert.equal(validateResult(okResult({ extra: 1 })).valid, false);
  assert.equal(validateResult(okResult({ summary: 'x'.repeat(2001) })).valid, false);
});
test('results are bound to a known task and a thread result carries its thread ID', () => {
  const known = request();
  assert.equal(validateResult(okResult({ id: 'missing' }), known).valid, false);
  assert.equal(validateResult(okResult({ id: 'thread' }), known).valid, false);
  assert.equal(validateResult(okResult({ id: 'thread', thread_id: 't-1' }), known).valid, true);
});
test('raw replies are parsed as data, never evaluated', () => {
  assert.equal(parseResult(JSON.stringify(okResult())).valid, true);
  assert.equal(parseResult('Done: all good').valid, false);
  assert.equal(parseResult('{"id":"a"}').valid, false);
});
test('a thread transport is an exclusive lock: no concurrent mutations of one conversation', () => {
  const threaded = id => ({
    id, depends_on: [], tools: [], resources: { read: [], write: [] },
    transport: { kind: 'thread', dispatch_tool: 'context.delegate', agent: 'worker', thread_id: 't-1' }
  });
  const result = nextBatch(multiagent(), { tasks: [threaded('a'), threaded('b')] });
  assert.deepEqual(result.launch, ['a']);
  assert.equal(result.waiting[0].reason, 'resource_conflict');
});
test('transport-based tasks schedule like legacy tasks (agent, MCP and direct)', () => {
  const plan = { tasks: request().tasks.filter(item => item.id !== 'direct' && item.id !== 'thread') };
  const result = nextBatch(multiagent(), plan);
  assert.deepEqual(result.launch, ['agent', 'mcp']);
});
test('evaluate validates a request and its results in one call', () => {
  const result = evaluate({ ...snapshot(), request: request(), results: [okResult()] });
  assert.equal(result.request_validation.valid, true);
  assert.equal(result.result_validation[0].valid, true);
});
test('persona documents never describe an inactive refusal', () => {
  for (const file of ['../../agents/agent-aikido-orchestrator.md', './SKILL.md',
    '../../../../.github/agents/agent-aikido-orchestrator.agent.md',
    '../../../../.claude/agents/agent-aikido-orchestrator.md', '../../../../.roomodes']) {
    const text = readFileSync(new URL(file, import.meta.url), 'utf8');
    assert.doesNotMatch(text, /"status":"inactive"/, file);
    assert.doesNotMatch(text, /Inactive (Native Host|Claude Code) Wrapper/, file);
  }
});
const sourceRows = () => parsePriceSource(readFileSync(
  new URL('./sources/llm-pricing-5143-2026-10-09.csv', import.meta.url), 'utf8'));
const discovered = (model, extra = {}) => ({
  model, connection: 'copilot', authorized: true, context_tokens: 200000, ...extra
});
test('the price source parses (BOM, French header, $ prices) and stays a volatile reference', () => {
  const rows = sourceRows();
  assert.equal(rows.length, 30);
  assert.deepEqual(rows.find(row => row.name === 'GPT-6 Luna'),
    { name: 'GPT-6 Luna', tokens: ['gpt', '6', 'luna'], score: 58, input_per_million: 0.1, output_per_million: 0.5 });
  const source = policy.routing.price_sources[0];
  assert.equal(source.volatile, true);
  assert.ok(source.max_age_days > 0);
  assert.throws(() => parsePriceSource('Model,Score\nA,1'), /input price/);
  assert.throws(() => parsePriceSource('Model,Score,Prix d\'entrée,Prix de sortie\nA,1,$x,$2'), /invalid input price/);
});
test('discovered model IDs are matched to source rows without borrowing a neighbour price', () => {
  const rows = sourceRows();
  const match = id => findSourceRow(id, rows);
  assert.equal(match('anthropic/claude-sonnet-5.5').row.name, 'Claude Sonnet 5.5');
  assert.equal(match('claude-sonnet-5.5-20261001').row.name, 'Claude Sonnet 5.5');
  assert.equal(match('claude-opus-5.5').row.name, 'Claude Opus 5.5');
  assert.equal(match('claude-opus-5').row.name, 'Claude Opus 5');
  assert.equal(match('gpt-6.1-sol').row.name, 'GPT-6.1 Sol');
  assert.equal(match('GPT-6 Sol').row.name, 'GPT-6 Sol');
  assert.equal(match('Qwen3.8 Max (0902)').row.name, 'Qwen3.8 Max (0902)');
  assert.equal(match('qwen3.8-max').row.name, 'Qwen3.8 Max');
  assert.deepEqual(match('gemini-3.8-flash-lite'), { row: null, reason: 'not_in_source' });
  assert.deepEqual(match('totally-unknown-model'), { row: null, reason: 'not_in_source' });
});
test('deriveCatalog prices only discovered models, flags estimates and reports the rest', () => {
  const result = deriveCatalog([
    discovered('claude-sonnet-5.5'), discovered('gpt-6-luna'), discovered('mystery-model'),
    discovered('gemini-3.8-flash-lite'), discovered('gpt-6-sol', { context_tokens: 0 })
  ], sourceRows(), policy, new Date('2026-10-10T00:00:00Z'));
  const byName = Object.fromEntries(result.models.map(row => [row.model, row]));
  assert.deepEqual(Object.keys(byName), ['claude-sonnet-5.5', 'gpt-6-luna']);
  assert.equal(byName['claude-sonnet-5.5'].quality, 4);
  assert.equal(byName['gpt-6-luna'].quality, 3);
  assert.equal(byName['gpt-6-luna'].estimate, true);
  assert.deepEqual(byName['gpt-6-luna'].stats, {});
  assert.deepEqual(result.unmatched.map(item => item.reason),
    ['not_in_source', 'not_in_source', 'context_tokens_unknown']);
  assert.equal(result.source.volatile, true);
  assert.equal(result.source.stale, false);
  assert.equal(deriveCatalog([], sourceRows(), policy, new Date('2027-01-01T00:00:00Z')).source.stale, true);
  assert.throws(() => deriveCatalog([discovered('a'), discovered('a')], sourceRows()), /Duplicate/);
});
test('a model deduced by the agent maps to a named source row, never to an invented one', () => {
  const result = deriveCatalog([
    discovered('vendor-sonnet-next', { source_name: 'claude sonnet 5.5' }),
    discovered('vendor-other', { source_name: 'Imaginary Model 9' })
  ], sourceRows(), policy);
  assert.equal(result.models.length, 1);
  assert.equal(result.models[0].source.match, 'deduced');
  assert.equal(result.models[0].input_per_million, 2);
  assert.deepEqual(result.unmatched.map(item => item.reason), ['source_name_unknown']);
});
test('evaluate routes among models discovered in the context using the volatile price source', () => {
  const base = { ...snapshot(), can_select_model: true, now: '2026-10-10T00:00:00Z',
    discovered_models: [
      discovered('claude-sonnet-5.5', { mode: 'aikido-strong' }),
      discovered('gpt-6-luna', { mode: 'aikido-cheap' }),
      discovered('mystery-model'), discovered('claude-opus-5.5', { authorized: false })
    ] };
  const cheap = evaluate({ ...base, task: task() });
  assert.equal(cheap.route.status, 'selected');
  assert.equal(cheap.route.model, 'gpt-6-luna');
  assert.equal(cheap.route.mode, 'aikido-cheap');
  assert.equal(cheap.route.basis, 'unmeasured_source_estimate');
  assert.equal(cheap.route.latency_ms, null);
  assert.equal(cheap.route.estimated_cost, (1000 * 0.1 + 500 * 0.5) / 1_000_000);
  const strong = evaluate({ ...base, task: { ...task(), min_quality: 4 } });
  assert.equal(strong.route.model, 'claude-sonnet-5.5');
  assert.equal(strong.route.mode, 'aikido-strong');
  assert.deepEqual(strong.price_catalog.unmatched.map(item => item.model), ['mystery-model']);
  assert.equal(strong.price_catalog.matched.length, 3);
  // The unauthorized discovered model is priced but can never be routed to.
  const opus = evaluate({ ...base, task: { ...task(), min_quality: 4 },
    discovered_models: [discovered('claude-opus-5.5', { authorized: false })] });
  assert.deepEqual(opus.route, { status: 'blocked', reason: 'no_eligible_route' });
});
test('cold start is bounded: no critical class, no estimate without source, failures stop it', () => {
  const [capabilities, config] = routing([
    model('est', { estimate: true, stats: {} }), model('plain', { stats: {} })
  ]);
  assert.equal(selectRoute(capabilities, task(), config).model, 'est');
  assert.equal(selectRoute(capabilities, task(), config).basis, 'unmeasured_source_estimate');
  // A measured row without statistics is never eligible, cold start or not.
  config.routing.models = [model('plain', { stats: {} })];
  assert.equal(selectRoute(capabilities, task(), config).status, 'blocked');
  // Critical work never runs on an unmeasured estimate.
  const [crit, critConfig] = routing([model('est', { estimate: true, stats: {}, quality: 4 })]);
  assert.equal(selectRoute(crit, { ...task(), class: 'critical' }, critConfig).status, 'blocked');
  // A few observed failures disqualify the estimate before it reaches min_samples.
  const [fail, failConfig] = routing([model('est', {
    estimate: true, stats: { analysis: { samples: 5, passed: 3, latency_ms: 100 } } })]);
  assert.equal(selectRoute(fail, task(), failConfig).status, 'blocked');
  // Enough measurements: the row is judged like any measured row, without the cold-start flag.
  const [ok, okConfig] = routing([model('est', { estimate: true })]);
  assert.equal(selectRoute(ok, task(), okConfig).basis, undefined);
  // Cold start disabled by the operator: estimates need measurements again.
  config.routing.models = [model('est', { estimate: true, stats: {} })];
  config.routing.cold_start = { enabled: false };
  assert.equal(selectRoute(capabilities, task(), config).status, 'blocked');
});
test('a measured catalog row wins over the derived estimate for the same route', () => {
  const measured = { ...policy, routing: { ...policy.routing, models: [
    model('claude-sonnet-5.5', { input_per_million: 7, output_per_million: 9, quality: 4 })
  ] } };
  const result = evaluate({ ...snapshot(), can_select_model: true, now: '2026-10-10T00:00:00Z',
    discovered_models: [discovered('claude-sonnet-5.5')], task: { ...task(), min_quality: 4 } }, measured);
  assert.equal(result.route.estimated_cost, (1000 * 7 + 500 * 9) / 1_000_000);
  assert.equal(result.route.basis, undefined);
});
test('Copilot wrapper retains host-enabled default Tools including MCP', () => {
  const wrapper = readFileSync(new URL('../../../../.github/agents/agent-aikido-orchestrator.agent.md',
    import.meta.url), 'utf8');
  const header = wrapper.split('---')[1];
  assert.doesNotMatch(header, /^tools:/m);
  assert.match(header, /disable-model-invocation: true/);
});
