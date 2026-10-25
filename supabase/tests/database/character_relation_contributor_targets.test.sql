BEGIN;

CREATE EXTENSION IF NOT EXISTS pgtap WITH SCHEMA extensions;
SET search_path = public, extensions;

SELECT plan(8);

SELECT results_eq(
  $$SELECT character_id FROM public.game_data_character_ids_from_entry(
    '{"op":"set","path":"Jerry.characterRelationOverrides.Tom","newValue":{"kind":"counteredBy","description":"shared","isMinor":false}}'::jsonb
  ) ORDER BY character_id$$,
  ARRAY['Jerry', 'Tom']::text[],
  'a canonical shared relation credits both endpoints'
);
SELECT results_eq(
  $$SELECT character_id FROM public.game_data_character_ids_from_entry(
    '{"op":"set","path":"Jerry.characterRelationOverrides.Tom","newValue":null}'::jsonb
  ) ORDER BY character_id$$,
  ARRAY['Jerry', 'Tom']::text[],
  'a shared relation tombstone credits both endpoints'
);
SELECT results_eq(
  $$SELECT character_id FROM public.game_data_character_ids_from_entry(
    '{"op":"set","path":"Jerry.characterRelationOverrides.Tom"}'::jsonb
  ) ORDER BY character_id$$,
  ARRAY['Jerry', 'Tom']::text[],
  'a compact history path retains both endpoints without relation values'
);
SELECT results_eq(
  $$SELECT character_id FROM public.game_data_character_ids_from_entry(
    '[[{"op":"set","path":"Jerry.characterRelationOverrides.Tom"},{"op":"set","path":"Tom.description"}],{"op":"set","path":"Jerry.characterRelationOverrides.Tom"}]'::jsonb
  ) ORDER BY character_id$$,
  ARRAY['Jerry', 'Tom']::text[],
  'nested action entries count each endpoint once per source row'
);
SELECT results_eq(
  $$SELECT character_id FROM public.game_data_character_ids_from_entry(
    '{"op":"set","path":"Jerry.description","newValue":"Tom"}'::jsonb
  )$$,
  ARRAY['Jerry']::text[],
  'ordinary character changes retain owner-only attribution'
);
SELECT is_empty(
  $$SELECT character_id FROM public.game_data_character_ids_from_entry(
    '[{"op":"set","path":"Jerry.characterRelationOverrides.Tom"},{"op":"replace","path":"Jerry.description"}]'::jsonb
  )$$,
  'a malformed entry still rejects the entire source row'
);

INSERT INTO auth.users (id, aud, role, email)
VALUES (
  '72000000-0000-4000-8000-000000000001',
  'authenticated',
  'authenticated',
  'character-relation-contributor@example.test'
);
INSERT INTO public.users (id, username_hash, nickname, salt)
VALUES (
  '72000000-0000-4000-8000-000000000001',
  'character-relation-contributor',
  '关系贡献者',
  'test-salt'
);
INSERT INTO public.game_data_actions (entity_type, entry, status, is_public, created_by)
VALUES
  (
    'characters',
    '{"op":"set","path":"Jerry.characterRelationOverrides.Tom","newValue":{"kind":"counteredBy","description":"shared","isMinor":false}}'::jsonb,
    'approved',
    true,
    '72000000-0000-4000-8000-000000000001'
  ),
  (
    'characters',
    '[{"op":"set","path":"Jerry.characterRelationOverrides.Tom","newValue":null},{"op":"set","path":"Tom.description","newValue":"updated"}]'::jsonb,
    'synced',
    false,
    '72000000-0000-4000-8000-000000000001'
  );

SELECT results_eq(
  $$SELECT row_value ->> 'characterId', (row_value ->> 'contributionCount')::integer
    FROM jsonb_array_elements(public.read_game_data_character_contributor_source() -> 'rows') AS rows(row_value)
    ORDER BY row_value ->> 'characterId'$$,
  $$VALUES ('Jerry'::text, 2), ('Tom'::text, 2)$$,
  'the public RPC credits approved and synced relation edits to both characters once'
);
SELECT ok(
  NOT has_function_privilege('anon', 'public.game_data_character_ids_from_entry(jsonb)', 'EXECUTE')
  AND NOT has_function_privilege('authenticated', 'public.game_data_character_ids_from_entry(jsonb)', 'EXECUTE'),
  'the raw-entry helper remains inaccessible to public API roles'
);

SELECT * FROM finish();
ROLLBACK;
