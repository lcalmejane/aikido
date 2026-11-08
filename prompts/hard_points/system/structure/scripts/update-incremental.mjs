#!/usr/bin/env node
import { realpathSync } from 'node:fs';
import { dirname, isAbsolute, relative, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import { assertPublicProjectRoot, isPrivateTaskStorePathWithin } from './lib/private-task-store.mjs';
import { inspect } from './generate-index-by-path.mjs';
import { generateAll } from './generate-all-indexes-v3.1.mjs';

export function updateChanged(projectRoot, paths) {
  const root = assertPublicProjectRoot(projectRoot);
  if (!Array.isArray(paths) || paths.length === 0) throw new Error('Provide at least one changed file path');
  for (const path of paths) {
    if (typeof path !== 'string' || path.length === 0 || path.includes('\0')) {
      throw new Error('Changed paths must be nonempty strings');
    }
    if (isPrivateTaskStorePathWithin(root, path)) throw new Error(`Private Task Store path cannot be indexed: ${path}`);
    const absolute = resolve(root, path);
    const rel = relative(root, absolute);
    if (!rel || rel === '..' || rel.startsWith(`..${sep}`) || isAbsolute(rel)) {
      throw new Error(`Changed path outside project or project root itself: ${path}`);
    }
    const stat = inspect(root, absolute);
    if (stat && !stat.isFile()) throw new Error(`Changed path is not a regular file: ${path}`);
  }
  return generateAll(root);
}

function isMain() {
  try { return Boolean(process.argv[1]) && realpathSync(process.argv[1]) === realpathSync(fileURLToPath(import.meta.url)); }
  catch { return false; }
}
if (isMain()) {
  try {
    const paths = process.argv.slice(2);
    const root = process.env.PROJECT_ROOT || resolve(dirname(fileURLToPath(import.meta.url)), '../../../../..');
    console.error('Incremental update is disabled: change-set completeness and cross-index publication cannot be guaranteed; rebuilding all indexes.');
    const result = updateChanged(root, paths);
    console.log(`Indexes rebuilt: ${result.files} files after ${paths.length} requested change(s)`);
  } catch (error) {
    console.error(`Index update failed: ${error.message}`);
    process.exitCode = 1;
  }
}
