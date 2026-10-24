#!/usr/bin/env node
import { resolve } from 'node:path';
import { validatePackage } from '../lib/package.mjs';

try {
  const root = process.argv[2];
  if (!root || process.argv.length !== 3) throw new Error('Usage: node distribution/scripts/validate-package.mjs <package-directory>');
  const result = validatePackage(resolve(root));
  process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
} catch (error) {
  process.stderr.write(`Package validation failed: ${error.message}\n`);
  process.exitCode = 1;
}
