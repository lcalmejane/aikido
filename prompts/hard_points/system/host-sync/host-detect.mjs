// Dependency-free detection of the assistant CLIs and editor extensions installed on THIS machine.
// Single source of truth: shipped in every project under prompts/hard_points/system/host-sync/ and
// reused (copied as lib/host-detect.mjs) by the distribution packages, so `skill-manage`, the
// `create-*` commands, `/maj-aikido` and the npm `aikido` CLI all decide the same way.
//
// Detection never spawns a process: it only looks for executables on PATH and for installed editor
// extensions, so it cannot hang, prompt or run foreign code. Workspace directories (.claude/, .roo/ ...)
// are hints only: they prove somebody used a host in this project, not that its CLI is installed here.
import { accessSync, constants, existsSync, readdirSync, statSync } from 'node:fs';
import { homedir } from 'node:os';
import { delimiter, join } from 'node:path';

export const HOST_SIGNALS = Object.freeze({
  'claude-code': { binaries: ['claude'] },
  // In VS Code, Codex ships as the "openai.chatgpt" extension and exposes no `codex` binary on PATH.
  codex: { binaries: ['codex'], extensions: [/^openai\.chatgpt-\d/i] },
  'kiro-cli': { binaries: ['kiro-cli', 'kiro'] },
  antigravity: { binaries: ['antigravity'] },
  'zoo-code': { extensions: [/^zoocodeorganization\.zoo-code-\d/i] },
  'roo-code-legacy': { extensions: [/^rooveterinaryinc\.roo-cline-\d/i] },
  'copilot-vscode': { extensions: [/^github\.copilot(?:-chat)?-\d/i] },
});

// Directories that only one host creates: their presence in the workspace is evidence for that host.
// Shared ones (.roo, .agents, .github/*) stay hints because they cannot tell the hosts apart.
const WORKSPACE_MARKERS = Object.freeze({
  '.claude': 'claude-code',
  '.codex': 'codex',
  '.kiro': 'kiro-cli',
});

const WORKSPACE_HINTS = Object.freeze({
  '.claude': ['claude-code'],
  '.codex': ['codex'],
  '.kiro': ['kiro-cli'],
  '.roo': ['zoo-code', 'roo-code-legacy'],
  '.roomodes': ['zoo-code', 'roo-code-legacy'],
  '.github/agents': ['copilot-vscode', 'copilot-github'],
  '.github/prompts': ['copilot-vscode'],
  '.github/skills': ['copilot-vscode', 'copilot-github'],
  '.agents': ['codex', 'antigravity'],
});

const EXTENSION_DIRECTORIES = ['.vscode/extensions', '.vscode-insiders/extensions', '.vscode-oss/extensions'];

function executableNames(name, env, platform) {
  if (platform !== 'win32') return [name];
  const extensions = (env.PATHEXT ?? '.EXE;.CMD;.BAT;.COM').split(';').filter(Boolean);
  return [name, ...extensions.map((extension) => `${name}${extension.toLowerCase()}`), ...extensions.map((extension) => `${name}${extension.toUpperCase()}`)];
}

export function findExecutable(name, { env = process.env, platform = process.platform } = {}) {
  const directories = (env.PATH ?? env.Path ?? '').split(delimiter).filter(Boolean);
  for (const directory of directories) {
    for (const candidate of executableNames(name, env, platform)) {
      const path = join(directory, candidate);
      try {
        if (!statSync(path).isFile()) continue;
        if (platform !== 'win32') accessSync(path, constants.X_OK);
        return path;
      } catch {
        // Not present, not a regular file or not executable in this directory.
      }
    }
  }
  return null;
}

function installedExtensions(env, home) {
  const directories = env.AIKIDO_EXTENSION_DIRS !== undefined
    ? env.AIKIDO_EXTENSION_DIRS.split(delimiter).filter(Boolean)
    : EXTENSION_DIRECTORIES.map((directory) => join(home, ...directory.split('/')));
  const names = [];
  for (const directory of directories) {
    try {
      for (const entry of readdirSync(directory, { withFileTypes: true })) {
        if (entry.isDirectory()) names.push({ name: entry.name, directory });
      }
    } catch {
      // The editor is not installed or has no extension directory.
    }
  }
  return names;
}

/**
 * @param {object} [options]
 * @param {string} [options.root] workspace used only to report hints
 * @param {{hosts: Record<string, {enabled?: boolean, workspace?: unknown}>}} [options.catalog]
 *   distribution catalog; when absent every host known to HOST_SIGNALS is considered
 */
export function detectHosts({
  root, env = process.env, home = homedir(), platform = process.platform, catalog,
} = {}) {
  const usable = (host) => (catalog ? Boolean(catalog.hosts?.[host]?.enabled && catalog.hosts[host].workspace) : host in HOST_SIGNALS);
  const extensions = installedExtensions(env, home);
  const hosts = [];
  const projectBin = root ? join(root, 'node_modules', '.bin') : null;
  for (const [host, signals] of Object.entries(HOST_SIGNALS)) {
    if (!usable(host)) continue;
    const evidence = [];
    for (const binary of signals.binaries ?? []) {
      const path = findExecutable(binary, { env, platform });
      if (path) {
        evidence.push({ kind: 'binary', name: binary, path });
        continue;
      }
      // A CLI installed as a dependency of this project (npm, pnpm, yarn) is not on the global PATH.
      const local = projectBin ? findExecutable(binary, { env: { ...env, PATH: projectBin }, platform }) : null;
      if (local) evidence.push({ kind: 'workspace-binary', name: binary, path: local });
    }
    for (const pattern of signals.extensions ?? []) {
      const found = extensions.find(({ name }) => pattern.test(name));
      if (found) evidence.push({ kind: 'extension', name: found.name, path: join(found.directory, found.name) });
    }
    if (root) {
      for (const [marker, owner] of Object.entries(WORKSPACE_MARKERS)) {
        if (owner === host && existsSync(join(root, marker))) evidence.push({ kind: 'workspace', name: marker, path: join(root, marker) });
      }
    }
    if (evidence.length) hosts.push({ host, evidence });
  }

  const detected = new Set(hosts.map(({ host }) => host));
  const hints = [];
  if (root) {
    for (const [marker, candidates] of Object.entries(WORKSPACE_HINTS)) {
      if (!existsSync(join(root, ...marker.split('/')))) continue;
      for (const host of candidates) {
        if (detected.has(host) || !usable(host) || hints.some((hint) => hint.host === host)) continue;
        hints.push({ host, marker, reason: 'workspace directory exists but no matching CLI or extension was found on this machine' });
      }
    }
  }
  return { schemaVersion: 1, hosts, hints };
}
