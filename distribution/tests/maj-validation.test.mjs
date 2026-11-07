import { test } from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { copyFileSync, mkdirSync, mkdtempSync, readFileSync, readdirSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { criticalPaths, prepareValidation, analyzeSummary } from '../../prompts/hard_points/system/maj/scripts/ending-6-validation.mjs';

const scripts = fileURLToPath(new URL('../../prompts/hard_points/system/maj/scripts/', import.meta.url));
const plan = fileURLToPath(new URL('../../prompts/hard_points/system/maj/plans/plan-ending-6.md', import.meta.url));
function fixture(t) {
  const root = mkdtempSync(join(tmpdir(), 'aikido-validation-test-'));
  t.after(() => rmSync(root, { recursive: true, force: true }));
  return root;
}

test('preparation and analysis use isolated run directories and explicit statuses', t => {
  const root = fixture(t);
  assert.equal(criticalPaths(root).filter(item => item.exists).length, 0);
  assert.equal(prepareValidation(root, root), null);
  const agentDir = join(root, 'prompts/hard_points/agents');
  mkdirSync(agentDir, { recursive: true });
  writeFileSync(join(agentDir, 'agent-aikido-validator.md'), 'fixture');
  const a = prepareValidation(root, root);
  const b = prepareValidation(root, root);
  assert.notEqual(a.directory, b.directory);
  assert.match(readFileSync(join(a.directory, 'context.md'), 'utf8'), /summary\.txt/);
  assert.equal(analyzeSummary('MANUAL'), 'MANUAL');
  assert.equal(analyzeSummary(a.directory), 'UNKNOWN');
  writeFileSync(join(a.directory, 'summary.txt'), 'OK\n');
  assert.equal(analyzeSummary(a.directory), 'UNKNOWN');
  writeFileSync(join(a.directory, 'report.md'), 'report');
  writeFileSync(join(a.directory, 'summary.txt'), 'NOT OK\n');
  assert.equal(analyzeSummary(a.directory), 'UNKNOWN');
  writeFileSync(join(a.directory, 'summary.txt'), 'OK\nKO\n');
  assert.equal(analyzeSummary(a.directory), 'UNKNOWN');
  writeFileSync(join(a.directory, 'summary.txt'), 'OK\n');
  assert.equal(analyzeSummary(a.directory), 'OK');
  assert.equal(analyzeSummary(b.directory), 'UNKNOWN');
  writeFileSync(join(a.directory, 'summary.txt'), 'KO\n');
  assert.equal(analyzeSummary(a.directory), 'KO');
  assert.throws(() => analyzeSummary(join(root, 'absent')), /ENOENT/);
});

test('Node output has a single status and rejects unknown directory', t => {
  const root = fixture(t);
  const engine = join(scripts, 'ending-6-validation.mjs');
  const unknown = spawnSync(process.execPath, [engine, 'analyze', root], { encoding: 'utf8' });
  assert.equal(unknown.status, 0, unknown.stderr);
  assert.equal(unknown.stdout, 'UNKNOWN\n');
  const manual = spawnSync(process.execPath, [engine, 'analyze', 'MANUAL'], { encoding: 'utf8' });
  assert.equal(manual.stdout, 'MANUAL\n');
  const invalid = spawnSync(process.execPath, [engine, 'analyze', join(root, 'absent')], { encoding: 'utf8' });
  assert.equal(invalid.status, 1);
  assert.match(invalid.stderr, /failed/);
  const missing = spawnSync(process.execPath, [engine, 'analyze'], { encoding: 'utf8' });
  assert.equal(missing.status, 1);
  assert.match(missing.stderr, /is required/);
});

test('ending-6 plan preserves unknown and manual statuses instead of declaring success', t => {
  const root = fixture(t);
  const text = readFileSync(plan, 'utf8');
  assert.doesNotMatch(text, /```(?:bash|sh|shell|zsh)/);
  assert.match(text, /Preserve `UNKNOWN`/);
  assert.match(text, /leave the outcome as manual/);
  const manual = spawnSync(process.execPath, [join(scripts, 'ending-6-validation.mjs'), 'prepare', root], { encoding: 'utf8' });
  assert.equal(manual.status, 0, manual.stderr);
  assert.equal(manual.stdout, 'MANUAL\n');
});

test('ending-6 plan uses actual Node engines and keeps manual validation explicit', t => {
  const root = fixture(t);
  const source = join(root, 'project');
  const destination = join(source, 'prompts/hard_points/system/maj/scripts');
  mkdirSync(destination, { recursive: true });
  for (const name of ['ending-6-validation.mjs', 'ending-1-report-state.mjs', 'create-log.mjs']) {
    copyFileSync(join(scripts, name), join(destination, name));
  }
  const text = readFileSync(plan, 'utf8');
  assert.doesNotMatch(text, /```(?:bash|sh|shell|zsh)/);
  const cli = (engine, ...args) => spawnSync(process.execPath, [join(destination, engine), ...args], {
    cwd: root, encoding: 'utf8',
  });
  const preparation = cli('ending-6-validation.mjs', 'prepare', source);
  assert.equal(preparation.status, 0, preparation.stderr);
  assert.equal(preparation.stdout, 'MANUAL\n');
  const status = cli('ending-6-validation.mjs', 'analyze', 'MANUAL');
  assert.equal(status.status, 0, status.stderr);
  assert.equal(status.stdout, 'MANUAL\n');
  const critical = cli('ending-6-validation.mjs', 'list', source);
  assert.equal(critical.status, 0, critical.stderr);
  const log = cli('create-log.mjs', join(source, 'prompts/spec/logs/phase-6-test.log'),
    'Plan Ending-6 : Final Compliance Validation', 'Status: MANUAL; Validation directory or mode: MANUAL');
  assert.equal(log.status, 0, log.stderr);
  const logs = join(source, 'prompts/spec/logs');
  assert.equal(readdirSync(logs).length, 1);
  assert.match(readFileSync(join(logs, readdirSync(logs)[0]), 'utf8'), /Status: MANUAL/);
});
