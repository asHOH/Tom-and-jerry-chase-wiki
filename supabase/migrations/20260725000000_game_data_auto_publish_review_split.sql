INSERT INTO public.permission_catalog (key, category, label_zh, global_only, sort_order)
VALUES ('game_data_action.auto_approve', '游戏数据', '自动公开自己的游戏数据改动', false, 95)
ON CONFLICT (key) DO NOTHING;

INSERT INTO public.group_permission_grants
  (group_id, permission_key, scope, resource_type, resource_id)
SELECT id, 'game_data_action.auto_approve', 'global', '*', '*'
FROM public.user_groups
WHERE id IN (
  '00000000-0000-4000-8000-000000000002'::uuid,
  '00000000-0000-4000-8000-000000000003'::uuid
)
ON CONFLICT DO NOTHING;

UPDATE public.game_data_actions
SET is_public = false
WHERE status = 'synced' AND is_public = true;

UPDATE public.game_data_actions
SET is_public = false
WHERE status <> 'approved' AND status <> 'synced' AND is_public = true;

CREATE OR REPLACE FUNCTION public.advance_game_data_approved_replay_epoch()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  old_member boolean := false;
  new_member boolean := false;
  replay_set_changed boolean := false;
BEGIN
  IF TG_OP <> 'INSERT' THEN
    old_member := OLD.is_public;
  END IF;
  IF TG_OP <> 'DELETE' THEN
    new_member := NEW.is_public;
  END IF;

  replay_set_changed := old_member IS DISTINCT FROM new_member;
  IF TG_OP = 'UPDATE' AND (old_member OR new_member) THEN
    replay_set_changed := replay_set_changed OR
      ROW(
        OLD.id,
        OLD.entity_type,
        OLD.entry,
        OLD.created_at,
        OLD.status,
        OLD.message,
        OLD.reviewed_at,
        OLD.created_by
      ) IS DISTINCT FROM ROW(
        NEW.id,
        NEW.entity_type,
        NEW.entry,
        NEW.created_at,
        NEW.status,
        NEW.message,
        NEW.reviewed_at,
        NEW.created_by
      );
  END IF;

  IF replay_set_changed THEN
    UPDATE public.game_data_approved_replay_epoch
    SET epoch = epoch + 1, updated_at = now()
    WHERE singleton = true;
  END IF;

  IF TG_OP = 'DELETE' THEN
    RETURN OLD;
  END IF;
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.read_game_data_approved_replay_snapshot()
RETURNS TABLE(replay_epoch bigint, action_rows jsonb)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    epoch_row.epoch AS replay_epoch,
    COALESCE(
      (
        SELECT jsonb_agg(
          jsonb_build_object(
            'id', action.id,
            'entity_type', action.entity_type,
            'entry', action.entry,
            'created_at', action.created_at,
            'status', action.status,
            'message', action.message,
            'reviewed_at', action.reviewed_at,
            'created_by', action.created_by
          )
          ORDER BY action.created_at ASC, action.id ASC
        )
        FROM public.game_data_actions AS action
        WHERE action.is_public = true
      ),
      '[]'::jsonb
    ) AS action_rows
  FROM public.game_data_approved_replay_epoch AS epoch_row
  WHERE epoch_row.singleton = true;
$$;

CREATE OR REPLACE FUNCTION public.publish_game_data_actions(
  p_entity_type text, p_entries jsonb, p_message text DEFAULT NULL
)
RETURNS TABLE(id uuid, is_public boolean, status public.game_data_action_status) AS $$
DECLARE
  v_uid uuid := auth.uid();
  v_entry jsonb;
  can_auto_publish boolean;
  can_self_review boolean;
  v_status public.game_data_action_status;
  v_public boolean;
