-- Preserve application access when replaying without Supabase's automatic table grants.
-- Invoker views also require SELECT on their underlying tables; RLS still filters rows.
GRANT SELECT ON TABLE
  public.users,
  public.categories,
  public.articles,
  public.article_versions,
  public.comments,
  public.game_data_actions
TO anon, authenticated;

GRANT SELECT ON TABLE
  public.users_public_view,
  public.article_versions_public_view,
  public.comments_public_view
TO anon, authenticated, service_role;

GRANT UPDATE ON TABLE public.users TO authenticated;
GRANT SELECT ON TABLE public.notifications TO authenticated;

-- Keep the existing column-only notification update and RPC-only content writes.
-- RBAC, subscription settings, site notices, replay epoch and publish-operation
-- client grants are already explicit in their migrations.
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE
  public.users,
  public.categories,
  public.articles,
  public.article_versions,
  public.comments,
  public.game_data_actions,
  public.feedback,
  public.notifications,
  public.notification_email_settings,
  public.notification_subscription_settings,
  public.permission_catalog,
  public.user_groups,
  public.group_permission_grants,
  public.user_group_memberships,
  public.blocks,
  public.block_restrictions,
  public.block_log,
  public.user_last_ips
TO service_role;
