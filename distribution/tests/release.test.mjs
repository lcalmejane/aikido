import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';
import { assertReleaseSource, prepareRelease, releaseTag, verifyRelease } from '../scripts/prepare-release.mjs';

const REPO = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
const HEAD = execFileSync('git', ['rev-parse', 'HEAD'], { cwd: REPO, encoding: 'utf8' }).trim();

function withRelease(fn) {
  const root = mkdtempSync(join(tmpdir(), 'aikido-release-test-'));
  try {
    const out = join(root, 'dist');
    const manifest = prepareRelease({ outDir: out, sourceRevision: HEAD, version: '1.5.0-test.1', checkSource: false });
    fn(out, manifest);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
}

test('release tree is deterministic, validated and pinned to its source commit', () => {
  withRelease((out, manifest) => {
    assert.equal(manifest.tag, 'aikido-dist-v1.5.0-test.1');
    assert.equal(manifest.source.commit, HEAD);
    assert.ok(manifest.hosts.some(({ host, generated }) => host === 'claude-code' && generated));
    assert.ok(manifest.files.some(({ path }) => path === 'claude-code/package-manifest.json'));
    const marketplace = JSON.parse(readFileSync(join(out, '.claude-plugin/marketplace.json'), 'utf8'));
    assert.deepEqual(marketplace.plugins.map(({ name, source }) => [name, source]), [['aikido', './claude-code']]);
    assert.match(readFileSync(join(out, 'README.md'), 'utf8'), new RegExp(`aikido@${HEAD}`));
    assert.equal(readFileSync(join(out, '.gitattributes'), 'utf8'), '* -text\n');
    const icon = readFileSync(join(REPO, 'distribution/adapters/claude-code/aikido.png'));
    for (const host of ['claude-code', 'claude-cowork']) {
      assert.ok(readFileSync(join(out, host, 'assets/aikido.png')).equals(icon), `${host} icon is copied byte for byte`);
    }
    assert.deepEqual(verifyRelease(out), {
      version: '1.5.0-test.1', tag: manifest.tag, commit: HEAD, files: manifest.files.length,
    });
  });
});

test('release verification rejects modified, added and removed files', () => {
  withRelease((out) => {
    writeFileSync(join(out, 'README.md'), 'tampered\n');
    writeFileSync(join(out, 'extra.txt'), 'x\n');
    rmSync(join(out, 'build-report.json'));
    assert.throws(() => verifyRelease(out), (error) => (
      /modified file: README\.md/.test(error.message)
      && /unexpected file: extra\.txt/.test(error.message)
      && /missing file: build-report\.json/.test(error.message)
    ));
  });
});

test('release preparation requires an immutable revision, a semantic version and matching sources', () => {
  const out = join(tmpdir(), 'aikido-release-never-created');
  assert.throws(() => prepareRelease({ outDir: out, sourceRevision: 'uncommitted', version: '1.5.0' }), /40-character/);
  assert.throws(() => prepareRelease({ outDir: out, sourceRevision: HEAD, version: '1.5' }), /semantic version/);
  assert.throws(
    () => prepareRelease({ outDir: out, sourceRevision: 'a'.repeat(40), version: '1.5.0' }),
    /does not match checked-out HEAD/,
  );
  assert.equal(releaseTag('1.5.0'), 'aikido-dist-v1.5.0');
});

test('release source check detects bytes hidden from git status by line-ending conversion', () => {
  const repo = mkdtempSync(join(tmpdir(), 'aikido-release-eol-'));
  try {
    const git = (...args) => execFileSync('git', ['-c', 'commit.gpgsign=false', '-c', 'core.autocrlf=input', ...args], {
      cwd: repo, encoding: 'utf8',
    });
    git('init', '-q');
    mkdirSync(join(repo, 'distribution'));
    writeFileSync(join(repo, 'distribution/prices.csv'), 'a,b\n1,2\n');
    git('add', '.');
    git('-c', 'user.name=t', '-c', 'user.email=t@example.invalid', 'commit', '-qm', 'init');
    const head = git('rev-parse', 'HEAD').trim();
    git('config', 'core.autocrlf', 'input');
    assert.doesNotThrow(() => assertReleaseSource(head, { repo }));
    writeFileSync(join(repo, 'distribution/prices.csv'), 'a,b\r\n1,2\r\n');
    git('add', '.');
    assert.equal(git('status', '--porcelain'), '');
    assert.throws(() => assertReleaseSource(head, { repo }), /line-ending conversion\?[^]*distribution\/prices\.csv/);
  } finally {
    rmSync(repo, { recursive: true, force: true });
  }
});

test('publication workflow is manual and CI cannot write to the repository', () => {
  const ci = readFileSync(join(REPO, '.github/workflows/distribution-ci.yml'), 'utf8');
  const publish = readFileSync(join(REPO, '.github/workflows/distribution-publish.yml'), 'utf8');
  assert.match(ci, /^permissions:\n {2}contents: read$/m);
  assert.doesNotMatch(ci, /contents: write|git push/);
  assert.match(publish, /^on:\n {2}workflow_dispatch:/m);
  assert.doesNotMatch(publish, /^ {2}(push|pull_request|schedule|release):/m);
  assert.match(publish, /already exists; published releases are immutable/);
  for (const text of [ci, publish]) {
    for (const [, ref] of text.matchAll(/uses: [^@\s]+@(\S+)/g)) assert.match(ref, /^[0-9a-f]{40}$/);
  }
});
