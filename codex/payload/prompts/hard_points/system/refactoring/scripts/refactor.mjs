#!/usr/bin/env node
// AI-KIDO refactoring engine: deterministic, dependency-free mass edits for any text/code target.
// One bounded JSON object on stdout; human text on stderr; nonzero exit unless status is "ok".
// Plans, backups, batches and temporary scripts live OUTSIDE the project (never in Git).
import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import {
  existsSync, lstatSync, mkdirSync, readFileSync, readdirSync, renameSync, rmSync, statSync, writeFileSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const DEFAULT_MAX_BYTES = 2_000_000;
const DEFAULT_BATCH_FILES = 40;
const DEFAULT_BATCH_BYTES = 400_000;
const DEFAULT_SAMPLE = 5;
const WALK_EXCLUDED = new Set(['.git', 'node_modules', '.hg', '.svn']);
const REPEAT = new Set(['path', 'include', 'exclude', 'ext']);
const FLAGS = new Set(['regex', 'dry-run', 'ignore-case', 'word', 'no-git', 'force']);
const VALUES = new Set([
  'root', 'find', 'replace', 'flags', 'plan', 'manifest', 'batch', 'index', 'name',
  'sample', 'max-bytes', 'batch-size', 'batch-bytes',
]);

export class CliError extends Error {
  constructor(code, message) {
    super(message);
    this.code = code;
  }
}

const sha256 = (buffer) => createHash('sha256').update(buffer).digest('hex');
const posix = (path) => path.split(sep).join('/');
const camel = (key) => key.replace(/-([a-z])/g, (_, c) => c.toUpperCase());

export function parseArgs(argv) {
  const [command, ...rest] = argv;
  const options = {};
  for (let i = 0; i < rest.length; i += 1) {
    const token = rest[i];
    if (!token.startsWith('--')) throw new CliError('bad_argument', `Unexpected argument: ${token}`);
    const key = token.slice(2);
    if (!FLAGS.has(key) && !VALUES.has(key) && !REPEAT.has(key)) throw new CliError('bad_argument', `Unknown option: --${key}`);
    if (FLAGS.has(key)) {
      options[camel(key)] = true;
      continue;
    }
    i += 1;
    if (rest[i] === undefined) throw new CliError('bad_argument', `Missing value for --${key}`);
    if (REPEAT.has(key)) (options[camel(key)] ??= []).push(rest[i]);
    else options[camel(key)] = rest[i];
  }
  return { command, options };
}

function intOption(value, fallback, name, min = 0) {
  if (value === undefined) return fallback;
  const number = Number(value);
  if (!Number.isInteger(number) || number < min) throw new CliError('bad_argument', `--${name} must be an integer >= ${min}`);
  return number;
}

export function globToRegExp(glob) {
  let out = '';
  for (let i = 0; i < glob.length; i += 1) {
    const c = glob[i];
    if (c === '*') {
      if (glob[i + 1] === '*') {
        i += 1;
        if (glob[i + 1] === '/') {
          i += 1;
          out += '(?:.*/)?';
        } else out += '.*';
      } else out += '[^/]*';
    } else if (c === '?') out += '[^/]';
    else out += c.replace(/[.+^${}()|[\]\\]/g, '\\$&');
  }
  return new RegExp(`^${out}$`);
}

function globMatcher(glob) {
  const regex = globToRegExp(glob.includes('/') ? glob : `**/${glob}`);
  return (path) => regex.test(path);
}

function assertSafeRelative(path) {
  if (!path || path.startsWith('/') || path.includes('\0') || /^[A-Za-z]:/.test(path) || /(^|\/)\.\.(\/|$)/.test(path)) {
    throw new CliError('unsafe_path', `Unsafe relative path: ${path}`);
  }
}

function normalizePrefix(prefix) {
  const cleaned = prefix.replace(/^(\.\/)+/, '').replace(/\/+$/, '');
  if (cleaned === '' || cleaned === '.') return '';
  assertSafeRelative(cleaned);
  return cleaned;
}

const absolute = (root, path) => join(root, ...path.split('/'));

export function stateDir(root, env = process.env) {
  const base = env.AIKIDO_REFACTOR_STATE ?? join(tmpdir(), 'aikido-refactor');
  return join(base, sha256(resolve(root)).slice(0, 12));
}

function writeJson(path, data) {
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, `${JSON.stringify(data)}\n`);
}

function readJson(path, code) {
  try {
    return JSON.parse(readFileSync(path, 'utf8'));
  } catch {
    throw new CliError(code, `Cannot read state file ${path}`);
  }
}

function gitFiles(root) {
  try {
    const out = execFileSync('git', ['ls-files', '-z', '--cached', '--others', '--exclude-standard'], {
      cwd: root, encoding: 'utf8', maxBuffer: 256 * 1024 * 1024, stdio: ['ignore', 'pipe', 'ignore'],
    });
    return out.split('\0').filter(Boolean);
  } catch {
    return null;
  }
}

