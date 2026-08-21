CREATE OR REPLACE FUNCTION public.game_data_history_actions_from_entry(p_entry jsonb)
RETURNS TABLE(action_ordinal bigint, action_op text, action_path text)
LANGUAGE plpgsql
IMMUTABLE
SET search_path = public
AS $$
DECLARE
  candidate jsonb;
  child jsonb;
  candidates jsonb[] := ARRAY[]::jsonb[];
  candidate_ordinal bigint := 0;
  normalized_path text;
BEGIN
  IF jsonb_typeof(p_entry) = 'object' THEN
    candidates := array_append(candidates, p_entry);
  ELSIF jsonb_typeof(p_entry) = 'array' AND jsonb_array_length(p_entry) > 0 THEN
    FOR candidate IN SELECT value FROM jsonb_array_elements(p_entry) LOOP
      IF jsonb_typeof(candidate) = 'array' THEN
        IF jsonb_array_length(candidate) = 0 THEN
          RETURN;
        END IF;
        FOR child IN SELECT value FROM jsonb_array_elements(candidate) LOOP
          IF jsonb_typeof(child) <> 'object' THEN
            RETURN;
          END IF;
          candidates := array_append(candidates, child);
        END LOOP;
      ELSE
        candidates := array_append(candidates, candidate);
      END IF;
    END LOOP;
  ELSE
    RETURN;
  END IF;

  FOREACH candidate IN ARRAY candidates LOOP
    IF jsonb_typeof(candidate) <> 'object'
      OR COALESCE(candidate ->> 'op', '') NOT IN ('set', 'add', 'delete')
      OR jsonb_typeof(candidate -> 'path') IS DISTINCT FROM 'string'
      OR (candidate ->> 'op') = 'add' AND NOT (candidate ? 'newValue') THEN
      RETURN;
    END IF;

    normalized_path := btrim(candidate ->> 'path');
    IF normalized_path = '' OR EXISTS (
      SELECT 1
      FROM unnest(string_to_array(normalized_path, '.')) AS segment(value)
      WHERE btrim(segment.value) = ''
        OR segment.value IN ('__proto__', 'prototype', 'constructor')
    ) THEN
      RETURN;
    END IF;
  END LOOP;

  FOREACH candidate IN ARRAY candidates LOOP
    candidate_ordinal := candidate_ordinal + 1;
    action_ordinal := candidate_ordinal;
    action_op := candidate ->> 'op';
    action_path := btrim(candidate ->> 'path');
    RETURN NEXT;
  END LOOP;
END;
$$;

REVOKE ALL ON FUNCTION public.game_data_history_actions_from_entry(jsonb)
  FROM PUBLIC, anon, authenticated;

CREATE OR REPLACE FUNCTION public.read_game_data_synced_history_source()
RETURNS jsonb
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  WITH eligible_source AS (
    SELECT action.id, action.entity_type, action.entry, action.created_at
    FROM public.game_data_actions AS action
    WHERE action.status = 'synced'::public.game_data_action_status
      AND action.entity_type IN (
        'characters', 'cards', 'specialSkills', 'items', 'entities',
        'buffs', 'maps', 'fixtures', 'modes', 'achievements'
      )
  ),
  normalized_rows AS (
    SELECT
      source.id,
      source.entity_type,
      source.created_at,
      jsonb_agg(
        jsonb_build_object('op', normalized.action_op, 'path', normalized.action_path)
        ORDER BY normalized.action_ordinal ASC
      ) AS actions,
      count(*)::bigint AS operation_count
    FROM eligible_source AS source
    CROSS JOIN LATERAL public.game_data_history_actions_from_entry(source.entry) AS normalized
    GROUP BY source.id, source.entity_type, source.created_at
  ),
  source_count AS (
    SELECT count(*)::bigint AS value FROM eligible_source
  ),
  projection_count AS (
    SELECT count(*)::bigint AS row_count,
      COALESCE(sum(normalized_rows.operation_count), 0)::bigint AS operation_count
    FROM normalized_rows
  )
  SELECT jsonb_build_object(
    'sourceActionCount', source_count.value,
    'rowCount', projection_count.row_count,
    'operationCount', projection_count.operation_count,
    'rows', COALESCE(
      (
        SELECT jsonb_agg(
          jsonb_build_object(
            'entityType', normalized_rows.entity_type,
            'createdAt', normalized_rows.created_at,
            'actions', normalized_rows.actions
          )
          ORDER BY normalized_rows.created_at ASC, normalized_rows.id ASC
        )
        FROM normalized_rows
      ),
      '[]'::jsonb
    )
  )
  FROM source_count CROSS JOIN projection_count;
$$;

REVOKE ALL ON FUNCTION public.read_game_data_synced_history_source()
  FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.read_game_data_synced_history_source()
  TO anon, authenticated;
