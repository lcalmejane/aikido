// AI-KIDO MAJ detection: read-only Node.js 24+ engine.
// Contract and deliberate safety differences: ../SKILL.md.
import { lstatSync, readdirSync, realpathSync } from 'node:fs';
import { basename, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const excluded = new Set(['gen', 'hard_points', 'spec']);

export function detectProjectType(root = '.') {
  const directory = join(root || '.', 'prompts');
  let stat;
  try {
    stat = lstatSync(directory);
  } catch (error) {
    if (error.code === 'ENOENT' || error.code === 'ENOTDIR') {
      throw new Error('ERROR: prompts directory not found');
    }
    throw error;
  }
  if (stat.isSymbolicLink()) {
    throw new Error(`Symbolic prompts directory cannot be classified safely: ${directory}`);
  }
  if (!stat.isDirectory()) throw new Error('ERROR: prompts directory not found');

  // One checked traversal; never interpret a failed traversal as MONO.
  const projects = readdirSync(directory).filter((name) => {
    if (excluded.has(name)) return false;
    return lstatSync(join(directory, name)).isDirectory();
  });
  for (const name of projects) {
    if (/[\r\n]/.test(name)) {
      throw new Error(`Project name cannot be represented safely on stdout: ${JSON.stringify(name)}`);
    }
  }
  // Stable UTF-8 byte order (equivalent to LC_ALL=C sort), not host locale.
  projects.sort((a, b) => Buffer.compare(Buffer.from(a), Buffer.from(b)));
  return { type: projects.length ? 'MULTI' : 'MONO', projects };
}

function usage(program) {
  return `Usage: ${program} detect [prompts_dir]

Mono vs multi-project detection for AI-KIDO

OUTPUT:
  MONO              Single project (no project subdirectories)
  MULTI             Multi-project (with project list on stdout)
  projet1
  projet2
  ...

DIRECT NODE INVOCATION:
  node ${program} detect /path/to/project

Read stdout only after a successful exit status.
`;
}

export function main(args = process.argv.slice(2)) {
  if (Number(process.versions.node.split('.')[0]) < 24) {
    process.stderr.write('❌ MAJ detection requires Node.js 24 or newer\n');
    return 1;
  }
  const program = process.env.AIKIDO_DETECTION_PROGRAM || basename(process.argv[1]);
  if (args.length && args[0] !== 'detect') {
    process.stdout.write(usage(program));
    return ['-h', '--help'].includes(args[0]) ? 0 : 1;
  }
  try {
    const { type, projects } = detectProjectType(args[1] || '.');
    process.stdout.write(`${[type, ...projects].join('\n')}\n`);
    const info = type === 'MONO' ? 'Mono-projet' : `Multi-projet (${projects.length} projets)`;
    process.stderr.write(`\x1b[0;34mℹ️  Type: ${info}\x1b[0m\n`);
    return 0;
  } catch (error) {
    if (error.message === 'ERROR: prompts directory not found') {
      // Historical missing-directory diagnostic is on stdout.
      process.stdout.write(`${error.message}\n`);
    } else {
      process.stderr.write(`❌ Project detection failed: ${error.message}\n`);
    }
    return 1;
  }
}

// Node canonicalizes the module URL, but argv can retain a file/directory
// symlink (notably /var -> /private/var on macOS). Compare physical paths.
// Imports with absent/nonexistent argv[1] must remain side-effect free.
function isMain() {
  if (!process.argv[1]) return false;
  try {
    return realpathSync(process.argv[1]) === realpathSync(fileURLToPath(import.meta.url));
  } catch {
    return false;
  }
}
if (isMain()) {
  process.exitCode = main();
}
