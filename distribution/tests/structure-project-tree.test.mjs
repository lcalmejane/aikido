import { test } from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import {
  mkdirSync, mkdtempSync, readFileSync, realpathSync, rmSync, symlinkSync, utimesSync,
  writeFileSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { generateProjectTree } from '../../prompts/hard_points/system/structure/scripts/generate-project-tree.mjs';
import { generateById } from '../../prompts/hard_points/system/structure/scripts/generate-index-by-id.mjs';
import { readEntries } from '../../prompts/hard_points/system/structure/scripts/generate-index-by-path.mjs';
import { updateChanged } from '../../prompts/hard_points/system/structure/scripts/update-incremental.mjs';

const engine = fileURLToPath(new URL('../../prompts/hard_points/system/structure/scripts/generate-project-tree.mjs', import.meta.url));
function fixture(t) {
  const directory = mkdtempSync(join(realpathSync(tmpdir()), 'aikido-project-tree-test-'));
  const root = join(directory, 'project');
  mkdirSync(root);
  const output = join(directory, 'result.json');
  t.after(() => rmSync(directory, { recursive: true, force: true }));
  return { directory, root, output };
}

function put(root, path, value) {
  const target = join(root, path);
  mkdirSync(dirname(target), { recursive: true });
  writeFileSync(target, value);
}

test('tree engine preserves the JSON contract, metadata and exclusions on an isolated fixture', t => {
  const { root, output } = fixture(t);
  put(root, '.gitignore', '*.ignored\n!keep.ignored\nfolder/\nliteralX.md\nliteralQ.md\n');
  put(root, 'drop.ignored', 'ignored\n');
  put(root, 'keep.ignored', 'included\n');
  put(root, 'folder/drop.txt', 'ignored\n');
  put(root, 'prompts/gen/.gitignore', '*.private\n!important.private\n');
  put(root, 'prompts/gen/hidden.private', 'ignored\n');
  put(root, 'prompts/gen/important.private', 'included\n');
  put(root, 'prompts/gen/local/.gitignore', '*.secret\n!keep.secret\n');
  put(root, 'prompts/gen/local/drop.secret', 'ignored\n');
  put(root, 'prompts/gen/local/keep.secret', 'included\n');
  put(root, 'prompts/gen/personas/agent.md', '---\nlast-check: yes\n---\nagent\n');
  put(root, 'quote"\nline.md', 'line\n');
  put(root, 'literal*.md', 'literal\n');
  put(root, 'literal[?].md', 'brackets\n');
  put(root, 'literalX.md', 'ignored by name\n');
  put(root, 'literalQ.md', 'ignored by name\n');
  put(root, ':leading.md', 'colon\n');
  put(root, 'binary.bin', Buffer.from([0, 1, 10]));
  put(root, 'node_modules/ignored.js', 'ignored\n');
  if (process.platform !== 'win32') symlinkSync(join(root, 'quote"\nline.md'), join(root, 'linked.md'));

  const result = generateProjectTree({
    projectRoot: root,
    outputFile: output,
    now: new Date('2026-01-02T03:04:05.000Z'),
  });

  test('tree, by-id and incremental indexing exclude custom private Task Store roots', t => {
    const { directory, root, output } = fixture(t);
    put(root, 'public.md', 'public content\n');
    put(root, 'custom-user-data/store.json', JSON.stringify({ schemaVersion: 'task-store/1' }));
    put(root, 'custom-user-data/events/canary.md', 'PRIVATE_TASK_CANARY must never be indexed\n');
    if (process.platform !== 'win32') {
      symlinkSync(join(root, 'custom-user-data'), join(root, 'private-alias'));
    }

    generateProjectTree({ projectRoot: root, outputFile: output });
    const tree = JSON.parse(readFileSync(output, 'utf8'));
    assert.ok(tree.index.by_path['public.md']);
    assert.equal(Object.keys(tree.index.by_path).some(path => path.includes('custom-user-data')), false);
    assert.equal(JSON.stringify(tree).includes('PRIVATE_TASK_CANARY'), false);

    const indexRoot = join(directory, 'by-id');
    mkdirSync(join(indexRoot, 'prompts/hard_points/system/structure'), { recursive: true });
    generateById(root, indexRoot);
    const paths = new Set(readEntries(indexRoot).entries.map(([path]) => path));
    assert.ok(paths.has('public.md'));
    assert.equal([...paths].some(path => path.includes('custom-user-data')), false);
    assert.equal([...paths].some(path => path.includes('private-alias')), false);
    assert.throws(() => updateChanged(root, ['custom-user-data/events/canary.md']), /Private Task Store/);
  });
  const payload = JSON.parse(readFileSync(output, 'utf8'));
  assert.equal(payload.metadata.last_check.timestamp, '2026-01-02T03:04:05.000Z');
  assert.equal(payload.metadata.last_check.generator, 'agent-aikido-projet-index');
  assert.equal(payload.metadata.last_check.version, '2.1');
  assert.equal(payload.metadata.exclusions.gitignore_count, 3);
  assert.ok(payload.index.by_path['prompts/gen/personas/agent.md']);
  assert.equal(payload.index.by_path['prompts/gen/personas/agent.md'].type, 'agent');
  assert.equal(payload.index.by_path['prompts/gen/personas/agent.md'].check_status, '✅');
  assert.equal(payload.index.by_path['binary.bin'].check_status, '❌ binary');
  assert.equal(payload.index.by_path['binary.bin'].lines, 0);
  assert.deepEqual(payload.index.by_name['agent.md'], ['prompts/gen/personas/agent.md']);
  assert.deepEqual(payload.index.by_directory['prompts/gen/personas'].files, ['prompts/gen/personas/agent.md']);
  for (const excluded of [
    'drop.ignored', 'folder/drop.txt', 'literalX.md', 'literalQ.md', 'prompts/gen/hidden.private',
    'prompts/gen/local/drop.secret', 'node_modules/ignored.js', 'linked.md',
  ]) {
    assert.equal(Object.hasOwn(payload.index.by_path, excluded), false, excluded);
  }
  for (const included of [
    'keep.ignored', 'prompts/gen/important.private', 'prompts/gen/local/keep.secret',
    'literal*.md', 'literal[?].md', ':leading.md',
  ]) {
    assert.ok(Object.hasOwn(payload.index.by_path, included), included);
  }
  assert.deepEqual(payload.metadata.statistics, { total_files: 12, total_dirs: 5, total_lines: 20 });
  assert.equal(result.total_files, 12);
});

test('Node CLI preserves the selected output path and PROJECT_ROOT', t => {
  const { root, output } = fixture(t);
  put(root, 'hello.md', 'Hello\n');
  const result = spawnSync(process.execPath, [engine, output], {
    cwd: root,
    env: { ...process.env, PROJECT_ROOT: root },
    encoding: 'utf8',
    timeout: 10000,
  });
  assert.equal(result.status, 0, `${result.stdout}\n${result.stderr}`);
  assert.match(result.stdout, /^📏 Taille: .+\n$/);
  assert.equal(JSON.parse(readFileSync(output, 'utf8')).index.by_path['hello.md'].name, 'hello.md');
});

test('tree engine refuses unsafe output and reports scan errors without clobbering files', t => {
  const { root, output } = fixture(t);
  put(root, 'source.md', 'safe\n');
  writeFileSync(output, 'keep');
  if (process.platform !== 'win32') {
    const link = join(root, 'output-link.json');
    symlinkSync(output, link);
    assert.throws(() => generateProjectTree({ projectRoot: root, outputFile: link }), /Refusing to replace/);
    assert.equal(readFileSync(output, 'utf8'), 'keep');
  }
  assert.throws(() => generateProjectTree({ projectRoot: join(root, 'missing'), outputFile: output }));
  assert.equal(readFileSync(output, 'utf8'), 'keep');
  const engine = fileURLToPath(new URL('../../prompts/hard_points/system/structure/scripts/generate-project-tree.mjs', import.meta.url));
  const missingGit = spawnSync(process.execPath, [engine, output], {
    cwd: root,
    env: { ...process.env, PROJECT_ROOT: root, PATH: join(root, 'no-git') },
    encoding: 'utf8',
  });
  assert.equal(missingGit.status, 1);
  assert.match(missingGit.stderr, /Git execution failed/);
  assert.equal(readFileSync(output, 'utf8'), 'keep');
  if (process.platform === 'linux') {
    const invalidName = Buffer.concat([Buffer.from(join(root, 'invalid-')), Buffer.from([0xff])]);
    writeFileSync(invalidName, 'invalid filename\n');
    try {
      assert.throws(() => generateProjectTree({ projectRoot: root, outputFile: output }), /Non-UTF-8 filename/);
    } finally {
      rmSync(invalidName, { force: true });
    }
  }
});

test('raw Git ignore paths match Git oracle for directory negations and special names', t => {
  const { root, output } = fixture(t);
  put(root, '.gitignore', 'reopened/*\n!reopened/keep.txt\n*.ignored\n!keep.ignored\n');
  put(root, 'keep.ignored', 'include\n');
  put(root, 'drop.ignored', 'exclude\n');
  const specialNames = process.platform === 'win32' ? [] : [
    'literal*.ignored', 'literal[?].ignored', ':leading.ignored', 'line\nbreak.ignored',
  ];
  for (const path of specialNames) put(root, path, 'special name\n');
  put(root, 'reopened/drop.txt', 'exclude\n');
  put(root, 'reopened/keep.txt', 'include\n');

  const candidates = [
    'reopened', 'reopened/drop.txt', 'reopened/keep.txt', 'keep.ignored',
    'drop.ignored', ...specialNames,
  ];
  const emptyGlobalConfig = join(dirname(root), 'empty.gitconfig');
  writeFileSync(emptyGlobalConfig, '');
  const gitEnv = Object.fromEntries(Object.entries(process.env)
    .filter(([key]) => !key.toUpperCase().startsWith('GIT_')));
  gitEnv.GIT_CONFIG_NOSYSTEM = '1';
  gitEnv.GIT_CONFIG_GLOBAL = emptyGlobalConfig;
  const init = spawnSync('git', ['init', '--quiet'], { cwd: root, encoding: 'utf8', env: gitEnv });
  assert.equal(init.status, 0, init.stderr);
  const oracle = spawnSync('git', [
    'check-ignore', '--no-index', '--stdin', '-z',
  ], {
    cwd: root,
    env: gitEnv,
    input: Buffer.from(`${candidates.join('\0')}\0`),
  });
  assert.ok([0, 1].includes(oracle.status), oracle.stderr?.toString('utf8'));
  const expectedIgnored = new Set(oracle.stdout.toString('utf8').split('\0').filter(Boolean));
  assert.deepEqual(expectedIgnored, new Set(['reopened/drop.txt', 'drop.ignored', ...specialNames]));

  generateProjectTree({ projectRoot: root, outputFile: output });
  const tree = JSON.parse(readFileSync(output, 'utf8'));
  for (const path of expectedIgnored) assert.equal(Object.hasOwn(tree.index.by_path, path), false, path);
  for (const path of ['reopened/keep.txt', 'keep.ignored']) {
    assert.ok(Object.hasOwn(tree.index.by_path, path), path);
  }

  const indexRoot = mkdtempSync(join(realpathSync(tmpdir()), 'aikido-tree-by-id-test-'));
  t.after(() => rmSync(indexRoot, { recursive: true, force: true }));
  mkdirSync(join(indexRoot, 'prompts/hard_points/system/structure'), { recursive: true });
  generateById(root, indexRoot);
  const byIdPaths = new Set(readEntries(indexRoot).entries.map(([path]) => path));
  for (const path of expectedIgnored) assert.equal(byIdPaths.has(path), false, path);
  for (const path of ['reopened/keep.txt', 'keep.ignored']) assert.ok(byIdPaths.has(path), path);
});

test('project-tree and by-id metadata agree on line endings, mjs classification, and UTC date', t => {
  const { root, output } = fixture(t);
  const changedAt = new Date('2026-01-02T00:30:00.000Z');
  put(root, 'scripts/no-newline.mjs', 'export {};');
  put(root, 'scripts/with-newline.mjs', 'export {};\n');
  for (const path of ['scripts/no-newline.mjs', 'scripts/with-newline.mjs']) {
    utimesSync(join(root, path), changedAt, changedAt);
  }

  generateProjectTree({ projectRoot: root, outputFile: output });
  const tree = JSON.parse(readFileSync(output, 'utf8'));
  const indexRoot = mkdtempSync(join(realpathSync(tmpdir()), 'aikido-tree-by-id-test-'));
  t.after(() => rmSync(indexRoot, { recursive: true, force: true }));
  mkdirSync(join(indexRoot, 'prompts/hard_points/system/structure'), { recursive: true });
  generateById(root, indexRoot);
  const byId = new Map(readEntries(indexRoot).entries.map(([path, , metadata]) => [path, metadata]));

  for (const path of ['scripts/no-newline.mjs', 'scripts/with-newline.mjs']) {
    const treeMetadata = tree.index.by_path[path];
    assert.equal(treeMetadata.type, 'script');
    assert.equal(treeMetadata.lines, 1);
    assert.equal(treeMetadata.modified, '2026-01-02');
    assert.equal(treeMetadata.type, byId.get(path).type);
    assert.equal(treeMetadata.icon, byId.get(path).icon);
    assert.equal(treeMetadata.lines, byId.get(path).lines);
    assert.equal(treeMetadata.modified, byId.get(path).modified);
  }
});

test('tree Node CLI rejects extra arguments with a non-zero status', t => {
  const { root } = fixture(t);
  const result = spawnSync(process.execPath, [
    fileURLToPath(new URL('../../prompts/hard_points/system/structure/scripts/generate-project-tree.mjs', import.meta.url)),
    'one.json', 'two.json',
  ], { cwd: root, env: { ...process.env, PROJECT_ROOT: root }, encoding: 'utf8' });
  assert.equal(result.status, 1);
  assert.match(result.stderr, /at most one output-file/);
  const victim = join(root, '--parallel');
  writeFileSync(victim, 'preserve');
  const unsupported = spawnSync(process.execPath, [engine, '--parallel'], {
    cwd: root, env: { ...process.env, PROJECT_ROOT: root }, encoding: 'utf8',
  });
  assert.equal(unsupported.status, 1);
  assert.match(unsupported.stderr, /Unknown option/);
  assert.equal(readFileSync(victim, 'utf8'), 'preserve');
});
