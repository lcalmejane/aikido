#!/usr/bin/env node
import {
  chmodSync, copyFileSync, constants, lstatSync, mkdirSync,
  openSync, readFileSync, readdirSync, realpathSync, renameSync, unlinkSync,
  writeFileSync, fsyncSync, closeSync,
} from 'node:fs';
import { basename, dirname, join, parse, resolve, sep } from 'node:path';
import { randomUUID } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { isPrivateTaskStoreLocation } from '../../structure/scripts/lib/private-task-store.mjs';

const ROOT_FILES = Object.freeze([
  'AGENTS.md', 'CLAUDE.md', 'commands_list.md', 'agents_list.md',
  'skills_list.md', '.roomodes',
]);
const MAPPING_DIRS = Object.freeze({
  commands: ['.roo/commands', '.claude/commands'],
  agents: ['.claude/agents'],
});
const RESERVED_PROMPT_DIRS = new Set(['gen', 'hard_points', 'spec']);

export function requireNode24() {
  const major = Number(process.versions.node.split('.')[0]);
  if (!Number.isInteger(major) || major < 24) {
    throw new Error('These MAJ tools require Node.js 24 or newer');
  }
}

function assertSafePathString(value, label) {
  if (typeof value !== 'string' || value.length === 0 || /[\0-\x1f\x7f]/.test(value)) {
    throw new Error(`${label} must be a non-empty path without control characters`);
  }
}

function ensureDirectory(path, { create = false, projectRoot = false } = {}) {
  const absolute = resolve(path);
  const root = parse(absolute).root;
  const segments = absolute.slice(root.length).split(sep).filter(Boolean);
  let current = root;
  for (const segment of segments) {
    current = join(current, segment);
    let stat;
    try {
      stat = lstatSync(current);
    } catch (error) {
      if (error.code !== 'ENOENT' || !create) throw error;
      mkdirSync(current);
      stat = lstatSync(current);
    }
    if (stat.isSymbolicLink() || !stat.isDirectory()) {
      throw new Error(`Unsafe directory (symlink or non-directory): ${current}`);
    }
  }
  if (projectRoot && absolute === root) throw new Error('Filesystem root is not a valid project directory');
  return realpathSync(absolute);
}

function maybeDirectory(path, label) {
  const absolute = resolve(path);
  const root = parse(absolute).root;
  const segments = absolute.slice(root.length).split(sep).filter(Boolean);
  let current = root;
  for (const segment of segments) {
    current = join(current, segment);
    let stat;
    try {
      stat = lstatSync(current);
    } catch (error) {
      if (error.code === 'ENOENT') return null;
      throw error;
    }
    if (stat.isSymbolicLink() || !stat.isDirectory()) {
      throw new Error(`Unsafe ${label} directory: ${current}`);
    }
  }
  return realpathSync(absolute);
}

function regularFile(path, { label = 'file', optional = false } = {}) {
  try {
    const stat = lstatSync(path);
    if (stat.isSymbolicLink() || !stat.isFile()) {
      throw new Error(`Unsafe ${label} (expected a regular file, not a symlink): ${path}`);
    }
    return stat;
  } catch (error) {
    if (optional && error.code === 'ENOENT') return null;
    throw error;
  }
}

function projectRoot(path) {
  assertSafePathString(path, 'Project directory');
  const root = ensureDirectory(path, { projectRoot: true });
  if (isPrivateTaskStoreLocation(root)) throw new Error('Private Task Store data cannot be a migration project root');
  return root;
}

function promptsDirectory(root, { create = false } = {}) {
  const prompts = join(root, 'prompts');
  const found = maybeDirectory(prompts, 'prompts');
  if (found) return found;
  if (!create) throw new Error(`Missing prompts directory: ${prompts}`);
  return ensureDirectory(prompts, { create: true });
}

function validProjectName(name) {
  const lower = typeof name === 'string' ? name.toLowerCase() : '';
  return typeof name === 'string'
    && /^[A-Za-z0-9][A-Za-z0-9._-]*$/.test(name)
    && name !== '.' && name !== '..'
    && !name.endsWith('.')
    && !/^(con|prn|aux|nul|com[1-9]|lpt[1-9])(?:\..*)?$/i.test(name)
    && ![...RESERVED_PROMPT_DIRS].some((reserved) => reserved.toLowerCase() === lower);
}

