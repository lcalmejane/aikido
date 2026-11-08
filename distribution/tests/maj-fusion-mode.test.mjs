import { test } from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const script = fileURLToPath(new URL('../../prompts/hard_points/system/maj/scripts/ending-0-ask-llm-capability.mjs', import.meta.url));

test('merge mode is the only stdout and accepts French and English answers', () => {
  for (const [input, expected] of [['oui\n', 'INTELLIGENT\n'],
    ['non\n2\n', 'SKIP\n'], ['n\n3\n', 'MANUAL_LATER\n']]) {
    const result = spawnSync(process.execPath, [script], { input, encoding: 'utf8' });
    assert.equal(result.status, 0, result.stderr);
    assert.equal(result.stdout, expected);
    assert.notEqual(result.stderr, '');
  }
});

test('invalid answers and incomplete input fail without selecting a mode', () => {
  for (const input of ['', 'maybe\n', 'no\n', 'no\n1\n', 'no\n4\n']) {
    const result = spawnSync(process.execPath, [script], { input, encoding: 'utf8' });
    assert.equal(result.status, 1, input);
    assert.equal(result.stdout, '');
    assert.match(result.stderr, /Merge mode selection failed/);
  }
});

test('historical migration plans retain their blocking safety gate', () => {
  for (const version of ['1.3.0.0', '1.3.1.0']) {
    const text = readFileSync(new URL(`../../prompts/hard_points/system/maj/plans/plan-V${version}.md`, import.meta.url), 'utf8');
    assert.match(text.slice(0, 1000), /BLOCKED/i, version);
    assert.match(text.slice(0, 1000), /do not execute/i, version);
  }
});
