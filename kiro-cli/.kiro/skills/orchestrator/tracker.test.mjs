import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, readFileSync, writeFileSync, appendFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { validateResult } from './runtime.mjs';
import {
  apply, cli, effectiveState, emptyState, journalPath, loadState, readJournal, record, redact,
  replay, retryDecision, runCommand, summarize, totalTokens
} from './tracker.mjs';

const policy = JSON.parse(readFileSync(new URL('./policy.json', import.meta.url), 'utf8'));
const RID = 'req-1';

const request = (id = RID) => ({
  version: 2,
  request_id: id,
  caller: { agent: 'roo-orchestrator', return_mode: null },
  coordination: 'collaborate',
  objective: 'Track a two-step plan',
  constraints: ['read-only'],
  tasks: [
    {
      id: 'a', depends_on: [],
      transport: { kind: 'direct', tool: 'read_file', arguments: { path: 'x' } },
      executor: 'aikido', tools: ['read_file'], resources: { read: ['x'], write: [] },
      state: 'pending', acceptance: ['read'], return: 'task-result/1'
    },
    {
      id: 'b', depends_on: ['a'],
      transport: { kind: 'agent', dispatch_tool: 'new_task', agent: 'agent-aikido-validator' },
      executor: 'native', tools: [], resources: { read: [], write: [] },
      state: 'pending', acceptance: ['validated'], return: 'task-result/1'
    }
  ]
});

const okResult = (id, extra = {}) => JSON.stringify({
  id, status: 'ok', summary: 'done', artifacts: [], errors: [], next: [], ...extra
});
const errResult = (id, code = 'tool_failed') => JSON.stringify({
  id, status: 'error', summary: 'failed', artifacts: [], errors: [{ code, message: 'boom' }], next: []
});

function session(config = policy) {
  const dir = mkdtempSync(join(tmpdir(), 'aikido-tracker-'));
  let time = Date.parse('2026-10-09T10:00:00.000Z');
  const clock = () => new Date(time);
  const api = {
    dir,
    advance: seconds => { time += seconds * 1000; },
    run: (args, stdin = '') => cli(args, { dir, now: clock, stdin: () => stdin, config }),
    cleanup: () => rmSync(dir, { recursive: true, force: true })
  };
  api.run(['init'], JSON.stringify(request()));
  return api;
}

test('init validates the request, creates a replayable journal and reports ready/waiting tasks', t => {
  const s = session();
  t.after(s.cleanup);
  const view = s.run(['status', RID]);
  assert.equal(view.status, 'in_progress');
  assert.deepEqual(view.ready, ['a']);
  assert.deepEqual(view.waiting, [{ id: 'b', waiting_on: ['a'] }]);
  assert.equal(view.totals.tokens.total, 0);
  assert.equal(view.totals.cost_usd_reported, null);
  assert.equal(readJournal(journalPath(RID, s.dir)).length, 1);
});

test('init rejects an invalid request and writes nothing', t => {
  const dir = mkdtempSync(join(tmpdir(), 'aikido-tracker-'));
  t.after(() => rmSync(dir, { recursive: true, force: true }));
  const bad = { ...request('bad-1'), tasks: [] };
  assert.throws(() => cli(['init'], { dir, stdin: () => JSON.stringify(bad) }), /invalid request/);
  assert.deepEqual(readJournal(journalPath('bad-1', dir)), []);
});

test('request ids cannot escape the journal directory', () => {
  for (const id of ['../x', 'a/b', '', '.hidden', 'a b', 'x'.repeat(81), null]) {
    assert.throws(() => journalPath(id, '/tmp/j'), /request_id must match/, String(id));
  }
});

test('lifecycle: start -> result unlocks dependents and completes the request', t => {
  const s = session();
  t.after(s.cleanup);
  s.run(['start', RID, 'a', 'aikido']);
  assert.deepEqual(s.run(['status', RID]).running, ['a']);
  const afterA = s.run(['result', RID, 'a'], okResult('a'));
  assert.equal(afterA.accepted, true);
  assert.deepEqual(afterA.ready, ['b']);
  s.run(['start', RID, 'b', 'native']);
  const done = s.run(['result', RID, 'b'], okResult('b'));
  assert.equal(done.status, 'complete');
  assert.deepEqual(done.totals.by_state, { ok: 2 });
});

