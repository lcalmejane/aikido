#!/usr/bin/env node
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { realpathSync } from 'node:fs';
import { detectHosts } from '../lib/host-detect.mjs';
import { syncHosts, toolInventoryEnvironment } from '../lib/sync-hosts.mjs';

const USAGE = 'sync-hosts.mjs [--detect | --check | --dry-run] [--hosts a,b] [--root DIR] [--tools-file JSON] [--detect-features]';

function parse(argv) {
  const options = {};
  const flags = new Set(['--detect', '--check', '--dry-run', '--detect-features', '--help']);
  const values = new Set(['--root', '--hosts', '--tools-file']);
  for (let i = 0; i < argv.length; i += 1) {
    const key = argv[i];
    if (!flags.has(key) && !values.has(key)) throw new Error(`Unknown option: ${key}`);
    if (Object.hasOwn(options, key)) throw new Error(`Duplicate option: ${key}`);
    if (flags.has(key)) { options[key] = true; continue; }
    if (!argv[i + 1] || argv[i + 1].startsWith('--')) throw new Error(`${key} requires a value`);
    options[key] = argv[i + 1];
    i += 1;
  }
  if (options['--detect'] && (options['--check'] || options['--dry-run'] || options['--hosts'])) {
    throw new Error('--detect only reports and cannot be combined with --check, --dry-run or --hosts');
  }
  return options;
}

export function runSyncHosts(argv = process.argv.slice(2), env = process.env) {
  const options = parse(argv);
  if (options['--help']) return { schemaVersion: 1, status: 'ok', usage: USAGE };
  const root = resolve(options['--root'] ?? process.cwd());
  if (options['--detect']) return { status: 'ok', root, ...detectHosts({ root, env }) };
  return syncHosts({
    root,
    hosts: options['--hosts']?.split(',').filter(Boolean),
    env: toolInventoryEnvironment(env, options['--tools-file']),
    repair: options['--check'] !== true,
    dryRun: options['--dry-run'] === true,
    detectFeatures: options['--detect-features'] === true,
  });
}

if (process.argv[1] && realpathSync(resolve(process.argv[1])) === realpathSync(fileURLToPath(import.meta.url))) {
  try {
    const result = runSyncHosts();
    process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
    if (result.status === 'attention') process.exitCode = 2;
  } catch (error) {
    process.stdout.write(`${JSON.stringify({ schemaVersion: 1, status: 'error', error: { code: 'sync-hosts', message: error.message } }, null, 2)}\n`);
    process.exitCode = 2;
  }
}
