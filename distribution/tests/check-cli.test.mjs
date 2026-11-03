import assert from 'node:assert/strict';
import {
  after, beforeEach, test,
} from 'node:test';
import {
  existsSync, mkdirSync, readFileSync, rmSync, writeFileSync,
} from 'node:fs';
import { join } from 'node:path';
import { spawnSync } from 'node:child_process';
import { loadCatalog } from '../lib/catalog.mjs';
import { auditCli, resolveHost } from '../lib/check-cli.mjs';
import { blockHash, findBlock } from '../lib/managed-blocks.mjs';
import { validatePackage } from '../lib/package.mjs';
import {
  agentProfile, agentWrapper, buildDistribution, canonicalCommandWrapper, rooModes, validateCatalog,
} from '../scripts/build.mjs';

const FIXTURES = new URL('./fixtures/', import.meta.url);
const ROOT = join(FIXTURES.pathname, 'check-cli-workspace');
const PACKAGE = join(FIXTURES.pathname, 'check-cli-packages');
const catalog = loadCatalog();
const commandNames = [
  'aikido-design-brief',
  'aikido-design-charter',
  'aikido-design-moodboard',
  'aikido-design-render',
  'aikido-design-style',
  'aikido-design-uikit',
  'aikido-init-design',
];
const agentNames = ['agent-aikido-art-director', 'agent-aikido-image-analyst'];

function write(path, text) {
  const absolute = join(ROOT, path);
  mkdirSync(join(absolute, '..'), { recursive: true });
  writeFileSync(absolute, text);
}

function createWorkspace() {
  mkdirSync(ROOT, { recursive: true });
  writeFileSync(join(ROOT, '.check-cli-test-fixture'), 'owned by check-cli.test.mjs\n');
  write(
    'prompts/hard_points/system/local-designer/SKILL.md',
    `---\nname: local-designer\ndescription: Design and maintain project visuals.\n---\n\n`
      + `Use [art direction](agents/agent-aikido-art-director.md) and `
      + `[image review](agents/agent-aikido-image-analyst.md).\n`
      + commandNames.map((name) => `- [${name}](commands/${name}.md)`).join('\n'),
  );
  write(
    'prompts/hard_points/system/local-designer/agents/agent-aikido-art-director.md',
    '---\nname: agent-aikido-art-director\ndescription: Art direction for local assets.\n---\n\nChoose a consistent visual direction.\n',
  );
  write(
    'prompts/hard_points/system/local-designer/agents/agent-aikido-image-analyst.md',
    '---\nname: agent-aikido-image-analyst\ndescription: Analyze local image outputs.\n---\n\nInspect image evidence.\n',
  );
  for (const name of commandNames) {
    const agent = name === 'aikido-design-render' ? agentNames[1] : agentNames[0];
    write(
      `prompts/hard_points/system/local-designer/commands/${name}.md`,
      `---\ndescription: Execute ${name}.\n---\n\n# ${name}\nDelegate to \`${agent}\` and follow this command.\n`,
    );
  }
}

function expectedWrapperCount(hostId) {
  const host = catalog.hosts[hostId];
  if (!host.workspace) return 0;
  const local = 1 + commandNames.length + agentNames.length;
  const commandCount = catalog.commands.length;
  const skillCount = host.workspace.skills?.target ? catalog.systemSkills.length : 0;
  const agentCount = host.workspace.agents?.layout === 'modes' ? 1 : catalog.agents.length;
  const instructionCount = hostId === 'claude-code' ? 2 : 1;
  return local + commandCount + skillCount + agentCount + instructionCount;
}

beforeEach(() => {
  if (existsSync(ROOT)) {
    assert.equal(readFileSync(join(ROOT, '.check-cli-test-fixture'), 'utf8'), 'owned by check-cli.test.mjs\n');
    rmSync(ROOT, { recursive: true, force: true });
  }
  createWorkspace();
});

after(() => {
  if (existsSync(ROOT)) rmSync(ROOT, { recursive: true, force: true });
  if (existsSync(PACKAGE)) rmSync(PACKAGE, { recursive: true, force: true });
});

test('host selection requires the actual caller and rejects ambiguous or conflicting signals', () => {
  assert.throws(() => resolveHost({ env: {}, catalog }), /ambiguous; pass --host/);
  assert.throws(
    () => resolveHost({ hostId: 'copilot-vscode', env: { AIKIDO_HOST: 'zoo-code' }, catalog }),
    /disagrees with AIKIDO_HOST/,
  );
  assert.equal(resolveHost({ hostId: 'copilot-vscode', env: {}, catalog }).source, 'override');
  assert.equal(resolveHost({ env: { AIKIDO_HOST: 'zoo-code' }, catalog }).source, 'AIKIDO_HOST');
  assert.throws(() => resolveHost({ hostId: 'copilot-cowork', env: {}, catalog }), /disabled/);
});

