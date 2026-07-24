-- MediaWiki-style blocks for accounts, IP addresses, and CIDR ranges.

CREATE TABLE public.blocks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  target_type text NOT NULL CHECK (target_type IN ('account', 'ip', 'range')),
  target_user_id uuid REFERENCES public.users(id),
  target_cidr cidr,
  reason text NOT NULL CHECK (char_length(btrim(reason)) BETWEEN 1 AND 1000),
  created_by uuid NOT NULL REFERENCES public.users(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz,
  revoked_at timestamptz,
  revoked_by uuid REFERENCES public.users(id),
  is_autoblock boolean NOT NULL DEFAULT false,
  autoblock_enabled boolean NOT NULL DEFAULT false,
  parent_block_id uuid REFERENCES public.blocks(id) ON DELETE SET NULL,
  hard_block boolean NOT NULL DEFAULT false,
  CHECK (
    (target_type = 'account' AND target_user_id IS NOT NULL AND target_cidr IS NULL)
    OR
    (target_type IN ('ip', 'range') AND target_user_id IS NULL AND target_cidr IS NOT NULL)
  ),
  CHECK (expires_at IS NULL OR expires_at > created_at),
  CHECK ((is_autoblock AND parent_block_id IS NOT NULL) OR (NOT is_autoblock)),
  CHECK ((target_type = 'account' AND NOT hard_block) OR target_type <> 'account')
);

CREATE INDEX blocks_target_user_active_idx
  ON public.blocks (target_user_id, expires_at)
  WHERE revoked_at IS NULL AND target_type = 'account';
CREATE INDEX blocks_target_cidr_active_idx
  ON public.blocks USING gist (target_cidr inet_ops)
  WHERE revoked_at IS NULL AND target_type IN ('ip', 'range');
CREATE INDEX blocks_target_cidr_expiry_idx
  ON public.blocks (expires_at)
  WHERE revoked_at IS NULL AND target_type IN ('ip', 'range');
CREATE INDEX blocks_parent_idx ON public.blocks (parent_block_id);
CREATE INDEX blocks_created_at_idx ON public.blocks (created_at DESC);

CREATE TABLE public.block_restrictions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  block_id uuid NOT NULL REFERENCES public.blocks(id) ON DELETE CASCADE,
  action text NOT NULL CHECK (action IN ('edit', 'upload', 'create_account', 'email')),
  resource_type text,
  resource_id text,
  UNIQUE NULLS NOT DISTINCT (block_id, action, resource_type, resource_id),
  CHECK ((resource_type IS NULL) = (resource_id IS NULL)),
  CHECK (resource_type IS NULL OR char_length(btrim(resource_type)) BETWEEN 1 AND 100),
  CHECK (resource_id IS NULL OR char_length(btrim(resource_id)) BETWEEN 1 AND 200)
);

CREATE INDEX block_restrictions_lookup_idx
  ON public.block_restrictions (action, resource_type, resource_id, block_id);

CREATE TABLE public.block_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  block_id uuid REFERENCES public.blocks(id) ON DELETE SET NULL,
  event_type text NOT NULL CHECK (event_type IN ('create', 'modify', 'autoblock', 'unblock')),
  actor_id uuid REFERENCES public.users(id) ON DELETE SET NULL,
  reason text,
  snapshot jsonb NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX block_log_block_created_idx ON public.block_log (block_id, created_at DESC);
CREATE INDEX block_log_created_idx ON public.block_log (created_at DESC);

CREATE OR REPLACE FUNCTION public.reject_block_log_mutation()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  RAISE EXCEPTION 'block_log_is_immutable';
END;
$$;

CREATE TRIGGER block_log_immutable
  BEFORE UPDATE OR DELETE ON public.block_log
  FOR EACH ROW EXECUTE FUNCTION public.reject_block_log_mutation();

