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
  path_parts text[];
  relation_target_id text;
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
    path_parts := string_to_array(action_path, '.');
    FOREACH path_part IN ARRAY path_parts LOOP
      IF path_part <> '' THEN
        resolved_character_id := path_part;
        EXIT;
      END IF;
    END LOOP;

    IF resolved_character_id IS NOT NULL
      AND NOT (resolved_character_id = ANY(character_ids)) THEN
      character_ids := array_append(character_ids, resolved_character_id);
    END IF;

    -- Canonical shared records live at owner.characterRelationOverrides.other.
    -- The path retains both endpoints even in a compact synced-history entry.
    IF array_length(path_parts, 1) = 3
      AND path_parts[1] = resolved_character_id
      AND path_parts[2] = 'characterRelationOverrides' THEN
      relation_target_id := path_parts[3];
      IF btrim(relation_target_id) <> ''
        AND NOT (relation_target_id = ANY(character_ids)) THEN
        character_ids := array_append(character_ids, relation_target_id);
      END IF;
    END IF;
  END LOOP;

  FOREACH character_id IN ARRAY character_ids LOOP
    RETURN NEXT;
  END LOOP;
END;
$$;

REVOKE ALL ON FUNCTION public.game_data_character_ids_from_entry(jsonb)
  FROM PUBLIC, anon, authenticated;

