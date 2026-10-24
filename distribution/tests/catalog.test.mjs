import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, readFileSync, readdirSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { buildDistribution, validateCatalog } from '../scripts/build.mjs';

const catalog = JSON.parse(readFileSync(new URL('../../distribution/catalog.json', import.meta.url), 'utf8'));

test('catalog lists every canonical command, system skill and agent', () => {
  assert.deepEqual(validateCatalog(catalog), []);
  const commandFiles = readdirSync(new URL('../../prompts/hard_points/commands/', import.meta.url))
    .filter((file) => file.endsWith('.md')).map((file) => `prompts/hard_points/commands/${file}`);
  commandFiles.push('prompts/hard_points/system/web/commands/download-site.md');
  assert.deepEqual(catalog.commands.map((command) => command.source).sort(), commandFiles.sort());
  const skillDirs = readdirSync(new URL('../../prompts/hard_points/system/', import.meta.url), { withFileTypes: true })
    .filter((entry) => entry.isDirectory() && readdirSync(new URL(`../../prompts/hard_points/system/${entry.name}/`, import.meta.url)).includes('SKILL.md'))
    .map((entry) => `prompts/hard_points/system/${entry.name}`);
  assert.deepEqual(catalog.systemSkills.map((skill) => skill.source).sort(), skillDirs.sort());
  const agentFiles = readdirSync(new URL('../../prompts/hard_points/agents/', import.meta.url))
    .filter((file) => file.startsWith('agent-aikido-') && file.endsWith('.md'))
    .map((file) => `prompts/hard_points/agents/${file}`);
  assert.deepEqual(catalog.agents.map((agent) => agent.source).sort(), agentFiles.sort());
});

test('a command has exactly one delivery per host and unverified targets stay disabled', () => {
  const nativeAndFallback = ['native-command', 'native-prompt', 'native-plugin-prompt', 'native-skill-command', 'fallback-skill'];
  for (const [hostId, host] of Object.entries(catalog.hosts)) {
    if (!host.enabled) {
      assert.ok(['unverified'].includes(host.commandDelivery), hostId);
      continue;
    }
    assert.ok(nativeAndFallback.includes(host.commandDelivery), hostId);
    if (host.commandDelivery === 'native-command' || host.commandDelivery === 'native-prompt'
      || host.commandDelivery === 'native-plugin-prompt' || host.commandDelivery === 'native-skill-command') {
      assert.notEqual(host.commandDelivery, 'fallback-skill');
    }
  }
  const invalid = structuredClone(catalog);
  invalid.hosts['copilot-cowork'].enabled = true;
  assert.ok(validateCatalog(invalid).some((error) => error.includes('unverified delivery cannot be enabled')));
});

test('build is deterministic and reports missing wrappers without inventing agents', () => {
  const a = mkdtempSync(join(tmpdir(), 'aikido-build-a-'));
  const b = mkdtempSync(join(tmpdir(), 'aikido-build-b-'));
  try {
    const reportA = buildDistribution({ outDir: join(a, 'dist'), catalog, sourceRevision: 'a'.repeat(40) });
    const reportB = buildDistribution({ outDir: join(b, 'dist'), catalog, sourceRevision: 'a'.repeat(40) });
    const files = (root) => {
      const found = [];
      const visit = (dir, prefix = '') => {
        for (const name of readdirSync(join(root, prefix), { withFileTypes: true })) {
          const child = [prefix, name.name].filter(Boolean).join('/');
          if (name.isDirectory()) visit(root, child);
          else found.push(child);
        }
      };
      visit(root);
      return found.sort();
    };
    const left = files(join(a, 'dist'));
    const right = files(join(b, 'dist'));
    assert.deepEqual(left, right);
    for (const file of left) {
      assert.deepEqual(readFileSync(join(a, 'dist', file)), readFileSync(join(b, 'dist', file)), file);
    }
    assert.equal(reportA.hosts.find((host) => host.host === 'codex').commandDelivery, 'fallback-skill');
    assert.equal(reportA.hosts.find((host) => host.host === 'claude-code').missingAgentWrappers.length, 2);
    assert.deepEqual(
      reportA.hosts.find((host) => host.host === 'claude-code').orphanAgentWrappers,
      [{ host: 'claude-code', wrapper: 'agent-aikido-indexer.md' }],
    );
    assert.equal(reportA.hosts.find((host) => host.host === 'copilot-vscode').missingAgentWrappers.length, 14);
    assert.deepEqual(reportA, reportB);
    assert.equal(reportA.hosts.find((host) => host.host === 'copilot-github').generated, false);
  } finally {
    rmSync(a, { recursive: true, force: true });
    rmSync(b, { recursive: true, force: true });
  }
});

