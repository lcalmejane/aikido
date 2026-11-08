#!/usr/bin/env node
import { constants, closeSync, mkdirSync, openSync, writeFileSync } from 'node:fs';
import { dirname } from 'node:path';
import { isMainModule } from './ending-1-report-state.mjs';

const divider = '═══════════════════════════════════════════════════════════════';

function localDate(date) {
  const pad = (value) => String(value).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} `
    + `${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`;
}

export function createLog(path, title = 'Log Entry', content = '', date = new Date()) {
  if (typeof path !== 'string' || path.length === 0 || path.includes('\0')) {
    throw new Error('Usage: create-log.mjs <log_file> <title> [content]');
  }
  if (Number(process.versions.node.split('.')[0]) < 24) {
    throw new Error('MAJ log creation requires Node.js 24 or newer');
  }
  mkdirSync(dirname(path), { recursive: true });
  const text = `${divider}\n${title || 'Log Entry'}\n${divider}\nDate : ${localDate(date)}\n\n${content}\n\n${divider}\n`;
  const fd = openSync(path, constants.O_WRONLY | constants.O_CREAT | constants.O_EXCL | (constants.O_NOFOLLOW || 0), 0o666);
  try {
    writeFileSync(fd, text);
  } finally {
    closeSync(fd);
  }
}

if (isMainModule(import.meta.url)) {
  try {
    if (process.argv.length > 5) throw new Error('Usage: create-log.mjs <log_file> <title> [content]');
    const [path, title, content] = process.argv.slice(2);
    createLog(path, title, content);
    process.stdout.write(`📝 Log created: ${path}\n`);
  } catch (error) {
    process.stderr.write(`Log creation failed: ${error.message}\n`);
    process.exitCode = 1;
  }
}
