-- Expand phase: add scoped RBAC while preserving the legacy role API.

CREATE TYPE public.permission_scope AS ENUM ('global', 'resource_type', 'resource');

CREATE TABLE public.permission_catalog (
  key text PRIMARY KEY,
  category text NOT NULL,
  label_zh text NOT NULL,
  global_only boolean NOT NULL DEFAULT false,
  sort_order integer NOT NULL DEFAULT 0
);

CREATE TABLE public.user_groups (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text NOT NULL DEFAULT '',
  is_default boolean NOT NULL DEFAULT false,
  legacy_role public.role_type UNIQUE,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT user_groups_name_length CHECK (char_length(btrim(name)) BETWEEN 1 AND 50),
  CONSTRAINT user_groups_description_length CHECK (char_length(description) <= 200)
);

CREATE UNIQUE INDEX user_groups_name_ci_unique ON public.user_groups (lower(btrim(name)));
CREATE UNIQUE INDEX user_groups_one_default ON public.user_groups (is_default) WHERE is_default;

CREATE TABLE public.group_permission_grants (
  group_id uuid NOT NULL REFERENCES public.user_groups(id) ON DELETE CASCADE,
  permission_key text NOT NULL REFERENCES public.permission_catalog(key) ON DELETE RESTRICT,
  scope public.permission_scope NOT NULL DEFAULT 'global',
  resource_type text,
  resource_id text,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (group_id, permission_key, scope, resource_type, resource_id),
  CONSTRAINT group_permission_grants_scope_shape CHECK (
    (scope = 'global' AND resource_type = '*' AND resource_id = '*') OR
    (scope = 'resource_type' AND resource_type <> '*' AND resource_id = '*') OR
    (scope = 'resource' AND resource_type <> '*' AND resource_id <> '*')
  )
);

CREATE INDEX group_permission_grants_lookup
  ON public.group_permission_grants (permission_key, resource_type, resource_id, group_id);

CREATE TABLE public.user_group_memberships (
  user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  group_id uuid NOT NULL REFERENCES public.user_groups(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, group_id)
);

CREATE INDEX user_group_memberships_group_idx ON public.user_group_memberships (group_id, user_id);

INSERT INTO public.permission_catalog (key, category, label_zh, global_only, sort_order) VALUES
  ('article.create', '文章', '创建文章', false, 10),
  ('article.update_own', '文章', '编辑自己的文章', false, 20),
  ('article.update_any', '文章', '编辑任意文章', false, 30),
  ('article_version.approve', '文章审核', '批准文章版本', false, 40),
  ('article_version.reject', '文章审核', '拒绝文章版本', false, 50),
  ('article_version.revoke', '文章审核', '撤销文章版本', false, 60),
  ('comment.create', '讨论', '发表评论', false, 70),
  ('comment.moderate', '讨论', '管理评论', false, 80),
  ('game_data_action.create', '游戏数据', '提交游戏数据改动', false, 90),
  ('game_data_action.approve', '游戏数据', '批准游戏数据改动', false, 100),
  ('game_data_action.reject', '游戏数据', '拒绝游戏数据改动', false, 110),
  ('game_data_action.mark_synced', '游戏数据', '标记改动已同步', false, 120),
  ('game_data_action.publish_relations', '游戏数据', '提交角色关系改动', false, 130),
  ('relation.update', '角色关系', '编辑角色关系', false, 140),
  ('category.create', '分类', '创建分类', false, 150),
  ('category.update', '分类', '编辑分类', false, 160),
  ('category.delete', '分类', '删除分类', false, 170),
  ('user.read', '用户', '查看用户', true, 180),
  ('user.update', '用户', '编辑用户', true, 190),
  ('group.manage', '权限组', '管理权限组', true, 200),
  ('group.assign', '权限组', '分配权限组', true, 210);

INSERT INTO public.user_groups (id, name, description, is_default, legacy_role) VALUES
  ('00000000-0000-4000-8000-000000000001', 'Contributor', '基础贡献者权限', true, 'Contributor'),
  ('00000000-0000-4000-8000-000000000002', 'Reviewer', '内容审核权限', false, 'Reviewer'),
  ('00000000-0000-4000-8000-000000000003', 'Coordinator', '完整协调管理权限', false, 'Coordinator');

WITH seeded(group_id, permission_key) AS (
  VALUES
    ('00000000-0000-4000-8000-000000000001'::uuid, 'article.create'),
    ('00000000-0000-4000-8000-000000000001'::uuid, 'article.update_own'),
    ('00000000-0000-4000-8000-000000000001'::uuid, 'comment.create'),
    ('00000000-0000-4000-8000-000000000001'::uuid, 'game_data_action.create'),
    ('00000000-0000-4000-8000-000000000001'::uuid, 'game_data_action.publish_relations'),
    ('00000000-0000-4000-8000-000000000001'::uuid, 'relation.update'),
    ('00000000-0000-4000-8000-000000000002'::uuid, 'article.create'),
    ('00000000-0000-4000-8000-000000000002'::uuid, 'article.update_own'),
    ('00000000-0000-4000-8000-000000000002'::uuid, 'article.update_any'),
    ('00000000-0000-4000-8000-000000000002'::uuid, 'article_version.approve'),
    ('00000000-0000-4000-8000-000000000002'::uuid, 'article_version.reject'),
    ('00000000-0000-4000-8000-000000000002'::uuid, 'article_version.revoke'),
    ('00000000-0000-4000-8000-000000000002'::uuid, 'comment.create'),
    ('00000000-0000-4000-8000-000000000002'::uuid, 'comment.moderate'),
    ('00000000-0000-4000-8000-000000000002'::uuid, 'game_data_action.create'),
    ('00000000-0000-4000-8000-000000000002'::uuid, 'game_data_action.approve'),
    ('00000000-0000-4000-8000-000000000002'::uuid, 'game_data_action.reject'),
    ('00000000-0000-4000-8000-000000000002'::uuid, 'game_data_action.publish_relations'),
    ('00000000-0000-4000-8000-000000000002'::uuid, 'relation.update'),
    ('00000000-0000-4000-8000-000000000002'::uuid, 'category.create'),
    ('00000000-0000-4000-8000-000000000002'::uuid, 'category.update'),
    ('00000000-0000-4000-8000-000000000002'::uuid, 'category.delete'),
    ('00000000-0000-4000-8000-000000000003'::uuid, 'article.create'),
    ('00000000-0000-4000-8000-000000000003'::uuid, 'article.update_own'),
    ('00000000-0000-4000-8000-000000000003'::uuid, 'article.update_any'),
    ('00000000-0000-4000-8000-000000000003'::uuid, 'article_version.approve'),
    ('00000000-0000-4000-8000-000000000003'::uuid, 'article_version.reject'),
    ('00000000-0000-4000-8000-000000000003'::uuid, 'article_version.revoke'),
    ('00000000-0000-4000-8000-000000000003'::uuid, 'comment.create'),
    ('00000000-0000-4000-8000-000000000003'::uuid, 'comment.moderate'),
    ('00000000-0000-4000-8000-000000000003'::uuid, 'game_data_action.create'),
    ('00000000-0000-4000-8000-000000000003'::uuid, 'game_data_action.approve'),
    ('00000000-0000-4000-8000-000000000003'::uuid, 'game_data_action.reject'),
    ('00000000-0000-4000-8000-000000000003'::uuid, 'game_data_action.mark_synced'),
    ('00000000-0000-4000-8000-000000000003'::uuid, 'game_data_action.publish_relations'),
    ('00000000-0000-4000-8000-000000000003'::uuid, 'relation.update'),
    ('00000000-0000-4000-8000-000000000003'::uuid, 'category.create'),
    ('00000000-0000-4000-8000-000000000003'::uuid, 'category.update'),
    ('00000000-0000-4000-8000-000000000003'::uuid, 'category.delete'),
    ('00000000-0000-4000-8000-000000000003'::uuid, 'user.read'),
    ('00000000-0000-4000-8000-000000000003'::uuid, 'user.update'),
    ('00000000-0000-4000-8000-000000000003'::uuid, 'group.manage'),
    ('00000000-0000-4000-8000-000000000003'::uuid, 'group.assign')
)
INSERT INTO public.group_permission_grants
  (group_id, permission_key, scope, resource_type, resource_id)
