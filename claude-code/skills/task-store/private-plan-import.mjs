import { createHash } from 'node:crypto';
import { lstatSync, readFileSync, realpathSync } from 'node:fs';
import { basename, join, relative, resolve, sep } from 'node:path';
import { PRIVATE_PLAN_IMPORT_REF_KIND } from './index.mjs';

const SOURCE_ROOTS = Object.freeze([
  ['prompts/hard_points/system/analyse/plans/', 'analysis'],
  ['prompts/hard_points/system/search/plans/', 'code-search'],
]);
const MAX_SOURCE_BYTES = 1_000_000;
const INPUT_REF_KIND = PRIVATE_PLAN_IMPORT_REF_KIND;
const PREPARED = new WeakMap();

export class PrivatePlanImportError extends Error {
  constructor(code, message) {
    super(message);
    this.name = 'PrivatePlanImportError';
    this.code = code;
  }
}

export function isPrivatePlanImport(plan) {
  return Boolean(plan?.tasks?.some(task => Array.isArray(task?.inputRefs) &&
    task.inputRefs.some(item => item?.kind === INPUT_REF_KIND && /^[a-f0-9]{64}$/.test(item.id))));
}

function fail(code, message) {
  throw new PrivatePlanImportError(code, message);
}

function privatePath(path) {
  const segments = path.replaceAll('\\', '/').split('/').filter(Boolean)
    .map(segment => segment.toLowerCase());
  return segments.some(segment => segment === '.private' || segment === '.task-store')
    || segments.some((segment, index) => (
      (segment === 'aikido' || segment === '.aikido') && segments[index + 1] === 'tasks'
    ));
}

function classifySource(sourcePath) {
  if (typeof sourcePath !== 'string' || sourcePath.includes('\\') || sourcePath.startsWith('/')) {
    fail('unsupported_source', 'Select a workspace-relative AI-KIDO analysis or code-search plan.');
  }
  const parts = sourcePath.split('/');
  if (parts.some(part => !part || part === '.' || part === '..')) {
    fail('unsafe_source', 'Plan sources must use normalized workspace-relative paths.');
  }
  if (privatePath(sourcePath)) fail('private_source', 'Private Task Store paths cannot be imported.');
  const selected = SOURCE_ROOTS.find(([prefix]) => sourcePath.startsWith(prefix));
  if (!selected) fail('unsupported_source', 'Only historical analysis and code-search plans are supported.');
  const planFile = /^plan(?:-[a-z0-9-]+)?\.md$/i.test(basename(sourcePath));
  if (!planFile) {
    fail('unsupported_source', 'Only historical Markdown plan files are supported; no section guessing is performed.');
  }
  return { kind: selected[1], format: 'markdown-plan' };
}

function readSource(workspacePath, sourcePath) {
  let current = realpathSync(workspacePath);
  for (const component of sourcePath.split('/')) {
    current = join(current, component);
    let stat;
    try { stat = lstatSync(current); } catch (error) {
      fail('source_unavailable', `Cannot read selected plan source: ${error.message}`);
    }
    if (stat.isSymbolicLink()) fail('unsafe_source', 'Symbolic links are not allowed in plan source paths.');
  }
  const root = realpathSync(workspacePath);
  const pathFromRoot = relative(root, current);
  if (!pathFromRoot || pathFromRoot === '..' || pathFromRoot.startsWith(`..${sep}`) ||
      resolve(root, pathFromRoot) !== current) {
    fail('unsafe_source', 'Plan source escapes the selected workspace.');
  }
  if (!lstatSync(current).isFile()) fail('unsupported_source', 'Plan source is not a regular file.');
  const bytes = readFileSync(current);
  if (bytes.length > MAX_SOURCE_BYTES) fail('source_too_large', `Plan source exceeds ${MAX_SOURCE_BYTES} bytes.`);
  const content = bytes.toString('utf8');
  if (!Buffer.from(content, 'utf8').equals(bytes)) fail('unsupported_encoding', 'Plan source must be valid UTF-8.');
  return { bytes, content };
}

function titleFromSource(content, sourcePath, format) {
  if (format === 'yaml-config') return `Analysis config: ${basename(sourcePath)}`;
  const firstLine = content.split(/\r?\n/, 1)[0];
  const title = /^#\s+(.+?)\s*#*\s*$/.exec(firstLine)?.[1];
  if (!title) fail('unsupported_structure', 'Markdown plan must begin with a level-one title.');
  return title.replace(/[\u0000-\u001f\u007f]/g, ' ').slice(0, 200);
}

