import { cp, mkdir, readdir, rm } from 'node:fs/promises';

// Keep the existing static site intact; publish the game in its own directory.
await rm('_site', { recursive: true, force: true });
await mkdir('_site');
for (const entry of await readdir('.', { withFileTypes: true })) {
  if (/\.(html|css|js)$/.test(entry.name) || entry.name === '.nojekyll' ||
      ['assets', 'posts', 'output'].includes(entry.name)) {
    await cp(entry.name, `_site/${entry.name}`, { recursive: true });
  }
}
await cp('dist/hex-pairs', '_site/hex-pairs', { recursive: true });
await cp('dist/estimathon', '_site/estimathon', { recursive: true });
