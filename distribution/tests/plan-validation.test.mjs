import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdirSync, mkdtempSync, readFileSync, realpathSync, rmSync, writeFileSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { formatReport, functional, listPlans, validate } from '../../prompts/hard_points/system/plan-validation/validate.mjs';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
const fixtures = join(root, 'distribution/tests/fixtures/plan-validation');
const engine = join(root, 'prompts/hard_points/system/plan-validation/validate.mjs');
const search = readFileSync(join(fixtures, 'search.md'), 'utf8').replace(/\r\n/g, '\n');
const analyse = readFileSync(join(fixtures, 'analyse.md'), 'utf8').replace(/\r\n/g, '\n');
const status = (result, id) => result.checks.find(c => c.id === id)?.status;

test('search validates valid fixtures and compiles regexes instead of confusing no match with invalid syntax', () => {
  const result = validate('search', search, 'plan.md');
  assert.equal(result.checks.some(c => c.status !== 'pass'), false);
  const invalid = validate('search', search.replace('^import\\s+(.+)', '^import('), 'plan.md');
  assert.equal(status(invalid, 'regex:imports:1'), 'error');
  assert.match(formatReport(invalid), /NON-COMPLIANT/);
});

test('undeclared and non-JS dialects are not declared invalid by JavaScript', () => {
  for (const dialect of ['grep', '']) {
    const source = search.replace('```regex javascript', `\`\`\`regex${dialect ? ` ${dialect}` : ''}`).replace('^import\\s+(.+)', '^(?|a(b)|c(d))');
    const result = validate('search', source, 'plan.md');
    const check = result.checks.find(c => c.id === 'regex:imports:1');
    assert.equal(check.status, 'warning');
    assert.match(check.message, /JavaScript syntax incompatible; .* dialect validity unknown/);
  }
  const unknown = validate('search', search.replace('```regex javascript', '```regex'), 'plan.md');
  assert.match(unknown.checks.find(c => c.id === 'regex:imports:1').message, /JavaScript syntax compatible; undeclared dialect validity unknown/);
});

test('declared PCRE2 uses its compiler when available without treating missing tooling as invalid', () => {
  const pcre = search.replace('```regex javascript', '```regex pcre').replace('^import\\s+(.+)', '^(?|a(b)|c(d))');
  const valid = validate('search', pcre, 'plan.md').checks.find(c => c.id === 'regex:imports:1');
  assert.notEqual(valid.status, 'error');
  assert.match(valid.message, /JavaScript syntax incompatible; (valid PCRE2 syntax|pcre dialect validity unknown)/);
  const invalid = validate('search', pcre.replace('^(?|a(b)|c(d))', '('), 'plan.md').checks.find(c => c.id === 'regex:imports:1');
  assert.ok(['error', 'warning'].includes(invalid.status));
  assert.match(invalid.message, /invalid PCRE2 syntax|validity unknown/);
});

test('fenced example headings cannot satisfy missing real sections', () => {
  const text = search.replace('## Extension Strategy\nFollow imports.\n', '')
    .replace('## file.js', '## Extension Strategy');
  assert.equal(status(validate('search', text, 'plan.md'), 'section:Extension Strategy'), 'warning');
});

test('header is validated separately from example content and dates are real', () => {
  const text = search.replace('2026-01-01', '2026-02-30');
  assert.equal(status(validate('search', text, 'plan.md'), 'header'), 'error');
  const noHeader = search.replace(/> \*\*Version\*\*.*\n/, '');
  assert.equal(status(validate('search', `${noHeader}\n> **Version**: 1.0 | **Date**: 2026-01-01 | **Type**: Search Plan`, 'plan.md'), 'header'), 'error');
});

test('analysis accepts documented aliases and detects missing prompts and diagram', () => {
  const result = validate('analyse', analyse, 'plan-standard.md');
  assert.equal(result.checks.some(c => c.status === 'error'), false);
  assert.equal(status(validate('analyse', analyse.replace('Depth**: 2', 'Depth**: 1'), 'plan-survol.md'), 'filename:depth'), 'pass');
  assert.equal(status(validate('analyse', analyse.replace('Depth**: 2', 'Depth**: 3'), 'plan-approfondi.md'), 'filename:depth'), 'pass');
  const alternate = analyse.replace('Depth**: 2', 'Profondeur**: 4').replace('Full Workflow', 'Complete Workflow');
  assert.equal(status(validate('analyse', alternate, 'plan-expert.md'), 'header'), 'pass');
  assert.equal(status(validate('analyse', alternate, 'plan-expert.md'), 'workflow:mermaid'), 'pass');
  assert.equal(status(validate('analyse', analyse.replace('**Specialized prompt**:', '**Prompt**:'), 'plan-standard.md'), 'agent:prompts'), 'error');
  assert.equal(status(validate('analyse', analyse.replace('```mermaid', '```text'), 'plan-standard.md'), 'workflow:mermaid'), 'error');
});

test('real fallback plans list deterministically and return honest diagnostics', () => {
  assert.ok(listPlans(root, 'search').includes('plan-generic.md'));
  assert.ok(listPlans(root, 'analyse').includes('plan-survol.md'));
  const real = readFileSync(join(root, 'prompts/hard_points/system/search/plans/plan-generic.md'), 'utf8');
  const result = validate('search', real, 'plan-generic.md');
  assert.equal(status(result, 'language'), 'warning');
  assert.equal(status(result, 'patterns:imports'), 'pass');
  const terraform = readFileSync(join(root, 'prompts/hard_points/system/search/plans/terraform/plan.md'), 'utf8');
  assert.equal(status(validate('search', terraform, 'terraform/plan.md'), 'method'), 'pass');
  assert.equal(formatReport(result), formatReport(result));
});