BEGIN
  IF v_uid IS NULL THEN RAISE EXCEPTION 'Authentication required'; END IF;
  IF p_entity_type IS NULL OR btrim(p_entity_type) = '' THEN
    RAISE EXCEPTION 'entity_type is required';
  END IF;
  IF jsonb_typeof(p_entries) <> 'array' THEN
    RAISE EXCEPTION 'entries must be a jsonb array';
  END IF;

  FOR v_entry IN SELECT value FROM jsonb_array_elements(p_entries) LOOP
    IF NOT public.can_access_game_action(
      v_uid, 'game_data_action.create', p_entity_type, v_entry
    ) AND NOT (
      p_entity_type = 'characters' AND public.can_access_game_action(
        v_uid, 'game_data_action.publish_relations', 'characters', v_entry
      )
    ) THEN
      RAISE EXCEPTION 'Insufficient permissions to publish actions';
    END IF;
  END LOOP;

  SELECT COALESCE(bool_and(public.can_access_game_action(
    v_uid, 'game_data_action.auto_approve', p_entity_type, value
  )), false)
  INTO can_auto_publish
  FROM jsonb_array_elements(p_entries);

  SELECT COALESCE(bool_and(public.can_access_game_action(
    v_uid, 'game_data_action.approve', p_entity_type, value
  )), false)
  INTO can_self_review
  FROM jsonb_array_elements(p_entries);

  v_public := can_auto_publish;
  v_status := CASE
    WHEN can_auto_publish AND can_self_review THEN 'approved'
    ELSE 'pending'
  END;

  FOR v_entry IN SELECT value FROM jsonb_array_elements(p_entries) LOOP
    INSERT INTO public.game_data_actions(
      entity_type, entry, status, is_public, created_by,
      reviewed_by, reviewed_at, message
    )
    VALUES (
      p_entity_type,
      v_entry,
      v_status,
      v_public,
      v_uid,
      CASE WHEN can_auto_publish AND can_self_review THEN v_uid END,
      CASE WHEN can_auto_publish AND can_self_review THEN now() END,
      p_message
    )
    RETURNING game_data_actions.id, game_data_actions.is_public, game_data_actions.status
    INTO id, is_public, status;

    RETURN NEXT;
  END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE OR REPLACE FUNCTION public.approve_game_data_action(p_action_id uuid)
RETURNS void AS $$
DECLARE
  v_uid uuid := auth.uid();
  v_type text;
  v_entry jsonb;
BEGIN
  SELECT entity_type, entry INTO v_type, v_entry
  FROM public.game_data_actions
  WHERE id = p_action_id AND status = 'pending'
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Action not found or not in pending status';
  END IF;
  IF NOT public.can_access_game_action(v_uid, 'game_data_action.approve', v_type, v_entry) THEN
    RAISE EXCEPTION 'Insufficient permissions to approve actions';
  END IF;

  UPDATE public.game_data_actions
  SET
    status = 'approved',
    is_public = true,
    reviewed_by = v_uid,
    reviewed_at = now(),
    rejection_reason = NULL
  WHERE id = p_action_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE OR REPLACE FUNCTION public.reject_game_data_action(
  p_action_id uuid,
  p_reason text DEFAULT NULL
)
RETURNS void AS $$
DECLARE
  v_uid uuid := auth.uid();
  v_type text;
  v_entry jsonb;
BEGIN
  SELECT entity_type, entry INTO v_type, v_entry
  FROM public.game_data_actions
  WHERE id = p_action_id AND status = 'pending' AND is_public = false
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Action not found or not private pending';
  END IF;
  IF NOT public.can_access_game_action(v_uid, 'game_data_action.reject', v_type, v_entry) THEN
    RAISE EXCEPTION 'Insufficient permissions to reject actions';
  END IF;

  UPDATE public.game_data_actions
  SET
    status = 'rejected',
    is_public = false,
    reviewed_by = v_uid,
    reviewed_at = now(),
    rejection_reason = p_reason
  WHERE id = p_action_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE OR REPLACE FUNCTION public.get_pending_game_data_actions()
RETURNS TABLE (
  action_id uuid,
  entity_type text,
  entry jsonb,
  status public.game_data_action_status,
  is_public boolean,
  created_at timestamptz,
  created_by uuid,
  created_by_nickname text,
  reviewed_at timestamptz,
  reviewed_by uuid,
  reviewed_by_nickname text,
  rejection_reason text,
  message text
) AS $$
DECLARE
  v_uid uuid := auth.uid();
