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
  pending uuid DEFAULT NULL, revision uuid DEFAULT NULL, source uuid DEFAULT NULL)
RETURNS TABLE(article_id uuid, submitted_version_id uuid, submitted_status public.version_status, replayed boolean)
LANGUAGE sql AS $$
  SELECT * FROM public.prepared_article_submission_request(
    ('b4000000-0000-4000-8000-' || lpad(op::text,12,'0'))::uuid,
    ('b1000000-0000-4000-8000-' || lpad(actor::text,12,'0'))::uuid,
    repeat(md5(op::text),2), NULL, article, 'Version ' || op, '<p>Body ' || op || '</p>',
    'b3000000-0000-4000-8000-000000000001', NULL, 'Edit', base, pending, revision, source
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
  'P0001', 'article_edit_conflict', 'publication after submission blocks stale approval');
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
  (SELECT draft_revision FROM public.article_versions WHERE id=(SELECT submitted_version_id FROM editor_two)),
  (SELECT submitted_version_id FROM editor_two))$$,
  'P0001', 'article_edit_conflict', 'a pending source cannot silently change its original base');
CREATE TEMP TABLE reconciled AS SELECT * FROM pg_temp.submit_version(5,2,
  (SELECT article_id FROM first_version), (SELECT submitted_version_id FROM editor_one),
  (SELECT submitted_version_id FROM editor_two),
  (SELECT draft_revision FROM public.article_versions WHERE id=(SELECT submitted_version_id FROM editor_two)));
SELECT is((SELECT base_version_id FROM public.article_versions WHERE id=(SELECT submitted_version_id FROM reconciled)),
  (SELECT submitted_version_id FROM editor_one), 'explicit reconciliation records the reviewed base');
SELECT throws_ok($$SELECT * FROM pg_temp.submit_version(6,2,
  (SELECT article_id FROM first_version), (SELECT submitted_version_id FROM editor_one),
  (SELECT submitted_version_id FROM editor_two),
  (SELECT draft_revision FROM public.article_versions WHERE id=(SELECT submitted_version_id FROM editor_two)))$$,
  'P0001', 'article_edit_conflict', 'competing pending replacement preserves the newer pending version');

CREATE TEMP TABLE unpublished AS SELECT * FROM pg_temp.submit_version(7,1,NULL,NULL);
CREATE TEMP TABLE original_revision AS SELECT draft_revision FROM public.article_versions
  WHERE id=(SELECT submitted_version_id FROM unpublished);
SELECT lives_ok($$SELECT public.prepared_update_pending_article(
  'b1000000-0000-4000-8000-000000000001', NULL,
  (SELECT submitted_version_id FROM unpublished), (SELECT article_id FROM unpublished),
  'Updated unpublished', '<p>Updated</p>', 'b3000000-0000-4000-8000-000000000001', NULL, true,
  NULL, (SELECT draft_revision FROM original_revision))$$,
  'pending edit accepts the exact revision of an unpublished article');
SELECT throws_ok($$SELECT public.prepared_update_pending_article(
  'b1000000-0000-4000-8000-000000000001', NULL,
  (SELECT submitted_version_id FROM unpublished), (SELECT article_id FROM unpublished),
  'Stale pending', '<p>Stale</p>', 'b3000000-0000-4000-8000-000000000001', NULL, true,
  NULL, (SELECT draft_revision FROM original_revision))$$,
  'P0001', 'article_edit_conflict', 'in-place pending edits reject an old revision');
SELECT is((SELECT proposed_title FROM public.article_versions WHERE id=(SELECT submitted_version_id FROM unpublished)),
  'Updated unpublished', 'rejected pending edits preserve current content');
SELECT throws_ok($$SELECT * FROM pg_temp.submit_version(8,1,
  (SELECT article_id FROM unpublished), NULL, (SELECT submitted_version_id FROM unpublished),
  (SELECT draft_revision FROM original_revision), (SELECT submitted_version_id FROM unpublished))$$,
  'P0001', 'article_edit_conflict', 'submission also detects an in-place pending change');

UPDATE public.article_versions SET base_version_known=false WHERE id=(SELECT submitted_version_id FROM unpublished);
SELECT throws_ok($$SELECT pg_temp.approve((SELECT submitted_version_id FROM unpublished))$$,
  'P0001', 'article_edit_conflict', 'historical pending versions with unknown bases require reconciliation');
SELECT throws_ok($$SELECT * FROM pg_temp.submit_version(9,1,
  (SELECT article_id FROM unpublished), NULL, (SELECT submitted_version_id FROM unpublished),
  (SELECT draft_revision FROM public.article_versions WHERE id=(SELECT submitted_version_id FROM unpublished)),
  (SELECT submitted_version_id FROM unpublished))$$,
  'P0001', 'article_edit_conflict', 'editing historical pending work retains its unknown base');
SELECT lives_ok($$SELECT * FROM pg_temp.submit_version(9,1,
  (SELECT article_id FROM unpublished), NULL, (SELECT submitted_version_id FROM unpublished),
  (SELECT draft_revision FROM public.article_versions WHERE id=(SELECT submitted_version_id FROM unpublished)))$$,
  'explicit reconciliation also works for unpublished historical work');
SELECT is((SELECT editor_id FROM public.article_versions WHERE id=(SELECT submitted_version_id FROM unpublished)),
  'b1000000-0000-4000-8000-000000000001'::uuid, 'historical attribution remains intact');
SELECT ok(NOT has_function_privilege('authenticated',
  'public.prepared_article_submission_request(uuid,uuid,text,inet,uuid,text,text,uuid,text,text,uuid,uuid,uuid,uuid)', 'EXECUTE'),
  'freshness operations stay behind the service boundary');
SELECT * FROM finish();
ROLLBACK;
