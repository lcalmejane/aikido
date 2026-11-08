import { test } from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { existsSync, mkdtempSync, readFileSync, rmSync, symlinkSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createLog } from '../../prompts/hard_points/system/maj/scripts/create-log.mjs';

const engine = fileURLToPath(new URL('../../prompts/hard_points/system/maj/scripts/create-log.mjs', import.meta.url));

function fixture(t) {
  const root = mkdtempSync(join(tmpdir(), 'aikido-log-'));
  t.after(() => rmSync(root, { recursive: true, force: true }));
  return root;
}

test('creates a formatted log, including multiline content and parent directories', (t) => {
  const root = fixture(t);
  const file = join(root, 'directory with spaces', 'startup.log');
  createLog(file, 'Update Start', 'one\ntwo', new Date(2026, 10, 7, 9, 8, 6));
  assert.match(readFileSync(file, 'utf8'), /^═+\nUpdate Start\n═+\nDate : 2026-11-07 09:08:06\n\none\ntwo\n\n═+\n$/u);
});

test('existing log is never truncated, including when referenced via a symlink', (t) => {
  const root = fixture(t);
  const file = join(root, 'original.log');
  writeFileSync(file, 'untouched');
  assert.throws(() => createLog(file, 'new'), { code: 'EEXIST' });
  if (process.platform !== 'win32') {
    const alias = join(root, 'alias.log');
    symlinkSync(file, alias);
    assert.throws(() => createLog(alias, 'new'), { code: 'EEXIST' });
  }
  assert.equal(readFileSync(file, 'utf8'), 'untouched');
});

test('invalid path and missing parent permissions fail visibly', (t) => {
  const root = fixture(t);
  assert.throws(() => createLog(''), /Usage/);
  const parent = join(root, 'not-a-directory');
  writeFileSync(parent, 'untouched');
  assert.throws(() => createLog(join(parent, 'log')), { code: 'EEXIST' });
  assert.equal(readFileSync(parent, 'utf8'), 'untouched');
});

test('CLI reports success only once and a collision fails without output', (t) => {
  const root = fixture(t);
  const file = join(root, 'startup.log');
  const call = () => spawnSync(process.execPath, [engine, file, 'Title', 'Body'], { encoding: 'utf8' });
  const first = call();
  assert.ifError(first.error);
  assert.equal(first.status, 0, first.stderr);
  assert.equal(first.stdout, `📝 Log created: ${file}\n`);
  const original = readFileSync(file, 'utf8');
  const second = call();
  assert.equal(second.status, 1);
  assert.equal(second.stdout, '');
  assert.match(second.stderr, /Log creation failed/);
  assert.equal(readFileSync(file, 'utf8'), original);
});

test('CLI accepts arguments from an unrelated working directory', (t) => {
  const root = fixture(t);
  const file = join(root, 'log with spaces');
  const result = spawnSync(process.execPath, [engine, file, 'custom title', 'custom content'], {
    cwd: root, encoding: 'utf8',
  });
  assert.ifError(result.error);
  assert.equal(result.status, 0, result.stderr);
  assert.ok(existsSync(file));
  assert.match(readFileSync(file, 'utf8'), /custom title[\s\S]*custom content/);
});

test('symlinked CLI entry executes the engine', (t) => {
  if (process.platform === 'win32') return t.skip('File symlinks may require Windows privileges');
  const root = fixture(t);
  const entry = join(root, 'entry.mjs');
  const file = join(root, 'log');
  symlinkSync(engine, entry);
  const result = spawnSync(process.execPath, [entry, file], { encoding: 'utf8' });
  assert.ifError(result.error);
  assert.equal(result.status, 0, result.stderr);
  assert.ok(existsSync(file));
});
