#!/usr/bin/env node
// Builds the per-host packages that ship inside the npm package (packages/<host>/). The build reads
// the tracked sources through Git, so it runs at publish time, not on the user's machine.
import { copyFileSync, cpSync, mkdirSync, readFileSync, rmSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDistribution } from '../../scripts/build.mjs';
import { assertReleaseSource } from '../../scripts/prepare-release.mjs';

const NPM_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const REPO = resolve(NPM_ROOT, '..', '..');
const { version } = JSON.parse(readFileSync(join(NPM_ROOT, 'package.json'), 'utf8'));
const output = join(NPM_ROOT, 'packages');
const taskStoreTarget = join(NPM_ROOT, 'lib', 'task-store');
const docsTarget = join(NPM_ROOT, 'docs');

let sourceRevision = 'uncommitted';
if (process.env.AIKIDO_NPM_ALLOW_DIRTY !== '1') {
  sourceRevision = execFileSync('git', ['rev-parse', 'HEAD'], { cwd: REPO, encoding: 'utf8' }).trim();
  assertReleaseSource(sourceRevision); // refuses to publish bytes that differ from the commit
}
rmSync(output, { recursive: true, force: true });
rmSync(docsTarget, { recursive: true, force: true });
const report = buildDistribution({ outDir: output, sourceRevision, version });
rmSync(join(output, 'build-report.json'), { force: true });
rmSync(taskStoreTarget, { recursive: true, force: true });
mkdirSync(join(NPM_ROOT, 'lib'), { recursive: true });
cpSync(join(REPO, 'distribution', 'lib', 'task-store'), taskStoreTarget, { recursive: true });
copyFileSync(
  join(REPO, 'prompts', 'hard_points', 'system', 'task-store', 'private-plan-import.mjs'),
  join(taskStoreTarget, 'private-plan-import.mjs'),
);
cpSync(join(REPO, 'distribution', 'docs'), docsTarget, { recursive: true });
copyFileSync(join(REPO, 'LICENSE'), join(NPM_ROOT, 'LICENSE'));
process.stdout.write(`${JSON.stringify({ status: 'ok', version, sourceRevision, hosts: report.hosts.filter((h) => h.generated).map((h) => h.host) })}\n`);
