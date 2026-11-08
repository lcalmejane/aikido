import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  chmod, copyFile, lstat, mkdir, mkdtemp, readFile, readdir,
  realpath, rm, symlink, writeFile,
} from 'node:fs/promises';
import { spawn, spawnSync } from 'node:child_process';
import { dirname, join, posix, win32 } from 'node:path';
import { tmpdir } from 'node:os';
import { fileURLToPath, pathToFileURL } from 'node:url';
import {
  assertSupportedPlatform, directoryAncestors, topLevelNames,
} from '../../prompts/hard_points/system/web/script/download_site.mjs';

const source = fileURLToPath(new URL('../../prompts/hard_points/system/web/script/', import.meta.url));
// Executable fixtures below are POSIX shebang scripts, not native Windows .exe.
const baseline = Number(process.versions.node.split('.')[0]) >= 24 && process.platform !== 'win32';

test('directory ancestors preserve each Windows drive and UNC component', () => {
  assert.deepEqual(directoryAncestors('C:\\project with spaces\\web\\site\\docs', win32), [
    'C:\\', 'C:\\project with spaces', 'C:\\project with spaces\\web',
    'C:\\project with spaces\\web\\site', 'C:\\project with spaces\\web\\site\\docs',
  ]);
  assert.deepEqual(directoryAncestors('C:/project/web/site/../docs', win32), [
    'C:\\', 'C:\\project', 'C:\\project\\web', 'C:\\project\\web\\docs',
  ]);
  assert.deepEqual(directoryAncestors('\\\\server\\share\\web\\site', win32), [
    '\\\\server\\share\\', '\\\\server\\share\\web', '\\\\server\\share\\web\\site',
  ]);
  assert.deepEqual(directoryAncestors('C:\\', win32), ['C:\\']);
  assert.deepEqual(directoryAncestors('/project/web/site', posix), [
    '/', '/project', '/project/web', '/project/web/site',
  ]);
});

test('publication groups native and mixed Windows separators at the site boundary', () => {
  assert.deepEqual(topLevelNames([
    win32.join('example.test', 'docs', 'page.md'),
    win32.join('example.test', 'page_media', 'image.png'),
    'example.test/about.md',
    win32.join('other.test', 'index.md'),
    'standalone.md',
  ], win32), ['example.test', 'other.test', 'standalone.md']);
  assert.deepEqual(topLevelNames([
    posix.join('example.test:8080', 'docs', 'page.md'),
    posix.join('example.test:8081', 'index.md'),
    posix.join('example.test:8080', 'index_media', 'image.png'),
    'literal\\backslash/index.md',
  ], posix), ['example.test:8080', 'example.test:8081', 'literal\\backslash']);
});

test('Windows is explicitly rejected rather than silently probing extensionless executables', () => {
  assert.throws(() => assertSupportedPlatform('win32'), /Windows is not yet supported.*\.exe\/PATHEXT/);
  assert.doesNotThrow(() => assertSupportedPlatform('darwin'));
  assert.doesNotThrow(() => assertSupportedPlatform('linux'));
});

test('native Windows entry point rejects the OS before dependency or filesystem effects', {
  skip: process.platform !== 'win32',
}, async t => {
  const root = await mkdtemp(join(tmpdir(), 'web-windows-unsupported-'));
  t.after(() => rm(root, { recursive: true, force: true }));
  const scriptDir = join(root, 'prompts/hard_points/system/web/script');
  await mkdir(scriptDir, { recursive: true });
  const engine = join(scriptDir, 'download_site.mjs');
  await copyFile(join(source, 'download_site.mjs'), engine);
  const result = spawnSync(process.execPath, [engine, 'https://example.test', '2'], {
    cwd: root, env: { ...process.env, PATH: '', Path: '' }, encoding: 'utf8', timeout: 15000,
  });
  failure(result, /Windows is not yet supported/);
  await assert.rejects(lstat(join(root, 'prompts/hard_points/web')), { code: 'ENOENT' });
});

