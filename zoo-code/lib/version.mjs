// Version direction and source provenance. A local source (downloaded release, working copy, personal
// fork) is never rejected for what it is: it is analysed, announced and traced.
export const OFFICIAL_SOURCE_REF = 'github:lcalmejane/aikido';

const VERSION = /^(\d+)\.(\d+)(?:\.(\d+))?(?:-([0-9A-Za-z.-]+))?$/;

export function parseVersion(value) {
  const match = VERSION.exec(String(value ?? ''));
  if (!match) return null;
  return {
    core: [Number(match[1]), Number(match[2]), Number(match[3] ?? 0)],
    pre: match[4] ? match[4].split('.') : [],
  };
}

function comparePrerelease(a, b) {
  if (a.length === 0 || b.length === 0) {
    if (a.length === b.length) return 0;
    return a.length === 0 ? 1 : -1; // a release is newer than its prereleases
  }
  for (let i = 0; i < Math.max(a.length, b.length); i += 1) {
    if (a[i] === undefined) return -1;
    if (b[i] === undefined) return 1;
    const numeric = [/^\d+$/.test(a[i]), /^\d+$/.test(b[i])];
    if (numeric[0] && numeric[1] && Number(a[i]) !== Number(b[i])) return Number(a[i]) < Number(b[i]) ? -1 : 1;
    if (numeric[0] !== numeric[1]) return numeric[0] ? -1 : 1;
    if (!numeric[0] && a[i] !== b[i]) return a[i] < b[i] ? -1 : 1;
  }
  return 0;
}

/** -1, 0 or 1; null when either version cannot be read. */
export function compareVersions(left, right) {
  const a = parseVersion(left);
  const b = parseVersion(right);
  if (!a || !b) return null;
  for (let i = 0; i < 3; i += 1) if (a.core[i] !== b.core[i]) return a.core[i] < b.core[i] ? -1 : 1;
  return comparePrerelease(a.pre, b.pre);
}

/** { from, to, direction: 'initial' | 'upgrade' | 'same' | 'downgrade' | 'unknown' } */
export function describeVersionChange(from, to) {
  if (from === undefined || from === null) return { from: null, to, direction: 'initial' };
  const order = compareVersions(from, to);
  const direction = order === null ? 'unknown' : ({ '-1': 'upgrade', 0: 'same', 1: 'downgrade' })[order];
  return { from, to, direction };
}

export function isOfficialSource(source) {
  return source?.type === 'git' && source?.ref === OFFICIAL_SOURCE_REF;
}

/** Human readable, non blocking notices about where a package comes from. */
export function sourceWarnings(source, previousSource) {
  const warnings = [];
  if (!isOfficialSource(source)) {
    warnings.push(`package source is not the official AI-KIDO repository (${source?.type ?? 'unknown'}: ${source?.ref ?? 'unknown'})`);
  }
  if (previousSource && JSON.stringify(previousSource) !== JSON.stringify(source) && isOfficialSource(previousSource)) {
    warnings.push(`source changed from ${previousSource.ref} to ${source?.ref ?? 'unknown'}`);
  }
  return warnings;
}

export function changeWarnings(change) {
  if (change.direction === 'downgrade') return [`version regression: ${change.from} -> ${change.to}`];
  if (change.direction === 'unknown') return [`version direction cannot be determined: ${change.from} -> ${change.to}`];
  return [];
}
