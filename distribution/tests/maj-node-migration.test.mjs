import { test } from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import {
  chmodSync, copyFileSync, lstatSync, mkdirSync, mkdtempSync, readdirSync,
  readFileSync, realpathSync, rmSync, symlinkSync, utimesSync, writeFileSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import { syncBuiltinESMExports } from 'node:module';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  generateMonoIndex, generateMultiIndex, syncDirectory, syncFile,
  deployMappings, validateDeployment, validateIndexes, writePhaseLog,
} from '../../prompts/hard_points/system/maj/scripts/maj-node-migration.mjs';

const scriptDir = fileURLToPath(new URL('../../prompts/hard_points/system/maj/scripts/', import.meta.url));
const engine = join(scriptDir, 'maj-node-migration.mjs');

function fixture(t) {
  const root = realpathSync(mkdtempSync(join(tmpdir(), 'aikido-maj-node-')));
  t.after(() => rmSync(root, { recursive: true, force: true }));
  const pathOf = (...parts) => join(root, ...parts);
  for (const dir of [
    'mono/prompts', 'multi/prompts/alpha', 'multi/prompts/beta',
    'deployment/target/.roo/commands', 'deployment/target/.claude/commands',
    'deployment/target/.claude/agents', 'deployment/source/.roo/commands',
    'deployment/source/.claude/commands', 'deployment/source/.claude/agents',
    'sync/source', 'sync/target',
  ]) mkdirSync(pathOf(dir), { recursive: true });
  return pathOf;
}

test('ending-3 generates and validates mono and named multi indexes', (t) => {
  const pathOf = fixture(t);
  const mono = pathOf('mono');
  const generatedMono = generateMonoIndex(mono);
  assert.match(readFileSync(generatedMono.path, 'utf8'), /SINGLE entry point/);
  assert.equal(validateIndexes(mono, 'MONO').checked.length, 1);

  const multi = pathOf('multi');
  const generatedMulti = generateMultiIndex(multi, ['alpha', 'beta']);
  const global = readFileSync(generatedMulti.path, 'utf8');
  assert.match(global, /\[alpha\]\(alpha\/index\.md\)/);
  assert.equal(generatedMulti.projects.length, 2);
  assert.equal(validateIndexes(multi, 'MULTI', ['alpha', 'beta']).checked.length, 3);
  assert.throws(() => generateMultiIndex(multi, ['../outside']), /Invalid project name/);
  assert.throws(() => generateMultiIndex(multi, []), /at least one project/);
  assert.throws(() => validateIndexes(multi, 'UNKNOWN'), /Invalid project type/);
});

test('ending-3 refuses symlink output paths', (t) => {
  if (process.platform === 'win32') return t.skip('Symlink creation requires Windows privileges');
  const pathOf = fixture(t);
  const prompts = pathOf('mono', 'prompts');
  const outside = pathOf('multi', 'prompts', 'alpha', 'sentinel.md');
  writeFileSync(outside, 'unrelated content');
  symlinkSync(outside, join(prompts, 'index.md'));
  t.after(() => rmSync(join(prompts, 'index.md'), { force: true }));
  assert.throws(() => generateMonoIndex(pathOf('mono')), /Unsafe output file/);
  assert.equal(readFileSync(outside, 'utf8'), 'unrelated content');
});

test('ending-3 preserves customized mono indexes and is idempotent', (t) => {
  const pathOf = fixture(t);
  const prompts = pathOf('mono/prompts');
  const output = join(prompts, 'index.md');
  const original = Buffer.from('# Custom navigation\r\nPrivate links: [notes](notes.md)\r\n');
  writeFileSync(output, original);
  generateMonoIndex(pathOf('mono'));
  const backups = () => readdirSync(prompts).filter((name) => name.startsWith('index.md.bak.'));
  assert.equal(backups().length, 1);
  assert.deepEqual(readFileSync(join(prompts, backups()[0])), original);
  const generated = readFileSync(output);
  const before = lstatSync(output).mtimeMs;
  generateMonoIndex(pathOf('mono'));
  assert.equal(backups().length, 1);
  assert.equal(lstatSync(output).mtimeMs, before);
  assert.deepEqual(readFileSync(output), generated);
  writeFileSync(output, 'second customization');
  generateMonoIndex(pathOf('mono'));
  assert.equal(backups().length, 2);
  assert.deepEqual(backups().map((name) => readFileSync(join(prompts, name), 'utf8')).sort(),
    [original.toString(), 'second customization'].sort());
});

