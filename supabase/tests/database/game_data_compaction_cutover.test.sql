BEGIN;

CREATE EXTENSION IF NOT EXISTS pgtap WITH SCHEMA extensions;
SET search_path = public, extensions;

SELECT plan(8);

SELECT has_function(
  'public',
  'prepared_mark_game_data_actions_synced_batch',
  ARRAY['uuid', 'uuid[]', 'bigint'],
  'atomic compaction cutover RPC exists'
);

SELECT function_privs_are(
  'public',
  'prepared_mark_game_data_actions_synced_batch',
  ARRAY['uuid', 'uuid[]', 'bigint'],
  'authenticated',
  ARRAY[]::text[],
  'authenticated cannot execute the cutover RPC'
);

INSERT INTO auth.users (id, aud, role, email)
VALUES (
  '81000000-0000-4000-8000-000000000001',
  'authenticated',
  'authenticated',
  'compaction-cutover@example.test'
);

INSERT INTO public.users (id, username_hash, nickname, salt)
VALUES (
  '81000000-0000-4000-8000-000000000001',
  'compaction-cutover',
  'compaction-cutover',
  'test-salt'
);

INSERT INTO public.user_groups (id, name, description)
VALUES (
  '82000000-0000-4000-8000-000000000001',
  'Compaction cutover test',
  'Transactional test fixture'
);

INSERT INTO public.user_group_memberships (user_id, group_id)
VALUES (
  '81000000-0000-4000-8000-000000000001',
  '82000000-0000-4000-8000-000000000001'
);

INSERT INTO public.group_permission_grants (
  group_id,
  permission_key,
  scope,
  resource_type,
  resource_id
)
VALUES (
  '82000000-0000-4000-8000-000000000001',
  'game_data_action.mark_synced',
  'global'::public.permission_scope,
  '*',
  '*'
);

INSERT INTO public.game_data_actions (
  id,
  entity_type,
  entry,
  status,
  is_public,
  created_at
)
VALUES
  (
    '83000000-0000-4000-8000-000000000001',
    'items',
    '{"op":"set","path":"item-a.description","newValue":"one"}'::jsonb,
    'approved',
    true,
    '2026-08-28T00:00:01Z'
  ),
  (
    '83000000-0000-4000-8000-000000000002',
    'items',
    '{"op":"set","path":"item-b.description","newValue":"two"}'::jsonb,
    'approved',
    true,
    '2026-08-28T00:00:02Z'
  ),
  (
    '83000000-0000-4000-8000-000000000003',
    'items',
    '{"op":"set","path":"item-c.description","newValue":"three"}'::jsonb,
    'approved',
    true,
    '2026-08-28T00:00:03Z'
  );

CREATE TEMP TABLE compaction_epoch_before AS
SELECT epoch
FROM public.game_data_approved_replay_epoch
WHERE singleton = true;

CREATE TEMP TABLE compaction_cutover_result AS
SELECT *
FROM public.prepared_mark_game_data_actions_synced_batch(
  '81000000-0000-4000-8000-000000000001',
  ARRAY[
    '83000000-0000-4000-8000-000000000001',
    '83000000-0000-4000-8000-000000000002'
  ]::uuid[],
  (SELECT epoch FROM compaction_epoch_before)
);

SELECT is(
  (SELECT synced_action_ids FROM compaction_cutover_result),
  ARRAY[
    '83000000-0000-4000-8000-000000000001',
    '83000000-0000-4000-8000-000000000002'
  ]::uuid[],
  'the RPC returns the complete ordered batch'
);

SELECT is(
  (
    SELECT count(*)::integer
    FROM public.game_data_actions
    WHERE id::text LIKE '83000000-0000-4000-8000-%'
      AND status = 'synced'::public.game_data_action_status
      AND is_public = false
  ),
  2,
  'the complete requested batch is transitioned'
);

SELECT is(
  (SELECT replay_epoch FROM compaction_cutover_result),
  (SELECT epoch + 2 FROM compaction_epoch_before),
  'the existing row trigger advances the replay epoch once per row'
);

SELECT throws_ok(
  format(
    'SELECT * FROM public.prepared_mark_game_data_actions_synced_batch(%L, %L::uuid[], %s)',
    '81000000-0000-4000-8000-000000000001',
    ARRAY[
      '83000000-0000-4000-8000-000000000003',
      '83000000-0000-4000-8000-000000000099'
    ]::uuid[]::text,
    (SELECT epoch FROM public.game_data_approved_replay_epoch WHERE singleton = true)
  ),
  'approved_action_batch_changed',
  'a changed exact row set aborts the batch'
);

SELECT is(
  (
    SELECT status::text || ':' || is_public::text
    FROM public.game_data_actions
    WHERE id = '83000000-0000-4000-8000-000000000003'
  ),
  'approved:true',
  'a rejected batch leaves every requested row unchanged'
);

SELECT is(
  (SELECT epoch FROM public.game_data_approved_replay_epoch WHERE singleton = true),
  (SELECT epoch + 2 FROM compaction_epoch_before),
  'a rejected batch does not advance the replay epoch'
);

SELECT * FROM finish();
ROLLBACK;
