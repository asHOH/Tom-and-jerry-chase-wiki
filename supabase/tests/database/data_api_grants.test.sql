BEGIN;
SELECT plan(8);

SELECT ok(
  bool_and(has_table_privilege(role_name, 'public.' || relation_name, 'SELECT')),
  'public reads include invoker views and their underlying tables'
)
FROM unnest(ARRAY['anon', 'authenticated', 'service_role']) AS roles(role_name)
CROSS JOIN unnest(ARRAY[
  'users', 'categories', 'articles', 'article_versions', 'comments', 'game_data_actions',
  'users_public_view', 'article_versions_public_view', 'comments_public_view', 'site_notices'
]) AS relations(relation_name);

SELECT ok(
  bool_and(has_table_privilege('service_role', 'public.' || relation_name, privilege)),
  'server reads and writes work without automatic grants'
)
FROM unnest(ARRAY[
  'users', 'categories', 'articles', 'article_versions', 'comments', 'game_data_actions',
  'feedback', 'notifications', 'notification_email_settings', 'notification_subscription_settings',
  'permission_catalog', 'user_groups', 'group_permission_grants', 'user_group_memberships',
  'blocks', 'block_restrictions', 'block_log', 'user_last_ips'
]) AS relations(relation_name)
CROSS JOIN unnest(ARRAY['SELECT', 'INSERT', 'UPDATE', 'DELETE']) AS privileges(privilege);

SELECT ok(
  has_table_privilege('authenticated', 'public.users', 'UPDATE')
  AND has_table_privilege('authenticated', 'public.notifications', 'SELECT')
  AND has_column_privilege('authenticated', 'public.notifications', 'read_at', 'UPDATE')
  AND NOT has_table_privilege('authenticated', 'public.notifications', 'UPDATE')
  AND NOT EXISTS (
    SELECT 1 FROM pg_attribute
    WHERE attrelid = 'public.notifications'::regclass
      AND attnum > 0 AND NOT attisdropped AND attname <> 'read_at'
      AND has_column_privilege('authenticated', attrelid, attnum, 'UPDATE')
  ),
  'profile updates and notification reads preserve column-only mark-as-read access'
);

SELECT ok(
  bool_and(NOT has_table_privilege(role_name, 'public.' || relation_name, privilege)),
  'content mutations remain restricted to trusted RPCs'
)
FROM unnest(ARRAY['anon', 'authenticated']) AS roles(role_name)
CROSS JOIN unnest(ARRAY[
  'articles', 'article_versions', 'comments', 'categories'
]) AS relations(relation_name)
CROSS JOIN unnest(ARRAY['INSERT', 'UPDATE', 'DELETE']) AS privileges(privilege);

SELECT ok(
  NOT has_table_privilege('anon', 'public.game_data_actions', 'UPDATE')
  AND NOT has_table_privilege('authenticated', 'public.game_data_actions', 'UPDATE')
  AND has_table_privilege('service_role', 'public.game_data_action_publish_operations', 'SELECT')
  AND NOT has_table_privilege(
    'service_role', 'public.game_data_action_publish_operations', 'INSERT,UPDATE,DELETE'
  ),
  'game-data mutation and idempotency protections remain intact'
);

SELECT ok(
  bool_and(NOT has_table_privilege(role_name, 'public.' || relation_name, 'SELECT,INSERT,UPDATE,DELETE')),
  'block data and internal publication state stay private'
)
FROM unnest(ARRAY['anon', 'authenticated']) AS roles(role_name)
CROSS JOIN unnest(ARRAY[
  'blocks', 'block_restrictions', 'block_log', 'user_last_ips',
  'game_data_approved_replay_epoch', 'game_data_action_publish_operations'
]) AS relations(relation_name);

SELECT ok(
  bool_and(has_table_privilege('authenticated', 'public.' || relation_name, 'SELECT')),
  'existing explicit RBAC and subscription reads survive replay'
)
FROM unnest(ARRAY[
  'permission_catalog', 'user_groups', 'group_permission_grants',
  'user_group_memberships', 'notification_subscription_settings'
]) AS relations(relation_name);

SET LOCAL ROLE anon;
SELECT lives_ok(
  'SELECT a.id FROM public.articles a
   LEFT JOIN public.article_versions_public_view v ON v.id = a.current_version_id
   LEFT JOIN public.users_public_view u ON u.id = a.author_id
   LIMIT 1',
  'anonymous article joins can execute through invoker views'
);
RESET ROLE;

SELECT * FROM finish();
ROLLBACK;
