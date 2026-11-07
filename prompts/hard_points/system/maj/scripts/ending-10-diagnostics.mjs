#!/usr/bin/env node
// Legacy ending-10 only. See ../plans/plan-ending-10.md for its contract.
import {
  constants, closeSync, fstatSync, lstatSync, mkdirSync, openSync, readFileSync,
  readdirSync, realpathSync, writeFileSync,
} from 'node:fs';
import { basename, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const border = '═══════════════════════════════════════════════════════════════';
const legacyBorder = '===============================================================';
const output = (text) => process.stdout.write(text);

function requireNode() {
  if (Number(process.versions.node.split('.')[0]) < 24) {
    throw new Error('ending-10 requires Node.js 24+');
  }
}

// Empty strings also select the default; trailing arguments are ignored.
function context(args) {
  return {
    source: args[0] || '.', plan: args[1] || 'UNKNOWN',
    code: args[2] || '1', message: args[3] || 'No message',
  };
}

// Resolve SOURCE once and reject symlinked descendants, especially for writes.
function logsDirectory(source, create = false) {
  let directory = realpathSync(resolve(source));
  if (!lstatSync(directory).isDirectory()) throw new Error(`Not a directory: ${source}`);
  for (const part of ['prompts', 'spec', 'logs']) {
    directory = join(directory, part);
    if (create) {
      try { mkdirSync(directory); } catch (error) {
        if (error.code !== 'EEXIST') throw error;
      }
    }
    if (!lstatSync(directory).isDirectory()) {
      throw new Error(`Not a real directory (symlinks refused): ${directory}`);
    }
  }
  return directory;
}

export function collect(args = [], now = Date.now()) {
  const { source, plan, code, message } = context(args);
  output(`${legacyBorder}\nERROR HANDLING - CENTRALIZED DIAGNOSTIC\n${legacyBorder}\n\n`);
  // Keep context on screen even when logs cannot be inspected.
  output(`Contexte:\n  Plan: ${plan}\n  Code: ${code}\n  Msg: ${message}\n\nLogs:\n`);
  const directory = logsDirectory(source);
  const logs = [];
  function visit(path) {
    for (const name of readdirSync(path)) {
      const child = join(path, name);
      const stat = lstatSync(child); // Like find: do not follow symlink directories.
      if (name.startsWith('phase-') && name.endsWith('.log') && now - stat.mtimeMs < 3600000) {
        logs.push(child);
      }
      if (stat.isDirectory()) visit(child);
    }
  }
  visit(directory);
  for (const log of logs.sort()) output(`  - ${basename(log)}\n`);
  output(`\n${plan}|${code}|${message}\n`);
}

const diagnoses = {
  'ending-0': [
    '❌ Failure: Intelligent merge (ending-0)', '', 'Causes probables :',
    '  1. Agent-aikido-fusion introuvable', '  2. Corrupted source/target files',
    '  3. Invalid JSON differences', '', 'Proposed solutions:',
    '  - Check agent: ls -la prompts/hard_points/agents/agent-aikido-fusion.md',
    '  - Check JSON: ls -la /tmp/aikido/maj_*.json',
    '  - Restaurer agent depuis backups/', '  - Basculer mode MANUAL_LATER',
  ],
  'ending-1': [
    '❌ Failure: Change detection (ending-1)', '', 'Causes probables :',
    '  1. Missing or stale before snapshot',
    '  2. SOURCE content changed during capture', '  3. Permissions insuffisantes', '', 'Proposed solutions:',
    '  - Repeat the beginning snapshot with an exclusive private work directory',
    '  - Check SOURCE and work-directory permissions',
  ],
  'ending-3': [
    '❌ Failure: Index generation (ending-3)', '', 'Causes probables :',
    '  1. Write permissions on /prompts/', '  2. Project type wrongly detected',
    '  3. Index.md not created', '', 'Proposed solutions:',
    '  - Check permissions: ls -ld prompts/',
    '  - From the project root: node prompts/hard_points/system/maj/scripts/detect-project-type.mjs detect .',
    '  - Review the missing index and the ending-3 generation failure',
    '  - Re-run: /maj-aikido (plan ending-3 will run again)',
  ],
  'ending-4': [
    '❌ Failure: Structure validation (ending-4)', '', 'Causes probables :',
    '  1. Critical files missing (index.md, ai-kido.md)', '  2. Structure non conforme V1.3',
    '  3. Structure validation failed', '', 'Proposed solutions:',
    '  - Check: ls -la prompts/index.md prompts/hard_points/ai-kido.md',
    '  - From SOURCE: node prompts/hard_points/system/maj/scripts/validate-structure.mjs --type auto',
    '  - Review missing hard points and restore only through an approved procedure',
  ],
  beginning: [
    '❌ Failure: Initialization (plan-beginning)', '', 'Causes probables :',
    '  1. Backup creation/verification failed', '  2. Versions cannot be detected',
    '  3. Permissions backups/', '', 'Proposed solutions:',
    '  - Create directory: mkdir -p backups && chmod 755 backups',
    '  - Check files: ls -la prompts/hard_points/ai-kido.md',
  ],
};

export function diagnostic(args = []) {
  const plan = args[0] || 'UNKNOWN';
  const key = plan.startsWith('plan-') ? plan.slice(5) : plan;
  const lines = Object.hasOwn(diagnoses, key) ? diagnoses[key] : [
    `❌ Failure: Unknown or unspecified plan (${plan})`, '', 'Generic solutions:',
    '  - Consulter les logs : cat prompts/spec/logs/phase-*.log',
    '  - Check project integrity',
    '  - Restaurer backup : tar -xzf backups/aikido-verif-backup-*.tgz',
  ];
  output(`${border}\n🔍 DIAGNOSTIC AUTOMATIQUE\n${border}\n\n${lines.join('\n')}\n\n`);
}

const pad = (n) => String(n).padStart(2, '0');
function timestamp(date) {
  return `${date.getFullYear()}${pad(date.getMonth() + 1)}${pad(date.getDate())}-${pad(date.getHours())}${pad(date.getMinutes())}${pad(date.getSeconds())}`;
}

// No external date/locale command. Preserve the legacy textual Date field.
function displayDate(date) {
  const day = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][date.getDay()];
  const month = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'][date.getMonth()];
  const zone = new Intl.DateTimeFormat('en-US', { timeZoneName: 'short' })
    .formatToParts(date).find((part) => part.type === 'timeZoneName').value;
  return `${day} ${month} ${String(date.getDate()).padStart(2, ' ')} ${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())} ${zone} ${date.getFullYear()}`;
}

