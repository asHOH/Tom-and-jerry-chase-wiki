-- Contract phase. Apply manually only after every production instance runs the RBAC build.

DROP TRIGGER IF EXISTS sync_legacy_role_after_update ON public.users;
DROP FUNCTION IF EXISTS public.sync_legacy_role_membership();

DROP FUNCTION IF EXISTS public.approve_article_version(uuid, uuid);
DROP FUNCTION IF EXISTS public.reject_article_version(uuid, uuid);
DROP FUNCTION IF EXISTS public.revoke_article_version(uuid, uuid);
DROP FUNCTION IF EXISTS public.get_pending_versions_for_moderation(uuid);

ALTER TABLE public.user_groups DROP COLUMN legacy_role;
DROP FUNCTION IF EXISTS public.get_user_role(uuid);
ALTER TABLE public.users DROP COLUMN role;
DROP TYPE public.role_type;