test('ending-3 preserves customized global and project indexes independently', (t) => {
  const pathOf = fixture(t);
  const root = pathOf('multi');
  for (const relative of ['prompts', 'prompts/alpha', 'prompts/beta']) {
    writeFileSync(join(root, relative, 'index.md'), `Custom ${relative}\r\n`);
  }
  generateMultiIndex(root, ['alpha', 'beta']);
  validateIndexes(root, 'MULTI', ['alpha', 'beta']);
  generateMultiIndex(root, ['alpha', 'beta']);
  for (const relative of ['prompts', 'prompts/alpha', 'prompts/beta']) {
    const directory = join(root, relative);
    const backups = readdirSync(directory).filter((name) => name.startsWith('index.md.bak.'));
    assert.equal(backups.length, 1);
    assert.equal(readFileSync(join(directory, backups[0]), 'utf8'), `Custom ${relative}\r\n`);
  }
});

test('ending-3 backup failure blocks mono and all multi replacements', (t) => {
  const pathOf = fixture(t);
  for (const relative of ['mono/prompts', 'multi/prompts', 'multi/prompts/alpha', 'multi/prompts/beta']) {
    writeFileSync(pathOf(relative, 'index.md'), `Custom ${relative}`);
  }
  const copy = fs.copyFileSync;
  let copies = 0;
  t.mock.method(fs, 'copyFileSync', (...args) => {
    if (++copies === 2) throw Object.assign(new Error('Backup refused'), { code: 'EACCES' });
    return copy(...args);
  });
  syncBuiltinESMExports();
  try {
    assert.throws(() => generateMultiIndex(pathOf('multi'), ['alpha', 'beta']), /Backup refused/);
    copies = 1;
    assert.throws(() => generateMonoIndex(pathOf('mono')), /Backup refused/);
    for (const relative of ['mono/prompts', 'multi/prompts', 'multi/prompts/alpha', 'multi/prompts/beta']) {
      assert.equal(readFileSync(pathOf(relative, 'index.md'), 'utf8'), `Custom ${relative}`);
    }
  } finally {
    t.mock.restoreAll();
    syncBuiltinESMExports();
  }
});

test('ending-3 rejects unsafe project indexes before touching the global index', (t) => {
  if (process.platform === 'win32') return t.skip('Symlink creation requires Windows privileges');
  const pathOf = fixture(t);
  const root = pathOf('multi');
  const global = join(root, 'prompts/index.md');
  const sentinel = pathOf('mono/prompts/sentinel.md');
  writeFileSync(global, 'custom global');
  writeFileSync(sentinel, 'unrelated content');
  symlinkSync(sentinel, join(root, 'prompts/beta/index.md'));
  assert.throws(() => generateMultiIndex(root, ['alpha', 'beta']), /Unsafe project index/);
  assert.equal(readFileSync(global, 'utf8'), 'custom global');
  assert.equal(readFileSync(sentinel, 'utf8'), 'unrelated content');
  assert.deepEqual(readdirSync(join(root, 'prompts')).sort(), ['alpha', 'beta', 'index.md']);
});

test('fixture cleanup removes only its uniquely allocated test root', (t) => {
  const other = fixture(t);
  const sentinel = other('sentinel.md');
  writeFileSync(sentinel, 'not owned by the cleaned fixture');
  let cleanup;
  const owned = fixture({ after: (callback) => { cleanup = callback; } });
  assert.notEqual(owned(), other());
  try {
    cleanup();
    assert.equal(readFileSync(sentinel, 'utf8'), 'not owned by the cleaned fixture');
  } finally {
    cleanup();
  }
});

