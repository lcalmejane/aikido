#!/usr/bin/env node
import { closeSync, fchmodSync, lstatSync, openSync, readFileSync, readdirSync, realpathSync, renameSync, unlinkSync, writeFileSync } from 'node:fs';
import { dirname, isAbsolute, join, relative, resolve, sep } from 'node:path';
import { randomUUID } from 'node:crypto';
import { createInterface } from 'node:readline/promises';
import { stdin, stdout } from 'node:process';
import { generateAll } from './generate-all-indexes-v3.1.mjs';
import { readEntries } from './generate-index-by-path.mjs';

const usage = 'Usage: clean-orphans.mjs [--dry-run] [--confirm] [--verbose] [--rebuild]';
const object = value => value !== null && typeof value === 'object' && !Array.isArray(value);
const assert = (condition, message) => { if (!condition) throw new Error(message); };
const root = realpathSync(process.cwd());
const structure = join(root, 'prompts/hard_points/system/structure');
const masterPath = join(structure, 'index.json');
const batchesDir = join(structure, 'indices/by-id');

// Reject every symlink component, including dangling links, rather than following it.
// ENOENT is the only condition treated as an absent path.
function inspect(path) {
  const rel = relative(root, path);
  assert(rel !== '..' && !rel.startsWith(`..${sep}`) && !isAbsolute(rel), `Path outside project: ${path}`);
  let current = root;
  for (const part of rel.split(sep).filter(Boolean)) {
    current = join(current, part);
    let stat;
    try { stat = lstatSync(current); } catch (error) {
      if (error.code === 'ENOENT') return null;
      throw error;
    }
    assert(!stat.isSymbolicLink(), `Unsafe symlink: ${current}`);
  }
  return lstatSync(path);
}

function readIndex(path) {
  const stat = inspect(path);
  assert(stat?.isFile(), `Missing or invalid index file: ${path}`);
  const text = readFileSync(path, 'utf8');
  let data;
  try {
    data = JSON.parse(text, (_key, value, context) => {
      // V3.1 uses integer counters. Reject numbers that could be rounded on rewrite.
      if (typeof value === 'number') assert(Number.isSafeInteger(value) && /^-?(0|[1-9]\d*)$/.test(context.source), `Unsupported or unsafe number in ${path}`);
      return value;
    });
  } catch (error) { throw new Error(`Invalid or unsupported JSON in ${path}: ${error.message}`); }
  return { path, text, data, mode: stat.mode & 0o777 };
}

function indexedPath(value) {
  assert(typeof value === 'string' && value.length > 0 && !value.includes('\0'), 'Invalid indexed path');
  // V3.1 generator uses relative POSIX paths. Do not reinterpret absolute paths.
  assert(!isAbsolute(value) && !value.includes('\\') && !/^[a-zA-Z]:/.test(value), `Invalid indexed path: ${value}`);
  const parts = value.split('/');
  assert(parts.every(part => part && part !== '.' && part !== '..'), `Invalid indexed path: ${value}`);
  return resolve(root, ...parts);
}

function snapshotMatches(file) {
  const stat = inspect(file.path);
  assert(stat?.isFile() && readFileSync(file.path, 'utf8') === file.text, `Index changed during cleanup: ${file.path}`);
}

function stage(temp, text, mode, onCreate) {
  const fd = openSync(temp, 'wx', mode);
  onCreate();
  try {
    fchmodSync(fd, mode);
    writeFileSync(fd, text);
  } finally { closeSync(fd); }
}

// Stage all replacements before changing any index. Roll back ordinary failures.
// A process crash or concurrent filesystem mutation cannot be made atomic across files.
function commit(files) {
  const staged = [];
  const replaced = [];
  try {
    for (const file of files) {
      snapshotMatches(file);
      const temp = join(dirname(file.path), `.clean-orphans-${randomUUID()}.tmp`);
      inspect(dirname(temp));
      stage(temp, `${JSON.stringify(file.data, null, 2)}\n`, file.mode, () => staged.push({ ...file, temp }));
    }
    files.forEach(snapshotMatches);
    for (const file of staged) {
      snapshotMatches(file);
      inspect(dirname(file.path));
      renameSync(file.temp, file.path);
      replaced.push(file);
    }
  } catch (error) {
    const failures = [];
    for (const file of replaced.reverse()) {
      try {
        inspect(dirname(file.path));
        assert(inspect(file.path)?.isFile(), `Unsafe rollback target: ${file.path}`);
        const temp = join(dirname(file.path), `.clean-orphans-${randomUUID()}.tmp`);
        let created = false;
        try {
          stage(temp, file.text, file.mode, () => { created = true; });
          renameSync(temp, file.path);
        } finally { if (created) try { inspect(dirname(temp)); unlinkSync(temp); } catch (e) { if (e.code !== 'ENOENT') throw e; } }
      } catch (rollbackError) { failures.push(rollbackError.message); }
    }
    throw new Error(`${error.message}${failures.length ? `; rollback failed: ${failures.join('; ')}` : ''}`);
  } finally {
    for (const file of staged) {
      try { inspect(dirname(file.temp)); unlinkSync(file.temp); } catch (error) { if (error.code !== 'ENOENT') console.error(`Could not remove temporary file: ${error.message}`); }
    }
  }
}