SELECT group_id, permission_key, 'global', '*', '*' FROM seeded;

INSERT INTO public.user_group_memberships (user_id, group_id)
SELECT u.id, g.id FROM public.users u JOIN public.user_groups g ON g.legacy_role = u.role;

CREATE OR REPLACE FUNCTION public.user_has_permission(
  p_user_id uuid,
  p_permission_key text,
  p_resource_type text DEFAULT NULL,
  p_resource_id text DEFAULT NULL
) RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_group_memberships m
    JOIN public.group_permission_grants g ON g.group_id = m.group_id
    WHERE m.user_id = p_user_id
      AND g.permission_key = p_permission_key
      AND (
        g.scope = 'global'
        OR (p_resource_type IS NOT NULL AND g.scope = 'resource_type' AND g.resource_type = p_resource_type)
        OR (p_resource_type IS NOT NULL AND p_resource_id IS NOT NULL
            AND g.scope = 'resource' AND g.resource_type = p_resource_type
            AND g.resource_id = p_resource_id)
      )
  );
$$;

CREATE OR REPLACE FUNCTION public.has_permission(
  p_permission_key text,
  p_resource_type text DEFAULT NULL,
  p_resource_id text DEFAULT NULL
) RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT public.user_has_permission(auth.uid(), p_permission_key, p_resource_type, p_resource_id);
$$;

CREATE OR REPLACE FUNCTION public.get_my_permission_grants()
RETURNS TABLE(permission_key text, scope public.permission_scope, resource_type text, resource_id text)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT DISTINCT g.permission_key, g.scope,
    NULLIF(g.resource_type, '*'), NULLIF(g.resource_id, '*')
  FROM public.user_group_memberships m
  JOIN public.group_permission_grants g ON g.group_id = m.group_id
  WHERE m.user_id = auth.uid()
  ORDER BY g.permission_key, g.scope, NULLIF(g.resource_type, '*'), NULLIF(g.resource_id, '*');
$$;

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
        'modes', 'achievements', 'specialSkills'
      )
    ELSE false
  END;
$$;

CREATE OR REPLACE FUNCTION public.assign_default_group_to_new_user()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.user_group_memberships(user_id, group_id)
  SELECT NEW.id, id FROM public.user_groups WHERE is_default
  ON CONFLICT DO NOTHING;
  RETURN NEW;
END;
$$;

CREATE TRIGGER assign_default_group_after_user_insert
AFTER INSERT ON public.users FOR EACH ROW EXECUTE FUNCTION public.assign_default_group_to_new_user();

CREATE OR REPLACE FUNCTION public.sync_legacy_role_membership()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  DELETE FROM public.user_group_memberships m
  USING public.user_groups g
  WHERE m.user_id = NEW.id AND m.group_id = g.id AND g.legacy_role IS NOT NULL;
  INSERT INTO public.user_group_memberships(user_id, group_id)
  SELECT NEW.id, id FROM public.user_groups WHERE legacy_role = NEW.role
  ON CONFLICT DO NOTHING;
  RETURN NEW;
END;
$$;

CREATE TRIGGER sync_legacy_role_after_update
AFTER UPDATE OF role ON public.users FOR EACH ROW
WHEN (OLD.role IS DISTINCT FROM NEW.role)
EXECUTE FUNCTION public.sync_legacy_role_membership();

CREATE OR REPLACE FUNCTION public.set_group_grants(p_group_id uuid, p_grants jsonb)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_grant jsonb;
BEGIN
  IF NOT public.has_permission('group.manage') THEN RAISE EXCEPTION 'forbidden'; END IF;
  IF jsonb_typeof(p_grants) <> 'array' THEN RAISE EXCEPTION 'invalid_grants'; END IF;
  DELETE FROM public.group_permission_grants WHERE group_id = p_group_id;
  FOR v_grant IN SELECT value FROM jsonb_array_elements(p_grants) LOOP
    IF NOT EXISTS (SELECT 1 FROM public.permission_catalog WHERE key = v_grant->>'permission') THEN
      RAISE EXCEPTION 'invalid_permission';
    END IF;
    IF EXISTS (
      SELECT 1 FROM public.permission_catalog
      WHERE key = v_grant->>'permission' AND global_only
        AND COALESCE(v_grant->>'scope', 'global') <> 'global'
    ) THEN RAISE EXCEPTION 'global_only_permission'; END IF;
    IF COALESCE(v_grant->>'scope', 'global') <> 'global' AND NOT public.permission_resource_type_allowed(
      v_grant->>'permission', v_grant->>'resourceType'
    ) THEN RAISE EXCEPTION 'invalid_resource_type'; END IF;
    INSERT INTO public.group_permission_grants
      (group_id, permission_key, scope, resource_type, resource_id)
    VALUES (
      p_group_id,
      v_grant->>'permission',
      COALESCE(v_grant->>'scope', 'global')::public.permission_scope,
      CASE WHEN COALESCE(v_grant->>'scope', 'global') = 'global' THEN '*' ELSE v_grant->>'resourceType' END,
      CASE WHEN COALESCE(v_grant->>'scope', 'global') IN ('global', 'resource_type') THEN '*' ELSE v_grant->>'resourceId' END
    ) ON CONFLICT DO NOTHING;
  END LOOP;
  DELETE FROM public.group_permission_grants scoped
  WHERE scoped.group_id = p_group_id AND scoped.scope <> 'global'
    AND EXISTS (SELECT 1 FROM public.group_permission_grants global_grant
      WHERE global_grant.group_id = scoped.group_id
        AND global_grant.permission_key = scoped.permission_key AND global_grant.scope = 'global');
  DELETE FROM public.group_permission_grants instance_grant
  WHERE instance_grant.group_id = p_group_id AND instance_grant.scope = 'resource'
    AND EXISTS (SELECT 1 FROM public.group_permission_grants type_grant
      WHERE type_grant.group_id = instance_grant.group_id
        AND type_grant.permission_key = instance_grant.permission_key
        AND type_grant.scope = 'resource_type'
        AND type_grant.resource_type = instance_grant.resource_type);
