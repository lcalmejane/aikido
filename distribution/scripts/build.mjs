#!/usr/bin/env node
import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { deflateSync } from 'node:zlib';
import {
  existsSync, lstatSync, mkdirSync, readFileSync, readdirSync, writeFileSync,
} from 'node:fs';
import { dirname, join, relative, resolve, sep } from 'node:path';
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
    try { assertSourcePath(agent.source, 'file'); } catch (error) { errors.push(error.message); }
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
    for (const property of ['commandWrapperSource', 'agentWrapperSource']) {
      if (host[property]) {
        try { assertSourcePath(host[property], 'directory'); } catch (error) { errors.push(error.message); }
      }
    }
    if (host.agentWrapperSource && (!host.agentTarget || !isSafeRelativePath(host.agentTarget))) {
      errors.push(`${hostId}: verified agent wrappers need a safe agentTarget`);
    }
    if (host.agentWrapperSource && typeof host.agentWrapperSuffix !== 'string') {
      errors.push(`${hostId}: verified agent wrappers need an agentWrapperSuffix`);
    }
    if (host.agentConfiguration) {
      try { assertSourcePath(host.agentConfiguration.source, 'file'); } catch (error) { errors.push(error.message); }
      if (!isSafeRelativePath(host.agentConfiguration.target)) errors.push(`${hostId}: unsafe agent configuration target`);
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
    if (host.commandDelivery === 'native-command' && host.commandWrapperSource === undefined) {
      errors.push(`${hostId}: native commands need a verified wrapper source`);
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

function canonicalCommandWrapper(command, sourceText) {
  return `---\nname: ${command.name}\ndescription: "${commandDescription(sourceText, command.name)}"\n---\n\n`
    + `# /${command.name}\n\n`
    + `Read and execute \`${command.source}\` from the initialized project's AI-KIDO Memory Bank.`
    + `\n\nRun the AI-KIDO bootstrap first if this project has no \`prompts/hard_points/\` directory.\n`;
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

function copilotPluginSkill(skill, sourceText) {
  const description = `AI-KIDO ${skill.name} system skill.`;
  const frontmatter = sourceText.match(/^---\r?\n([\s\S]*?)\r?\n---(\r?\n|$)/);
  if (!frontmatter) {
    return `---\nname: ${skill.name}\ndescription: "${description}"\n---\n\n${sourceText}`;
  }
  const lines = frontmatter[1].split(/\r?\n/).filter((line) => (
    !/^(?:name|description):\s*/.test(line)
  ));
  return `---\nname: ${skill.name}\ndescription: "${description}"\n`
    + `${lines.length ? `${lines.join('\n')}\n` : ''}---${frontmatter[2]}`
    + sourceText.slice(frontmatter[0].length);
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

function claudePluginAgent(agent, contents) {
  if (agent.name !== 'agent-aikido-explore-bank') return contents;
  const frontmatter = contents.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n/);
  if (!frontmatter) throw new Error(`${agent.name}: Claude Code wrapper needs YAML frontmatter`);
  const tools = frontmatter[1].match(/^tools:\s*(.+)$/m)?.[1];
  const model = frontmatter[1].match(/^model:\s*(.+)$/m)?.[1];
  return `---\nname: ${agent.name}\ndescription: "AI-KIDO Memory Bank exploration specialist."\n`
    + `${tools ? `tools: ${tools}\n` : ''}${model ? `model: ${model}\n` : ''}---\n`
    + contents.slice(frontmatter[0].length);
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

    const commandPaths = new Set();
    for (const command of catalog.commands) {
      let target;
      let contents;
      if (host.commandDelivery === 'native-command') {
        target = `${host.commandTarget}/${command.name}${host.commandSuffix}`;
        const source = join(assertSourcePath(host.commandWrapperSource, 'directory'), `${command.name}.md`);
        if (!existsSync(source)) throw new Error(`${hostId}: missing verified command wrapper for ${command.name}`);
        contents = hostId === 'claude-code'
          ? claudePluginCommand(command, readFileSync(assertSourcePath(command.source, 'file'), 'utf8'))
          : readFileSync(source);
        if (!contents.toString('utf8').includes(command.source)) {
          if (hostId !== 'claude-code') {
            throw new Error(`${hostId}: command wrapper for ${command.name} no longer points to ${command.source}`);
          }
        }
      } else if (host.commandDelivery === 'native-prompt' || host.commandDelivery === 'native-plugin-prompt') {
        target = `${host.commandTarget}/${command.name}${host.commandSuffix}`;
        contents = canonicalCommandWrapper(command, readFileSync(assertSourcePath(command.source, 'file'), 'utf8'));
      } else if (host.commandDelivery === 'native-skill-command' || host.commandDelivery === 'fallback-skill') {
        target = `${host.commandTarget}/${command.name}/SKILL.md`;
        contents = canonicalCommandWrapper(command, readFileSync(assertSourcePath(command.source, 'file'), 'utf8'));
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
          const skillContents = hostId === 'copilot-vscode' && suffix === 'SKILL.md'
            ? copilotPluginSkill(skill, contents.toString('utf8'))
            : contents;
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
    const missingWrappers = [];
    const orphanWrappers = [];
    const sourceDir = host.agentWrapperSource ? assertSourcePath(host.agentWrapperSource, 'directory') : null;
    if (sourceDir) {
      const known = new Map(catalog.agents.map((agent) => [`${agent.name}${host.agentWrapperSuffix}`, agent]));
      const found = new Set();
      for (const file of listFiles(sourceDir)) {
        if (!file.endsWith('.md')) continue;
        const name = file.split(sep).at(-1);
        const agent = known.get(name);
        if (!agent) {
          orphanWrappers.push({ host: hostId, wrapper: name });
          continue;
        }
        const contents = readFileSync(file);
        if (!contents.toString('utf8').includes(agent.source)) {
          throw new Error(`${hostId}: agent wrapper ${name} no longer points to ${agent.source}`);
        }
        found.add(agent.name);
        const target = `${host.agentTarget}/${name}`;
        let wrapper = readFileSync(file, 'utf8');
        if (hostId === 'claude-code') {
          wrapper = claudePluginAgent(agent, wrapper);
          wrapper = wrapper.replaceAll('../../prompts/', '${CLAUDE_PLUGIN_ROOT}/payload/prompts/');
          const frontmatter = wrapper.match(/^---\r?\n[\s\S]*?\r?\n---\r?\n/);
          if (frontmatter) {
            wrapper = `${frontmatter[0]}Before following this agent's role, prefer the matching file in the current project's `
              + `\`prompts/hard_points/\` when \`.aikido/lock.json\` is present; otherwise load the bundled source under `
              + `\`\${CLAUDE_PLUGIN_ROOT}/payload/prompts/hard_points/\`. Never edit the plugin cache.\n\n`
              + wrapper.slice(frontmatter[0].length);
          }
        }
        writeUnique(target, wrapper, 'agent', host.projectAgentFiles ? target : null, 'adapter', 'three-way');
      }
      for (const agent of catalog.agents) {
        if (!found.has(agent.name)) missingWrappers.push({ host: hostId, agent: agent.name });
      }
    }
    if (host.agentConfiguration) {
      writeUnique(
        host.agentConfiguration.target,
        readFileSync(assertSourcePath(host.agentConfiguration.source, 'file')),
        'agent-configuration',
        host.projectAgentFiles ? host.agentConfiguration.target : null,
        'adapter',
        'three-way',
      );
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
      missingAgentWrappers: missingWrappers,
      orphanAgentWrappers: orphanWrappers,
    };
    writeUnique('package-manifest.json', `${JSON.stringify(packageManifest, null, 2)}\n`);
    reports.push({
      host: hostId,
      status: host.qualification,
      generated: true,
      commandDelivery: host.commandDelivery,
      fileCount: outputFiles.length,
      missingAgentWrappers: missingWrappers,
      orphanAgentWrappers: orphanWrappers,
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
