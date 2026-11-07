import { test } from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import {
  copyFileSync, existsSync, mkdirSync, mkdtempSync, readFileSync, readdirSync, realpathSync,
  rmSync, symlinkSync, utimesSync, writeFileSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { writeReport } from '../../prompts/hard_points/system/maj/scripts/ending-10-diagnostics.mjs';

const scripts = fileURLToPath(new URL('../../prompts/hard_points/system/maj/scripts/', import.meta.url));
const engine = join(scripts, 'ending-10-diagnostics.mjs');
const windows = process.platform === 'win32';
// Windows environment keys are case-insensitive: never pass both Path and PATH.
function environment(path, extra = {}) {
  const env = { ...process.env, ...extra };
  for (const key of Object.keys(env)) if (key.toUpperCase() === 'PATH') delete env[key];
  return { ...env, PATH: path };
}

function link(t, target, alias, directory = false) {
  try {
    symlinkSync(target, alias, directory ? (windows ? 'junction' : 'dir') : 'file');
    return true;
  } catch (error) {
    if (!windows || !['EPERM', 'EACCES', 'ENOTSUP'].includes(error.code)) throw error;
    t.skip(`Windows cannot create this link (${error.code}); privileges/developer mode required`);
    return false;
  }
}
const border = '═══════════════════════════════════════════════════════════════';
function fixture(t, withLogs = true) {
  const directory = mkdtempSync(join(tmpdir(), 'aikido diagnostics '));
  t.after(() => rmSync(directory, { recursive: true, force: true }));
  const source = join(directory, 'project with spaces');
  mkdirSync(source);
  const logs = join(source, 'prompts/spec/logs');
  if (withLogs) mkdirSync(logs, { recursive: true });
  const cli = (mode, ...args) => spawnSync(process.execPath, [engine, mode, ...args], {
    cwd: directory, encoding: 'utf8',
    // Direct Node commands must work with no find, sort, date, cat or jq.
    env: environment(directory, { TZ: 'UTC' }),
  });
  return { directory, source, logs, cli };
}

function success(result) {
  assert.equal(result.status, 0, result.stderr);
  assert.equal(result.stderr, '');
}

function failure(result) {
  assert.equal(result.status, 1, result.stderr);
  assert.match(result.stderr, /^ending-10: /);
  assert.doesNotMatch(result.stdout, /Report: |📝 Log created:/);
}

test('collector preserves context and sorted recent recursive basenames with spaces', (t) => {
  const f = fixture(t);
  writeFileSync(join(f.logs, 'phase-z file.log'), 'do not read log contents');
  writeFileSync(join(f.logs, 'phase-a file.log'), 'old');
  const old = new Date(Date.now() - 7200000);
  utimesSync(join(f.logs, 'phase-a file.log'), old, old);
  mkdirSync(join(f.logs, 'sub dir'));
  writeFileSync(join(f.logs, 'sub dir/phase-nested file.log'), 'nested');
  writeFileSync(join(f.logs, 'not-a-phase.log'), 'ignored');
  const result = f.cli('collect', 'project with spaces', 'ending-4', '42', 'bad file with spaces');
  success(result);
  assert.equal(result.stdout, [
    '===============================================================',
    'ERROR HANDLING - CENTRALIZED DIAGNOSTIC',
    '===============================================================', '',
    'Contexte:', '  Plan: ending-4', '  Code: 42', '  Msg: bad file with spaces', '',
    'Logs:', '  - phase-z file.log', '  - phase-nested file.log', '',
    'ending-4|42|bad file with spaces', '',
  ].join('\n'));
  assert.equal(readFileSync(join(f.logs, 'phase-z file.log'), 'utf8'), 'do not read log contents');
});

test('empty arguments retain documented defaults and SOURCE defaults to current directory', (t) => {
  const f = fixture(t);
  const result = spawnSync(process.execPath, [engine, 'collect', '', '', '', '', 'ignored'], {
    cwd: f.source, encoding: 'utf8', env: environment(f.directory),
  });
  success(result);
  assert.match(result.stdout, /Plan: UNKNOWN\n  Code: 1\n  Msg: No message/);
  assert.ok(result.stdout.endsWith('\nUNKNOWN|1|No message\n'));
  const report = spawnSync(process.execPath, [engine, 'report', '', '', '', ''], {
    cwd: f.source, encoding: 'utf8',
  });
  success(report);
  assert.match(report.stdout, /^Report: \.\/prompts\/spec\/logs\/error-report-/);
  assert.match(report.stdout, /\nPlan: UNKNOWN\nCode: 1\nMsg: No message\nDiag: Voir logs\n$/);
});

test('missing source/logs fails rather than fabricating a completed context', (t) => {
  const f = fixture(t, false);
  for (const source of [f.source, join(f.directory, 'missing')]) {
    const result = f.cli('collect', source, 'ending-0', '42', 'failure');
    failure(result);
    assert.match(result.stdout, /Contexte:\n  Plan: ending-0/);
    assert.ok(!result.stdout.endsWith('ending-0|42|failure\n'));
  }
  assert.equal(existsSync(f.logs), false);
});

test('diagnosis preserves complete ending-0 text and accepts ignored SOURCE', (t) => {
  const f = fixture(t);
  const expected = [
    border, '🔍 DIAGNOSTIC AUTOMATIQUE', border, '',
    '❌ Failure: Intelligent merge (ending-0)', '', 'Causes probables :',
    '  1. Agent-aikido-fusion introuvable', '  2. Corrupted source/target files',
    '  3. Invalid JSON differences', '', 'Proposed solutions:',
    '  - Check agent: ls -la prompts/hard_points/agents/agent-aikido-fusion.md',
    '  - Check JSON: ls -la /tmp/aikido/maj_*.json',
    '  - Restaurer agent depuis backups/', '  - Basculer mode MANUAL_LATER', '', '',
  ].join('\n');
  for (const plan of ['ending-0', 'plan-ending-0']) {
    const result = f.cli('diagnostic', plan, 'does not exist', 'ignored');
    success(result);
    assert.equal(result.stdout, expected);
  }
});

test('all established diagnostic branches and aliases; other plans remain generic', (t) => {
  const f = fixture(t);
  for (const [plan, label] of [
    ['ending-1', 'Change detection (ending-1)'],
    ['ending-3', 'Index generation (ending-3)'],
    ['ending-4', 'Structure validation (ending-4)'],
    ['beginning', 'Initialization (plan-beginning)'],
  ]) {
    const result = f.cli('diagnostic', plan);
    const alias = f.cli('diagnostic', `plan-${plan}`);
    success(result);
    success(alias);
    assert.ok(result.stdout.includes(`❌ Failure: ${label}\n`));
    assert.equal(result.stdout, alias.stdout);
  }
  for (const plan of ['ending-2', 'ending-5', 'ending-6', 'ending-7', 'plan with spaces', '__proto__', '']) {
    const result = f.cli('diagnostic', plan);
    success(result);
    assert.equal(result.stdout, [
      border, '🔍 DIAGNOSTIC AUTOMATIQUE', border, '',
      `❌ Failure: Unknown or unspecified plan (${plan || 'UNKNOWN'})`, '',
      'Generic solutions:', '  - Consulter les logs : cat prompts/spec/logs/phase-*.log',
      '  - Check project integrity',
      '  - Restaurer backup : tar -xzf backups/aikido-verif-backup-*.tgz', '', '',
    ].join('\n'));
  }
});

test('report preserves legacy stdout, fields, literal data and creates missing log directories', (t) => {
  const f = fixture(t, false);
  const message = 'JSON {"invalid": | "quoted"}\nsecond line $HOME; $(do-not-execute)';
  const result = f.cli('report', 'project with spaces', 'ending-1', '42', message);
  success(result);
  const [firstLine, ...body] = result.stdout.split('\n');
  assert.match(firstLine, /^Report: project with spaces\/prompts\/spec\/logs\/error-report-\d{8}-\d{6}\.md$/);
  const path = join(f.directory, firstLine.slice('Report: '.length));
  const text = readFileSync(path, 'utf8');
  assert.equal(body.join('\n'), text);
  assert.match(text, /^# Error Report\nDate: .+\nPlan: ending-1\nCode: 42\n/);
  assert.ok(text.endsWith(`Msg: ${message}\nDiag: Detection - Script generation\n`));
  // The old report did not normalize plan aliases; preserve that distinction.
  const alias = f.cli('report', f.source, 'plan-ending-1');
  success(alias);
  assert.ok(alias.stdout.endsWith('Diag: Voir logs\n'));
});

test('same-second reports and existing files are not overwritten on every platform', (t) => {
  const f = fixture(t);
  const date = new Date(2026, 0, 2, 3, 4, 5);
  const base = join(f.logs, 'error-report-20260102-030405.md');
  writeFileSync(base, 'user report');
  const one = writeReport([f.source, 'ending-0', '9', 'one'], date);
  const two = writeReport([f.source, 'ending-0', '9', 'two'], date);
  assert.ok(one.path.endsWith('-1.md'));
  assert.ok(two.path.endsWith('-2.md'));
  assert.equal(readFileSync(base, 'utf8'), 'user report');
  assert.ok(readFileSync(one.path, 'utf8').includes('Msg: one\nDiag: Merge - Agent missing\n'));
  assert.ok(readFileSync(two.path, 'utf8').includes('Msg: two\n'));
});

test('dangling report symlinks are not overwritten when link creation is supported', (t) => {
  const f = fixture(t);
  const outside = join(f.directory, 'untouched.txt');
  const base = join(f.logs, 'error-report-20260102-030405.md');
  if (!link(t, outside, base)) return;
  const report = writeReport([f.source], new Date(2026, 0, 2, 3, 4, 5));
  assert.ok(report.path.endsWith('-1.md'));
  assert.equal(existsSync(outside), false);
});

test('report-path fixes plan command substitution and log appends without erasing history', (t) => {
  const f = fixture(t);
  const report = f.cli('report-path', f.source, 'ending-4', '42', 'bad data');
  success(report);
  assert.equal(report.stdout.split('\n').length, 2);
  const path = report.stdout.trimEnd();
  assert.ok(existsSync(path));
  const logPath = join(f.logs, 'phase-10-error.log');
  writeFileSync(logPath, 'previous incident\n');
  for (let attempt = 0; attempt < 2; attempt++) {
    const result = f.cli('log', f.source, 'ending-4', '42', 'bad data', path);
    success(result);
    // stdout intentionally preserves SOURCE + legacy forward-slash suffix;
    // filesystem paths above use native separators on Windows.
    assert.equal(result.stdout, `📝 Log created: ${f.source}/prompts/spec/logs/phase-10-error.log\n\n`);
  }
  const text = readFileSync(logPath, 'utf8');
  assert.ok(text.startsWith('previous incident\n'));
  assert.equal(text.split('Plan Ending-10 : Centralized Error Handling').length, 3);
  assert.ok(text.includes(`  Report         : ${path}\n`));
});

test('blocked report/log destinations, invalid report and missing SOURCE propagate errors', (t) => {
  const f = fixture(t, false);
  writeFileSync(join(f.source, 'prompts'), 'user data');
  failure(f.cli('report', f.source));
  failure(f.cli('report-path', join(f.directory, 'missing')));
  assert.equal(existsSync(join(f.directory, 'missing')), false);
  assert.equal(readFileSync(join(f.source, 'prompts'), 'utf8'), 'user data');
  const g = fixture(t);
  failure(g.cli('log', g.source, 'ending-0', '1', 'failed'));
  const invalid = join(g.directory, 'not a report');
  writeFileSync(invalid, 'arbitrary text');
  failure(g.cli('log', g.source, 'ending-0', '1', 'failed', invalid));
  assert.equal(existsSync(join(g.logs, 'phase-10-error.log')), false);
  const report = g.cli('report-path', g.source);
  success(report);
  mkdirSync(join(g.logs, 'phase-10-error.log'));
  failure(g.cli('log', g.source, 'ending-0', '1', 'failed', report.stdout.trimEnd()));
});

test('linked log directories never modify external data', (t) => {
  const f = fixture(t, false);
  const outside = join(f.directory, 'external logs');
  mkdirSync(outside);
  mkdirSync(join(f.source, 'prompts/spec'), { recursive: true });
  if (!link(t, outside, f.logs, true)) return;
  failure(f.cli('collect', f.source));
  failure(f.cli('report', f.source));
  assert.deepEqual(readdirSync(outside), []);
});

test('symlinked log destinations never modify external data', (t) => {
  const g = fixture(t);
  const report = g.cli('report-path', g.source);
  success(report);
  const userFile = join(g.directory, 'user file');
  writeFileSync(userFile, 'keep me');
  if (!link(t, userFile, join(g.logs, 'phase-10-error.log'))) return;
  failure(g.cli('log', g.source, 'ending-0', '1', 'failed', report.stdout.trimEnd()));
  assert.equal(readFileSync(userFile, 'utf8'), 'keep me');
});

for (const directory of [false, true]) {
  test(`Node CLI runs through ${directory ? 'directory' : 'file'} link aliases`, (t) => {
    const f = fixture(t);
    // Explicit aliases make this independent of macOS /var -> /private/var.
    const realDirectory = join(realpathSync(f.directory), 'real scripts with spaces');
    mkdirSync(realDirectory);
    const realEngine = join(realDirectory, 'ending-10-diagnostics.mjs');
    copyFileSync(engine, realEngine);
    const linkPath = join(f.directory, directory ? 'directory alias' : 'engine alias.mjs');
    if (!link(t, directory ? realDirectory : realEngine, linkPath, directory)) return;
    const alias = directory ? join(linkPath, 'ending-10-diagnostics.mjs') : linkPath;
    const expected = f.cli('diagnostic', 'ending-0');
    success(expected);
    assert.match(expected.stdout, /🔍 DIAGNOSTIC AUTOMATIQUE/);
    assert.notEqual(alias, realpathSync(alias));
    for (const flags of [[], ['--preserve-symlinks-main']]) {
      const invoke = (mode, ...args) => spawnSync(process.execPath, [
        ...flags, alias, mode, ...args,
      ], { cwd: f.directory, encoding: 'utf8' });
      const result = invoke('diagnostic', 'ending-0');
      success(result);
      assert.equal(result.stdout, expected.stdout);
      failure(invoke('invalid-mode'));
      failure(invoke('report-path', join(f.directory, 'missing')));
      const report = invoke('report-path', f.source, 'ending-0', '42', 'alias message');
      success(report);
      assert.match(report.stdout, /error-report-\d{8}-\d{6}(?:-\d+)?\.md\n$/);
      assert.match(readFileSync(report.stdout.trimEnd(), 'utf8'), /Msg: alias message\n/);
    }
  });
}

for (const kind of ['direct', 'file', 'directory']) {
  test(`imports through ${kind} paths expose functions without executing CLI main`, (t) => {
    const f = fixture(t);
    const directoryAlias = join(f.directory, 'import directory alias');
    const fileAlias = join(f.directory, 'import file alias.mjs');
    if (kind === 'directory' && !link(t, realpathSync(scripts), directoryAlias, true)) return;
    if (kind === 'file' && !link(t, realpathSync(engine), fileAlias)) return;
    const alias = kind === 'direct' ? engine : kind === 'file'
      ? fileAlias : join(directoryAlias, 'ending-10-diagnostics.mjs');
    const url = pathToFileURL(alias).href;
    const code = `const mod = await import(${JSON.stringify(url)});
      if (typeof mod.run !== 'function' || typeof mod.writeReport !== 'function') {
        throw new Error('Missing exports');
      }`;
    // With no argv[1], and with a nonexistent eval argument.
    for (const args of [[], [join(f.directory, 'nonexistent entry.mjs'), 'invalid-mode']]) {
      const result = spawnSync(process.execPath, ['--input-type=module', '-e', code, ...args], {
        cwd: f.directory, encoding: 'utf8',
      });
      success(result);
      assert.equal(result.stdout, '');
    }
    // A real, unrelated main file must not trigger the imported engine either.
    const launcher = join(f.directory, 'import launcher.mjs');
    writeFileSync(launcher, code);
    const result = spawnSync(process.execPath, [launcher, 'report', f.source], {
      cwd: f.directory, encoding: 'utf8',
    });
    success(result);
    assert.equal(result.stdout, '');
    assert.deepEqual(readdirSync(f.logs), []);
  });
}

test('invalid usage and Node below 24 cannot return successful diagnostics', (t) => {
  const f = fixture(t);
  failure(f.cli('not-a-mode'));
  const url = new URL('../../prompts/hard_points/system/maj/scripts/ending-10-diagnostics.mjs', import.meta.url).href;
  const result = spawnSync(process.execPath, ['--input-type=module', '-e', `
    Object.defineProperty(process.versions, 'node', { value: '22.0.0' });
    const { run } = await import(${JSON.stringify(url)});
    try { run('diagnostic', ['ending-0']); }
    catch (error) { process.stderr.write(error.message); process.exitCode = 1; }
  `], { encoding: 'utf8' });
  assert.equal(result.status, 1);
  assert.equal(result.stdout, '');
  assert.equal(result.stderr, 'ending-10 requires Node.js 24+');
});

test('JSON/jq are informational only; malformed JSON is not parsed or changed', (t) => {
  const f = fixture(t);
  const json = join(f.directory, 'maj_diff.json');
  writeFileSync(json, '{ malformed JSON');
  writeFileSync(join(f.directory, 'jq'), `#!${process.execPath}\nprocess.exit(99);\n`, { mode: 0o700 });
  success(f.cli('collect', f.source, 'ending-0'));
  success(f.cli('diagnostic', 'ending-0'));
  success(f.cli('report', f.source, 'ending-0'));
  assert.equal(readFileSync(json, 'utf8'), '{ malformed JSON');
});

test('ending-10 phases keep the original failure when collection or reporting fails', (t) => {
  const f = fixture(t);
  const plan = readFileSync(new URL('../../prompts/hard_points/system/maj/plans/plan-ending-10.md', import.meta.url), 'utf8');
  assert.doesNotMatch(plan, /```(?:bash|sh|shell|zsh)/);
  const complete = f.cli('collect', f.source, 'ending-4', '42', 'Validation failed');
  success(complete);
  const diagnostic = f.cli('diagnostic', 'ending-4', f.source);
  success(diagnostic);
  assert.match(diagnostic.stdout, /Structure validation/);
  const reportPath = f.cli('report-path', f.source, 'ending-4', '42', 'Validation failed');
  success(reportPath);
  const report = reportPath.stdout.trimEnd();
  assert.match(report, /error-report-/);
  const logged = f.cli('log', f.source, 'ending-4', '42', 'Validation failed', report);
  success(logged);
  assert.match(logged.stdout, /Log created/);
  assert.match(readFileSync(join(f.logs, 'phase-10-error.log'), 'utf8'),
    /Code           : 42\n  Message        : Validation failed/);
  const missing = join(f.directory, 'missing');
  const incomplete = f.cli('collect', missing, 'ending-4', '42', 'failed');
  failure(incomplete);
  const stillDiagnosed = f.cli('diagnostic', 'ending-4', missing);
  success(stillDiagnosed);
  assert.match(stillDiagnosed.stdout, /Structure validation/);
  const noReport = f.cli('report-path', missing, 'ending-4', '42', 'failed');
  failure(noReport);
  assert.equal(incomplete.status, 1, 'collection failure must not become success');
  assert.equal(noReport.status, 1, 'report-path failure must not become success');
  assert.match(plan, /Diagnostic failures never\s+change the original workflow's failed status/);
  assert.match(plan, /collection, diagnosis, report creation, or logging must be surfaced as\s+diagnostic failures; none may convert the original failure into success,\s+clear its status, or unblock the update/);
  assert.match(plan, /Log\/report failures are\s+non-blocking diagnostics only/);
  assert.match(plan, /preserve\s+the original failed\s+status/);
  assert.match(plan, /do not turn the original update failure into\s+success or unblock\s+the update/);
  assert.equal(existsSync(join(f.directory, 'missing')), false);
});

test('plan invokes Node directly and has no unsafe extraction or success-on-failure promise', () => {
  const plan = readFileSync(new URL('../../prompts/hard_points/system/maj/plans/plan-ending-10.md', import.meta.url), 'utf8');
  assert.match(plan, /Node\.js 24\+/);
  assert.match(plan, /ending-10-diagnostics\.mjs report-path/);
  assert.match(plan, /ending-10-diagnostics\.mjs log/);
  assert.doesNotMatch(plan, /```(?:bash|sh|shell|zsh)|tar -xzf|cat >|cannot fail|successful in \*\*ALL cases/);
  assert.match(plan, /Diagnostic failures never\s+change the original workflow's failed status/);
  assert.match(plan, /none may convert the original failure into success/);
});
