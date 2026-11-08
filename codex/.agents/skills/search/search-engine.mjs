import { closeSync, constants, fstatSync, lstatSync, openSync, readFileSync, readdirSync, realpathSync, statSync } from 'node:fs';
import { dirname, extname, isAbsolute, relative, resolve, sep } from 'node:path';
import { query as configQuery } from './config-query.mjs';
import {
  assertPublicProjectRoot, isPrivateTaskStorePath, isPrivateTaskStorePathWithin,
} from '../structure/scripts/lib/private-task-store.mjs';

const PRESETS = {
  generic: {
    extensions: new Set([
      '.js', '.ts', '.jsx', '.tsx', '.mjs', '.cjs', '.py', '.pyw', '.java',
      '.cpp', '.c', '.cc', '.cxx', '.h', '.hpp', '.cs', '.csx', '.rb',
      '.rake', '.go', '.rs', '.php', '.swift', '.kt', '.kts', '.scala',
      '.sh', '.bash', '.sql', '.json', '.yaml', '.yml', '.toml', '.ini',
      '.env', '.properties', '.md', '.rst', '.txt',
    ]),
    exactFiles: new Set(),
    filePatterns: [],
    excludedDirectories: new Set([
      '.git', '.svn', 'node_modules', 'vendor', 'dist', 'build', 'out',
      'target', '__pycache__', '.venv', 'venv', '*.egg-info',
    ]),
    excludedFiles: new Set(),
  },
  javascript: {
    extensions: new Set(['.js', '.mjs', '.cjs', '.jsx', '.ts', '.tsx', '.vue', '.svelte']),
    exactFiles: new Set(['package.json', 'tsconfig.json', '.babelrc']),
    filePatterns: ['.eslintrc.*', '.babelrc.*', 'webpack.config.*', 'vite.config.*', 'next.config.*', 'nuxt.config.*'],
    excludedDirectories: new Set([
      '.git', 'node_modules', 'dist', 'build', '.next', '.nuxt', 'out', 'coverage',
    ]),
    excludedFiles: new Set(['*.min.js', '*.bundle.js']),
  },
  php: {
    extensions: new Set(['.php', '.phtml', '.inc', '.module', '.install', '.test']),
    exactFiles: new Set(['composer.json', 'composer.lock', '.env']),
    filePatterns: [],
    excludedDirectories: new Set([
      '.git', 'vendor', 'storage', 'cache', 'var/cache', 'bootstrap/cache',
    ]),
    excludedFiles: new Set(['*.cache.php']),
  },
  terraform: {
    extensions: new Set(['.tf', '.tfvars', '.json', '.hcl']),
    exactFiles: new Set(['.terraform.lock.hcl']),
    filePatterns: [],
    excludedDirectories: new Set([
      '.git', '.terraform', '.terragrunt-cache', 'node_modules', 'dist', 'build',
    ]),
    excludedFiles: new Set([
      'secrets.tfvars', 'secrets.tfvars.json', 'crash.log', 'override.tf',
      '*.tfstate', '*.tfstate.backup', '*_override.tf', '*.pem', '*.key',
      '*.crt',
    ]),
  },
};

const TECH_MARKERS = {
  javascript: ['package.json'],
  typescript: ['tsconfig.json'],
  python: ['requirements.txt', 'setup.py', 'pyproject.toml'],
  java: ['pom.xml', 'build.gradle', 'build.gradle.kts'],
  go: ['go.mod'],
  rust: ['Cargo.toml'],
  php: ['composer.json'],
  ruby: ['Gemfile'],
  cpp: ['CMakeLists.txt'],
  c: ['Makefile'],
  terraform: ['.terraform.lock.hcl'],
};

function isWithin(root, candidate) {
  const rel = relative(root, candidate);
  return rel === '' || (rel !== '..' && !rel.startsWith(`..${sep}`) && !isAbsolute(rel));
}