test('ending-8 deploys exact files with unique backups and content validation', (t) => {
  const pathOf = fixture(t);
  const target = pathOf('deployment', 'target');
  const source = pathOf('deployment', 'source');
  const targetCommands = join(target, '.roo/commands');
  const sourceCommands = join(source, '.roo/commands');
  writeFileSync(join(targetCommands, 'update.md'), 'new command');
  writeFileSync(join(sourceCommands, 'update.md'), 'old command');
  writeFileSync(join(join(target, '.claude/commands'), 'check.md'), 'check command');
  writeFileSync(join(join(target, '.claude/agents'), 'reviewer.md'), 'agent prompt');
  writeFileSync(join(target, 'AGENTS.md'), 'root instructions');
  writeFileSync(join(target, '.roomodes'), 'roo modes');

  const deploy = (kind) => {
    const result = requireDeploymentCli(kind, target, source);
    assert.equal(result.status, 0, result.stderr);
    return result.stdout.trim();
  };
  assert.equal(deploy('deploy-commands'), '2');
  assert.equal(deploy('deploy-agents'), '1');
  assert.equal(deploy('deploy-root-files'), '2');
  assert.equal(readFileSync(join(sourceCommands, 'update.md'), 'utf8'), 'new command');
  const backup = readdirSync(sourceCommands).find((name) => name.startsWith('update.md.bak.'));
  assert.ok(backup);
  assert.equal(readFileSync(join(sourceCommands, backup), 'utf8'), 'old command');
  assert.equal(validateDeployment(target, source).status, 'PASSED');

  writeFileSync(join(sourceCommands, 'update.md'), 'same-size???');
  assert.match(validateDeployment(target, source).status, /^WARNINGS:/);
});

test('ending-8 rejects symlinked destination paths and detects filename collisions', (t) => {
  if (process.platform === 'win32') return t.skip('Symlink creation requires Windows privileges');
  const pathOf = fixture(t);
  const target = pathOf('deployment', 'target');
  const source = pathOf('deployment', 'source');
  const external = pathOf('deployment', 'target', '.roo');
  rmSync(join(source, '.roo'), { recursive: true, force: true });
  symlinkSync(external, join(source, '.roo'));
  assert.throws(() => deployMappings('commands', target, source), /Unsafe directory/);
  rmSync(join(source, '.roo'), { force: true });
  mkdirSync(join(source, '.roo/commands'), { recursive: true });
  const commandRoot = join(target, '.roo/commands');
  writeFileSync(join(commandRoot, 'duplicate.md'), 'top-level');
  mkdirSync(join(commandRoot, 'nested'));
  writeFileSync(join(commandRoot, 'nested/duplicate.md'), 'nested');
  assert.throws(() => deployMappings('commands', target, source), /collide/);
});

test('Node commands preserve their numeric/status output contracts', (t) => {
  const pathOf = fixture(t);
  const run = (command, ...args) => spawnSync(process.execPath, [engine, command, ...args], { encoding: 'utf8' });

  const mono = pathOf('mono');
  assert.equal(run('generate-mono', mono).status, 0);
  assert.match(run('validate-indexes', mono, 'MONO').stdout, /Validation MONO/);
  const multi = pathOf('multi');
  assert.equal(run('generate-multi', multi, 'alpha', 'beta').status, 0);
  assert.equal(run('validate-indexes', multi, 'MULTI', 'alpha', 'beta').status, 0);

  const target = pathOf('deployment', 'target');
  const source = pathOf('deployment', 'source');
  writeFileSync(join(target, '.roo/commands', 'adapter.md'), 'adapter');
  writeFileSync(join(target, '.claude/agents', 'agent.md'), 'agent');
  writeFileSync(join(target, 'AGENTS.md'), 'root');
  assert.match(run('deploy-commands', target, source).stdout, /\n1\n$/);
  assert.match(run('deploy-agents', target, source).stdout, /\n1\n$/);
  assert.match(run('deploy-root-files', target, source).stdout, /\n1\n$/);
  assert.match(run('validate-deployment', target, source).stdout, /\nPASSED\n$/);

  const syncSource = join(pathOf('sync/source'), 'adapter.md');
  const syncTarget = join(pathOf('sync/target'), 'adapter.md');
  writeFileSync(syncSource, 'shell adapter');
  const single = run('sync-file', syncSource, syncTarget);
  assert.equal(single.status, 0, single.stderr);
  assert.match(single.stdout, /Copy/);
  const batch = run('sync-directories', pathOf('sync/source'), pathOf('sync/target'), '*.md');
  assert.equal(batch.status, 0, batch.stderr);
  assert.match(batch.stdout, /Total: 1 files/);
});

