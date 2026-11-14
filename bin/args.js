/**
 * Command line parsing for the skills installer.
 *
 * Kept free of side effects so it can be unit tested without a terminal.
 */

const VALUE_OPTIONS = new Map([
  ['-a', 'agents'],
  ['--agent', 'agents'],
  ['-s', 'skills'],
  ['--skill', 'skills'],
]);

const BOOLEAN_OPTIONS = new Map([
  ['-g', 'global'],
  ['--global', 'global'],
  ['--all', 'all'],
  ['-l', 'list'],
  ['--list', 'list'],
  ['--copy', 'copy'],
  ['-y', 'yes'],
  ['--yes', 'yes'],
  ['-h', 'help'],
  ['--help', 'help'],
  ['--from-github', 'fromGithub'],
]);

export const HELP = `Usage: npx @basuruk/skills [options]

Installs the skills in this package into the coding agents of your choice.

Options:
  -g, --global          install for the current user instead of the project
  -a, --agent <id...>   target agents, e.g. claude-code codex
  -s, --skill <name...> install only these skills; default: all
      --all             install into every detected agent, without prompting
      --copy            copy files instead of symlinking them
      --from-github     install from the BasuruK/skills repository instead of
                        this package, so 'npx skills update' can track it
  -l, --list            list the skills in this package and exit
  -y, --yes             accept the defaults, never prompt
  -h, --help            show this help

Run it without arguments for an interactive picker.
`;

export function parseArgs(argv) {
  const options = {
    global: false,
    agents: [],
    skills: [],
    all: false,
    list: false,
    copy: false,
    yes: false,
    help: false,
    fromGithub: false,
  };

  for (let index = 0; index < argv.length; index++) {
    const arg = argv[index];
    const equals = arg.startsWith('--') ? arg.indexOf('=') : -1;
    const name = equals === -1 ? arg : arg.slice(0, equals);
    const inlineValue = equals === -1 ? undefined : arg.slice(equals + 1);

    if (VALUE_OPTIONS.has(name)) {
      const key = VALUE_OPTIONS.get(name);
      const values = [];

      if (inlineValue !== undefined) {
        // The = form takes exactly one value, like --agent=codex.
        values.push(inlineValue);
      } else {
        // The space form takes every name that follows, until the next option.
        while (index + 1 < argv.length && !argv[index + 1].startsWith('-')) {
          values.push(argv[++index]);
        }
      }

      if (values.length === 0) {
        throw new Error(`${name} needs a value`);
      }

      for (const value of values) {
        if (!options[key].includes(value)) {
          options[key].push(value);
        }
      }
      continue;
    }

    if (BOOLEAN_OPTIONS.has(name)) {
      if (inlineValue !== undefined) {
        throw new Error(`${name} does not take a value`);
      }
      options[BOOLEAN_OPTIONS.get(name)] = true;
      continue;
    }

    throw new Error(`Unknown option: ${arg}`);
  }

  return options;
}
