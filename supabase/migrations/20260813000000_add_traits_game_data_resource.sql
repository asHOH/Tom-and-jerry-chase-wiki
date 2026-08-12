CREATE OR REPLACE FUNCTION public.permission_resource_type_allowed(
  p_permission_key text, p_resource_type text
) RETURNS boolean LANGUAGE sql IMMUTABLE SET search_path = public AS $$
  SELECT CASE
    WHEN p_permission_key LIKE 'article.%' OR p_permission_key LIKE 'article_version.%'
      THEN p_resource_type IN ('articles', 'categories')
    WHEN p_permission_key LIKE 'comment.%' THEN p_resource_type IN (
      'comments/articles', 'comments/characters', 'comments/knowledge_cards',
      'comments/entities', 'comments/items', 'comments/buffs', 'comments/maps',
      'comments/fixtures', 'comments/modes', 'comments/achievements',
      'comments/special_skills', 'comments/list_pages'
    )
    WHEN p_permission_key LIKE 'category.%' THEN p_resource_type = 'categories'
    WHEN p_permission_key = 'relation.update' THEN p_resource_type = 'characters'
    WHEN p_permission_key LIKE 'game_data_action.%'
      THEN p_resource_type IN (
        'characters', 'cards', 'entities', 'items', 'buffs', 'maps', 'fixtures',
        'modes', 'achievements', 'specialSkills', 'traits'
      )
    ELSE false
  END;
$$;
