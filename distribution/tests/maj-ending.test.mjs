import { test } from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { existsSync, mkdirSync, mkdtempSync, readFileSync, readdirSync, realpathSync, rmSync, symlinkSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { writeComparison } from '../../prompts/hard_points/system/maj/scripts/ending-1-compare-structures.mjs';
import { beginReport, readReport, statistics } from '../../prompts/hard_points/system/maj/scripts/ending-1-report-state.mjs';
import { captureContent, saveSnapshot } from '../../prompts/hard_points/system/maj/scripts/ending-1-content.mjs';

const scripts = fileURLToPath(new URL('../../prompts/hard_points/system/maj/scripts/', import.meta.url));
function fixture(t) {
  const directory = mkdtempSync(join(realpathSync(tmpdir()), 'aikido-ending-'));
  t.after(() => rmSync(directory, { recursive: true, force: true }));
  const put = (name, bytes) => writeFileSync(join(directory, name), bytes);
  const compare = (before = '{"a":1}', after = '{"a":2}') => {
    put('maj_before.json', before);
    put('maj_after.json', after);
    writeComparison(directory);
  };
  const cli = (engine, mode, ...args) => spawnSync(process.execPath, [
    join(scripts, engine), mode, ...args, '--dir', directory,
  ], { encoding: 'utf8', env: { ...process.env, PATH: directory } });
  const analysis = (mode, ...args) => cli('ending-2-report.mjs', mode, ...args);
  const workflow = (mode, ...args) => cli('ending-1-workflow.mjs', mode, ...args);
  return { directory, put, compare, analysis, workflow };
}

test('ending-2 summary is atomically published and empty input preserves the prior result', (t) => {
  const f = fixture(t);
  const path = join(f.directory, 'ending2_summary.txt');
  const run = (input) => spawnSync(process.execPath, [
    join(scripts, 'ending-2-report.mjs'), 'summary', '--dir', f.directory,
  ], { encoding: 'utf8', input });
  f.put('ending2_summary.txt', 'previous\n');
  assert.equal(run('  \n').status, 1);
  assert.equal(readFileSync(path, 'utf8'), 'previous\n');
  const result = run('new summary\n');
  assert.equal(result.status, 0, result.stderr);
  assert.equal(readFileSync(path, 'utf8'), 'new summary\n');
  if (process.platform !== 'win32') {
    const sentinel = join(f.directory, 'sentinel');
    f.put('sentinel', 'untouched');
    rmSync(path);
    symlinkSync(sentinel, path);
    assert.equal(run('safe replacement\n').status, 0);
    assert.equal(readFileSync(sentinel, 'utf8'), 'untouched');
    assert.equal(readFileSync(path, 'utf8'), 'safe replacement\n');
  }
});

test('all three CLI engines execute through a directory symlink or junction', (t) => {
  const f = fixture(t);
  const alias = join(f.directory, 'scripts alias');
  symlinkSync(scripts, alias, process.platform === 'win32' ? 'junction' : 'dir');
  f.put('maj_before.json', '{"a":1}');
  f.put('maj_after.json', '{"a":2}');
  const run = (name, ...args) => spawnSync(process.execPath, [
    join(alias, name), ...args, '--dir', f.directory,
  ], { encoding: 'utf8' });
  const comparison = run('ending-1-compare-structures.mjs');
  assert.equal(comparison.status, 0, comparison.stderr);
  assert.match(comparison.stdout, /Differential report generated/);
  assert.equal(readReport(f.directory).status, 'complete');
  const workflow = run('ending-1-workflow.mjs', 'statistics');
  assert.equal(workflow.status, 0, workflow.stderr);
  assert.equal(workflow.stdout, '1 0 0 1\n');
  const report = run('ending-2-report.mjs', 'analyze', '--list');
  assert.equal(report.status, 0, report.stderr);
  assert.equal(report.stdout, '  ~ "a"\n1 0 0 1\n');
  for (const name of [
    'ending-1-compare-structures.mjs', 'ending-1-workflow.mjs', 'ending-2-report.mjs',
  ]) {
    const invalid = run(name, '--unknown');
    assert.equal(invalid.status, 1, name);
    assert.notEqual(invalid.stderr, '', name);
  }
});

test('all three CLI engines execute through a file symlink',
  { skip: process.platform === 'win32' }, (t) => {
    const f = fixture(t);
    f.compare();
    for (const [name, args, expected] of [
      ['ending-1-compare-structures.mjs', [], /Differential report generated/],
      ['ending-1-workflow.mjs', ['statistics'], /^1 0 0 1\n$/],
      ['ending-2-report.mjs', ['validate'], /^VALID\n$/],
    ]) {
      const alias = join(f.directory, `alias ${name}`);
      symlinkSync(join(scripts, name), alias);
      const result = spawnSync(process.execPath, [alias, ...args, '--dir', f.directory], { encoding: 'utf8' });
      assert.equal(result.status, 0, result.stderr);
      assert.match(result.stdout, expected);
    }
  });

test('importing engines through aliased paths never runs their CLI', (t) => {
  const f = fixture(t);
  const alias = join(f.directory, 'scripts alias');
  symlinkSync(scripts, alias, process.platform === 'win32' ? 'junction' : 'dir');
  f.compare();
  const before = Object.fromEntries(readdirSync(f.directory)
    .filter((name) => name.endsWith('.json'))
    .map((name) => [name, readFileSync(join(f.directory, name), 'utf8')]));
  for (const [name, args] of [
    ['ending-1-compare-structures.mjs', ['--dir', f.directory]],
    ['ending-1-workflow.mjs', ['check-before', '--dir', f.directory]],
    ['ending-2-report.mjs', ['analyze', '--list', '--dir', f.directory]],
  ]) {
    const url = pathToFileURL(join(alias, name)).href;
    // An actual distinct importer path, absent argv[1], and synthetic embedding
    // argv all need to keep imports silent despite valid CLI arguments.
    for (const entry of [fileURLToPath(import.meta.url), null, join(f.directory, 'nonexistent importer')]) {
      const argv = entry === null ? [process.execPath] : [process.execPath, entry, ...args];
      const result = spawnSync(process.execPath, ['--input-type=module', '--eval',
        `process.argv = ${JSON.stringify(argv)}; await import(${JSON.stringify(url)});`,
      ], { encoding: 'utf8' });
      assert.equal(result.status, 0, result.stderr);
      assert.equal(result.stdout, '', name);
      assert.equal(result.stderr, '', name);
    }
  }
  for (const [name, bytes] of Object.entries(before)) {
    assert.equal(readFileSync(join(f.directory, name), 'utf8'), bytes, name);
  }
  assert.equal(readReport(f.directory).status, 'complete');
});

test('absent report stays absent; readers are non-blocking, statistics fail', (t) => {
  const f = fixture(t);
  assert.equal(f.analysis('check').stdout, 'EMPTY\n');
  assert.equal(f.analysis('validate').stdout, 'INVALID\n');
  const result = f.analysis('analyze', '--list');
  assert.equal(result.status, 0);
  assert.equal(result.stdout, 'N/A N/A N/A N/A\n');
  assert.equal(f.workflow('statistics').status, 1);
  assert.deepEqual(readdirSync(f.directory), []);
  assert.equal(f.workflow('check-before').stdout, 'SKIP_DIFF\n');
});

test('invalid JSON and invalid entry schema never yield fabricated zeros', (t) => {
  const f = fixture(t);
  for (const bytes of ['{', 'null', '[]', '42', '{"a":{}}', '{"a":{"before":1}}', '{"a":null}']) {
    f.put('maj_diff.json', bytes);
    assert.equal(readReport(f.directory).status, 'invalid');
    const validation = f.analysis('validate');
    const analysis = f.analysis('analyze');
    assert.equal(validation.status, 0, validation.stderr);
    assert.equal(validation.stdout, 'INVALID\n');
    assert.equal(analysis.status, 0, analysis.stderr);
    assert.equal(analysis.stdout, 'N/A N/A N/A N/A\n');
    assert.equal(readFileSync(join(f.directory, 'maj_diff.json'), 'utf8'), bytes);
  }
});

test('legacy report without receipt is stale and preserved', (t) => {
  const f = fixture(t);
  f.put('maj_diff.json', '{}');
  assert.equal(readReport(f.directory).status, 'stale');
  const check = f.analysis('check');
  assert.equal(check.status, 0, check.stderr);
  assert.equal(check.stdout, 'EMPTY\n');
  assert.equal(f.analysis('display').stdout, '');
  assert.equal(readFileSync(join(f.directory, 'maj_diff.json'), 'utf8'), '{}');
});

test('invalidation failure returns 1 rather than allowing stale reuse', (t) => {
  const f = fixture(t);
  f.compare();
  const blocked = join(f.directory, 'not a directory');
  writeFileSync(blocked, '');
  const result = spawnSync(process.execPath, [
    join(scripts, 'ending-1-workflow.mjs'), 'check-before', '--dir', blocked,
  ], { encoding: 'utf8' });
  assert.equal(result.status, 1);
  assert.equal(result.stdout, '');
  assert.equal(readReport(f.directory).status, 'complete'); // Unrelated run untouched.
});

test('zero changes consistently emits all four counters including --list', (t) => {
  const f = fixture(t);
  f.compare('{"a":1}', '{"a":1}');
  assert.equal(f.analysis('check').stdout, 'PRESENT\n');
  assert.equal(f.analysis('validate').stdout, 'VALID\n');
  assert.equal(f.workflow('statistics').stdout, '0 0 0 0\n');
  assert.equal(f.analysis('analyze', '--list').stdout, '0 0 0 0\n');
  assert.equal(f.analysis('display').stdout, '{}\n');
});

test('success counts and escaped lists are deterministic without external JSON tools', (t) => {
  const f = fixture(t);
  f.compare('{"z":1,"removed":false}', '{"z":2,"a\\nnew":true,"__proto__":"safe"}');
  assert.equal(f.workflow('statistics').stdout, '4 2 1 1\n');
  const result = f.analysis('analyze', '--list');
  assert.equal(result.status, 0, result.stderr);
  assert.equal(result.stdout, '  + "__proto__"\n  + "a\\nnew"\n  - "removed"\n  ~ "z"\n4 2 1 1\n');
  assert.equal(f.analysis('validate').stdout, 'VALID\n');
  assert.equal(statistics(JSON.parse('{"null":{"before":null,"after":null}}')).counts.join(' '), '1 1 1 0');
});

test('next plan attempt invalidates successful report even when before is absent', (t) => {
  const f = fixture(t);
  f.compare();
  const old = readFileSync(join(f.directory, 'maj_diff.json'), 'utf8');
  rmSync(join(f.directory, 'maj_before.json'));
  const check = f.workflow('check-before');
  assert.equal(check.status, 0, check.stderr);
  assert.equal(check.stdout, 'SKIP_DIFF\n');
  assert.equal(f.analysis('check').stdout, 'EMPTY\n');
  assert.equal(f.analysis('analyze').stdout, 'N/A N/A N/A N/A\n');
  assert.equal(readFileSync(join(f.directory, 'maj_diff.json'), 'utf8'), old);
});

test('failed comparison preserves report but prevents cross-plan reuse', (t) => {
  const f = fixture(t);
  f.compare();
  const old = readFileSync(join(f.directory, 'maj_diff.json'), 'utf8');
  for (const bytes of ['{', '[]', '{"unsafe":9007199254740993}']) {
    f.put('maj_after.json', bytes);
    assert.throws(() => writeComparison(f.directory));
    assert.equal(readReport(f.directory).status, 'stale');
    assert.equal(f.analysis('validate').stdout, 'INVALID\n');
    assert.equal(readFileSync(join(f.directory, 'maj_diff.json'), 'utf8'), old);
  }
  f.compare();
  assert.equal(f.analysis('validate').stdout, 'VALID\n');
  assert.equal(readdirSync(f.directory).some((name) => name.endsWith('.tmp')), false);
});

test('changed snapshot, report or receipt is rejected, including separately launched ending-2', (t) => {
  const f = fixture(t);
  for (const name of ['maj_before.json', 'maj_after.json', 'maj_diff.json', 'maj_diff.state.json']) {
    f.compare();
    const bytes = readFileSync(join(f.directory, name), 'utf8');
    if (name === 'maj_diff.state.json') f.put(name, '{"version":1,"status":"pending"}');
    else f.put(name, `${bytes} `);
    assert.equal(readReport(f.directory).status, 'stale', name);
    assert.equal(f.analysis('analyze').stdout, 'N/A N/A N/A N/A\n', name);
  }
  f.compare();
  beginReport(f.directory);
  assert.equal(f.analysis('validate').stdout, 'INVALID\n');
});

test('Node commands expose clean statuses and list/statistics modes', (t) => {
  const f = fixture(t);
  f.compare();
  const run = (name, command, ...args) => spawnSync(process.execPath, [
    join(scripts, name), command, ...args, '--dir', f.directory,
  ], { encoding: 'utf8' });
  for (const [name, command, expected] of [
    ['ending-2-report.mjs', 'check', 'PRESENT\n'],
    ['ending-2-report.mjs', 'validate', 'VALID\n'],
    ['ending-1-workflow.mjs', 'statistics', '1 0 0 1\n'],
  ]) {
    const result = run(name, command);
    assert.equal(result.status, 0, result.stderr);
    assert.equal(result.stdout, expected);
  }
  assert.equal(run('ending-2-report.mjs', 'analyze', '--list').stdout, '  ~ "a"\n1 0 0 1\n');
  // Capture entire stdout exactly as documented shell plans do.
  assert.equal(run('ending-1-workflow.mjs', 'check-before').stdout, 'NO_SKIP\n');
  assert.equal(run('ending-2-report.mjs', 'check').stdout, 'EMPTY\n');
});

test('backup scan sorts results and clears stale list when no backups remain', (t) => {
  const f = fixture(t);
  const source = join(f.directory, 'source');
  mkdirSync(source);
  writeFileSync(join(source, 'z.bak.1'), '');
  writeFileSync(join(source, 'a.bak'), '');
  writeFileSync(join(source, 'not-backup'), '');
  assert.equal(f.analysis('backups', source).stdout, '2\n');
  assert.equal(readFileSync(join(f.directory, 'backup_files_list.txt'), 'utf8'),
    `${join(source, 'a.bak')}\n${join(source, 'z.bak.1')}\n`);
  rmSync(join(source, 'a.bak'));
  rmSync(join(source, 'z.bak.1'));
  const empty = f.analysis('backups', source);
  assert.equal(empty.status, 0, empty.stderr);
  assert.equal(empty.stdout, '0\n');
  assert.equal(readFileSync(join(f.directory, 'backup_files_list.txt'), 'utf8'), '');
});

test('missing backup source fails without publishing zero or replacing the previous list', (t) => {
  const f = fixture(t);
  f.put('backup_files_list.txt', 'previous backup\n');
  const result = f.analysis('backups', join(f.directory, 'missing source'));
  assert.equal(result.status, 1);
  assert.equal(result.stdout, '');
  assert.match(result.stderr, /ENOENT/);
  assert.equal(readFileSync(join(f.directory, 'backup_files_list.txt'), 'utf8'), 'previous backup\n');
  assert.deepEqual(readdirSync(f.directory), ['backup_files_list.txt']);
});

test('backup publication failure emits no count and cleans up its temporary file', (t) => {
  const f = fixture(t);
  const source = join(f.directory, 'source');
  mkdirSync(source);
  // A directory at the publication target forces rename failure even as root.
  const target = join(f.directory, 'backup_files_list.txt');
  mkdirSync(target);
  writeFileSync(join(target, 'preserved'), 'old content');
  for (const withBackup of [false, true]) {
    if (withBackup) writeFileSync(join(source, 'a.bak'), '');
    const result = f.analysis('backups', source);
    assert.equal(result.status, 1, result.stderr);
    assert.equal(result.stdout, '');
    assert.notEqual(result.stderr, '');
    assert.equal(readFileSync(join(target, 'preserved'), 'utf8'), 'old content');
    assert.equal(readdirSync(f.directory).some((name) => name.endsWith('.tmp')), false);
  }
});

test('missing report directory remains unavailable data, not a failed backup scan', (t) => {
  const f = fixture(t);
  const missing = join(f.directory, 'missing directory');
  for (const [mode, expected] of [
    ['check', 'EMPTY\n'], ['validate', 'INVALID\n'],
    ['analyze', 'N/A N/A N/A N/A\n'], ['display', ''],
  ]) {
    const result = spawnSync(process.execPath, [
      join(scripts, 'ending-2-report.mjs'), mode, '--dir', missing,
    ], { encoding: 'utf8' });
    assert.equal(result.status, 0, result.stderr);
    assert.equal(result.stdout, expected);
  }
  assert.equal(existsSync(missing), false);
});

test('operational report and receipt reads fail instead of masquerading as invalid/stale', (t) => {
  const f = fixture(t);
  for (const name of ['maj_diff.json', 'maj_diff.state.json', 'maj_before.json', 'maj_after.json']) {
    f.compare();
    const path = join(f.directory, name);
    const old = readFileSync(path);
    rmSync(path);
    mkdirSync(path);
    assert.throws(() => readReport(f.directory), undefined, name);
    for (const mode of ['check', 'validate', 'analyze', 'display']) {
      const result = f.analysis(mode);
      assert.equal(result.status, 1, `${name}: ${mode}: ${result.stderr}`);
      assert.equal(result.stdout, '', `${name}: ${mode}`);
    }
    assert.equal(f.workflow('statistics').status, 1);
    rmSync(path, { recursive: true });
    writeFileSync(path, old);
  }
});

test('missing receipt or snapshot remains stale with exit 0', (t) => {
  const f = fixture(t);
  for (const name of ['maj_diff.state.json', 'maj_before.json', 'maj_after.json']) {
    f.compare();
    rmSync(join(f.directory, name));
    assert.equal(readReport(f.directory).status, 'stale');
    const result = f.analysis('analyze');
    assert.equal(result.status, 0, result.stderr);
    assert.equal(result.stdout, 'N/A N/A N/A N/A\n');
  }
});

test('Node backup scan propagates traversal and publication exit codes', (t) => {
    const f = fixture(t);
    const source = join(f.directory, 'source');
    const run = () => spawnSync(process.execPath, [
      join(scripts, 'ending-2-report.mjs'), 'backups', source, '--dir', f.directory,
    ], { encoding: 'utf8' });
    assert.equal(run().status, 1); // Missing source.
    mkdirSync(source);
    mkdirSync(join(f.directory, 'backup_files_list.txt'));
    const failedWrite = run();
    assert.equal(failedWrite.status, 1);
    assert.equal(failedWrite.stdout, '');
  });

test('after capture ignores the index generator, handles relative SOURCE and invalidates failures',
  { skip: process.platform === 'win32' }, (t) => {
    const f = fixture(t);
    const source = join(f.directory, 'source with spaces');
    const structure = join(source, 'prompts/hard_points/system/structure');
    mkdirSync(join(structure, 'scripts'), { recursive: true });
    const generator = join(structure, 'scripts/generate-all-indexes-v3.1.mjs');
    const invoke = (relative) => spawnSync(process.execPath, [
      join(scripts, 'ending-1-workflow.mjs'), 'generate-after', relative, '--dir', f.directory,
    ], { cwd: f.directory, encoding: 'utf8' });
    f.compare();
    const old = readFileSync(join(f.directory, 'maj_diff.json'), 'utf8');
    writeFileSync(generator, 'process.exitCode = 7;\n');
    assert.equal(invoke('source with spaces').status, 1);
    assert.equal(readReport(f.directory).status, 'stale');
    assert.equal(readFileSync(join(f.directory, 'maj_diff.json'), 'utf8'), old);
    saveSnapshot(f.directory, captureContent(source, 'before'));
    assert.equal(invoke('source with spaces').status, 0); // Generator exits 7 but is never run.
    writeFileSync(join(structure, 'index.json'), '{"generated":true}');
    assert.equal(invoke('source with spaces').status, 0);
    const after = JSON.parse(readFileSync(join(f.directory, 'maj_after.json'), 'utf8'));
    assert.equal(after.format, 'aikido-maj-content-v1');
    assert.ok(!Object.hasOwn(after.files, 'prompts/hard_points/system/structure/index.json'));
    assert.ok(Object.hasOwn(after.files, 'prompts/hard_points/system/structure/scripts/generate-all-indexes-v3.1.mjs'));
    assert.equal(invoke('missing source').status, 1);
    assert.ok(existsSync(join(f.directory, 'maj_diff.json')));
  });

test('active plans and scripts have no legacy JSON-tool dependency', () => {
  const plans = new URL('../../prompts/hard_points/system/maj/plans/', import.meta.url);
  for (const name of ['plan-ending-1.md', 'plan-ending-2.md']) {
    assert.doesNotMatch(readFileSync(new URL(name, plans), 'utf8'), /\bjq\b/);
  }
  for (const name of readdirSync(scripts).filter((name) => /^ending-[12]-/.test(name))) {
    assert.doesNotMatch(readFileSync(join(scripts, name), 'utf8'), /\bjq\b/, name);
  }
});

test('ending-2 publishes backup detection and a host-provided summary in the chosen work directory', (t) => {
  const f = fixture(t);
  const plan = readFileSync(new URL('../../prompts/hard_points/system/maj/plans/plan-ending-2.md', import.meta.url), 'utf8');
  assert.doesNotMatch(plan, /```(?:bash|sh|shell|zsh)/);
  assert.match(plan, /stdin[\s\S]*host's process API/);
  const source = join(f.directory, 'source');
  mkdirSync(source);
  writeFileSync(join(source, 'sample.bak'), 'backup candidate');
  const engine = join(scripts, 'ending-2-report.mjs');
  const backup = spawnSync(process.execPath, [engine, 'backups', source, '--dir', f.directory], { encoding: 'utf8' });
  assert.equal(backup.status, 0, backup.stderr);
  assert.equal(backup.stdout, '1\n');
  assert.match(readFileSync(join(f.directory, 'backup_files_list.txt'), 'utf8'), /sample\.bak/);
  const summaryText = 'Summary Plan Ending-2\nDetected: 1\nStatus: unavailable\n';
  const summary = spawnSync(process.execPath, [engine, 'summary', '--dir', f.directory], {
    input: summaryText, encoding: 'utf8',
  });
  assert.equal(summary.status, 0, summary.stderr);
  assert.equal(readFileSync(join(f.directory, 'ending2_summary.txt'), 'utf8'), summaryText);
});