// These are real executables: the engine exercises PATH, spawn, permissions,
// argument boundaries and exit status. No test ever invokes a real downloader.
const fake = `
import { appendFileSync, chmodSync, mkdirSync, statSync, writeFileSync, symlinkSync } from 'node:fs';
import { basename, dirname, join } from 'node:path';
const tool = basename(process.argv[1]);
const args = process.argv.slice(2);
const config = JSON.parse(process.env.FAKE_CONFIG || '{}');
const record = {tool, args};
if (tool === 'wget' && args[0] !== '--version') {
  record.temporaryMode = statSync(dirname(args[args.indexOf('-P') + 1])).mode & 0o777;
}
appendFileSync(process.env.FAKE_LOG, JSON.stringify(record) + '\\n');
if (args[0] === '--version') process.exit(config.versionFailure === tool ? 9 : 0);
if (config.failure === tool) process.exit(7);
if (tool === 'wget') {
  const root = args[args.indexOf('-P') + 1];
  const host = new URL(args.at(-1)).host;
  for (const name of config.html || [host + '/index.html', host + '/docs/page with spaces.html']) {
    const file = join(root, name);
    mkdirSync(dirname(file), {recursive: true});
    writeFileSync(file, '<html><body>fixture</body></html>');
  }
  if (config.downloadSymlink) symlinkSync(process.env.FAKE_OUTSIDE, join(root, 'escape'));
  if (config.wait) {
    writeFileSync(process.env.FAKE_READY, 'ready');
    setInterval(() => {}, 1000);
  }
} else {
  const output = args[args.indexOf('-o') + 1];
  if (config.failPage && args.at(-1).endsWith(config.failPage)) process.exit(8);
  if (!config.noOutput) writeFileSync(output, '# Fixture Markdown\\n');
  if (config.media) {
    const media = args.find(arg => arg.startsWith('--extract-media=')).split('=').slice(1).join('=');
    mkdirSync(media, {recursive: true});
    writeFileSync(join(media, 'image.txt'), 'media');
  }
  if (config.stagingSymlink) symlinkSync(process.env.FAKE_OUTSIDE, output + '_escape');
  if (config.cleanupBlock) chmodSync(dirname(args.at(-1)), 0o500);
}
`;

async function fixture(t, config = {}) {
  const root = await realpath(await mkdtemp(join(tmpdir(), 'web download tests ')));
  t.after(() => rm(root, { recursive: true, force: true }));
  const scriptDir = join(root, 'prompts/hard_points/system/web/script');
  const bin = join(root, 'fake bins');
  const outside = join(root, 'outside');
  await mkdir(scriptDir, { recursive: true });
  await mkdir(bin);
  await mkdir(outside);
  await writeFile(join(outside, 'sentinel'), 'user data');
  for (const name of ['download_site.mjs']) {
    await copyFile(join(source, name), join(scriptDir, name));
  }
  for (const name of ['wget', 'pandoc']) {
    await writeFile(join(bin, name), `#!${process.execPath}\n${fake}`, { mode: 0o755 });
  }
  const log = join(root, 'calls.jsonl');
  const env = {
    ...process.env, PATH: bin, FAKE_CONFIG: JSON.stringify(config),
    FAKE_LOG: log, FAKE_OUTSIDE: outside, FAKE_READY: join(root, 'ready'),
  };
  const engine = join(scriptDir, 'download_site.mjs');
  const output = join(root, 'prompts/hard_points/web');
  return {
    root, bin, env, output, engine, outside, scriptDir,
    run(args = ['https://example.test', '2'], customEnv = env) {
      return spawnSync(process.execPath, [engine, ...args], {
        cwd: root, env: customEnv, encoding: 'utf8', timeout: 15000,
      });
    },
    async calls() {
      try { return (await readFile(log, 'utf8')).trim().split('\n').filter(Boolean).map(JSON.parse); }
      catch (error) { if (error.code === 'ENOENT') return []; throw error; }
    },
  };
}

async function clean(f) {
  let names = [];
  try { names = await readdir(f.output); } catch (error) {
    if (error.code !== 'ENOENT') throw error;
  }
  assert.equal(names.some(name => name.startsWith('.download-site-')), false);
  assert.equal(await readFile(join(f.outside, 'sentinel'), 'utf8'), 'user data');
}

