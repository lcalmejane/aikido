#!/usr/bin/env node
import { lstatSync, readFileSync, realpathSync, statSync } from 'node:fs';
import { dirname, isAbsolute, relative, resolve, sep } from 'node:path';
import { pathToFileURL } from 'node:url';

function stripJsonc(text) {
  let result = '';
  let string = false;
  let escaped = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (string) {
      result += c;
      if (escaped) escaped = false;
      else if (c === '\\') escaped = true;
      else if (c === '"') string = false;
    } else if (c === '"') {
      string = true;
      result += c;
    } else if (c === '/' && text[i + 1] === '/') {
      while (i < text.length && text[i] !== '\n' && text[i] !== '\r') i++;
      result += '\n';
    } else if (c === '/' && text[i + 1] === '*') {
      const end = text.indexOf('*/', i + 2);
      if (end < 0) throw new Error('Unterminated JSONC comment');
      result += ' ';
      i = end + 1;
    } else {
      result += c;
    }
  }
  let clean = '';
  string = false;
  escaped = false;
  for (let i = 0; i < result.length; i++) {
    const c = result[i];
    if (string) {
      clean += c;
      if (escaped) escaped = false;
      else if (c === '\\') escaped = true;
      else if (c === '"') string = false;
    } else if (c === '"') {
      string = true;
      clean += c;
    } else if (c === ',' && /^[\s]*[}\]]/.test(result.slice(i + 1))) {
      continue;
    } else clean += c;
  }
  return clean;
}

function config(path, jsonc = false, scope = dirname(resolve(path))) {
  const safePath = scopedPath(scope, path);
  const text = readFileSync(safePath, 'utf8').replace(/^\uFEFF/, '');
  let value;
  try {
    value = JSON.parse(jsonc ? stripJsonc(text) : text);
  } catch {
    throw new Error('Invalid JSON configuration');
  }
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw new Error('Expected a JSON object');
  return value;
}

function mappings(file, scope) {
  const value = config(file, false, scope).autoload?.['psr-4'] ?? {};
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw new Error('Invalid PSR-4 mapping');
  return Object.entries(value).flatMap(([prefix, paths]) => {
    if (prefix && !prefix.endsWith('\\')) throw new Error('Invalid PSR-4 prefix');
    const items = Array.isArray(paths) ? paths : [paths];
    if (items.some(path => typeof path !== 'string')) throw new Error('Invalid PSR-4 path');
    return items.map(path => [prefix, path]);
  });
}

function scopedPath(scope, candidate) {
  const root = resolve(scope);
  const path = resolve(candidate);
  const rel = relative(root, path);
  if (rel === '..' || rel.startsWith(`..${sep}`) || isAbsolute(rel)) {
    throw new Error('Configured path is outside the search scope');
  }
  const physicalRoot = realpathSync(root);
  let current = root;
  for (const part of rel.split(sep).filter(Boolean)) {
    current = resolve(current, part);
    try {
      lstatSync(current);
    } catch (error) {
      if (error.code === 'ENOENT') break;
      throw error;
    }
    const physical = realpathSync(current);
    const physicalRelative = relative(physicalRoot, physical);
    if (physicalRelative === '..' || physicalRelative.startsWith(`..${sep}`) || isAbsolute(physicalRelative)) {
      throw new Error('Configured path resolves outside the search scope');
    }
  }
  return path;
}

function isFile(path) {
  try { return statSync(path).isFile(); } catch (error) {
    if (error.code === 'ENOENT' || error.code === 'ENOTDIR') return false;
    throw error;
  }
}