function canonicalPath(root, candidate) {
  const path = resolve(root, candidate);
  if (!isWithin(root, path)) throw new Error('Configured path is outside the search scope');
  let physical;
  try {
    physical = realpathSync(path);
  } catch (error) {
    if (error.code === 'ENOENT' || error.code === 'ENOTDIR') return null;
    throw error;
  }
  if (!isWithin(root, physical)) throw new Error('Configured path resolves outside the search scope');
  if (isPrivateTaskStorePathWithin(root, physical)) {
    throw new Error('Private Task Store paths cannot be searched');
  }
  return physical;
}

function ignoreRegex(pattern, anchored) {
  let source = '';
  for (let i = 0; i < pattern.length; i++) {
    const char = pattern[i];
    if (char === '*') {
      if (pattern[i + 1] === '*') {
        i++;
        if (pattern[i + 1] === '/') {
          i++;
          source += '(?:.*/)?';
        } else source += '.*';
      } else source += '[^/]*';
    } else if (char === '?') source += '[^/]';
    else source += char.replace(/[|\\{}()[\]^$+?.]/g, '\\$&');
  }
  if (!anchored && !pattern.includes('/')) source = `(?:^|/)${source}`;
  return new RegExp(`^${source}(?:$|/)`);
}

function parseIgnoreFile(file, base) {
  let text;
  try {
    text = readFileSync(file, 'utf8');
  } catch (error) {
    if (error.code === 'ENOENT') return [];
    throw error;
  }
  return text.split(/\r?\n/).flatMap(raw => {
    if (!raw || raw.startsWith('#')) return [];
    let pattern = raw;
    const escapedLeading = pattern.startsWith('\\#') || pattern.startsWith('\\!');
    if (escapedLeading) pattern = pattern.slice(1);
    const negated = !escapedLeading && pattern.startsWith('!');
    if (negated) pattern = pattern.slice(1);
    if (!pattern) return [];
    pattern = pattern.replace(/\/+$/, '');
    const anchored = pattern.startsWith('/');
    pattern = pattern.replace(/^\/+/, '');
    return [{ base, negated, regex: ignoreRegex(pattern, anchored) }];
  });
}

function ignored(relativePath, rules, root) {
  const path = relativePath.split(sep).join('/');
  let result = false;
  for (const rule of rules) {
    const rel = relative(rule.base, resolve(root, path)).replaceAll('\\', '/');
    if (rel.startsWith('../') || rel === '..') continue;
    if (rule.regex.test(rel)) result = !rule.negated;
  }
  return result;
}

function isExcluded(relativePath, preset, extraExcludes) {
  const normalized = relativePath.split(sep).join('/');
  if (isPrivateTaskStorePath(normalized)) return true;
  const parts = normalized.split('/');
  const matches = (value, pattern) => {
    const regex = new RegExp(`^${pattern.split('*').map(part => part.replace(/[|\\{}()[\]^$+?.]/g, '\\$&')).join('.*')}$`);
    return regex.test(value);
  };
  if ([...preset.excludedDirectories].some(directory => {
    if (directory.includes('/')) return normalized === directory || normalized.startsWith(`${directory}/`);
    return parts.some(part => matches(part, directory));
  })) return true;
  const basename = parts.at(-1);
  const excludedFiles = [...preset.excludedFiles, ...extraExcludes];
  return excludedFiles.some(pattern => {
    return matches(basename, pattern);
  });
}

function isAllowedFile(file, preset, extensions, language) {
  const basename = file.split(sep).at(-1);
  const extension = extname(basename).toLowerCase();
  const selected = extensions.has(extension)
    || preset.exactFiles.has(basename)
    || preset.filePatterns.some(pattern => {
      const regex = new RegExp(`^${pattern.split('*').map(part => part.replace(/[|\\{}()[\]^$+?.]/g, '\\$&')).join('.*')}$`, 'i');
      return regex.test(basename);
    });
  if (!selected) return false;
  return language !== 'terraform' || basename.endsWith('.tf') || basename.endsWith('.tfvars')
    || basename.endsWith('.tfvars.json') || basename === '.terraform.lock.hcl';
}

