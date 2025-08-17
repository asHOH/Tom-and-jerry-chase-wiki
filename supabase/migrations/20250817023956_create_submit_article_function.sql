-- Supabase function to insert a new article version with a pending status
create or replace function submit_article(
  article_id uuid,
  title text,
  content text,
  category_id uuid,
  editor_id uuid
) returns void as $$
begin
  -- Insert a new pending article version
  insert into article_versions (article_id, content, editor_id, status, preview_token, created_at)
  values (
    article_id,
    content,
    editor_id,
    'pending',
    encode(gen_random_bytes(16), 'hex'), -- Generate a unique preview token
    now()
  );

  -- Update the article's title and category if provided
  update articles
  set title = coalesce(title, articles.title),
      category_id = coalesce(category_id, articles.category_id)
  where id = article_id;
end;
$$ language plpgsql security definer;
