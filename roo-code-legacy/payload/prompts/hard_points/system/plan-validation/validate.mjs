#!/usr/bin/env node
import { readdirSync, readFileSync, lstatSync, realpathSync, mkdirSync, openSync, writeFileSync, closeSync } from 'node:fs';
import { basename, dirname, extname, isAbsolute, join, relative, resolve, sep } from 'node:path';
import { pathToFileURL } from 'node:url';
import { spawnSync } from 'node:child_process';
import { createGitIgnoreContext } from '../structure/scripts/git-ignore.mjs';
import {
  assertPublicProjectRoot, isPrivateTaskStorePathWithin,
} from '../structure/scripts/lib/private-task-store.mjs';

const PLAN_DIR = {
  search: 'prompts/hard_points/system/search/plans',
  analyse: 'prompts/hard_points/system/analyse/plans',
};

function inside(root, file) {
  const path = relative(root, file);
  return path === '' || (path !== '..' && !path.startsWith(`..${sep}`) && !isAbsolute(path));
}

function walk(root, visit, exclusions = new Set()) {
  const physicalRoot = assertPublicProjectRoot(root);
  function recurse(dir) {
    for (const entry of readdirSync(dir, { withFileTypes: true }).sort((a, b) => a.name < b.name ? -1 : a.name > b.name ? 1 : 0)) {
      if (entry.isSymbolicLink() || exclusions.has(entry.name)) continue;
      const path = join(dir, entry.name);
      if (isPrivateTaskStorePathWithin(physicalRoot, path)) continue;
      if (entry.isDirectory()) recurse(path);
      else if (entry.isFile()) visit(path);
    }
  }
  recurse(physicalRoot);
}

export function listPlans(root, kind) {
  if (!PLAN_DIR[kind]) throw new Error('Expected search or analyse');
  const dir = resolve(root, PLAN_DIR[kind]);
  const plans = [];
  walk(dir, file => {
    const name = basename(file);
    if (kind === 'search' ? /^plan(?:-.*)?\.md$/i.test(name) : /^plan-.*\.md$/i.test(name)) plans.push(relative(dir, file));
  });
  return plans;
}

