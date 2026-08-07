BEGIN;

CREATE EXTENSION IF NOT EXISTS pgtap WITH SCHEMA extensions;
SET search_path = public, extensions;

SELECT plan(18);

-- The public user row is sufficient for these trigger-level tests. Avoid depending on
-- GoTrue fixture details while retaining the article/version foreign keys under test.
ALTER TABLE public.users DISABLE TRIGGER ALL;
INSERT INTO public.users (id, username_hash, nickname, salt)
VALUES (
  '10000000-0000-0000-0000-000000000001',
  'article-publication-test-user',
  'article-publication-test-user',
  'test-salt'
);
ALTER TABLE public.users ENABLE TRIGGER ALL;

INSERT INTO public.categories (id, name, default_visibility)
VALUES (
  '20000000-0000-0000-0000-000000000001',
  'article-publication-test-category',
  'pending'
);

INSERT INTO public.articles (id, title, category_id, author_id, character_id)
VALUES (
  '30000000-0000-0000-0000-000000000001',
  'Initial title',
  '20000000-0000-0000-0000-000000000001',
  '10000000-0000-0000-0000-000000000001',
  'initial-character'
);

-- Submit the version that is newer by submission time first, then approve it first.
INSERT INTO public.article_versions (
  id, article_id, content, editor_id, status, preview_token, created_at,
  proposed_title, proposed_category_id, proposed_character_id
)
VALUES
  (
    '40000000-0000-0000-0000-000000000001',
    '30000000-0000-0000-0000-000000000001',
    '<p>Newer submission</p>',
    '10000000-0000-0000-0000-000000000001',
    'pending',
    'article-publication-newer',
    '2026-01-02T00:00:00Z',
    'Newer submission',
    '20000000-0000-0000-0000-000000000001',
    'newer-character'
  ),
  (
    '40000000-0000-0000-0000-000000000002',
    '30000000-0000-0000-0000-000000000001',
    '<p>Older submission approved later</p>',
    '10000000-0000-0000-0000-000000000001',
    'pending',
    'article-publication-older',
    '2026-01-01T00:00:00Z',
    'Older submission approved later',
    '20000000-0000-0000-0000-000000000001',
    'older-character'
  );

UPDATE public.article_versions
SET status = 'approved'
WHERE id = '40000000-0000-0000-0000-000000000001';

UPDATE public.article_versions
SET status = 'approved'
WHERE id = '40000000-0000-0000-0000-000000000002';

SELECT is(
  (SELECT current_version_id FROM public.articles
   WHERE id = '30000000-0000-0000-0000-000000000001'),
  '40000000-0000-0000-0000-000000000002'::uuid,
  'approval order, not submission time, selects the current version'
);
SELECT is(
  (SELECT title FROM public.articles
   WHERE id = '30000000-0000-0000-0000-000000000001'),
  'Older submission approved later',
  'approval synchronizes the title snapshot'
);
SELECT is(
  (SELECT character_id FROM public.articles
   WHERE id = '30000000-0000-0000-0000-000000000001'),
  'older-character',
  'approval synchronizes the nullable character snapshot'
);
SELECT ok(
  (SELECT later.publication_revision > earlier.publication_revision
   FROM public.article_versions AS later
   JOIN public.article_versions AS earlier ON true
   WHERE later.id = '40000000-0000-0000-0000-000000000002'
     AND earlier.id = '40000000-0000-0000-0000-000000000001'),
  'publication revisions increase with approval order'
);

UPDATE public.article_versions
SET status = 'revoked'
WHERE id = '40000000-0000-0000-0000-000000000002';

SELECT is(
  (SELECT current_version_id FROM public.articles
   WHERE id = '30000000-0000-0000-0000-000000000001'),
  '40000000-0000-0000-0000-000000000001'::uuid,
  'revocation rolls back to the preceding publication'
);
SELECT is(
  (SELECT title FROM public.articles
   WHERE id = '30000000-0000-0000-0000-000000000001'),
  'Newer submission',
  'rollback restores the preceding title snapshot'
);
SELECT is(
  (SELECT character_id FROM public.articles
   WHERE id = '30000000-0000-0000-0000-000000000001'),
  'newer-character',
  'rollback restores the preceding character snapshot'
);

-- Reproduce the migration backfill phase for an approved legacy version. The
-- pointer guard is disabled because the real migration creates it after this update.
INSERT INTO public.articles (id, title, category_id, author_id, character_id)
VALUES (
  '30000000-0000-0000-0000-000000000003',
  'Retained legacy title',
  '20000000-0000-0000-0000-000000000001',
  '10000000-0000-0000-0000-000000000001',
  'retained-legacy-character'
);

ALTER TABLE public.article_versions DISABLE TRIGGER article_version_sync_current;
INSERT INTO public.article_versions (
  id, article_id, content, editor_id, status, preview_token, created_at
)
VALUES (
  '40000000-0000-0000-0000-000000000006',
  '30000000-0000-0000-0000-000000000003',
  '<p>Legacy migration content</p>',
  '10000000-0000-0000-0000-000000000001',
  'approved',
  'article-publication-legacy-migration',
  '2025-01-01T00:00:00Z'
);
ALTER TABLE public.article_versions ENABLE TRIGGER article_version_sync_current;

SELECT is(
  (SELECT metadata_snapshot_complete FROM public.article_versions
   WHERE id = '40000000-0000-0000-0000-000000000006'),
  false,
  'an approved pre-snapshot version is marked as metadata-incomplete'
);