function scopeRoot(root) {
  const physical = assertPublicProjectRoot(resolve(root));
  if (!statSync(physical).isDirectory()) throw new Error('Search root must be a directory');
  return physical;
}

export function readScopedFile({ root, file, maxBytes = 4 * 1024 * 1024 } = {}) {
  const physicalRoot = scopeRoot(root);
  const fullPath = canonicalPath(physicalRoot, file);
  if (!fullPath) throw new Error('Scoped file does not exist');
  const relativePath = relative(physicalRoot, fullPath).split(sep).join('/');
  if (/(?:^|\/)(?:secrets?[^/]*\.tfvars|[^/]*\.tfstate(?:\.backup)?|[^/]*\.(?:pem|key|crt))$/i.test(relativePath)) {
    throw new Error('Sensitive infrastructure files cannot be read by search');
  }
  const info = lstatSync(fullPath);
  if (info.isSymbolicLink() || !info.isFile()) throw new Error('Scoped path is not a regular file');
  if (info.size > maxBytes) throw new Error('Scoped file exceeds size limit');
  const descriptor = openSync(fullPath, constants.O_RDONLY | (constants.O_NOFOLLOW ?? 0));
  try {
    if (!fstatSync(descriptor).isFile()) throw new Error('Scoped path is not a regular file');
    return readFileSync(descriptor, 'utf8');
  } finally {
    closeSync(descriptor);
  }
}

function selectedScopes(root, paths) {
  if (!Array.isArray(paths) || paths.length === 0) throw new Error('At least one search path is required');
  return paths.map(path => {
    if (typeof path !== 'string' || path.length === 0) throw new Error('Invalid search path');
    const fullPath = canonicalPath(root, path);
    if (!fullPath) throw new Error(`Search path does not exist: ${path}`);
    return fullPath;
  });
}

function rulesForScope(root, scope) {
  const relativePath = relative(root, scope);
  const parts = relativePath ? relativePath.split(sep) : [];
  let directory = root;
  const rules = parseIgnoreFile(resolve(directory, '.gitignore'), directory);
  const directoryParts = parts.slice(0, -1);
  for (const part of directoryParts) {
    directory = resolve(directory, part);
    rules.push(...parseIgnoreFile(resolve(directory, '.gitignore'), directory));
  }
  return rules;
}

function languagePreset(language) {
  const preset = PRESETS[language];
  if (!preset) throw new Error(`Unsupported search plan: ${language}`);
  return preset;
}

export function detectLanguageFromExtension(file) {
  const extension = extname(file).toLowerCase();
  if (['.js', '.mjs', '.cjs', '.jsx'].includes(extension)) return 'javascript';
  if (['.ts', '.tsx'].includes(extension)) return 'typescript';
  if (['.py', '.pyw'].includes(extension)) return 'python';
  if (extension === '.java') return 'java';
  if (extension === '.go') return 'go';
  if (extension === '.rs') return 'rust';
  if (['.php', '.phtml', '.inc'].includes(extension)) return 'php';
  if (['.rb', '.rake'].includes(extension)) return 'ruby';
  if (['.cpp', '.cc', '.cxx', '.c', '.h', '.hpp'].includes(extension)) return 'cpp';
  if (['.cs', '.csx'].includes(extension)) return 'csharp';
  if (['.tf', '.tfvars'].includes(extension)) return 'terraform';
  return 'unknown';
}

