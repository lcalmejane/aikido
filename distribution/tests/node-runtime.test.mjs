import { test } from 'node:test';
import assert from 'node:assert/strict';
import { inspectNodeRuntime, NODE_BASELINE } from '../lib/node-runtime.mjs';

test('Node baseline diagnostics distinguish stable versions from older or prerelease runtimes', () => {
  assert.equal(NODE_BASELINE, 24);
  for (const version of ['24.0.0', '24.9.2', '26.0.0']) {
    assert.equal(inspectNodeRuntime(version).status, 'baseline-met', version);
  }
  for (const version of ['18.20.8', '22.20.0', '24.0.0-rc.1', '26.0.0-nightly']) {
    assert.equal(inspectNodeRuntime(version).status, 'below-baseline', version);
  }
  for (const version of ['', 'v24.0.0', '24', 'garbage']) {
    assert.throws(() => inspectNodeRuntime(version), /Invalid Node\.js version/);
  }
  const actual = inspectNodeRuntime();
  assert.equal(actual.version, process.versions.node);
  assert.equal(actual.executable, process.execPath);
});
