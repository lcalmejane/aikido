#!/usr/bin/env node
import { existsSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { isMainModule, readReport, statistics } from './ending-1-report-state.mjs';
import { captureContent, invalidateContentReport, protectReports, readSnapshot, saveSnapshot, workOutsideSource } from './ending-1-content.mjs';
import { directory as canonicalDirectory, node24 } from './ending-0-core.mjs';

export function run(mode, args = []) {
  node24();
  let directory = '/tmp/aikido';
  const options = [...args];
  const index = options.indexOf('--dir');
  if (index !== -1) {
    if (!options[index + 1]) throw new Error('Missing --dir directory');
    directory = resolve(options[index + 1]);
    options.splice(index, 2);
  }
  if (mode === 'check-before' && options.length === 0) {
    invalidateContentReport(directory);
    const present = existsSync(join(directory, 'maj_before.json'));
    process.stderr.write(present ? 'Before structure detected\n' : 'Before structure missing; comparison unavailable\n');
    process.stdout.write(present ? 'NO_SKIP\n' : 'SKIP_DIFF\n');
  } else if (mode === 'generate-after' && options.length <= 1) {
    // Also protects callers that skip prerequisite checking.
    workOutsideSource(options[0] ?? '.', directory);
    invalidateContentReport(directory);
    const source = canonicalDirectory(options[0] ?? '.');
    workOutsideSource(source, directory);
    const before = readSnapshot(directory, 'before');
    if (before.root !== source) throw new Error('SOURCE differs from before snapshot');
    saveSnapshot(directory, captureContent(source, 'after', before.run));
    process.stdout.write(`AFTER structure saved: ${join(directory, 'maj_after.json')}\n`);
  } else if (mode === 'statistics' && options.length === 0) {
    protectReports(directory);
    const result = readReport(directory);
    if (result.status !== 'complete') throw new Error(`Report ${result.status}: ${result.reason ?? ''}`);
    process.stderr.write('Analyzing differential report\n');
    process.stdout.write(`${statistics(result.report).counts.join(' ')}\n`);
  } else {
    throw new Error('Usage: ending-1-workflow.mjs <check-before|generate-after|statistics> [source] [--dir directory]');
  }
}

if (isMainModule(import.meta.url)) {
  try { run(process.argv[2], process.argv.slice(3)); } catch (error) {
    process.stderr.write(`${error.message}\n`);
    process.exitCode = 1;
  }
}
