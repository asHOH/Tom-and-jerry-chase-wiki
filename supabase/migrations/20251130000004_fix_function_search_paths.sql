ALTER FUNCTION public.submit_article(uuid, text, text, uuid) SET search_path = public, extensions, pg_temp;
ALTER FUNCTION public.update_pending_article(uuid, uuid, text, text, uuid) SET search_path = public, extensions, pg_temp;
