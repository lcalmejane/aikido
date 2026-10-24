import { createHash } from 'node:crypto';

// Markers delimit the only part of a user file that AI-KIDO may rewrite.
const STYLES = {
  html: {
    begin: (id) => `<!-- aikido:begin id=${id} - managed by AI-KIDO, edit outside this block -->`,
    end: (id) => `<!-- aikido:end id=${id} -->`,
    pattern: /^<!-- aikido:(begin|end) id=([a-z0-9-]+)\b.*-->$/,
  },
  hash: {
    begin: (id) => `# aikido:begin id=${id} - managed by AI-KIDO, edit outside this block`,
    end: (id) => `# aikido:end id=${id}`,
    pattern: /^# aikido:(begin|end) id=([a-z0-9-]+)\b.*$/,
  },
};

function style(name) {
  const s = STYLES[name];
  if (!s) throw new Error(`Unknown block style: ${name}`);
  return s;
}

function splitLines(text) {
  const eol = text.includes('\r\n') ? '\r\n' : '\n';
  return { eol, lines: text.split(/\r?\n/) };
}

export function parseBlocks(text, styleName) {
  const { pattern } = style(styleName);
  const { lines } = splitLines(text);
  const blocks = [];
  let open = null;
  lines.forEach((line, index) => {
    const m = line.trim().match(pattern);
    if (!m) return;
    const [, kind, id] = m;
    if (kind === 'begin') {
      if (open) throw new Error(`Nested AI-KIDO block "${id}" inside "${open.id}" at line ${index + 1}`);
      if (blocks.some((b) => b.id === id)) throw new Error(`Duplicate AI-KIDO block "${id}" at line ${index + 1}`);
      open = { id, start: index };
    } else {
      if (!open || open.id !== id) throw new Error(`Unexpected end of AI-KIDO block "${id}" at line ${index + 1}`);
      blocks.push({ id, start: open.start, end: index, content: lines.slice(open.start + 1, index).join('\n') });
      open = null;
    }
  });
  if (open) throw new Error(`Unclosed AI-KIDO block "${open.id}" at line ${open.start + 1}`);
  return blocks;
}

export function findBlock(text, id, styleName) {
  return parseBlocks(text, styleName).find((b) => b.id === id) ?? null;
}

function normalizeContent(content) {
  return content.replace(/\r\n/g, '\n').replace(/\n+$/, '');
}

export function blockHash(content) {
  return createHash('sha256').update(normalizeContent(content)).digest('hex');
}

export function upsertBlock(text, id, content, styleName) {
  const s = style(styleName);
  const { eol, lines } = splitLines(text);
  const body = normalizeContent(content).split('\n');
  const block = [s.begin(id), ...body, s.end(id)];
  const existing = findBlock(text, id, styleName);
  if (existing) {
    lines.splice(existing.start, existing.end - existing.start + 1, ...block);
    return lines.join(eol);
  }
  if (text === '') return block.join(eol) + eol;
  const trimmed = text.replace(/(\r?\n)+$/, '');
  return trimmed + eol + eol + block.join(eol) + eol;
}

export function removeBlock(text, id, styleName) {
  const existing = findBlock(text, id, styleName);
  if (!existing) return text;
  const { eol, lines } = splitLines(text);
  let { start, end } = existing;
  if (start > 0 && lines[start - 1] === '' && (end + 1 >= lines.length || lines[end + 1] === '')) start -= 1;
  lines.splice(start, end - start + 1);
  return lines.join(eol);
}
