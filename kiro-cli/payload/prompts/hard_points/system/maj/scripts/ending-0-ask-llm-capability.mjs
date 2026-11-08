#!/usr/bin/env node
import { createInterface } from 'node:readline';

async function main() {
  if (process.argv.length !== 2) throw new Error('Usage: ending-0-ask-llm-capability.mjs');
  if (Number(process.versions.node.split('.')[0]) < 24) throw new Error('Node.js 24 or newer is required');
  const lines = createInterface({ input: process.stdin, crlfDelay: Infinity });
  let state = 'capability';
  process.stderr.write('Can this client invoke agent-aikido-fusion for a reviewed merge? (yes/no): ');
  try {
    for await (const line of lines) {
      const answer = line.trim().toLowerCase();
      if (state === 'capability') {
        if (['yes', 'y', 'oui', 'o'].includes(answer)) {
          process.stdout.write('INTELLIGENT\n');
          return;
        }
        if (!['no', 'n', 'non'].includes(answer)) throw new Error('Expected yes or no');
        state = 'fallback';
        process.stderr.write('Choose 2=SKIP or 3=MANUAL_LATER (direct replacement of hard points is not allowed): ');
      } else {
        const mode = { '2': 'SKIP', '3': 'MANUAL_LATER' }[answer];
        if (!mode) throw new Error('Expected 2 or 3');
        process.stdout.write(`${mode}\n`);
        return;
      }
    }
    throw new Error('Input ended before a selection was made');
  } finally {
    lines.close();
  }
}

main().catch(error => {
  process.stderr.write(`Merge mode selection failed: ${error.message}\n`);
  process.exitCode = 1;
});
