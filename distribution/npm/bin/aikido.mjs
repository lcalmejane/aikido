#!/usr/bin/env node
let exitCode;
let result;
if (process.argv[2] === 'task') {
  const { runHostedTaskCLI } = await import('../lib/task-store/hosted-cli.mjs');
  const { compactTaskResult } = await import('../lib/task-store/cli.mjs');
  ({ exitCode, result } = await runHostedTaskCLI(process.argv.slice(2), { env: process.env, cwd: process.cwd() }));
  result = compactTaskResult(process.argv.slice(2), result);
} else if (process.argv[2] === 'deps') {
  const { runDepsCLI } = await import('../lib/deps-check.mjs');
  const report = await runDepsCLI(process.argv.slice(2));
  process.stdout.write(`${report.output}\n`);
  process.exit(report.exitCode);
} else {
  const { run } = await import('../lib/cli.mjs');
  ({ exitCode, result } = run(process.argv.slice(2), { env: process.env, cwd: process.cwd() }));
}
process.stdout.write(`${JSON.stringify(result, null, process.argv[2] === 'task' ? undefined : 2)}\n`);
process.exitCode = exitCode;
