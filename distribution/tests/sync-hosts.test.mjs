import assert from 'node:assert/strict';
import { after, beforeEach, test } from 'node:test';
import {
  chmodSync, existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { spawnSync } from 'node:child_process';
import { HOST_STATE_PATH, readHostState, selectHosts, syncHosts } from '../lib/sync-hosts.mjs';

const posixOnly = { skip: process.platform === 'win32' ? 'POSIX executable bits' : false };
let sandbox;
let workspace;
let environment;

function fakeBinary(name) {
  const path = join(sandbox, 'bin', name);
  mkdirSync(join(sandbox, 'bin'), { recursive: true });
  writeFileSync(path, '#!/usr/bin/env node\n');
  chmodSync(path, 0o755);
}

beforeEach(() => {
  if (sandbox) rmSync(sandbox, { recursive: true, force: true });
  sandbox = mkdtempSync(join(tmpdir(), 'aikido-sync-hosts-'));
  workspace = join(sandbox, 'project');
  mkdirSync(workspace);
  environment = { PATH: join(sandbox, 'bin'), AIKIDO_EXTENSION_DIRS: join(sandbox, 'no-extensions') };
});

after(() => {
  if (sandbox) rmSync(sandbox, { recursive: true, force: true });
});

test('synchronises wrappers for every CLI detected on the machine', posixOnly, () => {
  fakeBinary('claude');
  fakeBinary('codex');
  const report = syncHosts({ root: workspace, env: environment, home: sandbox });
  assert.equal(report.status, 'ok', JSON.stringify(report.results));
  assert.deepEqual(report.results.map(({ host }) => host).sort(), ['claude-code', 'codex']);
  assert.ok(existsSync(join(workspace, '.claude/commands/check-cli.md')));
  assert.ok(existsSync(join(workspace, '.agents/skills/check-cli/SKILL.md')));
  assert.ok(existsSync(join(workspace, '.codex/agents')));
  assert.deepEqual(readHostState(workspace).hosts, ['claude-code', 'codex']);
  assert.equal(report.state.applied, true);
});

test('a second run is idempotent and keeps the remembered hosts', posixOnly, () => {
  fakeBinary('claude');
  syncHosts({ root: workspace, env: environment, home: sandbox });
  const second = syncHosts({ root: workspace, env: environment, home: sandbox });
  assert.equal(second.status, 'ok');
  assert.equal(second.results[0].created, 0);
  assert.equal(second.results[0].updated, 0);
  assert.equal(second.state.action, 'unchanged');
  // The CLI disappears from PATH: the workspace still remembers it and keeps it up to date.
  const without = selectHosts({ root: workspace, env: { PATH: '', AIKIDO_EXTENSION_DIRS: environment.AIKIDO_EXTENSION_DIRS }, home: sandbox });
  assert.deepEqual(without.hosts, ['claude-code']);
});

test('explicit hosts override detection and are validated', posixOnly, () => {
  fakeBinary('claude');
  const report = syncHosts({ root: workspace, hosts: ['kiro-cli'], env: environment, home: sandbox });
  assert.deepEqual(report.results.map(({ host }) => host), ['kiro-cli']);
  assert.ok(existsSync(join(workspace, '.kiro/skills/check-cli/SKILL.md')));
  assert.equal(existsSync(join(workspace, '.claude')), false);
  assert.throws(() => syncHosts({ root: workspace, hosts: ['nope'], env: environment, home: sandbox }), /known host ids/);
  assert.throws(() => syncHosts({ root: workspace, hosts: ['claude-cowork'], env: environment, home: sandbox }), /no project-level integration/);
  assert.throws(() => syncHosts({ root: workspace, hosts: ['copilot-cowork'], env: environment, home: sandbox }), /disabled/);
});

test('dry-run and check never write wrappers or state', posixOnly, () => {
  fakeBinary('claude');
  const dry = syncHosts({ root: workspace, env: environment, home: sandbox, dryRun: true });
  assert.equal(dry.mode, 'repair-dry-run');
  assert.equal(dry.results[0].created > 0, true);
  assert.equal(existsSync(join(workspace, '.claude')), false);
  assert.equal(existsSync(join(workspace, HOST_STATE_PATH)), false);
  const check = syncHosts({ root: workspace, env: environment, home: sandbox, repair: false });
  assert.equal(check.mode, 'check');
  assert.equal(existsSync(join(workspace, '.claude')), false);
  assert.equal(existsSync(join(workspace, HOST_STATE_PATH)), false);
});

test('reports no-hosts without writing when only shared workspace markers exist', posixOnly, () => {
  mkdirSync(join(workspace, '.roo'));
  const report = syncHosts({ root: workspace, env: environment, home: sandbox });
  assert.equal(report.status, 'no-hosts');
  assert.deepEqual(report.hints.map(({ host }) => host), ['zoo-code', 'roo-code-legacy']);
  assert.equal(existsSync(join(workspace, '.aikido')), false);
});

test('a single-host workspace marker is evidence that the host is used here', posixOnly, () => {
  mkdirSync(join(workspace, '.kiro'));
  const report = syncHosts({ root: workspace, env: environment, home: sandbox, dryRun: true });
  assert.deepEqual(report.results.map(({ host }) => host), ['kiro-cli']);
  assert.equal(report.detected[0].evidence[0].kind, 'workspace');
});

test('a stray AIKIDO_HOST cannot contradict the explicit host list', posixOnly, () => {
  const report = syncHosts({
    root: workspace, hosts: ['codex'], env: { ...environment, AIKIDO_HOST: 'zoo-code' }, home: sandbox,
  });
  assert.equal(report.status, 'ok');
  assert.deepEqual(report.results.map(({ host }) => host), ['codex']);
});

test('a customised wrapper is preserved and reported without blocking other hosts', posixOnly, () => {
  fakeBinary('claude');
  fakeBinary('codex');
  syncHosts({ root: workspace, env: environment, home: sandbox });
  writeFileSync(join(workspace, '.claude/commands/check-cli.md'), '# my own command\n');
  const report = syncHosts({ root: workspace, env: environment, home: sandbox });
  assert.equal(report.status, 'attention');
  assert.equal(report.results.find(({ host }) => host === 'claude-code').status, 'conflict');
  assert.equal(report.results.find(({ host }) => host === 'codex').status, 'ok');
  assert.equal(readFileSync(join(workspace, '.claude/commands/check-cli.md'), 'utf8'), '# my own command\n');
});

test('script prints structured JSON for detect and sync', posixOnly, () => {
  fakeBinary('claude');
  const script = new URL('../scripts/sync-hosts.mjs', import.meta.url).pathname;
  const env = { ...environment, HOME: sandbox };
  const detected = spawnSync(process.execPath, [script, '--detect', '--root', workspace], { encoding: 'utf8', env });
  assert.equal(detected.status, 0, detected.stderr);
  assert.deepEqual(JSON.parse(detected.stdout).hosts.map(({ host }) => host), ['claude-code']);
  const synced = spawnSync(process.execPath, [script, '--root', workspace], { encoding: 'utf8', env });
  assert.equal(synced.status, 0, synced.stdout);
  assert.equal(JSON.parse(synced.stdout).status, 'ok');
  const bad = spawnSync(process.execPath, [script, '--detect', '--check'], { encoding: 'utf8', env });
  assert.equal(bad.status, 2);
  assert.match(JSON.parse(bad.stdout).error.message, /cannot be combined/);
});
