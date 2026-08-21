CREATE OR REPLACE FUNCTION public.game_data_character_ids_from_entry(p_entry jsonb)
RETURNS TABLE(character_id text)
LANGUAGE plpgsql
IMMUTABLE
SET search_path = public
AS $$
DECLARE
  candidate jsonb;
  child jsonb;
  candidates jsonb[] := ARRAY[]::jsonb[];
  character_ids text[] := ARRAY[]::text[];
  action_path text;
  path_part text;
  resolved_character_id text;
BEGIN
  IF jsonb_typeof(p_entry) = 'object' THEN
    candidates := array_append(candidates, p_entry);
  ELSIF jsonb_typeof(p_entry) = 'array' THEN
    FOR candidate IN SELECT value FROM jsonb_array_elements(p_entry) LOOP
      IF jsonb_typeof(candidate) = 'object' THEN
        candidates := array_append(candidates, candidate);
      ELSIF jsonb_typeof(candidate) = 'array' THEN
        FOR child IN SELECT value FROM jsonb_array_elements(candidate) LOOP
          IF jsonb_typeof(child) <> 'object' THEN
            RETURN;
          END IF;
          candidates := array_append(candidates, child);
        END LOOP;
      ELSE
        RETURN;
      END IF;
    END LOOP;
  ELSE
    RETURN;
  END IF;

  FOREACH candidate IN ARRAY candidates LOOP
    IF COALESCE(candidate ->> 'op', '') NOT IN ('set', 'add', 'delete')
      OR jsonb_typeof(candidate -> 'path') IS DISTINCT FROM 'string'
      OR btrim(candidate ->> 'path') = '' THEN
      RETURN;
    END IF;

    action_path := btrim(candidate ->> 'path');
    resolved_character_id := NULL;
    FOREACH path_part IN ARRAY string_to_array(action_path, '.') LOOP
      IF path_part <> '' THEN
        resolved_character_id := path_part;
        EXIT;
      END IF;
    END LOOP;

    IF resolved_character_id IS NOT NULL
      AND NOT (resolved_character_id = ANY(character_ids)) THEN
      character_ids := array_append(character_ids, resolved_character_id);
    END IF;
  END LOOP;

  FOREACH character_id IN ARRAY character_ids LOOP
    RETURN NEXT;
  END LOOP;
END;
$$;

REVOKE ALL ON FUNCTION public.game_data_character_ids_from_entry(jsonb)
  FROM PUBLIC, anon, authenticated;

CREATE OR REPLACE FUNCTION public.read_game_data_character_contributor_source()
RETURNS jsonb
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  WITH eligible_source AS (
    SELECT action.created_by, target.character_id
    FROM public.game_data_actions AS action
    CROSS JOIN LATERAL public.game_data_character_ids_from_entry(action.entry) AS target
    WHERE action.entity_type = 'characters'
      AND (action.is_public = true OR action.status = 'synced')
      AND action.created_by IS NOT NULL
  ),
  contributor_rows AS (
    SELECT
      source.character_id,
      source.created_by AS contributor_id,
      btrim(profile.nickname) AS nickname,
      count(*)::bigint AS contribution_count
    FROM eligible_source AS source
    INNER JOIN public.users AS profile ON profile.id = source.created_by
    WHERE btrim(profile.nickname) <> ''
    GROUP BY source.character_id, source.created_by, btrim(profile.nickname)
  ),
  source_count AS (
    SELECT count(*)::bigint AS value
    FROM public.game_data_actions AS action
    WHERE action.entity_type = 'characters'
      AND (action.is_public = true OR action.status = 'synced')
  )
  SELECT jsonb_build_object(
    'sourceActionCount', source_count.value,
    'rowCount', count(contributor_rows.character_id),
    'rows', COALESCE(
      jsonb_agg(
        jsonb_build_object(
          'characterId', contributor_rows.character_id,
          'contributorId', contributor_rows.contributor_id,
          'nickname', contributor_rows.nickname,
          'contributionCount', contributor_rows.contribution_count
        )
        ORDER BY
          contributor_rows.character_id COLLATE "C" ASC,
          contributor_rows.contribution_count DESC,
          contributor_rows.nickname COLLATE "C" ASC,
          contributor_rows.contributor_id ASC
      ) FILTER (WHERE contributor_rows.character_id IS NOT NULL),
      '[]'::jsonb
    )
  )
  FROM source_count
  LEFT JOIN contributor_rows ON true
  GROUP BY source_count.value;
$$;

REVOKE ALL ON FUNCTION public.read_game_data_character_contributor_source()
  FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.read_game_data_character_contributor_source()
  TO anon, authenticated;
