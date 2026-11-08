#!/usr/bin/env node
import { runTaskCLI } from '../lib/task-store/cli.mjs';

try {
  const { exitCode, result } = runTaskCLI(process.argv.slice(2));
  process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
  process.exitCode = exitCode;
} catch (error) {
  process.stderr.write(`Task store: ${error.message}\n`);
  process.exitCode = 1;
}
