-- Close browser-callable mutation paths after the prepared application cutover.
-- Rejection remains on reject_game_data_action, which repeats its own permission check.

REVOKE ALL ON FUNCTION public.publish_game_data_actions(text, jsonb, text)
FROM PUBLIC, anon, authenticated;

REVOKE ALL ON FUNCTION public.approve_game_data_action(uuid)
FROM PUBLIC, anon, authenticated;

REVOKE UPDATE ON TABLE public.game_data_actions
FROM PUBLIC, anon, authenticated;

DROP POLICY IF EXISTS "RBAC game actions update" ON public.game_data_actions;
