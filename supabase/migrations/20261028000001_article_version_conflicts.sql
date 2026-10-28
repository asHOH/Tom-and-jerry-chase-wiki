-- Unknown historical bases stay explicit until the author reconciles the draft.
ALTER TABLE public.article_versions
  ADD COLUMN base_version_id uuid,
  ADD COLUMN base_version_known boolean NOT NULL DEFAULT false,
  ADD COLUMN draft_revision uuid NOT NULL DEFAULT gen_random_uuid();

DROP FUNCTION public.prepared_article_submission_request(uuid, uuid, text, inet, uuid, text, text, uuid, text, text);
DROP FUNCTION public.prepared_submit_article(uuid, inet, uuid, text, text, uuid, text, text);
DROP FUNCTION public.submit_article(uuid, text, text, uuid, text, text);
DROP FUNCTION public.prepared_update_pending_article(uuid, inet, uuid, uuid, text, text, uuid, text, boolean);
DROP FUNCTION public.update_pending_article(uuid, uuid, text, text, uuid, text, boolean);

CREATE OR REPLACE FUNCTION public.submit_article(
  p_article_id uuid,
  p_title text,
  p_content text,
  p_category_id uuid,
  p_character_id text DEFAULT NULL,
  p_commit_message text DEFAULT NULL,
  p_base_version_id uuid DEFAULT NULL
)
RETURNS TABLE (submitted_version_id uuid, submitted_status public.version_status) AS $$
DECLARE
  current_user_id uuid := auth.uid();
  category_visibility public.version_status;
  new_status public.version_status;
  article_author uuid;
  current_category_id uuid;
  v_anchor_time timestamptz;
  can_update_any boolean;
  can_update_own boolean;
  is_new_article boolean;
BEGIN
  IF current_user_id IS NULL THEN RAISE EXCEPTION 'Authentication required'; END IF;
  SELECT author_id, category_id INTO article_author, current_category_id
  FROM public.articles WHERE id = p_article_id FOR UPDATE;
  IF article_author IS NULL THEN RAISE EXCEPTION 'Article not found'; END IF;
  IF (SELECT current_version_id FROM public.articles WHERE id = p_article_id) IS DISTINCT FROM p_base_version_id
  THEN RAISE EXCEPTION 'article_edit_conflict'; END IF;

  can_update_any := public.can_access_article(
    current_user_id, 'article.update_any', p_article_id, current_category_id
  );
  can_update_own := article_author = current_user_id AND public.can_access_article(
    current_user_id, 'article.update_own', p_article_id, current_category_id
  );
  SELECT NOT EXISTS (
    SELECT 1 FROM public.article_versions WHERE article_id = p_article_id
  ) INTO is_new_article;
  IF NOT can_update_any AND NOT can_update_own AND NOT (
    is_new_article AND article_author = current_user_id
    AND public.user_has_permission(current_user_id, 'article.create', 'categories', p_category_id::text)
  ) THEN RAISE EXCEPTION 'Forbidden'; END IF;
  IF p_category_id <> current_category_id AND NOT (
    public.user_has_permission(current_user_id, 'article.update_any', 'categories', p_category_id::text)
    OR (can_update_own AND public.user_has_permission(
      current_user_id, 'article.update_own', 'categories', p_category_id::text
    ))
  ) THEN RAISE EXCEPTION 'Forbidden'; END IF;

  SELECT default_visibility INTO category_visibility FROM public.categories WHERE id = p_category_id;
  IF NOT FOUND THEN RAISE EXCEPTION 'Category not found'; END IF;
  IF public.user_has_permission(
    current_user_id, 'article_version.approve', 'articles', p_article_id::text
  ) OR public.user_has_permission(
    current_user_id, 'article_version.approve', 'categories', p_category_id::text
  ) THEN new_status := 'approved';
  ELSE new_status := COALESCE(category_visibility, 'pending');
  END IF;

  IF new_status = 'pending' THEN
    SELECT created_at INTO v_anchor_time FROM public.article_versions
    WHERE article_id = p_article_id AND editor_id = current_user_id AND status = 'pending'
    ORDER BY created_at ASC LIMIT 1;
    UPDATE public.article_versions SET status = 'revoked'
    WHERE article_id = p_article_id AND editor_id = current_user_id AND status = 'pending';
  END IF;

  INSERT INTO public.article_versions (
    article_id, content, editor_id, status, preview_token, commit_message,
    proposed_title, proposed_category_id, proposed_character_id, created_at, base_version_id, base_version_known
  ) VALUES (
    p_article_id, p_content, current_user_id, new_status,
    encode(extensions.gen_random_bytes(16), 'hex'), p_commit_message,
    p_title, p_category_id, p_character_id, COALESCE(v_anchor_time, now()), p_base_version_id, true
  ) RETURNING article_versions.id, article_versions.status
    INTO submitted_version_id, submitted_status;

  IF new_status = 'approved' THEN
    UPDATE public.articles SET title = p_title, category_id = p_category_id,
      character_id = p_character_id WHERE id = p_article_id;
  END IF;
  RETURN NEXT;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, extensions, pg_temp;

