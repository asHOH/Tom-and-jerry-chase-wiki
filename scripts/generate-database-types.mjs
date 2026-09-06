import { execFileSync } from 'node:child_process';
import { readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { setTimeout as delay } from 'node:timers/promises';
import { fileURLToPath } from 'node:url';
import { format, resolveConfig } from 'prettier';

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const targetPath = path.join(rootDir, 'src', 'data', 'database.generated.ts');
const supabaseCliPath = path.join(rootDir, 'node_modules', 'supabase', 'dist', 'supabase.js');
const checkOnly = process.argv.includes('--check');
const maxAttempts = 4;

export function isRegistryRateLimit(output) {
  return /toomanyrequests|too many requests|rate exceeded/i.test(output);
}

async function generateTypes() {
  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    try {
      return execFileSync(
        process.execPath,
        [supabaseCliPath, 'gen', 'types', '--local', '--schema', 'public,graphql_public'],
        {
          cwd: rootDir,
          encoding: 'utf8',
          maxBuffer: 20 * 1024 * 1024,
          stdio: ['ignore', 'pipe', 'pipe'],
        }
      );
    } catch (error) {
      const stdout = String(error?.stdout ?? '');
      const stderr = String(error?.stderr ?? '');
      process.stdout.write(stdout);
      process.stderr.write(stderr);

      if (!isRegistryRateLimit(`${stdout}\n${stderr}`) || attempt === maxAttempts) {
        throw error;
      }

      const delayMs = attempt * 20_000;
      console.error(
        `Registry rate limit detected; retrying type generation in ${delayMs / 1000}s ` +
          `(attempt ${attempt + 1}/${maxAttempts}).`
      );
      await delay(delayMs);
    }
  }

  throw new Error('Database type generation exhausted its retry attempts.');
}

async function main() {
  const generated = await generateTypes();
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
}

if (path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) await main();
