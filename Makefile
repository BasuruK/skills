# Release tooling for the skills ecosystem layout.
#
# There is nothing to publish: the skills CLI installs straight from GitHub.
# A release is a tag on main plus a version bump in the plugin manifests.

VERSION := $(shell node -p "require('./.claude-plugin/plugin.json').version")
CODEX_VERSION := $(shell node -p "require('./.codex-plugin/plugin.json').version")
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
	@node -e "void 0"
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
	@node scripts/release.mjs bump "$(REQUESTED)"

# One command from clean main to an open bump PR. Merge it, pull main, then
# run `make release`.
release-pr:
	@node scripts/release.mjs release-pr "$(REQUESTED)"

# Guards first, side effects last: a bad release should fail before it tags.
#
# tag.gpgSign is on in the global git config, so an annotated tag would block
# on a pinentry prompt. Signing is opt-in: make release TAG_SIGN=1
release:
	@node scripts/release.mjs release "$(REQUESTED)" "$(TAG_SIGN)"
