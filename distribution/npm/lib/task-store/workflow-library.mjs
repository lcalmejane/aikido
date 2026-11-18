// Workflow templates kept in the knowledge base: one immutable JSON file per version, usable without any Tatami module.
import { existsSync, lstatSync, mkdirSync, readdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { validateWorkflow } from './index.mjs';

export const HARD_POINT_WORKFLOWS = 'prompts/hard_points/workflows';
export const PROJECT_WORKFLOWS = 'prompts/gen/workflows';
const FALLBACK_WORKFLOWS = '.tatami/workflows';
const DIRECTORIES = [HARD_POINT_WORKFLOWS, PROJECT_WORKFLOWS, FALLBACK_WORKFLOWS];
export const BUILTIN_WORKFLOW_IDS = ['automatic', 'analysis', 'implementation'];
const STEP_TYPES = ['plan', 'dispatch', 'wait', 'verify', 'approve'];
const SAFE_ID = /^[a-z0-9][a-z0-9-]{0,63}$/;

function fail(code, message) { throw Object.assign(new Error(message), { code }); }
const slug = value => String(value).normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 48);
const parts = version => version.split('.').map(Number);
const byVersion = (a, b) => { const [x, y] = [parts(a), parts(b)]; return x[0] - y[0] || x[1] - y[1] || x[2] - y[2]; };
const plainDirectory = path => { try { return lstatSync(path).isDirectory(); } catch { return false; } };

function versions(workspace, directory, id) {
  const path = join(workspace, directory, id);
  if (!plainDirectory(path)) return [];
  return readdirSync(path).filter(name => /^\d+\.\d+\.\d+\.json$/.test(name)).map(name => name.slice(0, -5)).sort(byVersion);
}
function locate(workspace, id) {
  for (const directory of DIRECTORIES) { const found = versions(workspace, directory, id); if (found.length) return { directory, versions: found }; }
  return undefined;
}
const fileOf = (workspace, directory, id, version) => join(workspace, directory, id, `${version}.json`);
const read = (workspace, directory, id, version) => JSON.parse(readFileSync(fileOf(workspace, directory, id, version), 'utf8'));
const writeDirectory = workspace => plainDirectory(join(workspace, 'prompts')) ? PROJECT_WORKFLOWS : FALLBACK_WORKFLOWS;

function summary(definition, directory) {
  return { id: definition.id, version: definition.version, label: definition.label ?? definition.id, description: definition.description ?? '',
    source: directory === HARD_POINT_WORKFLOWS ? 'hard-point' : 'project',
    steps: definition.steps.map(step => ({ id: step.id, type: step.type, label: step.label ?? step.id })) };
}

/** Latest valid version of every template; hard points win over project files. */
export function listLibrary(workspace) {
  const workflows = [], errors = [], seen = new Set();
  for (const directory of DIRECTORIES) {
    const base = join(workspace, directory);
    if (!plainDirectory(base)) continue;
    for (const id of readdirSync(base).filter(name => SAFE_ID.test(name))) {
      const version = versions(workspace, directory, id).at(-1);
      if (!version || seen.has(id)) continue;
      seen.add(id);
      try {
        const definition = read(workspace, directory, id, version);
        const validation = validateWorkflow(definition);
        if (!validation.valid || definition.id !== id || definition.version !== version) throw new Error(validation.errors.join('; ') || 'id or version differs from its path');
        workflows.push({ ...summary(definition, directory), file: fileOf(workspace, directory, id, version) });
      } catch (error) { errors.push({ id, error: error.message }); }
    }
  }
  return { workflows, errors };
}

