ALTER TYPE public.game_data_action_status ADD VALUE IF NOT EXISTS 'revoked';

INSERT INTO public.permission_catalog (key, category, label_zh, global_only, sort_order)
VALUES ('game_data_action.revoke', '游戏数据', '撤销已批准改动', false, 125)
ON CONFLICT (key) DO NOTHING;

INSERT INTO public.group_permission_grants
  (group_id, permission_key, scope, resource_type, resource_id)
SELECT id, 'game_data_action.revoke', 'global', '*', '*'
FROM public.user_groups
WHERE id IN (
  '00000000-0000-4000-8000-000000000002'::uuid,
  '00000000-0000-4000-8000-000000000003'::uuid
)
ON CONFLICT DO NOTHING;

CREATE OR REPLACE FUNCTION public.prepared_revoke_game_data_action(
  p_actor_id uuid,
  p_action_id uuid,
  p_expected_entity_type text,
  p_expected_entry jsonb,
  p_expected_replay_epoch bigint
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  current_epoch bigint;
  current_type text;
  current_entry jsonb;
BEGIN
  SELECT epoch INTO current_epoch
  FROM public.game_data_approved_replay_epoch
  WHERE singleton = true
  FOR UPDATE;

  IF current_epoch IS DISTINCT FROM p_expected_replay_epoch THEN
    RAISE EXCEPTION USING ERRCODE = '40001', MESSAGE = 'approved_replay_epoch_conflict';
  END IF;

  SELECT entity_type, entry INTO current_type, current_entry
  FROM public.game_data_actions
  WHERE id = p_action_id AND status = 'approved' AND is_public = true
  FOR UPDATE;

  IF NOT FOUND THEN RAISE EXCEPTION 'approved_action_changed'; END IF;
  IF current_type IS DISTINCT FROM p_expected_entity_type
    OR current_entry IS DISTINCT FROM p_expected_entry THEN
    RAISE EXCEPTION 'approved_action_changed';
  END IF;
  IF NOT public.can_access_game_action(
    p_actor_id, 'game_data_action.revoke', current_type, current_entry
  ) THEN
    RAISE EXCEPTION 'revoke_permission_denied';
  END IF;

  UPDATE public.game_data_actions
  SET status = 'revoked', is_public = false, reviewed_by = p_actor_id,
    reviewed_at = now(), rejection_reason = NULL
  WHERE id = p_action_id;
END;
$$;

REVOKE ALL ON FUNCTION public.prepared_revoke_game_data_action(
  uuid, uuid, text, jsonb, bigint
) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.prepared_revoke_game_data_action(
  uuid, uuid, text, jsonb, bigint
) TO service_role;

DROP POLICY IF EXISTS "RBAC game actions select" ON public.game_data_actions;
CREATE POLICY "RBAC game actions select" ON public.game_data_actions FOR SELECT TO authenticated USING (
  created_by = (SELECT auth.uid()) OR is_public OR
  public.can_access_game_action((SELECT auth.uid()), 'game_data_action.approve', entity_type, entry) OR
  public.can_access_game_action((SELECT auth.uid()), 'game_data_action.reject', entity_type, entry) OR
  public.can_access_game_action((SELECT auth.uid()), 'game_data_action.mark_synced', entity_type, entry) OR
  public.can_access_game_action((SELECT auth.uid()), 'game_data_action.revoke', entity_type, entry)
);
