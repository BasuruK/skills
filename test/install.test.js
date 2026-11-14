import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';
import { chmod, mkdir, mkdtemp, readFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import test from 'node:test';
import { parseArgs } from '../bin/args.js';
import { run } from '../bin/install.js';

async function workspace() {
  return mkdtemp(path.join(tmpdir(), 'basuruk-skills-'));
}

function stubPrompts(selection) {
  return {
    groupMultiselect: async () => selection,
    isCancel: (value) => value === undefined || value === null,
  };
}

test('installs into an explicitly named agent', async () => {
  const cwd = await workspace();
  const logs = [];
  const code = await run(parseArgs(['--agent', 'claude-code']), {
    cwd,
    log: (line) => logs.push(line),
    interactive: false,
  });

  assert.equal(code, 0);
  assert.ok(existsSync(path.join(cwd, '.claude/skills/pair/SKILL.md')));
  assert.ok(logs.some((line) => line.includes('pair → claude-code')));
});

test('installs into every agent the user picks', async () => {
  const cwd = await workspace();
  const code = await run(parseArgs([]), {
    cwd,
    prompts: stubPrompts(['claude-code', 'codex']),
    log: () => {},
    interactive: true,
  });

  assert.equal(code, 0);
  assert.ok(existsSync(path.join(cwd, '.claude/skills/pair/SKILL.md')));
  assert.ok(existsSync(path.join(cwd, '.agents/skills/pair/SKILL.md')));
});

test('returns 130 when the picker is cancelled', async () => {
  const cwd = await workspace();
  const code = await run(parseArgs([]), {
    cwd,
    prompts: stubPrompts(undefined),
    log: () => {},
    interactive: true,
  });

  assert.equal(code, 130);
  assert.equal(existsSync(path.join(cwd, '.claude/skills/pair')), false);
});

test('refuses to install when no agent is picked', async () => {
  const cwd = await workspace();
  await assert.rejects(
    run(parseArgs([]), { cwd, prompts: stubPrompts([]), interactive: true }),
    /No agents selected/,
  );
});

test('refuses an unknown skill name', async () => {
  const cwd = await workspace();
  await assert.rejects(
    run(parseArgs(['--skill', 'nope']), { cwd, log: () => {}, interactive: false }),
    /Unknown skill: nope/,
  );
});

test('lists the skills in the package', async () => {
  const cwd = await workspace();
  const logs = [];
  const code = await run(parseArgs(['--list']), { cwd, log: (line) => logs.push(line) });

  assert.equal(code, 0);
  assert.ok(logs.some((line) => line.startsWith('- pair')));
});

test('installs only the requested skill', async () => {
  const cwd = await workspace();
  const code = await run(parseArgs(['--skill', 'pair', '--agent', 'claude-code']), {
    cwd,
    log: () => {},
    interactive: false,
  });

  assert.equal(code, 0);
  const installed = await readFile(path.join(cwd, '.claude/skills/pair/SKILL.md'), 'utf8');
  assert.match(installed, /name: pair/);
});

test('reports the failure when nothing was installed', async (t) => {
  if (typeof process.getuid === 'function' && process.getuid() === 0) {
    t.skip('root ignores directory permissions');
    return;
  }

  const cwd = await workspace();
  const skillsDir = path.join(cwd, '.claude/skills');
  await mkdir(skillsDir, { recursive: true });
  await chmod(skillsDir, 0o555);

  const logs = [];
  try {
    const code = await run(parseArgs(['--agent', 'claude-code']), {
      cwd,
      log: (line) => logs.push(line),
      interactive: false,
    });

    assert.equal(code, 1);
    assert.ok(
      logs.some((line) => line.startsWith('✗')),
      `the failure is reported, got: ${logs.join(' | ')}`,
    );
    assert.ok(logs.some((line) => line.includes('Nothing was installed.')));
  } finally {
    await chmod(skillsDir, 0o755);
  }
});
