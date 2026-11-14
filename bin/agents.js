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

/**
 * Decide the target agents without asking anything.
 *
 * Returns `{ agents, source }` when the decision is already made, `{ prompt: true }`
 * when the user has to choose, or `{ error }` when the request cannot be honoured.
 */
export function resolveAgents({ options, supported, detected, interactive }) {
  const known = new Set(supported.map((agent) => agent.id));

  if (options.agents.length > 0) {
    const unknown = options.agents.filter((id) => !known.has(id));
    if (unknown.length > 0) {
      return { error: `Unknown agent${unknown.length > 1 ? 's' : ''}: ${unknown.join(', ')}` };
    }
    return { agents: options.agents, source: 'explicit' };
  }

  const detectedIds = detected.map((agent) => agent.id);

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
    return { agents: ['claude-code'], source: 'default' };
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
  const restOptions = supported
    .filter((agent) => !POPULAR_AGENTS.includes(agent.id) && !detectedIds.has(agent.id))
    .map(toOption);

  return {
    detected: detectedOptions,
    popular: popularOptions,
    rest: restOptions,
    all: supported.map(toOption),
  };
}

/** Ask the user which agents to install into. Returns the chosen agent ids. */
export async function promptForAgents(supported, detected, prompts) {
  const choices = buildAgentChoices(supported, detected);
  const initialValues = choices.detected.map((option) => option.value);

  const first = await prompts.groupMultiselect({
    message: 'Install the skills into which agents?',
    options: {
      'Detected on this machine': choices.detected,
      Popular: choices.popular,
      More: [{ value: SHOW_ALL, label: 'Show every supported agent' }],
    },
    initialValues,
    required: false,
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
    required: false,
  });

  return second;
}
