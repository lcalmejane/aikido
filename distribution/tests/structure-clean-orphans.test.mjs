import { test } from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { mkdtempSync, mkdirSync, readFileSync, readdirSync, realpathSync, rmSync, symlinkSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { generateAll } from '../../prompts/hard_points/system/structure/scripts/generate-all-indexes-v3.1.mjs';
import { readEntries } from '../../prompts/hard_points/system/structure/scripts/generate-index-by-path.mjs';
import { generateMaster } from '../../prompts/hard_points/system/structure/scripts/generate-index-master.mjs';

const script = fileURLToPath(new URL('../../prompts/hard_points/system/structure/scripts/clean-orphans.mjs', import.meta.url));
const base = 'prompts/hard_points/system/structure';
const id = n => `a${n.toString(16).padStart(11, '0')}`;

function fixture(t, paths = ['valid.txt', 'missing.txt']) {
  const root = mkdtempSync(join(tmpdir(), 'clean-orphans-'));
  t.after(() => rmSync(root, { recursive: true, force: true }));
  const structure = join(root, base);
  const byId = join(structure, 'indices/by-id');
  mkdirSync(byId, { recursive: true });
  const master = join(structure, 'index.json');
  const batch = join(byId, 'index-id-a.json');
  const secondary = join(structure, 'indices/by-path/index-path-000.json');
  mkdirSync(join(structure, 'indices/by-path'), { recursive: true });
  writeFileSync(secondary, '{"paths":{"missing.txt":"a00000000001"}}\n');
  writeFileSync(master, JSON.stringify({
    metadata: { version: '3.1-hash-id', statistics: { total_files: paths.length, total_lines: 99 }, last_check: { timestamp: 'old', generator: 'old', version: '3.1' } },
    hash_tables: { by_id: { a: { batch: 'indices/by-id/index-id-a.json', count: paths.length } }, by_path: { untouched: true } },
    routing: { untouched: true },
  }, null, 2));
  writeFileSync(batch, JSON.stringify({
    metadata: { batch_id: 'id-a', id_prefix: 'a', count: paths.length, generated: 'old' },
    files: Object.fromEntries(paths.map((path, n) => [id(n), { path, lines: 7, extra: { retained: true } }])),
  }, null, 2));
  writeFileSync(join(root, 'valid.txt'), 'valid');
  const run = (args = [], options = {}) => spawnSync(process.execPath, [script, ...args], { cwd: root, encoding: 'utf8', ...options });
  const snapshot = () => [master, batch, secondary].map(path => readFileSync(path, 'utf8'));
  return { root, structure, byId, master, batch, secondary, run, snapshot };
}

test('dry run is byte-for-byte unchanged and reports verbose paths without external tools', t => {
  const f = fixture(t);
  const before = f.snapshot();
  const result = f.run(['--dry-run', '--confirm', '--verbose'], { env: { ...process.env, PATH: f.root } });
  assert.equal(result.status, 0, result.stderr);
  assert.match(result.stdout, /Valid: valid\.txt/);
  assert.match(result.stdout, /Orphan: missing\.txt/);
  assert.match(result.stdout, /Dry run/);
  assert.deepEqual(f.snapshot(), before);
  assert.deepEqual(readdirSync(f.byId), ['index-id-a.json']);
});

test('cleans only orphans, preserves valid entries and exposes secondary-index limitation', t => {
  const f = fixture(t);
  const before = f.snapshot();
  const result = f.run();
  assert.equal(result.status, 0, result.stderr);
  assert.match(result.stdout, /Orphans removed: 1/);
  assert.match(result.stdout, /Secondary indexes.*\/reindex-projet/);
  const batch = JSON.parse(readFileSync(f.batch));
  const master = JSON.parse(readFileSync(f.master));
  assert.deepEqual(Object.keys(batch.files), [id(0)]);
  assert.deepEqual(batch.files[id(0)], { path: 'valid.txt', lines: 7, extra: { retained: true } });
  assert.equal(batch.metadata.count, 1);
  assert.equal(master.hash_tables.by_id.a.count, 1);
  assert.equal(master.metadata.statistics.total_files, 1);
  assert.equal(master.metadata.statistics.total_lines, 99);
  assert.equal(master.metadata.last_check.version, '3.1');
  assert.equal(readFileSync(f.secondary, 'utf8'), before[2]);
  assert.equal(readFileSync(join(f.root, 'valid.txt'), 'utf8'), 'valid');
  assert.deepEqual(readdirSync(f.byId), ['index-id-a.json']);
});

test('invalid JSON or invalid schema in any batch prevents all writes', t => {
  const f = fixture(t);
  for (const bad of ['{', '{"metadata":{},"files":null}']) {
    writeFileSync(f.batch, bad);
    const before = f.snapshot();
    const result = f.run();
    assert.notEqual(result.status, 0);
    assert.match(result.stderr, /Invalid (or unsupported JSON|by-id batch)/);
    assert.deepEqual(f.snapshot(), before);
  }
  writeFileSync(f.master, '{');
  const before = f.snapshot();
  assert.notEqual(f.run().status, 0);
  assert.deepEqual(f.snapshot(), before);
});

test('a later malformed batch prevents cleanup of an earlier valid batch', t => {
  const f = fixture(t);
  const master = JSON.parse(readFileSync(f.master));
  master.hash_tables.by_id.b = { batch: 'indices/by-id/index-id-b.json', count: 1 };
  writeFileSync(f.master, JSON.stringify(master));
  const other = join(f.byId, 'index-id-b.json');
  writeFileSync(other, '{');
  const before = f.snapshot();
  const result = f.run();
  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /Invalid or unsupported JSON/);
  assert.deepEqual(f.snapshot(), before);
  assert.equal(readFileSync(other, 'utf8'), '{');
});

