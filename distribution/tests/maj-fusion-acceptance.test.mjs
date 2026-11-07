import { test } from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { mkdirSync, mkdtempSync, readFileSync, realpathSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { generate, compare, invalidateMergeReport } from '../../prompts/hard_points/system/maj/scripts/ending-0-core.mjs';
import { prepareFusion, acceptFusion, fusionStatus, resumeFusion, startFusion } from '../../prompts/hard_points/system/maj/scripts/ending-0-fusion.mjs';
import { digest } from '../../prompts/hard_points/system/maj/scripts/ending-1-report-state.mjs';
import { validateRequest } from '../../prompts/hard_points/system/orchestrator/runtime.mjs';

function fixture(t) {
  const base = mkdtempSync(join(realpathSync(tmpdir()), 'aikido-fusion-acceptance-'));
  t.after(() => rmSync(base, { recursive: true, force: true }));
  const source = join(base, 'source'), target = join(base, 'target'), dir = join(base, 'work');
  for (const root of [source, target]) mkdirSync(join(root, 'prompts/hard_points'), { recursive: true });
  mkdirSync(dir);
  writeFileSync(join(source, 'prompts/hard_points/a.md'), 'local context');
  writeFileSync(join(target, 'prompts/hard_points/a.md'), 'update formalism');
  writeFileSync(join(target, 'prompts/hard_points/b.md'), 'new method');
  generate(source, target, dir);
  compare(dir);
  prepareFusion(dir, 'functions.task');
  const read = name => JSON.parse(readFileSync(join(dir, name)));
  const requestBytes = readFileSync(join(dir, 'ending-0-fusion.request.json'));
  const request = JSON.parse(requestBytes);
  const manifest = { format: 'aikido-fusion-acceptance-v1', snapshot: request.tasks[0].context.snapshot,
    request: request.request_id, request_sha256: digest(requestBytes),
    files: request.tasks.map(task => ({ path: task.context.path, sha256: digest('reviewed merge'),
      agent: 'agent-aikido-fusion', invocation: 'fixture invocation evidence',
      reviewer: 'fixture reviewer', review: 'Context preserved and formalism adopted', accepted: true,
      result: { id: task.id, status: 'ok', summary: 'Reviewed fixture fusion',
        artifacts: [{ type: 'file', ref: task.context.OUTPUT_FILE }], errors: [], next: [] } })) };
  const put = () => writeFileSync(join(dir, 'acceptance.json'), JSON.stringify(manifest));
  const applied = () => {
    for (const item of manifest.files) writeFileSync(join(source, item.path), 'reviewed merge');
  };
  return { source, target, dir, read, request, manifest, put, applied };
}

test('preparation is pending, maps persona roles correctly, and never applies a hard point', t => {
  const f = fixture(t);
  assert.equal(f.read('ending-0-fusion.state.json').status, 'pending');
  assert.deepEqual(validateRequest(f.request), { valid: true, errors: [] });
  assert.equal(f.request.tasks[0].context.SOURCE_FILE, join(f.target, 'prompts/hard_points/a.md'));
  assert.equal(f.request.tasks[0].context.TARGET_FILE, join(f.source, 'prompts/hard_points/a.md'));
  assert.equal(readFileSync(join(f.source, 'prompts/hard_points/a.md'), 'utf8'), 'local context');
  assert.throws(() => fusionStatus(f.dir), /pending/);
  f.put();
  assert.throws(() => acceptFusion(f.dir, 'acceptance.json'), /changed since snapshot/);
});

test('every externally applied file requires reviewed acceptance and status revalidates applied bytes', t => {
  const f = fixture(t);
  f.applied();
  f.put();
  assert.deepEqual(acceptFusion(f.dir, 'acceptance.json'), { status: 'complete', accepted: 2 });
  assert.deepEqual(fusionStatus(f.dir), { status: 'complete', accepted: 2 });
  writeFileSync(join(f.source, 'prompts/hard_points/a.md'), 'unexpected edit');
  assert.throws(() => fusionStatus(f.dir), /changed since snapshot/);
});

test('partial, duplicate, unreviewed and mismatched agent evidence cannot complete acceptance', t => {
  const f = fixture(t);
  f.applied();
  const original = structuredClone(f.manifest);
  for (const alter of [
    manifest => manifest.files.pop(),
    manifest => { manifest.files[1] = manifest.files[0]; },
    manifest => { manifest.files[0].accepted = false; },
    manifest => { manifest.files[0].agent = 'other'; },
    manifest => { manifest.files[0].invocation = ''; },
    manifest => { manifest.files[0].result.status = 'partial'; },
    manifest => { manifest.files[0].result.errors = [{ code: 'failed', message: 'failure' }]; },
    manifest => { manifest.files[0].result.artifacts = []; },
    manifest => { manifest.request_sha256 = digest('another request'); },
  ]) {
    f.manifest = structuredClone(original);
    alter(f.manifest);
    writeFileSync(join(f.dir, 'acceptance.json'), JSON.stringify(f.manifest));
    assert.throws(() => acceptFusion(f.dir, 'acceptance.json'));
    assert.equal(f.read('ending-0-fusion.state.json').status, 'pending');
  }
});

test('CLI status exposes only verified completion and invalid options never produce success', t => {
  const f = fixture(t);
  const engine = fileURLToPath(new URL('../../prompts/hard_points/system/maj/scripts/ending-0-fusion.mjs', import.meta.url));
  const cli = (...args) => spawnSync(process.execPath, [engine, ...args], { encoding: 'utf8' });
  assert.equal(cli('status', '--dir', f.dir).status, 1);
  assert.equal(cli('prepare', '--dir', f.dir, '--dispatch-tool', 'functions.task').status, 2);
  assert.equal(cli('accept', '--dir', f.dir, '--manifest', '../escape').status, 1);
  assert.equal(cli('status', '--dir', f.dir, '--unexpected', 'value').status, 1);
});

test('INTELLIGENT start suspends for external dispatch, then accept and resume gate continuation', t => {
  const f = fixture(t);
  const engine = fileURLToPath(new URL('../../prompts/hard_points/system/maj/scripts/ending-0-fusion.mjs', import.meta.url));
  const cli = (...args) => spawnSync(process.execPath, [engine, ...args], { encoding: 'utf8' });
  const started = cli('start', '--dir', f.dir, '--source', f.source, '--target', f.target,
    '--mode', 'INTELLIGENT', '--dispatch-tool', 'functions.task');
  assert.equal(started.status, 2, started.stderr);
  assert.equal(JSON.parse(started.stdout).status, 'pending');
  assert.match(JSON.parse(started.stdout).next.join(' '), /Host dispatches/);
  assert.equal(cli('resume', '--dir', f.dir).status, 1);
  const requestBytes = readFileSync(join(f.dir, 'ending-0-fusion.request.json'));
  const request = JSON.parse(requestBytes);
  f.manifest.request = request.request_id;
  f.manifest.request_sha256 = digest(requestBytes);
  f.applied();
  f.put();
  assert.equal(cli('resume', '--dir', f.dir).status, 1); // Applied bytes are not acceptance.
  assert.equal(cli('accept', '--dir', f.dir, '--manifest', 'acceptance.json').status, 0);
  assert.equal(cli('resume', '--dir', f.dir).status, 0);
  invalidateMergeReport(f.dir);
  assert.equal(cli('resume', '--dir', f.dir).status, 1);
});

test('SKIP and MANUAL_LATER cannot resume as complete; REPLACE and missing dispatch fail', t => {
  const f = fixture(t);
  for (const mode of ['SKIP', 'MANUAL_LATER']) {
    assert.equal(startFusion(f.source, f.target, mode, f.dir).status, 'pending');
    assert.throws(() => resumeFusion(f.dir), /pending/);
  }
  assert.throws(() => startFusion(f.source, f.target, 'REPLACE', f.dir), /REPLACE refused/);
  assert.throws(() => startFusion(f.source, f.target, 'INTELLIGENT', f.dir), /dispatch tool/);
  assert.equal(readFileSync(join(f.source, 'prompts/hard_points/a.md'), 'utf8'), 'local context');
});

test('zero-difference start and resume need no simulated dispatch or review evidence', t => {
  const f = fixture(t);
  writeFileSync(join(f.source, 'prompts/hard_points/a.md'), 'update formalism');
  writeFileSync(join(f.source, 'prompts/hard_points/b.md'), 'new method');
  generate(f.source, f.target, f.dir);
  compare(f.dir);
  assert.equal(startFusion(f.source, f.target, 'INTELLIGENT', f.dir).status, 'complete');
  assert.deepEqual(resumeFusion(f.dir), { status: 'complete', accepted: 0 });
});

test('canonical plan and command wire pending start to host acceptance and verified resume', () => {
  const plan = readFileSync(new URL('../../prompts/hard_points/system/maj/plans/plan-ending-0.md', import.meta.url), 'utf8');
  const command = readFileSync(new URL('../../prompts/hard_points/commands/maj-aikido.md', import.meta.url), 'utf8');
  assert.match(plan, /ending-0-fusion\.mjs start/);
  assert.match(plan, /Exit 2 means pending\/suspended, not success/);
  assert.match(plan, /host must perform authorized dispatch, review,/);
  assert.match(plan, /ending-0-fusion\.mjs resume/);
  assert.doesNotMatch(plan, /```(?:bash|sh|shell|zsh)/);
  assert.match(command, /ending-0 exit 2\/pending → Suspend/);
  assert.match(command, /generic sub-task\s+`ok` message is insufficient/);
});

test('target tampering, stale generation and modified acceptance receipts are rejected', t => {
  const f = fixture(t);
  f.applied();
  f.put();
  acceptFusion(f.dir, 'acceptance.json');
  const accepted = readFileSync(join(f.dir, 'ending-0-fusion.accepted.json'));
  writeFileSync(join(f.dir, 'ending-0-fusion.accepted.json'), `${accepted} `);
  assert.throws(() => fusionStatus(f.dir), /Stale fusion receipt/);
  writeFileSync(join(f.dir, 'ending-0-fusion.accepted.json'), accepted);
  writeFileSync(join(f.target, 'prompts/hard_points/a.md'), 'changed update');
  assert.throws(() => fusionStatus(f.dir), /changed since snapshot/);
  invalidateMergeReport(f.dir);
  assert.throws(() => fusionStatus(f.dir), /stale or invalid comparison report/);
  assert.throws(() => acceptFusion(f.dir, '../outside.json'), /file name/);
});
