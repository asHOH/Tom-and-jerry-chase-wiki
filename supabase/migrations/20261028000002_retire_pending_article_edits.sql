-- Pending content changes always create a new version, keeping moderation targets immutable.
DROP FUNCTION public.prepared_update_pending_article(uuid, inet, uuid, uuid, text, text, uuid, text, boolean, uuid, uuid);
DROP FUNCTION public.update_pending_article(uuid, uuid, text, text, uuid, text, boolean, uuid, uuid);
DROP FUNCTION public.prepared_article_submission_request(uuid, uuid, text, inet, uuid, text, text, uuid, text, text, uuid, uuid, uuid, uuid);
ALTER TABLE public.article_versions DROP COLUMN draft_revision;

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


REVOKE ALL ON FUNCTION public.prepared_article_submission_request(uuid, uuid, text, inet, uuid, text, text, uuid, text, text, uuid, uuid, uuid) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.prepared_article_submission_request(uuid, uuid, text, inet, uuid, text, text, uuid, text, text, uuid, uuid, uuid) TO service_role;
