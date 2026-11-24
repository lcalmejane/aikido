#!/usr/bin/env node
import { runHostedTaskCLI } from './hosted-cli.mjs';
import { compactTaskResult } from './cli.mjs';

try {
  const { exitCode, result } = await runHostedTaskCLI(process.argv.slice(2));
  process.stdout.write(`${JSON.stringify(compactTaskResult(process.argv.slice(2), result))}\n`);
  process.exitCode = exitCode;
} catch (error) {
  process.stderr.write(`Task store: ${error.message}\n`);
  process.exitCode = 1;
}
