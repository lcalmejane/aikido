#!/usr/bin/env node
// Read-only dependency version report for any project: discovers manifests, compares them with their public source.
import { execFileSync } from 'node:child_process';
import { existsSync, lstatSync, readdirSync, readFileSync, realpathSync } from 'node:fs';
import { basename, dirname, join, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const SKIPPED = new Set(['node_modules', '.git', 'dist', 'build', 'out', 'target', 'vendor', 'coverage', '.next', '.venv', 'venv',
  '__pycache__', '.cache', '.turbo', 'media', 'tmp', '.aikido']);
const SCRIPT = /\.(?:mjs|cjs|js|ts)$/;
const RANK = { missing: 5, major: 4, minor: 3, patch: 2, unknown: 1, ok: 0, ignored: 0 };
const FAIL_LEVELS = ['missing', 'major', 'minor', 'patch'];
const MAX_FILE = 1024 * 1024;

const parts = value => { const match = /^v?(\d+(?:\.\d+)*)/.exec(String(value)); return match ? match[1].split('.').map(Number) : undefined; };
function compare(a, b) {
  for (let index = 0; index < Math.max(a.length, b.length); index += 1) { const delta = (a[index] ?? 0) - (b[index] ?? 0); if (delta) return delta; }
  return 0;
}
/** Level of the gap between a used version and the latest one, at the precision of the used version. */
export function gap(current, latest) {
  const [a, b] = [parts(current), parts(latest)];
  if (!a || !b) return 'unknown';
  const limit = b.slice(0, a.length);
  if (compare(a, limit) >= 0) return 'ok';
  if (a[0] !== limit[0]) return 'major';
  return a[1] !== limit[1] ? 'minor' : 'patch';
}
const baseVersion = range => /^[\^~>=<\s]*v?(\d+(?:\.\d+)*(?:[-+][\w.-]+)?)/.exec(String(range))?.[1];

function read(file) {
  try { const stats = lstatSync(file); return stats.isFile() && stats.size <= MAX_FILE ? readFileSync(file, 'utf8') : ''; } catch { return ''; }
}

/** Directories ignored by the repository: generated, personal or third-party content is not part of the project. */
function ignoredDirectories(repository) {
  try {
    const output = execFileSync('git', ['ls-files', '--others', '--ignored', '--exclude-standard', '--directory', '-z'], { cwd: repository, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'], maxBuffer: 16 * 1024 * 1024 });
    return new Set(output.split('\0').filter(path => path.endsWith('/')).map(path => join(repository, path.slice(0, -1))));
  } catch { return new Set(); }
}

/** Project files, each attached to its nearest Git repository. */
export function discover(root) {
  const files = [];
  const ignored = new Set();
  const walk = (directory, project) => {
    let entries;
    try { entries = readdirSync(directory, { withFileTypes: true }); } catch { return; }
    const repository = entries.some(entry => entry.name === '.git');
    if (repository) for (const path of ignoredDirectories(directory)) ignored.add(path);
    const owner = repository ? directory : project;
    for (const entry of entries) {
      const path = join(directory, entry.name);
      if (entry.isDirectory() && !SKIPPED.has(entry.name) && !entry.name.startsWith('.vscode-test') && (!ignored.has(path) || existsSync(join(path, '.git')))) walk(path, owner);
      else if (entry.isFile()) files.push({ path, project: owner });
    }
  };
  walk(root, root);
  return files;
}

const item = (ecosystem, name, version, file, line, exact = true) => ({ ecosystem, name, version, file, exact, ...(line ? { line } : {}) });
const isExact = range => /^=?\s*v?\d/.test(String(range));
const lineOf = (text, index) => text.slice(0, index).split('\n').length;

function npmDeps(text, file) {
  let manifest;
  try { manifest = JSON.parse(text); } catch { return []; }
  return ['dependencies', 'devDependencies', 'optionalDependencies', 'peerDependencies'].flatMap(group => Object.entries(manifest[group] ?? {}).flatMap(([name, range]) => {
    const version = typeof range === 'string' && !/^(?:file|link|workspace|git|github|https?|npm):/.test(range) ? baseVersion(range) : undefined;
    return version ? [item('npm', name, version, file, undefined, isExact(range))] : [];
  }));
}
function cargoDeps(text, file) {
  const found = [];
  let active = false;
  text.split(/\r?\n/).forEach((raw, index) => {
    const line = raw.trim();
    if (line.startsWith('[')) { active = /^\[(?:workspace\.)?(?:dev-|build-)?dependencies\]$/.test(line); return; }
    const match = active && /^([\w-]+)\s*=\s*(?:"([^"]+)"|\{(.*)\})/.exec(line);
    if (!match || /\b(?:path|git|workspace)\s*=/.test(match[3] ?? '')) return;
    const range = match[2] ?? /version\s*=\s*"([^"]+)"/.exec(match[3] ?? '')?.[1] ?? '';
    const version = baseVersion(range);
    if (version) found.push(item('crates', match[1], version, file, index + 1, range.startsWith('=')));
  });
  return found;
}
function pythonDeps(text, file) {
  return [...text.matchAll(/^\s*([A-Za-z0-9][\w.-]*)(?:\[[^\]]*\])?\s*(==|~=|>=)\s*([0-9][\w.]*)/gm)]
    .map(match => item('pypi', match[1], match[3], file, lineOf(text, match.index), match[2] === '=='));
}
function goDeps(text, file) {
  return [...text.matchAll(/^\s*(?:require\s+)?([\w.-]+\.[a-z]+\/[^\s]+)\s+(v\d[^\s]*)/gm)].filter(match => !match[2].includes('-0.'))
    .map(match => item('go', match[1], match[2], file, lineOf(text, match.index)));
}
const interpolate = (value, variables) => value.replace(/\$\{(\w+)(?::?-([^}]*))?\}|\$(\w+)/g, (_, a, fallback, b) => variables[a ?? b] ?? fallback ?? '\0');

