CREATE TYPE public.game_data_action_vote_choice AS ENUM ('approve', 'reject', 'abstain');

CREATE TYPE public.game_data_discussion_event_type AS ENUM (
  'submitted',
  'linked',
  'moved_out',
  'unlinked',
  'approved',
  'rejected',
  'revoked',
  'synced'
);

CREATE TABLE public.game_data_action_submissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_by uuid REFERENCES public.users(id) ON DELETE SET NULL,
  message text,
  discussion_topic_id uuid REFERENCES public.comments(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX game_data_action_submissions_topic_idx
  ON public.game_data_action_submissions (discussion_topic_id, created_at DESC);

ALTER TABLE public.game_data_actions ADD COLUMN submission_id uuid;

INSERT INTO public.game_data_action_submissions(id, created_by, message, created_at)
SELECT id, created_by, message, created_at
FROM public.game_data_actions;

UPDATE public.game_data_actions SET submission_id = id;

ALTER TABLE public.game_data_actions ALTER COLUMN submission_id SET NOT NULL;
ALTER TABLE public.game_data_actions
  ADD CONSTRAINT game_data_actions_submission_id_fkey
  FOREIGN KEY (submission_id) REFERENCES public.game_data_action_submissions(id);

CREATE INDEX game_data_actions_submission_idx
  ON public.game_data_actions (submission_id, created_at, id);

CREATE OR REPLACE FUNCTION public.ensure_game_data_action_submission()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.submission_id IS NULL THEN
    NEW.submission_id := NEW.id;
    INSERT INTO public.game_data_action_submissions(id, created_by, message, created_at)
    VALUES (NEW.id, NEW.created_by, NEW.message, NEW.created_at)
    ON CONFLICT (id) DO NOTHING;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER ensure_game_data_action_submission_trigger
  BEFORE INSERT ON public.game_data_actions
  FOR EACH ROW EXECUTE FUNCTION public.ensure_game_data_action_submission();

CREATE TABLE public.game_data_action_discussion_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  operation_id uuid NOT NULL,
  submission_id uuid NOT NULL REFERENCES public.game_data_action_submissions(id),
  topic_id uuid NOT NULL REFERENCES public.comments(id) ON DELETE CASCADE,
  action_id uuid NOT NULL REFERENCES public.game_data_actions(id) ON DELETE CASCADE,
  event_type public.game_data_discussion_event_type NOT NULL,
  actor_id uuid REFERENCES public.users(id) ON DELETE SET NULL,
  note text,
  resulting_status public.game_data_action_status NOT NULL,
  approve_votes integer NOT NULL DEFAULT 0,
  reject_votes integer NOT NULL DEFAULT 0,
  abstain_votes integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (operation_id, action_id, topic_id, event_type)
);

CREATE INDEX game_data_action_discussion_events_topic_idx
  ON public.game_data_action_discussion_events (topic_id, created_at, id);

CREATE TABLE public.game_data_action_votes (
  action_id uuid NOT NULL REFERENCES public.game_data_actions(id) ON DELETE CASCADE,
  voter_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  choice public.game_data_action_vote_choice NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (action_id, voter_id)
);

CREATE INDEX game_data_action_votes_action_choice_idx
  ON public.game_data_action_votes (action_id, choice);

ALTER TABLE public.game_data_action_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.game_data_action_submissions FORCE ROW LEVEL SECURITY;
ALTER TABLE public.game_data_action_discussion_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.game_data_action_discussion_events FORCE ROW LEVEL SECURITY;
ALTER TABLE public.game_data_action_votes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.game_data_action_votes FORCE ROW LEVEL SECURITY;

CREATE POLICY "Service role manages game data submissions"
  ON public.game_data_action_submissions FOR ALL TO service_role
  USING (true) WITH CHECK (true);

CREATE POLICY "Service role manages game data discussion events"
  ON public.game_data_action_discussion_events FOR ALL TO service_role
  USING (true) WITH CHECK (true);

CREATE POLICY "Voters can view their own ballots"
  ON public.game_data_action_votes FOR SELECT TO authenticated
  USING (voter_id = (SELECT auth.uid()));

