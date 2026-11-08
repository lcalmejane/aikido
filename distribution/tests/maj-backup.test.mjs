import { test } from 'node:test';
import assert from 'node:assert/strict';
import { spawn, spawnSync } from 'node:child_process';
import {
  chmodSync, closeSync, constants as C, copyFileSync, existsSync,
  lstatSync, mkdirSync, mkdtempSync, openSync, readFileSync, readdirSync,
  realpathSync, rmSync, symlinkSync, writeFileSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { gzipSync } from 'node:zlib';
import { createBackup, MEMBERS } from '../../prompts/hard_points/system/maj/scripts/create-backup.mjs';

const scripts = fileURLToPath(new URL('../../prompts/hard_points/system/maj/scripts/', import.meta.url));
const engine = join(scripts, 'create-backup.mjs');
const plan = fileURLToPath(new URL('../../prompts/hard_points/system/maj/plans/plan-beginning.md', import.meta.url));
function fixture(t) {
  // Canonical temp path: macOS /var and /tmp can themselves be symlinks.
  const root = mkdtempSync(join(realpathSync(tmpdir()), 'aikido backup fixture '));
  t.after(() => rmSync(root, { recursive: true, force: true })); // Only owned fixtures.
  return root;
}
function source(t) {
  const root = fixture(t);
  const project = join(root, 'source with spaces');
  mkdirSync(project);
  writeFileSync(join(project, 'README.md'), 'fixture payload\n', { mode: 0o640 });
  return { root, project };
}
function guarded(t) {
  assert.ok(Number(process.versions.node.split('.')[0]) >= 24, 'Node.js 24+ required');
  assert.ok(['darwin', 'linux'].includes(process.platform), 'macOS or Linux required');
  return true;
}
// Minimal valid tar fixture (no external data and no extraction).
function tarFixture() {
  const header = Buffer.alloc(512);
  header.write('fixture.txt', 0);
  header.write('0000644\0', 100);
  header.write('0000000\0', 108);
  header.write('0000000\0', 116);
  header.write('00000000002\0', 124);
  header.write('00000000000\0', 136);
  header.fill(32, 148, 156);
  header.write('0', 156);
  header.write('ustar\0', 257);
  header.write('00', 263);
  const sum = header.reduce((a, b) => a + b, 0);
  header.write(`${sum.toString(8).padStart(6, '0')}\0 `, 148);
  const body = Buffer.alloc(512);
  body.write('x\n');
  return gzipSync(Buffer.concat([header, body, Buffer.alloc(1024)]));
}
function fakeTar(root, mode = 'ok', name = `tar-${mode}`) {
  const path = join(root, name);
  const bytes = tarFixture().toString('base64');
  writeFileSync(path, `#!${process.execPath}
import fs from 'node:fs';
const mode = ${JSON.stringify(mode)};
const args = process.argv.slice(2);
if (['TAR_OPTIONS', 'TAR_READER_OPTIONS', 'TAR_WRITER_OPTIONS', 'GZIP', 'GZIP_OPT']
    .some((key) => process.env[key] !== undefined)) process.exit(11);
if (mode === 'args') {
  if (args.slice(0, 3).join('|') !== '-czf|-|--') process.exit(9);
  if (args.slice(3).join('|') !== 'README.md') process.exit(10);
  if (fs.readFileSync('README.md', 'utf8') !== 'fixture payload\\n') process.exit(12);
}
if (mode === 'zero') process.exit(0);
if (mode === 'spawn-signal') process.kill(process.pid, 'SIGTERM');
fs.writeSync(1, Buffer.from(${JSON.stringify(bytes)}, 'base64'));
fs.writeSync(2, 'tar fixture diagnostic\\n');
if (mode === 'partial') process.exit(2);
if (mode === 'wait') {
  fs.writeSync(2, 'TAR_READY\\n');
  process.on('SIGTERM', () => process.exit(3));
  setInterval(() => {}, 1000);
}
`, { mode: 0o755 });
  return path;
}
const run = (entry, args, cwd, env = process.env) => {
  const result = spawnSync(process.execPath, [entry, ...args], {
    cwd, env, encoding: 'utf8', timeout: 15000,
  });
  assert.ifError(result.error);
  return result;
};
function cliEnv(root, mode) {
  const bin = join(root, `bin-${mode}`);
  mkdirSync(bin);
  fakeTar(bin, mode, 'tar');
  symlinkSync(process.execPath, join(bin, 'node'));
  return { ...process.env, PATH: bin };
}

test('macOS/Linux CLI works without descriptor-directory namespaces', (t) => {
  guarded(t);
  const { root, project } = source(t);
  const env = cliEnv(root, 'args');
  const result = run(engine, [project], root, env);
  assert.equal(result.status, 0, result.stderr);
  assert.equal(dirname(result.stdout.trimEnd()), join(project, 'backups'));
  const defaults = run(engine, [], project, env);
  assert.equal(defaults.status, 0, defaults.stderr);
  assert.equal(dirname(defaults.stdout.trimEnd()), join(project, 'backups'));
  const implementation = readFileSync(engine, 'utf8');
  assert.doesNotMatch(implementation, /\/proc\/self\/fd|\/dev\/fd/);
  assert.match(implementation, /cwd: absolute/);
  assert.match(implementation, /NOT an atomic/);
});

test('optional absent members, fixed argument list, spaces and SOURCE != cwd', async (t) => {
  if (!guarded(t)) return;
  const { root, project } = source(t);
  const diagnostics = [];
  const backup = await createBackup(project, 'aikido-verif-backup', {
    tar: fakeTar(root, 'args'), diagnostic: (s) => diagnostics.push(s),
  });

  test('backup refuses to export cards and journals from a custom Task Store root', async (t) => {
    if (!guarded(t)) return;
    const { project } = source(t);
    const privateRoot = join(project, 'user-session-data');
    mkdirSync(join(privateRoot, 'journal'), { recursive: true });
    mkdirSync(join(privateRoot, 'boards', 'default', 'unassigned', 'backlog'), { recursive: true });
    writeFileSync(join(privateRoot, 'README.md'), 'private session data fixture\n');
    writeFileSync(join(privateRoot, 'store.json'), '{"schemaVersion":"task-store/1"}');
    writeFileSync(join(privateRoot, 'journal', 'events.jsonl'), '{"text":"PRIVATE_TASK_CANARY"}\n');
    writeFileSync(join(privateRoot, 'boards', 'default', 'unassigned', 'backlog', 'canary.json'),
      '{"title":"PRIVATE_TASK_CANARY"}');
    await assert.rejects(createBackup(privateRoot, 'private-check', {
      tar: 'unused', diagnostic() {},
    }), /Private Task Store data.*refusing to export/);
    assert.equal(existsSync(join(privateRoot, 'backups')), false);
  });
  assert.equal(dirname(backup), join(project, 'backups'));
  assert.match(backup, /aikido-verif-backup-\d{8}-\d{6}-[a-f0-9-]+\.tgz$/);
  assert.equal(lstatSync(backup).mode & 0o777, 0o600);
  assert.deepEqual(readFileSync(backup), tarFixture());
  assert.equal(existsSync(join(root, 'backups')), false);
  assert.equal(diagnostics.filter((s) => s.startsWith('Skipping')).length, MEMBERS.length - 1);
});

test('exclusive collisions preserve files and symlinks, retries and exhaustion', async (t) => {
  if (!guarded(t)) return;
  const { root, project } = source(t);
  const backups = join(project, 'backups');
  mkdirSync(backups);
  const sentinel = join(root, 'sentinel');
  writeFileSync(sentinel, 'untouched');
  writeFileSync(join(backups, 'aikido-backup-collision.tgz'), 'existing');
  symlinkSync(sentinel, join(backups, 'aikido-backup-link.tgz'));
  const suffixes = ['collision', 'link', 'unique'];
  const options = { tar: fakeTar(root), diagnostic() {} };
  const path = await createBackup(project, undefined, { ...options, suffix: () => suffixes.shift() });
  assert.equal(path, join(backups, 'aikido-backup-unique.tgz'));
  await assert.rejects(createBackup(project, undefined, {
    ...options, suffix: () => 'collision',
  }), /collisions exhausted/);
  assert.equal(readFileSync(sentinel, 'utf8'), 'untouched');
  assert.equal(readFileSync(join(backups, 'aikido-backup-collision.tgz'), 'utf8'), 'existing');
  assert.ok(lstatSync(join(backups, 'aikido-backup-link.tgz')).isSymbolicLink());
});

test('concurrent same-name attempts never overwrite each other', async (t) => {
  if (!guarded(t)) return;
  const { root, project } = source(t);
  const tar = fakeTar(root);
  const results = await Promise.all(['one', 'two'].map((next) => {
    let attempt = 0;
    return createBackup(project, undefined, {
      tar, diagnostic() {}, suffix: () => attempt++ ? next : 'shared',
    });
  }));
  assert.equal(new Set(results).size, 2);
  for (const path of results) assert.deepEqual(readFileSync(path), tarFixture());
});

test('empty/missing SOURCE and unsafe prefixes/paths produce no archive', async (t) => {
  if (!guarded(t)) return;
  const root = fixture(t);
  await assert.rejects(createBackup(root, undefined, { diagnostic() {} }), /No backup members/);
  await assert.rejects(createBackup(join(root, 'absent')), /ENOENT/);
  const { root: other, project } = source(t);
  for (const prefix of ['../escape', '/absolute', 'bad\nname', '..', '-option', 'x/y', 'x\\y']) {
    await assert.rejects(createBackup(project, prefix), /Unsafe backup prefix/);
  }
  for (const path of ['/', `${project}/../other`, `${project}\n`, `${project}\0`, `${project}\\x`]) {
    await assert.rejects(createBackup(path), /Unsafe SOURCE/);
  }
  assert.equal(existsSync(join(root, 'backups')), false);
  assert.equal(existsSync(join(project, 'backups')), false);
  assert.equal(existsSync(join(other, 'escape')), false);
});

test('backup directory file, symlink and linked source ancestors are refused', async (t) => {
  if (!guarded(t)) return;
  for (const type of ['file', 'link', 'dangling']) {
    const { root, project } = source(t);
    const target = join(root, 'destination');
    mkdirSync(target);
    writeFileSync(join(target, 'sentinel'), 'safe');
    const backup = join(project, 'backups');
    if (type === 'file') writeFileSync(backup, 'safe file');
    else symlinkSync(type === 'dangling' ? join(root, 'missing') : target, backup);
    await assert.rejects(createBackup(project, undefined, { diagnostic() {} }));
    assert.equal(readFileSync(join(target, 'sentinel'), 'utf8'), 'safe');
    assert.deepEqual(readdirSync(target), ['sentinel']);
    if (type === 'file') assert.equal(readFileSync(backup, 'utf8'), 'safe file');
    else assert.ok(lstatSync(backup).isSymbolicLink());
    const link = join(root, 'linked-parent');
    symlinkSync(root, link);
    await assert.rejects(createBackup(join(link, 'source with spaces'), undefined, { diagnostic() {} }));
  }
});

test('tar errors, partial output, signal death and zero output never reach stdout', (t) => {
  if (!guarded(t)) return;
  for (const mode of ['partial', 'zero', 'spawn-signal', 'missing']) {
    const { root, project } = source(t);
    const env = cliEnv(root, mode);
    if (mode === 'missing') rmSync(join(env.PATH, 'tar')); // Owned fake executable only.
    const result = run(engine, [project], root, env);
    assert.equal(result.status, 1, result.stderr);
    assert.equal(result.stdout, '');
    assert.match(result.stderr, /Backup failed:/);
    assert.doesNotMatch(result.stderr, /✅|Backup created:/);
    const entries = readdirSync(join(project, 'backups'));
    assert.equal(entries.length, 1);
    // No reading of any failed archive, only metadata for retained artifacts.
    assert.ok(lstatSync(join(project, 'backups', entries[0])).isFile());
  }
});

test('CLI emits only one exact absolute path after success', (t) => {
  if (!guarded(t)) return;
  const { root, project } = source(t);
  const env = { ...cliEnv(root, 'ok'),
    TAR_OPTIONS: '--remove-files --dereference --checkpoint-action=exec=false',
    TAR_READER_OPTIONS: 'malicious', TAR_WRITER_OPTIONS: 'malicious',
    GZIP: '--invalid', GZIP_OPT: '--invalid',
  };
  for (let attempt = 0; attempt < 2; attempt++) {
    const result = run(engine, [project, 'prefix with spaces'], root, env);
    assert.ifError(result.error);
    assert.equal(result.status, 0, result.stderr);
    assert.equal(result.stdout.split('\n').length, 2);
    const path = result.stdout.slice(0, -1);
    assert.equal(dirname(path), join(project, 'backups'));
    assert.ok(existsSync(path));
    assert.match(result.stderr, /Creating backup:/);
    assert.match(result.stderr, /tar fixture diagnostic/);
    assert.deepEqual(readFileSync(path), tarFixture());
  }
  assert.equal(readdirSync(join(project, 'backups')).length, 2);
});

test('symlinked Node CLI entry runs on success and does not silently accept failure', (t) => {
  guarded(t);
  const { root, project } = source(t);
  const entry = join(root, 'linked-create-backup.mjs');
  symlinkSync(engine, entry);
  for (const mode of ['ok', 'partial']) {
    const result = run(entry, [project], root, cliEnv(root, mode));
    assert.equal(result.status, mode === 'ok' ? 0 : 1, result.stderr);
    if (mode === 'ok') {
      assert.equal(dirname(result.stdout.trimEnd()), join(project, 'backups'));
      assert.ok(existsSync(result.stdout.trimEnd()));
    } else {
      assert.equal(result.stdout, '');
      assert.match(result.stderr, /tar failed/);
    }
  }
});

test('interruption waits for tar and fails without stdout or artifact deletion', async (t) => {
  if (!guarded(t)) return;
  const { root, project } = source(t);
  const env = cliEnv(root, 'wait');
  const child = spawn(process.execPath, [engine, project], { cwd: root, env });
  t.after(() => { if (child.exitCode === null) child.kill('SIGKILL'); });
  let stdout = '';
  let stderr = '';
  let interrupted = false;
  child.stdout.on('data', (b) => { stdout += b; });
  child.stderr.on('data', (b) => {
    stderr += b;
    if (!interrupted && stderr.includes('TAR_READY')) {
      interrupted = true;
      child.kill('SIGTERM');
    }
  });
  const timeout = setTimeout(() => child.kill('SIGKILL'), 10000);
  const code = await new Promise((fulfil, reject) => {
    child.on('error', reject);
    child.on('close', fulfil);
  });
  clearTimeout(timeout);
  assert.equal(code, 1, stderr);
  assert.equal(stdout, '');
  assert.match(stderr, /Backup interrupted/);
  assert.equal(readdirSync(join(project, 'backups')).length, 1);
});

test('pre-aborted operation never creates a backup directory', async (t) => {
  if (!guarded(t)) return;
  const { project } = source(t);
  await assert.rejects(createBackup(project, undefined, {
    signal: AbortSignal.abort(), diagnostic() {},
  }), /interrupted/);
  assert.equal(existsSync(join(project, 'backups')), false);
});

test('unwritable target fails without replacing existing entries', async (t) => {
  if (!guarded(t)) return;
  const { root, project } = source(t);
  const backups = join(project, 'backups');
  mkdirSync(backups);
  const sentinel = join(backups, 'existing.tgz');
  writeFileSync(sentinel, 'untouched fixture');
  chmodSync(backups, 0o500);
  try {
    const probe = join(backups, 'permission-probe');
    try {
      const fd = openSync(probe, C.O_WRONLY | C.O_CREAT | C.O_EXCL, 0o600);
      closeSync(fd);
      rmSync(probe); // Owned fixture only.
      t.skip('Current user bypasses directory permissions');
      return;
    } catch (error) {
      assert.equal(error.code, 'EACCES');
    }
    await assert.rejects(createBackup(project, undefined, {
      tar: fakeTar(root), diagnostic() {},
    }), /EACCES/);
    assert.deepEqual(readdirSync(backups), ['existing.tgz']);
    assert.equal(readFileSync(sentinel, 'utf8'), 'untouched fixture');
  } finally {
    chmodSync(backups, 0o700);
  }
});

test('directory replacement during tar cannot redirect writes or report success', async (t) => {
  if (!guarded(t)) return;
  const { root, project } = source(t);
  const destination = join(root, 'other destination');
  mkdirSync(destination);
  writeFileSync(join(destination, 'sentinel'), 'untouched');
  const tool = join(root, 'replacing-tar');
  const old = join(project, 'old-backups');
  writeFileSync(tool, `#!${process.execPath}
import fs from 'node:fs';
fs.renameSync(${JSON.stringify(join(project, 'backups'))}, ${JSON.stringify(old)});
fs.symlinkSync(${JSON.stringify(destination)}, ${JSON.stringify(join(project, 'backups'))});
fs.writeSync(1, Buffer.from(${JSON.stringify(tarFixture().toString('base64'))}, 'base64'));
`, { mode: 0o755 });
  await assert.rejects(createBackup(project, undefined, {
    tar: tool, diagnostic() {},
  }), /target changed/);
  assert.deepEqual(readdirSync(destination), ['sentinel']);
  assert.equal(readFileSync(join(destination, 'sentinel'), 'utf8'), 'untouched');
  assert.equal(readdirSync(old).length, 1); // Metadata only, never read failed archive.
});

test('SOURCE replacement after spawn is a blocking error, not success', async (t) => {
  guarded(t);
  const { root, project } = source(t);
  const old = join(root, 'old source');
  const replacement = join(root, 'replacement');
  mkdirSync(replacement);
  writeFileSync(join(replacement, 'README.md'), 'replacement fixture');
  const tool = join(root, 'source-replacing-tar');
  writeFileSync(tool, `#!${process.execPath}
import fs from 'node:fs';
fs.renameSync(${JSON.stringify(project)}, ${JSON.stringify(old)});
fs.symlinkSync(${JSON.stringify(replacement)}, ${JSON.stringify(project)});
fs.writeSync(1, Buffer.from(${JSON.stringify(tarFixture().toString('base64'))}, 'base64'));
`, { mode: 0o755 });
  await assert.rejects(createBackup(project, undefined, {
    tar: tool, diagnostic() {},
  }), /target changed/);
  assert.equal(existsSync(join(replacement, 'backups')), false);
  assert.equal(readFileSync(join(replacement, 'README.md'), 'utf8'), 'replacement fixture');
  assert.equal(readdirSync(join(old, 'backups')).length, 1);
});

test('real local tar lists tgz fixture members and permissions without extraction', async (t) => {
  if (!guarded(t)) return;
  const available = spawnSync('tar', ['--version'], { encoding: 'utf8' });
  if (available.error?.code === 'ENOENT') return t.skip('Local tar unavailable');
  const { root, project } = source(t);
  mkdirSync(join(project, '.claude'));
  writeFileSync(join(project, '.claude', 'spaced file'), 'owned fixture');
  chmodSync(join(project, 'README.md'), 0o640);
  symlinkSync('README.md', join(project, 'AGENTS.md'));
  const result = run(engine, [project], root, {
    ...process.env, TAR_OPTIONS: '--remove-files --dereference',
  });
  assert.equal(result.status, 0, result.stderr);
  const path = result.stdout.trimEnd();
  assert.ok(lstatSync(join(project, 'AGENTS.md')).isSymbolicLink());
  assert.equal(readFileSync(join(project, 'README.md'), 'utf8'), 'fixture payload\n');
  const listed = spawnSync('tar', ['-tzf', path], { encoding: 'utf8', timeout: 15000 });
  assert.ifError(listed.error);
  assert.equal(listed.status, 0, listed.stderr);
  assert.match(listed.stdout, /\.claude\/spaced file/);
  assert.match(listed.stdout, /README\.md/);
  assert.match(listed.stdout, /AGENTS\.md/);
  assert.doesNotMatch(listed.stdout, /backups/);
  const verbose = spawnSync('tar', ['-tvzf', path], { encoding: 'utf8', timeout: 15000 });
  assert.ifError(verbose.error);
  assert.equal(verbose.status, 0, verbose.stderr);
  assert.match(verbose.stdout, /-rw-r-----.*README\.md/);
  assert.match(verbose.stdout, /lrwx.*AGENTS\.md.*README\.md/);
});

test('beginning plan treats direct Node backup output as blocking evidence', (t) => {
  if (!guarded(t)) return;
  const content = readFileSync(plan, 'utf8');
  assert.match(content, /create-backup\.mjs/);
  assert.match(content, /Any unexpected output or nonzero exit is blocking/);
  assert.doesNotMatch(content, /```(?:bash|sh|shell|zsh)/);
  for (const mode of ['ok', 'partial']) {
    const { root, project } = source(t);
    const env = cliEnv(root, mode);
    const result = run(engine, [project, 'aikido-verif-backup'], root, env);
    if (mode === 'ok') {
      assert.equal(result.status, 0, result.stderr);
      const exact = result.stdout.trimEnd();
      assert.equal(dirname(exact), join(project, 'backups'));
      assert.ok(existsSync(exact));
    } else {
      assert.equal(result.status, 1);
      assert.equal(result.stdout, '');
      assert.match(result.stderr, /tar|backup/i);
    }
  }
});
