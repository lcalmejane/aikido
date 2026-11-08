#!/usr/bin/env node
// tar owns the tgz format and member permissions. Never extract or delete.
import {
  constants as C, openSync, closeSync, fstatSync, lstatSync,
  mkdirSync, fsyncSync, realpathSync, readdirSync,
} from 'node:fs';
import { spawn } from 'node:child_process';
import { randomUUID } from 'node:crypto';
import { relative, resolve, join, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  isPrivateTaskStorePathWithin, isPrivateTaskStoreRoot,
} from '../../structure/scripts/lib/private-task-store.mjs';

export const MEMBERS = Object.freeze([
  '.claude', '.roo', '.roomodes', 'agents_list.md', 'commands_list.md',
  'AGENTS.md', 'CLAUDE.md', 'README.md', 'prompts',
]);
const same = (a, b) => a.dev === b.dev && a.ino === b.ino;
// Portable lstat pre/post checks, NOT an atomic directory traversal.
// Requires no hostile concurrent renames/symlink swaps of these directories.
// Node has no portable openat/fchdir API. Writes stay on the exclusive file fd
// once opened, but checks cannot prevent every race while resolving paths.
function directories(path) {
  let current = sep;
  return [sep, ...path.split(sep).filter(Boolean).map((part) => {
    current = join(current, part);
    return current;
  })].map((entry) => {
    const stat = lstatSync(entry);
    if (stat.isSymbolicLink() || !stat.isDirectory()) {
      throw new Error(`Unsafe backup directory or SOURCE ancestor: ${entry}`);
    }
    return { path: entry, stat };
  });
}

function validateDirectories(snapshot) {
  for (const entry of snapshot) {
    const current = lstatSync(entry.path);
    if (current.isSymbolicLink() || !current.isDirectory() || !same(current, entry.stat)) {
      throw new Error(`Backup target changed during creation: ${entry.path}`);
    }
  }
}

