#!/usr/bin/env node
import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { deflateSync } from 'node:zlib';
import {
  existsSync, lstatSync, mkdirSync, readFileSync, readdirSync, writeFileSync,
} from 'node:fs';
import { dirname, join, posix, relative, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import { HOSTS, isSafeRelativePath } from '../lib/lock.mjs';
import { loadCatalog } from '../lib/catalog.mjs';

const REPO = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
const COMMAND_DELIVERY = new Set([
  'native-command',
  'native-prompt',
  'native-plugin-prompt',
  'native-skill-command',
  'fallback-skill',
  'unverified',
]);
const AGENT_FORMATS = new Set(['claude-plugin', 'copilot', 'codex', 'kiro', 'antigravity', 'roomodes']);
const PLUGIN_AGENT_FORMATS = new Set(['claude-plugin']);
const CAPABILITIES = ['read', 'write', 'shell', 'delegate'];
const CANONICAL_TOOLS = {
  Read: 'read', Grep: 'read', Glob: 'read',
  Edit: 'write', Write: 'write',
  Bash: 'shell', Command: 'shell',
  Task: 'delegate', AgentOutputTool: 'delegate',
};
// Only tool names documented by each host; Antigravity may hang on unknown names.
const HOST_TOOLS = {
  'claude-plugin': { read: ['Read', 'Grep', 'Glob'], write: ['Edit', 'Write'], shell: ['Bash'], delegate: ['Task'] },
  copilot: { read: ['read', 'search'], write: ['edit'], shell: ['execute'], delegate: ['agent'] },
  kiro: { read: ['read'], write: ['write'], shell: ['shell'], delegate: ['subagent'] },
  antigravity: {
    read: ['view_file', 'grep_search'], write: ['replace_file_content'], shell: ['run_command'], delegate: ['invoke_subagent'],
  },
  roomodes: { read: ['read'], write: ['edit'], shell: ['command'], delegate: [] },
};

function within(root, path) {
  if (!isSafeRelativePath(path)) throw new Error(`Unsafe relative path: ${path}`);
  const absolute = resolve(root, ...path.split('/'));
  if (absolute !== root && !absolute.startsWith(`${root}${sep}`)) throw new Error(`Path escapes root: ${path}`);
  return absolute;
}

function assertSourcePath(path, type) {
  if (!isSafeRelativePath(path)) throw new Error(`Unsafe source path: ${path}`);
  let absolute = REPO;
  const parts = path.split('/');
  let info;
  for (let i = 0; i < parts.length; i += 1) {
    absolute = join(absolute, parts[i]);
    info = lstatSync(absolute);
    if (info.isSymbolicLink()) throw new Error(`Symbolic links are not valid catalog sources: ${parts.slice(0, i + 1).join('/')}`);
    if (i < parts.length - 1 && !info.isDirectory()) throw new Error(`Non-directory source component: ${parts.slice(0, i + 1).join('/')}`);
  }
  if (type === 'file' && !info.isFile()) throw new Error(`Expected a file source: ${path}`);
  if (type === 'directory' && !info.isDirectory()) throw new Error(`Expected a directory source: ${path}`);
  return absolute;
}

function listFiles(directory) {
  return readdirSync(directory, { withFileTypes: true }).sort((a, b) => (a.name < b.name ? -1 : a.name > b.name ? 1 : 0)).flatMap((entry) => {
    const absolute = join(directory, entry.name);
    if (entry.isSymbolicLink()) throw new Error(`Symbolic link in generated source tree: ${absolute}`);
    return entry.isDirectory() ? listFiles(absolute) : entry.isFile() ? [absolute] : [];
  });
}

function trackedPayload() {
  const paths = execFileSync('git', ['ls-files', '-z', '--', 'prompts/hard_points', 'LICENSE', 'TRADEMARK.md'], {
    cwd: REPO,
    encoding: 'utf8',
  }).split('\0').filter(Boolean).filter((path) => !path.endsWith('.test.mjs')).sort();
  const hardPoints = paths.filter((path) => path.startsWith('prompts/hard_points/'));
  if (hardPoints.length !== 151 || !paths.includes('LICENSE') || !paths.includes('TRADEMARK.md') || paths.length !== 153) {
    throw new Error(`Unexpected tracked payload closure: ${hardPoints.length} hard points and ${paths.length - hardPoints.length} legal notices`);
  }
  return paths.map((path) => {
    const absolute = assertSourcePath(path, 'file');
    const contents = readFileSync(absolute);
    return {
      path,
      contents,
      sha256: createHash('sha256').update(contents).digest('hex'),
    };
  });
}

export function validateCatalog(catalog) {
  const errors = [];
  if (catalog.schemaVersion !== 1) errors.push('schemaVersion must be 1');
  const checkUnique = (items, label) => {
    const names = items.map((item) => item.name);
    if (new Set(names).size !== names.length) errors.push(`${label} names must be unique`);
  };
  checkUnique(catalog.commands ?? [], 'command');
  checkUnique(catalog.systemSkills ?? [], 'system skill');
  checkUnique(catalog.agents ?? [], 'agent');
  const listedHosts = Object.keys(catalog.hosts ?? {}).sort();
  if (JSON.stringify(listedHosts) !== JSON.stringify([...HOSTS].sort())) errors.push('catalog must classify every known host exactly once');

  for (const command of catalog.commands ?? []) {
    if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(command.name ?? '')) errors.push(`Invalid command name: ${command.name}`);
    try { assertSourcePath(command.source, 'file'); } catch (error) { errors.push(error.message); }
  }
  for (const skill of catalog.systemSkills ?? []) {
    if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(skill.name ?? '')) errors.push(`Invalid system skill name: ${skill.name}`);
    try {
      const dir = assertSourcePath(skill.source, 'directory');
      const skillFile = join(dir, 'SKILL.md');
      if (!existsSync(skillFile)) errors.push(`${skill.name}: missing SKILL.md`);
    } catch (error) { errors.push(error.message); }
  }
  for (const agent of catalog.agents ?? []) {
    if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(agent.name ?? '')) errors.push(`Invalid agent name: ${agent.name}`);
    try {
      assertSourcePath(agent.source, 'file');
      agentProfile(agent);
    } catch (error) { errors.push(error.message); }
  }
  for (const [hostId, host] of Object.entries(catalog.hosts ?? {})) {
    if (!HOSTS.includes(hostId)) errors.push(`Unknown host id: ${hostId}`);
    if (!COMMAND_DELIVERY.has(host.commandDelivery)) errors.push(`${hostId}: unknown command delivery`);
    if (host.enabled && host.commandDelivery === 'unverified') errors.push(`${hostId}: unverified delivery cannot be enabled`);
    for (const property of ['commandTarget', 'systemSkillTarget', 'agentTarget']) {
      if (host[property] !== null && host[property] !== undefined && !isSafeRelativePath(host[property])) {
        errors.push(`${hostId}: unsafe ${property}`);
      }
    }
    for (const property of ['commandWrapperSource', 'agentWrapperSource', 'agentWrapperSuffix', 'agentConfiguration']) {
      if (property in host) errors.push(`${hostId}: ${property} is obsolete; wrappers are generated from canonical sources`);
    }
    if (host.enabled && !AGENT_FORMATS.has(host.agentFormat)) errors.push(`${hostId}: enabled hosts need a known agentFormat`);
    if (host.agentFormat && (!host.agentTarget || !isSafeRelativePath(host.agentTarget))) {
      errors.push(`${hostId}: generated agents need a safe agentTarget`);
    }
    if (PLUGIN_AGENT_FORMATS.has(host.agentFormat) && host.projectAgentFiles) {
      errors.push(`${hostId}: plugin agents must not also be copied into the project`);
    }
    if (host.commandDelivery === 'native-plugin-prompt') {
      if (host.commandTarget !== 'com.github.copilot/commands' || host.commandSuffix !== '.prompt.md') {
        errors.push(`${hostId}: plugin prompts must use the Copilot commands namespace and .prompt.md files`);
      }
      if (host.projectCommandFiles) errors.push(`${hostId}: plugin commands must not also be copied into the project`);
    }
    if (host.enabled && host.commandDelivery !== 'unverified' && !host.commandTarget) {
      errors.push(`${hostId}: enabled command delivery needs commandTarget`);
    }
    for (const property of ['projectCommandFiles', 'projectSystemSkillFiles', 'projectAgentFiles']) {
      if (typeof host[property] !== 'boolean') errors.push(`${hostId}: ${property} must be a boolean`);
    }
    if (host.enabled && host.commandDelivery !== 'unverified' && !/^\.[a-z]+(?:\.[a-z]+)*$/.test(host.commandSuffix ?? '')) {
      if (host.commandDelivery === 'native-command' || host.commandDelivery === 'native-prompt'
        || host.commandDelivery === 'native-plugin-prompt') {
        errors.push(`${hostId}: commandSuffix must be a dot-prefixed extension`);
      }
    }
  }

  for (const command of catalog.commands ?? []) {
    if (catalog.systemSkills?.some((skill) => skill.name === command.name)) {
      errors.push(`${command.name}: a command must not duplicate a system skill`);
    }
  }
  return errors;
}

