import { after, before, test } from 'node:test';
import assert from 'node:assert/strict';
import {
  cpSync, existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { spawnSync } from 'node:child_process';
import { buildDistribution } from '../scripts/build.mjs';
import { loadCatalog, renderCatalogEntries } from '../lib/catalog.mjs';
import { validatePackage } from '../lib/package.mjs';

const catalog = loadCatalog();
const host = catalog.hosts['kiro-cli'];
const agentPath = '.kiro/agents/agent-aikido-validator.md';
const skillPath = '.kiro/skills/init-aikido/SKILL.md';
let workspace;
let basePackage;
let nextPackage;

before(() => {
  workspace = mkdtempSync(join(tmpdir(), 'aikido-kiro-'));
  for (const [name, version] of [['base', '1.5.0-dev'], ['next', '1.5.1-dev']]) {
    const output = join(workspace, `${name}-build`);
    buildDistribution({ outDir: output, version, sourceRevision: 'a'.repeat(40) });
    cpSync(join(output, 'kiro-cli'), join(workspace, `${name} extracted package`), { recursive: true });
    rmSync(output, { recursive: true });
  }
  basePackage = join(workspace, 'base extracted package');
  nextPackage = join(workspace, 'next extracted package');
});

after(() => {
  if (workspace) rmSync(workspace, { recursive: true, force: true });
});

function read(root, path) {
  return readFileSync(join(root, path), 'utf8');
}

function write(root, path, contents) {
  mkdirSync(dirname(join(root, path)), { recursive: true });
  writeFileSync(join(root, path), contents);
}

function cli(script, args, expectedStatus = 0) {
  const result = spawnSync(process.execPath, [join(basePackage, 'scripts', script), ...args], {
    cwd: basePackage,
    encoding: 'utf8',
    timeout: 30_000,
  });
  assert.equal(result.error, undefined, result.error?.message);
  assert.equal(result.status, expectedStatus, `${result.stdout}\n${result.stderr}`);
  return expectedStatus === 0 || expectedStatus === 2 ? JSON.parse(result.stdout) : result;
}

function bootstrap(root, mode) {
  const args = ['--root', root, '--package', basePackage, '--mode', mode];
  const plan = cli('bootstrap-plan.mjs', args);
  assert.equal(plan.ready, true, JSON.stringify(plan.conflicts));
  assert.equal(existsSync(join(root, '.aikido/lock.json')), false);
  const applied = cli('bootstrap-plan.mjs', [...args, '--apply', '--confirm', plan.planId]);
  assert.equal(applied.status, 'installed');
  return { args, plan: plan.planId };
}

test('Kiro package emits native Skills and CLI custom agents from canonical sources', () => {
  assert.equal(validatePackage(basePackage).valid, true);
  const manifest = JSON.parse(read(basePackage, 'package-manifest.json'));
  assert.ok(manifest.files.some((entry) => entry.path === 'README.md' && entry.role === 'adapter'));
  assert.equal(manifest.agentCount, catalog.agents.length);
  assert.equal(manifest.files.filter((entry) => entry.role === 'command').length, catalog.commands.length);
  for (const skill of catalog.systemSkills) {
    assert.ok(manifest.files.some((entry) => (
      entry.role === 'system-skill' && entry.path === `.kiro/skills/${skill.name}/SKILL.md`
    )), skill.name);
  }

  for (const command of catalog.commands) {
    const path = `${host.commandTarget}/${command.name}/SKILL.md`;
    const text = read(basePackage, path);
    assert.match(text, new RegExp(`^---\\nname: ${command.name}\\ndescription: .+\\n---`, 'm'));
    assert.ok(text.includes(`\`${command.source}\``), command.name);
    assert.ok(text.includes(`# /${command.name}`), command.name);
  }
  for (const skill of catalog.systemSkills) {
    const path = `${host.systemSkillTarget}/${skill.name}/SKILL.md`;
    const text = read(basePackage, path);
    assert.match(text, new RegExp(`^---\\nname: ${skill.name}\\ndescription: .+\\n---`, 'm'));
  }
  for (const agent of catalog.agents) {
    const text = read(basePackage, `${host.agentTarget}/${agent.name}.md`);
    const frontmatter = text.match(/^---\n([\s\S]*?)\n---/);
    assert.ok(frontmatter, agent.name);
    assert.match(frontmatter[1], new RegExp(`^name: ${agent.name}$`, 'm'));
    assert.match(frontmatter[1], /^description: .+$/m);
    assert.ok(frontmatter[1].includes(`file://./${agent.source}`), agent.name);
    assert.ok(text.includes(`\`${agent.source}\``), agent.name);
    assert.doesNotMatch(frontmatter[1], /^tools:\s*\n\s*-\s*"\*"$/m);
    if (frontmatter[1].includes('availableAgents:')) {
      assert.doesNotMatch(frontmatter[1], new RegExp(`^\\s+- "${agent.name}"$`, 'm'));
      for (const topLevelAgent of catalog.agents.filter((candidate) => candidate.topLevelOnly)) {
        assert.doesNotMatch(frontmatter[1], new RegExp(`^\\s+- "${topLevelAgent.name}"$`, 'm'));
      }
    }
  }

  const orchestrator = read(basePackage, '.kiro/agents/agent-aikido-orchestrator.md');
  const orchestratorFrontmatter = orchestrator.match(/^---\n([\s\S]*?)\n---/)[1];
  assert.doesNotMatch(orchestratorFrontmatter, /^tools:/m);
  assert.match(orchestratorFrontmatter, /^toolsSettings:\n  subagent:\n    availableAgents:/m);
  assert.doesNotMatch(orchestratorFrontmatter, /^\s+- "agent-aikido-orchestrator"$/m);
  const validator = read(basePackage, agentPath);
  assert.match(validator, /^tools:\n  - "read"$/m);
  const delegator = read(basePackage, '.kiro/agents/agent-aikido-explore-all.md');
  assert.match(delegator, /^tools:\n  - "read"\n  - "subagent"$/m);
  assert.match(delegator, /^toolsSettings:\n  subagent:\n    availableAgents:/m);
  assert.doesNotMatch(delegator, /^\s+- "agent-aikido-explore-all"$/m);
  assert.doesNotMatch(delegator, /^\s+- "agent-aikido-orchestrator"$/m);
  assert.match(read(basePackage, '.kiro/skills/orchestrator/SKILL.md'), /name: orchestrator/);
  assert.match(read(basePackage, 'README.md'), /Kiro CLI/);

  const commands = renderCatalogEntries('commands', { hosts: ['kiro-cli'] });
  assert.ok(commands.includes('`/list-command` (Skill)'));
  assert.ok(!commands.includes('`$list-command`'));
});

for (const mode of ['STANDARD', 'LIGHT', 'UNSET']) {
  test(`Kiro packaged runtime bootstraps ${mode} and preserves existing workspace configuration`, () => {
    const root = join(workspace, `project ${mode}`);
    mkdirSync(root);
    write(root, 'AGENTS.md', '# Project rules\nKeep these rules.\n');
    write(root, '.kiro/settings.json', '{"custom":true}\n');
    write(root, '.kiro/agents/local-agent.md', 'name: local-agent\n');
    const { args, plan } = bootstrap(root, mode);
    assert.equal(read(root, '.kiro/settings.json'), '{"custom":true}\n');
    assert.equal(read(root, '.kiro/agents/local-agent.md'), 'name: local-agent\n');
    assert.match(read(root, 'AGENTS.md'), /Keep these rules\.[\s\S]*AI-KIDO Memory Bank/);
    assert.ok(read(root, agentPath).includes(`file://./prompts/hard_points/agents/agent-aikido-validator.md`));
    assert.equal(cli('bootstrap-plan.mjs', [...args, '--apply', '--confirm', plan]).status, 'already-installed');
  });
}

test('Kiro packaged runtime preserves edited adapters on uninstall and keeps project knowledge', () => {
  const root = join(workspace, 'lifecycle project');
  mkdirSync(root);
  bootstrap(root, 'STANDARD');
  const customizedSkill = `${read(root, skillPath)}\nProject-specific guidance.\n`;
  write(root, skillPath, customizedSkill);
  write(root, 'prompts/gen/project-facts.md', '# Project facts\n');
  const plan = cli('update-plan.mjs', ['--root', root, '--uninstall']);
  assert.equal(plan.ready, true, JSON.stringify(plan.conflicts));
  const result = cli('update-plan.mjs', [
    '--root', root, '--uninstall', '--apply', '--confirm', plan.planId,
  ]);
  assert.equal(result.status, 'uninstalled');
  assert.equal(read(root, skillPath), customizedSkill);
  assert.equal(existsSync(join(root, agentPath)), false);
  assert.equal(read(root, 'prompts/gen/project-facts.md'), '# Project facts\n');
});
