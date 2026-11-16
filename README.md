<p align="center">
  <img src="https://raw.githubusercontent.com/BasuruK/skills/main/resources/skiils_image.png" alt="Basuruk Skills" width="400" />
</p>

<h1 align="center">Basuruk's Engineering Skills</h1>

<p align="center">Teach a man to skill, and he'll never go skill-less.</p>
<p align="center">A collection of skills for traditional software engineers who still want to code.</p>

<p align="center" style="color: blue; font-style: italic;">If you are here to see AI generate all your code, then this repo is not for you :p</p>

[![skills.sh](https://skills.sh/b/BasuruK/skills)](https://skills.sh/BasuruK/skills)

## Install

Installs with the [skills CLI](https://github.com/vercel-labs/skills) — the open agent skills ecosystem.

```bash
npx skills@latest add basuruk/skills        # into this project
npx skills@latest add basuruk/skills -g     # for every project on this machine
```

Pick the skill, pick the agent, or stay out of the way:

```bash
npx skills@latest add basuruk/skills --list
npx skills@latest add basuruk/skills --skill pair -a claude-code
npx skills@latest add basuruk/skills --all -y
```

Refresh later:

```bash
npx skills@latest update
```

**Where it lands.** A project install writes each skill into the agent's own folder —
`.claude/skills/pair` for Claude Code, `.agents/skills/pair` for Codex, and 70 more — and
`skills-lock.json` records the install so `update` knows what to refresh. `-g` installs the
same way under your home directory.

Requires Node 22.20 or later. The CLI reports anonymous install counts so
[skills.sh](https://skills.sh) can rank skills — set `DISABLE_TELEMETRY=1` to turn that off.

## Plugin install

Plugin installs can refresh themselves, so you would not run `update` yourself:

```bash
claude plugin marketplace add basuruk/skills
claude plugin install basuruk-skills@basuruk

codex plugin marketplace add basuruk/skills
codex plugin add basuruk-skills@basuruk
```

Auto-update is off for third-party marketplaces, so turn it on once per machine: in Claude Code
run `/plugin` → **Marketplaces** → `basuruk` → **Enable auto-update**. Codex refreshes its
marketplace snapshot with `codex plugin marketplace upgrade`.

## Skills

- **pair** — Tracer-bullet pair programming and UID prose for step-by-step co-coding, teaching, and readable architecture explanations.

## Adding a skill

1. Create `skills/<category>/<name>/SKILL.md` with `name` and `description` frontmatter.
2. Add the path to `skills` in `.claude-plugin/plugin.json`.
3. Bump `version` in `.claude-plugin/plugin.json` and `.codex-plugin/plugin.json`.

`npm test` checks that the skills CLI finds every skill and that the plugin manifest
matches the folders on disk.

## Release

```bash
make release   # tag v<version> from the plugin manifests and push the tag
```

There is nothing to publish: the skills CLI installs straight from GitHub. A release is a
version bump in both plugin manifests, a merge to `main`, and a tag.

## License

Apache 2.0 — see [LICENSE](LICENSE).

### Acknowledgement of Inspiration

> This project was inspired in part by insights from the following academic work, which investigates the processing challenges posed by AI-generated language. The mention of this paper does not imply endorsement by the authors, nor does it indicate that this project directly implements methods or findings from their research.

Clark, T. H., Martin, M. B., & Mahowald, K. (2026). "Why is AI-generated language so hard to understand?" arXiv:2610.29162 [cs.CL]. https://arxiv.org/abs/2610.29162
