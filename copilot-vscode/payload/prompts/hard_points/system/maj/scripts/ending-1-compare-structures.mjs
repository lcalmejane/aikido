#!/usr/bin/env node
import { randomUUID } from 'node:crypto';
import { renameSync, unlinkSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { completeReport, digest, isMainModule } from './ending-1-report-state.mjs';
import { format, invalidateContentReport, validateSnapshot } from './ending-1-content.mjs';
import { node24, readRegular, directory as canonicalDirectory } from './ending-0-core.mjs';

function equalJson(a, b) {
  if (a === b) return true;
  if (a === null || b === null || typeof a !== 'object' || typeof b !== 'object') return false;
  if (Array.isArray(a) !== Array.isArray(b)) return false;
  const keys = Object.keys(a);
  return keys.length === Object.keys(b).length
    && keys.every((key) => Object.hasOwn(b, key) && equalJson(a[key], b[key]));
}

function readObject(path, bytes) {
  const value = JSON.parse(bytes.toString('utf8'), (_key, item, context) => {
    if (typeof item === 'number') {
      const source = context.source;
      const significantDigits = source.split(/[eE]/)[0].replace(/[-.]/g, '').replace(/^0+/, '').length;
      if (!Number.isFinite(item) || (Number.isInteger(item) && !Number.isSafeInteger(item))
        || significantDigits > 15 || (item === 0 && /[1-9]/.test(source.split(/[eE]/)[0]))) {
        throw new Error(`${path}: JSON number cannot be compared safely: ${source}`);
      }
    }
    return item;
  });
  if (value === null || Array.isArray(value) || typeof value !== 'object') {
    throw new Error(`${path}: expected a JSON object`);
  }
  return value;
}

export function compareStructures(before, after) {
  const changes = Object.create(null);
  for (const key of Object.keys(before)) {
    if (!Object.hasOwn(after, key)) {
      changes[key] = { before: before[key], after: null };
    } else if (!equalJson(before[key], after[key])) {
      changes[key] = { before: before[key], after: after[key] };
    }
  }
  for (const key of Object.keys(after)) {
    if (!Object.hasOwn(before, key)) changes[key] = { before: null, after: after[key] };
  }
  return changes;
}

export function writeComparison(directory) {
  node24();
  directory = canonicalDirectory(directory);
  const state = invalidateContentReport(directory);
  const beforeBytes = readRegular(directory, 'maj_before.json');
  const afterBytes = readRegular(directory, 'maj_after.json');
  let before = readObject(join(directory, 'maj_before.json'), beforeBytes);
  let after = readObject(join(directory, 'maj_after.json'), afterBytes);
  if (before.format === format || after.format === format) {
    validateSnapshot(before, 'before');
    validateSnapshot(after, 'after');
    if (before.run !== after.run || before.root !== after.root) throw new Error('Snapshot run or SOURCE mismatch');
    before = before.files;
    after = after.files;
  } else if (before.hash_tables || after.hash_tables || before.metadata?.version === '3.1-hash-id' || after.metadata?.version === '3.1-hash-id') {
    throw new Error('Master V3.1 indexes are not content snapshots; rerun beginning');
  }
  const reportBytes = `${JSON.stringify(compareStructures(before, after), null, 2)}\n`;
  const target = join(directory, 'maj_diff.json');
  const temporary = join(directory, `.maj-diff-${randomUUID()}.tmp`);
  let created = false;
  try {
    writeFileSync(temporary, reportBytes, { flag: 'wx' });
    created = true;
    renameSync(temporary, target);
    created = false;
    completeReport(directory, state, {
      'maj_before.json': digest(beforeBytes),
      'maj_after.json': digest(afterBytes),
      'maj_diff.json': digest(reportBytes),
    });
  } finally {
    if (created) unlinkSync(temporary);
  }
  return target;
}

if (isMainModule(import.meta.url)) {
  try {
    const args = process.argv.slice(2);
    if (args.length !== 0 && (args.length !== 2 || args[0] !== '--dir' || !args[1])) {
      throw new Error('Usage: ending-1-compare-structures.mjs [--dir <directory>]');
    }
    const directory = args.length ? resolve(args[1]) : '/tmp/aikido';
    process.stdout.write('\n📊 Comparaison structures BEFORE vs AFTER...\n\n');
    const target = writeComparison(directory);
    process.stdout.write(`✅ Differential report generated: ${target}\n`);
  } catch (error) {
    process.stderr.write(`Structure comparison failed: ${error.message}\n`);
    process.exitCode = 1;
  }
}
