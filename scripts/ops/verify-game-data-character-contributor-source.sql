BEGIN;

SET LOCAL statement_timeout = '5s';

CREATE TEMPORARY TABLE contributor_payload_verification
ON COMMIT DROP
AS
SELECT public.read_game_data_character_contributor_source() AS value;

DO $$
DECLARE
  payload jsonb;
  root_keys text[];
  expected_row_keys constant text[] := ARRAY[
    'characterId',
    'contributionCount',
    'contributorId',
    'nickname'
  ];
  source_action_count bigint;
BEGIN
  SELECT value INTO STRICT payload FROM contributor_payload_verification;

  IF jsonb_typeof(payload) <> 'object' THEN
    RAISE EXCEPTION 'Contributor payload must be one JSON object';
  END IF;

  SELECT array_agg(key ORDER BY key)
  INTO root_keys
  FROM jsonb_object_keys(payload) AS keys(key);

  IF root_keys <> ARRAY['rowCount', 'rows', 'sourceActionCount']::text[] THEN
    RAISE EXCEPTION 'Contributor payload has unexpected root keys: %', root_keys;
  END IF;

  IF (payload ->> 'rowCount')::bigint <> jsonb_array_length(payload -> 'rows') THEN
    RAISE EXCEPTION 'Contributor rowCount does not match rows length';
  END IF;

  IF EXISTS (
    SELECT 1
    FROM jsonb_array_elements(payload -> 'rows') AS rows(row_value)
    WHERE (
      SELECT array_agg(key ORDER BY key)
      FROM jsonb_object_keys(row_value) AS row_keys(key)
    ) <> expected_row_keys
  ) THEN
    RAISE EXCEPTION 'Contributor payload contains an unexpected row shape';
  END IF;

  IF EXISTS (
    SELECT 1
    FROM jsonb_array_elements(payload -> 'rows') AS rows(row_value)
    WHERE row_value ?| ARRAY[
      'actionId',
      'entry',
      'message',
      'status',
      'createdAt',
      'reviewedBy',
      'email'
    ]
  ) THEN
    RAISE EXCEPTION 'Contributor payload contains a private action or profile field';
  END IF;

  SELECT count(*)
  INTO source_action_count
  FROM public.game_data_actions
  WHERE entity_type = 'characters'
    AND (is_public = true OR status = 'synced');

  IF (payload ->> 'sourceActionCount')::bigint <> source_action_count THEN
    RAISE EXCEPTION 'Contributor sourceActionCount does not match the source boundary';
  END IF;

  IF NOT has_function_privilege(
    'anon',
    'public.read_game_data_character_contributor_source()',
    'EXECUTE'
  ) OR NOT has_function_privilege(
    'authenticated',
    'public.read_game_data_character_contributor_source()',
    'EXECUTE'
  ) THEN
    RAISE EXCEPTION 'Contributor RPC grants are incomplete';
  END IF;

  IF has_function_privilege(
    'anon',
    'public.game_data_character_ids_from_entry(jsonb)',
    'EXECUTE'
  ) OR has_function_privilege(
    'authenticated',
    'public.game_data_character_ids_from_entry(jsonb)',
    'EXECUTE'
  ) THEN
    RAISE EXCEPTION 'Contributor raw-entry helper is publicly executable';
  END IF;
END;
$$;

SELECT
  (value ->> 'sourceActionCount')::bigint AS source_action_count,
  (value ->> 'rowCount')::bigint AS contributor_row_count,
  pg_column_size(value) AS payload_bytes
FROM contributor_payload_verification;

COMMIT;
