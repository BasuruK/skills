# Changelog

## 2.1.0

Refined the `pair` skill loop and UID prose rules based on pairing sessions.

- Replaced `TODO(you)` / `"draft"` approval stalls with a method-first teaching brief (**Why** in plain cause-and-effect, **What** as an exact veteran contract, **How + Example** with `input -> output` traces) plus showing the method in chat before writing it to disk.
- Ended each step with one critical-thinking question on trade-offs, invariants, or edge cases so pairing stays collaborative without gating file writes.
- Added the single-idea-per-sentence and clause-splitting rule to `UID Prose`.

## 2.0.0

Replaced the custom installer with the open agent skills ecosystem.

- Install with `npx skills@latest add basuruk/skills` instead of `npx @basuruk/skills`.
- Deleted the `bin/` installer, its tests, and the npm publish workflow. The GitHub
  repository is the only distribution channel from now on.
- Skills live in `skills/<category>/<name>/` now — the layout the skills CLI and skills.sh
  index. `pair` moved to `skills/engineering/pair`.
- Added Claude Code and Codex plugin marketplaces. Plugin installs only refresh themselves once
  auto-update is enabled for the marketplace (`/plugin` → Marketplaces → basuruk → Enable
  auto-update); Codex refreshes its marketplace snapshot with `codex plugin marketplace upgrade`.
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
