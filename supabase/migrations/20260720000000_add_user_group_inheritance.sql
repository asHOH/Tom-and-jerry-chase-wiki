-- Add single-parent user-group inheritance after the legacy role contract is removed.

ALTER TABLE public.user_groups
  ADD COLUMN parent_group_id uuid REFERENCES public.user_groups(id) ON DELETE RESTRICT;

ALTER TABLE public.user_groups
  ADD CONSTRAINT user_groups_parent_not_self
  CHECK (parent_group_id IS DISTINCT FROM id);

CREATE INDEX user_groups_parent_group_idx
  ON public.user_groups (parent_group_id) WHERE parent_group_id IS NOT NULL;

UPDATE public.user_groups
SET parent_group_id = '00000000-0000-4000-8000-000000000001'
WHERE id = '00000000-0000-4000-8000-000000000002';

UPDATE public.user_groups
SET parent_group_id = '00000000-0000-4000-8000-000000000002'
WHERE id = '00000000-0000-4000-8000-000000000003';

-- Keep only direct grants. An inherited global grant covers every narrower grant;
-- an inherited resource-type grant covers grants for the same resource type.
WITH RECURSIVE ancestors AS (
  SELECT child.id AS group_id, child.parent_group_id AS ancestor_id
  FROM public.user_groups child
  WHERE child.parent_group_id IS NOT NULL
  UNION ALL
  SELECT ancestors.group_id, parent.parent_group_id
  FROM ancestors
  JOIN public.user_groups parent ON parent.id = ancestors.ancestor_id
  WHERE parent.parent_group_id IS NOT NULL
)
DELETE FROM public.group_permission_grants direct_grant
USING ancestors
JOIN public.group_permission_grants inherited_grant
  ON inherited_grant.group_id = ancestors.ancestor_id
WHERE direct_grant.group_id = ancestors.group_id
  AND direct_grant.permission_key = inherited_grant.permission_key
  AND (
    inherited_grant.scope = 'global'
    OR (
      direct_grant.scope <> 'global'
      AND inherited_grant.scope = 'resource_type'
      AND inherited_grant.resource_type = direct_grant.resource_type
    )
    OR (
      direct_grant.scope = 'resource'
      AND inherited_grant.scope = 'resource'
      AND inherited_grant.resource_type = direct_grant.resource_type
      AND inherited_grant.resource_id = direct_grant.resource_id
    )
  );

CREATE OR REPLACE FUNCTION public.user_has_permission(
  p_user_id uuid,
  p_permission_key text,
  p_resource_type text DEFAULT NULL,
  p_resource_id text DEFAULT NULL
) RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  WITH RECURSIVE effective_groups(group_id) AS (
    SELECT membership.group_id
    FROM public.user_group_memberships membership
    WHERE membership.user_id = p_user_id
    UNION
    SELECT child.parent_group_id
    FROM effective_groups current_group
    JOIN public.user_groups child ON child.id = current_group.group_id
    WHERE child.parent_group_id IS NOT NULL
  )
  SELECT EXISTS (
    SELECT 1
    FROM effective_groups
    JOIN public.group_permission_grants grant_row
      ON grant_row.group_id = effective_groups.group_id
    WHERE grant_row.permission_key = p_permission_key
      AND (
        grant_row.scope = 'global'
        OR (
          p_resource_type IS NOT NULL
          AND grant_row.scope = 'resource_type'
          AND grant_row.resource_type = p_resource_type
        )
        OR (
          p_resource_type IS NOT NULL
          AND p_resource_id IS NOT NULL
          AND grant_row.scope = 'resource'
          AND grant_row.resource_type = p_resource_type
          AND grant_row.resource_id = p_resource_id
        )
      )
  );
$$;

CREATE OR REPLACE FUNCTION public.get_my_permission_grants()
RETURNS TABLE(
  permission_key text,
  scope public.permission_scope,
  resource_type text,
  resource_id text
)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  WITH RECURSIVE effective_groups(group_id) AS (
    SELECT membership.group_id
    FROM public.user_group_memberships membership
    WHERE membership.user_id = auth.uid()
    UNION
    SELECT child.parent_group_id
    FROM effective_groups current_group
    JOIN public.user_groups child ON child.id = current_group.group_id
    WHERE child.parent_group_id IS NOT NULL
  )
  SELECT DISTINCT
    grant_row.permission_key,
    grant_row.scope,
    NULLIF(grant_row.resource_type, '*'),
    NULLIF(grant_row.resource_id, '*')
  FROM effective_groups
  JOIN public.group_permission_grants grant_row
    ON grant_row.group_id = effective_groups.group_id
  ORDER BY
    grant_row.permission_key,
    grant_row.scope,
    NULLIF(grant_row.resource_type, '*'),
    NULLIF(grant_row.resource_id, '*');
$$;

