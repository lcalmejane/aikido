import { test } from 'node:test';
import assert from 'node:assert/strict';
import { spawn, spawnSync } from 'node:child_process';
import {
  existsSync, lstatSync, mkdirSync, mkdtempSync, readFileSync, realpathSync, rmSync, writeFileSync,
} from 'node:fs';
import { EventEmitter } from 'node:events';
import { createServer } from 'node:http';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { PassThrough } from 'node:stream';
import { fileURLToPath } from 'node:url';
import {
  classifyFile, shouldIgnore, watchProject,
} from '../../prompts/hard_points/system/structure/scripts/watch-changes.mjs';

const engine = fileURLToPath(new URL('../../prompts/hard_points/system/structure/scripts/watch-changes.mjs', import.meta.url));
function fixture(t) {
  const directory = mkdtempSync(join(realpathSync(tmpdir()), 'aikido-watch-test-'));
  const root = join(directory, 'project');
  mkdirSync(root);
  t.after(() => rmSync(directory, { recursive: true, force: true }));
  return root;
}

function run(root, command, ...args) {
  return spawnSync(process.execPath, [engine, command, ...args], {
    cwd: root,
    env: { ...process.env, PROJECT_ROOT: root },
    encoding: 'utf8',
    timeout: 10000,
  });
}

function runAsync(root, command, ...args) {
  return new Promise(resolve => {
    const child = spawn(process.execPath, [engine, command, ...args], {
      cwd: root,
      env: { ...process.env, PROJECT_ROOT: root },
      stdio: ['ignore', 'pipe', 'pipe'],
    });
    let stdout = '';
    let stderr = '';
    child.stdout.setEncoding('utf8').on('data', chunk => { stdout += chunk; });
    child.stderr.setEncoding('utf8').on('data', chunk => { stderr += chunk; });
    child.once('close', status => resolve({ status, stdout, stderr }));
  });
}

function waitFor(predicate, timeoutMs = 5000) {
  const deadline = Date.now() + timeoutMs;
  return new Promise((resolve, reject) => {
    const check = () => {
      if (predicate()) return resolve();
      if (Date.now() >= deadline) return reject(new Error('Timed out waiting for watcher state'));
      setTimeout(check, 25);
    };
    check();
  });
}

const watcherTimeout = process.platform === 'win32' ? 10000 : 3000;

test('watcher classifies and excludes known generated and temporary paths', () => {
  assert.equal(classifyFile('prompts/gen/personas/agent.md'), 'memory_bank_personas');
  assert.equal(classifyFile('prompts/hard_points/rule.md'), 'hard_points');
  assert.equal(classifyFile('README.md'), 'documentation');
  assert.equal(shouldIgnore('node_modules/file.js'), true);
  assert.equal(shouldIgnore('prompts/hard_points/system/structure/index.json'), true);
  assert.equal(shouldIgnore('prompts/spec/system/structure/cache/watch.log'), true);
  assert.equal(shouldIgnore('src/output.tmp'), true);
  assert.equal(shouldIgnore('src/keep.md', ['*.md']), true);
});

