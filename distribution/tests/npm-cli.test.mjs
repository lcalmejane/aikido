import assert from 'node:assert/strict';
import { after, before, test } from 'node:test';
import {
  chmodSync, existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { buildDistribution } from '../scripts/build.mjs';
import {
  bundledHosts, locateRetained, parseArgs, retainRuntime, run,
} from '../npm/lib/cli.mjs';

const posixOnly = { skip: process.platform === 'win32' ? 'POSIX executable bits' : false };
const BIN = fileURLToPath(new URL('../npm/bin/aikido.mjs', import.meta.url));
let sandbox;
let packages;

before(() => {
  sandbox = mkdtempSync(join(tmpdir(), 'aikido-npm-cli-'));
  packages = join(sandbox, 'packages');
  buildDistribution({ outDir: packages, sourceRevision: 'b'.repeat(40) });
});

after(() => rmSync(sandbox, { recursive: true, force: true }));

function machine(...clis) {
  const home = mkdtempSync(join(sandbox, 'home-'));
  const bin = join(home, 'bin');
  mkdirSync(bin);
  for (const name of clis) {
    writeFileSync(join(bin, name), '#!/usr/bin/env node\n');
    chmodSync(join(bin, name), 0o755);
  }
  return { PATH: bin, HOME: home, AIKIDO_EXTENSION_DIRS: join(home, 'none') };
}

function project() {
  const root = mkdtempSync(join(sandbox, 'project-'));
  return root;
}

const call = (args, root, env) => run([...args, '--root', root, '--packages', packages], { env, cwd: root });

test('arguments are validated strictly', () => {
  assert.equal(parseArgs([]).command, 'help');
  assert.equal(parseArgs(['--version']).command, 'version');
  assert.deepEqual(parseArgs(['sync', '--hosts', 'codex', '--dry-run']).options, { '--hosts': 'codex', '--dry-run': true });
  assert.throws(() => parseArgs(['nope']), /Unknown command/);
  assert.throws(() => parseArgs(['sync', '--bogus']), /Unknown option/);
  assert.throws(() => parseArgs(['sync', '--hosts']), /requires a value/);
  assert.throws(() => parseArgs(['sync', '--yes', '--yes']), /Duplicate/);
});

test('help, version and bundled hosts', () => {
  assert.equal(run([]).result.status, 'ok');
  assert.match(run(['--version']).result.version, /^\d+\.\d+\.\d+/);
  assert.ok(bundledHosts(packages).includes('codex'));
  assert.deepEqual(bundledHosts(join(sandbox, 'missing')), []);
});

test('detect lists the installed CLIs and writes nothing', posixOnly, () => {
  const root = project();
  const { exitCode, result } = call(['detect'], root, machine('codex', 'claude'));
  assert.equal(exitCode, 0);
  assert.deepEqual(result.hosts.map(({ host }) => host).sort(), ['claude-code', 'codex']);
  assert.equal(existsSync(join(root, '.aikido')), false);
});

test('init shows the plan without writing, then applies it with --yes for every detected CLI', posixOnly, () => {
  const root = project();
  const env = machine('codex', 'claude');

  const planned = call(['init', '--host', 'codex'], root, env);
  assert.equal(planned.result.status, 'plan', JSON.stringify(planned.result));
  assert.match(planned.result.next, /--yes/);
  assert.equal(existsSync(join(root, '.aikido/lock.json')), false);

  const applied = call(['init', '--host', 'codex', '--yes'], root, env);
  assert.equal(applied.exitCode, 0, JSON.stringify(applied.result));
  assert.equal(applied.result.status, 'applied');
  assert.ok(existsSync(join(root, '.aikido/lock.json')));
  assert.deepEqual(applied.result.applied.hostSync.results.map(({ host }) => host).sort(), ['claude-code', 'codex']);
  assert.ok(existsSync(join(root, '.claude/commands/check-cli.md')), 'Claude Code wrapper');
  assert.ok(existsSync(join(root, '.agents/skills/check-cli/SKILL.md')), 'Codex wrapper');
  assert.deepEqual(JSON.parse(readFileSync(join(root, '.aikido/state/hosts.json'), 'utf8')).hosts, ['claude-code', 'codex']);
  assert.ok(locateRetained(root).endsWith('codex'));

  const again = call(['init', '--host', 'codex'], root, env);
  assert.equal(again.result.status, 'up-to-date');
  assert.match(again.result.next, /aikido update|aikido sync/);
});

test('sync picks up a CLI installed after init, using the retained runtime', posixOnly, () => {
  const root = project();
  assert.equal(call(['init', '--host', 'codex', '--yes'], root, machine('codex')).result.status, 'applied');
  assert.equal(existsSync(join(root, '.claude/commands/check-cli.md')), false);

  const later = machine('codex', 'claude');
  const check = call(['check'], root, later);
  assert.equal(check.result.command, 'check');
  assert.equal(existsSync(join(root, '.claude/commands/check-cli.md')), false, 'check never writes');

  const dry = call(['sync', '--dry-run'], root, later);
  assert.equal(existsSync(join(root, '.claude/commands/check-cli.md')), false, 'dry-run never writes');
  assert.ok(dry.result.results.some(({ host }) => host === 'claude-code'));

  const synced = call(['sync'], root, later);
  assert.equal(synced.exitCode, 0, JSON.stringify(synced.result));
  assert.ok(existsSync(join(root, '.claude/commands/check-cli.md')));
});

test('the project entry point reaches the retained runtime after init', posixOnly, () => {
  const root = project();
  const env = machine('codex', 'claude');
  call(['init', '--host', 'codex', '--yes'], root, env);
  const entry = join(root, 'prompts/hard_points/system/host-sync/host-sync.mjs');
  assert.ok(existsSync(entry), 'the project ships its own entry point');
  rmSync(join(root, '.claude'), { recursive: true, force: true });
  const child = spawnSync(process.execPath, [entry], { cwd: root, env, encoding: 'utf8' });
  assert.equal(child.status, 0, child.stderr || child.stdout);
  const report = JSON.parse(child.stdout);
  assert.equal(report.runtime, 'package');
  assert.ok(existsSync(join(root, '.claude/commands/check-cli.md')));
});

test('update is a no-op plan when current, and refreshes CLIs with --yes', posixOnly, () => {
  const root = project();
  call(['init', '--host', 'codex', '--yes'], root, machine('codex'));
  const later = machine('codex', 'claude');
  const idle = call(['update'], root, later);
  assert.equal(idle.result.status, 'up-to-date', JSON.stringify(idle.result));
  const refreshed = call(['update', '--yes'], root, later);
  assert.equal(refreshed.exitCode, 0, JSON.stringify(refreshed.result));
  assert.ok(existsSync(join(root, '.claude/commands/check-cli.md')));
});

test('errors are structured and non-zero', posixOnly, () => {
  const root = project();
  const unknown = call(['init', '--host', 'nope'], root, machine());
  assert.equal(unknown.exitCode, 1);
  assert.equal(unknown.result.code, 'unknown-host');
  const none = call(['init'], root, machine());
  assert.equal(none.result.code, 'no-host');
  assert.equal(run(['bogus']).exitCode, 64);
  assert.equal(call(['sync'], join(root, 'missing'), machine()).result.status, 'error');
});

test('retaining the runtime keeps exactly one package and refuses unsafe paths', posixOnly, () => {
  const root = project();
  retainRuntime(root, join(packages, 'codex'));
  retainRuntime(root, join(packages, 'claude-code'));
  assert.ok(locateRetained(root).endsWith('claude-code'));
  assert.equal(existsSync(join(root, '.aikido/state/cli-runtime/codex')), false);
});

test('the bin script prints JSON', posixOnly, () => {
  const child = spawnSync(process.execPath, [BIN, '--version'], { encoding: 'utf8' });
  assert.equal(child.status, 0);
  assert.equal(JSON.parse(child.stdout).status, 'ok');
});
