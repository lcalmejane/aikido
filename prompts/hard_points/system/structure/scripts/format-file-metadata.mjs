#!/usr/bin/env node
import { readFileSync, statSync } from 'node:fs';
import { basename, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

function requireNode24() {
  const major = Number(process.versions.node.split('.')[0]);
  if (!Number.isInteger(major) || major < 24) {
    throw new Error(`Node.js 24 or newer is required (found ${process.versions.node})`);
  }
}

function isText(buffer) {
  if (buffer.length === 0 || buffer.includes(0)) return false;
  for (const byte of buffer) {
    if (byte < 32 && ![8, 9, 10, 12, 13].includes(byte)) return false;
  }
  try {
    new TextDecoder('utf-8', { fatal: true }).decode(buffer);
    return true;
  } catch {
    return false;
  }
}

function fileIcon(path, extension, isDirectory) {
  if (isDirectory) return '📁';
  if (['md', 'mdx'].includes(extension)) {
    if (/\/personas\//.test(path)) return '🤖';
    if (/\/concepts\//.test(path)) return '💡';
    if (/\/techniques\//.test(path)) return '⚡';
    if (/\/use_cases\//.test(path)) return '🎯';
    if (/\/hard_points\//.test(path)) return '🔒';
    return '📄';
  }
  if (extension === 'txt') return '📝';
  if (['json', 'yaml', 'yml'].includes(extension)) return '⚙️';
  if (extension === 'sh') return '🔧';
  if (['js', 'ts', 'mjs'].includes(extension)) return '⚡';
  if (extension === 'py') return '🐍';
  return '📄';
}

function formatDate(date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

function checkInfo(path, buffer, text) {
  if (!path.startsWith('prompts/') && !path.startsWith('./prompts/')) return 'N/A';
  if (!text) return '❌ binary';
  const lines = buffer.toString('utf8').split(/\r?\n/);
  if (lines[0] !== '---') return '❌ no-header';
  const closing = lines.indexOf('---', 1);
  const header = lines.slice(1, closing < 0 ? lines.length : closing);
  const start = header.findIndex(line => /^last_check:\s*(?:#.*)?$/.test(line));
  if (start < 0) return '⚠️ no-lastcheck';
  const section = [];
  for (const line of header.slice(start + 1)) {
    if (/^[A-Za-z_][\w-]*\s*:/.test(line)) break;
    section.push(line);
  }
  const value = key => section.find(line => new RegExp(`^\\s+${key}:\\s*`).test(line))
    ?.replace(new RegExp(`^\\s+${key}:\\s*`), '').replace(/^['"]|['"]$/g, '').trim();
  const status = value('status');
  const validator = value('validator');
  return status && validator ? `${status} by:${validator}` : '⚠️ no-lastcheck';
}

export function formatFileMetadata(filePath, format, cwd = process.cwd()) {
  requireNode24();
  if (!filePath || !format) throw new Error('Usage: format-file-metadata.mjs <file_path> <format> (tree|agents)');
  if (!['tree', 'agents'].includes(format)) {
    throw new Error(`Unsupported format '${format}'. Supported formats: tree, agents`);
  }
  const absolute = resolve(cwd, filePath);
  let info;
  try {
    info = statSync(absolute);
  } catch (error) {
    if (error.code === 'ENOENT' || error.code === 'ENOTDIR') {
      throw new Error(`File '${filePath}' does not exist`);
    }
    throw error;
  }
  const name = basename(filePath);
  const directory = info.isDirectory();
  if (!directory && !info.isFile()) throw new Error(`Unsupported file type: ${filePath}`);
  const extension = name.includes('.') ? name.slice(name.lastIndexOf('.') + 1) : name;
  const buffer = directory ? Buffer.alloc(0) : readFileSync(absolute);
  const text = !directory && isText(buffer);
  let lines = 0;
  if (text) {
    for (const byte of buffer) if (byte === 10) lines++;
  }
  const icon = fileIcon(filePath.replaceAll('\\', '/'), extension, directory);
  if (directory) return `${icon} ${name}`;
  const date = formatDate(info.mtime);
  const detail = lines > 0 ? ` (${lines}L ${info.size}B ${date})` : ` (${info.size}B ${date})`;
  let output = `${icon} ${name}${detail}`;
  if (format === 'agents') {
    const check = checkInfo(filePath.replaceAll('\\', '/'), buffer, text);
    if (check !== 'N/A') output += ` [Check: ${check}]`;
  }
  return output;
}

function main(args) {
  try {
    requireNode24();
    if (args.length < 2) {
      process.stdout.write('Usage: format-file-metadata.mjs <file_path> <format>\nFormats: tree, agents\n');
      process.exitCode = 1;
      return;
    }
    process.stdout.write(`${formatFileMetadata(args[0], args[1])}\n`);
  } catch (error) {
    process.stderr.write(`Error: ${error.message}\n`);
    process.exitCode = 1;
  }
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main(process.argv.slice(2));
}
