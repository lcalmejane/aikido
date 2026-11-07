import { test } from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { copyFileSync, mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { validateStructure } from '../../prompts/hard_points/system/maj/scripts/validate-structure.mjs';
import { diagnostic } from '../../prompts/hard_points/system/maj/scripts/ending-4-diagnostic-structure.mjs';

const scripts = fileURLToPath(new URL('../../prompts/hard_points/system/maj/scripts/', import.meta.url));
function fixture(t) {
  const root = mkdtempSync(join(tmpdir(), 'aikido-validate-'));
  t.after(() => rmSync(root, { recursive: true, force: true }));
  return root;
}
function file(root, path) {
  const target = join(root, path);
  mkdirSync(dirname(target), { recursive: true });
  writeFileSync(target, 'fixture');
}
function common(root) {
  for (const path of ['prompts/index.md', 'prompts/hard_points/ai-kido.md', 'AGENTS.md']) file(root, path);
}

test('validates mono and multi with exact required paths', t => {
  const root = fixture(t);
  common(root);
  assert.throws(() => validateStructure(root), /could not be detected/);
  assert.deepEqual(validateStructure(root, 'mono').missing, ['prompts/gen/index.md']);
  file(root, 'prompts/gen/index.md');
  assert.equal(validateStructure(root).type, 'mono');
  assert.equal(validateStructure(root).valid, true);
  mkdirSync(join(root, 'prompts/project with spaces'));
  const multi = validateStructure(root, 'multi');
  assert.deepEqual(multi.projects, ['project with spaces']);
  assert.deepEqual(multi.missing, ['prompts/project with spaces/index.md']);
  file(root, 'prompts/project with spaces/index.md');
  assert.equal(validateStructure(root, 'multi').valid, true);
  assert.throws(() => validateStructure(root, 'invalid'), /Invalid project type/);
});

test('JSON CLI has typed arrays and distinguishes invalid structure and arguments', t => {
  const root = fixture(t);
  common(root);
  const engine = join(scripts, 'validate-structure.mjs');
  const run = (...args) => spawnSync(process.execPath, [engine, ...args], { cwd: root, encoding: 'utf8' });
  const invalid = run('--type', 'mono', '--json');
  assert.equal(invalid.status, 1, invalid.stderr);
  assert.deepEqual(JSON.parse(invalid.stdout).missing, ['prompts/gen/index.md']);
  file(root, 'prompts/gen/index.md');
  const valid = run('--type', 'mono', '--json');
  assert.equal(valid.status, 0, valid.stderr);
  assert.deepEqual(JSON.parse(valid.stdout).missing, []);
  assert.equal(run('--type', 'MONO').status, 2);
  assert.equal(run('--type').status, 2);
  assert.equal(run('--version', '1.3').status, 2);
});

test('ending-4 uses real validator with correct cwd, type and failure code', t => {
  const root = fixture(t);
  const destination = join(root, 'prompts/hard_points/system/maj/scripts');
  mkdirSync(destination, { recursive: true });
  for (const name of ['ending-4-run-validation.mjs', 'validate-structure.mjs', 'ending-1-report-state.mjs']) {
    copyFileSync(join(scripts, name), join(destination, name));
  }
  common(root);
  const run = type => spawnSync(process.execPath, [join(destination, 'ending-4-run-validation.mjs'), root, type],
    { cwd: tmpdir(), encoding: 'utf8' });
  const invalid = run('MONO');
  assert.equal(invalid.status, 1, invalid.stderr);
  assert.match(invalid.stderr, /prompts\/gen\/index.md/);
  file(root, 'prompts/gen/index.md');
  const valid = run('MONO');
  assert.equal(valid.status, 0, valid.stderr);
  assert.match(valid.stdout, /VALIDATION SUCCESSFUL/);
  assert.equal(run('INVALID').status, 2);
});

test('diagnostic reports missing and optional paths and multiple project indexes', t => {
  const root = fixture(t);
  common(root);
  file(root, 'prompts/project A/index.md');
  const result = diagnostic(root, 'MULTI');
  assert.deepEqual(result.projects, ['prompts/project A/index.md']);
  assert.deepEqual(result.paths.find(entry => entry.path === 'prompts/hard_points/ai-kido-light.md'), {
    path: 'prompts/hard_points/ai-kido-light.md', optional: true, present: false,
  });
  assert.equal(result.paths.find(entry => entry.path === 'prompts/spec').present, false);
  assert.throws(() => diagnostic(root, 'bad'), /Invalid project type/);
  assert.throws(() => diagnostic(join(root, 'missing'), 'MONO'), /ENOENT/);
});

test('diagnostic CLI reports errors and missing files', t => {
  const root = fixture(t);
  const engine = join(scripts, 'ending-4-diagnostic-structure.mjs');
  const run = (...args) => spawnSync(process.execPath, [engine, ...args], { encoding: 'utf8' });
  const result = run(root, 'MONO');
  assert.equal(result.status, 0, result.stderr);
  assert.match(result.stdout, /MISSING: prompts\/index.md/);
  const invalid = run(root, 'bad');
  assert.equal(invalid.status, 1);
  assert.match(invalid.stderr, /Invalid project type/);
});

test('validation launcher propagates validator errors and missing engine', t => {
  const root = fixture(t);
  const engine = join(scripts, 'ending-4-run-validation.mjs');
  const run = () => spawnSync(process.execPath, [engine, root, 'MONO'], { encoding: 'utf8' });
  const missing = run();
  assert.equal(missing.status, 2);
  assert.match(missing.stderr, /invocation failed/);
  const validator = join(root, 'prompts/hard_points/system/maj/scripts/validate-structure.mjs');
  mkdirSync(dirname(validator), { recursive: true });
  writeFileSync(validator, 'console.error("validator failed"); process.exitCode = 7;\n');
  const failed = run();
  assert.equal(failed.status, 7);
  assert.match(failed.stderr, /validator failed/);
  assert.match(failed.stdout, /VALIDATION FAILED \(code: 7\)/);
});
