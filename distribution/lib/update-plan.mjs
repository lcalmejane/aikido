import { createHash, randomUUID } from 'node:crypto';
import {
  lstatSync, mkdirSync, readFileSync, realpathSync, rmSync, statSync, writeFileSync,
} from 'node:fs';
import { basename, dirname, join, relative, resolve, sep } from 'node:path';
import { inspectTarget, writeTransaction } from './bootstrap-plan.mjs';
import {
  BASELINE_DIR, LOCK_PATH, LOCK_SCHEMA_VERSION, MODES, classify, isSafeRelativePath, validateLock,
} from './lock.mjs';
import { loadCatalog, renderCatalogEntries } from './catalog.mjs';
import { blockHash, findBlock, removeBlock, upsertBlock } from './managed-blocks.mjs';
import { validatePackage } from './package.mjs';
import { loadManifest, readTemplate, render, selectTemplates, validateManifest } from './templates.mjs';

const PLAN_OPERATIONS = new WeakMap();
const HASH = (bytes) => createHash('sha256').update(bytes).digest('hex');
const BACKUP_ROOT = '.aikido/backups/updates';

function readLock(root) {
  const target = inspectTarget(root, LOCK_PATH);
  if (target.state !== 'file') throw new Error(`A valid installed ${LOCK_PATH} is required before updating`);
  let lock;
  try {
    lock = JSON.parse(readFileSync(target.absolute, 'utf8'));
  } catch (error) {
    throw new Error(`Cannot read ${LOCK_PATH}: ${error.message}`);
  }
  const errors = validateLock(lock);
  if (errors.length) throw new Error(`Invalid ${LOCK_PATH}:\n${errors.join('\n')}`);
  return { lock, bytes: readFileSync(target.absolute) };
}

function candidateFromArtifact(packageRoot, artifact) {
  if (!artifact || !isSafeRelativePath(artifact.target) || !isSafeRelativePath(artifact.packagePath ?? artifact.source)) {
    throw new Error(`Invalid package file mapping for ${artifact?.target ?? '(unknown target)'}`);
  }
  const source = artifact.packagePath ?? artifact.source;
  const sourceInfo = inspectTarget(packageRoot, source);
  if (sourceInfo.state !== 'file') throw new Error(`Package file is unavailable: ${source}`);
  const content = readFileSync(sourceInfo.absolute);
  if (HASH(content) !== artifact.sha256) throw new Error(`Package file hash mismatch: ${source}`);
  return {
    target: artifact.target,
    source,
    content,
    sha256: artifact.sha256,
    origin: artifact.origin,
    policy: artifact.policy,
  };
}

function candidatesFromPackage(root, packageRoot, pkg, { mode, hosts, catalog }) {
  const candidates = [];
  for (const artifact of [...pkg.payloadFiles, ...pkg.projectFiles]) {
    candidates.push(candidateFromArtifact(packageRoot, artifact));
  }

  const templatesDir = join(packageRoot, 'templates');
  const manifest = loadManifest(templatesDir);
  const manifestErrors = validateManifest(manifest);
  if (manifestErrors.length) throw new Error(`Invalid package template manifest:\n${manifestErrors.join('\n')}`);
  const listKinds = { 'agents-list': 'agents', 'commands-list': 'commands', 'skills-list': 'skills' };
  const values = { PROJECT_NAME: basename(root), AIKIDO_VERSION: pkg.version };
  const blocks = [];
  for (const template of selectTemplates(manifest, { mode, hosts })) {
    const source = `templates/${template.source}`;
    const templateText = readTemplate(template, templatesDir);
    if (template.kind === 'managed-block') {
      blocks.push({
        target: template.target,
        source,
        id: template.blockId,
        style: template.style,
        content: render(templateText, values),
      });
      continue;
    }
    const kind = listKinds[template.id];
    const entries = kind ? renderCatalogEntries(kind, { hosts, catalog }) : '';
    candidates.push({
      target: template.target,
      source,
      content: Buffer.from(render(templateText, { ...values, ENTRIES: entries })),
      origin: template.kind === 'generated' ? 'generated' : 'template',
      policy: template.policy,
    });
  }
  return { candidates, blocks };
}

function conflict(files, target, reason, kind = 'payload') {
  files.push({ target, kind, action: 'conflict', reason });
}

function addBaselineOperation(root, target, content, files, operations) {
  const baselinePath = `${BASELINE_DIR}/${target}`;
  const current = inspectTarget(root, baselinePath);
  if (current.state === 'blocked') {
    conflict(files, baselinePath, current.reason, 'baseline');
    return;
  }
  const previous = current.state === 'file' ? readFileSync(current.absolute) : null;
  if (!previous?.equals(content)) {
    operations.push({
      target: baselinePath,
      content,
      previous,
      mode: 0o600,
      action: 'write',
    });
  }
}

