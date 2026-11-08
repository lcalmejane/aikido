#!/usr/bin/env node
import { randomUUID } from 'node:crypto';
import { lstatSync, readFileSync, readdirSync, realpathSync, renameSync, unlinkSync, writeFileSync } from 'node:fs';
import { dirname, join, posix, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { inspect, readEntries } from './generate-index-by-path.mjs';

const assert = (condition, message) => { if (!condition) throw new Error(message); };
const object = value => value !== null && typeof value === 'object' && !Array.isArray(value);
const compare = (a, b) => Buffer.compare(Buffer.from(a), Buffer.from(b));
const ordered = values => [...values].sort(compare);

function readBatches(root, base, dir, pattern, snapshots) {
  const directory = join(base, dir);
  assert(inspect(root, directory)?.isDirectory(), `Missing index directory: ${directory}`);
  return readdirSync(directory).filter(name => pattern.test(name)).sort(compare).map(name => {
    const path = join(directory, name);
    assert(inspect(root, path)?.isFile(), `Invalid index batch: ${path}`);
    const content = readFileSync(path, 'utf8');
    let data;
    try { data = JSON.parse(content); } catch (error) {
      throw new Error(`Invalid JSON in ${path}: ${error.message}`);
    }
    assert(object(data) && object(data.metadata), `Invalid index batch: ${path}`);
    snapshots.push({ path, content });
    return { name, data, route: `indices/${dir}/${name}` };
  });
}

function pushRoute(routes, key, route) {
  if (!Object.hasOwn(routes, key)) routes[key] = { batch: route, batches: [] };
  routes[key].batches.push(route);
}

function checkGroups(groups, expected, label) {
  assert(groups.size === expected.size, `${label} missing or extra keys`);
  for (const [key, ids] of expected) {
    const actual = groups.get(key);
    const sortedExpected = ordered(ids);
    assert(actual && actual.length === ids.length &&
      ordered(actual).every((id, index) => id === sortedExpected[index]), `${label} inconsistent: ${key}`);
  }
}

function groupBy(entries, keyFor) {
  const groups = new Map();
  for (const [path, id, metadata] of entries) {
    const key = keyFor(path, metadata);
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(id);
  }
  return groups;
}

export function generateMaster(root) {
  assert(Number(process.versions.node.split('.')[0]) >= 24, 'Node.js 24 or newer is required');
  root = realpathSync(root);
  const base = join(root, 'prompts/hard_points/system/structure');
  const indices = join(base, 'indices');
  const { entries, snapshots } = readEntries(root);
  const expected = new Map(entries.map(([path, id]) => [path, id]));
  const routes = { by_id: Object.create(null), by_path: Object.create(null),
    by_alphabetical: Object.create(null), by_name: Object.create(null),
    by_directory: Object.create(null), by_type: Object.create(null) };
  for (const prefix of '0123456789abcdef') {
    routes.by_id[prefix] = { batch: `indices/by-id/index-id-${prefix}.json`,
      count: entries.filter(([, id]) => id.startsWith(prefix)).length };
  }
  let totalLines = 0;
  for (const [path, , metadata] of entries) {
    assert(Number.isSafeInteger(metadata.lines) && metadata.lines >= 0, `Invalid line count: ${path}`);
    totalLines += metadata.lines;
    assert(Number.isSafeInteger(totalLines), 'Line count exceeds safe integer range');
    assert(typeof metadata.type === 'string' && /^[a-z_]+$/.test(metadata.type), `Invalid type: ${path}`);
  }
  const paths = readBatches(root, indices, 'by-path', /^index-path-\d+\.json$/, snapshots);
  const actualPaths = new Map();
  for (const { data, route } of paths) {
    assert(object(data.paths) && data.metadata.count === Object.keys(data.paths).length &&
      Number.isSafeInteger(data.metadata.offset) && data.metadata.offset >= 0, `Invalid path batch: ${route}`);
    for (const [path, id] of Object.entries(data.paths)) {
      assert(!actualPaths.has(path) && expected.get(path) === id, `Invalid or duplicate path reference: ${path}`);
      actualPaths.set(path, id);
      pushRoute(routes.by_path, path.split('/')[0], route);
    }
  }
  assert(actualPaths.size === expected.size, 'by-path index is incomplete');
  for (const route of Object.values(routes.by_path)) route.batches = [...new Set(route.batches)];
  const alpha = readBatches(root, indices, 'by-alphabetical', /^index-alpha-\d+\.json$/, snapshots);
  const alphaGroups = new Map();
  for (const { name, data, route } of alpha) {
    assert(object(data.files) && data.metadata.count === Object.keys(data.files).length &&
      Array.isArray(data.metadata.range) && data.metadata.range.length === 2, `Invalid alphabetical batch: ${route}`);
    routes.by_alphabetical[name] = { batch: route, range: data.metadata.range, count: data.metadata.count };
    for (const [name, ids] of Object.entries(data.files)) {
      assert(Array.isArray(ids) && !alphaGroups.has(name), `Invalid alphabetical reference: ${name}`);
      alphaGroups.set(name, ids);
      routes.by_name[name] = { batch: route };
    }
  }
  checkGroups(alphaGroups, groupBy(entries, path => posix.basename(path)), 'by-alphabetical');
  const directories = readBatches(root, indices, 'by-directory', /^index-dir-\d+\.json$/, snapshots);
  const dirGroups = new Map();
  for (const { data, route } of directories) {
    assert(object(data.directories) && data.metadata.directories_count === Object.keys(data.directories).length,
      `Invalid directory batch: ${route}`);
    for (const [dir, value] of Object.entries(data.directories)) {
      assert(object(value) && Array.isArray(value.ids) && value.files_count === value.ids.length &&
        !dirGroups.has(dir), `Invalid directory reference: ${dir}`);
      dirGroups.set(dir, value.ids);
      routes.by_directory[dir] = { batch: route, files_count: value.files_count };
    }
  }
  checkGroups(dirGroups, groupBy(entries, path => posix.dirname(path)), 'by-directory');
  const types = readBatches(root, indices, 'by-type', /^index-type-[a-z_]+(?:-\d+)?\.json$/, snapshots);
  const typeGroups = new Map();
  for (const { data, route } of types) {
    const type = data.metadata.type;
    assert(typeof type === 'string' && /^[a-z_]+$/.test(type) && Array.isArray(data.ids) &&
      data.metadata.count === data.ids.length, `Invalid type batch: ${route}`);
    if (!typeGroups.has(type)) typeGroups.set(type, []);
    typeGroups.get(type).push(...data.ids);
    pushRoute(routes.by_type, type, route);
  }
  checkGroups(typeGroups, groupBy(entries, (_path, metadata) => metadata.type), 'by-type');
  for (const [type, route] of Object.entries(routes.by_type)) route.count = typeGroups.get(type).length;
  const timestamp = new Date().toISOString();
  const master = {
    metadata: {
      version: '3.1-hash-id',
      id_format: { algorithm: 'sha256', length: 12, charset: 'hex', example: '525bd3752a90' },
      last_check: { timestamp, generator: 'agent-aikido-projet-index', version: '3.1' },
      statistics: { total_files: entries.length, total_dirs: dirGroups.size, total_lines: totalLines,
        index_files_count: 16 + paths.length + alpha.length + directories.length + types.length },
      batching: { batch_size: 1000, by_id_batches: 16, by_path_batches: paths.length,
        by_alphabetical_batches: alpha.length, by_directory_batches: directories.length, by_type_batches: types.length },
    },
    hash_tables: routes,
    routing: { description: 'by_id routes by hash prefix; by_path and by_type batches include all matching batches',
      examples: { find_by_path: 'hash(path) → ID → by-id batch', find_by_name: 'name → by-alphabetical → IDs',
        direct_by_id: 'ID → first hex character → by-id batch' } },
  };
  const target = join(base, 'index.json');
  const current = inspect(root, target);
  assert(!current || current.isFile(), `Invalid master index: ${target}`);
  const previous = current ? readFileSync(target) : null;
  const temp = join(base, `.index-master-${randomUUID()}.tmp`);
  let staged = false;
  try {
    writeFileSync(temp, `${JSON.stringify(master, null, 2)}\n`, { flag: 'wx', mode: current ? lstatSync(target).mode & 0o777 : 0o644 });
    staged = true;
    for (const snapshot of snapshots) {
      assert(inspect(root, snapshot.path)?.isFile() && readFileSync(snapshot.path, 'utf8') === snapshot.content,
        `Index changed during master generation: ${snapshot.path}`);
    }
    const now = inspect(root, target);
    assert(previous ? now?.isFile() && readFileSync(target).equals(previous) : !now, 'Master index changed during generation');
    renameSync(temp, target);
    staged = false;
  } finally {
    if (staged) unlinkSync(temp);
  }
  return master;
}

function isMain() {
  try { return Boolean(process.argv[1]) && realpathSync(process.argv[1]) === realpathSync(fileURLToPath(import.meta.url)); }
  catch { return false; }
}
if (isMain()) {
  try {
    if (process.argv.length > 2) console.error('Additional positional arguments are ignored; use PROJECT_ROOT to select the project');
    const root = process.env.PROJECT_ROOT || resolve(dirname(fileURLToPath(import.meta.url)), '../../../../..');
    const master = generateMaster(root);
    console.log(`Master index generated: ${master.metadata.statistics.total_files} files`);
  } catch (error) {
    console.error(`Master index generation failed: ${error.message}`);
    process.exitCode = 1;
  }
}
