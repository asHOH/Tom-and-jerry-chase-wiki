BEGIN;

CREATE EXTENSION IF NOT EXISTS pgtap WITH SCHEMA extensions;
SET search_path = public, extensions;

SELECT plan(22);

SELECT ok(
  has_function_privilege(
    'anon',
    'public.read_game_data_character_contributor_source()',
    'EXECUTE'
  ),
  'anon can execute the derived contributor RPC'
);
SELECT ok(
  has_function_privilege(
    'authenticated',
    'public.read_game_data_character_contributor_source()',
    'EXECUTE'
  ),
  'authenticated can execute the derived contributor RPC'
);
SELECT ok(
  NOT has_function_privilege(
    'anon',
    'public.game_data_character_ids_from_entry(jsonb)',
    'EXECUTE'
  ),
  'anon cannot execute the raw-entry helper'
);
SELECT ok(
  NOT has_function_privilege(
    'authenticated',
    'public.game_data_character_ids_from_entry(jsonb)',
    'EXECUTE'
  ),
  'authenticated cannot execute the raw-entry helper'
);
SELECT ok(
  NOT EXISTS (
    SELECT 1
    FROM information_schema.routine_privileges
    WHERE specific_schema = 'public'
      AND routine_name IN (
        'game_data_character_ids_from_entry',
        'read_game_data_character_contributor_source'
      )
      AND grantee = 'PUBLIC'
  ),
  'neither contributor function retains the default PUBLIC grant'
);
SELECT ok(
  (
    SELECT routine.prosecdef
    FROM pg_proc AS routine
    INNER JOIN pg_namespace AS namespace ON namespace.oid = routine.pronamespace
    WHERE namespace.nspname = 'public'
      AND routine.proname = 'read_game_data_character_contributor_source'
      AND routine.pronargs = 0
  ),
  'the public contributor RPC is SECURITY DEFINER'
);
SELECT is(
  (
    SELECT routine.proconfig
    FROM pg_proc AS routine
    INNER JOIN pg_namespace AS namespace ON namespace.oid = routine.pronamespace
    WHERE namespace.nspname = 'public'
      AND routine.proname = 'read_game_data_character_contributor_source'
      AND routine.pronargs = 0
  ),
  ARRAY['search_path=public']::text[],
  'the public contributor RPC has a fixed search path'
);

INSERT INTO auth.users (id, aud, role, email)
VALUES
  (
    '71000000-0000-4000-8000-000000000001',
    'authenticated',
    'authenticated',
    'character-contributor-source-a@example.test'
  ),
  (
    '71000000-0000-4000-8000-000000000002',
    'authenticated',
    'authenticated',
    'character-contributor-source-b@example.test'
  ),
  (
    '71000000-0000-4000-8000-000000000003',
    'authenticated',
    'authenticated',
    'character-contributor-source-blank@example.test'
  );

INSERT INTO public.users (id, username_hash, nickname, salt)
VALUES
  (
    '71000000-0000-4000-8000-000000000001',
    'character-contributor-source-a',
    '甲贡献者',
    'test-salt-a'
  ),
  (
    '71000000-0000-4000-8000-000000000002',
    'character-contributor-source-b',
    '乙贡献者',
    'test-salt-b'
  ),
  (
    '71000000-0000-4000-8000-000000000003',
    'character-contributor-source-blank',
    '   ',
    'test-salt-blank'
  );
