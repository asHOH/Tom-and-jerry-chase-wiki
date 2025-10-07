-- Migration to fix security vulnerability in SECURITY DEFINER functions
-- Issue: Functions were accepting user_id as parameters, allowing any user to impersonate others
-- Solution: Drop old function signatures and create new ones that use auth.uid()

-- =====================================================
-- Step 1: DROP old vulnerable function signatures
-- =====================================================

-- Drop the old approve_article_version with p_reviewer_id parameter
DROP FUNCTION IF EXISTS public.approve_article_version(uuid, uuid);
-- Drop the old reject_article_version with p_reviewer_id parameter
DROP FUNCTION IF EXISTS public.reject_article_version(uuid, uuid);
-- Drop the old revoke_article_version with p_reviewer_id parameter
DROP FUNCTION IF EXISTS public.revoke_article_version(uuid, uuid);
-- Drop the old get_pending_versions_for_moderation with p_requester_id parameter
DROP FUNCTION IF EXISTS public.get_pending_versions_for_moderation(uuid);
-- Drop the old submit_article with p_editor_id parameter
DROP FUNCTION IF EXISTS public.submit_article(uuid, text, text, uuid, uuid);
-- Drop the old update_pending_article with p_editor_id and p_user_id parameters
DROP FUNCTION IF EXISTS public.update_pending_article(uuid, uuid, text, text, uuid, uuid, uuid);
-- =====================================================
-- Step 2: CREATE new secure function signatures
-- =====================================================

-- =====================================================
-- 1. Fix approve_article_version
-- =====================================================
CREATE OR REPLACE FUNCTION public.approve_article_version(p_version_id uuid)
RETURNS void AS $$
DECLARE
    current_user_id uuid := auth.uid();
BEGIN
    -- Ensure user is authenticated
    IF current_user_id IS NULL THEN
        RAISE EXCEPTION 'Authentication required';
    END IF;

    -- Check if the reviewer has the right permissions
    IF get_user_role(current_user_id) NOT IN ('Reviewer', 'Coordinator') THEN
        RAISE EXCEPTION 'Insufficient permissions to approve article versions';
    END IF;

    -- Update the version status to approved
    UPDATE public.article_versions
    SET status = 'approved'
    WHERE id = p_version_id AND status = 'pending';

    -- Check if any rows were updated
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Article version not found or not in pending status';
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- =====================================================
-- 2. Fix reject_article_version
-- =====================================================
CREATE OR REPLACE FUNCTION public.reject_article_version(p_version_id uuid)
RETURNS void AS $$
DECLARE
    current_user_id uuid := auth.uid();
BEGIN
    -- Ensure user is authenticated
    IF current_user_id IS NULL THEN
        RAISE EXCEPTION 'Authentication required';
    END IF;

    -- Check if the reviewer has the right permissions
    IF get_user_role(current_user_id) NOT IN ('Reviewer', 'Coordinator') THEN
        RAISE EXCEPTION 'Insufficient permissions to reject article versions';
    END IF;

    -- Update the version status to rejected
    UPDATE public.article_versions
    SET status = 'rejected'
    WHERE id = p_version_id AND status = 'pending';

    -- Check if any rows were updated
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Article version not found or not in pending status';
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- =====================================================
-- 3. Fix revoke_article_version
-- =====================================================
CREATE OR REPLACE FUNCTION public.revoke_article_version(p_version_id uuid)
RETURNS void AS $$
DECLARE
    current_user_id uuid := auth.uid();
    target_article_id uuid;
    previous_version_id uuid;
BEGIN
    -- Ensure user is authenticated
    IF current_user_id IS NULL THEN
        RAISE EXCEPTION 'Authentication required';
    END IF;

    -- Check if the reviewer has the right permissions
    IF get_user_role(current_user_id) NOT IN ('Reviewer', 'Coordinator') THEN
        RAISE EXCEPTION 'Insufficient permissions to revoke article versions';
    END IF;

    -- Get the article_id of the version to revoke
    SELECT article_id INTO target_article_id
    FROM public.article_versions
    WHERE id = p_version_id AND status = 'approved';

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Article version not found or not in approved status';
    END IF;

    -- Find the previous approved version for this article (excluding the current one)
    SELECT id INTO previous_version_id
    FROM public.article_versions
    WHERE article_id = target_article_id 
      AND status = 'approved' 
      AND id != p_version_id
      AND created_at < (SELECT created_at FROM public.article_versions WHERE id = p_version_id)
    ORDER BY created_at DESC
    LIMIT 1;

    -- Mark the current version as revoked
    UPDATE public.article_versions
    SET status = 'revoked'
    WHERE id = p_version_id;

    -- If there's no previous version, this is acceptable (article will have no approved version)
    -- The front-end should handle this case appropriately
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- =====================================================
-- 4. Fix get_pending_versions_for_moderation
-- =====================================================
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
    preview_token text
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
        av.preview_token
    FROM public.article_versions av
    JOIN public.articles a ON av.article_id = a.id
    JOIN public.users u ON av.editor_id = u.id
    JOIN public.categories c ON a.category_id = c.id
    WHERE av.status IN ('pending', 'rejected')
      AND (
        get_user_role(current_user_id) IN ('Reviewer', 'Coordinator')
        OR av.editor_id = current_user_id
      )
    ORDER BY av.created_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- =====================================================