/** Same rule as the Core Agent: ordered steps, exactly one dispatch, a final step added automatically. */
export function saveToLibrary(workspace, draft) {
  const label = typeof draft?.label === 'string' ? draft.label.trim() : '';
  if (!label || label.length > 80) fail('workflow_invalid', 'Workflow label is required (80 characters at most)');
  if (!Array.isArray(draft.steps) || draft.steps.length < 1 || draft.steps.length > 20) fail('workflow_invalid', 'A workflow needs 1 to 20 steps');
  const id = draft.id ?? slug(label);
  if (!SAFE_ID.test(id)) fail('workflow_invalid', 'Workflow id must use lowercase letters, digits and dashes');
  if (BUILTIN_WORKFLOW_IDS.includes(id)) fail('workflow_reserved', 'This id belongs to a built-in workflow');
  const found = locate(workspace, id);
  if (found?.directory === HARD_POINT_WORKFLOWS) fail('workflow_reserved', 'This workflow is an AI-KIDO hard point');
  const used = new Set();
  const unique = (value, index) => { const base = slug(value) || `step-${index + 1}`; let name = base;
    for (let suffix = 2; used.has(name); suffix += 1) name = `${base}-${suffix}`; used.add(name); return name; };
  const steps = draft.steps.map((step, index) => {
    if (!STEP_TYPES.includes(step?.type) || typeof step.label !== 'string' || !step.label.trim()) fail('workflow_invalid', `Step ${index + 1} needs a label and a valid type`);
    return { id: unique(step.label, index), label: step.label.trim(), type: step.type };
  });
  if (steps.filter(step => step.type === 'dispatch').length !== 1) fail('workflow_invalid', 'A workflow needs exactly one dispatch step');
  const chain = [...steps, { id: unique('termine', steps.length), label: 'Terminé', type: 'wait' }];
  const description = typeof draft.description === 'string' ? draft.description.trim() : '';
  const body = { schemaVersion: 'workflow/1', id, label, ...(description ? { description } : {}), entryStepId: chain[0].id, terminalStepIds: [chain.at(-1).id],
    steps: chain.map((step, index) => ({ ...step, transitions: chain[index + 1] ? [chain[index + 1].id] : [] })) };
  const directory = found?.directory ?? writeDirectory(workspace);
  const latest = found?.versions.at(-1);
  if (latest) {
    const { version, ...current } = read(workspace, directory, id, latest);
    if (JSON.stringify(current) === JSON.stringify(body)) return summary({ ...body, version }, directory);
  }
  const [major, minor, patch] = latest ? parts(latest) : [1, 0, -1];
  return publish(workspace, { ...body, version: `${major}.${minor}.${patch + 1}` }, directory);
}

/** Writes an already complete definition; a published version is never rewritten. */
export function publish(workspace, definition, directory = writeDirectory(workspace)) {
  const validation = validateWorkflow(definition);
  if (!validation.valid) fail('workflow_invalid', validation.errors.join('; '));
  const file = fileOf(workspace, directory, definition.id, definition.version);
  for (let path = dirname(file); path.length > workspace.length; path = dirname(path)) {
    if (existsSync(path) && !plainDirectory(path)) fail('workflow_path', 'Workflow directory must not be a link');
  }
  mkdirSync(dirname(file), { recursive: true });
  writeFileSync(file, `${JSON.stringify(definition, null, 2)}\n`, { flag: 'wx' });
  return summary(definition, directory);
}

export function hasLibraryVersion(workspace, id, version) { return !!locate(workspace, id)?.versions.includes(version); }

export function deleteFromLibrary(workspace, id) {
  if (!SAFE_ID.test(String(id)) || BUILTIN_WORKFLOW_IDS.includes(id)) fail('workflow_reserved', 'This workflow cannot be deleted');
  const found = locate(workspace, id);
  if (!found) fail('not_found', 'Workflow not found');
  if (found.directory === HARD_POINT_WORKFLOWS) fail('workflow_reserved', 'This workflow is an AI-KIDO hard point');
  rmSync(join(workspace, found.directory, id), { recursive: true });
}

/** Converts a linear workflow/1 definition to the draft accepted by the Core Agent; undefined when it cannot be expressed. */
export function draftFromDefinition(definition) {
  const byId = new Map(definition.steps.map(step => [step.id, step]));
  const ordered = [];
  for (let step = byId.get(definition.entryStepId); step; step = byId.get(typeof step.transitions[0] === 'string' ? step.transitions[0] : step.transitions[0]?.to)) {
    if (step.transitions.length > 1 || ordered.includes(step)) return undefined;
    ordered.push(step);
  }
  if (definition.hooks?.length || ordered.length !== definition.steps.length || ordered.filter(step => step.type === 'dispatch').length !== 1) return undefined;
  return { id: definition.id, label: definition.label ?? definition.id, ...(definition.description ? { description: definition.description } : {}),
    steps: ordered.slice(0, -1).map(step => ({ label: step.label ?? step.id, type: step.type })) };
}
