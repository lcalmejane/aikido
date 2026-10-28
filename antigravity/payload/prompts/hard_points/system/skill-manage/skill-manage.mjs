#!/usr/bin/env node
// Deterministic engine behind /skill-manage. Every side effect (clone, copy, replace, remove)
// happens here so the AI only calls it and reports its JSON output. No dependencies; uses git.
import { execFileSync } from 'node:child_process';
import {
  chmodSync, copyFileSync, existsSync, lstatSync, mkdirSync, mkdtempSync, readFileSync, readdirSync,
  renameSync, rmSync, statSync, writeFileSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, isAbsolute, join, relative, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const DEFAULT_CFG = resolve(HERE, '../../configuration/skills.cfg');
const SAFE_NAME = /^[a-z0-9][a-z0-9-]*$/;
const SAFE_REF = /^(?!-)[A-Za-z0-9._/-]+$/;
const SAFE_REL = /^(?!\/)(?!.*\.\.)[A-Za-z0-9._/-]+$/;
const SCRIPT_EXT = /\.(sh|bash|zsh|py|js|mjs|cjs|ts|rb|pl|ps1|bat|cmd)$/i;
const LIMITS = { files: 2000, bytes: 50 * 1024 * 1024, skillLines: 500 };
const FLAGS = new Set(['dry-run', 'confirm-third-party', 'force', 'purge', 'help']);
const ACTIONS = new Set(['config', 'list', 'search', 'get', 'update', 'uninstall']);

class SkillError extends Error {
  constructor(code, message) { super(message); this.code = code; }
}
const fail = (code, message) => { throw new SkillError(code, message); };

export function parseCfg(text) {
  const values = {};
  for (const line of text.split(/\r?\n/)) {
    const match = /^\s*([A-Z0-9_]+)\s*=\s*(.*?)\s*$/.exec(line);
    if (match) values[match[1]] = match[2].replace(/^(["'])(.*)\1$/, '$2');
  }
  return values;
}

export function parseArgs(argv) {
  const [action, ...rest] = argv;
  const options = {};
  for (let i = 0; i < rest.length; i += 1) {
    const token = rest[i];
    if (!token.startsWith('--')) fail('usage', `Unexpected argument: ${token}`);
    const key = token.slice(2);
    if (FLAGS.has(key)) { options[key] = true; continue; }
    if (rest[i + 1] === undefined || rest[i + 1].startsWith('--')) fail('usage', `--${key} requires a value`);
    options[key] = rest[i + 1];
    i += 1;
  }
  return { action, options };
}

export function loadConfig(options = {}, env = process.env) {
  const cfgPath = resolve(options.cfg ?? DEFAULT_CFG);
  const read = (path) => (existsSync(path) ? parseCfg(readFileSync(path, 'utf8')) : {});
  const merged = { ...read(cfgPath), ...read(join(dirname(cfgPath), 'skills.local.cfg')) };
  const repoRoot = resolve(options['repo-root'] ?? process.cwd());
  const group = options.group ?? merged.GIT_GROUP ?? '';
  const config = {
    repoRoot,
    group,
    branch: options.branch ?? merged.GIT_DEFAULT_BRANCH ?? 'main',
    targetDir: resolve(repoRoot, options.target ?? merged.TARGET_DIR ?? 'prompts/hard_points/system'),
    onConflict: options['on-conflict'] ?? merged.ON_CONFLICT ?? 'ask',
    layout: merged.GIT_LAYOUT ?? 'auto',
    token: env.AIKIDO_GIT_TOKEN || merged.GIT_TOKEN || '',
  };
  if (!['update', 'reinstall', 'skip', 'ask'].includes(config.onConflict)) fail('config', `Invalid ON_CONFLICT: ${config.onConflict}`);
  if (!SAFE_REF.test(config.branch)) fail('config', 'Invalid GIT_DEFAULT_BRANCH');
  const rel = relative(repoRoot, config.targetDir);
  if (rel === '' || rel.startsWith('..') || isAbsolute(rel)) fail('config', 'TARGET_DIR must be a sub-directory of the workspace');
  config.allowLocal = isAbsolute(group);
  return config;
}

function assertName(name) {
  if (!SAFE_NAME.test(name ?? '')) fail('invalid-name', `Invalid skill name: ${name}`);
  return name;
}

function assertRepoUrl(url, { allowLocal }) {
  if (!url) fail('config', 'GIT_GROUP is empty: pass --group or set it in skills.cfg');
  const https = /^https:\/\/[^/@\s]+\/[^\s]+$/.test(url);
  const ssh = /^git@[A-Za-z0-9.-]+:[A-Za-z0-9._/~-]+$/.test(url) || /^ssh:\/\/git@[A-Za-z0-9.-]+(:\d+)?\/[^\s]+$/.test(url);
  const local = allowLocal && isAbsolute(url) && !url.includes('\0');
  if (!https && !ssh && !local) fail('unsafe-url', 'Repository URL must be https:// (no embedded credentials), ssh, or an absolute local path');
  return url;
}

function redact(text, token) {
  return token ? text.split(token).join('****') : text;
}

function git(args, { cwd, token, url } = {}) {
  const prefix = token && url?.startsWith('https://')
    ? ['-c', `http.extraHeader=Authorization: Basic ${Buffer.from(`x-access-token:${token}`).toString('base64')}`]
    : [];
  try {
    return execFileSync('git', [...prefix, ...args], {
      cwd,
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'pipe'],
      env: { ...process.env, GIT_TERMINAL_PROMPT: '0', GIT_ALLOW_PROTOCOL: 'https:ssh:file' },
    }).trim();
  } catch (error) {
    return fail('git', redact(`git ${args[0]} failed: ${(error.stderr || error.message).toString().trim()}`, token));
  }
}

function cloneShallow(url, ref, config) {
  assertRepoUrl(url, config);
  if (ref && !SAFE_REF.test(ref)) fail('invalid-ref', `Invalid ref: ${ref}`);
  const dir = mkdtempSync(join(tmpdir(), 'aikido-skill-'));
  const dest = join(dir, 'repo');
  try {
    git(['clone', '--depth=1', '--single-branch', ...(ref ? ['--branch', ref] : []), '--', url, dest], { token: config.token, url });
    return { dir, repo: dest, commit: git(['rev-parse', 'HEAD'], { cwd: dest }) };
  } catch (error) {
    rmSync(dir, { recursive: true, force: true });
    throw error;
  }
}

function withClone(url, ref, config, fn) {
  const clone = cloneShallow(url, ref, config);
  try { return fn(clone); } finally { rmSync(clone.dir, { recursive: true, force: true }); }
}

function readJson(path, label) {
  try { return JSON.parse(readFileSync(path, 'utf8')); } catch (error) { return fail('catalog', `${label}: ${error.message}`); }
}

export function frontMatter(text) {
  const match = /^---\r?\n([\s\S]*?)\r?\n---/.exec(text);
  const fields = {};
  if (match) {
    for (const line of match[1].split(/\r?\n/)) {
      const field = /^([A-Za-z_-]+):\s*(.*)$/.exec(line);
      if (field) fields[field[1]] = field[2].replace(/^(["'])(.*)\1$/, '$2').trim();
    }
  }
  return fields;
}

export function extractCommands(text) {
  const lines = text.split(/\r?\n/);
  const start = lines.findIndex((line) => /^#{2,4}\s+.*available commands/i.test(line));
  if (start < 0) return [];
  const commands = new Set();
  for (const line of lines.slice(start + 1)) {
    if (/^#{1,2}\s/.test(line)) break;
    const found = /^\s*[-*]\s+(?:\*\*)?`?\/([a-z0-9][a-z0-9-]*)/.exec(line);
    if (found) commands.add(found[1]);
  }
  return [...commands].sort();
}

function inventory(dir) {
  const files = [];
  let bytes = 0;
  const walk = (current) => {
    for (const entry of readdirSync(current, { withFileTypes: true })) {
      if (entry.name === '.git') continue;
      const absolute = join(current, entry.name);
      if (entry.isSymbolicLink()) fail('unsafe-content', `Symbolic link refused: ${relative(dir, absolute)}`);
      if (entry.isDirectory()) { walk(absolute); continue; }
      if (!entry.isFile()) continue;
      const info = statSync(absolute);
      bytes += info.size;
      files.push({ path: relative(dir, absolute).split(sep).join('/'), size: info.size, script: SCRIPT_EXT.test(entry.name) || (info.mode & 0o111) !== 0 });
      if (files.length > LIMITS.files || bytes > LIMITS.bytes) fail('too-large', `Skill exceeds ${LIMITS.files} files or ${LIMITS.bytes / 1048576} MB`);
    }
  };
  walk(dir);
  return { files: files.sort((a, b) => (a.path < b.path ? -1 : 1)), bytes };
}

function copyTree(from, to) {
  mkdirSync(to, { recursive: true });
  for (const entry of readdirSync(from, { withFileTypes: true })) {
    if (entry.name === '.git') continue;
    const source = join(from, entry.name);
    const target = join(to, entry.name);
    if (entry.isSymbolicLink()) fail('unsafe-content', `Symbolic link refused: ${entry.name}`);
    if (entry.isDirectory()) copyTree(source, target);
    else if (entry.isFile()) { copyFileSync(source, target); chmodSync(target, statSync(source).mode & 0o777); }
  }
}

function describeSkill(dir) {
  const skillFile = join(dir, 'SKILL.md');
  if (!existsSync(skillFile)) return null;
  const text = readFileSync(skillFile, 'utf8');
  return { meta: frontMatter(text), lines: text.split(/\r?\n/).length, commands: extractCommands(text) };
}

function discoverExternal(repo, source) {
  const found = [];
  const addDir = (relDir) => {
    const absolute = join(repo, relDir);
    if (!existsSync(join(absolute, 'SKILL.md'))) return;
    const name = relDir.split('/').pop();
    if (!SAFE_NAME.test(name)) return;
    found.push({ name, path: relDir, description: describeSkill(absolute).meta.description ?? '' });
  };
  const subdirs = (relDir) => {
    const absolute = join(repo, relDir);
    if (!existsSync(absolute) || !statSync(absolute).isDirectory()) return [];
    return readdirSync(absolute, { withFileTypes: true }).filter((entry) => entry.isDirectory()).map((entry) => `${relDir}/${entry.name}`);
  };
  for (const root of source.roots ?? []) {
    if (!SAFE_REL.test(root)) fail('catalog', `Unsafe root in source ${source.id}: ${root}`);
    if (source.layout === 'skills-dir') subdirs(root).forEach(addDir);
    else if (source.layout === 'plugin-marketplace') subdirs(root).forEach((plugin) => subdirs(`${plugin}/skills`).forEach(addDir));
    else fail('catalog', `Unknown layout in source ${source.id}: ${source.layout}`);
  }
  return found;
}

function fetchCatalog(config, fn) {
  return withClone(config.group, config.branch, config, (clone) => {
    const catalogPath = join(clone.repo, 'catalog.json');
    if (!existsSync(catalogPath)) fail('layout', 'GIT_GROUP has no catalog.json: only the catalog layout is supported by this tool');
    const catalog = readJson(catalogPath, 'catalog.json');
    const sourcesPath = join(clone.repo, 'sources.json');
    const sources = existsSync(sourcesPath) ? readJson(sourcesPath, 'sources.json').sources ?? [] : [];
    return fn({ ...clone, catalog: catalog.skills ?? [], sources });
  });
}

function sourceById(sources, id) {
  return sources.find((item) => item.id === id) ?? fail('unknown-source', `Unknown source: ${id}`);
}

function installedSkills(config) {
  if (!existsSync(config.targetDir)) return [];
  return readdirSync(config.targetDir, { withFileTypes: true })
    .filter((entry) => entry.isDirectory() && !entry.name.startsWith('.') && existsSync(join(config.targetDir, entry.name, 'SKILL.md')))
    .map((entry) => {
      const dir = join(config.targetDir, entry.name);
      const info = describeSkill(dir);
      const provenancePath = join(dir, '.aikido-source.json');
      const provenance = existsSync(provenancePath) ? readJson(provenancePath, `${entry.name}/.aikido-source.json`) : null;
      return {
        name: entry.name,
        description: info.meta.description ?? '',
        version: provenance?.version ?? null,
        commands: info.commands,
        managed: Boolean(provenance),
        source: provenance?.source ?? null,
        commit: provenance?.commit ?? null,
      };
    })
    .sort((a, b) => (a.name < b.name ? -1 : 1));
}

function matches(query, ...fields) {
  const needle = (query ?? '').toLowerCase();
  return !needle || fields.some((field) => String(field ?? '').toLowerCase().includes(needle));
}

function actionSearch(config, options) {
  const scope = options.scope ?? 'all';
  if (!['local', 'remote', 'all'].includes(scope)) fail('usage', 'scope must be local, remote or all');
  const result = { status: 'ok', query: options.query ?? '', scope };
  const installed = installedSkills(config);
  if (scope !== 'remote') result.local = installed.filter((s) => matches(options.query, s.name, s.description));
  if (scope !== 'local') {
    const installedNames = new Set(installed.map((s) => s.name));
    fetchCatalog(config, ({ catalog, sources }) => {
      result.catalog = catalog
        .filter((s) => matches(options.query, s.name, s.description, s.category))
        .map((s) => ({ name: s.name, description: s.description, version: s.version, category: s.category, installed: installedNames.has(s.name) }));
      result.sources = sources.map(({ id, name, layout, trust }) => ({ id, name, layout, trust }));
      const wanted = options.source === 'all' ? sources : options.source ? [sourceById(sources, options.source)] : [];
      result.external = wanted.flatMap((source) => withClone(source.repo, source.ref, config, (clone) => (
        discoverExternal(clone.repo, source)
          .filter((s) => matches(options.query, s.name, s.description))
          .map((s) => ({ source: source.id, name: s.name, description: s.description, trust: source.trust ?? 'third-party', installed: installedNames.has(s.name) }))
      )));
    });
  }
  return result;
}

function backupDir(config) { return join(config.targetDir, '.backups'); }

function moveToBackup(config, name) {
  const from = join(config.targetDir, name);
  const to = join(backupDir(config), `${name}-${new Date().toISOString().replace(/[:.]/g, '-')}`);
  mkdirSync(backupDir(config), { recursive: true });
  renameSync(from, to);
  return relative(config.repoRoot, to);
}

function install(config, options, { name, origin, sourceDir, version, commit, sourceId, repoUrl, ref, trust }) {
  const dest = join(config.targetDir, name);
  const { files, bytes } = inventory(sourceDir);
  const info = describeSkill(sourceDir) ?? fail('invalid-skill', `${name}: SKILL.md is missing`);
  const warnings = [];
  if (info.meta.name && info.meta.name !== name) warnings.push(`front matter name "${info.meta.name}" differs from "${name}"`);
  if (!info.meta.name) warnings.push('SKILL.md has no front matter name');
  if (info.lines > LIMITS.skillLines) {
    if (origin === 'catalog') fail('invalid-skill', `${name}: SKILL.md exceeds ${LIMITS.skillLines} lines`);
    warnings.push(`SKILL.md has ${info.lines} lines (limit ${LIMITS.skillLines})`);
  }
  const scripts = files.filter((f) => f.script).map((f) => f.path);
  const summary = { name, origin, source: sourceId, version: version ?? null, commit, files: files.length, bytes, scripts, commands: info.commands, warnings };

  if (trust === 'third-party' && !options['confirm-third-party']) {
    return { status: 'confirmation_required', reason: 'third-party skill: review the file list, then re-run with --confirm-third-party', ...summary, fileList: files.map((f) => f.path) };
  }
  if (existsSync(dest)) {
    const existing = join(dest, '.aikido-source.json');
    const previous = existsSync(existing) ? readJson(existing, 'provenance') : null;
    if (!previous && !options.force) return { status: 'conflict', reason: 'an unmanaged directory with this name exists; use --force to replace', ...summary };
    if (previous && previous.source !== sourceId && !options.force) return { status: 'conflict', reason: `installed from "${previous.source}"; use --force to replace`, ...summary };
    if (config.onConflict === 'skip' && !options.force) return { status: 'skipped', ...summary };
    if (config.onConflict === 'ask' && !options.force) return { status: 'conflict', reason: 'already installed; use --on-conflict update|reinstall|skip or --force', ...summary };
  }
  if (options['dry-run']) return { status: 'dry_run', wouldReplace: existsSync(dest), ...summary };

  mkdirSync(config.targetDir, { recursive: true });
  const staging = mkdtempSync(join(config.targetDir, `.${name}.tmp-`));
  let backup = null;
  try {
    copyTree(sourceDir, staging);
    writeFileSync(join(staging, '.aikido-source.json'), `${JSON.stringify({
      source: sourceId, repo: repoUrl, ref: ref ?? null, commit, version: version ?? null, installed_at: new Date().toISOString(),
    }, null, 2)}\n`);
    if (existsSync(dest)) backup = moveToBackup(config, name);
    renameSync(staging, dest);
  } catch (error) {
    rmSync(staging, { recursive: true, force: true });
    throw error;
  }
  return { status: 'installed', path: relative(config.repoRoot, dest), backup, ...summary };
}

function actionGet(config, options) {
  const name = assertName(options.name);
  const sourceId = options.source ?? 'catalog';
  return fetchCatalog(config, ({ repo, commit, catalog, sources }) => {
    if (sourceId === 'catalog') {
      const entry = catalog.find((s) => s.name === name) ?? fail('not-found', `Skill not found in catalog: ${name}`);
      if (!SAFE_REL.test(entry.path ?? '')) fail('catalog', `${name}: unsafe path in catalog`);
      return install(config, options, { name, origin: 'catalog', sourceDir: join(repo, entry.path), version: entry.version, commit, sourceId: 'catalog', repoUrl: config.group, ref: config.branch });
    }
    const source = sourceById(sources, sourceId);
    return withClone(source.repo, source.ref, config, (clone) => {
      const found = discoverExternal(clone.repo, source).filter((s) => s.name === name);
      if (found.length === 0) fail('not-found', `Skill ${name} not found in source ${sourceId}`);
      if (found.length > 1) fail('ambiguous', `Skill ${name} is provided more than once in ${sourceId}: ${found.map((f) => f.path).join(', ')}`);
      return install(config, options, { name, origin: 'external', sourceDir: join(clone.repo, found[0].path), commit: clone.commit, sourceId, repoUrl: source.repo, ref: source.ref, trust: source.trust ?? 'third-party' });
    });
  });
}

function actionUpdate(config, options) {
  const name = assertName(options.name);
  const provenancePath = join(config.targetDir, name, '.aikido-source.json');
  if (!existsSync(provenancePath)) fail('not-managed', `${name} was not installed by skill-manage (no .aikido-source.json)`);
  const provenance = readJson(provenancePath, 'provenance');
  const next = { ...options, name, source: provenance.source, force: true };
  const replace = { ...config, onConflict: 'update' };
  const preview = actionGet(replace, { ...next, 'dry-run': true, 'confirm-third-party': true });
  const same = provenance.source === 'catalog'
    ? preview.version === provenance.version && preview.commit === provenance.commit
    : preview.commit === provenance.commit;
  if (same) return { status: 'up_to_date', name, version: provenance.version, commit: provenance.commit };
  if (options['dry-run']) return { ...preview, from: { version: provenance.version, commit: provenance.commit } };
  return actionGet(replace, next);
}

function actionUninstall(config, options) {
  const name = assertName(options.name);
  const dir = join(config.targetDir, name);
  if (!existsSync(join(dir, 'SKILL.md'))) fail('not-found', `Skill not installed: ${name}`);
  if (lstatSync(dir).isSymbolicLink()) fail('unsafe-content', `${name} is a symbolic link`);
  const { commands } = describeSkill(dir);
  const mappings = commands.flatMap((cmd) => ['.roo/commands', '.claude/commands'].map((base) => `${base}/${cmd}.md`))
    .filter((path) => existsSync(join(config.repoRoot, path)));
  if (options['dry-run']) return { status: 'dry_run', name, commands, mappings, purge: Boolean(options.purge) };
  let backup = null;
  if (options.purge) {
    rmSync(dir, { recursive: true, force: true });
    if (existsSync(backupDir(config))) {
      for (const entry of readdirSync(backupDir(config))) {
        if (entry.startsWith(`${name}-`)) rmSync(join(backupDir(config), entry), { recursive: true, force: true });
      }
    }
  } else backup = moveToBackup(config, name);
  return { status: 'uninstalled', name, backup, commands, mappings };
}

export function run(argv, env = process.env) {
  const { action, options } = parseArgs(argv);
  if (!ACTIONS.has(action) || options.help) {
    fail('usage', `Usage: skill-manage.mjs <${[...ACTIONS].join('|')}> [--name n] [--query q] [--scope local|remote|all] [--source id|all|catalog] [--target dir] [--group url] [--on-conflict update|reinstall|skip|ask] [--dry-run] [--confirm-third-party] [--force] [--purge]`);
  }
  const config = loadConfig(options, env);
  switch (action) {
    case 'config': return { status: 'ok', group: config.group, branch: config.branch, layout: config.layout, targetDir: relative(config.repoRoot, config.targetDir), onConflict: config.onConflict, token: config.token ? '****' : '' };
    case 'list': return { status: 'ok', targetDir: relative(config.repoRoot, config.targetDir), skills: installedSkills(config) };
    case 'search': return actionSearch(config, options);
    case 'get': return actionGet(config, options);
    case 'update': return actionUpdate(config, options);
    default: return actionUninstall(config, options);
  }
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try {
    process.stdout.write(`${JSON.stringify(run(process.argv.slice(2)), null, 2)}\n`);
  } catch (error) {
    const code = error instanceof SkillError ? error.code : 'internal';
    process.stdout.write(`${JSON.stringify({ status: 'error', code, message: error.message }, null, 2)}\n`);
    process.exitCode = 1;
  }
}
