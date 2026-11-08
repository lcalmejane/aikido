import { spawnSync } from 'node:child_process';
import { mkdtempSync, realpathSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
export { isPrivateTaskStorePath } from './lib/private-task-store.mjs';

function gitEnvironment(globalConfig) {
  const env = Object.fromEntries(Object.entries(process.env)
    .filter(([key]) => !key.toUpperCase().startsWith('GIT_')));
  env.GIT_CONFIG_NOSYSTEM = '1';
  env.GIT_CONFIG_GLOBAL = globalConfig;
  return env;
}

function runGit(args, options, globalConfig, allowed = [0]) {
  const result = spawnSync('git', args, {
    ...options,
    env: gitEnvironment(globalConfig),
    maxBuffer: 32 * 1024 * 1024,
  });
  if (result.error) throw new Error(`Git execution failed: ${result.error.message}`);
  if (!allowed.includes(result.status)) {
    throw new Error(`Git failed (${result.status ?? result.signal}): ${result.stderr.toString('utf8').trim()}`);
  }
  return result.stdout;
}

export function createGitIgnoreContext(projectRoot) {
  const root = projectRoot;
  const temporary = mkdtempSync(join(realpathSync(tmpdir()), 'aikido-gitignore-'));
  const globalConfig = join(temporary, 'empty.gitconfig');
  const gitDirectory = join(temporary, 'git');
  try {
    writeFileSync(globalConfig, '');
    runGit(['init', '--bare', '--quiet', '--template=', gitDirectory], {}, globalConfig);
  } catch (error) {
    rmSync(temporary, { recursive: true, force: true });
    throw error;
  }
  let closed = false;
  return {
    ignored(paths) {
      if (closed) throw new Error('Git ignore context is closed');
      if (!Array.isArray(paths) || paths.some(path =>
        typeof path !== 'string' || path.length === 0 || path.includes('\0') ||
        path.startsWith('/') || path.split('/').includes('..'))) {
        throw new Error('Git ignore queries must use non-empty project-relative paths');
      }
      if (!paths.length) return new Set();
      const input = Buffer.from(`${paths.join('\0')}\0`);
      const output = runGit([
        `--git-dir=${gitDirectory}`,
        `--work-tree=${root}`,
        'check-ignore',
        '--no-index',
        '--stdin',
        '-z',
      ], { input }, globalConfig, [0, 1]);
      return new Set(output.toString('utf8').split('\0').filter(Boolean));
    },
    close() {
      if (closed) return;
      closed = true;
      rmSync(temporary, { recursive: true, force: true });
    },
  };
}
