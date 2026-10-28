import { after, before, test } from 'node:test';
import assert from 'node:assert/strict';
import {
  cpSync, existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { spawnSync } from 'node:child_process';
import { buildDistribution } from '../scripts/build.mjs';
import { loadCatalog } from '../lib/catalog.mjs';
import { validatePackage } from '../lib/package.mjs';

const catalog = loadCatalog();
const host = catalog.hosts.antigravity;
const agentPath = '.agents/agents/agent-aikido-validator.md';
const skillPath = '.agents/skills/init-aikido/SKILL.md';
let workspace;
let basePackage;

before(() => {
  workspace = mkdtempSync(join(tmpdir(), 'aikido-antigravity-'));
  const output = join(workspace, 'build');
  buildDistribution({ outDir: output, version: '1.5.0-dev', sourceRevision: 'a'.repeat(40) });
  cpSync(join(output, 'antigravity'), join(workspace, 'extracted package'), { recursive: true });
  rmSync(output, { recursive: true });
  basePackage = join(workspace, 'extracted package');
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

test('Antigravity package emits Skills and every canonical agent with scoped metadata', () => {
  assert.equal(validatePackage(basePackage).valid, true);
  const manifest = JSON.parse(read(basePackage, 'package-manifest.json'));
  assert.ok(manifest.files.some((entry) => entry.path === 'README.md' && entry.role === 'adapter'));
  assert.equal(manifest.agentCount, catalog.agents.length);
  assert.equal(manifest.files.filter((entry) => entry.role === 'command').length, catalog.commands.length);
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
    const path = `${host.agentTarget}/${agent.name}.md`;
    const text = read(basePackage, path);
    const frontmatter = text.match(/^---\n([\s\S]*?)\n---/);
    assert.ok(frontmatter, agent.name);
    assert.match(frontmatter[1], new RegExp(`^name: ${agent.name}$`, 'm'));
    assert.match(frontmatter[1], /^description: .+$/m);
    assert.match(frontmatter[1], /^mainAgent: true$/m);
    assert.match(frontmatter[1], new RegExp(`^subagent: ${agent.topLevelOnly ? 'false' : 'true'}$`, 'm'));
    assert.match(frontmatter[1], /^commandExecutionPolicy: sandbox$/m);
    assert.match(frontmatter[1], /^  - view_file$/m);
    assert.doesNotMatch(frontmatter[1], /^\s+- \*$/m);
    assert.ok(text.includes(`\`${agent.source}\``), agent.name);
    assert.equal(manifest.projectFiles.some((entry) => entry.target === path), true, path);
  }
  assert.match(read(basePackage, agentPath), /from this project's AI-KIDO Memory Bank/);
  assert.match(read(basePackage, 'README.md'), /AI-KIDO for Google Antigravity/);
});

for (const mode of ['STANDARD', 'LIGHT', 'UNSET']) {
  test(`Antigravity packaged runtime bootstraps ${mode} and preserves workspace customizations`, () => {
    const root = join(workspace, `project ${mode}`);
    mkdirSync(root);
    write(root, 'AGENTS.md', '# Project rules\nKeep these rules.\n');
    write(root, '.gemini/settings.json', '{"custom":true}\n');
    write(root, '.agents/agents/local-agent.md', 'name: local-agent\n');
    write(root, '.agents/skills/local-skill/SKILL.md', '# Local Skill\n');
    const { args, plan } = bootstrap(root, mode);
    assert.equal(read(root, '.gemini/settings.json'), '{"custom":true}\n');
    assert.equal(read(root, '.agents/agents/local-agent.md'), 'name: local-agent\n');
    assert.equal(read(root, '.agents/skills/local-skill/SKILL.md'), '# Local Skill\n');
    assert.match(read(root, 'AGENTS.md'), /Keep these rules\.[\s\S]*AI-KIDO Memory Bank/);
    assert.ok(read(root, agentPath).includes('from this project\'s AI-KIDO Memory Bank'));
    assert.equal(cli('bootstrap-plan.mjs', [...args, '--apply', '--confirm', plan]).status, 'already-installed');
  });
}

test('Antigravity uninstall preserves edited wrappers and project knowledge', () => {
  const root = join(workspace, 'lifecycle project');
  mkdirSync(root);
  bootstrap(root, 'STANDARD');
  const customizedAgent = `${read(root, agentPath)}\nProject-specific guidance.\n`;
  write(root, agentPath, customizedAgent);
  write(root, '.agents/skills/local-skill/SKILL.md', '# Local Skill\n');
  write(root, 'prompts/gen/project-facts.md', '# Project facts\n');
  const plan = cli('update-plan.mjs', ['--root', root, '--uninstall']);
  assert.equal(plan.ready, true, JSON.stringify(plan.conflicts));
  const result = cli('update-plan.mjs', [
    '--root', root, '--uninstall', '--apply', '--confirm', plan.planId,
  ]);
  assert.equal(result.status, 'uninstalled');
  assert.equal(read(root, agentPath), customizedAgent);
  assert.equal(existsSync(join(root, skillPath)), false);
  assert.equal(read(root, '.agents/skills/local-skill/SKILL.md'), '# Local Skill\n');
  assert.equal(read(root, 'prompts/gen/project-facts.md'), '# Project facts\n');
});
