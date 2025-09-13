-- Implements Requirement #2: Previewing Changes
-- A security definer function that allows fetching a single article version by its preview token,
-- bypassing row-level security. This enables users to view pending changes without being logged in.
CREATE OR REPLACE FUNCTION public.get_article_version_by_preview(p_token text)
RETURNS SETOF public.article_versions AS $$
BEGIN
    RETURN QUERY
    SELECT *
    FROM public.article_versions
    WHERE preview_token = p_token;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;