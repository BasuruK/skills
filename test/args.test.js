import assert from 'node:assert/strict';
import test from 'node:test';
import { parseArgs } from '../bin/args.js';
import { buildAgentChoices, resolveAgents } from '../bin/agents.js';

const supported = [
  { id: 'claude-code', name: 'Claude Code', projectSkillsDir: '.claude/skills/' },
  { id: 'codex', name: 'Codex', projectSkillsDir: '.agents/skills/' },
  { id: 'cursor', name: 'Cursor', projectSkillsDir: '.agents/skills/' },
  { id: 'aider-desk', name: 'AiderDesk', projectSkillsDir: '.aider-desk/skills/' },
];

const detected = [{ id: 'codex', name: 'Codex', projectSkillsDir: '.agents/skills/' }];

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

test('parseArgs accepts --agent=value', () => {
  assert.deepEqual(parseArgs(['--agent=cursor']).agents, ['cursor']);
});

test('parseArgs rejects unknown options', () => {
  assert.throws(() => parseArgs(['--nope']), /Unknown option: --nope/);
});

test('parseArgs rejects a value option with no value', () => {
  assert.throws(() => parseArgs(['--agent']), /--agent needs a value/);
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

test('resolveAgents uses the detected agents for --all', () => {
  const decision = resolveAgents({
    options: parseArgs(['--all']),
    supported,
    detected,
    interactive: true,
  });
  assert.deepEqual(decision.agents, ['codex']);
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

test('buildAgentChoices groups detected, popular and the rest', () => {
  const choices = buildAgentChoices(supported, detected);
  assert.deepEqual(
    choices.detected.map((option) => option.value),
    ['codex'],
  );
  assert.ok(choices.popular.some((option) => option.value === 'claude-code'));
  assert.ok(choices.rest.some((option) => option.value === 'aider-desk'));
  assert.equal(choices.all.length, supported.length);
  assert.equal(choices.detected[0].hint, '.agents/skills/');
});