function success(result) {
  assert.equal(result.error, undefined);
  assert.equal(result.status, 0, result.stderr);
  assert.match(result.stdout, /Download and conversion complete:/);
}

function failure(result, message) {
  assert.equal(result.error, undefined);
  assert.equal(result.status, 1, result.stderr);
  assert.match(result.stderr, message);
  assert.doesNotMatch(result.stdout, /Download and conversion complete:/);
}

test('CLI executes through symlinked ancestor and symlinked entry file, never silently succeeds', {
  skip: !baseline,
}, async t => {
  const f = await fixture(t);
  const alias = join(f.root, 'aliased script directory');
  const linkedFile = join(f.root, 'linked engine.mjs');
  await symlink(f.scriptDir, alias);
  await symlink(f.engine, linkedFile);
  for (const entry of [join(alias, 'download_site.mjs'), linkedFile]) {
    const invalid = spawnSync(process.execPath, [entry, 'invalid', '2'], {
      cwd: f.root, env: f.env, encoding: 'utf8', timeout: 15000,
    });
    failure(invalid, /Invalid/);
    assert.deepEqual(await f.calls(), []);
  }
  for (const [entry, host] of [
    [join(alias, 'download_site.mjs'), 'ancestor.test'],
    [linkedFile, 'entry.test'],
  ]) {
    const result = spawnSync(process.execPath, [entry, `https://${host}`, '2'], {
      cwd: f.root, env: f.env, encoding: 'utf8', timeout: 15000,
    });
    success(result);
    assert.equal(await readFile(join(f.output, host, 'index.md'), 'utf8'), '# Fixture Markdown\n');
  }
  assert.equal((await f.calls()).filter(c => c.tool === 'wget' && c.args[0] !== '--version').length, 2);
  await clean(f);
});

test('importing the engine, including via a symlink, does not execute CLI or probe dependencies', {
  skip: !baseline,
}, async t => {
  const f = await fixture(t);
  const alias = join(f.root, 'import alias.mjs');
  await symlink(f.engine, alias);
  for (const entry of [f.engine, alias]) {
    const driver = join(f.root, 'import driver.mjs');
    await writeFile(driver, `
      const before = ['SIGINT', 'SIGTERM'].map(name => process.listenerCount(name));
      const engine = await import(${JSON.stringify(pathToFileURL(entry).href)});
      if (typeof engine.directoryAncestors !== 'function') throw new Error('Missing export');
      if (JSON.stringify(before) !== JSON.stringify(['SIGINT', 'SIGTERM'].map(name => process.listenerCount(name)))) {
        throw new Error('Import installed CLI signal handlers');
      }
      console.log('import-only');
    `);
    const result = spawnSync(process.execPath, [driver, 'https://example.test', '2'], {
      cwd: f.root, env: f.env, encoding: 'utf8', timeout: 15000,
    });
    assert.equal(result.error, undefined);
    assert.equal(result.status, 0, result.stderr);
    assert.equal(result.stdout.trim(), 'import-only');
    assert.equal(result.stderr, '');
    assert.deepEqual(await f.calls(), []);
    await assert.rejects(lstat(f.output), { code: 'ENOENT' });
  }
});

