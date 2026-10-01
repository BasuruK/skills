#!/usr/bin/env node
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

const pkgRoot = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const global = process.argv.includes("--global") || process.argv.includes("-g");
const dest = path.join(global ? os.homedir() : process.cwd(), ".claude", "skills");

const skills = fs
  .readdirSync(pkgRoot, { withFileTypes: true })
  .filter((d) => d.isDirectory() && fs.existsSync(path.join(pkgRoot, d.name, "SKILL.md")))
  .map((d) => d.name);

if (skills.length === 0) {
  console.error("No skills found in this package.");
  process.exit(1);
}

fs.mkdirSync(dest, { recursive: true });
for (const skill of skills) {
  fs.cpSync(path.join(pkgRoot, skill), path.join(dest, skill), { recursive: true });
  console.log(`✓ installed ${skill} -> ${path.join(dest, skill)}`);
}
