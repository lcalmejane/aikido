import { after, test } from 'node:test';
import assert from 'node:assert/strict';
import { chmodSync, existsSync, mkdirSync, mkdtempSync, readFileSync, realpathSync, rmSync, writeFileSync } from 'node:fs';
import { createServer } from 'node:http';
import { homedir, tmpdir } from 'node:os';
import { join } from 'node:path';
import { runHostedTaskCLI } from '../lib/task-store/hosted-cli.mjs';

const roots = [];
const temp = (base = tmpdir()) => { const path = realpathSync(mkdtempSync(join(base, 'aikido-hosted-'))); roots.push(path); return path; };
after(() => roots.forEach(path => rmSync(path, { recursive: true, force: true })));
const privateRoot = temp(homedir());
const env = { HOME: privateRoot, AIKIDO_TASK_STORE_DIR: join(privateRoot, 'store') };
const draft = { label: 'Revue sécurité', steps: [{ label: 'Cadrer', type: 'plan' }, { label: 'Auditer', type: 'dispatch' }, { label: 'Valider', type: 'approve' }] };
const run = (cwd, ...argv) => runHostedTaskCLI([...argv, '--store', join(privateRoot, 'store', cwd.split('/').at(-1))], { cwd, env: {} });
const plain = (cwd, ...argv) => runHostedTaskCLI(argv, { cwd, env: {} });

async function fakeCore(tools = ['workflows_list', 'workflow_save', 'workflow_delete', 'cards_list', 'card_command', 'sessions_list', 'session_create']) {
  const calls = [];
  const server = createServer((request, response) => {
    let text = '';
    request.on('data', chunk => { text += chunk; });
    request.on('end', () => {
      const { id, method, params } = JSON.parse(text);
      calls.push({ method, name: params?.name, args: params?.arguments, project: request.headers['x-tatami-project'], auth: request.headers.authorization });
      const answers = { workflows_list: { workflows: [{ id: 'automatic' }] }, workflow_save: { id: 'revue-securite', version: '1.0.0' },
        cards_list: { enabled: true, cards: [{ id: 'c1', session: 's9', state: 'review', workflowId: 'automatic', revision: 3 }] },
        sessions_list: [], session_create: { id: 's-new' }, card_command: { task: { id: 'c2', revision: 1 }, job: { id: 'j1' } }, workflow_delete: { deleted: true } };
      const result = method === 'tools/list' ? { tools: tools.map(name => ({ name })) }
        : method === 'tools/call' ? { content: [{ type: 'text', text: JSON.stringify(answers[params.name]) }] } : {};
      response.setHeader('content-type', 'application/json');
      response.end(JSON.stringify({ jsonrpc: '2.0', id, result }));
    });
  });
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  after(() => server.close());
  return { calls, url: `http://127.0.0.1:${server.address().port}/mcp` };
}
function link(workspace, url, runtime = join(temp(), 'runtime.json')) {
  writeFileSync(runtime, JSON.stringify({ url, headers: { authorization: 'Bearer local' } }));
  chmodSync(runtime, 0o600);
  writeFileSync(join(workspace, '.mcp.json'), JSON.stringify({ mcpServers: { 'tatami-core-agent': { command: 'x', args: ['--runtime', runtime, '--header', 'x-tatami-project=p1'] } } }));
  return runtime;
}

test('knowledge base alone: workflows are versioned files, usable by local cards', async () => {
  const workspace = temp();
  mkdirSync(join(workspace, 'prompts'));
  writeFileSync(join(workspace, 'draft.json'), JSON.stringify(draft));
  const saved = await run(workspace, 'workflow', 'save', '--file', 'draft.json');
  assert.deepEqual([saved.exitCode, saved.result.route, saved.result.workflow.version], [0, 'local', '1.0.0']);
  assert.ok(existsSync(join(workspace, 'prompts/gen/workflows/revue-securite/1.0.0.json')));
  assert.equal((await run(workspace, 'workflow', 'save', '--file', 'draft.json')).result.workflow.version, '1.0.0');
  assert.ok((await run(workspace, 'workflow', 'list')).result.workflows.some(item => item.id === 'revue-securite'));
  writeFileSync(join(workspace, 'card.json'), JSON.stringify({ title: 'Audit', workflowId: 'revue-securite' }));
  const card = await run(workspace, 'task', 'create', '--file', 'card.json');
  assert.equal(card.exitCode, 0, JSON.stringify(card.result));
  assert.equal(card.result.task.workflowId, 'revue-securite');
  assert.equal((await run(workspace, 'workflow', 'delete', 'revue-securite')).result.code, 'confirmation_required');
});

