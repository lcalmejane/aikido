import { appendFileSync, existsSync, mkdirSync, readFileSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { validateRequest, validateResult } from './runtime.mjs';

/**
 * Task observability for the AI-KIDO orchestrator.
 *
 * - One append-only JSONL journal per request (events: request, start, result, usage, exec, retry).
 * - State is NEVER stored: it is rebuilt by replaying the journal, so a crash loses nothing and
 *   a new coordinator session can resume exactly where the previous one stopped.
 * - Retry decisions are computed from the policy ceilings (never invented) and the journal.
 * - Tokens/cost are only what executors REPORT (`usage`); nothing is estimated or priced here.
 * - Single writer assumed: only the coordinator appends to a request journal.
 *
 * The tracker grants no permission: commands run with the caller's own rights, without a shell.
 */

const defaultPolicy = JSON.parse(readFileSync(new URL('./policy.json', import.meta.url), 'utf8'));
const FINAL = new Set(['ok', 'partial', 'blocked', 'error']);
const executors = new Set(['aikido', 'native']);
const REQUEST_ID = /^[A-Za-z0-9][A-Za-z0-9._-]{0,79}$/;
// The scheme word (Bearer/Basic) is consumed with the value, so the credential after it is masked too.
const SECRET = /\b([A-Za-z0-9_]*(?:token|secret|passw(?:or)?d|api[_-]?key|authorization)[A-Za-z0-9_]*)\s*[=:]\s*(?:(?:Bearer|Basic)\s+)?("[^"]*"|'[^']*'|\S+)/gi;
const BEARER = /\bBearer\s+[A-Za-z0-9._~+/-]+=*/g;

const isObject = value => value !== null && typeof value === 'object' && !Array.isArray(value);
const isText = value => typeof value === 'string' && value.trim() !== '';
const isCount = value => Number.isSafeInteger(value) && value >= 0;

/** Mask obvious secrets before anything is journaled. Not a substitute for keeping secrets out of argv. */
export function redact(text) {
  return String(text).replace(SECRET, '$1=[REDACTED]').replace(BEARER, 'Bearer [REDACTED]');
}

const tail = (text, limit) => {
  const clean = redact(text ?? '');
  return clean.length > limit ? `...${clean.slice(clean.length - limit)}` : clean;
};

export function journalPath(requestId, dir = defaultPolicy.observability.journal_dir) {
  if (typeof requestId !== 'string' || !REQUEST_ID.test(requestId)) {
    throw new Error('request_id must match [A-Za-z0-9][A-Za-z0-9._-]{0,79}');
  }
  return join(resolve(dir), `${requestId}.jsonl`);
}

export function readJournal(path) {
  if (!existsSync(path)) return [];
  const events = [];
  readFileSync(path, 'utf8').split('\n').forEach((line, index) => {
    if (!line.trim()) return;
    try {
      events.push(JSON.parse(line));
    } catch (error) {
      throw new Error(`journal ${path}:${index + 1}: invalid JSON (${error.message})`);
    }
  });
  return events;
}

export function emptyState() {
  return { request_id: null, request: null, tasks: Object.create(null), order: [], events: 0, last_ts: null };
}

function newTask(spec, ts) {
  return {
    id: spec.id,
    depends_on: [...spec.depends_on],
    transport_kind: spec.transport.kind,
    executor: spec.executor ?? null,
    state: 'pending',
    attempt: 1,
    errors: [],
    last_summary: null,
    history: [],
    usage: { input_tokens: 0, output_tokens: 0, cost_usd: 0, cost_reported: false, models: [] },
    execs: 0,
    exec_ms: 0,
    last_exec: null,
    started_at: null,
    finished_at: null,
    updated_at: ts
  };
}

/** Apply ONE event to a state (mutates). Throws on any inconsistent event, before anything is written. */
export function apply(state, event) {
  if (!isObject(event) || !isText(event.type) || !isText(event.ts)) {
    throw new Error('event: object with nonempty type and ts required');
  }
  if (event.type === 'request') {
    if (state.request_id !== null) throw new Error('request already recorded in this journal');
    const check = validateRequest(event.request);
    if (!check.valid) throw new Error(`invalid request: ${check.errors.join('; ')}`);
    state.request_id = event.request.request_id;
    state.request = event.request;
    for (const spec of event.request.tasks) {
      state.tasks[spec.id] = newTask(spec, event.ts);
      state.order.push(spec.id);
    }
  } else {
    if (state.request_id === null) throw new Error('journal has no request event yet');
    const task = state.tasks[event.task];
    if (!task) throw new Error(`unknown task ${JSON.stringify(event.task)}`);
    task.updated_at = event.ts;
    switch (event.type) {
      case 'start':
        if (task.state !== 'pending') throw new Error(`task ${task.id}: cannot start from ${task.state}`);
        task.state = 'running';
        task.started_at = event.ts;
        if (event.executor !== undefined && event.executor !== null) {
          if (!executors.has(event.executor)) throw new Error('executor must be aikido|native');
          task.executor = event.executor;
        }
        break;
      case 'result':
        if (!['pending', 'running'].includes(task.state)) {
          throw new Error(`task ${task.id}: result not accepted from ${task.state}`);
        }
        if (!FINAL.has(event.status)) throw new Error('result.status must be ok|partial|blocked|error');
        if (task.state === 'pending') task.started_at = event.ts;
        task.state = event.status;
        task.errors = Array.isArray(event.errors) ? event.errors : [];
        task.last_summary = typeof event.summary === 'string' ? event.summary : null;
        task.finished_at = event.ts;
        break;
      case 'usage': {
        if (!isCount(event.input_tokens) || !isCount(event.output_tokens)) {
          throw new Error('usage: input_tokens and output_tokens must be non-negative integers');
        }
        task.usage.input_tokens += event.input_tokens;
        task.usage.output_tokens += event.output_tokens;
        if (event.cost_usd !== undefined && event.cost_usd !== null) {
          if (!Number.isFinite(event.cost_usd) || event.cost_usd < 0) throw new Error('usage.cost_usd must be >= 0');
          task.usage.cost_usd += event.cost_usd;
          task.usage.cost_reported = true;
        }
        if (isText(event.model) && !task.usage.models.includes(event.model)) task.usage.models.push(event.model);
        break;
      }
      case 'exec':
        if (task.state !== 'running') throw new Error(`task ${task.id}: exec requires a running task`);
        task.execs += 1;
        task.exec_ms += isCount(event.duration_ms) ? event.duration_ms : 0;
        task.last_exec = {
          argv: event.argv, exit_code: event.exit_code, signal: event.signal ?? null,
          timed_out: Boolean(event.timed_out), error_code: event.error_code ?? null,
          duration_ms: event.duration_ms
        };
        break;
      case 'retry':
        if (['ok', 'pending'].includes(task.state)) throw new Error(`task ${task.id}: cannot retry from ${task.state}`);
        task.history.push({ attempt: task.attempt, state: task.state, errors: task.errors, reason: event.reason ?? null });
        task.attempt += 1;
        task.state = 'pending';
        task.errors = [];
        task.last_summary = null;
        task.started_at = null;
        task.finished_at = null;
        break;
      default:
        throw new Error(`unknown event type ${JSON.stringify(event.type)}`);
    }
  }
  state.events += 1;
  state.last_ts = event.ts;
  return state;
}

export function replay(events) {
  const state = emptyState();
  for (const event of events) apply(state, event);
  return state;
}

export function loadState(requestId, dir) {
  return replay(readJournal(journalPath(requestId, dir)));
}

/** Validate against the journal, then append. Returns the new state. */
export function record(requestId, event, { dir, now = () => new Date() } = {}) {
  const path = journalPath(requestId, dir);
  if (event?.type === 'request' && event.request?.request_id !== requestId) {
    throw new Error('request.request_id must equal the journal request id');
  }
  const state = replay(readJournal(path));
  const full = { ...event, ts: now().toISOString() };
  apply(state, full);
  mkdirSync(dirname(path), { recursive: true });
  appendFileSync(path, `${JSON.stringify(full)}\n`);
  return state;
}

/** `running` with no event for longer than the policy delay is presumed lost (crash, killed worker). */
export function effectiveState(task, now = Date.now(), config = defaultPolicy) {
  if (task.state === 'running') {
    const age = now - Date.parse(task.updated_at);
    if (Number.isFinite(age) && age > config.observability.stale_after_seconds * 1000) return 'stale';
  }
  return task.state;
}

const tokensOf = task => task.usage.input_tokens + task.usage.output_tokens;

export function totalTokens(state) {
  return Object.values(state.tasks).reduce((sum, task) => sum + tokensOf(task), 0);
}

/**
 * May this task be retried? Ceilings come from policy.limits.max_retries_per_task and
 * policy.observability; `force` only waives the state check (blocked / running), never the ceilings.
 */
export function retryDecision(state, taskId, { config = defaultPolicy, now = Date.now(), force = false } = {}) {
  const deny = (reason, extra = {}) => ({ allowed: false, reason, ...extra });
  const task = state.tasks[taskId];
  if (!task) return deny('unknown_task');
  const obs = config.observability;
  const status = effectiveState(task, now, config);
  const retryable = ['error', 'partial', 'stale'];
  if (status === 'blocked' && !force) return deny('blocked_needs_input');
  if (!retryable.includes(status) && !(force && ['blocked', 'running'].includes(status))) {
    return deny(`not_retryable_state:${status}`);
  }
  const retriesUsed = task.attempt - 1;
  if (retriesUsed >= config.limits.max_retries_per_task) {
    return deny('retry_limit_reached', { retries_used: retriesUsed, max: config.limits.max_retries_per_task });
  }
  const fatal = task.errors.find(error => obs.non_retryable_codes.includes(error.code));
  if (fatal) return deny(`non_retryable_error:${fatal.code}`);
  const { request: requestBudget, task: taskBudget } = obs.token_budget;
  if (requestBudget !== null && totalTokens(state) >= requestBudget) return deny('request_token_budget_exhausted');
  if (taskBudget !== null && tokensOf(task) >= taskBudget) return deny('task_token_budget_exhausted');
  return { allowed: true, reason: status, attempt: task.attempt + 1 };
}

export function summarize(state, { config = defaultPolicy, now = Date.now() } = {}) {
  const budget = config.observability.token_budget;
  const byState = {};
  const tasks = state.order.map(id => {
    const task = state.tasks[id];
    const current = effectiveState(task, now, config);
    byState[current] = (byState[current] ?? 0) + 1;
    const needsDecision = ['error', 'partial', 'blocked', 'stale'].includes(current);
    return {
      id,
      state: current,
      attempt: task.attempt,
      retries_used: task.attempt - 1,
      retries_left: Math.max(0, config.limits.max_retries_per_task - (task.attempt - 1)),
      executor: task.executor,
      transport: task.transport_kind,
      depends_on: task.depends_on,
      tokens: { input: task.usage.input_tokens, output: task.usage.output_tokens, total: tokensOf(task) },
      cost_usd: task.usage.cost_reported ? task.usage.cost_usd : null,
      execs: task.execs,
      exec_ms: task.exec_ms,
      errors: task.errors,
      ...(needsDecision ? { retry: retryDecision(state, id, { config, now }) } : {})
    };
  });
  const okIds = new Set(tasks.filter(task => task.state === 'ok').map(task => task.id));
  const ready = tasks.filter(task => task.state === 'pending' && task.depends_on.every(dep => okIds.has(dep)));
  const waiting = tasks
    .filter(task => task.state === 'pending' && !task.depends_on.every(dep => okIds.has(dep)))
    .map(task => ({ id: task.id, waiting_on: task.depends_on.filter(dep => !okIds.has(dep)) }));
  const retryable = tasks.filter(task => task.retry?.allowed).map(task => task.id);
  const failed = tasks.filter(task => task.retry && !task.retry.allowed).map(task => task.id);
  const running = tasks.filter(task => task.state === 'running').map(task => task.id);
  const total = totalTokens(state);
  let status;
  if (tasks.every(task => task.state === 'ok')) status = 'complete';
  else if (retryable.length) status = 'needs_retry';
  else if (running.length || ready.length) status = 'in_progress';
  else status = 'failed';
  return {
    request_id: state.request_id,
    status,
    events: state.events,
    tasks,
    ready: ready.map(task => task.id),
    waiting,
    running,
    stale: tasks.filter(task => task.state === 'stale').map(task => task.id),
    retryable,
    failed,
    totals: {
      by_state: byState,
      tokens: {
        input: tasks.reduce((sum, task) => sum + task.tokens.input, 0),
        output: tasks.reduce((sum, task) => sum + task.tokens.output, 0),
        total
      },
      cost_usd_reported: tasks.some(task => task.cost_usd !== null)
        ? tasks.reduce((sum, task) => sum + (task.cost_usd ?? 0), 0) : null,
      exec_ms: tasks.reduce((sum, task) => sum + task.exec_ms, 0),
      retries_used: tasks.reduce((sum, task) => sum + task.retries_used, 0)
    },
    budget: {
      request: budget.request,
      exceeded: budget.request !== null && total >= budget.request,
      tasks_exceeded: budget.task === null ? [] : tasks.filter(task => task.tokens.total >= budget.task).map(task => task.id)
    }
  };
}

/**
 * Run one command for a task, without a shell, bounded in time and output, and journal the outcome.
 * It does NOT decide the task's result: the coordinator reads `exit_code` and records `result`.
 */
export function runCommand(requestId, taskId, argv, options = {}) {
  const { dir, cwd = process.cwd(), now, config = defaultPolicy } = options;
  if (!Array.isArray(argv) || argv.length === 0 || !argv.every(part => typeof part === 'string') || !argv[0]) {
    throw new Error('argv must be a nonempty array of strings (no shell: use ["sh","-c",...] explicitly if needed)');
  }
  const state = loadState(requestId, dir);
  const task = state.tasks[taskId];
  if (!task) throw new Error(`unknown task ${JSON.stringify(taskId)}`);
  if (task.state === 'pending') record(requestId, { type: 'start', task: taskId }, { dir, now });
  else if (task.state !== 'running') {
    throw new Error(`task ${taskId} is ${task.state}: record a retry before running commands again`);
  }
  const obs = config.observability;
  const timeoutSeconds = options.timeoutSeconds ?? obs.exec_timeout_seconds;
  if (!Number.isFinite(timeoutSeconds) || timeoutSeconds <= 0) throw new Error('timeout must be > 0 seconds');
  const started = Date.now();
  const run = spawnSync(argv[0], argv.slice(1), {
    cwd, encoding: 'utf8', timeout: timeoutSeconds * 1000, maxBuffer: 16 * 1024 * 1024,
    shell: false, stdio: ['ignore', 'pipe', 'pipe']
  });
  const event = {
    type: 'exec',
    task: taskId,
    attempt: task.attempt,
    argv: argv.map(redact),
    exit_code: run.status,
    signal: run.signal ?? null,
    timed_out: run.error?.code === 'ETIMEDOUT',
    error_code: run.error?.code ?? null,
    duration_ms: Date.now() - started,
    stdout_tail: tail(run.stdout, obs.exec_output_chars),
    stderr_tail: tail(run.stderr, obs.exec_output_chars)
  };
  record(requestId, event, { dir, now });
  return event;
}

function parseRun(rest) {
  const split = rest.indexOf('--');
  if (split < 0) throw new Error('usage: run <request_id> <task_id> [--timeout <s>] -- <command> [args...]');
  const [requestId, taskId, ...flags] = rest.slice(0, split);
  const argv = rest.slice(split + 1);
  const at = flags.indexOf('--timeout');
  return { requestId, taskId, argv, timeoutSeconds: at >= 0 ? Number(flags[at + 1]) : undefined };
}

/** CLI core: returns one JSON-serializable object, throws on error. */
export function cli(args, { stdin = () => readFileSync(0, 'utf8'), dir, now, config = defaultPolicy } = {}) {
  const journalDir = dir ?? process.env.AIKIDO_ORCH_DIR ?? config.observability.journal_dir;
  const clock = now ?? (() => new Date());
  const view = requestId => summarize(loadState(requestId, journalDir), { config, now: clock().getTime() });
  const [command, ...rest] = args;
  switch (command) {
    case 'init': {
      const request = JSON.parse(stdin());
      record(request?.request_id, { type: 'request', request }, { dir: journalDir, now: clock });
      return view(request.request_id);
    }
    case 'start': {
      const [requestId, taskId, executor] = rest;
      record(requestId, { type: 'start', task: taskId, ...(executor ? { executor } : {}) }, { dir: journalDir, now: clock });
      return view(requestId);
    }
    case 'result': {
      const [requestId, taskId] = rest;
      const state = loadState(requestId, journalDir);
      let check;
      let value = null;
      try {
        value = JSON.parse(stdin());
        check = validateResult(value, state.request, config);
        if (check.valid && value.id !== taskId) check = { valid: false, errors: [`result.id must be ${taskId}`] };
      } catch (error) {
        check = { valid: false, errors: [`result: not valid JSON (${error.message})`] };
      }
      if (!check.valid) {
        // A malformed reply is a failed attempt: retryable within the ceiling, never a silent success.
        record(requestId, {
          type: 'result', task: taskId, status: 'error', summary: 'malformed executor reply',
          errors: [{ code: 'invalid_result', message: check.errors.slice(0, 3).join('; ').slice(0, 500) }]
        }, { dir: journalDir, now: clock });
        return { accepted: false, errors: check.errors, ...view(requestId) };
      }
      record(requestId, {
        type: 'result', task: taskId, status: value.status, summary: value.summary, errors: value.errors
      }, { dir: journalDir, now: clock });
      if (value.usage) record(requestId, { type: 'usage', task: taskId, ...value.usage }, { dir: journalDir, now: clock });
      return { accepted: true, ...view(requestId) };
    }
    case 'usage': {
      const [requestId, taskId, input, output, model] = rest;
      record(requestId, {
        type: 'usage', task: taskId, input_tokens: Number(input), output_tokens: Number(output), ...(model ? { model } : {})
      }, { dir: journalDir, now: clock });
      return view(requestId);
    }
    case 'run': {
      const { requestId, taskId, argv, timeoutSeconds } = parseRun(rest);
      const exec = runCommand(requestId, taskId, argv, { dir: journalDir, now: clock, config, timeoutSeconds });
      return { exec, ...view(requestId) };
    }
    case 'retry': {
      const [requestId, taskId, ...flags] = rest;
      const state = loadState(requestId, journalDir);
      const decision = retryDecision(state, taskId, { config, now: clock().getTime(), force: flags.includes('--force') });
      if (!decision.allowed) return { recorded: false, decision, ...view(requestId) };
      record(requestId, { type: 'retry', task: taskId, reason: decision.reason }, { dir: journalDir, now: clock });
      return { recorded: true, decision, ...view(requestId) };
    }
    case 'status': {
      const [requestId] = rest;
      return view(requestId);
    }
    default:
      throw new Error('usage: tracker.mjs init|start|result|usage|run|retry|status ...');
  }
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try {
    const out = cli(process.argv.slice(2));
    process.stdout.write(`${JSON.stringify(out)}\n`);
    if (out.recorded === false) process.exitCode = 3;
  } catch (error) {
    process.stderr.write(`${JSON.stringify({ status: 'error', error: error.message })}\n`);
    process.exitCode = 1;
  }
}