function timestamp() {
  const d = new Date();
  const pad = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}`
    + `-${pad(d.getHours())}${pad(d.getMinutes())}${pad(d.getSeconds())}`;
}

function containsPrivateTaskStore(root, member) {
  if (isPrivateTaskStoreRoot(root)) return true;
  const start = join(root, member);
  if (isPrivateTaskStorePathWithin(root, member)) return true;
  const info = lstatSync(start);
  if (info.isSymbolicLink() || !info.isDirectory()) return false;
  const pending = [start];
  while (pending.length) {
    const directory = pending.pop();
    const relativeDirectory = relative(root, directory).split(sep).join('/');
    if (isPrivateTaskStorePathWithin(root, relativeDirectory)) return true;
    for (const entry of readdirSync(directory, { withFileTypes: true })) {
      if (entry.isSymbolicLink()) continue;
      const path = join(directory, entry.name);
      const relativePath = relative(root, path).split(sep).join('/');
      if (isPrivateTaskStorePathWithin(root, relativePath)) return true;
      if (entry.isDirectory()) pending.push(path);
    }
  }
  return false;
}

export async function createBackup(source = '.', prefix = 'aikido-backup', {
  // Dependency injection is only an API/test seam, not an environment override.
  tar = 'tar', suffix = () => `${timestamp()}-${randomUUID()}`,
  signal, diagnostic = (text) => process.stderr.write(`${text}\n`),
} = {}) {
  if (Number(process.versions.node.split('.')[0]) < 24) {
    throw new Error('MAJ backup requires Node.js 24 or newer');
  }
  if (!['darwin', 'linux'].includes(process.platform) || C.O_NOFOLLOW === undefined) {
    throw new Error('MAJ backup requires macOS or Linux with O_NOFOLLOW');
  }
  if (typeof source !== 'string' || /[\x00-\x1f\x7f\\]/.test(source)
      || source.split(/[\\/]/).includes('..')) {
    throw new Error('Unsafe SOURCE path');
  }
  if (!/^[A-Za-z0-9][A-Za-z0-9._ -]*$/.test(prefix) || prefix.includes('..')) {
    throw new Error('Unsafe backup prefix (use a filename prefix, not a path)');
  }
  const absolute = resolve(source || '.');
  if (absolute === sep) throw new Error('Unsafe SOURCE: filesystem root is not a project');
  const handles = [];
  let output;
  let createdPath;
  const checkAbort = () => {
    if (signal?.aborted) throw new Error('Backup interrupted');
  };
  try {
    checkAbort();
    const sourceSnapshot = directories(absolute);
    const present = [];
    for (const member of MEMBERS) {
      try {
        // tar does not dereference member symlinks. They are preserved as links.
        lstatSync(join(absolute, member));
        present.push(member);
      } catch (error) {
        if (error.code !== 'ENOENT') throw error;
        diagnostic(`Skipping absent optional backup member: ${member}`);
      }
    }
    if (!present.length) throw new Error('No backup members found in SOURCE');
    if (present.some(member => containsPrivateTaskStore(absolute, member))) {
      throw new Error('Private Task Store data is present in backup members; refusing to export it');
    }
    validateDirectories(sourceSnapshot);
    const backupAnchor = join(absolute, 'backups');
    try { mkdirSync(backupAnchor, { mode: 0o700 }); } catch (error) {
      if (error.code !== 'EEXIST') throw error;
    }
    validateDirectories(sourceSnapshot);
    const backupSnapshot = directories(backupAnchor);
    validateDirectories(sourceSnapshot);
    let filename;
    for (let attempt = 0; attempt < 64; attempt++) {
      checkAbort();
      const unique = suffix();
      if (!/^[A-Za-z0-9-]+$/.test(unique)) throw new Error('Unsafe unique suffix');
      filename = `${prefix}-${unique}.tgz`;
      validateDirectories(backupSnapshot);
      try {
        output = openSync(join(backupAnchor, filename),
          C.O_WRONLY | C.O_CREAT | C.O_EXCL | C.O_NOFOLLOW, 0o600);
        break;
      } catch (error) {
        if (error.code !== 'EEXIST') throw error;
      }
    }
    if (output === undefined) throw new Error('Backup name collisions exhausted');
    handles.push(output);
    createdPath = join(absolute, 'backups', filename);
    diagnostic(`Creating backup: ${createdPath}`);
    checkAbort();
    validateDirectories(backupSnapshot);
    if (!same(lstatSync(createdPath), fstatSync(output))) {
      throw new Error('Backup file changed before tar');
    }
    await new Promise((fulfil, reject) => {
      // Ambient tar options can request dereferencing, deletion or shell hooks.
      const env = { ...process.env };
      for (const key of ['TAR_OPTIONS', 'TAR_READER_OPTIONS', 'TAR_WRITER_OPTIONS', 'GZIP', 'GZIP_OPT']) {
        delete env[key];
      }
      // tar stdout goes directly to our exclusive fd. Diagnostics never enter it.
      const child = spawn(tar, ['-czf', '-', '--', ...present], {
        shell: false, env, cwd: absolute,
        stdio: ['ignore', output, 'inherit'],
      });
      let spawnError;
      let escalation;
      const abort = () => {
        child.kill('SIGTERM');
        escalation = setTimeout(() => child.kill('SIGKILL'), 1000);
        escalation.unref();
      };
      child.on('error', (error) => { spawnError = error; });
      signal?.addEventListener('abort', abort, { once: true });
      if (signal?.aborted) abort();
      child.once('close', (code, killedBy) => {
        signal?.removeEventListener('abort', abort);
        clearTimeout(escalation);
        if (signal?.aborted) reject(new Error('Backup interrupted'));
        else if (spawnError) reject(spawnError);
        else if (code !== 0) reject(new Error(`tar failed (exit ${code}, signal ${killedBy || 'none'})`));
        else fulfil();
      });
    });
    checkAbort();
    if (fstatSync(output).size === 0) throw new Error('tar produced an empty archive');
    fsyncSync(output);
    // A renamed/replaced directory must not yield a misleading final path.
    validateDirectories(backupSnapshot);
    const final = lstatSync(createdPath);
    if (final.isSymbolicLink() || !final.isFile() || !same(final, fstatSync(output))) {
      throw new Error('Backup target changed during creation');
    }
    return createdPath;
  } catch (error) {
    if (createdPath) diagnostic(`Unverified artifact retained (NOT a successful backup): ${createdPath}`);
    throw error;
  } finally {
    for (const fd of handles.reverse()) closeSync(fd);
  }
}

// Node normally resolves a symlinked entry point before setting import.meta.url.
// Compare canonical files so invoking the CLI through a link still executes it.
function isCli() {
  if (!process.argv[1]) return false;
  try {
    return realpathSync(resolve(process.argv[1])) === realpathSync(fileURLToPath(import.meta.url));
  } catch { return false; }
}
if (isCli()) {
  const controller = new AbortController();
  const interrupt = () => controller.abort();
  process.on('SIGINT', interrupt);
  process.on('SIGTERM', interrupt);
  try {
    if (process.argv.length > 4) throw new Error('Usage: create-backup.mjs [source_dir] [backup_name]');
    const path = await createBackup(process.argv[2] || '.', process.argv[3] || 'aikido-backup', {
      signal: controller.signal,
    });
    process.stdout.write(`${path}\n`);
  } catch (error) {
    process.stderr.write(`Backup failed: ${error.message}\n`);
    process.exitCode = 1;
  } finally {
    process.removeListener('SIGINT', interrupt);
    process.removeListener('SIGTERM', interrupt);
  }
}
