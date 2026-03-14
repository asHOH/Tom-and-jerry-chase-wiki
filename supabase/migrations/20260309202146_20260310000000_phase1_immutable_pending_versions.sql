-- Phase 1: Make pending article submissions immutable to prevent moderation bait-and-switch.
-- Also split moderation errors so stale approve/reject actions can return HTTP 409.

CREATE OR REPLACE FUNCTION public.submit_article(
  p_article_id uuid,
  p_title text,
  p_content text,
  p_category_id uuid,
  p_character_id text DEFAULT NULL,
  p_commit_message text DEFAULT NULL
)
RETURNS void AS $$
DECLARE
  current_user_id uuid := auth.uid();
  category_visibility version_status;
  editor_role role_type;
  new_status version_status;
  article_author uuid;
BEGIN
  IF current_user_id IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;

  SELECT public.get_user_role(current_user_id) INTO editor_role;

  SELECT author_id INTO article_author FROM public.articles WHERE id = p_article_id;
  IF article_author IS NULL THEN
    RAISE EXCEPTION 'Article not found';
  END IF;

  IF article_author <> current_user_id AND editor_role NOT IN ('Coordinator', 'Reviewer') THEN
    RAISE EXCEPTION 'Forbidden';
  END IF;

  SELECT default_visibility
  INTO category_visibility
  FROM public.categories
  WHERE id = p_category_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Category not found';
  END IF;

  IF editor_role IN ('Coordinator', 'Reviewer') THEN
    new_status := 'approved';
  ELSE
    new_status := COALESCE(category_visibility, 'pending');
  END IF;

  -- Immutable pending versions:
  -- if this submit is pending, invalidate all existing own pending versions first,
  -- then insert a brand-new pending row with a new id/preview token.
  IF new_status = 'pending' THEN
    UPDATE public.article_versions
    SET status = 'revoked'
    WHERE article_id = p_article_id
      AND editor_id = current_user_id
      AND status = 'pending';
  END IF;

  INSERT INTO public.article_versions (
    article_id,
    content,
    editor_id,
    status,
    preview_token,
    commit_message,
    created_at
  )
  VALUES (
    p_article_id,
    p_content,
    current_user_id,
    new_status,
    encode(extensions.gen_random_bytes(16), 'hex'),
    p_commit_message,
    now()
  );

  UPDATE public.articles
  SET
    title = p_title,
    category_id = p_category_id,
    character_id = p_character_id
  WHERE id = p_article_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, extensions, pg_temp;


CREATE OR REPLACE FUNCTION public.approve_article_version(p_version_id uuid)
RETURNS void AS $$
DECLARE
  current_user_id uuid := auth.uid();
  target_status public.version_status;
BEGIN
  IF current_user_id IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;

  IF public.get_user_role(current_user_id) NOT IN ('Reviewer', 'Coordinator') THEN
    RAISE EXCEPTION 'Insufficient permissions to approve article versions';
  END IF;

  SELECT status
  INTO target_status
  FROM public.article_versions
  WHERE id = p_version_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Article version not found';
  END IF;

  IF target_status <> 'pending' THEN
    RAISE EXCEPTION 'Article version not in pending status';
  END IF;

  UPDATE public.article_versions
  SET status = 'approved'
  WHERE id = p_version_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, extensions, pg_temp;


CREATE OR REPLACE FUNCTION public.reject_article_version(p_version_id uuid)
RETURNS void AS $$
DECLARE
  current_user_id uuid := auth.uid();
  target_status public.version_status;
BEGIN
  IF current_user_id IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;

  IF public.get_user_role(current_user_id) NOT IN ('Reviewer', 'Coordinator') THEN
    RAISE EXCEPTION 'Insufficient permissions to reject article versions';
  END IF;

  SELECT status
  INTO target_status
  FROM public.article_versions
  WHERE id = p_version_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Article version not found';
  END IF;

  IF target_status <> 'pending' THEN
    RAISE EXCEPTION 'Article version not in pending status';
  END IF;

  UPDATE public.article_versions
  SET status = 'rejected'
  WHERE id = p_version_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, extensions, pg_temp;
