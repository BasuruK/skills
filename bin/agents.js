/**
 * Deciding which coding agents the skills should be installed into.
 *
 * `resolveAgents` is pure so the decision logic can be tested without a
 * terminal; `promptForAgents` is the interactive part.
 */

/** Agents offered up front, before the full list of supported agents. */
export const POPULAR_AGENTS = [
  'universal',
  'claude-code',
  'codex',
  'cursor',
  'opencode',
  'gemini-cli',
  'github-copilot',
  'windsurf',
  'amp',
  'qwen-code',
  'codebuddy',
  'roo',
  'trae',
  'zed',
  'goose',
  'continue',
];

const SHOW_ALL = '__show_all__';

/** Agents that can hold skills outside a project. */
function canInstallGlobally(agent) {
  return Boolean(agent.globalSkillsDir);
}

/**
 * Decide the target agents without asking anything.
 *
 * Returns `{ agents, source }` when the decision is already made, `{ prompt: true }`
 * when the user has to choose, or `{ error }` when the request cannot be honoured.
 */
export function resolveAgents({
  options,
  supported,
  detected,
  interactive,
  scope = 'project',
}) {
  const known = new Set(supported.map((agent) => agent.id));
  const usable = supported.filter(
    (agent) => scope !== 'global' || canInstallGlobally(agent),
  );
  const usableIds = usable.map((agent) => agent.id);

  if (options.agents.length > 0) {
    if (options.all) {
      return { error: '--all cannot be combined with --agent; pick one.' };
    }

    const unknown = options.agents.filter((id) => !known.has(id));
    if (unknown.length > 0) {
      return { error: `Unknown agent${unknown.length > 1 ? 's' : ''}: ${unknown.join(', ')}` };
    }

    const projectOnly = options.agents.filter((id) => !usableIds.includes(id));
    if (projectOnly.length > 0) {
      return {
        error: `${projectOnly.join(', ')} cannot be installed globally — it only reads skills from a project.`,
      };
    }

    return { agents: options.agents, source: 'explicit' };
  }

  const detectedIds = detected.map((agent) => agent.id).filter((id) => usableIds.includes(id));

  if (options.all) {
    if (detectedIds.length === 0) {
      return { error: 'No coding agents detected on this machine. Name one with --agent <id>.' };
    }
    return { agents: detectedIds, source: 'detected' };
  }

  if (options.yes || !interactive) {
    if (detectedIds.length > 0) {
      return { agents: detectedIds, source: 'detected' };
    }

    const fallback = usableIds.includes('claude-code') ? 'claude-code' : usableIds[0];
    if (!fallback) {
      return { error: 'No agents are supported by this version of the skills library.' };
    }
    return { agents: [fallback], source: 'default' };
  }

  // One agent on the machine needs no question asked.
  if (detectedIds.length === 1) {
    return { agents: detectedIds, source: 'detected' };
  }

  return { prompt: true };
}

/** Group the supported agents into what the picker shows first and what it hides. */
export function buildAgentChoices(supported, detected) {
  const detectedIds = new Set(detected.map((agent) => agent.id));
  const toOption = (agent) => ({
    value: agent.id,
    label: agent.name,
    hint: agent.projectSkillsDir,
  });

  const detectedOptions = supported
    .filter((agent) => detectedIds.has(agent.id))
    .map(toOption);
  const popularOptions = supported
    .filter((agent) => POPULAR_AGENTS.includes(agent.id) && !detectedIds.has(agent.id))
    .map(toOption);

  return {
    detected: detectedOptions,
    popular: popularOptions,
    all: supported.map(toOption),
  };
}

/** Ask the user which agents to install into. Returns the chosen agent ids. */
export async function promptForAgents(supported, detected, prompts, { scope = 'project' } = {}) {
  const usable = supported.filter(
    (agent) => scope !== 'global' || canInstallGlobally(agent),
  );
  const choices = buildAgentChoices(usable, detected);

  const first = await prompts.groupMultiselect({
    message: 'Install the skills into which agents?',
    options: {
      'Detected on this machine': choices.detected,
      Popular: choices.popular,
      'Show all': [{ value: SHOW_ALL, label: 'Show every supported agent' }],
    },
    // Nothing is ticked: the user picks, an Enter key does not pick for them.
    initialValues: [],
    // Start on a real agent, not on a group header: a space on a header
    // selects every agent in that group.
    cursorAt: choices.detected[0]?.value ?? choices.popular[0]?.value,
    required: true,
  });

  if (prompts.isCancel(first) || !Array.isArray(first)) {
    return first;
  }

  if (!first.includes(SHOW_ALL)) {
    return first;
  }

  const second = await prompts.groupMultiselect({
    message: 'Install the skills into which agents?',
    options: { 'Every supported agent': choices.all },
    initialValues: first.filter((id) => id !== SHOW_ALL),
    required: true,
  });

  return second;
}
