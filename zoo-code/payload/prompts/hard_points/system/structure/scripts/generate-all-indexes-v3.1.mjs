#!/usr/bin/env node
import { randomUUID } from 'node:crypto';
import { chmodSync, lstatSync, mkdirSync, mkdtempSync, readFileSync, readdirSync, realpathSync, renameSync, rmSync, unlinkSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, isAbsolute, join, relative, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import { generateById } from './generate-index-by-id.mjs';
import { generateByPath, inspect } from './generate-index-by-path.mjs';
import { generateSecondary } from './generate-secondary-index.mjs';
import { generateMaster } from './generate-index-master.mjs';

const specs = [
  ['by-id', /^index-id-[0-9a-f]\.json$/],
  ['by-path', /^index-path-\d+\.json$/],
  ['by-alphabetical', /^index-alpha-\d+\.json$/],
  ['by-directory', /^index-dir-\d+\.json$/],
  ['by-type', /^index-type-[a-z_]+(?:-\d+)?\.json$/],
];
const structure = 'prompts/hard_points/system/structure';

function ensureDirectory(root, path) {
  const found = inspect(root, path);
  if (found) {
    if (!found.isDirectory()) throw new Error(`Not an index directory: ${path}`);
  } else {
    if (!inspect(root, dirname(path))?.isDirectory()) throw new Error(`Missing index parent: ${dirname(path)}`);
    mkdirSync(path);
  }
}

function publish(root, staging) {
  const targetBase = join(root, structure);
  const stageBase = join(staging, structure);
  if (!inspect(root, targetBase)?.isDirectory()) throw new Error(`Missing structure directory: ${targetBase}`);
  const targetIndices = join(targetBase, 'indices');
  ensureDirectory(root, targetIndices);
  const original = new Map();
  const desired = new Map();
  for (const [subdir, pattern] of specs) {
    const target = join(targetIndices, subdir);
    const source = join(stageBase, 'indices', subdir);
    ensureDirectory(root, target);
    for (const name of readdirSync(target).filter(name => pattern.test(name))) {
      const path = join(target, name);
      if (!inspect(root, path)?.isFile()) throw new Error(`Invalid index file: ${path}`);
      original.set(path, { bytes: readFileSync(path), mode: lstatSync(path).mode & 0o777 });
    }
    for (const name of readdirSync(source).filter(name => pattern.test(name))) {
      desired.set(join(target, name), readFileSync(join(source, name)));
    }
  }
  const targetMaster = join(targetBase, 'index.json');
  const masterStat = inspect(root, targetMaster);
  if (masterStat && !masterStat.isFile()) throw new Error(`Invalid master index: ${targetMaster}`);
  if (masterStat) original.set(targetMaster, { bytes: readFileSync(targetMaster), mode: masterStat.mode & 0o777 });
  desired.set(targetMaster, readFileSync(join(stageBase, 'index.json')));
  const staged = new Map();
  const backups = [];
  const installed = [];
  try {
    for (const [path, bytes] of desired) {
      const temp = join(dirname(path), `.index-publish-${randomUUID()}.tmp`);
      writeFileSync(temp, bytes, { flag: 'wx', mode: original.get(path)?.mode ?? 0o644 });
      staged.set(path, temp);
      if (original.has(path)) chmodSync(temp, original.get(path).mode);
    }
    for (const [path, value] of original) {
      const current = inspect(root, path);
      if (!current?.isFile() || (current.mode & 0o777) !== value.mode || !readFileSync(path).equals(value.bytes)) {
        throw new Error(`Index changed during generation: ${path}`);
      }
    }
    for (const path of desired.keys()) {
      if (!original.has(path) && inspect(root, path)) throw new Error(`Index appeared during generation: ${path}`);
    }
    for (const path of original.keys()) {
      const backup = join(targetIndices, `.index-publish-${randomUUID()}.backup`);
      if (inspect(root, backup)) throw new Error(`Index backup already exists: ${backup}`);
      renameSync(path, backup);
      backups.push({ path, backup });
    }
    for (const [path, temp] of staged) {
      renameSync(temp, path);
      installed.push(path);
    }
  } catch (error) {
    const failures = [];
    for (const path of installed.reverse()) {
      try { unlinkSync(path); } catch (failure) { failures.push(failure.message); }
    }
    for (const { path, backup } of backups.reverse()) {
      try { renameSync(backup, path); } catch (failure) { failures.push(failure.message); }
    }
    throw new Error(`${error.message}${failures.length ? `; rollback failed: ${failures.join('; ')}` : ''}`);
  } finally {
    for (const temp of staged.values()) {
      try { unlinkSync(temp); } catch (error) { if (error.code !== 'ENOENT') console.error(`Temporary cleanup failed: ${error.message}`); }
    }
  }
  for (const { backup } of backups) {
    try { unlinkSync(backup); } catch (error) { throw new Error(`Indexes published but backup cleanup failed: ${backup}: ${error.message}`); }
  }
}

export function generateAll(projectRoot) {
  if (Number(process.versions.node.split('.')[0]) < 24) throw new Error('Node.js 24 or newer is required');
  const root = realpathSync(projectRoot);
  const temp = mkdtempSync(join(realpathSync(tmpdir()), 'aikido-index-build-'));
  try {
    const inside = relative(root, temp);
    if (inside === '' || (!isAbsolute(inside) && inside !== '..' && !inside.startsWith(`..${sep}`))) {
      throw new Error('Temporary staging directory must be outside the project');
    }
    mkdirSync(join(temp, structure), { recursive: true });
    const result = generateById(root, temp);
    generateByPath(temp);
    for (const kind of ['alpha', 'directory', 'type']) generateSecondary(temp, kind);
    generateMaster(temp);
    publish(root, temp);
    return result;
  } finally {
    rmSync(temp, { recursive: true, force: true });
  }
}

function isMain() {
  try { return Boolean(process.argv[1]) && realpathSync(process.argv[1]) === realpathSync(fileURLToPath(import.meta.url)); }
  catch { return false; }
}
if (isMain()) {
  try {
    if (process.argv.length > 2) throw new Error('Use PROJECT_ROOT to select the project; no positional arguments accepted');
    if (process.env.USE_PARALLEL === 'true') console.error('USE_PARALLEL is not supported; using Node sequential generation.');
    const root = process.env.PROJECT_ROOT || resolve(dirname(fileURLToPath(import.meta.url)), '../../../../..');
    const result = generateAll(root);
    console.log(`Node sequential index generation complete: ${result.files} files, ${result.batches} by-id batches`);
  } catch (error) {
    console.error(`Index generation failed: ${error.message}`);
    process.exitCode = 1;
  }
}