test('state is rebuilt from the journal alone (crash/restart safe)', t => {
  const s = session();
  t.after(s.cleanup);
  s.run(['start', RID, 'a']);
  s.run(['usage', RID, 'a', '100', '50', 'model-x']);
  s.run(['result', RID, 'a'], errResult('a'));
  const before = summarize(loadState(RID, s.dir), { now: Date.parse('2026-10-09T10:00:00Z') });
  const rebuilt = summarize(replay(readJournal(journalPath(RID, s.dir))), { now: Date.parse('2026-10-09T10:00:00Z') });
  assert.deepEqual(rebuilt, before);
  assert.equal(rebuilt.tasks[0].state, 'error');
  assert.equal(rebuilt.tasks[0].tokens.total, 150);
});

test('usage: only reported tokens are summed; cost is null unless reported', t => {
  const s = session();
  t.after(s.cleanup);
  s.run(['start', RID, 'a']);
  s.run(['usage', RID, 'a', '100', '50', 'm1']);
  const view = s.run(['usage', RID, 'a', '10', '5']);
  assert.deepEqual(view.tasks[0].tokens, { input: 110, output: 55, total: 165 });
  assert.equal(view.tasks[0].cost_usd, null);
  assert.equal(view.totals.cost_usd_reported, null);
  assert.equal(totalTokens(loadState(RID, s.dir)), 165);
  const withCost = s.run(['result', RID, 'a'], okResult('a', {
    usage: { input_tokens: 1, output_tokens: 2, cost_usd: 0.002, model: 'm2' }
  }));
  assert.equal(withCost.tasks[0].cost_usd, 0.002);
  assert.equal(withCost.totals.cost_usd_reported, 0.002);
  assert.equal(withCost.totals.tokens.total, 168);
  assert.deepEqual(loadState(RID, s.dir).tasks.a.usage.models, ['m1', 'm2']);
});

test('usage rejects negative, fractional or non-numeric token counts', t => {
  const s = session();
  t.after(s.cleanup);
  for (const [i, o] of [['-1', '1'], ['1.5', '1'], ['abc', '1'], ['1', 'NaN']]) {
    assert.throws(() => s.run(['usage', RID, 'a', i, o]), /non-negative integers/, `${i}/${o}`);
  }
  assert.equal(s.run(['status', RID]).totals.tokens.total, 0);
});

test('task-result/1 accepts an optional measured usage object and rejects bad ones', () => {
  const base = { id: 'a', status: 'ok', summary: 's', artifacts: [], errors: [], next: [] };
  assert.equal(validateResult({ ...base, usage: { input_tokens: 1, output_tokens: 2 } }).valid, true);
  assert.equal(validateResult({ ...base, usage: { input_tokens: 1, output_tokens: 2, cost_usd: 0.1, model: 'm' } }).valid, true);
  for (const usage of [
    { input_tokens: -1, output_tokens: 0 },
    { input_tokens: 1.5, output_tokens: 0 },
    { input_tokens: 1 },
    { input_tokens: 1, output_tokens: 1, extra: true },
    { input_tokens: 1, output_tokens: 1, cost_usd: -1 },
    'lots'
  ]) {
    assert.equal(validateResult({ ...base, usage }).valid, false, JSON.stringify(usage));
  }
});

test('a malformed executor reply is recorded as a retryable error, never as success', t => {
  const s = session();
  t.after(s.cleanup);
  s.run(['start', RID, 'a']);
  const bad = s.run(['result', RID, 'a'], 'Done, all good');
  assert.equal(bad.accepted, false);
  assert.equal(bad.tasks[0].state, 'error');
  assert.equal(bad.tasks[0].errors[0].code, 'invalid_result');
  assert.equal(bad.tasks[0].retry.allowed, true);
  assert.equal(bad.status, 'needs_retry');
});

test('a reply whose id does not match the task is rejected', t => {
  const s = session();
  t.after(s.cleanup);
  s.run(['start', RID, 'a']);
  const bad = s.run(['result', RID, 'a'], okResult('b'));
  assert.equal(bad.accepted, false);
  assert.equal(bad.tasks[0].state, 'error');
});