export function query(command, file, value, scope = dirname(resolve(file))) {
  if (command === 'package-type') return [config(file, false, scope).type === 'module' ? 'esm' : ''];
  if (command === 'package-entry') {
    const pkg = config(file, false, dirname(resolve(file)));
    const entry = pkg.main ?? pkg.module ?? 'index.js';
    if (typeof entry !== 'string') throw new Error('Invalid package entry');
    scopedPath(dirname(resolve(file)), resolve(dirname(resolve(file)), entry));
    return [entry];
  }
  if (command === 'esm-resolve') {
    if (typeof value !== 'string' || !value) throw new Error('Import path required');
    const root = resolve(scope);
    if (value.startsWith('.')) {
      const base = scopedPath(root, resolve(dirname(resolve(file)), value));
      for (const candidate of [
        base, ...['.js', '.jsx', '.ts', '.tsx', '.vue', '.svelte'].map(ext => `${base}${ext}`),
        ...['index.js', 'index.jsx', 'index.ts', 'index.tsx'].map(name => resolve(base, name)),
      ]) {
        const safe = scopedPath(root, candidate);
        if (isFile(safe)) return [safe];
      }
      return [];
    }
    const packageRoot = scopedPath(root, resolve(root, 'node_modules', value));
    const packageFile = scopedPath(root, resolve(packageRoot, 'package.json'));
    if (isFile(packageFile)) {
      const [entry] = query('package-entry', packageFile);
      return [scopedPath(root, resolve(packageRoot, entry))];
    }
    const tsconfig = resolve(root, 'tsconfig.json');
    return isFile(tsconfig) ? query('ts-paths', tsconfig, value, root) : [];
  }
  if (command === 'ts-paths') {
    if (typeof value !== 'string') throw new Error('Import path required');
    const ts = config(file, true, scope);
    if (ts.extends !== undefined) throw new Error('Inherited tsconfig paths require a TypeScript-aware resolver');
    const compiler = ts.compilerOptions ?? {};
    const paths = compiler.paths ?? {};
    if (!paths || typeof paths !== 'object' || Array.isArray(paths)) throw new Error('Invalid TypeScript paths');
    const base = resolve(dirname(resolve(file)), compiler.baseUrl ?? '.');
    const matches = [];
    for (const [pattern, targets] of Object.entries(paths)) {
      const parts = pattern.split('*');
      if (parts.length > 2 || !Array.isArray(targets) || targets.some(target => typeof target !== 'string')) {
        throw new Error('Invalid TypeScript paths mapping');
      }
      const wildcard = parts.length === 2;
      if (wildcard ? !value.startsWith(parts[0]) || !value.endsWith(parts[1])
        || value.length < parts[0].length + parts[1].length : value !== pattern) continue;
      const match = wildcard ? value.slice(parts[0].length, value.length - parts[1].length) : '';
      for (const target of targets) matches.push(scopedPath(scope, resolve(base, target.replace('*', match))));
    }
    return matches;
  }
  if (command === 'psr4-list') return mappings(file, scope).map(([prefix, path]) => {
    scopedPath(scope, resolve(dirname(resolve(file)), path));
    return `${prefix}:${path}`;
  });
  if (command === 'psr4-resolve') {
    if (typeof value !== 'string') throw new Error('Namespace required');
    return mappings(file, scope).filter(([prefix]) => value.startsWith(prefix))
      .sort((a, b) => b[0].length - a[0].length)
      .map(([prefix, path]) => scopedPath(scope,
        resolve(dirname(resolve(file)), path, `${value.slice(prefix.length).replaceAll('\\', '/')}.php`)));
  }
  throw new Error('Usage: config-query.mjs <package-type|package-entry|esm-resolve|ts-paths|psr4-list|psr4-resolve> <file> [value] [scope]');
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  try {
    const results = query(process.argv[2], process.argv[3], process.argv[4], process.argv[5]);
    if (results.some(result => /[\r\n]/.test(result))) throw new Error('Line-breaking values cannot be emitted');
    for (const result of results) if (result) process.stdout.write(`${result}\n`);
  } catch (error) {
    process.stderr.write(`config-query: ${error.message}\n`);
    process.exitCode = 1;
  }
}
