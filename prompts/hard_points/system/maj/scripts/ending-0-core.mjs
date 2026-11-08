import { createHash, randomUUID } from 'node:crypto';
import { lstatSync, readFileSync, readdirSync, realpathSync, renameSync, unlinkSync, writeFileSync } from 'node:fs';
import { isAbsolute, join, relative, resolve, sep } from 'node:path';

const hash = data => createHash('sha256').update(data).digest('hex');
const sha = value => /^[0-9a-f]{64}$/.test(value);
const inside = (root, path) => path === root || (!isAbsolute(relative(root, path)) && relative(root, path) !== '..' && !relative(root, path).startsWith(`..${sep}`));
const object = value => value && typeof value === 'object' && !Array.isArray(value);
const sort = values => values.sort((a, b) => Buffer.compare(Buffer.from(a), Buffer.from(b)));

export function node24() {
  if (Number(process.versions.node.split('.')[0]) < 24) throw new Error('Node.js 24 or newer is required');
}

export function checked(root, path, missing = false) {
  if (!inside(root, path)) throw new Error(`Path escapes root: ${path}`);
  const parts = relative(root, path).split(sep).filter(Boolean);
  let current = root;
  for (const [index, part] of parts.entries()) {
    current = join(current, part);
    let stat;
    try { stat = lstatSync(current); } catch (error) {
      if (missing && error.code === 'ENOENT') return null;
      throw error;
    }
    if (stat.isSymbolicLink()) throw new Error(`Symlink refused: ${current}`);
    if (index < parts.length - 1 && !stat.isDirectory()) throw new Error(`Not a directory: ${current}`);
  }
  return lstatSync(path);
}

function rootDir(path) {
  const absolute = resolve(path);
  const stat = lstatSync(absolute);
  if (stat.isSymbolicLink() || !stat.isDirectory()) throw new Error(`Not a real directory: ${absolute}`);
  const canonical = realpathSync(absolute);
  if (!lstatSync(canonical).isDirectory()) throw new Error(`Not a directory: ${absolute}`);
  return canonical;
}

export function directory(path) {
  return rootDir(path);
}

function validPath(path) {
  if (typeof path !== 'string' || !path.startsWith('prompts/hard_points/') ||
    /[\x00-\x1f\x7f\\]/.test(path) || path.split('/').some(part => !part || part === '.' || part === '..') ||
    path === 'prompts/hard_points/system/structure/index.json' ||
    path.startsWith('prompts/hard_points/system/structure/indices/')) {
    throw new Error(`Invalid merge path: ${JSON.stringify(path)}`);
  }
}

export function readRegular(root, path, optional = false) {
  const absolute = join(root, path);
  const stat = checked(root, absolute, optional);
  if (!stat) return null;
  if (!stat.isFile()) throw new Error(`Not a regular file: ${absolute}`);
  const bytes = readFileSync(absolute);
  const after = checked(root, absolute);
  if (!after.isFile() || stat.dev !== after.dev || stat.ino !== after.ino ||
      stat.size !== after.size || stat.mtimeMs !== after.mtimeMs || stat.ctimeMs !== after.ctimeMs) {
    throw new Error(`File changed while reading: ${absolute}`);
  }
  return bytes;
}

function walk(root) {
  const base = join(root, 'prompts/hard_points');
  if (!checked(root, base)?.isDirectory()) throw new Error(`Missing hard_points: ${base}`);
  const result = [];
  const decoder = new TextDecoder('utf-8', { fatal: true });
  function visit(path) {
    for (const rawName of readdirSync(join(root, path), { encoding: 'buffer' })) {
      let name;
      try { name = decoder.decode(rawName); } catch { throw new Error(`Non-UTF-8 filename in ${path}`); }
      const item = `${path}/${name}`;
      if (item === 'prompts/hard_points/system/structure/index.json' ||
          item === 'prompts/hard_points/system/structure/indices') continue;
      validPath(item);
      const stat = checked(root, join(root, item));
      if (stat.isDirectory()) visit(item);
      else if (stat.isFile()) result.push(item);
      else throw new Error(`Unsupported file: ${item}`);
    }
  }
  visit('prompts/hard_points');
  return sort(result);
}

export function writeOutput(dir, name, bytes) {
  const path = join(dir, name);
  const existing = checked(dir, path, true);
  if (existing && !existing.isFile()) throw new Error(`Invalid output: ${path}`);
  const staged = join(dir, `.ending-0-${randomUUID()}.partial`);
  try {
    writeFileSync(staged, bytes, { flag: 'wx', mode: 0o600 });
    renameSync(staged, path);
  } finally {
    try { unlinkSync(staged); } catch (error) { if (error.code !== 'ENOENT') throw error; }
  }
}

function writeJson(dir, name, value) {
  writeOutput(dir, name, `${JSON.stringify(value, null, 2)}\n`);
}

function readJson(dir, name) {
  const bytes = readRegular(dir, name);
  try { return JSON.parse(bytes.toString('utf8')); }
  catch (error) { throw new Error(`Invalid JSON ${name}: ${error.message}`); }
}

function invalidate(dir) {
  writeJson(dir, 'ending-0-state.json', { status: 'pending' });
}

