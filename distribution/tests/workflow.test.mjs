import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  applyWorkflowPatch, builtinWorkflow, diagramPatch, diffWorkflows, hostHooks, linearStates, parseMermaid,
  readWorkflowMarkdown, renderMermaid, renderWorkflow, syncWorkflowMarkdown, validateWorkflow, workflowGraph,
} from '../lib/task-store/index.mjs';
import { draftFromDefinition } from '../lib/task-store/workflow-library.mjs';

// The "Code generation" workflow of the workflow-2 specification, § 3.
const generation = () => ({
  schemaVersion: 'workflow/2', id: 'generation-code', version: '1.3.0', publication: 'draft',
  label: { fr: 'Génération de code', en: 'Code generation' },
  description: 'Designs, generates and reviews code until the tests pass.',
  defaults: { mode: 'auto', review: 'automated', agent: 'core:orchestrator', capabilities: 'auto', retries: 1 },
  inputs: { type: 'object' },
  entry: 'conception',
  states: [
    { id: 'conception', type: 'task', label: { fr: 'Conception', en: 'Design' }, agent: 'prompts/gen/personas/solutions-architect.md', prompt: 'Design it', next: 'generation' },
    { id: 'generation', type: 'task', mode: 'auto', agent: 'prompts/gen/personas/fullstack-ts-developer.md', prompt: 'Implement',
      mcp: { mode: 'list', servers: ['kimono'] }, tools: ['workspace_*'], skills: ['aikido-review'],
      hooks: {
        pre: [{ id: 'tests-e2e', agent: 'prompts/gen/personas/qa-docs-ux.md', prompt: 'Write Playwright tests', script: null, onFailure: 'block' }],
        post: [{ id: 'run-tests', agent: null, prompt: null, script: 'scripts/run-playwright.mjs', output: 'tests', onFailure: 'continue' }] },
      output: { schema: { type: 'object' } }, next: 'choix_tests' },
    { id: 'choix_tests', type: 'choice',
      branches: [{ when: { path: 'hooks.run-tests.status', equals: 'passed' }, to: 'revue' }, { when: { attemptsBelow: 3 }, to: 'generation' }],
      otherwise: 'echec' },
    { id: 'revue', type: 'parallel', branches: [['revue-code'], ['revue-securite']], join: 'all', next: 'fin' },
    { id: 'revue-code', type: 'task', prompt: 'Review the code', next: 'fin' },
    { id: 'revue-securite', type: 'task', prompt: 'Review security', next: 'fin' },
    { id: 'fin', type: 'terminal', outcome: 'success' },
    { id: 'echec', type: 'terminal', outcome: 'failure' },
  ],
  limits: { maxAttempts: 3, maxParallel: 2, budgetTokens: null },
});