test('CLI emits structured JSON and refuses to guess its host', () => {
  const script = new URL('../scripts/check-cli.mjs', import.meta.url).pathname;
  const checked = spawnSync(process.execPath, [script, '--root', ROOT, '--host', 'copilot-vscode', '--check'], {
    encoding: 'utf8',
  });
  assert.equal(checked.status, 0, checked.stderr);
  assert.equal(JSON.parse(checked.stdout).created.length, expectedWrapperCount('copilot-vscode'));
  const ambiguous = spawnSync(process.execPath, [script, '--root', ROOT, '--check'], { encoding: 'utf8', env: {} });
  assert.equal(ambiguous.status, 2);
  assert.match(JSON.parse(ambiguous.stdout).error.message, /ambiguous; pass --host/);
});

test('/check-claude forwards to the Claude Code distribution audit and skill lifecycle invokes the gate', () => {
  const checkClaude = readFileSync(new URL('../../prompts/hard_points/commands/check-claude.md', import.meta.url), 'utf8');
  const skillManage = readFileSync(new URL('../../prompts/hard_points/commands/skill-manage.md', import.meta.url), 'utf8');
  assert.match(checkClaude, /\/check-cli/);
  assert.match(checkClaude, /claude-code/);
  assert.match(skillManage, /After `installed`, `up_to_date`, or `uninstalled`/);
  assert.match(skillManage, /even when an update reports `up_to_date`/);
  assert.match(skillManage, /never from model choice or directories/);
});

test('Copilot dry-run plans core distribution and installed skill wrappers without writes', () => {
  const result = auditCli({ root: ROOT, hostId: 'copilot-vscode', dryRun: true, repair: true, catalog });
  assert.equal(result.status, 'ok');
  assert.equal(result.applied, false);
  assert.equal(result.created.length, expectedWrapperCount('copilot-vscode'));
  assert.equal(result.created.filter(({ path }) => commandNames.some((name) => path === `.github/prompts/${name}.prompt.md`)).length, 7);
  assert.equal(result.created.filter(({ path }) => agentNames.some((name) => path === `.github/agents/${name}.agent.md`)).length, 2);
  assert.deepEqual(result.created.filter(({ path }) => path === '.github/skills/local-designer/SKILL.md').map(({ path }) => path), [
    '.github/skills/local-designer/SKILL.md',
  ]);
  assert.ok(result.created.some(({ path }) => path === '.github/prompts/check-cli.prompt.md'));
  assert.ok(result.created.some(({ path }) => path === '.github/prompts/check-claude.prompt.md'));
  assert.ok(result.created.some(({ path }) => path === '.github/agents/agent-aikido-orchestrator.agent.md'));
  assert.ok(result.created.some(({ path }) => path === '.github/skills/orchestrator/SKILL.md'));
  assert.ok(result.created.some(({ path }) => path === 'AGENTS.md'));
  for (const command of catalog.commands) {
    assert.ok(result.created.some(({ path }) => path === `.github/prompts/${command.name}.prompt.md`), command.name);
  }
  for (const agent of catalog.agents) {
    assert.ok(result.created.some(({ path }) => path === `.github/agents/${agent.name}.agent.md`), agent.name);
  }
  for (const skill of catalog.systemSkills) {
    assert.ok(result.created.some(({ path }) => path === `.github/skills/${skill.name}/SKILL.md`), skill.name);
  }
  assert.equal(result.runtimeDiscovery.status, 'not-verified');
  assert.equal(existsSync(join(ROOT, '.github')), false);
});

test('repair is idempotent and keeps user content outside managed blocks', () => {
  const first = auditCli({ root: ROOT, hostId: 'copilot-vscode', repair: true, catalog });
  assert.equal(first.status, 'ok');
  assert.equal(first.created.length, expectedWrapperCount('copilot-vscode'));
  const agentPath = join(ROOT, '.github/agents/agent-aikido-art-director.agent.md');
  let agent = readFileSync(agentPath, 'utf8');
  assert.match(agent, /^---\nname: agent-aikido-art-director\n/m);
  assert.match(agent, /tools: \["read","search"\]/);
  assert.match(agent, /prompts\/hard_points\/system\/local-designer\/agents\/agent-aikido-art-director\.md/);
  assert.match(agent, /aikido:begin id=check-cli:local-designer\/agent\/agent-aikido-art-director/);
  writeFileSync(agentPath, `${agent}\nUser-maintained note.\n`);

  const second = auditCli({ root: ROOT, hostId: 'copilot-vscode', repair: true, catalog });
  assert.equal(second.created.length, 0);
  assert.equal(second.updated.length, 0);
  assert.equal(second.unchanged.length, expectedWrapperCount('copilot-vscode'));
  assert.match(readFileSync(agentPath, 'utf8'), /User-maintained note\./);
});

