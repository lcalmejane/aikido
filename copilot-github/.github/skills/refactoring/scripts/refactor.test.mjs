import assert from 'node:assert/strict';
import { execFileSync, spawnSync } from 'node:child_process';
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { after, before, test } from 'node:test';
import { fileURLToPath } from 'node:url';
import {
  applyPlan, buildMatcher, createBatches, createPlan, globToRegExp, listFiles, newScript, parseArgs, reportPlan,
  rollbackPlan, run, scan, showBatch,
} from './refactor.mjs';

const SCRIPT = join(dirname(fileURLToPath(import.meta.url)), 'refactor.mjs');
let base;
let root;
let counter = 0;

function write(path, content) {
  const full = join(root, ...path.split('/'));
  mkdirSync(dirname(full), { recursive: true });
  writeFileSync(full, content);
}
const read = (path) => readFileSync(join(root, ...path.split('/')), 'utf8');

before(() => {
  base = mkdtempSync(join(tmpdir(), 'aikido-refactor-test-'));
  process.env.AIKIDO_REFACTOR_STATE = join(base, 'state');
});
after(() => {
  rmSync(base, { recursive: true, force: true });
});

function fresh() {
  counter += 1;
  root = join(base, `project-${counter}`);
  mkdirSync(root, { recursive: true });
  return root;
}

test('parseArgs separates the command, flags, values and repeatable options', () => {
  const { command, options } = parseArgs(['plan', '--find', 'a', '--ext', 'js', '--ext', '.ts', '--regex', '--batch-size', '3']);
  assert.equal(command, 'plan');
  assert.deepEqual(options.ext, ['js', '.ts']);
  assert.equal(options.regex, true);
  assert.equal(options.batchSize, '3');
  assert.throws(() => parseArgs(['plan', '--nope', 'x']), /Unknown option/);
  assert.throws(() => parseArgs(['plan', '--find']), /Missing value/);
});

test('globToRegExp supports *, ** and ?', () => {
  assert.ok(globToRegExp('src/**/*.js').test('src/a/b/c.js'));
  assert.ok(globToRegExp('src/**/*.js').test('src/c.js'));
  assert.ok(!globToRegExp('src/*.js').test('src/a/c.js'));
  assert.ok(globToRegExp('a?c').test('abc'));
});

test('buildMatcher escapes literals, honours word and ignore-case, rejects bad input', () => {
  const literal = buildMatcher({ find: 'a.b', replace: 'X' });
  assert.equal('a.b axb'.replace(literal.regex, literal.replace), 'X axb');
  const word = buildMatcher({ find: 'cat', replace: 'dog', word: true, ignoreCase: true });
  assert.equal('Cat concat cat'.replace(word.regex, word.replace), 'dog concat dog');
  const regex = buildMatcher({ find: '(\\d+)px', replace: '$1rem', regex: true });
  assert.equal('10px'.replace(regex.regex, regex.replace), '10rem');
  assert.throws(() => buildMatcher({ find: '', replace: 'x' }), /must not be empty/);
  assert.throws(() => buildMatcher({ find: '(', replace: 'x', regex: true }), /Invalid regular expression/);
  assert.throws(() => buildMatcher({ find: 'a' }), /--replace is required/);
});

test('listFiles honours .gitignore and path/ext filters, and skips large files', () => {
  fresh();
  execFileSync('git', ['init', '-q'], { cwd: root });
  write('.gitignore', 'ignored/\n');
  write('src/a.js', 'x');
  write('src/b.ts', 'x');
  write('ignored/c.js', 'x');
  write('big.js', 'x'.repeat(50));
  const all = listFiles(root, { maxBytes: '40' });
  assert.equal(all.source, 'git');
  assert.deepEqual(all.files.map((file) => file.path), ['.gitignore', 'src/a.js', 'src/b.ts']);
  assert.equal(all.skipped.large, 1);
  assert.deepEqual(listFiles(root, { path: ['src'], ext: ['js'] }).files.map((file) => file.path), ['src/a.js']);
  assert.deepEqual(listFiles(root, { exclude: ['**/*.ts'], include: ['src/**'] }).files.map((file) => file.path), ['src/a.js']);
  assert.throws(() => listFiles(root, { path: ['../outside'] }), /Unsafe relative path/);
});

