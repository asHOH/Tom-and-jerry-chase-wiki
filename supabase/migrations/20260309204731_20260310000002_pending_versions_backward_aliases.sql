-- Follow-up for environments where 20260310000001 was already applied
-- before adding backward-compatible fields.
--
-- Recreate get_pending_versions_for_moderation with both:
-- 1) legacy aliases used by existing API/UI: article_title, category_name
-- 2) detailed metadata fields: original_*/proposed_*

DROP FUNCTION IF EXISTS public.get_pending_versions_for_moderation();

CREATE OR REPLACE FUNCTION public.get_pending_versions_for_moderation()
RETURNS TABLE (
    version_id uuid,
    article_id uuid,
    article_title text,
    category_name text,
    original_title text,
    proposed_title text,
    content text,
    editor_id uuid,
    editor_nickname text,
    status public.version_status,
    created_at timestamptz,
    original_category_name text,
    proposed_category_name text,
    original_character_id text,
    proposed_character_id text,
    preview_token text,
    commit_message text
) AS $$
DECLARE
    current_user_id uuid := auth.uid();
BEGIN
    IF current_user_id IS NULL THEN
        RAISE EXCEPTION 'Authentication required';
    END IF;

    IF public.get_user_role(current_user_id) NOT IN ('Contributor', 'Reviewer', 'Coordinator') THEN
        RAISE EXCEPTION 'Insufficient permissions to view pending versions';
    END IF;

    RETURN QUERY
    SELECT
        av.id as version_id,
        av.article_id,
        COALESCE(av.proposed_title, a.title) as article_title,
        COALESCE(pc.name, oc.name) as category_name,
        a.title as original_title,
        COALESCE(av.proposed_title, a.title) as proposed_title,
        av.content,
        av.editor_id,
        u.nickname as editor_nickname,
        av.status,
        av.created_at,
        oc.name as original_category_name,
        COALESCE(pc.name, oc.name) as proposed_category_name,
        a.character_id as original_character_id,
        av.proposed_character_id,
        av.preview_token,
        av.commit_message
    FROM public.article_versions av
    JOIN public.articles a ON av.article_id = a.id
    JOIN public.users u ON av.editor_id = u.id
    LEFT JOIN public.categories oc ON a.category_id = oc.id
    LEFT JOIN public.categories pc ON av.proposed_category_id = pc.id
    WHERE av.status IN ('pending', 'rejected')
      AND (
          public.get_user_role(current_user_id) IN ('Reviewer', 'Coordinator')
          OR av.editor_id = current_user_id
      )
    ORDER BY av.created_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, extensions, pg_temp;