CREATE POLICY "Service role manages game data votes"
  ON public.game_data_action_votes FOR ALL TO service_role
  USING (true) WITH CHECK (true);

REVOKE ALL ON public.game_data_action_submissions FROM PUBLIC, anon, authenticated;
REVOKE ALL ON public.game_data_action_discussion_events FROM PUBLIC, anon, authenticated;
REVOKE ALL ON public.game_data_action_votes FROM PUBLIC, anon, authenticated;
GRANT SELECT ON public.game_data_action_votes TO authenticated;

INSERT INTO public.permission_catalog(key, category, label_zh, global_only, sort_order)
VALUES
  ('game_data_action.vote', '游戏数据', '对游戏数据改动投票', false, 115),
  ('game_data_action.view_votes', '游戏数据', '查看游戏数据投票身份', false, 116)
ON CONFLICT (key) DO NOTHING;

INSERT INTO public.group_permission_grants
  (group_id, permission_key, scope, resource_type, resource_id)
SELECT id, permission_key, 'global', '*', '*'
FROM public.user_groups
CROSS JOIN (VALUES ('game_data_action.vote')) AS permissions(permission_key)
WHERE name IN ('Reviewer', 'Coordinator')
ON CONFLICT DO NOTHING;

INSERT INTO public.group_permission_grants
  (group_id, permission_key, scope, resource_type, resource_id)
SELECT id, 'game_data_action.view_votes', 'global', '*', '*'
FROM public.user_groups
WHERE name = 'Coordinator'
ON CONFLICT DO NOTHING;

CREATE OR REPLACE FUNCTION public.is_valid_game_data_discussion_topic(p_topic_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.comments c
    WHERE c.id = p_topic_id
      AND c.parent_id IS NULL
      AND c.title IS NOT NULL
      AND c.status = 'visible'
      AND c.scope NOT IN ('articles', 'list_pages')
  );
$$;

