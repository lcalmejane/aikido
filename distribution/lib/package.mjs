import { createHash } from 'node:crypto';
import { lstatSync, readFileSync, readdirSync, realpathSync } from 'node:fs';
import { dirname, join, posix, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import { HOSTS, isSafeRelativePath } from './lock.mjs';
import { loadCatalog, renderCatalogEntries } from './catalog.mjs';
import { loadManifest, readTemplate, render, selectTemplates, validateManifest } from './templates.mjs';

const DISTRIBUTION_ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const SHA256 = /^[0-9a-f]{64}$/;
const COMMIT = /^[0-9a-f]{40}$/;
const VERSION = /^\d+\.\d+(\.\d+)?(-[0-9A-Za-z.-]+)?$/;

function packageFile(root, path) {
  if (!isSafeRelativePath(path)) throw new Error(`Unsafe package path: ${path}`);
  let current = root;
  const parts = path.split('/');
  let info;
  for (let i = 0; i < parts.length; i += 1) {
    current = join(current, parts[i]);
    info = lstatSync(current);
    if (info.isSymbolicLink()) throw new Error(`Symlink in package path: ${parts.slice(0, i + 1).join('/')}`);
    if (i < parts.length - 1 && !info.isDirectory()) throw new Error(`Non-directory package path: ${parts.slice(0, i + 1).join('/')}`);
  }
  if (!info.isFile()) throw new Error(`Package entry is not a regular file: ${path}`);
  return current;
}

function sha256(bytes) {
  return createHash('sha256').update(bytes).digest('hex');
}

function readJson(path, label) {
  try {
    return JSON.parse(readFileSync(path, 'utf8'));
  } catch (error) {
    throw new Error(`Cannot read ${label}: ${error.message}`);
  }
}

function packageFiles(directory, prefix = '') {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const childPrefix = prefix ? `${prefix}/${entry.name}` : entry.name;
    const absolute = join(directory, entry.name);
    if (entry.isSymbolicLink()) throw new Error(`Symlink in package tree: ${childPrefix}`);
    if (entry.isDirectory()) return packageFiles(absolute, childPrefix);
    return entry.isFile() ? [childPrefix] : [];
  });
}

function validateLinks(templateRoot, templates, packageManifest, catalog) {
  const errors = [];
  const projectTargets = new Set([
    ...packageManifest.payloadFiles.map((entry) => entry.target),
    ...packageManifest.projectFiles.map((entry) => entry.target),
  ]);
  for (const mode of ['STANDARD', 'LIGHT', 'UNSET']) {
    for (const template of selectTemplates(templates, { mode, hosts: [packageManifest.host] })) {
      projectTargets.add(template.target);
    }
  }
  const existsTarget = (path) => projectTargets.has(path) || [...projectTargets].some((target) => target.startsWith(`${path}/`));
  for (const mode of ['STANDARD', 'LIGHT', 'UNSET']) {
    const values = {
      PROJECT_NAME: 'External project',
      AIKIDO_VERSION: packageManifest.version,
      ENTRIES: '',
    };
    const chosen = selectTemplates(templates, { mode, hosts: [packageManifest.host] });
    for (const template of chosen) {
      let text = render(readTemplate(template, templateRoot), {
        ...values,
        ENTRIES: ['agents-list', 'commands-list', 'skills-list'].includes(template.id)
          ? renderCatalogEntries(
            template.id === 'agents-list' ? 'agents' : template.id === 'commands-list' ? 'commands' : 'skills',
            { hosts: [packageManifest.host], catalog },
          )
          : '',
      });
      if (template.kind === 'managed-block') text = text.replace(/\r\n/g, '\n');
      const base = template.kind === 'managed-block' || template.kind === 'generated' ? '' : posix.dirname(template.target);
      for (const [, link] of text.matchAll(/\]\(([^)\s]+)\)/g)) {
        if (/^[a-z][a-z0-9+.-]*:/i.test(link) || link.startsWith('#')) continue;
        const target = posix.normalize(posix.join(base, link)).replace(/\/$/, '');
        if (target === '..' || target.startsWith('../') || !existsTarget(target)) {
          errors.push(`${template.id}: link ${link} resolves to missing project path ${target}`);
        }
      }
    }
  }
  return errors;
}

