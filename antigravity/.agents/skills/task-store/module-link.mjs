// Detects an optional Tatami Core Agent for this workspace. AI-KIDO works without it: every failure means "local".
import { execFileSync } from 'node:child_process';
import { createHash, randomUUID } from 'node:crypto';
import { appendFileSync, chmodSync, existsSync, lstatSync, mkdirSync, readFileSync, realpathSync, rmSync, writeFileSync } from 'node:fs';
import { homedir } from 'node:os';
import { dirname, isAbsolute, join, relative, resolve } from 'node:path';

const LOOPBACK = new Set(['127.0.0.1', 'localhost', '[::1]']);
const REQUIRED_TOOLS = ['workflows_list', 'workflow_save', 'workflow_delete', 'cards_list', 'card_command', 'sessions_list', 'session_create'];

function readJson(path) {
  try { return JSON.parse(readFileSync(path, 'utf8')); } catch { return undefined; }
}

const httpsOrLoopback = url => url.protocol === 'https:' || (url.protocol === 'http:' && LOOPBACK.has(url.hostname));
const connectionFile = workspace => join(workspace, existsSync(join(workspace, 'prompts')) ? 'prompts/spec/aikido/core-agent.json' : '.tatami/core-agent.json');
const secretFile = (workspace, home = homedir()) => join(home, '.aikido', 'core-agent', `${createHash('sha256').update(realpathSync(workspace)).digest('hex').slice(0, 24)}.json`);

function ensureIgnored(workspace, file) {
  const path = relative(workspace, file);
  const git = args => execFileSync('git', args, { cwd: workspace, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] });
  try { git(['rev-parse', '--is-inside-work-tree']); } catch { return; }
  try { git(['check-ignore', '-q', path]); return; } catch {}
  const exclude = resolve(workspace, git(['rev-parse', '--git-path', 'info/exclude']).trim());
  mkdirSync(dirname(exclude), { recursive: true });
  appendFileSync(exclude, `\n/${path}\n`);
}

/** Saves a remote connection: address in the ignored part of the base, token in the private user directory. */
export function saveConnection(workspace, { url, project, user, token }, home = homedir()) {
  let parsed;
  try { parsed = new URL(url); } catch { throw Object.assign(new Error('Invalid Core Agent URL'), { code: 'usage' }); }
  if (!httpsOrLoopback(parsed)) throw Object.assign(new Error('Core Agent URL must be HTTPS or loopback'), { code: 'usage' });
  if (!project || !token) throw Object.assign(new Error('--project and a token are required'), { code: 'usage' });
  const file = connectionFile(workspace), secret = secretFile(workspace, home);
  ensureIgnored(workspace, file);
  mkdirSync(dirname(file), { recursive: true });
  writeFileSync(file, `${JSON.stringify({ schemaVersion: 1, url: parsed.origin, project, ...(user ? { user } : {}) }, null, 2)}\n`, { mode: 0o600 });
  mkdirSync(dirname(secret), { recursive: true, mode: 0o700 });
  writeFileSync(secret, JSON.stringify({ url: parsed.origin, token }), { mode: 0o600 });
  chmodSync(secret, 0o600);
  return showConnection(workspace, home);
}
export function showConnection(workspace, home = homedir()) {
  const saved = readJson(connectionFile(workspace));
  if (!saved?.url) return { configured: false };
  const secret = readJson(secretFile(workspace, home));
  return { configured: true, url: saved.url, project: saved.project, ...(saved.user ? { user: saved.user } : {}), token: secret?.url === saved.url && !!secret.token };
}
export function clearConnection(workspace, home = homedir()) {
  rmSync(connectionFile(workspace), { force: true });
  rmSync(secretFile(workspace, home), { force: true });
  return { configured: false };
}

