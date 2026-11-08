import {
  existsSync, lstatSync, readFileSync, realpathSync,
} from 'node:fs';
import { join, resolve } from 'node:path';
import { auditCli } from './check-cli.mjs';
import { loadCatalog } from './catalog.mjs';
import { detectHosts } from './host-detect.mjs';
import { HOSTS, LOCK_PATH } from './lock.mjs';
import { writeTransaction } from './bootstrap-plan.mjs';
import { toolInventoryEnvironment } from './features.mjs';

export const HOST_STATE_PATH = '.aikido/state/hosts.json';

function safeStateFile(root) {
  let current = root;
  for (const part of ['.aikido', 'state']) {
    current = join(current, part);
    try {
      const info = lstatSync(current);
      if (info.isSymbolicLink() || !info.isDirectory()) throw new Error(`Unsafe host-state directory: ${current}`);
    } catch (error) {
      if (error.code === 'ENOENT') return null;
      throw error;
    }
  }
  const target = join(current, 'hosts.json');
  try {
    const info = lstatSync(target);
    if (info.isSymbolicLink() || !info.isFile()) throw new Error(`Unsafe host-state file: ${target}`);
  } catch (error) {
    if (error.code === 'ENOENT') return null;
    throw error;
  }
  return target;
}

export function validateHostIds(ids, catalog = loadCatalog()) {
  if (!Array.isArray(ids) || new Set(ids).size !== ids.length || ids.some((id) => !HOSTS.includes(id))) {
    throw new Error('hosts must be a list of unique known host ids');
  }
  for (const id of ids) {
    if (!catalog.hosts[id]?.enabled) throw new Error(`Host "${id}" is disabled in the distribution catalog`);
    if (!catalog.hosts[id].workspace) {
      throw new Error(`Host "${id}" has no project-level integration: ${catalog.hosts[id].reason ?? 'unsupported'}`);
    }
  }
  return ids;
}

// Hosts remembered for this workspace (selected explicitly or detected earlier).
export function readHostState(root) {
  const file = safeStateFile(root);
  if (!file) return { hosts: [], previous: null };
  const previous = readFileSync(file);
  let state;
  try { state = JSON.parse(previous.toString('utf8')); } catch (error) {
    throw new Error(`Cannot read ${HOST_STATE_PATH}: ${error.message}`);
  }
  if (state?.schemaVersion !== 1 || !Array.isArray(state.hosts) || state.hosts.some((id) => !HOSTS.includes(id))) {
    throw new Error(`Invalid ${HOST_STATE_PATH}: expected schemaVersion 1 and a list of known host ids`);
  }
  return { hosts: state.hosts, previous };
}

export function planHostState(root, hosts) {
  const { hosts: known, previous } = readHostState(root);
  const merged = [...new Set([...known, ...hosts])].sort();
  const content = Buffer.from(`${JSON.stringify({ schemaVersion: 1, hosts: merged }, null, 2)}\n`);
  const action = previous === null ? 'create' : previous.equals(content) ? 'unchanged' : 'update';
  return {
    hosts: merged,
    action,
    operation: action === 'unchanged' ? null : {
      target: HOST_STATE_PATH, content, previous, mode: 0o600, write: true, action: 'write',
    },
  };
}

function lockHosts(root) {
  const path = join(root, ...LOCK_PATH.split('/'));
  if (!existsSync(path)) return [];
  try {
    const lock = JSON.parse(readFileSync(path, 'utf8'));
    return Array.isArray(lock.hosts) ? lock.hosts.filter((id) => HOSTS.includes(id)) : [];
  } catch {
    return [];
  }
}

/**
 * Decide which hosts to synchronise. Explicit hosts win; otherwise the union of CLIs detected on
 * this machine, hosts remembered for the workspace and the host recorded in the lock. Hosts that
 * only appear as workspace-directory hints are reported but never synchronised implicitly.
 */
export function selectHosts({
  root, hosts, env = process.env, home, platform, catalog = loadCatalog(),
}) {
  const detection = detectHosts({
    root, env, catalog, ...(home ? { home } : {}), ...(platform ? { platform } : {}),
  });
  if (hosts?.length) {
    return { hosts: validateHostIds(hosts, catalog), sources: { explicit: hosts }, detection };
  }
  const detected = detection.hosts.map(({ host }) => host);
  const remembered = readHostState(root).hosts.filter((id) => catalog.hosts[id]?.enabled && catalog.hosts[id].workspace);
  const locked = lockHosts(root).filter((id) => catalog.hosts[id]?.enabled && catalog.hosts[id].workspace);
  const order = Object.keys(catalog.hosts);
  const selected = [...new Set([...detected, ...remembered, ...locked])]
    .sort((a, b) => order.indexOf(a) - order.indexOf(b));
  return { hosts: selected, sources: { detected, remembered, locked }, detection };
}

function summarise(report) {
  return {
    host: report.host,
    status: report.status,
    created: report.created.length,
    updated: report.updated.length,
    removed: report.removed.length,
    unchanged: report.unchanged.length,
    conflicts: report.conflicts,
    unsupported: report.unsupported,
  };
}

/**
 * Bring every selected host up to date: wrappers for commands, agents/modes, Skills and the
 * instruction files, through the same audited `auditCli` path as `/check-cli`. One host failing
 * never prevents the others from being synchronised.
 */
export function syncHosts({
  root = process.cwd(), hosts, env = process.env, home, platform, repair = true, dryRun = false,
  remember = true, detectFeatures = false, catalog = loadCatalog(),
} = {}) {
  const workspace = realpathSync(resolve(root));
  if (!lstatSync(workspace).isDirectory()) throw new Error('Workspace root must be a directory.');
  // The caller identity is always explicit here; a stray AIKIDO_HOST must not contradict it.
  const { AIKIDO_HOST: ignored, ...cleanEnv } = env;
  const selection = selectHosts({
    root: workspace, hosts, env: cleanEnv, home, platform, catalog,
  });
  const results = [];
  for (const host of selection.hosts) {
    try {
      const report = auditCli({
        root: workspace, hostId: host, env: cleanEnv, repair, dryRun, detectFeatures, catalog,
      });
      results.push(summarise(report));
    } catch (error) {
      results.push({ host, status: 'error', error: error.message });
    }
  }
  let state = null;
  const synchronised = results.filter(({ status }) => status !== 'error').map(({ host }) => host);
  if (remember && synchronised.length) {
    const planned = planHostState(workspace, synchronised);
    state = { path: HOST_STATE_PATH, action: planned.action, hosts: planned.hosts, applied: false };
    if (planned.operation && !dryRun && repair) {
      writeTransaction(workspace, [planned.operation]);
      state.applied = true;
    }
  }
  const failed = results.some(({ status }) => status === 'error' || status === 'conflict');
  return {
    schemaVersion: 1,
    status: results.length === 0 ? 'no-hosts' : failed ? 'attention' : 'ok',
    root: workspace,
    mode: repair ? (dryRun ? 'repair-dry-run' : 'repair') : 'check',
    sources: selection.sources,
    hints: selection.detection.hints,
    detected: selection.detection.hosts,
    results,
    state,
  };
}

export { toolInventoryEnvironment };
