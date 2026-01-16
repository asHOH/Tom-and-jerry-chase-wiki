-- Add commit_message column to article_versions
ALTER TABLE public.article_versions
ADD COLUMN IF NOT EXISTS commit_message text;

-- Drop old submit_article function to handle signature change
DROP FUNCTION IF EXISTS public.submit_article(uuid, text, text, uuid, uuid);

-- Recreate submit_article function with commit_message parameter
CREATE OR REPLACE FUNCTION submit_article(
  p_article_id uuid,
  p_title text,
  p_content text,
  p_category_id uuid,
  p_character_id uuid DEFAULT NULL,
  p_commit_message text DEFAULT NULL
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

  -- Insert a new article version with commit message
  INSERT INTO article_versions (article_id, content, editor_id, status, preview_token, commit_message, created_at)
  VALUES (
    p_article_id,
    p_content,
    current_user_id,
    new_status,
    encode(gen_random_bytes(16), 'hex'),
    p_commit_message,
    now()
  );

  -- Update the article's title, category, and character_id if provided
  UPDATE articles
  SET
    title = p_title,
    category_id = p_category_id,
    character_id = p_character_id
  WHERE id = p_article_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;