test('watcher rebuilds on unknown events and inspection errors, and drains queued publication on stop', async t => {
  const root = fixture(t);
  const callbacks = new Map();
  const closed = [];
  const children = [];
  const logs = [];
  const deniedPath = join(root, 'denied.md');
  const watcher = watchProject(root, { batchTimeout: 0, excludes: [] }, (level, message) => {
    logs.push(`[${level}] ${message}`);
  }, {
    watchDirectory(path, options, callback) {
      callbacks.set(path, callback);
      return { close() { closed.push(path); } };
    },
    inspectPath(path) {
      if (path === deniedPath) throw Object.assign(new Error('permission denied'), { code: 'EACCES' });
      return lstatSync(path);
    },
    startGenerator() {
      const child = new EventEmitter();
      child.stdout = new PassThrough();
      child.stderr = new PassThrough();
      children.push(child);
      return child;
    },
  });
  let stopped = false;
  t.after(async () => {
    if (stopped) return;
    const stopping = watcher.stop();
    for (const child of children) child.emit('close', 0, null);
    await stopping;
  });

  callbacks.get(root)('rename', null);
  await waitFor(() => children.length === 1);
  assert.match(logs.join('\n'), /has no filename; scheduling a full rebuild/);

  callbacks.get(root)('rename', 'denied.md');
  await waitFor(() => logs.some(line => line.includes('Index regeneration already running')));
  assert.match(logs.join('\n'), /Cannot inspect changed path denied\.md: permission denied/);

  const stopping = watcher.stop().then(() => { stopped = true; });
  await new Promise(resolve => setImmediate(resolve));
  assert.equal(stopped, false);
  children[0].emit('close', 0, null);
  await waitFor(() => children.length === 2);
  assert.equal(stopped, false);
  children[1].emit('close', 0, null);
  await stopping;
  assert.equal(stopped, true);
  assert.deepEqual(closed, [root]);
});

test('Node watcher CLI displays help without starting a watcher', t => {
  const root = fixture(t);
  const result = spawnSync(process.execPath, [engine, '--help'], {
    cwd: root,
    env: { ...process.env, PROJECT_ROOT: root },
    encoding: 'utf8',
  });
  assert.equal(result.status, 0, result.stderr);
  assert.match(result.stdout, /watch-changes\.mjs/);
});

test('daemon uses nested Git ignore rules and rebuilds for documentation and other file changes', async t => {
  const root = fixture(t);
  writeFileSync(join(root, '.gitignore'), 'hidden/\nreopened/*\n!reopened/keep.txt\n');
  mkdirSync(join(root, 'docs'), { recursive: true });
  writeFileSync(join(root, 'docs/.gitignore'), '*.private\n!important.private\n');
  mkdirSync(join(root, 'reopened'), { recursive: true });
  writeFileSync(join(root, 'reopened/drop.txt'), 'ignored\n');
  writeFileSync(join(root, 'reopened/keep.txt'), 'included\n');
  let started = false;
  t.after(async () => {
    if (started) run(root, 'stop');
    const pid = join(root, 'prompts/spec/system/structure/cache/watch.pid');
    const lock = join(root, 'prompts/spec/system/structure/cache/watch.start-lock');
    try { await waitFor(() => !existsSync(pid) && !existsSync(lock), 3000); } catch {}
  });
  const start = run(root, 'start', '--batch-timeout=1', '--no-notify');
  assert.equal(start.status, 0, `${start.stdout}\n${start.stderr}`);
  started = true;
  assert.match(start.stdout, /Watch daemon started/);
  const status = run(root, 'status');
  assert.equal(status.status, 0, status.stderr);
  assert.match(status.stdout, /Watch daemon running/);
  const secondStart = run(root, 'start');
  assert.equal(secondStart.status, 1);
  assert.match(secondStart.stderr, /already running/);
  const log = join(root, 'prompts/spec/system/structure/cache/watch.log');
  writeFileSync(join(root, 'reopened/drop.txt'), 'ignored update\n');
  writeFileSync(join(root, 'docs', 'ignored.private'), 'ignored\n');
  mkdirSync(join(root, 'hidden'), { recursive: true });
  writeFileSync(join(root, 'hidden', 'ignored.md'), 'ignored\n');
  await new Promise(resolve => setTimeout(resolve, 300));
  assert.equal(existsSync(log) && readFileSync(log, 'utf8').includes('Processing batch'), false);
  writeFileSync(join(root, 'reopened/keep.txt'), 'included update\n');
  writeFileSync(join(root, 'docs', 'important.private'), 're-included\n');
  await waitFor(() => existsSync(log) && readFileSync(log, 'utf8').includes('Processing batch'), watcherTimeout);
  let batchCount = readFileSync(log, 'utf8').match(/Processing batch/g)?.length ?? 0;
  assert.ok(batchCount > 0);
  assert.match(readFileSync(log, 'utf8'), /Project changes .* other/);
  writeFileSync(join(root, 'docs', 'README.md'), 'documentation change\n');
  await waitFor(() => (readFileSync(log, 'utf8').match(/Processing batch/g)?.length ?? 0) > batchCount, watcherTimeout);
  batchCount = readFileSync(log, 'utf8').match(/Processing batch/g)?.length ?? 0;
  assert.match(readFileSync(log, 'utf8'), /Project changes .* documentation/);
  writeFileSync(join(root, 'assets.bin'), Buffer.from([0, 1, 2]));
  await waitFor(() => (readFileSync(log, 'utf8').match(/Processing batch/g)?.length ?? 0) > batchCount, watcherTimeout);
  batchCount = readFileSync(log, 'utf8').match(/Processing batch/g)?.length ?? 0;
  assert.match(readFileSync(log, 'utf8'), /Project changes .* other/);
  writeFileSync(join(root, '.gitignore'), '');
  await waitFor(() => (readFileSync(log, 'utf8').match(/Processing batch/g)?.length ?? 0) > batchCount, watcherTimeout);
  batchCount = readFileSync(log, 'utf8').match(/Processing batch/g)?.length ?? 0;
  writeFileSync(join(root, 'hidden', 'visible.md'), 'newly visible after ignore change\n');
  await waitFor(() => (readFileSync(log, 'utf8').match(/Processing batch/g)?.length ?? 0) > batchCount, 3000);
  assert.match(readFileSync(log, 'utf8'), /Project changes .* documentation/);
  const stop = run(root, 'stop');
  assert.equal(stop.status, 0, stop.stderr);
  assert.match(stop.stdout, /Watch daemon stopping/);
  const cache = join(root, 'prompts/spec/system/structure/cache');
  await waitFor(() => !existsSync(join(cache, 'watch.pid')) && !existsSync(join(cache, 'watch.start-lock')));
  assert.equal(existsSync(join(cache, 'watch.pid')), false);
  assert.equal(existsSync(join(cache, 'watch.start-lock')), false);
  const finalLog = readFileSync(log, 'utf8');
  assert.match(finalLog, /Index generation failed: Missing structure directory/);
  assert.doesNotMatch(finalLog, /Index regeneration completed successfully/);
  const stopped = run(root, 'status');
  assert.equal(stopped.status, 0);
  assert.match(stopped.stdout, /not running/);
  started = false;
});

