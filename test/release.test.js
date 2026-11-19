import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { mkdtempSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { test } from 'node:test';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const scriptPath = join(root, 'scripts', 'release.mjs');
const releaseScript = pathToFileURL(scriptPath).href;

function fixture(t) {
  const dir = mkdtempSync(join(tmpdir(), 'release-test-'));
  t.after(() => rmSync(dir, { recursive: true, force: true }));
  mkdirSync(join(dir, '.claude-plugin'));
  mkdirSync(join(dir, '.codex-plugin'));
  for (const file of ['package.json', '.claude-plugin/plugin.json', '.codex-plugin/plugin.json']) {
    writeFileSync(join(dir, file), JSON.stringify({ version: '1.0.0' }));
  }
  writeFileSync(join(dir, 'package-lock.json'), JSON.stringify({ version: '1.0.0', packages: { '': { version: '1.0.0' } } }));
  return dir;
}

for (const command of ['bump', 'release-pr']) {
  for (const version of ['', '01.2.3', '1.02.3', '1.2.03', '9007199254740992.0.0', '1.2.3\n', '1.2', '1.2.3-beta']) {
    test(`${command} rejects invalid version ${JSON.stringify(version)}`, (t) => {
      const dir = fixture(t);
      const result = spawnSync(process.execPath, [scriptPath, command, version], { cwd: dir, encoding: 'utf8' });
      assert.equal(result.status, 1, result.stderr);
      assert.match(result.stderr, /usage: make/);
      assert.equal(JSON.parse(readFileSync(join(dir, 'package.json'), 'utf8')).version, '1.0.0');
    });
  }
}

for (const version of ['0.0.0', '2.2.2', '9007199254740991.0.0']) {
  test(`bump accepts ${version} and updates all manifests`, (t) => {
    const dir = fixture(t);
    const result = spawnSync(process.execPath, [scriptPath, 'bump', version], { cwd: dir, encoding: 'utf8' });
    assert.equal(result.status, 0, result.stderr);
    for (const file of ['package.json', 'package-lock.json', '.claude-plugin/plugin.json', '.codex-plugin/plugin.json']) {
      assert.equal(JSON.parse(readFileSync(join(dir, file), 'utf8')).version, version);
    }
    assert.equal(JSON.parse(readFileSync(join(dir, 'package-lock.json'), 'utf8')).packages[''].version, version);
  });
}

test('release-pr performs the expected workflow with valid input', (t) => {
  const dir = fixture(t);
  const code = `
    import childProcess from 'node:child_process';
    import { syncBuiltinESMExports } from 'node:module';
    childProcess.spawnSync = (command, args) => {
      console.log(JSON.stringify([command, ...args]));
      return { status: 0, stdout: args[0] === 'branch' ? 'main' : args[0] === 'rev-parse' ? 'same-commit' : '' };
    };
    syncBuiltinESMExports();
    process.argv = ['node', 'release.mjs', 'release-pr', '2.2.2'];
    await import(${JSON.stringify(releaseScript)});
  `;
  const result = spawnSync(process.execPath, ['--input-type=module', '-e', code], { cwd: dir, encoding: 'utf8' });
  assert.equal(result.status, 0, result.stderr);
  assert.match(result.stdout, /"checkout","-q","-b","release\/2\.2\.2"/);
  assert.match(result.stdout, /"push","-q","-u","origin","release\/2\.2\.2"/);
  assert.match(result.stdout, /"gh","pr","create"/);
  assert.equal(JSON.parse(readFileSync(join(dir, 'package.json'), 'utf8')).version, '2.2.2');
});

for (const [scenario, error] of [
  ['unstaged', /working tree is dirty/],
  ['staged', /working tree is dirty/],
  ['non-main', /not on main/],
  ['different-revisions', /HEAD is not origin\/main/],
]) {
  test(`release-pr rejects ${scenario} without changing anything`, (t) => {
    const dir = fixture(t);
    const files = ['package.json', 'package-lock.json', '.claude-plugin/plugin.json', '.codex-plugin/plugin.json'];
    const before = files.map(file => readFileSync(join(dir, file), 'utf8'));
    const code = `
      import childProcess from 'node:child_process';
      import { syncBuiltinESMExports } from 'node:module';
      const scenario = ${JSON.stringify(scenario)};
      childProcess.spawnSync = (command, args) => {
        console.log(JSON.stringify([command, ...args]));
        const staged = args.includes('--cached');
        const dirty = args[0] === 'diff' && ((scenario === 'unstaged' && !staged) || (scenario === 'staged' && staged));
        const stdout = args[0] === 'branch' ? (scenario === 'non-main' ? 'feature' : 'main')
          : args[0] === 'rev-parse' ? (scenario === 'different-revisions' && args[1] === 'origin/main' ? 'remote' : 'local') : '';
        return { status: dirty ? 1 : 0, stdout };
      };
      syncBuiltinESMExports();
      process.argv = ['node', 'release.mjs', 'release-pr', '2.2.2'];
      await import(${JSON.stringify(releaseScript)});
    `;
    const result = spawnSync(process.execPath, ['--input-type=module', '-e', code], { cwd: dir, encoding: 'utf8' });
    assert.equal(result.status, 1, result.stderr);
    assert.match(result.stderr, error);
    assert.deepEqual(files.map(file => readFileSync(join(dir, file), 'utf8')), before);
    const commands = result.stdout.trim().split('\n').map(line => JSON.parse(line));
    assert.ok(commands.some(([command, subcommand]) => command === 'git' && subcommand === 'diff'));
    assert.ok(commands.every(([command, subcommand]) => command !== 'gh' && !(command === 'git' && ['checkout', 'push'].includes(subcommand))));
  });
}

for (const [value, expected] of [['', 'false'], ['1', 'true'], ['true', 'true'], [' ', 'false']]) {
  test(`release signing setting ${JSON.stringify(value)}`, () => {
    const code = `
      import childProcess from 'node:child_process';
      import { syncBuiltinESMExports } from 'node:module';
      childProcess.spawnSync = (command, args) => {
        if (args[0] === '-c') console.log(args[1]);
        return { status: args[0] === 'rev-parse' ? 1 : 0, stdout: args[0] === 'branch' ? 'main' : '' };
      };
      syncBuiltinESMExports();
      process.argv = ['node', 'release.mjs', 'release', '', ${JSON.stringify(value)}];
      await import(${JSON.stringify(releaseScript)});
    `;
    const result = spawnSync(process.execPath, ['--input-type=module', '-e', code], {
      cwd: root,
      encoding: 'utf8',
    });
    assert.equal(result.status, 0, result.stderr);
    assert.match(result.stdout, new RegExp(`tag\\.gpgSign=${expected}\\b`));
  });
}