test('retry is bounded by policy.limits.max_retries_per_task', t => {
  const s = session();
  t.after(s.cleanup);
  s.run(['start', RID, 'a']);
  s.run(['result', RID, 'a'], errResult('a'));
  const first = s.run(['retry', RID, 'a']);
  assert.equal(first.recorded, true);
  assert.equal(first.decision.attempt, 2);
  assert.equal(first.tasks[0].state, 'pending');
  assert.equal(first.tasks[0].retries_left, 0);
  s.run(['start', RID, 'a']);
  const failed = s.run(['result', RID, 'a'], errResult('a'));
  assert.deepEqual(failed.tasks[0].retry, {
    allowed: false, reason: 'retry_limit_reached', retries_used: 1, max: policy.limits.max_retries_per_task
  });
  const refused = s.run(['retry', RID, 'a']);
  assert.equal(refused.recorded, false);
  assert.equal(refused.status, 'failed');
  assert.deepEqual(refused.failed, ['a']);
  const history = loadState(RID, s.dir).tasks.a.history;
  assert.equal(history.length, 1);
  assert.equal(history[0].state, 'error');
});

test('--force never waives the retry ceiling', t => {
  const s = session();
  t.after(s.cleanup);
  s.run(['start', RID, 'a']);
  s.run(['result', RID, 'a'], errResult('a'));
  s.run(['retry', RID, 'a']);
  s.run(['start', RID, 'a']);
  s.run(['result', RID, 'a'], errResult('a'));
  assert.equal(s.run(['retry', RID, 'a', '--force']).decision.reason, 'retry_limit_reached');
});

test('blocked tasks need input; --force can retry them within the ceiling', t => {
  const s = session();
  t.after(s.cleanup);
  s.run(['start', RID, 'a']);
  s.run(['result', RID, 'a'], JSON.stringify({
    id: 'a', status: 'blocked', summary: 'needs path', artifacts: [], errors: [{ code: 'missing_input', message: 'path?' }], next: []
  }));
  assert.equal(s.run(['retry', RID, 'a']).decision.reason, 'blocked_needs_input');
  assert.equal(s.run(['retry', RID, 'a', '--force']).recorded, true);
});

test('permission/tool errors are never retried automatically', t => {
  const s = session();
  t.after(s.cleanup);
  s.run(['start', RID, 'a']);
  const view = s.run(['result', RID, 'a'], errResult('a', 'permission_denied'));
  assert.equal(view.tasks[0].retry.allowed, false);
  assert.equal(view.tasks[0].retry.reason, 'non_retryable_error:permission_denied');
});

test('only error/partial/stale tasks are retryable; ok and pending are not', t => {
  const s = session();
  t.after(s.cleanup);
  const state = () => loadState(RID, s.dir);
  assert.equal(retryDecision(state(), 'a').reason, 'not_retryable_state:pending');
  s.run(['start', RID, 'a']);
  s.run(['result', RID, 'a'], okResult('a'));
  assert.equal(retryDecision(state(), 'a').reason, 'not_retryable_state:ok');
  assert.equal(retryDecision(state(), 'zzz').reason, 'unknown_task');
  assert.equal(retryDecision(state(), 'a', { force: true }).allowed, false);
});

test('a request token budget stops further retries', t => {
  const config = structuredClone(policy);
  config.observability.token_budget = { request: 100, task: null };
  const s = session(config);
  t.after(s.cleanup);
  s.run(['start', RID, 'a']);
  s.run(['usage', RID, 'a', '80', '30']);
  const view = s.run(['result', RID, 'a'], errResult('a'));
  assert.equal(view.budget.exceeded, true);
  assert.equal(view.tasks[0].retry.reason, 'request_token_budget_exhausted');
});

test('a per-task token budget stops retries and is reported', t => {
  const config = structuredClone(policy);
  config.observability.token_budget = { request: null, task: 50 };
  const s = session(config);
  t.after(s.cleanup);
  s.run(['start', RID, 'a']);
  s.run(['usage', RID, 'a', '40', '20']);
  const view = s.run(['result', RID, 'a'], errResult('a'));
  assert.deepEqual(view.budget.tasks_exceeded, ['a']);
  assert.equal(view.tasks[0].retry.reason, 'task_token_budget_exhausted');
});

