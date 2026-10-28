import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, symlinkSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import test from 'node:test';
import { extractCommands, frontMatter, parseArgs, parseCfg, run } from './skill-manage.mjs';

const git = (cwd, ...args) => execFileSync('git', ['-c', 'user.name=t', '-c', 'user.email=t@example.com', ...args], { cwd, stdio: 'pipe' });

function write(root, path, text) {
  const file = join(root, path);
  mkdirSync(join(file, '..'), { recursive: true });
  writeFileSync(file, text);
}

function makeRepo(files) {
  const root = mkdtempSync(join(tmpdir(), 'skm-repo-'));
  git(root, 'init', '-q', '-b', 'main');
  for (const [path, text] of Object.entries(files)) write(root, path, text);
  git(root, 'add', '-A');
  git(root, 'commit', '-qm', 'init');
  return root;
}

const skillMd = (name, extra = '') => `---\nname: ${name}\ndescription: ${name} skill\n---\n\n# ${name}\n\n## Available Commands\n\n- \`/${name}-run\` – run\n${extra}`;

function setup(t) {
  const external = makeRepo({
    'skills/ext-one/SKILL.md': skillMd('ext-one'),
    'skills/ext-one/run.sh': '#!/bin/sh\necho hi\n',
  });
  const catalogRepo = makeRepo({
    'catalog.json': JSON.stringify({ schemaVersion: 1, skills: [
      { name: 'demo', description: 'Demo skill', version: '1.0.0', category: 'example', path: 'skills/demo' },
      { name: 'evil', description: 'Bad path', version: '1.0.0', category: 'x', path: '../outside' },
    ] }),
    'sources.json': JSON.stringify({ schemaVersion: 1, sources: [
      { id: 'ext', repo: external, ref: 'main', layout: 'skills-dir', roots: ['skills'], trust: 'third-party' },
    ] }),
    'skills/demo/SKILL.md': skillMd('demo'),
    'skills/demo/data.txt': 'payload\n',
  });
  const workspace = mkdtempSync(join(tmpdir(), 'skm-ws-'));
  const cfg = join(workspace, 'skills.cfg');
  writeFileSync(cfg, `GIT_GROUP=${catalogRepo}\nGIT_DEFAULT_BRANCH=main\nTARGET_DIR=skills-out\nON_CONFLICT=update\n`);
  t.after(() => [external, catalogRepo, workspace].forEach((dir) => rmSync(dir, { recursive: true, force: true })));
  const call = (...args) => run([...args, '--cfg', cfg, '--repo-root', workspace], {});
  return { call, workspace, catalogRepo };
}

test('parsers handle config, arguments, front matter and commands', () => {
  assert.deepEqual(parseCfg('# c\nA=1\nB="two"\n'), { A: '1', B: 'two' });
  assert.deepEqual(parseArgs(['get', '--name', 'x', '--dry-run']).options, { name: 'x', 'dry-run': true });
  assert.throws(() => parseArgs(['get', '--name']), /requires a value/);
  assert.equal(frontMatter('---\nname: a\ndescription: "d"\n---\n').description, 'd');
  assert.deepEqual(extractCommands(skillMd('demo')), ['demo-run']);
});

test('get installs a catalog skill with provenance and refuses unsafe input', (t) => {
  const { call, workspace } = setup(t);
  assert.equal(call('get', '--name', 'demo', '--dry-run').status, 'dry_run');
  assert.equal(existsSync(join(workspace, 'skills-out/demo')), false);

  const result = call('get', '--name', 'demo');
  assert.equal(result.status, 'installed');
  assert.deepEqual(result.commands, ['demo-run']);
  assert.equal(readFileSync(join(workspace, 'skills-out/demo/data.txt'), 'utf8'), 'payload\n');
  assert.equal(existsSync(join(workspace, 'skills-out/demo/.git')), false);
  const provenance = JSON.parse(readFileSync(join(workspace, 'skills-out/demo/.aikido-source.json'), 'utf8'));
  assert.equal(provenance.source, 'catalog');
  assert.equal(provenance.version, '1.0.0');

  assert.throws(() => call('get', '--name', '../etc'), /Invalid skill name/);
  assert.throws(() => call('get', '--name', 'evil'), /unsafe path/);
  assert.throws(() => call('get', '--name', 'missing'), /not found/i);
  assert.throws(() => run(['get', '--name', 'demo', '--group', 'ext::sh -c id', '--repo-root', workspace], {}), /Repository URL/);
  assert.throws(() => run(['get', '--name', 'demo', '--group', 'http://example.com/x.git', '--repo-root', workspace], {}), /Repository URL/);
  assert.throws(() => run(['get', '--name', 'demo', '--target', '../escape', '--repo-root', workspace, '--cfg', join(workspace, 'skills.cfg')], {}), /sub-directory/);
});

