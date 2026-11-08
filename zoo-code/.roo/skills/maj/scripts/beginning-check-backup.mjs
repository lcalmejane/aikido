#!/usr/bin/env node
import { lstatSync, readdirSync, realpathSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { isMainModule } from './ending-1-report-state.mjs';

export function latestBackup(source) {
  const root = realpathSync(source);
  if (!statSync(root).isDirectory()) throw new Error(`Not a project directory: ${source}`);
  if (/[\r\n]/.test(root)) throw new Error('Project directory contains a newline');
  const directory = join(root, 'backups');
  let directoryStat;
  try { directoryStat = lstatSync(directory); }
  catch (error) {
    if (error.code === 'ENOENT') return null;
    throw error;
  }
  if (!directoryStat.isDirectory()) throw new Error(`Invalid backup directory: ${directory}`);
  const candidates = [];
  for (const name of readdirSync(directory)) {
    if (!name.startsWith('aikido-backup-') || !name.endsWith('.tgz')) continue;
    if (/[\r\n]/.test(name)) throw new Error(`Backup name contains a newline: ${JSON.stringify(name)}`);
    const path = join(directory, name);
    const file = lstatSync(path);
    if (!file.isFile()) throw new Error(`Invalid backup file: ${path}`);
    candidates.push({ path, name, modified: file.mtimeMs });
  }
  candidates.sort((a, b) => b.modified - a.modified || Buffer.compare(Buffer.from(a.name), Buffer.from(b.name)));
  return candidates[0]?.path ?? null;
}

if (isMainModule(import.meta.url)) {
  try {
    if (Number(process.versions.node.split('.')[0]) < 24) throw new Error('Node.js 24 or newer is required');
    const args = process.argv.slice(2);
    if (args.length > 1) throw new Error('Usage: beginning-check-backup.mjs [source]');
    const path = latestBackup(args[0] ?? '.');
    if (path === null) console.error('No initial AI-KIDO backup found; an independent backup may exist.');
    else console.log(path);
  } catch (error) {
    console.error(`Initial backup lookup failed: ${error.message}`);
    process.exitCode = 1;
  }
}
