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

const hosts = ['zoo-code', 'roo-code-legacy'];
const catalog = loadCatalog();
let workspace;
const packages = new Map();

before(() => {
  workspace = mkdtempSync(join(tmpdir(), 'aikido-roo-zoo-'));
  const output = join(workspace, 'build');
  buildDistribution({ outDir: output, sourceRevision: 'a'.repeat(40) });
  for (const host of hosts) {
    const packageRoot = join(workspace, `${host} extracted package`);
    cpSync(join(output, host), packageRoot, { recursive: true });
    packages.set(host, packageRoot);
  }
  rmSync(output, { recursive: true });
});

after(() => {
  if (workspace) rmSync(workspace, { recursive: true, force: true });
});

function write(root, path, contents) {
  mkdirSync(dirname(join(root, path)), { recursive: true });
  writeFileSync(join(root, path), contents);
}

function cli(host, script, args, expectedStatus = 0) {
  const root = packages.get(host);
  const result = spawnSync(process.execPath, [join(root, `scripts/${script}.mjs`), ...args], {
    cwd: root,
    encoding: 'utf8',
    timeout: 30_000,
  });
  assert.equal(result.error, undefined, result.error?.message);
  assert.equal(result.status, expectedStatus, `${result.stdout}\n${result.stderr}`);
  return JSON.parse(result.stdout);
}

function bootstrap(host, root, mode = 'STANDARD') {
  const packageRoot = packages.get(host);
  const args = ['--root', root, '--package', packageRoot, '--mode', mode];
  const plan = cli(host, 'bootstrap-plan', args);
  assert.equal(plan.ready, true, JSON.stringify(plan.conflicts));
  const installed = cli(host, 'bootstrap-plan', [...args, '--apply', '--confirm', plan.planId]);
  assert.equal(installed.status, 'installed');
}

for (const host of hosts) {
  test(`${host} generates a distinct, validated mode-and-command package`, () => {
    const root = packages.get(host);
    assert.equal(validatePackage(root).valid, true);
    const manifest = JSON.parse(readFileSync(join(root, 'package-manifest.json'), 'utf8'));
    assert.equal(manifest.host, host);
    assert.equal(manifest.files.filter((entry) => entry.role === 'command').length, catalog.commands.length);
    const modes = readFileSync(join(root, '.roomodes'), 'utf8');
    assert.equal(modes.match(/^  - slug: /gm).length, catalog.agents.length);
    assert.equal(modes.match(/^    description: /gm).length, catalog.agents.length);
    assert.match(readFileSync(join(root, '.roo/commands/init-aikido.md'), 'utf8'), /^# \/init-aikido/m);
    const readme = readFileSync(join(root, 'README.md'), 'utf8');
    assert.ok(readme.includes(host === 'zoo-code' ? 'maintained Zoo Code' : 'legacy'));
  });

  test(`${host} refuses foreign Roo files and preserves user integrations during removal`, () => {
    const conflicting = join(workspace, `${host} conflicting project`);
    mkdirSync(conflicting);
    write(conflicting, '.roomodes', 'customModes:\n  - slug: user-mode\n');
    write(conflicting, '.roo/commands/init-aikido.md', 'User-owned command.\n');
    write(conflicting, '.roo/mcp.json', '{"mcpServers":{"user":{}}}\n');
    const packageRoot = packages.get(host);
    const blocked = cli(host, 'bootstrap-plan', [
      '--root', conflicting, '--package', packageRoot, '--mode', 'STANDARD',
    ], 2);
    assert.equal(blocked.ready, false);
    assert.ok(blocked.conflicts.some((item) => item.target === '.roomodes'));
    assert.equal(readFileSync(join(conflicting, '.roomodes'), 'utf8'), 'customModes:\n  - slug: user-mode\n');
    assert.equal(readFileSync(join(conflicting, '.roo/commands/init-aikido.md'), 'utf8'), 'User-owned command.\n');
    assert.equal(existsSync(join(conflicting, 'prompts/hard_points')), false);

    const project = join(workspace, `${host} clean project`);
    mkdirSync(project);
    write(project, '.roo/mcp.json', '{"mcpServers":{"user":{}}}\n');
    write(project, '.roo/rules/custom.md', 'User instructions.\n');
    bootstrap(host, project);
    const generatedModes = readFileSync(join(project, '.roomodes'), 'utf8');
    assert.equal(generatedModes.match(/^  - slug: /gm).length, catalog.agents.length);
    assert.equal(readFileSync(join(project, '.roo/mcp.json'), 'utf8'), '{"mcpServers":{"user":{}}}\n');
    assert.equal(readFileSync(join(project, '.roo/rules/custom.md'), 'utf8'), 'User instructions.\n');

    const remove = cli(host, 'update-plan', ['--root', project, '--uninstall']);
    const result = cli(host, 'update-plan', [
      '--root', project, '--uninstall', '--apply', '--confirm', remove.planId,
    ]);
    assert.equal(result.status, 'uninstalled');
    assert.equal(readFileSync(join(project, '.roomodes'), 'utf8'), generatedModes);
    assert.equal(existsSync(join(project, '.roo/commands/init-aikido.md')), false);
    assert.equal(readFileSync(join(project, '.roo/mcp.json'), 'utf8'), '{"mcpServers":{"user":{}}}\n');
    assert.equal(readFileSync(join(project, '.roo/rules/custom.md'), 'utf8'), 'User instructions.\n');
  });
}