export function validatePackage(packageRoot, { catalog = loadCatalog() } = {}) {
  const root = realpathSync(resolve(packageRoot));
  if (!lstatSync(root).isDirectory()) throw new Error('Package root must be a directory');
  const manifestPath = packageFile(root, 'package-manifest.json');
  const pkg = readJson(manifestPath, 'package-manifest.json');
  const errors = [];
  const error = (message) => errors.push(message);
  if (pkg.schemaVersion !== 1) error('package schemaVersion must be 1');
  if (!HOSTS.includes(pkg.host)) error(`unknown host: ${pkg.host}`);
  if (!catalog.hosts?.[pkg.host]?.enabled) error(`host is not enabled in the distribution catalog: ${pkg.host}`);
  if (catalog.hosts?.[pkg.host]?.commandDelivery !== pkg.commandDelivery) error('command delivery differs from the distribution catalog');
  if (!VERSION.test(pkg.version ?? '')) error('version must be semantic');
  if (typeof pkg.source?.ref !== 'string' || !pkg.source.ref || /^(\/|~|file:|[A-Za-z]:)/.test(pkg.source.ref)) {
    error('source.ref must be portable and non-empty');
  }
  if (pkg.sourceRevision === 'uncommitted') {
    if (pkg.source?.type !== 'local' || !pkg.source?.ref) error('uncommitted package needs a local source reference');
  } else if (!COMMIT.test(pkg.sourceRevision ?? '') || pkg.source?.type !== 'git' || pkg.source?.commit !== pkg.sourceRevision) {
    error('package source must match a full immutable Git commit');
  }
  if (!Array.isArray(pkg.files) || !Array.isArray(pkg.payloadFiles) || !Array.isArray(pkg.projectFiles)) {
    error('files, payloadFiles and projectFiles must be arrays');
    throw new Error(`Invalid package:\n${errors.join('\n')}`);
  }

  const ledger = new Map();
  for (const entry of pkg.files) {
    if (!entry || !isSafeRelativePath(entry.path)) {
      error(`unsafe package file path: ${entry?.path}`);
      continue;
    }
    if (ledger.has(entry.path)) {
      error(`duplicate package file path: ${entry.path}`);
      continue;
    }
    if (![
      'payload', 'template', 'command', 'system-skill', 'agent', 'agent-configuration',
      'adapter', 'runtime', 'plugin-manifest', 'marketplace-manifest', 'plugin-readme',
      'plugin-asset', 'legal',
    ].includes(entry.role)) {
      error(`unknown package file role: ${entry.path}`);
    }
    if (!SHA256.test(entry.sha256 ?? '')) error(`invalid hash for ${entry.path}`);
    try {
      const contents = readFileSync(packageFile(root, entry.path));
      if (sha256(contents) !== entry.sha256) error(`hash mismatch: ${entry.path}`);
      ledger.set(entry.path, entry);
    } catch (exception) {
      error(exception.message);
    }
  }
  if (!ledger.has('templates/manifest.json')) error('template manifest is missing');
  if (!ledger.has('payload/LICENSE') || !ledger.has('payload/TRADEMARK.md')) error('LICENSE and TRADEMARK.md must be packaged');
  for (const path of [
    'catalog.json',
    'lib/bootstrap-plan.mjs',
    'lib/catalog.mjs',
    'lib/lock.mjs',
    'lib/managed-blocks.mjs',
    'lib/package.mjs',
    'lib/templates.mjs',
    'lib/update-plan.mjs',
    'scripts/bootstrap-plan.mjs',
    'scripts/update-plan.mjs',
    'scripts/validate-package.mjs',
  ]) {
    if (!ledger.has(path)) error(`package runtime is missing: ${path}`);
  }
  if (pkg.host === 'claude-code') {
    for (const path of [
      '.claude-plugin/plugin.json',
      '.claude-plugin/marketplace.json',
      'README.md',
      'LICENSE',
      'TRADEMARK.md',
      'assets/aikido.png',
    ]) {
      if (!ledger.has(path)) error(`Claude Code plugin file is missing: ${path}`);
    }
    try {
      const plugin = readJson(packageFile(root, '.claude-plugin/plugin.json'), 'Claude Code plugin manifest');
      if (plugin.name !== 'aikido' || plugin.version !== pkg.version || plugin.license !== 'MIT') {
        error('Claude Code plugin name, version and license must match the package manifest');
      }
      if (plugin.icon !== './assets/aikido.png') {
        error('Claude Code plugin icon must point to the bundled PNG');
      }
    } catch (exception) {
      error(exception.message);
    }
    try {
      const marketplace = readJson(
        packageFile(root, '.claude-plugin/marketplace.json'),
        'Claude Code marketplace manifest',
      );
      if (marketplace.name !== 'aikido' || marketplace.owner?.name !== 'AI-KIDO Team') {
        error('Claude Code marketplace name and owner are invalid');
      }
      if (!marketplace.plugins?.some((plugin) => plugin.name === 'aikido' && plugin.source === '.')) {
        error('Claude Code marketplace must expose the local aikido plugin source');
      }
    } catch (exception) {
      error(exception.message);
    }
    try {
      const readme = readFileSync(packageFile(root, 'README.md'), 'utf8');
      if (readme.trim().split(/\s+/).length < 40) error('Claude Code plugin README must contain at least 40 words');
      const icon = readFileSync(packageFile(root, 'assets/aikido.png'));
      if (icon.length > 2 * 1024 * 1024 || !icon.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]))) {
        error('Claude Code plugin icon must be a PNG under 2 MB');
      } else if (icon.readUInt32BE(16) < 512 || icon.readUInt32BE(16) > 2048
        || icon.readUInt32BE(20) < 512 || icon.readUInt32BE(20) > 2048
        || icon.readUInt32BE(16) !== icon.readUInt32BE(20)) {
        error('Claude Code plugin icon must be square and between 512 and 2048 pixels');
      }
    } catch (exception) {
      error(exception.message);
    }
  }
  if (pkg.host === 'copilot-vscode') {
    if (!ledger.has('plugin.json')) error('VS Code Agent Plugins manifest is missing');
    try {
      const plugin = readJson(packageFile(root, 'plugin.json'), 'VS Code Agent Plugins manifest');
      if (plugin.$schema !== 'https://agent-plugins.org/schemas/1.0.0/plugin.schema.json'
        || plugin.name !== 'aikido' || plugin.version !== pkg.version || plugin.license !== 'MIT') {
        error('VS Code Agent Plugins manifest schema, name, version and license must match the package');
      }
    } catch (exception) {
      error(exception.message);
    }
    const host = catalog.hosts['copilot-vscode'];
    for (const command of catalog.commands) {
      const path = `${host.commandTarget}/${command.name}${host.commandSuffix}`;
      const entry = ledger.get(path);
      if (entry?.role !== 'command') error(`VS Code plugin command is missing: ${path}`);
      if (pkg.projectFiles.some((file) => file.target === path || file.target === `.github/prompts/${command.name}.prompt.md`)) {
        error(`VS Code plugin command must not also be installed as a project prompt: ${command.name}`);
      }
      if (entry) {
        const text = readFileSync(packageFile(root, path), 'utf8');
        if (!new RegExp(`^name:\\s*${command.name}\\s*$`, 'm').test(text)
          || !/^description:\s*.+$/m.test(text)
          || !text.includes(`\`${command.source}\``)) {
          error(`VS Code plugin prompt is invalid or detached from its canonical command: ${path}`);
        }
      }
    }
    for (const skill of catalog.systemSkills) {
      const path = `${host.systemSkillTarget}/${skill.name}/SKILL.md`;
      const entry = ledger.get(path);
      if (entry?.role !== 'system-skill') error(`VS Code plugin Skill is missing: ${path}`);
      if (entry) {
        const text = readFileSync(packageFile(root, path), 'utf8');
        const frontmatter = text.match(/^---\r?\n([\s\S]*?)\r?\n---/);
        if (!frontmatter
          || !new RegExp(`^name:\\s*${skill.name}\\s*$`, 'm').test(frontmatter[1])
          || !/^description:\s*.+$/m.test(frontmatter[1])) {
          error(`VS Code plugin Skill metadata must match its directory: ${path}`);
        }
      }
    }
  }

  const payloadTargets = new Set();
  for (const entry of pkg.payloadFiles) {
    if (!entry || !isSafeRelativePath(entry.source) || !isSafeRelativePath(entry.target)
      || !isSafeRelativePath(entry.packagePath)) {
      error(`unsafe payload entry: ${entry?.target}`);
      continue;
    }
    if (payloadTargets.has(entry.target)) error(`duplicate payload target: ${entry.target}`);
    payloadTargets.add(entry.target);
    if (entry.source !== entry.target || entry.packagePath !== `payload/${entry.target}`) {
      error(`payload path mapping is not portable: ${entry.target}`);
    }
    if (entry.origin !== 'payload' || entry.policy !== 'three-way') error(`invalid payload policy: ${entry.target}`);
    if (!SHA256.test(entry.sha256 ?? '')) error(`invalid payload hash: ${entry.target}`);
    const packaged = ledger.get(entry.packagePath);
    if (!packaged || packaged.sha256 !== entry.sha256 || packaged.role !== 'payload') {
      error(`payload is not covered by the package file ledger: ${entry.target}`);
    }
    if (entry.target.endsWith('.test.mjs') || /(^|\/)(gen|spec|logs|dist)(\/|$)/.test(entry.target)) {
      error(`private, generated or test content is in the payload: ${entry.target}`);
    }
  }
  const ledgerPayload = [...ledger.values()].filter((entry) => entry.role === 'payload');
  if (ledgerPayload.length !== payloadTargets.size) error('payload file ledger contains missing or unlisted payload files');
  const hardPoints = [...payloadTargets].filter((path) => path.startsWith('prompts/hard_points/'));
  if (hardPoints.length !== 151) error(`expected 151 hard_points payload files, found ${hardPoints.length}`);
  if (payloadTargets.size !== 153 || !payloadTargets.has('LICENSE') || !payloadTargets.has('TRADEMARK.md')) {
    error('payload must contain the 151 hard_points files and both legal notices');
  }
  const targets = new Set(payloadTargets);
  for (const entry of pkg.projectFiles) {
    if (!entry || !isSafeRelativePath(entry.source) || !isSafeRelativePath(entry.target)) {
      error(`unsafe project file mapping: ${entry?.target}`);
      continue;
    }
    if (targets.has(entry.target)) error(`duplicate project file target: ${entry.target}`);
    targets.add(entry.target);
    if (!['three-way', 'create-only'].includes(entry.policy)) error(`invalid project file policy: ${entry.target}`);
    if (!['template', 'generated', 'adapter', 'payload'].includes(entry.origin)) error(`invalid project file origin: ${entry.target}`);
    const packaged = ledger.get(entry.source);
    if (!packaged || packaged.sha256 !== entry.sha256) error(`project file source/hash mismatch: ${entry.source}`);
    else if (['payload', 'template'].includes(packaged.role)) error(`project file must point to an adapter artifact: ${entry.source}`);
  }
  let templates = null;
  const templateRoot = join(root, 'templates');
  try {
    const rawManifest = readJson(packageFile(root, 'templates/manifest.json'), 'templates/manifest.json');
    const templateErrors = validateManifest(rawManifest);
    if (templateErrors.length) templateErrors.forEach((message) => error(`template manifest: ${message}`));
    for (const template of rawManifest.templates ?? []) {
      const packagedPath = `templates/${template.source}`;
      if (!ledger.has(packagedPath)) error(`template source is absent from package: ${packagedPath}`);
    }
    templates = rawManifest;
  } catch (exception) {
    error(exception.message);
  }
  if (templates) {
    for (const mode of ['STANDARD', 'LIGHT', 'UNSET']) {
      for (const template of selectTemplates(templates, { mode, hosts: [pkg.host] })) {
        if (targets.has(template.target)) error(`template target collides with package project file: ${template.target}`);
      }
    }
    errors.push(...validateLinks(templateRoot, templates, pkg, catalog));
  }
  try {
    const actualFiles = new Set(packageFiles(root));
    actualFiles.delete('package-manifest.json');
    for (const path of actualFiles) if (!ledger.has(path)) error(`unlisted package file: ${path}`);
    for (const path of ledger.keys()) if (!actualFiles.has(path)) error(`ledger file is missing from package tree: ${path}`);
  } catch (exception) {
    error(exception.message);
  }

  if (errors.length) throw new Error(`Invalid package ${pkg.host ?? '(unknown host)'}:\n${errors.join('\n')}`);
  return {
    valid: true,
    host: pkg.host,
    version: pkg.version,
    sourceRevision: pkg.sourceRevision,
    packageFiles: ledger.size,
    payloadFiles: pkg.payloadFiles.length,
    projectFiles: pkg.projectFiles.length,
  };
}

export function packageManifestPath(packageRoot) {
  return join(resolve(packageRoot), 'package-manifest.json');
}
