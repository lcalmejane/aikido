import { randomUUID } from 'node:crypto';
import { readdirSync } from 'node:fs';
import { isAbsolute, join, relative, resolve, sep } from 'node:path';
import { checked, directory, node24, readRegular, writeOutput } from './ending-0-core.mjs';
import { beginReport, digest } from './ending-1-report-state.mjs';

export const format = 'aikido-maj-content-v1';
const sort = paths => paths.sort((a, b) => Buffer.compare(Buffer.from(a), Buffer.from(b)));
const object = value => value && typeof value === 'object' && !Array.isArray(value);

function excluded(path) {
  return path === 'prompts/hard_points/system/structure/index.json' ||
    path.startsWith('prompts/hard_points/system/structure/indices/') ||
    path === 'prompts/hard_points/system/structure/indices' ||
    path.split('/').some(name => name === 'backups' || name.includes('.bak') ||
      /^\.ending-[01]-/.test(name) || /\.(tgz|tar|tar\.gz|partial|tmp)$/.test(name));
}

function validPath(path) {
  if (typeof path !== 'string' || !/^prompts\/(hard_points|gen)\//.test(path) ||
      /[\x00-\x1f\x7f\\]/.test(path) || path.split('/').some(name => !name || name === '.' || name === '..') ||
      excluded(path)) throw new Error(`Invalid content snapshot path: ${JSON.stringify(path)}`);
}

function paths(root) {
  const result = [];
  const decoder = new TextDecoder('utf-8', { fatal: true });
  function walk(path) {
    const stat = checked(root, join(root, path), true);
    if (!stat) return;
    if (!stat.isDirectory()) throw new Error(`Not a directory: ${path}`);
    for (const raw of readdirSync(join(root, path), { encoding: 'buffer' })) {
      let name;
      try { name = decoder.decode(raw); } catch { throw new Error(`Non-UTF-8 filename in ${path}`); }
      const child = `${path}/${name}`;
      if (excluded(child)) continue;
      validPath(child);
      const stat = checked(root, join(root, child));
      if (stat.isDirectory()) walk(child);
      else if (stat.isFile()) result.push(child);
      else throw new Error(`Unsupported content snapshot file: ${child}`);
    }
  }
  walk('prompts/hard_points');
  walk('prompts/gen');
  return sort(result);
}

export function validateSnapshot(value, phase) {
  if (!object(value) || value.format !== format || value.phase !== phase ||
      typeof value.run !== 'string' || !/^[0-9a-f-]{36}$/.test(value.run) ||
      typeof value.root !== 'string' || !isAbsolute(value.root) || resolve(value.root) !== value.root || !object(value.files) ||
      Object.keys(value).sort().join(',') !== 'files,format,phase,root,run') throw new Error(`Invalid ${phase} content snapshot`);
  for (const [path, entry] of Object.entries(value.files)) {
    validPath(path);
    if (!object(entry) || Object.keys(entry).sort().join(',') !== 'sha256,size_bytes' ||
        typeof entry.sha256 !== 'string' || !/^[0-9a-f]{64}$/.test(entry.sha256) ||
        !Number.isSafeInteger(entry.size_bytes) || entry.size_bytes < 0) throw new Error(`Invalid fingerprint: ${path}`);
  }
  return value;
}

export function readSnapshot(dir, phase) {
  const bytes = readRegular(directory(dir), `maj_${phase}.json`);
  return validateSnapshot(JSON.parse(bytes.toString('utf8')), phase);
}

export function captureContent(root, phase, run = randomUUID()) {
  node24();
  root = directory(root);
  const files = Object.create(null);
  const names = paths(root);
  for (const path of names) {
    const bytes = readRegular(root, path);
    files[path] = { sha256: digest(bytes), size_bytes: bytes.length };
  }
  if (JSON.stringify(names) !== JSON.stringify(paths(root))) throw new Error('File set changed during content snapshot');
  for (const path of names) {
    const bytes = readRegular(root, path);
    if (digest(bytes) !== files[path].sha256) throw new Error(`File changed during content snapshot: ${path}`);
  }
  return validateSnapshot({ format, phase, run, root, files }, phase);
}

export function workOutsideSource(root, dir) {
  const rel = relative(resolve(root), directory(dir));
  if (rel === '' || (!isAbsolute(rel) && rel !== '..' && !rel.startsWith(`..${sep}`))) {
    throw new Error('Work directory must be outside SOURCE');
  }
}

export function saveSnapshot(dir, value) {
  workOutsideSource(value.root, dir);
  writeOutput(directory(dir), `maj_${value.phase}.json`, `${JSON.stringify(value, null, 2)}\n`);
}

export function protectReports(dir) {
  dir = directory(dir);
  for (const name of ['maj_before.json', 'maj_after.json', 'maj_diff.json', 'maj_diff.state.json']) {
    const stat = checked(dir, join(dir, name), true);
    if (stat && !stat.isFile()) throw new Error(`Not a regular report file: ${name}`);
  }
  return dir;
}

export function invalidateContentReport(dir) {
  dir = directory(dir);
  const state = checked(dir, join(dir, 'maj_diff.state.json'), true);
  if (state && !state.isFile()) throw new Error('Not a regular report receipt');
  const attempt = beginReport(dir);
  protectReports(dir);
  return attempt;
}
