import { test } from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { copyFileSync, mkdirSync, mkdtempSync, readFileSync, readdirSync, rmSync, symlinkSync, utimesSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { inspectTemp, reviewBackups } from '../../prompts/hard_points/system/maj/scripts/ending-5-review.mjs';

const scripts = fileURLToPath(new URL('../../prompts/hard_points/system/maj/scripts/', import.meta.url));
const plan = fileURLToPath(new URL('../../prompts/hard_points/system/maj/plans/plan-ending-5.md', import.meta.url));
function fixture(t) {
  const root = mkdtempSync(join(tmpdir(), 'aikido-review-'));
  t.after(() => rmSync(root, { recursive: true, force: true }));
  return root;
}

test('backup review classifies ages and ignores symlink entries', t => {
  const root = fixture(t);
  const now = 2_000_000_000_000;
  for (const [name, age] of [['new.bak', 0], ['mid.bak.1', 2 * 3600000], ['old.bak', 25 * 3600000]]) {
    const path = join(root, name);
    writeFileSync(path, 'backup');
    utimesSync(path, (now - age) / 1000, (now - age) / 1000);
  }
  if (process.platform !== 'win32') symlinkSync(join(root, 'new.bak'), join(root, 'linked.bak'));
  assert.deepEqual(reviewBackups(root, now), { total: 3, recent: 1, old: 1 });
  assert.throws(() => reviewBackups(join(root, 'missing')), /ENOENT/);
});

test('temporary review counts regular files without following symlinks', t => {
  const root = fixture(t);
  assert.deepEqual(inspectTemp(join(root, 'absent')), { count: 0, bytes: 0, exists: false });
  mkdirSync(join(root, 'nested'));
  writeFileSync(join(root, 'nested', 'a'), '1234');
  if (process.platform !== 'win32') symlinkSync(join(root, 'nested'), join(root, 'linked'));
  assert.deepEqual(inspectTemp(root), { count: 1, bytes: 4, exists: true });
  if (process.platform !== 'win32') assert.throws(() => inspectTemp(join(root, 'linked')), /Invalid temporary directory/);
});

test('Node cleanup skips unverified files and never deletes them', t => {
  const root = fixture(t);
  const userFile = join(root, 'user.tmp');
  writeFileSync(userFile, 'preserve');
  const result = spawnSync(process.execPath, [join(scripts, 'ending-5-review.mjs'), 'cleanup', root], { encoding: 'utf8' });
  assert.equal(result.status, 0, result.stderr);
  assert.equal(result.stdout, 'SKIPPED\n');
  assert.match(result.stderr, /no files deleted/);
  assert.equal(readFileSync(userFile, 'utf8'), 'preserve');
  const invalid = spawnSync(process.execPath, [join(scripts, 'ending-5-review.mjs'), 'cleanup', join(root, 'missing')], { encoding: 'utf8' });
  assert.equal(invalid.status, 1);
  assert.equal(invalid.stdout, '');
});

test('ending-5 plan keeps failed review unknown and never deletes unverified files', t => {
  const root = fixture(t);
  const text = readFileSync(plan, 'utf8');
  assert.doesNotMatch(text, /```(?:bash|sh|shell|zsh)/);
  assert.match(text, /Preserve `unknown` on failures/);
  assert.match(text, /never deletes backups/);
  const review = spawnSync(process.execPath, [join(scripts, 'ending-5-review.mjs'), 'cleanup', root], { encoding: 'utf8' });
  assert.equal(review.status, 0, review.stderr);
  assert.equal(review.stdout, 'SKIPPED\n');
});

test('ending-5 plan invokes real Node engines from SOURCE outside the working directory', t => {
  const root = fixture(t);
  const source = join(root, 'project');
  const destination = join(source, 'prompts/hard_points/system/maj/scripts');
  mkdirSync(destination, { recursive: true });
  for (const name of ['ending-5-review.mjs', 'ending-1-report-state.mjs', 'create-log.mjs']) {
    copyFileSync(join(scripts, name), join(destination, name));
  }
  writeFileSync(join(source, 'keep.tmp'), 'user data');
  writeFileSync(join(source, 'example.bak'), 'backup');
  const planText = readFileSync(plan, 'utf8');
  assert.doesNotMatch(planText, /```(?:bash|sh|shell|zsh)/);
  const cli = (engine, ...args) => spawnSync(process.execPath, [join(destination, engine), ...args], {
    cwd: root, encoding: 'utf8',
  });
  const cleanup = cli('ending-5-review.mjs', 'cleanup', source);
  const backups = cli('ending-5-review.mjs', 'backups', source);
  assert.equal(cleanup.status, 0, cleanup.stderr);
  assert.equal(cleanup.stdout, 'SKIPPED\n');
  assert.equal(backups.status, 0, backups.stderr);
  assert.equal(backups.stdout, '1 1 0\n');
  const log = cli('create-log.mjs', join(source, 'prompts/spec/logs/phase-5-test.log'),
    'Plan Ending-5 : Temporary and Backup Review', 'Cleanup: SKIPPED; Backups: 1');
  assert.equal(log.status, 0, log.stderr);
  assert.equal(readFileSync(join(source, 'keep.tmp'), 'utf8'), 'user data');
  const logs = join(source, 'prompts/spec/logs');
  assert.equal(readdirSync(logs).length, 1);
  assert.match(readFileSync(join(logs, readdirSync(logs)[0]), 'utf8'), /Cleanup: SKIPPED/);
});
