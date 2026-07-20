CREATE OR REPLACE FUNCTION public.prepared_publish_anonymous_game_data_actions(
  p_entity_type text,
  p_entries jsonb,
  p_expected_replay_epoch bigint,
  p_message text DEFAULT NULL
)
RETURNS TABLE(id uuid, is_public boolean, status public.game_data_action_status)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  current_epoch bigint;
  entry jsonb;
BEGIN
  SELECT epoch INTO current_epoch
  FROM public.game_data_approved_replay_epoch
  WHERE singleton = true
  FOR UPDATE;

  IF current_epoch IS DISTINCT FROM p_expected_replay_epoch THEN
    RAISE EXCEPTION USING ERRCODE = '40001', MESSAGE = 'approved_replay_epoch_conflict';
  END IF;
  IF p_entity_type IS NULL OR btrim(p_entity_type) = '' THEN
    RAISE EXCEPTION 'entity_type is required';
  END IF;
  IF jsonb_typeof(p_entries) <> 'array' OR jsonb_array_length(p_entries) = 0 THEN
    RAISE EXCEPTION 'entries_must_be_nonempty_array';
  END IF;

  FOR entry IN SELECT value FROM jsonb_array_elements(p_entries) LOOP
    INSERT INTO public.game_data_actions(
      entity_type, entry, status, is_public, created_by,
      reviewed_by, reviewed_at, message
    ) VALUES (
      p_entity_type, entry, 'pending', false, NULL,
      NULL, NULL, p_message
    )
    RETURNING game_data_actions.id, game_data_actions.is_public, game_data_actions.status
    INTO id, is_public, status;
    RETURN NEXT;
  END LOOP;
END;
$$;

REVOKE ALL ON FUNCTION public.prepared_publish_anonymous_game_data_actions(
  text, jsonb, bigint, text
) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.prepared_publish_anonymous_game_data_actions(
  text, jsonb, bigint, text
) TO service_role;