test('real fake executables preserve wget/pandoc arguments and outputs in spaced paths', { skip: !baseline }, async t => {
  const f = await fixture(t, { media: true });
  success(f.run(['https://example.test:8443/docs/', '03', 'https://example.test:8443/docs/(a|b); $(touch nope)']));
  const calls = await f.calls();
  assert.deepEqual(calls.slice(0, 2), [
    { tool: 'wget', args: ['--version'] }, { tool: 'pandoc', args: ['--version'] },
  ]);
  const wget = calls[2].args;
  assert.deepEqual(wget.slice(0, 8), ['-r', '-l', '03', '-k', '-E', '-e', 'robots=on', '-P']);
  assert.ok(wget[8].startsWith(join(f.output, '.download-site-')));
  assert.equal(calls[2].temporaryMode, 0o700);
  assert.deepEqual(wget.slice(9), [
    '-R', 'jpg,jpeg,gif,png,css,js,ico,svg,woff,woff2,ttf,eot',
    '--accept-regex=^https://example.test:8443/docs/(a|b); $(touch nope)',
    '--', 'https://example.test:8443/docs/',
  ]);
  const conversions = calls.filter(call => call.tool === 'pandoc' && call.args[0] !== '--version');
  assert.equal(conversions.length, 2);
  assert.deepEqual(conversions[0].args.slice(0, 4), ['--from', 'html', '--to', 'markdown_strict-raw_html']);
  assert.ok(conversions[0].args.some(arg => arg.startsWith('--extract-media=/')));
  assert.equal(await readFile(join(f.output, 'example.test:8443/docs/page with spaces.md'), 'utf8'), '# Fixture Markdown\n');
  assert.equal(await readFile(join(f.output, 'example.test:8443/index_media/image.txt'), 'utf8'), 'media');
  await assert.rejects(lstat(join(f.root, 'nope')), { code: 'ENOENT' });
  await clean(f);
});

test('default regex escapes exact domain/port, IPv6, empty prefix; depth 0 stays wget unlimited', { skip: !baseline }, async t => {
  const f = await fixture(t);
  for (const [url, expected] of [
    ['https://example.test:8080', '^https?://example\\.test:8080(/|$)'],
    ['https://example.test:8081', '^https?://example\\.test:8081(/|$)'],
    ['http://[::1]:8080', '^https?://\\[::1\\]:8080(/|$)'],
  ]) {
    success(f.run([url, '0', '']));
    const call = (await f.calls()).filter(c => c.tool === 'wget' && c.args[0] !== '--version').at(-1);
    assert.ok(call.args.includes(`--accept-regex=${expected}`));
    const regex = new RegExp(expected);
    assert.ok(regex.test(`${url}/docs/`));
    if (url.includes('example.test')) {
      assert.equal(regex.test(`${url.replace('example.test', 'example.test.evil')}/docs/`), false);
      assert.equal(regex.test(`${url.replace(/:\d+$/, ':9090')}/docs/`), false);
    }
    assert.equal(call.args[2], '0');
    assert.equal(await readFile(join(f.output, new URL(url).host, 'index.md'), 'utf8'), '# Fixture Markdown\n');
  }
  const downloads = (await f.calls()).filter(c => c.tool === 'wget' && c.args[0] !== '--version');
  assert.equal(new Set(downloads.map(c => c.args[c.args.indexOf('-P') + 1])).size, 3);
  await clean(f);
});

test('invalid parameters fail before any tool or filesystem effects', { skip: !baseline }, async t => {
  const f = await fixture(t);
  for (const args of [
    [], ['https://example.test'], ['https://example.test', '2', 'x', 'extra'],
    ['file:///tmp/x', '2'], ['not-a-url', '2'], ['https://fixture@example.test', '2'],
    ['https://example.test\n', '2'], ['https://example.test', '-1'],
    ['https://example.test', '2.5'], ['https://example.test', 'Infinity'],
    ['https://example.test', '2147483648'], ['https://example.test', '2', 'a\nb'],
  ]) failure(f.run(args), /Usage|Invalid/);
  assert.deepEqual(await f.calls(), []);
  await assert.rejects(lstat(f.output), { code: 'ENOENT' });
});

test('missing, non-executable and unusable dependencies are checked before effects', { skip: !baseline }, async t => {
  for (const kind of ['missing-wget', 'missing-pandoc', 'permission', 'version']) {
    await t.test(kind, async t => {
      const f = await fixture(t, { versionFailure: kind === 'version' ? 'pandoc' : undefined });
      if (kind.startsWith('missing-')) await rm(join(f.bin, kind.slice(8)));
      if (kind === 'permission') await chmod(join(f.bin, 'pandoc'), 0o644);
      failure(f.run(), /not installed|not executable|exit 9/);
      assert.equal((await f.calls()).some(call => call.args[0] !== '--version'), false);
      await assert.rejects(lstat(f.output), { code: 'ENOENT' });
      await clean(f);
    });
  }
});

