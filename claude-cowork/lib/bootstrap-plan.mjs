import { createHash, randomUUID } from 'node:crypto';
import {
  existsSync, lstatSync, mkdirSync, readFileSync, realpathSync, renameSync, rmdirSync, statSync, unlinkSync, writeFileSync,
} from 'node:fs';
import { dirname, join, posix, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  BASELINE_DIR, HOSTS, LOCK_PATH, LOCK_SCHEMA_VERSION, isSafeRelativePath, validateLock,
} from './lock.mjs';
import { loadCatalog, renderCatalogEntries } from './catalog.mjs';
import { blockHash, findBlock, upsertBlock } from './managed-blocks.mjs';
import { validatePackage } from './package.mjs';
import { loadManifest, readTemplate, render, selectTemplates, validateManifest } from './templates.mjs';

const DEFAULT_TEMPLATES_DIR = join(dirname(fileURLToPath(import.meta.url)), '..', 'templates');
const PLAN_OPERATIONS = new WeakMap();
const SHA256 = /^[0-9a-f]{64}$/;
const HASH = (text) => createHash('sha256').update(text).digest('hex');
const HASH_BUFFER = (bytes) => createHash('sha256').update(bytes).digest('hex');

export function inspectTarget(root, target) {
  if (!isSafeRelativePath(target)) return { state: 'blocked', reason: 'unsafe target path' };
  const absolute = resolve(root, ...target.split('/'));
  if (absolute !== root && !absolute.startsWith(`${root}${sep}`)) {
    return { state: 'blocked', reason: 'target escapes project root' };
  }

  const parts = target.split('/');
  let current = root;
  for (let i = 0; i < parts.length; i += 1) {
    current = join(current, parts[i]);
    let info;
    try {
      info = lstatSync(current);
    } catch (error) {
      if (error.code === 'ENOENT') return { state: 'missing', absolute };
      throw error;
    }
    if (info.isSymbolicLink()) return { state: 'blocked', reason: `symlink in target path: ${parts.slice(0, i + 1).join('/')}` };
    if (i < parts.length - 1 && !info.isDirectory()) {
      return { state: 'blocked', reason: `non-directory path component: ${parts.slice(0, i + 1).join('/')}` };
    }
    if (i === parts.length - 1) {
      if (!info.isFile()) return { state: 'blocked', reason: 'target exists but is not a regular file' };
      return { state: 'file', absolute };
    }
  }
  return { state: 'missing', absolute };
}

function templateResult(root, template, values, templatesDir) {
  const source = `templates/${template.source}`;
  const rendered = render(readTemplate(template, templatesDir), values);
  const target = inspectTarget(root, template.target);
  const item = {
    id: template.id,
    source,
    target: template.target,
    kind: template.kind,
    origin: template.kind === 'generated' ? 'generated' : template.kind === 'managed-block' ? 'adapter' : 'template',
    policy: template.policy,
  };
  if (target.state === 'blocked') return { item: { ...item, action: 'blocked', reason: target.reason } };

  const previous = target.state === 'file' ? readFileSync(target.absolute) : null;
  const previousText = previous?.toString('utf8') ?? null;
  if (template.kind === 'managed-block') {
    try {
      const current = previousText ?? '';
      const block = findBlock(current, template.blockId, template.style);
      if (block && blockHash(block.content) !== blockHash(rendered)) {
        return {
          item: { ...item, action: 'conflict', reason: `managed block "${template.blockId}" already exists with different content` },
        };
      }
      const content = block ? previous : Buffer.from(upsertBlock(current, template.blockId, rendered, template.style));
      const action = block ? 'unchanged' : previous === null ? 'create' : 'update-managed-block';
      return {
        item: { ...item, action, contentHash: HASH_BUFFER(content) },
        operation: {
          target: template.target,
          content,
          previous,
          action,
          write: action === 'create' || action === 'update-managed-block',
          block: { path: template.target, id: template.blockId, sha256: blockHash(rendered) },
        },
      };
    } catch (error) {
      return { item: { ...item, action: 'conflict', reason: error.message } };
    }
  }

  if (previous === null) {
    const content = Buffer.from(rendered);
    return {
      item: { ...item, action: 'create', contentHash: HASH_BUFFER(content) },
      operation: fileOperation(template, content, null, true),
    };
  }
  if (template.policy === 'create-only') return { item: { ...item, action: 'keep-local' } };
  if (previous.equals(Buffer.from(rendered))) {
    return {
      item: { ...item, action: 'adopt', contentHash: HASH_BUFFER(previous) },
      operation: fileOperation(template, previous, previous, false),
    };
  }
  return { item: { ...item, action: 'conflict', reason: 'target already exists with different content' } };
}

