import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { spawnSync } from 'node:child_process';
import { mkdirSync, mkdtempSync, readFileSync, readdirSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { generateByPath } from '../../prompts/hard_points/system/structure/scripts/generate-index-by-path.mjs';
import { generateSecondary } from '../../prompts/hard_points/system/structure/scripts/generate-secondary-index.mjs';
import { generateMaster } from '../../prompts/hard_points/system/structure/scripts/generate-index-master.mjs';

const engine = fileURLToPath(new URL('../../prompts/hard_points/system/structure/scripts/generate-index-master.mjs', import.meta.url));
const hash = path => createHash('sha256').update(path).digest('hex').slice(0, 12);

function fixture(t, paths) {
  const root = mkdtempSync(join(tmpdir(), 'aikido-master-'));
  t.after(() => rmSync(root, { recursive: true, force: true }));
  const base = join(root, 'prompts/hard_points/system/structure');
  mkdirSync(join(base, 'indices/by-id'), { recursive: true });
  for (const prefix of '0123456789abcdef') {
    const files = Object.fromEntries(paths.filter(path => hash(path)[0] === prefix).map(path => [
      hash(path), { path, name: path.split('/').at(-1), type: 'markdown', lines: 2 },
    ]));
    writeFileSync(join(base, `indices/by-id/index-id-${prefix}.json`), JSON.stringify({
      metadata: { id_prefix: prefix, batch_id: `id-${prefix}`, count: Object.keys(files).length }, files,
    }));
  }
  generateByPath(root);
  for (const kind of ['alpha', 'directory', 'type']) generateSecondary(root, kind);
  return { root, base };
}
const json = path => JSON.parse(readFileSync(path, 'utf8'));

test('master routes every batch, exact name, directory and ID', (t) => {
  const paths = Array.from({ length: 2101 }, (_, n) => `shared/dir-${n}/name-${n}.md`);
  paths.push('special/__proto__', 'special/same.md', 'other/same.md');
  const { root, base } = fixture(t, paths);
  const master = generateMaster(root);
  assert.equal(master.metadata.statistics.total_files, paths.length);
  assert.equal(master.metadata.statistics.total_lines, paths.length * 2);
  assert.equal(master.hash_tables.by_path.shared.batches.length, 3);
  assert.equal(master.hash_tables.by_type.markdown.batches.length, 3);
  for (const path of paths) {
    const id = hash(path);
    const route = master.hash_tables.by_id[id[0]].batch;
    assert.equal(json(join(base, route)).files[id].path, path);
    const name = path.split('/').at(-1);
    const alpha = master.hash_tables.by_name[name].batch;
    assert.ok(json(join(base, alpha)).files[name].includes(id));
    const dir = path.split('/').slice(0, -1).join('/') || '.';
    const directory = master.hash_tables.by_directory[dir].batch;
    assert.ok(json(join(base, directory)).directories[dir].ids.includes(id));
    const candidates = master.hash_tables.by_path[path.split('/')[0]].batches;
    assert.ok(candidates.some(batch => json(join(base, batch)).paths[path] === id));
  }
  assert.equal(json(join(base, 'index.json')).metadata.statistics.total_files, paths.length);
});

test('stale or malformed secondary index never replaces master', (t) => {
  const { root, base } = fixture(t, ['dir/a.md', 'dir/b.md']);
  const master = join(base, 'index.json');
  writeFileSync(master, 'previous master');
  const path = join(base, 'indices/by-type/index-type-markdown.json');
  const value = json(path);
  value.ids.pop();
  value.metadata.count = value.ids.length;
  writeFileSync(path, JSON.stringify(value));
  assert.throws(() => generateMaster(root), /by-type inconsistent/);
  assert.equal(readFileSync(master, 'utf8'), 'previous master');
  writeFileSync(path, '{');
  assert.throws(() => generateMaster(root), /Invalid JSON/);
  assert.equal(readFileSync(master, 'utf8'), 'previous master');
});

test('empty index and Node CLI work without jq', (t) => {
  const { root, base } = fixture(t, []);
  const master = generateMaster(root);
  assert.equal(master.metadata.statistics.total_files, 0);
  assert.equal(master.metadata.batching.by_path_batches, 0);
  const result = spawnSync(process.execPath, [engine], {
    cwd: tmpdir(), env: { ...process.env, PATH: root, PROJECT_ROOT: root }, encoding: 'utf8',
  });
  assert.ifError(result.error);
  assert.equal(result.status, 0, result.stderr);
  assert.ok(readdirSync(base).includes('index.json'));
});