test('download, individual conversion, missing output and no HTML failures never succeed or publish', { skip: !baseline }, async t => {
  for (const [config, expected] of [
    [{ failure: 'wget' }, /exit 7/],
    [{ failure: 'pandoc' }, /2 conversion\(s\) failed/],
    [{ failPage: 'index.html' }, /Conversion failed for example.test\/index.html/],
    [{ noOutput: true }, /conversion\(s\) failed/],
    [{ html: [] }, /No HTML files/],
  ]) {
    await t.test(JSON.stringify(config), async t => {
      const f = await fixture(t, config);
      failure(f.run(), expected);
      await assert.rejects(lstat(join(f.output, 'example.test')), { code: 'ENOENT' });
      if (config.failure === 'pandoc') {
        assert.equal((await f.calls()).filter(c => c.tool === 'pandoc' && c.args[0] !== '--version').length, 2);
      }
      await clean(f);
    });
  }
});

test('existing output files, directories, media and symlinks conflict without modification', { skip: !baseline }, async t => {
  for (const kind of ['file', 'empty-directory', 'markdown', 'media', 'symlink', 'dangling-symlink']) {
    await t.test(kind, async t => {
      const f = await fixture(t, { media: true });
      await mkdir(f.output, { recursive: true });
      const site = join(f.output, 'example.test');
      if (kind === 'file') await writeFile(site, 'existing user file');
      else if (kind.includes('symlink')) {
        await symlink(kind === 'symlink' ? f.outside : join(f.outside, 'absent'), site);
      } else {
        await mkdir(site);
        if (kind === 'markdown') await writeFile(join(site, 'index.md'), 'original markdown');
        if (kind === 'media') {
          await mkdir(join(site, 'index_media'));
          await writeFile(join(site, 'index_media/image.txt'), 'original media');
        }
      }
      const before = await lstat(site);
      failure(f.run(), /Output conflict/);
      assert.equal((await lstat(site)).ino, before.ino);
      if (kind === 'file') assert.equal(await readFile(site, 'utf8'), 'existing user file');
      if (kind === 'markdown') assert.equal(await readFile(join(site, 'index.md'), 'utf8'), 'original markdown');
      if (kind === 'media') assert.equal(await readFile(join(site, 'index_media/image.txt'), 'utf8'), 'original media');
      if (kind === 'empty-directory') assert.deepEqual(await readdir(site), []);
      await clean(f);
    });
  }
});

test('internal output-name collision fails conversion and publishes nothing', { skip: !baseline }, async t => {
  const f = await fixture(t, { html: ['example.test/a.html', 'example.test/a.md/nested.html'] });
  failure(f.run(), /conversion\(s\) failed/);
  await assert.rejects(lstat(join(f.output, 'example.test')), { code: 'ENOENT' });
  await clean(f);
});

test('all domain conflicts are reported before publishing any domain', { skip: !baseline }, async t => {
  const f = await fixture(t, { html: ['a.test/index.html', 'b.test/index.html', 'c.test/index.html'] });
  await mkdir(join(f.output, 'a.test'), { recursive: true });
  await mkdir(join(f.output, 'b.test'));
  const result = f.run();
  failure(result, /Output conflict/);
  assert.ok(result.stderr.includes(join(f.output, 'a.test')));
  assert.ok(result.stderr.includes(join(f.output, 'b.test')));
  assert.deepEqual(await readdir(join(f.output, 'a.test')), []);
  assert.deepEqual(await readdir(join(f.output, 'b.test')), []);
  await assert.rejects(lstat(join(f.output, 'c.test')), { code: 'ENOENT' });
  await clean(f);
});