function projectNames(root, supplied = []) {
  if (!Array.isArray(supplied)) throw new Error('Project names must be an array');
  const names = supplied.length ? supplied : [];
  if (!names.length) throw new Error('MULTI mode requires at least one project name');
  const unique = new Set();
  const result = [];
  for (const name of names) {
    if (!validProjectName(name)) {
      throw new Error(`Invalid project name (expected one safe path component): ${name}`);
    }
    const key = name.toLowerCase();
    if (unique.has(key)) throw new Error(`Duplicate project name: ${name}`);
    unique.add(key);
    result.push(name);
    const directory = join(root, 'prompts', name);
    maybeDirectory(directory, `project ${name}`);
  }
  return result;
}

function writeAtomic(path, content, mode = 0o644) {
  const existing = regularFile(path, { label: 'output file', optional: true });
  const temporary = `${path}.aikido-${randomUUID()}.tmp`;
  let descriptor;
  try {
    descriptor = openSync(temporary, constants.O_WRONLY | constants.O_CREAT | constants.O_EXCL, 0o600);
    writeFileSync(descriptor, content);
    chmodSync(temporary, existing ? existing.mode & 0o777 : mode);
    fsyncSync(descriptor);
    closeSync(descriptor);
    descriptor = undefined;
    regularFile(temporary, { label: 'staged output' });
    regularFile(path, { label: 'output file', optional: true });
    renameSync(temporary, path);
  } finally {
    if (descriptor !== undefined) closeSync(descriptor);
    try { unlinkSync(temporary); } catch (error) { if (error.code !== 'ENOENT') throw error; }
  }
}

function writeExclusive(path, content) {
  const descriptor = openSync(path, constants.O_WRONLY | constants.O_CREAT | constants.O_EXCL, 0o600);
  try {
    writeFileSync(descriptor, content);
    fsyncSync(descriptor);
  } catch (error) {
    closeSync(descriptor);
    try { unlinkSync(path); } catch { }
    throw error;
  }
  closeSync(descriptor);
}

export function writePhaseLog(sourceDir, content) {
  requireNode24();
  const root = projectRoot(sourceDir);
  const logs = ensureDirectory(join(root, 'prompts', 'spec', 'logs'), { create: true });
  const stem = `phase-8-${timestamp()}.log`;
  for (let attempt = 0; attempt < 64; attempt++) {
    const name = attempt ? `phase-8-${timestamp()}-${attempt}.log` : stem;
    const path = join(logs, name);
    try {
      writeExclusive(path, content);
      return path;
    } catch (error) {
      if (error.code !== 'EEXIST') throw error;
    }
  }
  throw new Error('Could not allocate a unique phase-8 log filename');
}

function indexPath(root, projectName) {
  const base = projectName ? join(root, 'prompts', projectName) : join(root, 'prompts');
  if (projectName) ensureDirectory(base, { create: true });
  else promptsDirectory(root);
  return join(base, 'index.md');
}

export function generateMonoIndex(sourceDir = '.') {
  requireNode24();
  const root = projectRoot(sourceDir);
  const output = indexPath(root);
  const content = `# AI-KIDO Knowledge Base

> **Version**: 1.3 | **Entry Point**: \`/prompts/index.md\` (UNIFIED since V1.3)

This file is the **SINGLE entry point** of the AI‑KIDO project **Truth Tables**.

## Truth Tables System

The **Truth Tables** are our tree-structured memory system for capitalizing on and structuring AI‑KIDO knowledge in a hierarchical, interconnected way.

### ⚠️ PRIORITY RULES - AI-KIDO

**[AI-KIDO - Complete Guide](hard_points/ai-kido.md)** - ABSOLUTE PRIORITY (V1.3)

- **Architecture**: Tree structure, theory/practice separation, introspection, 500 lines max
- **Self-Feeding**: Automatic trigger on error, adaptive thresholds
- **Agents**: Specialists + orchestrator, semantic density, vector indexing
- **Continuous Improvement**: Automatic evolution based on needs and LLM

## Structure

- [\`gen/concepts/\`](gen/concepts/index.md) : Core concepts
- [\`gen/techniques/\`](gen/techniques/index.md) : Practical methods
- [\`gen/personas/\`](gen/personas/index.md) : Role-based prompts
- [\`gen/use_cases/\`](gen/use_cases/index.md) : Context-based applications
- [\`hard_points/\`](hard_points/index.md) : Immutable truths – Absolute priority
  - [\`hard_points/system/\`](hard_points/system/) : System tools and skills
- [\`spec/\`](spec/index.md) : Personal space – Ignored unless explicitly enabled
`;
  replaceIndexes([{ path: output, content }]);
  return { path: output };
}

