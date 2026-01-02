-- Comments RLS

ALTER TABLE comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE comments FORCE ROW LEVEL SECURITY;

-- Anonymous users can only see visible comments.
CREATE POLICY "Anonymous users can view visible comments"
ON public.comments FOR SELECT
TO anon
USING (status = 'visible');

-- Authenticated users can see:
-- - visible comments
-- - their own hidden comments
-- - all comments if Reviewer/Coordinator
CREATE POLICY "Authenticated users can view allowed comments"
ON public.comments FOR SELECT
TO authenticated
USING (
  status = 'visible'
  OR (status = 'hidden' AND author_id = auth.uid())
  OR get_user_role(auth.uid()) = ANY (ARRAY['Reviewer'::role_type, 'Coordinator'::role_type])
);

-- Allow all access for service_role, bypassing RLS
CREATE POLICY "Allow all access for service_role on comments"
ON public.comments FOR ALL
TO service_role
USING (true)
WITH CHECK (true);