test('invalid and outside paths abort the entire operation', t => {
  for (const bad of ['../outside', '/etc/passwd', 'a/../outside', '', 'C:\\outside', 'x//y', null]) {
    const f = fixture(t, ['missing.txt', bad]);
    const before = f.snapshot();
    const result = f.run();
    assert.notEqual(result.status, 0, String(bad));
    assert.match(result.stderr, /Invalid indexed path/);
    assert.deepEqual(f.snapshot(), before);
  }
});

test('rejects symlinks in indexed paths and index destinations', { skip: process.platform === 'win32' }, t => {
  const f = fixture(t, ['missing.txt', 'link/file']);
  const external = mkdtempSync(join(tmpdir(), 'clean-outside-'));
  t.after(() => rmSync(external, { recursive: true, force: true }));
  writeFileSync(join(external, 'file'), 'outside');
  symlinkSync(external, join(f.root, 'link'));
  const before = f.snapshot();
  assert.match(f.run().stderr, /Unsafe symlink/);
  assert.deepEqual(f.snapshot(), before);
  assert.equal(readFileSync(join(external, 'file'), 'utf8'), 'outside');
  rmSync(join(f.root, 'link'));
  rmSync(f.batch);
  const outsideBatch = join(external, 'batch.json');
  writeFileSync(outsideBatch, before[1]);
  symlinkSync(outsideBatch, f.batch);
  assert.match(f.run().stderr, /Unsafe symlink/);
  assert.equal(readFileSync(outsideBatch, 'utf8'), before[1]);
  assert.equal(readFileSync(f.master, 'utf8'), before[0]);
});

test('warns strictly above ten percent', t => {
  const f = fixture(t, Array(9).fill('valid.txt').concat('missing.txt'));
  assert.doesNotMatch(f.run(['--dry-run']).stdout, /WARNING/);
  const batch = JSON.parse(readFileSync(f.batch));
  batch.files[id(10)] = { path: 'missing2.txt' };
  writeFileSync(f.batch, JSON.stringify(batch));
  const result = f.run(['--dry-run']);
  assert.equal(result.status, 0, result.stderr);
  assert.match(result.stdout, /WARNING.*18\.2%/);
});