function fileOperation(template, content, previous, write) {
  return {
    target: template.target,
    content,
    previous,
    action: write ? 'create' : 'adopt',
    write,
    file: {
      path: template.target,
      sha256: HASH_BUFFER(content),
      origin: template.kind === 'generated' ? 'generated' : 'template',
      policy: template.policy,
    },
  };
}

function artifactResult(projectRoot, packageRoot, artifact, expectedOrigin) {
  const { target, sha256, origin, policy } = artifact;
  const source = artifact.packagePath ?? artifact.source;
  const item = { id: `${expectedOrigin}:${target}`, source, target, kind: expectedOrigin, origin, policy };
  if (!isSafeRelativePath(source) || !isSafeRelativePath(target) || !SHA256.test(sha256 ?? '')) {
    return { item: { ...item, action: 'blocked', reason: 'invalid package file mapping' } };
  }
  const sourceInfo = inspectTarget(packageRoot, source);
  if (sourceInfo.state !== 'file') {
    return { item: { ...item, action: 'blocked', reason: sourceInfo.reason ?? `missing package file ${source}` } };
  }
  const content = readFileSync(sourceInfo.absolute);
  if (HASH_BUFFER(content) !== sha256) {
    return { item: { ...item, action: 'blocked', reason: `package file hash mismatch: ${source}` } };
  }
  const targetInfo = inspectTarget(projectRoot, target);
  if (targetInfo.state === 'blocked') return { item: { ...item, action: 'blocked', reason: targetInfo.reason } };
  const previous = targetInfo.state === 'file' ? readFileSync(targetInfo.absolute) : null;
  if (previous && !previous.equals(content)) {
    return { item: { ...item, action: 'conflict', reason: 'target already exists with different content' } };
  }
  const action = previous ? 'adopt' : 'create';
  return {
    item: { ...item, action, contentHash: sha256 },
    operation: {
      target,
      content,
      previous,
      action,
      write: previous === null,
      file: { path: target, sha256, origin, policy },
    },
  };
}

function identityFromLock(lock, pkg, mode, hosts) {
  return lock.aikido.version === pkg.version
    && JSON.stringify(lock.aikido.source) === JSON.stringify(pkg.source)
    && lock.mode === mode
    && JSON.stringify(lock.hosts) === JSON.stringify(hosts);
}

function installedLockMatches(root, lock) {
  for (const file of lock.files) {
    const target = inspectTarget(root, file.path);
    if (target.state !== 'file' || HASH_BUFFER(readFileSync(target.absolute)) !== file.sha256) return false;
    if (file.policy === 'three-way') {
      const baseline = inspectTarget(root, `${BASELINE_DIR}/${file.path}`);
      if (baseline.state !== 'file' || HASH_BUFFER(readFileSync(baseline.absolute)) !== file.sha256) return false;
    }
  }
  for (const block of lock.managedBlocks) {
    const target = inspectTarget(root, block.path);
    if (target.state !== 'file') return false;
    let parsed;
    try {
      const style = block.path === '.gitignore' ? 'hash' : 'html';
      parsed = findBlock(readFileSync(target.absolute, 'utf8'), block.id, style);
    } catch {
      return false;
    }
    if (!parsed || blockHash(parsed.content) !== block.sha256) return false;
  }
  return true;
}

function existingLockStatus(root, pkg, mode, hosts) {
  const target = inspectTarget(root, LOCK_PATH);
  if (target.state === 'missing') return { status: 'missing' };
  if (target.state !== 'file') return { status: 'conflict', reason: target.reason };
  let lock;
  try {
    lock = JSON.parse(readFileSync(target.absolute, 'utf8'));
  } catch (error) {
    return { status: 'conflict', reason: `existing lock cannot be read: ${error.message}` };
  }
  const errors = validateLock(lock);
  if (errors.length) return { status: 'conflict', reason: `existing lock is invalid: ${errors.join('; ')}` };
  if (!identityFromLock(lock, pkg, mode, hosts)) return { status: 'conflict', reason: 'an AI-KIDO lock already exists; use the update workflow' };
  if (!installedLockMatches(root, lock)) {
    return { status: 'conflict', reason: 'the locked installation or baseline cache has changed; use the update workflow' };
  }
  return { status: 'installed', lock };
}