function globalMultiIndex(names) {
  const list = names.map((name) => `- **[${name}](${name}/index.md)** : Entry point of project ${name}`).join('\n');
  return `# AI-KIDO Knowledge Base – Multi-Projet

> **Version**: 1.3 | **Type**: MULTI-PROJECT | **Entry Point**: \`/prompts/index.md\`

This file is the **global entry point** for an AI‑KIDO **multi-project** environment.

## Navigation par Projet

This workspace contains several AI‑KIDO projects. Select a project to access its Memory Bank:

${list}

## Hard Points Communs

Hard points (immutable truths) are shared across all projects:

- [\`hard_points/ai-kido.md\`](hard_points/ai-kido.md) : Complete AI-KIDO guide
- [\`hard_points/system/\`](hard_points/system/) : System tools and skills

---

*Global multi-project index generated automatically by /maj-aikido*
`;
}

function projectMultiIndex(name) {
  return `# AI-KIDO Knowledge Base – Projet ${name}

> **Version**: 1.3 | **Projet** : ${name} | **Type** : Mono-projet dans multi-workspace

This file is the **project-specific entry point** of project **${name}**.

## Structure du Projet

- [\`gen/concepts/\`](gen/concepts/index.md) : Core concepts
- [\`gen/techniques/\`](gen/techniques/index.md) : Practical methods
- [\`gen/personas/\`](gen/personas/index.md) : Role-based prompts
- [\`gen/use_cases/\`](gen/use_cases/index.md) : Context-based applications
- [\`gen/index.md\`](gen/index.md) : Detailed internal navigation

## Hard Points (Shared)

Immutable truths are common to all projects:

- [AI-KIDO Guide](../../hard_points/ai-kido.md)
- [System](../../hard_points/system/)

## Retour

- [← Index Global](../index.md) : Back to the project list

---

*Project index generated automatically by /maj-aikido*
`;
}

export function generateMultiIndex(sourceDir = '.', suppliedNames = []) {
  requireNode24();
  const root = projectRoot(sourceDir);
  const prompts = promptsDirectory(root);
  const names = projectNames(root, suppliedNames);
  const global = join(prompts, 'index.md');
  regularFile(global, { label: 'global index', optional: true });
  for (const name of names) {
    regularFile(join(prompts, name, 'index.md'), { label: `project index ${name}`, optional: true });
  }
  const created = names.map((name) => indexPath(root, name));
  replaceIndexes([
    { path: global, content: globalMultiIndex(names) },
    ...created.map((path, index) => ({ path, content: projectMultiIndex(names[index]) })),
  ]);
  return { path: global, projects: created };
}

function replaceIndexes(outputs) {
  const changed = outputs.filter(({ path, content }) => {
    const existing = regularFile(path, { label: 'output file', optional: true });
    return !existing || !readFileSync(path).equals(Buffer.from(content));
  });
  // Preserve every existing index before starting any replacement.
  for (const { path } of changed) {
    if (regularFile(path, { label: 'output file', optional: true })) backupName(path, () => {});
  }
  for (const { path, content } of changed) writeAtomic(path, content);
}