CREATE OR REPLACE FUNCTION public.prepared_submit_article(
  p_actor_id uuid,
  p_ip inet,
  p_article_id uuid,
  p_title text,
  p_content text,
  p_category_id uuid,
  p_character_id text DEFAULT NULL,
  p_commit_message text DEFAULT NULL,
  p_base_version_id uuid DEFAULT NULL
)
RETURNS TABLE (submitted_version_id uuid, submitted_status public.version_status)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions, pg_temp
AS $$
BEGIN
  PERFORM public.assert_actor_not_blocked(p_actor_id, p_ip, 'edit', 'articles', p_article_id::text);
  PERFORM public.assert_actor_not_blocked(p_actor_id, p_ip, 'edit', 'categories', p_category_id::text);
  PERFORM set_config('request.jwt.claim.sub', p_actor_id::text, true);
  RETURN QUERY SELECT * FROM public.submit_article(
    p_article_id, p_title, p_content, p_category_id, p_character_id, p_commit_message, p_base_version_id
  );
END;
$$;

CREATE FUNCTION public.prepared_article_submission_request(
  p_operation_id uuid,
  p_actor_id uuid,
  p_request_fingerprint text,
  p_ip inet,
  p_article_id uuid,
  p_title text,
  p_content text,
  p_category_id uuid,
  p_character_id text,
  p_commit_message text,
  p_expected_base_version_id uuid,
  p_expected_pending_version_id uuid,
  p_expected_pending_revision uuid,
  p_source_pending_version_id uuid
)
RETURNS TABLE (
  article_id uuid, submitted_version_id uuid,
  submitted_status public.version_status, replayed boolean
)
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public, extensions, pg_temp
AS $$
DECLARE
  inserted_count integer;
  receipt public.article_submission_requests%ROWTYPE;
  current_base uuid;
  pending_version public.article_versions%ROWTYPE;
BEGIN
  IF p_actor_id IS NULL OR p_operation_id IS NULL
    OR p_operation_id::text !~ '^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$'
    OR p_request_fingerprint IS NULL OR p_request_fingerprint !~ '^[0-9a-f]{64}$'
  THEN RAISE EXCEPTION 'invalid_idempotency_key'; END IF;

  INSERT INTO public.article_submission_requests(operation_id, actor_id, request_fingerprint)
  VALUES (p_operation_id, p_actor_id, p_request_fingerprint)
  ON CONFLICT (operation_id) DO NOTHING;
  GET DIAGNOSTICS inserted_count = ROW_COUNT;

  IF inserted_count = 0 THEN
    SELECT * INTO receipt FROM public.article_submission_requests
    WHERE operation_id = p_operation_id FOR UPDATE;
    IF receipt.actor_id IS DISTINCT FROM p_actor_id
      OR receipt.request_fingerprint IS DISTINCT FROM p_request_fingerprint
    THEN RAISE EXCEPTION 'idempotency_key_reused'; END IF;
    IF receipt.version_id IS NULL THEN RAISE EXCEPTION 'idempotency_operation_incomplete'; END IF;
    RETURN QUERY SELECT receipt.article_id, receipt.version_id, receipt.initial_status, true;
    RETURN;
  END IF;

  IF p_article_id IS NULL THEN
    SELECT result.article_id, result.submitted_version_id, result.submitted_status
    INTO article_id, submitted_version_id, submitted_status
    FROM public.prepared_create_article(
      p_actor_id, p_ip, p_title, p_content, p_category_id, p_character_id, p_commit_message
    ) result;
  ELSE
    SELECT current_version_id INTO current_base FROM public.articles WHERE id = p_article_id FOR UPDATE;
    IF NOT FOUND THEN RAISE EXCEPTION 'Article not found'; END IF;
    SELECT * INTO pending_version FROM public.article_versions
    WHERE article_versions.article_id = p_article_id AND editor_id = p_actor_id AND status = 'pending'
    ORDER BY created_at DESC, id DESC LIMIT 1 FOR UPDATE;
    IF current_base IS DISTINCT FROM p_expected_base_version_id
      OR pending_version.id IS DISTINCT FROM p_expected_pending_version_id
      OR pending_version.draft_revision IS DISTINCT FROM p_expected_pending_revision
    THEN RAISE EXCEPTION 'article_edit_conflict'; END IF;
    IF p_source_pending_version_id IS NOT NULL AND (
      p_source_pending_version_id IS DISTINCT FROM pending_version.id
      OR NOT pending_version.base_version_known
      OR pending_version.base_version_id IS DISTINCT FROM p_expected_base_version_id
    ) THEN RAISE EXCEPTION 'article_edit_conflict'; END IF;
    article_id := p_article_id;
    SELECT result.submitted_version_id, result.submitted_status
    INTO submitted_version_id, submitted_status
    FROM public.prepared_submit_article(
      p_actor_id, p_ip, p_article_id, p_title, p_content, p_category_id, p_character_id, p_commit_message, p_expected_base_version_id
    ) result;
  END IF;
  IF submitted_version_id IS NULL THEN RAISE EXCEPTION 'article_submission_result_missing'; END IF;

  UPDATE public.article_submission_requests AS request
  SET article_id = prepared_article_submission_request.article_id,
      version_id = submitted_version_id, initial_status = submitted_status
  WHERE request.operation_id = p_operation_id;
  replayed := false;
  RETURN NEXT;
