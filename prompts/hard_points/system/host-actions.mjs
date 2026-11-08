import { lstat, mkdir, readFile, readdir, rm, stat, writeFile } from 'node:fs/promises';
import { spawn } from 'node:child_process';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

function isWithin(root, target) {
  const relative = path.relative(root, target);
  return relative === '' || (!relative.startsWith(`..${path.sep}`) && relative !== '..' && !path.isAbsolute(relative));
}

export function createHostActions(projectRoot) {
  const root = path.resolve(projectRoot);

  function resolvePath(relativePath) {
    if (typeof relativePath !== 'string' || relativePath.length === 0 || path.isAbsolute(relativePath)) {
      throw new TypeError('A non-empty project-relative path is required.');
    }
    const target = path.resolve(root, relativePath);
    if (!isWithin(root, target)) throw new RangeError(`Path escapes project root: ${relativePath}`);
    return target;
  }

  async function assertNoSymlink(target) {
    const relative = path.relative(root, target);
    let current = root;
    for (const segment of relative.split(path.sep).filter(Boolean)) {
      current = path.join(current, segment);
      try {
        const info = await lstat(current);
        if (info.isSymbolicLink()) throw new Error(`Refusing symlink path: ${current}`);
      } catch (error) {
        if (error.code !== 'ENOENT') throw error;
      }
    }
  }

  async function listFiles({ directory = '.', extensions, maxDepth = Infinity } = {}) {
    const start = directory === '.' ? root : resolvePath(directory);
    await assertNoSymlink(start);
    const allowed = extensions ? new Set(extensions.map((extension) => extension.toLowerCase())) : null;
    const files = [];

    async function visit(current, depth) {
      const entries = await readdir(current, { withFileTypes: true });
      entries.sort((a, b) => a.name.localeCompare(b.name));
      for (const entry of entries) {
        if (entry.isSymbolicLink()) continue;
        const absolute = path.join(current, entry.name);
        if (entry.isDirectory()) {
          if (depth < maxDepth) await visit(absolute, depth + 1);
        } else if (entry.isFile() && (!allowed || allowed.has(path.extname(entry.name).toLowerCase()))) {
          files.push(path.relative(root, absolute).split(path.sep).join('/'));
        }
      }
    }

    await visit(start, 0);
    return files;
  }

  async function readText(relativePath) {
    const target = resolvePath(relativePath);
    await assertNoSymlink(target);
    return readFile(target, 'utf8');
  }

  async function writeText(relativePath, content, { overwrite = false } = {}) {
    const target = resolvePath(relativePath);
    await assertNoSymlink(target);
    try {
      const current = await stat(target);
      if (!current.isFile()) throw new Error(`Target is not a regular file: ${relativePath}`);
      if (!overwrite) throw new Error(`Target already exists: ${relativePath}`);
    } catch (error) {
      if (error.code !== 'ENOENT') throw error;
    }
    await mkdir(path.dirname(target), { recursive: true });
    await writeFile(target, content, { encoding: 'utf8', flag: overwrite ? 'w' : 'wx' });
    return { path: relativePath, bytes: Buffer.byteLength(content, 'utf8') };
  }

  async function deletePath(relativePath, { recursive = false } = {}) {
    const target = resolvePath(relativePath);
    if (target === root) throw new RangeError('Refusing to delete the project root.');
    await assertNoSymlink(target);
    const info = await lstat(target);
    if (info.isDirectory() && !recursive) throw new Error('Directory deletion requires recursive: true.');
    await rm(target, { recursive, force: false });
    return { path: relativePath, deleted: true, recursive };
  }

  async function inspectFiles(paths) {
    return Promise.all(paths.map(async (relativePath) => {
      const content = await readText(relativePath);
      const info = await stat(resolvePath(relativePath));
      return {
        path: relativePath,
        lines: content.length === 0 ? 0 : content.split(/\r?\n/).length - Number(content.endsWith('\n')),
        bytes: info.size,
        modified: info.mtime.toISOString(),
      };
    }));
  }

  async function auditDistribution({ distributionRoot, hostId, repair = false, dryRun = false, detectFeatures = false, tools = [] } = {}) {
    if (typeof distributionRoot !== 'string' || !path.isAbsolute(distributionRoot)) {
      throw new TypeError('An absolute distribution root is required.');
    }
    if (typeof hostId !== 'string' || hostId.length === 0) throw new TypeError('An explicit host ID is required.');
    if (!Array.isArray(tools) || tools.some((tool) => typeof tool !== 'string')) {
      throw new TypeError('The verified tool inventory must be an array of names.');
    }
    const modulePath = path.resolve(distributionRoot, 'lib/check-cli.mjs');
    const { lstat: inspectPath } = await import('node:fs/promises');
    const moduleInfo = await inspectPath(modulePath);
    if (moduleInfo.isSymbolicLink() || !moduleInfo.isFile()) {
      throw new Error('The packaged check-cli module must be a regular file.');
    }
    const { auditCli } = await import(pathToFileURL(modulePath).href);
    if (typeof auditCli !== 'function') throw new Error('The package does not expose the check-cli audit API.');
    return auditCli({
      root,
      hostId,
      repair,
      dryRun,
      detectFeatures,
      env: { AIKIDO_TOOLS: JSON.stringify(tools) },
    });
  }

  async function runNodeScript({ scriptPath, args = [], cwd = '.', env = {}, maxOutputBytes = 1_000_000 } = {}) {
    if (!Array.isArray(args) || args.some((argument) => typeof argument !== 'string')) {
      throw new TypeError('Node script arguments must be an array of strings.');
    }
    if (typeof env !== 'object' || env === null || Array.isArray(env)
      || Object.values(env).some((value) => typeof value !== 'string')) {
      throw new TypeError('Node script environment values must be strings.');
    }
    if (!Number.isSafeInteger(maxOutputBytes) || maxOutputBytes < 1) {
      throw new RangeError('maxOutputBytes must be a positive safe integer.');
    }
    const script = resolvePath(scriptPath);
    const workingDirectory = cwd === '.' ? root : resolvePath(cwd);
    await assertNoSymlink(script);
    await assertNoSymlink(workingDirectory);
    const scriptInfo = await stat(script);
    const cwdInfo = await stat(workingDirectory);
    if (!scriptInfo.isFile() || !/\.(?:mjs|cjs|js)$/.test(scriptPath)) {
      throw new Error('Only an existing JavaScript module can be invoked.');
    }
    if (!cwdInfo.isDirectory()) throw new Error('Node script working directory must be a directory.');

    return new Promise((resolvePromise, rejectPromise) => {
      const child = spawn(process.execPath, [script, ...args], {
        cwd: workingDirectory,
        env: { ...process.env, ...env },
        shell: false,
        stdio: ['ignore', 'pipe', 'pipe'],
      });
      let stdout = '';
      let stderr = '';
      let outputBytes = 0;
      let overflow = false;
      const collect = (target, chunk) => {
        outputBytes += chunk.length;
        if (outputBytes > maxOutputBytes) {
          overflow = true;
          child.kill();
          return target;
        }
        return target + chunk.toString('utf8');
      };
      child.stdout.on('data', (chunk) => { stdout = collect(stdout, chunk); });
      child.stderr.on('data', (chunk) => { stderr = collect(stderr, chunk); });
      child.once('error', rejectPromise);
      child.once('close', (code, signal) => {
        if (overflow) {
          rejectPromise(new Error(`Node script output exceeded ${maxOutputBytes} bytes.`));
          return;
        }
        resolvePromise({ exitCode: code, signal, stdout, stderr });
      });
    });
  }

  return Object.freeze({ listFiles, readText, writeText, deletePath, inspectFiles, auditDistribution, runNodeScript });
}