test('without git the walk excludes node_modules and .git', () => {
  fresh();
  write('a.js', 'x');
  write('node_modules/m.js', 'x');
  write('.git/config', 'x');
  const result = listFiles(root, {});
  assert.equal(result.source, 'walk');
  assert.deepEqual(result.files.map((file) => file.path), ['a.js']);
});

test('scan returns counts and a bounded sample, never the full list', () => {
  fresh();
  for (let i = 0; i < 12; i += 1) write(`f${i}.js`, 'abc');
  write('x.md', 'abc');
  const result = scan(root, { sample: '3' });
  assert.equal(result.files, 13);
  assert.equal(result.byExt['.js'], 12);
  assert.equal(result.sample.length, 3);
  assert.ok(JSON.stringify(result).length < 600);
});

test('batches are deterministic, bounded and retrievable by index', () => {
  fresh();
  for (let i = 0; i < 7; i += 1) write(`f${i}.txt`, 'abc');
  const first = createBatches(root, { batchSize: '3' });
  const second = createBatches(root, { batchSize: '3' });
  assert.equal(first.batches, 3);
  assert.equal(first.manifest, second.manifest);
  assert.deepEqual(showBatch(root, { manifest: first.manifest, index: '3' }).files, ['f6.txt']);
  assert.throws(() => showBatch(root, { manifest: first.manifest, index: '9' }), /--index must be/);
  assert.throws(() => showBatch(root, { manifest: 'nope', index: '1' }), /manifest id/);
});

test('plan, apply and report change only matching files and are idempotent', () => {
  fresh();
  write('a.js', 'oldName(); oldName();\n');
  write('b.js', 'nothing here\n');
  write('c.md', 'oldName in docs\n');
  const plan = createPlan(root, { find: 'oldName', replace: 'newName', ext: ['js'] });
  assert.equal(plan.files, 1);
  assert.equal(plan.matches, 2);
  assert.deepEqual(plan.sample, ['a.js:2']);
  assert.equal(read('a.js'), 'oldName(); oldName();\n');
  const dry = applyPlan(root, { plan: plan.plan, dryRun: true });
  assert.equal(dry.wouldChange, 1);
  assert.equal(read('a.js'), 'oldName(); oldName();\n');
  const applied = applyPlan(root, { plan: plan.plan });
  assert.equal(applied.status, 'ok');
  assert.equal(applied.changed, 1);
  assert.equal(read('a.js'), 'newName(); newName();\n');
  assert.equal(read('c.md'), 'oldName in docs\n');
  const again = applyPlan(root, { plan: plan.plan });
  assert.equal(again.changed, 0);
  assert.equal(reportPlan(root, { plan: plan.plan }).remaining, 0);
  assert.equal(createPlan(root, { find: 'oldName', replace: 'newName', ext: ['js'] }).plan, null);
});

test('a plan is refused when a file changed after planning', () => {
  fresh();
  write('a.js', 'foo\n');
  const plan = createPlan(root, { find: 'foo', replace: 'bar' });
  write('a.js', 'foo edited by someone else\n');
  const result = applyPlan(root, { plan: plan.plan });
  assert.equal(result.status, 'stale');
  assert.equal(result.written, 0);
  assert.equal(read('a.js'), 'foo edited by someone else\n');
});

