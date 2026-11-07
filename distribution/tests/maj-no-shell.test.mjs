import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('../../', import.meta.url));
const maj = join(root, 'prompts/hard_points/system/maj');
const plans = join(maj, 'plans');
const scripts = join(maj, 'scripts');
const tests = join(root, 'distribution/tests');

test('MAJ plans contain no executable shell fences or shell scripts', () => {
  for (const name of readdirSync(plans).filter(name => name.endsWith('.md'))) {
    const text = readFileSync(join(plans, name), 'utf8');
    assert.doesNotMatch(text, /^```(?:bash|sh|shell|zsh)\b/m, name);
    assert.doesNotMatch(text, /^```(?:bash|sh|shell|zsh)\s*$/m, name);
  }
  for (const name of readdirSync(scripts)) {
    assert.match(name, /\.mjs$/, `Unexpected non-Node MAJ engine: ${name}`);
  }
});

test('MAJ tests launch Node engines, not shell interpreters or shell fixtures', () => {
  const interpreterCall = new RegExp(
    String.raw`(?:spawnSync|spawn|execSync|execFileSync|execFile)\s*\([^)]*(['"\x60])(?:\/bin\/)?(?:bash|sh)\1`,
    's',
  );
  const shellFixture = new RegExp(
    String.raw`(?:^#!.*\/(?:bash|sh)\b|shell\s*:\s*true)`,
    'm',
  );
  const names = readdirSync(tests).filter(name => /^maj-.*\.test\.mjs$/.test(name) && name !== 'maj-no-shell.test.mjs');
  for (const name of names) {
    const text = readFileSync(join(tests, name), 'utf8');
    assert.doesNotMatch(text, interpreterCall, name);
    assert.doesNotMatch(text, shellFixture, name);
  }
});