test('reinstalling backs up the previous copy; update reports up_to_date', (t) => {
  const { call, workspace } = setup(t);
  call('get', '--name', 'demo');
  assert.equal(call('update', '--name', 'demo').status, 'up_to_date');
  write(workspace, 'skills-out/demo/local.txt', 'local edit');
  const again = call('get', '--name', 'demo');
  assert.equal(again.status, 'installed');
  assert.match(again.backup, /\.backups\/demo-/);
  assert.equal(existsSync(join(workspace, again.backup, 'local.txt')), true);
  assert.equal(existsSync(join(workspace, 'skills-out/demo/local.txt')), false);
  assert.equal(call('get', '--name', 'demo', '--on-conflict', 'skip', '--force').status, 'installed');
  assert.equal(call('get', '--name', 'demo', '--on-conflict', 'skip').status, 'skipped');
});

test('unmanaged or foreign directories are never overwritten silently', (t) => {
  const { call, workspace } = setup(t);
  write(workspace, 'skills-out/demo/SKILL.md', skillMd('demo'));
  assert.equal(call('get', '--name', 'demo').status, 'conflict');
  assert.equal(call('get', '--name', 'demo', '--force').status, 'installed');
  assert.throws(() => call('update', '--name', 'nothing'), /not installed|not managed/i);
});

test('external skills require third-party confirmation and expose scripts', (t) => {
  const { call, workspace } = setup(t);
  const found = call('search', '--query', 'ext', '--source', 'all');
  assert.deepEqual(found.external.map((s) => s.name), ['ext-one']);
  const pending = call('get', '--name', 'ext-one', '--source', 'ext');
  assert.equal(pending.status, 'confirmation_required');
  assert.deepEqual(pending.scripts, ['run.sh']);
  assert.equal(existsSync(join(workspace, 'skills-out/ext-one')), false);
  const done = call('get', '--name', 'ext-one', '--source', 'ext', '--confirm-third-party');
  assert.equal(done.status, 'installed');
  assert.equal(done.source, 'ext');
  assert.equal(call('update', '--name', 'ext-one').status, 'up_to_date');
  assert.throws(() => call('get', '--name', 'ext-one', '--source', 'nope'), /Unknown source/);
});

test('symbolic links in a skill are refused', (t) => {
  const { call, workspace } = setup(t);
  const repo = makeRepo({ 'skills/linked/SKILL.md': skillMd('linked') });
  symlinkSync('/etc/hosts', join(repo, 'skills/linked/hosts'));
  git(repo, 'add', '-A');
  git(repo, 'commit', '-qm', 'link');
  t.after(() => rmSync(repo, { recursive: true, force: true }));
  write(workspace, 'bad.cfg', '');
  const catalog = makeRepo({ 'catalog.json': JSON.stringify({ schemaVersion: 1, skills: [] }) });
  t.after(() => rmSync(catalog, { recursive: true, force: true }));
  write(catalog, 'sources.json', JSON.stringify({ sources: [{ id: 'l', repo: repo, ref: 'main', layout: 'skills-dir', roots: ['skills'], trust: 'third-party' }] }));
  git(catalog, 'add', '-A');
  git(catalog, 'commit', '-qm', 's');
  assert.throws(() => run(['get', '--name', 'linked', '--source', 'l', '--confirm-third-party', '--group', catalog, '--target', 'out', '--repo-root', workspace, '--cfg', join(workspace, 'bad.cfg')], {}), /Symbolic link/);
  assert.equal(existsSync(join(workspace, 'out/linked')), false);
  assert.equal(call('list').skills.length, 0);
});

test('list, search and uninstall (backup or purge) behave deterministically', (t) => {
  const { call, workspace } = setup(t);
  call('get', '--name', 'demo');
  write(workspace, '.claude/commands/demo-run.md', 'mapping');
  assert.deepEqual(call('list').skills.map((s) => [s.name, s.managed]), [['demo', true]]);
  const remote = call('search', '--query', 'demo', '--scope', 'remote');
  assert.equal(remote.catalog[0].installed, true);
  assert.equal(call('uninstall', '--name', 'demo', '--dry-run').mappings[0], '.claude/commands/demo-run.md');
  const removed = call('uninstall', '--name', 'demo');
  assert.equal(removed.status, 'uninstalled');
  assert.equal(existsSync(join(workspace, removed.backup, 'SKILL.md')), true);
  call('get', '--name', 'demo');
  call('uninstall', '--name', 'demo', '--purge');
  assert.equal(existsSync(join(workspace, 'skills-out/.backups')) && existsSync(join(workspace, removed.backup)), false);
  assert.throws(() => call('uninstall', '--name', 'demo'), /not installed/i);
});

test('the token never appears in output', (t) => {
  const { workspace } = setup(t);
  const out = run(['config', '--repo-root', workspace, '--cfg', join(workspace, 'skills.cfg')], { AIKIDO_GIT_TOKEN: 'secret-token' });
  assert.equal(out.token, '****');
  assert.equal(JSON.stringify(out).includes('secret-token'), false);
});