test('a running task with no event past the stale delay is presumed lost and retryable', t => {
  const s = session();
  t.after(s.cleanup);
  s.run(['start', RID, 'a']);
  s.advance(policy.observability.stale_after_seconds - 1);
  assert.equal(s.run(['status', RID]).tasks[0].state, 'running');
  s.advance(2);
  const stale = s.run(['status', RID]);
  assert.equal(stale.tasks[0].state, 'stale');
  assert.deepEqual(stale.stale, ['a']);
  assert.equal(stale.status, 'needs_retry');
  assert.equal(s.run(['retry', RID, 'a']).recorded, true);
  assert.equal(s.run(['status', RID]).tasks[0].state, 'pending');
  assert.equal(effectiveState({ state: 'ok', updated_at: '2000-01-01T00:00:00Z' }), 'ok');
});

test('invalid transitions are refused before anything is written', t => {
  const s = session();
  t.after(s.cleanup);
  const lines = () => readJournal(journalPath(RID, s.dir)).length;
  s.run(['start', RID, 'a']);
  const count = lines();
  assert.throws(() => s.run(['start', RID, 'a']), /cannot start from running/);
  assert.throws(() => s.run(['start', RID, 'zzz']), /unknown task/);
  assert.throws(() => s.run(['start', RID, 'b', 'robot']), /executor must be/);
  assert.throws(() => apply(emptyState(), { type: 'start', task: 'a', ts: 't' }), /no request event/);
  assert.throws(() => s.run(['init'], JSON.stringify(request())), /already recorded/);
  assert.equal(lines(), count, 'refused events must leave the journal untouched');
  s.run(['result', RID, 'a'], okResult('a'));
  assert.equal(lines(), count + 1);
  assert.throws(() => s.run(['result', RID, 'a'], okResult('a')), /result not accepted from ok/);
  assert.equal(lines(), count + 1, 'a refused duplicate result must not be written');
});

test('a corrupted journal line is reported with its line number', t => {
  const s = session();
  t.after(s.cleanup);
  appendFileSync(journalPath(RID, s.dir), '{not json}\n');
  assert.throws(() => s.run(['status', RID]), /:2: invalid JSON/);
});

test('redact masks tokens, passwords, api keys and bearer credentials', () => {
  assert.equal(redact('token=abc123'), 'token=[REDACTED]');
  assert.equal(redact('--password=hunter2 ok'), '--password=[REDACTED] ok');
  assert.equal(redact('API_KEY: "s3cr3t value"'), 'API_KEY=[REDACTED]');
  assert.equal(redact('Authorization: Bearer abc.def-ghi'), 'Authorization=[REDACTED]');
  assert.equal(redact('curl -H "Bearer xyz.123"'), 'curl -H "Bearer [REDACTED]"');
  assert.equal(redact('nothing to hide'), 'nothing to hide');
});

test('run executes a command without a shell and journals exit code, duration and output tail', t => {
  const s = session();
  t.after(s.cleanup);
  const out = s.run(['run', RID, 'a', '--', process.execPath, '-e', "console.log('hi'); process.exit(3)"]);
  assert.equal(out.exec.exit_code, 3);
  assert.equal(out.exec.timed_out, false);
  assert.equal(out.exec.stdout_tail, 'hi\n');
  assert.ok(out.exec.duration_ms >= 0);
  assert.equal(out.tasks[0].state, 'running');
  assert.equal(out.tasks[0].execs, 1);
  assert.equal(loadState(RID, s.dir).tasks.a.last_exec.exit_code, 3);
  const injected = s.run(['run', RID, 'a', '--', process.execPath, '-e', 'console.log(process.argv[1])', 'x; echo injected']);
  assert.equal(injected.exec.stdout_tail, 'x; echo injected\n');
  assert.equal(injected.tasks[0].execs, 2);
});

test('run never journals secrets from argv or output', t => {
  const s = session();
  t.after(s.cleanup);
  const out = s.run(['run', RID, 'a', '--', process.execPath, '-e',
    "console.error('token=abc123 oops')", '--', '--password=hunter2']);
  assert.equal(out.exec.exit_code, 0, out.exec.stderr_tail);
  assert.match(out.exec.stderr_tail, /token=\[REDACTED\]/);
  assert.ok(out.exec.argv.includes('--password=[REDACTED]'));
  const raw = readFileSync(journalPath(RID, s.dir), 'utf8');
  assert.doesNotMatch(raw, /abc123|hunter2/);
});