export function writeReport(args = [], date = new Date()) {
  const { source, plan, code, message } = context(args);
  const directory = logsDirectory(source, true);
  const diagnosis = plan === 'ending-0' ? 'Merge - Agent missing'
    : plan === 'ending-1' ? 'Detection - Script generation' : 'Voir logs';
  const text = `# Error Report\nDate: ${displayDate(date)}\nPlan: ${plan}\nCode: ${code}\nMsg: ${message}\nDiag: ${diagnosis}\n`;
  // Legacy second-resolution naming must never truncate another report.
  for (let suffix = 0; suffix < 10000; suffix++) {
    const name = `error-report-${timestamp(date)}${suffix ? `-${suffix}` : ''}.md`;
    let fd;
    try { fd = openSync(join(directory, name), 'wx', 0o600); } catch (error) {
      if (error.code === 'EEXIST') continue;
      throw error;
    }
    try { writeFileSync(fd, text); } finally { closeSync(fd); }
    return { path: `${source}/prompts/spec/logs/${name}`, text };
  }
  throw new Error('Too many report name collisions');
}

export function writeLog(args = [], date = new Date()) {
  const { source, plan, code, message } = context(args);
  const report = args[4];
  const directory = logsDirectory(source, true);
  if (!report || !lstatSync(report).isFile()) throw new Error('A real error report is required');
  const reportText = readFileSync(report, 'utf8');
  if (!reportText.startsWith('# Error Report\n')) throw new Error('Invalid error report');
  const path = join(directory, 'phase-10-error.log');
  try {
    if (!lstatSync(path).isFile()) throw new Error(`Not a regular log file: ${path}`);
  } catch (error) {
    if (error.code !== 'ENOENT') throw error;
  }
  const text = `${border}
Plan Ending-10 : Centralized Error Handling
${border}
Date: ${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}

ERROR:
  Failed plan    : ${plan}
  Code           : ${code}
  Message        : ${message}

DIAGNOSIS:
  Report         : ${report}
  Solutions      : See automatic diagnosis above

OPTIONS PROVIDED:
  1. Fix and restart
  2. Full rollback
  3. Partial rollback
  4. In-depth diagnosis
  5. Manual mode

${border}
`;
  // Append, never truncate an earlier incident; refuse a symlink destination.
  const fd = openSync(path, constants.O_WRONLY | constants.O_CREAT
    | constants.O_APPEND | constants.O_NOFOLLOW | constants.O_NONBLOCK, 0o600);
  try {
    if (!fstatSync(fd).isFile()) throw new Error(`Not a regular log file: ${path}`);
    writeFileSync(fd, text);
  } finally { closeSync(fd); }
  return `${source}/prompts/spec/logs/phase-10-error.log`;
}

export function run(mode, args = []) {
  requireNode();
  if (mode === 'collect') collect(args);
  else if (mode === 'diagnostic') diagnostic(args);
  else if (mode === 'report' || mode === 'report-path') {
    const report = writeReport(args);
    output(mode === 'report' ? `Report: ${report.path}\n${report.text}` : `${report.path}\n`);
  } else if (mode === 'log') output(`📝 Log created: ${writeLog(args)}\n\n`);
  else throw new Error('Usage: ending-10-diagnostics.mjs <collect|diagnostic|report|report-path|log> [legacy arguments]');
}

function isMain() {
  if (!process.argv[1]) return false;
  try {
    // Node normally canonicalizes the module URL, but not argv[1]. Compare
    // both real paths, including with --preserve-symlinks-main.
    return realpathSync(resolve(process.argv[1])) === realpathSync(fileURLToPath(import.meta.url));
  } catch {
    // Imports from eval/another entry point may have no existing argv path.
    return false;
  }
}

if (isMain()) {
  try { run(process.argv[2], process.argv.slice(3)); } catch (error) {
    process.stderr.write(`ending-10: ${error.message}\n`);
    process.exitCode = 1;
  }
}
