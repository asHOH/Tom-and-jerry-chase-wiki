ALTER TABLE public.game_data_actions FORCE ROW LEVEL SECURITY;

-- Anonymous users can only view public actions
CREATE POLICY "Anonymous can view public game data actions"
ON public.game_data_actions FOR SELECT
TO anon
USING (is_public = true);

-- Authenticated users can view:
-- - public actions
-- - their own actions
-- - all actions if reviewer/coordinator
CREATE POLICY "Authenticated can view relevant game data actions"
ON public.game_data_actions FOR SELECT
TO authenticated
USING (
  is_public = true
  OR created_by = (select auth.uid())
  OR get_user_role((select auth.uid())) IN ('Reviewer', 'Coordinator')
);

-- Reviewers and coordinators can moderate actions (via direct update if needed)
CREATE POLICY "Reviewers and coordinators can update game data actions"
ON public.game_data_actions FOR UPDATE
TO authenticated
USING (get_user_role((select auth.uid())) IN ('Reviewer', 'Coordinator'))
WITH CHECK (get_user_role((select auth.uid())) IN ('Reviewer', 'Coordinator'));

-- Allow all access for service_role, bypassing RLS
CREATE POLICY "Allow all access for service_role on game_data_actions"
ON public.game_data_actions FOR ALL
TO service_role
USING (true);
