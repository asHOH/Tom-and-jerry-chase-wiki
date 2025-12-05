-- Categories
DROP POLICY IF EXISTS "Reviewers can update category default visibility" ON public.categories;
DROP POLICY IF EXISTS "Reviewers can insert categories" ON public.categories;
DROP POLICY IF EXISTS "Reviewers can update categories" ON public.categories;
DROP POLICY IF EXISTS "Reviewers can delete categories" ON public.categories;
CREATE POLICY "Reviewers can insert categories" ON public.categories FOR INSERT TO authenticated WITH CHECK (get_user_role(auth.uid()) = ANY (ARRAY['Reviewer'::role_type, 'Coordinator'::role_type]));
CREATE POLICY "Reviewers can update categories" ON public.categories FOR UPDATE TO authenticated USING (get_user_role(auth.uid()) = ANY (ARRAY['Reviewer'::role_type, 'Coordinator'::role_type]));
CREATE POLICY "Reviewers can delete categories" ON public.categories FOR DELETE TO authenticated USING (get_user_role(auth.uid()) = ANY (ARRAY['Reviewer'::role_type, 'Coordinator'::role_type]));

-- Users
DROP POLICY IF EXISTS "Coordinators have complete access to users" ON public.users;
DROP POLICY IF EXISTS "Coordinators can insert users" ON public.users;
DROP POLICY IF EXISTS "Coordinators can update users" ON public.users;
DROP POLICY IF EXISTS "Coordinators can delete users" ON public.users;
CREATE POLICY "Coordinators can insert users" ON public.users FOR INSERT TO authenticated WITH CHECK (get_user_role(auth.uid()) = 'Coordinator'::role_type);
CREATE POLICY "Coordinators can update users" ON public.users FOR UPDATE TO authenticated USING (get_user_role(auth.uid()) = 'Coordinator'::role_type);
CREATE POLICY "Coordinators can delete users" ON public.users FOR DELETE TO authenticated USING (get_user_role(auth.uid()) = 'Coordinator'::role_type);

-- Article Versions
DROP POLICY IF EXISTS "Reviewers and coordinators can update versions" ON public.article_versions;
DROP POLICY IF EXISTS "Reviewers can insert versions" ON public.article_versions;
DROP POLICY IF EXISTS "Reviewers can update versions" ON public.article_versions;
DROP POLICY IF EXISTS "Reviewers can delete versions" ON public.article_versions;
CREATE POLICY "Reviewers can insert versions" ON public.article_versions FOR INSERT TO authenticated WITH CHECK (get_user_role(auth.uid()) = ANY (ARRAY['Reviewer'::role_type, 'Coordinator'::role_type]));
CREATE POLICY "Reviewers can update versions" ON public.article_versions FOR UPDATE TO authenticated USING (get_user_role(auth.uid()) = ANY (ARRAY['Reviewer'::role_type, 'Coordinator'::role_type]));
CREATE POLICY "Reviewers can delete versions" ON public.article_versions FOR DELETE TO authenticated USING (get_user_role(auth.uid()) = ANY (ARRAY['Reviewer'::role_type, 'Coordinator'::role_type]));

-- Articles
DROP POLICY IF EXISTS "Public can view approved articles" ON public.articles;
DROP POLICY IF EXISTS "Reviewers and coordinators can delete articles" ON public.articles;
DROP POLICY IF EXISTS "Anon can view approved articles" ON public.articles;
DROP POLICY IF EXISTS "Authenticated can view articles" ON public.articles;
DROP POLICY IF EXISTS "Reviewers can insert articles" ON public.articles;
DROP POLICY IF EXISTS "Reviewers can update articles" ON public.articles;
DROP POLICY IF EXISTS "Reviewers can delete articles" ON public.articles;

CREATE POLICY "Anon can view approved articles" ON public.articles FOR SELECT TO anon USING (
  EXISTS ( SELECT 1 FROM article_versions WHERE article_versions.article_id = articles.id AND article_versions.status = 'approved'::version_status)
);

CREATE POLICY "Authenticated can view articles" ON public.articles FOR SELECT TO authenticated USING (
  (EXISTS ( SELECT 1 FROM article_versions WHERE article_versions.article_id = articles.id AND article_versions.status = 'approved'::version_status))
  OR
  (get_user_role(auth.uid()) = ANY (ARRAY['Reviewer'::role_type, 'Coordinator'::role_type]))
);

CREATE POLICY "Reviewers can insert articles" ON public.articles FOR INSERT TO authenticated WITH CHECK (get_user_role(auth.uid()) = ANY (ARRAY['Reviewer'::role_type, 'Coordinator'::role_type]));
CREATE POLICY "Reviewers can update articles" ON public.articles FOR UPDATE TO authenticated USING (get_user_role(auth.uid()) = ANY (ARRAY['Reviewer'::role_type, 'Coordinator'::role_type]));
CREATE POLICY "Reviewers can delete articles" ON public.articles FOR DELETE TO authenticated USING (get_user_role(auth.uid()) = ANY (ARRAY['Reviewer'::role_type, 'Coordinator'::role_type]));