function addDeletion(root, target, files, kind) {
  const current = inspectTarget(root, target);
  if (current.state === 'blocked') {
    conflict(files, target, current.reason, kind);
    return null;
  }
  return current.state === 'file' ? readFileSync(current.absolute) : null;
}

function processFileCandidate(root, candidate, oldEntry, nextFiles, files, operations) {
  const { target, content, policy, origin } = candidate;
  if (oldEntry && (oldEntry.policy !== policy || oldEntry.policy === 'managed-block')) {
    conflict(files, target, 'update policy changed since installation', origin);
    return;
  }
  const current = inspectTarget(root, target);
  if (current.state === 'blocked') {
    conflict(files, target, current.reason, origin);
    return;
  }
  const local = current.state === 'file' ? readFileSync(current.absolute) : null;
  const baseHash = oldEntry?.sha256 ?? null;
  const localHash = local === null ? null : HASH(local);
  const nextHash = HASH(content);
  const policyForMerge = oldEntry?.policy ?? policy;
  let action = classify({ base: baseHash, local: localHash, next: nextHash, policy: policyForMerge });
  if (action === 'keep-local' && oldEntry && localHash === nextHash && nextHash !== baseHash) action = 'adopt';
  if (action.startsWith('conflict')) {
    conflict(files, target, action === 'conflict-collision'
      ? 'target exists with different content and is not tracked by this lock'
      : action === 'conflict-deleted-locally'
        ? 'tracked file was deleted locally and also changed upstream'
        : 'local and upstream content both changed from the installed baseline', origin);
    return;
  }
  files.push({
    target,
    source: candidate.source,
    kind: origin,
    origin,
    policy,
    action,
    baseHash,
    localHash,
    nextHash,
  });

  if (action === 'add' || action === 'update') {
    operations.push({ target, content, previous: local, action: 'write' });
  }
  if (action === 'delete') {
    operations.push({ target, content: null, previous: local, action: 'delete' });
    const baseline = addDeletion(root, `${BASELINE_DIR}/${target}`, files, 'baseline');
    if (baseline !== null) {
      operations.push({
        target: `${BASELINE_DIR}/${target}`,
        content: null,
        previous: baseline,
        action: 'delete',
      });
    }
    return;
  }
  if (action === 'keep-modified-orphan') {
    const baselineTarget = `${BASELINE_DIR}/${target}`;
    const baseline = addDeletion(root, baselineTarget, files, 'baseline');
    if (baseline !== null) {
      operations.push({ target: baselineTarget, content: null, previous: baseline, action: 'delete' });
    }
    return;
  }
  if (policy === 'three-way' && action !== 'keep-deleted') {
    addBaselineOperation(root, target, content, files, operations);
  }
  if (action === 'create-only' || policy === 'create-only') {
    if (oldEntry) nextFiles.set(target, oldEntry);
    else if (action === 'add') {
      nextFiles.set(target, { path: target, sha256: nextHash, origin, policy });
    }
    return;
  }
  if (action === 'keep-deleted') {
    if (oldEntry) nextFiles.set(target, oldEntry);
    return;
  }
  nextFiles.set(target, { path: target, sha256: nextHash, origin, policy });
}

function processRemovedFile(root, oldEntry, files, operations, nextFiles) {
  if (oldEntry.policy === 'create-only') {
    nextFiles.set(oldEntry.path, oldEntry);
    return;
  }
  const current = inspectTarget(root, oldEntry.path);
  if (current.state === 'blocked') {
    conflict(files, oldEntry.path, current.reason, oldEntry.origin);
    return;
  }
  const local = current.state === 'file' ? readFileSync(current.absolute) : null;
  const localHash = local === null ? null : HASH(local);
  const action = classify({ base: oldEntry.sha256, local: localHash, next: null });
  files.push({
    target: oldEntry.path,
    kind: oldEntry.origin,
    origin: oldEntry.origin,
    policy: oldEntry.policy,
    action,
    baseHash: oldEntry.sha256,
    localHash,
    nextHash: null,
  });
  if (action === 'delete') {
    operations.push({ target: oldEntry.path, content: null, previous: local, action: 'delete' });
  } else if (action === 'conflict-deleted-locally') {
    conflict(files, oldEntry.path, 'tracked file was deleted locally before upstream removal', oldEntry.origin);
    return;
  }
  if (action === 'delete' || action === 'keep-modified-orphan' || action === 'unchanged') {
    const baselinePath = `${BASELINE_DIR}/${oldEntry.path}`;
    const baseline = addDeletion(root, baselinePath, files, 'baseline');
    if (baseline !== null) operations.push({ target: baselinePath, content: null, previous: baseline, action: 'delete' });
  }
}

