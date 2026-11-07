import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdirSync, rmSync, symlinkSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { randomUUID } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import {
  detectJsFramework,
  detectLanguageFromExtension,
  detectModuleSystem,
  detectPhpFramework,
  detectTechnologies,
  detectTerraformProviders,
  extractFileMetadata,
  extractPhpUses,
  extractTerraformDependencies,
  findSensitiveTerraformFiles,
  hasTypeScript,
  listFiles,
  listTerraformModules,
  readScopedFile,
  resolveGenericImport,
  resolveTerraformModuleSource,
  search,
} from '../../prompts/hard_points/system/search/search-engine.mjs';

const repoRoot = fileURLToPath(new URL('../../', import.meta.url));
const fixtureParent = join(repoRoot, 'distribution/tests/.runtime-fixtures');

function fixture(t) {
  const base = join(fixtureParent, `search-engine-${randomUUID()}`);
  const root = join(base, 'project');
  mkdirSync(root, { recursive: true });
  t.after(() => rmSync(base, { recursive: true, force: true }));
  return { base, root };
}

function write(root, relativePath, contents) {
  const path = join(root, relativePath);
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, contents);
  return path;
}

test('file discovery stays in selected paths and respects exclusions and gitignore', t => {
  const { base, root } = fixture(t);
  write(root, '.gitignore', 'src/ignored.js\n');
  write(root, 'src/.gitignore', 'generated/\n');
  write(root, 'src/keep.js', 'export const found = true;');
  write(root, 'src/keep.min.js', 'minified');
  write(root, 'src/ignored.js', 'ignored');
  write(root, 'src/generated/hidden.js', 'ignored');
  write(root, 'node_modules/pkg/index.js', 'ignored');
  write(root, 'docs/readme.md', 'outside selected scope');
  write(base, 'outside.js', 'outside physical root');
  if (process.platform !== 'win32') symlinkSync(join(base, 'outside.js'), join(root, 'src/linked.js'));

  assert.deepEqual(listFiles({ root, paths: ['src'], language: 'javascript' }), ['src/keep.js']);
  assert.throws(() => listFiles({ root, paths: ['../outside.js'], language: 'javascript' }), /outside the search scope/);
  if (process.platform !== 'win32') {
    assert.throws(() => listFiles({ root, paths: ['src/linked.js'], language: 'javascript' }), /resolves outside/);
  }
});

test('custom Task Store roots never enter explicit or broad search results', t => {
  const { root } = fixture(t);
  write(root, 'src/public.js', 'export const publicResult = true;');
  write(root, 'custom-user-data/store.json', JSON.stringify({ schemaVersion: 'task-store/1' }));
  write(root, 'custom-user-data/cards/canary.js', 'const PRIVATE_TASK_CANARY = "do-not-index";');
  write(root, '.private/cards/canary.js', 'const PRIVATE_TASK_CANARY = "dot-private";');
  write(root, '.task-store/cards/canary.js', 'const PRIVATE_TASK_CANARY = "dot-task-store";');
  write(root, 'aikido/tasks/events/canary.js', 'const PRIVATE_TASK_CANARY = "aikido-tasks";');
  if (process.platform !== 'win32') symlinkSync(join(root, 'custom-user-data'), join(root, 'private-alias'));

  assert.deepEqual(listFiles({ root, paths: ['.'], language: 'javascript' }), ['src/public.js']);
  assert.throws(() => listFiles({
    root, paths: ['custom-user-data'], language: 'javascript',
  }), /Private Task Store paths cannot be searched/);
  assert.throws(() => listFiles({
    root, paths: ['.private'], language: 'javascript',
  }), /Private Task Store paths cannot be searched/);
  if (process.platform !== 'win32') assert.throws(() => listFiles({
    root, paths: ['private-alias'], language: 'javascript',
  }), /Private Task Store paths cannot be searched|Symbolic-link search scopes are not allowed/);
  assert.throws(() => readScopedFile({
    root, file: 'custom-user-data/cards/canary.js',
  }), /Private Task Store paths cannot be searched/);
  const result = search({
    root, paths: ['.'], language: 'javascript', query: 'PRIVATE_TASK_CANARY',
  });
  assert.equal(result.matches.length, 0);
  assert.doesNotMatch(JSON.stringify(result), /do-not-index/);
});

test('literal and regex search return line context, distinguish errors, and redact values', t => {
  const { root } = fixture(t);
  write(root, 'src/app.js', [
    '// authentication handler',
    'const ready = true;',
    'password = "never-disclose-this";',
    'export function authenticate() {}',
  ].join('\n'));

  const result = search({
    root,
    paths: ['src'],
    language: 'javascript',
    query: 'authentication',
    context: 2,
  });
  assert.equal(result.matches.length, 1);
  assert.equal(result.matches[0].line, 1);
  assert.match(result.matches[0].excerpt, /1: .*authentication/);
  assert.match(result.matches[0].excerpt, /3: password = \[REDACTED\]/);
  assert.doesNotMatch(JSON.stringify(result), /never-disclose-this/);
  assert.equal(search({ root, paths: ['src'], language: 'javascript', query: 'missing' }).matches.length, 0);
  assert.throws(() => search({ root, paths: ['src'], language: 'javascript', query: '[' , mode: 'regex' }), /Invalid regular expression/);
});