test('run enforces the timeout and records it', t => {
  const s = session();
  t.after(s.cleanup);
  const out = s.run(['run', RID, 'a', '--timeout', '0.3', '--', process.execPath, '-e', 'setTimeout(() => {}, 10000)']);
  assert.equal(out.exec.timed_out, true);
  assert.notEqual(out.exec.exit_code, 0);
});

test('run records a missing executable instead of crashing', t => {
  const s = session();
  t.after(s.cleanup);
  const out = s.run(['run', RID, 'a', '--', 'definitely-not-a-command-xyz']);
  assert.equal(out.exec.exit_code, null);
  assert.equal(out.exec.error_code, 'ENOENT');
});

test('run truncates output to the policy limit and keeps the tail', t => {
  const s = session();
  t.after(s.cleanup);
  const out = s.run(['run', RID, 'a', '--', process.execPath, '-e', "process.stdout.write('x'.repeat(10000) + 'END')"]);
  assert.ok(out.exec.stdout_tail.length <= policy.observability.exec_output_chars + 3);
  assert.ok(out.exec.stdout_tail.endsWith('END'));
  assert.ok(out.exec.stdout_tail.startsWith('...'));
});

test('run refuses bad argv, unknown tasks and finished tasks', t => {
  const s = session();
  t.after(s.cleanup);
  assert.throws(() => s.run(['run', RID, 'a']), /usage: run/);
  assert.throws(() => s.run(['run', RID, 'a', '--']), /nonempty array/);
  assert.throws(() => runCommand(RID, 'a', ['', 'x'], { dir: s.dir }), /nonempty array/);
  assert.throws(() => runCommand(RID, 'zzz', ['true'], { dir: s.dir }), /unknown task/);
  s.run(['start', RID, 'a']);
  s.run(['result', RID, 'a'], okResult('a'));
  assert.throws(() => s.run(['run', RID, 'a', '--', 'true']), /is ok: record a retry/);
});

test('after a retry, run starts the new attempt automatically', t => {
  const s = session();
  t.after(s.cleanup);
  s.run(['run', RID, 'a', '--', process.execPath, '-e', 'process.exit(1)']);
  s.run(['result', RID, 'a'], errResult('a'));
  s.run(['retry', RID, 'a']);
  const out = s.run(['run', RID, 'a', '--', process.execPath, '-e', 'process.exit(0)']);
  assert.equal(out.tasks[0].state, 'running');
  assert.equal(out.tasks[0].attempt, 2);
  assert.equal(out.exec.exit_code, 0);
});

test('record is the single write path and stamps events with the injected clock', t => {
  const s = session();
  t.after(s.cleanup);
  const state = record(RID, { type: 'start', task: 'a' }, { dir: s.dir, now: () => new Date('2030-01-01T00:00:00Z') });
  assert.equal(state.last_ts, '2030-01-01T00:00:00.000Z');
  assert.throws(() => record('other', { type: 'request', request: request(RID) }, { dir: s.dir }), /must equal the journal request id/);
  writeFileSync(journalPath('empty-1', s.dir), '');
  assert.throws(() => record('empty-1', { type: 'start', task: 'a' }, { dir: s.dir }), /no request event/);
});

test('the CLI entry point prints one JSON object and exits nonzero on refusal', t => {
  const s = session();
  t.after(s.cleanup);
  const run = (args, input) => {
    const spawned = spawnTracker(args, s.dir, input);
    return { code: spawned.status, out: spawned.stdout.trim(), err: spawned.stderr.trim() };
  };
  const status = run(['status', RID]);
  assert.equal(status.code, 0);
  assert.equal(JSON.parse(status.out).request_id, RID);
  const bad = run(['status', '../etc']);
  assert.equal(bad.code, 1);
  assert.equal(JSON.parse(bad.err).status, 'error');
  run(['start', RID, 'a']);
  run(['result', RID, 'a'], errResult('a'));
  run(['retry', RID, 'a']);
  run(['start', RID, 'a']);
  run(['result', RID, 'a'], errResult('a'));
  const refused = run(['retry', RID, 'a']);
  assert.equal(refused.code, 3);
  assert.equal(JSON.parse(refused.out).recorded, false);
});

import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

function spawnTracker(args, dir, input = '') {
  return spawnSync(process.execPath, [fileURLToPath(new URL('./tracker.mjs', import.meta.url)), ...args], {
    encoding: 'utf8', input, env: { ...process.env, AIKIDO_ORCH_DIR: dir }
  });
}