export function validateIndexes(sourceDir = '.', type = 'MONO', suppliedNames = []) {
  requireNode24();
  const root = projectRoot(sourceDir);
  if (!['MONO', 'MULTI'].includes(type)) throw new Error(`Invalid project type: ${type}`);
  const prompts = promptsDirectory(root);
  const global = join(prompts, 'index.md');
  regularFile(global, { label: 'main index' });
  const globalText = readFileSync(global, 'utf8');
  if (type === 'MONO') {
    if (!globalText.includes('**Version**: 1.3') || !globalText.includes('SINGLE entry point')) {
      throw new Error('Main index does not contain the V1.3 mono-project entry point');
    }
    return { type, checked: [global] };
  }
  if (!globalText.includes('**Version**: 1.3') || !globalText.includes('MULTI-PROJECT')) {
    throw new Error('Global index does not identify a V1.3 multi-project workspace');
  }
  const names = projectNames(root, suppliedNames);
  const checked = [global];
  for (const name of names) {
    const path = join(prompts, name, 'index.md');
    regularFile(path, { label: `project index ${name}` });
    const content = readFileSync(path, 'utf8');
    if (!content.includes('**Version**: 1.3') || !content.includes(`Projet ${name}`) || !content.includes('../index.md')) {
      throw new Error(`Project index is incomplete: ${path}`);
    }
    if (!globalText.includes(`(${name}/index.md)`)) {
      throw new Error(`Global index does not link to project ${name}`);
    }
    checked.push(path);
  }
  return { type, checked };
}

function listMarkdownFiles(root) {
  const absolute = resolve(root);
  const rootDir = maybeDirectory(absolute, 'source mapping');
  if (!rootDir || isPrivateTaskStoreLocation(rootDir)) return [];
  const files = [];
  function walk(directory, relative = '') {
    const entries = readdirSync(directory, { withFileTypes: true })
      .sort((left, right) => left.name.localeCompare(right.name));
    for (const entry of entries) {
      const path = join(directory, entry.name);
      const rel = relative ? join(relative, entry.name) : entry.name;
      const stat = lstatSync(path);
      if (stat.isSymbolicLink()) continue;
      if (isPrivateTaskStoreLocation(path)) continue;
      if (stat.isDirectory()) walk(path, rel);
      else if (stat.isFile() && entry.name.endsWith('.md')) files.push({ path, relative: rel, name: entry.name, mode: stat.mode });
    }
  }
  walk(rootDir);
  const names = new Set();
  for (const file of files) {
    if (names.has(file.name)) throw new Error(`Flattening mapping files would collide: ${file.name}`);
    names.add(file.name);
  }
  return files;
}

function timestamp(date = new Date()) {
  const pad = (value, width = 2) => String(value).padStart(width, '0');
  return `${date.getFullYear()}${pad(date.getMonth() + 1)}${pad(date.getDate())}`
    + `-${pad(date.getHours())}${pad(date.getMinutes())}${pad(date.getSeconds())}`
    + `-${pad(date.getMilliseconds(), 3)}`;
}

function backupName(path, log) {
  const stem = `${path}.bak.${timestamp()}`;
  for (let attempt = 0; attempt < 64; attempt++) {
    const candidate = attempt ? `${stem}-${attempt}` : stem;
    try {
      copyFileSync(path, candidate, constants.COPYFILE_EXCL);
      log(`    📦 Backup : ${basename(candidate)}`);
      return candidate;
    } catch (error) {
      if (error.code !== 'EEXIST') throw error;
    }
  }
  throw new Error(`Could not allocate a unique backup name for ${path}`);
}

function copyAtomic(source, destination, { backup = false, log = () => {} } = {}) {
  if (isPrivateTaskStoreLocation(source) || isPrivateTaskStoreLocation(destination)) {
    throw new Error('Private Task Store data cannot be copied or backed up');
  }
  const sourceStat = regularFile(source, { label: 'source file' });
  const destinationStat = regularFile(destination, { label: 'destination file', optional: true });
  if (backup && destinationStat) {
    backupName(destination, log);
  }
  const bytes = readFileSync(source);
  writeAtomic(destination, bytes, sourceStat.mode & 0o777);
}

