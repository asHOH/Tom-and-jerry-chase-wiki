-- This production-only archive subsystem is not used by application code.
-- Avoid CASCADE so unexpected external dependencies block retirement instead
-- of being removed implicitly.
DROP TRIGGER IF EXISTS trg_archive_article_versions_before_delete ON public.articles;

DROP FUNCTION IF EXISTS public.archive_article_versions_before_article_delete();

DROP TABLE IF EXISTS public.article_versions_archive;
