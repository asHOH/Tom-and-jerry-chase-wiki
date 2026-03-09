-- Phase 2: Add metadata snapshots to article_versions and only publish metadata on approval.

ALTER TABLE public.article_versions
  ADD COLUMN IF NOT EXISTS proposed_title text,
  ADD COLUMN IF NOT EXISTS proposed_category_id uuid,
  ADD COLUMN IF NOT EXISTS proposed_character_id text;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'article_versions_proposed_category_id_fkey'
      AND conrelid = 'public.article_versions'::regclass
  ) THEN
    ALTER TABLE public.article_versions
      ADD CONSTRAINT article_versions_proposed_category_id_fkey
      FOREIGN KEY (proposed_category_id)
      REFERENCES public.categories(id)
      ON DELETE RESTRICT;
  END IF;
END;
$$;

-- Backfill existing pending/rejected rows so future approvals have full metadata snapshots.
UPDATE public.article_versions av
SET
  proposed_title = COALESCE(av.proposed_title, a.title),
  proposed_category_id = COALESCE(av.proposed_category_id, a.category_id),
  proposed_character_id = COALESCE(av.proposed_character_id, a.character_id)
FROM public.articles a
WHERE av.article_id = a.id
  AND av.status IN ('pending', 'rejected');


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
  v_anchor_time timestamptz;
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

  IF new_status = 'pending' THEN
    -- Capture the queue anchor time from the oldest active pending row
    SELECT created_at INTO v_anchor_time
    FROM public.article_versions
    WHERE article_id = p_article_id
      AND editor_id = current_user_id
      AND status = 'pending'
    ORDER BY created_at ASC
    LIMIT 1;

    -- Keep pending snapshots immutable: replace prior own pending rows.
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
    proposed_title,
    proposed_category_id,
    proposed_character_id,
    created_at
  )
  VALUES (
    p_article_id,
    p_content,
    current_user_id,
    new_status,
    encode(extensions.gen_random_bytes(16), 'hex'),
    p_commit_message,
    p_title,
    p_category_id,
    p_character_id,
    COALESCE(v_anchor_time, now())
  );

  -- Metadata should only become public when the resulting version is approved.
  IF new_status = 'approved' THEN
    UPDATE public.articles
    SET
      title = p_title,
      category_id = p_category_id,
      character_id = p_character_id
    WHERE id = p_article_id;
  END IF;
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

  -- Publish metadata from the approved snapshot.
  UPDATE public.articles a
  SET
    title = COALESCE(v.proposed_title, a.title),
    category_id = COALESCE(v.proposed_category_id, a.category_id),
    character_id = v.proposed_character_id
  FROM public.article_versions v
  WHERE v.id = p_version_id
    AND a.id = v.article_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, extensions, pg_temp;


DROP FUNCTION IF EXISTS public.get_pending_versions_for_moderation();

CREATE OR REPLACE FUNCTION public.get_pending_versions_for_moderation()
RETURNS TABLE (
    version_id uuid,
    article_id uuid,
    original_title text,
    proposed_title text,
    content text,
    editor_id uuid,
    editor_nickname text,
    status public.version_status,
    created_at timestamptz,
    original_category_name text,
    proposed_category_name text,
    original_character_id text,
    proposed_character_id text,
    preview_token text,
    commit_message text
) AS $$
DECLARE
    current_user_id uuid := auth.uid();
BEGIN
    IF current_user_id IS NULL THEN
        RAISE EXCEPTION 'Authentication required';
    END IF;

    IF public.get_user_role(current_user_id) NOT IN ('Contributor', 'Reviewer', 'Coordinator') THEN
        RAISE EXCEPTION 'Insufficient permissions to view pending versions';
    END IF;

    RETURN QUERY
    SELECT
        av.id as version_id,
        av.article_id,
        a.title as original_title,
        av.proposed_title,
        av.content,
        av.editor_id,
        u.nickname as editor_nickname,
        av.status,
        av.created_at,
        oc.name as original_category_name,
        pc.name as proposed_category_name,
        a.character_id as original_character_id,
        av.proposed_character_id,
        av.preview_token,
        av.commit_message
    FROM public.article_versions av
    JOIN public.articles a ON av.article_id = a.id
    JOIN public.users u ON av.editor_id = u.id
    LEFT JOIN public.categories oc ON a.category_id = oc.id
    LEFT JOIN public.categories pc ON av.proposed_category_id = pc.id
    WHERE av.status IN ('pending', 'rejected')
      AND (
          public.get_user_role(current_user_id) IN ('Reviewer', 'Coordinator')
          OR av.editor_id = current_user_id
      )
    ORDER BY av.created_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, extensions, pg_temp;
