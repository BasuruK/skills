import { diagnostics, isDiagnostic } from 'skills';

/**
 * Every diagnostic code the skills library can raise.
 *
 * `isDiagnostic(error)` without a code always returns false — the check is
 * `codes.some(code => code === error.code)`, and an empty list never matches.
 * Passing the whole catalog makes the check code-list independent.
 */
const DIAGNOSTIC_CODES = Object.keys(diagnostics);

export function isSkillsDiagnostic(error) {
  return isDiagnostic(error, ...DIAGNOSTIC_CODES);
}

/**
 * Turn an error into what the user should read: the message, plus the fix the
 * library suggests when there is one.
 */
export function formatError(error) {
  if (isSkillsDiagnostic(error)) {
    return { message: error.message, fix: error.fix };
  }

  return { message: error instanceof Error ? error.message : String(error), fix: undefined };
}
