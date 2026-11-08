#!/usr/bin/env node
import { mkdirSync, readFileSync, readdirSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { atomicWrite, isMainModule, readReport, statistics } from './ending-1-report-state.mjs';

export function run(mode, args = []) {
  const options = [...args];
  let directory = '/tmp/aikido';
  const index = options.indexOf('--dir');
  if (index !== -1) {
    if (!options[index + 1]) throw new Error('Missing --dir directory');
    directory = resolve(options[index + 1]);
    options.splice(index, 2);
  }
  if (mode === 'summary') {
    if (options.length) throw new Error('Usage: summary [--dir directory]');
    const text = readFileSync(0, 'utf8');
    if (!text.trim()) throw new Error('Summary must not be empty');
    atomicWrite(join(directory, 'ending2_summary.txt'), text);
    return;
  }
  if (mode === 'backups') {
    if (options.length > 1) throw new Error('Usage: backups [source] [--dir directory]');
    const source = options[0] ?? '.';
    const files = [];
    const visit = (path) => {
      const entries = readdirSync(path, { withFileTypes: true });
      for (const entry of entries.sort((a, b) => a.name < b.name ? -1 : a.name > b.name ? 1 : 0)) {
        const child = join(path, entry.name);
        if (entry.isDirectory()) visit(child);
        else if (entry.isFile() && entry.name.includes('.bak')) files.push(child);
      }
    };
    visit(source);
    mkdirSync(directory, { recursive: true });
    // Replace even with an empty list: ending-5 must not consume an old list.
    atomicWrite(join(directory, 'backup_files_list.txt'), files.length ? `${files.join('\n')}\n` : '');
    for (const file of files.slice(0, 10)) process.stderr.write(`Backup: ${JSON.stringify(file)}\n`);
    process.stdout.write(`${files.length}\n`);
    return;
  }
  if (!['check', 'validate', 'analyze', 'display'].includes(mode)
    || (options.length && !(mode === 'analyze' && options.length === 1 && options[0] === '--list'))) {
    throw new Error('Usage: ending-2-report.mjs <check|validate|analyze|display|backups> [--list|source] [--dir directory]');
  }
  const result = readReport(directory);
  if (result.status !== 'complete') process.stderr.write(`Report ${result.status}: ${result.reason ?? 'not available'}\n`);
  if (mode === 'check') process.stdout.write(result.status === 'complete' ? 'PRESENT\n' : 'EMPTY\n');
  else if (mode === 'validate') process.stdout.write(result.status === 'complete' ? 'VALID\n' : 'INVALID\n');
  else if (mode === 'display') {
    if (result.status === 'complete') process.stdout.write(`${JSON.stringify(result.report, null, 2)}\n`);
  } else if (result.status !== 'complete') {
    process.stdout.write('N/A N/A N/A N/A\n');
  } else {
    const stats = statistics(result.report);
    if (options.includes('--list')) {
      for (const [type, marker] of [['added', '+'], ['removed', '-'], ['modified', '~']]) {
        for (const key of stats[type]) process.stdout.write(`  ${marker} ${JSON.stringify(key)}\n`);
      }
    }
    process.stdout.write(`${stats.counts.join(' ')}\n`);
  }
}

if (isMainModule(import.meta.url)) {
  try { run(process.argv[2], process.argv.slice(3)); } catch (error) {
    process.stderr.write(`${error.message}\n`);
    // Unavailable data is handled above. Operational/usage errors have no result.
    process.exitCode = 1;
  }
}