export function listFiles({
  root,
  paths = ['.'],
  language = 'generic',
  extensions,
  excludes = [],
  maxFiles = 10000,
} = {}) {
  const physicalRoot = scopeRoot(root);
  const scopes = selectedScopes(physicalRoot, paths);
  const preset = languagePreset(language);
  const allowedExtensions = extensions ? new Set(extensions.map(ext => ext.startsWith('.') ? ext : `.${ext}`)) : preset.extensions;
  const results = new Set();
  const visited = new Set();

  function walk(directory, inheritedRules) {
    if (isPrivateTaskStorePathWithin(physicalRoot, directory)) return;
    const physicalDirectory = canonicalPath(physicalRoot, directory);
    if (!physicalDirectory || visited.has(physicalDirectory)) return;
    visited.add(physicalDirectory);
    const relativeDirectory = relative(physicalRoot, physicalDirectory);
    const rules = [
      ...inheritedRules,
      ...parseIgnoreFile(resolve(physicalDirectory, '.gitignore'), physicalDirectory),
    ];
    for (const entry of readdirSync(physicalDirectory, { withFileTypes: true })) {
      if (entry.isSymbolicLink()) continue;
      const fullPath = resolve(physicalDirectory, entry.name);
      const relativePath = relative(physicalRoot, fullPath);
      if (isPrivateTaskStorePathWithin(physicalRoot, relativePath) ||
          isExcluded(relativePath, preset, excludes)) continue;
      const fileEntry = entry.isFile();
      if (ignored(relativePath, rules, physicalRoot)) continue;
      if (entry.isDirectory()) walk(fullPath, rules);
      else if (fileEntry && isAllowedFile(relativePath, preset, allowedExtensions, language)) {
        const safePath = canonicalPath(physicalRoot, fullPath);
        if (safePath) results.add(relative(physicalRoot, safePath));
        if (results.size > maxFiles) throw new Error('Search file limit exceeded');
      }
    }
  }

  for (const scope of scopes) {
    const info = lstatSync(scope);
    if (info.isSymbolicLink()) throw new Error('Symbolic-link search scopes are not allowed');
    if (info.isDirectory()) walk(scope, rulesForScope(physicalRoot, scope));
    else if (info.isFile()) {
      const rel = relative(physicalRoot, scope);
      if (!isExcluded(rel, preset, excludes)
        && !ignored(rel, rulesForScope(physicalRoot, scope), physicalRoot)
        && isAllowedFile(rel, preset, allowedExtensions, language)) {
        results.add(rel);
      }
    } else throw new Error('Search path must be a regular file or directory');
  }
  return [...results].sort();
}

function lineExcerpt(lines, target, context) {
  const from = Math.max(0, target - context);
  const to = Math.min(lines.length, target + context + 1);
  return lines.slice(from, to).map((text, index) => {
    const lineNumber = from + index + 1;
    const safeText = /[\w.-]*(?:password|passwd|secret|api[_-]?key|token|credential|private[_-]?key)\b\s*[:=]/i.test(text)
      ? text.replace(/([:=]\s*).+$/, '$1[REDACTED]')
      : text;
    return `${lineNumber}: ${safeText}`;
  }).join('\n');
}

export function search({
  root,
  paths = ['.'],
  language = 'generic',
  extensions,
  excludes = [],
  query,
  mode = 'literal',
  caseSensitive = false,
  context = 0,
  maxResults = 100,
} = {}) {
  if (typeof query !== 'string' || query.length === 0) throw new Error('Search query is required');
  if (!Number.isInteger(context) || context < 0 || context > 20) throw new Error('Invalid context size');
  if (!Number.isInteger(maxResults) || maxResults < 1 || maxResults > 10000) throw new Error('Invalid result limit');
  let matcher;
  try {
    matcher = mode === 'regex'
      ? new RegExp(query, caseSensitive ? 'u' : 'iu')
      : mode === 'literal'
        ? new RegExp(query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), caseSensitive ? 'u' : 'iu')
        : null;
  } catch {
    throw new Error('Invalid regular expression');
  }
  if (!matcher) throw new Error('Search mode must be literal or regex');
  const physicalRoot = scopeRoot(root);
  const files = listFiles({ root: physicalRoot, paths, language, extensions, excludes });
  const matches = [];
  let truncated = false;
  let filesScanned = 0;
  for (const file of files) {
    const fullPath = canonicalPath(physicalRoot, file);
    if (!fullPath) continue;
    let text;
    try {
      text = readScopedFile({ root: physicalRoot, file });
    } catch (error) {
      if (error.message === 'Sensitive infrastructure files cannot be read by search') continue;
      throw error;
    }
    filesScanned++;
    if (text.includes('\0')) continue;
    const lines = text.split(/\r?\n/);
    for (let index = 0; index < lines.length; index++) {
      matcher.lastIndex = 0;
      if (!matcher.test(lines[index])) continue;
      matches.push({
        path: file.split(sep).join('/'),
        line: index + 1,
        excerpt: lineExcerpt(lines, index, context),
      });
      if (matches.length >= maxResults) {
        truncated = true;
        break;
      }
    }
    if (truncated) break;
  }
  return {
    matches,
    summary: `${matches.length} match(es) in ${filesScanned} file(s)${truncated ? ' (result limit reached)' : ''}.`,
    filesScanned,
    truncated,
  };
}

