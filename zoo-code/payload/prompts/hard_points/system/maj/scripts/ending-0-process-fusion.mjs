#!/usr/bin/env node
import { node24, processFiles } from './ending-0-core.mjs';

try {
  node24();
  const args = process.argv.slice(2);
  if (args.length !== 3 && !(args.length === 5 && args[3] === '--dir' && args[4])) {
    throw new Error('Usage: ending-0-process-fusion.mjs <source> <target> <mode> [--dir <work-directory>]');
  }
  const result = processFiles(args[0], args[1], args[2], args[4] ?? '/tmp/aikido');
  console.log(JSON.stringify(result));
  if (result.status !== 'complete') {
    console.error('Merge remains pending; do not continue as though files were merged.');
    process.exitCode = 2;
  }
} catch (error) {
  console.error(`Merge processing failed: ${error.message}`);
  process.exitCode = 1;
}
