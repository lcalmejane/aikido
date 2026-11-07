import { test } from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { mkdirSync, mkdtempSync, readFileSync, readdirSync, realpathSync, renameSync, rmSync, symlinkSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { generateAll } from '../../prompts/hard_points/system/structure/scripts/generate-all-indexes-v3.1.mjs';
import { readEntries } from '../../prompts/hard_points/system/structure/scripts/generate-index-by-path.mjs';
import { updateChanged } from '../../prompts/hard_points/system/structure/scripts/update-incremental.mjs';

const engine = fileURLToPath(new URL('../../prompts/hard_points/system/structure/scripts/update-incremental.mjs', import.meta.url));
function fixture(t) {
  const base = mkdtempSync(join(realpathSync(tmpdir()), 'aikido-structure-update-'));
  t.after(() => rmSync(base, { recursive: true, force: true }));
  const root = join(base, 'project');
  mkdirSync(root);
  mkdirSync(join(root, 'prompts/hard_points/system/structure'), { recursive: true });
  return { base, root };
}
const entries = root => new Map(readEntries(root).entries.map(([path, , metadata]) => [path, metadata]));

function indexedFiles(root) {
  const base = join(root, 'prompts/hard_points/system/structure');
  const directories = ['indices/by-id', 'indices/by-path', 'indices/by-alphabetical', 'indices/by-directory', 'indices/by-type'];
  const result = new Map([['index.json', JSON.parse(readFileSync(join(base, 'index.json'), 'utf8'))]]);
  for (const directory of directories) {
    for (const name of readdirSync(join(base, directory)).sort()) {
      if (!name.endsWith('.json')) continue;
      const path = `${directory}/${name}`;
      result.set(path, JSON.parse(readFileSync(join(base, path), 'utf8')));
    }
  }
  return result;
}

function withoutGeneratedTimes(value) {
  if (Array.isArray(value)) return value.map(withoutGeneratedTimes);
  if (value && typeof value === 'object') {
    return Object.fromEntries(Object.entries(value)
      .filter(([key]) => key !== 'generated' && key !== 'timestamp')
      .map(([key, item]) => [key, withoutGeneratedTimes(item)]));
  }
  return value;
}

function assertAllIndexesEquivalent(actualRoot, referenceRoot) {
  const actual = indexedFiles(actualRoot);
  const reference = indexedFiles(referenceRoot);
  assert.deepEqual([...actual.keys()].sort(), [...reference.keys()].sort());
  for (const [path, data] of actual) {
    assert.deepEqual(withoutGeneratedTimes(data), withoutGeneratedTimes(reference.get(path)), path);
  }
  for (const prefix of '0123456789abcdef') {
    assert.ok(actual.has(`indices/by-id/index-id-${prefix}.json`), `missing by-id batch ${prefix}`);
  }
}

function seed(root) {
  writeFileSync(join(root, '.gitignore'), '*.data\n!allowed.data\nignored-root/\n');
  mkdirSync(join(root, 'prompts/private'), { recursive: true });
  mkdirSync(join(root, 'prompts/nested'), { recursive: true });
  mkdirSync(join(root, 'ignored-root'), { recursive: true });
  writeFileSync(join(root, 'prompts/.gitignore'), 'private/hidden.md\n!private/keep.md\n');
  writeFileSync(join(root, 'prompts/nested/.gitignore'), 'hidden.md\n!keep.md\n');
  writeFileSync(join(root, 'first.md'), 'one\n');
  writeFileSync(join(root, 'prompts/private/keep.md'), 'included by negation\n');
  writeFileSync(join(root, 'prompts/private/hidden.md'), 'ignored\n');
  writeFileSync(join(root, 'prompts/nested/keep.md'), 'included by nested negation\n');
  writeFileSync(join(root, 'prompts/nested/hidden.md'), 'ignored\n');
  writeFileSync(join(root, 'ignored.log'), 'ignored\n');
  writeFileSync(join(root, 'ignored.data'), 'ignored by root rule\n');
  writeFileSync(join(root, 'allowed.data'), 'included by negation\n');
  writeFileSync(join(root, 'ignored-root/hidden.md'), 'ignored\n');
  writeFileSync(join(root, '.env.local'), 'secret\n');
  mkdirSync(join(root, 'node_modules/pkg'), { recursive: true });
  writeFileSync(join(root, 'node_modules/pkg/index.js'), 'excluded\n');
  mkdirSync(join(root, 'dist'), { recursive: true });
  writeFileSync(join(root, 'dist/output.js'), 'excluded\n');
}

function copySeed(source, destination) {
  for (const path of ['.gitignore', 'first.md', 'ignored.log', 'ignored.data', 'allowed.data', '.env.local',
    'prompts/.gitignore', 'prompts/private/keep.md', 'prompts/private/hidden.md',
    'prompts/nested/.gitignore', 'prompts/nested/keep.md', 'prompts/nested/hidden.md',
    'ignored-root/hidden.md', 'node_modules/pkg/index.js', 'dist/output.js']) {
    const from = join(source, path);
    const to = join(destination, path);
    mkdirSync(join(to, '..'), { recursive: true });
    writeFileSync(to, readFileSync(from));
  }
}

test('add, modify, rename, delete and nested ignore negations match a complete rebuild', t => {
  const { base, root } = fixture(t);
  const reference = join(base, 'reference');
  mkdirSync(reference);
  mkdirSync(join(reference, 'prompts/hard_points/system/structure'), { recursive: true });
  seed(root);
  copySeed(root, reference);
  generateAll(root);
  generateAll(reference);

  assert.equal(entries(root).has('prompts/private/keep.md'), true, [...entries(root).keys()].join('\n'));
  assert.equal(entries(root).has('prompts/private/hidden.md'), false);
  assert.equal(entries(root).has('prompts/nested/keep.md'), true);
  assert.equal(entries(root).has('prompts/nested/hidden.md'), false);
  assert.equal(entries(root).has('allowed.data'), true);
  assert.equal(entries(root).has('node_modules/pkg/index.js'), false);
  assert.equal(entries(root).has('dist/output.js'), false);
  assertAllIndexesEquivalent(root, reference);

  const apply = (paths, action) => {
    action(root);
    action(reference);
    updateChanged(root, paths);
    generateAll(reference);
    assertAllIndexesEquivalent(root, reference);
  };
  apply(['new.md'], project => writeFileSync(join(project, 'new.md'), 'added\n'));
  apply(['first.md'], project => writeFileSync(join(project, 'first.md'), 'one\ntwo\n'));
  apply(['first.md', 'renamed.md'], project => renameSync(join(project, 'first.md'), join(project, 'renamed.md')));
  apply(['new.md'], project => rmSync(join(project, 'new.md')));
  apply(['.gitignore', 'ignored-root/new.md'], project => {
    writeFileSync(join(project, '.gitignore'), '*.log\nignored-root/\n!ignored-root/new.md\n');
    writeFileSync(join(project, 'ignored-root/new.md'), 'still ignored under ignored parent\n');
  });

  const master = JSON.parse(readFileSync(join(root, 'prompts/hard_points/system/structure/index.json'), 'utf8'));
  assert.equal(master.metadata.statistics.total_files, entries(root).size);
  assert.ok(master.hash_tables.by_name['renamed.md']);
  assert.equal(Object.hasOwn(master.hash_tables.by_name, 'new.md'), false);
});

test('invalid inputs and a rejected index target do not publish partial changes', t => {
  const { root } = fixture(t);
  writeFileSync(join(root, 'source'), 'x');
  generateAll(root);
  const base = join(root, 'prompts/hard_points/system/structure');
  const before = indexedFiles(root);
  for (const paths of [[], ['..'], ['../outside'], [''], ['.'], [42]]) {
    assert.throws(() => updateChanged(root, paths));
    assert.deepEqual(indexedFiles(root), before);
  }
  if (process.platform !== 'win32') {
    symlinkSync(join(root, 'source'), join(root, 'link'));
    assert.throws(() => updateChanged(root, ['link']), /Symlink refused/);
    rmSync(join(root, 'link'));
    assert.deepEqual(indexedFiles(root), before);
  }

  writeFileSync(join(root, 'source'), 'changed\n');
  const byPath = join(base, 'indices/by-path');
  const outside = join(root, 'outside-index');
  renameSync(byPath, `${byPath}.saved`);
  symlinkSync(outside, byPath);
  try {
    assert.throws(() => updateChanged(root, ['source']), /Symlink refused/);
  } finally {
    rmSync(byPath);
    renameSync(`${byPath}.saved`, byPath);
  }
  assert.deepEqual(indexedFiles(root), before);
});

test('CLI reports full-rebuild strategy and the measured file and request counts', t => {
  const { root } = fixture(t);
  writeFileSync(join(root, 'file'), 'x');
  const result = spawnSync(process.execPath, [engine, 'file'], {
    env: { ...process.env, PROJECT_ROOT: root, TMPDIR: process.env.TMPDIR,
      AIKIDO_GIT_IGNORE_TMPDIR: process.env.AIKIDO_GIT_IGNORE_TMPDIR }, encoding: 'utf8',
  });
  assert.equal(result.status, 0, result.stderr);
  assert.match(result.stderr, /change-set completeness and cross-index publication cannot be guaranteed; rebuilding all indexes/);
  assert.match(result.stdout, /Indexes rebuilt: 1 files after 1 requested change/);
  const invalid = spawnSync(process.execPath, [engine], {
    env: { ...process.env, PROJECT_ROOT: root, TMPDIR: process.env.TMPDIR,
      AIKIDO_GIT_IGNORE_TMPDIR: process.env.AIKIDO_GIT_IGNORE_TMPDIR }, encoding: 'utf8',
  });
  assert.equal(invalid.status, 1);
});