function processBlock(root, block, oldBlocks, nextBlocks, files, operations) {
  const old = oldBlocks.find((entry) => entry.path === block.target && entry.id === block.id);
  const target = inspectTarget(root, block.target);
  if (target.state === 'blocked') {
    conflict(files, block.target, target.reason, 'managed-block');
    return;
  }
  const previous = target.state === 'file' ? readFileSync(target.absolute) : null;
  const currentText = previous?.toString('utf8') ?? '';
  let existing;
  try {
    existing = findBlock(currentText, block.id, block.style);
  } catch (error) {
    conflict(files, block.target, error.message, 'managed-block');
    return;
  }
  const currentHash = existing ? blockHash(existing.content) : null;
  const nextHash = blockHash(block.content);
  if (old && currentHash !== old.sha256 && currentHash !== nextHash) {
    conflict(files, block.target, `managed block "${block.id}" was modified locally`, 'managed-block');
    return;
  }
  if (!old && existing && currentHash !== nextHash) {
    conflict(files, block.target, `managed block "${block.id}" exists with untracked content`, 'managed-block');
    return;
  }
  const updated = Buffer.from(upsertBlock(currentText, block.id, block.content, block.style));
  const action = currentHash === nextHash ? 'unchanged' : existing ? 'update-managed-block' : 'add-managed-block';
  files.push({
    target: block.target,
    source: block.source,
    kind: 'managed-block',
    id: block.id,
    action,
    baseHash: old?.sha256 ?? null,
    localHash: currentHash,
    nextHash,
  });
  if (!previous || !previous.equals(updated)) {
    operations.push({ target: block.target, content: updated, previous, action: 'write' });
  }
  nextBlocks.set(`${block.target}#${block.id}`, {
    path: block.target,
    id: block.id,
    sha256: nextHash,
  });
}

export function planUpdate({
  root,
  packageRoot,
  catalog = loadCatalog(),
}) {
  if (!root || !packageRoot) throw new Error('root and packageRoot are required to plan an update');
  const projectRoot = realpathSync(resolve(root));
  if (!lstatSync(projectRoot).isDirectory()) throw new Error('Project root must be a directory');
  const packagePath = realpathSync(resolve(packageRoot));
  validatePackage(packagePath, { catalog });
  const { lock, bytes: lockBytes } = readLock(projectRoot);
  const pkg = JSON.parse(readFileSync(join(packagePath, 'package-manifest.json'), 'utf8'));
  if (lock.hosts.length !== 1 || lock.hosts[0] !== pkg.host) {
    throw new Error('Update package host must match the single host recorded in the project lock');
  }

  const { candidates, blocks } = candidatesFromPackage(projectRoot, packagePath, pkg, {
    mode: lock.mode,
    hosts: lock.hosts,
    catalog,
  });
  const files = [];
  const operations = [];
  const nextFiles = new Map();
  const oldFiles = new Map(lock.files.map((entry) => [entry.path, entry]));
  const candidatePaths = new Set();
  for (const candidate of candidates) {
    if (candidatePaths.has(candidate.target)) {
      conflict(files, candidate.target, 'multiple package files target the same project path', candidate.origin);
      continue;
    }
    candidatePaths.add(candidate.target);
    processFileCandidate(
      projectRoot,
      candidate,
      oldFiles.get(candidate.target),
      nextFiles,
      files,
      operations,
    );
  }
  for (const oldEntry of lock.files) {
    if (!candidatePaths.has(oldEntry.path)) processRemovedFile(projectRoot, oldEntry, files, operations, nextFiles);
  }

  const nextBlocks = new Map(lock.managedBlocks.map((entry) => [`${entry.path}#${entry.id}`, entry]));
  for (const block of blocks) {
    processBlock(projectRoot, block, lock.managedBlocks, nextBlocks, files, operations);
  }

  const nextLock = {
    schemaVersion: LOCK_SCHEMA_VERSION,
    aikido: { version: pkg.version, source: pkg.source },
    mode: lock.mode,
    hosts: lock.hosts,
    installedAt: lock.installedAt,
    files: [...nextFiles.values()].sort((a, b) => a.path.localeCompare(b.path)),
    managedBlocks: [...nextBlocks.values()].sort((a, b) => a.path.localeCompare(b.path) || a.id.localeCompare(b.id)),
  };
  const lockErrors = validateLock(nextLock);
  if (lockErrors.length) throw new Error(`Generated update lock is invalid:\n${lockErrors.join('\n')}`);
  const nextLockBytes = Buffer.from(`${JSON.stringify(nextLock, null, 2)}\n`);
  if (!nextLockBytes.equals(lockBytes)) {
    operations.push({
      target: LOCK_PATH,
      content: nextLockBytes,
      previous: lockBytes,
      mode: 0o644,
      action: 'write',
    });
  }

  const conflicts = files.filter((item) => item.action === 'conflict' || item.action === 'blocked'
    || item.action === 'conflict-collision' || item.action === 'conflict-deleted-locally');
  const summary = Object.fromEntries(
    [...new Set(files.map((item) => item.action))].sort()
      .map((action) => [action, files.filter((item) => item.action === action).length]),
  );
  const core = {
    schemaVersion: 1,
    root: projectRoot,
    packageRoot: packagePath,
    currentVersion: lock.aikido.version,
    nextVersion: pkg.version,
    sourceRevision: pkg.sourceRevision,
    files,
    summary,
    conflicts,
    ready: conflicts.length === 0,
    changesRequired: operations.length > 0,
    confirmationRequired: conflicts.length === 0 && operations.length > 0,
    lockFile: LOCK_PATH,
    nextLock,
  };
  const plan = { ...core, planId: HASH(Buffer.from(JSON.stringify(core))) };
  PLAN_OPERATIONS.set(plan, { operations });
  return plan;
}

