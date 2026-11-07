import assert from 'node:assert/strict';
import test from 'node:test';
import { readFileSync } from 'node:fs';
import { validateHubProfile, negotiateHubProfile } from '../../prompts/hard_points/system/orchestrator/hub-profile.mjs';
import { validateRequest, validateResult } from '../../prompts/hard_points/system/orchestrator/exchange.mjs';
import * as runtime from '../../prompts/hard_points/system/orchestrator/runtime.mjs';

const featureNames = ['pool', 'state', 'retain', 'reset', 'peerMessaging', 'parallel', 'cancellation', 'persistence'];
const tools = ['spawn', 'resume', 'status', 'wait', 'send', 'receive', 'reset', 'close', 'accept'].map(op => `agent_pool_${op}`);
const profile = () => ({
  version: 1, id: 'reference', kind: 'core',
  contracts: ['ai-hub/1', 'task-request/2', 'task-result/1'],
  capabilities: Object.fromEntries(featureNames.map(key => [key, true])),
  limits: { maxWorkers: 8, maxParallel: 2 }, tools, scope: { projectId: 'project' },
});

test('AI Hub profile is independently scoped and negotiates only authorized supported features', () => {
  assert.deepEqual(validateHubProfile(profile(), 'project'), { valid: true, errors: [] });
  assert.equal(validateHubProfile(profile(), 'another').valid, false);
  const disabled = negotiateHubProfile(profile(), { projectId: 'project' });
  assert.equal(Object.values(disabled.capabilities).some(Boolean), false);
  assert.equal(disabled.limits.maxParallel, 1);
  const negotiated = negotiateHubProfile(profile(), {
    projectId: 'project', supported: profile().capabilities,
    authorizedTools: tools.filter(id => id !== 'agent_pool_reset' && id !== 'agent_pool_send'),
  });
  assert.equal(negotiated.capabilities.pool, true);
  assert.equal(negotiated.capabilities.reset, false);
  assert.equal(negotiated.capabilities.peerMessaging, false);
  assert.equal(negotiated.capabilities.retain, true);
  const adapterLimited = negotiateHubProfile(profile(), {
    projectId: 'project', supported: { ...profile().capabilities, reset: false, peerMessaging: false },
    authorizedTools: tools,
  });
  assert.equal(adapterLimited.tools.includes('agent_pool_reset'), false);
  assert.equal(adapterLimited.tools.includes('agent_pool_send'), false);
  assert.equal(adapterLimited.tools.includes('agent_pool_receive'), false);
});

test('AI Hub rejects unknown versions, malformed shapes and contradictory advertised capabilities', () => {
  for (const patch of [
    { version: 2 }, { capabilities: null }, { tools: {} }, { contracts: {} },
    { extra: true }, { limits: { maxWorkers: 1, maxParallel: 2 } },
    { tools: tools.filter(id => id !== 'agent_pool_resume') },
    { capabilities: { ...profile().capabilities, pool: false } },
    { capabilities: { ...profile().capabilities, state: false } },
    { capabilities: { ...profile().capabilities, parallel: false } },
  ]) {
    const candidate = { ...profile(), ...patch };
    assert.equal(validateHubProfile(candidate).valid, false, JSON.stringify(patch));
    assert.throws(() => negotiateHubProfile(candidate), /Invalid AI Hub profile/);
  }
  const sequential = profile();
  sequential.capabilities.parallel = false;
  sequential.capabilities.peerMessaging = false;
  sequential.limits.maxParallel = 1;
  sequential.tools = tools.filter(id => !['agent_pool_send', 'agent_pool_receive'].includes(id));
  assert.equal(validateHubProfile(sequential).valid, true);
  const negotiated = negotiateHubProfile(sequential, {
    supported: profile().capabilities, authorizedTools: tools,
  });
  assert.equal(negotiated.capabilities.parallel, false);
  assert.equal(negotiated.capabilities.peerMessaging, false);
  assert.equal(negotiated.capabilities.retain, true);
  assert.equal(negotiated.limits.maxParallel, 1);
});

test('dependency-free canonical validator preserves runtime contracts and rejects malformed task shapes', () => {
  const request = {
    version: 2, request_id: 'request', caller: { agent: 'coordinator', return_mode: null },
    coordination: 'collaborate', objective: 'Bounded task', constraints: ['Read only'],
    tasks: [{ id: 'task', depends_on: [],
      transport: { kind: 'thread', dispatch_tool: 'agent_pool_spawn', agent: 'worker', thread_id: null },
      tools: [], resources: { read: [], write: [] }, state: 'pending',
      acceptance: ['Provide findings'], return: 'task-result/1' }],
  };
  assert.deepEqual(validateRequest(request), runtime.validateRequest(request));
  for (const bad of [null, { ...request, tasks: [null] },
    { ...request, tasks: [{ ...request.tasks[0], context: 'not an object' }] }]) {
    assert.equal(validateRequest(bad).valid, false);
  }
  const result = { id: 'task', status: 'ok', summary: 'Verified transport, not acceptance',
    artifacts: [], errors: [], next: [], thread_id: 'assigned-worker' };
  assert.deepEqual(validateResult(result, request), runtime.validateResult(result, request));
  assert.equal(validateResult({ ...result, id: 'other' }, request).valid, false);
  assert.equal(validateResult({ ...result, status: 'ok', errors: [{ code: 'failure', message: 'failed' }] }).valid, false);
  assert.equal(validateResult({ ...result, extra: true }).valid, false);
  assert.equal(validateResult('plain text').valid, false);
  const source = readFileSync(new URL('../../prompts/hard_points/system/orchestrator/exchange.mjs', import.meta.url), 'utf8');
  assert.doesNotMatch(source, /node:|readFile|policy\.json/);
});
