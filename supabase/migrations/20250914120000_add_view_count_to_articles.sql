ALTER TABLE public.articles
ADD COLUMN view_count INT NOT NULL DEFAULT 0;

CREATE OR REPLACE FUNCTION public.increment_article_view_count(p_article_id uuid)
RETURNS void AS $$
BEGIN
    UPDATE public.articles
    SET view_count = view_count + 1
    WHERE id = p_article_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;