export function planBootstrap({
  root,
  packageRoot,
  mode,
  hosts = [],
  projectName,
  aikidoVersion,
  entries,
  manifest: suppliedManifest,
  templatesDir: suppliedTemplatesDir,
  catalog = loadCatalog(),
}) {
  if (typeof root !== 'string' || root.length === 0) throw new Error('root must be an existing project directory');
  const projectRoot = realpathSync(root);
  if (!lstatSync(projectRoot).isDirectory()) throw new Error('root must be a directory');
  const packagePath = packageRoot ? realpathSync(packageRoot) : null;
  const packageInfo = packagePath ? validatePackage(packagePath, { catalog }) : null;
  const pkg = packageInfo ? JSON.parse(readFileSync(join(packagePath, 'package-manifest.json'), 'utf8')) : null;
  if (pkg) {
    if (hosts.length && (hosts.length !== 1 || hosts[0] !== pkg.host)) {
      throw new Error(`package host ${pkg.host} must be the only selected host`);
    }
    hosts = [pkg.host];
    if (aikidoVersion && aikidoVersion !== pkg.version) throw new Error('aikidoVersion must match the package version');
    aikidoVersion = pkg.version;
  }
  const templatesDir = suppliedTemplatesDir ?? (packagePath ? join(packagePath, 'templates') : DEFAULT_TEMPLATES_DIR);
  const manifest = suppliedManifest ?? loadManifest(templatesDir);
  const manifestErrors = validateManifest(manifest);
  if (manifestErrors.length) throw new Error(`Invalid template manifest:\n${manifestErrors.join('\n')}`);
  if (!Array.isArray(hosts) || hosts.some((host) => !HOSTS.includes(host)) || new Set(hosts).size !== hosts.length) {
    throw new Error('hosts must contain unique known host ids');
  }
  if (typeof projectName !== 'string' || !projectName.trim()) throw new Error('projectName is required');
  if (typeof aikidoVersion !== 'string' || !/^\d+\.\d+(\.\d+)?(-[0-9A-Za-z.-]+)?$/.test(aikidoVersion)) {
    throw new Error('aikidoVersion must be a semantic version');
  }
  if (entries !== undefined && typeof entries !== 'string' && (entries === null || typeof entries !== 'object')) {
    throw new Error('entries must be a string or an object keyed by agents, commands and skills');
  }

  const selected = selectTemplates(manifest, { mode, hosts });
  const values = { PROJECT_NAME: projectName, AIKIDO_VERSION: aikidoVersion };
  const listKinds = { 'agents-list': 'agents', 'commands-list': 'commands', 'skills-list': 'skills' };
  const results = selected.map((template) => {
    const kind = listKinds[template.id];
    const supplied = typeof entries === 'string' ? entries : entries?.[kind];
    const renderedEntries = supplied ?? (kind ? renderCatalogEntries(kind, { hosts, catalog }) : '');
    return templateResult(projectRoot, template, { ...values, ENTRIES: renderedEntries }, templatesDir);
  });
  const operations = results.flatMap((result) => result.operation ? [result.operation] : []);
  const files = results.map((result) => result.item);

  if (pkg) {
    const seen = new Set(files.map((file) => file.target));
    const artifacts = [
      ...pkg.payloadFiles,
      ...pkg.projectFiles,
    ];
    for (const artifact of artifacts) {
      if (seen.has(artifact.target)) {
        files.push({
          id: `${artifact.origin}:${artifact.target}`,
          source: artifact.source,
          target: artifact.target,
          kind: artifact.origin,
          origin: artifact.origin,
          policy: artifact.policy,
          action: 'conflict',
          reason: 'duplicate target from package payload, adapter or template',
        });
        continue;
      }
      seen.add(artifact.target);
      const result = artifactResult(projectRoot, packagePath, artifact, artifact.origin);
      files.push(result.item);
      if (result.operation) operations.push(result.operation);
    }
  }

  const duplicateTargets = new Set();
  const firstTarget = new Set();
  for (const file of files) {
    if (firstTarget.has(file.target)) duplicateTargets.add(file.target);
    firstTarget.add(file.target);
  }
  for (const target of duplicateTargets) {
    files.push({
      id: `collision:${target}`,
      target,
      kind: 'collision',
      action: 'conflict',
      reason: 'multiple manifest entries target the same project path',
    });
  }

  const lockStatus = pkg ? existingLockStatus(projectRoot, pkg, mode, hosts) : { status: 'not-applicable' };
  if (lockStatus.status === 'conflict') {
    files.push({
      id: 'existing-lock',
      target: LOCK_PATH,
      kind: 'lock',
      action: 'conflict',
      reason: lockStatus.reason,
    });
  }
  const conflicts = files.filter((file) => file.action === 'conflict' || file.action === 'blocked');
  const writes = files.filter((file) => file.action === 'create' || file.action === 'update-managed-block');
  const summary = Object.fromEntries(
    ['create', 'update-managed-block', 'adopt', 'unchanged', 'keep-local', 'conflict', 'blocked']
      .map((action) => [action, files.filter((file) => file.action === action).length]),
  );
  const core = {
    schemaVersion: 1,
    root: projectRoot,
    mode,
    hosts,
    aikidoVersion,
    sourceRevision: pkg?.sourceRevision ?? null,
    files,
    summary,
    conflicts,
    ready: conflicts.length === 0,
    confirmationRequired: conflicts.length === 0 && (pkg ? lockStatus.status !== 'installed' : writes.length > 0),
    confirmation: conflicts.length === 0 && (pkg ? lockStatus.status !== 'installed' : writes.length > 0)
      ? 'Review every planned path and explicitly approve this exact plan before application.'
      : null,
    applicationAvailable: Boolean(pkg),
    alreadyInstalled: lockStatus.status === 'installed',
    lockFile: LOCK_PATH,
  };
  const plan = { ...core, planId: HASH(JSON.stringify(core)) };
  PLAN_OPERATIONS.set(plan, {
    operations,
    packageRoot: packagePath,
    packageManifest: pkg,
    lockStatus,
    mode,
    hosts,
    aikidoVersion,
    source: pkg?.source,
  });
  return plan;
}