export function deployMappings(kind, targetPath, sourcePath, log = () => {}) {
  requireNode24();
  if (!MAPPING_DIRS[kind]) throw new Error(`Unknown deployment kind: ${kind}`);
  assertSafePathString(targetPath, 'TARGET');
  assertSafePathString(sourcePath, 'SOURCE');
  const target = projectRoot(targetPath);
  const source = projectRoot(sourcePath);
  if (target === source) throw new Error('TARGET and SOURCE must be different project directories');
  let count = 0;
  for (const relative of MAPPING_DIRS[kind]) {
    const sourceDir = join(target, relative);
    const files = listMarkdownFiles(sourceDir);
    const destinationDir = join(source, relative);
    ensureDirectory(destinationDir, { create: true });
    if (!files.length) {
      log(`  ℹ️  No file found in TARGET/${relative}`);
      continue;
    }
    log(`  Copying ${files.length} file(s) from TARGET/${relative} → SOURCE/${relative}...`);
    for (const file of files) {
      const destination = join(destinationDir, file.name);
      copyAtomic(file.path, destination, { backup: true, log });
      log(`    ✅ ${file.name}`);
      count++;
    }
  }
  return { count };
}

function deployRootFiles(targetPath, sourcePath, log = () => {}) {
  requireNode24();
  assertSafePathString(targetPath, 'TARGET');
  assertSafePathString(sourcePath, 'SOURCE');
  const target = projectRoot(targetPath);
  const source = projectRoot(sourcePath);
  if (target === source) throw new Error('TARGET and SOURCE must be different project directories');
  let count = 0;
  for (const name of ROOT_FILES) {
    const from = join(target, name);
    const fromStat = regularFile(from, { label: `TARGET/${name}`, optional: true });
    if (!fromStat) {
      log(`  ℹ️  ${name}${name === '.roomodes' ? ' (optional, not present in TARGET)' : ' (not present in TARGET)'}`);
      continue;
    }
    const to = join(source, name);
    copyAtomic(from, to, { backup: true, log });
    log(`  ✅ ${name}`);
    count++;
  }
  return { count };
}

function compareMappingDirectory(target, source, relative, issues) {
  const files = listMarkdownFiles(join(target, relative));
  const destination = join(source, relative);
  if (!files.length) return;
  const destinationRoot = maybeDirectory(destination, `SOURCE/${relative}`);
  if (!destinationRoot) {
    issues.push(`Missing directory SOURCE/${relative}`);
    return;
  }
  for (const file of files) {
    const targetFile = join(destinationRoot, file.name);
    const stat = regularFile(targetFile, { label: `SOURCE/${relative}/${file.name}`, optional: true });
    if (!stat) {
      issues.push(`Missing file SOURCE/${relative}/${file.name}`);
      continue;
    }
    if (!readFileSync(file.path).equals(readFileSync(targetFile))) {
      issues.push(`Content differs: SOURCE/${relative}/${file.name}`);
    }
  }
}

export function validateDeployment(targetPath, sourcePath) {
  requireNode24();
  assertSafePathString(targetPath, 'TARGET');
  assertSafePathString(sourcePath, 'SOURCE');
  const target = projectRoot(targetPath);
  const source = projectRoot(sourcePath);
  if (target === source) throw new Error('TARGET and SOURCE must be different project directories');
  const issues = [];
  for (const relative of [...MAPPING_DIRS.commands, ...MAPPING_DIRS.agents]) {
    compareMappingDirectory(target, source, relative, issues);
  }
  for (const name of ROOT_FILES) {
    const from = regularFile(join(target, name), { label: `TARGET/${name}`, optional: true });
    if (!from) continue;
    const toPath = join(source, name);
    const to = regularFile(toPath, { label: `SOURCE/${name}`, optional: true });
    if (!to) issues.push(`Missing file SOURCE/${name}`);
    else if (!readFileSync(join(target, name)).equals(readFileSync(toPath))) {
      issues.push(`Content differs: SOURCE/${name}`);
    }
  }
  return { passed: issues.length === 0, issues, status: issues.length ? `WARNINGS: ${issues.length} issue(s)` : 'PASSED' };
}

function pathForSync(value, label, { optional = false, createParent = false } = {}) {
  assertSafePathString(value, label);
  const absolute = resolve(value);
  let parent;
  try {
    parent = ensureDirectory(dirname(absolute), { create: createParent });
  } catch (error) {
    if (optional && error.code === 'ENOENT') return { path: absolute, stat: null };
    throw error;
  }
  const path = join(parent, basename(absolute));
  return { path, stat: regularFile(path, { label, optional }) };
}

