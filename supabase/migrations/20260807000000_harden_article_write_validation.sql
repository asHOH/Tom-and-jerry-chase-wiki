ALTER TABLE public.categories
  ADD COLUMN requires_character boolean NOT NULL DEFAULT false;

UPDATE public.categories
SET requires_character = true
WHERE name = '角色攻略';

COMMENT ON COLUMN public.categories.requires_character IS
  'Whether this category and its descendants require an article character binding.';

CREATE OR REPLACE FUNCTION public.is_game_strategy_category(p_category_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SET search_path = public
AS $$
  WITH RECURSIVE category_ancestors AS (
    SELECT id, parent_category_id, requires_character
    FROM public.categories
    WHERE id = p_category_id

    UNION

    SELECT parent.id, parent.parent_category_id, parent.requires_character
    FROM public.categories AS parent
    INNER JOIN category_ancestors AS child
      ON parent.id = child.parent_category_id
  )
  SELECT EXISTS (
    SELECT 1
    FROM category_ancestors
    WHERE requires_character
  );
$$;

DROP FUNCTION IF EXISTS public.prepared_update_pending_article(
  uuid, inet, uuid, uuid, text, text, uuid
);
DROP FUNCTION IF EXISTS public.update_pending_article(uuid, uuid, text, text, uuid);

CREATE FUNCTION public.update_pending_article(
  p_version_id uuid,
  p_article_id uuid,
  p_title text,
  p_content text,
  p_category_id uuid,
  p_character_id text,
  p_update_character boolean
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_uid uuid := auth.uid();
  v_status public.version_status;
  v_count integer;
  v_author uuid;
  v_current_category uuid;
BEGIN
  SELECT author_id, category_id INTO v_author, v_current_category
  FROM public.articles WHERE id = p_article_id;
  IF NOT (
    public.can_access_article(v_uid, 'article.update_any', p_article_id, v_current_category)
    OR (v_author = v_uid AND public.can_access_article(
      v_uid, 'article.update_own', p_article_id, v_current_category
    ))
  ) THEN RAISE EXCEPTION 'Insufficient permissions'; END IF;
  IF p_category_id <> v_current_category AND NOT (
    public.user_has_permission(v_uid, 'article.update_any', 'categories', p_category_id::text)
    OR public.user_has_permission(v_uid, 'article.update_own', 'categories', p_category_id::text)
  ) THEN RAISE EXCEPTION 'Insufficient permissions'; END IF;
  SELECT count(*) INTO v_count FROM public.article_versions WHERE article_id = p_article_id;
  IF v_count > 1 THEN
    RAISE EXCEPTION 'Can only modify new article submissions, not modification requests for existing articles.';
  END IF;
  SELECT status INTO v_status FROM public.article_versions WHERE id = p_version_id;
  IF NOT FOUND THEN RAISE EXCEPTION 'Article version not found'; END IF;
  IF v_status <> 'pending' THEN RAISE EXCEPTION 'Only pending articles can be modified'; END IF;
  UPDATE public.article_versions SET
    content = p_content,
    editor_id = v_uid,
    proposed_title = p_title,
    proposed_category_id = p_category_id,
    proposed_character_id = CASE
      WHEN p_update_character THEN p_character_id
      ELSE proposed_character_id
    END
  WHERE id = p_version_id;
END;
$$;

CREATE FUNCTION public.prepared_update_pending_article(
  p_actor_id uuid,
  p_ip inet,
  p_version_id uuid,
  p_article_id uuid,
  p_title text,
  p_content text,
  p_category_id uuid,
  p_character_id text DEFAULT NULL,
  p_update_character boolean DEFAULT false
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  PERFORM public.assert_actor_not_blocked(p_actor_id, p_ip, 'edit', 'articles', p_article_id::text);
  PERFORM public.assert_actor_not_blocked(p_actor_id, p_ip, 'edit', 'categories', p_category_id::text);
  PERFORM set_config('request.jwt.claim.sub', p_actor_id::text, true);
  PERFORM public.update_pending_article(
    p_version_id,
    p_article_id,
    p_title,
    p_content,
    p_category_id,
    p_character_id,
    p_update_character
  );
END;
$$;

REVOKE ALL ON FUNCTION public.update_pending_article(uuid, uuid, text, text, uuid, text, boolean)
FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.prepared_update_pending_article(
  uuid, inet, uuid, uuid, text, text, uuid, text, boolean
)
FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.prepared_update_pending_article(
  uuid, inet, uuid, uuid, text, text, uuid, text, boolean
)
TO service_role;
