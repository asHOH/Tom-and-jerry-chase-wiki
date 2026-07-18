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
  auto_approve boolean;
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

  SELECT bool_and(public.can_access_game_action(
    p_actor_id, 'game_data_action.approve', p_entity_type, value
  ))
  INTO auto_approve
  FROM jsonb_array_elements(p_entries);

  target_status := CASE WHEN auto_approve THEN 'approved' ELSE 'pending' END;
  target_public := auto_approve;

  FOR entry IN SELECT value FROM jsonb_array_elements(p_entries) LOOP
    INSERT INTO public.game_data_actions(
      entity_type, entry, status, is_public, created_by,
      reviewed_by, reviewed_at, message
    ) VALUES (
      p_entity_type, entry, target_status, target_public, p_actor_id,
      CASE WHEN auto_approve THEN p_actor_id END,
      CASE WHEN auto_approve THEN now() END,
      p_message
    )
    RETURNING game_data_actions.id, game_data_actions.is_public, game_data_actions.status
    INTO id, is_public, status;
    RETURN NEXT;
  END LOOP;
END;
$$;

REVOKE ALL ON FUNCTION public.prepared_publish_game_data_actions(
  uuid, text, text, jsonb, text, bigint
) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.prepared_publish_game_data_actions(
  uuid, text, text, jsonb, text, bigint
) TO service_role;

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
  SET status = 'approved', is_public = true, reviewed_by = p_actor_id,
    reviewed_at = now(), rejection_reason = NULL
  WHERE id = p_action_id;
END;
$$;

REVOKE ALL ON FUNCTION public.prepared_approve_game_data_action(
  uuid, uuid, text, jsonb, bigint
) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.prepared_approve_game_data_action(
  uuid, uuid, text, jsonb, bigint
) TO service_role;

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
  SET status = 'synced', is_public = true, reviewed_by = p_actor_id,
    reviewed_at = now(), rejection_reason = NULL
  WHERE id = p_action_id;
END;
$$;

REVOKE ALL ON FUNCTION public.prepared_mark_game_data_action_synced(
  uuid, uuid, text, jsonb, bigint
) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.prepared_mark_game_data_action_synced(
  uuid, uuid, text, jsonb, bigint
) TO service_role;
