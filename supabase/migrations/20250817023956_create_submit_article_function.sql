-- Supabase function to insert a new article version with a pending status
CREATE OR REPLACE FUNCTION submit_article(
  p_article_id uuid,
  p_title text,
  p_content text,
  p_category_id uuid,
  p_editor_id uuid
)
RETURNS void AS $$
DECLARE
  category_visibility version_status;
  editor_role role_type;
  new_status version_status;
BEGIN
  -- Get the role of the editor
  SELECT get_user_role(p_editor_id) INTO editor_role;

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

  -- Insert a new pending article version
  INSERT INTO article_versions (article_id, content, editor_id, status, preview_token, created_at)
  VALUES (
    p_article_id,
    p_content,
    p_editor_id,
    new_status, -- Use the determined status
    encode(gen_random_bytes(16), 'hex'), -- Generate a unique preview token
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
