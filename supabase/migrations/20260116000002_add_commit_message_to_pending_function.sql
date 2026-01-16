-- Update get_pending_versions_for_moderation to include commit_message
DROP FUNCTION IF EXISTS public.get_pending_versions_for_moderation();

CREATE OR REPLACE FUNCTION public.get_pending_versions_for_moderation()
RETURNS TABLE (
    version_id uuid,
    article_id uuid,
    article_title text,
    content text,
    editor_id uuid,
    editor_nickname text,
    status public.version_status,
    created_at timestamptz,
    category_name text,
    preview_token text,
    commit_message text
) AS $$
DECLARE
    current_user_id uuid := auth.uid();
BEGIN
    -- Ensure user is authenticated
    IF current_user_id IS NULL THEN
        RAISE EXCEPTION 'Authentication required';
    END IF;

    -- Check if the requester has the right permissions (Contributors can see their own, Reviewers can see all)
    IF get_user_role(current_user_id) NOT IN ('Contributor', 'Reviewer', 'Coordinator') THEN
        RAISE EXCEPTION 'Insufficient permissions to view pending versions';
    END IF;

    RETURN QUERY
    SELECT
        av.id as version_id,
        av.article_id,
        a.title as article_title,
        av.content,
        av.editor_id,
        u.nickname as editor_nickname,
        av.status,
        av.created_at,
        c.name as category_name,
        av.preview_token,
        av.commit_message
    FROM public.article_versions av
    JOIN public.articles a ON av.article_id = a.id
    JOIN public.users u ON av.editor_id = u.id
    JOIN public.categories c ON a.category_id = c.id
    WHERE av.status IN ('pending', 'rejected')
      AND (
          -- Reviewers and Coordinators can see all pending/rejected versions
          get_user_role(current_user_id) IN ('Reviewer', 'Coordinator')
          -- Contributors can only see their own submissions
          OR av.editor_id = current_user_id
      )
    ORDER BY av.created_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;
