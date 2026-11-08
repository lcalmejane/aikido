#!/usr/bin/env node
import { compare, node24 } from './ending-0-core.mjs';

try {
  node24();
  const args = process.argv.slice(2);
  if (args.length && !(args.length === 2 && args[0] === '--dir' && args[1])) throw new Error('Usage: ending-0-generate-diff-report.mjs [--dir <work-directory>]');
  console.log(compare(args[1] ?? '/tmp/aikido'));
} catch (error) {
  console.error(`Comparison failed: ${error.message}`);
  process.exitCode = 1;
}
