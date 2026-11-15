import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { test } from 'node:test';
import { resolveSource } from 'skills';

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), '..');

test('the skills CLI finds every skill in the skills/ container', async () => {
  const source = await resolveSource(repoRoot, { cwd: repoRoot });

  try {
    const found = source.skills
      .map((skill) => ({ name: skill.name, path: skill.path }))
      .sort((a, b) => a.name.localeCompare(b.name));

    assert.deepEqual(found, [{ name: 'pair', path: 'skills/engineering/pair' }]);
  } finally {
    await source.dispose();
  }
});

test('every skill listed in the plugin manifest exists', async () => {
  const manifest = JSON.parse(
    await readFile(join(repoRoot, '.claude-plugin', 'plugin.json'), 'utf-8'),
  );

  for (const skill of manifest.skills) {
    assert.ok(
      existsSync(join(repoRoot, skill, 'SKILL.md')),
      `${skill} is listed in .claude-plugin/plugin.json but has no SKILL.md`,
    );
  }
});
