BEGIN;

CREATE EXTENSION IF NOT EXISTS pgtap WITH SCHEMA extensions;
SET search_path = public, extensions;

SELECT plan(6);

INSERT INTO auth.users (id, aud, role, email)
VALUES
  (
    '61000000-0000-4000-8000-000000000001',
    'authenticated',
    'authenticated',
    'game-action-rls-scoped@example.test'
  ),
  (
    '61000000-0000-4000-8000-000000000002',
    'authenticated',
    'authenticated',
    'game-action-rls-global@example.test'
  );

INSERT INTO public.users (id, username_hash, nickname, salt)
VALUES
  (
    '61000000-0000-4000-8000-000000000001',
    'game-action-rls-scoped',
    'game-action-rls-scoped',
    'test-salt'
  ),
  (
    '61000000-0000-4000-8000-000000000002',
    'game-action-rls-global',
    'game-action-rls-global',
    'test-salt'
  );
INSERT INTO public.user_groups (id, name, description)
VALUES
  (
    '62000000-0000-4000-8000-000000000001',
    'Game action RLS scoped test',
    'Transactional test fixture'
  ),
  (
    '62000000-0000-4000-8000-000000000002',
    'Game action RLS global test',
    'Transactional test fixture'
  );

INSERT INTO public.user_group_memberships (user_id, group_id)
VALUES
  (
    '61000000-0000-4000-8000-000000000001',
    '62000000-0000-4000-8000-000000000001'
  ),
  (
    '61000000-0000-4000-8000-000000000002',
    '62000000-0000-4000-8000-000000000002'
  );

INSERT INTO public.group_permission_grants (
  group_id,
  permission_key,
  scope,
  resource_type,
  resource_id
)
SELECT
  '62000000-0000-4000-8000-000000000001'::uuid,
  permission_key,
  'resource_type'::public.permission_scope,
  'characters',
  '*'
FROM unnest(ARRAY[
  'game_data_action.approve',
  'game_data_action.reject',
  'game_data_action.mark_synced',
  'game_data_action.revoke'
]) AS permission(permission_key)
UNION ALL
SELECT
  '62000000-0000-4000-8000-000000000002'::uuid,
  permission_key,
  'global'::public.permission_scope,
  '*',
  '*'
FROM unnest(ARRAY[
  'game_data_action.approve',
  'game_data_action.reject',
  'game_data_action.mark_synced',
  'game_data_action.revoke'
]) AS permission(permission_key);

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
    '63000000-0000-4000-8000-000000000001',
    'characters',
    '{"path":["tom","description"],"value":"scoped"}'::jsonb,
    'pending',
    false,
    '2026-08-09T00:03:00Z'
  ),
  (
    '63000000-0000-4000-8000-000000000002',
    'maps',
    '{"path":["classic","name"],"value":"denied"}'::jsonb,
    'pending',
    false,
    '2026-08-09T00:02:00Z'
  ),
  (
    '63000000-0000-4000-8000-000000000003',
    'maps',
    '{"path":["classic","description"],"value":"public"}'::jsonb,
    'pending',
    true,
    '2026-08-09T00:01:00Z'
  );

SET LOCAL ROLE authenticated;
SELECT set_config(
  'request.jwt.claim.sub',
  '61000000-0000-4000-8000-000000000001',
  true
);

SELECT is(
  (SELECT count(*)::integer
   FROM public.get_my_permission_grants() AS grant_row
   WHERE grant_row.permission_key IN (
     'game_data_action.approve',
     'game_data_action.reject',
     'game_data_action.mark_synced',
     'game_data_action.revoke'
   )
     AND grant_row.scope = 'resource_type'
     AND grant_row.resource_type = 'characters'),
  4,
  'the scoped moderator has four resource-type moderation grants'
);
SELECT is(
  (SELECT count(*)::integer FROM public.game_data_actions
   WHERE id::text LIKE '63000000-0000-4000-8000-%'),
  2,
  'the scoped moderator sees the in-scope private row and public row'
);
SELECT is(
  (SELECT count(*)::integer FROM public.game_data_actions
   WHERE id = '63000000-0000-4000-8000-000000000001'),
  1,
  'the scoped moderator can list and open an in-scope private action'
);
SELECT is(
  (SELECT count(*)::integer FROM public.game_data_actions
   WHERE id = '63000000-0000-4000-8000-000000000002'),
  0,
  'detail lookup denies a private action outside the moderator scope'
);
SELECT is(
  (SELECT count(*)::integer FROM public.game_data_actions
   WHERE id::text LIKE '63000000-0000-4000-8000-%' AND entity_type = 'maps'),
  1,
  'the scoped maps list contains only the public action'
);

SELECT set_config(
  'request.jwt.claim.sub',
  '61000000-0000-4000-8000-000000000002',
  true
);
SELECT is(
  (SELECT count(*)::integer FROM public.game_data_actions
   WHERE id = '63000000-0000-4000-8000-000000000002'),
  1,
  'the global moderator can open the private action outside the scoped grant'
);

SELECT * FROM finish();
ROLLBACK;
