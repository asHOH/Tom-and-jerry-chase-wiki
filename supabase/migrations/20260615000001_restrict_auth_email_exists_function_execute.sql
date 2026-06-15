REVOKE ALL ON FUNCTION public.auth_email_exists(text) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.auth_email_exists(text) FROM anon;
REVOKE ALL ON FUNCTION public.auth_email_exists(text) FROM authenticated;
GRANT EXECUTE ON FUNCTION public.auth_email_exists(text) TO service_role;
