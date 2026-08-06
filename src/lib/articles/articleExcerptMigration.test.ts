import fs from 'node:fs';
import path from 'node:path';

const migration = fs.readFileSync(
  path.join(process.cwd(), 'supabase/migrations/20260806203440_add_article_version_excerpt.sql'),
  'utf8'
);

describe('article version excerpt migration', () => {
  it('adds a bounded computed excerpt to the security-invoker public view', () => {
    expect(migration).toContain('CREATE OR REPLACE VIEW public.article_versions_public_view');
    expect(migration).toContain('WITH (security_invoker = true)');
    expect(migration).toMatch(/left\([\s\S]+240\s*\) AS excerpt/);
    expect(migration).toContain("regexp_replace(content, '<[^>]*>', ' ', 'g')");
  });
});
