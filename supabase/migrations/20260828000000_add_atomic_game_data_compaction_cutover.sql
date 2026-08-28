CREATE OR REPLACE FUNCTION public.prepared_mark_game_data_actions_synced_batch(
  p_actor_id uuid,
  p_action_ids uuid[],
  p_expected_replay_epoch bigint
)
RETURNS TABLE(synced_action_ids uuid[], replay_epoch bigint)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  requested_count bigint;
  unique_count bigint;
  current_epoch bigint;
  matched_count bigint;
  updated_count bigint;
BEGIN
  IF p_action_ids IS NULL OR cardinality(p_action_ids) = 0 THEN
    RAISE EXCEPTION 'action_ids_must_be_nonempty';
  END IF;

  SELECT count(action_id), count(DISTINCT action_id)
  INTO requested_count, unique_count
  FROM unnest(p_action_ids) AS requested(action_id);

  IF requested_count IS DISTINCT FROM cardinality(p_action_ids)
    OR unique_count IS DISTINCT FROM requested_count THEN
    RAISE EXCEPTION 'action_ids_must_be_unique_and_nonnull';
  END IF;

  SELECT epoch
  INTO current_epoch
  FROM public.game_data_approved_replay_epoch
  WHERE singleton = true
  FOR UPDATE;

  IF current_epoch IS DISTINCT FROM p_expected_replay_epoch THEN
    RAISE EXCEPTION USING ERRCODE = '40001', MESSAGE = 'approved_replay_epoch_conflict';
  END IF;

  -- Lock in UUID order so overlapping operational batches cannot deadlock each other.
  PERFORM action.id
  FROM public.game_data_actions AS action
  WHERE action.id = ANY(p_action_ids)
  ORDER BY action.id
  FOR UPDATE;

  SELECT count(*)
  INTO matched_count
  FROM public.game_data_actions AS action
  WHERE action.id = ANY(p_action_ids)
    AND action.status = 'approved'::public.game_data_action_status
    AND action.is_public = true;

  IF matched_count IS DISTINCT FROM requested_count THEN
    RAISE EXCEPTION 'approved_action_batch_changed';
  END IF;

  IF EXISTS (
    SELECT 1
    FROM public.game_data_actions AS action
    WHERE action.id = ANY(p_action_ids)
      AND NOT public.can_access_game_action(
        p_actor_id,
        'game_data_action.mark_synced',
        action.entity_type,
        action.entry
      )
  ) THEN
    RAISE EXCEPTION 'mark_synced_permission_denied';
  END IF;

  UPDATE public.game_data_actions AS action
  SET
    status = 'synced'::public.game_data_action_status,
    is_public = false,
    reviewed_by = p_actor_id,
    reviewed_at = now(),
    rejection_reason = NULL
  WHERE action.id = ANY(p_action_ids)
    AND action.status = 'approved'::public.game_data_action_status
    AND action.is_public = true;

  GET DIAGNOSTICS updated_count = ROW_COUNT;
  IF updated_count IS DISTINCT FROM requested_count THEN
    RAISE EXCEPTION 'approved_action_batch_changed';
  END IF;

  SELECT epoch
  INTO replay_epoch
  FROM public.game_data_approved_replay_epoch
  WHERE singleton = true;

  -- Preserve the existing per-row trigger: a batch of N removals advances the epoch N times.
  IF replay_epoch IS DISTINCT FROM p_expected_replay_epoch + requested_count THEN
    RAISE EXCEPTION 'approved_replay_epoch_invariant_failed';
  END IF;

  SELECT array_agg(action.id ORDER BY action.created_at, action.id)
  INTO synced_action_ids
  FROM public.game_data_actions AS action
  WHERE action.id = ANY(p_action_ids);

  RETURN NEXT;
END;
$$;

REVOKE ALL ON FUNCTION public.prepared_mark_game_data_actions_synced_batch(
  uuid,
  uuid[],
  bigint
) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.prepared_mark_game_data_actions_synced_batch(
  uuid,
  uuid[],
  bigint
) TO service_role;