test('core wrapper and instruction corruption conflicts safely during repair', () => {
  auditCli({ root: ROOT, hostId: 'copilot-vscode', repair: true, catalog });
  const commandPath = '.github/prompts/check-cli.prompt.md';
  const agentPath = '.github/agents/agent-aikido-helper.agent.md';
  const instructionsPath = 'AGENTS.md';
  const before = new Map([
    [commandPath, readFileSync(join(ROOT, commandPath), 'utf8').replace('prompts/hard_points/commands/check-cli.md', 'custom/command.md')],
    [agentPath, readFileSync(join(ROOT, agentPath), 'utf8').replace('prompts/hard_points/agents/agent-aikido-helper.md', 'custom/agent.md')],
    [instructionsPath, readFileSync(join(ROOT, instructionsPath), 'utf8').replace('prompts/gen/learned.md', 'custom/learned.md')],
  ]);
  for (const [path, contents] of before) write(path, contents);

  const result = auditCli({ root: ROOT, hostId: 'copilot-vscode', repair: true, catalog });
  for (const path of before.keys()) {
    assert.ok(result.conflicts.some((conflict) => conflict.path === path), path);
    assert.equal(readFileSync(join(ROOT, path), 'utf8'), before.get(path), `${path} must not be overwritten`);
  }
});

test('correct unmarked legacy distribution wrappers are recognized without replacement', () => {
  const profiles = catalog.agents.map((agent) => agentProfile(agent));
  const helper = profiles.find(({ name }) => name === 'agent-aikido-helper');
  const command = catalog.commands.find(({ name }) => name === 'check-cli');
  const commandText = readFileSync(join(process.cwd(), command.source), 'utf8');
  const commandWrapper = canonicalCommandWrapper(command, commandText);
  const agentWrapperText = agentWrapper('copilot', helper, profiles);
  write('.github/prompts/check-cli.prompt.md', commandWrapper);
  write('.github/agents/agent-aikido-helper.agent.md', agentWrapperText);

  const result = auditCli({ root: ROOT, hostId: 'copilot-vscode', catalog });
  assert.ok(result.unchanged.some(({ path }) => path === '.github/prompts/check-cli.prompt.md'));
  assert.ok(result.unchanged.some(({ path }) => path === '.github/agents/agent-aikido-helper.agent.md'));
  assert.ok(!result.conflicts.some(({ path }) => path === '.github/prompts/check-cli.prompt.md'));
  assert.ok(!result.conflicts.some(({ path }) => path === '.github/agents/agent-aikido-helper.agent.md'));
  assert.doesNotMatch(readFileSync(join(ROOT, '.github/prompts/check-cli.prompt.md'), 'utf8'), /aikido:begin id=check-cli:/);
});

test('compliant legacy AGENTS and Claude instruction files are recognized as host surfaces', () => {
  write(
    'AGENTS.md',
    'Read prompts/index.md, prompts/gen/learned.md, prompts/hard_points/ai-kido.md, '
      + 'and prompts/hard_points/agents/agent-aikido-orchestrator.md.\n',
  );
  write('CLAUDE.md', '@AGENTS.md\n@prompts/gen/learned.md\n');
  const result = auditCli({ root: ROOT, hostId: 'claude-code', catalog });
  assert.ok(result.unchanged.some(({ path }) => path === 'AGENTS.md'));
  assert.ok(result.unchanged.some(({ path }) => path === 'CLAUDE.md'));
  assert.ok(!result.conflicts.some(({ path }) => ['AGENTS.md', 'CLAUDE.md'].includes(path)));
});