export function backupOperations(projectRoot, operations, kind = 'update') {
  if (!['update', 'migration', 'uninstall'].includes(kind)) throw new Error(`Unknown backup kind: ${kind}`);
  const id = `${kind}-${randomUUID()}`;
  const backupRoot = join(projectRoot, BACKUP_ROOT);
  const backupDirectory = join(backupRoot, id);
  const backupRelative = `${BACKUP_ROOT}/${id}`;
  const preexisting = inspectTarget(projectRoot, `${backupRelative}/manifest.json`);
  if (preexisting.state === 'blocked' || preexisting.state === 'file') {
    throw new Error(`Unsafe or duplicate update backup path: ${backupRelative}`);
  }
  const created = [];
  let backupCreated = false;
  try {
    try {
      lstatSync(backupDirectory);
      throw new Error(`Update backup already exists: ${backupRelative}`);
    } catch (error) {
      if (error.code !== 'ENOENT') throw error;
    }
    const parents = BACKUP_ROOT.split('/');
    let current = projectRoot;
    for (const part of parents) {
      current = join(current, part);
      try {
        const info = lstatSync(current);
        if (info.isSymbolicLink() || !info.isDirectory()) throw new Error(`Unsafe backup directory: ${current}`);
      } catch (error) {
        if (error.code !== 'ENOENT') throw error;
        mkdirSync(current, { mode: 0o700 });
        created.push(current);
      }
    }
    mkdirSync(backupDirectory, { mode: 0o700 });
    backupCreated = true;
    const items = [];
    const targets = new Set();
    for (const operation of operations) {
      if (targets.has(operation.target)) continue;
      targets.add(operation.target);
      const target = inspectTarget(projectRoot, operation.target);
      if (target.state === 'blocked') throw new Error(`${operation.target}: ${target.reason}`);
      const existed = target.state === 'file';
      const content = existed ? readFileSync(target.absolute) : null;
      const mode = existed ? statSync(target.absolute).mode & 0o777 : operation.mode ?? 0o644;
      const backupPath = `files/${operation.target}`;
      if (content) {
        const backupFile = join(backupDirectory, ...backupPath.split('/'));
        mkdirSync(dirname(backupFile), { recursive: true, mode: 0o700 });
        writeFileSync(backupFile, content, { flag: 'wx', mode: 0o600 });
      }
      items.push({
        path: operation.target,
        existed,
        backupPath: content ? backupPath : null,
        sha256: content ? HASH(content) : null,
        mode,
      });
    }
    const manifest = {
      schemaVersion: 1,
      id,
      createdAt: new Date().toISOString(),
      files: items,
    };
    writeFileSync(
      join(backupDirectory, 'manifest.json'),
      `${JSON.stringify(manifest, null, 2)}\n`,
      { flag: 'wx', mode: 0o600 },
    );
    return { id, path: backupRelative };
  } catch (error) {
    if (backupCreated) rmSync(backupDirectory, { recursive: true, force: true });
    for (const directory of created.reverse()) {
      try { rmSync(directory, { recursive: false }); } catch { /* Preserve the original backup error. */ }
    }
    throw new Error(`Could not create update backup: ${error.message}`, { cause: error });
  }
}

