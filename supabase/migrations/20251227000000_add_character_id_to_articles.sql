-- Add character_id column to articles table for game strategy articles
-- This field is nullable in the database but required for articles in the "角色攻略" category (or its subcategories)
ALTER TABLE articles ADD COLUMN character_id TEXT NULL;

-- Create index for character_id lookups
CREATE INDEX IF NOT EXISTS idx_articles_character_id ON articles (character_id) WHERE character_id IS NOT NULL;

-- Function to check if a category is "角色攻略" or a descendant of it
CREATE OR REPLACE FUNCTION is_game_strategy_category(p_category_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  current_id UUID := p_category_id;
  current_name TEXT;
BEGIN
  -- Traverse up the category hierarchy
  WHILE current_id IS NOT NULL LOOP
    SELECT name, parent_category_id INTO current_name, current_id
    FROM categories
    WHERE id = current_id;
    
    IF current_name = '角色攻略' THEN
      RETURN TRUE;
    END IF;
  END LOOP;
  
  RETURN FALSE;
END;
$$ LANGUAGE plpgsql STABLE;

-- Drop existing submit_article function and recreate with character_id support
DROP FUNCTION IF EXISTS submit_article(uuid, text, text, uuid, uuid);
DROP FUNCTION IF EXISTS submit_article(uuid, text, text, uuid);

CREATE OR REPLACE FUNCTION submit_article(
  p_article_id uuid,
  p_title text,
  p_content text,
  p_category_id uuid,
  p_character_id text DEFAULT NULL
)
RETURNS void AS $$
DECLARE
  category_visibility version_status;
  editor_role role_type;
  new_status version_status;
  v_editor_id uuid;
BEGIN
  -- Get the current user's ID
  v_editor_id := auth.uid();
  
  IF v_editor_id IS NULL THEN
    RAISE EXCEPTION 'User not authenticated';
  END IF;

  -- Get the role of the editor
  SELECT get_user_role(v_editor_id) INTO editor_role;

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
    v_editor_id,
    new_status,
    encode(gen_random_bytes(16), 'hex'),
    now()
  );

  -- Update the article's title, category, and character_id
  UPDATE articles
  SET
    title = p_title,
    category_id = p_category_id,
    character_id = p_character_id
  WHERE id = p_article_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public, pg_temp;
