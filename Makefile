# Release tooling for the skills ecosystem layout.
#
# There is nothing to publish: the skills CLI installs straight from GitHub.
# A release is a tag on main plus a version bump in the plugin manifests.

VERSION := $(shell sed -n 's/.*"version": *"\([^"]*\)".*/\1/p' .claude-plugin/plugin.json)
CODEX_VERSION := $(shell sed -n 's/.*"version": *"\([^"]*\)".*/\1/p' .codex-plugin/plugin.json)
TAG := v$(VERSION)

# `make release 2.1.0` and `make release v2.1.0` are both fine. The word must
# match the manifests, so the tag can never disagree with what ships — the
# manifests stay the source of truth.
REQUESTED := $(patsubst v%,%,$(word 2,$(MAKECMDGOALS)))

# Make treats every word after the target as another goal, so the version word
# needs a rule of its own. Without it, `make release v2.0.0` tags and pushes,
# then fails with "No rule to make target".
ifneq ($(word 2,$(MAKECMDGOALS)),)
$(word 2,$(MAKECMDGOALS)):
	@:
endif

.PHONY: help test bump release-pr release

help:
	@echo "test     run the test suite"
	@echo "bump     set the version in package.json and both plugin manifests (make bump 2.2.0)"
	@echo "release-pr  branch, bump, push and open the version PR (make release-pr 2.2.0)"
	@echo "release  tag $(TAG) and push it to origin (optional: make release $(VERSION))"

test:
	npm test

# Run on a branch and merge by PR: release refuses a dirty tree or a HEAD that
# is not origin/main, so the bump can never be committed by release itself.
bump:
	@echo "$(REQUESTED)" | grep -Eq '^[0-9]+\.[0-9]+\.[0-9]+$$' || { echo "usage: make bump 2.2.0"; exit 1; }
	@npm version "$(REQUESTED)" --no-git-tag-version --allow-same-version >/dev/null
	@for f in .claude-plugin/plugin.json .codex-plugin/plugin.json; do \
		perl -0pi -e 's/("version":\s*")[^"]*"/$${1}$(REQUESTED)"/' $$f; done
	@echo "bumped to $(REQUESTED) — commit, merge, then: make release $(REQUESTED)"

# One command from clean main to an open bump PR. Merge it, pull main, then
# run `make release`.
release-pr:
	@test -n "$(REQUESTED)" || { echo "usage: make release-pr 2.2.0"; exit 1; }
	@git diff --quiet && git diff --cached --quiet || { echo "working tree is dirty — commit or stash first"; exit 1; }
	@test "$$(git branch --show-current)" = "main" || { echo "not on main — switch first"; exit 1; }
	@git fetch -q origin main && git diff --quiet origin/main -- || { echo "HEAD is not origin/main — pull first"; exit 1; }
	@git checkout -q -b "release/$(REQUESTED)"
	@$(MAKE) --no-print-directory bump $(REQUESTED)
	@git add package.json package-lock.json .claude-plugin/plugin.json .codex-plugin/plugin.json
	@git commit -q -m "chore: bump version to $(REQUESTED)"
	@git push -q -u origin "release/$(REQUESTED)"
	@gh pr create --base main --title "Release $(REQUESTED)" \
		--body "Bumps the version to $(REQUESTED) in package.json and both plugin manifests. After merge: \`make release $(REQUESTED)\`."

# Guards first, side effects last: a bad release should fail before it tags.
#
# tag.gpgSign is on in the global git config, so an annotated tag would block
# on a pinentry prompt. Signing is opt-in: make release TAG_SIGN=1
release:
	@test "$(VERSION)" = "$(CODEX_VERSION)" || \
		{ echo "version mismatch: .claude-plugin/plugin.json has $(VERSION), .codex-plugin/plugin.json has $(CODEX_VERSION)"; exit 1; }
	@test -z "$(REQUESTED)" || test "$(REQUESTED)" = "$(VERSION)" || \
		{ echo "requested $(REQUESTED) does not match the manifest version $(VERSION) — bump the manifests first"; exit 1; }
	@git diff --quiet || { echo "working tree is dirty — commit or stash first"; exit 1; }
	@test "$$(git branch --show-current)" = "main" || \
		{ echo "not on main (on $$(git branch --show-current)) — merge first"; exit 1; }
	@git diff --quiet origin/main -- || { echo "HEAD is not origin/main — push first"; exit 1; }
	@git rev-parse -q --verify "refs/tags/$(TAG)" >/dev/null && \
		{ echo "tag $(TAG) already exists"; exit 1; } || true
	@git -c tag.gpgSign=$(if $(TAG_SIGN),true,false) tag -a "$(TAG)" -m "Release $(TAG)"
	@git push origin "$(TAG)"
	@echo "pushed $(TAG) — users can pin it with: npx skills@latest add basuruk/skills@$(TAG)"
