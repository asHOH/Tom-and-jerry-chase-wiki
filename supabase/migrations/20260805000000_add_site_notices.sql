CREATE TABLE public.site_notices (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  content_html text NOT NULL,
  is_published boolean NOT NULL DEFAULT true,
  starts_at timestamptz NOT NULL DEFAULT now(),
  ends_at timestamptz,
  created_by uuid NOT NULL REFERENCES public.users(id) ON DELETE RESTRICT,
  updated_by uuid NOT NULL REFERENCES public.users(id) ON DELETE RESTRICT,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT site_notices_title_length CHECK (char_length(title) BETWEEN 1 AND 120),
  CONSTRAINT site_notices_content_length CHECK (char_length(content_html) BETWEEN 1 AND 50000),
  CONSTRAINT site_notices_schedule CHECK (ends_at IS NULL OR ends_at > starts_at)
);

CREATE INDEX site_notices_public_order_idx
  ON public.site_notices (starts_at DESC, created_at DESC)
  WHERE is_published = true;

ALTER TABLE public.site_notices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.site_notices FORCE ROW LEVEL SECURITY;

CREATE POLICY "Public can read active site notices"
  ON public.site_notices FOR SELECT TO anon, authenticated
  USING (
    is_published = true
    AND starts_at <= now()
    AND (ends_at IS NULL OR ends_at > now())
  );

CREATE POLICY "Service role manages site notices"
  ON public.site_notices FOR ALL TO service_role
  USING (true) WITH CHECK (true);

REVOKE ALL ON public.site_notices FROM PUBLIC, anon, authenticated;
GRANT SELECT ON public.site_notices TO anon, authenticated;
GRANT ALL ON public.site_notices TO service_role;

INSERT INTO public.permission_catalog (key, category, label_zh, global_only, sort_order)
VALUES ('notice.manage', '公告', '管理站点公告', true, 240)
ON CONFLICT (key) DO NOTHING;

INSERT INTO public.group_permission_grants
  (group_id, permission_key, scope, resource_type, resource_id)
SELECT id, 'notice.manage', 'global', '*', '*'
FROM public.user_groups
WHERE id IN (
  '00000000-0000-4000-8000-000000000002'::uuid,
  '00000000-0000-4000-8000-000000000003'::uuid
)
ON CONFLICT DO NOTHING;
