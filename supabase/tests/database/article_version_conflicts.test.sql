BEGIN;
CREATE EXTENSION IF NOT EXISTS pgtap WITH SCHEMA extensions;
SET search_path = public, extensions;
SELECT no_plan();

INSERT INTO auth.users(id) VALUES
  ('b1000000-0000-4000-8000-000000000001'),
  ('b1000000-0000-4000-8000-000000000002'),
  ('b1000000-0000-4000-8000-000000000003');
INSERT INTO public.users(id, username_hash, nickname, salt)
SELECT id, 'conflict-' || id::text, 'Conflict ' || id::text, 'salt'
FROM auth.users WHERE id::text LIKE 'b1000000-%';
INSERT INTO public.user_groups(id, name) VALUES
  ('b2000000-0000-4000-8000-000000000001', 'Conflict editors'),
  ('b2000000-0000-4000-8000-000000000002', 'Conflict moderator');
INSERT INTO public.user_group_memberships(user_id, group_id) VALUES
  ('b1000000-0000-4000-8000-000000000001', 'b2000000-0000-4000-8000-000000000001'),
  ('b1000000-0000-4000-8000-000000000002', 'b2000000-0000-4000-8000-000000000001'),
  ('b1000000-0000-4000-8000-000000000003', 'b2000000-0000-4000-8000-000000000002');
INSERT INTO public.group_permission_grants(group_id, permission_key, scope, resource_type, resource_id)
SELECT 'b2000000-0000-4000-8000-000000000001', permission, 'global', '*', '*'
FROM unnest(ARRAY['article.create', 'article.update_any']) AS permission;
INSERT INTO public.group_permission_grants(group_id, permission_key, scope, resource_type, resource_id)
VALUES ('b2000000-0000-4000-8000-000000000002', 'article_version.approve', 'global', '*', '*');
INSERT INTO public.categories(id, name, default_visibility)
VALUES ('b3000000-0000-4000-8000-000000000001', 'Conflict tests', 'pending');

CREATE FUNCTION pg_temp.submit_version(op integer, actor integer, article uuid, base uuid,
  pending uuid DEFAULT NULL, source uuid DEFAULT NULL)
RETURNS TABLE(article_id uuid, submitted_version_id uuid, submitted_status public.version_status, replayed boolean)
LANGUAGE sql AS $$
  SELECT * FROM public.prepared_article_submission_request(
    ('b4000000-0000-4000-8000-' || lpad(op::text,12,'0'))::uuid,
    ('b1000000-0000-4000-8000-' || lpad(actor::text,12,'0'))::uuid,
    repeat(md5(op::text),2), NULL, article, 'Version ' || op, '<p>Body ' || op || '</p>',
    'b3000000-0000-4000-8000-000000000001', NULL, 'Edit', base, pending, source
  );
$$;
CREATE FUNCTION pg_temp.approve(version uuid) RETURNS void LANGUAGE sql AS $$
  SELECT public.prepared_article_version_moderation(
    'b1000000-0000-4000-8000-000000000003', NULL, version, 'approve', NULL
  );
$$;

CREATE TEMP TABLE first_version AS SELECT * FROM pg_temp.submit_version(1,1,NULL,NULL);
SELECT lives_ok($$SELECT pg_temp.approve((SELECT submitted_version_id FROM first_version))$$,
  'a new unpublished article has a known null base and can be approved');
CREATE TEMP TABLE editor_one AS SELECT * FROM pg_temp.submit_version(2,1,
  (SELECT article_id FROM first_version), (SELECT submitted_version_id FROM first_version));
CREATE TEMP TABLE editor_two AS SELECT * FROM pg_temp.submit_version(3,2,
  (SELECT article_id FROM first_version), (SELECT submitted_version_id FROM first_version));
SELECT lives_ok($$SELECT pg_temp.approve((SELECT submitted_version_id FROM editor_one))$$,
  'first editor can publish from the current base');
SELECT throws_ok($$SELECT pg_temp.approve((SELECT submitted_version_id FROM editor_two))$$,
  'P0001', 'article_edit_conflict_outdated_base', 'publication after submission reports an outdated approval base');
SELECT is((SELECT status::text FROM public.article_versions WHERE id=(SELECT submitted_version_id FROM editor_two)),
  'pending', 'failed approval preserves the pending version');
SELECT is((SELECT current_version_id FROM public.articles WHERE id=(SELECT article_id FROM first_version)),
  (SELECT submitted_version_id FROM editor_one), 'failed approval preserves the publication');
SELECT throws_ok($$SELECT * FROM pg_temp.submit_version(4,1,
  (SELECT article_id FROM first_version), (SELECT submitted_version_id FROM first_version))$$,
  'P0001', 'article_edit_conflict', 'a stale save is rejected before writing');
