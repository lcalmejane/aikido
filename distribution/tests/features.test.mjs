import assert from 'node:assert/strict';
import { test } from 'node:test';
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { detectKimono, planFeatureFlags, toolInventoryEnvironment } from '../lib/features.mjs';
import { writeTransaction } from '../lib/bootstrap-plan.mjs';

test('Kimono detection accepts local or remote exposed tool names from one provider', () => {
  for (const prefix of ['', 'mcp__kimono__', 'functions.Kimono--project--abc--']) {
    const names = ['aikido_snapshot', 'aikido_search', 'aikido_file'].map((name) => `${prefix}${name}`);
    const result = detectKimono({ AIKIDO_TOOLS: JSON.stringify(names) });
    assert.equal(result.status, 'available');
    assert.equal(result.flag, 'ON');
    assert.deepEqual(result.tools, {
      aikido_snapshot: names[0], aikido_search: names[1], aikido_file: names[2],
    });
  }
});

test('Kimono detection distinguishes absent inventory from missing or mixed-provider capabilities', () => {
  assert.equal(detectKimono({}).status, 'unknown');
  assert.equal(detectKimono({}).flag, null);
  for (const names of [
    [],
    ['mcp__kimono__aikido_search'],
    ['one__aikido_snapshot', 'two__aikido_search', 'two__aikido_file'],
    ['Read', 'Grep', 'kimono'],
  ]) {
    const result = detectKimono({ AIKIDO_TOOLS: JSON.stringify(names) });
    assert.equal(result.status, 'unavailable');
    assert.equal(result.flag, 'OFF');
    assert.equal(result.tools, null);
  }
  for (const value of ['bad json', '{}', '["tool","tool"]', '[null]', '[""]']) {
    assert.throws(() => detectKimono({ AIKIDO_TOOLS: value }), /AIKIDO_TOOLS/);
  }
});

test('combined feature state preserves existing flags in one transaction and loads host inventory files', () => {
  const root = mkdtempSync(join(tmpdir(), 'aikido-features-'));
  try {
    mkdirSync(join(root, '.aikido/state'), { recursive: true });
    const target = join(root, '.aikido/state/features.json');
    writeFileSync(target, '{"schemaVersion":1,"flags":{"other":"ON","kimono":"OFF"}}\n');
    const result = planFeatureFlags(root, { rtk: 'ON', kimono: 'ON' });
    assert.equal(result.item.action, 'update');
    writeTransaction(root, [result.operation]);
    assert.deepEqual(JSON.parse(readFileSync(target, 'utf8')), {
      schemaVersion: 1, flags: { kimono: 'ON', other: 'ON', rtk: 'ON' },
    });
    assert.equal(planFeatureFlags(root, { rtk: 'ON', kimono: 'ON' }).operation, null);
    const inventoryPath = join(root, 'tools.json');
    writeFileSync(inventoryPath, '["aikido_snapshot","aikido_search","aikido_file"]');
    const env = { PATH: 'test-path' };
    const loaded = toolInventoryEnvironment(env, inventoryPath);
    assert.equal(loaded.PATH, env.PATH);
    assert.equal(env.AIKIDO_TOOLS, undefined);
    assert.equal(detectKimono(loaded).flag, 'ON');
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});
