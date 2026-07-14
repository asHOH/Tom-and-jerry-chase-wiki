CREATE TABLE public.notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  kind text NOT NULL CHECK (
    kind IN (
      'article_version_approved',
      'article_version_rejected',
      'game_data_action_approved',
      'game_data_action_rejected'
    )
  ),
  title text NOT NULL,
  body text NOT NULL,
  href text,
  source_ids uuid[] NOT NULL DEFAULT '{}',
  dedupe_key text NOT NULL UNIQUE,
  read_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX notifications_user_created_at_idx
  ON public.notifications (user_id, created_at DESC, id DESC);
CREATE INDEX notifications_user_unread_idx
  ON public.notifications (user_id, created_at DESC)
  WHERE read_at IS NULL;

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own notifications"
  ON public.notifications FOR SELECT TO authenticated
  USING ((SELECT auth.uid()) = user_id);

CREATE POLICY "Users can mark own notifications read"
  ON public.notifications FOR UPDATE TO authenticated
  USING ((SELECT auth.uid()) = user_id)
  WITH CHECK ((SELECT auth.uid()) = user_id);

REVOKE UPDATE ON public.notifications FROM authenticated;
GRANT UPDATE (read_at) ON public.notifications TO authenticated;

CREATE TABLE public.notification_email_settings (
  user_id uuid PRIMARY KEY REFERENCES public.users(id) ON DELETE CASCADE,
  email text,
  email_verified_at timestamptz,
  email_enabled boolean NOT NULL DEFAULT false,
  pending_email text,
  verification_token_hash text,
  verification_expires_at timestamptz,
  verification_sent_at timestamptz,
  updated_at timestamptz NOT NULL DEFAULT now(),
  CHECK ((email IS NULL) = (email_verified_at IS NULL)),
  CHECK (
    (pending_email IS NULL AND verification_token_hash IS NULL AND verification_expires_at IS NULL)
    OR
    (pending_email IS NOT NULL AND verification_token_hash IS NOT NULL AND verification_expires_at IS NOT NULL)
  )
);

CREATE UNIQUE INDEX notification_email_settings_email_unique_idx
  ON public.notification_email_settings (lower(email))
  WHERE email IS NOT NULL;
CREATE UNIQUE INDEX notification_email_settings_pending_email_unique_idx
  ON public.notification_email_settings (lower(pending_email))
  WHERE pending_email IS NOT NULL;
CREATE UNIQUE INDEX notification_email_settings_token_unique_idx
  ON public.notification_email_settings (verification_token_hash)
  WHERE verification_token_hash IS NOT NULL;

ALTER TABLE public.notification_email_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own notification email settings"
  ON public.notification_email_settings FOR SELECT TO authenticated
  USING ((SELECT auth.uid()) = user_id);

REVOKE ALL ON public.notification_email_settings FROM authenticated;

DROP TABLE IF EXISTS public.push_subscriptions;

DROP FUNCTION IF EXISTS public.submit_article(uuid, text, text, uuid, text, text);

CREATE FUNCTION public.submit_article(
  p_article_id uuid,
  p_title text,
  p_content text,
  p_category_id uuid,
  p_character_id text DEFAULT NULL,
  p_commit_message text DEFAULT NULL
)
RETURNS TABLE (submitted_version_id uuid, submitted_status public.version_status) AS $$
DECLARE
  current_user_id uuid := auth.uid();
  category_visibility public.version_status;
  editor_role public.role_type;
  new_status public.version_status;
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

  SELECT default_visibility INTO category_visibility
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
    SELECT created_at INTO v_anchor_time
    FROM public.article_versions
    WHERE article_id = p_article_id
      AND editor_id = current_user_id
      AND status = 'pending'
    ORDER BY created_at ASC
    LIMIT 1;

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
  )
  RETURNING article_versions.id, article_versions.status
  INTO submitted_version_id, submitted_status;

  IF new_status = 'approved' THEN
    UPDATE public.articles
    SET title = p_title, category_id = p_category_id, character_id = p_character_id
    WHERE id = p_article_id;
  END IF;

  RETURN NEXT;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, extensions, pg_temp;
