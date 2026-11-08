import { lstatSync, readFileSync, realpathSync } from 'node:fs';
import { dirname, isAbsolute, join, relative, resolve, sep } from 'node:path';

const PRIVATE_NAMES = new Set(['.private', '.task-store']);

export function isPrivateTaskStorePath(value) {
  const segments = String(value).replaceAll('\\', '/').split('/').filter(Boolean)
    .map(segment => segment.toLowerCase());
  return segments.some(segment => PRIVATE_NAMES.has(segment))
    || segments.some((segment, index) => (
      (segment === 'aikido' || segment === '.aikido') && segments[index + 1] === 'tasks'
    ));
}

export function isPrivateTaskStoreRoot(value) {
  let info;
  try { info = lstatSync(value); } catch { return false; }
  if (!info.isDirectory() || info.isSymbolicLink()) return false;
  let root;
  try { root = realpathSync(value); } catch { return false; }
  if (isPrivateTaskStorePath(root)) return true;
  const metadataPath = join(root, 'store.json');
  try {
    const metadata = lstatSync(metadataPath);
    if (!metadata.isFile() || metadata.isSymbolicLink()) return false;
    return JSON.parse(readFileSync(metadataPath, 'utf8')).schemaVersion === 'task-store/1';
  } catch {
    return false;
  }
}

export function isPrivateTaskStoreLocation(value) {
  let current = resolve(value);
  if (isPrivateTaskStorePath(current)) return true;
  while (true) {
    try {
      const info = lstatSync(current);
      if (info.isSymbolicLink()) current = realpathSync(current);
      else if (!info.isDirectory()) current = dirname(current);
      if (isPrivateTaskStorePath(current) || isPrivateTaskStoreRoot(current)) return true;
    } catch (error) {
      if (!['ENOENT', 'ENOTDIR'].includes(error.code)) return false;
    }
    const parent = dirname(current);
    if (parent === current) return false;
    current = parent;
  }
}

export function isPrivateTaskStorePathWithin(rootValue, value) {
  if (isPrivateTaskStorePath(value)) return true;
  const root = realpathSync(rootValue);
  const absolute = resolve(root, value);
  const rel = relative(root, absolute);
  if (rel === '..' || rel.startsWith(`..${sep}`) || isAbsolute(rel)) return false;
  if (isPrivateTaskStoreRoot(root)) return true;
  let current = root;
  for (const component of rel.split(sep).filter(Boolean)) {
    current = join(current, component);
    if (isPrivateTaskStorePath(current) || isPrivateTaskStoreRoot(current)) return true;
  }
  return isPrivateTaskStoreLocation(absolute);
}

export function assertPublicProjectRoot(value) {
  const root = realpathSync(value);
  if (isPrivateTaskStoreLocation(root)) {
    throw new Error('Private Task Store roots cannot be indexed, searched or exported');
  }
  return root;
}