END;
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

    IF NOT NEW.base_version_known OR NEW.base_version_id IS DISTINCT FROM (
      SELECT current_version_id FROM public.articles WHERE id = NEW.article_id
    ) THEN RAISE EXCEPTION 'article_edit_conflict'; END IF;

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

CREATE FUNCTION public.update_pending_article(
  p_version_id uuid,
  p_article_id uuid,
  p_title text,
  p_content text,
  p_category_id uuid,
  p_character_id text,
  p_update_character boolean,
  p_expected_base_version_id uuid,
  p_expected_revision uuid
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
  FROM public.articles WHERE id = p_article_id FOR UPDATE;
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
  SELECT status INTO v_status FROM public.article_versions WHERE id = p_version_id AND article_id = p_article_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Article version not found'; END IF;
  IF v_status <> 'pending' THEN RAISE EXCEPTION 'Only pending articles can be modified'; END IF;
  IF NOT EXISTS (
    SELECT 1 FROM public.article_versions v JOIN public.articles a ON a.id = v.article_id
    WHERE v.id = p_version_id AND v.base_version_known
      AND v.base_version_id IS NOT DISTINCT FROM p_expected_base_version_id
      AND a.current_version_id IS NOT DISTINCT FROM p_expected_base_version_id
      AND v.draft_revision = p_expected_revision
  ) THEN RAISE EXCEPTION 'article_edit_conflict'; END IF;
  UPDATE public.article_versions SET
    draft_revision = gen_random_uuid(),
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
  p_character_id text,
  p_update_character boolean,
  p_expected_base_version_id uuid,
  p_expected_revision uuid
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
    p_update_character,
    p_expected_base_version_id,
    p_expected_revision
  );
END;
$$;


REVOKE ALL ON FUNCTION public.submit_article(uuid, text, text, uuid, text, text, uuid) FROM PUBLIC, anon, authenticated, service_role;
REVOKE ALL ON FUNCTION public.prepared_submit_article(uuid, inet, uuid, text, text, uuid, text, text, uuid) FROM PUBLIC, anon, authenticated, service_role;
REVOKE ALL ON FUNCTION public.update_pending_article(uuid, uuid, text, text, uuid, text, boolean, uuid, uuid) FROM PUBLIC, anon, authenticated, service_role;
REVOKE ALL ON FUNCTION public.prepared_article_submission_request(uuid, uuid, text, inet, uuid, text, text, uuid, text, text, uuid, uuid, uuid, uuid) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.prepared_article_submission_request(uuid, uuid, text, inet, uuid, text, text, uuid, text, text, uuid, uuid, uuid, uuid) TO service_role;
REVOKE ALL ON FUNCTION public.prepared_update_pending_article(uuid, inet, uuid, uuid, text, text, uuid, text, boolean, uuid, uuid) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.prepared_update_pending_article(uuid, inet, uuid, uuid, text, text, uuid, text, boolean, uuid, uuid) TO service_role;

CREATE OR REPLACE FUNCTION public.prepared_article_version_moderation(
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

  -- All article mutations acquire the article lock before any version lock.
  SELECT category_id INTO v_category_id FROM public.articles WHERE id = v_article_id FOR UPDATE;

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

