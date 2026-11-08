#!/usr/bin/env node
import { realpathSync } from 'node:fs';
import { dirname, join, posix, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { assertPublicProjectRoot } from './lib/private-task-store.mjs';
import { publishBatches, readEntries } from './generate-index-by-path.mjs';

const compare = (a, b) => Buffer.compare(Buffer.from(a), Buffer.from(b));
const batchSize = 1000;
const configs = {
  alpha: ['by-alphabetical', 'alpha'],
  directory: ['by-directory', 'dir'],
  type: ['by-type', 'type'],
};

function group(entries, keyFor) {
  const result = new Map();
  for (const [path, id, metadata] of entries) {
    const key = keyFor(path, metadata);
    if (!result.has(key)) result.set(key, []);
    result.get(key).push(id);
  }
  return [...result.entries()].sort((a, b) => compare(a[0], b[0]));
}

export function generateSecondary(root, kind) {
  if (Number(process.versions.node.split('.')[0]) < 24) throw new Error('Node.js 24 or newer is required');
  if (!Object.hasOwn(configs, kind)) throw new Error('Expected alpha, directory or type');
  root = assertPublicProjectRoot(root);
  const { entries, snapshots } = readEntries(root);
  const generated = new Date().toISOString();
  const batches = new Map();
  if (kind === 'type') {
    const groups = group(entries, (path, metadata) => {
      if (typeof metadata.type !== 'string' || !/^[a-z_]+$/.test(metadata.type)) {
        throw new Error(`Invalid type for ${path}`);
      }
      return metadata.type;
    });
    for (const [type, ids] of groups) {
      for (let offset = 0; offset < ids.length; offset += batchSize) {
        const suffix = ids.length > batchSize ? `-${String(offset / batchSize).padStart(3, '0')}` : '';
        const part = ids.slice(offset, offset + batchSize);
        batches.set(`index-type-${type}${suffix}.json`, {
          metadata: { batch_id: `type-${type}${suffix}`, type, count: part.length, generated },
          ids: part,
        });
      }
    }
  } else {
    const groups = group(entries, path => kind === 'alpha' ? posix.basename(path) : posix.dirname(path));
    for (let offset = 0; offset < groups.length; offset += batchSize) {
      const slice = groups.slice(offset, offset + batchSize);
      const number = offset / batchSize;
      if (kind === 'alpha') {
        batches.set(`index-alpha-${number}.json`, {
          metadata: { batch_id: `alpha-${number}`, range: [
            Array.from(slice[0][0])[0].toLowerCase(), Array.from(slice.at(-1)[0])[0].toLowerCase(),
          ], count: slice.length, generated },
          files: Object.fromEntries(slice),
        });
      } else {
        const name = String(number).padStart(3, '0');
        batches.set(`index-dir-${name}.json`, {
          metadata: { batch_id: `dir-${name}`, offset, directories_count: slice.length, generated },
          directories: Object.fromEntries(slice.map(([dir, ids]) => [dir, { files_count: ids.length, ids }])),
        });
      }
    }
  }
  const [directory, prefix] = configs[kind];
  publishBatches(root, join(root, 'prompts/hard_points/system/structure/indices', directory), batches, snapshots, prefix);
  return { files: entries.length, batches: batches.size };
}

function isMain() {
  try { return Boolean(process.argv[1]) && realpathSync(process.argv[1]) === realpathSync(fileURLToPath(import.meta.url)); }
  catch { return false; }
}

if (isMain()) {
  try {
    const [kind, ...extra] = process.argv.slice(2);
    if (extra.length) console.error('Additional positional arguments are ignored; use PROJECT_ROOT to select the project');
    const defaultRoot = resolve(dirname(fileURLToPath(import.meta.url)), '../../../../..');
    const result = generateSecondary(process.env.PROJECT_ROOT || defaultRoot, kind);
    console.log(`${kind} index generated: ${result.files} files, ${result.batches} batches`);
  } catch (error) {
    console.error(`Secondary index generation failed: ${error.message}`);
    process.exitCode = 1;
  }
}
