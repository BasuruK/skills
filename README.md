<p align="center">
  <img src="resources/skiils_image.png" alt="Basuruk Skills" width="400" />
</p>

<h1 align="center">Basuruk Skills</h1>

<p align="center">Teach a man to skill, and he'll never go skill-less.</p>

<p align="center">A collection of skill for traditional software engineers who still want to code.</p>

~ _If you are here to see AI generate all your code, then this repo is not for you :p_ 

## Install

```bash
npx @basuruk/skills          # interactive: you choose the agents
npx @basuruk/skills --global # install for the current user instead of the project
```

Run it without arguments and it opens a picker: the agents detected on your machine
come first, then a shortlist of popular ones, with every supported agent one
keystroke away. Nothing is ticked for you — you pick. If you have exactly one
agent installed, it goes straight in without a question.

Skills are placed with [Vercel's skills CLI](https://github.com/vercel-labs/skills),
so each agent gets them in its own directory.

Already know what you want? Skip the prompts:

```bash
npx @basuruk/skills --agent claude-code codex   # specific agents
npx @basuruk/skills --all                        # every agent detected
npx @basuruk/skills --list                       # show the skills in this package
```

Without a terminal (CI, a pipe) there is no picker: it installs into every agent
it finds, or into Claude Code if it finds none. Name your agents with `--agent`
when that matters.

Nothing is written to your project except the skill folders. A `skills-lock.json`
appears only with `--from-github`, which installs from the
[repository](https://github.com/BasuruK/skills) instead of the package on disk, so
`npx skills update` can track it later.

Requires Node 22.20 or later. Telemetry is off.

## Skills

- **pair** — Tracer-bullet pair programming and UID prose for step-by-step co-coding, teaching, and readable architecture explanations.

## Release

Publishing is automated. Push a `v*` tag and the [publish workflow](.github/workflows/publish.yml) publishes to npm
via [trusted publishing](https://docs.npmjs.com/trusted-publishers/) (OIDC — no npm token in the repo).

```bash
npm version patch        # bumps package.json, commits and tags v<version>
git push && git push origin "v$(node -p "require('./package.json').version")"
```

The tag must match `version` in `package.json` — the workflow fails otherwise. A
prerelease version such as `1.2.0-beta.1` is published under the `next` tag
instead of `latest`.

> Adding a skill? Add its folder to `files` in `package.json`, otherwise it won't ship.

## License

Apache 2.0 — see [LICENSE](LICENSE).
