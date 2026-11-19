import { readFileSync, writeFileSync } from 'node:fs';
import { spawnSync } from 'node:child_process';

const files = {
  package: 'package.json',
  lock: 'package-lock.json',
  claude: '.claude-plugin/plugin.json',
  codex: '.codex-plugin/plugin.json',
};
const semverPattern = /^(?:0|[1-9]\d*)\.(?:0|[1-9]\d*)\.(?:0|[1-9]\d*)(?![\s\S])/;

function fail(message) {
  console.error(message);
  process.exit(1);
}

function run(command, args, options = {}) {
  const result = spawnSync(command, args, { encoding: 'utf8', stdio: 'inherit', ...options });
  if (result.error) fail(`${command}: ${result.error.message}`);
  if (result.status !== 0) process.exit(result.status ?? 1);
  return result.stdout?.trim() ?? '';
}

function gitOutput(...args) {
  return run('git', args, { stdio: ['ignore', 'pipe', 'inherit'] });
}

function requireCleanTree(includeStaged = false) {
  const dirty = spawnSync('git', ['diff', '--quiet'], { stdio: 'ignore' }).status !== 0;
  const staged = includeStaged && spawnSync('git', ['diff', '--cached', '--quiet'], { stdio: 'ignore' }).status !== 0;
  if (dirty || staged) fail('working tree is dirty — commit or stash first');
}

function requestedVersion(value, usage) {
  if (!semverPattern.test(value ?? '') || !value.split('.').every(part => Number.isSafeInteger(Number(part)))) {
    fail(`usage: ${usage}`);
  }
  return value;
}

function readJson(file) {
  return JSON.parse(readFileSync(file, 'utf8'));
}

function writeJson(file, value) {
  writeFileSync(file, `${JSON.stringify(value, null, 2)}\n`);
}

function bump(version) {
  requestedVersion(version, 'make bump 2.2.0');
  const pkg = readJson(files.package);
  const lock = readJson(files.lock);
  const claude = readJson(files.claude);
  const codex = readJson(files.codex);

  pkg.version = version;
  lock.version = version;
  if (lock.packages?.['']) lock.packages[''].version = version;
  claude.version = version;
  codex.version = version;

  writeJson(files.package, pkg);
  writeJson(files.lock, lock);
  writeJson(files.claude, claude);
  writeJson(files.codex, codex);
  console.log(`bumped to ${version} — commit, merge, then: make release ${version}`);
}

function releasePr(version) {
  requestedVersion(version, 'make release-pr 2.2.0');
  requireCleanTree(true);
  if (gitOutput('branch', '--show-current') !== 'main') fail('not on main — switch first');
  run('git', ['fetch', '-q', 'origin', 'main']);
  if (gitOutput('rev-parse', 'HEAD') !== gitOutput('rev-parse', 'origin/main')) {
    fail('HEAD is not origin/main — pull first');
  }

  const branch = `release/${version}`;
  run('git', ['checkout', '-q', '-b', branch]);
  bump(version);
  run('git', ['add', files.package, files.lock, files.claude, files.codex]);
  run('git', ['commit', '-q', '-m', `chore: bump version to ${version}`]);
  run('git', ['push', '-q', '-u', 'origin', branch]);
  run('gh', [
    'pr', 'create', '--base', 'main', '--title', `Release ${version}`,
    '--body', `Bumps the version to ${version} in package.json and both plugin manifests. After merge: \`make release ${version}\`.`,
  ]);
}

function release(requested, tagSign) {
  const claudeVersion = readJson(files.claude).version;
  const codexVersion = readJson(files.codex).version;
  const version = claudeVersion;
  const tag = `v${version}`;

  if (version !== codexVersion) {
    fail(`version mismatch: .claude-plugin/plugin.json has ${version}, .codex-plugin/plugin.json has ${codexVersion}`);
  }
  if (requested && requested !== version) {
    fail(`requested ${requested} does not match the manifest version ${version} — bump the manifests first`);
  }
  requireCleanTree();
  const branch = gitOutput('branch', '--show-current');
  if (branch !== 'main') fail(`not on main (on ${branch}) — merge first`);
  const diff = spawnSync('git', ['diff', '--quiet', 'origin/main', '--'], { stdio: 'ignore' });
  if (diff.status !== 0) fail('HEAD is not origin/main — push first');

  const existingTag = spawnSync('git', ['rev-parse', '-q', '--verify', `refs/tags/${tag}`], { stdio: 'ignore' });
  if (existingTag.status === 0) fail(`tag ${tag} already exists`);

  run('git', ['-c', `tag.gpgSign=${tagSign?.trim() ? 'true' : 'false'}`, 'tag', '-a', tag, '-m', `Release ${tag}`]);
  run('git', ['push', 'origin', tag]);
  console.log(`pushed ${tag} — users can pin it with: npx skills@latest add basuruk/skills@${tag}`);
}

const [command, version, tagSign] = process.argv.slice(2);
switch (command) {
  case 'bump':
    bump(version);
    break;
  case 'release-pr':
    releasePr(version);
    break;
  case 'release':
    release(version, tagSign);
    break;
  default:
    fail('usage: node scripts/release.mjs <bump|release-pr|release>');
}
