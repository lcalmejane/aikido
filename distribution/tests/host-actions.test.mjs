import { test } from 'node:test';
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { lstat, mkdir, rm, symlink, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { createHostActions } from '../../prompts/hard_points/system/host-actions.mjs';

async function createFixture(t) {
  const root = path.join(process.cwd(), `.host-actions-test-${randomUUID()}`);
  await mkdir(root, { mode: 0o700 });
  t.after(() => rm(root, { recursive: true, force: true }));
  return { root, actions: createHostActions(root) };
}

test('host actions list scoped files in stable order and report text metadata', async (t) => {
  const { root, actions } = await createFixture(t);
  await mkdir(path.join(root, 'docs', 'nested'), { recursive: true });
  await writeFile(path.join(root, 'docs', 'z.md'), 'one\ntwo\n');
  await writeFile(path.join(root, 'docs', 'nested', 'a.md'), 'three');
  await writeFile(path.join(root, 'docs', 'skip.txt'), 'ignored');

  assert.deepEqual(await actions.listFiles({ directory: 'docs', extensions: ['.md'] }), [
    'docs/nested/a.md',
    'docs/z.md',
  ]);
  const [metadata] = await actions.inspectFiles(['docs/z.md']);
  assert.equal(metadata.path, 'docs/z.md');
  assert.equal(metadata.lines, 2);
  assert.equal(metadata.bytes, 8);
  assert.ok(Number.isFinite(Date.parse(metadata.modified)));
});

test('host actions safely create files and reject overwrite, traversal, and symlinks', async (t) => {
  const { root, actions } = await createFixture(t);
  const output = 'new/note.md';
  assert.deepEqual(await actions.writeText(output, 'content'), { path: output, bytes: 7 });
  assert.equal(await actions.readText(output), 'content');
  await assert.rejects(actions.writeText(output, 'changed'), /already exists/);
  await assert.rejects(actions.readText('../outside'), /escapes project root/);
  await assert.rejects(actions.deletePath('.'), /project root/);

  const link = path.join(root, 'linked');
  await symlink(path.join(root, 'new'), link);
  await assert.rejects(actions.listFiles({ directory: 'linked' }), /symlink/i);
  await assert.rejects(actions.writeText('linked/file.md', 'unsafe'), /symlink/i);
  assert.ok((await lstat(link)).isSymbolicLink());
  assert.deepEqual(await actions.deletePath(output), { path: output, deleted: true, recursive: false });
});

test('host actions invoke Node modules with argv and no shell', async (t) => {
  const { root, actions } = await createFixture(t);
  await writeFile(path.join(root, 'fixture.mjs'), 'process.stdout.write(JSON.stringify(process.argv.slice(2)));');
  const args = ['argument with spaces', 'literal; echo not-executed'];
  const result = await actions.runNodeScript({ scriptPath: 'fixture.mjs', args });

  assert.equal(result.exitCode, 0);
  assert.deepEqual(JSON.parse(result.stdout), args);
  assert.equal(result.stderr, '');
});
