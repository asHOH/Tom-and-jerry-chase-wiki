-- Add talk page support: expand comment scopes, topics, moderation

-- 1. Expand comment_scope enum with new entity types
ALTER TYPE comment_scope ADD VALUE IF NOT EXISTS 'entities';
ALTER TYPE comment_scope ADD VALUE IF NOT EXISTS 'items';
ALTER TYPE comment_scope ADD VALUE IF NOT EXISTS 'buffs';
ALTER TYPE comment_scope ADD VALUE IF NOT EXISTS 'maps';
ALTER TYPE comment_scope ADD VALUE IF NOT EXISTS 'fixtures';
ALTER TYPE comment_scope ADD VALUE IF NOT EXISTS 'modes';
ALTER TYPE comment_scope ADD VALUE IF NOT EXISTS 'achievements';
ALTER TYPE comment_scope ADD VALUE IF NOT EXISTS 'special_skills';
ALTER TYPE comment_scope ADD VALUE IF NOT EXISTS 'list_pages';

-- 2. Add title column for topic-based discussions
ALTER TABLE public.comments
ADD COLUMN IF NOT EXISTS title text DEFAULT NULL;

-- 3. Partial index for efficient topic queries
CREATE INDEX IF NOT EXISTS comments_topics_idx
ON comments (scope, target_id, created_at DESC)
WHERE title IS NOT NULL AND parent_id IS NULL;

-- 4. Drop old create_comment signature (4 params) to avoid overloading ambiguity,
-- then create the new version with 5 params (p_title added).
DROP FUNCTION IF EXISTS public.create_comment(public.comment_scope, text, text, uuid);
CREATE OR REPLACE FUNCTION public.create_comment(
  p_scope public.comment_scope,
  p_target_id text,
  p_content text,
  p_parent_id uuid DEFAULT NULL,
  p_title text DEFAULT NULL
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_uid uuid;
  v_new_id uuid;
  v_parent_scope public.comment_scope;
  v_parent_target_id text;
  v_parent_status public.comment_status;
BEGIN
  v_uid := auth.uid();
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'unauthorized';
  END IF;

  -- target_id must be non-empty
  IF p_target_id IS NULL OR trim(p_target_id) = '' THEN
    RAISE EXCEPTION 'target_id_empty';
  END IF;

  -- Content validation
  p_content := trim(p_content);
  IF char_length(p_content) < 1 THEN
    RAISE EXCEPTION 'content_empty';
  END IF;
  IF char_length(p_content) > 2000 THEN
    RAISE EXCEPTION 'content_too_long';
  END IF;

  -- Title validation: only allowed for top-level comments
  IF p_parent_id IS NULL AND p_title IS NOT NULL THEN
    p_title := trim(p_title);
    IF char_length(p_title) < 1 THEN
      RAISE EXCEPTION 'title_empty';
    END IF;
    IF char_length(p_title) > 200 THEN
      RAISE EXCEPTION 'title_too_long';
    END IF;
  END IF;

  -- Replies cannot have a title
  IF p_parent_id IS NOT NULL AND p_title IS NOT NULL THEN
    RAISE EXCEPTION 'reply_with_title';
  END IF;

  -- Parent validation
  IF p_parent_id IS NOT NULL THEN
    SELECT c.scope, c.target_id, c.status
      INTO v_parent_scope, v_parent_target_id, v_parent_status
    FROM public.comments c
    WHERE c.id = p_parent_id;

    IF NOT FOUND THEN
      RAISE EXCEPTION 'parent_not_found';
    END IF;

    IF v_parent_scope <> p_scope OR v_parent_target_id <> p_target_id THEN
      RAISE EXCEPTION 'parent_mismatch';
    END IF;

    IF v_parent_status = 'deleted' THEN
      RAISE EXCEPTION 'parent_deleted';
    END IF;
  END IF;

  INSERT INTO public.comments (scope, target_id, parent_id, author_id, content, status, title)
  VALUES (p_scope, p_target_id, p_parent_id, v_uid, p_content, 'visible', p_title)
  RETURNING id INTO v_new_id;

  RETURN v_new_id;
END;
$$;

-- 5. Add set_comment_status RPC for moderation (admin only)
CREATE OR REPLACE FUNCTION public.set_comment_status(
  p_comment_id uuid,
  p_status public.comment_status
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_uid uuid;
  v_role public.role_type;
BEGIN
  v_uid := auth.uid();
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'unauthorized';
  END IF;

  v_role := public.get_user_role(v_uid);
  IF v_role NOT IN ('Reviewer', 'Coordinator') THEN
    RAISE EXCEPTION 'forbidden';
  END IF;

  UPDATE public.comments
  SET status = p_status
  WHERE id = p_comment_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'comment_not_found';
  END IF;
END;
$$;

-- 6. Recreate comments_public_view to include title column
DROP VIEW IF EXISTS comments_public_view;
CREATE VIEW comments_public_view
WITH (security_invoker = true)
AS
SELECT id, scope, target_id, parent_id, author_id, content, status, created_at, title
FROM comments;

-- 7. Data migration: set title for existing top-level article comments
UPDATE comments
SET title = LEFT(content, 100)
WHERE scope = 'articles' AND parent_id IS NULL AND title IS NULL;
