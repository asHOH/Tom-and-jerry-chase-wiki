CREATE TABLE public.game_data_action_publish_operations (
  operation_id uuid PRIMARY KEY,
  request_fingerprint text NOT NULL CHECK (request_fingerprint ~ '^[0-9a-f]{64}$'),
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.game_data_action_publish_operations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.game_data_action_publish_operations FORCE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public.game_data_action_publish_operations FROM PUBLIC, anon, authenticated;
GRANT SELECT ON TABLE public.game_data_action_publish_operations TO service_role;

ALTER TABLE public.game_data_actions
  ADD COLUMN publish_operation_id uuid
    REFERENCES public.game_data_action_publish_operations(operation_id),
  ADD COLUMN publish_operation_ordinal integer,
  ADD COLUMN publish_operation_initial_status public.game_data_action_status,
  ADD COLUMN publish_operation_initial_public boolean,
  ADD CONSTRAINT game_data_actions_publish_operation_snapshot_check
    CHECK (
      (
        publish_operation_id IS NULL
        AND publish_operation_ordinal IS NULL
        AND publish_operation_initial_status IS NULL
        AND publish_operation_initial_public IS NULL
      )
      OR (
        publish_operation_id IS NOT NULL
        AND publish_operation_ordinal IS NOT NULL
        AND publish_operation_initial_status IS NOT NULL
        AND publish_operation_initial_public IS NOT NULL
      )
    );

CREATE UNIQUE INDEX game_data_actions_publish_operation_ordinal_idx
  ON public.game_data_actions (publish_operation_id, publish_operation_ordinal)
  WHERE publish_operation_id IS NOT NULL;

CREATE OR REPLACE FUNCTION public.prepared_publish_game_data_actions_request(
  p_operation_id uuid,
  p_request_fingerprint text,
  p_actor_id uuid,
  p_permission_key text,
  p_actions jsonb,
  p_message text,
  p_expected_replay_epoch bigint,
  p_ip inet DEFAULT NULL,
  p_submit_mode text DEFAULT 'default'
)
RETURNS TABLE(id uuid, is_public boolean, status public.game_data_action_status)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  inserted_count integer;
  existing_fingerprint text;
  existing_count bigint;
  current_epoch bigint;
  action_group jsonb;
  entries jsonb;
  entry jsonb;
  entity_type text;
  can_auto_publish boolean;
  can_self_review boolean;
  target_status public.game_data_action_status;
  target_public boolean;
  operation_ordinal integer := 0;
BEGIN
  IF p_operation_id IS NULL
    OR p_request_fingerprint IS NULL
    OR p_request_fingerprint !~ '^[0-9a-f]{64}$' THEN
    RAISE EXCEPTION 'invalid_idempotency_key';
  END IF;

  INSERT INTO public.game_data_action_publish_operations(operation_id, request_fingerprint)
  VALUES (p_operation_id, p_request_fingerprint)
  ON CONFLICT (operation_id) DO NOTHING;
  GET DIAGNOSTICS inserted_count = ROW_COUNT;

  IF inserted_count = 0 THEN
    SELECT request_fingerprint
    INTO existing_fingerprint
    FROM public.game_data_action_publish_operations
    WHERE operation_id = p_operation_id
    FOR UPDATE;

    IF existing_fingerprint IS DISTINCT FROM p_request_fingerprint THEN
      RAISE EXCEPTION 'idempotency_key_reused';
    END IF;

    SELECT count(*)
    INTO existing_count
    FROM public.game_data_actions
    WHERE publish_operation_id = p_operation_id;
    IF existing_count = 0 THEN
      RAISE EXCEPTION 'idempotency_operation_incomplete';
    END IF;

    RETURN QUERY
    SELECT
      action.id,
      action.publish_operation_initial_public,
      action.publish_operation_initial_status
    FROM public.game_data_actions AS action
    WHERE action.publish_operation_id = p_operation_id
    ORDER BY action.publish_operation_ordinal;
    RETURN;
  END IF;

  SELECT epoch
  INTO current_epoch
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
  IF p_actor_id IS NULL AND p_permission_key <> 'game_data_action.create' THEN
    RAISE EXCEPTION 'publish_permission_denied';
  END IF;
  IF p_submit_mode IS NULL OR p_submit_mode NOT IN (
    'default', 'force_public_pending', 'force_pending'
  ) THEN
    RAISE EXCEPTION 'invalid_submit_mode';
  END IF;
  IF jsonb_typeof(p_actions) <> 'array' OR jsonb_array_length(p_actions) = 0 THEN
    RAISE EXCEPTION 'actions_must_be_nonempty_array';
  END IF;

  FOR action_group IN SELECT value FROM jsonb_array_elements(p_actions) LOOP
    IF jsonb_typeof(action_group) <> 'object'
      OR jsonb_typeof(action_group -> 'entity_type') <> 'string'
      OR jsonb_typeof(action_group -> 'entries') <> 'array'
      OR jsonb_array_length(action_group -> 'entries') = 0 THEN
      RAISE EXCEPTION 'invalid_publish_action_group';
    END IF;

    entity_type := action_group ->> 'entity_type';
    entries := action_group -> 'entries';
    IF p_permission_key = 'game_data_action.publish_relations'
      AND entity_type <> 'characters' THEN
      RAISE EXCEPTION 'invalid_publish_permission_context';
    END IF;

    IF p_actor_id IS NULL THEN
      target_status := 'pending';
      target_public := false;
    ELSE
      FOR entry IN SELECT value FROM jsonb_array_elements(entries) LOOP
        PERFORM public.assert_game_data_entry_not_blocked(
          p_actor_id, p_ip, entity_type, entry
        );
        IF NOT public.can_access_game_action(
          p_actor_id, p_permission_key, entity_type, entry
        ) THEN
          RAISE EXCEPTION 'publish_permission_denied';
        END IF;
      END LOOP;

      SELECT COALESCE(bool_and(public.can_access_game_action(
        p_actor_id, 'game_data_action.auto_approve', entity_type, value
      )), false)
      INTO can_auto_publish
      FROM jsonb_array_elements(entries);

      SELECT COALESCE(bool_and(public.can_access_game_action(
        p_actor_id, 'game_data_action.approve', entity_type, value
      )), false)
      INTO can_self_review
      FROM jsonb_array_elements(entries);

      target_public := CASE
        WHEN p_submit_mode = 'force_pending' THEN false
        ELSE can_auto_publish
      END;
      target_status := CASE
        WHEN p_submit_mode IN ('force_public_pending', 'force_pending') THEN 'pending'
        WHEN can_auto_publish AND can_self_review THEN 'approved'
        ELSE 'pending'
      END;
    END IF;

    IF p_actor_id IS NULL THEN
      FOR entry IN SELECT value FROM jsonb_array_elements(entries) LOOP
        PERFORM public.assert_game_data_entry_not_blocked(NULL, p_ip, entity_type, entry);
        INSERT INTO public.game_data_actions(
          entity_type, entry, status, is_public, created_by,
          reviewed_by, reviewed_at, message,
          publish_operation_id, publish_operation_ordinal,
          publish_operation_initial_status, publish_operation_initial_public
        ) VALUES (
          entity_type, entry, target_status, target_public, NULL,
          NULL, NULL, p_message, p_operation_id, operation_ordinal,
          target_status, target_public
        )
        RETURNING game_data_actions.id, game_data_actions.is_public, game_data_actions.status
        INTO id, is_public, status;
        operation_ordinal := operation_ordinal + 1;
        RETURN NEXT;
      END LOOP;
    ELSE
      FOR entry IN SELECT value FROM jsonb_array_elements(entries) LOOP
        INSERT INTO public.game_data_actions(
          entity_type, entry, status, is_public, created_by,
          reviewed_by, reviewed_at, message,
          publish_operation_id, publish_operation_ordinal,
          publish_operation_initial_status, publish_operation_initial_public
        ) VALUES (
          entity_type,
          entry,
          target_status,
          target_public,
          p_actor_id,
          CASE
            WHEN p_submit_mode = 'default' AND can_auto_publish AND can_self_review
              THEN p_actor_id
          END,
          CASE
            WHEN p_submit_mode = 'default' AND can_auto_publish AND can_self_review
              THEN now()
          END,
          p_message,
          p_operation_id,
          operation_ordinal,
          target_status,
          target_public
        )
        RETURNING game_data_actions.id, game_data_actions.is_public, game_data_actions.status
        INTO id, is_public, status;
        operation_ordinal := operation_ordinal + 1;
        RETURN NEXT;
      END LOOP;
    END IF;
  END LOOP;
END;
$$;

REVOKE ALL ON FUNCTION public.prepared_publish_game_data_actions_request(
  uuid, text, uuid, text, jsonb, text, bigint, inet, text
) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.prepared_publish_game_data_actions_request(
  uuid, text, uuid, text, jsonb, text, bigint, inet, text
) TO service_role;