END;
$$;

CREATE OR REPLACE FUNCTION public.create_permission_group(
  p_name text, p_description text DEFAULT '', p_is_default boolean DEFAULT false, p_grants jsonb DEFAULT '[]'
) RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_id uuid;
BEGIN
  IF NOT public.has_permission('group.manage') THEN RAISE EXCEPTION 'forbidden'; END IF;
  IF char_length(btrim(p_name)) NOT BETWEEN 1 AND 50 OR char_length(COALESCE(p_description, '')) > 200 THEN
    RAISE EXCEPTION 'invalid_group';
  END IF;
  IF p_is_default THEN UPDATE public.user_groups SET is_default = false WHERE is_default; END IF;
  INSERT INTO public.user_groups(name, description, is_default)
  VALUES (btrim(p_name), COALESCE(p_description, ''), p_is_default) RETURNING id INTO v_id;
  PERFORM public.set_group_grants(v_id, p_grants);
  RETURN v_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.update_permission_group(
  p_group_id uuid, p_name text, p_description text, p_is_default boolean
) RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NOT public.has_permission('group.manage') THEN RAISE EXCEPTION 'forbidden'; END IF;
  IF char_length(btrim(p_name)) NOT BETWEEN 1 AND 50 OR char_length(COALESCE(p_description, '')) > 200 THEN
    RAISE EXCEPTION 'invalid_group';
  END IF;
  IF p_is_default THEN UPDATE public.user_groups SET is_default = false WHERE is_default; END IF;
  UPDATE public.user_groups SET name = btrim(p_name), description = COALESCE(p_description, ''),
    is_default = p_is_default, updated_at = now() WHERE id = p_group_id;
  IF NOT FOUND THEN RAISE EXCEPTION 'group_not_found'; END IF;
  IF NOT EXISTS (SELECT 1 FROM public.user_groups WHERE is_default) THEN RAISE EXCEPTION 'default_group_required'; END IF;
END;
$$;

CREATE OR REPLACE FUNCTION public.delete_permission_group(p_group_id uuid)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NOT public.has_permission('group.manage') THEN RAISE EXCEPTION 'forbidden'; END IF;
  IF EXISTS (SELECT 1 FROM public.user_groups WHERE id = p_group_id AND is_default) THEN RAISE EXCEPTION 'default_group'; END IF;
  IF EXISTS (SELECT 1 FROM public.user_groups WHERE id = p_group_id AND legacy_role IS NOT NULL) THEN RAISE EXCEPTION 'legacy_group'; END IF;
  IF EXISTS (SELECT 1 FROM public.user_group_memberships WHERE group_id = p_group_id) THEN RAISE EXCEPTION 'group_not_empty'; END IF;
  DELETE FROM public.user_groups WHERE id = p_group_id;
  IF NOT FOUND THEN RAISE EXCEPTION 'group_not_found'; END IF;
END;
$$;

CREATE OR REPLACE FUNCTION public.set_user_groups(p_user_id uuid, p_group_ids uuid[])
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NOT public.has_permission('group.assign') THEN RAISE EXCEPTION 'forbidden'; END IF;
  IF EXISTS (
    SELECT 1 FROM unnest(p_group_ids) AS requested(group_id)
    LEFT JOIN public.user_groups g ON g.id = requested.group_id WHERE g.id IS NULL
  ) THEN
    RAISE EXCEPTION 'group_not_found';
  END IF;
  DELETE FROM public.user_group_memberships WHERE user_id = p_user_id;
  INSERT INTO public.user_group_memberships(user_id, group_id)
  SELECT p_user_id, requested.group_id
  FROM unnest(p_group_ids) AS requested(group_id) ON CONFLICT DO NOTHING;
END;
$$;

CREATE OR REPLACE FUNCTION public.save_permission_group(
  p_group_id uuid, p_name text, p_description text, p_is_default boolean, p_grants jsonb
) RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NOT public.has_permission('group.manage') THEN RAISE EXCEPTION 'forbidden'; END IF;
  PERFORM public.update_permission_group(p_group_id, p_name, p_description, p_is_default);
  PERFORM public.set_group_grants(p_group_id, p_grants);
END;
$$;

ALTER TABLE public.permission_catalog ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.group_permission_grants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_group_memberships ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read permission catalog" ON public.permission_catalog
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can read group names" ON public.user_groups
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "Group administrators can read grants" ON public.group_permission_grants
  FOR SELECT TO authenticated USING (public.has_permission('group.manage') OR public.has_permission('group.assign'));
CREATE POLICY "Users can read own memberships" ON public.user_group_memberships
  FOR SELECT TO authenticated USING (
    user_id = (SELECT auth.uid()) OR public.has_permission('group.manage') OR public.has_permission('group.assign')
  );

REVOKE ALL ON public.permission_catalog, public.user_groups, public.group_permission_grants,
  public.user_group_memberships FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.user_has_permission(uuid, text, text, text) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.has_permission(text, text, text) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.get_my_permission_grants() FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.create_permission_group(text, text, boolean, jsonb) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.update_permission_group(uuid, text, text, boolean) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.delete_permission_group(uuid) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.set_group_grants(uuid, jsonb) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.set_user_groups(uuid, uuid[]) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.save_permission_group(uuid, text, text, boolean, jsonb) FROM PUBLIC, anon;