test('generated command files follow exactly one declared route per enabled host', () => {
  const root = mkdtempSync(join(tmpdir(), 'aikido-build-routes-'));
  try {
    buildDistribution({ outDir: join(root, 'dist'), catalog, sourceRevision: 'a'.repeat(40) });
    for (const [hostId, host] of Object.entries(catalog.hosts)) {
      if (!host.enabled) continue;
      const manifestPath = join(root, 'dist', hostId, 'package-manifest.json');
      const packageManifest = JSON.parse(readFileSync(manifestPath, 'utf8'));
      const commandPaths = packageManifest.files.map((entry) => entry.path).filter((path) => {
        if (host.commandDelivery === 'native-command' || host.commandDelivery === 'native-prompt'
          || host.commandDelivery === 'native-plugin-prompt') {
          return path.startsWith(`${host.commandTarget}/`) && catalog.commands.some((command) => (
            path === `${host.commandTarget}/${command.name}${host.commandSuffix}`
          ));
        }
        return catalog.commands.some((command) => (
          path === `${host.commandTarget}/${command.name}/SKILL.md`
        ));
      });
      assert.equal(commandPaths.length, catalog.commands.length, `${hostId} should emit one route per command`);
      assert.equal(new Set(commandPaths).size, commandPaths.length, `${hostId} duplicate command route`);
      assert.equal(packageManifest.commandDelivery, host.commandDelivery);
    }
    const codex = JSON.parse(readFileSync(join(root, 'dist/codex/package-manifest.json'), 'utf8'));
    assert.ok(codex.files.some((entry) => entry.path === '.agents/skills/init-aikido/SKILL.md'));
    assert.ok(!codex.files.some((entry) => entry.path === 'commands/init-aikido.md'));
    const copilot = JSON.parse(readFileSync(join(root, 'dist/copilot-vscode/package-manifest.json'), 'utf8'));
    assert.equal(copilot.commandDelivery, 'native-plugin-prompt');
    assert.ok(copilot.files.some((entry) => entry.path === 'plugin.json'));
    assert.ok(copilot.files.some((entry) => entry.path === 'com.github.copilot/commands/init-aikido.prompt.md'));
    assert.ok(copilot.files.some((entry) => entry.path === 'skills/orchestrator/SKILL.md'));
    assert.ok(!copilot.files.some((entry) => entry.path === '.github/prompts/init-aikido.prompt.md'));
    assert.ok(!copilot.projectFiles.some((entry) => entry.target.includes('/commands/')));
    assert.ok(!copilot.projectFiles.some((entry) => entry.target === '.github/prompts/init-aikido.prompt.md'));
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test('build refuses to overwrite an existing non-empty output directory', () => {
  const root = mkdtempSync(join(tmpdir(), 'aikido-build-existing-'));
  try {
    writeFileSync(join(root, 'keep.txt'), 'user file\n');
    assert.throws(() => buildDistribution({ outDir: root, catalog }), /must be empty/);
    assert.throws(() => buildDistribution({ outDir: join(root, 'new'), catalog, sourceRevision: 'bad-sha' }), /full lowercase 40-character/);
    assert.equal(readFileSync(join(root, 'keep.txt'), 'utf8'), 'user file\n');
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});