BEGIN
  RETURN QUERY
  SELECT
    a.id,
    a.entity_type,
    a.entry,
    a.status,
    a.is_public,
    a.created_at,
    a.created_by,
    u.nickname,
    a.reviewed_at,
    a.reviewed_by,
    ru.nickname,
    a.rejection_reason,
    a.message
  FROM public.game_data_actions a
  LEFT JOIN public.users u ON u.id = a.created_by
  LEFT JOIN public.users ru ON ru.id = a.reviewed_by
  WHERE a.status = 'pending'
    AND (
      (
        a.is_public = false
        AND (
          public.can_access_game_action(v_uid, 'game_data_action.approve', a.entity_type, a.entry)
          OR public.can_access_game_action(
            v_uid, 'game_data_action.reject', a.entity_type, a.entry
          )
        )
      )
      OR (
        a.is_public = true
        AND (
          public.can_access_game_action(v_uid, 'game_data_action.approve', a.entity_type, a.entry)
          OR public.can_access_game_action(
            v_uid, 'game_data_action.revoke', a.entity_type, a.entry
          )
        )
      )
    )
  ORDER BY a.created_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE OR REPLACE FUNCTION public.prepared_publish_game_data_actions(
  p_actor_id uuid,
  p_permission_key text,
  p_entity_type text,
  p_entries jsonb,
  p_message text,
  p_expected_replay_epoch bigint
)
RETURNS TABLE(id uuid, is_public boolean, status public.game_data_action_status)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  current_epoch bigint;
  entry jsonb;
  can_auto_publish boolean;
  can_self_review boolean;
  target_status public.game_data_action_status;
  target_public boolean;
BEGIN
  SELECT epoch INTO current_epoch
  FROM public.game_data_approved_replay_epoch
  WHERE singleton = true
  FOR UPDATE;

  IF current_epoch IS DISTINCT FROM p_expected_replay_epoch THEN
    RAISE EXCEPTION USING ERRCODE = '40001', MESSAGE = 'approved_replay_epoch_conflict';
  END IF;
  IF p_permission_key NOT IN (
    'game_data_action.create', 'game_data_action.publish_relations'
  ) THEN
    RAISE EXCEPTION 'invalid_publish_permission';
  END IF;
  IF p_permission_key = 'game_data_action.publish_relations' AND p_entity_type <> 'characters' THEN
    RAISE EXCEPTION 'invalid_publish_permission_context';
  END IF;
  IF jsonb_typeof(p_entries) <> 'array' OR jsonb_array_length(p_entries) = 0 THEN
    RAISE EXCEPTION 'entries_must_be_nonempty_array';
  END IF;

  FOR entry IN SELECT value FROM jsonb_array_elements(p_entries) LOOP
    IF NOT public.can_access_game_action(
      p_actor_id, p_permission_key, p_entity_type, entry
    ) THEN
      RAISE EXCEPTION 'publish_permission_denied';
    END IF;
  END LOOP;

  SELECT COALESCE(bool_and(public.can_access_game_action(
    p_actor_id, 'game_data_action.auto_approve', p_entity_type, value
  )), false)
  INTO can_auto_publish
  FROM jsonb_array_elements(p_entries);

  SELECT COALESCE(bool_and(public.can_access_game_action(
    p_actor_id, 'game_data_action.approve', p_entity_type, value
  )), false)
  INTO can_self_review
  FROM jsonb_array_elements(p_entries);

  target_public := can_auto_publish;
  target_status := CASE
    WHEN can_auto_publish AND can_self_review THEN 'approved'
    ELSE 'pending'
  END;

  FOR entry IN SELECT value FROM jsonb_array_elements(p_entries) LOOP
    INSERT INTO public.game_data_actions(
      entity_type, entry, status, is_public, created_by,
      reviewed_by, reviewed_at, message
    ) VALUES (
      p_entity_type,
      entry,
      target_status,
      target_public,
      p_actor_id,
      CASE WHEN can_auto_publish AND can_self_review THEN p_actor_id END,
      CASE WHEN can_auto_publish AND can_self_review THEN now() END,
      p_message
    )
    RETURNING game_data_actions.id, game_data_actions.is_public, game_data_actions.status
    INTO id, is_public, status;
    RETURN NEXT;
  END LOOP;
END;
$$;

