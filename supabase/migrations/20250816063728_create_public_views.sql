
-- Create users_public_view
CREATE VIEW users_public_view AS
SELECT id, nickname
FROM users;

-- Create article_versions_public_view
CREATE VIEW article_versions_public_view AS
SELECT id, article_id, content, editor_id, status, created_at
FROM article_versions;