function walk(root, relative) {
  const dir = relative ? absolute(root, relative) : root;
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const path = relative ? `${relative}/${entry.name}` : entry.name;
    if (entry.isSymbolicLink()) return [];
    if (entry.isDirectory()) return WALK_EXCLUDED.has(entry.name) ? [] : walk(root, path);
    return entry.isFile() ? [path] : [];
  });
}

// Scope first: honours .gitignore (git) or default exclusions (walk), then user filters.
export function listFiles(root, options = {}) {
  const rootAbs = resolve(root);
  if (!existsSync(rootAbs) || !statSync(rootAbs).isDirectory()) throw new CliError('bad_root', 'Root is not a directory');
  let source = 'git';
  let paths = options.noGit ? null : gitFiles(rootAbs);
  if (!paths) {
    source = 'walk';
    paths = walk(rootAbs, '');
  }
  const prefixes = (options.path ?? []).map(normalizePrefix);
  const extensions = (options.ext ?? []).map((ext) => (ext.startsWith('.') ? ext : `.${ext}`).toLowerCase());
  const include = (options.include ?? []).map(globMatcher);
  const exclude = (options.exclude ?? []).map(globMatcher);
  const maxBytes = intOption(options.maxBytes, DEFAULT_MAX_BYTES, 'max-bytes', 1);
  const files = [];
  const skipped = { large: 0, nonfile: 0 };
  for (const path of [...new Set(paths.map(posix))].sort()) {
    if (prefixes.length && !prefixes.some((p) => p === '' || path === p || path.startsWith(`${p}/`))) continue;
    if (extensions.length && !extensions.some((ext) => path.toLowerCase().endsWith(ext))) continue;
    if (include.length && !include.some((match) => match(path))) continue;
    if (exclude.some((match) => match(path))) continue;
    let info;
    try {
      info = lstatSync(absolute(rootAbs, path));
    } catch {
      skipped.nonfile += 1;
      continue;
    }
    if (!info.isFile()) {
      skipped.nonfile += 1;
      continue;
    }
    if (info.size > maxBytes) {
      skipped.large += 1;
      continue;
    }
    files.push({ path, size: info.size });
  }
  return { source, files, skipped };
}

function groupBatches(items, maxFiles, maxBytes) {
  const batches = [];
  let current = [];
  let bytes = 0;
  for (const item of items) {
    if (current.length && (current.length >= maxFiles || bytes + item.size > maxBytes)) {
      batches.push(current);
      current = [];
      bytes = 0;
    }
    current.push(item);
    bytes += item.size;
  }
  if (current.length) batches.push(current);
  return batches;
}

function batchLimits(options) {
  return [
    intOption(options.batchSize, DEFAULT_BATCH_FILES, 'batch-size', 1),
    intOption(options.batchBytes, DEFAULT_BATCH_BYTES, 'batch-bytes', 1),
  ];
}

export function scan(root, options = {}) {
  const { source, files, skipped } = listFiles(root, options);
  const byExt = {};
  for (const { path } of files) {
    const dot = path.lastIndexOf('.');
    const ext = dot > path.lastIndexOf('/') ? path.slice(dot).toLowerCase() : '(none)';
    byExt[ext] = (byExt[ext] ?? 0) + 1;
  }
  const top = Object.entries(byExt).sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0])).slice(0, 12);
  return {
    status: 'ok', command: 'scan', source, files: files.length,
    bytes: files.reduce((total, file) => total + file.size, 0), skipped,
    byExt: Object.fromEntries(top),
    sample: files.slice(0, intOption(options.sample, DEFAULT_SAMPLE, 'sample')).map((file) => file.path),
  };
}

export function createBatches(root, options = {}) {
  const { source, files } = listFiles(root, options);
  const [maxFiles, maxBytes] = batchLimits(options);
  const batches = groupBatches(files, maxFiles, maxBytes);
  const paths = batches.map((batch) => batch.map((file) => file.path));
  const id = `b-${sha256(JSON.stringify(paths)).slice(0, 10)}`;
  writeJson(join(stateDir(root), 'batches', id, 'manifest.json'), { version: 1, source, batches: paths });
  const shown = batches.slice(0, 10).map((batch, index) => ({
    n: index + 1, files: batch.length, bytes: batch.reduce((total, file) => total + file.size, 0), first: batch[0].path,
  }));
  return {
    status: 'ok', command: 'batches', manifest: id, files: files.length, batches: batches.length,
    list: shown, truncated: batches.length > shown.length,
  };
}