export function applyUpdate({ root, packageRoot, expectedPlanId, catalog = loadCatalog() }) {
  if (typeof expectedPlanId !== 'string' || !expectedPlanId) {
    throw new Error('expectedPlanId is required to apply an update');
  }
  const plan = planUpdate({ root, packageRoot, catalog });
  if (expectedPlanId !== plan.planId) throw new Error(`Confirmation does not match the current plan (expected ${plan.planId})`);
  if (!plan.ready) {
    throw new Error(`Update plan contains conflicts:\n${plan.conflicts.map((item) => `${item.target}: ${item.reason}`).join('\n')}`);
  }
  if (!plan.changesRequired) return { status: 'up-to-date', planId: plan.planId };

  const prepared = PLAN_OPERATIONS.get(plan);
  const backup = backupOperations(plan.root, prepared.operations);
  try {
    writeTransaction(plan.root, prepared.operations);
  } catch (error) {
    throw new Error(`${error.message}; recovery backup retained at ${backup.path}`, { cause: error });
  }
  return {
    status: 'updated',
    planId: plan.planId,
    backup: backup.path,
    filesChanged: prepared.operations.filter((item) => item.action !== 'delete').length,
  };
}

export function restoreUpdateBackup({ root, backupPath }) {
  if (!root || !backupPath) throw new Error('root and backupPath are required to restore an update');
  const projectRoot = realpathSync(resolve(root));
  const absoluteBackup = resolve(projectRoot, backupPath);
  const relativeBackup = relative(projectRoot, absoluteBackup).split(sep).join('/');
  const parts = relativeBackup.split('/');
  if (parts.length !== 4 || parts.slice(0, 3).join('/') !== BACKUP_ROOT
    || !/^(update|migration|uninstall)-[0-9a-f-]+$/.test(parts[3])) {
    throw new Error(`Recovery backup must be inside ${BACKUP_ROOT}/<update-id>`);
  }
  const directoryInfo = lstatSync(absoluteBackup);
  if (directoryInfo.isSymbolicLink() || !directoryInfo.isDirectory()) throw new Error('Recovery backup must be a regular directory');
  const manifestTarget = inspectTarget(projectRoot, `${relativeBackup}/manifest.json`);
  if (manifestTarget.state !== 'file') throw new Error('Recovery backup manifest is missing or unsafe');
  let manifest;
  try {
    manifest = JSON.parse(readFileSync(manifestTarget.absolute, 'utf8'));
  } catch (error) {
    throw new Error(`Cannot read recovery backup manifest: ${error.message}`);
  }
  if (manifest.schemaVersion !== 1 || manifest.id !== parts[3]
    || Number.isNaN(Date.parse(manifest.createdAt ?? '')) || !Array.isArray(manifest.files)) {
    throw new Error('Invalid recovery backup manifest');
  }

  const operations = [];
  const seen = new Set();
  for (const item of manifest.files) {
    if (!item || !isSafeRelativePath(item.path) || item.path === '.aikido/backups'
      || item.path.startsWith('.aikido/backups/') || seen.has(item.path)) {
      throw new Error('Invalid or duplicate recovery target');
    }
    seen.add(item.path);
    if (typeof item.existed !== 'boolean') throw new Error(`Invalid recovery state for ${item.path}`);
    if (!Number.isInteger(item.mode) || item.mode < 0 || item.mode > 0o777) throw new Error(`Invalid recovery mode for ${item.path}`);
    const current = inspectTarget(projectRoot, item.path);
    if (current.state === 'blocked') throw new Error(`${item.path}: ${current.reason}`);
    const previous = current.state === 'file' ? readFileSync(current.absolute) : null;
    if (item.existed) {
      if (item.backupPath !== `files/${item.path}` || !/^[0-9a-f]{64}$/.test(item.sha256 ?? '')) {
        throw new Error(`Invalid backup entry for ${item.path}`);
      }
      const stored = inspectTarget(absoluteBackup, item.backupPath);
      if (stored.state !== 'file') throw new Error(`Backup content is missing or unsafe for ${item.path}`);
      const content = readFileSync(stored.absolute);
      if (HASH(content) !== item.sha256) throw new Error(`Backup content hash mismatch for ${item.path}`);
      if (!previous?.equals(content)) {
        operations.push({
          target: item.path,
          content,
          previous,
          mode: item.mode,
          forceMode: true,
          action: 'write',
        });
      }
    } else {
      if (item.backupPath !== null || item.sha256 !== null) throw new Error(`Invalid absent-file backup entry for ${item.path}`);
      if (previous !== null) operations.push({ target: item.path, content: null, previous, action: 'delete' });
    }
  }
  operations.sort((a, b) => {
    if (a.target === LOCK_PATH) return b.target === LOCK_PATH ? 0 : 1;
    if (b.target === LOCK_PATH) return -1;
    return a.target.localeCompare(b.target);
  });
  writeTransaction(projectRoot, operations);
  return { status: 'restored', backup: relativeBackup, filesRestored: operations.length };
}

