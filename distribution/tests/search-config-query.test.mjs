import { test } from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { mkdirSync, rmSync, symlinkSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { randomUUID } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { query } from '../../prompts/hard_points/system/search/config-query.mjs';

const root = fileURLToPath(new URL('../../', import.meta.url));
const script = join(root, 'prompts/hard_points/system/search/config-query.mjs');
const fixtureParent = join(root, 'distribution/tests/.runtime-fixtures');

function fixture(t) {
  const dir = join(fixtureParent, `search-config-${randomUUID()}`);
  mkdirSync(dir, { recursive: true });
  t.after(() => rmSync(dir, { recursive: true, force: true }));
  return dir;
}

test('JSONC aliases preserve strings, support wildcards and baseUrl, and reject extends', t => {
  const dir = fixture(t);
  const file = join(dir, 'tsconfig.json');
  writeFileSync(file, `{
    // comment
    "compilerOptions": { "baseUrl": "src", "paths": {
      "@app/*": ["a/*", "b/*",], "https://x": ["literal//name"],
    }, },
  }`);
  assert.deepEqual(query('ts-paths', file, '@app/view'), [join(dir, 'src/a/view'), join(dir, 'src/b/view')]);
  assert.deepEqual(query('ts-paths', file, 'https://x'), [join(dir, 'src/literal/name')]);
  assert.deepEqual(query('ts-paths', file, '@missing'), []);
  writeFileSync(file, '{"extends":"./base","compilerOptions":{}}');
  assert.throws(() => query('ts-paths', file, 'x'), /Inherited tsconfig/);
  writeFileSync(file, '{"compilerOptions":{"paths":');
  assert.throws(() => query('ts-paths', file, 'x'), /Invalid JSON configuration/);
});

test('PSR-4 returns all directories and orders nested prefixes first', t => {
  const dir = fixture(t);
  const file = join(dir, 'composer.json');
  writeFileSync(file, JSON.stringify({ autoload: { 'psr-4': {
    'App\\': ['app/', 'alternate/'], 'App\\Models\\': 'models/', '': 'fallback/',
  } } }));
  assert.deepEqual(query('psr4-resolve', file, 'App\\Models\\User'), [
    join(dir, 'models/User.php'), join(dir, 'app/Models/User.php'),
    join(dir, 'alternate/Models/User.php'), join(dir, 'fallback/App/Models/User.php'),
  ]);
  assert.equal(query('psr4-list', file).length, 4);
});

test('package metadata and malformed JSON fail explicitly without disclosing contents', t => {
  const dir = fixture(t);
  const file = join(dir, 'package.json');
  writeFileSync(file, '{"type":"module","module":"mod.js"}');
  assert.deepEqual(query('package-type', file), ['esm']);
  assert.deepEqual(query('package-entry', file), ['mod.js']);
  writeFileSync(file, '{"secret":"never-echo-this",');
  assert.throws(() => query('package-type', file), error => {
    assert.match(error.message, /Invalid JSON configuration/);
    assert.doesNotMatch(error.message, /never-echo-this/);
    return true;
  });
  const result = spawnSync(process.execPath, [script, 'package-type', file], { encoding: 'utf8' });
  assert.equal(result.status, 1);
  assert.match(result.stderr, /Invalid JSON configuration/);
  assert.doesNotMatch(result.stderr, /never-echo-this/);
  assert.equal(result.stdout, '');
});

test('configuration candidates cannot escape their approved scope', t => {
  const dir = fixture(t);
  const outside = join(dirname(dir), `outside-${randomUUID()}`);
  mkdirSync(outside);
  t.after(() => rmSync(outside, { recursive: true, force: true }));
  const outsideConfig = join(fixtureParent, `search-config-outside-${randomUUID()}.json`);
  writeFileSync(outsideConfig, '{"type":"module","secret":"outside-value"}');
  t.after(() => rmSync(outsideConfig, { force: true }));
  if (process.platform !== 'win32') {
    symlinkSync(outsideConfig, join(dir, 'linked-package.json'));
    assert.throws(() => query('package-type', join(dir, 'linked-package.json')), /resolves outside/);
  }
  const file = join(dir, 'tsconfig.json');
  writeFileSync(file, '{"compilerOptions":{"paths":{"@x":["../outside"]}}}');
  assert.throws(() => query('ts-paths', file, '@x'), /outside the search scope/);
  writeFileSync(file, '{"compilerOptions":{"paths":{"@x":["escape/file"]}}}');
  if (process.platform !== 'win32') {
    symlinkSync(outside, join(dir, 'escape'), 'dir');
    assert.throws(() => query('ts-paths', file, '@x'), /resolves outside/);
  }
  const composer = join(dir, 'composer.json');
  writeFileSync(composer, '{"autoload":{"psr-4":{"App\\\\":"../outside"}}}');
  assert.throws(() => query('psr4-list', composer), /outside the search scope/);
  assert.throws(() => query('psr4-resolve', composer, 'App\\User'), /outside the search scope/);
});

test('import resolution refuses relative, package-entry and symlink escapes', t => {
  const dir = fixture(t);
  const outside = join(dirname(dir), `outside-${randomUUID()}`);
  mkdirSync(outside);
  t.after(() => rmSync(outside, { recursive: true, force: true }));
  const source = join(dir, 'main.js');
  assert.throws(() => query('esm-resolve', source, '../outside', dir), /outside the search scope/);
  const pkg = join(dir, 'node_modules/pkg');
  mkdirSync(pkg, { recursive: true });
  writeFileSync(join(pkg, 'package.json'), '{"main":"../../../outside.js"}');
  assert.throws(() => query('esm-resolve', source, 'pkg', dir), /outside the search scope/);
  if (process.platform !== 'win32') {
    symlinkSync(outside, join(dir, 'linked'), 'dir');
    assert.throws(() => query('esm-resolve', source, './linked/file.js', dir), /resolves outside/);
  }
});

test('relative ES module imports with an existing extension resolve as written', t => {
  const dir = fixture(t);
  const source = join(dir, 'main.js');
  writeFileSync(join(dir, 'file.js'), '');
  assert.deepEqual(query('esm-resolve', source, './file.js', dir), [join(dir, 'file.js')]);
});
