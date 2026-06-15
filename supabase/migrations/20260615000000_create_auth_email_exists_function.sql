CREATE OR REPLACE FUNCTION public.auth_email_exists(p_email text)
RETURNS boolean AS $$
  SELECT EXISTS (
    SELECT 1
    FROM auth.users u
    WHERE u.email = lower(p_email)
  );
$$ LANGUAGE sql SECURITY DEFINER SET search_path = auth, public, pg_temp;

REVOKE ALL ON FUNCTION public.auth_email_exists(text) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.auth_email_exists(text) FROM anon;
REVOKE ALL ON FUNCTION public.auth_email_exists(text) FROM authenticated;
GRANT EXECUTE ON FUNCTION public.auth_email_exists(text) TO service_role;
