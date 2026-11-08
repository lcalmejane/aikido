#!/usr/bin/env node
import { generate, invalidateMergeReport, mergeRoots } from './ending-0-core.mjs';
import { captureContent, invalidateContentReport, saveSnapshot, workOutsideSource } from './ending-1-content.mjs';

try {
  const args = process.argv.slice(2);
  if (args.length !== 2 && !(args.length === 4 && args[2] === '--dir' && args[3])) {
    throw new Error('Usage: beginning-generate-structure.mjs <source> <target> [--dir <work-directory>]');
  }
  const dir = args[3] ?? '/tmp/aikido';
  workOutsideSource(args[0], dir);
  workOutsideSource(args[1], dir);
  invalidateMergeReport(dir);
  invalidateContentReport(dir);
  mergeRoots(args[0], args[1], dir);
  const before = captureContent(args[0], 'before');
  const count = generate(args[0], args[1], dir);
  saveSnapshot(dir, before);
  console.log(`Content snapshot created for ${count} TARGET file(s)`);
} catch (error) {
  console.error(`Snapshot generation failed: ${error.message}`);
  process.exitCode = 1;
}