export function preparePrivatePlan({
  store, workspacePath, sourcePath, workflowId, workflowVersion,
  expectedSourceHash, expectedWorkflowHash,
} = {}) {
  if (!store || typeof store.getWorkflow !== 'function' || typeof store.createPlan !== 'function' ||
      typeof store.getPlan !== 'function' || typeof store.instantiatePlan !== 'function') {
    fail('task_store_unavailable', 'An instance of the existing private Task Store API is required.');
  }
  if (typeof workspacePath !== 'string' || !workspacePath) {
    fail('workspace_required', 'An existing workspace path is required.');
  }
  const workspace = realpathSync(workspacePath);
  if (store.workspacePath && realpathSync(store.workspacePath) !== workspace) {
    fail('workspace_mismatch', 'The Task Store instance belongs to a different workspace.');
  }
  const source = classifySource(sourcePath);
  const { bytes, content } = readSource(workspace, sourcePath);
  const sourceHash = createHash('sha256').update(bytes).digest('hex');
  if (expectedSourceHash !== undefined && expectedSourceHash !== sourceHash) {
    fail('source_changed', 'Plan source hash differs from the reviewed preview; preview again and approve the new hash.');
  }
  const selectedWorkflowId = workflowId ?? 'analysis';
  if (typeof selectedWorkflowId !== 'string' || !selectedWorkflowId.trim()) fail('workflow_required', 'Select a workflow id.');
  if (workflowVersion !== undefined && (typeof workflowVersion !== 'string' || !workflowVersion.trim())) {
    fail('workflow_invalid', 'workflowVersion must be a non-empty string when supplied.');
  }
  const workflow = store.getWorkflow(selectedWorkflowId, workflowVersion);
  if (!workflow) fail('workflow_unavailable', `Workflow ${selectedWorkflowId}${workflowVersion ? `@${workflowVersion}` : ''} is unavailable.`);
  if (expectedWorkflowHash !== undefined && expectedWorkflowHash !== workflow.sha256) {
    fail('workflow_changed', 'Workflow hash differs from the reviewed preview; preview again and approve the new pin.');
  }
  const title = titleFromSource(content, sourcePath, source.format);
  const prompt = [
    `Apply the preserved AI-KIDO ${source.kind} source without rewriting or dropping sections.`,
    `Source: ${sourcePath}`,
    `SHA-256: ${sourceHash}`,
    `Format: ${source.format}`,
    '',
    '--- exact source begins ---',
    content,
    '--- exact source ends ---',
  ].join('\n');
  if (Buffer.byteLength(prompt, 'utf8') > MAX_SOURCE_BYTES) {
    fail('source_too_large', `Imported plan prompt exceeds ${MAX_SOURCE_BYTES} bytes.`);
  }
  const preview = Object.freeze({
    source: Object.freeze({ path: sourcePath, sha256: sourceHash, kind: source.kind, format: source.format }),
    workflow: Object.freeze({ id: workflow.id, version: workflow.version, sha256: workflow.sha256 }),
    title: `AI-KIDO ${source.kind}: ${title}`,
    taskCount: 1,
    type: 'analysis',
  });
  PREPARED.set(preview, {
    store,
    workspace,
    content,
    sourceHash,
    plan: {
      type: 'analysis',
      title: preview.title,
      workflowId: workflow.id,
      workflowVersion: workflow.version,
      tasks: [{
        key: `source-${sourceHash.slice(0, 24)}`,
        title: `Apply preserved plan: ${title}`,
        summary: `Source: ${sourcePath}\nSHA-256: ${sourceHash}`,
        prompt,
        inputRefs: [{ kind: INPUT_REF_KIND, id: sourceHash }],
        state: 'backlog',
        required: true,
        acceptanceCriteria: ['Complete the preserved source plan without modifying its Git file.'],
      }],
    },
  });
  return preview;
}

export function createPrivatePlan({ store, prepared, authorized = false } = {}) {
  if (authorized !== true) fail('authorization_required', 'Creating the private plan requires explicit user authorization.');
  const state = prepared && PREPARED.get(prepared);
  if (!state || state.store !== store) fail('invalid_preview', 'Prepare a supported plan before creating it.');
  const current = readSource(state.workspace, prepared.source.path);
  const currentHash = createHash('sha256').update(current.bytes).digest('hex');
  if (currentHash !== state.sourceHash || current.content !== state.content) {
    fail('source_changed', 'Plan source changed after preview; prepare it again and request authorization for the new hash.');
  }
  const workflow = store.getWorkflow(prepared.workflow.id, prepared.workflow.version);
  if (!workflow || workflow.sha256 !== prepared.workflow.sha256) {
    fail('workflow_unavailable', 'The pinned workflow snapshot is unavailable or changed.');
  }
  const plan = store.createPlan(state.plan, { workflowId: workflow.id, workflowVersion: workflow.version });
  if (plan.workflow?.id !== workflow.id || plan.workflow?.version !== workflow.version ||
      plan.workflow?.sha256 !== workflow.sha256) {
    fail('workflow_pin_mismatch', 'Task Store did not persist the selected workflow snapshot.');
  }
  return Object.freeze({
    planId: plan.id,
    title: plan.title,
    state: plan.state,
    revision: plan.revision,
    source: prepared.source,
    workflow: plan.workflow,
  });
}

export function instantiatePrivatePlan({
  store, planId, expectedRevision, authorized = false,
} = {}) {
  if (authorized !== true) {
    fail('authorization_required', 'Instantiating the private plan requires separate explicit user authorization.');
  }
  const plan = store?.getPlan?.(planId);
  if (!plan) fail('plan_unavailable', 'The private Task Store plan was not found.');
  if (!Number.isInteger(expectedRevision) || expectedRevision !== plan.revision) {
    fail('plan_changed', 'The plan revision differs from the reviewed revision; inspect it again before instantiating.');
  }
  if (!isPrivatePlanImport(plan)) {
    fail('unsupported_plan', 'Only plans created by this import workflow can be instantiated here.');
  }
  const reference = plan.tasks.flatMap(task => task.inputRefs ?? [])
    .find(item => item.kind === INPUT_REF_KIND);
  const result = store.instantiatePlan(planId, {
    workflowId: plan.workflow.id,
    workflowVersion: plan.workflow.version,
    authorized: true,
    expectedRevision,
  });
  return Object.freeze({
    planId: result.plan.id,
    state: result.plan.state,
    sourceHash: reference.id,
    workflow: result.plan.workflow,
    tasks: result.tasks.map(({ id, title, state, planId: parentPlanId, workflowId, workflowVersion }) => ({
      id, title, state, planId: parentPlanId, workflowId, workflowVersion,
    })),
  });
}
