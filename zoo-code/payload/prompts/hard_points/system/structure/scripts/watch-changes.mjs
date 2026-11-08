#!/usr/bin/env node
import { spawn } from 'node:child_process';
import { watch } from 'node:fs';
import {
  closeSync, constants, lstatSync, mkdirSync, openSync, readFileSync, readdirSync,
  realpathSync, unlinkSync, writeFileSync,
} from 'node:fs';
import { dirname, isAbsolute, join, relative, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import { TextDecoder } from 'node:util';
import { createGitIgnoreContext, isPrivateTaskStorePath } from './git-ignore.mjs';
import {
  assertPublicProjectRoot, isPrivateTaskStorePathWithin, isPrivateTaskStoreRoot,
} from './lib/private-task-store.mjs';
import { createDaemonController } from './watch-daemon.mjs';

const scriptPath = fileURLToPath(import.meta.url);
const scriptDirectory = dirname(scriptPath);
const excludedNames = new Set([
  'node_modules', '.git', '.DS_Store', 'dist', 'build', '.cache', 'coverage',
  '.nyc_output', 'temp',
]);
const generatedIndex = 'prompts/hard_points/system/structure/index.json';
const generatedIndices = 'prompts/hard_points/system/structure/indices';
const cacheRelative = 'prompts/spec/system/structure/cache';

function requireNode24() {
  const major = Number(process.versions.node.split('.')[0]);
  if (!Number.isInteger(major) || major < 24) {
    throw new Error(`Node.js 24 or newer is required (found ${process.versions.node})`);
  }
}

function projectRoot() {
  const configured = process.env.PROJECT_ROOT || resolve(scriptDirectory, '../../../../..');
  const root = realpathSync(resolve(configured));
  if (!lstatSync(root).isDirectory()) throw new Error(`PROJECT_ROOT is not a directory: ${root}`);
  return root;
}

function ensureCache(root) {
  let directory = root;
  for (const part of cacheRelative.split('/')) {
    directory = join(directory, part);
    try { mkdirSync(directory, { mode: 0o700 }); } catch (error) {
      if (error.code !== 'EEXIST') throw error;
    }
    const info = lstatSync(directory);
    if (!info.isDirectory() || info.isSymbolicLink()) throw new Error(`Unsafe watcher cache path: ${directory}`);
  }
  return directory;
}

function filePath(root, name, create = true) {
  const directory = create ? ensureCache(root) : join(root, ...cacheRelative.split('/'));
  return join(directory, name);
}

function assertSafeFile(path) {
  try {
    const info = lstatSync(path);
    if (!info.isFile() || info.isSymbolicLink()) throw new Error(`Unsafe watcher state file: ${path}`);
  } catch (error) {
    if (error.code !== 'ENOENT') throw error;
  }
}

function appendLog(path, line) {
  assertSafeFile(path);
  const fd = openSync(path, constants.O_WRONLY | constants.O_APPEND | constants.O_CREAT | (constants.O_NOFOLLOW || 0), 0o600);
  try { writeFileSync(fd, `${line}\n`, 'utf8'); } finally { closeSync(fd); }
}

function globMatch(pattern, value) {
  let source = '';
  for (let index = 0; index < pattern.length; index++) {
    const character = pattern[index];
    if (character === '*') source += '.*';
    else if (character === '?') source += '.';
    else source += character.replace(/[|\\{}()[\]^$+?.]/g, '\\$&');
  }
  return new RegExp(`^${source}$`).test(value);
}

export function shouldIgnore(path, excludes = []) {
  const normalized = path.replaceAll('\\', '/').replace(/^\/+/, '');
  if (isPrivateTaskStorePath(normalized)) return true;
  const segments = normalized.split('/');
  if (segments.some(segment => excludedNames.has(segment) || segment.startsWith('.env') ||
      /\.(tmp|log|swp|swo)$/.test(segment) || segment.endsWith('~'))) return true;
  if (normalized === generatedIndex || normalized === generatedIndices ||
      normalized.startsWith(`${generatedIndices}/`) || normalized === cacheRelative ||
      normalized.startsWith(`${cacheRelative}/`)) return true;
  return excludes.some(pattern => {
    const normalizedPattern = pattern.replaceAll('\\', '/');
    return normalizedPattern.includes('/')
      ? globMatch(normalizedPattern, normalized)
      : segments.some(segment => globMatch(normalizedPattern, segment));
  });
}

export function isGitIgnored(gitIgnore, path) {
  const key = path.replace(/\/+$/, '');
  return gitIgnore.ignored([key]).has(key);
}

export function classifyFile(path) {
  const normalized = path.replaceAll('\\', '/').replace(/^\/+/, '');
  if (/^prompts\/gen\/concepts\//.test(normalized)) return 'memory_bank_concepts';
  if (/^prompts\/gen\/techniques\//.test(normalized)) return 'memory_bank_techniques';
  if (/^prompts\/gen\/use_cases\//.test(normalized)) return 'memory_bank_use_cases';
  if (/^prompts\/gen\/personas\//.test(normalized)) return 'memory_bank_personas';
  if (/^prompts\/hard_points\//.test(normalized)) return 'hard_points';
  if (normalized === 'prompts/index.md') return 'main_index';
  if (normalized === 'AGENTS.md') return 'agents_config';
  if (/^\.roo\//.test(normalized)) return 'roo_config';
  if (/^\.claude\//.test(normalized)) return 'claude_config';
  if (/\.md$/.test(normalized)) return 'documentation';
  if (/\.json$/.test(normalized)) return 'configuration';
  if (/\.sh$/.test(normalized)) return 'scripts';
  return 'other';
}

function logFactory(root, daemon, verbose) {
  const path = filePath(root, 'watch.log');
  return (level, message) => {
    const now = new Date();
    const stamp = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}:${String(now.getSeconds()).padStart(2, '0')}`;
    const line = `[${stamp}] [${level}] ${message}`;
    if (daemon) appendLog(path, line);
    if (verbose || level !== 'DEBUG') process.stderr.write(`${line}\n`);
  };
}

function fileCategoryPath(root, absolute) {
  const value = relative(root, absolute);
  if (!value || value === '..' || value.startsWith(`..${sep}`) || isAbsolute(value)) return null;
  return value.split(sep).join('/');
}

export function watchProject(root, options, log, dependencies = {}) {
  root = assertPublicProjectRoot(root);
  const pending = new Map();
  let timer;
  let generator;
  let queuedRegeneration;
  let stopped = false;
  let draining = false;
  const watchers = new Map();
  const gitIgnore = createGitIgnoreContext(root);
  const decoder = new TextDecoder('utf-8', { fatal: true });
  const watchDirectory = dependencies.watchDirectory ?? watch;
  const inspectPath = dependencies.inspectPath ?? lstatSync;
  const enumerateDirectory = dependencies.enumerateDirectory ?? readdirSync;
  const startGenerator = dependencies.startGenerator ?? ((engine, projectRoot) =>
    spawn(process.execPath, [engine], {
      cwd: projectRoot,
      env: { ...process.env, PROJECT_ROOT: projectRoot },
      stdio: ['ignore', 'pipe', 'pipe'],
    }));
  let idleResolver;

  const regenerate = reason => {
    if (stopped && !draining) return;
    if (generator) {
      queuedRegeneration = reason;
      log('INFO', 'Index regeneration already running; changes are coalesced');
      return;
    }
    const engine = join(scriptDirectory, 'generate-all-indexes-v3.1.mjs');
    log('INFO', `Triggering index regeneration: ${reason}`);
    generator = startGenerator(engine, root);
    generator.stdout?.setEncoding('utf8').on('data', chunk => log('DEBUG', `[regenerate] ${chunk.trimEnd()}`));
    generator.stderr?.setEncoding('utf8').on('data', chunk => log('DEBUG', `[regenerate] ${chunk.trimEnd()}`));
    generator.once('error', error => log('ERROR', `Index regeneration failed: ${error.message}`));
    generator.once('close', (code, signal) => {
      log(code === 0 ? 'INFO' : 'ERROR', code === 0
        ? 'Index regeneration completed successfully'
        : `Index regeneration failed (${code ?? signal})`);
      generator = undefined;
      if (queuedRegeneration && (!stopped || draining)) {
        const nextReason = queuedRegeneration;
        queuedRegeneration = undefined;
        regenerate(nextReason);
      } else {
        idleResolver?.();
        idleResolver = undefined;
      }
    });
  };

  const waitForIdle = () => {
    if (!generator && !queuedRegeneration) return Promise.resolve();
    return new Promise(resolveIdle => { idleResolver = resolveIdle; });
  };

  const scheduleBatch = () => {
    clearTimeout(timer);
    timer = setTimeout(flush, options.batchTimeout * 1000);
  };

  const flush = () => {
    timer = undefined;
    if (!pending.size) return;
    const changes = [...pending.values()];
    pending.clear();
    log('INFO', `Processing batch of ${changes.length} changes`);
    const categories = [...new Set(changes.map(item => item.category))].sort();
    regenerate(`Project changes (${changes.length} files; ${categories.join(', ') || 'unknown'})`);
  };

  const addChange = (event, path, category = classifyFile(path)) => {
    pending.set(path || '<unknown>', { event, path: path || '<unknown>', category });
    scheduleBatch();
  };

  const closeWatchersBelow = path => {
    for (const [directory, watcher] of watchers) {
      if (directory === path || directory.startsWith(`${path}/`)) {
        watcher.close();
        watchers.delete(directory);
      }
    }
  };

  const attachDirectory = (directory, target = watchers) => {
    if (stopped || target.has(directory)) return;
    const absolute = directory ? join(root, ...directory.split('/')) : root;
    const info = inspectPath(absolute);
    if (!info.isDirectory() || info.isSymbolicLink() || isPrivateTaskStoreRoot(absolute)) return;
    const watcher = watchDirectory(absolute, { encoding: 'buffer' },
      (eventType, filename) => handle(directory, eventType, filename));
    target.set(directory, watcher);

    const entries = enumerateDirectory(absolute, { withFileTypes: true, encoding: 'buffer' });
    const candidates = [];
    for (const entry of entries) {
      let name;
      try {
        name = decoder.decode(entry.name);
      } catch {
        log('ERROR', `Cannot represent a filesystem entry in ${directory || '.'} as UTF-8`);
        addChange('UNKNOWN', directory, 'other');
        continue;
      }
      const path = directory ? `${directory}/${name}` : name;
      if (shouldIgnore(path, options.excludes) || entry.isSymbolicLink()) continue;
      if (entry.isDirectory()) candidates.push({ path, directory: true });
    }
    const ignored = gitIgnore.ignored(candidates.map(item => item.path));
    for (const candidate of candidates) {
      if (!ignored.has(candidate.path)) attachDirectory(candidate.path, target);
    }
  };

  const refreshWatchers = () => {
    const refreshed = new Map();
    try {
      attachDirectory('', refreshed);
    } catch (error) {
      for (const watcher of refreshed.values()) watcher.close();
      throw error;
    }
    const previous = [...watchers.values()];
    watchers.clear();
    for (const [directory, watcher] of refreshed) watchers.set(directory, watcher);
    for (const watcher of previous) watcher.close();
  };

  const handle = (parent, eventType, filename) => {
    if (filename === null || filename === undefined) {
      log('WARN', `Filesystem ${eventType} event in ${parent || '.'} has no filename; scheduling a full rebuild`);
      addChange('UNKNOWN', parent, 'other');
      return;
    }
    let name;
    try {
      name = Buffer.isBuffer(filename) ? decoder.decode(filename) : String(filename);
    } catch (error) {
      log('ERROR', `Cannot decode watcher filename in ${parent || '.'}: ${error.message}`);
      addChange('UNKNOWN', parent, 'other');
      return;
    }
    const path = parent ? `${parent}/${name}` : name;
    if (shouldIgnore(path, options.excludes) || isPrivateTaskStorePathWithin(root, path)) return;
    const absolute = join(root, ...path.split('/'));
    let event = eventType === 'change' ? 'MODIFY' : 'CREATE';
    let directory = watchers.has(path);
    try {
      const info = inspectPath(absolute);
      if (info.isSymbolicLink()) {
        closeWatchersBelow(path);
        return;
      }
      directory = info.isDirectory();
      if (info.isFile() || directory) event = eventType === 'change' ? 'MODIFY' : 'CREATE';
    } catch (error) {
      if (error.code === 'ENOENT') {
        event = 'DELETE';
      } else {
        log('ERROR', `Cannot inspect changed path ${path}: ${error.message}; scheduling a conservative rebuild`);
        addChange('UNKNOWN', path, classifyFile(path));
        return;
      }
    }

    try {
      if (path !== '.gitignore' && !path.endsWith('/.gitignore') &&
          isGitIgnored(gitIgnore, path)) {
        if (directory) closeWatchersBelow(path);
        return;
      }
    } catch (error) {
      log('ERROR', `Cannot evaluate .gitignore for ${path}: ${error.message}; scheduling a conservative rebuild`);
      addChange('UNKNOWN', path, classifyFile(path));
      return;
    }

    if (directory && event !== 'DELETE') {
      try {
        attachDirectory(path);
      } catch (error) {
        log('ERROR', `Cannot watch changed directory ${path}: ${error.message}; scheduling a conservative rebuild`);
        closeWatchersBelow(path);
        addChange('UNKNOWN', path, classifyFile(path));
        return;
      }
    }
    if (directory && event === 'DELETE') closeWatchersBelow(path);
    if (path === '.gitignore' || path.endsWith('/.gitignore')) {
      try {
        refreshWatchers();
      } catch (error) {
        log('ERROR', `Cannot refresh watchers after ${path}: ${error.message}; scheduling a conservative rebuild`);
        addChange('UNKNOWN', path, classifyFile(path));
        return;
      }
    }
    addChange(event, path);
  };

  try {
    attachDirectory('');
  } catch (error) {
    for (const watcher of watchers.values()) watcher.close();
    gitIgnore.close();
    throw error;
  }

  log('INFO', `Watching project: ${root}`);
  log('INFO', `Batch timeout: ${options.batchTimeout}s`);
  log('INFO', `Watching ${watchers.size} visible directories; Git evaluates project .gitignore rules`);
  return {
    async stop() {
      if (stopped) return;
      clearTimeout(timer);
      if (pending.size) flush();
      stopped = true;
      draining = true;
      for (const watcher of watchers.values()) watcher.close();
      watchers.clear();
      await waitForIdle();
      draining = false;
      gitIgnore.close();
    },
  };
}

const { readState, readStartLock, daemonRequest, controlResponseMatches, startDaemon, runDaemon } =
  createDaemonController({ filePath, assertSafeFile, logFactory, watchProject, scriptPath });

function parseArgs(args) {
  let command = 'watch';
  let commandSeen = false;
  let daemonFlag = false;
  const defaultTimeout = process.env.BATCH_TIMEOUT === undefined ? 5 : Number(process.env.BATCH_TIMEOUT);
  if (!Number.isFinite(defaultTimeout) || defaultTimeout < 0 || defaultTimeout > 3600) {
    throw new Error('BATCH_TIMEOUT must be a number from 0 to 3600');
  }
  const options = { batchTimeout: defaultTimeout, notify: true, verbose: false, excludes: [], daemonChild: false, args: [] };
  for (const arg of args) {
    if (arg === '--help' || arg === '-h') return { help: true };
    if (['watch', 'start', 'stop', 'status', 'test'].includes(arg)) {
      command = arg;
      commandSeen = true;
    } else if (arg === '--daemon') daemonFlag = true;
    else if (arg === '--daemon-child') options.daemonChild = true;
    else if (arg === '--verbose' || arg === '-v') options.verbose = true;
    else if (arg === '--no-notify') options.notify = false;
    else if (arg.startsWith('--notify=')) options.notify = !['', 'false', '0', 'none'].includes(arg.slice('--notify='.length));
    else if (arg.startsWith('--exclude=')) {
      const pattern = arg.slice('--exclude='.length);
      if (!pattern) throw new Error('--exclude requires a non-empty pattern');
      options.excludes.push(pattern);
    } else if (arg.startsWith('--batch-timeout=')) {
      const timeout = Number(arg.slice('--batch-timeout='.length));
      if (!Number.isFinite(timeout) || timeout < 0 || timeout > 3600) {
        throw new Error('--batch-timeout must be a number from 0 to 3600');
      }
      options.batchTimeout = timeout;
    } else {
      throw new Error(`Unknown option: ${arg}`);
    }
  }
  if (daemonFlag && (!commandSeen || command === 'watch')) command = 'start';
  options.args = args.filter(arg => ['--verbose', '-v', '--no-notify'].includes(arg) ||
    arg.startsWith('--notify=') || arg.startsWith('--exclude=') || arg.startsWith('--batch-timeout='));
  return { command, options };
}

async function main(args) {
  try {
    requireNode24();
    const parsed = parseArgs(args);
    if (parsed.help) {
      process.stdout.write('Usage: watch-changes.mjs [watch|start|stop|status] [--verbose] [--no-notify] [--batch-timeout=N] [--exclude=PATTERN]\n');
      return;
    }
    const root = projectRoot();
    const { command, options } = parsed;
    if (options.daemonChild) return await runDaemon(root, options);
    if (command === 'start') return await startDaemon(root, options);
    if (command === 'stop' || command === 'status') {
      const { state } = readState(root);
      if (!state) {
        if (readStartLock(root).lock) {
          throw new Error('Watcher identity cannot be verified from its start lock; state is missing and no process was signalled');
        }
        process.stdout.write('Watch daemon not running\n');
        return;
      }
      const { lock } = readStartLock(root);
      if (lock?.token !== state.token || lock.root !== root) {
        throw new Error('Watcher identity cannot be verified; state and start lock do not match');
      }
      const status = await daemonRequest(state, 'status');
      if (!controlResponseMatches(status, state, 'running')) {
        throw new Error('Watcher identity cannot be verified; state is preserved and no process was signalled');
      }
      if (command === 'status') {
        process.stdout.write(`Watch daemon running (PID: ${state.pid})\n`);
      } else {
        const result = await daemonRequest(state, 'stop');
        if (!controlResponseMatches(result, state, 'stopping')) {
          throw new Error('Watcher identity could not be verified for stop; no process was signalled');
        }
        process.stdout.write(`Watch daemon stopping (PID: ${state.pid})\n`);
      }
      return;
    }
    if (command === 'test') throw new Error('The legacy test command is deprecated; use isolated Node tests');
    const watcher = watchProject(root, options, logFactory(root, false, options.verbose));
    await new Promise(resolveStop => {
      const stop = async () => {
        process.off('SIGINT', stop);
        process.off('SIGTERM', stop);
        await watcher.stop();
        resolveStop();
      };
      process.on('SIGINT', stop);
      process.on('SIGTERM', stop);
    });
  } catch (error) {
    process.stderr.write(`Error: ${error.message}\n`);
    process.exitCode = 1;
  }
}

if (process.argv[1] && resolve(process.argv[1]) === scriptPath) {
  main(process.argv.slice(2));
}