function backupSyncTarget(target, log) {
  const directory = join(dirname(target), '.backup');
  ensureDirectory(directory, { create: true });
  const file = join(directory, basename(target));
  const stem = `${file}.${timestamp()}.bak`;
  for (let attempt = 0; attempt < 64; attempt++) {
    const candidate = attempt ? `${stem}-${attempt}` : stem;
    try {
      copyFileSync(target, candidate, constants.COPYFILE_EXCL);
      log(`  💾 Backup: ${candidate}`);
      return candidate;
    } catch (error) {
      if (error.code !== 'EEXIST') throw error;
    }
  }
  throw new Error(`Could not allocate a unique backup name for ${target}`);
}

export function syncFile(sourceFile, targetFile, { force = false, backup = false, log = () => {} } = {}) {
  requireNode24();
  assertSafePathString(sourceFile, 'SOURCE file');
  assertSafePathString(targetFile, 'TARGET file');
  if (isPrivateTaskStoreLocation(resolve(sourceFile)) || isPrivateTaskStoreLocation(resolve(targetFile))) {
    throw new Error('Private Task Store data cannot be synchronized or backed up');
  }
  const source = pathForSync(sourceFile, 'SOURCE file', { optional: true });
  const target = pathForSync(targetFile, 'TARGET file', { optional: true, createParent: true });
  if (isPrivateTaskStoreLocation(source.path) || isPrivateTaskStoreLocation(target.path)) {
    throw new Error('Private Task Store data cannot be synchronized or backed up');
  }
  if (!source.stat) {
    if (target.stat) return { action: 'kept-target' };
    throw new Error('Neither source nor target exists');
  }
  if (!target.stat) {
    log('✅ Target missing → Copy from source');
    writeAtomic(target.path, readFileSync(source.path), source.stat.mode & 0o777);
    return { action: 'copied' };
  }
  const sourceBytes = readFileSync(source.path);
  const targetBytes = readFileSync(target.path);
  if (sourceBytes.equals(targetBytes)) {
    log('✅ Files identical → No action');
    return { action: 'identical' };
  }
  if (!force && source.stat.mtimeMs <= target.stat.mtimeMs) {
    log(source.stat.mtimeMs === target.stat.mtimeMs
      ? '⚠️ Same timestamps but different content → Keep target'
      : 'ℹ️ Target newer → Keep target');
    return { action: 'kept-target' };
  }
  if (backup) backupSyncTarget(target.path, log);
  log(force ? '⚠️ --force mode: source takes priority → Copy'
    : '✅ Source newer → Copy');
  writeAtomic(target.path, sourceBytes, source.stat.mode & 0o777);
  return { action: 'copied' };
}

function globRegex(pattern) {
  if (pattern.includes(sep) || pattern.includes('/') || pattern.includes('\\')) {
    throw new Error('Pattern must match filenames only; path separators are not allowed');
  }
  let expression = '^';
  for (let index = 0; index < pattern.length; index++) {
    const char = pattern[index];
    if (char === '*') expression += '.*';
    else if (char === '?') expression += '.';
    else if (char === '[') {
      const close = pattern.indexOf(']', index + 1);
      if (close < 0) expression += '\\[';
      else {
        let body = pattern.slice(index + 1, close);
        if (body.startsWith('!')) body = `^${body.slice(1)}`;
        expression += `[${body.replace(/\\/g, '\\\\')}]`;
        index = close;
      }
    } else expression += char.replace(/[|\\{}()[\]^$+?.]/g, '\\$&');
  }
  return new RegExp(`${expression}$`);
}