test('ending-3 plan documents direct Node engine calls with explicit project names', (t) => {
  const pathOf = fixture(t);
  const planPath = fileURLToPath(new URL('../../prompts/hard_points/system/maj/plans/plan-ending-3.md', import.meta.url));
  const plan = readFileSync(planPath, 'utf8');
  assert.doesNotMatch(plan, /```(?:bash|sh|shell|zsh)/);
  assert.match(plan, /generate-mono/);
  assert.match(plan, /generate-multi/);
  assert.match(plan, /validate-indexes/);
  const mono = pathOf('mono');
  const monoResult = spawnSync(process.execPath, [engine, 'generate-mono', mono], { encoding: 'utf8' });
  assert.equal(monoResult.status, 0, monoResult.stderr);
  assert.match(readFileSync(join(mono, 'prompts/index.md'), 'utf8'), /SINGLE entry point/);
  const multi = pathOf('multi');
  const multiResult = spawnSync(process.execPath, [engine, 'generate-multi', multi, 'alpha', 'beta'], { encoding: 'utf8' });
  assert.equal(multiResult.status, 0, multiResult.stderr);
  const validation = spawnSync(process.execPath, [engine, 'validate-indexes', multi, 'MULTI', 'alpha', 'beta'], { encoding: 'utf8' });
  assert.equal(validation.status, 0, validation.stderr);
});

test('ending-8 plan uses direct Node CLI operations and safely publishes logs', (t) => {
  const pathOf = fixture(t);
  const target = pathOf('deployment', 'target');
  const source = pathOf('deployment', 'source');
  writeFileSync(join(target, '.roo/commands', 'command.md'), 'command');
  writeFileSync(join(target, '.claude/agents', 'agent.md'), 'agent');
  writeFileSync(join(target, 'AGENTS.md'), 'root');
  const planPath = fileURLToPath(new URL('../../prompts/hard_points/system/maj/plans/plan-ending-8.md', import.meta.url));
  const plan = readFileSync(planPath, 'utf8');
  assert.doesNotMatch(plan, /```(?:bash|sh|shell|zsh)/);
  assert.match(plan, /process calls with argument arrays/);
  const run = (command, ...args) => spawnSync(process.execPath, [engine, command, '--quiet', ...args], { encoding: 'utf8' });
  assert.equal(run('deploy-commands', target, source).stdout, '1\n');
  assert.equal(run('deploy-agents', target, source).stdout, '1\n');
  assert.equal(run('deploy-root-files', target, source).stdout, '1\n');
  assert.equal(run('validate-deployment', target, source).stdout, 'PASSED\n');
  const logging = spawnSync(process.execPath, [engine, 'write-log', '--quiet', source], {
    input: 'Plan Ending-8 : direct Node log\n', encoding: 'utf8',
  });
  assert.equal(logging.status, 0, logging.stderr);
  assert.match(logging.stdout.replaceAll('\\', '/'), /prompts\/spec\/logs\/phase-8-/);
  assert.equal(readdirSync(join(source, 'prompts/spec/logs')).length, 1);
});

