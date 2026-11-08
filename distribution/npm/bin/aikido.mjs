#!/usr/bin/env node
let exitCode;
let result;
if (process.argv[2] === 'task') {
  const { runTaskCLI } = await import('../lib/task-store/cli.mjs');
  ({ exitCode, result } = runTaskCLI(process.argv.slice(2), { env: process.env, cwd: process.cwd() }));
} else {
  const { run } = await import('../lib/cli.mjs');
  ({ exitCode, result } = run(process.argv.slice(2), { env: process.env, cwd: process.cwd() }));
}
process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
process.exitCode = exitCode;
