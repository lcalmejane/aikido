// AI-KIDO MAJ detection: read-only Node.js 24+ engine.
// Contract and deliberate safety differences: ../SKILL.md.
import { readFileSync, realpathSync, statSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

export function detectVersion(file = 'prompts/hard_points/ai-kido.md') {
  file ||= 'prompts/hard_points/ai-kido.md';
  let stat;
  try {
    stat = statSync(file);
  } catch (error) {
    if (error.code === 'ENOENT' || error.code === 'ENOTDIR') {
      throw new Error(`❌ File not found: ${file}`);
    }
    throw new Error(`❌ Unable to read ${file}: ${error.message}`);
  }
  if (!stat.isFile()) throw new Error(`❌ File not found: ${file}`);
  let text;
  try {
    // Do not silently reinterpret corrupt/binary data as version metadata.
    text = new TextDecoder('utf-8', { fatal: true, ignoreBOM: true }).decode(readFileSync(file));
    if (text.includes('\0')) throw new Error('NUL byte in version file');
  } catch (error) {
    throw new Error(`❌ Unable to read ${file}: ${error.message}`);
  }
  const line = text.split('\n').find((value) => value.startsWith('> **Version**:'));
  if (line === undefined) throw new Error(`❌ Version not detected in ${file}`);
  // Never fall back to exporting the header itself when the field is empty.
  // Preserve ASCII-space removal and tabs/CR for nonempty textual versions.
  const version = line.slice('> **Version**:'.length).split('|')[0].replace(/ /g, '');
  if (!version.trim()) throw new Error(`❌ Version not detected in ${file}`);
  return version;
}

export function main(args = process.argv.slice(2)) {
  if (Number(process.versions.node.split('.')[0]) < 24) {
    process.stderr.write('❌ MAJ detection requires Node.js 24 or newer\n');
    return 1;
  }
  try {
    process.stdout.write(`${detectVersion(args[0])}\n`);
    return 0;
  } catch (error) {
    process.stderr.write(`${error.message}\n`);
    return 1;
  }
}

// Resolve both paths: argv may retain symlink aliases canonicalized by Node.
// An import with absent/nonexistent argv[1] is not a CLI invocation.
function isMain() {
  if (!process.argv[1]) return false;
  try {
    return realpathSync(process.argv[1]) === realpathSync(fileURLToPath(import.meta.url));
  } catch {
    return false;
  }
}
if (isMain()) {
  process.exitCode = main();
}
