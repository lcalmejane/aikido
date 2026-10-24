#!/usr/bin/env node
import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import {
  existsSync, lstatSync, mkdirSync, mkdtempSync, readFileSync, readdirSync, rmSync, writeFileSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, relative, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDistribution } from './build.mjs';
import { validatePackage } from '../lib/package.mjs';

const REPO = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
const SOURCE_PATHS = ['prompts/hard_points', 'LICENSE', 'TRADEMARK.md', 'distribution'];
const VERSION = /^\d+\.\d+\.\d+(-[0-9A-Za-z.-]+)?$/;

function sha256(bytes) {
  return createHash('sha256').update(bytes).digest('hex');
}

function listFiles(root, directory = root) {
  return readdirSync(directory, { withFileTypes: true })
    .filter((entry) => !(directory === root && entry.name === '.git'))
    .sort((a, b) => (a.name < b.name ? -1 : a.name > b.name ? 1 : 0))
    .flatMap((entry) => {
      const absolute = join(directory, entry.name);
      if (entry.isSymbolicLink()) throw new Error(`Symbolic link in release tree: ${absolute}`);
      if (entry.isDirectory()) return listFiles(root, absolute);
      return entry.isFile() ? [relative(root, absolute).split(sep).join('/')] : [];
    });
}

function digestTree(root) {
  return listFiles(root).map((path) => {
    const contents = readFileSync(join(root, path));
    return { path, size: contents.length, sha256: sha256(contents) };
  });
}

export function releaseTag(version) {
  return `aikido-dist-v${version}`;
}

export function assertReleaseSource(revision, { repo = REPO } = {}) {
  const head = execFileSync('git', ['rev-parse', 'HEAD'], { cwd: repo, encoding: 'utf8' }).trim();
  if (head !== revision) throw new Error(`Release revision ${revision} does not match checked-out HEAD ${head}`);
  const dirty = execFileSync('git', ['status', '--porcelain', '--', ...SOURCE_PATHS], { cwd: repo, encoding: 'utf8' });
  if (dirty.trim()) throw new Error(`Release sources differ from ${revision}:\n${dirty.trimEnd()}`);
}

function rootMarketplace(version) {
  return `${JSON.stringify({
    name: 'aikido',
    owner: { name: 'AI-KIDO Team' },
    description: 'AI-KIDO plugin and project bootstrap tools',
    plugins: [{
      name: 'aikido',
      source: './claude-code',
      version,
      description: 'AI-KIDO — AI Memory Bank Construction Method by Meta harness',
      author: { name: 'AI-KIDO Team', url: 'https://github.com/lcalmejane/aikido' },
    }],
  }, null, 2)}\n`;
}

function releaseReadme(version, sourceRevision, hosts) {
  return `# AI-KIDO distribution ${version}\n\n`
    + `Generated from \`lcalmejane/aikido@${sourceRevision}\`. Do not edit this branch by hand; `
    + `it is replaced by the release workflow. Pin installations to the tag \`${releaseTag(version)}\` `
    + `or to a commit SHA of this branch, never to the moving branch name.\n\n`
    + `Each directory is one host package with its own \`README.md\` and \`package-manifest.json\`:\n\n`
    + hosts.map((host) => `- \`${host}/\``).join('\n')
    + `\n\nThe root \`.claude-plugin/marketplace.json\` exposes the Claude Code package. `
    + `\`release-manifest.json\` lists the SHA-256 of every file for provenance checks. `
    + `Host-native qualification status is recorded per package and in the source repository.\n`;
}

