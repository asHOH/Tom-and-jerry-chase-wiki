-- Function to update a pending article version and its corresponding article details
CREATE OR REPLACE FUNCTION update_pending_article(
  p_version_id uuid,
  p_article_id uuid,
  p_title text,
  p_content text,
  p_category_id uuid,
  p_editor_id uuid,
  p_user_id uuid
)
RETURNS void AS $$
DECLARE
  target_version_status version_status;
  version_count integer;
  user_role role_type;
BEGIN
  -- Permission Check: User must be a Contributor, Reviewer, or Coordinator
  SELECT role INTO user_role FROM users WHERE id = p_user_id;
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
    editor_id = p_editor_id
  WHERE id = p_version_id;

  -- Update the parent article's title and category, leaving the original author unchanged
  UPDATE articles
  SET
    title = p_title,
    category_id = p_category_id
  WHERE id = p_article_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
