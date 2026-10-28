#!/usr/bin/env node
import { basename, resolve } from 'node:path';
import { applyBootstrap, planBootstrap } from '../lib/bootstrap-plan.mjs';

function args(argv) {
  const result = { flags: new Set() };
  const flags = new Set(['--apply']);
  for (let i = 0; i < argv.length; i += 1) {
    const key = argv[i];
    if (!key.startsWith('--')) throw new Error(`Unexpected argument: ${key}`);
    if (flags.has(key)) {
      if (result.flags.has(key)) throw new Error(`Duplicate argument: ${key}`);
      result.flags.add(key);
      continue;
    }
    const value = argv[i + 1];
    if (!value || value.startsWith('--')) throw new Error(`Missing value for ${key}`);
    if (Object.hasOwn(result, key)) throw new Error(`Duplicate argument: ${key}`);
    result[key] = value;
    i += 1;
  }
  return result;
}

try {
  const options = args(process.argv.slice(2));
  const required = ['--mode'];
  if (!options.flags.has('--apply') && !options['--package']) required.push('--version');
  for (const key of required) if (!options[key]) throw new Error(`${key} is required`);
  if (options.flags.has('--apply') && !options['--package']) throw new Error('--package is required with --apply');
  if (options.flags.has('--apply') && !options['--confirm']) throw new Error('--confirm <plan-id> is required with --apply');
  if (!options.flags.has('--apply') && options['--confirm']) throw new Error('--confirm is only valid with --apply');
  const root = resolve(options['--root'] ?? process.cwd());
  const shared = {
    root,
    packageRoot: options['--package'] ? resolve(options['--package']) : undefined,
    mode: options['--mode'],
    hosts: options['--hosts'] ? options['--hosts'].split(',').filter(Boolean) : [],
    projectName: options['--name'] ?? basename(root),
    aikidoVersion: options['--version'],
  };
  if (options.flags.has('--apply')) {
    const result = applyBootstrap({ ...shared, expectedPlanId: options['--confirm'] });
    process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
  } else {
    const plan = planBootstrap(shared);
    process.stdout.write(`${JSON.stringify(plan, null, 2)}\n`);
    if (!plan.ready) process.exitCode = 2;
  }
} catch (error) {
  process.stderr.write(`Bootstrap ${process.argv.includes('--apply') ? 'application' : 'planning'} failed: ${error.message}\n`);
  process.exitCode = 1;
}