export function planMigration({
  root,
  packageRoot,
  mode = 'UNSET',
  catalog = loadCatalog(),
}) {
  if (!root || !packageRoot) throw new Error('root and packageRoot are required to plan a migration');
  if (!MODES.includes(mode)) throw new Error(`Unknown migration mode: ${mode}`);
  const projectRoot = realpathSync(resolve(root));
  if (!lstatSync(projectRoot).isDirectory()) throw new Error('Project root must be a directory');
  const packagePath = realpathSync(resolve(packageRoot));
  validatePackage(packagePath, { catalog });
  const lockTarget = inspectTarget(projectRoot, LOCK_PATH);
  if (lockTarget.state !== 'missing') throw new Error(`Migration requires a project without ${LOCK_PATH}`);
  if (inspectTarget(projectRoot, 'prompts/hard_points/ai-kido.md').state !== 'file') {
    throw new Error('Migration requires an existing prompts/hard_points/ai-kido.md installation');
  }
  const pkg = JSON.parse(readFileSync(join(packagePath, 'package-manifest.json'), 'utf8'));
  const { candidates, blocks } = candidatesFromPackage(projectRoot, packagePath, pkg, {
    mode,
    hosts: [pkg.host],
    catalog,
  });
  const files = [];
  const operations = [];
  const lockFiles = [];
  for (const candidate of candidates) {
    if (candidate.policy !== 'three-way') continue;
    const current = inspectTarget(projectRoot, candidate.target);
    if (current.state === 'blocked') {
      conflict(files, candidate.target, current.reason, candidate.origin);
      continue;
    }
    if (current.state === 'missing') {
      files.push({
        target: candidate.target,
        kind: candidate.origin,
        action: 'absent-preserved',
        sourceHash: HASH(candidate.content),
      });
      continue;
    }
    const local = readFileSync(current.absolute);
    const sourceHash = HASH(candidate.content);
    const baselinePath = `${BASELINE_DIR}/${candidate.target}`;
    const baseline = inspectTarget(projectRoot, baselinePath);
    if (baseline.state === 'blocked') {
      conflict(files, baselinePath, baseline.reason, 'baseline');
      continue;
    }
    const previousBaseline = baseline.state === 'file' ? readFileSync(baseline.absolute) : null;
    if (previousBaseline && !previousBaseline.equals(candidate.content)) {
      conflict(files, baselinePath, 'an untracked baseline already exists with different content', 'baseline');
      continue;
    }
    if (!previousBaseline) {
      operations.push({
        target: baselinePath,
        content: candidate.content,
        previous: null,
        mode: 0o600,
        action: 'write',
      });
    }
    const localHash = HASH(local);
    files.push({
      target: candidate.target,
      source: candidate.source,
      kind: candidate.origin,
      action: localHash === sourceHash ? 'adopt' : 'keep-local',
      localHash,
      sourceHash,
    });
    lockFiles.push({
      path: candidate.target,
      sha256: sourceHash,
      origin: candidate.origin,
      policy: 'three-way',
    });
  }

  const managedBlocks = [];
  for (const block of blocks) {
    const target = inspectTarget(projectRoot, block.target);
    if (target.state === 'blocked') {
      conflict(files, block.target, target.reason, 'managed-block');
      continue;
    }
    if (target.state === 'missing') {
      files.push({ target: block.target, kind: 'managed-block', id: block.id, action: 'absent-preserved' });
      continue;
    }
    const text = readFileSync(target.absolute, 'utf8');
    let existing;
    try {
      existing = findBlock(text, block.id, block.style);
    } catch {
      files.push({
        target: block.target,
        kind: 'managed-block',
        id: block.id,
        action: 'keep-local-unmanaged',
      });
      continue;
    }
    const sourceHash = blockHash(block.content);
    const localHash = existing ? blockHash(existing.content) : null;
    if (existing && localHash === sourceHash) {
      managedBlocks.push({ path: block.target, id: block.id, sha256: sourceHash });
      files.push({ target: block.target, kind: 'managed-block', id: block.id, action: 'adopt' });
    } else {
      files.push({
        target: block.target,
        kind: 'managed-block',
        id: block.id,
        action: existing ? 'keep-local-unmanaged' : 'absent-preserved',
        localHash,
        sourceHash,
      });
    }
  }

  const nextLock = {
    schemaVersion: LOCK_SCHEMA_VERSION,
    aikido: { version: pkg.version, source: pkg.source },
    mode,
    hosts: [pkg.host],
    installedAt: new Date().toISOString(),
    files: lockFiles.sort((a, b) => a.path.localeCompare(b.path)),
    managedBlocks: managedBlocks.sort((a, b) => a.path.localeCompare(b.path) || a.id.localeCompare(b.id)),
  };
  const errors = validateLock(nextLock);
  if (errors.length) throw new Error(`Generated migration lock is invalid:\n${errors.join('\n')}`);
  const lockContent = Buffer.from(`${JSON.stringify(nextLock, null, 2)}\n`);
  operations.push({
    target: LOCK_PATH,
    content: lockContent,
    previous: null,
    mode: 0o644,
    action: 'write',
  });

  const conflicts = files.filter((item) => item.action === 'conflict' || item.action === 'blocked');
  const core = {
    schemaVersion: 1,
    operation: 'migrate',
    root: projectRoot,
    packageRoot: packagePath,
    sourceRevision: pkg.sourceRevision,
    mode,
    host: pkg.host,
    files,
    conflicts,
    ready: conflicts.length === 0,
    confirmationRequired: conflicts.length === 0,
    nextLock,
  };
  const confirmation = { ...core, nextLock: { ...nextLock, installedAt: null } };
  const plan = { ...core, planId: HASH(Buffer.from(JSON.stringify(confirmation))) };
  PLAN_OPERATIONS.set(plan, { operations });
  return plan;
}

