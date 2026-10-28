import { after, before, test } from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import {
  cpSync, existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, truncateSync, writeFileSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { spawnSync } from 'node:child_process';
import { buildDistribution } from '../scripts/build.mjs';
import { loadCatalog } from '../lib/catalog.mjs';
import { validatePackage } from '../lib/package.mjs';

const catalog = loadCatalog();
let workspace;
let basePackage;
let nextPackage;
let codePackage;

before(() => {
  workspace = mkdtempSync(join(tmpdir(), 'aikido-cowork-'));
  for (const [name, version] of [['base', '1.5.0-dev'], ['next', '1.5.1-dev']]) {
    const output = join(workspace, `${name}-build`);
    buildDistribution({ outDir: output, version, sourceRevision: 'a'.repeat(40) });
    cpSync(join(output, 'claude-cowork'), join(workspace, `${name} extracted package`), { recursive: true });
    if (name === 'base') {
      codePackage = join(workspace, 'Claude Code package');
      cpSync(join(output, 'claude-code'), codePackage, { recursive: true });
    }
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

function json(root, path) {
  return JSON.parse(read(root, path));
}

function clone(name) {
  const root = join(workspace, name);
  cpSync(basePackage, root, { recursive: true });
  return root;
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
  assert.equal(existsSync(join(root, '.aikido/lock.json')), false);
  assert.equal(cli('bootstrap-plan.mjs', [...args, '--apply', '--confirm', plan.planId]).status, 'installed');
  return { args, plan };
}

test('Cowork package has its own complete plugin and prerequisite-aware canonical wrappers', () => {
  assert.equal(validatePackage(basePackage).valid, true);
  const manifest = json(basePackage, 'package-manifest.json');
  const plugin = json(basePackage, '.claude-plugin/plugin.json');
  assert.equal(manifest.host, 'claude-cowork');
  assert.equal(plugin.name, 'aikido');
  assert.equal(plugin.version, manifest.version);
  assert.equal(plugin.license, 'MIT');
  assert.equal(json(basePackage, '.claude-plugin/marketplace.json').plugins[0].source, '.');
  for (const path of ['README.md', 'LICENSE', 'TRADEMARK.md', 'assets/aikido.png']) {
    assert.ok(manifest.files.some((entry) => entry.path === path), path);
  }
  assert.equal(manifest.files.filter((entry) => entry.role === 'command').length, catalog.commands.length);
  assert.equal(manifest.files.filter((entry) => entry.role === 'agent').length, catalog.agents.length);
  const wrappers = [
    ...catalog.commands.map((item) => [`commands/${item.name}.md`, item.name, item.source]),
    ...catalog.systemSkills.map((item) => [`skills/${item.name}/SKILL.md`, item.name, `${item.source}/SKILL.md`]),
    ...catalog.agents.map((item) => [`agents/${item.name}.md`, item.name, item.source]),
  ];
  for (const [path, name, source] of wrappers) {
    const text = read(basePackage, path);
    assert.match(text, new RegExp(`^---\\nname: ${name}\\ndescription: .+`, 'm'));
    assert.ok(text.includes(source), path);
    assert.match(text, /## Cowork execution boundary/);
    assert.match(text, /AIKIDO_COWORK_UNAVAILABLE/);
    assert.match(text, /Node\.js/);
    assert.match(text, /user-selected persistent project folder/);
    assert.match(text, /Do not replace the runtime with manual copies/);
    assert.match(text, /not a host-enforced sandbox/);
  }
  for (const command of catalog.commands) {
    assert.match(read(basePackage, `commands/${command.name}.md`), new RegExp(`# /aikido:${command.name}`));
    assert.equal(existsSync(join(basePackage, `skills/${command.name}/SKILL.md`)), false);
  }
  assert.match(read(basePackage, 'README.md'), /Claude Cowork as an\s+account plugin/);
  assert.doesNotMatch(read(basePackage, 'README.md'), /session test|native acceptance|qualification|not tested/i);
  assert.equal(manifest.projectFiles.length, 0);
  for (const path of ['bin', '.mcp.json', 'hooks', '.claude/settings.json']) {
    assert.equal(existsSync(join(basePackage, path)), false, path);
  }
  assert.doesNotMatch(read(codePackage, 'commands/init-aikido.md'), /Cowork execution boundary/);
});

test('Claude Code directory validator accepts the Cowork package, without proving native Cowork behavior', () => {
  const result = spawnSync('claude', ['plugin', 'validate', '--strict', '--profile', 'directory', basePackage], {
    encoding: 'utf8', timeout: 30_000,
  });
  assert.equal(result.error, undefined, result.error?.message);
  assert.equal(result.status, 0, `${result.stdout}\n${result.stderr}`);
});

for (const mode of ['STANDARD', 'LIGHT', 'UNSET']) {
  test(`Cowork extracted runtime bootstraps ${mode} without installing plugin wrappers into the project`, () => {
    const root = join(workspace, `project ${mode}`);
    mkdirSync(root);
    write(root, 'AGENTS.md', '# User instructions\nKeep these rules.\n');
    write(root, '.claude/settings.local.json', '{"custom":true}\n');
    const { args, plan } = install(root, mode);
    const lock = json(root, '.aikido/lock.json');
    assert.deepEqual(lock.hosts, ['claude-cowork']);
    assert.equal(lock.mode, mode);
    assert.match(read(root, 'AGENTS.md'), /Keep these rules\.[\s\S]*AI-KIDO Memory Bank/);
    assert.equal(read(root, '.claude/settings.local.json'), '{"custom":true}\n');
    assert.equal(existsSync(join(root, 'commands')), false);
    assert.equal(existsSync(join(root, 'skills')), false);
    assert.equal(existsSync(join(root, 'agents')), false);
    assert.equal(cli('bootstrap-plan.mjs', [...args, '--apply', '--confirm', plan.planId]).status, 'already-installed');
  });
}

test('Cowork runtime updates its own host, preserves local knowledge and supports uninstall recovery', () => {
  const root = join(workspace, 'lifecycle project');
  mkdirSync(root);
  write(root, 'AGENTS.md', '# User instructions\n');
  install(root);
  const knowledgePath = 'prompts/hard_points/ai-kido.md';
  const customized = `${read(root, knowledgePath)}\nLocal knowledge.\n`;
  write(root, knowledgePath, customized);
  const rejected = cli('update-plan.mjs', ['--root', root, '--package', codePackage], 1);
  assert.match(rejected.stderr, /host must match/);
  const args = ['--root', root, '--package', nextPackage];
  const plan = cli('update-plan.mjs', args, 0, nextPackage);
  assert.equal(plan.ready, true, JSON.stringify(plan.conflicts));
  assert.equal(cli('update-plan.mjs', [...args, '--apply', '--confirm', plan.planId], 0, nextPackage).status, 'updated');
  assert.equal(json(root, '.aikido/lock.json').aikido.version, '1.5.1-dev');
  assert.equal(read(root, knowledgePath), customized);
  const removal = cli('update-plan.mjs', ['--root', root, '--uninstall']);
  const result = cli('update-plan.mjs', [
    '--root', root, '--uninstall', '--apply', '--confirm', removal.planId,
  ]);
  assert.equal(result.status, 'uninstalled');
  assert.equal(read(root, knowledgePath), customized);
  assert.equal(read(root, 'AGENTS.md'), '# User instructions\n');
  assert.equal(cli('update-plan.mjs', ['--root', root, '--recover', result.backup]).status, 'restored');
  assert.match(read(root, 'AGENTS.md'), /aikido:begin id=core/);
});

test('Cowork validation rejects a missing manifest, top-level bin and a removed wrapper boundary', () => {
  const missing = clone('missing manifest');
  rmSync(join(missing, '.claude-plugin/plugin.json'));
  assert.throws(() => validatePackage(missing), /plugin\.json/);
  const bin = clone('unsupported bin');
  mkdirSync(join(bin, 'bin'));
  assert.throws(() => validatePackage(bin), /top-level bin entry/);
  const boundary = clone('missing boundary');
  const path = 'commands/list-command.md';
  const contents = read(boundary, path).replace('AIKIDO_COWORK_UNAVAILABLE', 'REMOVED');
  write(boundary, path, contents);
  const manifest = json(boundary, 'package-manifest.json');
  manifest.files.find((entry) => entry.path === path).sha256 = createHash('sha256').update(contents).digest('hex');
  write(boundary, 'package-manifest.json', `${JSON.stringify(manifest, null, 2)}\n`);
  assert.throws(() => validatePackage(boundary), /execution boundary is missing/);
});

test('Cowork file limit accepts 5000 files and rejects 5001, and rejects packages over 200 MB', () => {
  const root = clone('file limit');
  const manifest = json(root, 'package-manifest.json');
  const emptyHash = createHash('sha256').update('').digest('hex');
  // package-manifest.json counts as one file in addition to its ledger.
  for (let index = manifest.files.length + 1; index < 5000; index += 1) {
    const path = `limit/file-${index}.txt`;
    write(root, path, '');
    manifest.files.push({ path, role: 'adapter', sha256: emptyHash });
  }
  write(root, 'package-manifest.json', `${JSON.stringify(manifest, null, 2)}\n`);
  assert.equal(validatePackage(root).valid, true);
  const overflowPath = 'limit/overflow.txt';
  write(root, overflowPath, '');
  manifest.files.push({ path: overflowPath, role: 'adapter', sha256: emptyHash });
  write(root, 'package-manifest.json', `${JSON.stringify(manifest, null, 2)}\n`);
  assert.throws(() => validatePackage(root), /at most 5000 files/);
  const oversized = clone('size limit');
  write(oversized, 'oversized.dat', '');
  truncateSync(join(oversized, 'oversized.dat'), 200_000_001);
  assert.throws(() => validatePackage(oversized), /must not exceed 200 MB/);
});
