import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { mkdtempSync, readFileSync, readdirSync, rmSync, writeFileSync } from 'node:fs';
import { syncBuiltinESMExports } from 'node:module';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createDaemonController } from '../../prompts/hard_points/system/structure/scripts/watch-daemon.mjs';

async function setup(t, watchProject) {
  const root = mkdtempSync(join(tmpdir(), 'aikido-watch-start-'));
  const token = 'a'.repeat(64);
  const previous = process.env.AIKIDO_WATCH_TOKEN;
  process.env.AIKIDO_WATCH_TOKEN = token;
  t.after(() => {
    if (previous === undefined) delete process.env.AIKIDO_WATCH_TOKEN;
    else process.env.AIKIDO_WATCH_TOKEN = previous;
    rmSync(root, { recursive: true, force: true });
  });
  writeFileSync(join(root, 'watch.start-lock'), JSON.stringify({ marker: 'aikido-watch-start-v1', token, root }));
  const logs = [];
  const controller = createDaemonController({
    filePath: (_root, name) => join(root, name),
    assertSafeFile: () => {},
    logFactory: () => (level, message) => logs.push([level, message]),
    watchProject,
    scriptPath: '',
  });
  return { root, logs, controller };
}

test('startup collision preserves foreign state and releases its own lock', async t => {
  let root;
  let stopped = false;
  const fixture = await setup(t, () => {
    writeFileSync(join(root, 'watch.pid'), 'foreign state');
    return { stop: async () => { stopped = true; } };
  });
  root = fixture.root;
  await assert.rejects(fixture.controller.runDaemon(root, { verbose: false }), /EEXIST/);
  assert.equal(stopped, true);
  assert.equal(readFileSync(join(root, 'watch.pid'), 'utf8'), 'foreign state');
  assert.deepEqual(readdirSync(root), ['watch.pid']);
  assert.match(fixture.logs.at(-1)[1], /Watcher startup failed/);
});

test('partial startup state is never published and owned temporary files and lock are removed', async t => {
  const fixture = await setup(t, () => ({ stop: async () => {} }));
  const original = fs.writeFileSync;
  fs.writeFileSync = (file, ...args) => {
    if (typeof file === 'number') {
      original(file, '{partial');
      throw new Error('injected partial write');
    }
    return original(file, ...args);
  };
  syncBuiltinESMExports();
  try {
    await assert.rejects(fixture.controller.runDaemon(fixture.root, { verbose: false }), /injected partial write/);
  } finally {
    fs.writeFileSync = original;
    syncBuiltinESMExports();
  }
  assert.deepEqual(readdirSync(fixture.root), []);
  assert.match(fixture.logs.at(-1)[1], /Watcher startup failed/);
});
