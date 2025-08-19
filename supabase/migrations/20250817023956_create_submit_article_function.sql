-- Supabase function to insert a new article version with a pending status
create or replace function submit_article(
  p_article_id uuid,
  p_title text,
  p_content text,
  p_category_id uuid,
  p_editor_id uuid
) returns void as $$
declare
  category_visibility version_status;
begin
  -- Fetch the default_visibility of the selected category
  select default_visibility
  into category_visibility
  from categories
  where id = p_category_id;

  -- Insert a new pending article version
  insert into article_versions (article_id, content, editor_id, status, preview_token, created_at)
  values (
    p_article_id,
    p_content,
    p_editor_id,
    category_visibility,
    encode(gen_random_bytes(16), 'hex'), -- Generate a unique preview token
    now()
  );

  -- Update the article's title and category if provided
  update articles
  set title = coalesce(p_title, articles.title),
      category_id = coalesce(p_category_id, articles.category_id)
  where id = p_article_id;
end;
$$ language plpgsql security definer;