CREATE OR REPLACE FUNCTION public.record_game_data_discussion_event(
  p_actor_id uuid,
  p_action_ids uuid[],
  p_event_type public.game_data_discussion_event_type,
  p_operation_id uuid,
  p_note text DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.game_data_action_discussion_events(
    operation_id, submission_id, topic_id, action_id, event_type, actor_id, note,
    resulting_status, approve_votes, reject_votes, abstain_votes
  )
  SELECT
    p_operation_id,
    a.submission_id,
    s.discussion_topic_id,
    a.id,
    p_event_type,
    p_actor_id,
    NULLIF(btrim(p_note), ''),
    a.status,
    count(v.action_id) FILTER (WHERE v.choice = 'approve'),
    count(v.action_id) FILTER (WHERE v.choice = 'reject'),
    count(v.action_id) FILTER (WHERE v.choice = 'abstain')
  FROM public.game_data_actions a
  JOIN public.game_data_action_submissions s ON s.id = a.submission_id
  LEFT JOIN public.game_data_action_votes v ON v.action_id = a.id
  WHERE a.id = ANY(p_action_ids)
    AND s.discussion_topic_id IS NOT NULL
  GROUP BY a.id, a.submission_id, s.discussion_topic_id, a.status
  ON CONFLICT DO NOTHING;
END;
$$;

CREATE OR REPLACE FUNCTION public.prepared_group_game_data_actions(
  p_actor_id uuid,
  p_action_ids uuid[],
  p_submission_id uuid,
  p_topic_id uuid,
  p_message text,
  p_operation_id uuid,
  p_ip inet DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  action_row public.game_data_actions%ROWTYPE;
BEGIN
  IF cardinality(p_action_ids) < 1 THEN RAISE EXCEPTION 'actions_empty'; END IF;
  IF p_topic_id IS NOT NULL AND NOT public.is_valid_game_data_discussion_topic(p_topic_id) THEN
    RAISE EXCEPTION 'invalid_discussion_topic';
  END IF;

  FOR action_row IN
    SELECT * FROM public.game_data_actions WHERE id = ANY(p_action_ids) FOR UPDATE
  LOOP
    IF action_row.created_by IS DISTINCT FROM p_actor_id THEN
      RAISE EXCEPTION 'action_owner_mismatch';
    END IF;
    PERFORM public.assert_game_data_entry_not_blocked(
      p_actor_id, p_ip, action_row.entity_type, action_row.entry
    );
  END LOOP;

  IF (SELECT count(*) FROM public.game_data_actions WHERE id = ANY(p_action_ids))
    <> cardinality(p_action_ids) THEN
    RAISE EXCEPTION 'action_not_found';
  END IF;

  INSERT INTO public.game_data_action_submissions(
    id, created_by, message, discussion_topic_id, created_at
  )
  SELECT p_submission_id, p_actor_id, p_message, p_topic_id, min(created_at)
  FROM public.game_data_actions WHERE id = ANY(p_action_ids)
  ON CONFLICT (id) DO UPDATE SET
    discussion_topic_id = EXCLUDED.discussion_topic_id,
    message = EXCLUDED.message;

  UPDATE public.game_data_actions
  SET submission_id = p_submission_id
  WHERE id = ANY(p_action_ids);

  DELETE FROM public.game_data_action_submissions s
  WHERE s.id = ANY(p_action_ids)
    AND s.id <> p_submission_id
    AND NOT EXISTS (
      SELECT 1 FROM public.game_data_actions a WHERE a.submission_id = s.id
    );

  IF p_topic_id IS NOT NULL THEN
    PERFORM public.record_game_data_discussion_event(
      p_actor_id, p_action_ids, 'submitted', p_operation_id, NULL
    );
  END IF;
END;
$$;

CREATE OR REPLACE FUNCTION public.prepared_set_game_data_submission_topic(
  p_actor_id uuid,
  p_submission_id uuid,
  p_topic_id uuid,
  p_operation_id uuid,
  p_ip inet DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  old_topic_id uuid;
  action_row public.game_data_actions%ROWTYPE;
  action_ids uuid[];
BEGIN
  SELECT discussion_topic_id INTO old_topic_id
  FROM public.game_data_action_submissions
  WHERE id = p_submission_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'submission_not_found'; END IF;

  IF p_topic_id IS NOT NULL AND NOT public.is_valid_game_data_discussion_topic(p_topic_id) THEN
    RAISE EXCEPTION 'invalid_discussion_topic';
  END IF;

  SELECT array_agg(id ORDER BY id) INTO action_ids
  FROM public.game_data_actions WHERE submission_id = p_submission_id;

  FOR action_row IN
    SELECT * FROM public.game_data_actions WHERE submission_id = p_submission_id
  LOOP
    IF NOT (
      public.can_access_game_action(p_actor_id, 'game_data_action.approve', action_row.entity_type, action_row.entry)
      OR public.can_access_game_action(p_actor_id, 'game_data_action.reject', action_row.entity_type, action_row.entry)
      OR public.can_access_game_action(p_actor_id, 'game_data_action.revoke', action_row.entity_type, action_row.entry)
      OR public.can_access_game_action(p_actor_id, 'game_data_action.mark_synced', action_row.entity_type, action_row.entry)
    ) THEN RAISE EXCEPTION 'forbidden'; END IF;
    PERFORM public.assert_game_data_entry_not_blocked(
      p_actor_id, p_ip, action_row.entity_type, action_row.entry
    );
  END LOOP;

  IF old_topic_id IS NOT NULL AND old_topic_id IS DISTINCT FROM p_topic_id THEN
    PERFORM public.record_game_data_discussion_event(
      p_actor_id,
      action_ids,
      CASE WHEN p_topic_id IS NULL THEN 'unlinked' ELSE 'moved_out' END,
      p_operation_id,
      NULL
    );
  END IF;

  UPDATE public.game_data_action_submissions
  SET discussion_topic_id = p_topic_id
  WHERE id = p_submission_id;

  IF p_topic_id IS NOT NULL AND p_topic_id IS DISTINCT FROM old_topic_id THEN
    PERFORM public.record_game_data_discussion_event(
      p_actor_id, action_ids, 'linked', p_operation_id, NULL
    );
  END IF;
END;
$$;

CREATE OR REPLACE FUNCTION public.prepared_set_game_data_action_vote(
  p_actor_id uuid,
  p_action_id uuid,
  p_choice public.game_data_action_vote_choice,
  p_ip inet DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  action_row public.game_data_actions%ROWTYPE;
  topic_id uuid;
BEGIN
  SELECT a.*
  INTO action_row
  FROM public.game_data_actions a
  WHERE a.id = p_action_id FOR UPDATE OF a;
  IF NOT FOUND THEN RAISE EXCEPTION 'action_not_found'; END IF;
  SELECT discussion_topic_id INTO topic_id
  FROM public.game_data_action_submissions
  WHERE id = action_row.submission_id;
  IF action_row.status <> 'pending' THEN RAISE EXCEPTION 'voting_closed'; END IF;
  IF topic_id IS NULL OR NOT public.is_valid_game_data_discussion_topic(topic_id) THEN
    RAISE EXCEPTION 'discussion_unavailable';
  END IF;
  IF NOT public.can_access_game_action(
    p_actor_id, 'game_data_action.vote', action_row.entity_type, action_row.entry
  ) THEN RAISE EXCEPTION 'forbidden'; END IF;
  PERFORM public.assert_game_data_entry_not_blocked(
    p_actor_id, p_ip, action_row.entity_type, action_row.entry
  );

  INSERT INTO public.game_data_action_votes(action_id, voter_id, choice)
  VALUES (p_action_id, p_actor_id, p_choice)
  ON CONFLICT (action_id, voter_id) DO UPDATE
  SET choice = EXCLUDED.choice, updated_at = now();
END;
$$;

CREATE OR REPLACE FUNCTION public.prepared_delete_game_data_action_vote(
  p_actor_id uuid,
  p_action_id uuid,
  p_ip inet DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  action_row public.game_data_actions%ROWTYPE;
  topic_id uuid;
BEGIN
  SELECT * INTO action_row FROM public.game_data_actions WHERE id = p_action_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'action_not_found'; END IF;
  SELECT discussion_topic_id INTO topic_id
  FROM public.game_data_action_submissions
  WHERE id = action_row.submission_id;
  IF action_row.status <> 'pending' THEN RAISE EXCEPTION 'voting_closed'; END IF;
  IF topic_id IS NULL OR NOT public.is_valid_game_data_discussion_topic(topic_id) THEN
    RAISE EXCEPTION 'discussion_unavailable';
  END IF;
  IF NOT public.can_access_game_action(
    p_actor_id, 'game_data_action.vote', action_row.entity_type, action_row.entry
  ) THEN RAISE EXCEPTION 'forbidden'; END IF;
  PERFORM public.assert_game_data_entry_not_blocked(
    p_actor_id, p_ip, action_row.entity_type, action_row.entry
  );
  DELETE FROM public.game_data_action_votes
  WHERE action_id = p_action_id AND voter_id = p_actor_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.review_topic_for_comment(p_comment_id uuid)
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  WITH RECURSIVE ancestors AS (
    SELECT id, parent_id FROM public.comments WHERE id = p_comment_id
    UNION ALL
    SELECT c.id, c.parent_id
    FROM public.comments c
    JOIN ancestors a ON a.parent_id = c.id
  )
  SELECT id FROM ancestors WHERE parent_id IS NULL LIMIT 1;
$$;

CREATE OR REPLACE FUNCTION public.can_participate_game_data_discussion(
  p_actor_id uuid,
  p_parent_comment_id uuid
)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.game_data_action_submissions s
    JOIN public.game_data_actions a ON a.submission_id = s.id
    WHERE s.discussion_topic_id = public.review_topic_for_comment(p_parent_comment_id)
      AND (
        s.created_by = p_actor_id
        OR public.can_access_game_action(p_actor_id, 'game_data_action.vote', a.entity_type, a.entry)
        OR public.can_access_game_action(p_actor_id, 'game_data_action.approve', a.entity_type, a.entry)
        OR public.can_access_game_action(p_actor_id, 'game_data_action.reject', a.entity_type, a.entry)
        OR public.can_access_game_action(p_actor_id, 'game_data_action.revoke', a.entity_type, a.entry)
        OR public.can_access_game_action(p_actor_id, 'game_data_action.mark_synced', a.entity_type, a.entry)
      )
  );
$$;

CREATE OR REPLACE FUNCTION public.prepared_create_game_data_review_comment(
  p_actor_id uuid,
  p_ip inet,
  p_scope public.comment_scope,
  p_target_id text,
  p_content text,
  p_parent_id uuid
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  new_id uuid;
  parent_scope public.comment_scope;
  parent_target text;
  parent_status public.comment_status;
BEGIN
  IF NOT public.can_participate_game_data_discussion(p_actor_id, p_parent_id) THEN
    RAISE EXCEPTION 'forbidden';
  END IF;
  SELECT scope, target_id, status INTO parent_scope, parent_target, parent_status
  FROM public.comments WHERE id = p_parent_id;
  IF NOT FOUND OR parent_scope <> p_scope OR parent_target <> p_target_id THEN
    RAISE EXCEPTION 'parent_mismatch';
  END IF;
  IF parent_status = 'deleted' THEN RAISE EXCEPTION 'parent_deleted'; END IF;
  p_content := btrim(p_content);
  IF char_length(p_content) < 1 THEN RAISE EXCEPTION 'content_empty'; END IF;
  IF char_length(p_content) > 2000 THEN RAISE EXCEPTION 'content_too_long'; END IF;
  PERFORM public.assert_actor_not_blocked(
    p_actor_id, p_ip, 'edit', 'comments/' || p_scope::text, p_target_id
  );
  INSERT INTO public.comments(scope, target_id, parent_id, author_id, content, status)
  VALUES (p_scope, p_target_id, p_parent_id, p_actor_id, p_content, 'visible')
  RETURNING id INTO new_id;
  RETURN new_id;
END;
$$;

REVOKE ALL ON FUNCTION public.is_valid_game_data_discussion_topic(uuid)
  FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.record_game_data_discussion_event(
  uuid, uuid[], public.game_data_discussion_event_type, uuid, text
) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.prepared_group_game_data_actions(
  uuid, uuid[], uuid, uuid, text, uuid, inet
) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.prepared_set_game_data_submission_topic(
  uuid, uuid, uuid, uuid, inet
) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.prepared_set_game_data_action_vote(
  uuid, uuid, public.game_data_action_vote_choice, inet
) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.prepared_delete_game_data_action_vote(uuid, uuid, inet)
  FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.review_topic_for_comment(uuid)
  FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.can_participate_game_data_discussion(uuid, uuid)
  FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.prepared_create_game_data_review_comment(
  uuid, inet, public.comment_scope, text, text, uuid
) FROM PUBLIC, anon, authenticated;

GRANT EXECUTE ON FUNCTION public.is_valid_game_data_discussion_topic(uuid) TO service_role;
GRANT EXECUTE ON FUNCTION public.record_game_data_discussion_event(
  uuid, uuid[], public.game_data_discussion_event_type, uuid, text
) TO service_role;
GRANT EXECUTE ON FUNCTION public.prepared_group_game_data_actions(
  uuid, uuid[], uuid, uuid, text, uuid, inet
) TO service_role;
GRANT EXECUTE ON FUNCTION public.prepared_set_game_data_submission_topic(
  uuid, uuid, uuid, uuid, inet
) TO service_role;
GRANT EXECUTE ON FUNCTION public.prepared_set_game_data_action_vote(
  uuid, uuid, public.game_data_action_vote_choice, inet
) TO service_role;
GRANT EXECUTE ON FUNCTION public.prepared_delete_game_data_action_vote(uuid, uuid, inet)
  TO service_role;
GRANT EXECUTE ON FUNCTION public.review_topic_for_comment(uuid) TO service_role;
GRANT EXECUTE ON FUNCTION public.can_participate_game_data_discussion(uuid, uuid)
  TO service_role;
GRANT EXECUTE ON FUNCTION public.prepared_create_game_data_review_comment(
  uuid, inet, public.comment_scope, text, text, uuid
) TO service_role;

ALTER TABLE public.notifications DROP CONSTRAINT IF EXISTS notifications_kind_check;
ALTER TABLE public.notifications ADD CONSTRAINT notifications_kind_check CHECK (
  kind IN (
    'article_version_approved',
    'article_version_rejected',
    'game_data_action_approved',
    'game_data_action_rejected',
    'article_comment_created',
    'article_version_created',
    'game_data_action_created',
    'discussion_comment_created',
    'contribution_thanked',
    'game_data_review_event'
  )
);
