CREATE INDEX IF NOT EXISTS idx_articles_author_id ON public.articles (author_id);
CREATE INDEX IF NOT EXISTS idx_articles_category_id ON public.articles (category_id);
CREATE INDEX IF NOT EXISTS idx_article_versions_article_id ON public.article_versions (article_id);
CREATE INDEX IF NOT EXISTS idx_article_versions_editor_id ON public.article_versions (editor_id);
CREATE INDEX IF NOT EXISTS idx_categories_parent_category_id ON public.categories (parent_category_id);