function imageItem(reference, file, line) {
  if (reference.includes('\0') || reference.includes('@sha256:') || reference === 'scratch') return [];
  const slash = reference.lastIndexOf('/'), colon = reference.lastIndexOf(':');
  if (colon <= slash) return [];
  return [item('docker', reference.slice(0, colon), reference.slice(colon + 1), file, line)];
}
function dockerDeps(text, file) {
  const variables = {}, stages = new Set(), found = [];
  text.split(/\r?\n/).forEach((line, index) => {
    const arg = /^\s*ARG\s+(\w+)=["']?([^"'\s]+)/i.exec(line);
    if (arg) variables[arg[1]] = arg[2];
    const from = /^\s*FROM\s+(?:--platform=\S+\s+)?(\S+)(?:\s+AS\s+(\S+))?/i.exec(line);
    if (from) {
      const reference = interpolate(from[1], variables);
      if (!stages.has(reference)) found.push(...imageItem(reference, file, index + 1));
      if (from[2]) stages.add(from[2]);
    }
  });
  const resolved = interpolate(text, variables);
  return [...found, ...extensionDeps(resolved, file), ...githubDeps(resolved, file), ...installDeps(resolved, file)];
}
/** Images of services that declare `build:` are produced locally and have no registry to compare with. */
function composeDeps(text, file) {
  const lines = text.split(/\r?\n/);
  const indent = line => /^\s*/.exec(line)[0].length;
  return lines.flatMap((line, index) => {
    const match = /^\s*image:\s*["']?([^"'\s#]+)/.exec(line);
    if (!match) return [];
    const depth = indent(line), inBlock = value => !value.trim() || indent(value) >= depth;
    let start = index, end = index;
    while (start > 0 && inBlock(lines[start - 1])) start -= 1;
    while (end < lines.length - 1 && inBlock(lines[end + 1])) end += 1;
    if (lines.slice(start, end + 1).some(value => indent(value) === depth && /^\s*build:/.test(value))) return [];
    return imageItem(interpolate(match[1], {}), file, index + 1);
  });
}
/** Versions pinned on package-manager command lines inside an image. */
function installDeps(text, file) {
  const tokens = (pattern, token, ecosystem) => [...text.matchAll(pattern)].flatMap(command => [...command[0].matchAll(token)]
    .map(match => item(ecosystem, match[1], match[2], file, lineOf(text, command.index))));
  return [...tokens(/\bnpm\s+(?:install|i)\b[^\n&|;]*/g, /(?:^|\s)((?:@[\w.-]+\/)?[\w.-]+)@(\d[\w.-]*)/g, 'npm'),
    ...tokens(/\bpip3?\s+install\b[^\n&|;]*/g, /(?:^|\s)([A-Za-z0-9][\w.-]*)==(\d[\w.]*)/g, 'pypi'),
    ...[...text.matchAll(/\bcargo\s+install\s+([\w-]+)\s+--version\s+["']?=?(\d[\w.-]*)/g)].map(match => item('crates', match[1], match[2], file, lineOf(text, match.index)))];
}
const extensionDeps = (text, file) => [...text.matchAll(/--install-extension\s+([\w-]+\.[\w-]+)@(\d[\w.-]*)/g)]
  .map(match => item('openvsx', match[1], match[2], file, lineOf(text, match.index)));
function githubDeps(text, file) {
  const patterns = [/github\.com\/([\w.-]+\/[\w.-]+?)\/releases\/download\/(v?\d[\w.-]*)\//g, /--git\s+https:\/\/github\.com\/([\w.-]+\/[\w.-]+?)(?:\.git)?\s+--tag\s+["']?(v?\d[\w.-]*)/g];
  return patterns.flatMap(pattern => [...text.matchAll(pattern)].map(match => item('github', match[1], match[2], file, lineOf(text, match.index))));
}

/** Dependencies declared by one file, by its name. */
export function parseFile(path, text, file = path) {
  const name = basename(path);
  if (name === 'package.json') return npmDeps(text, file);
  if (name === 'Cargo.toml') return cargoDeps(text, file);
  if (/^requirements.*\.txt$/.test(name)) return pythonDeps(text, file);
  if (name === 'go.mod') return goDeps(text, file);
  if (/^Dockerfile|\.Dockerfile$/.test(name)) return dockerDeps(text, file);
  if (/^(?:docker-)?compose.*\.ya?ml$/.test(name)) return composeDeps(text, file);
  return SCRIPT.test(name) && !name.endsWith('.test.mjs') ? githubDeps(text, file) : [];
}

function createSources(fetcher) {
  const get = async (url, headers = {}) => {
    const response = await fetcher(url, { headers: { accept: 'application/json', ...headers }, redirect: 'follow', signal: AbortSignal.timeout(20_000) });
    return { status: response.status, url: response.url, headers: response.headers, body: response.ok ? await response.json().catch(() => undefined) : undefined };
  };
  const exists = async url => (await fetcher(url, { method: 'HEAD', redirect: 'follow', signal: AbortSignal.timeout(20_000) })).status;
  const notFound = { exists: false };
  const dockerTags = async (image, version) => {
    const first = image.split('/')[0];
    const custom = image.includes('/') && /[.:]/.test(first) && first !== 'docker.io';
    if (!custom) {
      const short = image.replace(/^docker\.io\//, '');
      const repository = short.includes('/') ? short : `library/${short}`;
      const suffix = /^v?\d+(?:\.\d+)*(-.+)$/.exec(version)?.[1];
      const page = await get(`https://hub.docker.com/v2/repositories/${repository}/tags?page_size=100&ordering=last_updated${suffix ? `&name=${encodeURIComponent(suffix)}` : ''}`);
      if (page.status !== 200) return { status: page.status };
      const tag = await get(`https://hub.docker.com/v2/repositories/${repository}/tags/${encodeURIComponent(version)}`);
      return { tags: page.body.results.map(entry => entry.name), exists: tag.status === 200 };
    }
    const repository = image.slice(first.length + 1), origin = `https://${first}`;
    let authorization = {};
    let next = `${origin}/v2/${repository}/tags/list?n=1000`;
    let page = await get(next);
    if (page.status === 401) {
      const challenge = page.headers.get('www-authenticate') ?? '';
      const field = key => new RegExp(`${key}="([^"]+)"`).exec(challenge)?.[1];
      if (!field('realm')) return { status: 401 };
      const token = await get(`${field('realm')}?${new URLSearchParams({ service: field('service') ?? first, scope: field('scope') ?? `repository:${repository}:pull` })}`);
      if (!token.body?.token && !token.body?.access_token) return { status: 401 };
      authorization = { authorization: `Bearer ${token.body.token ?? token.body.access_token}` };
      page = await get(next, authorization);
    }
    if (page.status !== 200) return { status: page.status };
    const tags = [...(page.body.tags ?? [])];
    for (let count = 0; count < 30; count += 1) {
      const link = /<([^>]+)>;\s*rel="next"/.exec(page.headers.get('link') ?? '')?.[1];
      if (!link) break;
      page = await get(new URL(link, origin).href, authorization);
      if (page.status !== 200) break;
      tags.push(...(page.body.tags ?? []));
    }
    return { tags, exists: tags.includes(version) };
  };
  return {
    async npm({ name, version, exact }) {
      const { status, body } = await get(`https://registry.npmjs.org/${name.replace('/', '%2F')}`, { accept: 'application/vnd.npm.install-v1+json' });
      if (status === 404) return notFound;
      return body ? { exists: !exact || version.split('.').length < 3 || !!body.versions?.[version], latest: body['dist-tags']?.latest } : undefined;
    },
    async crates({ name, version, exact }) {
      const { status, body } = await get(`https://crates.io/api/v1/crates/${name}`, { 'user-agent': 'aikido-deps-check' });
      if (status === 404) return notFound;
      return body ? { exists: !exact || version.split('.').length < 3 || body.versions.some(entry => entry.num === version), latest: body.crate.max_stable_version ?? body.crate.newest_version } : undefined;
    },
    async pypi({ name, version, exact }) {
      const { status, body } = await get(`https://pypi.org/pypi/${name}/json`);
      if (status === 404) return notFound;
      return body ? { exists: !exact || !!body.releases?.[version] || version.split('.').length < 3, latest: body.info.version } : undefined;
    },
    async go({ name, version }) {
      const escaped = name.replace(/[A-Z]/g, letter => `!${letter.toLowerCase()}`);
      const latest = await get(`https://proxy.golang.org/${escaped}/@latest`);
      if (latest.status === 404 || latest.status === 410) return notFound;
      return latest.body ? { exists: await exists(`https://proxy.golang.org/${escaped}/@v/${version}.info`) === 200, latest: latest.body.Version } : undefined;
    },
    async openvsx({ name, version }) {
      const path = name.replace('.', '/');
      const latest = await get(`https://open-vsx.org/api/${path}/latest`);
      if (latest.status === 404) return notFound;
      return latest.body ? { exists: (await get(`https://open-vsx.org/api/${path}/${version}`)).status === 200, latest: latest.body.version } : undefined;
    },
    async github({ name, version }) {
      const [tag, latest] = await Promise.all([exists(`https://github.com/${name}/releases/tag/${version}`), fetcher(`https://github.com/${name}/releases/latest`, { method: 'HEAD', redirect: 'follow', signal: AbortSignal.timeout(20_000) })]);
      const newest = /\/releases\/tag\/([^/?#]+)/.exec(latest.url ?? '')?.[1];
      return tag === 404 && !newest ? notFound : { exists: tag === 200, latest: newest };
    },
    async docker({ name, version }) {
      const found = await dockerTags(name, version);
      if (!found.tags) return found.status === 404 ? notFound : undefined;
      const shape = /^(v?)(\d+(?:\.\d+)*)(-.+)?$/.exec(version);
      if (!shape) return { exists: found.exists };
      const depth = shape[2].split('.').length;
      const peers = found.tags.flatMap(tag => { const match = /^(v?)(\d+(?:\.\d+)*)(-.+)?$/.exec(tag);
        return match && match[1] === shape[1] && match[3] === shape[3] && match[2].split('.').length === depth ? [tag] : []; });
      const latest = peers.sort((a, b) => compare(parts(a), parts(b))).at(-1);
      return { exists: found.exists, ...(latest ? { latest } : {}) };
    },
  };
}

function privateScopes(root, files) {
  const scopes = new Set();
  for (const { path } of files.filter(file => basename(file.path) === '.npmrc')) {
    for (const match of read(path).matchAll(/^(@[\w-]+):registry\s*=/gm)) scopes.add(match[1]);
  }
  return scopes;
}
function loadIgnored(root) {
  const file = join(root, '.aikido-deps.json');
  if (!existsSync(file)) return [];
  const value = JSON.parse(read(file) || '{}');
  return Array.isArray(value.ignore) ? value.ignore : [];
}

async function mapLimited(values, limit, work) {
  let next = 0;
  await Promise.all(Array.from({ length: Math.min(limit, values.length) }, async () => { while (next < values.length) { const index = next++; await work(values[index]); } }));
}

/** Builds the report. Only names and versions of public dependencies leave the machine; `offline` sends nothing. */
export async function checkDependencies({ root = '.', offline = false, project, fetcher = fetch } = {}) {
  const base = realpathSync(resolve(root));
  const files = discover(base);
  const scopes = privateScopes(base, files);
  const ignored = loadIgnored(base);
  const entries = files.flatMap(file => parseFile(file.path, read(file.path), relative(base, file.path)).map(entry => ({ ...entry, project: relative(base, file.project) || basename(base) })))
    .filter(entry => (!project || entry.project === project) && !(entry.ecosystem === 'npm' && [...scopes].some(scope => entry.name.startsWith(`${scope}/`))));
  const sources = createSources(fetcher), results = new Map();
  const key = entry => `${entry.ecosystem}|${entry.name}|${entry.version}`;
  const unique = [...new Map(entries.map(entry => [key(entry), entry])).values()];
  if (!offline) await mapLimited(unique, 6, async entry => {
    try { results.set(key(entry), await sources[entry.ecosystem](entry)); } catch { results.set(key(entry), undefined); }
  });
  const dependencies = entries.map(entry => {
    const rule = ignored.find(item => item.name === entry.name && (!item.version || item.version === entry.version));
    const source = results.get(key(entry));
    const status = rule ? 'ignored' : !source ? 'unknown' : source.exists === false ? 'missing' : source.latest ? gap(entry.version, source.latest) : 'unknown';
    return { ...entry, status, ...(source?.latest ? { latest: source.latest } : {}), ...(rule?.reason ? { reason: rule.reason } : {}) };
  }).sort((a, b) => a.project.localeCompare(b.project) || RANK[b.status] - RANK[a.status] || a.name.localeCompare(b.name));
  const count = list => Object.fromEntries(Object.keys(RANK).map(status => [status, list.filter(entry => entry.status === status).length]));
  const projects = [...new Set(dependencies.map(entry => entry.project))].map(name => ({ name, summary: count(dependencies.filter(entry => entry.project === name)) }));
  return { schemaVersion: 'aikido-deps/1', root: basename(base), offline, summary: count(dependencies), projects, dependencies };
}

function textReport(report) {
  const lines = [`${report.dependencies.length} dependencies in ${report.projects.length} projects`];
  for (const project of report.projects) {
    const issues = report.dependencies.filter(entry => entry.project === project.name && RANK[entry.status] >= 2);
    lines.push('', `${project.name}: ${Object.entries(project.summary).filter(([, value]) => value).map(([status, value]) => `${value} ${status}`).join(', ')}`);
    for (const entry of issues) lines.push(`  ${entry.status.padEnd(7)} ${entry.ecosystem}:${entry.name} ${entry.version}${entry.latest ? ` -> ${entry.latest}` : ''} (${entry.file}${entry.line ? `:${entry.line}` : ''})`);
  }
  return lines.join('\n');
}

export async function runDepsCLI(argv, { cwd = process.cwd(), fetcher = fetch } = {}) {
  const args = argv[0] === 'deps' ? argv.slice(1) : argv;
  const usage = 'Usage: aikido deps check [--root <dir>] [--project <name>] [--offline] [--format json|text] [--fail-on missing|major|minor|patch]';
  const options = { '--format': 'json', '--fail-on': 'missing' };
  if (args[0] !== 'check') return { exitCode: 2, output: JSON.stringify({ status: 'error', code: 'usage', message: usage }) };
  for (let index = 1; index < args.length; index += 1) {
    if (args[index] === '--offline') options['--offline'] = true;
    else if (['--root', '--project', '--format', '--fail-on'].includes(args[index]) && args[index + 1]) options[args[index]] = args[++index];
    else return { exitCode: 2, output: JSON.stringify({ status: 'error', code: 'usage', message: usage }) };
  }
  if (!['json', 'text'].includes(options['--format']) || !FAIL_LEVELS.includes(options['--fail-on'])) return { exitCode: 2, output: JSON.stringify({ status: 'error', code: 'usage', message: usage }) };
  const report = await checkDependencies({ root: resolve(cwd, options['--root'] ?? '.'), offline: !!options['--offline'], project: options['--project'], fetcher });
  const threshold = RANK[options['--fail-on']];
  const failed = report.dependencies.some(entry => RANK[entry.status] >= threshold && entry.status !== 'unknown');
  return { exitCode: failed ? 1 : 0, output: options['--format'] === 'text' ? textReport(report) : JSON.stringify(report, null, 2) };
}

if (process.argv[1] && realpathSync(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const { exitCode, output } = await runDepsCLI(process.argv.slice(2));
  process.stdout.write(`${output}\n`);
  process.exitCode = exitCode;
}
