-- Comments functions

CREATE OR REPLACE FUNCTION public.create_comment(
  p_scope public.comment_scope,
  p_target_id text,
  p_content text,
  p_parent_id uuid DEFAULT NULL
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_uid uuid;
  v_new_id uuid;
  v_target_uuid uuid;
  v_parent_scope public.comment_scope;
  v_parent_target_id text;
  v_parent_status public.comment_status;
BEGIN
  v_uid := auth.uid();
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'unauthorized';
  END IF;

  -- Only articles are supported for now.
  IF p_scope <> 'articles' THEN
    RAISE EXCEPTION 'scope_not_supported';
  END IF;

  v_target_uuid := p_target_id::uuid;

  PERFORM 1 FROM public.articles a WHERE a.id = v_target_uuid;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'target_not_found';
  END IF;

  p_content := trim(p_content);
  IF char_length(p_content) < 1 THEN
    RAISE EXCEPTION 'content_empty';
  END IF;
  IF char_length(p_content) > 2000 THEN
    RAISE EXCEPTION 'content_too_long';
  END IF;

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

  INSERT INTO public.comments (scope, target_id, parent_id, author_id, content, status)
  VALUES (p_scope, p_target_id, p_parent_id, v_uid, p_content, 'visible')
  RETURNING id INTO v_new_id;

  RETURN v_new_id;
END;
$$;
