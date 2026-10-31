-- Keep the conflict prefix compatible with existing submission and moderation handlers.
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

    IF NOT NEW.base_version_known THEN
      RAISE EXCEPTION 'article_edit_conflict_unknown_base';
    END IF;
    IF NEW.base_version_id IS DISTINCT FROM (
      SELECT current_version_id FROM public.articles WHERE id = NEW.article_id
    ) THEN
      RAISE EXCEPTION 'article_edit_conflict_outdated_base';
    END IF;

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
