import { execFileSync } from 'node:child_process';
import { readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { format, resolveConfig } from 'prettier';

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const targetPath = path.join(rootDir, 'src', 'data', 'database.generated.ts');
const supabaseCliPath = path.join(rootDir, 'node_modules', 'supabase', 'dist', 'supabase.js');
const checkOnly = process.argv.includes('--check');

const generated = execFileSync(
  process.execPath,
  [supabaseCliPath, 'gen', 'types', '--local', '--schema', 'public,graphql_public'],
  {
    cwd: rootDir,
    encoding: 'utf8',
    maxBuffer: 20 * 1024 * 1024,
    stdio: ['ignore', 'pipe', 'inherit'],
  }
);
const prettierConfig = (await resolveConfig(targetPath)) ?? {};
const formatted = await format(generated, { ...prettierConfig, filepath: targetPath });

if (checkOnly) {
  const current = readFileSync(targetPath, 'utf8');
  if (current !== formatted) {
    console.error(
      'Database types are out of date. Run `npm run generate:database-types` after replaying migrations.'
    );
    process.exitCode = 1;
  }
} else {
  writeFileSync(targetPath, formatted, 'utf8');
  console.log(`Generated ${path.relative(rootDir, targetPath)}`);
}