test('technology and JavaScript metadata use the selected project files', t => {
  const { root } = fixture(t);
  write(root, 'package.json', JSON.stringify({
    type: 'commonjs',
    devDependencies: { react: '^19.0.0' },
  }));
  write(root, 'tsconfig.json', '{"compilerOptions":{}}');
  write(root, 'src/main.ts', 'import { value } from "./helper";\nconst result = require("legacy");');
  write(root, 'src/helper.ts', 'export interface Result { value: string }\nexport function load() {}');

  assert.deepEqual(detectTechnologies({ root }), ['javascript', 'typescript']);
  assert.equal(detectModuleSystem({ root }), 'mixed');
  assert.equal(hasTypeScript({ root }), true);
  assert.equal(detectJsFramework({ root }), 'react');
  assert.equal(detectLanguageFromExtension('src/main.ts'), 'typescript');
  assert.deepEqual(extractFileMetadata({ root, file: 'src/helper.ts' }).interfaces, [
    { name: 'Result', line: 1 },
  ]);
});

test('generic import resolution confines candidates to the selected scope', t => {
  const { root } = fixture(t);
  write(root, 'src/main.js', '');
  write(root, 'src/helper.js', '');
  write(root, 'private/hidden.js', '');
  assert.equal(resolveGenericImport({
    root, paths: ['src'], importPath: './helper', currentFile: 'src/main.js',
  }), 'src/helper.js');
  assert.equal(resolveGenericImport({
    root, paths: ['src'], importPath: '../private/hidden', currentFile: 'src/main.js',
  }), null);
  assert.throws(() => resolveGenericImport({
    root, paths: ['src'], importPath: '../../../outside', currentFile: 'src/main.js',
  }), /outside the search scope/);
});

test('PHP helpers detect frameworks and ignore function/constant use imports', t => {
  const { root } = fixture(t);
  write(root, 'artisan', '');
  write(root, 'composer.json', '{"autoload":{}}');
  write(root, '.env', 'API_TOKEN=redacted-value');
  write(root, 'src/User.php', '<?php class User {}');
  write(root, 'src/User.cache.php', '<?php class CachedUser {}');
  write(root, 'vendor/framework/Framework.php', '<?php class Framework {}');
  assert.equal(detectPhpFramework({ root }), 'laravel');
  assert.deepEqual(listFiles({ root, language: 'php' }), ['.env', 'composer.json', 'src/User.php']);
  assert.deepEqual(extractFileMetadata({ root, file: 'src/User.php', language: 'php' }).classes, [
    { name: 'User', line: 1 },
  ]);
  assert.deepEqual(extractPhpUses([
    'use App\\Models\\User as UserModel;',
    'use function App\\Helpers\\format;',
    'use const App\\VERSION;',
  ].join('\n')), [{ name: 'App\\Models\\User', alias: 'UserModel', line: 1 }]);
});

test('Terraform analysis reports paths and metadata without exposing secrets or state', t => {
  const { root } = fixture(t);
  write(root, 'main.tf', [
    'provider "azurerm" {}',
    'resource "aws_instance" "web" {',
    '  region = var.region',
    '  id = aws_security_group.web.id',
    '  api_key = "never-disclose-this"',
    '}',
    'module "private" {',
    '  source = "git::https://user:password@host.invalid/repo?token=top-secret"',
    '}',
    'module "vpc" {',
    '  source = "registry.example/network/vpc"',
    '}',
  ].join('\n'));
  write(root, 'terraform.tfstate', '{"password":"state-secret"}');
  write(root, 'secrets.tfvars', 'api_key = "tfvars-secret"');

  assert.deepEqual(detectTerraformProviders({ root }), ['aws', 'azurerm']);
  assert.deepEqual(extractTerraformDependencies('var.region local.name module.vpc.id data.aws_ami.base.id aws_instance.web.id'), {
    variables: ['region'],
    locals: ['name'],
    modules: ['vpc.id'],
    data: ['aws_ami.base.id'],
    resources: ['aws_instance.web.id'],
  });
  assert.deepEqual(listTerraformModules({ root }).map(({ name, source }) => ({ name, source })), [
    { name: 'private', source: 'Remote module source (details omitted)' },
    { name: 'vpc', source: 'Registry module: registry.example/network/vpc' },
  ]);
  assert.deepEqual(findSensitiveTerraformFiles({ root }), ['main.tf']);
  const result = search({ root, language: 'terraform', query: 'api_key', context: 0 });
  assert.equal(result.matches.length, 1);
  assert.match(result.matches[0].excerpt, /api_key = \[REDACTED\]/);
  assert.doesNotMatch(JSON.stringify({ result, modules: listTerraformModules({ root }) }), /never-disclose|state-secret|tfvars-secret|top-secret|password@/);
  assert.throws(() => readScopedFile({ root, file: 'terraform.tfstate' }), /Sensitive infrastructure files/);
  assert.throws(() => resolveTerraformModuleSource('../outside', { root, file: 'main.tf' }), /outside the search scope/);
  assert.equal(resolveTerraformModuleSource('git::https://user:password@host.invalid/repo?token=top-secret', { root }), 'Remote module source (details omitted)');
});
