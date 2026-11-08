import { test } from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { mkdirSync, mkdtempSync, readFileSync, realpathSync, rmSync, symlinkSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { readReport, statistics } from '../../prompts/hard_points/system/maj/scripts/ending-1-report-state.mjs';
import { captureContent, saveSnapshot } from '../../prompts/hard_points/system/maj/scripts/ending-1-content.mjs';

const scripts = fileURLToPath(new URL('../../prompts/hard_points/system/maj/scripts/', import.meta.url));
function fixture(t) {
  const root = mkdtempSync(join(realpathSync(tmpdir()), 'aikido-content-fixture-'));
  t.after(() => rmSync(root, { recursive: true, force: true }));
  const source = join(root, 'source'), target = join(root, 'target'), work = join(root, 'work');
  for (const path of [source, target]) mkdirSync(join(path, 'prompts/hard_points'), { recursive: true });
  mkdirSync(work);
  const put = (path, value) => {
    mkdirSync(dirname(join(source, path)), { recursive: true });
    writeFileSync(join(source, path), value);
  };
  writeFileSync(join(target, 'prompts/hard_points/method.md'), 'update');
  const cli = (script, ...args) => spawnSync(process.execPath, [join(scripts, script), ...args, '--dir', work], { encoding: 'utf8' });
  const beginning = () => cli('beginning-generate-structure.mjs', source, target);
  const after = () => cli('ending-1-workflow.mjs', 'generate-after', source);
  const compare = () => cli('ending-1-compare-structures.mjs');
  return { root, source, target, work, put, cli, beginning, after, compare };
}
function linkOrSkip(t, target, path) {
  try { symlinkSync(target, path, 'file'); return true; } catch (error) {
    if (process.platform !== 'win32' || !['EPERM', 'EACCES'].includes(error.code)) throw error;
    t.skip('Windows symlink privileges unavailable');
    return false;
  }
}

test('beginning → after → comparison → ending-2 reports paths, same-size content changes, additions and removals', t => {
  const f = fixture(t);
  f.put('prompts/hard_points/same.md', 'AAAA');
  f.put('prompts/gen/project.md', 'context');
  f.put('prompts/gen/remove.md', 'gone');
  for (const path of ['prompts/spec/private.md', 'prompts/gen/backups/archive.md',
    'prompts/gen/backup.bak.123', 'prompts/hard_points/system/structure/index.json',
    'prompts/hard_points/system/structure/indices/by-id/index.json']) f.put(path, 'ignored');
  assert.equal(f.beginning().status, 0);
  const before = JSON.parse(readFileSync(join(f.work, 'maj_before.json')));
  assert.deepEqual(Object.keys(before.files), ['prompts/gen/project.md', 'prompts/gen/remove.md', 'prompts/hard_points/same.md']);
  f.put('prompts/hard_points/same.md', 'BBBB');
  f.put('prompts/gen/new.bin', Buffer.from([0, 255]));
  rmSync(join(f.source, 'prompts/gen/remove.md'));
  f.put('prompts/spec/private.md', 'different');
  assert.equal(f.after().status, 0);
  const compared = f.compare();
  assert.equal(compared.status, 0, compared.stderr);
  const result = readReport(f.work);
  assert.equal(result.status, 'complete');
  assert.deepEqual(statistics(result.report).counts, [3, 1, 1, 1]);
  assert.equal(result.report['prompts/gen/remove.md'].after, null);
  assert.equal(result.report['prompts/gen/new.bin'].before, null);
  assert.notEqual(result.report['prompts/hard_points/same.md'].before.sha256, result.report['prompts/hard_points/same.md'].after.sha256);
  assert.equal(f.cli('ending-2-report.mjs', 'validate').stdout, 'VALID\n');
  assert.match(f.cli('ending-2-report.mjs', 'analyze', '--list').stdout, /3 1 1 1\n$/);
  {
    for (const [command, expected] of [
      ['check', 'PRESENT\n'],
      ['validate', 'VALID\n'],
      ['analyze', '3 1 1 1\n'],
    ]) {
      const result = f.cli('ending-2-report.mjs', command);
      assert.equal(result.status, 0, result.stderr);
      assert.equal(result.stdout, expected);
    }
    const backups = f.cli('ending-2-report.mjs', 'backups', f.source);
    assert.equal(backups.status, 0, backups.stderr);
    assert.equal(backups.stdout, '1\n');
    assert.match(readFileSync(join(f.work, 'backup_files_list.txt'), 'utf8'), /backup\.bak\.123/);
  }
});

test('ending-1 and ending-2 plans use direct Node engines and host-provided summary input', t => {
  const f = fixture(t);
  f.put('prompts/gen/item.md', 'before');
  assert.equal(f.beginning().status, 0);
  f.put('prompts/gen/item.md', 'after!');
  assert.equal(f.after().status, 0);
  assert.equal(f.compare().status, 0);
  const analysis = f.cli('ending-2-report.mjs', 'analyze');
  assert.equal(analysis.status, 0, analysis.stderr);
  assert.match(analysis.stdout, /1 0 0 1\n$/);
  f.put('sample.bak', 'review candidate');
  const backups = f.cli('ending-2-report.mjs', 'backups', f.source);
  assert.equal(backups.status, 0, backups.stderr);
  const summaryText = 'Summary: complete\nTotal: 1\nAdded: 0\nRemoved: 0\nModified: 1\n';
  const summary = spawnSync(process.execPath, [
    join(scripts, 'ending-2-report.mjs'), 'summary', '--dir', f.work,
  ], { input: summaryText, encoding: 'utf8' });
  assert.equal(summary.status, 0, summary.stderr);
  const plans = new URL('../../prompts/hard_points/system/maj/plans/', import.meta.url);
  for (const name of ['plan-ending-1.md', 'plan-ending-2.md']) {
    const text = readFileSync(new URL(name, plans), 'utf8');
    assert.doesNotMatch(text, /```(?:bash|sh|shell|zsh)/);
    assert.match(text, /node \/canonical\/source/);
  }
  assert.equal(readFileSync(join(f.work, 'ending2_summary.txt'), 'utf8'), summaryText);
  assert.equal(readReport(f.work).status, 'complete');
});

test('new beginning invalidates old receipt and rejects an after snapshot belonging to another run', t => {
  const f = fixture(t);
  f.put('prompts/gen/file.md', 'old');
  assert.equal(f.beginning().status, 0);
  assert.equal(f.after().status, 0);
  assert.equal(f.compare().status, 0);
  assert.equal(readReport(f.work).status, 'complete');
  const beforeBytes = readFileSync(join(f.work, 'maj_before.json'));
  assert.equal(f.cli('beginning-generate-structure.mjs', join(f.root, 'missing'), f.target).status, 1);
  assert.equal(readReport(f.work).status, 'stale');
  assert.deepEqual(readFileSync(join(f.work, 'maj_before.json')), beforeBytes);
  assert.equal(f.beginning().status, 0);
  assert.equal(readReport(f.work).status, 'stale');
  assert.equal(f.compare().status, 1);
  assert.equal(f.after().status, 0);
  assert.equal(f.compare().status, 0);
  writeFileSync(join(f.work, 'maj_after.json'), '{}');
  assert.equal(f.cli('ending-2-report.mjs', 'validate').stdout, 'INVALID\n');
  assert.equal(f.compare().status, 1);
});

test('capture rejects symlinks, control characters, non-UTF-8 names and mismatched roots', t => {
  const f = fixture(t);
  f.put('prompts/gen/file.md', 'old');
  assert.equal(f.beginning().status, 0);
  assert.equal(f.after().status, 0);
  assert.equal(f.compare().status, 0);
  if (!linkOrSkip(t, join(f.source, 'prompts/gen/file.md'), join(f.source, 'prompts/hard_points/link.md'))) return;
  assert.equal(f.after().status, 1);
  assert.equal(readReport(f.work).status, 'stale');
  rmSync(join(f.source, 'prompts/hard_points/link.md'));
  if (process.platform !== 'win32') {
    f.put('prompts/gen/new\nline.md', 'unsafe');
    assert.equal(f.after().status, 1);
    rmSync(join(f.source, 'prompts/gen/new\nline.md'));
  }
  if (process.platform === 'linux') {
    const path = Buffer.concat([Buffer.from(`${f.source}/prompts/gen/`), Buffer.from([255])]);
    writeFileSync(path, 'unsafe');
    assert.equal(f.after().status, 1);
    rmSync(path);
  }
  assert.equal(f.cli('ending-1-workflow.mjs', 'generate-after', f.target).status, 1);
});

test('unsafe report destinations and tampered paths fail without modifying the outside file', t => {
  const f = fixture(t);
  f.put('prompts/gen/file.md', 'old');
  assert.equal(f.beginning().status, 0);
  const outside = join(f.root, 'outside.json');
  writeFileSync(outside, 'untouched');
  if (!linkOrSkip(t, outside, join(f.work, 'maj_after.json'))) return;
  assert.equal(f.after().status, 1);
  assert.equal(readFileSync(outside, 'utf8'), 'untouched');
  rmSync(join(f.work, 'maj_after.json'));
  assert.equal(f.after().status, 0);
  const before = JSON.parse(readFileSync(join(f.work, 'maj_before.json')));
  before.files['prompts/gen/../../outside.json'] = before.files['prompts/gen/file.md'];
  writeFileSync(join(f.work, 'maj_before.json'), JSON.stringify(before));
  assert.equal(f.compare().status, 1);
});

test('V3.1 master indexes are rejected and never counted as changed files', t => {
  const f = fixture(t);
  for (const name of ['maj_before.json', 'maj_after.json']) {
    writeFileSync(join(f.work, name), '{"metadata":{"version":"3.1-hash-id"},"hash_tables":{}}');
  }
  assert.equal(f.compare().status, 1);
  assert.equal(f.after().status, 1);
  assert.equal(f.cli('ending-2-report.mjs', 'validate').stdout, 'INVALID\n');
  saveSnapshot(f.work, captureContent(f.source, 'before'));
  assert.equal(f.after().status, 0);
  assert.equal(f.compare().status, 0);
  assert.deepEqual(statistics(readReport(f.work).report).counts, [0, 0, 0, 0]);
});