export function syncDirectory(sourcePath, targetPath, pattern = '*.md', options = {}) {
  requireNode24();
  assertSafePathString(sourcePath, 'SOURCE directory');
  assertSafePathString(targetPath, 'TARGET directory');
  assertSafePathString(pattern, 'Filename pattern');
  const source = projectRoot(sourcePath);
  const target = ensureDirectory(resolve(targetPath), { create: true, projectRoot: true });
  if (isPrivateTaskStoreLocation(target)) {
    throw new Error('Private Task Store data cannot be synchronized');
  }
  if (source === target) throw new Error('SOURCE and TARGET directories must be different');
  const matcher = globRegex(pattern);
  const files = readdirSync(source, { withFileTypes: true })
    .filter((entry) => entry.isFile() && matcher.test(entry.name))
    .map((entry) => entry.name).sort((a, b) => a.localeCompare(b));
  const counts = { total: files.length, copied: 0, identical: 0, kept: 0, errors: 0 };
  const log = options.log ?? (() => {});
  for (const name of files) {
    try {
      const result = syncFile(join(source, name), join(target, name), {
        force: options.force, backup: options.backup, log: () => {},
      });
      if (result.action === 'copied') counts.copied++;
      else if (result.action === 'identical') counts.identical++;
      else counts.kept++;
      if (result.action === 'copied') log(`  ✅ ${name} (copied)`);
      else if (result.action === 'identical') log(`  ✅ ${name} (identical)`);
      else log(`  ℹ️  ${name} (target kept)`);
    } catch (error) {
      counts.errors++;
      counts.kept++;
      log(`  ❌ ${name} (error: ${error.message})`);
    }
  }
  return counts;
}

function options(args) {
  const quietIndex = args.indexOf('--quiet');
  const quiet = quietIndex >= 0;
  if (quiet) args.splice(quietIndex, 1);
  const force = args.includes('--force');
  const backup = args.includes('--backup');
  const unknown = args.filter((arg) => arg.startsWith('--') && !['--force', '--backup'].includes(arg));
  return { quiet, force, backup, unknown };
}

function help() {
  return `Usage:
  maj-node-migration.mjs generate-mono <source_dir>
  maj-node-migration.mjs generate-multi <source_dir> <project_name...>
  maj-node-migration.mjs validate-indexes <source_dir> <MONO|MULTI> [project_name...]
  maj-node-migration.mjs deploy-agents <TARGET> <SOURCE> [--quiet]
  maj-node-migration.mjs deploy-commands <TARGET> <SOURCE> [--quiet]
  maj-node-migration.mjs deploy-root-files <TARGET> <SOURCE> [--quiet]
  maj-node-migration.mjs validate-deployment <TARGET> <SOURCE> [--quiet]
  maj-node-migration.mjs write-log <SOURCE> [--quiet]  (log contents from stdin)
  maj-node-migration.mjs sync-file <source_file> <target_file> [--force] [--backup]
  maj-node-migration.mjs sync-directories <source_dir> <target_dir> [pattern] [--force] [--backup]`;
}

function isCli() {
  if (!process.argv[1]) return false;
  try {
    return realpathSync(resolve(process.argv[1])) === realpathSync(fileURLToPath(import.meta.url));
  } catch { return false; }
}

