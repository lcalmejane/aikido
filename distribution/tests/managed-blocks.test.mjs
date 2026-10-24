import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseBlocks, findBlock, upsertBlock, removeBlock, blockHash } from '../lib/managed-blocks.mjs';

const FIX = join(dirname(fileURLToPath(import.meta.url)), 'fixtures', 'blocks');
const fixture = (name) => readFileSync(join(FIX, name), 'utf8');
const BODY = '## AI-KIDO Memory Bank\n\nManaged content.';

test('insertion keeps user content byte for byte and is idempotent', () => {
  const user = fixture('agents-user.md');
  const once = upsertBlock(user, 'core', BODY, 'html');
  assert.ok(once.startsWith(user.trimEnd()));
  assert.equal(findBlock(once, 'core', 'html').content, BODY);
  assert.equal(upsertBlock(once, 'core', BODY, 'html'), once);
});

test('insertion into an empty file creates only the block', () => {
  const out = upsertBlock('', 'state', '.aikido/state/', 'hash');
  assert.equal(out, '# aikido:begin id=state - managed by AI-KIDO, edit outside this block\n.aikido/state/\n# aikido:end id=state\n');
});

test('replacement only touches the inside of the block', () => {
  const edited = fixture('agents-with-edited-block.md');
  const out = upsertBlock(edited, 'core', BODY, 'html');
  assert.match(out, /^# My Project Agents\n\nIntro\.\n\n<!-- aikido:begin id=core/);
  assert.match(out, /<!-- aikido:end id=core -->\n\n## After\n\nUser section kept\.\n$/);
  assert.doesNotMatch(out, /Locally edited line/);
});

test('local edits inside a block are detectable from the lock hash', () => {
  const installed = blockHash(BODY);
  const edited = findBlock(fixture('agents-with-edited-block.md'), 'core', 'html');
  assert.notEqual(blockHash(edited.content), installed);
  assert.equal(blockHash(`${BODY}\n`), installed, 'trailing newline does not count');
  assert.equal(blockHash(BODY.replace(/\n/g, '\r\n')), installed, 'line endings do not count');
});

test('removal restores the original user file', () => {
  for (const [name, style] of [['agents-user.md', 'html'], ['gitignore-user.txt', 'hash']]) {
    const user = fixture(name);
    const withBlock = upsertBlock(user, 'core', 'x', style);
    assert.equal(removeBlock(withBlock, 'core', style), user, name);
  }
  assert.equal(removeBlock(upsertBlock('', 'core', 'x', 'html'), 'core', 'html'), '');
});

test('CRLF files keep their line endings', () => {
  const out = upsertBlock('a\r\nb\r\n', 'core', 'x\ny', 'html');
  assert.doesNotMatch(out.replace(/\r\n/g, ''), /\n/);
});

test('malformed markers are rejected instead of guessed', () => {
  assert.throws(() => parseBlocks(fixture('broken-unclosed.md'), 'html'), /Unclosed/);
  const nested = '<!-- aikido:begin id=a -->\n<!-- aikido:begin id=b -->\n<!-- aikido:end id=b -->\n<!-- aikido:end id=a -->';
  assert.throws(() => parseBlocks(nested, 'html'), /Nested/);
  const dup = '# aikido:begin id=a\n# aikido:end id=a\n# aikido:begin id=a\n# aikido:end id=a';
  assert.throws(() => parseBlocks(dup, 'hash'), /Duplicate/);
  assert.throws(() => parseBlocks('<!-- aikido:end id=a -->', 'html'), /Unexpected end/);
  assert.throws(() => upsertBlock('', 'a', 'x', 'xml'), /Unknown block style/);
});

test('blocks of the other style are ignored', () => {
  const text = upsertBlock('', 'core', 'x', 'html');
  assert.deepEqual(parseBlocks(text, 'hash'), []);
});