export function applyMigration({ root, packageRoot, mode = 'UNSET', expectedPlanId, catalog = loadCatalog() }) {
  if (typeof expectedPlanId !== 'string' || !expectedPlanId) {
    throw new Error('expectedPlanId is required to apply a migration');
  }
  const plan = planMigration({ root, packageRoot, mode, catalog });
  if (expectedPlanId !== plan.planId) throw new Error(`Confirmation does not match the current plan (expected ${plan.planId})`);
  if (!plan.ready) {
    throw new Error(`Migration plan contains conflicts:\n${plan.conflicts.map((item) => `${item.target}: ${item.reason}`).join('\n')}`);
  }
  const backup = backupOperations(plan.root, PLAN_OPERATIONS.get(plan).operations, 'migration');
  try {
    writeTransaction(plan.root, PLAN_OPERATIONS.get(plan).operations);
  } catch (error) {
    throw new Error(`${error.message}; recovery backup retained at ${backup.path}`, { cause: error });
  }
  return { status: 'migrated', planId: plan.planId, lockFile: LOCK_PATH, backup: backup.path };
}

function isManagedWrapper(path, host) {
  if (host.agentConfiguration?.target === path) return false;
  const roots = [
    host.projectCommandFiles ? host.commandTarget : null,
    host.projectSystemSkillFiles ? host.systemSkillTarget : null,
    host.projectAgentFiles ? host.agentTarget : null,
  ].filter(Boolean);
  return roots.some((target) => path.startsWith(`${target}/`));
}

