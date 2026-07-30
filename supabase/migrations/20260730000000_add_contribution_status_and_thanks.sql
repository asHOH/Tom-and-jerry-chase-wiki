ALTER TABLE public.article_versions
  ADD COLUMN reviewed_by uuid REFERENCES public.users(id) ON DELETE SET NULL,
  ADD COLUMN reviewed_at timestamptz,
  ADD COLUMN review_feedback text;

ALTER TABLE public.article_versions
  ADD CONSTRAINT article_versions_review_feedback_length_check
  CHECK (review_feedback IS NULL OR char_length(review_feedback) <= 1000);

CREATE INDEX article_versions_editor_created_at_idx
  ON public.article_versions (editor_id, created_at DESC);

ALTER TABLE public.notifications
  DROP CONSTRAINT IF EXISTS notifications_kind_check;

ALTER TABLE public.notifications
  ADD CONSTRAINT notifications_kind_check CHECK (
    kind IN (
      'article_version_approved',
      'article_version_rejected',
      'game_data_action_approved',
      'game_data_action_rejected',
      'article_comment_created',
      'article_version_created',
      'game_data_action_created',
      'discussion_comment_created',
      'contribution_thanked'
    )
  );

DROP FUNCTION IF EXISTS public.prepared_article_version_moderation(uuid, inet, uuid, text);

CREATE FUNCTION public.prepared_article_version_moderation(
  p_actor_id uuid,
  p_ip inet,
  p_version_id uuid,
  p_action text,
  p_feedback text DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_article_id uuid;
  v_category_id uuid;
  v_feedback text := NULLIF(btrim(p_feedback), '');
BEGIN
  IF v_feedback IS NOT NULL AND char_length(v_feedback) > 1000 THEN
    RAISE EXCEPTION 'Review feedback is too long';
  END IF;

  SELECT av.article_id, a.category_id
  INTO v_article_id, v_category_id
  FROM public.article_versions av
  JOIN public.articles a ON a.id = av.article_id
  WHERE av.id = p_version_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Article version not found';
  END IF;

  PERFORM public.assert_actor_not_blocked(
    p_actor_id, p_ip, 'edit', 'articles', v_article_id::text
  );
  PERFORM public.assert_actor_not_blocked(
    p_actor_id, p_ip, 'edit', 'categories', v_category_id::text
  );
  PERFORM set_config('request.jwt.claim.sub', p_actor_id::text, true);

  IF p_action = 'approve' THEN
    PERFORM public.approve_article_version(p_version_id);
    UPDATE public.article_versions
    SET reviewed_by = p_actor_id, reviewed_at = now(), review_feedback = v_feedback
    WHERE id = p_version_id;
  ELSIF p_action = 'reject' THEN
    PERFORM public.reject_article_version(p_version_id);
    UPDATE public.article_versions
    SET reviewed_by = p_actor_id, reviewed_at = now(), review_feedback = v_feedback
    WHERE id = p_version_id;
  ELSIF p_action = 'revoke' THEN
    PERFORM public.revoke_article_version(p_version_id);
  ELSE
    RAISE EXCEPTION 'Invalid moderation action';
  END IF;
END;
$$;

GRANT EXECUTE ON FUNCTION public.prepared_article_version_moderation(
  uuid, inet, uuid, text, text
) TO service_role;

REVOKE ALL ON FUNCTION public.prepared_article_version_moderation(
  uuid, inet, uuid, text, text
) FROM PUBLIC, anon, authenticated;