test('apply works batch by batch and rollback restores the original bytes', () => {
  fresh();
  for (let i = 0; i < 5; i += 1) write(`f${i}.txt`, `v${i} token\n`);
  const plan = createPlan(root, { find: 'token', replace: 'T', batchSize: '2' });
  assert.equal(plan.batches, 3);
  assert.equal(applyPlan(root, { plan: plan.plan, batch: '1' }).changed, 2);
  assert.equal(reportPlan(root, { plan: plan.plan }).remaining, 3);
  assert.equal(applyPlan(root, { plan: plan.plan }).changed, 3);
  assert.equal(read('f4.txt'), 'v4 T\n');
  const back = rollbackPlan(root, { plan: plan.plan });
  assert.equal(back.restored, 5);
  assert.equal(read('f0.txt'), 'v0 token\n');
  assert.equal(reportPlan(root, { plan: plan.plan }).applied, 0);
});

test('rollback keeps files edited after the refactoring unless forced', () => {
  fresh();
  write('a.txt', 'token\n');
  const plan = createPlan(root, { find: 'token', replace: 'T' });
  applyPlan(root, { plan: plan.plan });
  write('a.txt', 'T plus a later human edit\n');
  const blocked = rollbackPlan(root, { plan: plan.plan });
  assert.equal(blocked.status, 'partial');
  assert.equal(blocked.conflicts, 1);
  assert.equal(read('a.txt'), 'T plus a later human edit\n');
  assert.equal(rollbackPlan(root, { plan: plan.plan, force: true }).restored, 1);
  assert.equal(read('a.txt'), 'token\n');
});

test('binary and non-UTF-8 files are skipped and never rewritten', () => {
  fresh();
  writeFileSync(join(root, 'bin.dat'), Buffer.concat([Buffer.from('token'), Buffer.from([0, 1, 2])]));
  writeFileSync(join(root, 'latin.txt'), Buffer.from([0x74, 0x6f, 0x6b, 0x65, 0x6e, 0xe9]));
  write('ok.txt', 'token\n');
  const plan = createPlan(root, { find: 'token', replace: 'T' });
  assert.equal(plan.files, 1);
  assert.equal(plan.skipped.binary, 1);
  assert.equal(plan.skipped.nonUtf8, 1);
});

test('script-new copies the template outside the project and refuses to overwrite', () => {
  fresh();
  const created = newScript(root, { name: 'rename-api' });
  assert.ok(!created.path.startsWith(root));
  assert.ok(existsSync(created.path));
  assert.match(readFileSync(created.path, 'utf8'), /Temporary AI-KIDO refactoring script/);
  assert.throws(() => newScript(root, { name: 'rename-api' }), /already exists/);
  assert.throws(() => newScript(root, { name: '../x' }), /--name must be/);
});

test('the generated temporary script is valid, dry-run by default and does not touch files', () => {
  fresh();
  write('a.js', 'keep\n');
  const created = newScript(root, { name: 'noop' });
  const out = spawnSync(process.execPath, [created.path, '--root', root], { encoding: 'utf8' });
  assert.equal(out.status, 0);
  const report = JSON.parse(out.stdout);
  assert.equal(report.mode, 'dry-run');
  assert.equal(report.scanned, 1);
  assert.equal(read('a.js'), 'keep\n');
});

test('CLI emits one JSON object and a structured error with a nonzero exit code', () => {
  fresh();
  write('a.txt', 'token\n');
  const ok = spawnSync(process.execPath, [SCRIPT, 'scan', '--root', root], { encoding: 'utf8' });
  assert.equal(ok.status, 0);
  assert.equal(JSON.parse(ok.stdout).files, 1);
  const bad = spawnSync(process.execPath, [SCRIPT, 'plan', '--root', root, '--find', 'a'], { encoding: 'utf8' });
  assert.equal(bad.status, 1);
  assert.deepEqual(Object.keys(JSON.parse(bad.stdout)).sort(), ['code', 'message', 'status']);
  assert.equal(JSON.parse(bad.stdout).code, 'bad_argument');
  const unknown = spawnSync(process.execPath, [SCRIPT, 'explode'], { encoding: 'utf8' });
  assert.equal(JSON.parse(unknown.stdout).code, 'unknown_command');
  assert.throws(() => run(['apply', '--root', root, '--plan', 'p-0000000000']), /Cannot read state file/);
});
