# Release tooling for the skills ecosystem layout.
#
# There is nothing to publish: the skills CLI installs straight from GitHub.
# A release is a tag on main plus a version bump in the plugin manifests.

VERSION := $(shell sed -n 's/.*"version": *"\([^"]*\)".*/\1/p' .claude-plugin/plugin.json)
CODEX_VERSION := $(shell sed -n 's/.*"version": *"\([^"]*\)".*/\1/p' .codex-plugin/plugin.json)
TAG := v$(VERSION)

.PHONY: help test release

help:
	@echo "test     run the test suite"
	@echo "release  tag $(TAG) and push it to origin"

test:
	npm test

# Guards first, side effects last: a bad release should fail before it tags.
#
# tag.gpgSign is on in the global git config, so an annotated tag would block
# on a pinentry prompt. Signing is opt-in: make release TAG_SIGN=1
release:
	@test "$(VERSION)" = "$(CODEX_VERSION)" || \
		{ echo "version mismatch: .claude-plugin/plugin.json has $(VERSION), .codex-plugin/plugin.json has $(CODEX_VERSION)"; exit 1; }
	@git diff --quiet || { echo "working tree is dirty — commit or stash first"; exit 1; }
	@test "$$(git branch --show-current)" = "main" || \
		{ echo "not on main (on $$(git branch --show-current)) — merge first"; exit 1; }
	@git diff --quiet origin/main -- || { echo "HEAD is not origin/main — push first"; exit 1; }
	@git rev-parse -q --verify "refs/tags/$(TAG)" >/dev/null && \
		{ echo "tag $(TAG) already exists"; exit 1; } || true
	@git -c tag.gpgSign=$(if $(TAG_SIGN),true,false) tag -a "$(TAG)" -m "Release $(TAG)"
	@git push origin "$(TAG)"
	@echo "pushed $(TAG) — users can pin it with: npx skills@latest add basuruk/skills@$(TAG)"