export function extractMetadata(text, language = 'generic') {
  const lines = text.split(/\r?\n/);
  const metadata = { classes: [], interfaces: [], functions: [], dependencies: [] };
  const patterns = language === 'php'
    ? {
      class: /^\s*(?:<\?php\s*)?(?:(?:abstract|final)\s+)?class\s+(\w+)/,
      interface: /^\s*(?:<\?php\s*)?interface\s+(\w+)/,
      function: /^\s*(?:<\?php\s*)?(?:(?:public|protected|private|static|final|abstract)\s+)*function\s+&?\s*(\w+)\s*\(/,
      dependency: /^\s*use\s+([\w\\]+)(?:\s+as\s+(\w+))?;/,
    }
    : {
      class: /^\s*(?:(?:export|default|public|private|protected|abstract|final)\s+)*class\s+(\w+)/,
      interface: /^\s*(?:(?:export|declare)\s+)*interface\s+(\w+)/,
      function: /^\s*(?:(?:export|async|function)\s+)+(\w+)\s*\(/,
      dependency: /^\s*(?:import|from|require)\s+.*?(?:from\s+)?['"]([^'"]+)['"]/,
    };
  lines.forEach((line, index) => {
    const lineNumber = index + 1;
    for (const [kind, pattern] of Object.entries(patterns)) {
      const match = line.match(pattern);
      if (!match) continue;
      const key = kind === 'dependency' ? 'dependencies' : kind === 'class' ? 'classes' : `${kind}s`;
      metadata[key].push({
        name: match[1],
        ...(kind === 'dependency' && match[2] ? { alias: match[2] } : {}),
        line: lineNumber,
      });
    }
  });
  return metadata;
}

export function extractFileMetadata({ root, file, language = detectLanguageFromExtension(file) } = {}) {
  return extractMetadata(readScopedFile({ root, file }), language);
}

export function resolveGenericImport({ root, paths = ['.'], importPath, currentFile } = {}) {
  if (typeof importPath !== 'string' || importPath.length === 0) throw new Error('Import path is required');
  const physicalRoot = scopeRoot(root);
  const scopes = selectedScopes(physicalRoot, paths);
  const candidates = [];
  if (importPath.startsWith('.')) {
    if (typeof currentFile !== 'string' || currentFile.length === 0) throw new Error('Current file is required for a relative import');
    const sourceFile = canonicalPath(physicalRoot, currentFile);
    if (!sourceFile || !statSync(sourceFile).isFile()) throw new Error('Current file is outside the search scope');
    if (!scopes.some(scope => isWithin(scope, sourceFile))) {
      throw new Error('Current file is outside the selected search paths');
    }
    const base = resolve(dirname(sourceFile), importPath);
    candidates.push(base, ...['.js', '.jsx', '.ts', '.tsx', '.vue', '.svelte'].map(ext => `${base}${ext}`));
    candidates.push(...['index.js', 'index.jsx', 'index.ts', 'index.tsx'].map(name => resolve(base, name)));
  } else {
    const basename = importPath.split(/[\\/]/).at(-1);
    for (const file of listFiles({ root: physicalRoot, paths, language: 'generic' })) {
      if (file.split(sep).at(-1).startsWith(basename)) candidates.push(resolve(physicalRoot, file));
    }
  }
  for (const candidate of candidates) {
    const safePath = canonicalPath(physicalRoot, candidate);
    if (safePath && statSync(safePath).isFile()
      && scopes.some(scope => isWithin(scope, safePath))) {
      return relative(physicalRoot, safePath).split(sep).join('/');
    }
  }
  return null;
}

export function detectTechnologies({ root, paths = ['.'] } = {}) {
  const physicalRoot = scopeRoot(root);
  const scopes = selectedScopes(physicalRoot, paths);
  const files = new Set();
  for (const scope of scopes) {
    if (statSync(scope).isFile()) files.add(relative(physicalRoot, scope));
    else {
      for (const entry of readdirSync(scope, { withFileTypes: true })) {
        if (entry.isFile()) files.add(relative(physicalRoot, resolve(scope, entry.name)));
      }
    }
  }
  const technologies = [];
  for (const [technology, markers] of Object.entries(TECH_MARKERS)) {
    if (markers.some(marker => files.has(marker))) technologies.push(technology);
  }
  return technologies;
}

export function detectModuleSystem({ root, paths = ['.'] } = {}) {
  const packageFile = resolve(root, 'package.json');
  try {
    const [type] = configQuery('package-type', packageFile);
    if (type === 'esm') return 'esm';
  } catch (error) {
    if (error.code !== 'ENOENT') throw error;
  }
  let esm = false;
  let commonjs = false;
  for (const file of listFiles({ root, paths, language: 'javascript' })) {
    const text = readScopedFile({ root, file });
    if (/^\s*import\s/m.test(text)) esm = true;
    if (/^\s*(?:const|let|var)\s+.*=\s*require\s*\(/m.test(text)) commonjs = true;
  }
  if (esm && commonjs) return 'mixed';
  if (esm) return 'esm';
  if (commonjs) return 'commonjs';
  return 'mixed';
}

export function hasTypeScript({ root, paths = ['.'] } = {}) {
  try {
    statSync(resolve(root, 'tsconfig.json'));
    return true;
  } catch (error) {
    if (error.code !== 'ENOENT') throw error;
  }
  return listFiles({ root, paths, language: 'javascript' })
    .some(file => ['.ts', '.tsx'].includes(extname(file).toLowerCase()));
}

export function detectJsFramework({ root } = {}) {
  let dependencies;
  try {
    dependencies = JSON.parse(readScopedFile({ root, file: 'package.json' }));
  } catch (error) {
    if (error.code === 'ENOENT' || error.message === 'Scoped file does not exist') return 'generic';
    throw new Error('Invalid package configuration');
  }
  const names = new Set([
    ...Object.keys(dependencies.dependencies ?? {}),
    ...Object.keys(dependencies.devDependencies ?? {}),
  ]);
  for (const [name, framework] of [
    ['react', 'react'], ['vue', 'vue'], ['@angular/core', 'angular'],
    ['svelte', 'svelte'], ['next', 'nextjs'], ['nuxt', 'nuxt'],
  ]) {
    if (names.has(name)) return framework;
  }
  return 'generic';
}

export function detectPhpFramework({ root } = {}) {
  const exists = path => {
    try { statSync(resolve(root, path)); return true; } catch (error) {
      if (error.code === 'ENOENT') return false;
      throw error;
    }
  };
  if (exists('artisan')) return 'laravel';
  if (exists('bin/console') && exists('vendor/symfony')) return 'symfony';
  if (exists('wp-content')) return 'wordpress';
  if (exists('index.php') && /Drupal/.test(readScopedFile({ root, file: 'index.php' }))) return 'drupal';
  return 'generic';
}

export function extractPhpUses(text) {
  return text.split(/\r?\n/).flatMap((line, index) => {
    const match = line.match(/^\s*use\s+(?!function\b|const\b)([\w\\]+)(?:\s+as\s+(\w+))?\s*;/);
    return match ? [{ name: match[1], ...(match[2] ? { alias: match[2] } : {}), line: index + 1 }] : [];
  });
}

export function detectTerraformProvider(resourceType) {
  const prefix = String(resourceType).split('_', 1)[0];
  const labels = {
    aws: 'aws (Amazon Web Services)',
    azurerm: 'azurerm (Microsoft Azure)',
    google: 'google (Google Cloud)',
    kubernetes: 'kubernetes',
    docker: 'docker',
    helm: 'helm',
  };
  return labels[prefix] ?? `${prefix} (unknown)`;
}

export function detectTerraformProviders({ root, paths = ['.'] } = {}) {
  const providers = new Set();
  for (const file of listFiles({ root, paths, language: 'terraform' })) {
    if (!file.endsWith('.tf')) continue;
    const text = readScopedFile({ root, file });
    for (const match of text.matchAll(/^\s*(?:resource|provider)\s+"([a-zA-Z0-9_]+)"/gm)) {
      providers.add(match[1].split('_', 1)[0]);
    }
  }
  return [...providers].sort();
}

export function resolveTerraformModuleSource(source, { root, paths = ['.'], file = '.' } = {}) {
  if (typeof source !== 'string' || source.length === 0) throw new Error('Module source is required');
  if (/^git::/i.test(source) || /^(?:https?|ssh):\/\//i.test(source) || /^git@/i.test(source)) {
    return 'Remote module source (details omitted)';
  }
  if (/^(?:\.\.?\/|\/|[A-Za-z]:[\\/])/.test(source)) {
    const physicalRoot = scopeRoot(root);
    const scopes = selectedScopes(physicalRoot, paths);
    const modulePath = canonicalPath(physicalRoot, resolve(dirname(resolve(physicalRoot, file)), source));
    if (!modulePath) return 'Local module (not present)';
    if (!scopes.some(scope => isWithin(scope, modulePath))) {
      throw new Error('Configured path is outside the search scope');
    }
    return `Local module: ${relative(physicalRoot, modulePath).split(sep).join('/') || '.'}`;
  }
  return `Registry module: ${source.replace(/[?#].*$/, '')}`;
}

export function extractTerraformDependencies(text) {
  const categories = {
    variables: /\bvar\.([a-z_]\w*)/g,
    locals: /\blocal\.([a-z_]\w*)/g,
    modules: /\bmodule\.([a-z_]\w*)\.([a-z_]\w*)/g,
    data: /\bdata\.([a-z_]\w*)\.([a-z_]\w*)\.([a-z_]\w*)/g,
    resources: /\b([a-z_]\w*)\.([a-z_]\w*)\.([a-z_]\w*)/g,
  };
  return Object.fromEntries(Object.entries(categories).map(([category, pattern]) => {
    const references = new Set();
    for (const match of text.matchAll(pattern)) {
      if (category === 'resources' && ['var', 'local', 'module', 'data'].includes(match[1])) continue;
      references.add(match.slice(1).join('.'));
    }
    return [category, [...references].sort()];
  }));
}

export function listTerraformModules({ root, paths = ['.'] } = {}) {
  const modules = [];
  for (const file of listFiles({ root, paths, language: 'terraform' })) {
    if (!file.endsWith('.tf')) continue;
    const lines = readScopedFile({ root, file }).split(/\r?\n/);
    for (let index = 0; index < lines.length; index++) {
      const block = lines[index].match(/^\s*module\s+"([^"]+)"\s*\{/);
      if (!block) continue;
      for (let end = index + 1; end < Math.min(lines.length, index + 50); end++) {
        if (/^\s*}\s*$/.test(lines[end])) break;
        const source = lines[end].match(/^\s*source\s*=\s*"([^"]+)"/);
        if (source) {
          modules.push({
            name: block[1],
            file,
            line: index + 1,
            source: resolveTerraformModuleSource(source[1], { root, paths, file }),
          });
          break;
        }
      }
    }
  }
  return modules;
}

export function findSensitiveTerraformFiles({ root, paths = ['.'] } = {}) {
  const files = listFiles({ root, paths, language: 'terraform' });
  return files.filter(file => {
    if (!file.endsWith('.tf') && !file.endsWith('.tfvars') && !file.endsWith('.tfvars.json')) return false;
    const text = readScopedFile({ root, file });
    return /[\w.-]*(?:password|secret|api[_-]?key|token|credential)\b\s*=\s*["'][^"']+["']/i.test(text);
  });
}
