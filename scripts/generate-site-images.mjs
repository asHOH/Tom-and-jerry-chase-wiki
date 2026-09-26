import { readdir, writeFile } from 'node:fs/promises';
import path from 'node:path';

const root = path.join(process.cwd(), 'public', 'images');
const dirents = await readdir(root, { recursive: true, withFileTypes: true });
// Directory suffixes preserve empty folders without indexing any image contents.
const entries = [
  '/',
  ...dirents
    .filter((entry) => entry.isDirectory() || entry.isFile())
    .map((entry) => {
      const relative = path.relative(root, path.join(entry.parentPath, entry.name));
      return relative.split(path.sep).join('/') + (entry.isDirectory() ? '/' : '');
    }),
].sort();

await writeFile('.site-images-index.json', `${JSON.stringify(entries)}\n`, 'utf8');
console.log(`Generated site image index with ${entries.length} file and directory paths.`);