test('watcher rejects invalid timeouts and deprecates the side-effectful test command', t => {
  const root = fixture(t);
  assert.equal(existsSync(join(root, 'prompts/spec/system/structure/cache')), false);
  const invalid = run(root, 'watch', '--batch-timeout=-1');
  assert.equal(invalid.status, 1);
  assert.match(invalid.stderr, /number from 0 to 3600/);
  const legacy = run(root, 'test');
  assert.equal(legacy.status, 1);
  assert.match(legacy.stderr, /deprecated/);
});

test('daemon startup reports Git dependency failures without a readiness timeout', async t => {
  const root = fixture(t);
  const result = spawnSync(process.execPath, [engine, 'start'], {
    cwd: root,
    env: { ...process.env, PROJECT_ROOT: root, PATH: join(root, 'no-git') },
    encoding: 'utf8',
    timeout: 10000,
  });
  assert.equal(result.status, 1);
  assert.match(result.stderr, /Watcher startup failed: Git execution failed/);
  assert.equal(existsSync(join(root, 'prompts/spec/system/structure/cache/watch.pid')), false);
  await waitFor(() => !existsSync(join(root, 'prompts/spec/system/structure/cache/watch.start-lock')));
});

test('concurrent starts allow only one daemon and preserve its lock through shutdown', async t => {
  const root = fixture(t);
  let running = false;
  t.after(async () => {
    if (!running && !existsSync(join(root, 'prompts/spec/system/structure/cache/watch.pid'))) return;
    run(root, 'stop');
    const cache = join(root, 'prompts/spec/system/structure/cache');
    await waitFor(() => !existsSync(join(cache, 'watch.pid')) && !existsSync(join(cache, 'watch.start-lock')));
  });
  const starts = await Promise.all([runAsync(root, 'start'), runAsync(root, 'start')]);
  assert.equal(starts.filter(result => result.status === 0).length, 1, JSON.stringify(starts));
  assert.equal(starts.filter(result => result.status === 1).length, 1, JSON.stringify(starts));
  assert.match(starts.find(result => result.status === 1).stderr, /already running|start lock/);
  running = true;
  const cache = join(root, 'prompts/spec/system/structure/cache');
  assert.equal(existsSync(join(cache, 'watch.pid')), true);
  assert.equal(existsSync(join(cache, 'watch.start-lock')), true);
  const stop = run(root, 'stop');
  assert.equal(stop.status, 0, stop.stderr);
  await waitFor(() => !existsSync(join(cache, 'watch.pid')) && !existsSync(join(cache, 'watch.start-lock')));
  running = false;
});

