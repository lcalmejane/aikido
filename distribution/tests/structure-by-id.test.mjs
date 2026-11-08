import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { spawnSync } from 'node:child_process';
import {
  mkdirSync, mkdtempSync, readFileSync, readdirSync, realpathSync, rmSync, symlinkSync,
  writeFileSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { generateById } from '../../prompts/hard_points/system/structure/scripts/generate-index-by-id.mjs';
import { generateByPath, readEntries } from '../../prompts/hard_points/system/structure/scripts/generate-index-by-path.mjs';
import { generateSecondary } from '../../prompts/hard_points/system/structure/scripts/generate-secondary-index.mjs';
import { generateMaster } from '../../prompts/hard_points/system/structure/scripts/generate-index-master.mjs';

const engine = fileURLToPath(new URL('../../prompts/hard_points/system/structure/scripts/generate-index-by-id.mjs', import.meta.url));
const fullEngine = fileURLToPath(new URL('../../prompts/hard_points/system/structure/scripts/generate-all-indexes-v3.1.mjs', import.meta.url));
function fixture(t) {
  const root = mkdtempSync(join(realpathSync(tmpdir()), 'aikido-by-id-test-'));
  t.after(() => rmSync(root, { recursive: true, force: true }));
  mkdirSync(join(root, 'prompts/hard_points/system/structure'), { recursive: true });
  return root;
}
function file(root, path, value = 'fixture\n') {
  const dest = join(root, path);
  mkdirSync(dirname(dest), { recursive: true });
  writeFileSync(dest, value);
}
const hash = path => createHash('sha256').update(path).digest('hex').slice(0, 12);

test('by-id honors nested gitignore, negation, fixed exclusions and special names outside a Git repo', t => {
  const root = fixture(t);
  file(root, '.gitignore', '*.ignored\n!keep.ignored\nfolder/\n');
  file(root, 'drop.ignored');
  file(root, 'keep.ignored');
  file(root, 'folder/hidden');
  file(root, 'sub/.gitignore', '*.txt\n!keep.txt\n');
  file(root, 'sub/nested.txt');
  file(root, 'sub/keep.txt');
  file(root, '.env.local', 'secret should never be read');
  file(root, 'node_modules/do-not-read');
  const specialPath = process.platform === 'win32' ? 'sub/space é.md' : 'sub/quote"é\nline.md';
  file(root, specialPath, '---\nlast-check: today\n---\ntext');
  file(root, 'sub/binary.bin', Buffer.from([0, 1, 2, 10]));
  if (process.platform !== 'win32') symlinkSync(join(root, 'keep.ignored'), join(root, 'linked'));
  const result = generateById(root);
  assert.equal(result.batches, 16);
  const { entries } = readEntries(root);
  const byPath = new Map(entries.map(([path, id, metadata]) => [path, { id, ...metadata }]));
  for (const path of ['.gitignore', 'keep.ignored', 'sub/.gitignore', 'sub/keep.txt', specialPath, 'sub/binary.bin']) {
    assert.ok(byPath.has(path), path);
    assert.equal(byPath.get(path).id, hash(path));
  }
  for (const path of ['drop.ignored', 'folder/hidden', 'sub/nested.txt', '.env.local', 'node_modules/do-not-read', 'linked']) {
    assert.ok(!byPath.has(path), path);
  }
  assert.equal(byPath.get(specialPath).lines, 4);
  assert.equal(byPath.get('sub/binary.bin').check_status, '❌ binary');
  assert.equal(byPath.get(specialPath).type, 'markdown');
  assert.equal(readdirSync(join(root, 'prompts/hard_points/system/structure/indices/by-id')).length, 16);
  assert.equal(generateById(root).files, result.files);
});

test('new by-id feeds all secondary generators and master through >1000 entries', t => {
  const root = fixture(t);
  for (let i = 0; i < 1002; i++) file(root, `src/f${String(i).padStart(4, '0')}.md`);
  assert.equal(generateById(root).files, 1002);
  generateByPath(root);
  for (const kind of ['alpha', 'directory', 'type']) generateSecondary(root, kind);
  assert.equal(generateMaster(root).metadata.statistics.total_files, 1002);
  assert.equal(generateById(root).files, 1002);
});

test('missing Git or invalid output does not overwrite existing batches', t => {
  const root = fixture(t);
  file(root, 'source.txt');
  generateById(root);
  const batch = join(root, 'prompts/hard_points/system/structure/indices/by-id', `index-id-${hash('source.txt')[0]}.json`);
  const before = readFileSync(batch);
  const result = spawnSync(process.execPath, [engine], {
    env: { ...process.env, PROJECT_ROOT: root, PATH: join(root, 'no-git') }, encoding: 'utf8',
  });
  assert.equal(result.status, 1);
  assert.match(result.stderr, /Git execution failed/);
  assert.deepEqual(readFileSync(batch), before);
  if (process.platform !== 'win32') {
    file(root, 'bad\\name');
    assert.throws(() => generateById(root), /Unsupported filename/);
    assert.deepEqual(readFileSync(batch), before);
  }
});

test('full Node CLI produces consistent indexes and reindexes without self-inclusion', t => {
  const root = fixture(t);
  file(root, 'content/file.md', 'content\n');
  const run = () => spawnSync(process.execPath, [fullEngine], {
    cwd: root, env: { ...process.env, PROJECT_ROOT: root }, encoding: 'utf8', timeout: 30000,
  });
  const first = run();
  assert.equal(first.status, 0, `${first.stdout}\n${first.stderr}`);
  const master = join(root, 'prompts/hard_points/system/structure/index.json');
  assert.equal(JSON.parse(readFileSync(master, 'utf8')).metadata.statistics.total_files, 1);
  const unrelated = join(root, 'prompts/hard_points/system/structure/indices/by-id/user.json');
  writeFileSync(unrelated, 'keep');
  const second = run();
  assert.equal(second.status, 0, `${second.stdout}\n${second.stderr}`);
  assert.equal(JSON.parse(readFileSync(master, 'utf8')).metadata.statistics.total_files, 1);
  assert.equal(readFileSync(unrelated, 'utf8'), 'keep');
  assert.match(second.stdout, /Node sequential/);
});

test('full generation refuses unsafe outputs and Git absence without replacing prior indexes', t => {
  if (process.platform === 'win32') return t.skip('Symlinks require Windows privileges');
  const root = fixture(t);
  file(root, 'source.txt');
  const run = env => spawnSync(process.execPath, [fullEngine], {
    env: { ...process.env, PROJECT_ROOT: root, ...env }, encoding: 'utf8',
  });
  assert.equal(run({}).status, 0);
  const structure = join(root, 'prompts/hard_points/system/structure');
  const master = join(structure, 'index.json');
  const original = readFileSync(master);
  file(root, 'new-file.txt');
  const noGit = run({ PATH: join(root, 'no-git') });
  assert.equal(noGit.status, 1);
  assert.match(noGit.stderr, /Git execution failed/);
  assert.deepEqual(readFileSync(master), original);
  const index = join(structure, 'indices/by-id/index-id-0.json');
  const victim = join(root, 'victim');
  file(root, 'victim', 'keep');
  rmSync(index);
  symlinkSync(victim, index);
  const unsafe = run({});
  assert.equal(unsafe.status, 1);
  assert.match(unsafe.stderr, /Symlink refused/);
  assert.deepEqual(readFileSync(master), original);
  assert.equal(readFileSync(victim, 'utf8'), 'keep');
});