INSERT INTO public.game_data_actions (entity_type, entry, status, is_public, created_by)
VALUES
  (
    'characters',
    '{"op":"set","path":"汤姆.name","newValue":"single"}'::jsonb,
    'approved',
    true,
    '71000000-0000-4000-8000-000000000001'
  ),
  (
    'characters',
    '[{"op":"set","path":"汤姆.skills.0","newValue":"first"},{"op":"delete","path":"汤姆.description"}]'::jsonb,
    'pending',
    true,
    '71000000-0000-4000-8000-000000000001'
  ),
  (
    'characters',
    '[{"op":"set","path":"杰瑞.name","newValue":"history"},[{"op":"add","path":"汤姆.aliases.0","newValue":"alias"},{"op":"set","path":"斯派克.name","newValue":"history"}]]'::jsonb,
    'synced',
    false,
    '71000000-0000-4000-8000-000000000001'
  ),
  (
    'characters',
    '{"op":"set","path":"汤姆.name","newValue":"b-one"}'::jsonb,
    'approved',
    true,
    '71000000-0000-4000-8000-000000000002'
  ),
  (
    'characters',
    '{"op":"set","path":"汤姆.description","newValue":"b-two"}'::jsonb,
    'approved',
    true,
    '71000000-0000-4000-8000-000000000002'
  ),
  (
    'characters',
    '{"op":"set","path":"private-approved.name","newValue":"excluded"}'::jsonb,
    'approved',
    false,
    '71000000-0000-4000-8000-000000000002'
  ),
  (
    'characters',
    '{"op":"set","path":"private-pending.name","newValue":"excluded"}'::jsonb,
    'pending',
    false,
    '71000000-0000-4000-8000-000000000002'
  ),
  (
    'characters',
    '{"op":"set","path":"private-rejected.name","newValue":"excluded"}'::jsonb,
    'rejected',
    false,
    '71000000-0000-4000-8000-000000000002'
  ),
  (
    'characters',
    '{"op":"set","path":"private-revoked.name","newValue":"excluded"}'::jsonb,
    'revoked',
    false,
    '71000000-0000-4000-8000-000000000002'
  ),
  (
    'characters',
    '{"op":"set","path":"blank-profile.name","newValue":"excluded"}'::jsonb,
    'approved',
    true,
    '71000000-0000-4000-8000-000000000003'
  ),
  (
    'characters',
    '{"op":"set","path":"null-creator.name","newValue":"excluded"}'::jsonb,
    'approved',
    true,
    NULL
  ),
  (
    'characters',
    '[{"op":"set","path":"malformed.name","newValue":"excluded"},{"op":"replace","path":"malformed.description"}]'::jsonb,
    'approved',
    true,
    '71000000-0000-4000-8000-000000000002'
  ),
  (
    'maps',
    '{"op":"set","path":"经典之家.name","newValue":"excluded"}'::jsonb,
    'approved',
    true,
    '71000000-0000-4000-8000-000000000001'
  );

CREATE TEMPORARY TABLE contributor_payload AS
SELECT public.read_game_data_character_contributor_source() AS value;