export function invalidateMergeReport(dir) {
  invalidate(directory(dir));
}

export function mergeRoots(source, target, dir) {
  node24();
  source = rootDir(source);
  target = rootDir(target);
  dir = directory(dir);
  if (inside(target, source) || inside(join(source, 'prompts/hard_points'), target) ||
      inside(source, dir) || inside(target, dir)) throw new Error('Unsafe overlapping SOURCE, TARGET or work directory');
  return { source, target, dir };
}

export function generate(source, target, dir) {
  ({ source, target, dir } = mergeRoots(source, target, dir));
  invalidate(dir);
  const files = Object.create(null);
  for (const path of walk(target)) {
    const targetBytes = readRegular(target, path);
    const sourceBytes = readRegular(source, path, true);
    files[path] = { target: hash(targetBytes), source: sourceBytes === null ? null : hash(sourceBytes) };
  }
  if (!Object.keys(files).length) throw new Error('TARGET contains no eligible hard_points files');
  const snapshot = { format: 'aikido-ending-0-content-v1', id: randomUUID(), source, target, files };
  verify(snapshot);
  writeJson(dir, 'ending-0-snapshot.json', snapshot);
  return Object.keys(files).length;
}

export function snapshot(dir) {
  const data = readJson(dir, 'ending-0-snapshot.json');
  if (!object(data) || data.format !== 'aikido-ending-0-content-v1' || typeof data.id !== 'string' ||
      !object(data.files) || rootDir(data.source) !== data.source || rootDir(data.target) !== data.target) {
    throw new Error('Invalid snapshot');
  }
  for (const [path, entry] of Object.entries(data.files)) {
    validPath(path);
    if (!object(entry) || !sha(entry.target) || !(entry.source === null || sha(entry.source))) throw new Error(`Invalid snapshot entry: ${path}`);
  }
  return data;
}

export function verify(data, accepted = Object.create(null)) {
  const current = walk(data.target);
  const paths = sort(Object.keys(data.files));
  if (JSON.stringify(current) !== JSON.stringify(paths)) throw new Error('TARGET file set changed since snapshot');
  for (const path of paths) {
    const entry = data.files[path];
    const target = readRegular(data.target, path);
    const source = readRegular(data.source, path, true);
    const expected = Object.hasOwn(accepted, path) ? accepted[path] : entry.source;
    if (hash(target) !== entry.target || (source === null ? null : hash(source)) !== expected) {
      throw new Error(`File changed since snapshot: ${path}`);
    }
  }
}

export function check(dir) {
  dir = directory(dir);
  const data = snapshot(dir);
  verify(data);
  return data;
}

export function compare(dir) {
  dir = directory(dir);
  invalidate(dir);
  const data = check(dir);
  const added = [], modified = [];
  for (const path of sort(Object.keys(data.files))) {
    const entry = data.files[path];
    if (entry.source === null) added.push(path);
    else if (entry.source !== entry.target) modified.push(path);
  }
  const paths = sort([...added, ...modified]);
  const report = { format: 'aikido-ending-0-report-v1', snapshot: data.id, paths };
  writeOutput(dir, 'added_files.txt', added.length ? `${added.join('\n')}\n` : '');
  writeOutput(dir, 'modified_files.txt', modified.length ? `${modified.join('\n')}\n` : '');
  writeOutput(dir, 'diff_report.txt', paths.length ? `${paths.join('\n')}\n` : '');
  writeJson(dir, 'ending-0-report.json', report);
  writeJson(dir, 'ending-0-state.json', { status: 'complete', snapshot: data.id, report: hash(JSON.stringify(report)) });
  return paths.length;
}

export function report(dir, data) {
  const state = readJson(dir, 'ending-0-state.json');
  const report = readJson(dir, 'ending-0-report.json');
  const expected = sort(Object.keys(data.files).filter(path => data.files[path].source !== data.files[path].target));
  if (state.status !== 'complete' || state.snapshot !== data.id || report.format !== 'aikido-ending-0-report-v1' ||
      report.snapshot !== data.id || state.report !== hash(JSON.stringify(report)) ||
      JSON.stringify(report.paths) !== JSON.stringify(expected)) throw new Error('Missing, stale or invalid comparison report');
  return expected;
}

export function processFiles(source, target, mode, dir) {
  dir = directory(dir);
  const data = check(dir);
  if (rootDir(source) !== data.source || rootDir(target) !== data.target) throw new Error('SOURCE or TARGET differs from snapshot');
  const paths = report(dir, data);
  if (!['INTELLIGENT', 'REPLACE', 'SKIP', 'MANUAL_LATER'].includes(mode)) throw new Error(`Unknown merge mode: ${mode}`);
  if (!paths.length) return { status: 'complete', processed: 0 };
  if (mode === 'REPLACE') {
    throw new Error('REPLACE refused: hard points may only be changed through agent-aikido-fusion');
  }
  if (mode !== 'SKIP') {
    writeJson(dir, 'ending-0-manual.json', { mode, source: data.source, target: data.target,
      snapshot: data.id, files: paths.map(path => ({ path, ...data.files[path] })) });
  }
  return { status: 'pending', processed: 0, paths: paths.length };
}