test('hard points are read-only and win over project files', async () => {
  const workspace = temp();
  const directory = join(workspace, 'prompts/hard_points/workflows/revue-securite');
  mkdirSync(directory, { recursive: true });
  writeFileSync(join(directory, '1.0.0.json'), JSON.stringify({ schemaVersion: 'workflow/1', id: 'revue-securite', version: '1.0.0', entryStepId: 'a', terminalStepIds: ['b'],
    steps: [{ id: 'a', type: 'dispatch', transitions: ['b'] }, { id: 'b', type: 'wait', transitions: [] }] }));
  writeFileSync(join(workspace, 'draft.json'), JSON.stringify(draft));
  assert.equal((await run(workspace, 'workflow', 'save', '--file', 'draft.json')).result.code, 'workflow_reserved');
  assert.equal((await run(workspace, 'workflow', 'show', 'revue-securite')).result.workflow.source, 'hard-point');
});

test('Core Agent present: workflows and cards go through it, nothing is written locally', async () => {
  const core = await fakeCore();
  const workspace = temp();
  mkdirSync(join(workspace, 'prompts'));
  link(workspace, core.url);
  writeFileSync(join(workspace, 'draft.json'), JSON.stringify(draft));
  assert.deepEqual((await plain(workspace, 'host', 'status')).result.coreAgent, { available: true, source: 'runtime', project: 'p1' });
  const saved = await plain(workspace, 'workflow', 'save', '--file', 'draft.json');
  assert.deepEqual([saved.result.route, saved.result.workflow.id], ['core-agent', 'revue-securite']);
  assert.equal(existsSync(join(workspace, 'prompts/gen/workflows')), false);
  assert.equal(core.calls.find(call => call.name === 'workflow_save').project, 'p1');
  const listed = (await plain(workspace, 'task', 'list', '--state', 'review', '--store', join(privateRoot, 'store', 'core'))).result.tasks[0];
  assert.deepEqual([listed.id, listed.location], ['c1', 'core-agent']);
  await plain(workspace, 'task', 'accept', 'c1', '--accepted', 'true', '--revision', '3');
  assert.deepEqual(core.calls.find(call => call.name === 'card_command').args, { session: 's9', command: 'accept', input: { accepted: true }, taskId: 'c1', expectedRevision: 3 });
  writeFileSync(join(workspace, 'card.json'), JSON.stringify({ title: 'Audit' }));
  await plain(workspace, 'task', 'create', '--file', 'card.json');
  assert.equal(core.calls.filter(call => call.name === 'card_command').at(-1).args.session, 's-new');
  await plain(workspace, 'task', 'stop', 'c1');
  assert.deepEqual((({ command, expectedRevision }) => [command, expectedRevision])(core.calls.filter(call => call.name === 'card_command').at(-1).args), ['pause', 3]);
  assert.equal((await plain(workspace, 'task', 'delete', 'c1')).result.code, 'confirmation_required');
  await plain(workspace, 'task', 'delete', 'c1', '--confirm');
  assert.equal(core.calls.filter(call => call.name === 'card_command').at(-1).args.command, 'delete');
  writeFileSync(join(workspace, 'prompt.txt'), 'Audit complet');
  await plain(workspace, 'task', 'launch', '--prompt-file', 'prompt.txt', '--workflow', 'revue-securite');
  const [create, schedule] = core.calls.filter(call => call.name === 'card_command').slice(-2).map(call => call.args);
  assert.deepEqual([create.command, create.input.workflowId, schedule.command, schedule.taskId], ['create', 'revue-securite', 'schedule', 'c2']);
  assert.equal((await plain(workspace, 'workflow', 'list', '--local')).result.route, 'local');
});

