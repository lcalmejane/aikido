import { createHash, randomUUID } from 'node:crypto';
import { mkdirSync, readFileSync, realpathSync, renameSync, unlinkSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

// Canonicalize both paths: Node resolves module URLs through symlinks while
// argv may retain an alias (e.g. /var on macOS). Imports must stay side-effect free.
export function isMainModule(url) {
  if (!process.argv[1]) return false;
  try {
    return realpathSync(process.argv[1]) === realpathSync(fileURLToPath(url));
  } catch {
    // Eval/embedding may supply a non-file argv[1]; that is not this entry point.
    return false;
  }
}

export const stateName = 'maj_diff.state.json';
export const digest = (bytes) => createHash('sha256').update(bytes).digest('hex');

export function atomicWrite(path, bytes) {
  const temporary = `${path}.${randomUUID()}.tmp`;
  let created = false;
  try {
    writeFileSync(temporary, bytes, { flag: 'wx' });
    created = true;
    renameSync(temporary, path);
    created = false;
  } finally {
    if (created) unlinkSync(temporary);
  }
}

// Invalidate the receipt, never delete or truncate an existing report.
export function beginReport(directory) {
  mkdirSync(directory, { recursive: true });
  const state = { version: 1, run: randomUUID(), status: 'pending' };
  atomicWrite(join(directory, stateName), `${JSON.stringify(state)}\n`);
  return state;
}

export function completeReport(directory, state, hashes) {
  atomicWrite(join(directory, stateName), `${JSON.stringify({ ...state, status: 'complete', hashes })}\n`);
}

export function readReport(directory) {
  const path = join(directory, 'maj_diff.json');
  let bytes;
  try { bytes = readFileSync(path); } catch (error) {
    if (error.code === 'ENOENT') return { status: 'missing' };
    throw error;
  }
  let report;
  try {
    report = JSON.parse(bytes);
    if (report === null || Array.isArray(report) || typeof report !== 'object') throw new Error('Expected report object');
    for (const entry of Object.values(report)) {
      if (entry === null || Array.isArray(entry) || typeof entry !== 'object'
        || !Object.hasOwn(entry, 'before') || !Object.hasOwn(entry, 'after')
        || Object.keys(entry).length !== 2) throw new Error('Expected before/after entries');
    }
  } catch (error) { return { status: 'invalid', reason: error.message }; }
  try {
    const state = JSON.parse(readFileSync(join(directory, stateName), 'utf8'));
    if (state.version !== 1 || state.status !== 'complete' || typeof state.run !== 'string') throw new Error('No completed comparison');
    for (const name of ['maj_before.json', 'maj_after.json', 'maj_diff.json']) {
      const current = name === 'maj_diff.json' ? bytes : readFileSync(join(directory, name));
      if (state.hashes?.[name] !== digest(current)) throw new Error(`Changed ${name}`);
    }
  } catch (error) {
    // Missing snapshots/receipt or invalid receipt indicate unavailable data.
    // Permission, directory and other I/O failures are operational errors.
    if (error.code && error.code !== 'ENOENT') throw error;
    return { status: 'stale', reason: error.message };
  }
  return { status: 'complete', report };
}

export function statistics(report) {
  const keys = Object.keys(report).sort();
  const added = keys.filter((key) => report[key].before === null);
  const removed = keys.filter((key) => report[key].after === null);
  const modified = keys.filter((key) => report[key].before !== null && report[key].after !== null);
  // Legacy null sentinel: null -> null belongs to both added and removed.
  return { counts: [keys.length, added.length, removed.length, modified.length], added, removed, modified };
}
