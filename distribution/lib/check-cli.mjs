import { createHash } from 'node:crypto';
import {
  existsSync, lstatSync, mkdirSync, readFileSync, readdirSync, realpathSync, unlinkSync, writeFileSync,
} from 'node:fs';
import { basename, dirname, join, relative, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  agentProfile, agentWrapper, canonicalCommandWrapper, nativeCommandWrapper, portableSkill, rebaseMarkdownLinks, rooModes,
} from '../scripts/build.mjs';
import { loadCatalog } from './catalog.mjs';
import { detectFeatures as detectHostFeatures, planFeatureFlags, toolInventoryEnvironment } from './features.mjs';
import { inspectNodeRuntime } from './node-runtime.mjs';
import { LOCK_PATH, MODES, isSafeRelativePath } from './lock.mjs';
import { blockHash, findBlock, upsertBlock } from './managed-blocks.mjs';
import { loadManifest, readTemplate, render, selectTemplates } from './templates.mjs';
import { writeTransaction } from './bootstrap-plan.mjs';

const SAFE_NAME = /^[a-z0-9][a-z0-9-]*$/;
const DISTRIBUTION_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const SOURCE_ROOT = resolve(DISTRIBUTION_ROOT, '..');
const MARKERS = {
  html: { begin: (id) => `<!-- aikido:begin id=${id} -->`, end: (id) => `<!-- aikido:end id=${id} -->` },
  hash: { begin: (id) => `# aikido:begin id=${id}`, end: (id) => `# aikido:end id=${id}` },
};
const digest = (text) => createHash('sha256').update(text).digest('hex');

