import { test } from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const root = new URL('../../prompts/hard_points/', import.meta.url);
const script = fileURLToPath(new URL('system/structure/scripts/generate-all-indexes-v3.1.mjs', root));

test('reindex command and agent describe the actual full rebuild contract', () => {
  const command = readFileSync(new URL('commands/reindex-projet.md', root), 'utf8');
  const agent = readFileSync(new URL('agents/agent-aikido-projet-index.md', root), 'utf8');
  assert.match(command, /full rebuild/);
  assert.match(command, /not supported/);
  assert.match(agent, /no positional arguments/);
  assert.match(agent, /rebuilds the\s+entire index/);
  assert.doesNotMatch(agent, /Update single batches|Targeted Incremental Update/);
  const invalid = spawnSync(process.execPath, [script, 'src'], { encoding: 'utf8' });
  assert.equal(invalid.status, 1);
  assert.match(invalid.stderr, /no positional arguments accepted/);
});
