-- Keep the published article metadata and content anchored to the same approved version.
-- `created_at` records submission time, so it cannot determine publication order when
-- moderation approves pending versions out of order.

CREATE SEQUENCE public.article_version_publication_revision_seq;

ALTER TABLE public.article_versions
  ADD COLUMN publication_revision bigint,
  ADD COLUMN metadata_snapshot_complete boolean
    GENERATED ALWAYS AS (
      proposed_title IS NOT NULL AND proposed_category_id IS NOT NULL
    ) STORED;

ALTER SEQUENCE public.article_version_publication_revision_seq
  OWNED BY public.article_versions.publication_revision;

ALTER TABLE public.articles
  ADD COLUMN current_version_id uuid;

-- Preserve the publication order previously observed by readers for existing data.
WITH ranked_versions AS (
  SELECT
    id,
    row_number() OVER (ORDER BY created_at, id)::bigint AS publication_revision
  FROM public.article_versions
  WHERE status = 'approved'
)
UPDATE public.article_versions AS article_version
SET publication_revision = ranked_versions.publication_revision
FROM ranked_versions
WHERE article_version.id = ranked_versions.id;

DO $$
DECLARE
  max_publication_revision bigint;
BEGIN
  SELECT max(publication_revision)
  INTO max_publication_revision
  FROM public.article_versions;

  IF max_publication_revision IS NULL THEN
    PERFORM setval('public.article_version_publication_revision_seq', 1, false);
  ELSE
    PERFORM setval(
      'public.article_version_publication_revision_seq',
      max_publication_revision,
      true
    );
  END IF;
END;
$$;

CREATE UNIQUE INDEX article_versions_publication_revision_idx
  ON public.article_versions (publication_revision)
  WHERE publication_revision IS NOT NULL;

ALTER TABLE public.article_versions
  ADD CONSTRAINT article_versions_approved_publication_revision_check
  CHECK (status <> 'approved' OR publication_revision IS NOT NULL);

-- The backfill intentionally matches the old reader behavior, then makes the selected
-- version explicit and repairs metadata to match its content.
WITH current_versions AS (
  SELECT DISTINCT ON (article_id)
    article_id,
    id,
    proposed_title,
    proposed_category_id,
    proposed_character_id,
    metadata_snapshot_complete
  FROM public.article_versions
  WHERE status = 'approved'
  ORDER BY article_id, created_at DESC, id DESC
)
UPDATE public.articles AS article
SET
  current_version_id = current_version.id,
  title = CASE
    WHEN current_version.metadata_snapshot_complete
      THEN current_version.proposed_title
    ELSE article.title
  END,
  category_id = CASE
    WHEN current_version.metadata_snapshot_complete
      THEN current_version.proposed_category_id
    ELSE article.category_id
  END,
  character_id = CASE
    WHEN current_version.metadata_snapshot_complete
      THEN current_version.proposed_character_id
    ELSE article.character_id
  END
FROM current_versions AS current_version
WHERE article.id = current_version.article_id;

ALTER TABLE public.article_versions
  ADD CONSTRAINT article_versions_article_id_id_key
  UNIQUE (article_id, id);

ALTER TABLE public.articles
  ADD CONSTRAINT articles_current_version_id_fkey
  FOREIGN KEY (id, current_version_id)
  REFERENCES public.article_versions(article_id, id);

CREATE INDEX articles_current_version_id_idx
  ON public.articles (current_version_id)
  WHERE current_version_id IS NOT NULL;

CREATE OR REPLACE VIEW public.article_versions_public_view
WITH (security_invoker = true)
AS
SELECT
  id,
  article_id,
  content,
  editor_id,
  status,
  created_at,
  commit_message,
  publication_revision
FROM public.article_versions;

CREATE OR REPLACE FUNCTION public.enforce_article_current_version()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  published_version public.article_versions%ROWTYPE;
BEGIN
  IF NEW.current_version_id IS NULL THEN
    RETURN NEW;
  END IF;

  SELECT article_version.*
  INTO published_version
  FROM public.article_versions AS article_version
  WHERE article_version.id = NEW.current_version_id
    AND article_version.article_id = NEW.id
    AND article_version.status = 'approved';

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Current article version must be approved and belong to the same article'
      USING ERRCODE = '23514';
  END IF;

  IF published_version.metadata_snapshot_complete THEN
    NEW.title := published_version.proposed_title;
    NEW.category_id := published_version.proposed_category_id;
    NEW.character_id := published_version.proposed_character_id;
  ELSIF TG_OP = 'INSERT'
    OR OLD.current_version_id IS DISTINCT FROM NEW.current_version_id
  THEN
    RAISE EXCEPTION 'Cannot publish an article version with an incomplete metadata snapshot'
      USING ERRCODE = '23514';
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER article_enforce_current_version
  BEFORE INSERT OR UPDATE OF current_version_id, title, category_id, character_id
  ON public.articles
  FOR EACH ROW
  EXECUTE FUNCTION public.enforce_article_current_version();

