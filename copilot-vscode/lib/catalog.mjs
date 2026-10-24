import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const CATALOG_PATH = join(dirname(fileURLToPath(import.meta.url)), '..', 'catalog.json');

export function loadCatalog(path = CATALOG_PATH) {
  return JSON.parse(readFileSync(path, 'utf8'));
}

const HOST_LABELS = {
  'claude-code': 'Claude Code',
  'claude-cowork': 'Claude Cowork',
  'copilot-vscode': 'VS Code/Copilot',
  'copilot-github': 'GitHub Copilot',
  codex: 'Codex',
  'kiro-cli': 'Kiro CLI',
  'zoo-code': 'Zoo Code',
  'roo-code-legacy': 'Roo Code (legacy)',
  antigravity: 'Antigravity',
  'copilot-cowork': 'Copilot Cowork',
};

function commandInvocation(name, hostId, delivery) {
  if (hostId === 'copilot-github') return `ask Copilot to use the \`${name}\` Skill`;
  if (hostId === 'codex') return `\`$${name}\` (Skill; also available in \`/skills\`)`;
  if (hostId === 'kiro-cli') return `\`/${name}\` (Skill)`;
  const invocation = hostId === 'claude-code' || hostId === 'claude-cowork'
    ? `/aikido:${name}`
    : `/${name}`;
  return delivery === 'fallback-skill' ? `${invocation} (Skill)` : invocation;
}

export function renderCatalogEntries(kind, { hosts = [], catalog = loadCatalog() } = {}) {
  if (!['agents', 'commands', 'skills'].includes(kind)) throw new Error(`Unknown catalog list: ${kind}`);
  if (!Array.isArray(hosts)) throw new Error('hosts must be an array');

  const items = kind === 'agents'
    ? catalog.agents
    : kind === 'commands'
      ? catalog.commands
      : catalog.systemSkills;
  if (!Array.isArray(items)) throw new Error(`Catalog is missing ${kind}`);

  const rows = items.map((item) => {
    if (!item || typeof item.name !== 'string' || typeof item.source !== 'string') {
      throw new Error(`Invalid ${kind} catalog entry`);
    }
    const detail = kind === 'commands'
      ? hosts
        .filter((hostId) => catalog.hosts[hostId]?.enabled && catalog.hosts[hostId].commandDelivery !== 'unverified')
        .map((hostId) => `${HOST_LABELS[hostId] ?? hostId}: ${commandInvocation(item.name, hostId, catalog.hosts[hostId].commandDelivery)}`)
        .join('; ') || 'Invocation depends on the selected host adapter'
      : kind === 'agents'
        ? 'Canonical role prompt, generated as a native agent for each selected host'
        : 'AI-KIDO system Skill';
    const source = kind === 'skills' ? `${item.source}/SKILL.md` : item.source;
    return `- [${item.name}](${source}) — ${detail}`;
  });
  return rows.length ? rows.join('\n') : '_No entries yet._';
}
