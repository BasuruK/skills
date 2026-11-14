import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  detectAgents,
  getSupportedAgents,
  installSkills,
  isDiagnostic,
  resolveSource,
} from 'skills';
import { promptForAgents, resolveAgents } from './agents.js';

const pkgRoot = path.dirname(path.dirname(fileURLToPath(import.meta.url)));

/** The GitHub source, for installs that `npx skills update` should be able to track. */
export const GITHUB_SOURCE = 'BasuruK/skills';

/**
 * Install the skills in this package.
 *
 * Returns the process exit code. `prompts` is the @clack/prompts module, passed
 * in so the flow can be driven without a terminal.
 */
export async function run(options, { prompts, log = console.log, cwd = process.cwd(), interactive } = {}) {
  const supported = getSupportedAgents();
  const detected = (await detectAgents({ cwd })).agents;

  const source = options.fromGithub ? GITHUB_SOURCE : pkgRoot;
  const resolved = await resolveSource(source, { cwd });

  try {
    if (options.list) {
      for (const skill of resolved.skills) {
        log(`- ${skill.name} — ${skill.description}`);
      }
      return 0;
    }

    const available = resolved.skills.map((skill) => skill.name);
    const wanted = options.skills.length > 0 ? options.skills : available;
    const unknown = wanted.filter((name) => !available.includes(name));
    if (unknown.length > 0) {
      throw new Error(
        `Unknown skill${unknown.length > 1 ? 's' : ''}: ${unknown.join(', ')}. Available: ${available.join(', ')}`,
      );
    }

    const decision = resolveAgents({
      options,
      supported,
      detected,
      interactive:
        interactive ?? (Boolean(prompts) && process.stdin.isTTY && process.stdout.isTTY),
    });

    if (decision.error) {
      throw new Error(decision.error);
    }

    let agents = decision.agents;
    if (decision.prompt) {
      const picked = await promptForAgents(supported, detected, prompts);
      if (prompts.isCancel(picked)) {
        return 130;
      }
      if (picked.length === 0) {
        throw new Error('No agents selected.');
      }
      agents = picked;
    }

    const result = await installSkills(resolved, {
      cwd,
      skills: wanted,
      agents,
      scope: options.global ? 'global' : 'project',
      mode: options.copy ? 'copy' : 'auto',
      lockfile: true,
      telemetry: false,
      onWarning: (warning) => log(`warning: ${warning.message}`),
    });

    report(result, { log, scope: options.global ? 'global' : 'project' });

    if (!options.fromGithub) {
      log(
        'Installed from the package on disk. Run with --from-github if you want "npx skills update" to track it.',
      );
    }

    return result.failed.length > 0 ? 1 : 0;
  } finally {
    await resolved.dispose();
  }
}

function report(result, { log, scope }) {
  if (result.installed.length === 0) {
    log('Nothing was installed.');
    return;
  }

  for (const target of result.installed) {
    log(`✓ ${target.skill} → ${target.agent} (${target.path})`);
  }

  for (const skipped of result.skipped) {
    log(`skipped ${skipped.skill} for ${skipped.agent}: ${skipped.reason}`);
  }

  for (const failure of result.failed) {
    log(`✗ ${failure.skill} → ${failure.agent}: ${failure.message}`);
  }

  log(`Installed ${result.installed.length} skill${result.installed.length === 1 ? '' : 's'} (${scope}).`);
}

export { isDiagnostic };