test('symlink output ancestor and symlinks in downloaded/converted trees cannot escape', { skip: !baseline }, async t => {
  for (const kind of ['ancestor', 'download', 'staging']) {
    await t.test(kind, async t => {
      const f = await fixture(t, {
        downloadSymlink: kind === 'download', stagingSymlink: kind === 'staging',
      });
      if (kind === 'ancestor') await symlink(f.outside, f.output);
      failure(f.run(), /symlink|Symlink/);
      assert.deepEqual(await readdir(f.outside), ['sentinel']);
      if (kind === 'ancestor') {
        assert.equal((await f.calls()).some(c => c.args[0] !== '--version'), false);
      } else await clean(f);
    });
  }
});

test('unwritable output fails and the historical shared temp is untouched', { skip: !baseline }, async t => {
  const f = await fixture(t);
  await mkdir(f.output, { recursive: true });
  const old = join(f.output, '_TMP');
  await mkdir(old);
  await writeFile(join(old, 'user-file'), 'keep');
  success(f.run());
  assert.equal(await readFile(join(old, 'user-file'), 'utf8'), 'keep');
  await clean(f);
  if (process.getuid?.() === 0) {
    t.diagnostic('Permission denial subcase cannot be tested as root');
    return;
  }
  await chmod(f.output, 0o500);
  try {
    const callsBefore = (await f.calls()).length;
    failure(f.run(['https://other.test', '2']), /EACCES|permission/i);
    assert.equal((await f.calls()).slice(callsBefore).some(c => c.args[0] !== '--version'), false);
  } finally { await chmod(f.output, 0o700); }
  await clean(f);
});

test('preexisting temp-like directories are not reused or cleaned', { skip: !baseline }, async t => {
  const f = await fixture(t);
  const userTemp = join(f.output, '.download-site-user-data');
  await mkdir(userTemp, { recursive: true });
  await writeFile(join(userTemp, 'sentinel'), 'keep');
  success(f.run());
  assert.equal(await readFile(join(userTemp, 'sentinel'), 'utf8'), 'keep');
  assert.deepEqual((await readdir(f.output)).sort(), ['.download-site-user-data', 'example.test']);
  const download = (await f.calls()).find(c => c.tool === 'wget' && c.args[0] !== '--version');
  assert.notEqual(dirname(download.args[download.args.indexOf('-P') + 1]), userTemp);
});

test('cleanup failure is explicit and suppresses success even after publication', {
  skip: !baseline || process.getuid?.() === 0,
}, async t => {
  const f = await fixture(t, { html: ['example.test/index.html'], cleanupBlock: true });
  const result = f.run();
  const leftovers = (await readdir(f.output)).filter(name => name.startsWith('.download-site-'));
  // Restore only the fixture directory whose permissions the fake changed,
  // so the test's own teardown can clean its private workspace.
  for (const name of leftovers) {
    await chmod(join(f.output, name, 'download/example.test'), 0o700);
  }
  failure(result, /Cleanup failed/);
  assert.equal(leftovers.length, 1);
  assert.equal(await readFile(join(f.output, 'example.test/index.md'), 'utf8'), '# Fixture Markdown\n');
});

test('SIGTERM aborts the child, reports failure and cleans only the owned staging directory', { skip: !baseline, timeout: 20000 }, async t => {
  const f = await fixture(t, { wait: true });
  const child = spawn(process.execPath, [f.engine, 'https://example.test', '2'], {
    cwd: f.root, env: f.env, stdio: ['ignore', 'pipe', 'pipe'],
  });
  let stdout = '';
  let stderr = '';
  child.stdout.on('data', data => { stdout += data; });
  child.stderr.on('data', data => { stderr += data; });
  t.after(() => { if (child.exitCode === null) child.kill('SIGKILL'); });
  const closed = new Promise(resolve => child.once('close', code => resolve(code)));
  let ready = false;
  for (let attempt = 0; attempt < 200; attempt++) {
    try { await lstat(f.env.FAKE_READY); ready = true; break; } catch { /* Wait for fixture download. */ }
    await new Promise(resolve => setTimeout(resolve, 25));
  }
  assert.ok(ready, stderr);
  child.kill('SIGTERM');
  assert.equal(await closed, 1);
  assert.match(stderr, /Error:/);
  assert.doesNotMatch(stdout, /Download and conversion complete:/);
  await clean(f);
});
