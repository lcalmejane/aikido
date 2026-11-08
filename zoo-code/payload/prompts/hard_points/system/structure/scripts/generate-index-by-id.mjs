#!/usr/bin/env node
import { createHash } from 'node:crypto';
import { closeSync, constants, fstatSync, lstatSync, mkdirSync, openSync, readSync, readdirSync, realpathSync } from 'node:fs';
import { createGitIgnoreContext, isPrivateTaskStorePath } from './git-ignore.mjs';
import {
  assertPublicProjectRoot, isPrivateTaskStoreLocation, isPrivateTaskStoreRoot,
} from './lib/private-task-store.mjs';
import { dirname, join, posix, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { inspect, publishBatches } from './generate-index-by-path.mjs';

const prefixes = '0123456789abcdef';
const excludedNames = new Set(['.git', 'node_modules', 'dist', 'build', '.next', '.nuxt',
  '.cache', 'coverage', '.nyc_output', 'temp']);
const indexRoot = 'prompts/hard_points/system/structure/indices';
const master = 'prompts/hard_points/system/structure/index.json';
const compare = (a, b) => Buffer.compare(Buffer.from(a), Buffer.from(b));

function excluded(path, name) {
  return isPrivateTaskStorePath(path) || excludedNames.has(name) || name.startsWith('.env') || /\.(log|tmp|swp|swo)$/.test(name) ||
    name.endsWith('~') || path === indexRoot || path.startsWith(`${indexRoot}/`) || path === master;
}

function discover(root, gitIgnore) {
  const files = [];
  let pending = [''];
  const decoder = new TextDecoder('utf-8', { fatal: true });
  while (pending.length) {
    const candidates = [];
    for (const parent of pending) {
      const absolute = join(root, parent);
      if (!inspect(root, absolute)?.isDirectory()) throw new Error(`Directory changed during scan: ${absolute}`);
      for (const entry of readdirSync(absolute, { withFileTypes: true, encoding: 'buffer' })) {
        let name;
        try { name = decoder.decode(entry.name); } catch { throw new Error(`Non-UTF-8 filename in ${absolute}`); }
        const path = parent ? `${parent}/${name}` : name;
        if (name.includes('\\') || name.includes('\0') || /^[a-zA-Z]:/.test(path)) {
          throw new Error(`Unsupported filename: ${JSON.stringify(path)}`);
        }
        if (excluded(path, name)) continue;
        if (!entry.isDirectory() && !entry.isFile()) continue;
        if (entry.isDirectory() && isPrivateTaskStoreRoot(join(root, ...path.split('/')))) continue;
        candidates.push({ path, directory: entry.isDirectory() });
      }
    }
    const ignored = gitIgnore.ignored(candidates.map(item => item.path));
    const next = [];
    for (const item of candidates) {
      if (ignored.has(item.path)) continue;
      if (item.directory) next.push(item.path);
      else files.push(item.path);
    }
    pending = next;
  }
  return files.sort(compare);
}

function category(path, name) {
  const extension = name.includes('.') ? name.slice(name.lastIndexOf('.') + 1) : name;
  if (extension === 'md' || extension === 'mdx') {
    if (path.includes('/personas/') || path.includes('/agents/')) return ['🤖', 'agent', extension];
    if (path.includes('/concepts/')) return ['💡', 'concept', extension];
    if (path.includes('/techniques/')) return ['⚡', 'technique', extension];
    if (path.includes('/use_cases/')) return ['🎯', 'use_case', extension];
    if (path.includes('/hard_points/')) return ['🔒', 'hard_point', extension];
    return ['📄', 'markdown', extension];
  }
  if (['sh', 'mjs', 'js', 'cjs'].includes(extension)) return ['🔧', 'script', extension];
  if (extension === 'json') return ['⚙️', 'config', extension];
  return ['📄', 'file', extension];
}

function metadata(root, path) {
  const absolute = join(root, path);
  if (!inspect(root, absolute)?.isFile()) throw new Error(`File changed during scan: ${absolute}`);
  const fd = openSync(absolute, constants.O_RDONLY | (constants.O_NOFOLLOW || 0));
  try {
    const before = fstatSync(fd);
    if (!before.isFile()) throw new Error(`Not a regular file: ${absolute}`);
    const buffer = Buffer.allocUnsafe(64 * 1024);
    let bytes = 0, lines = 0, headerLines = 0, sample = 0;
    let binary = false, lastByte = -1, headerTail = '', hasLastCheck = false, startsFrontmatter = false;
    for (;;) {
      const count = readSync(fd, buffer, 0, buffer.length, null);
      if (!count) break;
      const chunk = buffer.subarray(0, count);
      if (bytes === 0) startsFrontmatter = chunk.subarray(0, 3).toString('ascii') === '---';
      for (let i = 0; i < count; i++) {
        const value = chunk[i];
        if (sample < 8192) {
          if (value < 32 && ![9, 10, 13].includes(value)) binary = true;
          sample++;
        }
        if (value === 10) lines++;
      }
      if (headerLines < 10) {
        let end = 0;
        while (end < count && headerLines < 10) {
          if (chunk[end++] === 10) headerLines++;
        }
        const header = headerTail + chunk.subarray(0, end).toString('utf8');
        if (header.includes('last-check:')) hasLastCheck = true;
        headerTail = header.slice(-10);
      }
      bytes += count;
      lastByte = chunk[count - 1];
    }
    const after = fstatSync(fd);
    const current = lstatSync(absolute);
    if (!current.isFile() || current.dev !== after.dev || current.ino !== after.ino ||
        before.size !== after.size || before.mtimeMs !== after.mtimeMs || bytes !== after.size) {
      throw new Error(`File changed during scan: ${absolute}`);
    }
    if (bytes && lastByte !== 10) lines++;
    const name = posix.basename(path);
    const [icon, type, extension] = category(path, name);
    let checkStatus = 'N/A';
    if (binary) checkStatus = '❌ binary';
    else if (path.startsWith('prompts/') && ['md', 'mdx'].includes(extension)) {
      checkStatus = hasLastCheck ? '✅' : startsFrontmatter ? '⚠️ no-lastcheck' : '❌ no-header';
    }
    return { name, path, type, icon, size_bytes: bytes, lines: binary ? 0 : lines,
      modified: after.mtime.toISOString().slice(0, 10), check_status: checkStatus, extension };
  } finally { closeSync(fd); }
}

export function generateById(projectRoot, outputRoot = projectRoot) {
  if (Number(process.versions.node.split('.')[0]) < 24) throw new Error('Node.js 24 or newer is required');
  const root = assertPublicProjectRoot(projectRoot);
  const destination = realpathSync(outputRoot);
  if (isPrivateTaskStoreLocation(destination)) {
    throw new Error('Generated indexes cannot be written inside a private Task Store');
  }
  if (!lstatSync(root).isDirectory()) throw new Error(`Not a project directory: ${root}`);
  const gitIgnore = createGitIgnoreContext(root);
  try {
    const paths = discover(root, gitIgnore);
    const files = new Map([...prefixes].map(prefix => [prefix, Object.create(null)]));
    for (const path of paths) {
      const id = createHash('sha256').update(path).digest('hex').slice(0, 12);
      const batch = files.get(id[0]);
      if (Object.hasOwn(batch, id)) throw new Error(`Hash collision: ${path} and ${batch[id].path}`);
      batch[id] = metadata(root, path);
    }
    const base = join(destination, indexRoot);
    if (!inspect(destination, base)) {
      if (!inspect(destination, dirname(base))?.isDirectory()) throw new Error(`Missing structure directory: ${dirname(base)}`);
      mkdirSync(base);
    } else if (!inspect(destination, base).isDirectory()) throw new Error(`Invalid indices directory: ${base}`);
    const generated = new Date().toISOString();
    const batches = new Map([...files].map(([prefix, entries]) => [`index-id-${prefix}.json`, {
      metadata: { batch_id: `id-${prefix}`, id_prefix: prefix, count: Object.keys(entries).length, generated },
      files: entries,
    }]));
    publishBatches(destination, join(base, 'by-id'), batches, [], 'id');
    return { files: paths.length, batches: batches.size };
  } finally {
    gitIgnore.close();
  }
}

function isMain() {
  try { return Boolean(process.argv[1]) && realpathSync(process.argv[1]) === realpathSync(fileURLToPath(import.meta.url)); }
  catch { return false; }
}
if (isMain()) {
  try {
    if (process.argv.length > 2) throw new Error('Use PROJECT_ROOT to select the project; no positional arguments accepted');
    const defaultRoot = resolve(dirname(fileURLToPath(import.meta.url)), '../../../../..');
    const result = generateById(process.env.PROJECT_ROOT || defaultRoot);
    console.log(`by-id index generated: ${result.files} files, ${result.batches} batches`);
  } catch (error) {
    console.error(`by-id generation failed: ${error.message}`);
    process.exitCode = 1;
  }
}
