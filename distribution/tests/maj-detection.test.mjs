import { test } from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import {
  chmodSync, copyFileSync, existsSync, lstatSync, mkdirSync, mkdtempSync,
  readFileSync, readdirSync, realpathSync, rmSync, symlinkSync, writeFileSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { detectProjectType } from '../../prompts/hard_points/system/maj/scripts/detect-project-type.mjs';
import { detectVersion } from '../../prompts/hard_points/system/maj/scripts/detect-version.mjs';

const repository = fileURLToPath(new URL('../../', import.meta.url));
const scripts = join(repository, 'prompts/hard_points/system/maj/scripts');
const projectEngine = join(scripts, 'detect-project-type.mjs');
const versionEngine = join(scripts, 'detect-version.mjs');
const beginningEngine = join(scripts, 'beginning-detect-versions.mjs');
const env = { ...process.env, LC_ALL: 'C', LANG: 'C', AIKIDO_DETECTION_PROGRAM: '' };
function fixture(t) {
  const root = realpathSync(mkdtempSync(join(tmpdir(), 'aikido maj detection ')));
  t.after(() => rmSync(root, { recursive: true, force: true }));
  return root;
}
function execute(binary, args, cwd, extraEnv = {}) {
  const result = spawnSync(binary, args, {
    cwd, env: { ...env, ...extraEnv }, encoding: 'utf8', timeout: 15000,
  });
  assert.ifError(result.error);
  return result;
}
function node(entry, args, cwd, extraEnv) {
  return execute(process.execPath, [entry, ...args], cwd, extraEnv);
}
function putVersion(root, content) {
  const file = join(root, 'prompts/hard_points/ai-kido.md');
  mkdirSync(dirname(file), { recursive: true });
  writeFileSync(file, content);
  return file;
}
// Snapshot only owned fixtures. Never traverse the user's project or spec.
function snapshot(root) {
  return readdirSync(root).sort().map((name) => {
    const path = join(root, name);
    const stat = lstatSync(path);
    return [name, stat.isDirectory() ? snapshot(path)
      : stat.isSymbolicLink() ? 'symlink' : readFileSync(path).toString('base64')];
  });
}

test('MONO ignores reserved directories, regular files and nested directories', (t) => {
  assert.ok(Number(process.versions.node.split('.')[0]) >= 24, 'Run this suite with Node.js 24+');
  const root = fixture(t);
  for (const name of ['gen/nested', 'hard_points', 'spec']) {
    mkdirSync(join(root, 'prompts', name), { recursive: true });
  }
  writeFileSync(join(root, 'prompts/index.md'), 'fixture index');
  const before = snapshot(root);
  assert.deepEqual(detectProjectType(root), { type: 'MONO', projects: [] });
  for (const args of [[], ['detect'], ['detect', ''], ['detect', root, 'ignored']]) {
    const result = node(projectEngine, args, root);
    assert.equal(result.status, 0, result.stderr);
    assert.equal(result.stdout, 'MONO\n');
    assert.equal(result.stderr, '\x1b[0;34mℹ️  Type: Mono-projet\x1b[0m\n');
  }
  assert.deepEqual(snapshot(root), before);
});
test('MULTI includes hidden and spaced names, sorted in C byte order', (t) => {
  const root = fixture(t);
  const names = ['équipe', 'zeta', 'Alpha', '.hidden', 'project with spaces'];
  for (const name of [...names, 'gen', 'hard_points', 'spec']) {
    mkdirSync(join(root, 'prompts', name), { recursive: true });
  }
  const sorted = [...names].sort((a, b) => Buffer.compare(Buffer.from(a), Buffer.from(b)));
  const before = snapshot(root);
  assert.deepEqual(detectProjectType(root), { type: 'MULTI', projects: sorted });
  const result = node(projectEngine, ['detect', root], tmpdir());
  assert.equal(result.status, 0, result.stderr);
  assert.equal(result.stdout, `MULTI\n${sorted.join('\n')}\n`);
  assert.equal(result.stderr, '\x1b[0;34mℹ️  Type: Multi-projet (5 projets)\x1b[0m\n');
  assert.deepEqual(snapshot(root), before);
});
test('root argument appends prompts; missing/non-directory keeps historical stdout', (t) => {
  const root = fixture(t);
  for (const setup of [() => {}, () => writeFileSync(join(root, 'prompts'), 'not a directory')]) {
    setup();
    const before = snapshot(root);
    const result = node(projectEngine, ['detect', root], root);
    assert.equal(result.status, 1);
    assert.equal(result.stdout, 'ERROR: prompts directory not found\n');
    assert.equal(result.stderr, '');
    assert.deepEqual(snapshot(root), before);
  }
  rmSync(join(root, 'prompts')); // Owned fixture only.
  mkdirSync(join(root, 'prompts'));
  assert.equal(node(projectEngine, ['detect', join(root, 'prompts')], root).status, 1);
});
test('project help, unknown commands and ignored trailing arguments', (t) => {
  const root = fixture(t);
  for (const option of ['-h', '--help', '--unknown', 'other']) {
    const result = node(projectEngine, [option, 'ignored'], root);
    assert.equal(result.status, ['-h', '--help'].includes(option) ? 0 : 1);
    assert.match(result.stdout, /^Usage: detect-project-type\.mjs detect \[prompts_dir\]\n/);
    assert.equal(result.stderr, '');
  }
});
test('child directory symlinks do not count; prompts symlink is safely refused', (t) => {
  if (process.platform === 'win32') return t.skip('POSIX symlink fixture');
  const root = fixture(t);
  mkdirSync(join(root, 'prompts'));
  mkdirSync(join(root, 'elsewhere'));
  symlinkSync(join(root, 'elsewhere'), join(root, 'prompts/linked'));
  assert.equal(node(projectEngine, ['detect', root], root).stdout, 'MONO\n');
  const other = join(root, 'other');
  mkdirSync(other);
  symlinkSync(join(root, 'prompts'), join(other, 'prompts'));
  const before = snapshot(root);
  const result = node(projectEngine, ['detect', other], root);
  assert.equal(result.status, 1);
  assert.equal(result.stdout, '');
  assert.match(result.stderr, /Symbolic prompts directory/);
  assert.deepEqual(snapshot(root), before);
});
test('line-breaking project names fail without partial stdout or data changes', (t) => {
  if (process.platform === 'win32') return t.skip('POSIX filename fixture');
  const root = fixture(t);
  for (const name of ['valid', 'bad\nname', 'bad\rname']) {
    mkdirSync(join(root, 'prompts', name), { recursive: true });
  }
  const before = snapshot(root);
  const result = node(projectEngine, ['detect', root], root);
  assert.equal(result.status, 1);
  assert.equal(result.stdout, '');
  assert.match(result.stderr, /cannot be represented safely/);
  assert.deepEqual(snapshot(root), before);
});
test('unreadable prompts does not silently become MONO', (t) => {
  if (process.platform === 'win32') return t.skip('POSIX permissions fixture');
  const root = fixture(t);
  const prompts = join(root, 'prompts');
  mkdirSync(prompts);
  chmodSync(prompts, 0);
  try {
    try {
      readdirSync(prompts);
      return t.skip('Current user can bypass directory permissions');
    } catch (error) {
      assert.equal(error.code, 'EACCES');
    }
    const result = node(projectEngine, ['detect', root], root);
    assert.equal(result.status, 1);
    assert.equal(result.stdout, '');
    assert.match(result.stderr, /Project detection failed.*EACCES/);
  } finally {
    chmodSync(prompts, 0o700);
  }
});

const versionFixtures = [
  ['standard', '> **Version**: 1.3.0 | Date: fixture\n', '1.3.0'],
  ['spaces', '> **Version**:  1 . 3 . 0 - custom  | Date: fixture\n', '1.3.0-custom'],
  ['multiple', '> **Version**: first | date\n> **Version**: second\n', 'first'],
  ['exact prefix', ' > **Version**: ignored\n> **Version**: chosen\n', 'chosen'],
  ['CRLF no pipe', '> **Version**: 1.2.3\r\n', '1.2.3\r'],
  ['CRLF metadata', '> **Version**: 1.2.3 | Date: fixture\r\n', '1.2.3'],
  ['tabs retained', '> **Version**: \t1.2.3\t | Date: fixture\n', '\t1.2.3\t'],
  ['no final newline', '> **Version**: 1.2.3', '1.2.3'],
];

test('version extraction fixtures retain first match and legacy textual rules', (t) => {
  const root = fixture(t);
  for (const [label, content, expected] of versionFixtures) {
    const file = putVersion(root, content);
    assert.equal(detectVersion(file), expected, label);
    const before = snapshot(root);
    for (const args of [[], [''], [file, 'ignored']]) {
      const result = node(versionEngine, args, root);
      assert.equal(result.status, 0, `${label}: ${result.stderr}`);
      assert.equal(result.stdout, `${expected}\n`, label);
      assert.equal(result.stderr, '', label);
    }
    assert.deepEqual(snapshot(root), before);
  }
});
test('many version lines return the first without pipeline SIGPIPE', (t) => {
  const root = fixture(t);
  const file = putVersion(root, '> **Version**: first\n' + '> **Version**: later\n'.repeat(100000));
  const result = node(versionEngine, [file], root);
  assert.equal(result.status, 0, result.stderr);
  assert.equal(result.stdout, 'first\n');
});
test('missing/non-regular files and absent/blank versions fail explicitly', (t) => {
  const root = fixture(t);
  const missing = node(versionEngine, [], root);
  assert.equal(missing.status, 1);
  assert.equal(missing.stdout, '');
  assert.equal(missing.stderr, '❌ File not found: prompts/hard_points/ai-kido.md\n');
  const directory = node(versionEngine, [root], root);
  assert.equal(directory.status, 1);
  assert.equal(directory.stdout, '');
  assert.equal(directory.stderr, `❌ File not found: ${root}\n`);
  for (const content of [
    '', '# no version\n', '> **Version**:    | date\n',
    '> **Version**:\n', '> **Version**:|', '> **Version**:| date\n',
    '> **Version**: \t\r\n', '> **Version**:|\n> **Version**: valid\n',
  ]) {
    const file = putVersion(root, content);
    const before = snapshot(root);
    const result = node(versionEngine, [file], root);
    assert.equal(result.status, 1);
    assert.equal(result.stdout, '');
    assert.equal(result.stderr, `❌ Version not detected in ${file}\n`);
    assert.throws(() => detectVersion(file), /Version not detected/);
    assert.deepEqual(snapshot(root), before);
  }
});
test('version options are literal files, including leading dash and spaces', (t) => {
  const root = fixture(t);
  for (const name of ['--help', '--version', '-h', 'version with spaces.md']) {
    writeFileSync(join(root, name), '> **Version**: literal\n');
    const result = node(versionEngine, [name], root);
    assert.equal(result.status, 0, result.stderr);
    assert.equal(result.stdout, 'literal\n');
  }
  const absent = node(versionEngine, ['--absent'], root);
  assert.equal(absent.status, 1);
  assert.equal(absent.stderr, '❌ File not found: --absent\n');
});
test('invalid UTF-8 and binary version files are refused without writes', (t) => {
  const root = fixture(t);
  for (const content of [Buffer.from([0xff]), Buffer.from('> **Version**: 1\0.2\n')]) {
    const file = putVersion(root, content);
    const before = snapshot(root);
    const result = node(versionEngine, [file], root);
    assert.equal(result.status, 1);
    assert.equal(result.stdout, '');
    assert.match(result.stderr, /Unable to read/);
    assert.deepEqual(snapshot(root), before);
  }
});
test('unreadable version file fails explicitly and preserves its bytes', (t) => {
  if (process.platform === 'win32') return t.skip('POSIX permissions fixture');
  const root = fixture(t);
  const file = putVersion(root, '> **Version**: preserved\n');
  const original = readFileSync(file);
  chmodSync(file, 0);
  try {
    try {
      readFileSync(file);
      return t.skip('Current user can bypass file permissions');
    } catch (error) {
      assert.equal(error.code, 'EACCES');
    }
    const result = node(versionEngine, [file], root);
    assert.equal(result.status, 1);
    assert.equal(result.stdout, '');
    assert.match(result.stderr, /Unable to read.*EACCES/);
  } finally {
    chmodSync(file, 0o600);
    assert.deepEqual(readFileSync(file), original);
  }
});
test('engines need no jq or external processing tools', (t) => {
  if (process.platform === 'win32') return t.skip('POSIX isolated PATH fixture');
  const root = fixture(t);
  const file = putVersion(root, '> **Version**: 1.2.3\n');
  const tools = join(root, 'tools');
  mkdirSync(tools);
  symlinkSync(process.execPath, join(tools, 'node'));
  for (const engine of [projectEngine, versionEngine]) {
    const args = engine === projectEngine ? ['detect', root] : [file];
    assert.equal(node(engine, args, root, { PATH: tools }).status, 0);
  }
  const pair = node(beginningEngine, [root, root], root, { PATH: tools });
  assert.equal(pair.status, 0, pair.stderr);
  assert.equal(pair.stdout, '1.2.3 1.2.3\n');
});
test('version pair Node CLI works directly without shell and fails on invalid versions', (t) => {
  const root = fixture(t);
  const source = join(root, 'source');
  const target = join(root, 'target');
  putVersion(source, '> **Version**: current\n');
  putVersion(target, '> **Version**: target\n');
  const result = node(beginningEngine, [source, target], root);
  assert.equal(result.status, 0, result.stderr);
  assert.equal(result.stdout, 'current target\n');
  putVersion(target, '> **Version**: invalid\tversion\n');
  const invalid = node(beginningEngine, [source, target], root);
  assert.equal(invalid.status, 1);
  assert.equal(invalid.stdout, '');
  assert.match(invalid.stderr, /single tokens without whitespace/);
});
test('version pair has clean stdout, explicit roots, and no parent-process side effects', (t) => {
  const root = fixture(t);
  const source = join(root, 'source with spaces');
  const target = join(root, 'target with spaces');
  putVersion(source, '> **Version**: current\n');
  putVersion(target, '> **Version**: target\n');
  const before = snapshot(root);
  const result = node(beginningEngine, [source, target, 'ignored'], root);
  assert.equal(result.status, 0, result.stderr);
  assert.equal(result.stdout, 'current target\n');
  assert.match(result.stderr, /Detecting versions/);
  assert.match(result.stderr, /CURRENT : current/);
  assert.match(result.stderr, /TARGET  : target/);
  const beforeCurrent = process.env.MAJ_CURRENT_VERSION;
  const beforeTarget = process.env.MAJ_TARGET_VERSION;
  const parent = node(beginningEngine, [source, target], root);
  assert.equal(parent.status, 0, parent.stderr);
  assert.equal(parent.stdout, 'current target\n');
  assert.equal(process.env.MAJ_CURRENT_VERSION, beforeCurrent);
  assert.equal(process.env.MAJ_TARGET_VERSION, beforeTarget);
  assert.deepEqual(snapshot(root), before);
  const defaultSource = node(beginningEngine, ['', target], source);
  assert.equal(defaultSource.status, 0, defaultSource.stderr);
  assert.equal(defaultSource.stdout, 'current target\n');
});
test('version pair fails with empty stdout for usage, missing files, or ambiguous tokens', (t) => {
  const root = fixture(t);
  const source = join(root, 'source');
  const target = join(root, 'target');
  putVersion(source, '> **Version**: current\n');
  putVersion(target, '> **Version**: target\n');
  for (const args of [[], [source], [join(root, 'missing'), target], [source, join(root, 'missing')]]) {
    const result = node(beginningEngine, args, root);
    assert.equal(result.status, 1);
    assert.equal(result.stdout, '');
    assert.match(result.stderr, /Usage:|File not found:/);
  }
  for (const value of ['\t1.2.3', '1.2.3\r', '', '|', '| date']) {
    putVersion(target, `> **Version**: ${value}\n`);
    const before = snapshot(root);
    const result = node(beginningEngine, [source, target], root);
    assert.equal(result.status, 1);
    assert.equal(result.stdout, '');
    assert.match(result.stderr, /single tokens without whitespace|Version not detected/);
    assert.deepEqual(snapshot(root), before);
  }
});
test('beginning and ending plans use explicit Node engines and SOURCE inputs', (t) => {
  const root = fixture(t);
  const source = join(root, 'source');
  const target = join(root, 'target');
  const mono = join(root, 'mono');
  putVersion(source, '> **Version**: 1.2.3\n');
  putVersion(target, '> **Version**: 1.2.4\n');
  putVersion(mono, '> **Version**: mono\n');
  mkdirSync(join(source, 'prompts/project with spaces'));
  const pair = node(beginningEngine, [source, target], root);
  assert.equal(pair.status, 0, pair.stderr);
  assert.equal(pair.stdout, '1.2.3 1.2.4\n');
  const failed = node(beginningEngine, [source, join(root, 'missing')], root);
  assert.equal(failed.status, 1);
  assert.equal(failed.stdout, '');
  const multi = node(projectEngine, ['detect', source], root);
  const single = node(projectEngine, ['detect', mono], root);
  assert.equal(multi.status, 0, multi.stderr);
  assert.equal(multi.stdout, 'MULTI\nproject with spaces\n');
  assert.equal(single.status, 0, single.stderr);
  assert.equal(single.stdout, 'MONO\n');
  for (const name of ['plan-beginning.md', 'plan-ending-3.md', 'plan-ending-4.md']) {
    const text = readFileSync(join(repository, 'prompts/hard_points/system/maj/plans', name), 'utf8');
    assert.doesNotMatch(text, /```(?:bash|sh|shell|zsh)/);
    assert.match(text, /node \/canonical\/source/);
  }
});

test('ending-4 Node runner resolves its validator from SOURCE and preserves status', (t) => {
  const root = fixture(t);
  const source = join(root, 'source with spaces');
  const destination = join(source, 'prompts/hard_points/system/maj/scripts');
  mkdirSync(destination, { recursive: true });
  const validator = join(destination, 'validate-structure.mjs');
  const text = readFileSync(join(repository, 'prompts/hard_points/system/maj/plans/plan-ending-4.md'), 'utf8');
  assert.doesNotMatch(text, /```(?:bash|sh|shell|zsh)/);
  assert.match(text, /ending-4-run-validation\.mjs/);
  for (const status of [0, 7]) {
    writeFileSync(validator, `console.log(process.cwd() + '|' + process.argv.slice(2).join('|')); process.exitCode = ${status};\n`);
    const result = node(join(scripts, 'ending-4-run-validation.mjs'), [source, 'MULTI'], root);
    assert.equal(result.status, status);
    assert.match(result.stdout, new RegExp(`${source.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\|--type\\|multi`));
    assert.match(result.stdout, status ? /VALIDATION FAILED \(code: 7\)/ : /VALIDATION SUCCESSFUL/);
  }
});

test('ending-3 Node engine generates and validates explicit SOURCE from another cwd', (t) => {
  const root = fixture(t);
  const source = join(root, 'source with spaces');
  const runner = join(root, 'unrelated cwd');
  mkdirSync(join(source, 'prompts'), { recursive: true });
  mkdirSync(runner);
  const plan = readFileSync(join(repository, 'prompts/hard_points/system/maj/plans/plan-ending-3.md'), 'utf8');
  assert.doesNotMatch(plan, /```(?:bash|sh|shell|zsh)/);
  assert.match(plan, /A nonzero exit is blocking/);
  const run = (command, ...args) => execute(process.execPath, [join(scripts, 'maj-node-migration.mjs'), command, ...args], runner);
  const generatedMono = run('generate-mono', source);
  assert.equal(generatedMono.status, 0, JSON.stringify(generatedMono));
  assert.match(readFileSync(join(source, 'prompts/index.md'), 'utf8'), /SINGLE entry point/);
  const monoValidation = run('validate-indexes', source, 'MONO');
  assert.equal(monoValidation.status, 0, JSON.stringify(monoValidation));
  const multi = join(root, 'multi');
  mkdirSync(join(multi, 'prompts'), { recursive: true });
  const generated = run('generate-multi', multi, 'alpha', 'beta');
  assert.equal(generated.status, 0, generated.stderr);
  assert.equal(run('validate-indexes', multi, 'MULTI', 'alpha', 'beta').status, 0);
  const invalid = run('generate-multi', join(root, 'invalid'), '../escape');
  assert.equal(invalid.status, 1);
  assert.equal(existsSync(join(root, 'invalid/prompts/index.md')), false);
});

test('ending-4 diagnostic uses explicit SOURCE and keeps validation failure blocking', (t) => {
  const root = fixture(t);
  const source = join(root, 'source');
  const runner = join(root, 'unrelated cwd');
  mkdirSync(join(source, 'prompts'), { recursive: true });
  mkdirSync(join(runner, 'prompts/hard_points'), { recursive: true });
  writeFileSync(join(runner, 'prompts/hard_points/ai-kido.md'), 'decoy');
  writeFileSync(join(runner, 'prompts/index.md'), 'decoy');
  mkdirSync(join(runner, 'prompts/gen'));
  const text = readFileSync(join(repository, 'prompts/hard_points/system/maj/plans/plan-ending-4.md'), 'utf8');
  assert.doesNotMatch(text, /```(?:bash|sh|shell|zsh)/);
  assert.match(text, /not overwrite or\s+clear the original validation failure/);
  const result = execute(process.execPath, [
    join(scripts, 'ending-4-diagnostic-structure.mjs'), source, 'MONO',
  ], runner);
  assert.equal(result.status, 0, result.stderr);
  assert.match(result.stdout, /MISSING: prompts\/hard_points\/ai-kido\.md/);
  assert.match(result.stdout, /MISSING: prompts\/index\.md/);
  assert.doesNotMatch(result.stdout, /Present: prompts\/index\.md/);
});

test('CLI guards run both engines through file and directory symlink aliases', (t) => {
  if (process.platform === 'win32') return t.skip('POSIX symlink fixtures');
  const root = fixture(t);
  const file = putVersion(root, '> **Version**: alias-version\n');
  mkdirSync(join(root, 'prompts/project with spaces'));
  const copies = join(root, 'engine copies');
  mkdirSync(copies);
  const directoryAlias = join(root, 'directory alias');
  symlinkSync(copies, directoryAlias);
  for (const engine of [projectEngine, versionEngine]) {
    const name = engine === projectEngine ? 'detect-project-type.mjs' : 'detect-version.mjs';
    const copy = join(copies, name);
    copyFileSync(engine, copy);
    const fileAlias = join(root, `file alias ${name}`);
    symlinkSync(copy, fileAlias);
    const args = engine === projectEngine ? ['detect', root] : [file];
    const expected = node(engine, args, root);
    assert.equal(expected.status, 0, expected.stderr);
    assert.notEqual(expected.stdout, '');
    for (const entry of [copy, fileAlias, join(directoryAlias, name)]) {
      const actual = node(entry, args, root);
      assert.equal(actual.status, expected.status, entry);
      assert.equal(actual.stdout, expected.stdout, entry);
      assert.equal(actual.stderr, expected.stderr, entry);
      const preserved = execute(process.execPath, ['--preserve-symlinks-main', entry, ...args], root);
      assert.equal(preserved.status, expected.status, entry);
      assert.equal(preserved.stdout, expected.stdout, entry);
      assert.equal(preserved.stderr, expected.stderr, entry);
      const failureArgs = engine === projectEngine
        ? ['detect', join(root, 'missing')] : [join(root, 'missing')];
      const failed = node(entry, failureArgs, root);
      assert.equal(failed.status, 1, entry);
      assert.match(failed.stdout + failed.stderr, /not found/);
    }
  }
});

test('imports through real and alias paths emit nothing and preserve exitCode', (t) => {
  const root = fixture(t);
  const unrelated = join(root, 'unrelated-main.mjs');
  writeFileSync(unrelated, '// unrelated fixture');
  const modules = [projectEngine, versionEngine];
  if (process.platform !== 'win32') {
    const directoryAlias = join(root, 'import directory alias');
    symlinkSync(scripts, directoryAlias);
    for (const engine of [projectEngine, versionEngine]) {
      const name = engine === projectEngine ? 'detect-project-type.mjs' : 'detect-version.mjs';
      const fileAlias = join(root, `import file alias ${name}`);
      symlinkSync(engine, fileAlias);
      modules.push(fileAlias, join(directoryAlias, name));
    }
  }
  const before = snapshot(root);
  for (const argv of [null, unrelated, join(root, 'nonexistent-main.mjs')]) {
    const code = `
      import assert from 'node:assert/strict';
      process.argv = ${JSON.stringify(argv === null ? [process.execPath] : [process.execPath, argv])};
      process.exitCode = 0;
      for (const url of ${JSON.stringify(modules.map((file) => pathToFileURL(file).href))}) {
        await import(url);
        assert.equal(process.exitCode, 0);
      }
    `;
    const result = execute(process.execPath, ['--input-type=module', '-e', code], root);
    assert.equal(result.status, 0, result.stderr);
    assert.equal(result.stdout, '');
    assert.equal(result.stderr, '');
  }
  assert.deepEqual(snapshot(root), before);
});

test('MAJ plans expose no executable shell fence', () => {
  const plans = join(repository, 'prompts/hard_points/system/maj/plans');
  for (const name of readdirSync(plans).filter(name => name.endsWith('.md'))) {
    assert.doesNotMatch(readFileSync(join(plans, name), 'utf8'), /```(?:bash|sh|shell|zsh)/, name);
  }
});
