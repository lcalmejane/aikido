#!/usr/bin/env node
import { readdirSync, statSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { isMainModule } from './ending-1-report-state.mjs';

const common = ['prompts/index.md', 'prompts/hard_points/ai-kido.md', 'AGENTS.md'];
const ignored = new Set(['gen', 'hard_points', 'spec']);

function statIfPresent(path) {
  try { return statSync(path); }
  catch (error) {
    if (error.code === 'ENOENT' || error.code === 'ENOTDIR') return null;
    throw error;
  }
}

export function validateStructure(root, type = 'auto') {
  if (!['auto', 'mono', 'multi'].includes(type)) throw new Error(`Invalid project type: ${type}`);
  root = resolve(root);
  if (!statSync(root).isDirectory()) throw new Error(`Not a project directory: ${root}`);
  const prompts = join(root, 'prompts');
  const promptsStat = statIfPresent(prompts);
  const projects = promptsStat?.isDirectory()
    ? readdirSync(prompts, { withFileTypes: true })
      .filter(entry => entry.isDirectory() && !ignored.has(entry.name))
      .map(entry => entry.name).sort((a, b) => Buffer.compare(Buffer.from(a), Buffer.from(b)))
    : [];
  if (type === 'auto') {
    if (statIfPresent(join(root, 'prompts/gen/index.md'))?.isFile()) type = 'mono';
    else if (projects.length) type = 'multi';
    else throw new Error('Project type could not be detected');
  }
  const required = type === 'mono'
    ? [common[0], 'prompts/gen/index.md', ...common.slice(1)]
    : [...common, ...projects.map(project => `prompts/${project}/index.md`)];
  const present = [];
  const missing = [];
  for (const path of required) {
    (statIfPresent(join(root, path))?.isFile() ? present : missing).push(path);
  }
  return { type, valid: missing.length === 0, ...(type === 'multi' ? { projects } : {}), missing, present };
}

if (isMainModule(import.meta.url)) {
  try {
    if (Number(process.versions.node.split('.')[0]) < 24) throw new Error('Node.js 24 or newer is required');
    let type = 'auto';
    let json = false;
    const args = process.argv.slice(2);
    for (let index = 0; index < args.length; index++) {
      if (args[index] === '--type' && index + 1 < args.length) type = args[++index];
      else if (args[index] === '--json') json = true;
      else if (args[index] === '--help' || args[index] === '-h') {
        console.log('Usage: validate-structure.mjs [--type mono|multi|auto] [--json]');
        process.exit(0);
      } else throw new Error(`Invalid argument: ${args[index]}`);
    }
    const result = validateStructure(process.cwd(), type);
    if (json) console.log(JSON.stringify(result, null, 2));
    else {
      console.log(`Project type: ${result.type}`);
      for (const path of result.present) console.log(`Present: ${path}`);
      for (const path of result.missing) console.error(`Missing: ${path}`);
      console.log(result.valid ? 'Structure valid' : 'Structure invalid');
    }
    if (!result.valid) process.exitCode = 1;
  } catch (error) {
    console.error(`Structure validation failed: ${error.message}`);
    process.exitCode = 2;
  }
}