test('workspace adapters reconcile every bundled system-skill file, including nested commands', () => {
  const first = auditCli({ root: ROOT, hostId: 'copilot-github', repair: true, catalog });
  assert.equal(first.status, 'ok');
  const targets = [
    '.github/skills/orchestrator/SKILL.md',
    '.github/skills/orchestrator/contract.schema.json',
    '.github/skills/web/commands/download-site.md',
  ];
  for (const target of targets) assert.ok(existsSync(join(ROOT, target)), target);
  assert.equal(
    readFileSync(join(ROOT, '.github/skills/orchestrator/contract.schema.json'), 'utf8'),
    readFileSync(join(process.cwd(), 'prompts/hard_points/system/orchestrator/contract.schema.json'), 'utf8'),
  );
  const second = auditCli({ root: ROOT, hostId: 'copilot-github', repair: true, catalog });
  assert.equal(second.created.length, 0);
  assert.equal(second.conflicts.length, 0);
  assert.ok(second.unchanged.some(({ path }) => path === '.github/skills/web/commands/download-site.md'));
});

test('instruction blocks update only when the installed lock confirms their baseline', () => {
  auditCli({ root: ROOT, hostId: 'copilot-vscode', repair: true, catalog });
  const agentsPath = join(ROOT, 'AGENTS.md');
  const agents = readFileSync(agentsPath, 'utf8');
  const block = findBlock(agents, 'core', 'html');
  assert.ok(block);
  write('.aikido/lock.json', JSON.stringify({
    aikido: { version: '1.5.1' },
    mode: 'STANDARD',
    managedBlocks: [{ path: 'AGENTS.md', id: 'core', sha256: blockHash(block.content) }],
  }));
  const result = auditCli({ root: ROOT, hostId: 'copilot-vscode', repair: true, catalog });
  assert.ok(result.updated.some(({ path }) => path === 'AGENTS.md'));
  assert.match(readFileSync(agentsPath, 'utf8'), /AI-KIDO 1\.5\.1/);

  const edited = readFileSync(agentsPath, 'utf8').replace('AI-KIDO 1.5.1', 'AI-KIDO local');
  write('AGENTS.md', edited);
  const conflict = auditCli({ root: ROOT, hostId: 'copilot-vscode', repair: true, catalog });
  assert.ok(conflict.conflicts.some(({ path }) => path === 'AGENTS.md'));
  assert.equal(readFileSync(agentsPath, 'utf8'), edited);
});

test('edited managed wrappers and unmarked user files conflict without being overwritten', () => {
  auditCli({ root: ROOT, hostId: 'copilot-vscode', repair: true, catalog });
  const managedPath = join(ROOT, '.github/agents/agent-aikido-art-director.agent.md');
  const before = readFileSync(managedPath, 'utf8');
  const customized = before.replace(
    'prompts/hard_points/system/local-designer/agents/agent-aikido-art-director.md',
    'custom/agent.md',
  );
  writeFileSync(managedPath, customized);
  const result = auditCli({ root: ROOT, hostId: 'copilot-vscode', repair: true, catalog });
  assert.ok(result.conflicts.some(({ path }) => path === '.github/agents/agent-aikido-art-director.agent.md'));
  assert.equal(readFileSync(managedPath, 'utf8'), customized);

  const promptPath = join(ROOT, '.github/prompts/aikido-design-brief.prompt.md');
  const manual = '---\nname: aikido-design-brief\ndescription: Custom prompt.\n---\n\nKeep this customization.\n';
  writeFileSync(promptPath, manual);
  const conflict = auditCli({ root: ROOT, hostId: 'copilot-vscode', repair: true, catalog });
  assert.ok(conflict.conflicts.some(({ path }) => path === '.github/prompts/aikido-design-brief.prompt.md'));
  assert.equal(readFileSync(promptPath, 'utf8'), manual);
});

test('uninstall cleanup removes verified generated wrappers but preserves customized orphans', () => {
  auditCli({ root: ROOT, hostId: 'copilot-vscode', repair: true, catalog });
  const customPath = join(ROOT, '.github/prompts/aikido-design-brief.prompt.md');
  writeFileSync(customPath, `${readFileSync(customPath, 'utf8')}\nLocal customization outside the managed block.\n`);
  rmSync(join(ROOT, 'prompts/hard_points/system/local-designer'), { recursive: true, force: true });
  const result = auditCli({ root: ROOT, hostId: 'copilot-vscode', repair: true, catalog });
  assert.ok(result.removed.length >= 9);
  assert.ok(result.conflicts.some(({ path }) => path === '.github/prompts/aikido-design-brief.prompt.md'));
  assert.equal(existsSync(join(ROOT, '.github/agents/agent-aikido-art-director.agent.md')), false);
  assert.match(readFileSync(customPath, 'utf8'), /Local customization outside the managed block/);
});

