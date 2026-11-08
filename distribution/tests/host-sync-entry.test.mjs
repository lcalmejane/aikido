import assert from 'node:assert/strict';
import { after, beforeEach, test } from 'node:test';
import {
  chmodSync, cpSync, existsSync, mkdirSync, mkdtempSync, rmSync, writeFileSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { buildDistribution } from '../scripts/build.mjs';
import { locateRuntime, syncProject } from '../../prompts/hard_points/system/host-sync/host-sync.mjs';

const posixOnly = { skip: process.platform === 'win32' ? 'POSIX executable bits' : false };
const SCRIPT = fileURLToPath(new URL('../../prompts/hard_points/system/host-sync/host-sync.mjs', import.meta.url));
let sandbox;
let project;
let environment;

function fakeBinary(name) {
  mkdirSync(join(sandbox, 'bin'), { recursive: true });
  const path = join(sandbox, 'bin', name);
  writeFileSync(path, '#!/usr/bin/env node\n');
  chmodSync(path, 0o755);
}

function retainPackage(host) {
  const dist = join(sandbox, 'dist');
  if (!existsSync(dist)) buildDistribution({ outDir: dist, sourceRevision: 'a'.repeat(40) });
  cpSync(join(dist, host), join(project, '.aikido/state/cli-runtime', host), { recursive: true });
}

beforeEach(() => {
  if (sandbox) rmSync(sandbox, { recursive: true, force: true });
  sandbox = mkdtempSync(join(tmpdir(), 'aikido-host-sync-'));
  project = join(sandbox, 'project');
  mkdirSync(project);
  environment = { PATH: join(sandbox, 'bin'), HOME: sandbox, AIKIDO_EXTENSION_DIRS: join(sandbox, 'none') };
});

after(() => {
  if (sandbox) rmSync(sandbox, { recursive: true, force: true });
});

test('without a retained runtime the entry point reports it and still lists the installed CLIs', posixOnly, () => {
  fakeBinary('codex');
  assert.equal(locateRuntime(project), null);
  const report = syncProject({ root: project, env: environment });
  assert.equal(report.status, 'runtime-missing');
  assert.deepEqual(report.hosts.map(({ host }) => host), ['codex']);
  assert.match(report.message, /aikido sync/);
  assert.equal(existsSync(join(project, '.aikido/state/hosts.json')), false);
});

test('delegates to the retained package runtime and synchronises every installed CLI', posixOnly, () => {
  fakeBinary('claude');
  fakeBinary('codex');
  retainPackage('codex');
  const runtime = locateRuntime(project);
  assert.equal(runtime.kind, 'package');
  assert.equal(runtime.host, 'codex');
  const report = syncProject({ root: project, env: environment });
  assert.equal(report.status, 'ok', JSON.stringify(report));
  assert.equal(report.runtime, 'package');
  assert.deepEqual(report.results.map(({ host }) => host).sort(), ['claude-code', 'codex']);
  assert.ok(existsSync(join(project, '.claude/commands/check-cli.md')));
  assert.ok(existsSync(join(project, '.agents/skills/check-cli/SKILL.md')));
});

test('check and dry-run flags are forwarded and nothing is written', posixOnly, () => {
  fakeBinary('claude');
  retainPackage('claude-code');
  const dry = syncProject({ root: project, env: environment, dryRun: true });
  assert.equal(dry.mode, 'repair-dry-run');
  const check = syncProject({ root: project, env: environment, check: true });
  assert.equal(check.mode, 'check');
  assert.equal(existsSync(join(project, '.claude')), false);
});

test('a broken retained runtime is reported as structured JSON, not thrown', posixOnly, () => {
  const broken = join(project, '.aikido/state/cli-runtime/codex');
  mkdirSync(join(broken, 'scripts'), { recursive: true });
  writeFileSync(join(broken, 'catalog.json'), '{}');
  writeFileSync(join(broken, 'scripts/sync-hosts.mjs'), 'process.stdout.write("not json");\n');
  const report = syncProject({ root: project, env: environment });
  assert.equal(report.status, 'error');
  assert.match(report.message, /not json/);
});

test('command line prints JSON and exits non-zero only on error or attention', posixOnly, () => {
  fakeBinary('codex');
  const detect = spawnSync(process.execPath, [SCRIPT, '--detect', '--root', project], { encoding: 'utf8', env: environment });
  assert.equal(detect.status, 0, detect.stderr);
  assert.deepEqual(JSON.parse(detect.stdout).hosts.map(({ host }) => host), ['codex']);
  const missing = spawnSync(process.execPath, [SCRIPT, '--root', project], { encoding: 'utf8', env: environment });
  assert.equal(missing.status, 0);
  assert.equal(JSON.parse(missing.stdout).status, 'runtime-missing');
  const unknown = spawnSync(process.execPath, [SCRIPT, '--bogus'], { encoding: 'utf8', env: environment });
  assert.equal(unknown.status, 2);
  assert.equal(JSON.parse(unknown.stdout).status, 'error');
});