function mkdirParents(projectRoot, target, createdDirectories) {
  const parentParts = posix.dirname(target).split('/').filter((part) => part && part !== '.');
  let current = projectRoot;
  for (const part of parentParts) {
    current = join(current, part);
    try {
      const info = lstatSync(current);
      if (info.isSymbolicLink() || !info.isDirectory()) throw new Error(`Unsafe parent directory: ${current}`);
    } catch (error) {
      if (error.code !== 'ENOENT') throw error;
      mkdirSync(current, { mode: 0o755 });
      createdDirectories.push(current);
    }
  }
}

function atomicWrite(absolute, content, mode) {
  const temporary = join(dirname(absolute), `.aikido-tmp-${randomUUID()}`);
  try {
    writeFileSync(temporary, content, { flag: 'wx', mode });
    renameSync(temporary, absolute);
  } finally {
    if (existsSync(temporary)) unlinkSync(temporary);
  }
}

function preflightWrite(projectRoot, operation) {
  const target = inspectTarget(projectRoot, operation.target);
  if (target.state === 'blocked') throw new Error(`${operation.target}: ${target.reason}`);
  if (operation.previous === null && target.state !== 'missing') throw new Error(`${operation.target} appeared after confirmation`);
  if (operation.previous !== null) {
    if (target.state !== 'file' || !readFileSync(target.absolute).equals(operation.previous)) {
      throw new Error(`${operation.target} changed after confirmation`);
    }
  }
  return target;
}

