import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { mkdtempSync, mkdirSync, readFileSync, readdirSync, rmSync, symlinkSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { planBootstrap } from '../lib/bootstrap-plan.mjs';
import { loadCatalog, renderCatalogEntries } from '../lib/catalog.mjs';
import { loadManifest, readTemplate, render, selectTemplates } from '../lib/templates.mjs';

const manifest = loadManifest();
const tempProject = () => mkdtempSync(join(tmpdir(), 'aikido-plan-'));

test('plans all selected initial files without changing the project', () => {
  const root = tempProject();
  try {
    const before = readdirSync(root);
    const plan = planBootstrap({ root, mode: 'LIGHT', hosts: ['claude-code'], projectName: 'Example', aikidoVersion: '1.5.0' });
    assert.equal(plan.ready, true);
    assert.equal(plan.confirmationRequired, true);
    assert.equal(plan.applicationAvailable, false);
    assert.ok(plan.files.some((item) => item.target === 'prompts/index.md' && item.action === 'create'));
    assert.ok(plan.files.some((item) => item.target === 'CLAUDE.md' && item.action === 'create'));
    assert.deepEqual(readdirSync(root), before);
    assert.throws(() => planBootstrap({ root, mode: 'LIGHT', projectName: 'Example', aikidoVersion: 'latest' }), /semantic version/);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test('bootstrap list plans are generated from the catalog and selected host routes', () => {
  const root = tempProject();
  try {
    const plan = planBootstrap({
      root,
      mode: 'STANDARD',
      hosts: ['claude-code', 'codex'],
      projectName: 'Example',
      aikidoVersion: '1.5.0',
    });
    const template = selectTemplates(manifest, { mode: 'STANDARD', hosts: ['claude-code', 'codex'] })
      .find((item) => item.id === 'commands-list');
    const content = render(readTemplate(template), {
      PROJECT_NAME: 'Example',
      AIKIDO_VERSION: '1.5.0',
      ENTRIES: renderCatalogEntries('commands', { hosts: ['claude-code', 'codex'], catalog: loadCatalog() }),
    });
    const expectedHash = createHash('sha256').update(content).digest('hex');
    assert.equal(plan.files.find((item) => item.id === 'commands-list').contentHash, expectedHash);
    const rows = renderCatalogEntries('commands', { hosts: ['claude-code', 'codex'] });
    assert.match(rows, /Claude Code: \/aikido:init-aikido/);
    assert.match(rows, /Codex: \/init-aikido \(Skill\)/);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test('reports existing create-only files as keep-local and differing generated files as conflicts', () => {
  const root = tempProject();
  try {
    const selected = selectTemplates(manifest, { mode: 'STANDARD', hosts: [] });
    const index = selected.find((item) => item.target === 'prompts/index.md');
    const list = selected.find((item) => item.target === 'agents_list.md');
    mkdirSync(join(root, 'prompts'), { recursive: true });
    writeFileSync(join(root, index.target), 'User index\n');
    writeFileSync(join(root, list.target), 'User list\n');
    const plan = planBootstrap({ root, mode: 'STANDARD', projectName: 'Example', aikidoVersion: '1.5.0' });
    assert.equal(plan.files.find((item) => item.id === index.id).action, 'keep-local');
    assert.equal(plan.files.find((item) => item.id === list.id).action, 'conflict');
    assert.equal(plan.ready, false);
    assert.equal(readFileSync(join(root, index.target), 'utf8'), 'User index\n');
    assert.equal(readFileSync(join(root, list.target), 'utf8'), 'User list\n');
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test('reports a matching generated file as adoptable', () => {
  const root = tempProject();
  try {
    const selected = selectTemplates(manifest, { mode: 'STANDARD', hosts: [] });
    const list = selected.find((item) => item.target === 'agents_list.md');
    const content = render(readTemplate(list), {
      PROJECT_NAME: 'Example',
      AIKIDO_VERSION: '1.5.0',
      ENTRIES: renderCatalogEntries('agents', { catalog: loadCatalog() }),
    });
    writeFileSync(join(root, list.target), content);
    const plan = planBootstrap({ root, mode: 'STANDARD', projectName: 'Example', aikidoVersion: '1.5.0' });
    assert.equal(plan.files.find((item) => item.id === list.id).action, 'adopt');
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test('does not replace a differing managed block', () => {
  const root = tempProject();
  try {
    writeFileSync(join(root, 'AGENTS.md'), '<!-- aikido:begin id=core - managed by AI-KIDO, edit outside this block -->\nLocal block\n<!-- aikido:end id=core -->\n');
    const plan = planBootstrap({ root, mode: 'STANDARD', hosts: ['claude-code'], projectName: 'Example', aikidoVersion: '1.5.0' });
    assert.equal(plan.files.find((item) => item.id === 'agents-block').action, 'conflict');
    assert.match(plan.files.find((item) => item.id === 'agents-block').reason, /different content/);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test('blocks symlinked targets and invalid inputs', () => {
  const root = tempProject();
  const outside = tempProject();
  try {
    symlinkSync(outside, join(root, 'prompts'));
    const plan = planBootstrap({ root, mode: 'STANDARD', projectName: 'Example', aikidoVersion: '1.5.0' });
    assert.ok(plan.files.some((item) => item.action === 'blocked' && item.reason.includes('symlink')));
    assert.throws(() => planBootstrap({ root, mode: 'STANDARD', hosts: ['unknown'], projectName: 'Example', aikidoVersion: '1.5.0' }), /known host/);
    assert.throws(() => planBootstrap({ root, mode: 'INVALID', projectName: 'Example', aikidoVersion: '1.5.0' }), /Unknown mode/);
  } finally {
    rmSync(root, { recursive: true, force: true });
    rmSync(outside, { recursive: true, force: true });
  }
});
