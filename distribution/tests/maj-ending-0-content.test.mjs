import { test } from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { existsSync, mkdirSync, mkdtempSync, readFileSync, readdirSync, realpathSync, rmSync, symlinkSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const scripts = fileURLToPath(new URL('../../prompts/hard_points/system/maj/scripts/', import.meta.url));

function fixture(t) {
  const root = mkdtempSync(join(realpathSync(tmpdir()), 'aikido-ending-0-fixture-'));
  t.after(() => rmSync(root, { recursive: true, force: true }));
  const source = join(root, 'source'), target = join(root, 'target'), work = join(root, 'work');
  for (const dir of [source, target]) mkdirSync(join(dir, 'prompts/hard_points'), { recursive: true });
  mkdirSync(work);
  return { source, target, work };
}
function put(root, path, value) {
  const file = join(root, 'prompts/hard_points', path);
  mkdirSync(dirname(file), { recursive: true });
  writeFileSync(file, value);
}
function run(name, args) {
  return spawnSync(process.execPath, [join(scripts, name), ...args], { encoding: 'utf8' });
}
function begin(f) { return run('beginning-generate-structure.mjs', [f.source, f.target, '--dir', f.work]); }
function diff(f) { return run('ending-0-generate-diff-report.mjs', ['--dir', f.work]); }
function processMode(f, mode) { return run('ending-0-process-fusion.mjs', [f.source, f.target, mode, '--dir', f.work]); }

test('ending-0 plan uses Node engines and suspends for real host review', t => {
  const f = fixture(t);
  put(f.source, 'a.md', 'local');
  put(f.target, 'a.md', 'upstream');
  assert.equal(begin(f).status, 0);
  const plan = readFileSync(new URL('../../prompts/hard_points/system/maj/plans/plan-ending-0.md', import.meta.url), 'utf8');
  assert.match(plan, /ending-0-fusion\.mjs start/);
  assert.match(plan, /Exit 2 means pending\/suspended, not success/);
  const checked = run('ending-0-check-json-files.mjs', ['--dir', f.work]);
  assert.equal(checked.status, 0, checked.stderr);
  const compared = diff(f);
  assert.equal(compared.status, 0, compared.stderr);
  const result = run('ending-0-fusion.mjs', ['start', '--dir', f.work, '--source', f.source,
    '--target', f.target, '--mode', 'INTELLIGENT', '--dispatch-tool', 'functions.task']);
  assert.equal(result.status, 2, result.stderr);
  assert.equal(readFileSync(join(f.source, 'prompts/hard_points/a.md'), 'utf8'), 'local');
  assert.ok(existsSync(join(f.work, 'ending-0-fusion.request.json')));
});

test('ending-0 plan handles no changes and keeps manual selections pending', t => {
  for (const [different, mode, expected] of [
    [false, 'INTELLIGENT', 0], [true, 'SKIP', 2], [true, 'MANUAL_LATER', 2],
  ]) {
    const f = fixture(t);
    put(f.source, 'a.md', 'local');
    put(f.target, 'a.md', different ? 'upstream' : 'local');
    assert.equal(begin(f).status, 0);
    assert.equal(diff(f).status, 0);
    const result = run('ending-0-fusion.mjs', ['start', '--dir', f.work, '--source', f.source,
      '--target', f.target, '--mode', mode]);
    assert.equal(result.status, expected, result.stderr);
    assert.equal(readFileSync(join(f.source, 'prompts/hard_points/a.md'), 'utf8'), 'local');
  }
});

test('hash comparison finds same-sized changes; explicit replacement cannot write any hard point', t => {
  const f = fixture(t);
  put(f.source, 'nested/a spaced name.md', 'AAAA');
  put(f.target, 'nested/a spaced name.md', 'BBBB');
  put(f.target, 'nested/ajout.bin', Buffer.from([0, 1, 2]));
  put(f.source, 'same.md', 'same');
  put(f.target, 'same.md', 'same');
  put(f.source, 'local-only.md', 'context');
  writeFileSync(join(f.work, 'maj_before.json'), '{"legacy":"untouched"}');
  assert.equal(begin(f).status, 0);
  assert.equal(JSON.parse(readFileSync(join(f.work, 'maj_before.json'), 'utf8')).format, 'aikido-maj-content-v1');
  assert.equal(run('ending-0-check-json-files.mjs', ['--dir', f.work]).status, 0);
  const result = diff(f);
  assert.equal(result.status, 0, result.stderr);
  assert.equal(result.stdout, '2\n');
  assert.match(readFileSync(join(f.work, 'modified_files.txt'), 'utf8'), /spaced/);
  const receipt = readFileSync(join(f.work, 'ending-0-state.json'));
  const entries = readdirSync(join(f.source, 'prompts/hard_points/nested'));
  const denied = processMode(f, 'REPLACE');
  assert.equal(denied.status, 1);
  assert.equal(denied.stdout, '');
  assert.match(denied.stderr, /REPLACE refused.*agent-aikido-fusion/);
  assert.equal(readFileSync(join(f.source, 'prompts/hard_points/nested/a spaced name.md'), 'utf8'), 'AAAA');
  assert.equal(readFileSync(join(f.source, 'prompts/hard_points/local-only.md'), 'utf8'), 'context');
  assert.equal(existsSync(join(f.source, 'prompts/hard_points/nested/ajout.bin')), false);
  assert.deepEqual(readdirSync(join(f.source, 'prompts/hard_points/nested')), entries);
  assert.deepEqual(readFileSync(join(f.work, 'ending-0-state.json')), receipt);
  assert.notEqual(processMode(f, 'REPLACE').status, 0);
  assert.equal(processMode(f, 'INTELLIGENT').status, 2);
  assert.equal(JSON.parse(readFileSync(join(f.work, 'ending-0-manual.json'))).files.length, 2);
});

test('no change is an actual success, while manual and skipped work never reports success', t => {
  const f = fixture(t);
  put(f.target, 'file.md', 'same');
  put(f.source, 'file.md', 'same');
  assert.equal(begin(f).status, 0);
  assert.equal(diff(f).stdout, '0\n');
  assert.equal(processMode(f, 'INTELLIGENT').status, 0);
  assert.equal(processMode(f, 'REPLACE').status, 0);
  put(f.target, 'file.md', 'new');
  assert.equal(begin(f).status, 0);
  assert.equal(diff(f).stdout, '1\n');
  for (const mode of ['INTELLIGENT', 'MANUAL_LATER', 'SKIP']) {
    const result = processMode(f, mode);
    assert.equal(result.status, 2, result.stderr);
    assert.equal(JSON.parse(result.stdout).status, 'pending');
    assert.equal(readFileSync(join(f.source, 'prompts/hard_points/file.md'), 'utf8'), 'same');
  }
  const receipt = readFileSync(join(f.work, 'ending-0-state.json'));
  assert.equal(processMode(f, 'INVALID').status, 1);
  assert.deepEqual(readFileSync(join(f.work, 'ending-0-state.json')), receipt);
});

test('REPLACE cannot create a new hard point or its parent directories', t => {
  const f = fixture(t);
  put(f.target, 'new/subtree/add.md', 'new');
  assert.equal(begin(f).status, 0);
  assert.equal(diff(f).stdout, '1\n');
  const denied = processMode(f, 'REPLACE');
  assert.equal(denied.status, 1);
  assert.match(denied.stderr, /REPLACE refused/);
  assert.deepEqual(readdirSync(join(f.source, 'prompts/hard_points')), []);
});

test('failed beginning capture invalidates the previous merge comparison before capture', t => {
  const f = fixture(t);
  put(f.target, 'method.md', 'new');
  put(f.source, 'method.md', 'old');
  assert.equal(begin(f).status, 0);
  assert.equal(diff(f).status, 0);
  assert.equal(JSON.parse(readFileSync(join(f.work, 'ending-0-state.json'))).status, 'complete');
  mkdirSync(join(f.source, 'prompts/gen'), { recursive: true });
  writeFileSync(join(f.source, 'prompts/gen/broken.md'), 'context');
  try {
    symlinkSync(join(f.source, 'prompts/gen/broken.md'), join(f.source, 'prompts/gen/link.md'), 'file');
  } catch (error) {
    if (process.platform !== 'win32' || !['EPERM', 'EACCES'].includes(error.code)) throw error;
    t.skip('Windows symlink privileges unavailable');
    return;
  }
  assert.equal(begin(f).status, 1);
  assert.equal(JSON.parse(readFileSync(join(f.work, 'ending-0-state.json'))).status, 'pending');
  rmSync(join(f.source, 'prompts/gen/link.md'));
  const stale = processMode(f, 'INTELLIGENT');
  assert.equal(stale.status, 1);
  assert.match(stale.stderr, /stale or invalid comparison report/);
  assert.equal(existsSync(join(f.work, 'ending-0-manual.json')), false);
});

test('changed content, added TARGET files and malformed snapshot invalidate the report', t => {
  const f = fixture(t);
  put(f.target, 'a.md', 'new');
  put(f.source, 'a.md', 'old');
  assert.equal(begin(f).status, 0);
  assert.equal(diff(f).status, 0);
  put(f.target, 'a.md', 'bad');
  assert.equal(diff(f).status, 1);
  put(f.target, 'a.md', 'new');
  assert.equal(processMode(f, 'REPLACE').status, 1);
  assert.equal(diff(f).status, 0);
  put(f.target, 'another.md', 'x');
  assert.equal(processMode(f, 'REPLACE').status, 1);
  writeFileSync(join(f.work, 'ending-0-snapshot.json'), '{');
  assert.equal(run('ending-0-check-json-files.mjs', ['--dir', f.work]).status, 1);
});

test('unsafe symbolic links, overlapping work and tampered traversal entries fail closed', t => {
  const f = fixture(t);
  put(f.target, 'file.md', 'new');
  put(f.source, 'file.md', 'old');
  assert.equal(begin(f).status, 0);
  assert.equal(diff(f).status, 0);
  const snapPath = join(f.work, 'ending-0-snapshot.json');
  const snap = JSON.parse(readFileSync(snapPath, 'utf8'));
  snap.files['prompts/hard_points/../../escape'] = snap.files['prompts/hard_points/file.md'];
  writeFileSync(snapPath, JSON.stringify(snap));
  assert.equal(processMode(f, 'REPLACE').status, 1);
  assert.equal(begin(f).status, 0);
  assert.equal(diff(f).status, 0);
  rmSync(join(f.source, 'prompts/hard_points/file.md'));
  try {
    symlinkSync(join(f.target, 'prompts/hard_points/file.md'), join(f.source, 'prompts/hard_points/file.md'), 'file');
  } catch (error) {
    if (process.platform !== 'win32' || !['EPERM', 'EACCES'].includes(error.code)) throw error;
    t.skip('Windows symlink privileges unavailable');
    return;
  }
  assert.equal(processMode(f, 'REPLACE').status, 1);
  assert.equal(run('beginning-generate-structure.mjs', [f.source, f.target, '--dir', f.source]).status, 1);
});

test('generated index and project truth tables are outside the merge scope', t => {
  const f = fixture(t);
  put(f.target, 'system/structure/index.json', 'ignored');
  put(f.target, 'system/structure/indices/index.json', 'ignored');
  mkdirSync(join(f.target, 'prompts/gen'), { recursive: true });
  writeFileSync(join(f.target, 'prompts/gen/project.md'), 'target context');
  put(f.target, 'update.md', 'update');
  assert.equal(begin(f).status, 0);
  assert.equal(diff(f).stdout, '1\n');
  const snapshot = JSON.parse(readFileSync(join(f.work, 'ending-0-snapshot.json'), 'utf8'));
  assert.deepEqual(Object.keys(snapshot.files), ['prompts/hard_points/update.md']);
});