export function showBatch(root, options = {}) {
  if (!/^b-[0-9a-f]{10}$/.test(options.manifest ?? '')) throw new CliError('bad_argument', '--manifest must be a batch manifest id');
  const manifest = readJson(join(stateDir(root), 'batches', options.manifest, 'manifest.json'), 'manifest_missing');
  const index = intOption(options.index, 0, 'index', 1);
  if (index < 1 || index > manifest.batches.length) throw new CliError('bad_argument', `--index must be 1..${manifest.batches.length}`);
  return { status: 'ok', command: 'batch', manifest: options.manifest, index, files: manifest.batches[index - 1] };
}

export function buildMatcher(op) {
  if (typeof op.find !== 'string' || op.find === '') throw new CliError('bad_argument', '--find must not be empty');
  if (typeof op.replace !== 'string') throw new CliError('bad_argument', '--replace is required (use an empty string to delete)');
  const flags = [...new Set(`g${op.flags ?? ''}${op.ignoreCase ? 'i' : ''}`)].join('');
  let source = op.regex ? op.find : op.find.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  if (op.word) source = `\\b(?:${source})\\b`;
  let regex;
  try {
    regex = new RegExp(source, flags);
  } catch (error) {
    throw new CliError('bad_pattern', error.message);
  }
  return { regex, replace: op.regex ? op.replace : () => op.replace };
}

function readText(path) {
  const buffer = readFileSync(path);
  if (buffer.subarray(0, 8000).includes(0)) return { buffer, text: null, reason: 'binary' };
  const text = buffer.toString('utf8');
  if (!Buffer.from(text, 'utf8').equals(buffer)) return { buffer, text: null, reason: 'nonUtf8' };
  return { buffer, text };
}

export function createPlan(root, options = {}) {
  const op = {
    find: options.find, replace: options.replace, regex: Boolean(options.regex),
    flags: options.flags ?? '', ignoreCase: Boolean(options.ignoreCase), word: Boolean(options.word),
  };
  const matcher = buildMatcher(op);
  const { source, files, skipped } = listFiles(root, options);
  const rootAbs = resolve(root);
  const entries = [];
  let matches = 0;
  for (const file of files) {
    const { buffer, text, reason } = readText(absolute(rootAbs, file.path));
    if (text === null) {
      skipped[reason] = (skipped[reason] ?? 0) + 1;
      continue;
    }
    const count = [...text.matchAll(matcher.regex)].length;
    if (count === 0) continue;
    entries.push({ path: file.path, size: file.size, sha256: sha256(buffer), matches: count });
    matches += count;
  }
  if (!entries.length) return { status: 'ok', command: 'plan', plan: null, files: 0, matches: 0, skipped };
  const [maxFiles, maxBytes] = batchLimits(options);
  groupBatches(entries, maxFiles, maxBytes).forEach((batch, index) => batch.forEach((entry) => { entry.batch = index + 1; }));
  const batches = entries[entries.length - 1].batch;
  const id = `p-${sha256(JSON.stringify([op, entries.map((e) => [e.path, e.sha256])])).slice(0, 10)}`;
  writeJson(join(stateDir(root), 'plans', id, 'plan.json'), { version: 1, id, source, op, batches, files: entries });
  return {
    status: 'ok', command: 'plan', plan: id, source, files: entries.length, matches, batches, skipped,
    sample: entries.slice(0, intOption(options.sample, DEFAULT_SAMPLE, 'sample')).map((e) => `${e.path}:${e.matches}`),
  };
}

function planDir(root, id) {
  if (!/^p-[0-9a-f]{10}$/.test(id ?? '')) throw new CliError('bad_argument', '--plan must be a plan id');
  return join(stateDir(root), 'plans', id);
}

function loadPlan(root, id) {
  const dir = planDir(root, id);
  const plan = readJson(join(dir, 'plan.json'), 'plan_missing');
  const resultPath = join(dir, 'result.json');
  const result = existsSync(resultPath) ? readJson(resultPath, 'result_unreadable') : { applied: {} };
  return { dir, plan, result, resultPath };
}

