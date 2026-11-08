import { test } from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { mkdirSync, mkdtempSync, realpathSync, rmSync, symlinkSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { formatFileMetadata } from '../../prompts/hard_points/system/structure/scripts/format-file-metadata.mjs';

const engine = fileURLToPath(new URL('../../prompts/hard_points/system/structure/scripts/format-file-metadata.mjs', import.meta.url));
function fixture(t) {
  const root = mkdtempSync(join(realpathSync(tmpdir()), 'aikido-file-metadata-test-'));
  t.after(() => rmSync(root, { recursive: true, force: true }));
  return root;
}

function put(root, path, value) {
  const target = join(root, path);
  mkdirSync(dirname(target), { recursive: true });
  writeFileSync(target, value);
}

test('tree and agents output retain labels, date, lines, and last-check status', t => {
  const root = fixture(t);
  put(root, 'prompts/hard_points/guide.md', '---\nlast_check:\n  status: Validated\n  validator: agent-aikido-validator\n---\nbody\n');
  const file = 'prompts/hard_points/guide.md';
  const tree = formatFileMetadata(file, 'tree', root);
  assert.match(tree, /^🔒 guide\.md \(6L \d+B \d{4}-\d{2}-\d{2}\)$/);
  const agents = formatFileMetadata(file, 'agents', root);
  assert.match(agents, /\[Check: Validated by:agent-aikido-validator\]$/);
  assert.equal(formatFileMetadata(join(root, 'prompts'), 'agents', root), '📁 prompts');
});

test('non-prompt text omits check status and invalid or missing inputs fail', t => {
  const root = fixture(t);
  put(root, 'README.md', 'one\ntwo\n');
  assert.match(formatFileMetadata('README.md', 'agents', root), /^📄 README\.md \(2L \d+B \d{4}-\d{2}-\d{2}\)$/);
  assert.throws(() => formatFileMetadata('missing.md', 'tree', root), /does not exist/);
  assert.throws(() => formatFileMetadata('README.md', 'json', root), /Unsupported format/);
  if (process.platform !== 'win32') {
    symlinkSync('loop', join(root, 'loop'));
    assert.throws(() => formatFileMetadata('loop', 'tree', root), error => error.code === 'ELOOP');
  }
  const missing = spawnSync(process.execPath, [engine], { cwd: root, encoding: 'utf8' });
  assert.equal(missing.status, 1);
  assert.match(missing.stdout, /Usage: format-file-metadata\.mjs/);
  const invalid = spawnSync(process.execPath, [engine, 'README.md', 'json'], { cwd: root, encoding: 'utf8' });
  assert.equal(invalid.status, 1);
  assert.match(invalid.stderr, /Supported formats: tree, agents/);
});