// Headings inside examples are not document sections.
function sections(text) {
  const result = [];
  let current = null, fence = null;
  for (const line of text.split(/\r?\n/)) {
    const marker = line.match(/^\s{0,3}(`{3,}|~{3,})/);
    if (marker) {
      if (!fence) fence = marker[1];
      else if (marker[1][0] === fence[0] && marker[1].length >= fence.length) fence = null;
    } else if (!fence && /^##\s+/.test(line)) {
      current = { title: line.slice(3).trim(), body: '' };
      result.push(current);
      continue;
    }
    if (current) current.body += `${line}\n`;
  }
  return result;
}

function subsection(text, name) {
  const lines = text.split(/\r?\n/);
  const start = lines.findIndex(line => /^###\s/.test(line) && name.test(line));
  if (start < 0) return '';
  let end = start + 1;
  while (end < lines.length && !/^###\s/.test(lines[end])) end++;
  return lines.slice(start, end).join('\n');
}

function regexLines(text) {
  const patterns = [];
  for (const block of text.matchAll(/```(?:regex|regexp)(?:[ \t]+([\w+-]+))?[ \t]*\r?\n([\s\S]*?)```/gi)) {
    for (const line of block[2].split(/\r?\n/)) {
      const pattern = line.trim();
      if (pattern && !pattern.startsWith('#')) patterns.push({ pattern, dialect: (block[1] ?? '').toLowerCase() });
    }
  }
  return patterns;
}

function headerValue(text, name) {
  const header = text.split(/^##\s/m, 1)[0];
  const match = header.match(new RegExp(`\\*\\*${name}\\*\\*\\s*:\\s*([^|\\n]+)`, 'i'));
  return match?.[1].trim() ?? '';
}

export function validate(kind, text, planPath) {
  if (!PLAN_DIR[kind]) throw new Error('Expected search or analyse');
  const entries = sections(text);
  const section = pattern => (entries.find(item => pattern.test(item.title))?.body ?? '').trim();
  const checks = [];
  const check = (id, ok, message, blocking = false) => checks.push({ id, status: ok ? 'pass' : blocking ? 'error' : 'warning', message });
  const version = headerValue(text, 'Version'), date = headerValue(text, 'Date'), type = headerValue(text, 'Type');
  const depth = headerValue(text, 'Depth') || headerValue(text, 'Profondeur');
  const dateValid = /^\d{4}-\d\d-\d\d$/.test(date) && !Number.isNaN(Date.parse(`${date}T00:00:00Z`)) && new Date(`${date}T00:00:00Z`).toISOString().slice(0, 10) === date;
  check('header', /^\d+\.\d+(?:\.\d+)*$/.test(version) && dateValid && new RegExp(`^${kind === 'search' ? 'Search' : 'Analysis'} Plan$`, 'i').test(type) && (kind === 'search' || !!headerValue(text, 'Nature') && /^[1-4]\b/.test(depth)), 'Valid metadata header', true);
  if (kind === 'search') {
    check('language', !!headerValue(text, 'Language'), 'Header specifies language (generic plans may omit it)');
    const names = ['Overview', 'File Patterns', 'Search Method', 'Search Patterns', 'Extension Strategy', 'Output Format', 'Context Extraction', 'Performance Optimization', 'Usage Example'];
    const mandatory = new Set(['File Patterns', 'Search Method', 'Search Patterns', 'Output Format']);
    for (const name of names) check(`section:${name}`, !!section(new RegExp(name, 'i')), `${name} section present and nonempty`, mandatory.has(name));
    const files = section(/File Patterns/i), patterns = section(/Search Patterns/i), output = section(/Output Format/i);
    const extensions = [...new Set(files.match(/\*\.[\w-]+/g) ?? [])];
    check('extensions', extensions.length > 0, 'File extensions extractable', true);
    check('exclusions', /exclusions?/i.test(files), 'Exclusions documented');
    check('method', /\b(naive|semantic|structure-aware|ast(?:-based)?|grep|ripgrep|rg)\b/i.test(section(/Search Method/i)), 'Search method identifiable', true);
    for (const [id, pattern] of [['imports', /imports?|dependencies/i], ['declarations', /declarations?|classes|interfaces/i]]) {
      const block = subsection(patterns, pattern);
      const regexes = regexLines(block);
      check(`patterns:${id}`, regexes.length > 0, `${id} regex patterns present`, true);
      for (const [index, { pattern: regex, dialect }] of regexes.entries()) {
        const declaredJs = ['js', 'javascript', 'ecmascript'].includes(dialect);
        let compatible = true;
        try {
          new RegExp(regex);
        } catch { compatible = false; }
        const key = `regex:${id}:${index + 1}`;
        if (declaredJs) {
          check(key, compatible, `${compatible ? 'Valid' : 'Invalid'} declared JavaScript regex: ${regex}`, true);
        } else if (['pcre', 'pcre2'].includes(dialect)) {
          const compiled = spawnSync('pcre2grep', ['-q', '-e', regex], {
            input: '', encoding: 'utf8', env: { ...process.env, LC_ALL: 'C' }, timeout: 5000,
          });
          const js = `JavaScript syntax ${compatible ? 'compatible' : 'incompatible'}`;
          if (!compiled.error && [0, 1].includes(compiled.status)) check(key, true, `${js}; valid PCRE2 syntax: ${regex}`);
          else if (!compiled.error && compiled.status === 2 && /Error in command-line regex/.test(compiled.stderr)) check(key, false, `${js}; invalid PCRE2 syntax: ${regex}`, true);
          else check(key, false, `${js}; ${dialect} dialect validity unknown (PCRE2 compiler unavailable or failed): ${regex}`);
        } else {
          check(key, false, `JavaScript syntax ${compatible ? 'compatible' : 'incompatible'}; ${dialect || 'undeclared'} dialect validity unknown: ${regex}`);
        }
      }
    }
    check('output-example', /```/.test(output), 'Structured output example present', true);
    for (const category of ['Classes', 'Interfaces', 'Functions', 'Dependencies']) check(`output:${category}`, new RegExp(category, 'i').test(output), `Output includes ${category}`);
    check('output:lines', /\blines?\s*\d|:\d+(?:[-:]\d+)?\b/i.test(output), 'Output includes line numbers');
    return { kind, planPath, checks, extensions };
  }
  const names = ['Overview', 'Selection Criteria', 'Sources to Analyze', 'Extraction Strategy', 'Full Workflow', 'Output Format'];
  for (const name of names) check(`section:${name}`, !!section(name === 'Full Workflow' ? /(?:Full|Complete) Workflow/i : new RegExp(name, 'i')), `${name} section present and nonempty`, true);
  const agents = section(/AI-KIDO Agents to (?:Mobilize|Use)/i);
  check('section:agents', !!agents, 'AI-KIDO agents section present', true);
  const criteria = section(/Selection Criteria/i), sources = section(/Sources to Analyze/i), strategy = section(/Extraction Strategy/i), workflow = section(/(?:Full|Complete) Workflow/i), output = section(/Output Format/i);
  for (const term of ['Nature', 'Depth', 'Context']) check(`criteria:${term}`, new RegExp(`\\b${term}\\b`, 'i').test(criteria), `Selection criteria include ${term}`, true);
  check('criteria:comparisons', /\bvs\.?\b/i.test(criteria), 'Comparison with other plans');
  for (const term of ['Source Code', 'Documentation', 'Configuration']) check(`sources:${term}`, new RegExp(term, 'i').test(sources), `Sources include ${term}`, true);
  const extensions = [...new Set(sources.match(/\*\.[\w-]+/g) ?? [])];
  check('sources:extensions', extensions.length > 0 || /extensions/i.test(sources), 'Source extensions specified');
  check('sources:exclusions', /exclusions?/i.test(sources), 'Source exclusions specified');
  for (const agent of ['explore-code', 'validator']) check(`agent:${agent}`, agents.includes(`agent-aikido-${agent}`), `Mandatory agent ${agent}`, true);
  const agentCount = (agents.match(/\*\*Agent\*\*\s*:/gi) ?? []).length;
  const promptCount = (agents.match(/\*\*Specialized prompt\*\*\s*:/gi) ?? []).length;
  check('agent:prompts', agentCount > 0 && promptCount >= agentCount, `Specialized prompts: ${promptCount}/${agentCount}`, true);
  check('strategy:detection', /detection/i.test(strategy), 'Automatic detection documented');
  for (const term of ['Architecture', 'Tech(?:nical)? Stack', 'Domain', 'Configuration']) check(`strategy:${term}`, new RegExp(term, 'i').test(strategy), `Extraction covers ${term}`);
  check('strategy:time', /estimated.*time|duration/i.test(strategy), 'Estimated execution time in strategy');
  check('workflow:mermaid', /```mermaid\b[\s\S]*?```/i.test(workflow), 'Mermaid workflow present', true);
  check('workflow:agent-style', /style[^\n]*fill:#f9f/i.test(workflow), 'Agent styling present');
  check('workflow:end-style', /fill:#9f9/i.test(workflow), 'Green end node present');
  check('workflow:time', /\d+\s*(?:-\s*\d+\s*)?min/i.test(workflow), 'Workflow duration present');
  check('output:markdown', /```markdown\b[\s\S]*?```/i.test(output), 'Markdown output template present', true);
  for (const term of ['Configuration', 'Results', 'Technical', 'Gaps', 'Enrichments', 'Compliance']) check(`output:${term}`, new RegExp(term, 'i').test(output), `Output includes ${term}`);
  check('output:metadata', /date/i.test(output) && /duration/i.test(output) && /sources/i.test(output), 'Output includes date, duration and sources');
  check('output:reference', /plan/i.test(output), 'Output refers to its plan');
  const file = basename(planPath).toLowerCase();
  const namesByDepth = { 'plan-survol.md': 1, 'plan-overview.md': 1, 'plan-standard.md': 2, 'plan-approfondi.md': 3, 'plan-deep.md': 3, 'plan-expert.md': 4 };
  check('filename', Object.hasOwn(namesByDepth, file), 'Recognized analysis depth filename');
  check('filename:depth', !Object.hasOwn(namesByDepth, file) || Number.parseInt(depth, 10) === namesByDepth[file], 'Filename and header depth agree');
  const nature = headerValue(text, 'Nature');
  check('nature:path', /^generic$/i.test(nature) || planPath.toLowerCase().includes(nature.toLowerCase()), 'Nature consistent with path (generic fallback accepted)');
  check('nature:number', /\b(?:[1-9]|1[0-8])\b/.test(nature), 'Numeric nature extractable (generic fallback may omit it)');
  check('agent:explore-prompt', /```[\s\S]+?```/.test(subsection(agents, /Phase 3\.1.*Code Scan/i)), 'Code-scan prompt extractable');
  return { kind, planPath, checks, extensions };
}

export function functional(project, extensions) {
  const root = assertPublicProjectRoot(project);
  if (!lstatSync(root).isDirectory()) throw new Error('Test project must be a directory');
  const counts = Object.fromEntries(extensions.map(ext => [ext, 0]));
  const exclusions = new Set([
    '.git', 'node_modules', 'vendor', 'dist', 'build', 'target', '.venv',
    '__pycache__', '.private', '.task-store',
  ]);
  let files = 0;
  const gitIgnore = createGitIgnoreContext(root);
  try {
    const pending = [''];
    while (pending.length) {
      const directory = pending.pop();
      const candidates = readdirSync(join(root, directory), { withFileTypes: true })
        .filter(entry => !entry.isSymbolicLink() && !exclusions.has(entry.name) && (entry.isFile() || entry.isDirectory()))
        .map(entry => ({ entry, path: directory ? `${directory}/${entry.name}` : entry.name }))
        .filter(({ path }) => !isPrivateTaskStorePathWithin(root, path));
      const ignored = gitIgnore.ignored(candidates.map(({ path }) => path));
      for (const { entry, path } of candidates) {
        if (ignored.has(path)) continue;
        if (entry.isDirectory()) pending.push(path);
        else {
          files++;
          const ext = `*${extname(path)}`;
          if (Object.hasOwn(counts, ext)) counts[ext]++;
        }
      }
    }
  } finally { gitIgnore.close(); }
  return { root, files, counts, exclusions: [...exclusions] };
}

export function formatReport(result, functionalResult) {
  const { checks, planPath, kind } = result;
  const passed = checks.filter(c => c.status === 'pass');
  const warnings = checks.filter(c => c.status === 'warning');
  const errors = checks.filter(c => c.status === 'error');
  const score = Math.round(passed.length * 100 / checks.length);
  const status = errors.length ? 'NON-COMPLIANT' : warnings.length ? 'IMPROVEMENTS RECOMMENDED' : 'COMPLIANT';
  const group = (title, items) => `## ${title} (${items.length})\n\n${items.length ? items.map(c => `- ${c.message} [${c.id}]`).join('\n') : '- None'}\n`;
  let report = `# Validation Report - ${basename(planPath)}\n\n**Plan**: \`${planPath.replaceAll('`', '\\`')}\`\n**Validator**: ${kind}\n\n`;
  report += group('Passed validations', passed) + '\n' + group('Warnings', warnings) + '\n' + group('Critical errors', errors);
  report += '\n' + group('Recommendations', [...errors, ...warnings].map(c => ({ ...c, message: `Review or correct: ${c.message}` })));
  report += `\n## Global score\n\n**Score**: ${score}/100 (${passed.length}/${checks.length} checks passed; warnings count against score)\n\n## Final status\n\n**${status}**\n`;
  if (functionalResult) report += `\n## Optional scoped functional test\n\nProject: \`${functionalResult.root.replaceAll('`', '\\`')}\`; files: ${functionalResult.files}; Git evaluates project .gitignore rules (including nested rules); fixed exclusions: ${functionalResult.exclusions.join(', ')}; symlinks skipped.\n\n${Object.entries(functionalResult.counts).map(([ext, count]) => `- ${ext}: ${count}`).join('\n') || '- No literal extensions extracted.'}\n`;
  return report;
}

function saveReport(root, report) {
  const base = realpathSync(root);
  const prompts = join(base, 'prompts');
  if (lstatSync(prompts).isSymbolicLink()) throw new Error('Unsafe prompts directory');
  const spec = join(prompts, 'spec');
  try { mkdirSync(spec); } catch (error) { if (error.code !== 'EEXIST') throw error; }
  if (lstatSync(spec).isSymbolicLink() || !inside(base, realpathSync(spec))) throw new Error('Unsafe report directory');
  const stamp = new Date().toISOString().replace(/[:.]/g, '-');
  const file = join(spec, `validate-analyse-plan-report-${stamp}.md`);
  const fd = openSync(file, 'wx', 0o600);
  try { writeFileSync(fd, report); } finally { closeSync(fd); }
  return file;
}

function main(args) {
  const [kind, operation, ...rest] = args;
  if (!PLAN_DIR[kind] || !['list', 'validate'].includes(operation)) throw new Error('Usage: node validate.mjs <search|analyse> <list|validate> [plan] [--project PATH] [--report]');
  const root = assertPublicProjectRoot(process.cwd());
  if (operation === 'list') {
    if (rest.length) throw new Error('list takes no arguments');
    console.log(listPlans(root, kind).join('\n'));
    return;
  }
  const selected = rest.shift();
  if (!selected || selected.startsWith('--')) throw new Error('A plan path is required');
  let project, report = false;
  while (rest.length) {
    const option = rest.shift();
    if (option === '--project' && rest.length && !project) project = rest.shift();
    else if (option === '--report' && !report && kind === 'analyse') report = true;
    else throw new Error(`Unknown or incomplete option: ${option}`);
  }
  const base = resolve(root, PLAN_DIR[kind]);
  const file = isAbsolute(selected) ? selected : selected.startsWith('prompts/') ? resolve(root, selected) : resolve(base, selected);
  const physicalFile = realpathSync(file);
  if (!inside(root, physicalFile) || isPrivateTaskStorePathWithin(root, physicalFile)) {
    throw new Error('Plan validation cannot read files outside the public workspace or inside a private Task Store');
  }
  const result = validate(kind, readFileSync(physicalFile, 'utf8'), physicalFile);
  const formatted = formatReport(result, project ? functional(project, result.extensions) : undefined);
  console.log(formatted);
  if (report) console.log(`Report saved: ${saveReport(root, formatted)}`);
  if (result.checks.some(c => c.status === 'error')) process.exitCode = 1;
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  try { main(process.argv.slice(2)); }
  catch (error) { console.error(`Error: ${error.message}`); process.exitCode = 2; }
}