GRANT SELECT ON public.permission_catalog, public.user_groups TO authenticated;
GRANT SELECT ON public.group_permission_grants, public.user_group_memberships TO authenticated;
GRANT EXECUTE ON FUNCTION public.user_has_permission(uuid, text, text, text) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.has_permission(text, text, text) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.get_my_permission_grants() TO authenticated;
GRANT EXECUTE ON FUNCTION public.create_permission_group(text, text, boolean, jsonb) TO authenticated;
GRANT EXECUTE ON FUNCTION public.update_permission_group(uuid, text, text, boolean) TO authenticated;
GRANT EXECUTE ON FUNCTION public.delete_permission_group(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.set_group_grants(uuid, jsonb) TO authenticated;
GRANT EXECUTE ON FUNCTION public.set_user_groups(uuid, uuid[]) TO authenticated;
GRANT EXECUTE ON FUNCTION public.save_permission_group(uuid, text, text, boolean, jsonb) TO authenticated;

-- Replace current RLS gates while preserving existing table/query shapes.
DROP POLICY IF EXISTS "Authenticated users can view users" ON public.users;
DROP POLICY IF EXISTS "Coordinators have complete access to users" ON public.users;
DROP POLICY IF EXISTS "Coordinators can insert users" ON public.users;
DROP POLICY IF EXISTS "Coordinators can update users" ON public.users;
DROP POLICY IF EXISTS "Coordinators can delete users" ON public.users;
CREATE POLICY "RBAC users select" ON public.users FOR SELECT TO authenticated USING (
  id = (SELECT auth.uid()) OR public.has_permission('user.read') OR public.has_permission('group.assign')
);
CREATE POLICY "RBAC users update" ON public.users FOR UPDATE TO authenticated
  USING (public.has_permission('user.update')) WITH CHECK (public.has_permission('user.update'));

DROP POLICY IF EXISTS "Reviewers can update category default visibility" ON public.categories;
DROP POLICY IF EXISTS "Reviewers can insert categories" ON public.categories;
DROP POLICY IF EXISTS "Reviewers can update categories" ON public.categories;
DROP POLICY IF EXISTS "Reviewers can delete categories" ON public.categories;
CREATE POLICY "RBAC categories insert" ON public.categories FOR INSERT TO authenticated
  WITH CHECK (public.has_permission('category.create', 'categories', COALESCE(parent_category_id::text, id::text)));
CREATE POLICY "RBAC categories update" ON public.categories FOR UPDATE TO authenticated
  USING (public.has_permission('category.update', 'categories', id::text))
  WITH CHECK (public.has_permission('category.update', 'categories', id::text));
CREATE POLICY "RBAC categories delete" ON public.categories FOR DELETE TO authenticated
  USING (public.has_permission('category.delete', 'categories', id::text));

-- Old code still reads this function and column; permission-aware code no longer does.
COMMENT ON COLUMN public.users.role IS 'Deprecated compatibility field; remove in contract migration';
COMMENT ON FUNCTION public.get_user_role(uuid) IS 'Deprecated compatibility function; remove in contract migration';

-- Canonical root key used for scoped game-data grants.
CREATE OR REPLACE FUNCTION public.game_action_resource_id(p_entity_type text, p_entry jsonb)
RETURNS text LANGUAGE sql IMMUTABLE SET search_path = public AS $$
  SELECT CASE
    WHEN p_entity_type = 'specialSkills' AND jsonb_typeof(p_entry->'path') = 'array'
      THEN p_entry->'path'->>1
    WHEN p_entity_type = 'specialSkills' AND jsonb_typeof(p_entry->'path') = 'string'
      THEN split_part(p_entry->>'path', '.', 2)
    WHEN jsonb_typeof(p_entry->'path') = 'array' THEN p_entry->'path'->>0
    WHEN jsonb_typeof(p_entry->'path') = 'string' THEN split_part(p_entry->>'path', '.', 1)
    ELSE COALESCE(p_entry->>'id', p_entry->>'key')
  END;
$$;

CREATE OR REPLACE FUNCTION public.game_action_resource_ids(p_entity_type text, p_entry jsonb)
RETURNS SETOF text LANGUAGE plpgsql IMMUTABLE SET search_path = public AS $$
DECLARE v_child jsonb; v_id text;
BEGIN
  IF jsonb_typeof(p_entry) = 'array' THEN
    FOR v_child IN SELECT value FROM jsonb_array_elements(p_entry) LOOP
      RETURN QUERY SELECT public.game_action_resource_ids(p_entity_type, v_child);
    END LOOP;
    RETURN;
  END IF;
  v_id := public.game_action_resource_id(p_entity_type, p_entry);
  IF v_id IS NOT NULL AND v_id <> '' THEN RETURN NEXT v_id; END IF;
END;
$$;

CREATE OR REPLACE FUNCTION public.can_access_game_action(
  p_user_id uuid, p_permission_key text, p_entity_type text, p_entry jsonb
) RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT CASE WHEN EXISTS (
    SELECT 1 FROM public.game_action_resource_ids(p_entity_type, p_entry)
  ) THEN NOT EXISTS (
    SELECT 1 FROM public.game_action_resource_ids(p_entity_type, p_entry) AS resources(resource_id)
    WHERE NOT public.user_has_permission(
      p_user_id, p_permission_key, p_entity_type, resource_id
    )
  ) ELSE public.user_has_permission(p_user_id, p_permission_key, p_entity_type, NULL) END;
$$;

REVOKE EXECUTE ON FUNCTION public.can_access_game_action(uuid, text, text, jsonb) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.can_access_game_action(uuid, text, text, jsonb)
  TO authenticated, service_role;

CREATE OR REPLACE FUNCTION public.can_access_article(
  p_user_id uuid, p_permission_key text, p_article_id uuid, p_category_id uuid
) RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT public.user_has_permission(p_user_id, p_permission_key, 'articles', p_article_id::text)
    OR public.user_has_permission(p_user_id, p_permission_key, 'categories', p_category_id::text);
$$;

-- Keep cross-table lookups out of RLS policy expressions. These functions run as the
-- migration owner and therefore avoid recursive articles <-> article_versions policy evaluation.
CREATE OR REPLACE FUNCTION public.can_moderate_article(p_user_id uuid, p_article_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.articles a WHERE a.id = p_article_id AND (
      public.can_access_article(p_user_id, 'article_version.approve', a.id, a.category_id)
      OR public.can_access_article(p_user_id, 'article_version.reject', a.id, a.category_id)
      OR public.can_access_article(p_user_id, 'article_version.revoke', a.id, a.category_id)
    )
  );
$$;

CREATE OR REPLACE FUNCTION public.can_moderate_article_version(
  p_user_id uuid, p_article_id uuid, p_proposed_category_id uuid
) RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.articles a WHERE a.id = p_article_id AND (
      (
        public.can_access_article(p_user_id, 'article_version.approve', a.id, a.category_id)
        AND (
          p_proposed_category_id IS NULL OR p_proposed_category_id = a.category_id
          OR public.user_has_permission(
            p_user_id, 'article_version.approve', 'categories', p_proposed_category_id::text
          )
        )
      ) OR (
        public.can_access_article(p_user_id, 'article_version.reject', a.id, a.category_id)
        AND (
          p_proposed_category_id IS NULL OR p_proposed_category_id = a.category_id
          OR public.user_has_permission(
            p_user_id, 'article_version.reject', 'categories', p_proposed_category_id::text
          )
        )
      ) OR (
        public.can_access_article(p_user_id, 'article_version.revoke', a.id, a.category_id)
        AND (
          p_proposed_category_id IS NULL OR p_proposed_category_id = a.category_id
          OR public.user_has_permission(
            p_user_id, 'article_version.revoke', 'categories', p_proposed_category_id::text
          )
        )
      )
    )
  );
$$;

CREATE OR REPLACE FUNCTION public.can_view_article(p_user_id uuid, p_article_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.articles a WHERE a.id = p_article_id AND (
      EXISTS (
        SELECT 1 FROM public.article_versions av
        WHERE av.article_id = a.id AND av.status = 'approved'
      )
      OR public.can_access_article(p_user_id, 'article.update_any', a.id, a.category_id)
      OR (
        a.author_id = p_user_id
        AND public.can_access_article(p_user_id, 'article.update_own', a.id, a.category_id)
      )
      OR public.can_moderate_article(p_user_id, a.id)
    )
  );
