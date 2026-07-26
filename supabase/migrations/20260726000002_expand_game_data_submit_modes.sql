DROP FUNCTION IF EXISTS public.prepared_publish_game_data_actions(
  uuid,
  text,
  text,
  jsonb,
  text,
  bigint,
  boolean
);

CREATE OR REPLACE FUNCTION public.prepared_publish_game_data_actions(
  p_actor_id uuid,
  p_permission_key text,
  p_entity_type text,
  p_entries jsonb,
  p_message text,
  p_expected_replay_epoch bigint,
  p_submit_mode text DEFAULT 'default'
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
  IF p_submit_mode IS NULL OR p_submit_mode NOT IN (
    'default', 'force_public_pending', 'force_pending'
  ) THEN
    RAISE EXCEPTION 'invalid_submit_mode';
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

  target_public := CASE
    WHEN p_submit_mode = 'force_pending' THEN false
    ELSE can_auto_publish
  END;
  target_status := CASE
    WHEN p_submit_mode IN ('force_public_pending', 'force_pending') THEN 'pending'
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
      CASE
        WHEN p_submit_mode = 'default' AND can_auto_publish AND can_self_review THEN p_actor_id
      END,
      CASE
        WHEN p_submit_mode = 'default' AND can_auto_publish AND can_self_review THEN now()
      END,
      p_message
    )
    RETURNING game_data_actions.id, game_data_actions.is_public, game_data_actions.status
    INTO id, is_public, status;
    RETURN NEXT;
  END LOOP;
END;
$$;

DROP FUNCTION IF EXISTS public.prepared_publish_game_data_actions(
  uuid,
  text,
  text,
  jsonb,
  text,
  bigint,
  inet,
  boolean
);

CREATE OR REPLACE FUNCTION public.prepared_publish_game_data_actions(
  p_actor_id uuid,
  p_permission_key text,
  p_entity_type text,
  p_entries jsonb,
  p_message text,
  p_expected_replay_epoch bigint,
  p_ip inet,
  p_submit_mode text DEFAULT 'default'
)
RETURNS TABLE(id uuid, is_public boolean, status public.game_data_action_status)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE entry jsonb;
BEGIN
  FOR entry IN SELECT value FROM jsonb_array_elements(p_entries) LOOP
    PERFORM public.assert_game_data_entry_not_blocked(p_actor_id, p_ip, p_entity_type, entry);
  END LOOP;
  RETURN QUERY SELECT * FROM public.prepared_publish_game_data_actions(
    p_actor_id,
    p_permission_key,
    p_entity_type,
    p_entries,
    p_message,
    p_expected_replay_epoch,
    p_submit_mode
  );
END;
$$;

REVOKE ALL ON FUNCTION public.prepared_publish_game_data_actions(
  uuid,
  text,
  text,
  jsonb,
  text,
  bigint,
  text
) FROM PUBLIC, anon, authenticated;

REVOKE ALL ON FUNCTION public.prepared_publish_game_data_actions(
  uuid,
  text,
  text,
  jsonb,
  text,
  bigint,
  inet,
  text
) FROM PUBLIC, anon, authenticated;

GRANT EXECUTE ON FUNCTION public.prepared_publish_game_data_actions(
  uuid,
  text,
  text,
  jsonb,
  text,
  bigint,
  text
) TO service_role;

GRANT EXECUTE ON FUNCTION public.prepared_publish_game_data_actions(
  uuid,
  text,
  text,
  jsonb,
  text,
  bigint,
  inet,
  text
) TO service_role;
