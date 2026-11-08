#!/usr/bin/env node
import { createHash, randomUUID } from 'node:crypto';
import { lstatSync, mkdirSync, readFileSync, readdirSync, realpathSync, renameSync, unlinkSync, writeFileSync } from 'node:fs';
import { dirname, isAbsolute, join, relative, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import { assertPublicProjectRoot, isPrivateTaskStorePathWithin } from './lib/private-task-store.mjs';

const prefixes = '0123456789abcdef';
const assert = (condition, message) => { if (!condition) throw new Error(message); };
const object = value => value !== null && typeof value === 'object' && !Array.isArray(value);
const compare = (a, b) => Buffer.compare(Buffer.from(a), Buffer.from(b));
const hash = path => createHash('sha256').update(path).digest('hex').slice(0, 12);

export function inspect(root, path) {
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
    assert(!stat.isSymbolicLink(), `Symlink refused: ${current}`);
  }
  return lstatSync(path);
}

function validPath(path) {
  return typeof path === 'string' && path.length > 0 && !path.includes('\\') &&
    !path.includes('\0') && !path.startsWith('/') && !/^[a-zA-Z]:/.test(path) &&
    path.split('/').every(part => part && part !== '.' && part !== '..');
}

export function readEntries(root) {
  const dir = join(root, 'prompts/hard_points/system/structure/indices/by-id');
  assert(inspect(root, dir)?.isDirectory(), `Missing by-id directory: ${dir}`);
  const entries = [];
  const paths = new Set();
  const snapshots = [];
  for (const prefix of prefixes) {
    const path = join(dir, `index-id-${prefix}.json`);
    assert(inspect(root, path)?.isFile(), `Missing by-id batch: ${path}`);
    const content = readFileSync(path, 'utf8');
    snapshots.push({ path, content });
    let data;
    try { data = JSON.parse(content); } catch (error) {
      throw new Error(`Invalid JSON in ${path}: ${error.message}`);
    }
    assert(object(data) && object(data.metadata) && object(data.files) &&
      data.metadata.id_prefix === prefix && data.metadata.batch_id === `id-${prefix}` &&
      data.metadata.count === Object.keys(data.files).length, `Invalid by-id batch: ${path}`);
    for (const [id, metadata] of Object.entries(data.files)) {
      assert(object(metadata) && validPath(metadata.path), `Invalid indexed path in ${path}`);
      assert(!isPrivateTaskStorePathWithin(root, metadata.path), `Private Task Store path in by-id index: ${metadata.path}`);
      assert(id === hash(metadata.path) && id.startsWith(prefix), `Invalid ID for ${metadata.path}`);
      assert(!paths.has(metadata.path), `Duplicate path: ${metadata.path}`);
      paths.add(metadata.path);
      entries.push([metadata.path, id, metadata]);
    }
  }
  return { entries: entries.sort((a, b) => compare(a[0], b[0])), snapshots };
}

export function pathBatches(entries, timestamp, batchSize = 1000) {
  const batches = new Map();
  for (let offset = 0; offset < entries.length; offset += batchSize) {
    const number = String(offset / batchSize).padStart(3, '0');
    const slice = entries.slice(offset, offset + batchSize);
    batches.set(`index-path-${number}.json`, {
      metadata: { batch_id: `path-${number}`, offset, count: slice.length, generated: timestamp },
      paths: Object.fromEntries(slice.map(([path, id]) => [path, id])),
    });
  }
  return batches;
}

