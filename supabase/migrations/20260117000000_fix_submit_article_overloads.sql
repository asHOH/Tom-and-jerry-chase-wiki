-- Fix duplicate/broken submit_article function overloads
-- Drop all existing overloads explicitly
DROP FUNCTION IF EXISTS public.submit_article();
DROP FUNCTION IF EXISTS public.submit_article(uuid, text, text, uuid);
DROP FUNCTION IF EXISTS public.submit_article(uuid, text, text, uuid, uuid);
DROP FUNCTION IF EXISTS public.submit_article(uuid, text, text, uuid, text);
DROP FUNCTION IF EXISTS public.submit_article(uuid, text, text, uuid, uuid, text);

-- Recreate the single correct version with all parameters
CREATE OR REPLACE FUNCTION public.submit_article(
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
  SELECT public.get_user_role(current_user_id) INTO editor_role;

  -- Fetch the default_visibility of the selected category
  SELECT default_visibility
  INTO category_visibility
  FROM public.categories
  WHERE id = p_category_id;

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

  -- Update the article's title, category, and character_id if provided
  UPDATE public.articles
  SET
    title = p_title,
    category_id = p_category_id,
    character_id = p_character_id
  WHERE id = p_article_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;
