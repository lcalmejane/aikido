import { after, before, test } from 'node:test';
import assert from 'node:assert/strict';
import {
  chmodSync, cpSync, existsSync, mkdirSync, mkdtempSync, readFileSync, readdirSync, rmSync, unlinkSync, writeFileSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import { delimiter, join } from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { applyBootstrap, planBootstrap } from '../lib/bootstrap-plan.mjs';
import { validatePackage } from '../lib/package.mjs';
import { validateLock } from '../lib/lock.mjs';
import { buildDistribution } from '../scripts/build.mjs';

let workspace;
let packageRoot;
let zooCodePackage;
let packageRoots;

before(() => {
  workspace = mkdtempSync(join(tmpdir(), 'aikido-apply-tests-'));
  const output = join(workspace, 'dist');
  const report = buildDistribution({ outDir: output, sourceRevision: 'uncommitted' });
  packageRoot = join(output, 'claude-code');
  zooCodePackage = join(output, 'zoo-code');
  packageRoots = report.hosts.filter((host) => host.generated).map((host) => join(output, host.host));
});

after(() => {
  if (workspace) rmSync(workspace, { recursive: true, force: true });
});

const newProject = () => mkdtempSync(join(tmpdir(), 'aikido-project-'));
const cliPath = fileURLToPath(new URL('../scripts/bootstrap-plan.mjs', import.meta.url));
const packageOptions = (root) => ({
  root,
  packageRoot,
  mode: 'STANDARD',
  projectName: 'Example project',
});

function rtkEnvironment(name, enabled) {
  const bin = join(workspace, name);
  mkdirSync(bin, { recursive: true });
  if (enabled) {
    const command = join(bin, 'rtk');
    writeFileSync(command, '#!/bin/sh\nprintf "rtk 1.1.0\\n"\n');
    chmodSync(command, 0o755);
  }
  return { ...process.env, PATH: enabled ? `${bin}${delimiter}${process.env.PATH ?? ''}` : bin };
}

test('Zoo Code bootstrap installs the RTK rule only when detected and records the local flag', () => {
  const root = newProject();
  try {
    const options = {
      ...packageOptions(root),
      packageRoot: zooCodePackage,
      env: rtkEnvironment('rtk-on', true),
    };
    const plan = planBootstrap(options);
    assert.equal(plan.ready, true, JSON.stringify(plan.conflicts));
    assert.ok(plan.files.some(({ target, action }) => target === '.roo/rules/rtk.md' && action === 'create'));
    assert.ok(plan.files.some(({ target, action, value }) => (
      target === '.aikido/state/features.json' && action === 'create' && value === 'ON'
    )));

    applyBootstrap({ ...options, expectedPlanId: plan.planId });
    assert.match(readFileSync(join(root, '.roo/rules/rtk.md'), 'utf8'), /prefix supported commands with `rtk`/);
    assert.deepEqual(
      JSON.parse(readFileSync(join(root, '.aikido/state/features.json'), 'utf8')),
      { schemaVersion: 1, flags: { rtk: 'ON' } },
    );
    const lock = JSON.parse(readFileSync(join(root, '.aikido/lock.json'), 'utf8'));
    assert.ok(lock.files.some(({ path }) => path === '.roo/rules/rtk.md'));
    assert.ok(!lock.files.some(({ path }) => path === '.aikido/state/features.json'));

    const changedFeaturePlan = planBootstrap({
      ...options,
      env: rtkEnvironment('rtk-later-off', false),
    });
    assert.equal(changedFeaturePlan.alreadyInstalled, false);
    assert.match(changedFeaturePlan.conflicts.map(({ reason }) => reason).join('\n'), /use the update workflow/);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }

  const rootWithoutRtk = newProject();
  try {
    const options = {
      ...packageOptions(rootWithoutRtk),
      packageRoot: zooCodePackage,
      env: rtkEnvironment('rtk-off', false),
    };
    const plan = planBootstrap(options);
    assert.ok(!plan.files.some(({ target }) => target === '.roo/rules/rtk.md'));
    assert.ok(plan.files.some(({ target, value }) => (
      target === '.aikido/state/features.json' && value === 'OFF'
    )));
    applyBootstrap({ ...options, expectedPlanId: plan.planId });
    assert.equal(existsSync(join(rootWithoutRtk, '.roo/rules/rtk.md')), false);
    assert.equal(JSON.parse(readFileSync(join(rootWithoutRtk, '.aikido/state/features.json'), 'utf8')).flags.rtk, 'OFF');
  } finally {
    rmSync(rootWithoutRtk, { recursive: true, force: true });
  }
});

test('Kimono flags are planned on install and refreshed on repeat install without changing the lock', () => {
  const root = newProject();
  try {
    const names = ['aikido_snapshot', 'aikido_search', 'aikido_file'].map((name) => `mcp__kimono__${name}`);
    const options = {
      ...packageOptions(root),
      env: { ...process.env, AIKIDO_TOOLS: JSON.stringify(names) },
    };
    const initial = planBootstrap(options);
    assert.equal(initial.featureFlags.kimono, 'ON');
    const inventoryPath = join(root, 'tools.json');
    writeFileSync(inventoryPath, JSON.stringify(names));
    const cli = spawnSync(process.execPath, [
      join(packageRoot, 'scripts/bootstrap-plan.mjs'), '--root', root,
      '--package', packageRoot, '--mode', 'STANDARD', '--name', 'Example project',
      '--tools-file', inventoryPath,
    ], { encoding: 'utf8', env: { ...process.env, AIKIDO_TOOLS: '[]' } });
    assert.equal(cli.status, 0, cli.stderr);
    assert.equal(JSON.parse(cli.stdout).featureFlags.kimono, 'ON');
    assert.equal(existsSync(join(root, '.aikido/state/features.json')), false);
    applyBootstrap({ ...options, expectedPlanId: initial.planId });
    const statePath = join(root, '.aikido/state/features.json');
    const lockPath = join(root, '.aikido/lock.json');
    const lock = readFileSync(lockPath);
    assert.equal(JSON.parse(readFileSync(statePath, 'utf8')).flags.kimono, 'ON');
    assert.ok(!JSON.parse(lock).files.some(({ path }) => path === '.aikido/state/features.json'));
    assert.match(readFileSync(join(root, 'AGENTS.md'), 'utf8'), /Kimono capability gate/);

    const absent = { ...options, env: { ...process.env, AIKIDO_TOOLS: '[]' } };
    const repeated = planBootstrap(absent);
    assert.equal(repeated.alreadyInstalled, true);
    assert.equal(repeated.confirmationRequired, true);
    assert.throws(() => applyBootstrap({ ...absent, expectedPlanId: initial.planId }), /Confirmation/);
    applyBootstrap({ ...absent, expectedPlanId: repeated.planId });
    assert.equal(JSON.parse(readFileSync(statePath, 'utf8')).flags.kimono, 'OFF');
    assert.deepEqual(readFileSync(lockPath), lock);
    const { AIKIDO_TOOLS, ...unknownEnv } = options.env;
    const unknown = planBootstrap({ ...options, env: unknownEnv });
    assert.equal(unknown.kimono.status, 'unknown');
    assert.equal(unknown.confirmationRequired, false);
    applyBootstrap({ ...options, env: unknownEnv, expectedPlanId: unknown.planId });
    assert.equal(JSON.parse(readFileSync(statePath, 'utf8')).flags.kimono, 'OFF');
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test('validates extracted packages and rejects damaged payload hashes', () => {
  for (const packagePath of packageRoots) assert.equal(validatePackage(packagePath).valid, true, packagePath);

  const claudeManifest = JSON.parse(readFileSync(join(packageRoot, '.claude-plugin/plugin.json'), 'utf8'));
  const marketplace = JSON.parse(readFileSync(join(packageRoot, '.claude-plugin/marketplace.json'), 'utf8'));
  const packageManifest = JSON.parse(readFileSync(join(packageRoot, 'package-manifest.json'), 'utf8'));
  const initCommand = readFileSync(join(packageRoot, 'commands/init-aikido.md'), 'utf8');
  assert.deepEqual(
    { name: claudeManifest.name, version: claudeManifest.version },
    { name: 'aikido', version: packageManifest.version },
  );
  assert.equal(marketplace.name, 'aikido');
  assert.ok(marketplace.plugins.some((plugin) => plugin.name === 'aikido' && plugin.source === '.'));
  assert.match(initCommand, /\/aikido:init-aikido/);
  assert.match(initCommand, /CLAUDE_PLUGIN_ROOT.*payload\/prompts\/hard_points\/commands\/init-aikido\.md/s);
  assert.match(initCommand, /CLAUDE_PLUGIN_ROOT\}\/scripts\/bootstrap-plan\.mjs.*--apply --confirm <plan-id>/s);
  assert.doesNotMatch(readFileSync(join(packageRoot, 'commands/check-truth.md'), 'utf8'), /bootstrap-plan/);
  assert.ok(packageManifest.files.some((file) => file.path === 'scripts/bootstrap-plan.mjs'));
  assert.ok(packageManifest.files.some((file) => file.path === 'scripts/update-plan.mjs'));
  assert.ok(packageManifest.files.some((file) => file.path === 'lib/update-plan.mjs'));
  assert.ok(packageManifest.files.some((file) => file.path === 'scripts/validate-package.mjs'));
  assert.equal(packageManifest.projectFiles.some((file) => file.target.startsWith('commands/')), false);

  const copilotRoot = join(workspace, 'dist/copilot-vscode');
  const copilotPlugin = JSON.parse(readFileSync(join(copilotRoot, 'plugin.json'), 'utf8'));
  const copilotManifest = JSON.parse(readFileSync(join(copilotRoot, 'package-manifest.json'), 'utf8'));
  const copilotCommand = readFileSync(join(copilotRoot, 'com.github.copilot/commands/init-aikido.prompt.md'), 'utf8');
  assert.deepEqual(
    { schema: copilotPlugin.$schema, name: copilotPlugin.name, version: copilotPlugin.version },
    {
      schema: 'https://agent-plugins.org/schemas/1.0.0/plugin.schema.json',
      name: 'aikido',
      version: copilotManifest.version,
    },
  );
  assert.match(copilotCommand, /^---\nname: init-aikido\n/m);
  assert.match(copilotCommand, /prompts\/hard_points\/commands\/init-aikido\.md/);
  assert.ok(!copilotManifest.projectFiles.some((file) => file.target.startsWith('.github/prompts/')));
  const copilotSkill = readFileSync(join(copilotRoot, 'skills/structure/SKILL.md'), 'utf8');
  assert.match(copilotSkill, /^---\nname: structure\n/m);
  assert.match(copilotSkill, /^description: .+$/m);

  const damaged = join(workspace, 'damaged-package');
  cpSync(packageRoot, damaged, { recursive: true });
  const manifestPath = join(damaged, 'package-manifest.json');
  const manifest = JSON.parse(readFileSync(manifestPath, 'utf8'));
  manifest.payloadFiles[0].sha256 = '0'.repeat(64);
  writeFileSync(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`);
  assert.throws(() => validatePackage(damaged), /hash mismatch|payload is not covered/);

  const unsafe = join(workspace, 'unsafe-package');
  cpSync(packageRoot, unsafe, { recursive: true });
  const unsafeManifestPath = join(unsafe, 'package-manifest.json');
  const unsafeManifest = JSON.parse(readFileSync(unsafeManifestPath, 'utf8'));
  unsafeManifest.payloadFiles[0].target = '../outside';
  writeFileSync(unsafeManifestPath, `${JSON.stringify(unsafeManifest, null, 2)}\n`);
  assert.throws(() => validatePackage(unsafe), /unsafe payload entry/);

  const missingNotice = join(workspace, 'missing-notice-package');
  cpSync(packageRoot, missingNotice, { recursive: true });
  unlinkSync(join(missingNotice, 'payload/TRADEMARK.md'));
  assert.throws(() => validatePackage(missingNotice), /TRADEMARK|missing from package tree/);
});

test('passes the native Claude Code plugin validator in strict mode', () => {
  const result = spawnSync(
    'claude',
    ['plugin', 'validate', '--strict', '--profile', 'directory', packageRoot],
    { encoding: 'utf8' },
  );
  assert.equal(result.error, undefined, result.error?.message);
  assert.equal(result.status, 0, `${result.stdout}\n${result.stderr}`);
});

test('applies only the reviewed plan, writes lock last and is idempotent', () => {
  const root = newProject();
  try {
    const plan = planBootstrap({ ...packageOptions(root) });
    assert.equal(plan.ready, true, JSON.stringify(plan.conflicts));
    assert.equal(plan.confirmationRequired, true);
    assert.ok(plan.files.some((item) => item.target === 'prompts/hard_points/ai-kido.md'));

    assert.throws(
      () => applyBootstrap({ ...packageOptions(root), expectedPlanId: 'not-the-reviewed-plan' }),
      /Confirmation does not match/,
    );
    assert.deepEqual(readdirSync(root), []);

    const result = applyBootstrap({ ...packageOptions(root), expectedPlanId: plan.planId });
    assert.equal(result.status, 'installed');
    const lockPath = join(root, '.aikido/lock.json');
    const lock = JSON.parse(readFileSync(lockPath, 'utf8'));
    assert.deepEqual(validateLock(lock), []);
    assert.ok(lock.files.some((file) => file.path === 'prompts/hard_points/ai-kido.md'));
    assert.ok(readFileSync(join(root, '.aikido/state/baseline/prompts/hard_points/ai-kido.md')).length > 0);

    const second = applyBootstrap({ ...packageOptions(root), expectedPlanId: 'ignored-for-idempotent-install' });
    assert.equal(second.status, 'already-installed');
    assert.equal(readFileSync(lockPath, 'utf8'), `${JSON.stringify(lock, null, 2)}\n`);

    writeFileSync(join(root, '.aikido/state/baseline/prompts/hard_points/ai-kido.md'), 'damaged baseline\n');
    const damagedBaselinePlan = planBootstrap({ ...packageOptions(root) });
    assert.equal(damagedBaselinePlan.alreadyInstalled, false);
    assert.ok(damagedBaselinePlan.conflicts.some((item) => item.id === 'existing-lock'));
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test('reports a user-file collision without writing or creating a lock', () => {
  const root = newProject();
  try {
    const target = join(root, 'prompts/hard_points/ai-kido.md');
    const local = 'User-owned knowledge\n';
    mkdirSync(join(root, 'prompts/hard_points'), { recursive: true });
    writeFileSync(target, local);

    const plan = planBootstrap({ ...packageOptions(root) });
    assert.equal(plan.ready, false);
    assert.ok(plan.conflicts.some((item) => item.target === 'prompts/hard_points/ai-kido.md'));
    assert.throws(() => applyBootstrap({ ...packageOptions(root), expectedPlanId: plan.planId }), /contains conflicts/);
    assert.equal(readFileSync(target, 'utf8'), local);
    assert.throws(() => readFileSync(join(root, '.aikido/lock.json')), { code: 'ENOENT' });
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test('CLI exposes a reviewable package plan and applies only its confirmed plan id', () => {
  const root = newProject();
  try {
    const args = ['--root', root, '--mode', 'LIGHT', '--package', packageRoot];
    const planned = spawnSync(process.execPath, [cliPath, ...args], { encoding: 'utf8' });
    assert.equal(planned.status, 0, planned.stderr);
    const plan = JSON.parse(planned.stdout);
    assert.equal(plan.ready, true);
    assert.equal(typeof plan.planId, 'string');

    const applied = spawnSync(process.execPath, [
      cliPath, ...args, '--apply', '--confirm', plan.planId,
    ], { encoding: 'utf8' });
    assert.equal(applied.status, 0, applied.stderr);
    assert.equal(JSON.parse(applied.stdout).status, 'installed');
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test('installs in a nested monorepo project whose path contains spaces', () => {
  const parent = mkdtempSync(join(tmpdir(), 'aikido workspace-'));
  const root = join(parent, 'packages', 'my application');
  mkdirSync(root, { recursive: true });
  try {
    const plan = planBootstrap({ ...packageOptions(root), mode: 'LIGHT' });
    const result = applyBootstrap({ ...packageOptions(root), mode: 'LIGHT', expectedPlanId: plan.planId });
    assert.equal(result.status, 'installed');
    assert.ok(readFileSync(join(root, 'prompts/index.md'), 'utf8').length > 0);
    assert.ok(readFileSync(join(root, '.aikido/lock.json'), 'utf8').length > 0);
  } finally {
    rmSync(parent, { recursive: true, force: true });
  }
});

test('rolls back earlier writes when a later target is not writable', {
  skip: typeof process.getuid === 'function' && process.getuid() === 0,
}, () => {
  const root = newProject();
  const generatedDirectory = join(root, 'prompts/gen');
  mkdirSync(generatedDirectory, { recursive: true });
  chmodSync(generatedDirectory, 0o555);
  try {
    const plan = planBootstrap({ ...packageOptions(root), mode: 'LIGHT' });
    assert.equal(plan.ready, true, JSON.stringify(plan.conflicts));
    assert.throws(
      () => applyBootstrap({ ...packageOptions(root), mode: 'LIGHT', expectedPlanId: plan.planId }),
      /AI-KIDO file transaction failed/,
    );
    assert.deepEqual(readdirSync(join(root, 'prompts')), ['gen']);
    assert.throws(() => readFileSync(join(root, '.aikido/lock.json')), { code: 'ENOENT' });
  } finally {
    chmodSync(generatedDirectory, 0o755);
    rmSync(root, { recursive: true, force: true });
  }
});
