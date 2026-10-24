import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { HOSTS, MODES, isSafeRelativePath } from './lock.mjs';

export const TEMPLATES_DIR = join(dirname(fileURLToPath(import.meta.url)), '..', 'templates');

const KINDS = new Set(['file', 'generated', 'managed-block']);
const POLICIES = new Set(['create-only', 'three-way', 'managed-block']);
const STYLES = new Set(['html', 'hash']);
const PLACEHOLDER = /\{\{([A-Z_]+)\}\}/g;

export function loadManifest(dir = TEMPLATES_DIR) {
  return JSON.parse(readFileSync(join(dir, 'manifest.json'), 'utf8'));
}

export function validateManifest(manifest) {
  const errors = [];
  if (manifest.schemaVersion !== 1) errors.push('schemaVersion must be 1');
  const ids = new Set();
  for (const t of manifest.templates ?? []) {
    const at = `template ${t.id ?? '?'}`;
    if (!t.id || ids.has(t.id)) errors.push(`${at}: missing or duplicate id`);
    ids.add(t.id);
    if (!isSafeRelativePath(t.source)) errors.push(`${at}: unsafe source path`);
    if (!isSafeRelativePath(t.target)) errors.push(`${at}: unsafe target path`);
    if (!KINDS.has(t.kind)) errors.push(`${at}: unknown kind ${t.kind}`);
    if (!POLICIES.has(t.policy)) errors.push(`${at}: unknown policy ${t.policy}`);
    if ((t.kind === 'managed-block') !== (t.policy === 'managed-block')) {
      errors.push(`${at}: managed-block kind and policy go together`);
    }
    if (t.kind === 'managed-block' && (!t.blockId || !STYLES.has(t.style))) {
      errors.push(`${at}: managed block needs blockId and style`);
    }
    for (const m of t.modes ?? []) if (!MODES.includes(m)) errors.push(`${at}: unknown mode ${m}`);
    for (const h of t.hosts ?? []) if (!HOSTS.includes(h)) errors.push(`${at}: unknown host ${h}`);
  }
  for (const mode of MODES) {
    for (const host of [null, ...HOSTS]) {
      const seen = new Map();
      for (const t of selectTemplates(manifest, { mode, hosts: host ? [host] : [] })) {
        const key = t.kind === 'managed-block' ? `${t.target}#${t.blockId}` : t.target;
        if (seen.has(key)) errors.push(`target ${key} produced twice (${seen.get(key)}, ${t.id}) for ${mode}`);
        seen.set(key, t.id);
      }
    }
  }
  return errors;
}

export function selectTemplates(manifest, { mode, hosts = [] }) {
  if (!MODES.includes(mode)) throw new Error(`Unknown mode: ${mode}`);
  return manifest.templates.filter(
    (t) => (!t.modes || t.modes.includes(mode)) && (!t.hosts || t.hosts.some((h) => hosts.includes(h))),
  );
}

export function placeholdersIn(text) {
  return [...new Set([...text.matchAll(PLACEHOLDER)].map((m) => m[1]))];
}

export function render(text, values) {
  const missing = placeholdersIn(text).filter((name) => typeof values[name] !== 'string');
  if (missing.length) throw new Error(`Missing template values: ${missing.join(', ')}`);
  return text.replace(PLACEHOLDER, (_, name) => values[name]);
}

export function readTemplate(template, dir = TEMPLATES_DIR) {
  return readFileSync(join(dir, template.source), 'utf8');
}
