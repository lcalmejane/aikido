import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  validateLock, classify, isSafeRelativePath, HOSTS, MODES, SOURCE_TYPES, ORIGINS, CONFLICTS,
} from '../lib/lock.mjs';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const fixture = (name) => JSON.parse(readFileSync(join(ROOT, 'tests', 'fixtures', 'lock', name), 'utf8'));
const schema = JSON.parse(readFileSync(join(ROOT, 'schemas', 'lock.schema.json'), 'utf8'));

test('valid fixtures pass', () => {
  assert.deepEqual(validateLock(fixture('valid-standard.json')), []);
  assert.deepEqual(validateLock(fixture('valid-local-unset.json')), []);
});

test('absolute paths are rejected in source and files', () => {
  const errors = validateLock(fixture('invalid-absolute-paths.json'));
  assert.ok(errors.some((e) => e.includes('source.ref')), errors.join('\n'));
  assert.ok(errors.some((e) => e.includes('path must be relative')), errors.join('\n'));
});

test('traversal, duplicate or unknown hosts and short commits are rejected', () => {
  const errors = validateLock(fixture('invalid-traversal-hosts-commit.json')).join('\n');
  assert.match(errors, /path must be relative/);
  assert.match(errors, /hosts must list known host ids/);
  assert.match(errors, /40-char SHA/);
});

test('portable path rules', () => {
  for (const ok of ['AGENTS.md', 'prompts/hard_points/ai-kido.md', '.aikido/lock.json']) assert.ok(isSafeRelativePath(ok), ok);
  for (const ko of ['', '/abs', '~/x', 'C:/x', 'a\\b', 'a/../b', './a', 'a//b', 'a/']) assert.ok(!isSafeRelativePath(ko), ko);
});

test('JSON schema and validator share the same vocabulary', () => {
  assert.deepEqual(schema.required, ['schemaVersion', 'aikido', 'mode', 'hosts', 'installedAt', 'files', 'managedBlocks']);
  assert.deepEqual(schema.properties.mode.enum, MODES);
  assert.deepEqual(schema.properties.hosts.items.enum, HOSTS);
  assert.deepEqual(schema.properties.aikido.properties.source.properties.type.enum, SOURCE_TYPES);
  assert.deepEqual(schema.properties.files.items.properties.origin.enum, ORIGINS);
});

test('three-way decisions', () => {
  const B = 'base';
  const L = 'local';
  const N = 'next';
  const cases = [
    [{ base: B, local: B, next: B }, 'unchanged'],
    [{ base: B, local: B, next: N }, 'update'],
    [{ base: B, local: L, next: B }, 'keep-local'],
    [{ base: B, local: N, next: N }, 'keep-local'],
    [{ base: B, local: L, next: N }, 'conflict'],
    [{ base: B, local: null, next: B }, 'keep-deleted'],
    [{ base: B, local: null, next: N }, 'conflict-deleted-locally'],
    [{ base: B, local: B, next: null }, 'delete'],
    [{ base: B, local: L, next: null }, 'keep-modified-orphan'],
    [{ base: B, local: null, next: null }, 'unchanged'],
    [{ base: null, local: null, next: N }, 'add'],
    [{ base: null, local: N, next: N }, 'adopt'],
    [{ base: null, local: L, next: N }, 'conflict-collision'],
    [{ base: null, local: L, next: null }, 'keep-local'],
  ];
  for (const [input, expected] of cases) assert.equal(classify(input), expected, JSON.stringify(input));
});

test('create-only files are never overwritten once present', () => {
  const policy = 'create-only';
  assert.equal(classify({ base: null, local: null, next: 'n', policy }), 'add');
  assert.equal(classify({ base: null, local: 'l', next: 'n', policy }), 'keep-local');
  assert.equal(classify({ base: 'b', local: 'b', next: 'n', policy }), 'keep-local');
  assert.equal(classify({ base: 'b', local: null, next: 'n', policy }), 'keep-local', 'respects a deletion');
});

test('conflict set matches decisions requiring a user choice', () => {
  assert.deepEqual([...CONFLICTS].sort(), ['conflict', 'conflict-collision', 'conflict-deleted-locally']);
});
