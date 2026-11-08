import { test } from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { mkdtempSync, readFileSync, readdirSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { compareStructures } from '../../prompts/hard_points/system/maj/scripts/ending-1-compare-structures.mjs';

const script = fileURLToPath(new URL('../../prompts/hard_points/system/maj/scripts/ending-1-compare-structures.mjs', import.meta.url));

test('compares top-level object keys and preserves nulls and nested values', () => {
  const before = JSON.parse('{"unchanged":{"a":1,"b":2},"remove":3,"change":[1,2],"__proto__":"old","nullValue":null,"zero":-0}');
  const after = JSON.parse('{"unchanged":{"b":2,"a":1},"change":[2,1],"add":true,"__proto__":"new","nullValue":null,"zero":0}');
  assert.deepEqual(JSON.parse(JSON.stringify(compareStructures(before, after))), {
    remove: { before: 3, after: null },
    change: { before: [1, 2], after: [2, 1] },
    ['__proto__']: { before: 'old', after: 'new' },
    add: { before: null, after: true },
  });
});

test('matches jq comparison for representative JSON objects', (t) => {
  const before = JSON.parse('{"same":{"x":[1,2],"y":false},"remove":null,"__proto__":1,"zero":-0}');
  const after = JSON.parse('{"same":{"y":false,"x":[1,2]},"add":null,"__proto__":2,"zero":0}');
  const filter = 'def diff(a;b): a as $a | b as $b | reduce ($a|keys_unsorted[]) as $k ({}; if ($b|has($k)) then if $a[$k] != $b[$k] then .[$k]={before:$a[$k],after:$b[$k]} else . end else .[$k]={before:$a[$k],after:null} end) + reduce ($b|keys_unsorted[]) as $k ({}; if ($a|has($k)|not) then .[$k]={before:null,after:$b[$k]} else . end); diff(.[0];.[1])';
  const result = spawnSync('jq', ['-s', filter], { input: `${JSON.stringify(before)}\n${JSON.stringify(after)}\n`, encoding: 'utf8' });
  if (result.error?.code === 'ENOENT') return t.skip('jq is unavailable for the legacy comparison');
  assert.equal(result.status, 0, result.stderr);
  assert.deepEqual(JSON.parse(JSON.stringify(compareStructures(before, after))), JSON.parse(result.stdout));
});

test('CLI creates the expected report and preserves previous output on errors', () => {
  const directory = mkdtempSync(join(tmpdir(), 'aikido compare '));
  try {
    writeFileSync(join(directory, 'maj_before.json'), '{"a":1,"removed":null}');
    writeFileSync(join(directory, 'maj_after.json'), '{"a":2,"new":null}');
    const run = (binary, entry, ...args) => spawnSync(binary, [entry, ...args], { encoding: 'utf8' });
    const result = run(process.execPath, script, '--dir', directory);
    assert.equal(result.status, 0, result.stderr);
    const report = readFileSync(join(directory, 'maj_diff.json'), 'utf8');
    const withoutTools = spawnSync(process.execPath, [script, '--dir', directory], {
      encoding: 'utf8', env: { ...process.env, PATH: directory },
    });
    assert.equal(withoutTools.status, 0, withoutTools.stderr);
    assert.equal(readFileSync(join(directory, 'maj_diff.json'), 'utf8'), report);
    assert.deepEqual(JSON.parse(report), {
      a: { before: 1, after: 2 },
      removed: { before: null, after: null },
      new: { before: null, after: null },
    });
    writeFileSync(join(directory, 'maj_after.json'), '{');
    const invalid = run(process.execPath, script, '--dir', directory);
    assert.equal(invalid.status, 1);
    assert.match(invalid.stderr, /Structure comparison failed/);
    assert.equal(readFileSync(join(directory, 'maj_diff.json'), 'utf8'), report);
    assert.deepEqual(readdirSync(directory).sort(), ['maj_after.json', 'maj_before.json', 'maj_diff.json', 'maj_diff.state.json']);
    writeFileSync(join(directory, 'maj_after.json'), '[]');
    assert.match(run(process.execPath, script, '--dir', directory).stderr, /expected a JSON object/);
    writeFileSync(join(directory, 'maj_after.json'), '{"large":9007199254740993}');
    assert.match(run(process.execPath, script, '--dir', directory).stderr, /cannot be compared safely/);
    assert.equal(readFileSync(join(directory, 'maj_diff.json'), 'utf8'), report);
  } finally {
    rmSync(directory, { recursive: true, force: true });
  }
});

test('CLI rejects unknown or incomplete options', () => {
  for (const args of [['--dir'], ['--unknown'], ['--dir', 'x', 'extra']]) {
    const result = spawnSync(process.execPath, [script, ...args], { encoding: 'utf8' });
    assert.equal(result.status, 1);
    assert.match(result.stderr, /Usage:/);
  }
});