test('MAJ synchronization excludes custom private stores and rejects explicit private file copies', (t) => {
  const pathOf = fixture(t);
  const target = pathOf('deployment/target');
  const source = pathOf('deployment/source');
  const sourceDir = join(target, '.roo/commands');
  const store = join(sourceDir, 'user-session-data');
  mkdirSync(join(store, 'cards'), { recursive: true });
  writeFileSync(join(sourceDir, 'approved-command.md'), 'public command\n');
  writeFileSync(join(store, 'store.json'), '{"schemaVersion":"task-store/1"}');
  const privateFile = join(store, 'cards', 'canary.md');
  writeFileSync(privateFile, 'PRIVATE_TASK_CANARY\n');

  const result = deployMappings('commands', target, source);
  assert.equal(result.count, 1);
  assert.equal(readFileSync(join(source, '.roo/commands/approved-command.md'), 'utf8'), 'public command\n');
  assert.equal(lstatSync(join(source, '.roo/commands/user-session-data'), { throwIfNoEntry: false }), undefined);
  assert.throws(() => syncFile(privateFile, join(source, 'private-copy.md')), /Private Task Store data/);
  assert.equal(lstatSync(join(source, 'private-copy.md'), { throwIfNoEntry: false }), undefined);
});

test('sync-file preserves timestamp conflict behavior and creates requested backups', (t) => {
  const pathOf = fixture(t);
  const source = pathOf('sync', 'source', 'same.md');
  const target = pathOf('sync', 'target', 'same.md');
  writeFileSync(source, 'source version');
  writeFileSync(target, 'target version');
  utimesSync(source, 1_700_000_000, 1_700_000_000);
  utimesSync(target, 1_700_000_000, 1_700_000_000);
  assert.equal(syncFile(source, target).action, 'kept-target');
  assert.equal(readFileSync(target, 'utf8'), 'target version');
  assert.equal(syncFile(source, target, { force: true, backup: true }).action, 'copied');
  assert.equal(readFileSync(target, 'utf8'), 'source version');
  const backupDir = join(pathOf('sync', 'target'), '.backup');
  assert.equal(readdirSync(backupDir).length, 1);
  assert.equal(readFileSync(join(backupDir, readdirSync(backupDir)[0]), 'utf8'), 'target version');
});

test('phase-8 logs are safely created under SOURCE without overwriting prior runs', (t) => {
  const pathOf = fixture(t);
  const source = pathOf('mono');
  const first = writePhaseLog(source, 'first');
  const second = writePhaseLog(source, 'second');
  assert.notEqual(first, second);
  assert.equal(readFileSync(first, 'utf8'), 'first');
  assert.equal(readFileSync(second, 'utf8'), 'second');
  assert.match(first.replaceAll('\\', '/'), /prompts\/spec\/logs\/phase-8-/);
});

test('phase-8 refuses symlinked log directories and sync rejects unsafe patterns/options', (t) => {
  if (process.platform === 'win32') return t.skip('Symlink creation requires Windows privileges');
  const pathOf = fixture(t);
  const prompts = pathOf('mono', 'prompts');
  symlinkSync(pathOf('multi', 'prompts'), join(prompts, 'spec'));
  assert.throws(() => writePhaseLog(pathOf('mono'), 'unsafe'), /Unsafe directory/);

  const source = pathOf('sync', 'source');
  const target = pathOf('sync', 'target');
  const invalidOption = spawnSync(process.execPath, [engine, 'sync-file', 'missing', 'target', '--unknown'], {
    encoding: 'utf8',
  });
  assert.equal(invalidOption.status, 1);
  const invalidPattern = spawnSync(process.execPath, [engine, 'sync-directories', source, target, '**/*.md'], {
    encoding: 'utf8',
  });
  assert.equal(invalidPattern.status, 1);
  assert.match(invalidPattern.stderr, /path separators/);
});

