import assert from 'node:assert/strict';
import test from 'node:test';
import { diagnostics } from 'skills';
import { formatError, isSkillsDiagnostic } from '../bin/errors.js';

test('recognises any skills diagnostic, not only a named code', () => {
  assert.equal(isSkillsDiagnostic(diagnostics.SKILLS_NO_TARGET_AGENTS()), true);
  assert.equal(isSkillsDiagnostic(new Error('not a diagnostic')), false);
});

test('formatError keeps the fix the library suggests', () => {
  const { message, fix } = formatError(diagnostics.SKILLS_NO_TARGET_AGENTS());
  assert.match(message, /No allowed agents/);
  assert.match(fix, /config\.agents/);
});

test('formatError falls back to the error message', () => {
  const { message, fix } = formatError(new Error('boom'));
  assert.equal(message, 'boom');
  assert.equal(fix, undefined);
});