export function prepareRelease({ outDir, sourceRevision, version, checkSource = true }) {
  if (!/^[0-9a-f]{40}$/.test(sourceRevision ?? '')) throw new Error('A release requires a full lowercase 40-character source SHA');
  if (!VERSION.test(version ?? '')) throw new Error('A release requires a semantic version x.y.z[-prerelease]');
  if (checkSource) assertReleaseSource(sourceRevision);

  const outputRoot = resolve(outDir);
  const report = buildDistribution({ outDir: outputRoot, sourceRevision, version });
  const replay = mkdtempSync(join(tmpdir(), 'aikido-release-replay-'));
  try {
    buildDistribution({ outDir: replay, sourceRevision, version });
    if (JSON.stringify(digestTree(outputRoot)) !== JSON.stringify(digestTree(replay))) {
      throw new Error('Distribution build is not deterministic for the same source and version');
    }
  } finally {
    rmSync(replay, { recursive: true, force: true });
  }

  const hosts = report.hosts.filter((host) => host.generated).map((host) => host.host);
  for (const host of hosts) validatePackage(join(outputRoot, host));
  if (!hosts.includes('claude-code')) throw new Error('A release must include the claude-code package');

  writeFileSync(join(outputRoot, 'README.md'), releaseReadme(version, sourceRevision, hosts));
  // Keep published bytes identical to release-manifest.json whatever the clone's line-ending settings.
  writeFileSync(join(outputRoot, '.gitattributes'), '* -text\n');
  mkdirSync(join(outputRoot, '.claude-plugin'));
  writeFileSync(join(outputRoot, '.claude-plugin', 'marketplace.json'), rootMarketplace(version), { flag: 'wx' });
  const manifest = {
    schemaVersion: 1,
    name: 'aikido',
    version,
    tag: releaseTag(version),
    source: { repository: 'github:lcalmejane/aikido', commit: sourceRevision },
    hosts: report.hosts.map(({ host, status, generated }) => ({ host, status, generated })),
    files: digestTree(outputRoot),
  };
  writeFileSync(join(outputRoot, 'release-manifest.json'), `${JSON.stringify(manifest, null, 2)}\n`);
  return manifest;
}

export function verifyRelease(releaseDir) {
  const root = resolve(releaseDir);
  const manifest = JSON.parse(readFileSync(join(root, 'release-manifest.json'), 'utf8'));
  if (manifest.schemaVersion !== 1 || manifest.tag !== releaseTag(manifest.version)) {
    throw new Error('Invalid release manifest header');
  }
  const expected = new Map(manifest.files.map((file) => [file.path, file]));
  const actual = digestTree(root).filter((file) => file.path !== 'release-manifest.json');
  const errors = [];
  for (const file of actual) {
    const record = expected.get(file.path);
    if (!record) errors.push(`unexpected file: ${file.path}`);
    else if (record.sha256 !== file.sha256 || record.size !== file.size) errors.push(`modified file: ${file.path}`);
    expected.delete(file.path);
  }
  for (const path of expected.keys()) errors.push(`missing file: ${path}`);
  for (const { host, generated } of manifest.hosts) {
    if (generated) validatePackage(join(root, host));
  }
  if (errors.length) throw new Error(`Release verification failed:\n${errors.join('\n')}`);
  return { version: manifest.version, tag: manifest.tag, commit: manifest.source.commit, files: actual.length };
}

function parseArgs(argv) {
  const parsed = {};
  for (let i = 0; i < argv.length; i += 1) {
    const key = argv[i];
    if (!['--out', '--revision', '--version', '--verify'].includes(key) || !argv[i + 1]) {
      throw new Error('Usage: prepare-release.mjs --out <dir> --revision <sha> --version <x.y.z> | --verify <dir>');
    }
    if (Object.hasOwn(parsed, key)) throw new Error(`Duplicate argument: ${key}`);
    parsed[key] = argv[i + 1];
    i += 1;
  }
  return parsed;
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try {
    const options = parseArgs(process.argv.slice(2));
    const result = options['--verify']
      ? verifyRelease(options['--verify'])
      : (() => {
        if (!options['--out']) throw new Error('--out is required');
        const out = resolve(options['--out']);
        if (existsSync(out) && (!lstatSync(out).isDirectory() || readdirSync(out).length)) {
          throw new Error('Output directory must be new or empty');
        }
        const manifest = prepareRelease({ outDir: out, sourceRevision: options['--revision'], version: options['--version'] });
        return { version: manifest.version, tag: manifest.tag, commit: manifest.source.commit, files: manifest.files.length };
      })();
    process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
  } catch (error) {
    process.stderr.write(`Release preparation failed: ${error.message}\n`);
    process.exitCode = 1;
  }
}
