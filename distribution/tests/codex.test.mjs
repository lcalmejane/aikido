import { after, before, test } from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { spawnSync } from 'node:child_process';
import {
  cpSync, existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { buildDistribution } from '../scripts/build.mjs';
import { loadCatalog, renderCatalogEntries } from '../lib/catalog.mjs';
import { validatePackage } from '../lib/package.mjs';

const catalog = loadCatalog();
const validator = '.codex/agents/agent-aikido-validator.toml';
const command = '.agents/skills/list-command/SKILL.md';
let workspace;
let basePackage;
let nextPackage;

before(() => {
  workspace = mkdtempSync(join(tmpdir(), 'aikido-codex-'));
  for (const [name, version] of [['base', '1.5.0-dev'], ['next', '1.5.1-dev']]) {
    const output = join(workspace, `${name}-build`);
    buildDistribution({ outDir: output, version, sourceRevision: 'a'.repeat(40) });
    cpSync(join(output, 'codex'), join(workspace, `${name} extracted package`), { recursive: true });
    rmSync(output, { recursive: true });
  }
  basePackage = join(workspace, 'base extracted package');
  nextPackage = join(workspace, 'next extracted package');
  changeFile(nextPackage, validator, (text) => text.replace('description = "', 'description = "Updated: '));
});

after(() => {
  if (workspace) rmSync(workspace, { recursive: true, force: true });
});

function read(root, path) {
  return readFileSync(join(root, path), 'utf8');
}

function json(root, path) {
  return JSON.parse(read(root, path));
}

function write(root, path, contents) {
  mkdirSync(dirname(join(root, path)), { recursive: true });
  writeFileSync(join(root, path), contents);
}

function changeFile(root, path, change) {
  const manifest = json(root, 'package-manifest.json');
  const contents = change(read(root, path));
  write(root, path, contents);
  const sha256 = createHash('sha256').update(contents).digest('hex');
  manifest.files.find((file) => file.path === path).sha256 = sha256;
  for (const entry of manifest.projectFiles.filter((file) => file.source === path)) entry.sha256 = sha256;
  write(root, 'package-manifest.json', `${JSON.stringify(manifest, null, 2)}\n`);
}

function cli(script, args, status = 0, packageRoot = basePackage) {
  const result = spawnSync(process.execPath, [join(packageRoot, 'scripts', script), ...args], {
    cwd: packageRoot, encoding: 'utf8', timeout: 30_000,
  });
  assert.equal(result.error, undefined, result.error?.message);
  assert.equal(result.status, status, `${result.stdout}\n${result.stderr}`);
  return status === 0 || status === 2 ? JSON.parse(result.stdout) : result;
}

function install(root, mode = 'STANDARD') {
  const args = ['--root', root, '--package', basePackage, '--mode', mode];
  const plan = cli('bootstrap-plan.mjs', args);
  assert.equal(plan.ready, true, JSON.stringify(plan.conflicts));
  const result = cli('bootstrap-plan.mjs', [...args, '--apply', '--confirm', plan.planId]);
  assert.equal(result.status, 'installed');
  return result;
}

test('Codex extracted package exposes discoverable Skills and inherited-permission agents', () => {
  assert.equal(validatePackage(basePackage).valid, true);
  const manifest = json(basePackage, 'package-manifest.json');
  assert.equal(manifest.files.filter((entry) => entry.role === 'agent').length, catalog.agents.length);
  assert.equal(manifest.files.filter((entry) => entry.role === 'command').length, catalog.commands.length);
  const skills = [...catalog.commands, ...catalog.systemSkills];
  for (const skill of skills) {
    const text = read(basePackage, `.agents/skills/${skill.name}/SKILL.md`);
    assert.ok(text.startsWith(`---\nname: ${skill.name}\ndescription: "`), skill.name);
    const description = JSON.parse(text.match(/^description: (.+)$/m)[1]);
    assert.ok(description.length > 20, skill.name);
  }
  assert.match(read(basePackage, command), /# \$list-command/);
  const orchestrator = read(basePackage, '.agents/skills/orchestrator/SKILL.md');
  assert.match(orchestrator, /description: "Use when choosing/);
  assert.ok(orchestrator.includes('](../../../prompts/hard_points/agents/agent-aikido-orchestrator.md)'));
  assert.ok(orchestrator.includes('](../../../skills_list.md)'));
  for (const agent of catalog.agents) {
    const text = read(basePackage, `.codex/agents/${agent.name}.toml`);
    const fields = Object.fromEntries(text.trimEnd().split('\n').map((line) => {
      const [, key, value] = line.match(/^([a-z_]+) = (".*")$/);
      return [key, JSON.parse(value)];
    }));
    assert.deepEqual(Object.keys(fields), ['name', 'description', 'developer_instructions']);
    assert.equal(fields.name, agent.name);
    assert.ok(fields.developer_instructions.includes(`\`${agent.source}\``));
    assert.ok(fields.description);
  }
  assert.match(read(basePackage, validator), /Do not edit files/);
  assert.ok(!manifest.projectFiles.some((entry) => entry.target === 'README.md'));
  assert.ok(!manifest.projectFiles.some((entry) => /^\.codex\/(?:prompts\/|config\.toml)/.test(entry.target)));
  assert.ok(!existsSync(join(basePackage, 'plugin.json')));
  assert.match(read(basePackage, 'README.md'), /Native recipe not run: CLI unavailable/);
  const entries = renderCatalogEntries('commands', { hosts: ['codex'] });
  assert.ok(entries.includes('`$list-command`'));
  assert.ok(!entries.includes('`/list-command`'));
});

for (const mode of ['STANDARD', 'LIGHT', 'UNSET']) {
  test(`Codex packaged CLI installs ${mode} outside the source tree and preserves user configuration`, () => {
    const root = join(workspace, `project ${mode}`);
    mkdirSync(root);
    write(root, 'AGENTS.md', '# User instructions\nKeep this guidance.\n');
    write(root, '.codex/config.toml', '# Operator settings\n');
    write(root, 'AGENTS.override.md', '# Deliberate user override\n');
    const args = ['--root', root, '--package', basePackage, '--mode', mode];
    const plan = cli('bootstrap-plan.mjs', args);
    assert.equal(existsSync(join(root, '.aikido/lock.json')), false);
    assert.equal(existsSync(join(root, '.agents')), false);
    assert.equal(read(root, 'AGENTS.md'), '# User instructions\nKeep this guidance.\n');
    cli('bootstrap-plan.mjs', [...args, '--apply', '--confirm', 'wrong-id'], 1);
    assert.equal(existsSync(join(root, '.agents')), false);
    cli('bootstrap-plan.mjs', [...args, '--apply', '--confirm', plan.planId]);
    const lock = json(root, '.aikido/lock.json');
    assert.equal(lock.mode, mode);
    assert.deepEqual(lock.hosts, ['codex']);
    assert.match(read(root, 'AGENTS.md'), /Keep this guidance\.[\s\S]*AI-KIDO Memory Bank/);
    assert.equal(read(root, '.codex/config.toml'), '# Operator settings\n');
    assert.equal(read(root, 'AGENTS.override.md'), '# Deliberate user override\n');
    assert.ok(read(root, 'commands_list.md').includes('`$list-command`'));
    for (const agent of catalog.agents) {
      assert.equal(read(root, `.codex/agents/${agent.name}.toml`),
        read(basePackage, `.codex/agents/${agent.name}.toml`));
      assert.ok(existsSync(join(root, agent.source)));
    }
    assert.equal(read(root, '.agents/skills/orchestrator/policy.json'),
      read(basePackage, '.agents/skills/orchestrator/policy.json'));
    assert.equal(cli('bootstrap-plan.mjs', [...args, '--apply', '--confirm', plan.planId]).status, 'already-installed');
  });
}

test('Codex update, uninstall and recovery preserve customized Skills and project knowledge', () => {
  const root = join(workspace, 'lifecycle project');
  mkdirSync(root);
  install(root);
  const customCommand = `${read(root, command)}\nUser customization.\n`;
  write(root, command, customCommand);
  write(root, 'prompts/gen/project-facts.md', '# Project facts\n');
  write(root, 'prompts/spec/private.md', '# Private notes\n');
  const args = ['--root', root, '--package', nextPackage];
  const plan = cli('update-plan.mjs', args);
  assert.equal(plan.ready, true, JSON.stringify(plan.conflicts));
  const updated = cli('update-plan.mjs', [...args, '--apply', '--confirm', plan.planId]);
  assert.equal(updated.status, 'updated');
  assert.equal(json(root, '.aikido/lock.json').aikido.version, '1.5.1-dev');
  assert.equal(read(root, validator), read(nextPackage, validator));
  assert.equal(read(root, command), customCommand);
  const beforeRemoval = read(root, 'AGENTS.md');
  const removeArgs = ['--root', root, '--uninstall'];
  const removalPlan = cli('update-plan.mjs', removeArgs);
  const removed = cli('update-plan.mjs', [...removeArgs, '--apply', '--confirm', removalPlan.planId]);
  assert.equal(removed.status, 'uninstalled');
  assert.equal(existsSync(join(root, validator)), false);
  assert.equal(read(root, command), customCommand);
  assert.equal(read(root, 'prompts/gen/project-facts.md'), '# Project facts\n');
  assert.equal(read(root, 'prompts/spec/private.md'), '# Private notes\n');
  assert.ok(existsSync(join(root, 'prompts/hard_points/ai-kido.md')));
  assert.equal(cli('update-plan.mjs', ['--root', root, '--recover', removed.backup]).status, 'restored');
  assert.equal(read(root, validator), read(nextPackage, validator));
  assert.equal(read(root, 'AGENTS.md'), beforeRemoval);
});

test('Codex concurrent agent edits produce an explicit conflict with no applied changes', () => {
  const root = join(workspace, 'conflicting update');
  mkdirSync(root);
  install(root);
  write(root, validator, `${read(root, validator)}# User customization\n`);
  const oldLock = read(root, '.aikido/lock.json');
  const local = read(root, validator);
  const args = ['--root', root, '--package', nextPackage];
  const plan = cli('update-plan.mjs', args, 2);
  assert.equal(plan.ready, false);
  assert.ok(plan.conflicts.some((entry) => entry.target === validator));
  cli('update-plan.mjs', [...args, '--apply', '--confirm', plan.planId], 1);
  assert.equal(read(root, '.aikido/lock.json'), oldLock);
  assert.equal(read(root, validator), local);
});

test('Codex bootstrap refuses a foreign Skill without creating a lock', () => {
  const root = join(workspace, 'foreign Skill');
  write(root, command, 'User-owned Skill\n');
  const args = ['--root', root, '--package', basePackage, '--mode', 'STANDARD'];
  const plan = cli('bootstrap-plan.mjs', args, 2);
  assert.equal(plan.ready, false);
  assert.ok(plan.conflicts.some((entry) => entry.target === command));
  cli('bootstrap-plan.mjs', [...args, '--apply', '--confirm', plan.planId], 1);
  assert.equal(read(root, command), 'User-owned Skill\n');
  assert.equal(existsSync(join(root, '.aikido/lock.json')), false);
});

test('Codex legacy migration records existing knowledge and wrappers without rewriting them', () => {
  const root = join(workspace, 'legacy project');
  const knowledge = 'prompts/hard_points/ai-kido.md';
  write(root, knowledge, `${read(basePackage, `payload/${knowledge}`)}\nLocal legacy guidance.\n`);
  write(root, command, 'Legacy customized Skill\n');
  write(root, 'AGENTS.md', '# Legacy user instructions\n');
  write(root, 'prompts/gen/facts.md', '# Existing project knowledge\n');
  const originalKnowledge = read(root, knowledge);
  const args = ['--root', root, '--package', basePackage, '--migrate', '--mode', 'LIGHT'];
  const plan = cli('update-plan.mjs', args);
  assert.equal(plan.ready, true, JSON.stringify(plan.conflicts));
  assert.equal(existsSync(join(root, '.aikido/lock.json')), false);
  const result = cli('update-plan.mjs', [...args, '--apply', '--confirm', plan.planId]);
  assert.equal(result.status, 'migrated');
  assert.deepEqual(json(root, '.aikido/lock.json').hosts, ['codex']);
  assert.equal(json(root, '.aikido/lock.json').mode, 'LIGHT');
  assert.equal(read(root, knowledge), originalKnowledge);
  assert.equal(read(root, command), 'Legacy customized Skill\n');
  assert.equal(read(root, 'AGENTS.md'), '# Legacy user instructions\n');
  assert.equal(read(root, 'prompts/gen/facts.md'), '# Existing project knowledge\n');
  assert.equal(existsSync(join(root, validator)), false);
});

test('Codex validation rejects malformed metadata or extra agent settings even with matching hashes', () => {
  const cases = [
    ['missing metadata', '.agents/skills/analyse/SKILL.md',
      (text) => text.replace(/^description: .+\n/m, ''), /Codex Skill metadata/],
    ['wrong Skill name', command,
      (text) => text.replace('name: list-command', 'name: wrong-name'), /Codex Skill metadata/],
    ['invalid TOML', validator,
      (text) => text.replace('name = "', 'name = broken "'), /Codex generated agent TOML is invalid/],
    ['extra agent settings', validator,
      (text) => `${text}model = "unrequested-model"\n`, /Codex generated agent TOML is invalid/],
    ['wrong TOML name', validator,
      (text) => text.replace('name = "agent-aikido-validator"', 'name = "wrong-agent"'),
      /Codex generated agent TOML is invalid/],
  ];
  for (const [name, path, change, expected] of cases) {
    const root = join(workspace, `invalid ${name}`);
    cpSync(basePackage, root, { recursive: true });
    changeFile(root, path, change);
    assert.throws(() => validatePackage(root), expected, name);
  }
});

test('Codex validation requires installable Skills and rejects deprecated or configuration targets', () => {
  for (const [index, target] of [null, '.codex/prompts/list-command.md', '.codex/config.toml'].entries()) {
    const root = join(workspace, `invalid mapping ${index}`);
    cpSync(basePackage, root, { recursive: true });
    const manifest = json(root, 'package-manifest.json');
    const mappingIndex = manifest.projectFiles.findIndex((file) => file.target === command);
    if (target) manifest.projectFiles[mappingIndex].target = target;
    else manifest.projectFiles.splice(mappingIndex, 1);
    write(root, 'package-manifest.json', `${JSON.stringify(manifest, null, 2)}\n`);
    assert.throws(() => validatePackage(root), /Codex project Skill is missing/);
    if (target) {
      assert.throws(() => validatePackage(root), /Codex adapter must not install deprecated prompts or change user configuration/);
    }
  }
});
