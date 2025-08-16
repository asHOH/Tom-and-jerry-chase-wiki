-- Enable RLS
ALTER TABLE articles ENABLE ROW LEVEL SECURITY;
ALTER TABLE article_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;

-- USERS RLS
-- FIX: Combined SELECT policies for `users` to fix `multiple_permissive_policies` and applied `auth_rls_initplan` fix.
CREATE POLICY "Authenticated users can view users"
ON public.users FOR SELECT
TO authenticated
USING (
    (select auth.uid()) = id OR get_user_role((select auth.uid())) = 'Coordinator'
);

-- FIX: The original `FOR ALL` policy was too broad. Scoped to UPDATE and applied `auth_rls_initplan` fix.
CREATE POLICY "Coordinators can update users"
ON public.users FOR UPDATE
TO authenticated
USING (get_user_role((select auth.uid())) = 'Coordinator')
WITH CHECK (get_user_role((select auth.uid())) = 'Coordinator');


-- ROLES RLS
CREATE POLICY "Public can view roles" ON public.roles FOR SELECT USING (TRUE);

-- CATEGORIES RLS
CREATE POLICY "Public can view categories" ON public.categories FOR SELECT USING (TRUE);

-- FIX: Applied `auth_rls_initplan` fix.
CREATE POLICY "Reviewers can update category default visibility"
ON public.categories FOR UPDATE
TO authenticated
USING (get_user_role((select auth.uid())) = 'Reviewer')
WITH CHECK (get_user_role((select auth.uid())) = 'Reviewer');

-- ARTICLES RLS
CREATE POLICY "Public can view approved articles"
ON public.articles FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM article_versions
    WHERE article_versions.article_id = articles.id AND article_versions.status = 'approved'
  )
);

-- FIX: Applied `auth_rls_initplan` fix.
CREATE POLICY "Reviewers and coordinators can delete articles"
ON public.articles FOR DELETE
TO authenticated
USING (get_user_role((select auth.uid())) IN ('Reviewer', 'Coordinator'));

-- ARTICLE_VERSIONS RLS
-- FIX: Replaced multiple SELECT policies with specific ones for anon and authenticated roles.
-- Policy for anonymous users.
CREATE POLICY "Anonymous users can view approved versions"
ON public.article_versions FOR SELECT
TO anon
USING (status = 'approved');

-- Policy for authenticated users.
CREATE POLICY "Authenticated users can view versions"
ON public.article_versions FOR SELECT
TO authenticated
USING (
    status = 'approved'
    OR (
        get_user_role((select auth.uid())) IN ('Contributor', 'Reviewer', 'Coordinator')
        AND status IN ('pending', 'rejected', 'revoked')
    )
);

-- FIX: Applied `auth_rls_initplan` fix.
CREATE POLICY "Reviewers and coordinators can update versions"
ON public.article_versions FOR UPDATE
TO authenticated
USING (get_user_role((select auth.uid())) IN ('Reviewer', 'Coordinator'))
WITH CHECK (get_user_role((select auth.uid())) IN ('Reviewer', 'Coordinator'));


-- Allow all access for service_role, bypassing RLS
ALTER TABLE users FORCE ROW LEVEL SECURITY;
CREATE POLICY "Allow all access for service_role on users"
ON public.users FOR ALL
TO service_role
USING (true);

ALTER TABLE articles FORCE ROW LEVEL SECURITY;
CREATE POLICY "Allow all access for service_role on articles"
ON public.articles FOR ALL
TO service_role
USING (true);

ALTER TABLE article_versions FORCE ROW LEVEL SECURITY;
CREATE POLICY "Allow all access for service_role on article_versions"
ON public.article_versions FOR ALL
TO service_role
USING (true);

ALTER TABLE roles FORCE ROW LEVEL SECURITY;
CREATE POLICY "Allow all access for service_role on roles"
ON public.roles FOR ALL
TO service_role
USING (true);

ALTER TABLE categories FORCE ROW LEVEL SECURITY;
CREATE POLICY "Allow all access for service_role on categories"
ON public.categories FOR ALL
TO service_role
USING (true);