#!/usr/bin/env node
import { check, node24 } from './ending-0-core.mjs';

try {
  node24();
  const args = process.argv.slice(2);
  if (args.length && !(args.length === 2 && args[0] === '--dir' && args[1])) throw new Error('Usage: ending-0-check-json-files.mjs [--dir <work-directory>]');
  check(args[1] ?? '/tmp/aikido');
  console.log('Content snapshot verified');
} catch (error) {
  console.error(`Snapshot verification failed: ${error.message}`);
  process.exitCode = 1;
}