/** Endpoint declared by the environment, published by the local extension, or saved for this workspace. */
export function coreAgentEndpoint(workspace, env = process.env, home = homedir()) {
  const remote = (url, token, project, user, source) => ({ source, transport: 'api', url, project, headers: {
    authorization: `Bearer ${token}`, ...(user ? { 'x-tatami-user': user } : {}) } });
  if (env.AIKIDO_CORE_AGENT_URL) {
    let url;
    try { url = new URL(env.AIKIDO_CORE_AGENT_URL); } catch { return { reason: 'invalid AIKIDO_CORE_AGENT_URL' }; }
    if (!httpsOrLoopback(url)) return { reason: 'Core Agent URL must be HTTPS or loopback' };
    if (!env.AIKIDO_CORE_AGENT_TOKEN || !env.AIKIDO_CORE_AGENT_PROJECT) return { reason: 'AIKIDO_CORE_AGENT_TOKEN and AIKIDO_CORE_AGENT_PROJECT are required' };
    return remote(url.origin, env.AIKIDO_CORE_AGENT_TOKEN, env.AIKIDO_CORE_AGENT_PROJECT, env.AIKIDO_CORE_AGENT_USER, 'environment');
  }
  const local = localEndpoint(workspace);
  if (local.url) return local;
  // The token is only released to the address recorded next to it, outside the project.
  const saved = readJson(connectionFile(workspace));
  if (!saved?.url) return local;
  const secret = readJson(secretFile(workspace, home));
  if (secret?.url !== saved.url || !secret.token) return { reason: 'saved connection has no matching token' };
  return remote(saved.url, secret.token, saved.project, saved.user, 'configuration');
}

function localEndpoint(workspace) {
  const entry = readJson(join(workspace, '.mcp.json'))?.mcpServers?.['tatami-core-agent'];
  if (!Array.isArray(entry?.args)) return { reason: 'no tatami-core-agent entry in .mcp.json' };
  const option = name => { const index = entry.args.indexOf(name); return index < 0 ? undefined : entry.args[index + 1]; };
  const runtime = option('--runtime');
  const header = entry.args.flatMap((value, index) => entry.args[index - 1] === '--header' ? [String(value)] : []).find(value => value.startsWith('x-tatami-project='));
  if (typeof runtime !== 'string' || !isAbsolute(runtime) || !header) return { reason: 'incomplete tatami-core-agent entry' };
  // .mcp.json can come from a cloned repository: only trust a private runtime file outside it, pointing to this machine.
  let stats;
  try {
    stats = lstatSync(runtime);
    const inside = relative(realpathSync(workspace), realpathSync(runtime));
    if (!inside.startsWith('..') && !isAbsolute(inside)) return { reason: 'runtime file inside the workspace' };
  } catch { return { reason: 'Core Agent is not running' }; }
  if (!stats.isFile() || (process.platform !== 'win32' && ((stats.mode & 0o077) || stats.uid !== process.getuid()))) return { reason: 'runtime file is not private' };
  const value = readJson(runtime);
  let url;
  try { url = new URL(value?.url); } catch { return { reason: 'invalid runtime file' }; }
  if (url.protocol !== 'http:' || !LOOPBACK.has(url.hostname)) return { reason: 'runtime URL is not local' };
  const project = header.slice('x-tatami-project='.length);
  return { source: 'runtime', transport: 'mcp', url: url.href, project, headers: { ...value.headers, 'x-tatami-project': project } };
}

function rpcBody(text) {
  const data = text.trimStart().startsWith('{') ? text : text.split(/\r?\n/).filter(line => line.startsWith('data:')).map(line => line.slice(5)).at(-1);
  return JSON.parse(data);
}

export function createCoreAgentClient(endpoint, { fetcher = fetch, timeout = 60_000 } = {}) {
  let id = 0;
  const rpc = async (method, params, limit = timeout) => {
    const response = await fetcher(endpoint.url, { method: 'POST', redirect: 'error', signal: AbortSignal.timeout(limit),
      headers: { ...endpoint.headers, 'content-type': 'application/json', accept: 'application/json, text/event-stream' },
      body: JSON.stringify({ jsonrpc: '2.0', id: ++id, method, params }) });
    if (!response.ok) throw Object.assign(new Error(`Core Agent answered HTTP ${response.status}`), { code: 'core_agent_http' });
    const body = rpcBody(await response.text());
    if (body.error) throw Object.assign(new Error(body.error.message), { code: 'core_agent_rpc' });
    return body.result;
  };
  return {
    rpc,
    async tool(name, args = {}) {
      const result = await rpc('tools/call', { name, arguments: args });
      const text = result.content?.find(item => item.type === 'text')?.text ?? '';
      if (result.isError) throw Object.assign(new Error(text || `${name} failed`), { code: 'core_agent_refused' });
      return text ? JSON.parse(text) : {};
    },
  };
}

