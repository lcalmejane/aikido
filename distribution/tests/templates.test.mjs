import { test } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readdirSync, statSync } from 'node:fs';
import { dirname, join, posix, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';
import { MODES, HOSTS } from '../lib/lock.mjs';
import {
  TEMPLATES_DIR, loadManifest, validateManifest, selectTemplates, placeholdersIn, render, readTemplate,
} from '../lib/templates.mjs';

const REPO = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const manifest = loadManifest();
const VALUES = { PROJECT_NAME: 'Demo', AIKIDO_VERSION: '1.5.0', ENTRIES: '' };

function walk(dir) {
  return readdirSync(dir).flatMap((name) => {
    const p = join(dir, name);
    return statSync(p).isDirectory() ? walk(p) : [p];
  });
}

test('manifest is valid and produces one file per target', () => {
  assert.deepEqual(validateManifest(manifest), []);
});

test('every template file is declared and every declared source exists', () => {
  const declared = new Set(manifest.templates.map((t) => t.source));
  const onDisk = walk(TEMPLATES_DIR)
    .map((p) => relative(TEMPLATES_DIR, p).split('\\').join('/'))
    .filter((p) => p !== 'manifest.json');
  assert.deepEqual([...declared].sort(), onDisk.sort());
});

test('templates only use declared placeholders, ENTRIES only in generated lists', () => {
  const declared = Object.keys(manifest.placeholders);
  for (const t of manifest.templates) {
    const used = placeholdersIn(readTemplate(t));
    for (const name of used) assert.ok(declared.includes(name), `${t.id} uses undeclared {{${name}}}`);
    assert.equal(used.includes('ENTRIES'), t.kind === 'generated', `${t.id}: ENTRIES placement`);
  }
});

test('render is strict about missing values', () => {
  assert.throws(() => render('{{PROJECT_NAME}} {{AIKIDO_VERSION}}', { PROJECT_NAME: 'x' }), /AIKIDO_VERSION/);
  assert.equal(render('a {{PROJECT_NAME}} b', { PROJECT_NAME: 'X' }), 'a X b');
});

test('each mode gets exactly one entry point that /init-aikido can classify', () => {
  for (const mode of MODES) {
    const entries = selectTemplates(manifest, { mode }).filter((t) => t.target === 'prompts/index.md');
    assert.equal(entries.length, 1, mode);
    const text = readTemplate(entries[0]);
    const standard = text.includes('hard_points/ai-kido.md');
    const light = text.includes('hard_points/ai-kido-light.md');
    assert.equal(standard, mode === 'STANDARD', `${mode}: STANDARD guide reference`);
    assert.equal(light, mode === 'LIGHT', `${mode}: LIGHT guide reference`);
    assert.equal(text.includes('AIKIDO_MODE: UNSET'), mode === 'UNSET', `${mode}: UNSET marker`);
  }
});

test('host-specific blocks are only selected for their hosts', () => {
  const claude = (hosts) => selectTemplates(manifest, { mode: 'STANDARD', hosts }).some((t) => t.id === 'claude-block');
  assert.equal(claude([]), false);
  assert.equal(claude(['codex']), false);
  assert.equal(claude(['claude-code']), true);
  assert.equal(claude(['claude-cowork', 'codex']), true);
  for (const h of HOSTS) assert.ok(selectTemplates(manifest, { mode: 'LIGHT', hosts: [h] }).length >= 13);
});

test('links in rendered templates resolve inside the bootstrapped project', () => {
  for (const mode of MODES) {
    const selected = selectTemplates(manifest, { mode, hosts: HOSTS });
    const targets = new Set(selected.map((t) => t.target));
    const exists = (p) => targets.has(p) || [...targets].some((t) => t.startsWith(`${p}/`))
      || (p.startsWith('prompts/hard_points') && existsSync(join(REPO, p)));
    for (const t of selected) {
      const text = render(readTemplate(t), VALUES);
      for (const [, link] of text.matchAll(/\]\(([^)\s]+)\)/g)) {
        if (/^[a-z]+:/.test(link) || link.startsWith('#')) continue;
        const base = t.kind === 'managed-block' || t.kind === 'generated' ? '' : posix.dirname(t.target);
        const resolved = posix.normalize(posix.join(base, link)).replace(/\/$/, '');
        assert.ok(exists(resolved), `${mode} ${t.id}: broken link ${link} -> ${resolved}`);
      }
    }
  }
});

test('templates carry no knowledge specific to the AI-KIDO repository', () => {
  for (const t of manifest.templates) {
    const text = readTemplate(t);
    assert.doesNotMatch(text, /AI-KIDO Best Practices|guideline-prompts|analyse-projet\.md/, t.id);
    assert.doesNotMatch(text, /LLM_TRACIBILITY=TRUE/, `${t.id}: tracing must be off by default`);
  }
});

test('no template source is excluded by the repository .gitignore', (t) => {
  const paths = manifest.templates.map((e) => relative(REPO, join(TEMPLATES_DIR, e.source)));
  const r = spawnSync('git', ['check-ignore', '--no-index', ...paths], { cwd: REPO, encoding: 'utf8' });
  if (r.error || r.status > 1) return t.skip('git unavailable or not a work tree');
  assert.equal(r.stdout.trim(), '', `ignored template sources would not be published:\n${r.stdout}`);
});
