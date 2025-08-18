-- Function to approve a pending article version
CREATE OR REPLACE FUNCTION public.approve_article_version(version_id uuid, reviewer_id uuid)
RETURNS void AS $$
BEGIN
    -- Check if the reviewer has the right permissions
    IF get_user_role(reviewer_id) NOT IN ('Reviewer', 'Coordinator') THEN
        RAISE EXCEPTION 'Insufficient permissions to approve article versions';
    END IF;

    -- Update the version status to approved
    UPDATE public.article_versions
    SET status = 'approved'
    WHERE id = version_id AND status = 'pending';

    -- Check if any rows were updated
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Article version not found or not in pending status';
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Function to reject a pending article version
CREATE OR REPLACE FUNCTION public.reject_article_version(version_id uuid, reviewer_id uuid)
RETURNS void AS $$
BEGIN
    -- Check if the reviewer has the right permissions
    IF get_user_role(reviewer_id) NOT IN ('Reviewer', 'Coordinator') THEN
        RAISE EXCEPTION 'Insufficient permissions to reject article versions';
    END IF;

    -- Update the version status to rejected
    UPDATE public.article_versions
    SET status = 'rejected'
    WHERE id = version_id AND status = 'pending';

    -- Check if any rows were updated
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Article version not found or not in pending status';
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Function to revoke an approved article version, reverting to the previous approved version
CREATE OR REPLACE FUNCTION public.revoke_article_version(version_id uuid, reviewer_id uuid)
RETURNS void AS $$
DECLARE
    target_article_id uuid;
    previous_version_id uuid;
BEGIN
    -- Check if the reviewer has the right permissions
    IF get_user_role(reviewer_id) NOT IN ('Reviewer', 'Coordinator') THEN
        RAISE EXCEPTION 'Insufficient permissions to revoke article versions';
    END IF;

    -- Get the article_id of the version to revoke
    SELECT article_id INTO target_article_id
    FROM public.article_versions
    WHERE id = version_id AND status = 'approved';

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Article version not found or not in approved status';
    END IF;

    -- Find the previous approved version for this article (excluding the current one)
    SELECT id INTO previous_version_id
    FROM public.article_versions
    WHERE article_id = target_article_id 
      AND status = 'approved' 
      AND id != version_id
      AND created_at < (SELECT created_at FROM public.article_versions WHERE id = version_id)
    ORDER BY created_at DESC
    LIMIT 1;

    -- Mark the current version as revoked
    UPDATE public.article_versions
    SET status = 'revoked'
    WHERE id = version_id;

    -- If there's no previous version, this is acceptable (article will have no approved version)
    -- The front-end should handle this case appropriately
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Function to get pending article versions with full details for moderation
CREATE OR REPLACE FUNCTION public.get_pending_versions_for_moderation(requester_id uuid)
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
    preview_token text
) AS $$
BEGIN
    -- Check if the requester has the right permissions (Contributors can see their own, Reviewers can see all)
    IF get_user_role(requester_id) NOT IN ('Contributor', 'Reviewer', 'Coordinator') THEN
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
        av.preview_token
    FROM public.article_versions av
    JOIN public.articles a ON av.article_id = a.id
    JOIN public.users u ON av.editor_id = u.id
    JOIN public.categories c ON a.category_id = c.id
    WHERE av.status IN ('pending', 'rejected')
      AND (
        get_user_role(requester_id) IN ('Reviewer', 'Coordinator')
        OR av.editor_id = requester_id
      )
    ORDER BY av.created_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;