test('all enabled host adapters render or explicitly report their declared workspace surfaces', () => {
  assert.deepEqual(validateCatalog(catalog), []);
  for (const [hostId, host] of Object.entries(catalog.hosts)) {
    if (!host.enabled) continue;
    const result = auditCli({ root: ROOT, hostId, catalog });
    assert.notEqual(result.status, 'error', hostId);
    assert.equal(result.host, hostId);
    assert.equal(result.runtimeDiscovery.status, 'not-verified');
    if (host.workspace) {
      assert.ok(result.created.length + result.unsupported.length > 0, hostId);
      for (const entry of result.created) {
        assert.ok(entry.path.startsWith('.') || entry.path.startsWith('prompts/') || ['AGENTS.md', 'CLAUDE.md'].includes(entry.path), `${hostId}: ${entry.path}`);
      }
      if (hostId === 'claude-code') {
        assert.ok(result.created.some(({ path }) => path === 'CLAUDE.md'));
        assert.ok(result.created.some(({ path }) => path === 'AGENTS.md'));
      }
    } else {
      assert.equal(result.status, 'unsupported', hostId);
    }
  }
});

test('Zoo Code mode merge preserves custom modes and removes orphaned managed agents', () => {
  const first = auditCli({ root: ROOT, hostId: 'zoo-code', repair: true, catalog });
  assert.ok(first.created.some(({ path }) => path === '.roomodes'));
  const modesPath = join(ROOT, '.roomodes');
  writeFileSync(modesPath, `${readFileSync(modesPath, 'utf8')}\n# User mode note\n`);
  const second = auditCli({ root: ROOT, hostId: 'zoo-code', repair: true, catalog });
  assert.ok(second.unchanged.some(({ path }) => path === '.roomodes'));
  rmSync(join(ROOT, 'prompts/hard_points/system/local-designer'), { recursive: true, force: true });
  const removal = auditCli({ root: ROOT, hostId: 'zoo-code', repair: true, catalog });
  assert.ok(removal.updated.some(({ path }) => path === '.roomodes'));
  assert.match(readFileSync(modesPath, 'utf8'), /User mode note/);
  assert.doesNotMatch(readFileSync(modesPath, 'utf8'), /agent-aikido-art-director/);
});

test('Zoo Code recognizes existing unmarked distribution modes without duplicating them', () => {
  const legacyModes = rooModes(catalog.agents.map((agent) => agentProfile(agent)));
  write('.roomodes', legacyModes);
  const result = auditCli({ root: ROOT, hostId: 'zoo-code', repair: true, catalog });
  assert.ok(!result.conflicts.some(({ path }) => path === '.roomodes'), JSON.stringify(result.conflicts.filter(({ path }) => path === '.roomodes')));
  const output = readFileSync(join(ROOT, '.roomodes'), 'utf8');
  assert.equal((output.match(/slug: agent-aikido-helper/g) ?? []).length, 1);
  assert.equal((output.match(/slug: agent-aikido-art-director/g) ?? []).length, 1);
});

test('generated distributions package the runtime and canonical check-cli prompt for every enabled host', () => {
  assert.equal(existsSync(PACKAGE), false);
  const report = buildDistribution({ outDir: PACKAGE, catalog, sourceRevision: 'a'.repeat(40) });
  for (const { host, generated } of report.hosts) {
    if (!generated) continue;
    const packageRoot = join(PACKAGE, host);
    const manifest = JSON.parse(readFileSync(join(packageRoot, 'package-manifest.json'), 'utf8'));
    assert.ok(manifest.files.some(({ path }) => path === 'scripts/check-cli.mjs'), host);
    assert.ok(manifest.files.some(({ path }) => path === 'lib/check-cli.mjs'), host);
    assert.ok(manifest.files.some(({ path }) => path === 'scripts/build.mjs'), host);
    for (const path of [
      'catalog.json',
      'lib/lock.mjs',
      'lib/managed-blocks.mjs',
      'lib/templates.mjs',
      'templates/manifest.json',
      'templates/instructions/agents-block.md',
    ]) {
      assert.ok(manifest.files.some((entry) => entry.path === path), `${host}: ${path}`);
    }
    assert.ok(manifest.files.some(({ path }) => path.includes('check-cli')), `${host} command wrapper`);
    assert.equal(validatePackage(packageRoot, { catalog }).valid, true, host);
  }
  const packagedCli = spawnSync(process.execPath, [
    join(PACKAGE, 'copilot-vscode/scripts/check-cli.mjs'),
    '--root', ROOT,
    '--host', 'copilot-vscode',
    '--check',
  ], { encoding: 'utf8' });
  assert.equal(packagedCli.status, 0, packagedCli.stderr);
  assert.equal(JSON.parse(packagedCli.stdout).created.length, expectedWrapperCount('copilot-vscode'));
});
