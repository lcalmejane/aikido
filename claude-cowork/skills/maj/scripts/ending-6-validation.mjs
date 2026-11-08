#!/usr/bin/env node
import { mkdtempSync, realpathSync, statSync, writeFileSync, readFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { isMainModule } from './ending-1-report-state.mjs';

const critical = ['prompts/hard_points/', 'prompts/gen/', 'AGENTS.md', 'CLAUDE.md', '.roomodes'];
const rootOf = source => {
  const root = realpathSync(source);
  if (!statSync(root).isDirectory()) throw new Error(`Not a project directory: ${source}`);
  return root;
};
function statIfPresent(path) {
  try { return statSync(path); }
  catch (error) {
    if (error.code === 'ENOENT' || error.code === 'ENOTDIR') return null;
    throw error;
  }
}

export function criticalPaths(source) {
  const root = rootOf(source);
  return critical.map(path => ({ path, exists: statIfPresent(join(root, path)) !== null }));
}

export function prepareValidation(source, temp = tmpdir()) {
  const root = rootOf(source);
  const agent = join(root, 'prompts/hard_points/agents/agent-aikido-validator.md');
  const stat = statIfPresent(agent);
  if (!stat) return null;
  if (!stat.isFile()) throw new Error(`Invalid validator agent: ${agent}`);
  const directory = mkdtempSync(join(temp, 'aikido-validation-'));
  const context = `# AI-KIDO final validation\n\nProject: ${root}\n\n`
    + `Validate the changed files against ${join(root, 'prompts/hard_points/ai-kido.md')}.\n`
    + `Write a detailed report to ${join(directory, 'report.md')} and a summary to ${join(directory, 'summary.txt')}.\n`
    + 'The summary must contain exactly OK or KO on a line by itself. Do not mark incomplete validation OK.\n';
  writeFileSync(join(directory, 'context.md'), context, { flag: 'wx', mode: 0o600 });
  return { directory, agent };
}

export function analyzeSummary(directory) {
  if (directory === 'MANUAL') return 'MANUAL';
  const dir = realpathSync(directory);
  const report = statIfPresent(join(dir, 'report.md'));
  if (!report?.isFile()) return 'UNKNOWN';
  const file = join(dir, 'summary.txt');
  let text;
  try { text = readFileSync(file, 'utf8'); }
  catch (error) {
    if (error.code === 'ENOENT') return 'UNKNOWN';
    throw error;
  }
  const statuses = text.split(/\r?\n/).map(line => line.trim()).filter(line => line === 'OK' || line === 'KO');
  return statuses.length === 1 ? statuses[0] : 'UNKNOWN';
}

if (isMainModule(import.meta.url)) {
  try {
    if (Number(process.versions.node.split('.')[0]) < 24) throw new Error('Node.js 24 or newer is required');
    const [operation, argument, ...extra] = process.argv.slice(2);
    if (extra.length) throw new Error('Unexpected arguments');
    if (operation === 'list') {
      for (const entry of criticalPaths(argument ?? '.')) {
        console.error(`${entry.exists ? 'Present' : 'Missing'}: ${entry.path}`);
        if (entry.exists) console.log(entry.path);
      }
    } else if (operation === 'prepare') {
      const prepared = prepareValidation(argument ?? '.');
      if (!prepared) {
        console.error('Validator agent unavailable; manual validation required.');
        console.log('MANUAL');
      } else {
        console.error(`Delegate validation to ${prepared.agent} using ${join(prepared.directory, 'context.md')}; wait for completion before analysis.`);
        console.log(prepared.directory);
      }
    } else if (operation === 'analyze') {
      if (!argument) throw new Error('Validation directory or MANUAL is required');
      const status = analyzeSummary(argument);
      if (status === 'UNKNOWN') console.error('Validation summary missing or ambiguous; validation status unknown.');
      console.log(status);
    } else throw new Error('Usage: ending-6-validation.mjs list|prepare <source> | analyze <validation-directory|MANUAL>');
  } catch (error) {
    console.error(`Validation preparation/analysis failed: ${error.message}`);
    process.exitCode = 1;
  }
}