function frontMatter(text) {
  const found = /^---\r?\n([\s\S]*?)\r?\n---(?:\r?\n|$)/.exec(text);
  if (!found) return null;
  const fields = {};
  for (const line of found[1].split(/\r?\n/)) {
    const match = /^([A-Za-z_-]+):\s*(.*)$/.exec(line);
    if (match) fields[match[1]] = match[2].replace(/^(["'])(.*)\1$/, '$2').trim();
  }
  return { fields, end: found[0].length };
}

function safeAbsolute(root, path) {
  if (!isSafeRelativePath(path)) throw new Error(`Unsafe relative path: ${path}`);
  const absolute = resolve(root, ...path.split('/'));
  if (absolute !== root && !absolute.startsWith(`${root}${sep}`)) throw new Error(`Path escapes workspace: ${path}`);
  return absolute;
}

function assertNoSymlink(root, path, { allowMissing = false } = {}) {
  const absolute = safeAbsolute(root, path);
  let current = root;
  const parts = path.split('/');
  for (let index = 0; index < parts.length; index += 1) {
    current = join(current, parts[index]);
    let stat;
    try { stat = lstatSync(current); } catch (error) {
      if (allowMissing && error.code === 'ENOENT') return absolute;
      throw error;
    }
    if (stat.isSymbolicLink()) throw new Error(`Symbolic link refused: ${path}`);
    if (index < parts.length - 1 && !stat.isDirectory()) throw new Error(`Non-directory path component: ${path}`);
  }
  return absolute;
}

function extractDescription(text, fallback) {
  const metadata = frontMatter(text)?.fields;
  if (metadata?.description && !['|', '>', '|-', '>-'].includes(metadata.description)) return metadata.description;
  const heading = text.match(/^#\s+(.+)$/m)?.[1]?.trim();
  const paragraph = text.split(/\r?\n/).map((line) => line.trim())
    .find((line) => line && !line.startsWith('#') && !line.startsWith('---'));
  return heading ?? paragraph ?? fallback;
}

function canonicalPath(source, type) {
  for (const [sourceRoot, relativePath] of [
    [DISTRIBUTION_ROOT, `payload/${source}`],
    [SOURCE_ROOT, source],
  ]) {
    try {
      const absolute = assertNoSymlink(sourceRoot, relativePath);
      const info = lstatSync(absolute);
      if (type === 'file' ? info.isFile() : info.isDirectory()) return { root: sourceRoot, path: relativePath, absolute };
    } catch (error) {
      if (error.code !== 'ENOENT') throw error;
    }
  }
  throw new Error(`Canonical distribution ${type} is unavailable: ${source}`);
}

function canonicalSource(source) {
  return canonicalPath(source, 'file');
}

function canonicalDirectory(source) {
  return canonicalPath(source, 'directory');
}

function sourceFiles(directory, relativePath = '') {
  return readdirSync(directory, { withFileTypes: true })
    .sort((a, b) => a.name.localeCompare(b.name))
    .flatMap((entry) => {
      const suffix = relativePath ? `${relativePath}/${entry.name}` : entry.name;
      const absolute = join(directory, entry.name);
      if (entry.isSymbolicLink()) throw new Error(`Symbolic link in canonical skill source: ${suffix}`);
      if (entry.isDirectory()) return sourceFiles(absolute, suffix);
      return entry.isFile() ? [{ suffix, absolute }] : [];
    });
}

function canonicalText(source) {
  const resolvedSource = canonicalSource(source);
  return { ...resolvedSource, text: readFileSync(resolvedSource.absolute, 'utf8') };
}

function projectLock(root) {
  const absolute = assertNoSymlink(root, LOCK_PATH, { allowMissing: true });
  if (!existsSync(absolute)) return null;
  const lock = JSON.parse(readFileSync(absolute, 'utf8'));
  if (!Array.isArray(lock.managedBlocks)) throw new Error(`${LOCK_PATH} has no managedBlocks list.`);
  return lock;
}

function projectVersion(root, lock) {
  try {
    const manifest = JSON.parse(readFileSync(join(DISTRIBUTION_ROOT, 'package-manifest.json'), 'utf8'));
    if (manifest.version) return manifest.version;
  } catch {}
  if (lock?.aikido?.version) return lock.aikido.version;
  try {
    const changelog = readFileSync(join(SOURCE_ROOT, 'CHANGELOG.md'), 'utf8');
    const version = changelog.match(/^\|\s*\*\*([0-9]+\.[0-9]+\.[0-9]+)\*\*/m)?.[1];
    if (version) return version;
  } catch {}
  return '0.0.0';
}

function profileFromCatalog(agent) {
  const source = canonicalSource(agent.source);
  return {
    ...agentProfile({ ...agent, source: source.path }, source.root),
    source: agent.source,
    projectSource: true,
  };
}

function validateMarkdownLinks(root, sourcePath, text) {
  const errors = [];
  for (const [, target] of text.matchAll(/\]\(([^)\s]+)\)/g)) {
    if (/^(?:[a-z][a-z0-9+.-]*:|#|\/)/i.test(target)) continue;
    const path = target.split('#', 1)[0];
    if (!path) continue;
    const resolvedPath = resolve(dirname(safeAbsolute(root, sourcePath)), path);
    if (resolvedPath !== root && !resolvedPath.startsWith(`${root}${sep}`)) {
      errors.push(`relative link escapes workspace: ${sourcePath} -> ${target}`);
      continue;
    }
    try {
      const rel = relative(root, resolvedPath).split(sep).join('/');
      const info = lstatSync(assertNoSymlink(root, rel));
      if (!info.isFile() && !info.isDirectory()) {
        errors.push(`relative link is not a file or directory: ${sourcePath} -> ${target}`);
      }
    } catch {
      errors.push(`relative link is missing: ${sourcePath} -> ${target}`);
    }
  }
  return errors;
}

function markerId(skill, kind, name) {
  return `check-cli:${skill}/${kind}/${name}`;
}

function modeBody(profile, profiles) {
  const rendered = rooModes(profiles).slice('customModes:\n'.length);
  const starts = [...rendered.matchAll(/^  - slug: ([^\r\n]+)\r?$/gm)];
  const found = starts.find(({ 1: slug }) => slug === profile.name);
  if (!found) return '';
  const next = starts.find(({ index }) => index > found.index);
  return rendered.slice(found.index, next?.index ?? rendered.length).trimEnd();
}

function addManagedBlock(text, id, style = 'html') {
  const marker = MARKERS[style];
  if (!marker) throw new Error(`Unknown marker style: ${style}`);
  const metadata = frontMatter(text);
  if (!metadata) throw new Error('Generated wrapper has no frontmatter');
  const body = text.slice(metadata.end).trim();
  const metadataDigest = digest(text.slice(0, metadata.end).trimEnd());
  return `${text.slice(0, metadata.end)}\n${marker.begin(id)}\n`
    + `<!-- aikido:metadata sha256=${metadataDigest} -->\n`
    + `<!-- aikido:content sha256=${digest(body)} -->\n${body}\n${marker.end(id)}\n`;
}

function addManagedWholeFile(text, id, style = 'hash') {
  const marker = MARKERS[style];
  const body = text.trim();
  const checksum = style === 'html'
    ? `<!-- aikido:content sha256=${digest(body)} -->`
    : `# aikido:content sha256=${digest(body)}`;
  return `${marker.begin(id)}\n${checksum}\n${body}\n${marker.end(id)}\n`;
}

function managedBlock(text, id, style = 'html') {
  const marker = MARKERS[style];
  const start = text.indexOf(marker.begin(id));
  const end = text.indexOf(marker.end(id));
  if (start < 0 && end < 0) return null;
  if (start < 0 || end < 0 || end < start || text.indexOf(marker.begin(id), start + 1) >= 0) {
    throw new Error(`Malformed managed wrapper block: ${id}`);
  }
  return { id, start, end: end + marker.end(id).length, text: text.slice(start, end + marker.end(id).length) };
}

function replaceManagedBlock(current, expected, id, style = 'html') {
  const existing = managedBlock(current, id, style);
  const next = managedBlock(expected, id, style);
  if (!next) throw new Error(`Expected wrapper block is missing: ${id}`);
  if (!existing) return { action: 'conflict', reason: 'Existing file has no AI-KIDO managed block; customization is preserved.' };
  const expectedMeta = frontMatter(expected)?.fields;
  const currentFrontMatter = frontMatter(current);
  const currentMeta = currentFrontMatter?.fields;
  const integrity = verifyManagedIntegrity(current, existing, style, currentFrontMatter);
  if (!integrity.valid) return { action: 'conflict', reason: integrity.reason };
  if (expectedMeta) {
    if (!currentMeta || currentMeta.name !== expectedMeta.name || currentMeta.description !== expectedMeta.description) {
      return { action: 'conflict', reason: 'Existing wrapper metadata differs; customization is preserved.' };
    }
  }
  if (existing.text === next.text) return { action: 'unchanged' };
  return {
    action: 'update',
    contents: `${current.slice(0, existing.start)}${next.text}${current.slice(existing.end)}`,
  };
}

function verifyManagedIntegrity(current, block, style, metadata = frontMatter(current)) {
  const contentLine = style === 'html'
    ? /^<!-- aikido:content sha256=([0-9a-f]{64}) -->\r?\n/
    : /^# aikido:content sha256=([0-9a-f]{64})\r?\n/;
  const markerStart = block.text.indexOf('\n') + 1;
  const afterBegin = block.text.slice(markerStart);
  const metadataLine = style === 'html'
    ? /^<!-- aikido:metadata sha256=([0-9a-f]{64}) -->\r?\n/
    : /^# aikido:metadata sha256=([0-9a-f]{64})\r?\n/;
  const metadataHash = metadataLine.exec(afterBegin);
  const contentOffset = metadataHash?.[0].length ?? 0;
  const content = contentLine.exec(afterBegin.slice(contentOffset));
  if (!content) return { valid: false, reason: 'Managed block checksum is missing; customization is preserved.' };
  const contentStart = markerStart + contentOffset + content[0].length;
  const endMarker = MARKERS[style].end(block.id);
  const body = block.text.slice(contentStart, block.text.lastIndexOf(endMarker)).trimEnd();
  if (digest(body) !== content[1]) return { valid: false, reason: 'Managed block was edited; customization is preserved.' };
  if (metadataHash) {
    if (!metadata || digest(current.slice(0, metadata.end).trimEnd()) !== metadataHash[1]) {
      return { valid: false, reason: 'Wrapper metadata was edited; customization is preserved.' };
    }
  }
  return { valid: true };
}

function putExpected(expected, path, item) {
  const existing = expected.get(path);
  if (existing) {
    existing.collisions ??= [];
    existing.collisions.push({ source: item.source, reason: `Target collision with ${existing.source}` });
    return;
  }
  expected.set(path, item);
}

function readSkillInventory(root, catalog) {
  const base = 'prompts/hard_points/system';
  const bundled = new Set((catalog.systemSkills ?? []).map(({ name }) => name));
  const absoluteBase = safeAbsolute(root, base);
  const skills = [];
  const issues = [];
  if (!existsSync(absoluteBase)) return { skills, issues };
  assertNoSymlink(root, base);
  for (const entry of readdirSync(absoluteBase, { withFileTypes: true }).sort((a, b) => a.name.localeCompare(b.name))) {
    const skillName = entry.name;
    if (skillName.startsWith('.')) continue;
    const directory = `${base}/${skillName}`;
    if (entry.isSymbolicLink()) {
      issues.push({ path: directory, reason: 'Symbolic link refused.' });
      continue;
    }
    if (!entry.isDirectory()) continue;
    try {
      if (bundled.has(skillName)) continue;
      assertNoSymlink(root, directory);
      const skillPath = `${directory}/SKILL.md`;
      const skillFile = safeAbsolute(root, skillPath);
      if (!existsSync(skillFile)) continue;
      if (!SAFE_NAME.test(skillName)) throw new Error(`Invalid skill directory name: ${skillName}`);
      assertNoSymlink(root, skillPath);
      const skillText = readFileSync(skillFile, 'utf8');
      const fields = frontMatter(skillText)?.fields;
      if (!fields || fields.name !== skillName || !fields.description?.trim()
        || ['|', '>', '|-', '>-'].includes(fields.description.trim())) {
        issues.push({ path: skillPath, reason: 'SKILL.md needs matching name and non-empty description frontmatter.' });
        continue;
      }
      const skillLinkErrors = validateMarkdownLinks(root, skillPath, skillText);
      if (skillLinkErrors.length) issues.push({ path: skillPath, reason: skillLinkErrors.join('; ') });
      const skill = { name: skillName, path: skillPath, text: skillText, description: fields.description, commands: [], agents: [] };
      for (const kind of ['agents', 'commands']) {
        const collectionPath = `${directory}/${kind}`;
        if (!existsSync(safeAbsolute(root, collectionPath))) continue;
        assertNoSymlink(root, collectionPath);
        for (const child of readdirSync(safeAbsolute(root, collectionPath), { withFileTypes: true }).sort((a, b) => a.name.localeCompare(b.name))) {
          if (child.isSymbolicLink()) {
            issues.push({ path: `${collectionPath}/${child.name}`, reason: 'Symbolic link refused.' });
            continue;
          }
          if (!child.isFile() || !child.name.endsWith('.md')) continue;
          const name = child.name.slice(0, -3);
          const source = `${collectionPath}/${child.name}`;
          try {
            if (!SAFE_NAME.test(name)) throw new Error(`Invalid ${kind.slice(0, -1)} filename: ${child.name}`);
            assertNoSymlink(root, source);
            const text = readFileSync(safeAbsolute(root, source), 'utf8');
            const linkErrors = validateMarkdownLinks(root, source, text);
            if (linkErrors.length) throw new Error(linkErrors.join('; '));
            const refs = [...text.matchAll(/\b(agent-[a-z0-9-]+)\b/g)].map((match) => match[1]);
            if (kind === 'commands') {
              const metadata = frontMatter(text)?.fields;
              if (metadata?.name && metadata.name !== name) throw new Error(`Command frontmatter name does not match ${child.name}.`);
              if (metadata?.description !== undefined
                && (!metadata.description.trim() || ['|', '>', '|-', '>-'].includes(metadata.description.trim()))) {
                throw new Error(`Command ${child.name} has an empty or unsupported description.`);
              }
              const known = new Set([
                ...skill.agents.map((agent) => agent.name),
                ...(catalog.agents ?? []).map((agent) => agent.name),
              ]);
              const missing = refs.filter((ref) => !known.has(ref));
              if (missing.length) throw new Error(`Command references missing agents: ${[...new Set(missing)].join(', ')}`);
              skill.commands.push({ name, source, text });
            } else {
              const metadata = frontMatter(text)?.fields;
              if (metadata?.name && metadata.name !== name) throw new Error(`Agent frontmatter name does not match ${child.name}.`);
              if (metadata?.description !== undefined
                && (!metadata.description.trim() || ['|', '>', '|-', '>-'].includes(metadata.description.trim()))) {
                throw new Error(`Agent ${child.name} has an empty or unsupported description.`);
              }
              const description = extractDescription(text, `${name} role for the ${skillName} skill.`);
              const safeDescription = description.length > 1000 ? `${description.slice(0, 997)}...` : description;
              skill.agents.push({
                name,
                source,
                text,
                description: safeDescription,
                profile: {
                  name,
                  source,
                  description: safeDescription,
                  capabilities: ['read'],
                  inheritTools: false,
                  topLevelOnly: false,
                  projectSource: true,
                  skill: skillName,
                },
              });
            }
          } catch (error) {
            issues.push({ path: source, reason: error.message });
          }
        }
      }
      const skillRefs = [...skillText.matchAll(/\b(agent-[a-z0-9-]+)\b/g)].map((match) => match[1]);
      const knownSkillAgents = new Set([
        ...skill.agents.map((agent) => agent.name),
        ...(catalog.agents ?? []).map((agent) => agent.name),
      ]);
      const missingSkillAgents = skillRefs.filter((ref) => !knownSkillAgents.has(ref));
      if (missingSkillAgents.length) {
        issues.push({
          path: skillPath,
          reason: `Skill references missing agents: ${[...new Set(missingSkillAgents)].join(', ')}`,
        });
      }
      skills.push(skill);
    } catch (error) {
      issues.push({ path: directory, reason: error.message });
    }
  }
  return { skills, issues };
}

function buildExpected(root, host, catalog, skills, unsupported, lock) {
  const expected = new Map();
  const workspace = host.workspace;
  if (!workspace) {
    unsupported.push({
      host: host.id,
      surface: 'workspace',
      reason: host.reason ?? 'This integration has no project-level wrapper surface.',
    });
    return expected;
  }
  const coreProfiles = (catalog.agents ?? []).map(profileFromCatalog);
  const allAgents = [
    ...coreProfiles,
    ...skills.flatMap((skill) => skill.agents.map((agent) => agent.profile)),
  ];
  const addWrapper = (path, text, id, source, kind) => {
    let contents;
    try {
      const style = kind === 'codex-agent' ? 'hash' : 'html';
      contents = kind === 'codex-agent'
        ? addManagedWholeFile(text, id, style)
        : addManagedBlock(text, id, style);
      const name = frontMatter(text)?.fields.name
        ?? /^name\s*=\s*"([^"]+)"/m.exec(text)?.[1];
      putExpected(expected, path, { path, contents, id, source, kind, style, name });
    } catch (error) {
      unsupported.push({ path, reason: error.message });
    }
  };

  for (const command of catalog.commands ?? []) {
    try {
      const { text } = canonicalText(command.source);
      const surface = workspace.commands;
      if (!surface) {
        unsupported.push({ host: host.id, source: command.source, surface: 'commands', reason: 'No command wrapper target is declared for this host.' });
        continue;
      }
      const target = surface.layout === 'skill'
        ? `${surface.target}/${command.name}/SKILL.md`
        : `${surface.target}/${command.name}${surface.suffix}`;
      const wrapper = surface.delivery === 'native-command'
        ? nativeCommandWrapper(command, text)
        : canonicalCommandWrapper(command, text, host.id === 'codex' ? `$${command.name}` : `/${command.name}`);
      addWrapper(target, wrapper, markerId('core', 'command', command.name), command.source, 'command');
    } catch (error) {
      unsupported.push({ host: host.id, source: command.source, surface: 'commands', reason: error.message });
    }
  }

  for (const skill of catalog.systemSkills ?? []) {
    try {
      if (host.projectSystemSkillFiles && host.systemSkillTarget) {
        const source = canonicalDirectory(skill.source);
        for (const file of sourceFiles(source.absolute)) {
          const target = `${host.systemSkillTarget}/${skill.name}/${file.suffix}`;
          let contents = readFileSync(file.absolute, 'utf8');
          if (file.suffix === 'SKILL.md'
            && ['copilot-vscode', 'copilot-github', 'codex', 'kiro-cli', 'antigravity', 'claude-cowork'].includes(host.id)) {
            contents = portableSkill(skill, contents);
          }
          if (file.suffix.endsWith('.md')) {
            contents = rebaseMarkdownLinks(
              contents,
              `${skill.source}/${file.suffix}`,
              target,
              skill.source,
            );
          }
          putExpected(expected, target, {
            path: target,
            contents,
            source: `${skill.source}/${file.suffix}`,
            kind: 'distribution-file',
            lockHash: lock?.files.find((entry) => entry.path === target)?.sha256,
          });
        }
      } else {
        const source = `${skill.source}/SKILL.md`;
        const { text } = canonicalText(source);
        const fields = frontMatter(text)?.fields;
        const description = fields?.description ?? extractDescription(text, `AI-KIDO ${skill.name} system skill.`);
        const body = `Read and follow the canonical skill at \`${source}\` from this project's AI-KIDO Memory Bank. `
          + 'Resolve its relative references from that source. This wrapper does not replace the canonical skill.';
        const wrapper = portableSkill(
          { name: skill.name },
          `---\nname: ${skill.name}\ndescription: ${JSON.stringify(description)}\n---\n\n${body}\n`,
        );
        if (workspace.skills?.target) {
          addWrapper(
            `${workspace.skills.target}/${skill.name}/SKILL.md`,
            wrapper,
            markerId('core', 'skill', skill.name),
            source,
            'skill',
          );
        } else {
          unsupported.push({ host: host.id, skill: skill.name, surface: 'skills', reason: 'This host has no project-level Skills surface.' });
        }
      }
    } catch (error) {
      unsupported.push({ host: host.id, source: skill.source, surface: 'skills', reason: error.message });
    }
  }

  for (const skill of skills) {
    if (workspace.skills?.target) {
      const path = `${workspace.skills.target}/${skill.name}/SKILL.md`;
      const body = `Read and follow the canonical skill at \`${skill.path}\` from this project's AI-KIDO Memory Bank. `
        + 'Resolve its relative references from that source. This wrapper does not replace the canonical skill.';
      const wrapper = portableSkill(
        { name: skill.name },
        `---\nname: ${skill.name}\ndescription: ${JSON.stringify(skill.description)}\n---\n\n${body}\n`,
      );
      addWrapper(path, wrapper, markerId(skill.name, 'skill', skill.name), skill.path, 'skill');
    } else {
      unsupported.push({ host: host.id, skill: skill.name, surface: 'skills', reason: 'This host has no project-level Skills surface.' });
    }

    for (const command of skill.commands) {
      const surface = workspace.commands;
      if (!surface) {
        unsupported.push({ host: host.id, source: command.source, surface: 'commands', reason: 'No command wrapper target is declared for this host.' });
        continue;
      }
      const path = surface.layout === 'skill'
        ? `${surface.target}/${command.name}/SKILL.md`
        : `${surface.target}/${command.name}${surface.suffix}`;
      const adapterCommand = { name: command.name, source: command.source };
      const wrapper = surface.delivery === 'native-command'
        ? nativeCommandWrapper(adapterCommand, command.text)
        : canonicalCommandWrapper(adapterCommand, command.text, `/${command.name}`);
      addWrapper(path, wrapper, markerId(skill.name, 'command', command.name), command.source, 'command');
    }
  }

  const agentSurface = workspace.agents;
  for (const agent of coreProfiles) {
    if (!agentSurface) {
      unsupported.push({ host: host.id, source: agent.source, surface: 'agents', reason: 'No agent wrapper target is declared for this host.' });
      continue;
    }
    if (agentSurface.layout === 'modes') {
      const body = modeBody(agent, allAgents);
      const id = markerId('core', 'agent', agent.name);
      const managed = `${MARKERS.hash.begin(id)}\n# aikido:content sha256=${digest(body)}\n${body}\n${MARKERS.hash.end(id)}`;
      const prior = expected.get(agentSurface.target);
      if (prior) {
        prior.blocks.push({ id, name: agent.name, source: agent.source, text: managed, body });
        prior.ids.push(id);
      } else {
        expected.set(agentSurface.target, {
          path: agentSurface.target,
          ids: [id],
          blocks: [{ id, name: agent.name, source: agent.source, text: managed, body }],
          source: agent.source,
          kind: 'roomodes',
          style: 'hash',
        });
      }
      continue;
    }
    const path = `${agentSurface.target}/${agent.name}${agentSurface.suffix}`;
    const wrapper = agentWrapper(agentSurface.format, agent, allAgents);
    addWrapper(path, wrapper, markerId('core', 'agent', agent.name), agent.source, `${agentSurface.format}-agent`);
  }
  for (const skill of skills) {
    for (const agent of skill.agents) {
      if (!agentSurface) {
        unsupported.push({ host: host.id, source: agent.source, surface: 'agents', reason: 'No agent wrapper target is declared for this host.' });
        continue;
      }
      if (agentSurface.layout === 'modes') {
        const body = modeBody(agent.profile, allAgents);
        const id = markerId(skill.name, 'agent', agent.name);
        const managed = `${MARKERS.hash.begin(id)}\n# aikido:content sha256=${digest(body)}\n${body}\n${MARKERS.hash.end(id)}`;
        const prior = expected.get(agentSurface.target);
        if (prior) {
          if (prior.blocks.some(({ name }) => name === agent.name)) {
            prior.collisions ??= [];
            prior.collisions.push({ source: agent.source, reason: `Duplicate mode slug: ${agent.name}` });
          } else {
            prior.blocks.push({ id, name: agent.name, source: agent.source, body, text: managed });
            prior.ids.push(id);
          }
        } else {
          expected.set(agentSurface.target, {
            path: agentSurface.target,
            ids: [id],
            blocks: [{ id, name: agent.name, source: agent.source, body, text: managed }],
            source: agent.source,
            kind: 'roomodes',
            style: 'hash',
          });
        }
        continue;
      }
      const path = `${agentSurface.target}/${agent.name}${agentSurface.suffix}`;
      const wrapper = agentWrapper(agentSurface.format, agent.profile, allAgents);
      addWrapper(path, wrapper, markerId(skill.name, 'agent', agent.name), agent.source, `${agentSurface.format}-agent`);
    }
  }
  return expected;
}

function addInstructionTemplates(root, host, expected, lock) {
  const manifest = loadManifest();
  const mode = MODES.includes(lock?.mode) ? lock.mode : 'UNSET';
  const values = {
    PROJECT_NAME: basename(root),
    AIKIDO_VERSION: projectVersion(root, lock),
  };
  for (const template of selectTemplates(manifest, { mode, hosts: [host.id] })) {
    if (template.kind !== 'managed-block' || !['AGENTS.md', 'CLAUDE.md'].includes(template.target)) continue;
    expected.set(template.target, {
      path: template.target,
      id: template.blockId,
      style: template.style,
      kind: 'instruction-block',
      source: `templates/${template.source}`,
      content: render(readTemplate(template), values),
      lockHash: lock?.managedBlocks.find((entry) => entry.path === template.target && entry.id === template.blockId)?.sha256,
    });
  }
}

function legacyModeContents(text, name) {
  const match = new RegExp(`^  - slug: ${name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\s*$`, 'm').exec(text);
  if (!match) return null;
  const next = /^  - slug: /gm;
  next.lastIndex = match.index + match[0].length;
  return text.slice(match.index, next.exec(text)?.index ?? text.length).trimEnd();
}

function validLegacyInstruction(current, item) {
  if (item.path === 'CLAUDE.md') {
    return current.includes('@AGENTS.md') && current.includes('@prompts/gen/learned.md');
  }
  return [
    'prompts/index.md',
    'prompts/gen/learned.md',
    'prompts/hard_points/ai-kido.md',
    'prompts/hard_points/agents/agent-aikido-orchestrator.md',
  ].every((reference) => current.includes(reference));
}

function safeParent(root, path, create) {
  const pieces = path.split('/');
  pieces.pop();
  let current = root;
  for (const piece of pieces) {
    current = join(current, piece);
    try {
      const info = lstatSync(current);
      if (info.isSymbolicLink() || !info.isDirectory()) throw new Error(`Unsafe target directory: ${current}`);
    } catch (error) {
      if (error.code !== 'ENOENT' || !create) throw error;
      mkdirSync(current);
    }
  }
}

function applyPlan(root, item, repair) {
  if (!repair || !['create', 'update', 'remove'].includes(item.action)) return;
  safeParent(root, item.path, true);
  const absolute = safeAbsolute(root, item.path);
  if (item.action === 'remove') {
    const info = lstatSync(absolute);
    if (!info.isFile() || info.isSymbolicLink()) throw new Error(`Unsafe removal target: ${item.path}`);
    unlinkSync(absolute);
    return;
  }
  if (item.action === 'create') {
    writeFileSync(absolute, item.contents, { flag: 'wx' });
    return;
  }
  const info = lstatSync(absolute);
  if (!info.isFile() || info.isSymbolicLink()) throw new Error(`Unsafe update target: ${item.path}`);
  writeFileSync(absolute, item.contents);
}

function validLegacyWrapper(current, item) {
  if (!current.includes(item.source)) return false;
  const expectedMeta = frontMatter(item.contents)?.fields;
  if (expectedMeta) {
    const currentMeta = frontMatter(current)?.fields;
    if (expectedMeta.name !== undefined && currentMeta?.name !== expectedMeta.name) return false;
    if (expectedMeta.description !== undefined && !currentMeta?.description?.trim()) return false;
    return true;
  }
  if (item.kind === 'codex-agent') {
    return current.includes(`name = ${JSON.stringify(item.name)}`);
  }
  return false;
}

function inspectExpected(root, expected, repair, plan) {
  for (const item of expected.values()) {
    try {
      for (const collision of item.collisions ?? []) {
        plan.push({ path: item.path, action: 'conflict', ...collision });
      }
      if (item.collisions?.length) continue;
      const absolute = assertNoSymlink(root, item.path, { allowMissing: true });
      if (!existsSync(absolute)) {
        item.action = 'create';
        if (item.kind === 'roomodes') item.contents = `customModes:\n${item.blocks.map(({ text }) => text).join('\n')}\n`;
        if (item.kind === 'instruction-block') item.contents = upsertBlock('', item.id, item.content, item.style);
      } else {
        const current = readFileSync(absolute, 'utf8');
        if (item.kind === 'distribution-file') {
          const currentHash = digest(current);
          if (currentHash === digest(item.contents)) {
            item.action = 'unchanged';
          } else if (item.lockHash && item.lockHash === currentHash) {
            item.action = 'update';
          } else {
            item.action = 'conflict';
            item.reason = 'Existing distribution file differs from its canonical source and has no matching lock baseline; customization is preserved.';
          }
        } else if (item.kind === 'instruction-block') {
          const found = findBlock(current, item.id, item.style);
          if (!found) {
            if (current.includes(item.content) || validLegacyInstruction(current, item)) {
              item.action = 'unchanged';
            } else {
              item.action = 'conflict';
              item.reason = 'Existing instruction file has no compatible AI-KIDO managed block; customization is preserved.';
            }
          } else {
            const currentHash = blockHash(found.content);
            const expectedHash = blockHash(item.content);
            if (currentHash === expectedHash) {
              item.action = 'unchanged';
            } else if (item.lockHash && item.lockHash === currentHash) {
              item.action = 'update';
              item.contents = upsertBlock(current, item.id, item.content, item.style);
            } else {
              item.action = 'conflict';
              item.reason = 'Managed instruction block was edited or has no matching lock baseline; customization is preserved.';
            }
          }
        } else if (item.kind === 'roomodes') {
          if (!/^customModes:\s*$/m.test(current)) {
            item.action = 'conflict';
            item.reason = 'Existing mode file has no compatible customModes section; customization is preserved.';
          } else {
            let merged = current;
            let changed = false;
            for (const block of item.blocks) {
              const found = managedBlock(merged, block.id, 'hash');
              if (!found) {
                const legacy = legacyModeContents(merged, block.name);
                if (legacy) {
                  if (legacy.includes(block.source)) continue;
                  item.action = 'conflict';
                  item.reason = `Existing mode "${block.name}" differs from its canonical source; customization is preserved.`;
                  break;
                }
                const header = /^customModes:\s*\r?\n/m.exec(merged);
                if (!header) throw new Error('customModes must have a newline before mode entries.');
                merged = `${merged.slice(0, header.index + header[0].length)}${block.text}\n${merged.slice(header.index + header[0].length)}`;
                changed = true;
              } else {
                const integrity = verifyManagedIntegrity(merged, found, 'hash', null);
                if (!integrity.valid) {
                  item.action = 'conflict';
                  item.reason = integrity.reason;
                  break;
                }
                if (found.text !== block.text) {
                  merged = `${merged.slice(0, found.start)}${block.text}${merged.slice(found.end)}`;
                  changed = true;
                }
              }
            }
            if (item.action !== 'conflict') {
              item.action = changed ? 'update' : 'unchanged';
              item.contents = merged;
            }
          }
        } else {
          const result = replaceManagedBlock(current, item.contents, item.id, item.style);
          item.action = result.action;
          if (result.contents) item.contents = result.contents;
          if (result.reason) item.reason = result.reason;
          if (result.action === 'conflict' && !managedBlock(current, item.id, item.style)) {
            if (validLegacyWrapper(current, item)) {
              item.action = 'unchanged';
              delete item.reason;
            }
          }
        }
      }
      if (item.action === 'unchanged' || item.action === 'create' || item.action === 'update') {
        applyPlan(root, item, repair);
      }
      if (item.action === 'conflict' && item.reason) plan.push({ path: item.path, action: 'conflict', reason: item.reason });
      if (item.action !== 'conflict') plan.push(item);
    } catch (error) {
      plan.push({ path: item.path, action: 'conflict', reason: error.message });
    }
  }
}

function removeOrphans(root, expected, host, repair, plan) {
  const knownIds = new Set([...expected.values()].flatMap(({ id, ids = [] }) => [id, ...ids].filter(Boolean)));
  const directories = new Set();
  for (const surface of [host.workspace?.commands, host.workspace?.skills, host.workspace?.agents]) {
    if (surface?.target && surface.layout !== 'modes') directories.add(surface.target);
  }
  const inspectFile = (path) => {
    let text;
    try { text = readFileSync(assertNoSymlink(root, path), 'utf8'); } catch { return; }
    const orphanBlocks = [];
    for (const style of ['html', 'hash']) {
      const matcher = style === 'html'
        ? /<!-- aikido:begin id=(check-cli:[^ ]+) -->/g
        : /^# aikido:begin id=(check-cli:\S+)$/gm;
      for (const match of text.matchAll(matcher)) {
        const id = match[1];
        if (knownIds.has(id)) continue;
        orphanBlocks.push({ id, style });
      }
    }
    let updated = text;
    let changed = false;
    for (const { id, style } of orphanBlocks) {
        const block = managedBlock(updated, id, style);
        if (!block) {
          plan.push({ path, action: 'conflict', reason: `Malformed orphan wrapper block: ${id}` });
          continue;
        }
        const integrity = verifyManagedIntegrity(updated, block, style, frontMatter(updated));
        if (!integrity.valid) {
          plan.push({ path, id, action: 'conflict', reason: integrity.reason });
          continue;
        }
        if (host.workspace?.agents?.layout === 'modes' && path === host.workspace.agents.target) {
          updated = `${updated.slice(0, block.start)}${updated.slice(block.end)}`;
          changed = true;
          continue;
        }
        const before = updated.slice(0, block.start);
        const after = updated.slice(block.end);
        const metadata = frontMatter(updated);
        const frontmatterOnly = metadata
          && before.trim() === updated.slice(0, metadata.end).trim()
          && !after.trim();
        const clean = !before.trim() && !after.trim() || frontmatterOnly;
        const item = {
          path,
          id,
          action: clean ? 'remove' : 'conflict',
          reason: clean
            ? 'Canonical source was removed.'
            : 'Orphan has content outside its verified managed block; customization is preserved.',
        };
        if (item.action === 'remove') {
          try { applyPlan(root, item, repair); } catch (error) {
            item.action = 'conflict';
            item.reason = error.message;
          }
        }
        plan.push(item);
    }
    if (changed) {
      if (!/^\s{2}-\s+slug:/m.test(updated)) updated = updated.replace(/^customModes:\s*$/m, 'customModes: []');
      const item = { path, action: 'update', contents: updated, reason: 'Removed obsolete managed mode blocks; custom modes were retained.' };
      try { applyPlan(root, item, repair); } catch (error) {
        item.action = 'conflict';
        item.reason = error.message;
      }
      plan.push(item);
    }
  };
  for (const directory of directories) {
    let absolute;
    try { absolute = assertNoSymlink(root, directory, { allowMissing: true }); } catch { continue; }
    if (!existsSync(absolute)) continue;
    const walk = (path) => {
      for (const entry of readdirSync(path, { withFileTypes: true })) {
        const child = join(path, entry.name);
        const rel = relative(root, child).split(sep).join('/');
        if (entry.isSymbolicLink()) {
          plan.push({ path: rel, action: 'conflict', reason: 'Symbolic link in wrapper tree; not followed.' });
        } else if (entry.isDirectory()) walk(child);
        else if (entry.isFile() && /\.(md|toml)$/.test(entry.name)) inspectFile(rel);
      }
    };
    const info = lstatSync(absolute);
    if (info.isFile()) inspectFile(directory);
    else walk(absolute);
  }
  const modes = host.workspace?.agents?.layout === 'modes' ? host.workspace.agents.target : null;
  if (modes && existsSync(safeAbsolute(root, modes))) inspectFile(modes);
}

export function resolveHost({ hostId, env = process.env, catalog = loadCatalog() } = {}) {
  const fromEnvironment = env.AIKIDO_HOST?.trim();
  if (hostId && fromEnvironment && hostId !== fromEnvironment) {
    throw new Error(`Host override "${hostId}" disagrees with AIKIDO_HOST="${fromEnvironment}".`);
  }
  const selected = hostId || fromEnvironment;
  if (!selected) {
    const supported = Object.entries(catalog.hosts).filter(([, host]) => host.enabled).map(([id]) => id);
    throw new Error(`Calling host is ambiguous; pass --host <id> (${supported.join(', ')}) or set AIKIDO_HOST.`);
  }
  if (!Object.hasOwn(catalog.hosts, selected)) throw new Error(`Unknown host "${selected}". Use an id from distribution/catalog.json.`);
  if (!catalog.hosts[selected].enabled) throw new Error(`Host "${selected}" is disabled: ${catalog.hosts[selected].reason ?? 'unsupported integration'}`);
  return { id: selected, source: hostId ? 'override' : 'AIKIDO_HOST', ...catalog.hosts[selected] };
}

export function auditCli({ root = process.cwd(), hostId, env = process.env, repair = false, dryRun = false, detectFeatures = false, catalog = loadCatalog() } = {}) {
  const resolvedRoot = resolve(root);
  const rootInfo = lstatSync(resolvedRoot);
  if (rootInfo.isSymbolicLink() || !rootInfo.isDirectory()) throw new Error('Workspace root must be a real directory.');
  const workspaceRoot = realpathSync(resolvedRoot);
  const host = resolveHost({ hostId, env, catalog });
  const { featureFlags, kimono } = detectHostFeatures(env, { rtk: host.id === 'zoo-code' || detectFeatures });
  const plan = [];
  const unsupported = [];
  const lock = host.workspace ? projectLock(workspaceRoot) : null;
  if (Object.keys(featureFlags).length) {
    const featureState = planFeatureFlags(workspaceRoot, featureFlags);
    if (featureState.operation && !dryRun) writeTransaction(workspaceRoot, [featureState.operation]);
  }
  if (!host.workspace) {
    unsupported.push({
      host: host.id,
      surface: 'workspace',
      reason: host.reason ?? 'No project-level integration is declared in distribution/catalog.json.',
    });
  } else {
    const { skills, issues } = readSkillInventory(workspaceRoot, catalog);
    for (const issue of issues) plan.push({ ...issue, action: 'conflict' });
    const expected = buildExpected(workspaceRoot, host, catalog, skills, unsupported, lock);
    addInstructionTemplates(workspaceRoot, host, expected, lock);
    inspectExpected(workspaceRoot, expected, repair && !dryRun, plan);
    if (issues.length) {
      unsupported.push({
        host: host.id,
        surface: 'orphan-cleanup',
        reason: 'Skipped removal because one or more canonical skill sources are invalid.',
      });
    } else {
      removeOrphans(workspaceRoot, expected, host, repair && !dryRun, plan);
    }
  }
  const group = (action) => plan.filter((item) => item.action === action).map(({ path, id, reason }) => (
    { path, ...(id ? { id } : {}), ...(reason ? { reason } : {}) }
  ));
  const conflicts = group('conflict');
  return {
    schemaVersion: 1,
    status: conflicts.length ? 'conflict' : unsupported.length ? 'unsupported' : 'ok',
    host: host.id,
    hostSource: host.source,
    root: workspaceRoot,
    mode: repair ? (dryRun ? 'repair-dry-run' : 'repair') : 'check',
    applied: repair && !dryRun,
    featureFlags,
    kimono,
    nodeRuntime: inspectNodeRuntime(),
    created: group('create'),
    updated: group('update'),
    unchanged: group('unchanged'),
    removed: group('remove'),
    conflicts,
    unsupported,
    runtimeDiscovery: {
      status: 'not-verified',
      detail: 'File conformance does not prove that the selected host discovers or loads these wrappers at runtime.',
    },
    plan: plan.map(({ path, id, action, reason }) => ({ path, ...(id ? { id } : {}), action, ...(reason ? { reason } : {}) })),
  };
}

export function parseCheckCliArgs(argv) {
  const options = {};
  const flags = new Set(['--check', '--repair', '--dry-run', '--detect-features', '--help']);
  const values = new Set(['--root', '--host', '--tools-file']);
  for (let index = 0; index < argv.length; index += 1) {
    const key = argv[index];
    if (!flags.has(key) && !values.has(key)) throw new Error(`Unknown option: ${key}`);
    if (flags.has(key)) {
      if (options[key]) throw new Error(`Duplicate option: ${key}`);
      options[key] = true;
      continue;
    }
    if (!argv[index + 1] || argv[index + 1].startsWith('--')) throw new Error(`${key} requires a value`);
    if (options[key]) throw new Error(`Duplicate option: ${key}`);
    options[key] = argv[index + 1];
    index += 1;
  }
  if (options['--check'] && options['--repair']) throw new Error('--check and --repair are mutually exclusive');
  return options;
}

export function runCheckCli(argv = process.argv.slice(2), env = process.env) {
  let result;
  try {
    const options = parseCheckCliArgs(argv);
    if (options['--help']) {
      result = {
        schemaVersion: 1,
        status: 'ok',
        usage: 'check-cli.mjs [--check | --repair] [--dry-run] [--detect-features] [--tools-file JSON] [--root DIR] --host HOST',
        hostSource: 'Use an explicit --host or AIKIDO_HOST; host directories are never used to guess the caller.',
      };
    } else {
      result = auditCli({
        root: options['--root'],
        hostId: options['--host'],
        env: toolInventoryEnvironment(env, options['--tools-file']),
        repair: options['--repair'] === true,
        dryRun: options['--dry-run'] === true,
        detectFeatures: options['--detect-features'] === true,
      });
    }
    process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
    if (result.status === 'conflict') process.exitCode = 2;
  } catch (error) {
    process.stdout.write(`${JSON.stringify({
      schemaVersion: 1,
      status: 'error',
      error: { code: 'check-cli', message: error.message },
      nodeRuntime: inspectNodeRuntime(),
      runtimeDiscovery: { status: 'not-verified' },
    }, null, 2)}\n`);
    process.exitCode = 2;
  }
}
