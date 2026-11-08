import { spawnSync } from 'node:child_process';
import { lstatSync, readFileSync } from 'node:fs';
import { join, resolve } from 'node:path';

export const FEATURE_STATE_PATH = '.aikido/state/features.json';

export function toolInventoryEnvironment(env = process.env, path) {
  return path ? { ...env, AIKIDO_TOOLS: readFileSync(resolve(path), 'utf8') } : env;
}

export function detectRtk(env = process.env) {
  const result = spawnSync('rtk', ['--version'], {
    env,
    encoding: 'utf8',
    timeout: 5000,
    windowsHide: true,
  });
  if (result.error?.code === 'ENOENT') return 'OFF';
  if (result.error) throw new Error(`Could not detect RTK: ${result.error.message}`);
  if (result.status !== 0) {
    const detail = result.stderr?.trim();
    throw new Error(`RTK detection failed${detail ? `: ${detail}` : ` with exit code ${result.status}`}`);
  }
  return 'ON';
}

export function detectKimono(env = process.env) {
  if (env.AIKIDO_TOOLS === undefined) {
    return { status: 'unknown', flag: null, tools: null, reason: 'The calling host has not supplied its current tool inventory.' };
  }
  let names;
  try {
    names = JSON.parse(env.AIKIDO_TOOLS);
  } catch (error) {
    throw new Error(`Cannot read AIKIDO_TOOLS: ${error.message}`);
  }
  if (!Array.isArray(names) || names.some((name) => typeof name !== 'string' || !name.trim())
    || new Set(names).size !== names.length) {
    throw new Error('AIKIDO_TOOLS must be a JSON array of unique, non-empty registered tool names');
  }
  const providers = new Map();
  for (const name of names) {
    const match = /^(.*?)(aikido_(snapshot|search|file))$/.exec(name);
    if (!match) continue;
    const [, prefix, capability] = match;
    if (!providers.has(prefix)) providers.set(prefix, {});
    providers.get(prefix)[capability] = name;
  }
  for (const tools of providers.values()) {
    if (['aikido_snapshot', 'aikido_search', 'aikido_file'].every((name) => Object.hasOwn(tools, name))) {
      return { status: 'available', flag: 'ON', tools };
    }
  }
  return { status: 'unavailable', flag: 'OFF', tools: null, reason: 'No single exposed provider has the snapshot, search and file tools.' };
}

export function detectFeatures(env = process.env, { rtk = false } = {}) {
  const kimono = detectKimono(env);
  const featureFlags = {
    ...(rtk ? { rtk: detectRtk(env) } : {}),
    ...(kimono.flag === null ? {} : { kimono: kimono.flag }),
  };
  return { featureFlags, kimono };
}

function readFlags(root) {
  const absoluteRoot = resolve(root);
  let current = absoluteRoot;
  for (const part of ['.aikido', 'state']) {
    current = join(current, part);
    try {
      const info = lstatSync(current);
      if (info.isSymbolicLink() || !info.isDirectory()) throw new Error(`Unsafe feature-state directory: ${current}`);
    } catch (error) {
      if (error.code === 'ENOENT') return { flags: {}, previous: null };
      throw error;
    }
  }

  const target = join(current, 'features.json');
  let info;
  try {
    info = lstatSync(target);
  } catch (error) {
    if (error.code === 'ENOENT') return { flags: {}, previous: null };
    throw error;
  }
  if (info.isSymbolicLink() || !info.isFile()) throw new Error(`Unsafe feature-state file: ${target}`);

  const previous = readFileSync(target);
  let state;
  try {
    state = JSON.parse(previous.toString('utf8'));
  } catch (error) {
    throw new Error(`Cannot read ${FEATURE_STATE_PATH}: ${error.message}`);
  }
  if (state?.schemaVersion !== 1 || !state.flags || Array.isArray(state.flags) || typeof state.flags !== 'object') {
    throw new Error(`Invalid ${FEATURE_STATE_PATH}: expected schemaVersion 1 and a flags object`);
  }
  for (const [name, value] of Object.entries(state.flags)) {
    if (!/^[a-z][a-z0-9-]*$/.test(name) || !['ON', 'OFF'].includes(value)) {
      throw new Error(`Invalid feature flag in ${FEATURE_STATE_PATH}: ${name}`);
    }
  }
  return { flags: state.flags, previous };
}

export function planFeatureFlag(root, name, value) {
  const result = planFeatureFlags(root, { [name]: value });
  return { ...result, item: { ...result.item, id: name, value } };
}

export function planFeatureFlags(root, updates) {
  const entries = Object.entries(updates);
  if (!entries.length || entries.some(([name, value]) => !/^[a-z][a-z0-9-]*$/.test(name) || !['ON', 'OFF'].includes(value))) {
    throw new Error('Feature flags require a valid name and ON/OFF value');
  }
  const { flags, previous } = readFlags(root);
  const content = Buffer.from(`${JSON.stringify({
    schemaVersion: 1,
    flags: Object.fromEntries(Object.entries({ ...flags, ...updates }).sort(([a], [b]) => a.localeCompare(b))),
  }, null, 2)}\n`);
  const action = previous === null ? 'create' : previous.equals(content) ? 'unchanged' : 'update';
  return {
    item: {
      target: FEATURE_STATE_PATH, kind: 'feature-state', action, values: updates,
      ...(entries.length === 1 ? { id: entries[0][0], value: entries[0][1] } : {}),
    },
    operation: action === 'unchanged' ? null : {
      target: FEATURE_STATE_PATH,
      content,
      previous,
      mode: 0o600,
      write: true,
      action: 'write',
    },
  };
}