SELECT is((SELECT count(*) FROM public.article_submission_requests WHERE operation_id='b4000000-0000-4000-8000-000000000004'),
  0::bigint, 'conflicts leave no completed receipt');
SELECT is((SELECT submitted_version_id FROM pg_temp.submit_version(2,1,
  (SELECT article_id FROM first_version), NULL)), (SELECT submitted_version_id FROM editor_one),
  'receipt replay wins over current freshness checks');

SELECT throws_ok($$SELECT * FROM pg_temp.submit_version(5,2,
  (SELECT article_id FROM first_version), (SELECT submitted_version_id FROM editor_one),
  (SELECT submitted_version_id FROM editor_two),
  (SELECT submitted_version_id FROM editor_two))$$,
  'P0001', 'article_edit_conflict', 'a pending source cannot silently change its original base');
CREATE TEMP TABLE reconciled AS SELECT * FROM pg_temp.submit_version(5,2,
  (SELECT article_id FROM first_version), (SELECT submitted_version_id FROM editor_one),
  (SELECT submitted_version_id FROM editor_two));
SELECT is((SELECT base_version_id FROM public.article_versions WHERE id=(SELECT submitted_version_id FROM reconciled)),
  (SELECT submitted_version_id FROM editor_one), 'explicit reconciliation records the reviewed base');
SELECT isnt((SELECT submitted_version_id FROM reconciled), (SELECT submitted_version_id FROM editor_two),
  'editing a pending submission creates a distinct immutable moderation target');
SELECT is((SELECT content FROM public.article_versions WHERE id=(SELECT submitted_version_id FROM editor_two)),
  '<p>Body 3</p>', 'replacing a pending submission preserves its original reviewed content');
SELECT throws_ok($$SELECT pg_temp.approve((SELECT submitted_version_id FROM editor_two))$$,
  'P0001', 'Article version not in pending status', 'a moderator cannot approve the superseded version');
SELECT throws_ok($$SELECT * FROM pg_temp.submit_version(6,2,
  (SELECT article_id FROM first_version), (SELECT submitted_version_id FROM editor_one),
  (SELECT submitted_version_id FROM editor_two))$$,
  'P0001', 'article_edit_conflict', 'competing pending replacement preserves the newer pending version');

CREATE TEMP TABLE unpublished AS SELECT * FROM pg_temp.submit_version(7,1,NULL,NULL);
UPDATE public.article_versions SET base_version_known=false WHERE id=(SELECT submitted_version_id FROM unpublished);
SELECT throws_ok($$SELECT pg_temp.approve((SELECT submitted_version_id FROM unpublished))$$,
  'P0001', 'article_edit_conflict_unknown_base', 'historical pending versions report an unknown approval base');
SELECT is((SELECT status::text FROM public.article_versions WHERE id=(SELECT submitted_version_id FROM unpublished)),
  'pending', 'unknown-base approval failure preserves the pending version');
SELECT is((SELECT current_version_id FROM public.articles WHERE id=(SELECT article_id FROM unpublished)),
  NULL::uuid, 'unknown-base approval failure leaves the article unpublished');
SELECT throws_ok($$SELECT * FROM pg_temp.submit_version(9,1,
  (SELECT article_id FROM unpublished), NULL, (SELECT submitted_version_id FROM unpublished),
  (SELECT submitted_version_id FROM unpublished))$$,
  'P0001', 'article_edit_conflict', 'editing historical pending work retains its unknown base');
SELECT lives_ok($$SELECT * FROM pg_temp.submit_version(9,1,
  (SELECT article_id FROM unpublished), NULL, (SELECT submitted_version_id FROM unpublished))$$,
  'explicit reconciliation also works for unpublished historical work');
SELECT is((SELECT editor_id FROM public.article_versions WHERE id=(SELECT submitted_version_id FROM unpublished)),
  'b1000000-0000-4000-8000-000000000001'::uuid, 'historical attribution remains intact');
SELECT ok(NOT has_function_privilege('authenticated',
  'public.prepared_article_submission_request(uuid,uuid,text,inet,uuid,text,text,uuid,text,text,uuid,uuid,uuid)', 'EXECUTE'),
  'freshness operations stay behind the service boundary');
SELECT is((SELECT count(*) FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace
  WHERE n.nspname='public' AND p.proname IN ('prepared_update_pending_article','update_pending_article')),
  0::bigint, 'the in-place pending mutation functions are retired');
SELECT ok(NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public'
  AND table_name='article_versions' AND column_name='draft_revision'), 'immutable versions need no in-place revision token');
SELECT * FROM finish();
ROLLBACK;