export function writeTransaction(projectRoot, operations) {
  const createdDirectories = [];
  const applied = [];
  try {
    for (const operation of operations) {
      const target = preflightWrite(projectRoot, operation);
      if (operation.action !== 'delete') mkdirParents(projectRoot, operation.target, createdDirectories);
      const absolute = target.state === 'file' ? target.absolute : resolve(projectRoot, ...operation.target.split('/'));
      const previousMode = target.state === 'file' ? statSync(absolute).mode & 0o777 : operation.mode ?? 0o644;
      const writeMode = operation.forceMode ? operation.mode : previousMode;
      if (operation.action === 'delete') unlinkSync(absolute);
      else atomicWrite(absolute, operation.content, writeMode);
      applied.push({ absolute, previous: operation.previous, mode: previousMode });
    }
  } catch (error) {
    const rollbackErrors = [];
    for (const item of applied.reverse()) {
      try {
        if (item.previous === null) {
          if (existsSync(item.absolute)) unlinkSync(item.absolute);
        } else {
          atomicWrite(item.absolute, item.previous, item.mode);
        }
      } catch (rollbackError) {
        rollbackErrors.push(`${item.absolute}: ${rollbackError.message}`);
      }
    }
    for (const directory of createdDirectories.reverse()) {
      try { rmdirSync(directory); } catch (rollbackError) {
        if (rollbackError.code !== 'ENOENT' && rollbackError.code !== 'ENOTEMPTY') rollbackErrors.push(`${directory}: ${rollbackError.message}`);
      }
    }
    const suffix = rollbackErrors.length ? `; rollback errors: ${rollbackErrors.join('; ')}` : '';
    throw new Error(`AI-KIDO file transaction failed: ${error.message}${suffix}`, { cause: error });
  }
}

export function applyBootstrap({
  root,
  packageRoot,
  mode,
  hosts = [],
  projectName,
  aikidoVersion,
  expectedPlanId,
  installedAt = new Date().toISOString(),
  catalog = loadCatalog(),
}) {
  if (!packageRoot) throw new Error('packageRoot is required to apply a bootstrap');
  const plan = planBootstrap({ root, packageRoot, mode, hosts, projectName, aikidoVersion, catalog });
  if (plan.alreadyInstalled) return { status: 'already-installed', planId: plan.planId, lockFile: LOCK_PATH };
  if (!plan.ready) throw new Error(`Bootstrap plan contains conflicts:\n${plan.conflicts.map((item) => `${item.target}: ${item.reason}`).join('\n')}`);
  if (expectedPlanId !== plan.planId) throw new Error(`Confirmation does not match the current plan (expected ${plan.planId})`);

  const prepared = PLAN_OPERATIONS.get(plan);
  const files = [];
  const managedBlocks = [];
  for (const operation of prepared.operations) {
    if (operation.file) {
      files.push(operation.file);
      if (operation.file.policy === 'three-way') {
        const baselinePath = `${BASELINE_DIR}/${operation.file.path}`;
        const baselineTarget = inspectTarget(plan.root, baselinePath);
        if (baselineTarget.state === 'blocked') throw new Error(`${baselinePath}: ${baselineTarget.reason}`);
        const previous = baselineTarget.state === 'file' ? readFileSync(baselineTarget.absolute) : null;
        if (previous && !previous.equals(operation.content)) {
          throw new Error(`Baseline conflict at ${baselinePath}; refusing to overwrite`);
        }
        operation.baseline = {
          target: baselinePath,
          content: operation.content,
          previous,
          write: previous === null,
          mode: 0o600,
        };
      }
    }
    if (operation.block) managedBlocks.push(operation.block);
  }
  files.sort((a, b) => (a.path < b.path ? -1 : a.path > b.path ? 1 : 0));
  managedBlocks.sort((a, b) => (a.path < b.path ? -1 : a.path > b.path ? 1 : a.id.localeCompare(b.id)));

  const lock = {
    schemaVersion: LOCK_SCHEMA_VERSION,
    aikido: { version: prepared.aikidoVersion, source: prepared.source },
    mode: prepared.mode,
    hosts: prepared.hosts,
    installedAt,
    files,
    managedBlocks,
  };
  const lockErrors = validateLock(lock);
  if (lockErrors.length) throw new Error(`Generated lock is invalid:\n${lockErrors.join('\n')}`);

  const writes = [];
  for (const operation of prepared.operations) {
    if (operation.write) writes.push(operation);
    if (operation.baseline?.write) writes.push(operation.baseline);
  }
  const lockTarget = inspectTarget(plan.root, LOCK_PATH);
  if (lockTarget.state !== 'missing') throw new Error('Lock path appeared after confirmation; refusing to overwrite it');
  writes.push({
    target: LOCK_PATH,
    content: Buffer.from(`${JSON.stringify(lock, null, 2)}\n`),
    previous: null,
    mode: 0o644,
    write: true,
  });

  writeTransaction(plan.root, writes);
  return {
    status: 'installed',
    planId: plan.planId,
    lockFile: LOCK_PATH,
    filesWritten: writes.length,
    installedAt,
  };
}