function commandDescription(source, name) {
  const frontmatter = source.match(/^---\r?\n([\s\S]*?)\r?\n---/);
  const description = frontmatter?.[1].match(/^description:\s*["']?(.+?)["']?\s*$/m)?.[1];
  return (description ?? `Run the AI-KIDO ${name} command`).replaceAll('\\', '\\\\').replaceAll('"', '\\"');
}

function canonicalCommandWrapper(command, sourceText, invocation = `/${command.name}`) {
  return `---\nname: ${command.name}\ndescription: "${commandDescription(sourceText, command.name)}"\n---\n\n`
    + `# ${invocation}\n\n`
    + `Read and execute \`${command.source}\` from the initialized project's AI-KIDO Memory Bank.`
    + `\n\nRun the AI-KIDO bootstrap first if this project has no \`prompts/hard_points/\` directory.\n`;
}

function nativeCommandWrapper(command, sourceText) {
  return `---\ndescription: "${commandDescription(sourceText, command.name)}"\n---\n\n`
    + `# /${command.name}\n\n`
    + `Read and execute \`${command.source}\` from the initialized project's AI-KIDO Memory Bank.`
    + `\n\nRun the AI-KIDO bootstrap first if this project has no \`prompts/hard_points/\` directory.\n`;
}

export function agentProfile(agent) {
  const text = readFileSync(assertSourcePath(agent.source, 'file'), 'utf8');
  const frontmatter = text.match(/^---\r?\n([\s\S]*?)\r?\n---/)?.[1] ?? '';
  const description = agent.description
    ?? frontmatter.match(/^description:\s*["']?(.+?)["']?\s*$/m)?.[1];
  if (!description) throw new Error(`${agent.name}: canonical agent needs a description (frontmatter or catalog)`);
  let capabilities = agent.capabilities;
  if (!capabilities) {
    const tools = frontmatter.match(/^tools:\s*\[?(.*?)\]?\s*$/m)?.[1];
    if (!tools) throw new Error(`${agent.name}: canonical agent needs tools (frontmatter) or capabilities (catalog)`);
    capabilities = tools.split(',').map((tool) => tool.trim()).filter(Boolean).map((tool) => {
      const capability = CANONICAL_TOOLS[tool] ?? (/^agent-aikido-[a-z0-9-]+$/.test(tool) ? 'delegate' : null);
      if (!capability) throw new Error(`${agent.name}: unmapped canonical tool ${tool}`);
      return capability;
    });
  }
  for (const capability of capabilities) {
    if (!CAPABILITIES.includes(capability)) throw new Error(`${agent.name}: unknown capability ${capability}`);
  }
  return {
    name: agent.name,
    source: agent.source,
    description: description.length > 1000 ? `${description.slice(0, 997)}...` : description,
    // Every wrapper must at least read its canonical role file.
    capabilities: CAPABILITIES.filter((capability) => capability === 'read' || capabilities.includes(capability)),
    inheritTools: agent.inheritTools === true,
    topLevelOnly: agent.topLevelOnly === true,
  };
}

function hostTools(format, profile) {
  const capabilities = profile.inheritTools ? CAPABILITIES : profile.capabilities;
  return capabilities.flatMap((capability) => HOST_TOOLS[format][capability]);
}

function agentInstructions(profile, format) {
  const source = format === 'claude-plugin'
    ? `When the project has \`.aikido/lock.json\`, read \`${profile.source}\` from the project. Otherwise read the bundled `
      + `\`\${CLAUDE_PLUGIN_ROOT}/payload/${profile.source}\`. Never write into the plugin cache.`
    : `Read \`${profile.source}\` from this project's AI-KIDO Memory Bank. Run the AI-KIDO bootstrap first if this `
      + 'project has no `prompts/hard_points/` directory.';
  const scope = format === 'codex'
    ? `\n\nStay within these capabilities: ${profile.capabilities.join(', ')}.`
      + `${profile.capabilities.includes('write') ? '' : ' Do not edit files.'}`
    : '';
  return `# ${profile.name}\n\n${source}\n\nFollow that file as your complete role definition, then perform the delegated task.${scope}\n`;
}

function yamlList(key, values) {
  return values.length ? `${key}:\n${values.map((value) => `  - ${value}`).join('\n')}\n` : '';
}

export function agentWrapper(format, profile) {
  const name = `name: ${profile.name}\ndescription: ${JSON.stringify(profile.description)}\n`;
  const body = agentInstructions(profile, format);
  if (format === 'claude-plugin') {
    const tools = profile.inheritTools ? '' : `tools: ${hostTools(format, profile).join(', ')}\n`;
    return `---\n${name}${tools}model: inherit\n---\n\n${body}`;
  }
  if (format === 'copilot') {
    const tools = profile.inheritTools ? '' : `tools: ${JSON.stringify(hostTools(format, profile))}\n`;
    const invocation = profile.topLevelOnly ? 'disable-model-invocation: true\n' : '';
    return `---\n${name}${tools}${invocation}---\n\n${body}`;
  }
  if (format === 'kiro') {
    const tools = profile.inheritTools ? ['*'] : hostTools(format, profile);
    return `---\n${name}${yamlList('tools', tools.map((tool) => JSON.stringify(tool)))}---\n\n${body}`;
  }
  if (format === 'antigravity') {
    const subagent = profile.topLevelOnly ? 'subagent: false\n' : '';
    return `---\n${name}${yamlList('tools', hostTools(format, profile))}${subagent}---\n\n${body}`;
  }
  if (format === 'codex') {
    return `name = ${JSON.stringify(profile.name)}\ndescription = ${JSON.stringify(profile.description)}\n`
      + `developer_instructions = ${JSON.stringify(body)}\n`;
  }
  throw new Error(`No per-agent wrapper for format ${format}`);
}

export function rooModes(profiles) {
  const block = (text) => text.trimEnd().split('\n').map((line) => (line ? `      ${line}` : '')).join('\n');
  const modes = profiles.map((profile) => {
    const groups = profile.inheritTools ? [...hostTools('roomodes', profile), 'mcp'] : hostTools('roomodes', profile);
    return `  - slug: ${profile.name}\n`
      + `    name: ${JSON.stringify(`AI-KIDO ${profile.name.replace(/^agent-aikido-/, '')}`)}\n`
      + `    roleDefinition: |-\n${block(agentInstructions(profile, 'roomodes'))}\n`
      + `    whenToUse: |-\n${block(profile.description)}\n`
      + `    groups:\n${[...new Set(groups)].map((group) => `      - ${group}`).join('\n')}\n`;
  });
  return `customModes:\n${modes.join('')}`;
}

function copilotPluginManifest(version) {
  return `${JSON.stringify({
    $schema: 'https://agent-plugins.org/schemas/1.0.0/plugin.schema.json',
    name: 'aikido',
    version,
    description: 'AI-KIDO - AI Memory Bank Construction Method by Meta harness.',
    license: 'MIT',
  }, null, 2)}\n`;
}

function portableSkill(skill, sourceText) {
  const frontmatter = sourceText.match(/^---\r?\n([\s\S]*?)\r?\n---(\r?\n|$)/);
  const canonicalDescription = frontmatter?.[1].match(/^description:\s*"?(.+?)"?\s*$/m)?.[1]
    ?? sourceText.match(/^## Description\r?\n+([\s\S]*?)(?:\r?\n\r?\n|$)/m)?.[1];
  const description = (canonicalDescription ?? `AI-KIDO ${skill.name} system skill.`).replace(/\s+/g, ' ').trim();
  if (!frontmatter) {
    return `---\nname: ${skill.name}\ndescription: ${JSON.stringify(description)}\n---\n\n${sourceText}`;
  }
  const lines = frontmatter[1].split(/\r?\n/).filter((line) => (
    !/^(?:name|description):\s*/.test(line)
  ));
  return `---\nname: ${skill.name}\ndescription: ${JSON.stringify(description)}\n`
    + `${lines.length ? `${lines.join('\n')}\n` : ''}---${frontmatter[2]}`
    + sourceText.slice(frontmatter[0].length);
}

// Copied project files keep pointing at the same project files after relocation.
function rebaseMarkdownLinks(text, sourcePath, targetPath, sourceRoot) {
  return text.replace(/\]\(([^)\s]+)\)/g, (match, link) => {
    if (/^(?:[a-z][a-z0-9+.-]*:|#|\/)/i.test(link)) return match;
    const [path, fragment] = link.split(/(?=#)/);
    const resolved = posix.normalize(posix.join(posix.dirname(sourcePath), path));
    if (resolved.startsWith('../') || resolved === sourceRoot || resolved.startsWith(`${sourceRoot}/`)) return match;
    const rebased = posix.relative(posix.dirname(targetPath), resolved) || '.';
    return `](${rebased}${fragment ?? ''})`;
  });
}

function claudePluginCommand(command, sourceText) {
  const isUpdater = command.name === 'maj-aikido';
  const projectSource = command.source;
  const pluginSource = `\${CLAUDE_PLUGIN_ROOT}/payload/${command.source}`;
  const sourceRule = isUpdater
    ? `For this update command, always use the bundled command at \`${pluginSource}\` so it can update projects that contain older AI-KIDO instructions.`
    : `If the project has \`${projectSource}\`, use that project-pinned command. Otherwise use the bundled command at \`${pluginSource}\`. Never write into the plugin cache.`;
  return `---\nname: ${command.name}\ndescription: "${commandDescription(sourceText, command.name)}"\n---\n\n`
    + `# /aikido:${command.name}\n\n`
    + `Check whether the current project has an AI-KIDO installation and read its \`.aikido/lock.json\` first. `
    + `${sourceRule}\n\n`
    + `Follow that command's instructions exactly. A plugin install does not initialize or update the project by itself.`;
}

function claudePluginManifest(version) {
  return `${JSON.stringify({
    name: 'aikido',
    version,
    description: 'AI-KIDO — AI Memory Bank Construction Method by Meta harness',
    author: { name: 'AI-KIDO Team', url: 'https://github.com/lcalmejane/aikido' },
    license: 'MIT',
    icon: './assets/aikido.png',
  }, null, 2)}\n`;
}

function claudeMarketplaceManifest() {
  return `${JSON.stringify({
    name: 'aikido',
    owner: { name: 'AI-KIDO Team' },
    description: 'AI-KIDO plugin and project bootstrap tools',
    plugins: [{
      name: 'aikido',
      source: '.',
      description: 'AI-KIDO — AI Memory Bank Construction Method by Meta harness',
      author: { name: 'AI-KIDO Team', url: 'https://github.com/lcalmejane/aikido' },
    }],
  }, null, 2)}\n`;
}

function claudePluginReadme() {
  return `# AI-KIDO\n\n`
    + `AI-KIDO is an AI Memory Bank Construction Method by Meta harness. This plugin supplies the `
    + `AI-KIDO commands, system skills and available specialist agents for Claude Code. Its bundled `
    + `knowledge payload is read-only and is used to initialize a project when requested.\n\n`
    + `Install the plugin, open the intended project, then run \`/aikido:init-aikido\` to review and `
    + `apply the project bootstrap. The plugin does not modify project files on installation. `
    + `Review the displayed plan and explicitly confirm it before files are written.\n\n`
    + `After initialization, project-pinned instructions and the version in \`.aikido/lock.json\` `
    + `remain authoritative. Use \`/aikido:maj-aikido --update\` to plan a method update; plugin `
    + `updates and project method updates are separate. Local project knowledge is never written `
    + `back into this plugin package. This staging package is not a published release.\n`;
}

function crc32(bytes) {
  let crc = 0xffffffff;
  for (const byte of bytes) {
    crc ^= byte;
    for (let bit = 0; bit < 8; bit += 1) crc = (crc >>> 1) ^ ((crc & 1) ? 0xedb88320 : 0);
  }
  return (crc ^ 0xffffffff) >>> 0;
}

function pngChunk(type, data) {
  const typeBytes = Buffer.from(type);
  const length = Buffer.alloc(4);
  length.writeUInt32BE(data.length);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(Buffer.concat([typeBytes, data])));
  return Buffer.concat([length, typeBytes, data, crc]);
}

function claudePluginIcon() {
  const width = 512;
  const height = 512;
  const pixels = Buffer.alloc(height * (1 + width * 4));
  for (let y = 0; y < height; y += 1) {
    const row = y * (1 + width * 4);
    pixels[row] = 0;
    for (let x = 0; x < width; x += 1) {
      const progress = y - 112;
      const left = 256 - progress * 0.43;
      const right = 256 + progress * 0.43;
      const mark = y >= 112 && y <= 390 && (Math.abs(x - left) <= 20 || Math.abs(x - right) <= 20)
        || y >= 278 && y <= 312 && x >= 155 && x <= 357;
      const offset = row + 1 + x * 4;
      pixels[offset] = mark ? 244 : 16;
      pixels[offset + 1] = mark ? 249 : 37;
      pixels[offset + 2] = mark ? 255 : 67;
      pixels[offset + 3] = 255;
    }
  }
  const header = Buffer.alloc(13);
  header.writeUInt32BE(width, 0);
  header.writeUInt32BE(height, 4);
  header[8] = 8;
  header[9] = 6;
  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
  return Buffer.concat([
    signature,
    pngChunk('IHDR', header),
    pngChunk('IDAT', deflateSync(pixels)),
    pngChunk('IEND', Buffer.alloc(0)),
  ]);
}

function claudePluginSkill(skill, contents) {
  const filename = `${skill.source}/SKILL.md`;
  const guidance = `When the project has \`.aikido/lock.json\`, prefer its installed `
    + `\`prompts/hard_points/\` source. Otherwise read the bundled source at `
    + `\`\${CLAUDE_PLUGIN_ROOT}/payload/${filename}\`. Never write into the plugin cache.\n\n`;
  const frontmatter = contents.match(/^---\r?\n[\s\S]*?\r?\n---\r?\n/);
  if (frontmatter) return `${frontmatter[0]}${guidance}${contents.slice(frontmatter[0].length)}`;
  return `---\nname: ${skill.name}\ndescription: "AI-KIDO ${skill.name} system skill."\n---\n\n${guidance}${contents}`;
}

function writeOutput(root, path, text, outputFiles, role = 'adapter') {
  const absolute = within(root, path);
  mkdirSync(dirname(absolute), { recursive: true });
  writeFileSync(absolute, text);
  outputFiles.push({ path, role, sha256: createHash('sha256').update(text).digest('hex') });
}

export function buildDistribution({
  outDir,
  catalog = loadCatalog(),
  sourceRevision = 'uncommitted',
  version = '1.5.0-dev',
}) {
  const errors = validateCatalog(catalog);
  if (errors.length) throw new Error(`Invalid distribution catalog:\n${errors.join('\n')}`);
  if (sourceRevision !== 'uncommitted' && !/^[0-9a-f]{40}$/.test(sourceRevision ?? '')) {
    throw new Error('sourceRevision must be "uncommitted" or a full lowercase 40-character commit SHA');
  }
  if (!/^\d+\.\d+(\.\d+)?(-[0-9A-Za-z.-]+)?$/.test(version)) throw new Error('version must be a semantic version');
  const payload = trackedPayload();
  const source = sourceRevision === 'uncommitted'
    ? { type: 'local', ref: 'workspace' }
    : { type: 'git', ref: 'github:lcalmejane/aikido', commit: sourceRevision };
  const outputRoot = resolve(outDir);
  if (existsSync(outputRoot)) {
    const info = lstatSync(outputRoot);
    if (info.isSymbolicLink() || !info.isDirectory()) throw new Error('Output path must be a new or empty directory');
    if (readdirSync(outputRoot).length) throw new Error('Output directory must be empty; refusing to overwrite generated or user files');
  } else {
    mkdirSync(outputRoot, { recursive: true });
  }

  const reports = [];
  for (const [hostId, host] of Object.entries(catalog.hosts).sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0))) {
    if (!host.enabled) {
      reports.push({ host: hostId, status: host.qualification, generated: false, reason: host.reason });
      continue;
    }
    const packageRoot = join(outputRoot, hostId);
    mkdirSync(packageRoot, { recursive: true });
    const outputFiles = [];
    const projectFiles = [];
    const payloadFiles = [];
    const outputPaths = new Set();
    const writeUnique = (path, contents, role = 'adapter', projectTarget = null, origin = 'adapter', policy = 'three-way') => {
      if (outputPaths.has(path)) throw new Error(`${hostId}: duplicate generated target ${path}`);
      outputPaths.add(path);
      const file = { path, role, sha256: createHash('sha256').update(contents).digest('hex') };
      writeOutput(packageRoot, path, contents, outputFiles, role);
      if (projectTarget) {
        projectFiles.push({ source: path, target: projectTarget, sha256: file.sha256, origin, policy });
      }
      return file;
    };

    for (const entry of payload) {
      const packagePath = `payload/${entry.path}`;
      writeUnique(packagePath, entry.contents, 'payload');
      payloadFiles.push({
        source: entry.path,
        target: entry.path,
        packagePath,
        sha256: entry.sha256,
        origin: 'payload',
        policy: 'three-way',
      });
    }
    const templatesDir = assertSourcePath('distribution/templates', 'directory');
    for (const file of listFiles(templatesDir)) {
      const templatePath = relative(templatesDir, file).split(sep).join('/');
      writeUnique(`templates/${templatePath}`, readFileSync(file), 'template');
    }
    for (const path of [
      'distribution/lib/bootstrap-plan.mjs',
      'distribution/lib/catalog.mjs',
      'distribution/lib/lock.mjs',
      'distribution/lib/managed-blocks.mjs',
      'distribution/lib/package.mjs',
      'distribution/lib/templates.mjs',
      'distribution/lib/update-plan.mjs',
      'distribution/scripts/bootstrap-plan.mjs',
      'distribution/scripts/update-plan.mjs',
      'distribution/scripts/validate-package.mjs',
    ]) {
      const packagePath = path.replace(/^distribution\//, '');
      writeUnique(packagePath, readFileSync(assertSourcePath(path, 'file')), 'runtime');
    }
    writeUnique('catalog.json', readFileSync(assertSourcePath('distribution/catalog.json', 'file')), 'runtime');
    if (hostId === 'claude-code') {
      writeUnique('.claude-plugin/plugin.json', claudePluginManifest(version), 'plugin-manifest');
      writeUnique('.claude-plugin/marketplace.json', claudeMarketplaceManifest(), 'marketplace-manifest');
      writeUnique('README.md', claudePluginReadme(), 'plugin-readme');
      writeUnique('LICENSE', readFileSync(assertSourcePath('LICENSE', 'file')), 'legal');
      writeUnique('TRADEMARK.md', readFileSync(assertSourcePath('TRADEMARK.md', 'file')), 'legal');
      writeUnique('assets/aikido.png', claudePluginIcon(), 'plugin-asset');
    }
    if (hostId === 'copilot-vscode') {
      writeUnique('plugin.json', copilotPluginManifest(version), 'plugin-manifest');
    }
    if (hostId === 'codex') {
      writeUnique('README.md', readFileSync(assertSourcePath('distribution/adapters/codex/README.md', 'file')), 'adapter');
    }

    const commandPaths = new Set();
    for (const command of catalog.commands) {
      let target;
      let contents;
      if (host.commandDelivery === 'native-command') {
        target = `${host.commandTarget}/${command.name}${host.commandSuffix}`;
        const sourceText = readFileSync(assertSourcePath(command.source, 'file'), 'utf8');
        contents = host.agentFormat === 'claude-plugin'
          ? claudePluginCommand(command, sourceText)
          : nativeCommandWrapper(command, sourceText);
      } else if (host.commandDelivery === 'native-prompt' || host.commandDelivery === 'native-plugin-prompt') {
        target = `${host.commandTarget}/${command.name}${host.commandSuffix}`;
        contents = canonicalCommandWrapper(command, readFileSync(assertSourcePath(command.source, 'file'), 'utf8'));
      } else if (host.commandDelivery === 'native-skill-command' || host.commandDelivery === 'fallback-skill') {
        target = `${host.commandTarget}/${command.name}/SKILL.md`;
        contents = canonicalCommandWrapper(
          command,
          readFileSync(assertSourcePath(command.source, 'file'), 'utf8'),
          hostId === 'codex' ? `$${command.name}` : undefined,
        );
      }
      if (!target) continue;
      if (commandPaths.has(target)) throw new Error(`${hostId}: duplicate generated target ${target}`);
      commandPaths.add(target);
      writeUnique(
        target,
        contents,
        'command',
        host.projectCommandFiles ? target : null,
        'adapter',
        'three-way',
      );
    }

    if (host.systemSkillTarget) {
      for (const skill of catalog.systemSkills) {
        const source = assertSourcePath(skill.source, 'directory');
        for (const file of listFiles(source)) {
          const suffix = relative(source, file).split(sep).join('/');
          const target = `${host.systemSkillTarget}/${skill.name}/${suffix}`;
          const contents = readFileSync(file);
          let skillContents = ['copilot-vscode', 'copilot-github', 'codex'].includes(hostId) && suffix === 'SKILL.md'
            ? portableSkill(skill, contents.toString('utf8'))
            : contents;
          if (host.projectSystemSkillFiles && suffix.endsWith('.md')) {
            skillContents = rebaseMarkdownLinks(
              skillContents.toString('utf8'),
              `${skill.source}/${suffix}`,
              target,
              skill.source,
            );
          }
          writeUnique(
            target,
            hostId === 'claude-code' && suffix === 'SKILL.md'
              ? claudePluginSkill(skill, contents.toString('utf8'))
              : skillContents,
            'system-skill',
            host.projectSystemSkillFiles ? target : null,
            'adapter',
            'three-way',
          );
        }
      }
    }
    if (host.agentFormat) {
      const profiles = catalog.agents.map(agentProfile);
      if (host.agentFormat === 'roomodes') {
        writeUnique(
          host.agentTarget,
          rooModes(profiles),
          'agent-configuration',
          host.projectAgentFiles ? host.agentTarget : null,
          'adapter',
          'three-way',
        );
      } else {
        const suffix = { codex: '.toml', copilot: '.agent.md' }[host.agentFormat] ?? '.md';
        for (const profile of profiles) {
          const target = `${host.agentTarget}/${profile.name}${suffix}`;
          writeUnique(
            target,
            agentWrapper(host.agentFormat, profile),
            'agent',
            host.projectAgentFiles ? target : null,
            'adapter',
            'three-way',
          );
        }
      }
    }
    outputFiles.sort((a, b) => (a.path < b.path ? -1 : a.path > b.path ? 1 : 0));
    projectFiles.sort((a, b) => (a.target < b.target ? -1 : a.target > b.target ? 1 : 0));
    const packageManifest = {
      schemaVersion: 1,
      host: hostId,
      qualification: host.qualification,
      version,
      sourceRevision,
      source,
      commandDelivery: host.commandDelivery,
      files: outputFiles,
      payloadFiles,
      projectFiles,
      agentFormat: host.agentFormat,
      agentCount: catalog.agents.length,
    };
    writeUnique('package-manifest.json', `${JSON.stringify(packageManifest, null, 2)}\n`);
    reports.push({
      host: hostId,
      status: host.qualification,
      generated: true,
      commandDelivery: host.commandDelivery,
      fileCount: outputFiles.length,
      agentFormat: host.agentFormat,
      agentCount: catalog.agents.length,
    });
  }
  const report = { schemaVersion: 1, sourceRevision, hosts: reports };
  writeOutput(outputRoot, 'build-report.json', `${JSON.stringify(report, null, 2)}\n`, []);
  return report;
}

function parseArgs(argv) {
  const parsed = {};
  for (let i = 0; i < argv.length; i += 1) {
    const key = argv[i];
    if (!key.startsWith('--') || !argv[i + 1]) throw new Error(`Expected --out <directory> or --revision <value>`);
    if (Object.hasOwn(parsed, key)) throw new Error(`Duplicate argument: ${key}`);
    parsed[key] = argv[i + 1];
    i += 1;
  }
  if (!parsed['--out']) throw new Error('--out is required');
  return parsed;
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try {
    const options = parseArgs(process.argv.slice(2));
    const report = buildDistribution({
      outDir: resolve(options['--out']),
      sourceRevision: options['--revision'] ?? 'uncommitted',
      version: options['--version'] ?? '1.5.0-dev',
    });
    process.stdout.write(`${JSON.stringify(report, null, 2)}\n`);
  } catch (error) {
    process.stderr.write(`Distribution build failed: ${error.message}\n`);
    process.exitCode = 1;
  }
}
