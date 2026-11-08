import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdirSync, mkdtempSync, readFileSync, readdirSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { spawnSync } from 'node:child_process';
import { agentProfile, buildDistribution, validateCatalog } from '../scripts/build.mjs';
import { validatePackage } from '../lib/package.mjs';
import { readEntries } from '../../prompts/hard_points/system/structure/scripts/generate-index-by-path.mjs';

const catalog = JSON.parse(readFileSync(new URL('../../distribution/catalog.json', import.meta.url), 'utf8'));

test('packaged Node cleanup rebuilds a project with its distributed dependencies', () => {
  const root = mkdtempSync(join(tmpdir(), 'aikido-packaged-clean-'));
  try {
    buildDistribution({ outDir: join(root, 'dist'), catalog, sourceRevision: 'a'.repeat(40) });
    const scripts = join(root, 'dist/copilot-vscode/payload/prompts/hard_points/system/structure/scripts');
    const project = join(root, 'project');
    mkdirSync(join(project, 'prompts/hard_points/system/structure'), { recursive: true });
    writeFileSync(join(project, 'old.txt'), 'old\n');
    const generate = spawnSync(process.execPath, [join(scripts, 'generate-all-indexes-v3.1.mjs')], {
      cwd: project, env: { ...process.env, PROJECT_ROOT: project }, encoding: 'utf8',
    });
    assert.equal(generate.status, 0, generate.stderr);
    rmSync(join(project, 'old.txt'));
    writeFileSync(join(project, 'new.txt'), 'new\n');
    const cleanup = spawnSync(process.execPath, [join(scripts, 'clean-orphans.mjs'), '--rebuild'], {
      cwd: project, encoding: 'utf8',
    });
    assert.equal(cleanup.status, 0, cleanup.stderr);
    assert.match(cleanup.stdout, /Full index rebuild complete/);
    const paths = readEntries(project).entries.map(([path]) => path);
    assert.ok(paths.includes('new.txt'));
    assert.ok(!paths.includes('old.txt'));
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

// Build from tracked payload files and catalog command sources. Never modify
// the caller's index or override GIT_INDEX_FILE here.

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
      assert.doesNotMatch(file, /\.(sh|bash|zsh|py|pl|rb|ps1|cmd|bat)$/, file);
      if (file.endsWith('.md')) {
        assert.doesNotMatch(readFileSync(join(a, 'dist', file), 'utf8'),
          /^```(?:bash|sh|shell|zsh|powershell|pwsh|cmd|bat)\s*$/m, file);
      }
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
      assert.match(readFileSync(join(packageRoot, 'RUNTIME.md'), 'utf8'), /stable Node\.js 24\+/);
      const workspace = join(root, `workspace-${hostId}`);
      mkdirSync(workspace);
      const env = { ...process.env };
      delete env.AIKIDO_HOST;
      delete env.AIKIDO_TOOLS;
      const checked = spawnSync(process.execPath, [
        join(packageRoot, 'scripts/check-cli.mjs'), '--root', workspace,
        '--host', hostId, '--check', '--dry-run',
      ], { encoding: 'utf8', env });
      assert.equal(checked.status, 0, `${hostId}: ${checked.stdout}\n${checked.stderr}`);
      const runtime = JSON.parse(checked.stdout).nodeRuntime;
      assert.equal(runtime.version, process.versions.node, hostId);
      assert.equal(runtime.executable, process.execPath, hostId);
      assert.equal(runtime.baseline, '24.0.0', hostId);
      const manifest = JSON.parse(readFileSync(join(packageRoot, 'package-manifest.json'), 'utf8'));
      assert.ok(manifest.payloadFiles.some(({ target }) => (
        target === 'prompts/hard_points/system/maj/scripts/ending-1-compare-structures.mjs'
      )), `${hostId}: Node comparison script must be included in the payload`);
      for (const name of [
        'ending-1-report-state.mjs', 'ending-1-workflow.mjs', 'ending-1-content.mjs', 'ending-2-report.mjs',
        'beginning-generate-structure.mjs',
        'ending-0-core.mjs', 'ending-0-fusion.mjs', 'ending-0-check-json-files.mjs',
        'ending-0-generate-diff-report.mjs',
        'ending-0-process-fusion.mjs',
        'ending-10-diagnostics.mjs',
        'detect-project-type.mjs', 'detect-version.mjs', 'beginning-detect-versions.mjs',
        'create-backup.mjs', 'create-log.mjs',
        'beginning-check-backup.mjs',
        'validate-structure.mjs',
        'ending-4-diagnostic-structure.mjs',
        'ending-4-run-validation.mjs',
        'ending-0-ask-llm-capability.mjs',
        'ending-5-review.mjs',
        'ending-6-validation.mjs', 'ending-7-gaps.mjs',
        'maj-node-migration.mjs',
      ]) {
        const target = `prompts/hard_points/system/maj/scripts/${name}`;
        assert.ok(manifest.payloadFiles.some((entry) => entry.target === target), `${hostId}: ${name}`);
        assert.equal(readFileSync(join(packageRoot, 'payload', target), 'utf8'),
          readFileSync(new URL(`../../${target}`, import.meta.url), 'utf8'), `${hostId}: ${name} payload bytes`);
      }
      for (const target of [
        'prompts/hard_points/system/orchestrator/swarm.md',
        'prompts/hard_points/system/orchestrator/ai-hub.md',
        'prompts/hard_points/system/orchestrator/ai-hub.schema.json',
        'prompts/hard_points/system/orchestrator/exchange.mjs',
        'prompts/hard_points/system/orchestrator/hub-profile.mjs',
        'prompts/hard_points/system/host-actions.mjs',
        'prompts/hard_points/system/search/scope-first.md',
        'prompts/hard_points/system/search/config-query.mjs',
        'prompts/hard_points/system/search/search-engine.mjs',
        'prompts/hard_points/system/plan-validation/validate.mjs',
        'prompts/hard_points/system/structure/scripts/clean-orphans.mjs',
        'prompts/hard_points/system/structure/scripts/git-ignore.mjs',
        'prompts/hard_points/system/structure/scripts/generate-project-tree.mjs',
        'prompts/hard_points/system/structure/scripts/format-file-metadata.mjs',
        'prompts/hard_points/system/structure/scripts/watch-changes.mjs',
        'prompts/hard_points/system/structure/scripts/watch-daemon.mjs',
        'prompts/hard_points/system/structure/scripts/generate-index-by-path.mjs',
        'prompts/hard_points/system/structure/scripts/generate-index-by-id.mjs',
        'prompts/hard_points/system/structure/scripts/generate-all-indexes-v3.1.mjs',
        'prompts/hard_points/system/structure/scripts/update-incremental.mjs',
        'prompts/hard_points/system/structure/scripts/generate-secondary-index.mjs',
        'prompts/hard_points/system/structure/scripts/generate-index-master.mjs',
        'prompts/hard_points/system/web/script/download_site.mjs',
      ]) {
        assert.ok(manifest.payloadFiles.some((entry) => entry.target === target), `${hostId}: ${target}`);
        assert.deepEqual(readFileSync(join(packageRoot, 'payload', target)),
          readFileSync(new URL(`../../${target}`, import.meta.url)), `${hostId}: ${target} payload bytes`);
      }
      for (const removed of [
        'prompts/hard_points/system/web/script/download_site.sh',
        'prompts/hard_points/system/maj/scripts/check-file-exists.sh',
        'prompts/hard_points/system/structure/scripts/generate-project-tree.sh',
        'prompts/hard_points/system/structure/scripts/generate-project-tree-json.sh',
        'prompts/hard_points/system/structure/scripts/lib/hash-utils.sh',
        'prompts/hard_points/system/structure/scripts/clean-orphans.sh',
        'prompts/hard_points/system/structure/scripts/format-file-metadata.sh',
        'prompts/hard_points/system/structure/scripts/update-incremental.sh',
        'prompts/hard_points/system/structure/scripts/generate-index-by-path.sh',
        'prompts/hard_points/system/structure/scripts/generate-index-by-alpha.sh',
        'prompts/hard_points/system/structure/scripts/generate-index-by-directory.sh',
        'prompts/hard_points/system/structure/scripts/generate-index-by-type.sh',
        'prompts/hard_points/system/structure/scripts/generate-index-master.sh',
        'prompts/hard_points/system/structure/scripts/watch-changes.sh',
        'prompts/hard_points/system/structure/scripts/generate-index-by-id.sh',
        'prompts/hard_points/system/structure/scripts/generate-index-by-id-parallel.sh',
        'prompts/hard_points/system/structure/scripts/generate-all-indexes-v3.1.sh',
        'prompts/hard_points/system/maj/scripts/ending-0-ask-llm-capability.sh',
        'prompts/hard_points/system/maj/scripts/ending-0-check-json-files.sh',
        'prompts/hard_points/system/maj/scripts/ending-0-generate-diff-report.sh',
        'prompts/hard_points/system/maj/scripts/ending-0-process-fusion.sh',
        'prompts/hard_points/system/maj/scripts/ending-6-list-critical-files.sh',
        'prompts/hard_points/system/maj/scripts/ending-6-invoke-validator.sh',
        'prompts/hard_points/system/maj/scripts/ending-6-analyze-validation-report.sh',
        'prompts/hard_points/system/maj/scripts/ending-7-detect-gaps.sh',
        'prompts/hard_points/system/maj/scripts/ending-7-propose-populate.sh',
        'prompts/hard_points/system/maj/scripts/ending-5-cleanup-tmp-files.sh',
        'prompts/hard_points/system/maj/scripts/ending-5-analyze-backups.sh',
        'prompts/hard_points/system/maj/scripts/ending-5-display-tmp-aikido.sh',
        'prompts/hard_points/system/maj/scripts/ending-10-collect-error-context.sh',
        'prompts/hard_points/system/maj/scripts/ending-10-diagnostic-by-plan.sh',
        'prompts/hard_points/system/maj/scripts/ending-10-generate-error-report.sh',
        ...[
          'ending-3-generate-mono-index.sh', 'ending-3-generate-multi-index.sh',
          'ending-3-validate-indexes.sh', 'ending-8-deploy-commands.sh',
          'ending-8-deploy-agents.sh', 'ending-8-deploy-root-files.sh',
          'ending-8-validate-deployment.sh', 'sync-files.sh', 'sync-directories.sh',
          'ending-1-compare-structures.sh', 'ending-1-check-before-json.sh',
          'ending-1-generate-after-structure.sh', 'ending-1-display-statistics.sh',
          'ending-2-check-diff-report.sh', 'ending-2-validate-json.sh',
          'ending-2-analyze-changes.sh', 'ending-2-detect-backups.sh',
          'create-backup.sh', 'create-log.sh', 'beginning-check-backup.sh',
          'validate-structure.sh', 'ending-4-diagnostic-structure.sh', 'ending-4-run-validation.sh',
          'detect-project-type.sh', 'detect-version.sh', 'beginning-detect-versions.sh',
          'beginning-generate-structure.sh',
        ].map((name) => `prompts/hard_points/system/maj/scripts/${name}`),
      ]) {
        assert.ok(!manifest.payloadFiles.some((entry) => entry.target === removed), `${hostId}: removed ${removed}`);
      }
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
    for (const host of ['claude-code', 'copilot-vscode', 'zoo-code']) {
      const source = (path) => dist(`${host}/payload/prompts/hard_points/${path}`);
      const gate = source('system/search/SKILL.md');
      assert.match(gate, /aikido_snapshot.*aikido_search.*aikido_file/s);
      assert.match(gate, /If tools are restricted in a subagent, ask the coordinator/);
      assert.match(gate, /explicitly reported.*fallback/s);
      assert.match(gate, /Do not replace a restricted profile with unrestricted tool/);
      const bank = source('agents/agent-aikido-explore-bank.md');
      assert.match(bank, /KIMONO FIRST/);
      assert.doesNotMatch(bank, /NEVER.*check for MCP|ANY MCP tool|GREP ONLY.*NO MCP/);
      const code = source('agents/agent-aikido-explore-code.md');
      assert.match(code, /Apply the Kimono gate first/);
      assert.doesNotMatch(code, /Your workflow is ALWAYS: Tech detection/);
      const all = source('agents/agent-aikido-explore-all.md');
      assert.match(all, /Kimono gate → covered retrieval, or native fallback/);
      assert.doesNotMatch(all, /Never sequential|sole purpose is to launch 2 agents/);
      assert.match(source('commands/create-command.md'), /Apply the Kimono capability gate first/);
    }
    assert.match(dist('claude-code/agents/agent-aikido-validator.md'), /^---\nname: agent-aikido-validator\ndescription: ".+"\ntools: Read, Grep, Glob\nmodel: inherit\n---/);
    assert.ok(dist('claude-cowork/agents/agent-aikido-fusion.md').includes('${CLAUDE_PLUGIN_ROOT}/payload/'));
    assert.ok(!/^tools:/m.test(dist('claude-code/agents/agent-aikido-orchestrator.md')));
    assert.match(dist('copilot-github/.github/agents/agent-aikido-orchestrator.agent.md'), /disable-model-invocation: true/);
    assert.match(dist('copilot-vscode/com.github.copilot/agents/agent-aikido-truth-evaluator.agent.md'), /^tools: \["read","search"\]$/m);
    assert.match(dist('codex/.codex/agents/agent-aikido-validator.toml'), /^name = "agent-aikido-validator"\ndescription = ".+"\ndeveloper_instructions = ".+Do not edit files\.\\n"\n$/);
    assert.match(dist('kiro-cli/.kiro/agents/agent-aikido-bank-populate.md'), /tools:\n  - "read"\n  - "write"\nresources:/);
    assert.match(dist('kiro-cli/.kiro/agents/agent-aikido-projet-index.md'), /tools:\n  - "read"\n  - "write"\n  - "shell"\nresources:/);
    assert.match(dist('antigravity/.agents/agents/agent-aikido-explore-all.md'), /tools:\n  - view_file\n  - grep_search\n  - invoke_subagent\nmainAgent: true\nsubagent: true\ncommandExecutionPolicy: sandbox\n---/);
    assert.match(dist('antigravity/.agents/agents/agent-aikido-orchestrator.md'), /mainAgent: true\nsubagent: false\ncommandExecutionPolicy: sandbox/);
    assert.match(dist('zoo-code/.roo/commands/init-aikido.md'), /^---\ndescription: ".+"\n---\n\n# \/init-aikido\n/);
    assert.match(dist('roo-code-legacy/.roo/commands/init-aikido.md'), /^---\ndescription: ".+"\n---\n\n# \/init-aikido\n/);
    assert.match(dist('zoo-code/README.md'), /AI-KIDO for Zoo Code/);
    assert.match(dist('roo-code-legacy/README.md'), /existing Roo Code project/);
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
