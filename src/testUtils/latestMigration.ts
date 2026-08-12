import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

const migrationDirectory = join(process.cwd(), 'supabase/migrations');

export function readLatestMigrationMatching(pattern: RegExp): {
  filename: string;
  sql: string;
} {
  const migrationFiles = readdirSync(migrationDirectory)
    .filter((filename) => filename.endsWith('.sql'))
    .sort();

  for (let index = migrationFiles.length - 1; index >= 0; index--) {
    const filename = migrationFiles[index];
    if (!filename) continue;

    const sql = readFileSync(join(migrationDirectory, filename), 'utf8').replace(/\r\n/g, '\n');
    pattern.lastIndex = 0;
    if (pattern.test(sql)) {
      return { filename, sql };
    }
  }

  throw new Error(`No migration matched ${pattern}`);
}
