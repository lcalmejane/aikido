#!/usr/bin/env node
import { randomBytes } from 'node:crypto';
import {
  closeSync, constants, fstatSync, lstatSync, openSync, readSync, readdirSync,
  realpathSync, renameSync, unlinkSync, writeFileSync,
} from 'node:fs';
import { dirname, basename, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { TextDecoder } from 'node:util';
import { createGitIgnoreContext, isPrivateTaskStorePath } from './git-ignore.mjs';
import {
  assertPublicProjectRoot, isPrivateTaskStoreLocation, isPrivateTaskStoreRoot,
} from './lib/private-task-store.mjs';

const scriptDirectory = dirname(fileURLToPath(import.meta.url));
const builtInExcludes = new Set([
  'node_modules', '.git', 'dist', 'build', '.next', '.nuxt', '.cache',
  'coverage', '.nyc_output', 'temp',
]);
const compare = (left, right) => Buffer.compare(Buffer.from(left), Buffer.from(right));

function requireNode24() {
  const major = Number(process.versions.node.split('.')[0]);
  if (!Number.isInteger(major) || major < 24) {
    throw new Error(`Node.js 24 or newer is required (found ${process.versions.node})`);
  }
}

function isStandardExcluded(path, name) {
  return isPrivateTaskStorePath(path) || builtInExcludes.has(name) || name.startsWith('.env') ||
    /\.(log|tmp|swp|swo)$/.test(name) || name.endsWith('~');
}

function isTextFile(fd) {
  const decoder = new TextDecoder('utf-8', { fatal: true });
  const buffer = Buffer.allocUnsafe(64 * 1024);
  let bytes = 0;
  let text = true;
  let header = '';
  let headerLines = 0;
  let lines = 0;
  let lastByte = -1;
  try {
    for (;;) {
      const count = readSync(fd, buffer, 0, buffer.length, null);
      if (!count) break;
      const chunk = buffer.subarray(0, count);
      bytes += count;
      lastByte = chunk[count - 1];
      try {
        decoder.decode(chunk, { stream: true });
      } catch (error) {
        if (error.code !== 'ERR_ENCODING_INVALID_ENCODED_DATA') throw error;
        text = false;
      }
      for (const byte of chunk) {
        if (byte === 10) lines++;
        if (byte === 0 || (byte < 32 && ![9, 10, 13, 12, 8].includes(byte))) text = false;
      }
      if (headerLines < 10) {
        const textChunk = chunk.toString('utf8');
        let start = 0;
        for (let index = 0; index < textChunk.length && headerLines < 10; index++) {
          if (textChunk[index] === '\n') {
            header += textChunk.slice(start, index + 1);
            start = index + 1;
            headerLines++;
          }
        }
        if (headerLines < 10) header += textChunk.slice(start);
      }
    }
    decoder.decode();
  } catch (error) {
    if (error.code !== 'ERR_ENCODING_INVALID_ENCODED_DATA') throw error;
    text = false;
  }
  if (bytes && lastByte !== 10) lines++;
  return { text: text && bytes > 0, lines, header };
}

function fileMetadata(root, path) {
  const absolute = join(root, ...path.split('/'));
  const beforePath = lstatSync(absolute);
  if (!beforePath.isFile()) throw new Error(`File changed during scan: ${path}`);
  const flags = constants.O_RDONLY | (constants.O_NOFOLLOW || 0);
  const fd = openSync(absolute, flags);
  try {
    const before = fstatSync(fd);
    if (!before.isFile()) throw new Error(`Not a regular file: ${path}`);
    const { text, lines, header } = isTextFile(fd);
    const after = fstatSync(fd);
    if (before.dev !== after.dev || before.ino !== after.ino ||
        before.size !== after.size || before.mtimeMs !== after.mtimeMs) {
      throw new Error(`File changed during scan: ${path}`);
    }
    const name = basename(path);
    const extension = name.includes('.') ? name.slice(name.lastIndexOf('.') + 1) : name;
    let icon = '📄';
    let type = 'file';
    if (extension === 'md' || extension === 'mdx') {
      const parent = path.slice(0, Math.max(0, path.lastIndexOf('/')));
      if (parent.includes('/personas') || path.includes('/agents/')) [icon, type] = ['🤖', 'agent'];
      else if (parent.includes('/concepts')) [icon, type] = ['💡', 'concept'];
      else if (parent.includes('/techniques')) [icon, type] = ['⚡', 'technique'];
      else if (parent.includes('/use_cases')) [icon, type] = ['🎯', 'use_case'];
      else if (parent.includes('/hard_points')) [icon, type] = ['🔒', 'hard_point'];
      else [icon, type] = ['📄', 'markdown'];
    } else     if (['sh', 'mjs', 'js', 'cjs'].includes(extension)) {
      [icon, type] = ['🔧', 'script'];
    } else if (extension === 'json') {
      [icon, type] = ['⚙️', 'config'];
    }
    let checkStatus = '❌ no-header';
    if (text) {
      if (!path.startsWith('prompts/')) checkStatus = 'N/A';
      else if (['md', 'mdx'].includes(extension)) {
        if (header.includes('last-check:')) checkStatus = '✅';
        else if (/^---\s*$/m.test(header)) checkStatus = '⚠️ no-lastcheck';
      }
    } else {
      checkStatus = '❌ binary';
    }
    const modified = new Date(before.mtimeMs).toISOString().slice(0, 10);
    return {
      name, path, type, icon, size_bytes: before.size, lines: text ? lines : 0, modified,
      check_status: checkStatus, extension,
    };
  } finally {
    closeSync(fd);
  }
}

function collectTree(root) {
  const gitIgnore = createGitIgnoreContext(root);
  const files = [];
  let totalDirectories = 1;
  const pending = [''];
  let gitignoreCount = 0;
  try {
    const decoder = new TextDecoder('utf-8', { fatal: true });
    while (pending.length) {
      const directory = pending.pop();
      const absolute = directory ? join(root, ...directory.split('/')) : root;
      const candidates = [];
      for (const entry of readdirSync(absolute, { withFileTypes: true, encoding: 'buffer' })) {
        let name;
        try { name = decoder.decode(entry.name); } catch {
          throw new Error(`Non-UTF-8 filename in ${absolute}`);
        }
        const path = directory ? `${directory}/${name}` : name;
        if (name === '.gitignore') gitignoreCount++;
        if (isStandardExcluded(path, name)) continue;
        if (!entry.isDirectory() && !entry.isFile()) continue;
        if (entry.isDirectory() && isPrivateTaskStoreRoot(join(root, ...path.split('/')))) continue;
        candidates.push({ path, name, directory: entry.isDirectory() });
      }
      const ignored = gitIgnore.ignored(candidates.map(item => item.path));
      for (const item of candidates) {
        if (ignored.has(item.path)) continue;
        if (item.directory) {
          totalDirectories++;
          pending.push(item.path);
        } else {
          files.push(fileMetadata(root, item.path));
        }
      }
    }
  } finally {
    gitIgnore.close();
  }
  files.sort((left, right) => compare(left.path, right.path));
  const byPath = Object.create(null);
  const byDirectory = Object.create(null);
  const byType = Object.create(null);
  const byName = Object.create(null);
  let totalLines = 0;
  for (const metadata of files) {
    byPath[metadata.path] = metadata;
    totalLines += metadata.lines;
    const directory = metadata.path.includes('/') ? metadata.path.slice(0, metadata.path.lastIndexOf('/')) : '.';
    (byDirectory[directory] ??= { files: [] }).files.push(metadata.path);
    (byType[metadata.type] ??= []).push(metadata.path);
    (byName[metadata.name] ??= []).push(metadata.path);
  }
  return {
    byPath,
    byDirectory,
    byType,
    byName,
    statistics: { total_files: files.length, total_dirs: totalDirectories, total_lines: totalLines },
    gitignoreCount,
  };
}

function publish(outputPath, json) {
  const absolute = resolve(outputPath);
  const parent = dirname(absolute);
  try {
    const current = lstatSync(absolute);
    if (current.isSymbolicLink() || !current.isFile()) {
      throw new Error(`Refusing to replace non-regular output: ${absolute}`);
    }
  } catch (error) {
    if (error.code !== 'ENOENT') throw error;
  }
  const temporary = join(parent, `.${basename(absolute)}.${process.pid}.${randomBytes(8).toString('hex')}.tmp`);
  let fd;
  try {
    fd = openSync(temporary, 'wx', 0o600);
    writeFileSync(fd, json, 'utf8');
    closeSync(fd);
    fd = undefined;
    renameSync(temporary, absolute);
  } catch (error) {
    if (fd !== undefined) closeSync(fd);
    try { unlinkSync(temporary); } catch {}
    throw error;
  }
}

export function generateProjectTree({
  projectRoot = process.env.PROJECT_ROOT || resolve(scriptDirectory, '../../../../..'),
  outputFile = 'prompts/hard_points/system/structure/index.json',
  now = new Date(),
} = {}) {
  requireNode24();
  const root = assertPublicProjectRoot(resolve(projectRoot));
  if (!lstatSync(root).isDirectory()) throw new Error(`PROJECT_ROOT is not a directory: ${root}`);
  const tree = collectTree(root);
  const localTimestamp = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}:${String(now.getSeconds()).padStart(2, '0')}`;
  const payload = {
    metadata: {
      last_check: {
        timestamp: now.toISOString(),
        status: '✅',
        generator: 'agent-aikido-projet-index',
        version: '2.1',
        sources: ['scripts/generate-project-tree.mjs'],
      },
      generated: localTimestamp,
      statistics: tree.statistics,
      exclusions: { gitignore_count: tree.gitignoreCount },
    },
    index: {
      by_path: tree.byPath,
      by_directory: tree.byDirectory,
      by_type: tree.byType,
      by_name: tree.byName,
    },
  };
  const json = `${JSON.stringify(payload, null, 2)}\n`;
  const outputPath = resolve(outputFile);
  if (isPrivateTaskStoreLocation(outputPath)) {
    throw new Error('Generated indexes cannot be written inside a private Task Store');
  }
  publish(outputPath, json);
  return { outputFile: resolve(outputFile), outputSize: Buffer.byteLength(json), ...tree.statistics };
}

function humanSize(bytes) {
  if (bytes < 1024) return `${bytes}B`;
  const units = ['K', 'M', 'G', 'T', 'P'];
  let value = bytes;
  let unit = -1;
  do {
    value /= 1024;
    unit++;
  } while (value >= 1024 && unit < units.length - 1);
  return `${value.toFixed(1)}${units[unit]}`;
}

function main(args) {
  try {
    requireNode24();
    if (args.length === 1 && (args[0] === '--help' || args[0] === '-h')) {
      process.stdout.write('Usage: generate-project-tree.mjs [output-file]\n');
      return;
    }
    if (args.length > 1) throw new Error('Expected at most one output-file argument');
    if (args[0]?.startsWith('-')) throw new Error('Unknown option; prefix a filename beginning with "-" with "./"');
    process.stderr.write('🚀 Generating AI-KIDO JSON index...\n');
    const result = generateProjectTree({ outputFile: args[0] });
    process.stderr.write(`📂 Racine: ${realpathSync(resolve(process.env.PROJECT_ROOT || resolve(scriptDirectory, '../../../../..')))}\n`);
    process.stderr.write(`✅ Done! ${result.total_files} files, ${result.total_dirs} directories → ${result.outputFile}\n`);
    process.stdout.write(`📏 Taille: ${humanSize(result.outputSize)}\n`);
  } catch (error) {
    process.stderr.write(`Error: ${error.message}\n`);
    process.exitCode = 1;
  }
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main(process.argv.slice(2));
}
