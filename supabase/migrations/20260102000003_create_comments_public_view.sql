-- Create comments_public_view
CREATE VIEW comments_public_view
WITH (security_invoker = true)
AS
SELECT id, scope, target_id, parent_id, author_id, content, status, created_at
FROM comments;
