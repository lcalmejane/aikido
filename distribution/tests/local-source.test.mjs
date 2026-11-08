import assert from 'node:assert/strict';
import { after, before, test } from 'node:test';
import {
  chmodSync, cpSync, existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDistribution } from '../scripts/build.mjs';
import { run } from '../npm/lib/cli.mjs';
import { validatePackage } from '../lib/package.mjs';
import {
  compareVersions, describeVersionChange, isOfficialSource, sourceWarnings,
} from '../lib/version.mjs';

const posixOnly = { skip: process.platform === 'win32' ? 'POSIX executable bits' : false };
const REPOSITORY = fileURLToPath(new URL('../..', import.meta.url));
const releases = {};
let sandbox;

before(() => {
  sandbox = mkdtempSync(join(tmpdir(), 'aikido-local-source-'));
  for (const version of ['1.4.0', '1.5.0', '1.6.0']) {
    releases[version] = join(sandbox, `release-${version}`);
    buildDistribution({ outDir: releases[version], sourceRevision: 'uncommitted', version });
  }
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

const project = () => mkdtempSync(join(sandbox, 'project-'));
const from = (args, root, env, directory) => run([...args, '--root', root, '--from', directory], { env, cwd: root });

test('version direction is analysed, not enforced', () => {
  assert.equal(compareVersions('1.5.0', '1.10.0'), -1);
  assert.equal(compareVersions('1.5.0', '1.5.0'), 0);
  assert.equal(compareVersions('1.5.0-dev', '1.5.0'), -1, 'a release is newer than its prerelease');
  assert.equal(compareVersions('1.5.0-rc.2', '1.5.0-rc.10'), -1);
  assert.equal(compareVersions('x', '1.0.0'), null);
  assert.equal(describeVersionChange(null, '1.5.0').direction, 'initial');
  assert.equal(describeVersionChange('1.5.0', '1.6.0').direction, 'upgrade');
  assert.equal(describeVersionChange('1.5.0', '1.5.0').direction, 'same');
  assert.equal(describeVersionChange('1.6.0', '1.5.0').direction, 'downgrade');
  assert.equal(describeVersionChange('nightly', '1.5.0').direction, 'unknown');
});

test('a source that is not the official repository is flagged, never refused', () => {
  assert.equal(isOfficialSource({ type: 'git', ref: 'github:lcalmejane/aikido', commit: 'a'.repeat(40) }), true);
  assert.equal(isOfficialSource({ type: 'local', ref: 'workspace' }), false);
  assert.match(sourceWarnings({ type: 'git', ref: 'github:someone/fork' })[0], /not the official/);
  assert.match(sourceWarnings({ type: 'local', ref: 'workspace' }, { type: 'git', ref: 'github:lcalmejane/aikido' }).join('\n'), /source changed/);
  assert.deepEqual(sourceWarnings({ type: 'git', ref: 'github:lcalmejane/aikido' }), []);
});

test('an edited package fails verification but is accepted, with warnings, as a local package', () => {
  const edited = join(sandbox, 'edited');
  buildDistribution({ outDir: edited, sourceRevision: 'uncommitted', version: '1.5.0' });
  const file = join(edited, 'codex/payload/prompts/hard_points/ai-kido.md');
  writeFileSync(file, `${readFileSync(file, 'utf8')}\nMy own rule.\n`);

  assert.throws(() => validatePackage(join(edited, 'codex')), /hash mismatch/);
  const accepted = validatePackage(join(edited, 'codex'), { trust: 'local' });
  assert.equal(accepted.valid, true);
  assert.equal(accepted.trust, 'local');
  assert.ok(accepted.warnings.some((warning) => /hash mismatch/.test(warning)), accepted.warnings.join('\n'));
  assert.throws(() => validatePackage(join(edited, 'codex'), { trust: 'bogus' }), /Unknown package trust/);
});

test('safety checks still block a local package', () => {
  const unsafe = join(sandbox, 'unsafe');
  buildDistribution({ outDir: unsafe, sourceRevision: 'uncommitted', version: '1.5.0' });
  const manifestPath = join(unsafe, 'codex/package-manifest.json');
  const manifest = JSON.parse(readFileSync(manifestPath, 'utf8'));
  manifest.payloadFiles[0].target = '../escape.md';
  writeFileSync(manifestPath, JSON.stringify(manifest));
  assert.throws(() => validatePackage(join(unsafe, 'codex'), { trust: 'local' }), /Invalid package/);
});

test('package validation rejects private Task Store data under custom directory names', () => {
  const packageRoot = join(sandbox, 'private-package');
  cpSync(join(releases['1.5.0'], 'codex'), packageRoot, { recursive: true });
  const privateRoot = join(packageRoot, 'payload', 'user-session-data');
  mkdirSync(join(privateRoot, 'events'), { recursive: true });
  writeFileSync(join(privateRoot, 'store.json'), JSON.stringify({ schemaVersion: 'task-store/1' }));
  writeFileSync(join(privateRoot, 'events', 'canary.json'), '{"text":"PRIVATE_TASK_CANARY"}');
  assert.throws(() => validatePackage(packageRoot, { trust: 'local' }), /Private Task Store/);
});

test('install and update from a local download: upgrade, same version, regression, edited copy', posixOnly, () => {
  const root = project();
  const env = machine('codex');

  const installPlan = from(['init', '--host', 'codex'], root, env, releases['1.5.0']);
  assert.equal(installPlan.result.status, 'plan', JSON.stringify(installPlan.result));
  assert.equal(installPlan.result.plan.trust, 'local');
  assert.ok(installPlan.result.plan.warnings.some((warning) => /not the official/.test(warning)));
  assert.equal(installPlan.result.source.kind, 'directory');
  assert.equal(existsSync(join(root, '.aikido/lock.json')), false, 'a plan writes nothing');

  const installed = from(['init', '--host', 'codex', '--yes'], root, env, releases['1.5.0']);
  assert.equal(installed.result.status, 'applied', JSON.stringify(installed.result));
  const lock = () => JSON.parse(readFileSync(join(root, '.aikido/lock.json'), 'utf8'));
  assert.equal(lock().aikido.version, '1.5.0');
  assert.deepEqual(lock().aikido.source, { type: 'local', ref: 'workspace' });

  // Same version: nothing to do.
  assert.equal(from(['update', '--host', 'codex'], root, env, releases['1.5.0']).result.status, 'up-to-date');

  // Upgrade: announced, then applied on confirmation.
  const up = from(['update', '--host', 'codex'], root, env, releases['1.6.0']);
  assert.equal(up.result.status, 'plan', JSON.stringify(up.result));
  assert.equal(up.result.plan.versionChange.direction, 'upgrade');
  assert.ok(!up.result.plan.warnings.some((warning) => /regression/.test(warning)));
  assert.equal(from(['update', '--host', 'codex', '--yes'], root, env, releases['1.6.0']).result.status, 'applied');
  assert.equal(lock().aikido.version, '1.6.0');

  // Regression: announced loudly, still possible once the exact plan is confirmed.
  const down = from(['update', '--host', 'codex'], root, env, releases['1.4.0']);
  assert.equal(down.result.status, 'plan', JSON.stringify(down.result));
  assert.equal(down.result.plan.versionChange.direction, 'downgrade');
  assert.ok(down.result.plan.warnings.some((warning) => /version regression: 1\.6\.0 -> 1\.4\.0/.test(warning)));
  assert.match(down.result.next, /REGRESSION/);
  assert.equal(lock().aikido.version, '1.6.0', 'the plan alone changes nothing');
  const rolledBack = from(['update', '--host', 'codex', '--yes'], root, env, releases['1.4.0']);
  assert.equal(rolledBack.result.status, 'applied', JSON.stringify(rolledBack.result));
  assert.equal(lock().aikido.version, '1.4.0');
});

test('a personalised package is installed as it is and its real content is recorded', posixOnly, () => {
  const root = project();
  const env = machine('codex');
  const personal = join(sandbox, 'personal');
  buildDistribution({ outDir: personal, sourceRevision: 'uncommitted', version: '1.5.0' });
  const file = join(personal, 'codex/payload/prompts/hard_points/ai-kido.md');
  writeFileSync(file, `${readFileSync(file, 'utf8')}\nMy own rule.\n`);

  const planned = from(['init', '--host', 'codex'], root, env, join(personal, 'codex'));
  assert.equal(planned.result.status, 'plan', JSON.stringify(planned.result));
  assert.equal(planned.result.source.kind, 'package');
  assert.ok(planned.result.plan.warnings.some((warning) => /hash mismatch/.test(warning)));
  assert.equal(from(['init', '--host', 'codex', '--yes'], root, env, join(personal, 'codex')).result.status, 'applied');
  assert.match(readFileSync(join(root, 'prompts/hard_points/ai-kido.md'), 'utf8'), /My own rule\./);

  // Installing the personalised package again is a no-op: the lock holds the real hash.
  assert.equal(from(['update', '--host', 'codex'], root, env, join(personal, 'codex')).result.status, 'up-to-date');
});

test('a package given with --from or --packages is the user\'s own and is not refused for its identity', posixOnly, () => {
  const root = project();
  const env = machine('codex');
  const edited = join(sandbox, 'edited');
  const accepted = run(['init', '--host', 'codex', '--root', root, '--packages', join(edited, 'codex')], { env, cwd: root });
  // --packages is the same option as --from: a package given on purpose is the user's own.
  assert.equal(accepted.result.status, 'plan', JSON.stringify(accepted.result));
  assert.equal(accepted.result.plan.trust, 'local');
});

test('a source repository checked out locally is built into a deterministic folder and cleaned up', posixOnly, () => {
  const root = project();
  const env = machine('codex');
  const planned = from(['init', '--host', 'codex'], root, env, REPOSITORY);
  assert.equal(planned.result.status, 'plan', JSON.stringify(planned.result).slice(0, 1500));
  assert.equal(planned.result.source.kind, 'source');
  assert.equal(existsSync(join(root, '.aikido/state/source-build')), false, 'the temporary build is removed');
  assert.equal(existsSync(join(root, '.aikido/lock.json')), false);
});

test('an unusable --from is reported without writing', posixOnly, () => {
  const root = project();
  const env = machine('codex');
  const missing = from(['init', '--host', 'codex'], root, env, join(sandbox, 'nope'));
  assert.equal(missing.exitCode, 1);
  assert.equal(missing.result.code, 'bad-source');
  const empty = mkdtempSync(join(sandbox, 'empty-'));
  assert.equal(from(['init', '--host', 'codex'], root, env, empty).result.code, 'bad-source');
  assert.equal(existsSync(join(root, '.aikido')), false);
  assert.equal(run(['init', '--from', empty, '--packages', empty]).result.code, 'usage');
});

test('--force overwrites conflicting files from the package, after saving them, and can be rolled back', posixOnly, () => {
  const root = project();
  const env = machine('codex');
  assert.equal(from(['init', '--host', 'codex', '--yes'], root, env, releases['1.5.0']).result.status, 'applied');
  const file = join(root, 'prompts/hard_points/ai-kido.md');
  const shipped = readFileSync(file, 'utf8');
  writeFileSync(file, `${shipped}\nLocal edit.\n`);

  // The 1.6.0 release changes the same file upstream.
  const next = join(sandbox, 'forced-1.6.0');
  buildDistribution({ outDir: next, sourceRevision: 'uncommitted', version: '1.6.0' });
  const upstream = join(next, 'codex/payload/prompts/hard_points/ai-kido.md');
  writeFileSync(upstream, `${readFileSync(upstream, 'utf8')}\nUpstream edit.\n`);

  const blocked = from(['update', '--host', 'codex'], root, env, next);
  assert.equal(blocked.result.status, 'conflict', JSON.stringify(blocked.result));
  assert.equal(run(['sync', '--force', '--root', root]).result.code, 'usage', '--force is for update only');

  const planned = from(['update', '--host', 'codex', '--force'], root, env, next);
  assert.equal(planned.result.status, 'plan', JSON.stringify(planned.result));
  assert.ok(planned.result.plan.forcedFiles.includes('prompts/hard_points/ai-kido.md'));
  assert.match(planned.result.next, /FORCED/);
  assert.match(readFileSync(file, 'utf8'), /Local edit\./, 'a plan writes nothing');

  const applied = from(['update', '--host', 'codex', '--force', '--yes'], root, env, next);
  assert.equal(applied.result.status, 'applied', JSON.stringify(applied.result));
  const written = readFileSync(file, 'utf8');
  assert.match(written, /Upstream edit\./);
  assert.doesNotMatch(written, /Local edit\./);
  assert.equal(JSON.parse(readFileSync(join(root, '.aikido/lock.json'), 'utf8')).aikido.version, '1.6.0');
  assert.ok(existsSync(join(root, '.aikido/backups')), 'the overwritten file was saved');
});
