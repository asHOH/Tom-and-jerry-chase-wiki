BEGIN;

CREATE EXTENSION IF NOT EXISTS pgtap WITH SCHEMA extensions;
SET search_path = public, extensions;

SELECT plan(16);

SELECT ok(
  has_function_privilege('anon', 'public.read_game_data_synced_history_source()', 'EXECUTE'),
  'anon can execute the derived synced-history RPC'
);
SELECT ok(
  has_function_privilege(
    'authenticated',
    'public.read_game_data_synced_history_source()',
    'EXECUTE'
  ),
  'authenticated can execute the derived synced-history RPC'
);
SELECT ok(
  NOT has_function_privilege(
    'anon',
    'public.game_data_history_actions_from_entry(jsonb)',
    'EXECUTE'
  ),
  'anon cannot execute the raw-entry normalizer'
);
SELECT ok(
  NOT EXISTS (
    SELECT 1 FROM information_schema.routine_privileges
    WHERE specific_schema = 'public'
      AND routine_name IN (
        'game_data_history_actions_from_entry',
        'read_game_data_synced_history_source'
      )
      AND grantee = 'PUBLIC'
  ),
  'neither history function retains the default PUBLIC grant'
);
SELECT ok(
  (
    SELECT routine.prosecdef
    FROM pg_proc AS routine
    INNER JOIN pg_namespace AS namespace ON namespace.oid = routine.pronamespace
    WHERE namespace.nspname = 'public'
      AND routine.proname = 'read_game_data_synced_history_source'
      AND routine.pronargs = 0
  ),
  'the public history RPC is SECURITY DEFINER'
);
SELECT is(
  (
    SELECT routine.proconfig
    FROM pg_proc AS routine
    INNER JOIN pg_namespace AS namespace ON namespace.oid = routine.pronamespace
    WHERE namespace.nspname = 'public'
      AND routine.proname = 'read_game_data_synced_history_source'
      AND routine.pronargs = 0
  ),
  ARRAY['search_path=public']::text[],
  'the public history RPC has a fixed search path'
);
SELECT function_returns(
  'public',
  'read_game_data_synced_history_source',
  ARRAY[]::text[],
  'jsonb',
  'the public history RPC returns one JSON object'
);

INSERT INTO public.game_data_actions (entity_type, entry, status, is_public, created_at)
VALUES
  (
    'items',
    '{"op":"set","path":"火箭.description","oldValue":"private-old","newValue":"private-new"}'::jsonb,
    'synced',
    false,
    '2026-08-21T00:00:00Z'
  ),
  (
    'characters',
    '[[{"op":"add","path":"汤姆.aliases.0","newValue":"alias"}],{"op":"delete","path":"汤姆.description","oldValue":"private"}]'::jsonb,
    'synced',
    false,
    '2026-08-21T00:01:00Z'
  ),
  (
    'items',
    '{"op":"set","path":"盘子.description","newValue":"approved"}'::jsonb,
    'approved',
    true,
    '2026-08-21T00:02:00Z'
  ),
  (
    'recommended',
    '{"op":"set","path":"items.火箭","newValue":"ignored"}'::jsonb,
    'synced',
    false,
    '2026-08-21T00:03:00Z'
  );

CREATE TEMPORARY TABLE history_payload AS
SELECT public.read_game_data_synced_history_source() AS value;

SELECT is(
  (SELECT (value ->> 'sourceActionCount')::integer FROM history_payload),
  2,
  'the source includes only synced rows with published-history mappings'
);
SELECT is(
  (SELECT (value ->> 'rowCount')::integer FROM history_payload),
  2,
  'every valid source action produces exactly one projection row'
);
SELECT is(
  (SELECT (value ->> 'operationCount')::integer FROM history_payload),
  3,
  'the projection preserves every flattened operation'
);
SELECT is(
  (
    SELECT array_agg(key ORDER BY key)
    FROM history_payload
    CROSS JOIN LATERAL jsonb_object_keys(value) AS keys(key)
  ),
  ARRAY['operationCount', 'rowCount', 'rows', 'sourceActionCount']::text[],
  'the RPC returns exactly the four documented root keys'
);
SELECT ok(
  NOT EXISTS (
    SELECT 1
    FROM history_payload
    CROSS JOIN LATERAL jsonb_array_elements(value -> 'rows') AS rows(row_value)
    CROSS JOIN LATERAL (
      SELECT array_agg(key ORDER BY key) AS keys
      FROM jsonb_object_keys(row_value) AS row_keys(key)
    ) AS row_keys
    WHERE row_keys.keys <> ARRAY['actions', 'createdAt', 'entityType']::text[]
  ),
  'every history row has exactly the three documented keys'
);
SELECT ok(
  NOT EXISTS (
    SELECT 1
    FROM history_payload
    CROSS JOIN LATERAL jsonb_array_elements(value -> 'rows') AS rows(row_value)
    WHERE row_value ?| ARRAY[
      'id', 'actionId', 'entry', 'createdBy', 'message', 'status', 'reviewedAt'
    ]
  ),
  'history rows expose no identity, raw entry, moderation, or profile fields'
);
SELECT ok(
  NOT EXISTS (
    SELECT 1
    FROM history_payload
    CROSS JOIN LATERAL jsonb_array_elements(value -> 'rows') AS rows(row_value)
    CROSS JOIN LATERAL jsonb_array_elements(row_value -> 'actions') AS actions(action_value)
    WHERE action_value ?| ARRAY['oldValue', 'newValue', 'id', 'entry']
      OR (SELECT array_agg(key ORDER BY key) FROM jsonb_object_keys(action_value) AS keys(key))
        <> ARRAY['op', 'path']::text[]
  ),
  'history operations expose only op and path'
);
SELECT is(
  (
    SELECT array_agg(action_value ->> 'path' ORDER BY row_ordinal, action_ordinal)
    FROM history_payload
    CROSS JOIN LATERAL jsonb_array_elements(value -> 'rows')
      WITH ORDINALITY AS rows(row_value, row_ordinal)
    CROSS JOIN LATERAL jsonb_array_elements(row_value -> 'actions')
      WITH ORDINALITY AS actions(action_value, action_ordinal)
  ),
  ARRAY['火箭.description', '汤姆.aliases.0', '汤姆.description']::text[],
  'source and nested operation order are preserved'
);
SELECT is(
  (
    SELECT row_value ->> 'createdAt'
    FROM history_payload
    CROSS JOIN LATERAL jsonb_array_elements(value -> 'rows') AS rows(row_value)
    LIMIT 1
  ),
  '2026-08-21T00:00:00+00:00',
  'createdAt is the only source-row metadata exposed'
);

SELECT * FROM finish();
ROLLBACK;