CREATE TABLE public.user_last_ips (
  user_id uuid PRIMARY KEY REFERENCES public.users(id) ON DELETE CASCADE,
  last_ip inet NOT NULL,
  last_seen_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.blocks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.blocks FORCE ROW LEVEL SECURITY;
ALTER TABLE public.block_restrictions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.block_restrictions FORCE ROW LEVEL SECURITY;
ALTER TABLE public.block_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.block_log FORCE ROW LEVEL SECURITY;
ALTER TABLE public.user_last_ips ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_last_ips FORCE ROW LEVEL SECURITY;

CREATE POLICY "service role can access blocks"
  ON public.blocks FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "service role can access block restrictions"
  ON public.block_restrictions FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "service role can access block log"
  ON public.block_log FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "service role can access user last ips"
  ON public.user_last_ips FOR ALL TO service_role USING (true) WITH CHECK (true);

REVOKE ALL ON TABLE public.blocks, public.block_restrictions, public.block_log, public.user_last_ips
FROM PUBLIC, anon, authenticated;

INSERT INTO public.permission_catalog (key, category, label_zh, global_only, sort_order)
VALUES
  ('block.view', '封禁', '查看封禁', true, 220),
  ('block.manage', '封禁', '管理封禁', true, 230)
ON CONFLICT (key) DO NOTHING;

INSERT INTO public.group_permission_grants
  (group_id, permission_key, scope, resource_type, resource_id)
VALUES
  ('00000000-0000-4000-8000-000000000003'::uuid, 'block.view', 'global', '*', '*'),
  ('00000000-0000-4000-8000-000000000003'::uuid, 'block.manage', 'global', '*', '*')
ON CONFLICT DO NOTHING;

CREATE OR REPLACE FUNCTION public.block_snapshot(p_block_id uuid)
RETURNS jsonb
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT jsonb_build_object(
    'id', b.id,
    'targetType', b.target_type,
    'targetUserId', b.target_user_id,
    'targetCidr', b.target_cidr::text,
    'reason', b.reason,
    'createdBy', b.created_by,
    'createdAt', b.created_at,
    'expiresAt', b.expires_at,
    'revokedAt', b.revoked_at,
    'revokedBy', b.revoked_by,
    'isAutoblock', b.is_autoblock,
    'autoblockEnabled', b.autoblock_enabled,
    'parentBlockId', b.parent_block_id,
    'hardBlock', b.hard_block,
    'restrictions', COALESCE((
      SELECT jsonb_agg(jsonb_build_object(
        'action', r.action,
        'resourceType', r.resource_type,
        'resourceId', r.resource_id
      ) ORDER BY r.action, r.resource_type, r.resource_id)
      FROM public.block_restrictions r WHERE r.block_id = b.id
    ), '[]'::jsonb)
  )
  FROM public.blocks b
  WHERE b.id = p_block_id;
$$;

CREATE OR REPLACE FUNCTION public.find_effective_block(
  p_user_id uuid DEFAULT NULL,
  p_ip inet DEFAULT NULL,
  p_action text DEFAULT NULL,
  p_resource_type text DEFAULT NULL,
  p_resource_id text DEFAULT NULL
)
RETURNS TABLE (
  id uuid,
  reason text,
  expires_at timestamptz,
  is_autoblock boolean,
  target_type text,
  hard_block boolean,
  parent_block_id uuid
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT b.id, b.reason, b.expires_at, b.is_autoblock, b.target_type,
    b.hard_block, b.parent_block_id
  FROM public.blocks b
  JOIN public.block_restrictions r ON r.block_id = b.id
  WHERE b.revoked_at IS NULL
    AND (b.expires_at IS NULL OR b.expires_at > now())
    AND r.action = p_action
    AND (
      r.resource_type IS NULL
      OR (r.resource_type = p_resource_type AND (
        r.resource_id IS NULL OR r.resource_id = p_resource_id
      ))
    )
    AND (
      (b.target_type = 'account' AND b.target_user_id = p_user_id)
      OR (
        b.target_type IN ('ip', 'range')
        AND p_ip IS NOT NULL
        AND p_ip <<= b.target_cidr
        AND (p_user_id IS NULL OR b.hard_block OR b.is_autoblock)
      )
    )
  ORDER BY b.is_autoblock DESC, b.created_at DESC
  LIMIT 1;
$$;

CREATE OR REPLACE FUNCTION public.record_user_last_ip(
  p_user_id uuid,
  p_ip inet
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF p_user_id IS NULL OR p_ip IS NULL THEN RETURN; END IF;
  INSERT INTO public.user_last_ips(user_id, last_ip, last_seen_at)
  VALUES (p_user_id, p_ip, now())
  ON CONFLICT (user_id) DO UPDATE SET last_ip = EXCLUDED.last_ip,
    last_seen_at = EXCLUDED.last_seen_at;
END;
$$;

CREATE OR REPLACE FUNCTION public.create_autoblock_for_request(
  p_user_id uuid,
  p_ip inet,
  p_action text
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  parent public.blocks%ROWTYPE;
  new_id uuid;
  expiry timestamptz;
BEGIN
  IF p_user_id IS NULL OR p_ip IS NULL THEN RETURN NULL; END IF;
  SELECT b.* INTO parent
  FROM public.blocks b
  JOIN public.block_restrictions r ON r.block_id = b.id
  WHERE b.target_type = 'account'
    AND b.target_user_id = p_user_id
    AND b.is_autoblock = false
    AND b.autoblock_enabled = true
    AND b.revoked_at IS NULL
    AND (b.expires_at IS NULL OR b.expires_at > now())
    AND r.action = p_action
  ORDER BY b.created_at DESC
  LIMIT 1;
  IF NOT FOUND THEN RETURN NULL; END IF;

  IF EXISTS (
    SELECT 1 FROM public.blocks b
    WHERE b.parent_block_id = parent.id
      AND b.target_cidr = set_masklen(p_ip, CASE WHEN family(p_ip) = 4 THEN 32 ELSE 128 END)::cidr
      AND b.revoked_at IS NULL
      AND (b.expires_at IS NULL OR b.expires_at > now())
  ) THEN
    RETURN NULL;
  END IF;

  expiry := CASE
    WHEN parent.expires_at IS NULL THEN now() + interval '24 hours'
    ELSE LEAST(parent.expires_at, now() + interval '24 hours')
  END;
  INSERT INTO public.blocks(
    target_type, target_cidr, reason, created_by, expires_at,
    is_autoblock, autoblock_enabled, parent_block_id, hard_block
  )
  VALUES (
    'ip', set_masklen(p_ip, CASE WHEN family(p_ip) = 4 THEN 32 ELSE 128 END)::cidr,
    parent.reason, parent.created_by, expiry, true, false, parent.id, true
  ) RETURNING id INTO new_id;

  INSERT INTO public.block_restrictions(block_id, action, resource_type, resource_id)
  SELECT new_id, action, resource_type, resource_id
  FROM public.block_restrictions WHERE block_id = parent.id;

  INSERT INTO public.block_log(block_id, event_type, actor_id, reason, snapshot)
  VALUES (new_id, 'autoblock', parent.created_by, '账号封禁触发自动 IP 封禁',
    public.block_snapshot(new_id));
  RETURN new_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.create_block(
  p_target_type text,
  p_target_user_id uuid,
  p_target_cidr cidr,
  p_reason text,
  p_expires_at timestamptz,
  p_hard_block boolean,
  p_autoblock boolean,
  p_restrictions jsonb
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_id uuid;
  v_ip inet;
  v_restriction jsonb;
  v_action text;
BEGIN
  IF NOT public.has_permission('block.manage') THEN RAISE EXCEPTION 'forbidden'; END IF;
  IF p_target_type NOT IN ('account', 'ip', 'range') THEN RAISE EXCEPTION 'invalid_target_type'; END IF;
  IF p_target_type = 'account' AND p_target_user_id IS NULL THEN RAISE EXCEPTION 'target_user_not_found'; END IF;
  IF p_target_type IN ('ip', 'range') AND p_target_cidr IS NULL THEN RAISE EXCEPTION 'invalid_target_cidr'; END IF;
  IF p_target_type = 'account' AND p_hard_block THEN RAISE EXCEPTION 'invalid_account_options'; END IF;
  IF jsonb_typeof(p_restrictions) <> 'array' OR jsonb_array_length(p_restrictions) = 0 THEN
    RAISE EXCEPTION 'restrictions_required';
  END IF;
  IF p_expires_at IS NOT NULL AND p_expires_at <= now() THEN RAISE EXCEPTION 'expiry_in_past'; END IF;

  INSERT INTO public.blocks(
    target_type, target_user_id, target_cidr, reason, created_by,
    expires_at, hard_block, is_autoblock, autoblock_enabled
  ) VALUES (
    p_target_type, p_target_user_id, p_target_cidr, btrim(p_reason), auth.uid(),
    p_expires_at, CASE WHEN p_target_type = 'account' THEN false ELSE p_hard_block END,
    false, CASE WHEN p_target_type = 'account' THEN p_autoblock ELSE false END
  ) RETURNING id INTO v_id;

  FOR v_restriction IN SELECT value FROM jsonb_array_elements(p_restrictions) LOOP
    IF v_restriction->>'action' NOT IN ('edit', 'upload', 'create_account', 'email') THEN
      RAISE EXCEPTION 'invalid_restriction';
    END IF;
    INSERT INTO public.block_restrictions(block_id, action, resource_type, resource_id)
    VALUES (
      v_id, v_restriction->>'action',
      NULLIF(v_restriction->>'resourceType', ''), NULLIF(v_restriction->>'resourceId', '')
    );
  END LOOP;

  INSERT INTO public.block_log(block_id, event_type, actor_id, reason, snapshot)
  VALUES (v_id, 'create', auth.uid(), p_reason, public.block_snapshot(v_id));

  IF p_target_type = 'account' AND p_autoblock THEN
    SELECT last_ip INTO v_ip FROM public.user_last_ips WHERE user_id = p_target_user_id;
    SELECT r.action INTO v_action
    FROM public.block_restrictions r
    WHERE r.block_id = v_id
    ORDER BY r.action
    LIMIT 1;
    IF v_ip IS NOT NULL AND v_action IS NOT NULL THEN
      PERFORM public.create_autoblock_for_request(p_target_user_id, v_ip, v_action);
    END IF;
  END IF;
  RETURN v_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.modify_block(
  p_block_id uuid,
  p_reason text,
  p_expires_at timestamptz,
  p_hard_block boolean,
  p_restrictions jsonb
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE v_restriction jsonb;
BEGIN
  IF NOT public.has_permission('block.manage') THEN RAISE EXCEPTION 'forbidden'; END IF;
  IF p_expires_at IS NOT NULL AND p_expires_at <= now() THEN RAISE EXCEPTION 'expiry_in_past'; END IF;
  UPDATE public.blocks SET reason = btrim(p_reason), expires_at = p_expires_at,
    hard_block = CASE WHEN target_type = 'account' THEN false ELSE p_hard_block END
  WHERE id = p_block_id AND revoked_at IS NULL;
  IF NOT FOUND THEN RAISE EXCEPTION 'block_not_found'; END IF;
  DELETE FROM public.block_restrictions WHERE block_id = p_block_id;
  FOR v_restriction IN SELECT value FROM jsonb_array_elements(p_restrictions) LOOP
    INSERT INTO public.block_restrictions(block_id, action, resource_type, resource_id)
    VALUES (
      p_block_id, v_restriction->>'action',
      NULLIF(v_restriction->>'resourceType', ''), NULLIF(v_restriction->>'resourceId', '')
    );
  END LOOP;
  INSERT INTO public.block_log(block_id, event_type, actor_id, reason, snapshot)
  VALUES (p_block_id, 'modify', auth.uid(), p_reason, public.block_snapshot(p_block_id));
END;
$$;

CREATE OR REPLACE FUNCTION public.unblock(
  p_block_id uuid,
  p_reason text
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE v_child uuid;
BEGIN
  IF NOT public.has_permission('block.manage') THEN RAISE EXCEPTION 'forbidden'; END IF;
  UPDATE public.blocks SET revoked_at = now(), revoked_by = auth.uid()
  WHERE id = p_block_id AND revoked_at IS NULL;
  IF NOT FOUND THEN RAISE EXCEPTION 'block_not_found'; END IF;
  INSERT INTO public.block_log(block_id, event_type, actor_id, reason, snapshot)
  VALUES (p_block_id, 'unblock', auth.uid(), p_reason, public.block_snapshot(p_block_id));
  FOR v_child IN SELECT id FROM public.blocks WHERE parent_block_id = p_block_id AND revoked_at IS NULL LOOP
    UPDATE public.blocks SET revoked_at = now(), revoked_by = auth.uid() WHERE id = v_child;
    INSERT INTO public.block_log(block_id, event_type, actor_id, reason, snapshot)
    VALUES (v_child, 'unblock', auth.uid(), '父封禁解除，自动封禁同步解除', public.block_snapshot(v_child));
  END LOOP;
END;
$$;

REVOKE ALL ON FUNCTION public.block_snapshot(uuid) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.find_effective_block(uuid, inet, text, text, text) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.record_user_last_ip(uuid, inet) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.create_autoblock_for_request(uuid, inet, text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.find_effective_block(uuid, inet, text, text, text) TO service_role;
GRANT EXECUTE ON FUNCTION public.record_user_last_ip(uuid, inet) TO service_role;
GRANT EXECUTE ON FUNCTION public.create_autoblock_for_request(uuid, inet, text) TO service_role;
GRANT EXECUTE ON FUNCTION public.create_block(text, uuid, cidr, text, timestamptz, boolean, boolean, jsonb) TO authenticated;
GRANT EXECUTE ON FUNCTION public.modify_block(uuid, text, timestamptz, boolean, jsonb) TO authenticated;
GRANT EXECUTE ON FUNCTION public.unblock(uuid, text) TO authenticated;
