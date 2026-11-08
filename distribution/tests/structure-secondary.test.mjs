import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { spawnSync } from 'node:child_process';
import { mkdirSync, mkdtempSync, readFileSync, readdirSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { generateSecondary } from '../../prompts/hard_points/system/structure/scripts/generate-secondary-index.mjs';
import { publishBatches } from '../../prompts/hard_points/system/structure/scripts/generate-index-by-path.mjs';

const scripts = fileURLToPath(new URL('../../prompts/hard_points/system/structure/scripts/', import.meta.url));
const hash = path => createHash('sha256').update(path).digest('hex').slice(0, 12);
function fixture(t, paths) {
  const root = mkdtempSync(join(tmpdir(), 'aikido-secondary-'));
  t.after(() => rmSync(root, { recursive: true, force: true }));
  const base = join(root, 'prompts/hard_points/system/structure/indices');
  mkdirSync(join(base, 'by-id'), { recursive: true });
  for (const prefix of '0123456789abcdef') {
    const files = Object.fromEntries(paths.filter(path => hash(path).startsWith(prefix)).map(path => [
      hash(path), { path, name: path.split('/').at(-1), type: path.endsWith('.json') ? 'config' : 'markdown' },
    ]));
    writeFileSync(join(base, `by-id/index-id-${prefix}.json`), JSON.stringify({
      metadata: { id_prefix: prefix, batch_id: `id-${prefix}`, count: Object.keys(files).length }, files,
    }));
  }
  return { root, base };
}
const json = path => JSON.parse(readFileSync(path, 'utf8'));

test('all secondary references match by-id, including homonyms and special names', (t) => {
  const paths = ['one/same.md', 'other/same.md', 'odd|dir/a\nb.md', '__proto__/__proto__', 'root.json'];
  const { root, base } = fixture(t, paths);
  for (const kind of ['alpha', 'directory', 'type']) assert.equal(generateSecondary(root, kind).files, 5);
  const alpha = json(join(base, 'by-alphabetical/index-alpha-0.json'));
  assert.deepEqual(new Set(alpha.files['same.md']), new Set([hash('one/same.md'), hash('other/same.md')]));
  assert.deepEqual(alpha.files['a\nb.md'], [hash('odd|dir/a\nb.md')]);
  assert.deepEqual(alpha.files.__proto__, [hash('__proto__/__proto__')]);
  const directories = json(join(base, 'by-directory/index-dir-000.json'));
  assert.deepEqual(directories.directories['odd|dir'], { files_count: 1, ids: [hash('odd|dir/a\nb.md')] });
  assert.deepEqual(directories.directories['.'].ids, [hash('root.json')]);
  const type = json(join(base, 'by-type/index-type-config.json'));
  assert.deepEqual(type.ids, [hash('root.json')]);
  assert.equal(type.metadata.count, 1);
});

test('splits type and name batches correctly above 1000', (t) => {
  const paths = Array.from({ length: 2001 }, (_, n) => `d${n}/name-${n}.md`);
  const { root, base } = fixture(t, paths);
  generateSecondary(root, 'type');
  generateSecondary(root, 'alpha');
  generateSecondary(root, 'directory');
  const types = readdirSync(join(base, 'by-type')).sort().map(name => json(join(base, 'by-type', name)));
  assert.deepEqual(types.map(x => x.metadata.count), [1000, 1000, 1]);
  assert.equal(new Set(types.flatMap(x => x.ids)).size, 2001);
  const alpha = readdirSync(join(base, 'by-alphabetical')).sort().map(name => json(join(base, 'by-alphabetical', name)));
  assert.deepEqual(alpha.map(x => x.metadata.count), [1000, 1000, 1]);
  const dirs = readdirSync(join(base, 'by-directory')).sort().map(name => json(join(base, 'by-directory', name)));
  assert.deepEqual(dirs.map(x => x.metadata.directories_count), [1000, 1000, 1]);
  assert.deepEqual(dirs.map(x => x.metadata.offset), [0, 1000, 2000]);
});

test('invalid input preserves existing outputs and type changes remove stale batches', (t) => {
  const { root, base } = fixture(t, ['file.json']);
  generateSecondary(root, 'type');
  writeFileSync(join(base, 'by-type/unrelated.txt'), 'preserve');
  const old = join(base, 'by-type/index-type-config.json');
  const before = readFileSync(old);
  const input = join(base, `by-id/index-id-${hash('file.json')[0]}.json`);
  const data = json(input);
  data.files[hash('file.json')].type = '../bad';
  writeFileSync(input, JSON.stringify(data));
  assert.throws(() => generateSecondary(root, 'type'), /Invalid type/);
  assert.deepEqual(readFileSync(old), before);
  data.files[hash('file.json')].type = 'markdown';
  writeFileSync(input, JSON.stringify(data));
  generateSecondary(root, 'type');
  assert.deepEqual(readdirSync(join(base, 'by-type')).sort(), ['index-type-markdown.json', 'unrelated.txt']);
});

test('batch publication rejects paths outside its directory', (t) => {
  const { root, base } = fixture(t, []);
  const output = join(base, 'by-type');
  mkdirSync(output);
  const victim = join(base, 'victim.json');
  writeFileSync(victim, 'untouched');
  assert.throws(() => publishBatches(root, output, new Map([['../victim.json', {}]]), [], 'type'),
    /Invalid output batch name/);
  assert.equal(readFileSync(victim, 'utf8'), 'untouched');
});

test('all Node CLI modes work without jq and respect PROJECT_ROOT', (t) => {
  const { root, base } = fixture(t, ['test.md']);
  for (const [kind, result] of [
    ['alpha', 'by-alphabetical/index-alpha-0.json'],
    ['directory', 'by-directory/index-dir-000.json'],
    ['type', 'by-type/index-type-markdown.json'],
  ]) {
    const run = spawnSync(process.execPath, [join(scripts, 'generate-secondary-index.mjs'), kind], {
      cwd: tmpdir(), env: { ...process.env, PATH: root, PROJECT_ROOT: root }, encoding: 'utf8',
    });
    assert.ifError(run.error);
    assert.equal(run.status, 0, run.stderr);
    assert.ok(json(join(base, result)));
  }
});
