import { execFileSync, spawnSync } from 'node:child_process';
import { appendFileSync, cpSync, existsSync, readFileSync, readdirSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
function execute(program, args, options = {}) {
  const result = spawnSync(program, args, { cwd: root, stdio: 'inherit', ...options, shell: false });
  if (result.error) throw result.error;
  if (result.status !== 0) throw new Error(`${program} failed (${result.status ?? result.signal})`);
}
function tests(directories, select = () => true) {
  return directories.flatMap(directory => readdirSync(join(root, directory))
    .filter(name => name.endsWith('.test.mjs') && select(name))
    .sort().map(name => `${directory}/${name}`));
}
function version() {
  const value = process.env.VERSION;
  if (!/^\d+\.\d+\.\d+(-[0-9A-Za-z.-]+)?$/.test(value ?? '')) throw new Error('Invalid release version');
  return value;
}
function temp(name) {
  if (!process.env.RUNNER_TEMP) throw new Error('RUNNER_TEMP is required');
  return join(resolve(process.env.RUNNER_TEMP), name);
}
function remoteExists(kind, ref) {
  const result = spawnSync('git', ['ls-remote', '--exit-code', kind, 'origin', ref], {
    cwd: root, encoding: 'utf8', shell: false,
  });
  if (result.error) throw result.error;
  if (result.status === 0) return true;
  if (result.status === 2) return false;
  throw new Error(`Git remote lookup failed (${result.status}): ${result.stderr}`);
}
function prepare(publish) {
  const out = temp('aikido-dist');
  const revision = publish ? process.env.GITHUB_SHA
    : execFileSync('git', ['rev-parse', 'HEAD'], { cwd: root, encoding: 'utf8' }).trim();
  if (!/^[a-f0-9]{40}$/.test(revision ?? '')) throw new Error('A full source revision is required');
  const releaseVersion = publish ? version() : `1.5.0-ci.${process.env.GITHUB_RUN_NUMBER}`;
  if (!publish && !/^\d+$/.test(process.env.GITHUB_RUN_NUMBER ?? '')) throw new Error('GITHUB_RUN_NUMBER is required');
  execute(process.execPath, ['distribution/scripts/prepare-release.mjs', '--out', out, '--revision', revision, '--version', releaseVersion]);
  execute(process.execPath, ['distribution/scripts/prepare-release.mjs', '--verify', out]);
}
function publish() {
  const releaseVersion = version();
  const tag = `aikido-dist-v${releaseVersion}`;
  if (remoteExists('--tags', `refs/tags/${tag}`)) throw new Error('Published releases are immutable');
  const tree = temp('dist-worktree');
  if (existsSync(tree)) throw new Error('Refusing an existing distribution worktree');
  const source = temp('aikido-dist');
  execute(process.execPath, ['distribution/scripts/prepare-release.mjs', '--verify', source]);
  const manifest = JSON.parse(readFileSync(join(source, 'release-manifest.json'), 'utf8'));
  if (manifest.version !== releaseVersion || manifest.source.commit !== process.env.GITHUB_SHA) {
    throw new Error('Prepared release does not match the requested version and source revision');
  }
  const entries = readdirSync(source);
  if (entries.includes('.git')) throw new Error('Generated distribution must not contain Git state');
  if (remoteExists('--heads', 'dist')) {
    execute('git', ['fetch', '--no-tags', 'origin', 'dist']);
    execute('git', ['worktree', 'add', '-B', 'dist', tree, 'origin/dist']);
  } else execute('git', ['worktree', 'add', '--orphan', '-b', 'dist', tree]);
  execute('git', ['-C', tree, 'rm', '-rq', '--ignore-unmatch', '.']);
  for (const entry of entries) {
    cpSync(join(source, entry), join(tree, entry), { recursive: true, force: false, errorOnExist: true });
  }
  const identity = ['-c', 'user.name=github-actions[bot]',
    '-c', 'user.email=41898282+github-actions[bot]@users.noreply.github.com', '-C', tree];
  execute('git', [...identity, 'add', '-A']);
  execute('git', [...identity, 'commit', '-m',
    `dist: aikido ${releaseVersion} from ${process.env.GITHUB_SHA}\n\nCo-authored-by: Copilot <223556219+Copilot@users.noreply.github.com>`]);
  execute('git', [...identity, 'tag', '-a', tag, '-m', `AI-KIDO distribution ${releaseVersion} from ${process.env.GITHUB_SHA}`]);
  execute('git', [...identity, 'push', '--atomic', 'origin', 'dist', `refs/tags/${tag}`]);
  const commit = execFileSync('git', ['-C', tree, 'rev-parse', 'HEAD'], { encoding: 'utf8' }).trim();
  if (process.env.GITHUB_STEP_SUMMARY) appendFileSync(process.env.GITHUB_STEP_SUMMARY, `Published ${tag} at ${commit}\n`);
}
function npmPackage() {
  return resolve(root, 'distribution/npm');
}
function npmCheck() {
  const manifest = JSON.parse(readFileSync(join(npmPackage(), 'package.json'), 'utf8'));
  if (manifest.version !== version()) throw new Error(`npm package version ${manifest.version} does not match ${version()}`);
  const probe = spawnSync('npm', ['view', `${manifest.name}@${manifest.version}`, 'version'], { cwd: root, encoding: 'utf8', shell: false });
  if (probe.error) throw probe.error;
  if (probe.status === 0 && probe.stdout.trim()) throw new Error('Published npm releases are immutable');
}
function npmPublish() {
  npmCheck();
  // prepack (run by npm) builds the host packages from the checked-out commit and refuses a dirty tree.
  const tag = /-/.test(version()) ? 'next' : 'latest';
  execute('npm', ['publish', '--provenance', '--access', 'public', '--tag', tag], { cwd: npmPackage() });
}

export function run(stage) {
  if (stage === 'tests') {
    execute(process.execPath, ['--test', ...tests([
      'distribution/tests', 'prompts/hard_points/system/orchestrator',
      'prompts/hard_points/system/skill-manage', 'prompts/hard_points/system/refactoring/scripts',
    ])]);
  } else if (stage === 'compatibility') {
    execute(process.execPath, ['--test', ...tests(['distribution/tests'],
      name => /^(node-runtime|catalog|maj-|structure-|search-|plan-validation|web-download)/.test(name)
        && (process.platform !== 'win32' || name !== 'maj-backup.test.mjs'))]);
  } else if (stage === 'install-validator') {
    execute('npm', ['install', '--global', '--no-fund', '--no-audit', '@anthropic-ai/claude-code@2.1.310']);
  } else if (stage === 'check-tag') {
    if (remoteExists('--tags', `refs/tags/aikido-dist-v${version()}`)) throw new Error('Published releases are immutable');
  } else if (stage === 'npm-check') npmCheck();
  else if (stage === 'npm-publish') npmPublish();
  else if (stage === 'prepare-ci') prepare(false);
  else if (stage === 'prepare-publish') prepare(true);
  else if (stage === 'publish') publish();
  else throw new Error('Unknown CI stage');
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try {
    if (process.argv.length !== 3) throw new Error('Usage: ci.mjs <stage>');
    run(process.argv[2]);
  } catch (error) {
    process.stderr.write(`CI: ${error.message}\n`);
    process.exitCode = 1;
  }
}
