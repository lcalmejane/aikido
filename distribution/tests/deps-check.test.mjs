import { after, test } from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { mkdirSync, mkdtempSync, realpathSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { checkDependencies, gap, parseFile, runDepsCLI } from '../lib/deps-check.mjs';

const roots = [];
after(() => roots.forEach(path => rmSync(path, { recursive: true, force: true })));
function workspace() {
  const root = realpathSync(mkdtempSync(join(tmpdir(), 'aikido-deps-'))); roots.push(root);
  for (const name of ['alpha', 'beta']) mkdirSync(join(root, name, '.git'), { recursive: true });
  mkdirSync(join(root, 'alpha/node_modules/skip'), { recursive: true });
  writeFileSync(join(root, 'alpha/node_modules/skip/package.json'), JSON.stringify({ dependencies: { hidden: '1.0.0' } }));
  writeFileSync(join(root, 'alpha/package.json'), JSON.stringify({ dependencies: { old: '^1.0.0', current: '2.0.0', '@corp/private': '1.0.0', local: 'file:../x' } }));
  writeFileSync(join(root, 'alpha/.npmrc'), '@corp:registry=https://npm.corp.test/\n');
  writeFileSync(join(root, 'beta/Dockerfile'), 'ARG TOOL=9.9.9\nFROM node:24-slim AS base\nFROM base\nRUN curl https://github.com/acme/tool/releases/download/v${TOOL}/tool.tgz\n');
  return root;
}
const fake = () => { const calls = []; return { calls, fetcher: async (url, init = {}) => {
  const text = String(url); calls.push(text);
  const json = (body, status = 200) => Object.assign(Response.json(body, { status }), { });
  if (text.endsWith('/old')) return json({ versions: { '1.0.0': {} }, 'dist-tags': { latest: '2.1.0' } });
  if (text.endsWith('/current')) return json({ versions: { '2.0.0': {} }, 'dist-tags': { latest: '2.0.0' } });
  if (text.includes('hub.docker.com')) return json({ results: [{ name: '24-slim' }, { name: '26-slim' }, { name: '26-alpine' }] });
  if (text.endsWith('/releases/tag/v9.9.9')) return new Response(null, { status: 404 });
  if (text.endsWith('/releases/latest')) return { status: 200, url: 'https://github.com/acme/tool/releases/tag/v1.2.0' };
  return new Response(null, { status: 404 });
} }; };

test('version gaps follow the precision of the pinned version', () => {
  assert.deepEqual([gap('1.2.3', '2.0.0'), gap('1.2.3', '1.3.0'), gap('1.2.3', '1.2.4'), gap('1.2.3', '1.2.3'), gap('24', '24.9.1'), gap('v1', 'next')],
    ['major', 'minor', 'patch', 'ok', 'ok', 'unknown']);
});

test('any workspace is discovered generically, repository by repository', async () => {
  const report = await checkDependencies({ root: workspace(), fetcher: fake().fetcher });
  assert.deepEqual(report.projects.map(project => project.name), ['alpha', 'beta']);
  const status = Object.fromEntries(report.dependencies.map(entry => [entry.name, entry.status]));
  assert.deepEqual(status, { old: 'major', current: 'ok', node: 'major', 'acme/tool': 'missing' });
});

test('private scopes and offline mode send nothing to public sources', async () => {
  const root = workspace(), online = fake();
  await checkDependencies({ root, fetcher: online.fetcher });
  assert.equal(online.calls.some(url => url.includes('corp')), false);
  const offline = fake();
  const report = await checkDependencies({ root, offline: true, fetcher: offline.fetcher });
  assert.deepEqual([offline.calls.length, report.summary.unknown], [0, 4]);
});

test('accepted versions are ignored, and the exit code follows the requested level', async () => {
  const root = workspace();
  assert.equal((await runDepsCLI(['deps', 'check', '--root', root], { fetcher: fake().fetcher })).exitCode, 1);
  writeFileSync(join(root, '.aikido-deps.json'), JSON.stringify({ ignore: [{ name: 'acme/tool', reason: 'internal build' }] }));
  assert.equal((await runDepsCLI(['deps', 'check', '--root', root], { fetcher: fake().fetcher })).exitCode, 0);
  assert.equal((await runDepsCLI(['deps', 'check', '--root', root, '--fail-on', 'major'], { fetcher: fake().fetcher })).exitCode, 1);
  assert.equal((await runDepsCLI(['deps', 'check', '--bad'], { fetcher: fake().fetcher })).exitCode, 2);
});

test('local images, version ranges and ignored directories are not reported as missing', async () => {
  const root = workspace();
  writeFileSync(join(root, 'beta/docker-compose.yml'), 'services:\n  a:\n    image: local-app:dev\n    build:\n      context: .\n  b:\n    image: redis:7\n');
  assert.deepEqual(parseFile('docker-compose.yml', 'services:\n  a:\n    image: local-app:dev\n    build:\n      context: .\n  b:\n    image: redis:7\n').map(entry => entry.name), ['redis']);
  const [range] = parseFile('package.json', JSON.stringify({ dependencies: { typescript: '^5.9.0' } }));
  assert.equal(range.exact, false);
  execFileSync('git', ['init', '-q'], { cwd: join(root, 'alpha') });
  writeFileSync(join(root, 'alpha/.gitignore'), 'third-party/\n');
  mkdirSync(join(root, 'alpha/third-party/copy/.git'), { recursive: true });
  writeFileSync(join(root, 'alpha/third-party/copy/package.json'), JSON.stringify({ dependencies: { foreign: '1.0.0' } }));
  const report = await checkDependencies({ root, offline: true });
  assert.equal(report.dependencies.some(entry => entry.name === 'foreign'), false);
});

test('every Dockerfile variant exposes its pinned tools', () => {
  const text = 'FROM node:24-slim\nARG TOOL_VERSION=0.5.0\nRUN npm install --prefix /opt --omit=dev playwright@1.56.1 @scope/kit@2.0.0\nRUN cargo install fast-grep --version "${TOOL_VERSION}" --locked\nRUN pip install rich==13.1.0\n';
  for (const name of ['Dockerfile', 'Dockerfile.ide', 'api.Dockerfile']) {
    assert.deepEqual(parseFile(name, text).map(entry => `${entry.ecosystem}:${entry.name}@${entry.version}`),
      ['docker:node@24-slim', 'npm:playwright@1.56.1', 'npm:@scope/kit@2.0.0', 'pypi:rich@13.1.0', 'crates:fast-grep@0.5.0']);
  }
});

test('manifests of each ecosystem are parsed without executing anything', () => {
  assert.deepEqual(parseFile('Cargo.toml', '[dependencies]\nserde = "1.0"\nlocal = { path = "../x" }\ntokio = { version = "1.4" }\n').map(entry => [entry.name, entry.version]), [['serde', '1.0'], ['tokio', '1.4']]);
  assert.deepEqual(parseFile('requirements.txt', 'flask==3.0.1\n# note\nrich>=13\n').map(entry => entry.name), ['flask', 'rich']);
  assert.deepEqual(parseFile('docker-compose.yml', 'services:\n  a:\n    image: ${IMG:-redis:7}\n').map(entry => [entry.name, entry.version]), [['redis', '7']]);
  assert.deepEqual(parseFile('Dockerfile', 'FROM x:1\nRUN code --install-extension acme.tool@1.2.3\n').at(-1).ecosystem, 'openvsx');
});