SELECT is(
  (SELECT (value ->> 'sourceActionCount')::integer FROM contributor_payload),
  8,
  'the source count includes every public or synced character row only'
);
SELECT is(
  (SELECT (value ->> 'rowCount')::integer FROM contributor_payload),
  4,
  'the projection contains one row per character and contributor'
);
SELECT is(
  (SELECT jsonb_array_length(value -> 'rows') FROM contributor_payload),
  4,
  'rowCount matches the JSON rows array length'
);
SELECT is(
  (
    SELECT array_agg(key ORDER BY key)
    FROM contributor_payload
    CROSS JOIN LATERAL jsonb_object_keys(value) AS keys(key)
  ),
  ARRAY['rowCount', 'rows', 'sourceActionCount']::text[],
  'the RPC returns exactly the three documented root keys'
);
SELECT ok(
  NOT EXISTS (
    SELECT 1
    FROM contributor_payload
    CROSS JOIN LATERAL jsonb_array_elements(value -> 'rows') AS rows(row_value)
    CROSS JOIN LATERAL (
      SELECT array_agg(key ORDER BY key) AS keys
      FROM jsonb_object_keys(row_value) AS row_keys(key)
    ) AS row_keys
    WHERE row_keys.keys <> ARRAY[
      'characterId',
      'contributionCount',
      'contributorId',
      'nickname'
    ]::text[]
  ),
  'every contributor row has exactly the four documented derived keys'
);
SELECT ok(
  NOT EXISTS (
    SELECT 1
    FROM contributor_payload
    CROSS JOIN LATERAL jsonb_array_elements(value -> 'rows') AS rows(row_value)
    WHERE row_value ?| ARRAY[
      'actionId',
      'entry',
      'message',
      'status',
      'createdAt',
      'reviewedBy',
      'email'
    ]
  ),
  'the projection exposes no action payload or private profile fields'
);
SELECT is(
  (
    SELECT (row_value ->> 'contributionCount')::integer
    FROM contributor_payload
    CROSS JOIN LATERAL jsonb_array_elements(value -> 'rows') AS rows(row_value)
    WHERE row_value ->> 'characterId' = '汤姆'
      AND row_value ->> 'contributorId' = '71000000-0000-4000-8000-000000000001'
  ),
  3,
  'supported object, action-array, and history-array shapes match legacy aggregation'
);
SELECT is(
  (
    SELECT (row_value ->> 'contributionCount')::integer
    FROM contributor_payload
    CROSS JOIN LATERAL jsonb_array_elements(value -> 'rows') AS rows(row_value)
    WHERE row_value ->> 'characterId' = '汤姆'
      AND row_value ->> 'contributorId' = '71000000-0000-4000-8000-000000000002'
  ),
  2,
  'separate source actions from one contributor are counted separately'
);
SELECT is(
  (
    SELECT (row_value ->> 'contributionCount')::integer
    FROM contributor_payload
    CROSS JOIN LATERAL jsonb_array_elements(value -> 'rows') AS rows(row_value)
    WHERE row_value ->> 'characterId' = '杰瑞'
  ),
  1,
  'one action can contribute to multiple characters'
);
SELECT is(
  (
    SELECT (row_value ->> 'contributionCount')::integer
    FROM contributor_payload
    CROSS JOIN LATERAL jsonb_array_elements(value -> 'rows') AS rows(row_value)
    WHERE row_value ->> 'characterId' = '斯派克'
  ),
  1,
  'nested action-history entries contribute their character targets'
);
SELECT is(
  (
    SELECT array_agg(row_value ->> 'contributorId' ORDER BY ordinal)
    FROM contributor_payload
    CROSS JOIN LATERAL jsonb_array_elements(value -> 'rows')
      WITH ORDINALITY AS rows(row_value, ordinal)
    WHERE row_value ->> 'characterId' = '汤姆'
  ),
  ARRAY[
    '71000000-0000-4000-8000-000000000001',
    '71000000-0000-4000-8000-000000000002'
  ]::text[],
  'contributors are ordered by count before nickname and ID tie breakers'
);
SELECT ok(
  NOT EXISTS (
    SELECT 1
    FROM contributor_payload
    CROSS JOIN LATERAL jsonb_array_elements(value -> 'rows') AS rows(row_value)
    WHERE btrim(row_value ->> 'nickname') = ''
  ),
  'null creators, blank profiles, malformed entries, and missing targets emit no rows'
);

INSERT INTO public.game_data_actions (entity_type, entry, status, is_public, created_by)
SELECT
  'characters',
  jsonb_build_object(
    'op',
    'set',
    'path',
    '大样本.description',
    'newValue',
    sequence_number
  ),
  'synced',
  false,
  '71000000-0000-4000-8000-000000000001'
FROM generate_series(1, 1001) AS source(sequence_number);

TRUNCATE contributor_payload;
INSERT INTO contributor_payload
SELECT public.read_game_data_character_contributor_source();

SELECT is(
  (SELECT (value ->> 'sourceActionCount')::integer FROM contributor_payload),
  1009,
  'a source larger than the PostgREST row cap is counted completely'
);
SELECT is(
  (
    SELECT (row_value ->> 'contributionCount')::integer
    FROM contributor_payload
    CROSS JOIN LATERAL jsonb_array_elements(value -> 'rows') AS rows(row_value)
    WHERE row_value ->> 'characterId' = '大样本'
  ),
  1001,
  'the single JSON result aggregates every row beyond the PostgREST row cap'
);
SELECT is(
  (SELECT (value ->> 'rowCount')::integer FROM contributor_payload),
  5,
  'the large source still returns a complete compact projection'
);

SELECT * FROM finish();
ROLLBACK;
