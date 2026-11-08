#!/usr/bin/env node
import { lstatSync, readdirSync, realpathSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { isMainModule } from './ending-1-report-state.mjs';

function directory(path) {
  const root = realpathSync(path);
  if (!statSync(root).isDirectory()) throw new Error(`Not a directory: ${path}`);
  return root;
}

function walk(root, visit) {
  const pending = [root];
  while (pending.length) {
    const current = pending.pop();
    if (!lstatSync(current).isDirectory()) throw new Error(`Directory changed during analysis: ${current}`);
    for (const entry of readdirSync(current, { withFileTypes: true })) {
      const path = join(current, entry.name);
      if (entry.isDirectory()) pending.push(path);
      else if (entry.isFile()) visit(path, entry.name);
    }
  }
}

export function reviewBackups(source, now = Date.now()) {
  const root = directory(source);
  let total = 0;
  let recent = 0;
  let old = 0;
  walk(root, (path, name) => {
    if (!name.includes('.bak')) return;
    const stat = lstatSync(path);
    if (!stat.isFile()) throw new Error(`Backup changed during analysis: ${path}`);
    total++;
    const age = now - stat.mtimeMs;
    if (age < 60 * 60 * 1000) recent++;
    else if (age > 24 * 60 * 60 * 1000) old++;
  });
  return { total, recent, old };
}

export function inspectTemp(path) {
  let stat;
  try { stat = lstatSync(path); }
  catch (error) {
    if (error.code === 'ENOENT') return { count: 0, bytes: 0, exists: false };
    throw error;
  }
  if (!stat.isDirectory()) throw new Error(`Invalid temporary directory: ${path}`);
  let count = 0;
  let bytes = 0;
  walk(path, file => {
    const entry = lstatSync(file);
    if (!entry.isFile()) throw new Error(`Temporary file changed during analysis: ${file}`);
    count++;
    bytes += entry.size;
    if (!Number.isSafeInteger(bytes)) throw new Error('Temporary file size exceeds safe integer range');
  });
  return { count, bytes, exists: true };
}

if (isMainModule(import.meta.url)) {
  try {
    if (Number(process.versions.node.split('.')[0]) < 24) throw new Error('Node.js 24 or newer is required');
    const [operation, ...args] = process.argv.slice(2);
    if (operation === 'cleanup' && args.length <= 1) {
      directory(args[0] ?? '.');
      console.error('Cleanup skipped: no persistent ownership records identify safe temporary files; no files deleted.');
      console.log('SKIPPED');
    } else if (operation === 'backups' && args.length <= 1) {
      const { total, recent, old } = reviewBackups(args[0] ?? '.');
      console.log(`${total} ${recent} ${old}`);
    } else if (operation === 'temp-info' && args.length === 0) {
      const { count, bytes } = inspectTemp('/tmp/aikido');
      console.log(`${count} ${bytes}`);
    } else throw new Error('Usage: ending-5-review.mjs cleanup|backups [source] | temp-info');
  } catch (error) {
    console.error(`Cleanup review failed: ${error.message}`);
    process.exitCode = 1;
  }
}