/** Same operations over the HTTP API of a remote Tatami Core, reachable with a project-scoped extension token. */
export function createCoreApiClient(endpoint, { fetcher = fetch, timeout = 60_000 } = {}) {
  const base = `${endpoint.url}/api/workspaces/${encodeURIComponent(endpoint.project)}`;
  const call = async (method, path, body, limit = timeout) => {
    const response = await fetcher(`${base}${path}`, { method, redirect: 'error', signal: AbortSignal.timeout(limit),
      headers: { ...endpoint.headers, ...(body ? { 'content-type': 'application/json' } : {}) }, ...(body ? { body: JSON.stringify(body) } : {}) });
    const value = await response.json().catch(() => ({}));
    if (!response.ok) throw Object.assign(new Error(String(value.error ?? `Core Agent answered HTTP ${response.status}`).slice(0, 300)), { code: 'core_agent_refused', status: response.status });
    return value;
  };
  const tasks = session => `/agent/sessions/${encodeURIComponent(session)}/tasks`;
  const tools = {
    workflows_list: async () => { const board = await call('GET', '/agent/board'); return { workflows: board.workflows, errors: board.workflowErrors ?? [] }; },
    workflow_save: input => call('POST', '/agent/workflows', input),
    workflow_delete: ({ id }) => call('DELETE', `/agent/workflows/${encodeURIComponent(id)}`),
    cards_list: async () => { const board = await call('GET', '/agent/board'); return { enabled: board.enabled, cards: board.cards.map(card => ({ ...card, session: card.sessionId })) }; },
    card_command: ({ session, ...command }) => call('POST', `${tasks(session)}/commands`, { commandId: command.commandId ?? `aikido-${randomUUID()}`, ...command }),
    card_events: ({ session, cursor = '', limit = 100 }) => call('GET', `${tasks(session)}/events?${new URLSearchParams({ cursor, limit: String(limit) })}`),
    sessions_list: () => call('GET', '/agent/sessions'),
    session_create: input => call('POST', '/agent/sessions', input),
  };
  return { tool: (name, args = {}) => tools[name](args), probe: () => call('GET', '/agent/board', undefined, 4000) };
}

/** Live detection: a stale file, a stopped service or an older Core Agent falls back to local operation. */
export async function detectCoreAgent(workspace, { env = process.env, fetcher = fetch } = {}) {
  const endpoint = coreAgentEndpoint(workspace, env);
  if (!endpoint.url) return { available: false, reason: endpoint.reason };
  if (endpoint.transport === 'api') {
    const client = createCoreApiClient(endpoint, { fetcher });
    try { await client.probe(); return { available: true, source: endpoint.source, project: endpoint.project, client }; }
    catch (error) { return { available: false, reason: error.status === 404 ? 'Core Agent too old (no task board)' : error.status === 401 || error.status === 403 ? 'Core Agent refused the saved token' : 'Core Agent is not reachable' }; }
  }
  const client = createCoreAgentClient(endpoint, { fetcher });
  try {
    await client.rpc('initialize', { protocolVersion: '2025-03-26', capabilities: {}, clientInfo: { name: 'aikido-task', version: '1' } }, 2500);
    const tools = (await client.rpc('tools/list', {}, 2500)).tools?.map(tool => tool.name) ?? [];
    const missing = REQUIRED_TOOLS.filter(name => !tools.includes(name));
    if (missing.length) return { available: false, reason: `Core Agent too old (missing ${missing.join(', ')})` };
    return { available: true, source: endpoint.source, project: endpoint.project, client };
  } catch { return { available: false, reason: 'Core Agent is not reachable' }; }
}