export function planUninstall({ root, catalog = loadCatalog() }) {
  if (!root) throw new Error('root is required to plan an uninstall');
  const projectRoot = realpathSync(resolve(root));
  if (!lstatSync(projectRoot).isDirectory()) throw new Error('Project root must be a directory');
  const { lock, bytes: lockBytes } = readLock(projectRoot);
  const files = [];
  const operations = [];
  const hostRecords = lock.hosts.map((host) => catalog.hosts[host]).filter(Boolean);
  const keepFiles = [];
  for (const entry of lock.files) {
    const remove = entry.origin === 'adapter' && hostRecords.some((host) => isManagedWrapper(entry.path, host));
    if (!remove) {
      keepFiles.push(entry);
      continue;
    }
    const target = inspectTarget(projectRoot, entry.path);
    if (target.state === 'blocked') {
      conflict(files, entry.path, target.reason, 'adapter');
      continue;
    }
    const local = target.state === 'file' ? readFileSync(target.absolute) : null;
    const localHash = local === null ? null : HASH(local);
    const action = local === null ? 'already-missing' : localHash === entry.sha256 ? 'remove' : 'keep-modified';
    files.push({ target: entry.path, kind: 'adapter', action, localHash, installedHash: entry.sha256 });
    if (action === 'remove') operations.push({ target: entry.path, content: null, previous: local, action: 'delete' });

    const baselinePath = `${BASELINE_DIR}/${entry.path}`;
    const baseline = inspectTarget(projectRoot, baselinePath);
    if (baseline.state === 'blocked') {
      conflict(files, baselinePath, baseline.reason, 'baseline');
      continue;
    }
    if (baseline.state === 'file') {
      const content = readFileSync(baseline.absolute);
      operations.push({ target: baselinePath, content: null, previous: content, action: 'delete' });
    }
  }

  const keepBlocks = [];
  for (const entry of lock.managedBlocks) {
    const target = inspectTarget(projectRoot, entry.path);
    if (target.state === 'blocked') {
      conflict(files, entry.path, target.reason, 'managed-block');
      continue;
    }
    if (target.state === 'missing') {
      files.push({ target: entry.path, id: entry.id, kind: 'managed-block', action: 'already-missing' });
      continue;
    }
    const text = readFileSync(target.absolute, 'utf8');
    const style = entry.path === '.gitignore' ? 'hash' : 'html';
    let block;
    try {
      block = findBlock(text, entry.id, style);
    } catch {
      files.push({ target: entry.path, id: entry.id, kind: 'managed-block', action: 'keep-malformed' });
      continue;
    }
    if (!block) {
      files.push({ target: entry.path, id: entry.id, kind: 'managed-block', action: 'already-missing' });
      continue;
    }
    if (blockHash(block.content) !== entry.sha256) {
      files.push({ target: entry.path, id: entry.id, kind: 'managed-block', action: 'keep-modified' });
      continue;
    }
    const updated = Buffer.from(removeBlock(text, entry.id, style));
    operations.push({ target: entry.path, content: updated, previous: Buffer.from(text), action: 'write' });
    files.push({ target: entry.path, id: entry.id, kind: 'managed-block', action: 'remove' });
  }

  const removedPaths = new Set(files.filter((item) => item.kind === 'adapter').map((item) => item.target));
  const nextLock = {
    ...lock,
    files: keepFiles.filter((entry) => !removedPaths.has(entry.path)).sort((a, b) => a.path.localeCompare(b.path)),
    managedBlocks: keepBlocks,
  };
  const lockErrors = validateLock(nextLock);
  if (lockErrors.length) throw new Error(`Generated uninstall lock is invalid:\n${lockErrors.join('\n')}`);
  const nextLockBytes = Buffer.from(`${JSON.stringify(nextLock, null, 2)}\n`);
  if (!nextLockBytes.equals(lockBytes)) {
    operations.push({
      target: LOCK_PATH,
      content: nextLockBytes,
      previous: lockBytes,
      mode: 0o644,
      action: 'write',
    });
  }
  const conflicts = files.filter((item) => item.action === 'conflict' || item.action === 'blocked');
  const core = {
    schemaVersion: 1,
    operation: 'uninstall-adapters',
    root: projectRoot,
    files,
    conflicts,
    ready: conflicts.length === 0,
    confirmationRequired: conflicts.length === 0 && operations.length > 0,
    lockFile: LOCK_PATH,
    nextLock,
  };
  const plan = { ...core, planId: HASH(Buffer.from(JSON.stringify(core))) };
  PLAN_OPERATIONS.set(plan, { operations });
  return plan;
}

export function applyUninstall({ root, expectedPlanId, catalog = loadCatalog() }) {
  if (typeof expectedPlanId !== 'string' || !expectedPlanId) {
    throw new Error('expectedPlanId is required to apply an uninstall');
  }
  const plan = planUninstall({ root, catalog });
  if (expectedPlanId !== plan.planId) throw new Error(`Confirmation does not match the current plan (expected ${plan.planId})`);
  if (!plan.ready) {
    throw new Error(`Uninstall plan contains conflicts:\n${plan.conflicts.map((item) => `${item.target}: ${item.reason}`).join('\n')}`);
  }
  const operations = PLAN_OPERATIONS.get(plan).operations;
  if (!operations.length) return { status: 'already-uninstalled', planId: plan.planId };
  const backup = backupOperations(plan.root, operations, 'uninstall');
  try {
    writeTransaction(plan.root, operations);
  } catch (error) {
    throw new Error(`${error.message}; recovery backup retained at ${backup.path}`, { cause: error });
  }
  return { status: 'uninstalled', planId: plan.planId, backup: backup.path };
}