-- Public visibility now follows the same explicit pointer as public readers.
DROP POLICY IF EXISTS "Anon can view approved articles" ON public.articles;
CREATE POLICY "Anon can view approved articles"
  ON public.articles
  FOR SELECT
  TO anon
  USING (current_version_id IS NOT NULL);

CREATE OR REPLACE FUNCTION public.can_view_article(p_user_id uuid, p_article_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.articles AS article
    WHERE article.id = p_article_id
      AND (
        article.current_version_id IS NOT NULL
        OR public.can_access_article(
          p_user_id,
          'article.update_any',
          article.id,
          article.category_id
        )
        OR (
          article.author_id = p_user_id
          AND public.can_access_article(
            p_user_id,
            'article.update_own',
            article.id,
            article.category_id
          )
        )
        OR public.can_moderate_article(p_user_id, article.id)
      )
  );
$$;

CREATE OR REPLACE FUNCTION public.assign_article_version_publication_revision()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  IF NEW.status = 'approved'
    AND (TG_OP = 'INSERT' OR OLD.status IS DISTINCT FROM 'approved')
  THEN
    -- Take the same per-article lock used by pointer synchronization before
    -- allocating the revision, so revision order matches publication order.
    PERFORM 1
    FROM public.articles
    WHERE id = NEW.article_id
    FOR UPDATE;

    NEW.publication_revision := nextval(
      'public.article_version_publication_revision_seq'
    );
  ELSIF TG_OP = 'UPDATE' THEN
    NEW.publication_revision := OLD.publication_revision;
  ELSE
    NEW.publication_revision := NULL;
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER article_version_assign_publication_revision
  BEFORE INSERT OR UPDATE OF status, publication_revision
  ON public.article_versions
  FOR EACH ROW
  EXECUTE FUNCTION public.assign_article_version_publication_revision();

CREATE OR REPLACE FUNCTION public.sync_article_current_version()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  fallback_version public.article_versions%ROWTYPE;
BEGIN
  IF NEW.status = 'approved'
    AND (TG_OP = 'INSERT' OR OLD.status IS DISTINCT FROM 'approved')
  THEN
    -- Serialize publication changes for one article before changing its pointer.
    PERFORM 1
    FROM public.articles
    WHERE id = NEW.article_id
    FOR UPDATE;

    UPDATE public.articles
    SET current_version_id = NEW.id
    WHERE id = NEW.article_id;
  ELSIF TG_OP = 'UPDATE'
    AND OLD.status = 'approved'
    AND NEW.status IS DISTINCT FROM 'approved'
  THEN
    -- Only revoking the published pointer is a rollback. Revoking an older
    -- approved version must not disturb the version currently being served.
    PERFORM 1
    FROM public.articles
    WHERE id = NEW.article_id
    FOR UPDATE;

    IF EXISTS (
      SELECT 1
      FROM public.articles
      WHERE id = NEW.article_id
        AND current_version_id = OLD.id
    ) THEN
      SELECT approved_version.*
      INTO fallback_version
      FROM public.article_versions AS approved_version
      WHERE approved_version.article_id = NEW.article_id
        AND approved_version.status = 'approved'
        AND approved_version.id <> OLD.id
      ORDER BY
        approved_version.publication_revision DESC NULLS LAST,
        approved_version.created_at DESC,
        approved_version.id DESC
      LIMIT 1;

      IF FOUND THEN
        -- The article pointer guard rejects legacy fallbacks whose metadata
        -- snapshot is incomplete, rolling back the revocation transaction.
        UPDATE public.articles
        SET current_version_id = fallback_version.id
        WHERE id = NEW.article_id;
      ELSE
        UPDATE public.articles
        SET current_version_id = NULL
        WHERE id = NEW.article_id;
      END IF;
    END IF;
  END IF;

  RETURN NULL;
END;
$$;

CREATE TRIGGER article_version_sync_current
  AFTER INSERT OR UPDATE OF status
  ON public.article_versions
  FOR EACH ROW
  EXECUTE FUNCTION public.sync_article_current_version();

REVOKE ALL ON FUNCTION public.assign_article_version_publication_revision()
  FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.enforce_article_current_version()
  FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.sync_article_current_version()
  FROM PUBLIC, anon, authenticated;
REVOKE ALL ON SEQUENCE public.article_version_publication_revision_seq
  FROM PUBLIC, anon, authenticated;
