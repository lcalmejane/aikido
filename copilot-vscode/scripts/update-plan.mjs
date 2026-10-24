#!/usr/bin/env node
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { realpathSync } from 'node:fs';
import {
  applyMigration, applyUninstall, applyUpdate, planMigration, planUninstall, planUpdate, restoreUpdateBackup,
} from '../lib/update-plan.mjs';

function parseArgs(argv) {
  const result = { flags: new Set() };
  const flags = new Set(['--apply', '--migrate', '--uninstall']);
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

if (process.argv[1] && realpathSync(resolve(process.argv[1])) === realpathSync(fileURLToPath(import.meta.url))) {
  try {
    const options = parseArgs(process.argv.slice(2));
    const root = resolve(options['--root'] ?? process.cwd());
    if (options.flags.has('--migrate') && options.flags.has('--uninstall')) {
      throw new Error('--migrate and --uninstall cannot be combined');
    }
    if (options['--recover']) {
      if (options['--package'] || options.flags.has('--apply') || options['--confirm']
        || options['--mode'] || options.flags.has('--migrate') || options.flags.has('--uninstall')) {
        throw new Error('--recover cannot be combined with package update options');
      }
      const result = restoreUpdateBackup({ root, backupPath: options['--recover'] });
      process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
    } else if (options.flags.has('--uninstall')) {
      if (options['--package'] || options['--mode']) throw new Error('--uninstall cannot use --package or --mode');
      if (options.flags.has('--apply') && !options['--confirm']) {
        throw new Error('--confirm <plan-id> is required with --apply');
      }
      if (!options.flags.has('--apply') && options['--confirm']) {
        throw new Error('--confirm is only valid with --apply');
      }
      const plan = planUninstall({ root });
      if (options.flags.has('--apply')) {
        const result = applyUninstall({ root, expectedPlanId: options['--confirm'] });
        process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
      } else {
        process.stdout.write(`${JSON.stringify(plan, null, 2)}\n`);
        if (!plan.ready) process.exitCode = 2;
      }
    } else {
      if (options['--mode'] && !options.flags.has('--migrate')) {
        throw new Error('--mode is only valid with --migrate');
      }
      if (!options['--package']) throw new Error('--package <directory> is required');
      if (options.flags.has('--apply') && !options['--confirm']) {
        throw new Error('--confirm <plan-id> is required with --apply');
      }
      if (!options.flags.has('--apply') && options['--confirm']) {
        throw new Error('--confirm is only valid with --apply');
      }
      const packageRoot = resolve(options['--package']);
      if (options.flags.has('--migrate')) {
        const mode = options['--mode'] ?? 'UNSET';
        const plan = planMigration({ root, packageRoot, mode });
        if (options.flags.has('--apply')) {
          const result = applyMigration({ root, packageRoot, mode, expectedPlanId: options['--confirm'] });
          process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
        } else {
          process.stdout.write(`${JSON.stringify(plan, null, 2)}\n`);
          if (!plan.ready) process.exitCode = 2;
        }
      } else if (options.flags.has('--apply')) {
        const result = applyUpdate({ root, packageRoot, expectedPlanId: options['--confirm'] });
        process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
      } else {
        const plan = planUpdate({ root, packageRoot });
        process.stdout.write(`${JSON.stringify(plan, null, 2)}\n`);
        if (!plan.ready) process.exitCode = 2;
      }
    }
  } catch (error) {
    process.stderr.write(`Update ${process.argv.includes('--apply') ? 'application' : 'planning'} failed: ${error.message}\n`);
    process.exitCode = 1;
  }
}
