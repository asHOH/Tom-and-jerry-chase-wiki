-- Enable RLS
ALTER TABLE articles ENABLE ROW LEVEL SECURITY;
ALTER TABLE article_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- USERS RLS
-- 1. Users can only see their own row
CREATE POLICY "Users can view their own data"
ON public.users FOR SELECT
TO authenticated
USING (auth.uid() = id);

-- 2. Coordinators can see all users
CREATE POLICY "Coordinators can view all users"
ON public.users FOR SELECT
TO authenticated
USING (get_user_role(auth.uid()) = 'Coordinator');

-- ARTICLES RLS
-- 1. Anyone can see articles that have at least one approved version
CREATE POLICY "Public can view approved articles"
ON public.articles FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM article_versions
    WHERE article_versions.article_id = articles.id AND article_versions.status = 'approved'
  )
);

-- ARTICLE_VERSIONS RLS
-- 1. Anyone can see approved versions
CREATE POLICY "Public can view approved versions"
ON public.article_versions FOR SELECT
USING (status = 'approved');

-- 2. Contributors and Reviewers can see pending and rejected versions
CREATE POLICY "Contributors and reviewers can view pending and rejected versions"
ON public.article_versions FOR SELECT
TO authenticated
USING (
  get_user_role(auth.uid()) IN ('Contributor', 'Reviewer')
  AND status IN ('pending', 'rejected')
);

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