export function applyPlan(root, options = {}) {
  const { dir, plan, result, resultPath } = loadPlan(root, options.plan);
  const batch = options.batch === undefined ? null : intOption(options.batch, null, 'batch', 1);
  if (batch !== null && batch > plan.batches) throw new CliError('bad_argument', `--batch must be 1..${plan.batches}`);
  const rootAbs = resolve(root);
  const targets = plan.files.filter((file) => (batch === null || file.batch === batch) && !(file.path in result.applied));
  const stale = targets.filter((file) => {
    try {
      return sha256(readFileSync(absolute(rootAbs, file.path))) !== file.sha256;
    } catch {
      return true;
    }
  });
  if (stale.length) {
    return {
      status: 'stale', command: 'apply', plan: plan.id, stale: stale.length, written: 0,
      sample: stale.slice(0, DEFAULT_SAMPLE).map((file) => file.path),
    };
  }
  const remainingAfter = () => plan.files.filter((file) => !(file.path in result.applied)).length;
  if (options.dryRun) {
    return { status: 'ok', command: 'apply', plan: plan.id, dryRun: true, wouldChange: targets.length, remaining: remainingAfter() };
  }
  const matcher = buildMatcher(plan.op);
  let changed = 0;
  let unchanged = 0;
  const failed = [];
  try {
    for (const file of targets) {
      const path = absolute(rootAbs, file.path);
      const tmp = `${path}.aikido-tmp`;
      try {
        const { buffer, text } = readText(path);
        const next = text.replace(matcher.regex, matcher.replace);
        if (next === text) {
          unchanged += 1;
          result.applied[file.path] = file.sha256;
          continue;
        }
        const backup = join(dir, 'backup', ...file.path.split('/'));
        mkdirSync(dirname(backup), { recursive: true });
        writeFileSync(backup, buffer);
        writeFileSync(tmp, next, { mode: statSync(path).mode & 0o777 });
        renameSync(tmp, path);
        result.applied[file.path] = sha256(Buffer.from(next, 'utf8'));
        changed += 1;
      } catch (error) {
        rmSync(tmp, { force: true });
        failed.push({ path: file.path, code: error.code ?? 'write_failed' });
        break;
      }
    }
  } finally {
    writeJson(resultPath, result);
  }
  return {
    status: failed.length ? 'partial' : 'ok', command: 'apply', plan: plan.id, batch, changed, unchanged,
    failed: failed.slice(0, DEFAULT_SAMPLE), remaining: remainingAfter(),
  };
}

export function rollbackPlan(root, options = {}) {
  const { dir, plan, result, resultPath } = loadPlan(root, options.plan);
  const rootAbs = resolve(root);
  let restored = 0;
  const conflicts = [];
  for (const file of plan.files) {
    if (!(file.path in result.applied)) continue;
    const backup = join(dir, 'backup', ...file.path.split('/'));
    const path = absolute(rootAbs, file.path);
    if (!existsSync(backup)) {
      delete result.applied[file.path];
      continue;
    }
    if (!options.force && sha256(readFileSync(path)) !== result.applied[file.path]) {
      conflicts.push(file.path);
      continue;
    }
    const tmp = `${path}.aikido-tmp`;
    writeFileSync(tmp, readFileSync(backup), { mode: statSync(path).mode & 0o777 });
    renameSync(tmp, path);
    delete result.applied[file.path];
    restored += 1;
  }
  writeJson(resultPath, result);
  return {
    status: conflicts.length ? 'partial' : 'ok', command: 'rollback', plan: plan.id, restored,
    conflicts: conflicts.length, sample: conflicts.slice(0, DEFAULT_SAMPLE),
  };
}

export function reportPlan(root, options = {}) {
  const { plan, result } = loadPlan(root, options.plan);
  const applied = plan.files.filter((file) => file.path in result.applied).length;
  return {
    status: 'ok', command: 'report', plan: plan.id, files: plan.files.length, batches: plan.batches,
    applied, remaining: plan.files.length - applied,
  };
}

export function newScript(root, options = {}) {
  if (!/^[a-z0-9][a-z0-9-]*$/.test(options.name ?? '')) throw new CliError('bad_argument', '--name must be lowercase letters, digits and dashes');
  const path = join(stateDir(root), 'scripts', `${options.name}.mjs`);
  if (existsSync(path)) throw new CliError('exists', `Script already exists: ${path}`);
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, readFileSync(new URL('./temp-script.template.txt', import.meta.url), 'utf8'), { mode: 0o755 });
  return { status: 'ok', command: 'script-new', path };
}

const COMMANDS = {
  scan, batches: createBatches, batch: showBatch, plan: createPlan, apply: applyPlan,
  rollback: rollbackPlan, report: reportPlan, 'script-new': newScript,
};

export function run(argv) {
  const { command, options } = parseArgs(argv);
  const handler = COMMANDS[command];
  if (!handler) throw new CliError('unknown_command', `Commands: ${Object.keys(COMMANDS).join(', ')}`);
  return handler(options.root ?? process.cwd(), options);
}

function main() {
  try {
    const result = run(process.argv.slice(2));
    process.stdout.write(`${JSON.stringify(result)}\n`);
    process.exitCode = result.status === 'ok' ? 0 : 1;
  } catch (error) {
    const code = error instanceof CliError ? error.code : 'internal_error';
    process.stderr.write(`${error.message}\n`);
    process.stdout.write(`${JSON.stringify({ status: 'error', code, message: error.message })}\n`);
    process.exitCode = 1;
  }
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) main();
