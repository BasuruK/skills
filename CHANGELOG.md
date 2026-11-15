# Changelog

## 2.0.0

Replaced the custom installer with the open agent skills ecosystem.

- Install with `npx skills@latest add basuruk/skills` instead of `npx @basuruk/skills`.
- Deleted the `bin/` installer, its tests, and the npm publish workflow. The GitHub
  repository is the only distribution channel from now on.
- Skills live in `skills/<category>/<name>/` now — the layout the skills CLI and skills.sh
  index. `pair` moved to `skills/engineering/pair`.
- Added Claude Code and Codex plugin marketplaces, so plugin installs update themselves.
- `npm test` now checks that the skills CLI finds every skill and that the plugin manifest
  matches the folders on disk.

## 1.1.1

Rewrote the installer on top of Vercel's `skills` CLI.

- Interactive picker for the coding agents to install into.
- Installs into every agent directory the `skills` CLI supports, not just `.claude/skills`.
- New flags: `--agent`, `--skill`, `--all`, `--list`, `--copy`, `--from-github`, `--yes`.
- `--from-github` installs from the repository and writes `skills-lock.json`, so
  `npx skills update` can track it.
- Requires Node 22.20 or later. The binary is now named `basuruk-skills`.

## 1.1.0

First published release.

- `pair` skill — tracer-bullet pair programming and UID prose.
- Installs to `.claude/skills` (project) or `~/.claude/skills` (global).

## Unpublished

- `0.0.0-stage` — a placeholder version published to claim the `@basuruk` scope
  name before the first real release. It shipped no usable content and
  has been removed from the registry.

  ```bash
  npm unpublish @basuruk/skills@0.0.0-stage
  ```

  npm requires a browser confirmation for unpublish. `latest` never pointed at
  this version, so no install was ever affected.
