import { createHmac, randomBytes, timingSafeEqual } from "node:crypto";
import { spawn } from "node:child_process";
import { closeSync, fstatSync, linkSync, lstatSync, openSync, readFileSync, unlinkSync, writeFileSync } from "node:fs";
import { request, createServer } from "node:http";

export function createDaemonController({ filePath, assertSafeFile, logFactory, watchProject, scriptPath }) {
function readState(root) {
  const path = filePath(root, 'watch.pid', false);
  assertSafeFile(path);
  try {
    const raw = readFileSync(path, 'utf8');
    let state;
    try { state = JSON.parse(raw); } catch {
      if (/^\d+\s*$/.test(raw)) {
        throw new Error('Legacy PID-only watcher state cannot be stopped safely; stop the old watcher manually, then remove its PID file');
      }
      throw new Error(`Invalid watcher state file: ${path}`);
    }
    if (Number.isSafeInteger(state) && state > 1) {
      throw new Error('Legacy PID-only watcher state cannot be stopped safely; stop the old watcher manually, then remove its PID file');
    }
    if (!state || typeof state !== 'object' || Array.isArray(state) ||
        state.marker !== 'aikido-watch-v1' || !Number.isInteger(state.pid) ||
        state.pid < 2 || !Number.isInteger(state.port) || state.port < 1 ||
        typeof state.token !== 'string' || !/^[a-f0-9]{64}$/.test(state.token) || state.root !== root) {
      throw new Error(`Invalid watcher state file: ${path}`);
    }
    return { path, state };
  } catch (error) {
    if (error.code === 'ENOENT') return { path, state: null };
    throw error;
  }
}

function readStartLock(root) {
  const path = filePath(root, 'watch.start-lock', false);
  assertSafeFile(path);
  try {
    const raw = readFileSync(path, 'utf8');
    let lock;
    try { lock = JSON.parse(raw); } catch {
      throw new Error(`Invalid watcher start lock: ${path}`);
    }
    if (!lock || typeof lock !== 'object' || Array.isArray(lock) ||
        lock.marker !== 'aikido-watch-start-v1' ||
        typeof lock.token !== 'string' || !/^[a-f0-9]{64}$/.test(lock.token) ||
        lock.root !== root) {
      throw new Error(`Invalid watcher start lock: ${path}`);
    }
    return { path, lock };
  } catch (error) {
    if (error.code === 'ENOENT') return { path, lock: null };
    throw error;
  }
}

function daemonRequest(state, command) {
  const nonce = randomBytes(32).toString('hex');
  const proof = createHmac('sha256', state.token)
    .update(`request\n${command}\n${nonce}\n${state.pid}\n${state.root}`)
    .digest('hex');
  return new Promise(resolveResult => {
    const req = request({
      host: '127.0.0.1',
      port: state.port,
      path: command === 'stop' ? '/stop' : '/status',
      method: command === 'stop' ? 'POST' : 'GET',
      headers: {
        'x-aikido-watch-nonce': nonce,
        'x-aikido-watch-proof': proof,
      },
      timeout: 1000,
    }, response => {
      let data = '';
      response.setEncoding('utf8').on('data', chunk => { data += chunk; });
      response.on('end', () => resolveResult({ status: response.statusCode, data, nonce }));
    });
    req.on('timeout', () => req.destroy(new Error('Watcher request timed out')));
    req.on('error', () => resolveResult(null));
    req.end();
  });
}

function controlResponseMatches(response, state, expectedStatus) {
  if (response?.status !== 200) return false;
  let identity;
  try { identity = JSON.parse(response.data); } catch { return false; }
  if (!identity || typeof identity !== 'object') return false;
  if (identity.status === expectedStatus &&
    identity.marker === state.marker &&
    identity.pid === state.pid &&
    identity.root === state.root &&
    identity.nonce === response.nonce) {
    const expectedProof = createHmac('sha256', state.token)
      .update(`response\n${response.nonce}\n${identity.status}\n${identity.marker}\n${identity.pid}\n${identity.root}`)
      .digest();
    if (typeof identity.proof !== 'string' || !/^[a-f0-9]{64}$/.test(identity.proof)) return false;
    const receivedProof = Buffer.from(identity.proof, 'hex');
    return receivedProof.length === expectedProof.length && timingSafeEqual(receivedProof, expectedProof);
  }
  return false;
}

function unlinkRegular(path) {
  try {
    const info = lstatSync(path);
    if (!info.isFile() || info.isSymbolicLink()) throw new Error(`Unsafe watcher state file: ${path}`);
    unlinkSync(path);
  } catch (error) {
    if (error.code !== 'ENOENT') throw error;
  }
}

function unlinkOwnedStartLock(root, token) {
  const { path, lock } = readStartLock(root);
  if (lock?.token === token && lock.root === root) unlinkRegular(path);
}

async function startDaemon(root, options) {
  const { state: existing } = readState(root);
  if (existing) {
    const { lock } = readStartLock(root);
    const status = lock?.token === existing.token && lock.root === root
      ? await daemonRequest(existing, 'status')
      : null;
    if (controlResponseMatches(status, existing, 'running')) {
      throw new Error(`Watch daemon already running (PID: ${existing.pid})`);
    }
    throw new Error('Watcher identity cannot be verified; existing state and lock are preserved');
  }
  const lockPath = filePath(root, 'watch.start-lock');
  let lock;
  const token = randomBytes(32).toString('hex');
  try { lock = openSync(lockPath, 'wx', 0o600); } catch (error) {
    if (error.code === 'EEXIST') {
      throw new Error('Watcher identity cannot be verified from the existing start lock; refusing a second daemon');
    }
    throw error;
  }
  try {
    writeFileSync(lock, `${JSON.stringify({
      marker: 'aikido-watch-start-v1',
      token,
      root,
    })}\n`, 'utf8');
  } catch (error) {
    closeSync(lock);
    unlinkRegular(lockPath);
    throw error;
  }
  closeSync(lock);
  let child;
  let spawnError;
  let preserveLock = false;
  try {
    child = spawn(process.execPath, [scriptPath, 'watch', '--daemon-child', ...options.args], {
      cwd: root,
      env: { ...process.env, PROJECT_ROOT: root, AIKIDO_WATCH_TOKEN: token },
      detached: true,
      stdio: 'ignore',
    });
    child.on('error', error => { spawnError = error; });
    child.once('exit', () => {
      if (!preserveLock) {
        try { unlinkOwnedStartLock(root, token); } catch {}
      }
    });
    child.unref();
    const deadline = Date.now() + 5000;
    while (Date.now() < deadline) {
      if (spawnError) throw new Error(`Cannot start watcher: ${spawnError.message}`);
      const current = readState(root).state;
      if (current?.token === token && current.pid === child.pid && current.root === root) {
        const status = await daemonRequest(current, 'status');
        if (!controlResponseMatches(status, current, 'running')) {
          throw new Error('Watcher identity cannot be verified after startup; start lock preserved');
        }
        preserveLock = true;
        process.stdout.write(`Watch daemon started (PID: ${current.pid})\n`);
        return;
      }
      const marker = `[ERROR] Watcher startup failed (PID: ${child.pid}): `;
      try {
        const startupLine = readFileSync(filePath(root, 'watch.log', false), 'utf8')
          .split('\n').find(line => line.includes(marker));
        if (startupLine) {
          throw new Error(`Watcher startup failed: ${startupLine.slice(startupLine.indexOf(marker) + marker.length)}`);
        }
      } catch (error) {
        if (error.code !== 'ENOENT') throw error;
      }
      if (child.exitCode !== null || child.signalCode !== null) {
        throw new Error(`Watcher exited before readiness (${child.exitCode ?? child.signalCode})`);
      }
      await new Promise(resolveDelay => setTimeout(resolveDelay, 50));
    }
    throw new Error('Watcher identity could not be verified within 5 seconds; start lock preserved and no process was signalled');
  } finally {
    if (!preserveLock && (spawnError || child?.exitCode !== null || child?.signalCode !== null)) {
      unlinkOwnedStartLock(root, token);
    }
  }
}

async function runDaemon(root, options) {
  const token = process.env.AIKIDO_WATCH_TOKEN;
  if (!token || !/^[a-f0-9]{64}$/.test(token)) throw new Error('Invalid daemon startup token');
  const { lock } = readStartLock(root);
  if (lock?.token !== token || lock.root !== root) {
    throw new Error('Watcher startup lock identity cannot be verified');
  }
  const log = logFactory(root, true, options.verbose);
  let watcher;
  try {
    watcher = watchProject(root, options, log);
  } catch (error) {
    try {
      unlinkOwnedStartLock(root, token);
    } catch (cleanupError) {
      log('ERROR', `Cannot remove watcher startup lock: ${cleanupError.message}`);
    }
    log('ERROR', `Watcher startup failed (PID: ${process.pid}): ${error.message}`);
    throw error;
  }
  let server;
  let pidPath;
  let shuttingDown = false;
  const shutdown = async () => {
    if (shuttingDown) return;
    shuttingDown = true;
    await watcher.stop();
    if (server?.listening) await new Promise(resolveClose => server.close(resolveClose));
    if (pidPath) {
      try {
        const { state } = readState(root);
        if (state?.token === token && state.pid === process.pid && state.root === root) {
          unlinkRegular(pidPath);
          unlinkOwnedStartLock(root, token);
        }
      } catch (error) {
        log('ERROR', `Cannot remove watcher state: ${error.message}`);
      }
    }
  };
  server = createServer((requestMessage, response) => {
    const command = requestMessage.method === 'GET' && requestMessage.url === '/status'
      ? 'status'
      : requestMessage.method === 'POST' && requestMessage.url === '/stop'
        ? 'stop'
        : null;
    const nonce = requestMessage.headers['x-aikido-watch-nonce'];
    const proof = requestMessage.headers['x-aikido-watch-proof'];
    const expectedProof = command && typeof nonce === 'string' && /^[a-f0-9]{64}$/.test(nonce)
      ? createHmac('sha256', token)
        .update(`request\n${command}\n${nonce}\n${process.pid}\n${root}`)
        .digest()
      : Buffer.alloc(0);
    const receivedProof = typeof proof === 'string' && /^[a-f0-9]{64}$/.test(proof)
      ? Buffer.from(proof, 'hex')
      : Buffer.alloc(0);
    if (requestMessage.socket.remoteAddress !== '127.0.0.1' ||
        !command || receivedProof.length !== expectedProof.length ||
        !timingSafeEqual(receivedProof, expectedProof)) {
      response.writeHead(403).end('Forbidden');
      return;
    }
    const status = command === 'status' ? 'running' : 'stopping';
    const identity = {
      status,
      marker: 'aikido-watch-v1',
      pid: process.pid,
      root,
      nonce,
    };
    identity.proof = createHmac('sha256', token)
      .update(`response\n${nonce}\n${status}\n${identity.marker}\n${identity.pid}\n${root}`)
      .digest('hex');
    response.writeHead(200, { 'content-type': 'application/json' });
    response.end(JSON.stringify(identity));
    if (command === 'stop') {
      setImmediate(shutdown);
    }
  });
  let fd;
  let temporary;
  let temporaryIdentity;
  try {
    await new Promise((resolveListen, rejectListen) => {
      server.once('error', rejectListen);
      server.listen(0, '127.0.0.1', resolveListen);
    });
    const state = {
      marker: 'aikido-watch-v1',
      pid: process.pid,
      port: server.address().port,
      token,
      root,
    };
    const destination = filePath(root, 'watch.pid');
    temporary = filePath(root, `watch.pid.${token}.tmp`);
    fd = openSync(temporary, 'wx', 0o600);
    temporaryIdentity = fstatSync(fd);
    writeFileSync(fd, `${JSON.stringify(state)}\n`, 'utf8');
    closeSync(fd);
    fd = undefined;
    linkSync(temporary, destination);
    pidPath = destination;
    unlinkRegular(temporary);
    temporary = undefined;
  } catch (error) {
    try {
      if (fd !== undefined) closeSync(fd);
      if (temporary && !temporaryIdentity && fd !== undefined) {
        throw new Error('Temporary watcher state identity could not be verified');
      }
      if (temporary && temporaryIdentity) {
        const info = lstatSync(temporary);
        if (info.isFile() && !info.isSymbolicLink() &&
            info.dev === temporaryIdentity.dev && info.ino === temporaryIdentity.ino) unlinkSync(temporary);
        else throw new Error('Temporary watcher state identity changed');
      }
    } catch (cleanupError) {
      log('ERROR', `Cannot remove temporary watcher state: ${cleanupError.message}`);
    }
    try {
      await shutdown();
    } catch (cleanupError) {
      log('ERROR', `Cannot complete watcher startup cleanup: ${cleanupError.message}`);
    }
    try {
      unlinkOwnedStartLock(root, token);
    } catch (cleanupError) {
      log('ERROR', `Cannot remove watcher startup lock: ${cleanupError.message}`);
    }
    log('ERROR', `Watcher startup failed (PID: ${process.pid}): ${error.message}`);
    throw error;
  }
  log('INFO', `Watcher daemon ready (PID: ${process.pid})`);
  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);
}

  return { readState, readStartLock, daemonRequest, controlResponseMatches, startDaemon, runDaemon };
}
