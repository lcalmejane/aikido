#!/usr/bin/env node
// Direct entry point for ../SKILL.md and ../commands/download-site.md.
import { spawn } from 'node:child_process';
import { constants } from 'node:fs';
import {
  access, copyFile, lstat, mkdir, mkdtemp, readdir, realpath, rm, stat,
} from 'node:fs/promises';
import pathApi, { delimiter, dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const outputRoot = resolve(dirname(fileURLToPath(import.meta.url)), '../../../../../prompts/hard_points/web');
const reject = 'jpg,jpeg,gif,png,css,js,ico,svg,woff,woff2,ttf,eot';

// Injectable path dialect lets tests exercise drive/UNC roots on a POSIX host.
export function directoryAncestors(path, paths = pathApi) {
  const absolute = paths.resolve(path);
  let current = paths.parse(absolute).root;
  const ancestors = [current];
  for (const part of absolute.slice(current.length).split(paths.sep).filter(Boolean)) {
    current = paths.join(current, part);
    ancestors.push(current);
  }
  return ancestors;
}

export function topLevelNames(names, paths = pathApi) {
  return [...new Set(names.map(name => paths.normalize(name).split(paths.sep)[0]))];
}

export function assertSupportedPlatform(platform = process.platform) {
  if (platform === 'win32') {
    throw new Error('Windows is not yet supported by this Web client: native .exe/PATHEXT execution and wget output naming are not validated. Use a POSIX environment (for example WSL).');
  }
}

function parameters(args) {
  if (args.length < 2 || args.length > 3) {
    throw new Error('Usage: download_site.mjs <url> <depth> [prefix]');
  }
  const [url, depth, prefix] = args;
  let site;
  try { site = new URL(url); } catch { throw new Error('Invalid HTTP/HTTPS URL'); }
  if (!/^https?:\/\//i.test(url) || !['http:', 'https:'].includes(site.protocol)
      || !site.hostname || site.username || site.password || /[\x00-\x20\x7f]/.test(url)) {
    throw new Error('Invalid HTTP/HTTPS URL (credentials and whitespace are not allowed)');
  }
  if (!/^\d+$/.test(depth) || !Number.isSafeInteger(Number(depth)) || Number(depth) > 2147483647) {
    throw new Error('Invalid depth: expected an integer from 0 to 2147483647');
  }
  if (prefix !== undefined && /[\x00\r\n]/.test(prefix)) {
    throw new Error('Invalid prefix: NUL and line breaks are not allowed');
  }
  // wget uses an extended regular expression, not JavaScript's RegExp dialect.
  const host = site.host.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return { url, depth, accept: `^${prefix || `https?://${host}(/|$)`}` };
}

async function executable(name) {
  for (const entry of (process.env.PATH || '').split(delimiter)) {
    const candidate = resolve(entry || '.', name);
    try {
      await access(candidate, constants.X_OK);
      if ((await stat(candidate)).isFile()) return candidate;
    } catch { /* Try the next PATH entry. */ }
  }
  throw new Error(`${name} is not installed or not executable in PATH`);
}

function run(binary, args, signal, quiet = false) {
  return new Promise((resolveRun, rejectRun) => {
    let spawnError;
    const child = spawn(binary, args, {
      shell: false, stdio: ['ignore', quiet ? 'ignore' : 'inherit', 'inherit'], signal,
    });
    child.on('error', error => { spawnError = error; });
    // Wait for close even on abort, before removing files the child might be using.
    child.on('close', (code, killedBy) => {
      if (spawnError) rejectRun(new Error(`${binary}: ${spawnError.message}`));
      else if (code !== 0) rejectRun(new Error(`${binary} failed (${killedBy ? `signal ${killedBy}` : `exit ${code}`})`));
      else resolveRun();
    });
  });
}

async function optionalStat(path) {
  try { return await lstat(path); } catch (error) {
    if (error.code === 'ENOENT') return undefined;
    throw error;
  }
}

// Do not follow an output ancestor symlink, including a dangling symlink.
async function directory(path, create = false) {
  for (const current of directoryAncestors(path)) {
    let info = await optionalStat(current);
    if (!info && create) {
      try { await mkdir(current); } catch (error) {
        if (error.code !== 'EEXIST') throw error;
      }
      info = await lstat(current);
    }
    if (!info?.isDirectory() || info.isSymbolicLink()) {
      throw new Error(`Unsafe directory (missing, non-directory or symlink): ${current}`);
    }
  }
}

async function files(root, relative = '') {
  const result = [];
  for (const entry of await readdir(join(root, relative), { withFileTypes: true })) {
    const name = join(relative, entry.name);
    if (entry.isSymbolicLink()) throw new Error(`Symlink refused: ${join(root, name)}`);
    if (entry.isDirectory()) result.push(...await files(root, name));
    else if (entry.isFile()) result.push(name);
    else throw new Error(`Non-regular file refused: ${join(root, name)}`);
  }
  return result.sort();
}

async function publish(staged, signal) {
  const outputs = await files(staged);
  const tops = topLevelNames(outputs);
  await directory(outputRoot);
  // Refuse the entire site directory, not just individual Markdown conflicts.
  // This also protects existing media, symlinks, files and empty directories.
  const conflicts = [];
  for (const top of tops) {
    if (await optionalStat(join(outputRoot, top))) conflicts.push(join(outputRoot, top));
  }
  if (conflicts.length) throw new Error(`Output conflict(s); nothing published:\n${conflicts.join('\n')}`);
  for (const top of tops) {
    signal.throwIfAborted();
    await directory(outputRoot);
    if (!outputs.includes(top)) {
      try { await mkdir(join(outputRoot, top)); } catch (error) {
        if (error.code === 'EEXIST') throw new Error(`Output conflict: ${join(outputRoot, top)}`);
        throw error;
      }
    } // Exclusive reservation.
  }
  for (const name of outputs) {
    signal.throwIfAborted();
    const destination = join(outputRoot, name);
    await directory(dirname(destination), true);
    // No overwrite even if a concurrent writer creates a file after preflight.
    await copyFile(join(staged, name), destination, constants.COPYFILE_EXCL);
    console.log(`Published: ${name}`);
  }
}

async function main() {
  let temporary;
  let failure;
  const controller = new AbortController();
  const interrupt = () => controller.abort(new Error('Interrupted'));
  process.on('SIGINT', interrupt);
  process.on('SIGTERM', interrupt);
  try {
    // Fail before probing dependencies or touching the filesystem. Portable
    // path handling alone does not imply native Windows downloader support.
    assertSupportedPlatform();
    if (Number(process.versions.node.split('.')[0]) < 24 || process.versions.node.includes('-')) {
      throw new Error('Node.js 24+ (stable) is required');
    }
    const options = parameters(process.argv.slice(2));
    // Resolve BOTH dependencies and verify they run before filesystem/download effects.
    const wget = await executable('wget');
    const pandoc = await executable('pandoc');
    await run(wget, ['--version'], controller.signal, true);
    await run(pandoc, ['--version'], controller.signal, true);
    controller.signal.throwIfAborted();
    await directory(outputRoot, true);
    await access(outputRoot, constants.W_OK | constants.X_OK);
    temporary = await mkdtemp(join(outputRoot, '.download-site-'));
    const downloaded = join(temporary, 'download');
    const staged = join(temporary, 'markdown');
    await mkdir(downloaded);
    await mkdir(staged);
    console.log('Starting download with wget...');
    await run(wget, [
      '-r', '-l', options.depth, '-k', '-E', '-e', 'robots=on',
      '-P', downloaded, '-R', reject, `--accept-regex=${options.accept}`, '--', options.url,
    ], controller.signal);
    const html = (await files(downloaded)).filter(name => name.endsWith('.html'));
    console.log(`Number of HTML files to convert: ${html.length}`);
    if (!html.length) throw new Error('No HTML files downloaded; nothing to convert');
    const conversionErrors = [];
    for (const name of html) {
      controller.signal.throwIfAborted();
      const markdown = join(staged, `${name.slice(0, -5)}.md`);
      try {
        await directory(dirname(markdown), true);
        if (await optionalStat(markdown) || await optionalStat(`${markdown.slice(0, -3)}_media`)) {
          throw new Error(`Staging output conflict: ${markdown}`);
        }
        await run(pandoc, [
          '--from', 'html', '--to', 'markdown_strict-raw_html',
          `--extract-media=${markdown.slice(0, -3)}_media`,
          '-o', markdown, join(downloaded, name),
        ], controller.signal);
        const info = await lstat(markdown);
        if (!info.isFile() || info.isSymbolicLink()) throw new Error('pandoc did not produce a regular Markdown file');
        console.log(`Converted: ${name} -> ${name.slice(0, -5)}.md`);
      } catch (error) {
        const message = `Conversion failed for ${name}: ${error.message}`;
        console.error(message);
        conversionErrors.push(message);
      }
    }
    if (conversionErrors.length) throw new Error(`${conversionErrors.length} conversion(s) failed; nothing published`);
    await publish(staged, controller.signal);
    controller.signal.throwIfAborted();
  } catch (error) {
    failure = error;
    console.error(`Error: ${error.message}`);
  } finally {
    if (temporary) {
      try { await rm(temporary, { recursive: true, force: true }); } catch (error) {
        failure = error;
        console.error(`Cleanup failed for ${temporary}: ${error.message}`);
      }
    }
    process.removeListener('SIGINT', interrupt);
    process.removeListener('SIGTERM', interrupt);
  }
  if (controller.signal.aborted && !failure) {
    failure = controller.signal.reason;
    console.error(`Error: ${failure.message}`);
  }
  if (failure) process.exitCode = 1;
  else console.log(`Download and conversion complete: ${outputRoot}`);
}

async function isCliEntry() {
  // Native identity handles symlinks and loader flags without string comparison.
  if (typeof import.meta.main === 'boolean') return import.meta.main;
  // Early Node 24 releases lack import.meta.main. Canonicalize BOTH paths:
  // argv[1] can retain /var or another symlink while the loader resolves it.
  if (!process.argv[1]) return false;
  try {
    return await realpath(resolve(process.argv[1])) === await realpath(fileURLToPath(import.meta.url));
  } catch (error) {
    // An eval/import caller may have a synthetic, nonexistent argv[1].
    if (error.code === 'ENOENT' || error.code === 'ENOTDIR') return false;
    throw error; // Never silently report success on an identity-check failure.
  }
}

// Pure path/platform helpers can be imported without invoking the downloader.
if (await isCliEntry()) {
  await main();
}