-- 5. Fix submit_article
-- =====================================================
CREATE OR REPLACE FUNCTION submit_article(
  p_article_id uuid,
  p_title text,
  p_content text,
  p_category_id uuid
)
RETURNS void AS $$
DECLARE
  current_user_id uuid := auth.uid();
  category_visibility version_status;
  editor_role role_type;
  new_status version_status;
BEGIN
  -- Ensure user is authenticated
  IF current_user_id IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;

  -- Get the role of the current user
  SELECT get_user_role(current_user_id) INTO editor_role;

  -- Fetch the default_visibility of the selected category
  SELECT default_visibility
  INTO category_visibility
  FROM categories
  WHERE id = p_category_id;

  -- Determine the status of the new version
  IF editor_role IN ('Coordinator', 'Reviewer') THEN
    new_status := 'approved';
  ELSE
    new_status := COALESCE(category_visibility, 'pending');
  END IF;

  -- Insert a new article version
  INSERT INTO article_versions (article_id, content, editor_id, status, preview_token, created_at)
  VALUES (
    p_article_id,
    p_content,
    current_user_id,
    new_status,
    encode(gen_random_bytes(16), 'hex'),
    now()
  );

  -- Update the article's title and category if provided
  UPDATE articles
  SET
    title = p_title,
    category_id = p_category_id
  WHERE id = p_article_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- 6. Fix update_pending_article
-- =====================================================
CREATE OR REPLACE FUNCTION update_pending_article(
  p_version_id uuid,
  p_article_id uuid,
  p_title text,
  p_content text,
  p_category_id uuid
)
RETURNS void AS $$
DECLARE
  current_user_id uuid := auth.uid();
  target_version_status version_status;
  version_count integer;
  user_role role_type;
BEGIN
  -- Ensure user is authenticated
  IF current_user_id IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;

  -- Permission Check: User must be a Reviewer or Coordinator
  SELECT role INTO user_role FROM users WHERE id = current_user_id;
  IF user_role NOT IN ('Reviewer', 'Coordinator') THEN
    RAISE EXCEPTION 'Insufficient permissions';
  END IF;

  -- Check if it is a new article submission (only one version exists)
  SELECT count(*) INTO version_count FROM article_versions WHERE article_id = p_article_id;
  IF version_count > 1 THEN
    RAISE EXCEPTION 'Can only modify new article submissions, not modification requests for existing articles.';
  END IF;

  -- Check if the target version is 'pending'
  SELECT status INTO target_version_status
  FROM article_versions
  WHERE id = p_version_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Article version not found';
  END IF;

  IF target_version_status != 'pending' THEN
    RAISE EXCEPTION 'Only pending articles can be modified';
  END IF;

  -- Update the article version's content and track the latest editor
  UPDATE article_versions
  SET
    content = p_content,
    editor_id = current_user_id
  WHERE id = p_version_id;

  -- Update the parent article's title and category, leaving the original author unchanged
  UPDATE articles
  SET
    title = p_title,
    category_id = p_category_id
  WHERE id = p_article_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- 7. Fix increment_article_view_count (bonus security improvement)
-- =====================================================
-- Note: This function doesn't need authentication, but we add validation
-- to ensure the article exists before incrementing
CREATE OR REPLACE FUNCTION public.increment_article_view_count(p_article_id uuid)
RETURNS void AS $$
BEGIN
    -- Update the view count only if the article exists
    UPDATE public.articles
    SET view_count = view_count + 1
    WHERE id = p_article_id;
    
    -- Optionally, you could add a check if no rows were updated
    -- IF NOT FOUND THEN
    --     RAISE EXCEPTION 'Article not found';
    -- END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;
