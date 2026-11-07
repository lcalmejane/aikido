import assert from 'node:assert/strict';
import { after, beforeEach, test } from 'node:test';
import {
  chmodSync, existsSync, mkdirSync, mkdtempSync, rmSync, writeFileSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { detectHosts, findExecutable } from '../lib/host-detect.mjs';

const posixOnly = { skip: process.platform === 'win32' ? 'POSIX executable bits' : false };
let sandbox;

function fakeBinary(directory, name) {
  mkdirSync(directory, { recursive: true });
  const path = join(directory, name);
  writeFileSync(path, '#!/usr/bin/env node\n');
  chmodSync(path, 0o755);
  return path;
}

beforeEach(() => {
  if (sandbox) rmSync(sandbox, { recursive: true, force: true });
  sandbox = mkdtempSync(join(tmpdir(), 'aikido-host-detect-'));
});

after(() => {
  if (sandbox) rmSync(sandbox, { recursive: true, force: true });
});

test('finds executables on PATH only when they are regular executable files', posixOnly, () => {
  const bin = join(sandbox, 'bin');
  const claude = fakeBinary(bin, 'claude');
  writeFileSync(join(bin, 'codex'), 'not executable');
  chmodSync(join(bin, 'codex'), 0o644);
  mkdirSync(join(bin, 'kiro-cli'));
  const env = { PATH: bin };
  assert.equal(findExecutable('claude', { env }), claude);
  assert.equal(findExecutable('codex', { env }), null);
  assert.equal(findExecutable('kiro-cli', { env }), null);
  assert.equal(findExecutable('missing', { env }), null);
});

test('detects CLIs and editor extensions without spawning anything', posixOnly, () => {
  const bin = join(sandbox, 'bin');
  fakeBinary(bin, 'claude');
  fakeBinary(bin, 'kiro');
  const extensions = join(sandbox, 'extensions');
  mkdirSync(join(extensions, 'zoocodeorganization.zoo-code-3.2.1'), { recursive: true });
  mkdirSync(join(extensions, 'github.copilot-chat-0.30.0'), { recursive: true });
  mkdirSync(join(extensions, 'someone.unrelated-1.0.0'), { recursive: true });
  const { hosts } = detectHosts({
    root: sandbox,
    env: { PATH: bin, AIKIDO_EXTENSION_DIRS: extensions },
    home: sandbox,
  });
  assert.deepEqual(hosts.map(({ host }) => host).sort(), ['claude-code', 'copilot-vscode', 'kiro-cli', 'zoo-code']);
  assert.equal(hosts.find(({ host }) => host === 'claude-code').evidence[0].kind, 'binary');
  assert.equal(hosts.find(({ host }) => host === 'zoo-code').evidence[0].kind, 'extension');
});

test('detects Codex through its VS Code extension when no binary is on PATH', posixOnly, () => {
  const extensions = join(sandbox, 'extensions');
  mkdirSync(join(extensions, 'openai.chatgpt-26.1021.22027-darwin-arm64'), { recursive: true });
  mkdirSync(join(extensions, 'openai.codex-audio-26.1021.22027'), { recursive: true });
  const { hosts } = detectHosts({
    root: sandbox, env: { PATH: '', AIKIDO_EXTENSION_DIRS: extensions }, home: sandbox,
  });
  assert.deepEqual(hosts.map(({ host }) => host), ['codex']);
  assert.equal(hosts[0].evidence[0].kind, 'extension');
});

test('single-host workspace markers and project-local binaries are evidence, shared markers stay hints', posixOnly, () => {
  mkdirSync(join(sandbox, '.kiro'));
  mkdirSync(join(sandbox, '.claude'));
  mkdirSync(join(sandbox, '.roo'));
  mkdirSync(join(sandbox, '.agents'));
  fakeBinary(join(sandbox, 'node_modules', '.bin'), 'codex');
  const result = detectHosts({
    root: sandbox,
    env: { PATH: '', AIKIDO_EXTENSION_DIRS: join(sandbox, 'none') },
    home: sandbox,
  });
  const byHost = Object.fromEntries(result.hosts.map(({ host, evidence }) => [host, evidence.map(({ kind }) => kind)]));
  assert.deepEqual(byHost, {
    'claude-code': ['workspace'],
    codex: ['workspace-binary'],
    'kiro-cli': ['workspace'],
  });
  const hinted = result.hints.map(({ host }) => host);
  assert.ok(hinted.includes('zoo-code') && hinted.includes('roo-code-legacy'), 'shared .roo is only a hint');
  assert.ok(!result.hosts.some(({ host }) => host === 'zoo-code'));
});

test('hosts without a project-level surface are never reported', posixOnly, () => {
  const result = detectHosts({
    root: sandbox,
    env: { PATH: '', AIKIDO_EXTENSION_DIRS: join(sandbox, 'none') },
    home: sandbox,
  });
  assert.deepEqual(result.hosts, []);
  assert.equal(existsSync(join(sandbox, '.aikido')), false, 'detection must not write anything');
});
