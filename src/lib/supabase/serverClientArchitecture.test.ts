import { readdirSync, readFileSync } from 'node:fs';
import path from 'node:path';

const sourceRoot = path.join(process.cwd(), 'src');
const expectedServerConstructors = new Map([
  ['src/lib/supabase/admin.ts', 1],
  ['src/lib/supabase/public.ts', 1],
  ['src/lib/supabase/server.ts', 1],
  ['src/lib/supabase/ssrClient.ts', 2],
]);

function listProductionTypeScriptFiles(directory: string): string[] {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const absolutePath = path.join(directory, entry.name);
    if (entry.isDirectory()) return listProductionTypeScriptFiles(absolutePath);
    if (!/\.(?:ts|tsx)$/.test(entry.name) || /\.(?:test|spec)\.(?:ts|tsx)$/.test(entry.name)) {
      return [];
    }
    return [absolutePath];
  });
}

function toRepositoryPath(absolutePath: string): string {
  return path.relative(process.cwd(), absolutePath).replaceAll(path.sep, '/');
}

describe('server-side Supabase client architecture', () => {
  it('confines constructors to the allowlist', () => {
    const constructorImport =
      /import\s+\{[^}]*\bcreate(?:Server)?Client\b[^}]*\}\s+from\s+['"]@supabase\/(?:supabase-js|ssr)['"]/s;
    const constructorFiles = listProductionTypeScriptFiles(sourceRoot)
      .filter((file) => constructorImport.test(readFileSync(file, 'utf8')))
      .map(toRepositoryPath)
      .sort();

    expect(constructorFiles).toEqual([...expectedServerConstructors.keys()].sort());
  });

  it.each([...expectedServerConstructors])(
    'injects the guarded transport into every constructor in %s',
    (repositoryPath, expectedCount) => {
      const source = readFileSync(path.join(process.cwd(), repositoryPath), 'utf8');
      const constructorCount =
        source.match(/\bcreate(?:Server)?Client<Database>\s*\(/g)?.length ?? 0;
      const guardedFetchCount = source.match(/\bfetch:\s*fetchWithRetry\b/g)?.length ?? 0;

      expect(source).toContain("import { fetchWithRetry } from './fetch-retry';");
      expect(constructorCount).toBe(expectedCount);
      expect(guardedFetchCount).toBe(expectedCount);
    }
  );
});