// Each rename is atomic, but the complete collection is not crash-atomic.
// Callers must prevent concurrent index writers/readers during regeneration.
export function publishBatches(root, directory, batches, snapshots, prefix = 'path') {
  const existing = inspect(root, directory);
  if (!existing) {
    assert(inspect(root, dirname(directory))?.isDirectory(), 'Missing index parent directory');
    mkdirSync(directory);
  } else assert(existing.isDirectory(), `Invalid by-path directory: ${directory}`);
  assert(['id', 'path', 'alpha', 'dir', 'type'].includes(prefix), 'Invalid batch prefix');
  const suffix = prefix === 'id' ? '[0-9a-f]' : prefix === 'type' ? '[a-z_]+(?:-\\d+)?' : '\\d+';
  const pattern = new RegExp(`^index-${prefix}-${suffix}\\.json$`);
  for (const name of batches.keys()) assert(pattern.test(name), `Invalid output batch name: ${name}`);
  const oldNames = readdirSync(directory).filter(name => pattern.test(name));
  const originals = new Map();
  for (const name of oldNames) {
    const path = join(directory, name);
    assert(inspect(root, path)?.isFile(), `Invalid by-path file: ${path}`);
    originals.set(name, { content: readFileSync(path), mode: lstatSync(path).mode & 0o777 });
  }
  const staged = new Map();
  const installed = [];
  const backedUp = [];
  try {
    for (const [name, data] of batches) {
      const temp = join(directory, `.index-${prefix}-${randomUUID()}.tmp`);
      writeFileSync(temp, `${JSON.stringify(data, null, 2)}\n`, { flag: 'wx', mode: originals.get(name)?.mode ?? 0o644 });
      staged.set(name, temp);
    }
    for (const [name, original] of originals) {
      const path = join(directory, name);
      assert(inspect(root, path)?.isFile() && readFileSync(path).equals(original.content),
        `Index changed during generation: ${path}`);
    }
    for (const { path, content } of snapshots) {
      assert(inspect(root, path)?.isFile() && readFileSync(path, 'utf8') === content,
        `by-id batch changed during generation: ${path}`);
    }
    for (const name of batches.keys()) {
      if (!originals.has(name)) assert(!inspect(root, join(directory, name)), `Output already exists: ${name}`);
    }
    for (const name of oldNames) {
      const backup = join(directory, `.index-${prefix}-${randomUUID()}.backup`);
      renameSync(join(directory, name), backup);
      backedUp.push({ name, backup });
    }
    for (const [name, temp] of staged) {
      renameSync(temp, join(directory, name));
      installed.push(name);
    }
  } catch (error) {
    const failures = [];
    for (const name of installed.reverse()) {
      try { unlinkSync(join(directory, name)); } catch (failure) { failures.push(failure.message); }
    }
    for (const { name, backup } of backedUp.reverse()) {
      try { renameSync(backup, join(directory, name)); } catch (failure) { failures.push(failure.message); }
    }
    throw new Error(`${error.message}${failures.length ? `; rollback failed: ${failures.join('; ')}` : ''}`);
  } finally {
    for (const temp of staged.values()) {
      try { unlinkSync(temp); } catch (error) { if (error.code !== 'ENOENT') console.error(`Temporary cleanup failed: ${error.message}`); }
    }
  }
  for (const { backup } of backedUp) {
    try { unlinkSync(backup); } catch (error) { throw new Error(`Index published but backup cleanup failed: ${backup}: ${error.message}`); }
  }
}

export function generateByPath(root) {
  assert(Number(process.versions.node.split('.')[0]) >= 24, 'Node.js 24 or newer is required');
  root = assertPublicProjectRoot(root);
  const { entries, snapshots } = readEntries(root);
  const batches = pathBatches(entries, new Date().toISOString());
  publishBatches(root, join(root, 'prompts/hard_points/system/structure/indices/by-path'), batches, snapshots);
  return { files: entries.length, batches: batches.size };
}

function isMain() {
  try { return Boolean(process.argv[1]) && realpathSync(process.argv[1]) === realpathSync(fileURLToPath(import.meta.url)); }
  catch { return false; }
}

if (isMain()) {
  try {
    if (process.argv.length > 2) console.error('by-path generator ignores positional arguments; use PROJECT_ROOT to select the project');
    const defaultRoot = resolve(dirname(fileURLToPath(import.meta.url)), '../../../../..');
    const result = generateByPath(process.env.PROJECT_ROOT || defaultRoot);
    console.log(`by-path index generated: ${result.files} files, ${result.batches} batches`);
  } catch (error) {
    console.error(`by-path generation failed: ${error.message}`);
    process.exitCode = 1;
  }
}
