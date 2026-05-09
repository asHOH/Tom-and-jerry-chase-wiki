import { readdirSync, readFileSync, statSync } from 'fs';
import { join, relative } from 'path';

const mainAppDir = join(process.cwd(), 'src/app/(main)');

function listTsxFiles(dir: string): string[] {
  const entries = readdirSync(dir);
  const files: string[] = [];

  for (const entry of entries) {
    const fullPath = join(dir, entry);
    const stats = statSync(fullPath);

    if (stats.isDirectory()) {
      files.push(...listTsxFiles(fullPath));
    } else if (entry.endsWith('.tsx')) {
      files.push(fullPath);
    }
  }

  return files;
}

describe('main app rendering boundaries', () => {
  it('does not disable SSR for main route client wrappers', () => {
    const offenders = listTsxFiles(mainAppDir)
      .filter((filePath) => /ssr\s*:\s*false/.test(readFileSync(filePath, 'utf8')))
      .map((filePath) => relative(process.cwd(), filePath));

    expect(offenders).toEqual([]);
  });
});