test('stop refuses an unverified reused-port process and preserves daemon state', async t => {
  const root = fixture(t);
  const cache = join(root, 'prompts/spec/system/structure/cache');
  mkdirSync(cache, { recursive: true });
  const token = 'a'.repeat(64);
  let stopRequests = 0;
  const server = createServer((request, response) => {
    if (request.method === 'POST') stopRequests++;
    response.writeHead(200, { 'content-type': 'application/json' });
    response.end(JSON.stringify({
      status: request.method === 'GET' ? 'running' : 'stopping',
      marker: 'aikido-watch-v1',
      pid: 2147483647,
      root,
      nonce: request.headers['x-aikido-watch-nonce'],
      proof: '0'.repeat(64),
    }));
  });
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  t.after(() => new Promise(resolve => server.close(resolve)));
  const state = {
    marker: 'aikido-watch-v1',
    pid: 2147483647,
    port: server.address().port,
    token,
    root,
  };
  writeFileSync(join(cache, 'watch.pid'), `${JSON.stringify(state)}\n`, { mode: 0o600 });
  writeFileSync(join(cache, 'watch.start-lock'), `${JSON.stringify({
    marker: 'aikido-watch-start-v1',
    token,
    root,
  })}\n`, { mode: 0o600 });

  const stop = run(root, 'stop');
  assert.equal(stop.status, 1);
  assert.match(stop.stderr, /identity cannot be verified/i);
  assert.equal(stopRequests, 0);
  assert.equal(existsSync(join(cache, 'watch.pid')), true);
  assert.equal(existsSync(join(cache, 'watch.start-lock')), true);
  assert.doesNotMatch(readFileSync(engine, 'utf8'), /process\.kill\s*\(/);
});

test('orphaned start lock blocks another daemon when identity cannot be verified', t => {
  const root = fixture(t);
  const cache = join(root, 'prompts/spec/system/structure/cache');
  mkdirSync(cache, { recursive: true });
  writeFileSync(join(cache, 'watch.start-lock'), `${JSON.stringify({
    marker: 'aikido-watch-start-v1',
    token: 'b'.repeat(64),
    root,
  })}\n`, { mode: 0o600 });
  const start = run(root, 'start');
  assert.equal(start.status, 1);
  assert.match(start.stderr, /identity cannot be verified.*refusing a second daemon/i);
  assert.equal(existsSync(join(cache, 'watch.pid')), false);
  assert.equal(existsSync(join(cache, 'watch.start-lock')), true);
});

test('watcher refuses to signal a legacy PID-only state file', t => {
  const root = fixture(t);
  const cache = join(root, 'prompts/spec/system/structure/cache');
  mkdirSync(cache, { recursive: true });
  writeFileSync(join(cache, 'watch.pid'), `${process.pid}\n`);
  const stop = run(root, 'stop');
  assert.equal(stop.status, 1);
  assert.match(stop.stderr, /cannot be stopped safely/);
  assert.equal(existsSync(join(cache, 'watch.pid')), true);
  assert.equal(existsSync(join(cache, 'watch.start-lock')), false);
});
