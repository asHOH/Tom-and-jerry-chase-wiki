import { readFileSync } from 'node:fs';

const migration = readFileSync(
  'supabase/migrations/20260806000000_add_article_current_version.sql',
  'utf8'
);

describe('article publication invariant migration', () => {
  it('stores one explicit current version and publication-only ordering', () => {
    expect(migration).toContain('ADD COLUMN current_version_id uuid');
    expect(migration).toContain('ADD COLUMN publication_revision bigint');
    expect(migration).toContain('articles_current_version_id_fkey');
    expect(migration).toContain('article_version_publication_revision_seq');
    expect(migration).toContain("CHECK (status <> 'approved' OR publication_revision IS NOT NULL)");
    expect(migration).toContain('USING (current_version_id IS NOT NULL)');
    expect(migration).toContain('article.current_version_id IS NOT NULL');
  });

  it('synchronizes metadata when publishing and when rolling back the current version', () => {
    expect(migration).toContain('CREATE OR REPLACE FUNCTION public.sync_article_current_version()');
    expect(migration).toMatch(
      /current_version_id = NEW\.id[\s\S]+title = COALESCE\(NEW\.proposed_title[\s\S]+character_id = NEW\.proposed_character_id/
    );
    expect(migration).toMatch(
      /current_version_id = OLD\.id[\s\S]+ORDER BY\s+approved_version\.publication_revision DESC[\s\S]+current_version_id = fallback_version\.id/
    );
  });
});
