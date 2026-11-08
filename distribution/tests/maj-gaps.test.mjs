import { test } from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { copyFileSync, mkdirSync, mkdtempSync, readFileSync, readdirSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { detectGaps, populationProposal } from '../../prompts/hard_points/system/maj/scripts/ending-7-gaps.mjs';

const scripts = fileURLToPath(new URL('../../prompts/hard_points/system/maj/scripts/', import.meta.url));
const plan = fileURLToPath(new URL('../../prompts/hard_points/system/maj/plans/plan-ending-7.md', import.meta.url));
function fixture(t) {
  const root = mkdtempSync(join(tmpdir(), 'aikido-gaps-'));
  t.after(() => rmSync(root, { recursive: true, force: true }));
  return root;
}

test('detects missing paths and distinguishes files from directories', (t) => {
  const root = fixture(t);
  assert.deepEqual([detectGaps(root).missingDirs.length, detectGaps(root).missingFiles.length], [8, 8]);
  mkdirSync(join(root, 'prompts/gen/concepts'), { recursive: true });
  writeFileSync(join(root, 'prompts/gen/index.md'), 'index');
  mkdirSync(join(root, 'agents_list.md'));
  const result = detectGaps(root);
  assert.equal(result.missingDirs.length, 7);
  assert.equal(result.missingFiles.length, 7);
  assert.ok(result.missingFiles.includes('agents_list.md'));
  assert.throws(() => detectGaps(join(root, 'absent')), /ENOENT/);
});

test('proposal validates counts and creates unique private context without changing project', (t) => {
  const root = fixture(t);
  const temp = join(root, 'owned-temp');
  assert.equal(populationProposal(root, 0, 0, temp).status, 'none');
  assert.equal(populationProposal(root, 1, 0, temp).status, 'manual');
  assert.throws(() => populationProposal(root, -1, 0, temp), /non-negative/);
  assert.throws(() => populationProposal(root, Number.MAX_SAFE_INTEGER + 1, 0, temp), /non-negative/);
  const agentDir = join(root, 'prompts/hard_points/agents');
  mkdirSync(agentDir, { recursive: true });
  writeFileSync(join(agentDir, 'agent-aikido-bank-populate.md'), 'fixture');
  mkdirSync(temp);
  const a = populationProposal(root, 1, 2, temp);
  const b = populationProposal(root, 1, 2, temp);
  assert.equal(a.status, 'agent');
  assert.notEqual(a.context, b.context);
  assert.match(readFileSync(a.context, 'utf8'), /Missing directories: 1\nMissing files: 2/);
  assert.equal(readdirSync(temp).length, 2);
});

test('Node CLI provides clean counts and explicit errors', (t) => {
  const root = fixture(t);
  const engine = join(scripts, 'ending-7-gaps.mjs');
  const detect = spawnSync(process.execPath, [engine, 'detect', root], { encoding: 'utf8' });
  assert.ifError(detect.error);
  assert.equal(detect.status, 0, detect.stderr);
  assert.equal(detect.stdout, '8 8\n');
  assert.match(detect.stderr, /Missing directory/);
  const invalid = spawnSync(process.execPath, [engine, 'propose', root, 'bad', '0'], { encoding: 'utf8' });
  assert.equal(invalid.status, 1);
  assert.match(invalid.stderr, /Gap counts/);
});

test('ending-7 plan preserves unknown gap status and requires a direct Node proposal', (t) => {
  const root = fixture(t);
  const text = readFileSync(plan, 'utf8');
  assert.doesNotMatch(text, /```(?:bash|sh|shell|zsh)/);
  assert.match(text, /unknown, not zero/);
  assert.match(text, /propose \/canonical\/source 2 3/);
  const failure = spawnSync(process.execPath, [join(scripts, 'ending-7-gaps.mjs'), 'detect', join(root, 'missing')], { encoding: 'utf8' });
  assert.equal(failure.status, 1);
  assert.match(failure.stderr, /Gap analysis failed/);
});

test('ending-7 plan executes actual Node engines from SOURCE outside cwd', (t) => {
  const root = fixture(t);
  const source = join(root, 'project');
  const destination = join(source, 'prompts/hard_points/system/maj/scripts');
  mkdirSync(destination, { recursive: true });
  for (const name of ['ending-7-gaps.mjs', 'ending-1-report-state.mjs', 'create-log.mjs']) {
    copyFileSync(join(scripts, name), join(destination, name));
  }
  const planText = readFileSync(plan, 'utf8');
  assert.doesNotMatch(planText, /```(?:bash|sh|shell|zsh)/);
  const detect = spawnSync(process.execPath, [join(destination, 'ending-7-gaps.mjs'), 'detect', source], {
    cwd: root, encoding: 'utf8',
  });
  assert.equal(detect.status, 0, detect.stderr);
  assert.equal(detect.stdout, '8 8\n');
  const proposal = spawnSync(process.execPath, [join(destination, 'ending-7-gaps.mjs'), 'propose', source, '8', '8'], {
    cwd: root, encoding: 'utf8',
  });
  assert.equal(proposal.status, 0, proposal.stderr);
  assert.match(proposal.stdout, /Population agent unavailable/);
  const log = spawnSync(process.execPath, [
    join(destination, 'create-log.mjs'), join(source, 'prompts/spec/logs/phase-7-test.log'),
    'Plan Ending-7 : Gap Population Proposal', 'Gap analysis available: true; Missing directories: 8; Missing files: 8',
  ], { cwd: root, encoding: 'utf8' });
  assert.equal(log.status, 0, log.stderr);
  const logs = join(source, 'prompts/spec/logs');
  assert.equal(readdirSync(logs).length, 1);
  assert.match(readFileSync(join(logs, readdirSync(logs)[0]), 'utf8'), /Gap analysis available: true/);
});
