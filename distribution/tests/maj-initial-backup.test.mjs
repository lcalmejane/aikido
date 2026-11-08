import { test } from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { mkdirSync, mkdtempSync, readFileSync, realpathSync, rmSync, symlinkSync, utimesSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { latestBackup } from '../../prompts/hard_points/system/maj/scripts/beginning-check-backup.mjs';

const engine = fileURLToPath(new URL('../../prompts/hard_points/system/maj/scripts/beginning-check-backup.mjs', import.meta.url));
const plan = fileURLToPath(new URL('../../prompts/hard_points/system/maj/plans/plan-beginning.md', import.meta.url));
function fixture(t) {
  const root = mkdtempSync(join(tmpdir(), 'aikido-initial-backup-'));
  t.after(() => rmSync(root, { recursive: true, force: true }));
  return root;
}

test('finds most recent matching regular file without interpreting its contents', t => {
  const root = fixture(t);
  assert.equal(latestBackup(root), null);
  const dir = join(root, 'backups');
  mkdirSync(dir);
  const old = join(dir, 'aikido-backup-old.tgz');
  const newer = join(dir, 'aikido-backup-new.tgz');
  writeFileSync(old, 'older');
  writeFileSync(newer, 'newer');
  writeFileSync(join(dir, 'aikido-verif-backup-new.tgz'), 'ignored');
  utimesSync(old, 1, 1);
  utimesSync(newer, 2, 2);
  assert.equal(latestBackup(root), realpathSync(newer));
  assert.throws(() => latestBackup(join(root, 'missing')), /ENOENT/);
});

test('refuses symlinked backup directories and files', t => {
  if (process.platform === 'win32') return t.skip('Symlinks require Windows privileges');
  const root = fixture(t);
  const target = join(root, 'other');
  mkdirSync(target);
  symlinkSync(target, join(root, 'backups'));
  assert.throws(() => latestBackup(root), /Invalid backup directory/);
  rmSync(join(root, 'backups'));
  mkdirSync(join(root, 'backups'));
  symlinkSync(join(root, 'missing'), join(root, 'backups/aikido-backup-bad.tgz'));
  assert.throws(() => latestBackup(root), /Invalid backup file/);
});

test('CLI separates result, absence and error', t => {
  const root = fixture(t);
  const run = path => spawnSync(process.execPath, [engine, path], { cwd: tmpdir(), encoding: 'utf8' });
  const absent = run(root);
  assert.equal(absent.status, 0, absent.stderr);
  assert.equal(absent.stdout, '');
  assert.match(absent.stderr, /No initial/);
  const failed = run(join(root, 'missing'));
  assert.equal(failed.status, 1);
  assert.equal(failed.stdout, '');
  assert.match(failed.stderr, /lookup failed/);
});

test('beginning plan treats lookup errors as warnings and leaves the mandatory backup blocking', t => {
  const root = fixture(t);
  const text = readFileSync(plan, 'utf8');
  assert.match(text, /set `LATEST_BACKUP` to absent, and continue/);
  assert.match(text, /Any unexpected output or nonzero exit is blocking/);
  assert.doesNotMatch(text, /```(?:bash|sh|shell|zsh)/);
  const missing = spawnSync(process.execPath, [engine, join(root, 'missing')], { encoding: 'utf8' });
  assert.equal(missing.status, 1);
  assert.equal(missing.stdout, '');
  assert.match(missing.stderr, /lookup failed/);
});
