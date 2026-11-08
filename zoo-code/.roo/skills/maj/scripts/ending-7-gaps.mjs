#!/usr/bin/env node
import { mkdtempSync, realpathSync, statSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { isMainModule } from './ending-1-report-state.mjs';

const dirs = [
  'prompts/gen/concepts', 'prompts/gen/techniques', 'prompts/gen/personas',
  'prompts/gen/use_cases', 'prompts/hard_points/concepts',
  'prompts/hard_points/techniques', 'prompts/hard_points/agents',
  'prompts/hard_points/commands',
];
const files = [
  'prompts/gen/index.md', 'prompts/gen/concepts/index.md', 'prompts/gen/techniques/index.md',
  'prompts/gen/personas/index.md', 'prompts/gen/use_cases/index.md',
  'agents_list.md', 'commands_list.md', 'skills_list.md',
];

function isKind(path, kind) {
  try {
    const stat = statSync(path);
    return kind === 'directory' ? stat.isDirectory() : stat.isFile();
  } catch (error) {
    if (error.code === 'ENOENT' || error.code === 'ENOTDIR') return false;
    throw error;
  }
}

function projectRoot(source) {
  const root = realpathSync(source);
  if (!statSync(root).isDirectory()) throw new Error(`Not a project directory: ${source}`);
  return root;
}

export function detectGaps(source) {
  const root = projectRoot(source);
  return {
    missingDirs: dirs.filter(path => !isKind(join(root, path), 'directory')),
    missingFiles: files.filter(path => !isKind(join(root, path), 'file')),
  };
}

export function populationProposal(source, dirCount, fileCount, tempRoot = tmpdir()) {
  const root = projectRoot(source);
  if (![dirCount, fileCount].every(value => Number.isSafeInteger(value) && value >= 0)) {
    throw new Error('Gap counts must be non-negative safe integers');
  }
  if (dirCount + fileCount === 0) return { status: 'none' };
  const agent = join(root, 'prompts/hard_points/agents/agent-aikido-bank-populate.md');
  if (!isKind(agent, 'file')) return { status: 'manual', agent };
  const context = join(mkdtempSync(join(tempRoot, 'aikido-populate-')), 'context.md');
  const content = `# AI-KIDO Memory Bank population\n\n`
    + `Project: ${root}\nMissing directories: ${dirCount}\nMissing files: ${fileCount}\n\n`
    + 'Use agent-aikido-bank-populate to inspect the gaps and propose compliant creation. '
    + 'Do not overwrite existing files; obtain any required approval before writing.\n';
  writeFileSync(context, content, { flag: 'wx', mode: 0o600 });
  return { status: 'agent', agent, context };
}

function count(value) {
  if (!/^(0|[1-9]\d*)$/.test(value || '')) throw new Error('Gap counts must be non-negative integers');
  return Number(value);
}

if (isMainModule(import.meta.url)) {
  try {
    if (Number(process.versions.node.split('.')[0]) < 24) throw new Error('Node.js 24 or newer is required');
    const [operation, source = '.', ...args] = process.argv.slice(2);
    if (operation === 'detect' && args.length === 0) {
      const { missingDirs, missingFiles } = detectGaps(source);
      for (const path of missingDirs) console.error(`Missing directory: ${path}`);
      for (const path of missingFiles) console.error(`Missing file: ${path}`);
      console.log(`${missingDirs.length} ${missingFiles.length}`);
    } else if (operation === 'propose' && args.length === 2) {
      const result = populationProposal(source, count(args[0]), count(args[1]));
      if (result.status === 'none') console.log('No gaps detected; no population proposed.');
      else if (result.status === 'manual') console.log(`Population agent unavailable: ${result.agent}; inspect gaps manually.`);
      else console.log(`Population agent: ${result.agent}\nContext: ${result.context}\nReview gaps and obtain required approval before populating.`);
    } else {
      throw new Error('Usage: ending-7-gaps.mjs detect [source] | propose <source> <missing-dirs> <missing-files>');
    }
  } catch (error) {
    console.error(`Gap analysis failed: ${error.message}`);
    process.exitCode = 1;
  }
}
