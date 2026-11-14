#!/usr/bin/env node
import * as p from '@clack/prompts';
import { HELP, parseArgs } from './args.js';
import { formatError } from './errors.js';
import { run } from './install.js';

function fail(error) {
  const { message, fix } = formatError(error);
  p.log.error(message);
  if (fix) {
    p.log.info(fix);
  }
  return 1;
}

let options;
try {
  options = parseArgs(process.argv.slice(2));
} catch (error) {
  console.error(error instanceof Error ? error.message : String(error));
  console.error('\nRun with --help to see the options.');
  process.exit(1);
}

if (options.help) {
  console.log(HELP);
  process.exit(0);
}

p.intro('basuruk skills');

let code;
try {
  code = await run(options, { prompts: p });
} catch (error) {
  code = fail(error);
}

if (code === 130) {
  p.cancel('Cancelled.');
} else if (code === 0) {
  p.outro('Done.');
} else {
  p.outro('Finished with errors.');
}

process.exit(code);
