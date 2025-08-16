CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Create custom enum types
CREATE TYPE role_type AS ENUM ('Contributor', 'Reviewer', 'Coordinator');
CREATE TYPE version_status AS ENUM ('pending', 'approved', 'rejected', 'revoked');

-- Create roles table
CREATE TABLE roles (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    name role_type NOT NULL UNIQUE
);

-- Create users table
CREATE TABLE users (
    id uuid PRIMARY KEY,
    username_hash text NOT NULL UNIQUE,
    nickname text NOT NULL UNIQUE,
    password_hash text,
    salt text NOT NULL,
    role_id uuid NOT NULL REFERENCES roles(id),
    CONSTRAINT fk_auth_users FOREIGN KEY (id) REFERENCES auth.users(id)
);

-- Create categories table
CREATE TABLE categories (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    name text NOT NULL,
    parent_category_id uuid REFERENCES categories(id),
    default_visibility version_status
);

-- Create articles table
CREATE TABLE articles (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    title text NOT NULL,
    category_id uuid NOT NULL REFERENCES categories(id),
    author_id uuid NOT NULL REFERENCES users(id),
    created_at timestamptz NOT NULL DEFAULT now()
);

-- Create article_versions table
CREATE TABLE article_versions (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    article_id uuid NOT NULL REFERENCES articles(id),
    content text NOT NULL,
    editor_id uuid NOT NULL REFERENCES users(id),
    status version_status NOT NULL,
    preview_token text NOT NULL UNIQUE,
    created_at timestamptz NOT NULL DEFAULT now()
);
