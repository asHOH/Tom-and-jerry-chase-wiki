-- Drop and recreate article_versions_public_view to include commit_message
DROP VIEW IF EXISTS article_versions_public_view;

CREATE VIEW article_versions_public_view
WITH (security_invoker = true)
AS
SELECT id, article_id, content, editor_id, status, created_at, commit_message
FROM article_versions;
