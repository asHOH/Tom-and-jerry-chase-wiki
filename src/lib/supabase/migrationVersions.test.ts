import { readdirSync } from 'fs';

const migrationDirectory = 'supabase/migrations';

describe('Supabase migration versions', () => {
  const migrationFiles = readdirSync(migrationDirectory).filter((file) => file.endsWith('.sql'));

  it('uses the timestamp_name.sql convention', () => {
    const invalidFiles = migrationFiles.filter((file) => !/^\d+_.+\.sql$/.test(file));

    expect(invalidFiles).toEqual([]);
  });

  it('uses each migration version exactly once', () => {
    const filesByVersion = new Map<string, string[]>();

    for (const file of migrationFiles) {
      const version = /^(\d+)_/.exec(file)?.[1];
      if (!version) continue;

      const files = filesByVersion.get(version) ?? [];
      files.push(file);
      filesByVersion.set(version, files);
    }

    const duplicates = [...filesByVersion.entries()].filter(([, files]) => files.length > 1);

    expect(duplicates).toEqual([]);
  });
});