$$;

REVOKE EXECUTE ON FUNCTION public.can_access_article(uuid, text, uuid, uuid) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.can_moderate_article(uuid, uuid) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.can_moderate_article_version(uuid, uuid, uuid) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.can_view_article(uuid, uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.can_access_article(uuid, text, uuid, uuid) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.can_moderate_article(uuid, uuid) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.can_moderate_article_version(uuid, uuid, uuid) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.can_view_article(uuid, uuid) TO authenticated, service_role;

CREATE OR REPLACE FUNCTION public.submit_article(
  p_article_id uuid,
  p_title text,
  p_content text,
  p_category_id uuid,
  p_character_id text DEFAULT NULL,
  p_commit_message text DEFAULT NULL
)
RETURNS TABLE (submitted_version_id uuid, submitted_status public.version_status) AS $$
DECLARE
  current_user_id uuid := auth.uid();
  category_visibility public.version_status;
  new_status public.version_status;
  article_author uuid;
  current_category_id uuid;
  v_anchor_time timestamptz;
  can_update_any boolean;
  can_update_own boolean;
  is_new_article boolean;
BEGIN
  IF current_user_id IS NULL THEN RAISE EXCEPTION 'Authentication required'; END IF;
  SELECT author_id, category_id INTO article_author, current_category_id
  FROM public.articles WHERE id = p_article_id;
  IF article_author IS NULL THEN RAISE EXCEPTION 'Article not found'; END IF;

  can_update_any := public.can_access_article(
    current_user_id, 'article.update_any', p_article_id, current_category_id
  );
  can_update_own := article_author = current_user_id AND public.can_access_article(
    current_user_id, 'article.update_own', p_article_id, current_category_id
  );
  SELECT NOT EXISTS (
    SELECT 1 FROM public.article_versions WHERE article_id = p_article_id
  ) INTO is_new_article;
  IF NOT can_update_any AND NOT can_update_own AND NOT (
    is_new_article AND article_author = current_user_id
    AND public.user_has_permission(current_user_id, 'article.create', 'categories', p_category_id::text)
  ) THEN RAISE EXCEPTION 'Forbidden'; END IF;
  IF p_category_id <> current_category_id AND NOT (
    public.user_has_permission(current_user_id, 'article.update_any', 'categories', p_category_id::text)
    OR (can_update_own AND public.user_has_permission(
      current_user_id, 'article.update_own', 'categories', p_category_id::text
    ))
  ) THEN RAISE EXCEPTION 'Forbidden'; END IF;

  SELECT default_visibility INTO category_visibility FROM public.categories WHERE id = p_category_id;
  IF NOT FOUND THEN RAISE EXCEPTION 'Category not found'; END IF;
  IF public.user_has_permission(
    current_user_id, 'article_version.approve', 'articles', p_article_id::text
  ) OR public.user_has_permission(
    current_user_id, 'article_version.approve', 'categories', p_category_id::text
  ) THEN new_status := 'approved';
  ELSE new_status := COALESCE(category_visibility, 'pending');
  END IF;

  IF new_status = 'pending' THEN
    SELECT created_at INTO v_anchor_time FROM public.article_versions
    WHERE article_id = p_article_id AND editor_id = current_user_id AND status = 'pending'
    ORDER BY created_at ASC LIMIT 1;
    UPDATE public.article_versions SET status = 'revoked'
    WHERE article_id = p_article_id AND editor_id = current_user_id AND status = 'pending';
  END IF;

  INSERT INTO public.article_versions (
    article_id, content, editor_id, status, preview_token, commit_message,
    proposed_title, proposed_category_id, proposed_character_id, created_at
  ) VALUES (
    p_article_id, p_content, current_user_id, new_status,
    encode(extensions.gen_random_bytes(16), 'hex'), p_commit_message,
    p_title, p_category_id, p_character_id, COALESCE(v_anchor_time, now())
  ) RETURNING article_versions.id, article_versions.status
    INTO submitted_version_id, submitted_status;

  IF new_status = 'approved' THEN
    UPDATE public.articles SET title = p_title, category_id = p_category_id,
      character_id = p_character_id WHERE id = p_article_id;
  END IF;
  RETURN NEXT;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, extensions, pg_temp;

CREATE OR REPLACE FUNCTION public.approve_article_version(p_version_id uuid)
RETURNS void AS $$
DECLARE
  v_uid uuid := auth.uid();
  v_status public.version_status;
  v_article_id uuid;
  v_current_category uuid;
  v_proposed_category uuid;
BEGIN
  SELECT av.status, av.article_id, a.category_id, COALESCE(av.proposed_category_id, a.category_id)
  INTO v_status, v_article_id, v_current_category, v_proposed_category
  FROM public.article_versions av JOIN public.articles a ON a.id = av.article_id
  WHERE av.id = p_version_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Article version not found'; END IF;
  IF v_status <> 'pending' THEN RAISE EXCEPTION 'Article version not in pending status'; END IF;
  IF NOT public.can_access_article(v_uid, 'article_version.approve', v_article_id, v_current_category)
  THEN RAISE EXCEPTION 'Insufficient permissions to approve article versions'; END IF;
  IF v_proposed_category <> v_current_category AND NOT public.user_has_permission(
    v_uid, 'article_version.approve', 'categories', v_proposed_category::text
  ) THEN RAISE EXCEPTION 'Insufficient permissions to approve article versions'; END IF;
  UPDATE public.article_versions SET status = 'approved' WHERE id = p_version_id;
  UPDATE public.articles a SET title = COALESCE(v.proposed_title, a.title),
    category_id = COALESCE(v.proposed_category_id, a.category_id),
    character_id = v.proposed_character_id
  FROM public.article_versions v WHERE v.id = p_version_id AND a.id = v.article_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, extensions, pg_temp;

CREATE OR REPLACE FUNCTION public.reject_article_version(p_version_id uuid)
RETURNS void AS $$
DECLARE
  v_uid uuid := auth.uid(); v_article uuid; v_category uuid; v_proposed_category uuid;
  v_status public.version_status;
BEGIN
  SELECT av.article_id, a.category_id, COALESCE(av.proposed_category_id, a.category_id), av.status
  INTO v_article, v_category, v_proposed_category, v_status
  FROM public.article_versions av JOIN public.articles a ON a.id = av.article_id
  WHERE av.id = p_version_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Article version not found'; END IF;
  IF v_status <> 'pending' THEN RAISE EXCEPTION 'Article version not in pending status'; END IF;
  IF NOT public.can_access_article(v_uid, 'article_version.reject', v_article, v_category)
  THEN RAISE EXCEPTION 'Insufficient permissions to reject article versions'; END IF;
  IF v_proposed_category <> v_category AND NOT public.user_has_permission(
    v_uid, 'article_version.reject', 'categories', v_proposed_category::text
  ) THEN RAISE EXCEPTION 'Insufficient permissions to reject article versions'; END IF;
  UPDATE public.article_versions SET status = 'rejected' WHERE id = p_version_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, extensions, pg_temp;

CREATE OR REPLACE FUNCTION public.revoke_article_version(p_version_id uuid)
RETURNS void AS $$
DECLARE v_uid uuid := auth.uid(); v_article uuid; v_category uuid;
BEGIN
  SELECT av.article_id, a.category_id INTO v_article, v_category
  FROM public.article_versions av JOIN public.articles a ON a.id = av.article_id
  WHERE av.id = p_version_id AND av.status = 'approved';
  IF NOT FOUND THEN RAISE EXCEPTION 'Article version not found or not in approved status'; END IF;
  IF NOT public.can_access_article(v_uid, 'article_version.revoke', v_article, v_category)
  THEN RAISE EXCEPTION 'Insufficient permissions to revoke article versions'; END IF;
  UPDATE public.article_versions SET status = 'revoked' WHERE id = p_version_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE OR REPLACE FUNCTION public.update_pending_article(
  p_version_id uuid, p_article_id uuid, p_title text, p_content text, p_category_id uuid
) RETURNS void AS $$
DECLARE
  v_uid uuid := auth.uid(); v_status public.version_status; v_count integer;
  v_author uuid; v_current_category uuid;
BEGIN
  SELECT author_id, category_id INTO v_author, v_current_category
  FROM public.articles WHERE id = p_article_id;
  IF NOT (
    public.can_access_article(v_uid, 'article.update_any', p_article_id, v_current_category)
    OR (v_author = v_uid AND public.can_access_article(
      v_uid, 'article.update_own', p_article_id, v_current_category
    ))
  ) THEN RAISE EXCEPTION 'Insufficient permissions'; END IF;
  IF p_category_id <> v_current_category AND NOT (
    public.user_has_permission(v_uid, 'article.update_any', 'categories', p_category_id::text)
    OR public.user_has_permission(v_uid, 'article.update_own', 'categories', p_category_id::text)
  ) THEN RAISE EXCEPTION 'Insufficient permissions'; END IF;
  SELECT count(*) INTO v_count FROM public.article_versions WHERE article_id = p_article_id;
  IF v_count > 1 THEN RAISE EXCEPTION 'Can only modify new article submissions, not modification requests for existing articles.'; END IF;
  SELECT status INTO v_status FROM public.article_versions WHERE id = p_version_id;
  IF NOT FOUND THEN RAISE EXCEPTION 'Article version not found'; END IF;
  IF v_status <> 'pending' THEN RAISE EXCEPTION 'Only pending articles can be modified'; END IF;
  UPDATE public.article_versions SET content = p_content, editor_id = v_uid,
    proposed_title = p_title, proposed_category_id = p_category_id WHERE id = p_version_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP FUNCTION IF EXISTS public.get_pending_versions_for_moderation();
CREATE FUNCTION public.get_pending_versions_for_moderation()
RETURNS TABLE (
  version_id uuid, article_id uuid, article_title text, category_name text,
  original_title text, proposed_title text, content text, editor_id uuid,
  editor_nickname text, status public.version_status, created_at timestamptz,
  original_category_name text, proposed_category_name text,
  original_character_id text, proposed_character_id text, preview_token text, commit_message text
) AS $$
DECLARE v_uid uuid := auth.uid();
BEGIN
  IF v_uid IS NULL THEN RAISE EXCEPTION 'Authentication required'; END IF;
  RETURN QUERY SELECT av.id, av.article_id, COALESCE(av.proposed_title, a.title),
    COALESCE(pc.name, oc.name), a.title, COALESCE(av.proposed_title, a.title), av.content,
    av.editor_id, u.nickname, av.status, av.created_at, oc.name, COALESCE(pc.name, oc.name),
    a.character_id, av.proposed_character_id, av.preview_token, av.commit_message
  FROM public.article_versions av
  JOIN public.articles a ON a.id = av.article_id JOIN public.users u ON u.id = av.editor_id
  LEFT JOIN public.categories oc ON oc.id = a.category_id
  LEFT JOIN public.categories pc ON pc.id = av.proposed_category_id
  WHERE av.status IN ('pending', 'rejected') AND (
    av.editor_id = v_uid
    OR public.can_moderate_article_version(v_uid, a.id, av.proposed_category_id)
  ) ORDER BY av.created_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, extensions, pg_temp;

-- Preserve the original moderation overloads for any old application instance still in flight.
CREATE OR REPLACE FUNCTION public.approve_article_version(
  p_version_id uuid, p_reviewer_id uuid
) RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF p_reviewer_id IS DISTINCT FROM auth.uid() THEN RAISE EXCEPTION 'Forbidden'; END IF;
  PERFORM public.approve_article_version(p_version_id);
END;
$$;

CREATE OR REPLACE FUNCTION public.reject_article_version(
  p_version_id uuid, p_reviewer_id uuid
) RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF p_reviewer_id IS DISTINCT FROM auth.uid() THEN RAISE EXCEPTION 'Forbidden'; END IF;
  PERFORM public.reject_article_version(p_version_id);
END;
$$;

CREATE OR REPLACE FUNCTION public.revoke_article_version(
  p_version_id uuid, p_reviewer_id uuid
) RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF p_reviewer_id IS DISTINCT FROM auth.uid() THEN RAISE EXCEPTION 'Forbidden'; END IF;
  PERFORM public.revoke_article_version(p_version_id);
END;
$$;

CREATE OR REPLACE FUNCTION public.get_pending_versions_for_moderation(p_requester_id uuid)
RETURNS TABLE (
  version_id uuid, article_id uuid, article_title text, content text, editor_id uuid,
  editor_nickname text, status public.version_status, created_at timestamptz,
  category_name text, preview_token text
) LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF p_requester_id IS DISTINCT FROM auth.uid() THEN RAISE EXCEPTION 'Forbidden'; END IF;
  RETURN QUERY SELECT av.id, av.article_id, COALESCE(av.proposed_title, a.title), av.content,
    av.editor_id, u.nickname, av.status, av.created_at, COALESCE(pc.name, oc.name), av.preview_token
  FROM public.article_versions av
  JOIN public.articles a ON a.id = av.article_id
  JOIN public.users u ON u.id = av.editor_id
  LEFT JOIN public.categories oc ON oc.id = a.category_id
  LEFT JOIN public.categories pc ON pc.id = av.proposed_category_id
  WHERE av.status IN ('pending', 'rejected') AND (
    av.editor_id = p_requester_id
    OR public.can_moderate_article_version(p_requester_id, a.id, av.proposed_category_id)
  ) ORDER BY av.created_at DESC;
END;
$$;

CREATE OR REPLACE FUNCTION public.create_category(
  _name text, _parent_category_id uuid DEFAULT NULL,
  _default_visibility public.version_status DEFAULT 'approved'
) RETURNS uuid AS $$
DECLARE v_id uuid;
BEGIN
  IF NOT public.has_permission('category.create', 'categories', COALESCE(_parent_category_id::text, '*'))
  THEN RAISE EXCEPTION 'Insufficient permissions to create categories'; END IF;
  INSERT INTO public.categories(name, parent_category_id, default_visibility)
  VALUES (_name, _parent_category_id, _default_visibility) RETURNING id INTO v_id;
  RETURN v_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE OR REPLACE FUNCTION public.update_category(
  _id uuid, _name text, _parent_category_id uuid DEFAULT NULL,
  _default_visibility public.version_status DEFAULT 'approved'
) RETURNS void AS $$
BEGIN
  IF NOT public.has_permission('category.update', 'categories', _id::text)
  THEN RAISE EXCEPTION 'Insufficient permissions to update categories'; END IF;
  IF _parent_category_id IS NOT NULL AND NOT public.has_permission(
    'category.update', 'categories', _parent_category_id::text
  ) THEN RAISE EXCEPTION 'Insufficient permissions to move categories'; END IF;
  UPDATE public.categories SET name = _name, parent_category_id = _parent_category_id,
    default_visibility = _default_visibility WHERE id = _id;
  IF NOT FOUND THEN RAISE EXCEPTION 'Category not found'; END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE OR REPLACE FUNCTION public.delete_category(_id uuid) RETURNS void AS $$
BEGIN
  IF NOT public.has_permission('category.delete', 'categories', _id::text)
  THEN RAISE EXCEPTION 'Insufficient permissions to delete categories'; END IF;
  DELETE FROM public.categories WHERE id = _id;
  IF NOT FOUND THEN RAISE EXCEPTION 'Category not found'; END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE OR REPLACE FUNCTION public.publish_game_data_actions(
  p_entity_type text, p_entries jsonb, p_message text DEFAULT NULL
) RETURNS TABLE(id uuid, is_public boolean, status public.game_data_action_status) AS $$
DECLARE
  v_uid uuid := auth.uid(); v_entry jsonb; v_auto boolean;
  v_status public.game_data_action_status; v_public boolean;
BEGIN
  IF v_uid IS NULL THEN RAISE EXCEPTION 'Authentication required'; END IF;
  IF p_entity_type IS NULL OR btrim(p_entity_type) = '' THEN RAISE EXCEPTION 'entity_type is required'; END IF;
  IF jsonb_typeof(p_entries) <> 'array' THEN RAISE EXCEPTION 'entries must be a jsonb array'; END IF;
  FOR v_entry IN SELECT value FROM jsonb_array_elements(p_entries) LOOP
    IF NOT public.can_access_game_action(
      v_uid, 'game_data_action.create', p_entity_type, v_entry
    ) AND NOT (
      p_entity_type = 'characters' AND public.can_access_game_action(
        v_uid, 'game_data_action.publish_relations', 'characters', v_entry
      )
    ) THEN RAISE EXCEPTION 'Insufficient permissions to publish actions'; END IF;
  END LOOP;
  SELECT COALESCE(bool_and(public.can_access_game_action(
    v_uid, 'game_data_action.approve', p_entity_type, value
  )), false) INTO v_auto FROM jsonb_array_elements(p_entries);
  v_status := CASE WHEN v_auto THEN 'approved' ELSE 'pending' END;
  v_public := v_auto;
  FOR v_entry IN SELECT value FROM jsonb_array_elements(p_entries) LOOP
    INSERT INTO public.game_data_actions(entity_type, entry, status, is_public, created_by,
      reviewed_by, reviewed_at, message)
    VALUES (p_entity_type, v_entry, v_status, v_public, v_uid,
      CASE WHEN v_auto THEN v_uid END, CASE WHEN v_auto THEN now() END, p_message)
    RETURNING game_data_actions.id, game_data_actions.is_public, game_data_actions.status
      INTO id, is_public, status;
    RETURN NEXT;
  END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE OR REPLACE FUNCTION public.approve_game_data_action(p_action_id uuid) RETURNS void AS $$
DECLARE v_uid uuid := auth.uid(); v_type text; v_entry jsonb;
BEGIN
  SELECT entity_type, entry INTO v_type, v_entry
  FROM public.game_data_actions WHERE id = p_action_id AND status = 'pending' FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Action not found or not in pending status'; END IF;
  IF NOT public.can_access_game_action(v_uid, 'game_data_action.approve', v_type, v_entry)
  THEN RAISE EXCEPTION 'Insufficient permissions to approve actions'; END IF;
  UPDATE public.game_data_actions SET status = 'approved', is_public = true,
    reviewed_by = v_uid, reviewed_at = now(), rejection_reason = NULL WHERE id = p_action_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE OR REPLACE FUNCTION public.reject_game_data_action(p_action_id uuid, p_reason text DEFAULT NULL)
RETURNS void AS $$
DECLARE v_uid uuid := auth.uid(); v_type text; v_entry jsonb;
BEGIN
  SELECT entity_type, entry INTO v_type, v_entry
  FROM public.game_data_actions WHERE id = p_action_id AND status = 'pending' FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Action not found or not in pending status'; END IF;
  IF NOT public.can_access_game_action(v_uid, 'game_data_action.reject', v_type, v_entry)
  THEN RAISE EXCEPTION 'Insufficient permissions to reject actions'; END IF;
  UPDATE public.game_data_actions SET status = 'rejected', is_public = false,
    reviewed_by = v_uid, reviewed_at = now(), rejection_reason = p_reason WHERE id = p_action_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE OR REPLACE FUNCTION public.get_pending_game_data_actions()
RETURNS TABLE (
  action_id uuid, entity_type text, entry jsonb, status public.game_data_action_status,
  is_public boolean, created_at timestamptz, created_by uuid, created_by_nickname text,
  reviewed_at timestamptz, reviewed_by uuid, reviewed_by_nickname text,
  rejection_reason text, message text
) AS $$
DECLARE v_uid uuid := auth.uid();
BEGIN
  RETURN QUERY SELECT a.id, a.entity_type, a.entry, a.status, a.is_public, a.created_at,
    a.created_by, u.nickname, a.reviewed_at, a.reviewed_by, ru.nickname,
    a.rejection_reason, a.message
  FROM public.game_data_actions a LEFT JOIN public.users u ON u.id = a.created_by
  LEFT JOIN public.users ru ON ru.id = a.reviewed_by
  WHERE a.status = 'pending' AND (
    public.can_access_game_action(v_uid, 'game_data_action.approve', a.entity_type, a.entry)
    OR public.can_access_game_action(v_uid, 'game_data_action.reject', a.entity_type, a.entry)
  ) ORDER BY a.created_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE OR REPLACE FUNCTION public.set_comment_status(
  p_comment_id uuid, p_status public.comment_status
) RETURNS void AS $$
DECLARE v_scope public.comment_scope; v_target text;
BEGIN
  SELECT scope, target_id INTO v_scope, v_target FROM public.comments WHERE id = p_comment_id;
  IF NOT FOUND THEN RAISE EXCEPTION 'comment_not_found'; END IF;
  IF NOT public.has_permission('comment.moderate', 'comments/' || v_scope::text, v_target)
  THEN RAISE EXCEPTION 'forbidden'; END IF;
  UPDATE public.comments SET status = p_status WHERE id = p_comment_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE OR REPLACE FUNCTION public.create_comment(
  p_scope public.comment_scope,
  p_target_id text,
  p_content text,
  p_parent_id uuid DEFAULT NULL,
  p_title text DEFAULT NULL
) RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_uid uuid := auth.uid(); v_new_id uuid; v_parent_scope public.comment_scope;
  v_parent_target_id text; v_parent_status public.comment_status;
BEGIN
  IF v_uid IS NULL THEN RAISE EXCEPTION 'unauthorized'; END IF;
  IF p_target_id IS NULL OR btrim(p_target_id) = '' THEN RAISE EXCEPTION 'target_id_empty'; END IF;
  IF NOT public.user_has_permission(v_uid, 'comment.create', 'comments/' || p_scope::text, p_target_id)
  THEN RAISE EXCEPTION 'forbidden'; END IF;
  p_content := btrim(p_content);
  IF char_length(p_content) < 1 THEN RAISE EXCEPTION 'content_empty'; END IF;
  IF char_length(p_content) > 2000 THEN RAISE EXCEPTION 'content_too_long'; END IF;
  IF p_parent_id IS NULL AND p_title IS NOT NULL THEN
    p_title := btrim(p_title);
    IF char_length(p_title) < 1 THEN RAISE EXCEPTION 'title_empty'; END IF;
    IF char_length(p_title) > 200 THEN RAISE EXCEPTION 'title_too_long'; END IF;
  END IF;
  IF p_parent_id IS NOT NULL AND p_title IS NOT NULL THEN RAISE EXCEPTION 'reply_with_title'; END IF;
  IF p_parent_id IS NOT NULL THEN
    SELECT scope, target_id, status INTO v_parent_scope, v_parent_target_id, v_parent_status
    FROM public.comments WHERE id = p_parent_id;
    IF NOT FOUND THEN RAISE EXCEPTION 'parent_not_found'; END IF;
    IF v_parent_scope <> p_scope OR v_parent_target_id <> p_target_id THEN RAISE EXCEPTION 'parent_mismatch'; END IF;
    IF v_parent_status = 'deleted' THEN RAISE EXCEPTION 'parent_deleted'; END IF;
  END IF;
  INSERT INTO public.comments(scope, target_id, parent_id, author_id, content, status, title)
  VALUES (p_scope, p_target_id, p_parent_id, v_uid, p_content, 'visible', p_title)
  RETURNING id INTO v_new_id;
  RETURN v_new_id;
END;
$$;

-- Replace remaining role-based policies with scoped permission checks.
DROP POLICY IF EXISTS "Reviewers can view all actions" ON public.game_data_actions;
DROP POLICY IF EXISTS "Reviewers can update actions" ON public.game_data_actions;
DROP POLICY IF EXISTS "Creators can view own actions" ON public.game_data_actions;
DROP POLICY IF EXISTS "Authenticated can view relevant game data actions" ON public.game_data_actions;
DROP POLICY IF EXISTS "Reviewers and coordinators can update game data actions" ON public.game_data_actions;
CREATE POLICY "RBAC game actions select" ON public.game_data_actions FOR SELECT TO authenticated USING (
  created_by = (SELECT auth.uid()) OR is_public OR
  public.can_access_game_action((SELECT auth.uid()), 'game_data_action.approve', entity_type, entry) OR
  public.can_access_game_action((SELECT auth.uid()), 'game_data_action.reject', entity_type, entry) OR
  public.can_access_game_action((SELECT auth.uid()), 'game_data_action.mark_synced', entity_type, entry)
);
CREATE POLICY "RBAC game actions update" ON public.game_data_actions FOR UPDATE TO authenticated USING (
  public.can_access_game_action((SELECT auth.uid()), 'game_data_action.approve', entity_type, entry) OR
  public.can_access_game_action((SELECT auth.uid()), 'game_data_action.reject', entity_type, entry) OR
  public.can_access_game_action((SELECT auth.uid()), 'game_data_action.mark_synced', entity_type, entry)
);

DROP POLICY IF EXISTS "Authenticated users can view versions" ON public.article_versions;
DROP POLICY IF EXISTS "Reviewers can insert versions" ON public.article_versions;
DROP POLICY IF EXISTS "Reviewers can update versions" ON public.article_versions;
DROP POLICY IF EXISTS "Reviewers can delete versions" ON public.article_versions;
DROP POLICY IF EXISTS "Reviewers and coordinators can update versions" ON public.article_versions;
CREATE POLICY "RBAC article versions select" ON public.article_versions FOR SELECT TO authenticated USING (
  status = 'approved' OR editor_id = (SELECT auth.uid())
  OR public.can_moderate_article_version((SELECT auth.uid()), article_id, proposed_category_id)
);

DROP POLICY IF EXISTS "Authenticated can view articles" ON public.articles;
DROP POLICY IF EXISTS "Reviewers and coordinators can delete articles" ON public.articles;
DROP POLICY IF EXISTS "Reviewers can insert articles" ON public.articles;
DROP POLICY IF EXISTS "Reviewers can update articles" ON public.articles;
DROP POLICY IF EXISTS "Reviewers can delete articles" ON public.articles;
CREATE POLICY "RBAC articles select" ON public.articles FOR SELECT TO authenticated USING (
  public.can_view_article((SELECT auth.uid()), id)
);
CREATE POLICY "RBAC articles insert" ON public.articles FOR INSERT TO authenticated WITH CHECK (
  public.has_permission('article.create', 'categories', category_id::text)
);
CREATE POLICY "RBAC articles update" ON public.articles FOR UPDATE TO authenticated USING (
  public.has_permission('article.update_any', 'articles', id::text)
  OR public.has_permission('article.update_any', 'categories', category_id::text)
  OR (author_id = (SELECT auth.uid()) AND (
    public.has_permission('article.update_own', 'articles', id::text)
    OR public.has_permission('article.update_own', 'categories', category_id::text)
  ))
);
CREATE POLICY "RBAC articles delete" ON public.articles FOR DELETE TO authenticated USING (
  public.has_permission('article.update_any', 'articles', id::text)
  OR public.has_permission('article.update_any', 'categories', category_id::text)
);

DROP POLICY IF EXISTS "Authenticated users can view allowed comments" ON public.comments;
CREATE POLICY "RBAC comments select" ON public.comments FOR SELECT TO authenticated USING (
  status = 'visible' OR author_id = (SELECT auth.uid())
  OR public.has_permission('comment.moderate', 'comments/' || scope::text, target_id)
);
