import { readFileSync } from 'node:fs';

const migration = readFileSync(
  'supabase/migrations/20260806000000_add_article_current_version.sql',
  'utf8'
);

describe('article publication invariant migration', () => {
  it('stores one explicit current version and publication-only ordering', () => {
    expect(migration).toContain('ADD COLUMN current_version_id uuid');
    expect(migration).toContain('ADD COLUMN publication_revision bigint');
    expect(migration).toContain('ADD COLUMN metadata_snapshot_complete boolean');
    expect(migration).toContain('articles_current_version_id_fkey');
    expect(migration).toContain('article_version_publication_revision_seq');
    expect(migration).toContain("CHECK (status <> 'approved' OR publication_revision IS NOT NULL)");
    expect(migration).toContain('USING (current_version_id IS NOT NULL)');
    expect(migration).toContain('article.current_version_id IS NOT NULL');
  });

  it('preserves metadata for legacy versions without complete snapshots', () => {
    expect(migration).toMatch(
      /character_id = CASE\s+WHEN current_version\.metadata_snapshot_complete[\s\S]+THEN current_version\.proposed_character_id\s+ELSE article\.character_id/
    );
    expect(migration).toContain(
      'Cannot publish an article version with an incomplete metadata snapshot'
    );
  });

  it('enforces pointer ownership, approved status, and synchronized metadata', () => {
    expect(migration).toMatch(
      /FOREIGN KEY \(id, current_version_id\)\s+REFERENCES public\.article_versions\(article_id, id\)/
    );
    expect(migration).toContain(
      'CREATE OR REPLACE FUNCTION public.enforce_article_current_version()'
    );
    expect(migration).toContain("article_version.status = 'approved'");
    expect(migration).toContain('NEW.title := published_version.proposed_title');
  });

  it('moves the pointer when publishing and when rolling back the current version', () => {
    expect(migration).toContain('CREATE OR REPLACE FUNCTION public.sync_article_current_version()');
    expect(migration).toContain('SET current_version_id = NEW.id');
    expect(migration).toMatch(
      /current_version_id = OLD\.id[\s\S]+ORDER BY\s+approved_version\.publication_revision DESC[\s\S]+current_version_id = fallback_version\.id/
    );
  });
});
