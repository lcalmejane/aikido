export const NODE_BASELINE = 24;

export function inspectNodeRuntime(version = process.versions.node) {
  const match = /^(\d+)\.(\d+)\.(\d+)(?:-([0-9A-Za-z.-]+))?$/.exec(version);
  if (!match) throw new Error(`Invalid Node.js version: ${version}`);
  const major = Number(match[1]);
  const prerelease = match[4] ?? null;
  const baselineMet = major >= NODE_BASELINE && prerelease === null;
  return {
    version,
    executable: process.execPath,
    baseline: `${NODE_BASELINE}.0.0`,
    status: baselineMet ? 'baseline-met' : 'below-baseline',
    detail: baselineMet
      ? 'The current process meets the Node.js version baseline; host permissions and other executors are not verified.'
      : 'The current process is below the Node.js version baseline or is a prerelease; use a stable compatible Node.js runtime.',
  };
}
