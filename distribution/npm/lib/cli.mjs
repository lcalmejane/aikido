// `aikido` command line. It owns no installation logic: it picks a host package, then runs the audited
// package scripts (bootstrap-plan, update-plan, sync-hosts) without a shell, and retains the package
// runtime under .aikido/state/cli-runtime/ so that /skill-manage, /create-* and /maj-aikido can later
// reach every installed CLI through prompts/hard_points/system/host-sync/host-sync.mjs.
//
// Package source (--from): the bundled packages (default), a downloaded `dist` branch or release, a
// single extracted host package, an extracted npm package, or a local AI-KIDO source repository, which
// is built into .aikido/state/source-build/ (deterministic path, so a reviewed plan id stays valid).
import { spawnSync } from 'node:child_process';
import {
  cpSync, existsSync, lstatSync, mkdirSync, readFileSync, readdirSync, rmSync,
} from 'node:fs';
import { basename, dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const DEFAULT_PACKAGES = resolve(HERE, '..', 'packages');
const RUNTIME_PARENT = ['.aikido', 'state', 'cli-runtime'];
const BUILD_PARENT = ['.aikido', 'state'];
const BUILD_DIR = 'source-build';
const COMMANDS = ['init', 'update', 'sync', 'check', 'detect', 'uninstall', 'help'];
const FLAGS = new Set(['--yes', '--dry-run', '--help', '--version', '--force']);
const VALUES = new Set(['--root', '--host', '--hosts', '--mode', '--name', '--from', '--packages']);
const USAGE = 'aikido <init|update|sync|check|detect|uninstall> [--root DIR] [--from PATH] [--host ID] '
  + '[--hosts a,b] [--mode STANDARD|LIGHT|UNSET] [--name NAME] [--yes] [--dry-run] [--force (update only)]';

function fail(code, message) {
  const error = new Error(message);
  error.code = code;
  throw error;
}

function isDirectory(path) {
  try {
    const info = lstatSync(path);
    return info.isDirectory() && !info.isSymbolicLink();
  } catch {
    return false;
  }
}

export function parseArgs(argv) {
  let [command, ...rest] = argv;
  if (!command || command === '--help') command = 'help';
  else if (command === '--version') command = 'version';
  else if (!COMMANDS.includes(command)) fail('usage', `Unknown command "${command}". ${USAGE}`);
  const options = {};
  for (let i = 0; i < rest.length; i += 1) {
    const key = rest[i];
    if (!FLAGS.has(key) && !VALUES.has(key)) fail('usage', `Unknown option: ${key}`);
    if (Object.hasOwn(options, key)) fail('usage', `Duplicate option: ${key}`);
    if (FLAGS.has(key)) { options[key] = true; continue; }
    if (!rest[i + 1] || rest[i + 1].startsWith('--')) fail('usage', `${key} requires a value`);
    options[key] = rest[i + 1];
    i += 1;
  }
  if (options['--from'] && options['--packages']) fail('usage', '--from and --packages are the same option; pass only one');
  return { command, options };
}

function readManifest(directory) {
  try {
    return JSON.parse(readFileSync(join(directory, 'package-manifest.json'), 'utf8'));
  } catch {
    return null;
  }
}

/** Map of host id -> package directory for every host package found directly under `base`. */
export function hostMap(base) {
  const map = new Map();
  if (!isDirectory(base)) return map;
  for (const name of readdirSync(base).sort()) {
    const directory = join(base, name);
    if (!isDirectory(directory)) continue;
    const manifest = readManifest(directory);
    if (manifest && typeof manifest.host === 'string') map.set(manifest.host, directory);
  }
  return map;
}

export function bundledHosts(base) {
  return [...hostMap(base).keys()].sort();
}

function sourceVersion(sourceRoot) {
  try {
    return JSON.parse(readFileSync(join(sourceRoot, 'distribution', 'npm', 'package.json'), 'utf8')).version;
  } catch {
    return undefined;
  }
}

function buildFromSource(sourceRoot, projectRoot) {
  let current = projectRoot;
  for (const part of BUILD_PARENT) {
    current = join(current, part);
    if (existsSync(current)) {
      if (!isDirectory(current)) fail('unsafe-path', `Unsafe state directory: ${current}`);
    } else mkdirSync(current);
  }
  const out = join(current, BUILD_DIR);
  rmSync(out, { recursive: true, force: true });
  const args = [join(sourceRoot, 'distribution', 'scripts', 'build.mjs'), '--out', out];
  const version = sourceVersion(sourceRoot);
  if (version) args.push('--version', version);
  // Pin the revision only for a clean checkout; local edits are honestly reported as "uncommitted".
  const head = spawnSync('git', ['rev-parse', 'HEAD'], { cwd: sourceRoot, encoding: 'utf8', shell: false });
  const dirty = spawnSync('git', ['status', '--porcelain'], { cwd: sourceRoot, encoding: 'utf8', shell: false });
  if (head.status === 0 && dirty.status === 0 && dirty.stdout.trim() === '' && /^[0-9a-f]{40}$/.test(head.stdout.trim())) {
    args.push('--revision', head.stdout.trim());
  }
  const build = spawnSync(process.execPath, args, {
    cwd: sourceRoot, encoding: 'utf8', shell: false, windowsHide: true, timeout: 600_000, maxBuffer: 128 * 1024 * 1024,
  });
  if (build.error || build.status !== 0) {
    rmSync(out, { recursive: true, force: true });
    fail('build-failed', `Cannot build the source repository (a Git checkout is required): ${(build.stderr || build.error?.message || '').trim()}`.slice(0, 2000));
  }
  return out;
}

/**
 * Resolve the package source. Returns { hosts, kind, cleanup }. `--from` accepts, in this order:
 * a single host package, a directory of host packages, an extracted npm package, a source repository.
 */
export function resolveSource({ from, cwd, projectRoot }) {
  if (!from) {
    return { hosts: hostMap(DEFAULT_PACKAGES), kind: 'bundled', location: DEFAULT_PACKAGES, cleanup() {} };
  }
  const location = resolve(cwd, from);
  if (!isDirectory(location)) fail('bad-source', `--from is not a directory: ${location}`);
  const single = readManifest(location);
  if (single && typeof single.host === 'string') {
    return { hosts: new Map([[single.host, location]]), kind: 'package', location, cleanup() {} };
  }
  for (const [kind, base] of [['directory', location], ['npm-package', join(location, 'packages')]]) {
    const hosts = hostMap(base);
    if (hosts.size) return { hosts, kind, location, cleanup() {} };
  }
  if (existsSync(join(location, 'distribution', 'scripts', 'build.mjs')) && isDirectory(join(location, 'prompts', 'hard_points'))) {
    const out = buildFromSource(location, projectRoot);
    return {
      hosts: hostMap(out), kind: 'source', location, built: out, cleanup() { rmSync(out, { recursive: true, force: true }); },
    };
  }
  return fail('bad-source', `No AI-KIDO host package or source repository found in ${location}`);
}

function packageFor(source, host) {
  const directory = source.hosts.get(host);
  if (!directory) {
    fail('unknown-host', `No package for "${host}" in ${source.location}. Available: ${[...source.hosts.keys()].join(', ') || 'none'}`);
  }
  return directory;
}

function runScript(script, args, env) {
  const child = spawnSync(process.execPath, [script, ...args], {
    env, encoding: 'utf8', shell: false, windowsHide: true, timeout: 300_000, maxBuffer: 128 * 1024 * 1024,
  });
  if (child.error) fail('script-failed', child.error.message);
  let json = null;
  try { json = JSON.parse(child.stdout); } catch { /* reported below */ }
  return { exitCode: child.status, json, stderr: (child.stderr ?? '').trim() };
}

function requireJson(execution, label) {
  if (!execution.json) fail('script-failed', `${label}: ${execution.stderr || 'no JSON output'}`.slice(0, 2000));
  return execution.json;
}

function detect(root, source, env) {
  const [any] = source.hosts.values();
  if (!any) fail('no-packages', `No host package found in ${source.location}.`);
  const execution = runScript(join(any, 'scripts', 'sync-hosts.mjs'), ['--detect', '--root', root], env);
  return requireJson(execution, 'detect');
}

function lockHost(root) {
  try {
    const lock = JSON.parse(readFileSync(join(root, '.aikido', 'lock.json'), 'utf8'));
    return Array.isArray(lock.hosts) ? lock.hosts[0] : undefined;
  } catch {
    return undefined;
  }
}

function pickHost({ options, root, source, env, useLock }) {
  if (options['--host']) return options['--host'];
  const locked = useLock ? lockHost(root) : undefined;
  if (locked) return locked;
  const detected = (detect(root, source, env).hosts ?? []).map(({ host }) => host);
  const found = detected.find((host) => source.hosts.has(host));
  if (!found) {
    fail('no-host', `No supported assistant CLI detected on this machine. Pass --host <id>. Available: ${[...source.hosts.keys()].join(', ')}`);
  }
  return found;
}

export function locateRetained(root) {
  const parent = join(root, ...RUNTIME_PARENT);
  if (!isDirectory(parent)) return null;
  for (const name of readdirSync(parent).sort()) {
    const directory = join(parent, name);
    if (isDirectory(directory) && existsSync(join(directory, 'scripts', 'sync-hosts.mjs'))) return directory;
  }
  return null;
}

/** Keep exactly one package runtime for the project, replacing any previous one. */
export function retainRuntime(root, packageDir) {
  let current = root;
  for (const part of RUNTIME_PARENT) {
    current = join(current, part);
    if (existsSync(current)) {
      const info = lstatSync(current);
      if (info.isSymbolicLink() || !info.isDirectory()) fail('unsafe-path', `Unsafe runtime directory: ${current}`);
    } else mkdirSync(current);
  }
  for (const name of readdirSync(current)) rmSync(join(current, name), { recursive: true, force: true });
  const target = join(current, basename(packageDir));
  cpSync(packageDir, target, { recursive: true });
  return target;
}

function brief(plan) {
  const out = {};
  for (const key of ['operation', 'planId', 'mode', 'hosts', 'currentVersion', 'nextVersion', 'versionChange', 'trust',
    'warnings', 'force', 'ready', 'changesRequired', 'confirmationRequired', 'alreadyInstalled', 'summary', 'lockFile']) {
    if (key in plan) out[key] = plan[key];
  }
  if (Array.isArray(plan.forcedFiles)) {
    out.forcedCount = plan.forcedFiles.length;
    out.forcedFiles = plan.forcedFiles;
  }
  const conflicts = plan.conflicts ?? [];
  out.conflictCount = conflicts.length;
  out.conflicts = conflicts.slice(0, 20).map((c) => ({ path: c.target ?? c.path ?? c.file, reason: c.reason ?? c.action }));
  return out;
}

// A package given with --from is the user's own: it is analysed and announced, never rejected for its identity.
function trustArgs(source) {
  return source.kind === 'bundled' ? [] : ['--trust', 'local'];
}

function syncWith(packageDir, root, env, flags = []) {
  return requireJson(runScript(join(packageDir, 'scripts', 'sync-hosts.mjs'), ['--root', root, ...flags], env), 'sync-hosts');
}

// Plan first; apply the exact plan only with --yes. Conflicts are never applied.
function planThenApply({ script, planArgs, applyExtra, yes, env, label }) {
  const plan = requireJson(runScript(script, planArgs, env), `${label} plan`);
  const result = { command: label, plan: brief(plan) };
  if (plan.ready === false) return { ...result, status: 'conflict' };
  if (plan.alreadyInstalled || plan.confirmationRequired === false) return { ...result, status: 'up-to-date' };
  if (!yes) {
    const regression = plan.versionChange?.direction === 'downgrade';
    const forced = plan.forcedFiles?.length
      ? ` FORCED: ${plan.forcedFiles.length} locally modified file(s) will be overwritten or removed; they are saved first in .aikido/backups/ (restore with update-plan.mjs --recover).`
      : '';
    return {
      ...result,
      status: 'plan',
      next: `Review the plan${regression ? ' (this is a version REGRESSION)' : ''}${forced}, then re-run the same command with --yes to apply plan ${plan.planId}.`,
    };
  }
  const applied = requireJson(
    runScript(script, [...planArgs, '--apply', '--confirm', plan.planId, ...applyExtra], env),
    `${label} apply`,
  );
  return { ...result, status: 'applied', applied };
}

function exitCodeFor(status) {
  if (['ok', 'plan', 'applied', 'up-to-date', 'no-hosts', 'runtime-missing'].includes(status)) return 0;
  if (['conflict', 'attention'].includes(status)) return 2;
  return 1;
}

export function run(argv, { env = process.env, cwd = process.cwd() } = {}) {
  let source = null;
  try {
    const { command, options } = parseArgs(argv);
    if (command === 'help') return { exitCode: 0, result: { schemaVersion: 1, status: 'ok', usage: USAGE, commands: COMMANDS } };
    if (command === 'version') {
      const { version } = JSON.parse(readFileSync(resolve(HERE, '..', 'package.json'), 'utf8'));
      return { exitCode: 0, result: { schemaVersion: 1, status: 'ok', version } };
    }
    const root = resolve(cwd, options['--root'] ?? '.');
    if (!isDirectory(root)) fail('usage', `Project root is not a directory: ${root}`);
    const from = options['--from'] ?? options['--packages'];
    const yes = options['--yes'] === true;
    if (options['--force'] && command !== 'update') fail('usage', '--force is only valid with "update"');
    let result;

    // sync/check without --from reuse the runtime retained in the project and need no source at all.
    const retained = (command === 'sync' || command === 'check') && !from ? locateRetained(root) : null;
    if (!retained) source = resolveSource({ from, cwd, projectRoot: root });

    if (command === 'detect') {
      result = { ...detect(root, source, env), status: 'ok' };
    } else if (command === 'init') {
      const host = pickHost({ options, root, source, env, useLock: false });
      const packageDir = packageFor(source, host);
      const mode = (options['--mode'] ?? 'STANDARD').toUpperCase();
      const planArgs = ['--root', root, '--package', packageDir, '--mode', mode, ...trustArgs(source),
        ...(options['--name'] ? ['--name', options['--name']] : [])];
      result = planThenApply({
        script: join(packageDir, 'scripts', 'bootstrap-plan.mjs'), planArgs, applyExtra: ['--sync-hosts'], yes, env, label: 'init',
      });
      result.host = host;
      if (result.status === 'applied') result.runtime = retainRuntime(root, packageDir);
      if (result.status === 'up-to-date') result.next = 'AI-KIDO is already installed here; use "aikido update" or "aikido sync".';
    } else if (command === 'update') {
      const host = pickHost({ options, root, source, env, useLock: true });
      const packageDir = packageFor(source, host);
      result = planThenApply({
        script: join(packageDir, 'scripts', 'update-plan.mjs'),
        planArgs: ['--root', root, '--package', packageDir, ...trustArgs(source), ...(options['--force'] ? ['--force'] : [])],
        applyExtra: ['--sync-hosts'], yes, env, label: 'update',
      });
      result.host = host;
      if (result.status === 'applied') result.runtime = retainRuntime(root, packageDir);
      if (result.status === 'up-to-date' && yes) {
        // Nothing to update, but a CLI may have been installed since the last run.
        result.hostSync = syncWith(packageDir, root, env);
        result.runtime = retainRuntime(root, packageDir);
      }
    } else if (command === 'uninstall') {
      const host = pickHost({ options, root, source, env, useLock: true });
      const packageDir = packageFor(source, host);
      result = planThenApply({
        script: join(packageDir, 'scripts', 'update-plan.mjs'), planArgs: ['--root', root, '--uninstall'],
        applyExtra: [], yes, env, label: 'uninstall',
      });
    } else {
      // sync | check
      const flags = [];
      if (command === 'check') flags.push('--check');
      if (options['--dry-run']) flags.push('--dry-run');
      if (options['--hosts']) flags.push('--hosts', options['--hosts']);
      const packageDir = retained ?? packageFor(source, pickHost({ options, root, source, env, useLock: true }));
      result = syncWith(packageDir, root, env, flags);
      result.command = command;
      if ((!retained || from) && !flags.includes('--check') && !flags.includes('--dry-run') && result.status !== 'error') {
        result.runtime = retainRuntime(root, packageDir);
      }
    }
    if (source && source.kind !== 'bundled') result.source = { kind: source.kind, location: source.location };
    const status = result.status ?? 'error';
    return { exitCode: exitCodeFor(status), result: { schemaVersion: 1, ...result, status } };
  } catch (error) {
    return {
      exitCode: error.code === 'usage' ? 64 : 1,
      result: { schemaVersion: 1, status: 'error', code: error.code ?? 'error', message: error.message },
    };
  } finally {
    source?.cleanup();
  }
}
