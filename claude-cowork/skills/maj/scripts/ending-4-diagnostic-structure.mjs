#!/usr/bin/env node
import { readdirSync, realpathSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { isMainModule } from './ending-1-report-state.mjs';

function isKind(path, kind) {
  try {
    const stat = statSync(path);
    return kind === 'file' ? stat.isFile() : stat.isDirectory();
  } catch (error) {
    if (error.code === 'ENOENT' || error.code === 'ENOTDIR') return false;
    throw error;
  }
}

export function diagnostic(source, type) {
  const root = realpathSync(source);
  if (!statSync(root).isDirectory()) throw new Error(`Not a project directory: ${source}`);
  if (!['MONO', 'MULTI'].includes(type)) throw new Error(`Invalid project type: ${type}`);
  const paths = [
    ['prompts/hard_points/ai-kido.md', 'file', false],
    ['prompts/hard_points/ai-kido-light.md', 'file', true],
    ['prompts/index.md', 'file', false],
    ['prompts/gen', 'directory', false],
    ['prompts/hard_points', 'directory', false],
    ['prompts/spec', 'directory', false],
  ].map(([path, kind, optional]) => ({ path, optional, present: isKind(join(root, path), kind) }));
  const projects = [];
  if (type === 'MULTI' && isKind(join(root, 'prompts'), 'directory')) {
    for (const entry of readdirSync(join(root, 'prompts'), { withFileTypes: true })) {
      if (entry.isDirectory() && isKind(join(root, 'prompts', entry.name, 'index.md'), 'file')) {
        projects.push(`prompts/${entry.name}/index.md`);
      }
    }
    projects.sort((a, b) => Buffer.compare(Buffer.from(a), Buffer.from(b)));
  }
  return { type, paths, projects };
}

if (isMainModule(import.meta.url)) {
  try {
    if (Number(process.versions.node.split('.')[0]) < 24) throw new Error('Node.js 24 or newer is required');
    const args = process.argv.slice(2);
    if (args.length > 2) throw new Error('Usage: ending-4-diagnostic-structure.mjs [source] [MONO|MULTI]');
    const result = diagnostic(args[0] ?? '.', args[1] ?? 'MONO');
    console.log(`Detailed structure diagnostic (${result.type}):`);
    for (const item of result.paths) {
      console.log(`${item.present ? 'Present' : item.optional ? 'Missing (optional)' : 'MISSING'}: ${item.path}`);
    }
    for (const path of result.projects) console.log(`Present: ${path}`);
  } catch (error) {
    console.error(`Structure diagnostic failed: ${error.message}`);
    process.exitCode = 1;
  }
}
