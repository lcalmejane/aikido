import assert from 'node:assert/strict';
import test from 'node:test';
import childProcess from 'node:child_process';
import { readFileSync } from 'node:fs';
import { syncBuiltinESMExports } from 'node:module';
import { join, resolve } from 'node:path';
import { tmpdir } from 'node:os';
import { run } from '../scripts/ci.mjs';

function intercept(t, result = { status: 0 }) {
  const original = childProcess.spawnSync;
  const calls = [];
  childProcess.spawnSync = (program, args, options) => {
    calls.push({ program, args, options });
    return result;
  };
  syncBuiltinESMExports();
  t.after(() => {
    childProcess.spawnSync = original;
    syncBuiltinESMExports();
  });
  return calls;
}

test('CI expands tests in Node and invokes the runtime without a command interpreter', t => {
  const calls = intercept(t);
  run('compatibility');
  const [call] = calls;
  assert.equal(call.program, process.execPath);
  assert.equal(call.options.shell, false);
  assert.ok(call.args.includes('distribution/tests/maj-diagnostics.test.mjs'));
  assert.ok(call.args.includes('distribution/tests/search-config-query.test.mjs'));
  assert.ok(call.args.includes('distribution/tests/search-engine.test.mjs'));
  assert.ok(call.args.every(arg => !arg.includes('*')));
});

test('full CI covers all test families and propagates process failure', t => {
  const calls = intercept(t, { status: 7 });
  assert.throws(() => run('tests'), /failed \(7\)/);
  assert.ok(calls[0].args.includes('prompts/hard_points/system/orchestrator/runtime.test.mjs'));
  assert.ok(calls[0].args.includes('prompts/hard_points/system/skill-manage/skill-manage.test.mjs'));
  assert.throws(() => run('unknown'), /Unknown CI stage/);
});

test('release tag lookup distinguishes a missing tag from transport failure', t => {
  const previous = process.env.VERSION;
  process.env.VERSION = '1.5.2-test';
  t.after(() => {
    if (previous === undefined) delete process.env.VERSION;
    else process.env.VERSION = previous;
  });

  const result = { status: 2, stderr: '' };
  intercept(t, result);
  assert.doesNotThrow(() => run('check-tag'));
  result.status = 0;
  assert.throws(() => run('check-tag'), /immutable/);
  result.status = 128;
  result.stderr = 'network failed';
  assert.throws(() => run('check-tag'), /Git remote lookup failed/);
  process.env.VERSION = 'invalid';
  assert.throws(() => run('check-tag'), /Invalid release version/);
});

test('CI release preparation uses explicit arguments and verifies the resulting tree', t => {
  const calls = intercept(t);
  const originalRead = childProcess.execFileSync;
  childProcess.execFileSync = (program, args) => {
    assert.equal(program, 'git');
    assert.deepEqual(args, ['rev-parse', 'HEAD']);
    return `${'a'.repeat(40)}\n`;
  };
  syncBuiltinESMExports();
  const variables = ['RUNNER_TEMP', 'GITHUB_RUN_NUMBER'];
  const previous = variables.map(key => process.env[key]);
  t.after(() => {
    childProcess.execFileSync = originalRead;
    syncBuiltinESMExports();
    variables.forEach((key, index) => {
      if (previous[index] === undefined) delete process.env[key];
      else process.env[key] = previous[index];
    });
  });
  process.env.RUNNER_TEMP = join(tmpdir(), 'runner with spaces');
  process.env.GITHUB_RUN_NUMBER = '42';
  run('prepare-ci');
  const output = join(resolve(process.env.RUNNER_TEMP), 'aikido-dist');
  assert.deepEqual(calls.map(call => call.args), [
    ['distribution/scripts/prepare-release.mjs', '--out', output, '--revision', 'a'.repeat(40), '--version', '1.5.0-ci.42'],
    ['distribution/scripts/prepare-release.mjs', '--verify', output],
  ]);
  assert.ok(calls.every(call => call.program === process.execPath && call.options.shell === false));
  delete process.env.RUNNER_TEMP;
  assert.throws(() => run('prepare-ci'), /RUNNER_TEMP is required/);
});

test('workflow run steps use Node directly and contain no interpreter programs', () => {
  for (const name of ['distribution-ci.yml', 'distribution-publish.yml']) {
    const text = readFileSync(new URL(`../../.github/workflows/${name}`, import.meta.url), 'utf8');
    assert.match(text, /shell: node \{0\}/);
    assert.doesNotMatch(text, /shell:\s*(bash|sh|pwsh|powershell)|\$\(|set -e|run: \|/);
    for (const [, code] of text.matchAll(/^\s+run: (.+)$/gm)) {
      assert.match(code, /execFileSync\(process\.execPath/);
      assert.doesNotThrow(() => new Function('require', 'process', code));
    }
  }
});
