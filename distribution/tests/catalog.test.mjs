import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, readFileSync, readdirSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { agentProfile, buildDistribution, validateCatalog } from '../scripts/build.mjs';
import { validatePackage } from '../lib/package.mjs';

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

test('build is deterministic', () => {
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
    assert.deepEqual(reportA, reportB);
    assert.equal(reportA.hosts.find((host) => host.host === 'copilot-github').generated, true);
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
    const github = JSON.parse(readFileSync(join(root, 'dist/copilot-github/package-manifest.json'), 'utf8'));
    const githubTargets = new Set(github.projectFiles.map((entry) => entry.target));
    assert.equal(github.commandDelivery, 'fallback-skill');
    assert.ok(githubTargets.has('.github/skills/init-aikido/SKILL.md'));
    assert.ok(githubTargets.has('.github/skills/orchestrator/SKILL.md'));
    assert.ok(githubTargets.has('.github/agents/agent-aikido-orchestrator.agent.md'));
    assert.ok(![...githubTargets].some((target) => target.startsWith('.github/prompts/')));
    const githubSkill = readFileSync(join(root, 'dist/copilot-github/.github/skills/orchestrator/SKILL.md'), 'utf8');
    assert.match(githubSkill, /^---\nname: orchestrator\ndescription: "/);
    assert.ok(githubSkill.includes('](../../../prompts/hard_points/agents/agent-aikido-orchestrator.md)'));
    assert.ok(githubSkill.includes('](../../../skills_list.md)'));
    assert.ok(!githubSkill.includes('](../../agents/'));
    assert.equal(validatePackage(join(root, 'dist/copilot-github'), { catalog }).valid, true);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test('every enabled host package generates a native wrapper for every agent', () => {
  const root = mkdtempSync(join(tmpdir(), 'aikido-build-agents-'));
  try {
    const report = buildDistribution({ outDir: join(root, 'dist'), catalog, sourceRevision: 'a'.repeat(40) });
    const suffixes = { codex: '.toml', copilot: '.agent.md' };
    for (const [hostId, host] of Object.entries(catalog.hosts)) {
      if (!host.enabled) continue;
      assert.equal(report.hosts.find((entry) => entry.host === hostId).agentCount, catalog.agents.length);
      const packageRoot = join(root, 'dist', hostId);
      assert.equal(validatePackage(packageRoot, { catalog }).valid, true, hostId);
      const manifest = JSON.parse(readFileSync(join(packageRoot, 'package-manifest.json'), 'utf8'));
      if (host.agentFormat === 'roomodes') {
        const modes = readFileSync(join(packageRoot, '.roomodes'), 'utf8');
        assert.equal(modes.match(/^  - slug: /gm).length, catalog.agents.length);
        assert.ok(manifest.projectFiles.some((entry) => entry.target === '.roomodes'));
        continue;
      }
      for (const agent of catalog.agents) {
        const path = `${host.agentTarget}/${agent.name}${suffixes[host.agentFormat] ?? '.md'}`;
        const text = readFileSync(join(packageRoot, path), 'utf8');
        assert.ok(text.includes(`\`${agent.source}\``), `${hostId}: ${path}`);
        assert.equal(manifest.projectFiles.some((entry) => entry.target === path), host.projectAgentFiles, path);
      }
    }
    const dist = (path) => readFileSync(join(root, 'dist', path), 'utf8');
    assert.match(dist('claude-code/agents/agent-aikido-validator.md'), /^---\nname: agent-aikido-validator\ndescription: ".+"\ntools: Read, Grep, Glob\nmodel: inherit\n---/);
    assert.ok(dist('claude-cowork/agents/agent-aikido-fusion.md').includes('${CLAUDE_PLUGIN_ROOT}/payload/'));
    assert.ok(!/^tools:/m.test(dist('claude-code/agents/agent-aikido-orchestrator.md')));
    assert.match(dist('copilot-github/.github/agents/agent-aikido-orchestrator.agent.md'), /disable-model-invocation: true/);
    assert.match(dist('copilot-vscode/com.github.copilot/agents/agent-aikido-truth-evaluator.agent.md'), /^tools: \["read","search"\]$/m);
    assert.match(dist('codex/.codex/agents/agent-aikido-validator.toml'), /^name = "agent-aikido-validator"\ndescription = ".+"\ndeveloper_instructions = ".+Do not edit files\.\\n"\n$/);
    assert.match(dist('kiro-cli/.kiro/agents/agent-aikido-bank-populate.md'), /tools:\n  - "read"\n  - "write"\n  - "shell"\nresources:/);
    assert.match(dist('antigravity/.agents/agents/agent-aikido-explore-all.md'), /tools:\n  - view_file\n  - grep_search\n  - invoke_subagent\nmainAgent: true\nsubagent: true\ncommandExecutionPolicy: sandbox\n---/);
    assert.match(dist('antigravity/.agents/agents/agent-aikido-orchestrator.md'), /mainAgent: true\nsubagent: false\ncommandExecutionPolicy: sandbox/);
    assert.match(dist('zoo-code/.roo/commands/init-aikido.md'), /^---\ndescription: ".+"\n---\n\n# \/init-aikido\n/);
    assert.match(dist('roo-code-legacy/.roo/commands/init-aikido.md'), /^---\ndescription: ".+"\n---\n\n# \/init-aikido\n/);
    assert.match(dist('zoo-code/README.md'), /maintained Zoo Code project/);
    assert.match(dist('roo-code-legacy/README.md'), /best-effort target/);
    assert.deepEqual(agentProfile(catalog.agents.find((agent) => agent.name === 'agent-aikido-helper')).capabilities, ['read']);
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
