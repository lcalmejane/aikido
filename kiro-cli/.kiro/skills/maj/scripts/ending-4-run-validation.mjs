#!/usr/bin/env node
import { spawnSync } from 'node:child_process';
import { realpathSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { isMainModule } from './ending-1-report-state.mjs';

export function runValidation(source, type) {
  const root = realpathSync(source);
  if (!statSync(root).isDirectory()) throw new Error(`Not a project directory: ${source}`);
  if (!['MONO', 'MULTI', 'mono', 'multi'].includes(type)) throw new Error(`Invalid project type: ${type}`);
  const validator = join(root, 'prompts/hard_points/system/maj/scripts/validate-structure.mjs');
  if (!statSync(validator).isFile()) throw new Error(`Invalid validator: ${validator}`);
  console.log(`Running structure validation (type: ${type})...`);
  const result = spawnSync(process.execPath, [validator, '--type', type.toLowerCase()], {
    cwd: root, stdio: 'inherit',
  });
  if (result.error) throw result.error;
  if (result.signal) throw new Error(`Structure validator terminated by signal ${result.signal}`);
  if (result.status === null) throw new Error('Structure validator returned no status');
  console.log(result.status === 0 ? 'VALIDATION SUCCESSFUL' : `VALIDATION FAILED (code: ${result.status})`);
  return result.status;
}

if (isMainModule(import.meta.url)) {
  try {
    if (Number(process.versions.node.split('.')[0]) < 24) throw new Error('Node.js 24 or newer is required');
    const args = process.argv.slice(2);
    if (args.length > 2) throw new Error('Usage: ending-4-run-validation.mjs [source] [MONO|MULTI]');
    process.exitCode = runValidation(args[0] ?? '.', args[1] ?? 'MONO');
  } catch (error) {
    console.error(`Structure validation invocation failed: ${error.message}`);
    process.exitCode = 2;
  }
}