ALTER TABLE public.articles DISABLE TRIGGER article_enforce_current_version;
WITH current_version AS (
  SELECT
    id,
    proposed_title,
    proposed_category_id,
    proposed_character_id,
    metadata_snapshot_complete
  FROM public.article_versions
  WHERE article_id = '30000000-0000-0000-0000-000000000003'
    AND status = 'approved'
  ORDER BY created_at DESC, id DESC
  LIMIT 1
)
UPDATE public.articles AS article
SET
  current_version_id = current_version.id,
  title = CASE
    WHEN current_version.metadata_snapshot_complete THEN current_version.proposed_title
    ELSE article.title
  END,
  category_id = CASE
    WHEN current_version.metadata_snapshot_complete THEN current_version.proposed_category_id
    ELSE article.category_id
  END,
  character_id = CASE
    WHEN current_version.metadata_snapshot_complete THEN current_version.proposed_character_id
    ELSE article.character_id
  END
FROM current_version
WHERE article.id = '30000000-0000-0000-0000-000000000003';
ALTER TABLE public.articles ENABLE TRIGGER article_enforce_current_version;

SELECT is(
  (SELECT current_version_id FROM public.articles
   WHERE id = '30000000-0000-0000-0000-000000000003'),
  '40000000-0000-0000-0000-000000000006'::uuid,
  'legacy migration backfill records the selected content pointer'
);
SELECT is(
  (SELECT title FROM public.articles
   WHERE id = '30000000-0000-0000-0000-000000000003'),
  'Retained legacy title',
  'legacy migration backfill preserves the existing title'
);
SELECT is(
  (SELECT character_id FROM public.articles
   WHERE id = '30000000-0000-0000-0000-000000000003'),
  'retained-legacy-character',
  'legacy migration backfill preserves the existing character association'
);

-- Build an article whose preceding publication is a legacy version without metadata.
INSERT INTO public.articles (id, title, category_id, author_id, character_id)
VALUES (
  '30000000-0000-0000-0000-000000000002',
  'Legacy metadata retained',
  '20000000-0000-0000-0000-000000000001',
  '10000000-0000-0000-0000-000000000001',
  'legacy-character'
);

ALTER TABLE public.article_versions DISABLE TRIGGER article_version_sync_current;
INSERT INTO public.article_versions (
  id, article_id, content, editor_id, status, preview_token, created_at
)
VALUES (
  '40000000-0000-0000-0000-000000000003',
  '30000000-0000-0000-0000-000000000002',
  '<p>Legacy content</p>',
  '10000000-0000-0000-0000-000000000001',
  'approved',
  'article-publication-legacy',
  '2025-01-01T00:00:00Z'
);
ALTER TABLE public.article_versions ENABLE TRIGGER article_version_sync_current;

INSERT INTO public.article_versions (
  id, article_id, content, editor_id, status, preview_token, created_at,
  proposed_title, proposed_category_id, proposed_character_id
)
VALUES (
  '40000000-0000-0000-0000-000000000004',
  '30000000-0000-0000-0000-000000000002',
  '<p>Complete current content</p>',
  '10000000-0000-0000-0000-000000000001',
  'approved',
  'article-publication-complete',
  '2026-01-03T00:00:00Z',
  'Complete current title',
  '20000000-0000-0000-0000-000000000001',
  'complete-character'
);

SELECT throws_ok(
  $$UPDATE public.article_versions
    SET status = 'revoked'
    WHERE id = '40000000-0000-0000-0000-000000000004'$$,
  '23514',
  'Cannot publish an article version with an incomplete metadata snapshot',
  'rollback to an incomplete legacy snapshot is rejected'
);
SELECT is(
  (SELECT current_version_id FROM public.articles
   WHERE id = '30000000-0000-0000-0000-000000000002'),
  '40000000-0000-0000-0000-000000000004'::uuid,
  'a rejected legacy rollback leaves the current pointer unchanged'
);
SELECT is(
  (SELECT status::text FROM public.article_versions
   WHERE id = '40000000-0000-0000-0000-000000000004'),
  'approved',
  'a rejected legacy rollback leaves the current version approved'
);

SELECT throws_ok(
  $$UPDATE public.articles
    SET current_version_id = '40000000-0000-0000-0000-000000000001'
    WHERE id = '30000000-0000-0000-0000-000000000002'$$,
  '23514',
  'Current article version must be approved and belong to the same article',
  'a cross-article current pointer is rejected'
);

INSERT INTO public.article_versions (
  id, article_id, content, editor_id, status, preview_token, created_at,
  proposed_title, proposed_category_id, proposed_character_id
)
VALUES (
  '40000000-0000-0000-0000-000000000005',
  '30000000-0000-0000-0000-000000000002',
  '<p>Pending content</p>',
  '10000000-0000-0000-0000-000000000001',
  'pending',
  'article-publication-pending',
  '2026-01-04T00:00:00Z',
  'Pending title',
  '20000000-0000-0000-0000-000000000001',
  'pending-character'
);

SELECT throws_ok(
  $$UPDATE public.articles
    SET current_version_id = '40000000-0000-0000-0000-000000000005'
    WHERE id = '30000000-0000-0000-0000-000000000002'$$,
  '23514',
  'Current article version must be approved and belong to the same article',
  'a non-approved current pointer is rejected'
);

UPDATE public.articles
SET title = 'Tampered title', character_id = 'tampered-character'
WHERE id = '30000000-0000-0000-0000-000000000002';

SELECT is(
  (SELECT title FROM public.articles
   WHERE id = '30000000-0000-0000-0000-000000000002'),
  'Complete current title',
  'direct title writes are synchronized back to the current snapshot'
);
SELECT is(
  (SELECT character_id FROM public.articles
   WHERE id = '30000000-0000-0000-0000-000000000002'),
  'complete-character',
  'direct character writes are synchronized back to the current snapshot'
);

SELECT * FROM finish();
ROLLBACK;