test('the specification workflow is valid and its .workflow.md round trip is lossless and deterministic', () => {
  const definition = generation();
  assert.deepEqual(validateWorkflow(definition), { valid: true, errors: [] });
  const text = renderWorkflow(definition);
  assert.equal(renderWorkflow(structuredClone(definition)), text);
  const read = readWorkflowMarkdown(text);
  assert.deepEqual(read.definition, definition);
  assert.equal(read.status, 'clean');
  assert.equal(renderWorkflow(read.definition), text);
  assert.match(text, /^---\nid: generation-code\nversion: 1\.3\.0\npublication: draft\n/);
  assert.match(text, /state choix_tests <<choice>>/);
  assert.match(text, /state revue <<fork>>/);
  assert.match(text, /### generation — task · auto · agent prompts\/gen\/personas\/fullstack-ts-developer\.md/);
  assert.deepEqual(diagramPatch(definition, read.diagram), []);
});

test('validation refuses unknown targets, unreachable states, unbounded loops and bad joins', () => {
  const errors = mutate => { const definition = generation(); mutate(definition); return validateWorkflow(definition).errors.join('\n'); };
  assert.match(errors(d => { d.states[0].next = 'nowhere'; }), /next targets unknown state nowhere/);
  assert.match(errors(d => { d.states.push({ id: 'island', type: 'terminal' }); }), /unreachable state: island/);
  assert.match(errors(d => { delete d.limits.maxAttempts; d.states[2] = { id: 'choix_tests', type: 'choice', branches: [{ when: { attemptsBelow: 3 }, to: 'generation' }], otherwise: 'generation' }; }),
    /unbounded loop/);
  assert.doesNotMatch(errors(d => { delete d.limits.maxAttempts; }), /unbounded loop/);
  assert.match(errors(d => { d.states[3].join = 5; }), /join must be all, any or 1\.\.2/);
  assert.match(errors(d => { d.states[1].hooks.post[0].onFailure = 'goto:missing'; }), /onFailure must be/);
  assert.match(errors(d => { d.states[1].mcp = { mode: 'list' }; }), /mcp list needs servers/);
  assert.match(errors(d => { d.states.push({ id: 'x', type: 'loop' }); d.states[0].next = 'x'; }), /unknown state type loop/);
  assert.match(errors(d => { d.schemaVersion = 'workflow/1'; }), /schemaVersion must be workflow\/2/);
  const resolve = { mcp: name => name !== 'kimono', agent: () => true, skill: () => true, script: () => true };
  assert.match(validateWorkflow(generation(), { resolve }).errors.join(), /mcp kimono is not available on this host/);
});

test('built-in workflows are Full Auto, keep a variant with approval, and stay linear', () => {
  for (const id of ['automatic', 'analysis', 'implementation']) {
    const auto = builtinWorkflow(id, '2.0.0');
    const approval = builtinWorkflow(`${id}-with-approval`, '2.0.0');
    assert.equal(validateWorkflow(auto).valid, true);
    assert.equal(validateWorkflow(approval).valid, true);
    assert.equal(auto.defaults.review, 'automated');
    assert.equal(approval.defaults.review, 'human');
    assert.equal(auto.states.some(state => state.type === 'approval'), false);
    assert.equal(approval.states.some(state => state.type === 'approval'), true);
    assert.equal(linearStates(auto).filter(state => state.stage === 'dispatch').length, 1);
    assert.deepEqual(workflowGraph(auto).terminals, ['complete']);
    assert.deepEqual(draftFromDefinition(auto).steps.map(step => step.type), ['plan', 'dispatch', 'verify']);
  }
});

test('host hooks keep phase, state and event filters, state hooks with a hash run on enter and exit', () => {
  const hash = 'a'.repeat(64);
  const definition = { ...builtinWorkflow('automatic'), id: 'hooked', version: '1.0.0',
    hooks: [{ id: 'events', version: '1', sha256: hash, phase: 'executionEvent', state: 'execute', eventTypes: ['result'] }] };
  definition.states[1] = { ...definition.states[1], hooks: { pre: [{ id: 'enter', script: 'hooks/enter.mjs', sha256: hash, version: '1' }], post: [{ id: 'agent-only', agent: 'qa', prompt: 'Check' }] } };
  assert.equal(validateWorkflow(definition).valid, true);
  assert.deepEqual(hostHooks(definition), [
    { id: 'events', version: '1', sha256: hash, phase: 'executionEvent', eventTypes: ['result'], stepId: 'execute' },
    { id: 'enter', version: '1', sha256: hash, phase: 'onEnter', stepId: 'execute' },
  ]);
});

test('the Mermaid subset is parsed with line numbers and gives a patch applied to the JSON', () => {
  assert.throws(() => parseMermaid('stateDiagram-v2\n    a --> b\n    note right of a : hi'), { code: 'workflow_diagram', message: /Line 3: unsupported construct/ });
  assert.throws(() => parseMermaid('flowchart TD\n a --> b'), { code: 'workflow_diagram', message: /Line 1/ });
  const definition = builtinWorkflow('automatic');
  const diagram = renderMermaid(definition)
    .replace('    verify --> complete\n', '    verify --> report\n    report --> complete\n')
    .replace('execute', 'run').replace(/execute/g, 'run');
  const patch = diagramPatch(definition, diagram);
  assert.deepEqual(patch.map(op => op.op).sort(), ['addState', 'addTransition', 'addTransition', 'removeTransition', 'renameState'].sort());
  const next = applyWorkflowPatch(definition, patch);
  assert.equal(validateWorkflow(next).valid, true, validateWorkflow(next).errors.join());
  assert.deepEqual(linearStates(next).map(state => state.id), ['plan', 'run', 'verify', 'report', 'complete']);
  const choice = generation();
  assert.throws(() => applyWorkflowPatch(choice, diagramPatch(choice, `${renderMermaid(choice)}    choix_tests --> fin : flaky\n`)), { code: 'workflow_patch' });
});

test('sync re-renders after a JSON edit, patches after a diagram edit and reports a conflict when both changed', () => {
  const text = renderWorkflow(builtinWorkflow('automatic'));
  const jsonEdited = text.replace('"stage": "verify"', '"stage": "verify",\n      "prompt": "Run the checks"');
  const rendered = syncWorkflowMarkdown(jsonEdited);
  assert.equal(rendered.status, 'rendered');
  assert.match(rendered.text, /Prompt: Run the checks/);
  assert.equal(readWorkflowMarkdown(rendered.text).status, 'clean');
  const diagramEdited = text.replace('    verify --> complete\n', '    verify --> report\n    report --> complete\n');
  const patched = syncWorkflowMarkdown(diagramEdited);
  assert.equal(patched.status, 'patched');
  assert.ok(patched.definition.states.some(state => state.id === 'report'));
  const both = jsonEdited.replace('    verify --> complete\n', '    verify --> report\n    report --> complete\n');
  const conflict = syncWorkflowMarkdown(both);
  assert.equal(conflict.status, 'conflict');
  assert.equal(conflict.text, undefined);
  assert.equal(syncWorkflowMarkdown(both, { prefer: 'json' }).status, 'rendered');
  assert.throws(() => readWorkflowMarkdown(text.replace('version: 2.0.0', 'version: 9.9.9')), { code: 'workflow_file' });
});

test('diff reports states by id and field changes', () => {
  const before = generation();
  const after = generation();
  after.states[0].prompt = 'Design it well';
  after.states = after.states.filter(state => state.id !== 'echec');
  after.states[1].next = 'fin';
  after.states.splice(1, 1, { ...after.states[1], next: 'fin' });
  after.version = '1.3.1';
  const changes = diffWorkflows(before, after);
  assert.deepEqual(changes.find(change => change.path === 'version'), { op: 'change', path: 'version', before: '1.3.0', after: '1.3.1' });
  assert.ok(changes.some(change => change.op === 'change' && change.path === 'states/conception/prompt'));
  assert.ok(changes.some(change => change.op === 'remove' && change.path === 'states/echec'));
  assert.ok(changes.some(change => change.path === 'states/generation/next'));
  assert.deepEqual(diffWorkflows(before, generation()), []);
});