CREATE OR REPLACE FUNCTION public.prepared_approve_game_data_action(
  p_actor_id uuid,
  p_action_id uuid,
  p_expected_entity_type text,
  p_expected_entry jsonb,
  p_expected_replay_epoch bigint
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  current_epoch bigint;
  current_type text;
  current_entry jsonb;
BEGIN
  SELECT epoch INTO current_epoch
  FROM public.game_data_approved_replay_epoch
  WHERE singleton = true
  FOR UPDATE;
  IF current_epoch IS DISTINCT FROM p_expected_replay_epoch THEN
    RAISE EXCEPTION USING ERRCODE = '40001', MESSAGE = 'approved_replay_epoch_conflict';
  END IF;

  SELECT entity_type, entry INTO current_type, current_entry
  FROM public.game_data_actions
  WHERE id = p_action_id AND status = 'pending'
  FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'pending_action_changed'; END IF;
  IF current_type IS DISTINCT FROM p_expected_entity_type
    OR current_entry IS DISTINCT FROM p_expected_entry THEN
    RAISE EXCEPTION 'pending_action_changed';
  END IF;
  IF NOT public.can_access_game_action(
    p_actor_id, 'game_data_action.approve', current_type, current_entry
  ) THEN
    RAISE EXCEPTION 'approval_permission_denied';
  END IF;

  UPDATE public.game_data_actions
  SET
    status = 'approved',
    is_public = true,
    reviewed_by = p_actor_id,
    reviewed_at = now(),
    rejection_reason = NULL
  WHERE id = p_action_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.prepared_mark_game_data_action_synced(
  p_actor_id uuid,
  p_action_id uuid,
  p_expected_entity_type text,
  p_expected_entry jsonb,
  p_expected_replay_epoch bigint
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  current_epoch bigint;
  current_type text;
  current_entry jsonb;
BEGIN
  SELECT epoch INTO current_epoch
  FROM public.game_data_approved_replay_epoch
  WHERE singleton = true
  FOR UPDATE;
  IF current_epoch IS DISTINCT FROM p_expected_replay_epoch THEN
    RAISE EXCEPTION USING ERRCODE = '40001', MESSAGE = 'approved_replay_epoch_conflict';
  END IF;

  SELECT entity_type, entry INTO current_type, current_entry
  FROM public.game_data_actions
  WHERE id = p_action_id AND status = 'approved' AND is_public = true
  FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'approved_action_changed'; END IF;
  IF current_type IS DISTINCT FROM p_expected_entity_type
    OR current_entry IS DISTINCT FROM p_expected_entry THEN
    RAISE EXCEPTION 'approved_action_changed';
  END IF;
  IF NOT public.can_access_game_action(
    p_actor_id, 'game_data_action.mark_synced', current_type, current_entry
  ) THEN
    RAISE EXCEPTION 'mark_synced_permission_denied';
  END IF;

  UPDATE public.game_data_actions
  SET
    status = 'synced',
    is_public = false,
    reviewed_by = p_actor_id,
    reviewed_at = now(),
    rejection_reason = NULL
  WHERE id = p_action_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.prepared_revoke_game_data_action(
  p_actor_id uuid,
  p_action_id uuid,
  p_expected_entity_type text,
  p_expected_entry jsonb,
  p_expected_replay_epoch bigint
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  current_epoch bigint;
  current_type text;
  current_entry jsonb;
BEGIN
  SELECT epoch INTO current_epoch
  FROM public.game_data_approved_replay_epoch
  WHERE singleton = true
  FOR UPDATE;

  IF current_epoch IS DISTINCT FROM p_expected_replay_epoch THEN
    RAISE EXCEPTION USING ERRCODE = '40001', MESSAGE = 'approved_replay_epoch_conflict';
  END IF;

  SELECT entity_type, entry INTO current_type, current_entry
  FROM public.game_data_actions
  WHERE id = p_action_id AND is_public = true
  FOR UPDATE;

  IF NOT FOUND THEN RAISE EXCEPTION 'public_action_changed'; END IF;
  IF current_type IS DISTINCT FROM p_expected_entity_type
    OR current_entry IS DISTINCT FROM p_expected_entry THEN
    RAISE EXCEPTION 'public_action_changed';
  END IF;
  IF NOT public.can_access_game_action(
    p_actor_id, 'game_data_action.revoke', current_type, current_entry
  ) THEN
    RAISE EXCEPTION 'revoke_permission_denied';
  END IF;

  UPDATE public.game_data_actions
  SET
    status = 'revoked',
    is_public = false,
    reviewed_by = p_actor_id,
    reviewed_at = now(),
    rejection_reason = NULL
  WHERE id = p_action_id;
END;
$$;