test('functional test only counts requested literal extensions within explicit scope', () => {
  const result = functional(fixtures, ['*.md', '*.js']);
  assert.equal(result.counts['*.md'], 2);
  assert.equal(result.counts['*.js'], 0);
  assert.ok(result.exclusions.includes('node_modules'));
});

test('CLI project counts obey nested Git ignore rules and negations outside a repository', t => {
  const project = mkdtempSync(join(realpathSync(tmpdir()), 'aikido-plan-validation-'));
  t.after(() => rmSync(project, { recursive: true, force: true }));
  const put = (path, contents = '') => {
    const file = join(project, path);
    mkdirSync(dirname(file), { recursive: true });
    writeFileSync(file, contents);
  };
  put('.gitignore', '*.js\n!keep.js\n!special \\[x].js\n!space name.js\nblocked/\n!blocked/keep.js\nreopened/*\n!reopened/visible/\n');
  put('ignore.js');
  put('keep.js');
  put('special [x].js');
  put('space name.js');
  put('blocked/keep.js');
  put('reopened/hidden/keep.js');
  put('reopened/visible/keep.js');
  put('nested/.gitignore', '*.js\n!keep.js\n');
  put('nested/ignored.js');
  put('nested/keep.js');
  put('nested/deep/.gitignore', '*.js\n!keep.js\n');
  put('nested/deep/ignored.js');
  put('nested/deep/keep.js');
  put('node_modules/keep.js');
  put('custom-user-data/store.json', '{"schemaVersion":"task-store/1"}');
  put('custom-user-data/events/private.js', 'const PRIVATE_TASK_CANARY = true;');

  const oracle = mkdtempSync(join(realpathSync(tmpdir()), 'aikido-plan-oracle-'));
  t.after(() => rmSync(oracle, { recursive: true, force: true }));
  const emptyGlobalConfig = join(oracle, 'empty.gitconfig');
  writeFileSync(emptyGlobalConfig, '');
  const gitEnv = Object.fromEntries(Object.entries(process.env).filter(([key]) => !key.toUpperCase().startsWith('GIT_')));
  gitEnv.GIT_CONFIG_NOSYSTEM = '1';
  gitEnv.GIT_CONFIG_GLOBAL = emptyGlobalConfig;
  const repository = spawnSync('git', ['-C', project, 'rev-parse', '--is-inside-work-tree'], { encoding: 'utf8', env: gitEnv });
  assert.equal(repository.status, 128, 'The fixture must be outside any Git repository');
  const bare = join(oracle, 'git');
  const init = spawnSync('git', ['init', '--bare', '--quiet', '--template=', bare], { encoding: 'utf8', env: gitEnv });
  assert.equal(init.status, 0, init.stderr);
  for (const [path, ignored] of [
    ['keep.js', false], ['special [x].js', false], ['space name.js', false],
    ['reopened/visible/keep.js', false], ['nested/keep.js', false], ['nested/deep/keep.js', false],
    ['ignore.js', true], ['blocked/keep.js', true], ['reopened/hidden/keep.js', true],
    ['nested/ignored.js', true], ['nested/deep/ignored.js', true],
  ]) {
    const result = spawnSync('git', [`--git-dir=${bare}`, `--work-tree=${project}`,
      'check-ignore', '--no-index', '--', path], { encoding: 'utf8', env: gitEnv });
    assert.equal(result.status, ignored ? 0 : 1, `Git oracle: ${path}: ${result.stderr}`);
  }
  for (const kind of ['search', 'analyse']) {
    const plan = join(fixtures, `${kind}.md`);
    const result = spawnSync(process.execPath, [engine, kind, 'validate', plan, '--project', project], { cwd: root, encoding: 'utf8' });
    assert.equal(result.status, 0, result.stderr);
    assert.match(result.stdout, /Git evaluates project \.gitignore rules/);
    assert.match(result.stdout, /- \*\.js: 6(?:\r?\n|$)/);
    assert.match(result.stdout, /fixed exclusions: .*node_modules/);
    assert.doesNotMatch(result.stdout, /PRIVATE_TASK_CANARY|custom-user-data/);
  }
});

test('CLI project fails closed when Git is unavailable', t => {
  const project = mkdtempSync(join(realpathSync(tmpdir()), 'aikido-plan-validation-'));
  t.after(() => rmSync(project, { recursive: true, force: true }));
  const result = spawnSync(process.execPath, [engine, 'search', 'validate', join(fixtures, 'search.md'), '--project', project], {
    cwd: root, encoding: 'utf8', env: { ...process.env, PATH: '' },
  });
  assert.equal(result.status, 2);
  assert.match(result.stderr, /Git execution failed/);
  assert.doesNotMatch(result.stdout, /Optional scoped functional test/);
});

test('CLI validates custom absolute paths and returns distinct failure codes', () => {
  const run = (...args) => spawnSync(process.execPath, [engine, ...args], { cwd: root, encoding: 'utf8' });
  assert.equal(run('search', 'validate', join(fixtures, 'search.md')).status, 0);
  assert.equal(run('analyse', 'validate', join(fixtures, 'search.md')).status, 1);
  assert.equal(run('search', 'validate', join(fixtures, 'missing.md')).status, 2);
  assert.equal(run('search', 'validate', join(fixtures, 'search.md'), '--report').status, 2);
});