if (isCli()) {
  try {
    requireNode24();
    const [command, ...args] = process.argv.slice(2);
    if (!command || command === '--help' || command === '-h') {
      process.stdout.write(`${help()}\n`);
    } else if (command === 'generate-mono') {
      if (args.length > 1) throw new Error('Expected at most one SOURCE directory');
      process.stdout.write('📝 Creating mono-project index...\n');
      const result = generateMonoIndex(args[0] ?? '.');
      process.stdout.write(`✅ Mono-project index created: ${result.path}\n`);
    } else if (command === 'generate-multi') {
      if (args.length < 2) throw new Error('Expected SOURCE and at least one project name');
      const [source, ...names] = args;
      process.stdout.write('📝 Creating multi-project index...\n');
      const result = generateMultiIndex(source, names);
      process.stdout.write(`✅ Global index created: ${result.path}\n`);
      for (const path of result.projects) process.stdout.write(`   ✅ ${path} created\n`);
    } else if (command === 'validate-indexes') {
      const [source = '.', type = 'MONO', ...names] = args;
      process.stdout.write('🔍 Validating created indexes...\n');
      const result = validateIndexes(source, type, names);
      process.stdout.write(type === 'MONO'
        ? '✅ Validation MONO : Index principal existe\n'
        : '✅ Validation MULTI : Tous les index existent\n');
      process.stdout.write(`Validated ${result.checked.length} index file(s)\n`);
    } else if (['deploy-agents', 'deploy-commands', 'deploy-root-files'].includes(command)) {
      const parsed = options(args);
      if (parsed.unknown.length || args.length !== 2) throw new Error('Expected TARGET, SOURCE and optional --quiet');
      const [target, source] = args;
      const kind = command === 'deploy-root-files' ? 'root-files' : command.slice('deploy-'.length);
      const log = parsed.quiet ? () => {} : (line) => process.stdout.write(`${line}\n`);
      if (!parsed.quiet) process.stdout.write(`${kind === 'agents' ? '🤖 Deploying agent mappings' : kind === 'commands' ? '📦 Deploying command mappings' : '📄 Deploying root files'} (TARGET → SOURCE)...\n`);
      const result = kind === 'root-files'
        ? deployRootFiles(target, source, log)
        : deployMappings(kind, target, source, log);
      if (parsed.quiet) process.stdout.write(`${result.count}\n`);
      else process.stdout.write(`✅ ${result.count} ${kind === 'agents' ? 'agents' : kind === 'commands' ? 'commands' : 'root files'} deployed (TARGET → SOURCE)\n${result.count}\n`);
    } else if (command === 'validate-deployment') {
      const parsed = options(args);
      if (parsed.unknown.length || args.length !== 2) throw new Error('Expected TARGET, SOURCE and optional --quiet');
      const result = validateDeployment(args[0], args[1]);
      if (!parsed.quiet) {
        process.stdout.write('🔍 Validating deployment (TARGET → SOURCE)...\n');
        for (const issue of result.issues) process.stdout.write(`  ⚠️  ${issue}\n`);
        process.stdout.write(result.passed
          ? '✅ Validation PASSED: all TARGET files copied into SOURCE\n'
          : `⚠️  Validation WARNINGS: ${result.issues.length} issue(s) detected\n`);
      }
      process.stdout.write(`${result.status}\n`);
    } else if (command === 'write-log') {
      const parsed = options(args);
      if (parsed.unknown.length || args.length !== 1) throw new Error('Expected SOURCE and optional --quiet');
      const path = writePhaseLog(args[0], readFileSync(0, 'utf8'));
      process.stdout.write(parsed.quiet ? `${path}\n` : `📝 Log created: ${path}\n`);
    } else if (command === 'sync-file') {
      const parsed = options(args);
      if (parsed.unknown.length || args.length !== 2) throw new Error('Expected source file, target file and optional --force/--backup');
      const log = (line) => process.stdout.write(`${line}\n`);
      const result = syncFile(args[0], args[1], { force: parsed.force, backup: parsed.backup, log });
      if (result.action === 'copied') process.stdout.write(`   Source: ${args[0]} → Target: ${args[1]}\n`);
      if (result.action === 'kept-target') process.stdout.write(`✅ Source missing or target newer → Keep target\n   Target: ${args[1]}\n`);
    } else if (command === 'sync-directories') {
      const parsed = options(args);
      const positionals = args.filter((arg) => arg !== '--force' && arg !== '--backup');
      if (parsed.unknown.length || positionals.length < 2 || positionals.length > 3) {
        throw new Error('Expected SOURCE directory, TARGET directory, optional filename pattern and --force/--backup');
      }
      const [source, target, pattern = '*.md'] = positionals;
      const log = parsed.quiet ? () => {} : (line) => process.stdout.write(`${line}\n`);
      if (!parsed.quiet) {
        process.stdout.write(`🔵 Batch directory synchronization\n   Source: ${source}\n   Target: ${target}\n   Pattern: ${pattern}\n`);
        if (parsed.force) process.stdout.write('   Mode: --force (source takes priority)\n');
        if (parsed.backup) process.stdout.write('   Backup: enabled\n');
      }
      const result = syncDirectory(source, target, pattern, { force: parsed.force, backup: parsed.backup, log });
      if (!parsed.quiet) {
        process.stdout.write(`📊 ${result.total} file(s) to process\n`);
        process.stdout.write(`Synchronization complete\n   Total: ${result.total} files\n   Copied: ${result.copied}\n   Identical: ${result.identical}\n   Kept: ${result.kept}\n`);
      }
      if (result.errors) process.exitCode = 1;
    } else {
      throw new Error(`Unknown command: ${command}\n${help()}`);
    }
  } catch (error) {
    process.stderr.write(`MAJ tool failed: ${error.message}\n`);
    process.exitCode = 1;
  }
}
