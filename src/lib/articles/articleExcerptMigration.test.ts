import type { Database } from '@/data/database.generated';
import { readLatestMigrationMatching } from '@/testUtils/latestMigration';

const { sql: migration } = readLatestMigrationMatching(
  /CREATE\s+(?:OR\s+REPLACE\s+)?VIEW\s+(?:public\.)?article_versions_public_view\b/i
);

type ArticleVersionPublicRow = Database['public']['Views']['article_versions_public_view']['Row'];

describe('article version excerpt migration', () => {
  it('adds a bounded computed excerpt to the security-invoker public view', () => {
    expect(migration).toContain('CREATE OR REPLACE VIEW public.article_versions_public_view');
    expect(migration).toContain('WITH (security_invoker = true)');
    expect(migration).toMatch(/left\([\s\S]+240\s*\) AS excerpt/);
    expect(migration).toContain("regexp_replace(content, '<[^>]*>', ' ', 'g')");
  });

  it('exposes the excerpt in the replayed database schema', () => {
    const row: Pick<ArticleVersionPublicRow, 'excerpt'> = { excerpt: null };

    expect(row).toHaveProperty('excerpt');
  });
});