test('confirmation, flags, absent and incomplete indexes', t => {
  const f = fixture(t);
  const before = f.snapshot();
  const no = f.run(['--confirm'], { input: 'n\n' });
  assert.equal(no.status, 0, no.stderr);
  assert.match(no.stdout, /Cancelled/);
  assert.deepEqual(f.snapshot(), before);
  const yes = f.run(['--confirm'], { input: 'yes\n' });
  assert.equal(yes.status, 0, yes.stderr);
  assert.match(yes.stdout, /Orphans removed: 1/);
  assert.notEqual(f.run(['--unknown']).status, 0);
  assert.match(f.run(['--unknown']).stderr, /Usage:/);
  const result = f.run(['--dry-run', '--verbose']);
  assert.equal(result.status, 0, result.stderr);
  assert.match(result.stdout, /Valid: valid\.txt/);
  rmSync(f.byId, { recursive: true });
  assert.match(f.run().stderr, /incomplete/);
  rmSync(f.master);
  const absent = f.run();
  assert.equal(absent.status, 0, absent.stderr);
  assert.match(absent.stdout, /Index not found.*\/reindex-projet/);
});

test('explicit rebuild refreshes all indexes and adds new project files after review', t => {
  const root = mkdtempSync(join(realpathSync(tmpdir()), 'clean-rebuild-'));
  t.after(() => rmSync(root, { recursive: true, force: true }));
  mkdirSync(join(root, base), { recursive: true });
  writeFileSync(join(root, 'keep.txt'), 'keep\n');
  writeFileSync(join(root, 'removed.txt'), 'remove\n');
  generateAll(root);
  rmSync(join(root, 'removed.txt'));
  writeFileSync(join(root, 'new.txt'), 'new\n');
  const indexSnapshot = () => {
    const snapshot = new Map();
    const visit = dir => {
      for (const entry of readdirSync(dir, { withFileTypes: true })) {
        const path = join(dir, entry.name);
        if (entry.isDirectory()) visit(path);
        else snapshot.set(path, readFileSync(path));
      }
    };
    visit(join(root, base));
    return snapshot;
  };
  const before = indexSnapshot();
  const run = (args, options = {}) => spawnSync(process.execPath, [script, ...args], { cwd: root, encoding: 'utf8', ...options });
  const dry = run(['--rebuild', '--dry-run', '--confirm']);
  assert.equal(dry.status, 0, dry.stderr);
  assert.match(dry.stdout, /including newly discovered files/);
  assert.match(dry.stdout, /Dry run/);
  assert.deepEqual(indexSnapshot(), before);
  const refused = run(['--rebuild', '--confirm'], { input: 'n\n' });
  assert.equal(refused.status, 0, refused.stderr);
  assert.match(refused.stdout, /Cancelled/);
  assert.deepEqual(indexSnapshot(), before);
  const missingGit = run(['--rebuild'], { env: { ...process.env, PATH: root } });
  assert.notEqual(missingGit.status, 0);
  assert.match(missingGit.stderr, /Git execution failed/);
  assert.deepEqual(indexSnapshot(), before);
  const result = run(['--rebuild', '--confirm'], { input: 'yes\n' });
  assert.equal(result.status, 0, result.stderr);
  assert.match(result.stdout, /Full index rebuild complete/);
  const paths = new Set(readEntries(root).entries.map(([path]) => path));
  assert.ok(paths.has('keep.txt'));
  assert.ok(paths.has('new.txt'));
  assert.ok(!paths.has('removed.txt'));
  assert.doesNotThrow(() => generateMaster(root));
  const newAgain = run(['--rebuild']);
  assert.equal(newAgain.status, 0, newAgain.stderr);
  assert.match(newAgain.stdout, /Orphans detected: 0/);
  assert.match(newAgain.stdout, /Full index rebuild complete/);
});

test('rebuild rejects an incomplete V3.1 index without changing it', t => {
  const f = fixture(t);
  const before = f.snapshot();
  const result = f.run(['--rebuild']);
  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /Missing by-id batch/);
  assert.deepEqual(f.snapshot(), before);
});