CREATE OR REPLACE FUNCTION public.set_group_parent(
  p_group_id uuid,
  p_parent_group_id uuid
) RETURNS void
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  IF NOT public.has_permission('group.manage') THEN
    RAISE EXCEPTION 'forbidden';
  END IF;

  LOCK TABLE public.user_groups IN SHARE ROW EXCLUSIVE MODE;

  IF NOT EXISTS (SELECT 1 FROM public.user_groups WHERE id = p_group_id) THEN
    RAISE EXCEPTION 'group_not_found';
  END IF;
  IF p_parent_group_id IS NOT NULL
    AND NOT EXISTS (SELECT 1 FROM public.user_groups WHERE id = p_parent_group_id) THEN
    RAISE EXCEPTION 'parent_group_not_found';
  END IF;
  IF p_parent_group_id = p_group_id THEN
    RAISE EXCEPTION 'group_inheritance_cycle';
  END IF;
  IF p_parent_group_id IS NOT NULL AND EXISTS (
    WITH RECURSIVE descendants(group_id) AS (
      SELECT p_group_id
      UNION
      SELECT child.id
      FROM descendants
      JOIN public.user_groups child ON child.parent_group_id = descendants.group_id
    )
    SELECT 1 FROM descendants WHERE group_id = p_parent_group_id
  ) THEN
    RAISE EXCEPTION 'group_inheritance_cycle';
  END IF;

  UPDATE public.user_groups
  SET parent_group_id = p_parent_group_id, updated_at = now()
  WHERE id = p_group_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.prune_redundant_group_grants(p_group_id uuid)
RETURNS void
LANGUAGE sql SECURITY DEFINER SET search_path = public
AS $$
  WITH RECURSIVE ancestors(group_id) AS (
    SELECT parent_group_id
    FROM public.user_groups
    WHERE id = p_group_id AND parent_group_id IS NOT NULL
    UNION
    SELECT parent.parent_group_id
    FROM ancestors
    JOIN public.user_groups parent ON parent.id = ancestors.group_id
    WHERE parent.parent_group_id IS NOT NULL
  )
  DELETE FROM public.group_permission_grants direct_grant
  USING ancestors
  JOIN public.group_permission_grants inherited_grant
    ON inherited_grant.group_id = ancestors.group_id
  WHERE direct_grant.group_id = p_group_id
    AND direct_grant.permission_key = inherited_grant.permission_key
    AND (
      inherited_grant.scope = 'global'
      OR (
        direct_grant.scope <> 'global'
        AND inherited_grant.scope = 'resource_type'
        AND inherited_grant.resource_type = direct_grant.resource_type
      )
      OR (
        direct_grant.scope = 'resource'
        AND inherited_grant.scope = 'resource'
        AND inherited_grant.resource_type = direct_grant.resource_type
        AND inherited_grant.resource_id = direct_grant.resource_id
      )
    );
$$;

CREATE OR REPLACE FUNCTION public.create_permission_group_v2(
  p_name text,
  p_description text,
  p_is_default boolean,
  p_grants jsonb,
  p_parent_group_id uuid
) RETURNS uuid
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE v_id uuid;
BEGIN
  LOCK TABLE public.user_groups IN SHARE ROW EXCLUSIVE MODE;
  v_id := public.create_permission_group(p_name, p_description, p_is_default, p_grants);
  PERFORM public.set_group_parent(v_id, p_parent_group_id);
  PERFORM public.prune_redundant_group_grants(v_id);
  RETURN v_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.save_permission_group_v2(
  p_group_id uuid,
  p_name text,
  p_description text,
  p_is_default boolean,
  p_grants jsonb,
  p_parent_group_id uuid
) RETURNS void
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  LOCK TABLE public.user_groups IN SHARE ROW EXCLUSIVE MODE;
  PERFORM public.update_permission_group(p_group_id, p_name, p_description, p_is_default);
  PERFORM public.set_group_parent(p_group_id, p_parent_group_id);
  PERFORM public.set_group_grants(p_group_id, p_grants);
  PERFORM public.prune_redundant_group_grants(p_group_id);
END;
$$;

CREATE OR REPLACE FUNCTION public.delete_permission_group(p_group_id uuid)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NOT public.has_permission('group.manage') THEN RAISE EXCEPTION 'forbidden'; END IF;
  IF p_group_id IN (
    '00000000-0000-4000-8000-000000000001'::uuid,
    '00000000-0000-4000-8000-000000000002'::uuid,
    '00000000-0000-4000-8000-000000000003'::uuid
  ) THEN
    RAISE EXCEPTION 'protected_group';
  END IF;
  IF EXISTS (SELECT 1 FROM public.user_groups WHERE id = p_group_id AND is_default) THEN
    RAISE EXCEPTION 'default_group';
  END IF;
  IF EXISTS (SELECT 1 FROM public.user_group_memberships WHERE group_id = p_group_id) THEN
    RAISE EXCEPTION 'group_not_empty';
  END IF;
  IF EXISTS (SELECT 1 FROM public.user_groups WHERE parent_group_id = p_group_id) THEN
    RAISE EXCEPTION 'group_has_children';
  END IF;
  DELETE FROM public.user_groups WHERE id = p_group_id;
  IF NOT FOUND THEN RAISE EXCEPTION 'group_not_found'; END IF;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.set_group_parent(uuid, uuid) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.prune_redundant_group_grants(uuid) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.create_permission_group_v2(text, text, boolean, jsonb, uuid)
  FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.save_permission_group_v2(uuid, text, text, boolean, jsonb, uuid)
  FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.create_permission_group_v2(text, text, boolean, jsonb, uuid)
  TO authenticated;
GRANT EXECUTE ON FUNCTION public.save_permission_group_v2(uuid, text, text, boolean, jsonb, uuid)
  TO authenticated;