async function main() {
  assert(Number(process.versions.node.split('.')[0]) >= 24, 'Node.js >=24 is required');
  const args = process.argv.slice(2);
  assert(args.every(arg => ['--dry-run', '--confirm', '--verbose', '--rebuild'].includes(arg)), usage);
  const dry = args.includes('--dry-run');
  const confirm = args.includes('--confirm');
  const verbose = args.includes('--verbose');
  const rebuild = args.includes('--rebuild');
  if (!inspect(masterPath)) {
    console.log('Index not found. Use /reindex-projet to create the index.');
    return;
  }
  const master = readIndex(masterPath);
  assert(object(master.data) && object(master.data.metadata) && object(master.data.metadata.statistics) &&
    object(master.data.metadata.last_check) && object(master.data.hash_tables) && object(master.data.hash_tables.by_id),
  'Invalid master index structure');
  assert(inspect(batchesDir)?.isDirectory(), 'Index incomplete: by-id directory missing; use /reindex-projet');
  const names = readdirSync(batchesDir).filter(name => /^index-id-.*\.json$/.test(name)).sort();
  assert(names.length > 0, 'Index incomplete: no by-id batches; use /reindex-projet');
  const routes = master.data.hash_tables.by_id;
  const prefixes = names.map(name => {
    const match = /^index-id-([0-9a-f])\.json$/.exec(name);
    assert(match, `Invalid batch name: ${name}`);
    return match[1];
  });
  assert(Object.keys(routes).length === prefixes.length && prefixes.every(prefix =>
    object(routes[prefix]) && routes[prefix].batch === `indices/by-id/index-id-${prefix}.json`),
  'Index incomplete or invalid: by-id routes do not match batches');
  if (rebuild) readEntries(root);
  const batches = names.map(name => readIndex(join(batchesDir, name)));
  let total = 0;
  const orphans = [];
  const changed = [];
  for (let i = 0; i < batches.length; i++) {
    const batch = batches[i], prefix = prefixes[i], data = batch.data;
    assert(object(data) && object(data.metadata) && object(data.files) &&
      data.metadata.id_prefix === prefix && data.metadata.batch_id === `id-${prefix}`,
    `Invalid by-id batch structure: ${batch.path}`);
    let removed = 0;
    for (const [id, entry] of Object.entries(data.files)) {
      assert(new RegExp(`^${prefix}[0-9a-f]{11}$`).test(id) && object(entry), `Invalid entry ${id} in ${batch.path}`);
      const path = indexedPath(entry.path);
      const exists = inspect(path);
      total++;
      if (!exists) { orphans.push(entry.path); delete data.files[id]; removed++; }
      else if (verbose) console.log(`Valid: ${entry.path}`);
    }
    if (removed) {
      data.metadata.count = Object.keys(data.files).length;
      routes[prefix].count = data.metadata.count;
      changed.push(batch);
    }
  }
  console.log(`Indexed files: ${total}\nValid files: ${total - orphans.length}\nOrphans detected: ${orphans.length}`);
  for (const path of (verbose ? orphans : orphans.slice(0, 5))) console.log(`Orphan: ${path}`);
  if (orphans.length && orphans.length / total > 0.1) console.log(`WARNING: Many orphans detected (${(100 * orphans.length / total).toFixed(1)}%).`);
  if (!orphans.length && !rebuild) { console.log('No by-id cleanup needed. Secondary indexes were not checked.'); return; }
  if (rebuild) {
    console.log('Full rebuild: all indexes will be regenerated from the current project tree, including newly discovered files.');
  } else {
    console.log('Secondary indexes are not updated; run /reindex-projet after cleanup.');
  }
  if (dry) { console.log('Dry run: no changes made.'); return; }
  if (confirm) {
    const reader = createInterface({ input: stdin, output: stdout });
    let answer;
    try { answer = await reader.question(rebuild ? 'Rebuild all indexes? [y/N] ' : 'Remove orphan entries? [y/N] '); } finally { reader.close(); }
    if (!/^(y|yes|o|oui)$/i.test(answer.trim())) { console.log('Cancelled; no changes made.'); return; }
  }
  // Recheck the paths and every input after confirmation, before staging.
  for (const path of orphans) assert(!inspect(indexedPath(path)), `Orphan changed during cleanup: ${path}`);
  batches.forEach(snapshotMatches);
  snapshotMatches(master);
  if (rebuild) {
    const result = generateAll(root);
    console.log(`Full index rebuild complete: ${result.files} files, ${result.batches} by-id batches.`);
    return;
  }
  master.data.metadata.statistics.total_files = total - orphans.length;
  master.data.metadata.last_check.timestamp = new Date().toISOString();
  master.data.metadata.last_check.generator = 'clean-orphans-node';
  commit([...changed, master]);
  console.log(`Orphans removed: ${orphans.length}`);
}

main().catch(error => { console.error(`Cleanup failed: ${error.message}`); process.exitCode = 1; });
