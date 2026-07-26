CREATE TABLE public.notification_subscription_settings (
  user_id uuid PRIMARY KEY REFERENCES public.users(id) ON DELETE CASCADE,
  article_version_pending_enabled boolean NOT NULL DEFAULT false,
  game_data_action_pending_enabled boolean NOT NULL DEFAULT false,
  discussion_comment_enabled boolean NOT NULL DEFAULT false,
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.notification_subscription_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own notification subscription settings"
  ON public.notification_subscription_settings FOR SELECT TO authenticated
  USING ((SELECT auth.uid()) = user_id);

CREATE POLICY "Users can insert own notification subscription settings"
  ON public.notification_subscription_settings FOR INSERT TO authenticated
  WITH CHECK ((SELECT auth.uid()) = user_id);

CREATE POLICY "Users can update own notification subscription settings"
  ON public.notification_subscription_settings FOR UPDATE TO authenticated
  USING ((SELECT auth.uid()) = user_id)
  WITH CHECK ((SELECT auth.uid()) = user_id);

REVOKE ALL ON public.notification_subscription_settings FROM authenticated;
GRANT SELECT, INSERT, UPDATE ON public.notification_subscription_settings TO authenticated;

ALTER TABLE public.notifications
  DROP CONSTRAINT IF EXISTS notifications_kind_check;

ALTER TABLE public.notifications
  ADD CONSTRAINT notifications_kind_check CHECK (
    kind IN (
      'article_version_approved',
      'article_version_rejected',
      'game_data_action_approved',
      'game_data_action_rejected',
      'article_comment_created',
      'article_version_created',
      'game_data_action_created',
      'discussion_comment_created'
    )
  );

CREATE OR REPLACE FUNCTION public.get_article_version_notification_recipients(
  p_article_id uuid,
  p_proposed_category_id uuid DEFAULT NULL,
  p_actor_id uuid DEFAULT NULL
)
RETURNS TABLE(user_id uuid)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT settings.user_id
  FROM public.notification_subscription_settings settings
  WHERE settings.article_version_pending_enabled
    AND (p_actor_id IS NULL OR settings.user_id <> p_actor_id)
    AND public.can_moderate_article_version(
      settings.user_id,
      p_article_id,
      p_proposed_category_id
    );
$$;

CREATE OR REPLACE FUNCTION public.get_game_data_action_notification_recipients(
  p_action_id uuid,
  p_actor_id uuid DEFAULT NULL
)
RETURNS TABLE(user_id uuid)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT settings.user_id
  FROM public.notification_subscription_settings settings
  JOIN public.game_data_actions action_row ON action_row.id = p_action_id
  WHERE settings.game_data_action_pending_enabled
    AND action_row.status = 'pending'
    AND action_row.is_public = false
    AND (p_actor_id IS NULL OR settings.user_id <> p_actor_id)
    AND (
      public.can_access_game_action(
        settings.user_id,
        'game_data_action.approve',
        action_row.entity_type,
        action_row.entry
      )
      OR public.can_access_game_action(
        settings.user_id,
        'game_data_action.reject',
        action_row.entity_type,
        action_row.entry
      )
    );
$$;

REVOKE EXECUTE ON FUNCTION public.get_article_version_notification_recipients(uuid, uuid, uuid)
  FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.get_game_data_action_notification_recipients(uuid, uuid)
  FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_article_version_notification_recipients(uuid, uuid, uuid)
  TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.get_game_data_action_notification_recipients(uuid, uuid)
  TO authenticated, service_role;
