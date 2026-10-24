import { after, before, test } from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import {
  mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { spawnSync } from 'node:child_process';
import { buildDistribution } from '../scripts/build.mjs';
import { applyBootstrap, planBootstrap } from '../lib/bootstrap-plan.mjs';
import {
  applyUpdate, planMigration, planUninstall, planUpdate, restoreUpdateBackup,
} from '../lib/update-plan.mjs';

let workspace;
let basePackage;
let nextPackage;
let adapterBasePackage;
let adapterNextPackage;
let blockUpdatePackage;
let updateCli;

before(() => {
  workspace = mkdtempSync(join(tmpdir(), 'aikido-update-tests-'));
  const baseOutput = buildPackages('1.5.0-dev', 'base');
  const nextOutput = buildPackages('1.5.1-dev', 'next');
  const blockOutput = buildPackages('1.5.3-dev', 'block-update');
  basePackage = join(baseOutput, 'claude-code');
  updateCli = join(basePackage, 'scripts/update-plan.mjs');
  nextPackage = join(nextOutput, 'claude-code');
  adapterBasePackage = join(baseOutput, 'kiro-cli');
  adapterNextPackage = join(nextOutput, 'kiro-cli');
  blockUpdatePackage = join(blockOutput, 'claude-code');
  mutatePayload(nextPackage, 'prompts/hard_points/ai-kido.md', (text) => `${text}\nUpstream update.\n`);
  mutatePackagedFile(
    blockUpdatePackage,
    'templates/instructions/agents-block.md',
    (text) => `${text}\n### Updated managed instructions\n`,
  );
});

after(() => {
  if (workspace) rmSync(workspace, { recursive: true, force: true });
});

function buildPackages(version, name) {
  const out = join(workspace, name);
  buildDistribution({ outDir: out, sourceRevision: 'uncommitted', version });
  return out;
}

function mutatePayload(packageRoot, target, change) {
  const manifestPath = join(packageRoot, 'package-manifest.json');
  const manifest = JSON.parse(readFileSync(manifestPath, 'utf8'));
  const entry = manifest.payloadFiles.find((item) => item.target === target);
  assert.ok(entry, `missing package payload ${target}`);
  mutatePackagedFile(packageRoot, entry.packagePath, change);
}

function mutatePackagedFile(packageRoot, packagePath, change) {
  const manifestPath = join(packageRoot, 'package-manifest.json');
  const manifest = JSON.parse(readFileSync(manifestPath, 'utf8'));
  const contentsPath = join(packageRoot, packagePath);
  const contents = Buffer.from(change(readFileSync(contentsPath, 'utf8')));
  writeFileSync(contentsPath, contents);
  const hash = createHash('sha256').update(contents).digest('hex');
  manifest.files.find((item) => item.path === packagePath).sha256 = hash;
  const payload = manifest.payloadFiles.find((item) => item.packagePath === packagePath);
  if (payload) payload.sha256 = hash;
  writeFileSync(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`);
}

function removeProjectFile(packageRoot, target) {
  const manifestPath = join(packageRoot, 'package-manifest.json');
  const manifest = JSON.parse(readFileSync(manifestPath, 'utf8'));
  const index = manifest.projectFiles.findIndex((item) => item.target === target);
  assert.notEqual(index, -1, `missing package project file ${target}`);
  manifest.projectFiles.splice(index, 1);
  writeFileSync(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`);
}

function newProject() {
  return mkdtempSync(join(tmpdir(), 'aikido-update-project-'));
}

test('three-way update applies upstream changes and restores from its verified backup', () => {
  const root = newProject();
  try {
    const lockPath = join(root, '.aikido/lock.json');
    const oldContent = readFileSync(join(basePackage, 'payload/prompts/hard_points/ai-kido.md'));
    const newContent = readFileSync(join(nextPackage, 'payload/prompts/hard_points/ai-kido.md'));
    const installOptions = {
      root,
      packageRoot: basePackage,
      mode: 'STANDARD',
      projectName: 'Update test project',
    };
    const bootstrapPlan = planBootstrap(installOptions);
    applyBootstrap({ ...installOptions, expectedPlanId: bootstrapPlan.planId });
    const oldLock = readFileSync(lockPath);

    const plan = planUpdate({ root, packageRoot: nextPackage });
    assert.equal(plan.ready, true, JSON.stringify(plan.conflicts));
    assert.ok(plan.files.some((item) => item.target === 'prompts/hard_points/ai-kido.md' && item.action === 'update'));
    const result = applyUpdate({ root, packageRoot: nextPackage, expectedPlanId: plan.planId });
    assert.equal(result.status, 'updated');
    assert.equal(readFileSync(join(root, 'prompts/hard_points/ai-kido.md')).equals(newContent), true);
    assert.equal(readFileSync(join(root, '.aikido/state/baseline/prompts/hard_points/ai-kido.md')).equals(newContent), true);
    assert.equal(JSON.parse(readFileSync(lockPath, 'utf8')).aikido.version, '1.5.1-dev');

    const restored = restoreUpdateBackup({ root, backupPath: result.backup });
    assert.equal(restored.status, 'restored');
    assert.equal(readFileSync(lockPath).equals(oldLock), true);
    assert.equal(readFileSync(join(root, 'prompts/hard_points/ai-kido.md')).equals(oldContent), true);
    assert.equal(
      readFileSync(join(root, '.aikido/state/baseline/prompts/hard_points/ai-kido.md')).equals(oldContent),
      true,
    );
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test('conflicting local and upstream edits block the whole update without changing the lock', () => {
  const root = newProject();
  try {
    const lockPath = join(root, '.aikido/lock.json');
    const installOptions = {
      root,
      packageRoot: basePackage,
      mode: 'STANDARD',
      projectName: 'Update test project',
    };
    const bootstrapPlan = planBootstrap(installOptions);
    applyBootstrap({ ...installOptions, expectedPlanId: bootstrapPlan.planId });
    const local = Buffer.from('Local edit that differs from upstream.\n');
    const target = join(root, 'prompts/hard_points/ai-kido.md');
    writeFileSync(target, local);
    const oldLock = readFileSync(lockPath);

    const plan = planUpdate({ root, packageRoot: nextPackage });
    assert.equal(plan.ready, false);
    assert.ok(plan.conflicts.some((item) => item.target === 'prompts/hard_points/ai-kido.md'));
    assert.throws(
      () => applyUpdate({ root, packageRoot: nextPackage, expectedPlanId: plan.planId }),
      /Update plan contains conflicts/,
    );
    assert.equal(readFileSync(target).equals(local), true);
    assert.equal(readFileSync(lockPath).equals(oldLock), true);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test('an unchanged upstream file preserves a local edit while advancing the lock version', () => {
  const root = newProject();
  try {
    const installOptions = {
      root,
      packageRoot: basePackage,
      mode: 'STANDARD',
      projectName: 'Update test project',
    };
    const bootstrapPlan = planBootstrap(installOptions);
    applyBootstrap({ ...installOptions, expectedPlanId: bootstrapPlan.planId });
    const local = Buffer.from('Keep this user-authored edit.\n');
    writeFileSync(join(root, 'prompts/hard_points/ai-kido.md'), local);

    const sameContentOutput = buildPackages('1.5.2-dev', 'same-content');
    const sameContentPackage = join(sameContentOutput, 'claude-code');
    const plan = planUpdate({ root, packageRoot: sameContentPackage });
    assert.equal(plan.ready, true, JSON.stringify(plan.conflicts));
    assert.ok(plan.files.some((item) => item.target === 'prompts/hard_points/ai-kido.md' && item.action === 'keep-local'));
    applyUpdate({ root, packageRoot: sameContentPackage, expectedPlanId: plan.planId });
    assert.equal(readFileSync(join(root, 'prompts/hard_points/ai-kido.md')).equals(local), true);
    assert.equal(JSON.parse(readFileSync(join(root, '.aikido/lock.json'), 'utf8')).aikido.version, '1.5.2-dev');
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test('an upstream-removed adapter file is deleted only while it still matches the installed baseline', () => {
  const root = newProject();
  try {
    const removed = JSON.parse(readFileSync(join(adapterBasePackage, 'package-manifest.json'), 'utf8'))
      .projectFiles[0];
    assert.ok(removed, 'Kiro package must include project adapter files');
    removeProjectFile(adapterNextPackage, removed.target);
    const installOptions = {
      root,
      packageRoot: adapterBasePackage,
      mode: 'STANDARD',
      projectName: 'Update test project',
    };
    const bootstrapPlan = planBootstrap(installOptions);
    applyBootstrap({ ...installOptions, expectedPlanId: bootstrapPlan.planId });
    assert.ok(readFileSync(join(root, removed.target)));

    const plan = planUpdate({ root, packageRoot: adapterNextPackage });
    assert.equal(plan.ready, true, JSON.stringify(plan.conflicts));
    assert.ok(plan.files.some((item) => item.target === removed.target && item.action === 'delete'));
    applyUpdate({ root, packageRoot: adapterNextPackage, expectedPlanId: plan.planId });
    assert.throws(() => readFileSync(join(root, removed.target)), { code: 'ENOENT' });
  } finally {
    rmSync(root, { recursive: true, force: true });
    const manifestPath = join(adapterNextPackage, 'package-manifest.json');
    const modified = JSON.parse(readFileSync(manifestPath, 'utf8'));
    const original = JSON.parse(readFileSync(join(adapterBasePackage, 'package-manifest.json'), 'utf8'));
    modified.projectFiles = original.projectFiles;
    writeFileSync(manifestPath, `${JSON.stringify(modified, null, 2)}\n`);
  }
});

test('an upstream-removed adapter preserves locally modified content as an orphan', () => {
  const root = newProject();
  try {
    const removed = JSON.parse(readFileSync(join(adapterBasePackage, 'package-manifest.json'), 'utf8'))
      .projectFiles[0];
    removeProjectFile(adapterNextPackage, removed.target);
    const installOptions = {
      root,
      packageRoot: adapterBasePackage,
      mode: 'STANDARD',
      projectName: 'Update test project',
    };
    const bootstrapPlan = planBootstrap(installOptions);
    applyBootstrap({ ...installOptions, expectedPlanId: bootstrapPlan.planId });
    const local = Buffer.from('Preserve this customized adapter.\n');
    writeFileSync(join(root, removed.target), local);

    const plan = planUpdate({ root, packageRoot: adapterNextPackage });
    assert.equal(plan.ready, true, JSON.stringify(plan.conflicts));
    assert.ok(plan.files.some((item) => item.target === removed.target && item.action === 'keep-modified-orphan'));
    applyUpdate({ root, packageRoot: adapterNextPackage, expectedPlanId: plan.planId });
    assert.equal(readFileSync(join(root, removed.target)).equals(local), true);
    assert.equal(
      JSON.parse(readFileSync(join(root, '.aikido/lock.json'), 'utf8')).files.some((item) => item.path === removed.target),
      false,
    );
  } finally {
    rmSync(root, { recursive: true, force: true });
    const manifestPath = join(adapterNextPackage, 'package-manifest.json');
    const modified = JSON.parse(readFileSync(manifestPath, 'utf8'));
    const original = JSON.parse(readFileSync(join(adapterBasePackage, 'package-manifest.json'), 'utf8'));
    modified.projectFiles = original.projectFiles;
    writeFileSync(manifestPath, `${JSON.stringify(modified, null, 2)}\n`);
  }
});

test('local edits inside a managed block conflict instead of being overwritten', () => {
  const root = newProject();
  try {
    const installOptions = {
      root,
      packageRoot: basePackage,
      mode: 'STANDARD',
      projectName: 'Update test project',
    };
    const bootstrapPlan = planBootstrap(installOptions);
    applyBootstrap({ ...installOptions, expectedPlanId: bootstrapPlan.planId });
    const path = join(root, 'AGENTS.md');
    const marker = '<!-- aikido:end id=core -->';
    const customized = readFileSync(path, 'utf8').replace(marker, 'Local customization.\n' + marker);
    writeFileSync(path, customized);

    const plan = planUpdate({ root, packageRoot: blockUpdatePackage });
    assert.equal(plan.ready, false);
    assert.ok(plan.conflicts.some((item) => item.target === 'AGENTS.md' && item.kind === 'managed-block'));
    assert.equal(readFileSync(path, 'utf8'), customized);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test('update CLI previews, applies the reviewed plan and restores its backup', () => {
  const root = newProject();
  try {
    const installOptions = {
      root,
      packageRoot: basePackage,
      mode: 'STANDARD',
      projectName: 'Update test project',
    };
    const bootstrapPlan = planBootstrap(installOptions);
    applyBootstrap({ ...installOptions, expectedPlanId: bootstrapPlan.planId });

    const args = ['--root', root, '--package', nextPackage];
    const preview = spawnSync(process.execPath, [updateCli, ...args], { encoding: 'utf8' });
    assert.equal(preview.status, 0, preview.stderr);
    const plan = JSON.parse(preview.stdout);
    assert.equal(plan.ready, true);

    const applied = spawnSync(process.execPath, [
      updateCli, ...args, '--apply', '--confirm', plan.planId,
    ], { encoding: 'utf8' });
    assert.equal(applied.status, 0, applied.stderr);
    const result = JSON.parse(applied.stdout);
    assert.equal(result.status, 'updated');

    const recovered = spawnSync(process.execPath, [
      updateCli, '--root', root, '--recover', result.backup,
    ], { encoding: 'utf8' });
    assert.equal(recovered.status, 0, recovered.stderr);
    assert.equal(JSON.parse(recovered.stdout).status, 'restored');
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test('legacy migration records a source baseline without rewriting project-owned files', () => {
  const root = newProject();
  try {
    const hardPoints = join(root, 'prompts/hard_points');
    mkdirSync(hardPoints, { recursive: true });
    const canonical = readFileSync(join(basePackage, 'payload/prompts/hard_points/ai-kido.md'));
    const customized = Buffer.concat([canonical, Buffer.from('\nLegacy local customization.\n')]);
    writeFileSync(join(hardPoints, 'ai-kido.md'), customized);
    writeFileSync(
      join(hardPoints, 'ai-kido-light.md'),
      readFileSync(join(basePackage, 'payload/prompts/hard_points/ai-kido-light.md')),
    );
    mkdirSync(join(root, 'prompts/gen'), { recursive: true });
    mkdirSync(join(root, 'prompts/spec'), { recursive: true });
    writeFileSync(join(root, 'prompts/index.md'), 'User-owned index.\n');
    writeFileSync(join(root, 'prompts/gen/custom.md'), 'User-generated content.\n');
    writeFileSync(join(root, 'prompts/spec/custom.md'), 'User specifications.\n');
    writeFileSync(join(root, 'AGENTS.md'), 'User instructions without a managed block.\n');

    const before = {
      index: readFileSync(join(root, 'prompts/index.md')),
      gen: readFileSync(join(root, 'prompts/gen/custom.md')),
      spec: readFileSync(join(root, 'prompts/spec/custom.md')),
      agents: readFileSync(join(root, 'AGENTS.md')),
    };
    const plan = planMigration({ root, packageRoot: basePackage });
    assert.equal(plan.ready, true, JSON.stringify(plan.conflicts));
    assert.ok(plan.files.some((item) => item.target === 'prompts/hard_points/ai-kido.md' && item.action === 'keep-local'));
    assert.equal(plan.files.some((item) => item.target === 'prompts/index.md'), false);
    const preview = spawnSync(process.execPath, [
      updateCli, '--root', root, '--package', basePackage, '--migrate',
    ], { encoding: 'utf8' });
    assert.equal(preview.status, 0, preview.stderr);
    const cliPlan = JSON.parse(preview.stdout);
    const applied = spawnSync(process.execPath, [
      updateCli, '--root', root, '--package', basePackage, '--migrate', '--apply', '--confirm', cliPlan.planId,
    ], { encoding: 'utf8' });
    assert.equal(applied.status, 0, applied.stderr);
    const result = JSON.parse(applied.stdout);
    assert.equal(result.status, 'migrated');

    const lock = JSON.parse(readFileSync(join(root, '.aikido/lock.json'), 'utf8'));
    assert.equal(lock.mode, 'UNSET');
    assert.ok(lock.files.some((item) => item.path === 'prompts/hard_points/ai-kido.md'));
    assert.equal(readFileSync(join(root, 'prompts/hard_points/ai-kido.md')).equals(customized), true);
    assert.equal(readFileSync(join(root, 'prompts/index.md')).equals(before.index), true);
    assert.equal(readFileSync(join(root, 'prompts/gen/custom.md')).equals(before.gen), true);
    assert.equal(readFileSync(join(root, 'prompts/spec/custom.md')).equals(before.spec), true);
    assert.equal(readFileSync(join(root, 'AGENTS.md')).equals(before.agents), true);
    assert.equal(
      readFileSync(join(root, '.aikido/state/baseline/prompts/hard_points/ai-kido.md')).equals(canonical),
      true,
    );

    const restored = restoreUpdateBackup({ root, backupPath: result.backup });
    assert.equal(restored.status, 'restored');
    assert.throws(() => readFileSync(join(root, '.aikido/lock.json')), { code: 'ENOENT' });
    assert.equal(readFileSync(join(root, 'prompts/hard_points/ai-kido.md')).equals(customized), true);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test('adapter uninstall preserves modified wrappers and method knowledge, with recoverable changes', () => {
  const root = newProject();
  try {
    const manifest = JSON.parse(readFileSync(join(adapterBasePackage, 'package-manifest.json'), 'utf8'));
    const wrappers = manifest.projectFiles.filter((item) => item.target.startsWith('.kiro/skills/'));
    assert.ok(wrappers.length >= 2, 'Kiro package must include multiple project command files');
    const installOptions = {
      root,
      packageRoot: adapterBasePackage,
      mode: 'STANDARD',
      projectName: 'Update test project',
    };
    const bootstrapPlan = planBootstrap(installOptions);
    applyBootstrap({ ...installOptions, expectedPlanId: bootstrapPlan.planId });
    const knowledgePath = join(root, 'prompts/hard_points/ai-kido.md');
    const knowledge = readFileSync(knowledgePath);
    const customized = Buffer.from('Customized host command.\n');
    writeFileSync(join(root, wrappers[0].target), customized);

    const plan = planUninstall({ root });
    assert.equal(plan.ready, true, JSON.stringify(plan.conflicts));
    assert.ok(plan.files.some((item) => item.target === wrappers[0].target && item.action === 'keep-modified'));
    assert.ok(plan.files.some((item) => item.target === wrappers[1].target && item.action === 'remove'));
    const preview = spawnSync(process.execPath, [updateCli, '--root', root, '--uninstall'], { encoding: 'utf8' });
    assert.equal(preview.status, 0, preview.stderr);
    const cliPlan = JSON.parse(preview.stdout);
    const applied = spawnSync(process.execPath, [
      updateCli, '--root', root, '--uninstall', '--apply', '--confirm', cliPlan.planId,
    ], { encoding: 'utf8' });
    assert.equal(applied.status, 0, applied.stderr);
    const result = JSON.parse(applied.stdout);
    assert.equal(result.status, 'uninstalled');
    assert.equal(readFileSync(join(root, wrappers[0].target)).equals(customized), true);
    assert.throws(() => readFileSync(join(root, wrappers[1].target)), { code: 'ENOENT' });
    assert.equal(readFileSync(knowledgePath).equals(knowledge), true);
    assert.doesNotMatch(readFileSync(join(root, 'AGENTS.md'), 'utf8'), /aikido:begin id=core/);

    restoreUpdateBackup({ root, backupPath: result.backup });
    assert.ok(readFileSync(join(root, wrappers[1].target)));
    assert.match(readFileSync(join(root, 'AGENTS.md'), 'utf8'), /aikido:begin id=core/);
    assert.equal(readFileSync(knowledgePath).equals(knowledge), true);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});
