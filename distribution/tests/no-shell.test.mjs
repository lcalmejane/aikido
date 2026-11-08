import assert from 'node:assert/strict';
import test from 'node:test';
import { lstatSync, readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('../../', import.meta.url));
function files(directory) {
  return readdirSync(join(root, directory), { withFileTypes: true })
    .flatMap(entry => entry.isDirectory() ? files(`${directory}/${entry.name}`) : [`${directory}/${entry.name}`]);
}
test('product engines, prompts, integrations and tests contain no shell programs', () => {
  const sources = ['distribution', 'prompts/hard_points', '.github', '.claude', '.roo']
    .flatMap(files);
  const failures = [];
  for (const path of sources) {
    if (/\.(sh|bash|zsh|py|pl|rb|ps1|cmd|bat)$/.test(path)) failures.push(`${path}: non-Node script`);
    if (!/\.[^/]+$/.test(path) && (lstatSync(join(root, path)).mode & 0o111)) {
      const contents = readFileSync(join(root, path), 'utf8');
      if (!/^#!(?:\/usr\/bin\/env node|[^\n]*\/node)\r?\n/.test(contents)) {
        failures.push(`${path}: unclassified executable without an extension`);
      }
    }
    if (!/\.(md|mjs|js|yml|yaml)$/.test(path)) continue;
    const text = readFileSync(join(root, path), 'utf8');
    if (/^```(?:bash|sh|shell|zsh|powershell|pwsh|cmd|bat)\s*$/m.test(text)) failures.push(`${path}: shell block`);
    if (/^\s*(?:if\s+\[\[|fi\s*$|(?:for|while)\b[^\n]*;\s*do\b|(?:export|local)\s+[A-Z_]+=|set\s+-[a-z]*[eu]\b|[A-Z_]+=\$\(|(?:source|\.)\s+[^\n]*\.sh\b)/m.test(text)) {
      failures.push(`${path}: shell control syntax`);
    }
    if (/(?:spawnSync|spawn|execute|execFileSync)\(\s*['"](?:\/bin\/|\/usr\/bin\/)?(?:bash|sh|zsh|cmd|powershell|pwsh)(?:\.exe)?['"]/.test(text)) {
      failures.push(`${path}: interpreter invocation`);
    }
    if (/\bshell:\s*true\b/.test(text)) failures.push(`${path}: shell execution enabled`);
    if (/\bexecSync\s*\(|(?<![.\w])exec\s*\(|\b(?:childProcess|child_process)\.exec\s*\(/.test(text)) {
      failures.push(`${path}: shell-based process API`);
    }
    if (/#!\/(?:usr\/)?bin\/(?:env\s+)?(?:sh|bash|zsh|python|perl|ruby)\b/.test(text)) {
      failures.push(`${path}: generated non-Node shebang`);
    }
    if (/^#![^\n]*\b(?:sh|bash|zsh|python|perl|ruby)\b/m.test(text)) failures.push(`${path}: non-Node shebang`);
  }
  assert.deepEqual(failures, []);
});
