import assert from 'node:assert/strict';
import test from 'node:test';
import { parseArgs } from '../bin/args.js';
import { buildAgentChoices, resolveAgents } from '../bin/agents.js';

const supported = [
  { id: 'claude-code', name: 'Claude Code', projectSkillsDir: '.claude/skills/', globalSkillsDir: '/home/x/.claude/skills' },
  { id: 'codex', name: 'Codex', projectSkillsDir: '.agents/skills/', globalSkillsDir: '/home/x/.agents/skills' },
  { id: 'cursor', name: 'Cursor', projectSkillsDir: '.agents/skills/', globalSkillsDir: '/home/x/.cursor/skills' },
  { id: 'eve', name: 'Eve', projectSkillsDir: 'agent/skills/', globalSkillsDir: null },
];

const detected = [
  { id: 'codex', name: 'Codex', projectSkillsDir: '.agents/skills/' },
  { id: 'cursor', name: 'Cursor', projectSkillsDir: '.agents/skills/' },
];

test('parseArgs returns sensible defaults', () => {
  const options = parseArgs([]);
  assert.equal(options.global, false);
  assert.deepEqual(options.agents, []);
  assert.deepEqual(options.skills, []);
  assert.equal(options.all, false);
  assert.equal(options.list, false);
  assert.equal(options.copy, false);
  assert.equal(options.yes, false);
  assert.equal(options.help, false);
  assert.equal(options.fromGithub, false);
});

test('parseArgs reads the global flag in both forms', () => {
  assert.equal(parseArgs(['-g']).global, true);
  assert.equal(parseArgs(['--global']).global, true);
});

test('parseArgs collects repeated agents and skills', () => {
  const options = parseArgs(['-a', 'claude-code', '--agent', 'codex', '-s', 'pair']);
  assert.deepEqual(options.agents, ['claude-code', 'codex']);
  assert.deepEqual(options.skills, ['pair']);
});

test('parseArgs takes several names after one flag', () => {
  const options = parseArgs(['-a', 'claude-code', 'codex', '-s', 'pair']);
  assert.deepEqual(options.agents, ['claude-code', 'codex']);
  assert.deepEqual(options.skills, ['pair']);
});

test('parseArgs accepts --agent=value', () => {
  assert.deepEqual(parseArgs(['--agent=cursor']).agents, ['cursor']);
});

test('parseArgs drops repeated names', () => {
  const options = parseArgs(['-a', 'codex', '--agent', 'codex', '-s', 'pair', '--skill', 'pair']);
  assert.deepEqual(options.agents, ['codex']);
  assert.deepEqual(options.skills, ['pair']);
});

test('parseArgs rejects unknown options', () => {
  assert.throws(() => parseArgs(['--nope']), /Unknown option: --nope/);
});

test('parseArgs rejects a value option with no value', () => {
  assert.throws(() => parseArgs(['--agent']), /--agent needs a value/);
});

test('parseArgs does not swallow the next option as a value', () => {
  assert.throws(() => parseArgs(['--agent', '--all']), /--agent needs a value/);
});

test('parseArgs rejects a boolean option with a value', () => {
  assert.throws(() => parseArgs(['--global=yes']), /--global does not take a value/);
});

test('resolveAgents honours explicitly named agents', () => {
  const decision = resolveAgents({
    options: parseArgs(['-a', 'claude-code']),
    supported,
    detected,
    interactive: true,
  });
  assert.deepEqual(decision.agents, ['claude-code']);
  assert.equal(decision.source, 'explicit');
});

test('resolveAgents rejects an unknown agent', () => {
  const decision = resolveAgents({
    options: parseArgs(['-a', 'nope']),
    supported,
    detected,
    interactive: true,
  });
  assert.match(decision.error, /Unknown agent: nope/);
});

test('resolveAgents rejects --all together with --agent', () => {
  const decision = resolveAgents({
    options: parseArgs(['--all', '-a', 'claude-code']),
    supported,
    detected,
    interactive: true,
  });
  assert.match(decision.error, /--all cannot be combined with --agent/);
});

test('resolveAgents refuses a project-only agent for a global install', () => {
  const decision = resolveAgents({
    options: parseArgs(['-a', 'eve', '--global']),
    supported,
    detected,
    interactive: true,
    scope: 'global',
  });
  assert.match(decision.error, /eve cannot be installed globally/);
});

test('resolveAgents uses the detected agents for --all', () => {
  const decision = resolveAgents({
    options: parseArgs(['--all']),
    supported,
    detected,
    interactive: true,
  });
  assert.deepEqual(decision.agents, ['codex', 'cursor']);
  assert.equal(decision.source, 'detected');
});

test('resolveAgents falls back to claude-code when nothing is detected', () => {
  const decision = resolveAgents({
    options: parseArgs(['--yes']),
    supported,
    detected: [],
    interactive: false,
  });
  assert.deepEqual(decision.agents, ['claude-code']);
  assert.equal(decision.source, 'default');
});

test('resolveAgents asks the user when nothing else decides', () => {
  const decision = resolveAgents({
    options: parseArgs([]),
    supported,
    detected,
    interactive: true,
  });
  assert.equal(decision.prompt, true);
  assert.equal(decision.agents, undefined);
});

test('resolveAgents does not ask when one agent is installed', () => {
  const decision = resolveAgents({
    options: parseArgs([]),
    supported,
    detected: [{ id: 'claude-code' }],
    interactive: true,
  });
  assert.deepEqual(decision.agents, ['claude-code']);
  assert.equal(decision.source, 'detected');
});

test('buildAgentChoices groups detected and popular agents', () => {
  const choices = buildAgentChoices(supported, detected);
  assert.deepEqual(
    choices.detected.map((option) => option.value),
    ['codex', 'cursor'],
  );
  assert.ok(choices.popular.some((option) => option.value === 'claude-code'));
  assert.equal(choices.all.length, supported.length);
  assert.equal(choices.detected[0].hint, '.agents/skills/');
});
