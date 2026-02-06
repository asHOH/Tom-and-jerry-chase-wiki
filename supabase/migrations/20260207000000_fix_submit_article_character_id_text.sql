-- Ensure submit_article accepts text character IDs to match article.character_id column and game data keys
-- Drop all existing overloads to avoid conflicts
DROP FUNCTION IF EXISTS public.submit_article();
DROP FUNCTION IF EXISTS public.submit_article(uuid, text, text, uuid);
DROP FUNCTION IF EXISTS public.submit_article(uuid, text, text, uuid, uuid);
DROP FUNCTION IF EXISTS public.submit_article(uuid, text, text, uuid, text);
DROP FUNCTION IF EXISTS public.submit_article(uuid, text, text, uuid, uuid, text);

-- Recreate the function with text-based character_id and commit message support
CREATE OR REPLACE FUNCTION public.submit_article(
  p_article_id uuid,
  p_title text,
  p_content text,
  p_category_id uuid,
  p_character_id text DEFAULT NULL,
  p_commit_message text DEFAULT NULL
)
RETURNS void AS $$
DECLARE
  current_user_id uuid := auth.uid();
  category_visibility version_status;
  editor_role role_type;
  new_status version_status;
  article_author uuid;
BEGIN
  -- Ensure user is authenticated
  IF current_user_id IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;

  -- Get the role of the current user
  SELECT public.get_user_role(current_user_id) INTO editor_role;

  -- Ensure the article exists and the caller is allowed to edit it
  SELECT author_id INTO article_author FROM public.articles WHERE id = p_article_id;

  IF article_author IS NULL THEN
    RAISE EXCEPTION 'Article not found';
  END IF;

  IF article_author <> current_user_id AND editor_role NOT IN ('Coordinator', 'Reviewer') THEN
    RAISE EXCEPTION 'Forbidden';
  END IF;

  -- Fetch the default_visibility of the selected category
  SELECT default_visibility
  INTO category_visibility
  FROM public.categories
  WHERE id = p_category_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Category not found';
  END IF;

  -- Determine the status of the new version
  IF editor_role IN ('Coordinator', 'Reviewer') THEN
    new_status := 'approved';
  ELSE
    new_status := COALESCE(category_visibility, 'pending');
  END IF;

  -- Insert a new article version with commit message
  INSERT INTO public.article_versions (article_id, content, editor_id, status, preview_token, commit_message, created_at)
  VALUES (
    p_article_id,
    p_content,
    current_user_id,
    new_status,
    encode(extensions.gen_random_bytes(16), 'hex'),
    p_commit_message,
    now()
  );

  -- Update the article's title, category, and character_id
  UPDATE public.articles
  SET
    title = p_title,
    category_id = p_category_id,
    character_id = p_character_id
  WHERE id = p_article_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, extensions, pg_temp;
