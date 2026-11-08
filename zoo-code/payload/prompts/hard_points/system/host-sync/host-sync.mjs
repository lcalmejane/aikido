#!/usr/bin/env node
// Project-side entry point of the host synchronisation. It ships in every installed project so that
// skill-manage, the create-* commands and /maj-aikido can make a new or updated Skill, agent or command
// available to every assistant CLI installed on the machine, without depending on the distribution
// sources. It only locates the retained package runtime and delegates to its audited engine.
import { spawnSync } from 'node:child_process';
import { existsSync, lstatSync, readdirSync, realpathSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { detectHosts } from './host-detect.mjs';

const RUNTIME_PARENT = ['.aikido', 'state', 'cli-runtime'];
const ENGINE = ['scripts', 'sync-hosts.mjs'];

function isDirectory(path) {
  try {
    const info = lstatSync(path);
    return info.isDirectory() && !info.isSymbolicLink();
  } catch {
    return false;
  }
}

/** Locate the engine: the source repository first, then a package retained by the installer. */
export function locateRuntime(root) {
  const source = join(root, 'distribution', ...ENGINE);
  if (existsSync(source) && existsSync(join(root, 'distribution', 'catalog.json'))) {
    return { kind: 'source', engine: source };
  }
  const parent = join(root, ...RUNTIME_PARENT);
  if (!isDirectory(parent)) return null;
  for (const name of readdirSync(parent).sort()) {
    const directory = join(parent, name);
    const engine = join(directory, ...ENGINE);
    if (isDirectory(directory) && existsSync(engine) && existsSync(join(directory, 'catalog.json'))) {
      return { kind: 'package', host: name, engine };
    }
  }
  return null;
}

/**
 * @param {object} options
 * @param {string} options.root project root
 * @param {string[]} [options.hosts] explicit host ids; default = every CLI detected on the machine
 * @param {boolean} [options.check] report only, write nothing
 * @param {boolean} [options.dryRun] plan without writing
 * @param {object} [options.env] environment (tests)
 */
export function syncProject({
  root, hosts, check = false, dryRun = false, env = process.env, runtime,
} = {}) {
  const project = realpathSync(resolve(root ?? process.cwd()));
  const found = runtime ?? locateRuntime(project);
  if (!found) {
    // No retained runtime: still tell the caller what is installed so that it can ask the user to run
    // `npx @aikido-method/cli sync` (or /check-cli once the package is retained).
    return {
      schemaVersion: 1,
      status: 'runtime-missing',
      root: project,
      message: 'No retained AI-KIDO package runtime found under .aikido/state/cli-runtime/. '
        + 'Run "aikido sync" (npm package) or install the distribution package, then retry.',
      ...detectHosts({ root: project, env }),
    };
  }
  const args = [found.engine, '--root', project];
  if (hosts?.length) args.push('--hosts', hosts.join(','));
  if (check) args.push('--check');
  if (dryRun) args.push('--dry-run');
  const child = spawnSync(process.execPath, args, {
    cwd: project, env, encoding: 'utf8', shell: false, windowsHide: true, timeout: 120_000, maxBuffer: 16 * 1024 * 1024,
  });
  let report;
  try { report = JSON.parse(child.stdout); } catch {
    return {
      schemaVersion: 1, status: 'error', root: project, runtime: found.kind,
      message: (child.stderr || child.stdout || `engine exited with ${child.status}`).trim().slice(0, 2000),
    };
  }
  return { ...report, runtime: found.kind };
}

function parse(argv) {
  const options = { hosts: undefined, check: false, dryRun: false, root: undefined, detect: false };
  for (let i = 0; i < argv.length; i += 1) {
    const key = argv[i];
    if (key === '--check') options.check = true;
    else if (key === '--dry-run') options.dryRun = true;
    else if (key === '--detect') options.detect = true;
    else if (key === '--root' || key === '--hosts') {
      if (!argv[i + 1] || argv[i + 1].startsWith('--')) throw new Error(`${key} requires a value`);
      if (key === '--root') options.root = argv[i + 1];
      else options.hosts = argv[i + 1].split(',').filter(Boolean);
      i += 1;
    } else throw new Error('Usage: host-sync.mjs [--detect | --check | --dry-run] [--hosts a,b] [--root DIR]');
  }
  return options;
}

if (process.argv[1] && realpathSync(resolve(process.argv[1])) === realpathSync(fileURLToPath(import.meta.url))) {
  try {
    const options = parse(process.argv.slice(2));
    const root = resolve(options.root ?? process.cwd());
    const result = options.detect
      ? { status: 'ok', root, ...detectHosts({ root }) }
      : syncProject({ root, hosts: options.hosts, check: options.check, dryRun: options.dryRun });
    process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
    if (['attention', 'error'].includes(result.status)) process.exitCode = 2;
  } catch (error) {
    process.stdout.write(`${JSON.stringify({ schemaVersion: 1, status: 'error', message: error.message }, null, 2)}\n`);
    process.exitCode = 2;
  }
}