test('stopped, older or untrusted Core Agent: AI-KIDO keeps working locally', async () => {
  const stopped = temp();
  link(stopped, 'http://127.0.0.1:9/mcp');
  assert.deepEqual([(await plain(stopped, 'host', 'status')).result.route, (await plain(stopped, 'host', 'status')).result.coreAgent.reason], ['local', 'Core Agent is not reachable']);
  const older = temp();
  link(older, (await fakeCore(['cards_list'])).url);
  assert.match((await plain(older, 'host', 'status')).result.coreAgent.reason, /too old/);
  const cloned = temp();
  link(cloned, (await fakeCore()).url, join(cloned, 'runtime.json'));
  assert.equal((await plain(cloned, 'host', 'status')).result.coreAgent.reason, 'runtime file inside the workspace');
  const remote = temp();
  link(remote, 'http://example.test/mcp');
  assert.equal((await plain(remote, 'host', 'status')).result.coreAgent.reason, 'runtime URL is not local');
  assert.equal(readFileSync(join(remote, '.mcp.json'), 'utf8').includes('tatami-core-agent'), true);
});

test('local cards: every command works without a Core Agent, including stop and delete', async () => {
  const workspace = temp();
  writeFileSync(join(workspace, 'card.json'), JSON.stringify({ title: 'Local', state: 'ready' }));
  const { task } = (await run(workspace, 'task', 'create', '--file', 'card.json')).result;
  assert.equal((await run(workspace, 'task', 'stop', task.id)).result.task.state, 'waiting');
  assert.equal((await run(workspace, 'task', 'launch', task.id)).result.code, 'host_unavailable');
  assert.equal((await run(workspace, 'task', 'cancel', task.id)).result.task.state, 'cancelled');
  assert.equal((await run(workspace, 'task', 'delete', task.id, '--confirm')).exitCode, 0);
  assert.equal((await run(workspace, 'task', 'show', task.id)).result.code, 'not_found');
});

test('saved remote connection: token kept outside the project and only sent to its address', async () => {
  const workspace = temp();
  mkdirSync(join(workspace, 'prompts'));
  const secret = 'remote-secret-token';
  const saved = await runHostedTaskCLI(['task', 'config', 'core-agent', 'set', '--url', 'https://core.test', '--project', 'p1', '--token-env', 'REMOTE'], { cwd: workspace, env: { REMOTE: secret } });
  assert.deepEqual(saved.result.connection, { configured: true, url: 'https://core.test', project: 'p1', token: true });
  assert.equal(readFileSync(join(workspace, 'prompts/spec/aikido/core-agent.json'), 'utf8').includes(secret), false);
  const seen = [];
  const fetcher = async (url, init) => { seen.push([String(url), init.headers.authorization]); return Response.json({ enabled: true, workflows: [], cards: [] }); };
  assert.equal((await runHostedTaskCLI(['host', 'status'], { cwd: workspace, env: {}, fetcher })).result.coreAgent.source, 'configuration');
  assert.deepEqual(seen[0], ['https://core.test/api/workspaces/p1/agent/board', `Bearer ${secret}`]);
  const file = join(workspace, 'prompts/spec/aikido/core-agent.json');
  writeFileSync(file, readFileSync(file, 'utf8').replace('https://core.test', 'https://evil.test'));
  const tampered = await runHostedTaskCLI(['host', 'status'], { cwd: workspace, env: {}, fetcher });
  assert.equal(tampered.result.coreAgent.reason, 'saved connection has no matching token');
  assert.equal(seen.length, 1);
  assert.equal((await runHostedTaskCLI(['task', 'config', 'core-agent', 'clear'], { cwd: workspace, env: {} })).result.connection.configured, false);
});
