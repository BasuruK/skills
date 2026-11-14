<p align="center">
  <img src="resources/skiils_image.png" alt="Basuruk Skills" width="400" />
</p>

<h1 align="center">Basuruk Skills</h1>

<p align="center">Teach a man to skill, and he'll never go skill-less.</p>
<p align="center">A collection of skill for traditional software engineers who still want to code.</p>

~ _If you are here to see AI generate all your code, then this repo is not for you :p_ 

## Install

```bash
npx @basuruk/skills          # installs into ./.claude/skills
npx @basuruk/skills --global # installs into ~/.claude/skills
```

## Skills

- **pair** — Tracer-bullet pair programming and UID prose for step-by-step co-coding, teaching, and readable architecture explanations.

## Release

Publishing is automated. Push a `v*` tag and the [publish workflow](.github/workflows/publish.yml) publishes to npm
via [trusted publishing](https://docs.npmjs.com/trusted-publishers/) (OIDC — no npm token in the repo).

```bash
npm version patch                          # bump package.json to 1.1.1
git push && git tag v1.1.1 && git push origin v1.1.1
```

The tag must match `version` in `package.json` — the workflow fails otherwise.

> Adding a skill? Add its folder to `files` in `package.json`, otherwise it won't ship.

## License

Apache 2.0 — see [LICENSE](LICENSE).
