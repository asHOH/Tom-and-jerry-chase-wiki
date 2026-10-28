BEGIN;
CREATE EXTENSION IF NOT EXISTS pgtap WITH SCHEMA extensions;
SET search_path = public, extensions;
SELECT no_plan();

INSERT INTO auth.users(id) VALUES
  ('a1000000-0000-4000-8000-000000000001'), ('a1000000-0000-4000-8000-000000000002');
INSERT INTO public.users(id, username_hash, nickname, salt) VALUES
  ('a1000000-0000-4000-8000-000000000001', 'article-request-1', 'Request one', 'salt'),
  ('a1000000-0000-4000-8000-000000000002', 'article-request-2', 'Request two', 'salt');
INSERT INTO public.user_groups(id, name) VALUES
  ('a2000000-0000-4000-8000-000000000001', 'Article request tests');
INSERT INTO public.user_group_memberships(user_id, group_id) VALUES
  ('a1000000-0000-4000-8000-000000000001', 'a2000000-0000-4000-8000-000000000001');
INSERT INTO public.group_permission_grants(group_id, permission_key, scope, resource_type, resource_id)
SELECT 'a2000000-0000-4000-8000-000000000001', permission, 'global', '*', '*'
FROM unnest(ARRAY['article.create', 'article.update_own']) AS permission;
INSERT INTO public.categories(id, name, default_visibility) VALUES
  ('a3000000-0000-4000-8000-000000000001', 'Article request tests', 'pending');

CREATE FUNCTION pg_temp.submit_request(op uuid, fingerprint text, actor uuid DEFAULT 'a1000000-0000-4000-8000-000000000001', article uuid DEFAULT NULL)
RETURNS TABLE(article_id uuid, submitted_version_id uuid, submitted_status public.version_status, replayed boolean)
LANGUAGE sql AS $$
  SELECT * FROM public.prepared_article_submission_request(
    op, actor, fingerprint, NULL, article, 'Title', '<p>Content</p>',
    'a3000000-0000-4000-8000-000000000001', NULL, 'Edit',
    (SELECT current_version_id FROM public.articles WHERE id = article),
    (SELECT id FROM public.article_versions WHERE article_id = article AND editor_id = actor AND status = 'pending' LIMIT 1),
    NULL
  );
$$;

CREATE TEMP TABLE first_receipt AS SELECT * FROM pg_temp.submit_request('a4000000-0000-4000-8000-000000000001', repeat('a',64));
SELECT is((SELECT count(*) FROM public.articles WHERE author_id='a1000000-0000-4000-8000-000000000001'), 1::bigint, 'creation writes one article');
SELECT results_eq(
  $$SELECT article_id, submitted_version_id, submitted_status FROM pg_temp.submit_request('a4000000-0000-4000-8000-000000000001', repeat('a',64))$$,
  $$SELECT article_id, submitted_version_id, submitted_status FROM first_receipt$$,
  'retry returns the original result'
);
SELECT is((SELECT count(*) FROM public.article_versions WHERE article_id=(SELECT article_id FROM first_receipt)), 1::bigint, 'retry writes no version');
SELECT throws_ok($$SELECT * FROM pg_temp.submit_request('a4000000-0000-4000-8000-000000000001', repeat('b',64))$$, 'P0001', 'idempotency_key_reused', 'changed request fingerprint is rejected');
SELECT throws_ok($$SELECT * FROM pg_temp.submit_request('a4000000-0000-4000-8000-000000000001', repeat('a',64), 'a1000000-0000-4000-8000-000000000002')$$, 'P0001', 'idempotency_key_reused', 'another actor cannot replay the receipt');

UPDATE public.article_versions SET status='approved' WHERE id=(SELECT submitted_version_id FROM first_receipt);
SELECT is((SELECT submitted_status::text FROM pg_temp.submit_request('a4000000-0000-4000-8000-000000000001',repeat('a',64))), 'pending', 'later moderation does not change the original receipt');
CREATE TEMP TABLE edit_receipt AS SELECT * FROM pg_temp.submit_request('a4000000-0000-4000-8000-000000000002', repeat('b',64), article => (SELECT article_id FROM first_receipt));
SELECT results_eq(
  $$SELECT article_id, submitted_version_id, submitted_status FROM pg_temp.submit_request('a4000000-0000-4000-8000-000000000002', repeat('b',64), article => (SELECT article_id FROM first_receipt))$$,
  $$SELECT article_id, submitted_version_id, submitted_status FROM edit_receipt$$,
  'edit retry returns the original version'
);
SELECT is((SELECT count(*) FROM public.article_versions WHERE article_id=(SELECT article_id FROM first_receipt)), 2::bigint, 'edit retry adds no version');
SELECT throws_ok($$SELECT * FROM pg_temp.submit_request('a4000000-0000-4000-8000-000000000003', repeat('c',64), article => 'a5000000-0000-4000-8000-000000000099')$$, 'P0001', 'Article not found', 'failed writes reject missing articles');
SELECT is((SELECT count(*) FROM public.article_submission_requests WHERE operation_id='a4000000-0000-4000-8000-000000000003'), 0::bigint, 'failed writes roll back the receipt');

SELECT ok(NOT has_table_privilege('authenticated','public.article_submission_requests','SELECT,INSERT,UPDATE,DELETE'), 'receipts stay private');
SELECT ok(has_table_privilege('service_role','public.article_submission_requests','SELECT') AND NOT has_table_privilege('service_role','public.article_submission_requests','INSERT,UPDATE,DELETE'), 'server can read receipts but only the RPC writes them');
SELECT ok(NOT has_function_privilege('service_role','public.prepared_submit_article(uuid,inet,uuid,text,text,uuid,text,text,uuid)','EXECUTE'), 'legacy creation cannot bypass the request receipt');
SELECT * FROM finish();
ROLLBACK;