test('sync-directory counts actions directly, filters names and does not recurse', (t) => {
  const pathOf = fixture(t);
  const source = pathOf('sync', 'source');
  const target = pathOf('sync', 'target');
  writeFileSync(join(source, 'copy.md'), 'new source');
  writeFileSync(join(source, 'kept.md'), 'source old');
  writeFileSync(join(source, 'ignore.txt'), 'not selected');
  writeFileSync(join(target, 'kept.md'), 'target newer');
  utimesSync(join(source, 'kept.md'), 1_600_000_000, 1_600_000_000);
  utimesSync(join(target, 'kept.md'), 1_700_000_000, 1_700_000_000);
  mkdirSync(join(source, 'nested'));
  writeFileSync(join(source, 'nested', 'nested.md'), 'not selected');
  const result = syncDirectory(source, target, '*.md');
  assert.deepEqual(result, { total: 2, copied: 1, identical: 0, kept: 1, errors: 0 });
  assert.equal(readFileSync(join(target, 'copy.md'), 'utf8'), 'new source');
  assert.equal(readdirSync(target).includes('nested.md'), false);
});

test('migration suite runs from a read-only source tree without writing fixtures there', (t) => {
  if (process.env.AIKIDO_MAJ_READONLY_CHILD === '1') return t.skip('Read-only child suite');
  if (process.platform === 'win32') return t.skip('POSIX read-only permissions; use a read-only mount on Windows');
  const pathOf = fixture(t);
  const root = pathOf('read-only checkout');
  const testRelative = 'distribution/tests/maj-node-migration.test.mjs';
  const scriptsRelative = 'prompts/hard_points/system/maj/scripts';
  const plansRelative = 'prompts/hard_points/system/maj/plans';
  const copies = [
    [fileURLToPath(import.meta.url), testRelative],
    [engine, `${scriptsRelative}/maj-node-migration.mjs`],
    [
      fileURLToPath(new URL('../../prompts/hard_points/system/structure/scripts/lib/private-task-store.mjs', import.meta.url)),
      'prompts/hard_points/system/structure/scripts/lib/private-task-store.mjs',
    ],
    ...['plan-ending-3.md', 'plan-ending-8.md'].map((name) => [
      fileURLToPath(new URL(`../../${plansRelative}/${name}`, import.meta.url)),
      `${plansRelative}/${name}`,
    ]),
  ];
  for (const [source, relative] of copies) {
    const destination = join(root, relative);
    mkdirSync(join(destination, '..'), { recursive: true });
    copyFileSync(source, destination);
  }
  const directories = [];
  function lock(directory) {
    directories.push(directory);
    for (const entry of readdirSync(directory, { withFileTypes: true })) {
      const path = join(directory, entry.name);
      if (entry.isDirectory()) lock(path);
      else chmodSync(path, 0o444);
    }
    chmodSync(directory, 0o555);
  }
  try {
    lock(root);
    const probe = join(root, 'write-probe');
    try {
      writeFileSync(probe, '', { flag: 'wx' });
      rmSync(probe);
      return t.skip('Current user bypasses read-only permissions');
    } catch (error) {
      assert.ok(['EACCES', 'EPERM', 'EROFS'].includes(error.code), error.message);
    }
    const env = { ...process.env, AIKIDO_MAJ_READONLY_CHILD: '1' };
    delete env.NODE_TEST_CONTEXT;
    const result = spawnSync(process.execPath, ['--test', join(root, testRelative)], {
      cwd: root,
      env,
      encoding: 'utf8', timeout: 60_000,
    });
    assert.ifError(result.error);
    assert.equal(result.status, 0, `${result.stdout}\n${result.stderr}`);
    assert.match(result.stdout, /fixture cleanup removes only its uniquely allocated test root/);
    assert.deepEqual(readdirSync(join(root, 'distribution/tests')), ['maj-node-migration.test.mjs']);
  } finally {
    for (const directory of directories) chmodSync(directory, 0o700);
    for (const [, relative] of copies) chmodSync(join(root, relative), 0o600);
  }
});

function requireDeploymentCli(command, target, source) {
  return spawnSync(process.execPath, [engine, command, '--quiet', target, source], { encoding: 'utf8' });
}
