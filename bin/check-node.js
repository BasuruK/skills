const [major, minor] = process.versions.node.split('.').map(Number);

if (major < 22 || (major === 22 && minor < 20)) {
  console.error(
    `This installer needs Node 22.20 or later. You are on ${process.versions.node}.`,
  );
  process.exit(1);
}
