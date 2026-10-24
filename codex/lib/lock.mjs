export const LOCK_SCHEMA_VERSION = 1;
export const LOCK_PATH = '.aikido/lock.json';
export const BASELINE_DIR = '.aikido/state/baseline';

export const MODES = ['STANDARD', 'LIGHT', 'UNSET'];
export const HOSTS = [
  'claude-code',
  'claude-cowork',
  'copilot-vscode',
  'copilot-github',
  'codex',
  'kiro-cli',
  'zoo-code',
  'roo-code-legacy',
  'antigravity',
  'copilot-cowork',
];
export const SOURCE_TYPES = ['git', 'archive', 'local', 'plugin'];
export const ORIGINS = ['payload', 'template', 'generated', 'adapter'];
export const POLICIES = ['three-way', 'create-only', 'managed-block'];

const SHA256 = /^[0-9a-f]{64}$/;
const COMMIT = /^[0-9a-f]{40}$/;
const VERSION = /^\d+\.\d+(\.\d+)?(-[0-9A-Za-z.-]+)?$/;
const BLOCK_ID = /^[a-z0-9-]+$/;

// Lock entries must stay portable across machines and clones.
export function isSafeRelativePath(p) {
  return (
    typeof p === 'string' &&
    p.length > 0 &&
    !p.startsWith('/') &&
    !p.includes('\\') &&
    !/^[A-Za-z]:/.test(p) &&
    !p.startsWith('~') &&
    p.split('/').every((part) => part !== '' && part !== '.' && part !== '..')
  );
}

export function validateLock(lock) {
  const errors = [];
  const err = (m) => errors.push(m);
  if (!lock || typeof lock !== 'object') return ['lock must be an object'];
  if (lock.schemaVersion !== LOCK_SCHEMA_VERSION) err(`schemaVersion must be ${LOCK_SCHEMA_VERSION}`);

  const a = lock.aikido ?? {};
  if (!VERSION.test(a.version ?? '')) err('aikido.version must be a semantic version');
  const src = a.source ?? {};
  if (!SOURCE_TYPES.includes(src.type)) err(`aikido.source.type must be one of ${SOURCE_TYPES.join(', ')}`);
  if (typeof src.ref !== 'string' || !src.ref) err('aikido.source.ref is required');
  else if (src.ref.startsWith('/') || /^[A-Za-z]:/.test(src.ref) || src.ref.startsWith('~') || src.ref.startsWith('file:')) {
    err('aikido.source.ref must not be a local absolute path');
  }
  if (src.type !== 'local' && !COMMIT.test(src.commit ?? '')) err('aikido.source.commit must be a full 40-char SHA');

  if (!MODES.includes(lock.mode)) err(`mode must be one of ${MODES.join(', ')}`);
  if (!Array.isArray(lock.hosts) || lock.hosts.some((h) => !HOSTS.includes(h))) err('hosts must list known host ids');
  else if (new Set(lock.hosts).size !== lock.hosts.length) err('hosts must be unique');
  if (Number.isNaN(Date.parse(lock.installedAt ?? ''))) err('installedAt must be an ISO date');

  const paths = new Set();
  for (const f of lock.files ?? []) {
    const at = `files[${f?.path ?? '?'}]`;
    if (!isSafeRelativePath(f?.path)) err(`${at}: path must be relative, without "..", and portable`);
    else if (paths.has(f.path)) err(`${at}: duplicate path`);
    paths.add(f?.path);
    if (!SHA256.test(f?.sha256 ?? '')) err(`${at}: sha256 must be 64 lowercase hex chars`);
    if (!ORIGINS.includes(f?.origin)) err(`${at}: unknown origin`);
    if (!POLICIES.includes(f?.policy) || f.policy === 'managed-block') err(`${at}: policy must be three-way or create-only`);
  }
  if (!Array.isArray(lock.files)) err('files must be an array');

  const blocks = new Set();
  for (const b of lock.managedBlocks ?? []) {
    const key = `${b?.path}#${b?.id}`;
    if (!isSafeRelativePath(b?.path)) err(`managedBlocks[${key}]: unsafe path`);
    if (!BLOCK_ID.test(b?.id ?? '')) err(`managedBlocks[${key}]: invalid id`);
    if (!SHA256.test(b?.sha256 ?? '')) err(`managedBlocks[${key}]: invalid sha256`);
    if (blocks.has(key)) err(`managedBlocks[${key}]: duplicate`);
    blocks.add(key);
  }
  if (!Array.isArray(lock.managedBlocks)) err('managedBlocks must be an array');
  return errors;
}

/**
 * Three-way decision for one path. Each argument is a content hash or null when absent:
 * base = installed version recorded in the lock, local = current file, next = new version.
 */
export function classify({ base, local, next, policy = 'three-way' }) {
  if (policy === 'create-only') {
    if (local !== null) return 'keep-local';
    return base === null && next !== null ? 'add' : 'keep-local';
  }
  if (base === null) {
    if (next === null) return 'keep-local';
    if (local === null) return 'add';
    return local === next ? 'adopt' : 'conflict-collision';
  }
  if (next === null) {
    if (local === null) return 'unchanged';
    return local === base ? 'delete' : 'keep-modified-orphan';
  }
  if (local === null) return next === base ? 'keep-deleted' : 'conflict-deleted-locally';
  if (local === base) return next === base ? 'unchanged' : 'update';
  if (next === base || local === next) return 'keep-local';
  return 'conflict';
}

export const CONFLICTS = new Set(['conflict', 'conflict-collision', 'conflict-deleted-locally']);
