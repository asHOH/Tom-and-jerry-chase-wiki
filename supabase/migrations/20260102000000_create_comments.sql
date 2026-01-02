-- Comments (multi-scope; articles supported first)

CREATE TYPE comment_scope AS ENUM ('articles', 'characters', 'knowledge_cards');
CREATE TYPE comment_status AS ENUM ('visible', 'hidden', 'deleted');

CREATE TABLE comments (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    scope comment_scope NOT NULL,
    target_id text NOT NULL,
    parent_id uuid REFERENCES comments(id) ON DELETE SET NULL,
    author_id uuid NOT NULL REFERENCES users(id),
    content text NOT NULL,
    status comment_status NOT NULL DEFAULT 'visible',
    created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX comments_scope_target_created_at_idx ON comments (scope, target_id, created_at);
CREATE INDEX comments_parent_id_idx ON comments (parent_id);
CREATE INDEX comments_author_created_at_idx ON comments (author_id, created_at);
