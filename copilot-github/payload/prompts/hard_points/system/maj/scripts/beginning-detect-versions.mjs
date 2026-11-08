#!/usr/bin/env node
import { join } from 'node:path';
import { detectVersion } from './detect-version.mjs';
import { isMainModule } from './ending-1-report-state.mjs';

export function detectVersions(source, target) {
  if (Number(process.versions.node.split('.')[0]) < 24) {
    throw new Error('MAJ detection requires Node.js 24 or newer');
  }
  if (!target) throw new Error('Usage: beginning-detect-versions.mjs <source_dir> <target_dir>');
  const current = detectVersion(join(source || '.', 'prompts/hard_points/ai-kido.md'));
  const next = detectVersion(join(target, 'prompts/hard_points/ai-kido.md'));
  if (/\s/u.test(current) || /\s/u.test(next)) {
    throw new Error('Versions must be non-empty single tokens without whitespace');
  }
  return { current, target: next };
}

if (isMainModule(import.meta.url)) {
  try {
    process.stderr.write('Detecting versions...\n');
    const versions = detectVersions(process.argv[2], process.argv[3]);
    process.stderr.write(`Versions detected:\n   CURRENT : ${versions.current}\n   TARGET  : ${versions.target}\n`);
    process.stdout.write(`${versions.current} ${versions.target}\n`);
  } catch (error) {
    process.stderr.write(`${error.message}\n`);
    process.exitCode = 1;
  }
}
