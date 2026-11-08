import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { spawnSync } from 'node:child_process';
import { mkdirSync, mkdtempSync, readFileSync, readdirSync, rmSync, symlinkSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { generateByPath } from '../../prompts/hard_points/system/structure/scripts/generate-index-by-path.mjs';

const engine = fileURLToPath(new URL('../../prompts/hard_points/system/structure/scripts/generate-index-by-path.mjs', import.meta.url));
const id = path => createHash('sha256').update(path).digest('hex').slice(0, 12);

function fixture(t, paths = []) {
  const root = mkdtempSync(join(tmpdir(), 'aikido-path-'));
  t.after(() => rmSync(root, { recursive: true, force: true }));
  const base = join(root, 'prompts/hard_points/system/structure/indices');
  const input = join(base, 'by-id');
  const output = join(base, 'by-path');
  mkdirSync(input, { recursive: true });
  mkdirSync(output);
  for (const prefix of '0123456789abcdef') {
    const files = Object.fromEntries(paths.filter(path => id(path).startsWith(prefix))
      .map(path => [id(path), { path }]));
    writeFileSync(join(input, `index-id-${prefix}.json`), JSON.stringify({
      metadata: { batch_id: `id-${prefix}`, id_prefix: prefix, count: Object.keys(files).length }, files,
    }));
  }
  return { root, input, output };
}
const json = path => JSON.parse(readFileSync(path, 'utf8'));

test('preserves special path names and exact counts across 1000-entry batches', (t) => {
  const paths = Array.from({ length: 2001 }, (_, n) => `dossier ${String(n).padStart(4, '0')}.md`);
  paths.push('special/ligne\net|guillemets"é.md', 'special/__proto__', 'zero');
  const { root, output } = fixture(t, paths);
  assert.deepEqual(generateByPath(root), { files: 2004, batches: 3 });
  const files = readdirSync(output).sort();
  assert.deepEqual(files, ['index-path-000.json', 'index-path-001.json', 'index-path-002.json']);
  const batches = files.map(file => json(join(output, file)));
  assert.deepEqual(batches.map(batch => batch.metadata.count), [1000, 1000, 4]);
  assert.deepEqual(batches.map(batch => batch.metadata.offset), [0, 1000, 2000]);
  const mappings = Object.assign(Object.create(null), ...batches.map(batch => batch.paths));
  assert.equal(Object.keys(mappings).length, paths.length);
  for (const path of paths) assert.equal(mappings[path], id(path));
});

test('replaces stale batch outputs without touching unrelated files', (t) => {
  const { root, output } = fixture(t, ['single']);
  writeFileSync(join(output, 'index-path-000.json'), 'old');
  writeFileSync(join(output, 'index-path-001.json'), 'stale');
  writeFileSync(join(output, 'unrelated.txt'), 'preserve');
  generateByPath(root);
  assert.deepEqual(readdirSync(output).sort(), ['index-path-000.json', 'unrelated.txt']);
  assert.equal(readFileSync(join(output, 'unrelated.txt'), 'utf8'), 'preserve');
  assert.equal(json(join(output, 'index-path-000.json')).paths.single, id('single'));
});

test('invalid input preserves every existing output', (t) => {
  const { root, input, output } = fixture(t, ['single']);
  const sentinel = join(output, 'index-path-000.json');
  writeFileSync(sentinel, 'existing');
  writeFileSync(join(input, `index-id-${id('single')[0]}.json`), '{');
  assert.throws(() => generateByPath(root), /Invalid JSON/);
  assert.equal(readFileSync(sentinel, 'utf8'), 'existing');
});

test('refuses missing batches, bad IDs and paths', (t) => {
  const { root, input } = fixture(t, []);
  const batch = join(input, 'index-id-a.json');
  rmSync(batch);
  assert.throws(() => generateByPath(root), /Missing by-id batch/);
  writeFileSync(batch, JSON.stringify({
    metadata: { batch_id: 'id-a', id_prefix: 'a', count: 1 },
    files: { aaaaaaaaaaaa: { path: '../outside' } },
  }));
  assert.throws(() => generateByPath(root), /Invalid indexed path/);
});

test('refuses a symlinked destination without modifying its target', (t) => {
  if (process.platform === 'win32') return t.skip('Symlinks require Windows privileges');
  const { root, output } = fixture(t, ['single']);
  const victim = join(root, 'victim');
  writeFileSync(victim, 'untouched');
  symlinkSync(victim, join(output, 'index-path-000.json'));
  assert.throws(() => generateByPath(root), /Symlink refused/);
  assert.equal(readFileSync(victim, 'utf8'), 'untouched');
});

test('Node CLI uses PROJECT_ROOT independently of cwd and needs no jq', (t) => {
  const { root, output } = fixture(t, ['from Node']);
  const result = spawnSync(process.execPath, [engine], {
    cwd: tmpdir(), env: { ...process.env, PROJECT_ROOT: root, PATH: root }, encoding: 'utf8',
  });
  assert.ifError(result.error);
  assert.equal(result.status, 0, result.stderr);
  assert.equal(json(join(output, 'index-path-000.json')).paths['from Node'], id('from Node'));
  const extra = spawnSync(process.execPath, [engine, 'extra'], {
    env: { ...process.env, PROJECT_ROOT: root }, encoding: 'utf8',
  });
  assert.equal(extra.status, 0, extra.stderr);
  assert.match(extra.stderr, /ignores positional arguments/);
});
