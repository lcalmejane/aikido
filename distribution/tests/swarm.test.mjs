import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import { agentProfile, agentWrapper, rooModes } from '../scripts/build.mjs';
import { validateRequest, validateResult } from '../../prompts/hard_points/system/orchestrator/runtime.mjs';

const read = path => readFileSync(new URL(`../../${path}`, import.meta.url), 'utf8');
const catalog = JSON.parse(read('distribution/catalog.json'));
const policyPath = 'prompts/hard_points/system/orchestrator/swarm.md';

test('all generated agent formats reference the shared Swarm and lifecycle policy without widening tools', () => {
  const profiles = catalog.agents.map(agent => agentProfile(agent));
  for (const profile of profiles) {
    for (const format of ['claude-plugin', 'copilot', 'kiro', 'antigravity', 'codex']) {
      const text = agentWrapper(format, profile, profiles);
      assert.ok(text.includes(policyPath), `${format}: ${profile.name}`);
      assert.ok(text.includes('clean reuse requires'), `${format}: ${profile.name}`);
      assert.ok(text.includes('same-task'), `${format}: ${profile.name}`);
      assert.ok(text.includes('verified executor tools'), `${format}: ${profile.name}`);
      assert.ok(!/^\s*(swarm|reuse|peer_messaging):/m.test(text));
      if (format === 'claude-plugin') {
        assert.ok(text.includes('${CLAUDE_PLUGIN_ROOT}/payload/' + policyPath));
        const pinned = agentWrapper(format, { ...profile, projectSource: true }, profiles);
        assert.ok(pinned.includes('Read `' + policyPath + '`'));
        assert.ok(!pinned.includes('${CLAUDE_PLUGIN_ROOT}/payload/' + policyPath));
      }
    }
  }
  const modes = rooModes(profiles);
  assert.equal(modes.split(policyPath).length - 1, profiles.length);
  assert.deepEqual(profiles.find(profile => profile.name === 'agent-aikido-helper').capabilities, ['read']);
});

test('existing request and result contracts carry a bounded collaboration brief and provisional peer finding', () => {
  const policy = read(policyPath);
  const collaboration = JSON.parse(policy.match(/```json\n([\s\S]*?)\n```/)[1]);
  const request = {
    version: 2, request_id: 'swarm-example',
    caller: { agent: 'coordinator', return_mode: null }, coordination: 'collaborate',
    objective: 'Implement and prepare fixtures', constraints: ['Separate scopes'],
    tasks: [{
      id: 'implementation', depends_on: [],
      transport: { kind: 'thread', dispatch_tool: 'verified.launch', agent: 'worker', thread_id: 'verified-handle' },
      tools: [], resources: { read: [], write: ['src'] }, state: 'pending',
      context: { collaboration }, acceptance: ['Targeted tests pass'], return: 'task-result/1',
    }],
  };
  assert.deepEqual(validateRequest(request), { valid: true, errors: [] });
  const finding = {
    id: 'implementation', status: 'partial', summary: 'Provisional interface finding',
    thread_id: 'verified-handle', artifacts: [{ type: 'file', ref: 'src/api.mjs' }],
    errors: [], next: ['Coordinator to verify before dependency release'],
  };
  assert.deepEqual(validateResult(finding, request), { valid: true, errors: [] });
  assert.equal(request.tasks[0].acceptance_verified, undefined);
});

test('Swarm policy reaches installed instructions, creators and orchestrator with bounded disclosure', () => {
  for (const path of [
    'AGENTS.md', 'prompts/hard_points/ai-kido.md', 'prompts/hard_points/ai-kido-light.md',
    'distribution/templates/instructions/agents-block.md',
    'prompts/hard_points/commands/create-persona.md',
    'prompts/hard_points/commands/compile-agent-from-use.md',
    'prompts/hard_points/agents/agent-aikido-orchestrator.md',
    'prompts/hard_points/system/orchestrator/SKILL.md',
  ]) assert.ok(read(path).includes('swarm.md'), path);
  assert.ok(read('AGENTS.md').trimEnd().split('\n').length <= 100);
  assert.ok(read('prompts/hard_points/ai-kido.md').trimEnd().split('\n').length <= 100);
  assert.ok(read(policyPath).trimEnd().split('\n').length <= 500);
  assert.match(read(policyPath), /One-shot workers do not acquire follow-up support/);
  assert.match(read(policyPath), /peer message is not a final completion event/);
  assert.match(read(policyPath), /Do not request reset if the host restricts follow-ups to the same task/);
  assert.match(read(policyPath), /does not create workers/);
  const creator = read('prompts/hard_points/commands/create-persona.md');
  const templates = [...creator.matchAll(/```markdown\n([\s\S]*?)\n```/g)].map(match => match[1]);
  for (const section of ['## Agent Identity', '## Core Responsibilities', '**Full specification**']) {
    const template = templates.find(text => text.includes(section));
    assert.ok(template?.includes('swarm.md'), section);
    assert.ok(template.includes('verified host reset'), section);
    assert.ok(template.includes('fresh context'), section);
  }
  const compiler = read('prompts/hard_points/commands/compile-agent-from-use.md');
  const output = compiler.match(/```markdown\n(# Agent \[Usage\][\s\S]*?)\n```/)[1];
  assert.ok(output.includes('swarm.md'));
  assert.ok(output.includes('verified host reset'));
  assert.match(compiler, /8\. Collaboration: resolving link to swarm\.md in agent AND mapping/);
});
